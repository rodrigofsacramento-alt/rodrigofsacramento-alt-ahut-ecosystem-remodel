import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '../lib/supabase';

export interface Agent {
  id: string;
  email?: string;
  full_name?: string;
  phone?: string | null;
  creci?: string | null;
  role?: string;
  is_active?: boolean;
  avatar_url?: string | null;
  created_at?: string;
  leads_count?: number;
  visits_count?: number;
  proposals_count?: number;
}

export interface CreateAgentParams {
  email: string;
  password?: string;
  full_name: string;
  phone?: string;
  creci?: string;
}

export function useAgents() {
  return useQuery<Agent[]>({
    queryKey: ['agents'],
    queryFn: async () => {
      const { data: profiles, error } = await supabase
        .from('profiles')
        .select('*')
        .in('role', ['agent', 'admin', 'manager'])
        .eq('is_active', true)
        .order('full_name');

      if (error) throw error;

      const { data: leads } = await supabase.from('leads').select('responsible_id');
      const { data: visits } = await supabase.from('visits').select('agent_id');
      const { data: proposals } = await supabase.from('proposals').select('agent_id');

      const leadsMap: Record<string, number> = {};
      const visitsMap: Record<string, number> = {};
      const proposalsMap: Record<string, number> = {};

      leads?.forEach((l: any) => {
        if (l.responsible_id) leadsMap[l.responsible_id] = (leadsMap[l.responsible_id] || 0) + 1;
      });
      visits?.forEach((v: any) => {
        if (v.agent_id) visitsMap[v.agent_id] = (visitsMap[v.agent_id] || 0) + 1;
      });
      proposals?.forEach((p: any) => {
        if (p.agent_id) proposalsMap[p.agent_id] = (proposalsMap[p.agent_id] || 0) + 1;
      });

      return (profiles || []).map((p: any) => ({
        ...p,
        leads_count: leadsMap[p.id] || 0,
        visits_count: visitsMap[p.id] || 0,
        proposals_count: proposalsMap[p.id] || 0
      })) as Agent[];
    }
  });
}

export function useCreateAgent() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (params: CreateAgentParams) => {
      const { data, error } = await supabase.rpc('create_agent_user', {
        p_email: params.email,
        p_password: params.password,
        p_full_name: params.full_name,
        p_phone: params.phone || null,
        p_creci: params.creci || null
      });
      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['agents'] });
    }
  });
}
