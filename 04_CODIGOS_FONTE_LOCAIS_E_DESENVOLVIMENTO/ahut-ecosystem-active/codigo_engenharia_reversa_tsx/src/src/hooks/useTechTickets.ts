import { useEffect } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '../lib/supabase';

// Tipos replicados do modelo da tela Tecnologia (para persistir no Supabase via tecnologia_tickets)
export interface TechTicketRow {
  id: string;
  code: string;
  title: string;
  description: string;
  module: string;
  requesterName: string;
  requesterRole: string;
  requesterDepartment: string;
  priority: string;
  main_status: string;
  subcategory: string;
  delivery_forecast: string;
  assigned_to: string;
  impact_level: string;
  is_ai_triaged: boolean;
  business_impact?: string;
  acceptance_criteria?: string[];
  chat_transcript?: unknown;
  attachments?: unknown;
  timeline?: unknown;
  created_at: string;
  updated_at?: string;
}

// Converte linhas do banco (snake_case) para o modelo TSX
export function rowToTicket(row: any): TechTicketRow {
  return {
    id: row.id,
    code: row.code || `TCK-${new Date(row.created_at || Date.now()).getFullYear()}-${String((row.code_seq || 0)).padStart(3, '0')}`,
    title: row.title,
    description: row.description || '',
    module: row.module || 'Geral',
    requesterName: row.requester_name || row.requesterName || 'Equipe Interna',
    requesterRole: row.requester_role || '',
    requesterDepartment: row.requester_department || 'Operações',
    priority: row.priority || 'media',
    main_status: row.main_status || 'a_analisar',
    subcategory: row.subcategory || 'nao_especificado',
    delivery_forecast: row.delivery_forecast || '',
    assigned_to: row.assigned_to || 'Squad Ahut Tech (CTO)',
    impact_level: row.impact_level || 'Médio',
    is_ai_triaged: !!row.is_ai_triaged,
    business_impact: row.business_impact || undefined,
    acceptance_criteria: row.acceptance_criteria || [],
    chat_transcript: row.chat_transcript || undefined,
    attachments: row.attachments || undefined,
    timeline: row.timeline || undefined,
    created_at: row.created_at,
    updated_at: row.updated_at,
  };
}

export function ticketToRow(t: TechTicketRow): any {
  return {
    id: t.id,
    code: t.code,
    title: t.title,
    description: t.description,
    module: t.module,
    requester_name: t.requesterName,
    requester_role: t.requesterRole,
    requester_department: t.requesterDepartment,
    priority: t.priority,
    main_status: t.main_status,
    subcategory: t.subcategory,
    delivery_forecast: t.delivery_forecast,
    assigned_to: t.assigned_to,
    impact_level: t.impact_level,
    is_ai_triaged: t.is_ai_triaged,
    business_impact: t.business_impact,
    acceptance_criteria: t.acceptance_criteria,
    chat_transcript: t.chat_transcript,
    attachments: t.attachments,
    timeline: t.timeline,
    updated_at: new Date().toISOString(),
  };
}

// Hook principal: busca chamados do Supabase (real)
export function useTechTickets() {
  const queryClient = useQueryClient();

  useEffect(() => {
    const channel = supabase
      .channel('tech-tickets-realtime')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'technology_tickets' }, () => {
        queryClient.invalidateQueries({ queryKey: ['tech-tickets'] });
      })
      .subscribe();
    return () => { channel.unsubscribe(); };
  }, [queryClient]);

  return useQuery<TechTicketRow[]>({
    queryKey: ['tech-tickets'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('technology_tickets')
        .select('*')
        .order('created_at', { ascending: false });

      if (error) {
        // Se a tabela não existe ainda (dev), não quebra — retorna vazio
        console.warn('[useTechTickets] Erro ao buscar chamados:', error.message);
        return [];
      }
      return (data || []).map(rowToTicket);
    },
  });
}

// Cria/atualiza um chamado (upsert)
export function useUpsertTechTicket() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (ticket: TechTicketRow) => {
      const { data, error } = await supabase
        .from('technology_tickets')
        .upsert(ticketToRow(ticket), { onConflict: 'id' })
        .select()
        .single();
      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['tech-tickets'] });
    },
  });
}

// Junta os seed/mock do front (INITIAL_TICKETS) com o que veio do Supabase
export function mergeTickets(initial: TechTicketRow[], remote: TechTicketRow[] | undefined): TechTicketRow[] {
  if (!remote || remote.length === 0) return initial;
  const byId = new Map<string, TechTicketRow>();
  initial.forEach((t) => byId.set(t.id, t));
  remote.forEach((t) => byId.set(t.id, t));
  return Array.from(byId.values());
}