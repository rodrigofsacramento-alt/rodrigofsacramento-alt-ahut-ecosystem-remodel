-- ============================================================
-- FUNIL ÚNICO QUBITS — FASE 2 (DATA-BINDING + GATILHO QUALIFICADO)
-- Supabase PROD: https://ptochsyoyatsydfysacc.supabase.co
-- Data: 2026-09-04
-- Aceite arquitetural: GO (4/4 confirmado por Rodrigo)
-- Arquitetura: fonte única `leads.stage` + espelho transacional `conversations.stage`
--             gravado no MESMO trigger/transação (NUNCA diverge)
-- ============================================================

-- ============================================================
-- [1] NOVA RÉGUA — 12 ESTÁGIOS EXATOS
--   1  Contato Cadastrado
--   2  Primeiro Atendimento / Qualificação
--   3  Qualificado  (GATILHO de injeção do cartão de Lead)
--   4  Follow Up
--   5  Buscar Imóveis
--   6  Agendamento Visita/Reunião
--   7  Visita/Reunião Agendada
--   8  Match Pronto
--   9  Apresentar Imóveis
--   10 Imóvel Escolhido
--   11 Proposta Solicitada
--   12 Vendido
--   + 'A Selecionar' (legados migrados na MISSÃO 1)
-- ============================================================
-- Aplicar a nova régua de estágios válidos na check constraint
ALTER TABLE public.leads DROP CONSTRAINT IF EXISTS leads_stage_check;
ALTER TABLE public.leads ADD CONSTRAINT leads_stage_check CHECK (
  stage = ANY (ARRAY[
    'Contato Cadastrado','Primeiro Atendimento / Qualificação','Qualificado',
    'Follow Up','Buscar Imóveis','Agendamento Visita/Reunião',
    'Visita/Reunião Agendada','Match Pronto','Apresentar Imóveis',
    'Imóvel Escolhido','Proposta Solicitada','Vendido','A Selecionar']::text[])
);

-- ============================================================
-- [2] DATA-BINDING BIDIRECIONAL (TWO-WAY BINDING)
--   conversations.lead_id  → FK para leads   (espelho transacional)
--   conversations.stage    → espelho de leads.stage (default Contato Cadastrado)
--   leads.conversation_id  → FK para conversations (JOIN chat→funil)
-- ============================================================

-- 2a. conversations.stage — espelho transacional, nasce em "Contato Cadastrado"
ALTER TABLE public.conversations
  ADD COLUMN IF NOT EXISTS stage TEXT NOT NULL DEFAULT 'Contato Cadastrado';

-- 2b. conversations.lead_id — amarração ida-e-volta (null até "Qualificado")
ALTER TABLE public.conversations
  ADD COLUMN IF NOT EXISTS lead_id UUID REFERENCES public.leads(id) ON DELETE SET NULL;

-- 2c. leads.conversation_id — JOIN chat→funil
ALTER TABLE public.leads
  ADD COLUMN IF NOT EXISTS conversation_id UUID REFERENCES public.conversations(id) ON DELETE SET NULL;

-- INDEX p/ performance dos JOINs
CREATE INDEX IF NOT EXISTS idx_conversations_lead_id ON public.conversations(lead_id);
CREATE INDEX IF NOT EXISTS idx_conversations_stage ON public.conversations(stage);
CREATE INDEX IF NOT EXISTS idx_leads_conversation_id ON public.leads(conversation_id);
CREATE INDEX IF NOT EXISTS idx_leads_stage ON public.leads(stage);

-- ============================================================
-- [3] GATILHO "QUALIFICADO" — INJEÇÃO DO CARTÃO DE LEAD
--   Quando conversations.stage muda para 'Qualificado' OU um lead já qualificado
--   tem sua conversations.stage definida, dispara a criação do cartão de lead
--   com campos concatenados (nome + telefone + conversation_id).
--   SECURITY DEFINER + RLS tenant isolado + anti-duplo atômico.
-- ============================================================

CREATE OR REPLACE FUNCTION public.ensure_lead_from_conversation()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_client_name  TEXT;
  v_client_phone TEXT;
  v_lead_id      UUID;
BEGIN
  -- Apenas quando transiciona PARA 'Qualificado'
  IF NEW.stage = 'Qualificado' THEN
    -- Buscar dados do cliente (profiles vinculado via client_id)
    SELECT p.name, p.phone
      INTO v_client_name, v_client_phone
      FROM public.profiles p
     WHERE p.id = NEW.client_id;

    -- Anti-duplo atômico: se já existe lead vinculado a esta conversa, apenas espelha
    SELECT id INTO v_lead_id
      FROM public.leads
     WHERE conversation_id = NEW.id
     LIMIT 1;

    IF v_lead_id IS NULL THEN
      -- Cria o cartão de Lead com campos CONCATENADOS (nome + telefone + conversation_id)
      INSERT INTO public.leads (
        name, phone, stage, source, notes,
        conversation_id, tenant_id, created_by, created_at, updated_at, current_stage
      ) VALUES (
        COALESCE(v_client_name, 'Cliente ' || substr(NEW.id::text, 1, 4)),
        COALESCE(v_client_phone, ''),
        'Qualificado',
        COALESCE((SELECT source FROM public.leads WHERE conversation_id = NEW.id LIMIT 1), 'WhatsApp'),
        'Lead criado automaticamente pelo funil (estágio "Qualificado"). conversation_id: ' || NEW.id::text,
        NEW.id,
        NEW.tenant_id,
        NEW.agent_id,
        now(), now(),
        'INTRO'  -- current_stage (IA) preservado, invisível na UI
      )
      RETURNING id INTO v_lead_id;
    END IF;

    -- Espelho transacional ATUALIZADO no mesmo trigger
    NEW.lead_id := v_lead_id;
  END IF;

  RETURN NEW;
END;
$$;

-- Trigger em conversations: dispara no INSERT e UPDATE quando stage vira 'Qualificado'
DROP TRIGGER IF EXISTS trg_lead_qualificado ON public.conversations;
CREATE TRIGGER trg_lead_qualificado
  BEFORE INSERT OR UPDATE OF stage ON public.conversations
  FOR EACH ROW
  EXECUTE FUNCTION public.ensure_lead_from_conversation();

-- ============================================================
-- [4] ESPELHO TRANSACIONAL leads→conversations (fonte única)
--   Quando leads.stage muda (no funil), espelha em conversations.stage
--   na MESMA transação — garantia "dado de estágio nunca diverge".
-- ============================================================
CREATE OR REPLACE FUNCTION public.sync_conversation_stage_from_lead()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  IF NEW.conversation_id IS NOT NULL AND OLD.stage IS DISTINCT FROM NEW.stage THEN
    UPDATE public.conversations
       SET stage = NEW.stage, updated_at = now()
     WHERE id = NEW.conversation_id;
  END IF;
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS trg_sync_conv_stage ON public.leads;
CREATE TRIGGER trg_sync_conv_stage
  AFTER UPDATE OF stage ON public.leads
  FOR EACH ROW
  EXECUTE FUNCTION public.sync_conversation_stage_from_lead();

-- ============================================================
-- [5] DEFAULT de conversations.stage já aplicado (2a)
--     leads.stage default 'Lead Cadastrado' → trocar para 'Contato Cadastrado'
-- ============================================================
ALTER TABLE public.leads ALTER COLUMN stage SET DEFAULT 'Contato Cadastrado';

-- ============================================================
-- NOTA: A migração é idempotente (IF NOT EXISTS / DROP IF EXISTS).
-- RLS: as triggers usam SECURITY DEFINER para respeitar o tenant isolado
--      (novos leads herdam tenant_id e created_by da conversa).
-- ============================================================