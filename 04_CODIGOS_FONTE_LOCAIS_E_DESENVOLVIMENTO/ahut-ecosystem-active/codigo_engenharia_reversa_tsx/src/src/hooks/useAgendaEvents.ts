import { useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '../lib/supabase';
import { useAuth } from './useAuth';

// Criação de eventos de agenda com lembrete — conecta ao useReminders (global)
// O lembrete dispara automaticamente (som + notificação browser + painel) porque
// o useReminders varre agenda_events com status='pending' e compara com os triggers.

export interface AgendaEventInput {
  type: 'visita' | 'ligacao' | 'mensagem' | 'reuniao';
  sub_type?: string;
  scheduled_at: string; // ISO
  lead_id?: string | null;
  property_id?: string | null;
  notes?: string | null;
}

export function useCreateAgendaEvent() {
  const { user } = useAuth();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (event: AgendaEventInput) => {
      if (!user?.id) throw new Error('Usuário não autenticado');

      const { data, error } = await supabase
        .from('agenda_events')
        .insert({
          type: event.type,
          sub_type: event.sub_type || null,
          scheduled_at: event.scheduled_at,
          user_id: user.id,
          lead_id: event.lead_id || null,
          property_id: event.property_id || null,
          notes: event.notes || null,
          status: 'pending', // obrigatório p/ o lembrete disparar
        })
        .select('*')
        .single();

      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['visits'] });
      queryClient.invalidateQueries({ queryKey: ['agenda-events'] });
      queryClient.invalidateQueries({ queryKey: ['sidebar-badges'] });
    },
  });
}