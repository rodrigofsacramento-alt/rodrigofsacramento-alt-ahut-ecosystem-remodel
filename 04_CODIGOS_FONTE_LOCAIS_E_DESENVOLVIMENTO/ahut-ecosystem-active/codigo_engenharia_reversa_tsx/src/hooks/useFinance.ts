import { useQuery } from '@tanstack/react-query';

/**
 * Hook useFinance
 * Fonte de dados de finanças (fluxo de caixa, recebíveis, comissões e VGV).
 *
 * NOTA: este módulo ainda não possui tabela confirmada no Supabase. Para que a
 * tela seja auditável e o contrato de dados fique pronto para a próxima etapa
 * (conectar ao banco), os dados são carregados VIA useQuery imitando uma chamada
 * de API (função `fetchFinanceData` abaixo). Para conectar ao banco, basta
 * trocar o corpo de `fetchFinanceData` por uma query ao Supabase mantendo a
 * mesma forma de retorno (FinanceSnapshot).
 */

export interface Transaction {
  id: string;
  description: string;
  type: 'income' | 'expense';
  value: number;
  date: string;
  status: 'received' | 'paid' | 'pending' | 'expected';
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
  outstanding: number; // a vencer / em aberto
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
  deltaReceita: number; // % variação mês
  deltaDespesa: number; // % variação mês
  deltaSaldo: number;   // % variação saldo
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

/**
 * Função que "busca" os dados. AQUI: dados mock estruturados, mas servida via
 * useQuery para que a UI reaja a estado de carregamento/erro e o contrato fique
 * pronto para substituição por uma chamada real ao Supabase.
 */
async function fetchFinanceData(): Promise<FinanceSnapshot> {
  // Simula latência de rede para reproduzir o comportamento de uma API real.
  await new Promise((resolve) => setTimeout(resolve, 350));

  const transactions: Transaction[] = [
    { id: 'trx-1', description: 'Comissão Venda CTR-15243', type: 'income', value: 45000, date: '2023-10-24', status: 'received' },
    { id: 'trx-2', description: 'Marketing Digital - Outubro', type: 'expense', value: 5000, date: '2023-10-22', status: 'paid' },
    { id: 'trx-3', description: 'Aluguel Escritório', type: 'expense', value: 12000, date: '2023-10-20', status: 'paid' },
    { id: 'trx-4', description: 'Comissão Locação CTR-88742', type: 'income', value: 2500, date: '2023-10-18', status: 'received' },
    { id: 'trx-5', description: 'Comissão Venda CTR-15811', type: 'income', value: 67200, date: '2023-10-15', status: 'pending' },
    { id: 'trx-6', description: 'Repasse Corretor Parceiro - CTR-15243', type: 'expense', value: 9000, date: '2023-10-12', status: 'paid' },
    { id: 'trx-7', description: 'Comissão Venda CTR-16002', type: 'income', value: 9800, date: '2023-10-08', status: 'expected' },
    { id: 'trx-8', description: 'Software e Ferramentas', type: 'expense', value: 2300, date: '2023-10-05', status: 'paid' },
  ];

  const cashflow: CashFlowPeriod = {
    receitaTotal: 124500,
    despesasTotal: 32800,
    saldoPrevisto: 91700,
    deltaReceita: 12,
    deltaDespesa: -5,
    deltaSaldo: 8,
  };

  const comissoes: CommissionsSummary = {
    total: 124500,
    received: 47500,
    expected: 77000,
    count: 4,
  };

  const repasses: RepassesSummary = {
    total: 21300,
    toPay: 12300,
    paid: 9000,
    count: 3,
  };

  const recebiveis: RecebiveisSummary = {
    total: 77000,
    received: 47500,
    outstanding: 29500,
    count: 5,
  };

  const vgv: VGVSummary = {
    total: 124500,
    count: 4,
    byMonth: [
      { month: 'Ago', value: 98000 },
      { month: 'Set', value: 112000 },
      { month: 'Out', value: 124500 },
    ],
  };

  return { transactions, cashflow, comissoes, repasses, recebiveis, vgv };
}

export function useFinance() {
  return useQuery<FinanceSnapshot>({
    queryKey: ['finance'],
    queryFn: fetchFinanceData,
  });
}