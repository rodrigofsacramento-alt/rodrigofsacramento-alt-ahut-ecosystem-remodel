import { useEffect } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '../lib/supabase';

// Tipos replicados do modelo da tela Gestão (para persistir no Supabase via gestao_tasks)
export interface GestaoTaskRow {
  id: string;
  titulo: string;
  origem: 'telegram_chris' | 'whatsapp' | 'painel' | 'squad';
  status: 'nova' | 'em_analise' | 'em_execucao' | 'concluida';
  prioridade: 'alta' | 'media' | 'baixa';
  responsavel: string;
  criada_em: string;
  mensagem?: string;
  created_at: string;
}

// Converte linhas do banco (snake_case) para o modelo TSX
export function rowToGestaoTask(row: any): GestaoTaskRow {
  return {
    id: row.id,
    titulo: row.titulo,
    origem: row.origem || 'painel',
    status: row.status || 'nova',
    prioridade: row.prioridade || 'media',
    responsavel: row.responsavel || 'Squad Tech',
    criada_em: row.criada_em || '',
    mensagem: row.mensagem || undefined,
    created_at: row.created_at,
  };
}

export function gestaoTaskToRow(t: GestaoTaskRow): any {
  return {
    id: t.id,
    titulo: t.titulo,
    origem: t.origem,
    status: t.status,
    prioridade: t.prioridade,
    responsavel: t.responsavel,
    criada_em: t.criada_em,
    mensagem: t.mensagem,
  };
}

// Hook principal: busca as tarefas de gestão do Supabase (real)
export function useGestaoTasks() {
  const queryClient = useQueryClient();

  useEffect(() => {
    const channel = supabase
      .channel('gestao-tasks-realtime')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'gestao_tasks' }, () => {
        queryClient.invalidateQueries({ queryKey: ['gestao-tasks'] });
      })
      .subscribe();
    return () => { channel.unsubscribe(); };
  }, [queryClient]);

  return useQuery<GestaoTaskRow[]>({
    queryKey: ['gestao-tasks'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('gestao_tasks')
        .select('*')
        .order('criada_em', { ascending: false })
        .order('created_at', { ascending: false });

      if (error) {
        // Se a tabela não existe ainda (dev), não quebra — retorna vazio
        console.warn('[useGestaoTasks] Erro ao buscar tarefas de gestão:', error.message);
        return [];
      }
      return (data || []).map(rowToGestaoTask);
    },
  });
}

// Cria/atualiza uma tarefa de gestão (upsert)
export function useUpsertGestaoTask() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (task: GestaoTaskRow) => {
      const { data, error } = await supabase
        .from('gestao_tasks')
        .upsert(gestaoTaskToRow(task), { onConflict: 'id' })
        .select()
        .single();
      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['gestao-tasks'] });
    },
  });
}

// Junta os seed/mock do front (tarefasIniciais) com o que veio do Supabase
export function mergeGestaoTasks(initial: GestaoTaskRow[], remote: GestaoTaskRow[] | undefined): GestaoTaskRow[] {
  if (!remote || remote.length === 0) return initial;
  const byId = new Map<string, GestaoTaskRow>();
  initial.forEach((t) => byId.set(t.id, t));
  remote.forEach((t) => byId.set(t.id, t));
  return Array.from(byId.values());
}