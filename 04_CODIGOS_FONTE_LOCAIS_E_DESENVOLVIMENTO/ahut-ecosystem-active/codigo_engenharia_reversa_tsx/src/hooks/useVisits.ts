import { useEffect } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '../lib/supabase';
import { useAuth } from './useAuth';

export interface Visit {
  id: string;
  lead_id?: string | null;
  property_id?: string | null;
  agent_id: string;
  scheduled_at: string;
  status: 'scheduled' | 'confirmed' | 'completed' | 'cancelled' | 'no_show';
  notes?: string | null;
  feedback?: string | null;
  rating?: number | null;
  created_by?: string | null;
  created_at?: string;
  updated_at?: string;
  lead?: {
    id: string;
    name: string;
    email?: string | null;
    phone?: string | null;
    stage?: string;
    score?: number | null;
    sla_status?: string | null;
    source?: string | null;
    responsible_id?: string | null;
  } | null;
  property?: {
    id: string;
    title: string;
    code?: string | null;
    location?: string | null;
    address?: string | null;
    price?: number | null;
    type?: string;
    status?: string;
    description?: string | null;
    bedrooms?: number | null;
    bathrooms?: number | null;
    area?: number | null;
    images?: string[] | null;
  } | null;
  agent?: {
    id: string;
    full_name?: string;
    role?: string;
  } | null;
}

export interface VisitFilterParams {
  agent_id?: string;
  status?: string;
  month?: number;
  year?: number;
}

async function syncGoogleCalendar(visitId: string, action: 'upsert' | 'delete' = 'upsert') {
  try {
    const { error } = await supabase.functions.invoke('google-calendar-sync', {
      body: { visit_id: visitId, action }
    });
    if (error) console.warn('Google Calendar sync skipped:', error.message);
  } catch (err: any) {
    console.warn('Google Calendar sync skipped:', err?.message || err);
  }
}

export function useVisits(filters?: VisitFilterParams) {
  const { user, profile } = useAuth();
  const isAgent = profile?.role === 'agent';
  const queryClient = useQueryClient();

  useEffect(() => {
    if (!user?.id) return;
    const channelName = `visits-realtime-${Math.random().toString(36).substring(7)}`;
    const channel = supabase
      .channel(channelName)
      .on('postgres_changes', { event: '*', schema: 'public', table: 'visits' }, () => {
        queryClient.invalidateQueries({ queryKey: ['visits'] });
        queryClient.invalidateQueries({ queryKey: ['sidebar-badges'] });
      })
      .subscribe();

    return () => {
      channel.unsubscribe();
    };
  }, [user?.id, queryClient]);

  return useQuery<Visit[]>({
    queryKey: ['visits', filters, user?.id, isAgent],
    queryFn: async () => {
      let query = supabase
        .from('visits')
        .select(`
          *,
          lead:leads!visits_lead_id_fkey(id, name, email, phone, stage, score, sla_status, source, responsible_id),
          property:properties!visits_property_id_fkey(id, title, code, location, address, price, type, status, description, bedrooms, bathrooms, area, images),
          agent:profiles!visits_agent_id_fkey(id, full_name, role)
        `)
        .order('scheduled_at', { ascending: true });

      if (isAgent && user?.id) {
        query = query.eq('agent_id', user.id);
      } else if (filters?.agent_id) {
        query = query.eq('agent_id', filters.agent_id);
      }

      if (filters?.month !== undefined && filters?.year !== undefined) {
        const start = new Date(filters.year, filters.month, 1);
        const end = new Date(filters.year, filters.month + 1, 0, 23, 59, 59);
        query = query.gte('scheduled_at', start.toISOString()).lte('scheduled_at', end.toISOString());
      }

      if (filters?.status) {
        query = query.eq('status', filters.status);
      }

      const { data, error } = await query;
      if (error) throw error;
      return (data as Visit[]) || [];
    }
  });
}

export function useCreateVisit() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (newVisit: Partial<Visit>) => {
      const { data, error } = await supabase.from('visits').insert(newVisit).select().single();
      if (error) throw error;
      return data as Visit;
    },
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ['visits'] });
      queryClient.invalidateQueries({ queryKey: ['sidebar-badges'] });
      if (data?.id) {
        syncGoogleCalendar(data.id).finally(() => {
          queryClient.invalidateQueries({ queryKey: ['visits'] });
        });
      }
    }
  });
}

export function useConfirmVisit() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (visitId: string) => {
      const { data, error } = await supabase
        .from('visits')
        .update({ status: 'confirmed' })
        .eq('id', visitId)
        .select()
        .single();
      if (error) throw error;
      return data as Visit;
    },
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ['visits'] });
      queryClient.invalidateQueries({ queryKey: ['sidebar-badges'] });
      if (data?.id) {
        syncGoogleCalendar(data.id).finally(() => {
          queryClient.invalidateQueries({ queryKey: ['visits'] });
        });
      }
    }
  });
}

export function useCompleteVisit() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async ({ id, feedback, rating, notes }: { id: string; feedback?: string; rating?: number; notes?: string }) => {
      const { data, error } = await supabase
        .from('visits')
        .update({ status: 'completed', feedback, rating, notes })
        .eq('id', id)
        .select()
        .single();
      if (error) throw error;
      return data as Visit;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['visits'] });
      queryClient.invalidateQueries({ queryKey: ['sidebar-badges'] });
    }
  });
}

export function useSyncGoogleCalendar() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async ({ visitId, action = 'upsert' }: { visitId: string; action?: 'upsert' | 'delete' }) => {
      const { data, error } = await supabase.functions.invoke('google-calendar-sync', {
        body: { visit_id: visitId, action }
      });
      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['visits'] });
      queryClient.invalidateQueries({ queryKey: ['sidebar-badges'] });
    }
  });
}
