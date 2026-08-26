-- Migration: Criar tabela technology_tickets para o Kanban de Tecnologia
-- Executado em produção Supabase (ptochsyoyatsydfysacc) em 26/08/2026
-- Referência: useTechTickets.ts, Tecnologia.tsx

CREATE TABLE IF NOT EXISTS public.technology_tickets (
    id TEXT PRIMARY KEY,
    code TEXT,
    title TEXT NOT NULL,
    description TEXT,
    module TEXT DEFAULT 'Geral',
    requester_name TEXT,
    requester_role TEXT,
    requester_department TEXT,
    priority TEXT NOT NULL CHECK (priority IN ('alta', 'media', 'baixa')),
    main_status TEXT NOT NULL CHECK (main_status IN ('a_analisar', 'a_executar', 'executando', 'executado', 'atualizado_producao')),
    subcategory TEXT NOT NULL CHECK (subcategory IN ('nao_especificado', 'em_planejamento', 'em_aplicacao', 'em_validacao', 'atualizado', 'backup_realizado')),
    delivery_forecast DATE,
    assigned_to TEXT,
    impact_level TEXT,
    is_ai_triaged BOOLEAN DEFAULT false,
    business_impact TEXT,
    acceptance_criteria JSONB,
    chat_transcript JSONB,
    attachments JSONB,
    timeline JSONB,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL,
    updated_at TIMESTAMP WITH TIME ZONE
);

ALTER TABLE public.technology_tickets ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Permitir leitura de chamados de tecnologia" ON public.technology_tickets;
CREATE POLICY "Permitir leitura de chamados de tecnologia" ON public.technology_tickets FOR SELECT USING (true);
DROP POLICY IF EXISTS "Permitir inserção e atualização de chamados" ON public.technology_tickets;
CREATE POLICY "Permitir inserção e atualização de chamados" ON public.technology_tickets FOR ALL USING (true);
GRANT ALL ON public.technology_tickets TO anon, authenticated, service_role;

-- Seed ticket: TCK-2026-093
INSERT INTO public.technology_tickets (
    id, code, title, description, module, requester_name, requester_role, requester_department,
    priority, main_status, subcategory, delivery_forecast, assigned_to, impact_level,
    is_ai_triaged, created_at, updated_at
) VALUES (
    'ticket-tck093',
    'TCK-2026-093',
    'Correção de Áudio WhatsApp + Textarea + isAgentSender',
    'Correções aplicadas e validadas na produção:
1. ÁUDIO: pipeline WebM->OGG via FFmpeg, retry 2x, timeout 60s, player com suporte a audio/webm. Solicitado 24/08, entregue 26/08.
2. TEXTAREA: conversão de input para textarea com quebra de linha (Enter envia, Ctrl+Enter/Shift+Enter/Ctrl+Espaço quebra linha). Solicitado 25/08, entregue 25/08.
3. isAgentSender: só o usuário logado aparece como Atendimento em grupos. Solicitado 25/08, entregue 25/08.',
    'WhatsApp / Chat',
    'Rodrigo Sacramento',
    'CTO',
    'Diretoria & Tech',
    'alta',
    'executado',
    'atualizado',
    '2026-08-26',
    'Squad Ahut Tech (ATOM + ADA + AJAX)',
    'Alto',
    true,
    '2026-08-24T00:00:00Z',
    '2026-08-26T12:00:00Z'
);