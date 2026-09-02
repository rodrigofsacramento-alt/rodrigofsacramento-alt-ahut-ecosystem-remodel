import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '../lib/supabase';
import type {
  FinancialTransaction,
  FinancialCategory,
  FinancialBank,
  FinancialCard,
  FinancialTransfer,
  BankSaldo,
} from '../types/financeiro';

/* ──────────────────────────────────────────────────────────────────────────
 * Helpers
 * ────────────────────────────────────────────────────────────────────────── */
function warn(scope: string, message: string) {
  console.warn(`[useFinancial] ${scope}:`, message);
}

/* ──────────────────────────────────────────────────────────────────────────
 * Lançamentos — financial_transactions
 * ────────────────────────────────────────────────────────────────────────── */
export function useFinancialTransactions() {
  return useQuery<FinancialTransaction[]>({
    queryKey: ['financial-transactions'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('financial_transactions')
        .select('*')
        .order('date', { ascending: false, nullsFirst: false })
        .order('created_at', { ascending: false });

      if (error) {
        warn('useFinancialTransactions', error.message);
        return [];
      }

      // Resolve nomes de categoria / banco / cartão via tabelas de referência
      const [cats, banks, cards] = await Promise.all([
        supabase.from('financial_categories').select('id, name'),
        supabase.from('financial_banks').select('id, name'),
        supabase.from('financial_cards').select('id, name'),
      ]);

      const catMap = new Map((cats.data || []).map((r: any) => [r.id, r.name]));
      const bankMap = new Map((banks.data || []).map((r: any) => [r.id, r.name]));
      const cardMap = new Map((cards.data || []).map((r: any) => [r.id, r.name]));

      return (data || []).map((row: any): FinancialTransaction => ({
        id: row.id,
        tenant_id: row.tenant_id ?? null,
        name: row.name || 'Transação',
        type: row.type === 'expense' ? 'expense' : 'income',
        amount: Number(row.amount || 0),
        category_id: row.category_id ?? null,
        bank_id: row.bank_id ?? null,
        card_id: row.card_id ?? null,
        client_id: row.client_id ?? null,
        description: row.description ?? null,
        due_date: row.due_date ?? null,
        paid_date: row.paid_date ?? null,
        is_realized: Boolean(row.is_realized),
        date: row.date ?? null,
        source: row.source ?? null,
        created_at: row.created_at,
        updated_at: row.updated_at,
        category_name: row.category_id ? catMap.get(row.category_id) : undefined,
        bank_name: row.bank_id ? bankMap.get(row.bank_id) : undefined,
        card_name: row.card_id ? cardMap.get(row.card_id) : undefined,
      }));
    },
  });
}

function invalidateTransactions(queryClient: ReturnType<typeof useQueryClient>) {
  queryClient.invalidateQueries({ queryKey: ['financial-transactions'] });
  queryClient.invalidateQueries({ queryKey: ['financial-bank-saldos'] });
}

export function useCreateTransaction() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (payload: Partial<FinancialTransaction>) => {
      const { data, error } = await supabase
        .from('financial_transactions')
        .insert(payload)
        .select()
        .single();
      if (error) throw error;
      return data;
    },
    onSuccess: () => invalidateTransactions(queryClient),
    onError: (e: any) => warn('useCreateTransaction', e.message),
  });
}

export function useUpdateTransaction() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async ({ id, payload }: { id: string; payload: Partial<FinancialTransaction> }) => {
      const { data, error } = await supabase
        .from('financial_transactions')
        .update({ ...payload, updated_at: new Date().toISOString() })
        .eq('id', id)
        .select()
        .single();
      if (error) throw error;
      return data;
    },
    onSuccess: () => invalidateTransactions(queryClient),
    onError: (e: any) => warn('useUpdateTransaction', e.message),
  });
}

export function useSetTransactionRealized() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async ({ id, is_realized }: { id: string; is_realized: boolean }) => {
      const now = new Date().toISOString().split('T')[0];
      const { error } = await supabase
        .from('financial_transactions')
        .update({ is_realized, paid_date: is_realized ? now : null, updated_at: new Date().toISOString() })
        .eq('id', id);
      if (error) throw error;
      return { id, is_realized };
    },
    onSuccess: () => invalidateTransactions(queryClient),
    onError: (e: any) => warn('useSetTransactionRealized', e.message),
  });
}

export function useDeleteTransaction() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase.from('financial_transactions').delete().eq('id', id);
      if (error) throw error;
      return id;
    },
    onSuccess: () => invalidateTransactions(queryClient),
    onError: (e: any) => warn('useDeleteTransaction', e.message),
  });
}

/* ──────────────────────────────────────────────────────────────────────────
 * Categorias — financial_categories
 * ────────────────────────────────────────────────────────────────────────── */
export function useFinancialCategories() {
  return useQuery<FinancialCategory[]>({
    queryKey: ['financial-categories'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('financial_categories')
        .select('*')
        .order('ordem', { ascending: true, nullsFirst: false })
        .order('name', { ascending: true });
      if (error) {
        warn('useFinancialCategories', error.message);
        return [];
      }
      return (data || []).map((row: any): FinancialCategory => ({
        id: row.id,
        tenant_id: row.tenant_id ?? null,
        name: row.name,
        category: row.category,
        ordem: row.ordem ?? null,
        is_active: Boolean(row.is_active),
        created_at: row.created_at,
      }));
    },
  });
}

export function useCreateCategory() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (payload: Partial<FinancialCategory>) => {
      const { data, error } = await supabase.from('financial_categories').insert(payload).select().single();
      if (error) throw error;
      return data;
    },
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['financial-categories'] }),
    onError: (e: any) => warn('useCreateCategory', e.message),
  });
}

export function useUpdateCategory() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async ({ id, payload }: { id: string; payload: Partial<FinancialCategory> }) => {
      const { data, error } = await supabase.from('financial_categories').update(payload).eq('id', id).select().single();
      if (error) throw error;
      return data;
    },
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['financial-categories'] }),
    onError: (e: any) => warn('useUpdateCategory', e.message),
  });
}

export function useDeleteCategory() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase.from('financial_categories').delete().eq('id', id);
      if (error) throw error;
      return id;
    },
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['financial-categories'] }),
    onError: (e: any) => warn('useDeleteCategory', e.message),
  });
}

/* ──────────────────────────────────────────────────────────────────────────
 * Bancos — financial_banks
 * ────────────────────────────────────────────────────────────────────────── */
export function useFinancialBanks() {
  return useQuery<FinancialBank[]>({
    queryKey: ['financial-banks'],
    queryFn: async () => {
      const { data, error } = await supabase.from('financial_banks').select('*').order('name', { ascending: true });
      if (error) {
        warn('useFinancialBanks', error.message);
        return [];
      }
      return (data || []).map((row: any): FinancialBank => ({
        id: row.id,
        tenant_id: row.tenant_id ?? null,
        name: row.name,
        is_active: Boolean(row.is_active),
        created_at: row.created_at,
      }));
    },
  });
}

export function useCreateBank() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (payload: Partial<FinancialBank>) => {
      const { data, error } = await supabase.from('financial_banks').insert(payload).select().single();
      if (error) throw error;
      return data;
    },
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['financial-banks'] }),
    onError: (e: any) => warn('useCreateBank', e.message),
  });
}

export function useUpdateBank() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async ({ id, payload }: { id: string; payload: Partial<FinancialBank> }) => {
      const { data, error } = await supabase.from('financial_banks').update(payload).eq('id', id).select().single();
      if (error) throw error;
      return data;
    },
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['financial-banks'] }),
    onError: (e: any) => warn('useUpdateBank', e.message),
  });
}

export function useDeleteBank() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase.from('financial_banks').delete().eq('id', id);
      if (error) throw error;
      return id;
    },
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['financial-banks'] }),
    onError: (e: any) => warn('useDeleteBank', e.message),
  });
}

/* ──────────────────────────────────────────────────────────────────────────
 * Cartões — financial_cards
 * ────────────────────────────────────────────────────────────────────────── */
export function useFinancialCards() {
  return useQuery<FinancialCard[]>({
    queryKey: ['financial-cards'],
    queryFn: async () => {
      const { data, error } = await supabase.from('financial_cards').select('*').order('name', { ascending: true });
      if (error) {
        warn('useFinancialCards', error.message);
        return [];
      }
      return (data || []).map((row: any): FinancialCard => ({
        id: row.id,
        tenant_id: row.tenant_id ?? null,
        name: row.name,
        credit_limit: Number(row.credit_limit ?? 0),
        due_day: row.due_day != null ? Number(row.due_day) : null,
        is_active: Boolean(row.is_active),
        created_at: row.created_at,
      }));
    },
  });
}

export function useCreateCard() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (payload: Partial<FinancialCard>) => {
      const { data, error } = await supabase.from('financial_cards').insert(payload).select().single();
      if (error) throw error;
      return data;
    },
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['financial-cards'] }),
    onError: (e: any) => warn('useCreateCard', e.message),
  });
}

export function useUpdateCard() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async ({ id, payload }: { id: string; payload: Partial<FinancialCard> }) => {
      const { data, error } = await supabase.from('financial_cards').update(payload).eq('id', id).select().single();
      if (error) throw error;
      return data;
    },
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['financial-cards'] }),
    onError: (e: any) => warn('useUpdateCard', e.message),
  });
}

export function useDeleteCard() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase.from('financial_cards').delete().eq('id', id);
      if (error) throw error;
      return id;
    },
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['financial-cards'] }),
    onError: (e: any) => warn('useDeleteCard', e.message),
  });
}

/* ──────────────────────────────────────────────────────────────────────────
 * Transferências — financial_transfers
 * ────────────────────────────────────────────────────────────────────────── */
export function useFinancialTransfers() {
  return useQuery<FinancialTransfer[]>({
    queryKey: ['financial-transfers'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('financial_transfers')
        .select('*')
        .order('transfer_date', { ascending: false, nullsFirst: false })
        .order('created_at', { ascending: false });
      if (error) {
        warn('useFinancialTransfers', error.message);
        return [];
      }
      const { data: banks } = await supabase.from('financial_banks').select('id, name');
      const bankMap = new Map((banks || []).map((r: any) => [r.id, r.name]));
      return (data || []).map((row: any): FinancialTransfer => ({
        id: row.id,
        tenant_id: row.tenant_id ?? null,
        from_bank_id: row.from_bank_id ?? null,
        to_bank_id: row.to_bank_id ?? null,
        amount: Number(row.amount || 0),
        transfer_date: row.transfer_date ?? null,
        note: row.note ?? null,
        created_at: row.created_at,
        from_bank_name: row.from_bank_id ? bankMap.get(row.from_bank_id) : undefined,
        to_bank_name: row.to_bank_id ? bankMap.get(row.to_bank_id) : undefined,
      }));
    },
  });
}

export function useCreateTransfer() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (payload: Partial<FinancialTransfer>) => {
      const { data, error } = await supabase.from('financial_transfers').insert(payload).select().single();
      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['financial-transfers'] });
      queryClient.invalidateQueries({ queryKey: ['financial-bank-saldos'] });
    },
    onError: (e: any) => warn('useCreateTransfer', e.message),
  });
}

export function useUpdateTransfer() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async ({ id, payload }: { id: string; payload: Partial<FinancialTransfer> }) => {
      const { data, error } = await supabase.from('financial_transfers').update(payload).eq('id', id).select().single();
      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['financial-transfers'] });
      queryClient.invalidateQueries({ queryKey: ['financial-bank-saldos'] });
    },
    onError: (e: any) => warn('useUpdateTransfer', e.message),
  });
}

export function useDeleteTransfer() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase.from('financial_transfers').delete().eq('id', id);
      if (error) throw error;
      return id;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['financial-transfers'] });
      queryClient.invalidateQueries({ queryKey: ['financial-bank-saldos'] });
    },
    onError: (e: any) => warn('useDeleteTransfer', e.message),
  });
}

/* ──────────────────────────────────────────────────────────────────────────
 * Saldo — VIEW financial_saldo
 * ────────────────────────────────────────────────────────────────────────── */
export function useBankSaldos() {
  return useQuery<BankSaldo[]>({
    queryKey: ['financial-bank-saldos'],
    queryFn: async () => {
      const { data, error } = await supabase.from('financial_saldo').select('*');
      if (error) {
        warn('useBankSaldos', error.message);
        return [];
      }
      return (data || []).map((row: any): BankSaldo => ({
        bank_id: row.bank_id,
        banco: row.banco,
        saldo: Number(row.saldo ?? 0),
      }));
    },
    staleTime: 1000 * 30,
  });
}