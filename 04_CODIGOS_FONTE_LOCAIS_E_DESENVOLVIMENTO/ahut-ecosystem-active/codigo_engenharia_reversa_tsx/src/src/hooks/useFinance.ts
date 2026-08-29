import { useQuery } from '@tanstack/react-query';
import { supabase } from '../lib/supabase';

/**
 * Hook useFinance
 * Conectado ao Supabase — tabela financial_transactions.
 */

export interface Transaction {
  id: string;
  description: string;
  type: 'income' | 'expense';
  value: number;
  date: string;
  status: 'received' | 'paid' | 'pending' | 'expected';
  category?: string;
  broker_id?: string;
  broker_name?: string;
  created_at?: string;
}

/** Total de comissões do período */
export interface CommissionsSummary {
  total: number;
  received: number;
  expected: number;
  count: number;
}

/** Repasses (valores a repassar / já repassados a parceiros e corretores) */
export interface RepassesSummary {
  total: number;
  toPay: number;
  paid: number;
  count: number;
}

/** Recebíveis (valores a receber por período) */
export interface RecebiveisSummary {
  total: number;
  received: number;
  outstanding: number;
  count: number;
}

/** VGV (Valor Geral de Vendas) do período */
export interface VGVSummary {
  total: number;
  byMonth: { month: string; value: number }[];
  count: number;
}

/** Fluxo de caixa do mês */
export interface CashFlowPeriod {
  receitaTotal: number;
  despesasTotal: number;
  saldoPrevisto: number;
  deltaReceita: number;
  deltaDespesa: number;
  deltaSaldo: number;
}

/** Contrato/forma completa retornada pelo hook */
export interface FinanceSnapshot {
  transactions: Transaction[];
  cashflow: CashFlowPeriod;
  comissoes: CommissionsSummary;
  repasses: RepassesSummary;
  recebiveis: RecebiveisSummary;
  vgv: VGVSummary;
}

export interface FinanceFilters {
  period?: 'month' | 'quarter' | 'year';
  type?: 'income' | 'expense' | 'commission' | 'all';
  broker_id?: string;
}

/**
 * Busca transações financeiras do Supabase com filtros opcionais
 */
async function fetchTransactions(filters?: FinanceFilters): Promise<Transaction[]> {
  let query = supabase
    .from('financial_transactions')
    .select('*');

  // Apply filters
  if (filters?.type && filters.type !== 'all') {
    if (filters.type === 'commission') {
      query = query.or('category.eq.comissao,category.eq.comissão');
    } else {
      query = query.eq('type', filters.type);
    }
  }

  if (filters?.broker_id) {
    query = query.eq('broker_id', filters.broker_id);
  }

  // Period filter
  if (filters?.period) {
    const now = new Date();
    let startDate: Date;
    switch (filters.period) {
      case 'quarter':
        startDate = new Date(now.getFullYear(), now.getMonth() - 3, 1);
        break;
      case 'year':
        startDate = new Date(now.getFullYear() - 1, now.getMonth(), 1);
        break;
      case 'month':
      default:
        startDate = new Date(now.getFullYear(), now.getMonth(), 1);
        break;
    }
    query = query.gte('date', startDate.toISOString().split('T')[0]);
  }

  const { data, error } = await query
    .order('date', { ascending: false })
    .limit(200);

  if (error) {
    console.warn('[useFinance] Erro ao buscar transações:', error.message);
    return [];
  }

  return (data || []).map((row: any) => ({
    id: row.id,
    description: row.description || 'Transação',
    type: row.type || 'income',
    value: row.value || 0,
    date: row.date || row.created_at?.split('T')[0] || new Date().toISOString().split('T')[0],
    status: row.status || 'pending',
    category: row.category,
    broker_id: row.broker_id,
    broker_name: row.broker_name,
    created_at: row.created_at,
  }));
}

/**
 * Busca dados financeiros do Supabase
 */
async function fetchFinanceData(filters?: FinanceFilters): Promise<FinanceSnapshot> {
  const transactions = await fetchTransactions(filters);

  // Calculate cashflow from transactions
  const receitaTotal = transactions
    .filter(t => t.type === 'income')
    .reduce((sum, t) => sum + t.value, 0);
  const despesasTotal = transactions
    .filter(t => t.type === 'expense')
    .reduce((sum, t) => sum + t.value, 0);
  const saldoPrevisto = receitaTotal - despesasTotal;

  // Commissions summary
  const comissoesTotal = transactions
    .filter(t => t.type === 'income' && (t.category?.toLowerCase().includes('comiss') || !t.category))
    .reduce((sum, t) => sum + t.value, 0);
  const comissoesReceived = transactions
    .filter(t => t.type === 'income' && (t.status === 'received') && (t.category?.toLowerCase().includes('comiss') || !t.category))
    .reduce((sum, t) => sum + t.value, 0);
  const comissoesExpected = transactions
    .filter(t => t.type === 'income' && (t.status === 'pending' || t.status === 'expected') && (t.category?.toLowerCase().includes('comiss') || !t.category))
    .reduce((sum, t) => sum + t.value, 0);
  const comissaoCount = transactions
    .filter(t => t.type === 'income' && (t.category?.toLowerCase().includes('comiss') || !t.category))
    .length;

  // Repasses summary
  const repassesTotal = transactions
    .filter(t => t.type === 'expense' && t.category?.toLowerCase().includes('repasse'))
    .reduce((sum, t) => sum + t.value, 0);
  const repassesToPay = transactions
    .filter(t => t.type === 'expense' && t.category?.toLowerCase().includes('repasse') && t.status === 'pending')
    .reduce((sum, t) => sum + t.value, 0);
  const repassesPaid = transactions
    .filter(t => t.type === 'expense' && t.category?.toLowerCase().includes('repasse') && t.status === 'paid')
    .reduce((sum, t) => sum + t.value, 0);
  const repasseCount = transactions
    .filter(t => t.type === 'expense' && t.category?.toLowerCase().includes('repasse'))
    .length;

  // Recebíveis
  const recebiveisTotal = transactions
    .filter(t => t.type === 'income' && t.status !== 'received')
    .reduce((sum, t) => sum + t.value, 0);
  const recebiveisReceived = transactions
    .filter(t => t.type === 'income' && t.status === 'received')
    .reduce((sum, t) => sum + t.value, 0);
  const recebiveisOutstanding = transactions
    .filter(t => t.type === 'income' && (t.status === 'pending' || t.status === 'expected'))
    .reduce((sum, t) => sum + t.value, 0);

  // VGV by month
  const monthMap = new Map<string, number>();
  transactions
    .filter(t => t.type === 'income')
    .forEach(t => {
      const month = t.date ? t.date.substring(0, 7) : 'unknown';
      monthMap.set(month, (monthMap.get(month) || 0) + t.value);
    });
  const byMonth = Array.from(monthMap.entries())
    .map(([m, v]) => ({
      month: new Date(m + '-01').toLocaleDateString('pt-BR', { month: 'short' }),
      value: v,
    }))
    .slice(-6);

  const cashflow: CashFlowPeriod = {
    receitaTotal,
    despesasTotal,
    saldoPrevisto,
    deltaReceita: 0,
    deltaDespesa: 0,
    deltaSaldo: 0,
  };

  const comissoes: CommissionsSummary = {
    total: comissoesTotal,
    received: comissoesReceived,
    expected: comissoesExpected,
    count: comissaoCount,
  };

  const repasses: RepassesSummary = {
    total: repassesTotal,
    toPay: repassesToPay,
    paid: repassesPaid,
    count: repasseCount,
  };

  const recebiveis: RecebiveisSummary = {
    total: recebiveisTotal + recebiveisReceived,
    received: recebiveisReceived,
    outstanding: recebiveisOutstanding,
    count: transactions.filter(t => t.type === 'income').length,
  };

  const vgv: VGVSummary = {
    total: receitaTotal,
    count: transactions.filter(t => t.type === 'income').length,
    byMonth,
  };

  return { transactions, cashflow, comissoes, repasses, recebiveis, vgv };
}

export function useFinance(filters?: FinanceFilters) {
  return useQuery<FinanceSnapshot>({
    queryKey: ['finance', filters],
    queryFn: () => fetchFinanceData(filters),
    staleTime: 1000 * 60 * 2,
  });
}

/**
 * Hook to fetch brokers/profiles for filter dropdown
 */
export function useFinanceBrokers() {
  return useQuery<{ id: string; full_name: string }[]>({
    queryKey: ['finance-brokers'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('profiles')
        .select('id, full_name')
        .in('role', ['agent', 'admin', 'manager'])
        .order('full_name');
      if (error) {
        console.warn('[useFinance] Erro ao buscar corretores:', error.message);
        return [];
      }
      return data || [];
    },
    staleTime: 1000 * 60 * 5,
  });
}
