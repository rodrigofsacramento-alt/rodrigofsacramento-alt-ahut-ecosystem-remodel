-- ============================================================
-- RPCs + Tables para WhatsApp Connection + Atendimento
-- Supabase DEV: https://xmsulduzvufdzkfktovk.supabase.co
-- ============================================================

-- 0. GARANTIR TABELAS BASE
CREATE TABLE IF NOT EXISTS public.whatsapp_sessions (
  id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
  session_name text NOT NULL DEFAULT 'default',
  phone_number text,
  status text NOT NULL DEFAULT 'disconnected',
  qr_code text,
  pairing_code text,
  qr_expires_at timestamptz,
  auth_info jsonb DEFAULT '{}'::jsonb,
  ai_enabled boolean DEFAULT true,
  last_connected_at timestamptz,
  last_error text,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now(),
  UNIQUE(session_name)
);

ALTER TABLE public.whatsapp_sessions ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "WhatsApp sessions public access" ON public.whatsapp_sessions;
CREATE POLICY "WhatsApp sessions public access" ON public.whatsapp_sessions
  FOR ALL USING (auth.role() = 'authenticated');

-- 1. start_whatsapp_session
CREATE OR REPLACE FUNCTION public.start_whatsapp_session(
  p_session_name text DEFAULT 'default',
  p_phone_number text DEFAULT NULL
)
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  v_session_id uuid;
  v_result jsonb;
BEGIN
  -- Upsert session
  INSERT INTO public.whatsapp_sessions (session_name, status, phone_number)
  VALUES (p_session_name, 'connecting', p_phone_number)
  ON CONFLICT (session_name)
  DO UPDATE SET
    status = 'connecting',
    qr_code = NULL,
    pairing_code = NULL,
    last_error = NULL,
    updated_at = now()
  RETURNING id INTO v_session_id;

  v_result := jsonb_build_object(
    'success', true,
    'session_id', v_session_id,
    'message', 'Session started. QR code will be generated shortly.'
  );

  RETURN v_result;
END;
$$;

-- 2. disconnect_whatsapp_session
CREATE OR REPLACE FUNCTION public.disconnect_whatsapp_session(
  p_session_name text DEFAULT 'default'
)
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  v_result jsonb;
BEGIN
  UPDATE public.whatsapp_sessions
  SET status = 'disconnected',
      qr_code = NULL,
      pairing_code = NULL,
      last_error = NULL,
      updated_at = now()
  WHERE session_name = p_session_name;

  v_result := jsonb_build_object(
    'success', true,
    'message', 'Session disconnected.'
  );

  RETURN v_result;
END;
$$;

-- 3. set_whatsapp_ai_enabled
CREATE OR REPLACE FUNCTION public.set_whatsapp_ai_enabled(
  p_session_name text DEFAULT 'default',
  p_enabled boolean DEFAULT true
)
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  v_result jsonb;
BEGIN
  UPDATE public.whatsapp_sessions
  SET ai_enabled = p_enabled,
      updated_at = now()
  WHERE session_name = p_session_name;

  IF NOT FOUND THEN
    v_result := jsonb_build_object(
      'success', false,
      'error', 'Session not found'
    );
  ELSE
    v_result := jsonb_build_object(
      'success', true,
      'ai_enabled', p_enabled
    );
  END IF;

  RETURN v_result;
END;
$$;

-- 4. send_whatsapp_message
CREATE OR REPLACE FUNCTION public.send_whatsapp_message(
  p_conversation_id uuid,
  p_content text
)
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  v_message_id uuid;
  v_result jsonb;
BEGIN
  INSERT INTO public.messages (conversation_id, sender_id, content, message_type)
  VALUES (p_conversation_id, auth.uid(), p_content, 'text')
  RETURNING id INTO v_message_id;

  -- Update conversation last_message_at
  UPDATE public.conversations
  SET last_message_at = now()
  WHERE id = p_conversation_id;

  v_result := jsonb_build_object(
    'success', true,
    'id', v_message_id
  );

  RETURN v_result;
END;
$$;

-- 5. accept_conversation
CREATE OR REPLACE FUNCTION public.accept_conversation(
  p_conversation_id uuid
)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  UPDATE public.conversations
  SET agent_id = auth.uid(),
      status = 'active',
      updated_at = now()
  WHERE id = p_conversation_id;
END;
$$;

-- 6. mark_conversation_read
CREATE OR REPLACE FUNCTION public.mark_conversation_read(
  p_conversation_id uuid
)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  UPDATE public.conversations
  SET unread_count = 0,
      updated_at = now()
  WHERE id = p_conversation_id;
END;
$$;

-- 7. transfer_conversation
CREATE OR REPLACE FUNCTION public.transfer_conversation(
  p_conversation_id uuid,
  p_to_agent_id uuid
)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  UPDATE public.conversations
  SET agent_id = p_to_agent_id,
      updated_at = now()
  WHERE id = p_conversation_id;

  -- Insert system message about transfer
  INSERT INTO public.messages (conversation_id, content, message_type)
  VALUES (
    p_conversation_id,
    '[system] Conversa transferida para novo corretor',
    'system'
  );
END;
$$;

-- 8. ignore_conversation
CREATE OR REPLACE FUNCTION public.ignore_conversation(
  p_conversation_id uuid
)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  UPDATE public.conversations
  SET agent_id = NULL,
      status = 'pending',
      updated_at = now()
  WHERE id = p_conversation_id;

  -- Insert system message
  INSERT INTO public.messages (conversation_id, content, message_type)
  VALUES (
    p_conversation_id,
    '[system] Conversa devolvida para fila de atendimento',
    'system'
  );
END;
$$;

-- 9. update_client_contact
CREATE OR REPLACE FUNCTION public.update_client_contact(
  p_profile_id uuid,
  p_name text DEFAULT '',
  p_phone text DEFAULT NULL,
  p_email text DEFAULT NULL,
  p_lead_id uuid DEFAULT NULL
)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  UPDATE public.profiles
  SET full_name = COALESCE(NULLIF(p_name, ''), full_name),
      phone = COALESCE(p_phone, phone),
      email = COALESCE(p_email, email),
      updated_at = now()
  WHERE id = p_profile_id;

  -- Also update the lead if provided
  IF p_lead_id IS NOT NULL THEN
    UPDATE public.leads
    SET name = COALESCE(NULLIF(p_name, ''), name),
        phone = COALESCE(p_phone, phone),
        email = COALESCE(p_email, email),
        updated_at = now()
    WHERE id = p_lead_id;
  END IF;
END;
$$;

-- 10. create_client_profile
CREATE OR REPLACE FUNCTION public.create_client_profile(
  p_name text,
  p_phone text,
  p_email text DEFAULT NULL
)
RETURNS uuid
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  v_profile_id uuid;
BEGIN
  INSERT INTO public.profiles (full_name, phone, email, role)
  VALUES (p_name, p_phone, NULLIF(p_email, ''), 'client')
  RETURNING id INTO v_profile_id;

  RETURN v_profile_id;
END;
$$;

-- Enable realtime for whatsapp_sessions
BEGIN;
  DROP PUBLICATION IF EXISTS supabase_realtime;
  CREATE PUBLICATION supabase_realtime;
  ALTER PUBLICATION supabase_realtime ADD TABLE public.whatsapp_sessions;
  ALTER PUBLICATION supabase_realtime ADD TABLE public.messages;
COMMIT;