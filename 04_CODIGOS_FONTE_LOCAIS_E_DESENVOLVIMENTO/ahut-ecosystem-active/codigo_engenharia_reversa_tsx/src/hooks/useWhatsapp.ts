import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '../lib/supabase';

// Sessão ativa da produção (espelho de leitura)
export const ACTIVE_SESSION_NAME = 'default';

export interface WhatsAppSession {
  id?: string;
  session_name: string;
  tenant_id?: string;
  phone_number?: string | null;
  status: 'connected' | 'connecting' | 'qr_ready' | 'error' | 'disconnected';
  qr_code?: string | null;
  pairing_code?: string | null;
  qr_expires_at?: string | null;
  last_connected_at?: string | null;
  last_error?: string | null;
  ai_enabled?: boolean;
  created_at?: string;
  updated_at?: string;
}

export interface StartSessionParams {
  phone_number?: string;
}

export interface SendWhatsAppMessageParams {
  conversationId: string;
  content: string;
}

export function useWhatsapp() {
  return useQuery<WhatsAppSession | null>({
    queryKey: ['whatsapp-session', ACTIVE_SESSION_NAME],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('whatsapp_sessions')
        .select('*')
        .eq('session_name', ACTIVE_SESSION_NAME)
        .order('created_at', { ascending: false })
        .limit(1)
        .maybeSingle();

      if (error && error.code !== 'PGRST116') throw error;
      return data ?? null;
    }
  });
}

export function useStartWhatsAppSession() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async ({ phone_number }: StartSessionParams = {}) => {
      const { data, error } = await supabase.rpc('start_whatsapp_session', {
        p_session_name: ACTIVE_SESSION_NAME,
        p_phone_number: phone_number || null
      });
      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['whatsapp-session', ACTIVE_SESSION_NAME] });
    }
  });
}

export function useDisconnectWhatsAppSession() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async () => {
      const { data, error } = await supabase.rpc('disconnect_whatsapp_session', {
        p_session_name: ACTIVE_SESSION_NAME
      });
      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['whatsapp-session', ACTIVE_SESSION_NAME] });
    }
  });
}

export function useSetWhatsAppAiEnabled() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async ({ enabled }: { enabled: boolean }) => {
      const { data, error } = await supabase.rpc('set_whatsapp_ai_enabled', {
        p_session_name: ACTIVE_SESSION_NAME,
        p_enabled: enabled
      });
      if (error) throw error;
      if (data && data.success === false) {
        throw new Error(data.error || 'Erro ao atualizar IA');
      }
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['whatsapp-session', ACTIVE_SESSION_NAME] });
    }
  });
}

export function useSendWhatsAppMessage() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async ({ conversationId, content }: SendWhatsAppMessageParams) => {
      const { data, error } = await supabase.rpc('send_whatsapp_message', {
        p_conversation_id: conversationId,
        p_content: content
      });
      if (error) throw error;
      if (data && data.success === false) {
        throw new Error(data.error || 'Erro ao enviar WhatsApp');
      }
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['whatsapp-messages'] });
      queryClient.invalidateQueries({ queryKey: ['messages'] });
      queryClient.invalidateQueries({ queryKey: ['conversations'] });
    }
  });
}

// ── RPCs de fila/operação de atendimento (engenharia reversa do Atendimento de produção) ──

export function useAcceptConversation() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async ({ conversationId }: { conversationId: string }) => {
      const { data, error } = await supabase.rpc('accept_conversation', {
        p_conversation_id: conversationId
      });
      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['conversations'] });
      queryClient.invalidateQueries({ queryKey: ['sidebar-badges'] });
    }
  });
}

export function useMarkConversationRead() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async ({ conversationId }: { conversationId: string }) => {
      const { data, error } = await supabase.rpc('mark_conversation_read', {
        p_conversation_id: conversationId
      });
      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['conversations'] });
    }
  });
}

export function useTransferConversation() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async ({ conversationId, toAgentId }: { conversationId: string; toAgentId: string }) => {
      const { data, error } = await supabase.rpc('transfer_conversation', {
        p_conversation_id: conversationId,
        p_to_agent_id: toAgentId
      });
      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['conversations'] });
    }
  });
}

export function useIgnoreConversation() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async ({ conversationId }: { conversationId: string }) => {
      const { data, error } = await supabase.rpc('ignore_conversation', {
        p_conversation_id: conversationId
      });
      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['conversations'] });
    }
  });
}

export function useUpdateClientContact() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async ({ profileId, name, phone, email, leadId }: {
      profileId: string; name?: string; phone?: string | null; email?: string | null; leadId?: string | null;
    }) => {
      const { data, error } = await supabase.rpc('update_client_contact', {
        p_profile_id: profileId,
        p_name: name || '',
        p_phone: phone || null,
        p_email: email?.trim() || null,
        p_lead_id: leadId || null
      });
      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['conversations'] });
      queryClient.invalidateQueries({ queryKey: ['leads'] });
    }
  });
}
