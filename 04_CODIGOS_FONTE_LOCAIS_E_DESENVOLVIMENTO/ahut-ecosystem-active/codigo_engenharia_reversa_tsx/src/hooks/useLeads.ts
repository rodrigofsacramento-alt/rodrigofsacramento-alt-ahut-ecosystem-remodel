import { useEffect } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '../lib/supabase';
import { useAuth } from './useAuth';

export interface Lead {
  id: string;
  name: string;
  phone?: string | null;
  email?: string | null;
  stage: string;
  source?: string | null;
  budget_min?: number | null;
  budget_max?: number | null;
  score?: number | null;
  tags?: string[] | null;
  notes?: string | null;
  responsible_id?: string | null;
  created_by?: string | null;
  created_at?: string;
  updated_at?: string;
  last_interaction?: string | null;
  responsible?: {
    id: string;
    full_name?: string;
    email?: string;
    role?: string;
  } | null;
}

export interface LeadTimelineEvent {
  id: string;
  lead_id: string;
  type: string;
  title: string;
  description?: string;
  created_at: string;
  user_id?: string;
  user?: {
    id: string;
    full_name?: string;
  };
}

export interface LeadFilterParams {
  stage?: string;
  source?: string;
  agent?: string;
  group?: string;
  search?: string;
}

export function useLeads(filters?: LeadFilterParams) {
  const { user, profile } = useAuth();
  const isAgent = profile?.role === 'agent';
  const queryClient = useQueryClient();

  useEffect(() => {
    if (!user?.id) return;
    const channelName = `leads-realtime-${Math.random().toString(36).substring(7)}`;
    const channel = supabase
      .channel(channelName)
      .on('postgres_changes', { event: '*', schema: 'public', table: 'leads' }, () => {
        queryClient.invalidateQueries({ queryKey: ['leads'] });
        queryClient.invalidateQueries({ queryKey: ['dashboard-stats'] });
        queryClient.invalidateQueries({ queryKey: ['sidebar-badges'] });
      })
      .subscribe();

    return () => {
      channel.unsubscribe();
    };
  }, [user?.id, queryClient]);

  return useQuery<Lead[]>({
    queryKey: ['leads', filters, user?.id, isAgent],
    queryFn: async () => {
      let query = supabase
        .from('leads')
        .select('*, responsible:profiles!leads_responsible_id_fkey(*)')
        .order('last_interaction', { ascending: false, nullsFirst: false })
        .order('updated_at', { ascending: false, nullsFirst: false })
        .order('created_at', { ascending: false });

      if (isAgent && user?.id) {
        query = query.or(`responsible_id.eq.${user.id},responsible_id.is.null`);
      }
      if (filters?.stage && filters.stage !== 'Todos') {
        query = query.eq('stage', filters.stage);
      }
      if (filters?.source) {
        query = query.eq('source', filters.source);
      }
      if (filters?.agent && filters.agent !== 'all') {
        query = query.eq('responsible_id', filters.agent);
      }
      if (filters?.group) {
        query = query.contains('tags', [filters.group]);
      }
      if (filters?.search) {
        query = query.or(`name.ilike.%${filters.search}%,email.ilike.%${filters.search}%,phone.ilike.%${filters.search}%`);
      }

      const { data, error } = await query;
      if (error) throw error;
      return (data as Lead[]) || [];
    }
  });
}

export function useLeadTimeline(leadId?: string | null) {
  return useQuery<LeadTimelineEvent[]>({
    queryKey: ['lead-timeline', leadId],
    queryFn: async () => {
      if (!leadId) return [];
      const { data, error } = await supabase
        .from('lead_timeline')
        .select('*, user:profiles!lead_timeline_user_id_fkey(*)')
        .eq('lead_id', leadId)
        .order('created_at', { ascending: false });

      if (error) throw error;
      return (data as LeadTimelineEvent[]) || [];
    },
    enabled: !!leadId
  });
}

export function useCreateLead() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (newLead: Partial<Lead>) => {
      const { data, error } = await supabase
        .from('leads')
        .insert(newLead)
        .select('*, responsible:profiles!leads_responsible_id_fkey(*)')
        .single();

      if (error) throw error;

      await supabase.from('lead_timeline').insert({
        lead_id: data.id,
        type: 'lead_created',
        title: 'Lead Criado',
        description: `Lead cadastrado via sistema. Origem: ${newLead.source || 'N/A'}.`,
        user_id: newLead.created_by
      });

      return data as Lead;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['leads'] });
      queryClient.invalidateQueries({ queryKey: ['dashboard-stats'] });
    }
  });
}

export function useUpdateLead() {
  const queryClient = useQueryClient();
  const { user, profile } = useAuth();
  return useMutation({
    mutationFn: async ({ id, ...leadData }: Partial<Lead> & { id: string }) => {
      const { data, error } = await supabase
        .from('leads')
        .update(leadData)
        .eq('id', id)
        .select('*, responsible:profiles!leads_responsible_id_fkey(*)')
        .single();

      if (error) throw error;

      const roleLabel = profile?.role === 'agent' ? 'Agente' : 'Admin/Gerente';
      const userName = profile?.full_name || 'Usuário';

      await supabase.from('lead_timeline').insert({
        lead_id: id,
        type: 'edit',
        title: 'Dados Alterados',
        description: `Dados do lead foram atualizados por ${userName} (${roleLabel}).`,
        user_id: user?.id
      });

      return data as Lead;
    },
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ['leads'] });
      queryClient.invalidateQueries({ queryKey: ['lead', data.id] });
      queryClient.invalidateQueries({ queryKey: ['lead-timeline', data.id] });
    }
  });
}
