-- Migration: Notificações + Triggers Automáticos
-- Cria tabela notifications e triggers para eventos do sistema
-- Executar no Supabase produção (ptochsyoyatsydfysacc)

-- 1. Tabela de notificações
CREATE TABLE IF NOT EXISTS public.notifications (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID REFERENCES public.profiles(id) ON DELETE CASCADE,
    tenant_id UUID,
    title TEXT NOT NULL,
    body TEXT NOT NULL,
    type TEXT NOT NULL CHECK (type IN (
        'new_lead', 'sale_completed', 'lead_contacted', 'lead_qualified',
        'proposal_created', 'visit_scheduled', 'contract_signed',
        'reminder', 'late', 'system', 'approval'
    )),
    is_read BOOLEAN DEFAULT false,
    is_global BOOLEAN DEFAULT false,
    metadata JSONB DEFAULT '{}',
    sender_name TEXT,
    sender_id UUID,
    lead_id UUID,
    sale_value DECIMAL(15,2),
    created_at TIMESTAMPTZ DEFAULT now()
);

ALTER TABLE public.notifications ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Usuários veem suas notificações"
    ON public.notifications FOR ALL
    USING (user_id = auth.uid() OR is_global = true);

GRANT ALL ON public.notifications TO anon, authenticated, service_role;

-- 2. Função: notificar novo lead
CREATE OR REPLACE FUNCTION notify_new_lead()
RETURNS TRIGGER AS $$
DECLARE
    agent RECORD;
    admin RECORD;
BEGIN
    -- Notifica o responsável pelo lead (se houver)
    IF NEW.responsible_id IS NOT NULL THEN
        INSERT INTO notifications (user_id, tenant_id, title, body, type, lead_id, is_read, metadata)
        VALUES (
            NEW.responsible_id,
            NEW.tenant_id,
            '🆕 Novo Lead Recebido',
            'Lead "' || NEW.name || '" (' || NEW.phone || ') entrou no sistema. Fonte: ' || COALESCE(NEW.source, 'WhatsApp'),
            'new_lead',
            NEW.id,
            false,
            jsonb_build_object('lead_name', NEW.name, 'phone', NEW.phone, 'source', NEW.source, 'score', NEW.score)
        );
    END IF;

    -- Notifica admins/gerentes
    FOR admin IN SELECT id FROM profiles WHERE tenant_id = NEW.tenant_id AND role IN ('admin', 'manager') AND id != COALESCE(NEW.responsible_id, '00000000-0000-0000-0000-000000000000')
    LOOP
        INSERT INTO notifications (user_id, tenant_id, title, body, type, lead_id, is_read, metadata)
        VALUES (
            admin.id,
            NEW.tenant_id,
            '🆕 Novo Lead: ' || NEW.name,
            'Lead "' || NEW.name || '" — Fone: ' || NEW.phone || ' — Score: ' || COALESCE(NEW.score::text, 'N/A'),
            'new_lead',
            NEW.id,
            false,
            jsonb_build_object('lead_name', NEW.name, 'phone', NEW.phone, 'source', NEW.source)
        );
    END LOOP;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- 3. Função: notificar venda concluída
CREATE OR REPLACE FUNCTION notify_sale_completed()
RETURNS TRIGGER AS $$
DECLARE
    lead_name TEXT;
    prop_code TEXT;
    agent_id UUID;
    tenant_id_val UUID;
    admin RECORD;
BEGIN
    IF NEW.status = 'active' AND (OLD.status IS NULL OR OLD.status != 'active') THEN
        -- Busca nome do lead e código do imóvel
        SELECT p.full_name, pr.code, p.tenant_id, p.id
        INTO lead_name, prop_code, tenant_id_val, agent_id
        FROM profiles p
        LEFT JOIN properties pr ON pr.id = NEW.property_id
        WHERE p.id = NEW.lead_id;

        IF lead_name IS NULL THEN lead_name := NEW.client_name; END IF;
        IF tenant_id_val IS NULL THEN tenant_id_val := NEW.tenant_id; END if;

        -- Notifica o agente responsável
        IF NEW.agent_id IS NOT NULL THEN
            INSERT INTO notifications (user_id, tenant_id, title, body, type, metadata, sale_value, is_read)
            VALUES (
                NEW.agent_id,
                tenant_id_val,
                '💰 VENDA CONCLUÍDA! 🎉',
                'Parabéns! Venda para "' || lead_name || '" — Imóvel: ' || COALESCE(prop_code, 'N/A') || ' — Valor: R$ ' || TO_CHAR(NEW.value, 'FM999G999G999D00'),
                'sale_completed',
                jsonb_build_object('buyer', lead_name, 'property_code', prop_code, 'value', NEW.value, 'contract_number', NEW.contract_number),
                NEW.value,
                false
            );
        END IF;

        -- Notifica TODOS os admins/gerentes (com som de caixa registradora)
        FOR admin IN SELECT * FROM profiles WHERE tenant_id = tenant_id_val AND role IN ('admin', 'manager')
        LOOP
            INSERT INTO notifications (user_id, tenant_id, title, body, type, metadata, sale_value, is_read)
            VALUES (
                admin.id,
                tenant_id_val,
                '🔔 VENDA REALIZADA! 💰',
                'Venda fechada! "' || lead_name || '" — Imóvel: ' || COALESCE(prop_code, 'N/A') || ' — R$ ' || TO_CHAR(NEW.value, 'FM999G999G999D00') || ' — Contrato: ' || NEW.contract_number,
                'sale_completed',
                jsonb_build_object('buyer', lead_name, 'property_code', prop_code, 'value', NEW.value, 'contract_number', NEW.contract_number),
                NEW.value,
                false
            );
        END LOOP;
    END IF;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- 4. Função: notificar lead contatado
CREATE OR REPLACE FUNCTION notify_lead_contacted()
RETURNS TRIGGER AS $$
DECLARE
    lead_name TEXT;
    admin RECORD;
BEGIN
    -- Notifica quando um lead recebe primeira mensagem
    IF TG_OP = 'INSERT' THEN
        SELECT p.full_name, p.tenant_id INTO lead_name FROM profiles p WHERE p.id = NEW.client_id;
        IF lead_name IS NOT NULL AND NEW.agent_id IS NOT NULL THEN
            INSERT INTO notifications (user_id, tenant_id, title, body, type, metadata, is_read)
            VALUES (
                NEW.agent_id,
                (SELECT tenant_id FROM profiles WHERE id = NEW.client_id),
                '📞 Lead Contatado',
                'Lead "' || lead_name || '" foi contatado. Iniciar acompanhamento.',
                'lead_contacted',
                jsonb_build_object('lead_name', lead_name, 'conversation_id', NEW.id),
                false
            );
        END IF;
    END IF;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- 5. Criar os triggers
DROP TRIGGER IF EXISTS trg_notify_new_lead ON leads;
CREATE TRIGGER trg_notify_new_lead
    AFTER INSERT ON leads
    FOR EACH ROW EXECUTE FUNCTION notify_new_lead();

DROP TRIGGER IF EXISTS trg_notify_sale_completed ON contracts;
CREATE TRIGGER trg_notify_sale_completed
    AFTER UPDATE ON contracts
    FOR EACH ROW EXECUTE FUNCTION notify_sale_completed();

DROP TRIGGER IF EXISTS trg_notify_lead_contacted ON conversations;
CREATE TRIGGER trg_notify_lead_contacted
    AFTER INSERT ON conversations
    FOR EACH ROW EXECUTE FUNCTION notify_lead_contacted();