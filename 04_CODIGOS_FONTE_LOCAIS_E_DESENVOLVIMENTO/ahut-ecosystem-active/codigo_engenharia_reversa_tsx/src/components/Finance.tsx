import React, { useState } from 'react';
import { 
  DollarSign, 
  TrendingUp, 
  TrendingDown, 
  ArrowUpRight, 
  ArrowDownRight,
  Calendar,
  Filter,
  Download,
  Loader2,
  Users,
  RefreshCw
} from 'lucide-react';
import { formatCurrency, cn } from '../lib/utils';
import { useFinance, useFinanceBrokers, type FinanceFilters } from '../hooks/useFinance';

export default function Finance() {
  const [filters, setFilters] = useState<FinanceFilters>({
    period: 'month',
    type: 'all',
    broker_id: undefined,
  });
  const [showFilters, setShowFilters] = useState(false);

  const { data, isLoading } = useFinance(filters);
  const { data: brokers = [] } = useFinanceBrokers();

  const transactions = data?.transactions ?? [];
  const cashflow = data?.cashflow;

  const periodLabel: Record<string, string> = {
    month: 'Mês Atual',
    quarter: 'Último Trimestre',
    year: 'Último Ano',
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-white">Financeiro</h1>
          <p className="text-slate-400">Controle de receitas, despesas e comissões.</p>
        </div>
        <div className="flex gap-2">
          <button
            onClick={() => setShowFilters(!showFilters)}
            className="bg-white/5 border border-cyan-900/30 text-slate-300 px-4 py-2 rounded-lg text-sm font-bold flex items-center gap-2 hover:bg-white/5 transition-colors"
          >
            <Filter className="w-4 h-4" />
            Filtros
          </button>
          <button className="bg-white/5 border border-cyan-900/30 text-slate-300 px-4 py-2 rounded-lg text-sm font-bold flex items-center gap-2 hover:bg-white/5 transition-colors">
            <Download className="w-4 h-4" />
            Exportar
          </button>
        </div>
      </div>

      {/* Filter Panel */}
      {showFilters && (
        <div className="glass-neon-card p-4 shadow-sm">
          <div className="flex flex-wrap items-end gap-4">
            <div className="space-y-1.5">
              <label className="text-xs font-bold text-slate-300">Período</label>
              <div className="flex gap-1 bg-white/5 rounded-lg p-1">
                {(['month', 'quarter', 'year'] as const).map(p => (
                  <button
                    key={p}
                    onClick={() => setFilters({ ...filters, period: p })}
                    className={cn(
                      'px-3 py-1.5 rounded-md text-xs font-bold transition-colors',
                      filters.period === p ? 'bg-white/5 shadow text-cyan-500' : 'text-slate-400 hover:text-slate-300'
                    )}
                  >
                    {periodLabel[p]}
                  </button>
                ))}
              </div>
            </div>
            <div className="space-y-1.5">
              <label className="text-xs font-bold text-slate-300">Tipo</label>
              <select
                className="bg-white/5 border border-cyan-900/30 rounded-lg px-3 py-2 text-sm outline-none focus:ring-1 focus:ring-cyan-500"
                value={filters.type}
                onChange={(e) => setFilters({ ...filters, type: e.target.value as any })}
              >
                <option value="all">Todos</option>
                <option value="income">Receitas</option>
                <option value="expense">Despesas</option>
                <option value="commission">Comissões</option>
              </select>
            </div>
            <div className="space-y-1.5">
              <label className="text-xs font-bold text-slate-300">Corretor</label>
              <select
                className="bg-white/5 border border-cyan-900/30 rounded-lg px-3 py-2 text-sm outline-none focus:ring-1 focus:ring-cyan-500"
                value={filters.broker_id || ''}
                onChange={(e) => setFilters({ ...filters, broker_id: e.target.value || undefined })}
              >
                <option value="">Todos os Corretores</option>
                {brokers.map((b: any) => (
                  <option key={b.id} value={b.id}>{b.full_name}</option>
                ))}
              </select>
            </div>
            <button
              onClick={() => setFilters({ period: 'month', type: 'all', broker_id: undefined })}
              className="px-3 py-2 text-xs font-bold text-slate-400 hover:text-slate-300 flex items-center gap-1"
            >
              <RefreshCw className="w-3.5 h-3.5" /> Limpar
            </button>
          </div>
        </div>
      )}

      {/* Stats Summary */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <div className="bg-white/5 p-6 rounded-xl border border-cyan-900/30 shadow-sm">
          <div className="flex items-center justify-between mb-4">
            <div className="w-10 h-10 rounded-lg bg-emerald-500/10 flex items-center justify-center text-emerald-600">
              <TrendingUp className="w-6 h-6" />
            </div>
            <span className="text-xs font-bold text-emerald-600 bg-emerald-500/10 px-2 py-1 rounded-full">
              {isLoading ? '...' : `${(cashflow?.deltaReceita ?? 0) >= 0 ? '+' : ''}${cashflow?.deltaReceita ?? 0}%`}
            </span>
          </div>
          <p className="text-sm text-slate-400 font-medium">Receita Total ({periodLabel[filters.period || 'month']})</p>
          <p className="text-2xl font-bold text-white">
            {isLoading ? <Loader2 className="w-5 h-5 inline-block animate-spin text-slate-300" /> : formatCurrency(cashflow?.receitaTotal ?? 0)}
          </p>
        </div>
        <div className="bg-white/5 p-6 rounded-xl border border-cyan-900/30 shadow-sm">
          <div className="flex items-center justify-between mb-4">
            <div className="w-10 h-10 rounded-lg bg-rose-500/10 flex items-center justify-center text-rose-600">
              <TrendingDown className="w-6 h-6" />
            </div>
            <span className="text-xs font-bold text-rose-600 bg-rose-500/10 px-2 py-1 rounded-full">
              {isLoading ? '...' : `${(cashflow?.deltaDespesa ?? 0) >= 0 ? '+' : ''}${cashflow?.deltaDespesa ?? 0}%`}
            </span>
          </div>
          <p className="text-sm text-slate-400 font-medium">Despesas Totais ({periodLabel[filters.period || 'month']})</p>
          <p className="text-2xl font-bold text-white">
            {isLoading ? <Loader2 className="w-5 h-5 inline-block animate-spin text-slate-300" /> : formatCurrency(cashflow?.despesasTotal ?? 0)}
          </p>
        </div>
        <div className="bg-white/5 p-6 rounded-xl border border-cyan-900/30 shadow-sm">
          <div className="flex items-center justify-between mb-4">
            <div className="w-10 h-10 rounded-lg bg-indigo-500/10 flex items-center justify-center text-cyan-500">
              <DollarSign className="w-6 h-6" />
            </div>
            <span className="text-xs font-bold text-cyan-500 bg-indigo-500/10 px-2 py-1 rounded-full">
              {isLoading ? '...' : `${(cashflow?.deltaSaldo ?? 0) >= 0 ? '+' : ''}${cashflow?.deltaSaldo ?? 0}%`}
            </span>
          </div>
          <p className="text-sm text-slate-400 font-medium">Saldo Previsto</p>
          <p className="text-2xl font-bold text-white">
            {isLoading ? <Loader2 className="w-5 h-5 inline-block animate-spin text-slate-300" /> : formatCurrency(cashflow?.saldoPrevisto ?? 0)}
          </p>
        </div>
      </div>

      {/* Transactions Table */}
      <div className="glass-neon-card shadow-sm overflow-hidden">
        <div className="p-4 border-b border-white/5 flex items-center justify-between">
          <h3 className="font-bold text-white">
            Transações Recentes
            {transactions.length > 0 && (
              <span className="text-sm font-normal text-slate-400 ml-2">({transactions.length})</span>
            )}
          </h3>
          <div className="flex gap-2">
            <button className="p-2 text-slate-400 hover:text-slate-300 rounded-lg hover:bg-white/5">
              <Calendar className="w-4 h-4" />
            </button>
          </div>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="bg-white/5">
                <th className="px-6 py-4 text-xs font-semibold text-slate-400 uppercase">Descrição</th>
                <th className="px-6 py-4 text-xs font-semibold text-slate-400 uppercase">Tipo</th>
                <th className="px-6 py-4 text-xs font-semibold text-slate-400 uppercase">Valor</th>
                <th className="px-6 py-4 text-xs font-semibold text-slate-400 uppercase">Data</th>
                <th className="px-6 py-4 text-xs font-semibold text-slate-400 uppercase">Status</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {isLoading && (
                <tr>
                  <td colSpan={5} className="px-6 py-8 text-center text-sm text-slate-400">
                    <Loader2 className="w-5 h-5 inline-block animate-spin mr-2 text-slate-300" />
                    Carregando transações...
                  </td>
                </tr>
              )}
              {!isLoading && transactions.length === 0 && (
                <tr>
                  <td colSpan={5} className="px-6 py-8 text-center text-sm text-slate-400">Nenhuma transação encontrada para o período.</td>
                </tr>
              )}
              {!isLoading && transactions.map((t) => (
                <tr key={t.id} className="hover:bg-white/5 transition-colors">
                  <td className="px-6 py-4">
                    <div>
                      <span className="text-sm font-medium text-white">{t.description}</span>
                      {t.broker_name && (
                        <div className="text-[10px] text-slate-400 mt-0.5 flex items-center gap-1">
                          <Users className="w-3 h-3" /> {t.broker_name}
                        </div>
                      )}
                    </div>
                  </td>
                  <td className="px-6 py-4">
                    <div className="flex items-center gap-2">
                      {t.type === 'income' ? (
                        <ArrowUpRight className="w-4 h-4 text-emerald-500" />
                      ) : (
                        <ArrowDownRight className="w-4 h-4 text-rose-500" />
                      )}
                      <span className={cn(
                        "text-xs font-bold uppercase",
                        t.type === 'income' ? "text-emerald-600" : "text-rose-600"
                      )}>
                        {t.type === 'income' ? 'Receita' : 'Despesa'}
                      </span>
                    </div>
                  </td>
                  <td className="px-6 py-4">
                    <span className={cn(
                      "text-sm font-bold",
                      t.type === 'income' ? "text-emerald-600" : "text-rose-600"
                    )}>
                      {t.type === 'income' ? '+' : '-'} {formatCurrency(t.value)}
                    </span>
                  </td>
                  <td className="px-6 py-4 text-sm text-slate-400">
                    {t.date ? new Date(t.date + (t.date.includes('-') ? '' : '')).toLocaleDateString('pt-BR', { timeZone: 'UTC' }) : '-'}
                  </td>
                  <td className="px-6 py-4">
                    <span className={cn(
                      "inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium border",
                      t.status === 'received' || t.status === 'paid' 
                        ? "bg-emerald-500/10 text-emerald-600 border-emerald-500/20" 
                        : "bg-amber-500/10 text-amber-400 border-amber-500/20"
                    )}>
                      {t.status === 'received' ? 'Recebido' : t.status === 'paid' ? 'Pago' : 'Pendente'}
                    </span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
