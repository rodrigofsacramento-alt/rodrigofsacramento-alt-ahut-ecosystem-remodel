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

      // ── FILTRO ANTI-DUPLICATA ──
      // Remove nomes inválidos (símbolos, emojis, números soltos, vazios)
      // e perfis que são claramente contatos de WhatsApp promovidos a agente
      const validProfiles = (profiles || []).filter((p: any) => {
        const name = (p.full_name || '').trim();
        if (!name) return false;                              // vazio
        if (name.length <= 1) return false;                    // só 1 caractere
        if (/^[^a-zA-ZÀ-ÿ]/.test(name)) return false;         // começa com emoji/símbolo
        if (/^\d+$/.test(name)) return false;                  // só números
        if (/@estateia\.com$/.test(p.email || '')) return false; // email auto-gerado
        if (name.toLowerCase() === 'novo usuário') return false;
        if (name.toLowerCase() === 'user') return false;
        return true;
      });

      // ── DEDUPLICAÇÃO ──
      // Para duplicatas (mesmo email), mantém o registro com mais dados
      const seen = new Map<string, any>();
      validProfiles.forEach((p: any) => {
        const key = p.email || p.phone || p.id;
        const existing = seen.get(key);
        if (!existing) {
          seen.set(key, p);
        } else {
          // Mantém quem tem mais dados (nome mais completo)
          const existingLength = (existing.full_name || '').length;
          const newLength = (p.full_name || '').length;
          if (newLength > existingLength) {
            seen.set(key, p);
          }
        }
      });
      const dedupedProfiles = Array.from(seen.values());

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

      return (dedupedProfiles || []).map((p: any) => ({
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
