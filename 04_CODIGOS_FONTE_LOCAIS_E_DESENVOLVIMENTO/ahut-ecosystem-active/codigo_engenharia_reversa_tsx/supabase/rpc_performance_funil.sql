-- ============================================================================
-- QUBITS — Funil de Performance + Ranking de Corretores + SLA de Atendimento
-- Supabase DEV: https://xmsulduzvufdzkfktovk.supabase.co
-- ESCOPO: este script NÃO deve ser rodado em PROD (Estate.ia claro).
-- Aplique no DEV (dev-qStats) e valide ANTES de qualquer deploy.
--
-- ADAPTADO AO SCHEMA REAL DEV (03/09):
--   * conversations NÃO tem lead_id -> engajados usa leads.responsible_id + visits/proposals
--   * 'contracts' não existe no DEV     -> etapa contrato/venda = PROPOSTAS (proxy)
--   * joins sempre por agent_id/responsible_id reais
--
-- ETAPAS DO FUNIL:
--   1 leads_encaminhados     -> public.leads (responsible_id preenchido) no período
--   2 atendimentos_iniciados -> public.conversations no período
--   3 atendimentos_eficientes-> conversas respondidas dentro do SLA (1ª resposta do corretor)
--   4 leads_interessados     -> leads engajados (visita/proposta) no período
--   5 followups              -> conversas com retorno do corretor (>=2 msgs do time)
--   6 agendamento            -> public.visits no período
--   7 proposta               -> public.proposals no período
--   8 contrato_venda         -> PROPOSTAS (proxy; sem tabela contracts no DEV)
-- ============================================================================

-- ---------------------------------------------------------------------------
-- 1) FUNNEL — retorna as 8 etapas agregadas para o período + escopo (agente)
-- ---------------------------------------------------------------------------
CREATE OR REPLACE FUNCTION public.get_performance_funnel(
  p_start timestamptz,
  p_end   timestamptz,
  p_agent_id uuid DEFAULT NULL
)
RETURNS TABLE(funnel_key text, funnel_label text, ordinal integer, "count" bigint)
LANGUAGE sql
SECURITY DEFINER
STABLE
AS $$
  WITH agent_filter AS (
    SELECT p_agent_id AS agent_id
  )
  , leads_r AS (
    SELECT l.id FROM public.leads l
    WHERE l.created_at >= p_start AND l.created_at < p_end
      AND (p_agent_id IS NULL OR l.responsible_id = p_agent_id)
  )
  , convs AS (
    SELECT c.id, c.agent_id, c.created_at FROM public.conversations c
    WHERE c.created_at >= p_start AND c.created_at < p_end
      AND (p_agent_id IS NULL OR c.agent_id = p_agent_id)
  )
  , triggered AS (
    -- Para cada mensagem "do lead" (sender não-corretor), primeira resposta do
    -- corretor na MESMA conversa -> mede SLA de atendimento.
    SELECT
      m.conversation_id,
      m.created_at AS trigger_at,
      p.role AS sender_role,
      MIN(CASE WHEN p2.role IN ('agent','admin','manager') THEN m2.created_at END)
        OVER (PARTITION BY m.conversation_id ORDER BY m.created_at
              ROWS BETWEEN CURRENT ROW AND UNBOUNDED FOLLOWING) AS first_reply_at
    FROM public.messages m
    JOIN public.conversations c ON c.id = m.conversation_id
    LEFT JOIN public.profiles  p  ON p.id  = m.sender_id
    LEFT JOIN public.messages   m2 ON m2.conversation_id = m.conversation_id
                                   AND m2.created_at >= m.created_at
    LEFT JOIN public.profiles   p2 ON p2.id = m2.sender_id
    WHERE m.created_at >= p_start AND m.created_at < p_end
      AND (p_agent_id IS NULL OR c.agent_id = p_agent_id)
      AND (p.role IS NULL OR p.role NOT IN ('agent','admin','manager'))
  )
  , sla_ok AS (
    SELECT DISTINCT conversation_id FROM triggered
    WHERE first_reply_at IS NOT NULL
      -- Respondido em até 10 minutos (padrão SLA primeiro atendimento)
      AND (first_reply_at - trigger_at) <= interval '10 minutes'
  )
  , engajados AS (
    SELECT lead_id FROM (
      SELECT v.lead_id FROM public.visits v
        WHERE v.created_at >= p_start AND v.created_at < p_end
          AND (p_agent_id IS NULL OR v.agent_id = p_agent_id)
      UNION
      SELECT pr.lead_id FROM public.proposals pr
        WHERE pr.created_at >= p_start AND pr.created_at < p_end
          AND (p_agent_id IS NULL OR pr.agent_id = p_agent_id)
    ) u WHERE lead_id IS NOT NULL
  )
  , follower_leads AS (
    SELECT conversation_id FROM (
      SELECT m.conversation_id, COUNT(*) AS n
      FROM public.messages m
      JOIN public.conversations c ON c.id = m.conversation_id
      JOIN public.profiles p ON p.id = m.sender_id
      WHERE m.created_at >= p_start AND m.created_at < p_end
        AND p.role IN ('agent','admin','manager')
        AND (p_agent_id IS NULL OR c.agent_id = p_agent_id)
      GROUP BY m.conversation_id
      HAVING COUNT(*) >= 2
    ) x
  )
  SELECT * FROM (VALUES
    ('leads_encaminhados',     'Leads Encaminhados',        1, (SELECT COUNT(*) FROM leads_r)),
    ('atendimentos',           'Atendimentos Iniciados',   2, (SELECT COUNT(*) FROM convs)),
    ('atendimentos_eficientes','Atendimentos Eficientes',  3, (SELECT COUNT(*) FROM sla_ok)),
    ('leads_interessados',     'Leads Interessados',       4, (SELECT COUNT(*) FROM engajados)),
    ('followups',              'Follow Up',                5, (SELECT COUNT(*) FROM follower_leads)),
    ('agendamento',            'Agendamento',              6, (SELECT COUNT(*) FROM public.visits v WHERE v.created_at >= p_start AND v.created_at < p_end AND (p_agent_id IS NULL OR v.agent_id = p_agent_id))),
    ('proposta',               'Proposta',                 7, (SELECT COUNT(*) FROM public.proposals pr WHERE pr.created_at >= p_start AND pr.created_at < p_end AND (p_agent_id IS NULL OR pr.agent_id = p_agent_id))),
    ('contrato_venda',         'Contrato / Venda',         8, (SELECT COUNT(*) FROM public.proposals pr WHERE pr.created_at >= p_start AND pr.created_at < p_end AND (p_agent_id IS NULL OR pr.agent_id = p_agent_id)))
  ) AS t(funnel_stage, funnel_label, ordinal, "count");
$$;

-- ---------------------------------------------------------------------------
-- 2. SLA DIÁRIO — tempo médio (s) de resposta do corretor ao lead, dia a dia
-- ---------------------------------------------------------------------------
CREATE OR REPLACE FUNCTION public.get_performance_sla_daily(
  p_start timestamptz,
  p_end   timestamptz,
  p_agent_id uuid DEFAULT NULL
)
RETURNS TABLE(dia date, avg_response_seconds double precision, answered bigint, pending bigint)
LANGUAGE sql
SECURITY DEFINER
STABLE
AS $$
  WITH convs AS (
    SELECT id FROM public.conversations c
    WHERE (p_agent_id IS NULL OR c.agent_id = p_agent_id)
      AND c.created_at < p_end
  ),
  tri AS (
    SELECT
      m.conversation_id,
      m.created_at,
      MIN(CASE WHEN p2.role IN ('agent','admin','manager') THEN m2.created_at END)
        OVER (PARTITION BY m.conversation_id ORDER BY m.created_at ROWS BETWEEN CURRENT ROW AND UNBOUNDED FOLLOWING) AS first_reply_at
    FROM public.messages m
    JOIN public.conversations c ON c.id = m.conversation_id
    LEFT JOIN public.profiles p  ON p.id  = m.sender_id
    LEFT JOIN public.messages m2  ON m2.conversation_id = m.conversation_id AND m2.created_at >= m.created_at
    LEFT JOIN public.profiles p2  ON p2.id = m2.sender_id
    WHERE m.created_at >= p_start AND m.created_at < p_end
      AND (p_agent_id IS NULL OR c.agent_id = p_agent_id)
      AND (p.role IS NULL OR p.role NOT IN ('agent','admin','manager'))
  )
  SELECT
    (tri.created_at AT TIME ZONE 'America/Sao_Paulo')::date AS dia,
    ROUND(AVG(EXTRACT(EPOCH FROM (tri.first_reply_at - tri.created_at)))::numeric, 2) AS avg_response_seconds,
    COUNT(first_reply_at) AS answered,
    COUNT(*) - COUNT(first_reply_at) AS pending
  FROM tri
  GROUP BY dia
  ORDER BY dia;
$$;

-- ---------------------------------------------------------------------------
-- 3. RANKING DE CORRETORES — performance individual no período
-- ---------------------------------------------------------------------------
CREATE OR REPLACE FUNCTION public.get_performance_ranking(
  p_start timestamptz,
  p_end   timestamptz
)
RETURNS TABLE(
  agent_id uuid,
  full_name text,
  leads bigint,
  atendimentos bigint,
  sla_ok bigint,
  interessados bigint,
  followups bigint,
  agendamentos bigint,
  propostas bigint,
  contratos bigint,
  taxa_conversao numeric
)
LANGUAGE sql
SECURITY DEFINER
STABLE
AS $$
  WITH brokers AS (
    SELECT id, full_name FROM public.profiles
    WHERE role IN ('agent','admin','manager') AND is_active = true
  ),
  convs AS (
    SELECT id, agent_id, created_at FROM public.conversations
    WHERE created_at >= p_start AND created_at < p_end AND agent_id IS NOT NULL
  ),
  sla AS (
    SELECT DISTINCT m.conversation_id
    FROM public.messages m
    JOIN public.conversations c ON c.id = m.conversation_id
    LEFT JOIN public.profiles p  ON p.id  = m.sender_id
    LEFT JOIN LATERAL (
      SELECT m2.created_at AS first_reply_at
      FROM public.messages m2
      LEFT JOIN public.profiles p2 ON p2.id = m2.sender_id
      WHERE m2.conversation_id = m.conversation_id AND m2.created_at >= m.created_at
        AND p2.role IN ('agent','admin','manager')
      ORDER BY m2.created_at LIMIT 1
    ) pp ON TRUE
    WHERE m.created_at >= p_start AND m.created_at < p_end
      AND (p.role IS NULL OR p.role NOT IN ('agent','admin','manager'))
      AND pp.first_reply_at IS NOT NULL
      AND (pp.first_reply_at - m.created_at) <= interval '10 minutes'
  ),
  fo AS (
    SELECT c.agent_id, COUNT(*) AS n
    FROM public.messages m
    JOIN public.conversations c ON c.id = m.conversation_id
    JOIN public.profiles p ON p.id = m.sender_id
    WHERE m.created_at >= p_start AND m.created_at < p_end
      AND p.role IN ('agent','admin','manager')
    GROUP BY c.agent_id HAVING COUNT(*) >= 2
  )
  SELECT
    b.id,
    b.full_name,
    (SELECT COUNT(*) FROM public.leads l WHERE l.responsible_id = b.id AND l.created_at >= p_start AND l.created_at < p_end) AS leads,
    (SELECT COUNT(*) FROM convs c WHERE c.agent_id = b.id) AS atendimentos,
    (SELECT COUNT(DISTINCT s.conversation_id) FROM sla s JOIN public.conversations c ON c.id = s.conversation_id WHERE c.agent_id = b.id) AS sla_ok,
    (SELECT COUNT(DISTINCT x.lead_id) FROM (
       SELECT v.lead_id FROM public.visits v WHERE v.agent_id = b.id AND v.created_at >= p_start AND v.created_at < p_end
       UNION SELECT pr.lead_id FROM public.proposals pr WHERE pr.agent_id = b.id AND pr.created_at >= p_start AND pr.created_at < p_end
    ) x WHERE x.lead_id IS NOT NULL) AS interessados,
    (SELECT COALESCE(SUM(n),0) FROM fo fo2 WHERE fo2.agent_id = b.id) AS followups,
    (SELECT COUNT(*) FROM public.visits v WHERE v.agent_id = b.id AND v.created_at >= p_start AND v.created_at < p_end) AS agendamentos,
    (SELECT COUNT(*) FROM public.proposals pr WHERE pr.agent_id = b.id AND pr.created_at >= p_start AND pr.created_at < p_end) AS propostas,
    (SELECT COUNT(*) FROM public.proposals pr WHERE pr.agent_id = b.id AND pr.created_at >= p_start AND pr.created_at < p_end) AS contratos,
    CASE WHEN (SELECT COUNT(*) FROM public.leads l WHERE l.responsible_id = b.id AND l.created_at >= p_start AND l.created_at < p_end) = 0
         THEN 0
         ELSE ROUND(100.0 * (SELECT COUNT(*) FROM public.proposals pr WHERE pr.agent_id = b.id AND pr.created_at >= p_start AND pr.created_at < p_end)
                          / (SELECT COUNT(*) FROM public.leads l WHERE l.responsible_id = b.id AND l.created_at >= p_start AND l.created_at < p_end), 2)
    END AS taxa_conversao
  FROM brokers b
  ORDER BY contratos DESC, atendimentos DESC;
$$;