import React, { useMemo, useState } from 'react';
import { Search, Calendar, Tag, ArrowDownUp, FilterX } from 'lucide-react';
import { cn } from '../../../lib/utils';
import { SelectInput } from './FinancialUI';
import { useFinancialCategories } from '../../../hooks/useFinancial';
import type { TransactionFilters } from '../../../types/financeiro';

export type PeriodPreset = 'all' | 'month' | 'quarter' | 'year';

export interface FinancialFilterState {
  period: PeriodPreset;
  range?: { from: string; to: string } | null;
}

/**
 * Barra de filtros financeiros reutilizável (F1 — estilo Notion).
 * Filtra por: período, categoria, entrada/saída, realizado/pendente e busca.
 * Aplica os filtros instantaneamente via callback.
 */
export default function FinancialFilters({
  value,
  onChange,
  onSearch,
  onPeriodChange,
  showSearch = true,
  showPeriod = true,
  showCategory = true,
  showType = true,
  showStatus = true,
  className,
}: {
  value: TransactionFilters;
  onChange: (next: TransactionFilters) => void;
  onSearch?: (q: string) => void;
  onPeriodChange?: (range: { from: string; to: string } | null) => void;
  showSearch?: boolean;
  showPeriod?: boolean;
  showCategory?: boolean;
  showType?: boolean;
  showStatus?: boolean;
  className?: string;
}) {
  const { data: categories = [] } = useFinancialCategories();
  const [period, setPeriod] = useState<PeriodPreset>('all');

  const activeCount =
    (value.type && value.type !== 'all' ? 1 : 0) +
    (value.category_id ? 1 : 0) +
    (value.status && value.status !== 'all' ? 1 : 0) +
    (period !== 'all' ? 1 : 0) +
    (value.search ? 1 : 0);

  const periodRange = useMemo(() => {
    if (period === 'all') return null;
    const now = new Date();
    if (period === 'month') {
      return { from: `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}-01`, to: now.toISOString().slice(0, 10) };
    }
    if (period === 'quarter') {
      const qStart = new Date(now.getFullYear(), Math.floor(now.getMonth() / 3) * 3, 1);
      return { from: qStart.toISOString().slice(0, 10), to: now.toISOString().slice(0, 10) };
    }
    return { from: `${now.getFullYear()}-01-01`, to: now.toISOString().slice(0, 10) };
  }, [period]);

  return (
    <div className={cn('flex flex-wrap items-center gap-2.5 rounded-2xl bg-white/[0.03] border border-white/[0.07] p-3', className)}>
      {showSearch && (
        <div className="relative min-w-[160px] flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-500" />
          <input
            value={value.search || ''}
            onChange={(e) => onSearch?.(e.target.value)}
            placeholder="Buscar nome, descrição..."
            className="w-full bg-white/5 border border-white/10 rounded-xl pl-9 pr-3 py-2 text-sm text-white placeholder-slate-500 outline-none focus:ring-1 focus:ring-[#00FFCC]/50"
          />
        </div>
      )}

      {showPeriod && (
        <div className="flex items-center gap-1 rounded-xl bg-white/5 border border-white/10 p-1">
          <Calendar className="w-3.5 h-3.5 text-slate-500 ml-1.5" />
          {(
            [
              { key: 'all', label: 'Tudo' },
              { key: 'month', label: 'Mês' },
              { key: 'quarter', label: 'Trimestre' },
              { key: 'year', label: 'Ano' },
            ] as Array<{ key: PeriodPreset; label: string }>
          ).map((p) => (
            <button
              key={p.key}
              onClick={() => {
                const range = p.key === 'all' ? null : periodRange;
                setPeriod(p.key);
                onChange({ ...value });
                onPeriodChange?.(range);
              }}
              className={cn(
                'px-2.5 py-1 rounded-lg text-xs font-bold transition-all',
                period === p.key
                  ? 'bg-[#00FFCC]/15 text-[#00FFCC]'
                  : 'text-slate-400 hover:text-white'
              )}
            >
              {p.label}
            </button>
          ))}
        </div>
      )}

      {showCategory && (
        <SelectInput
          value={value.category_id || ''}
          onChange={(e) => onChange({ ...value, category_id: e.target.value || undefined })}
          selectClassName="bg-white/5 border-white/10 text-white text-xs py-2"
          className="min-w-[140px]"
        >
          <option value="" className="bg-[#0a0e15]">Todas categorias</option>
          {categories.map((c: any) => (
            <option key={c.id} value={c.id} className="bg-[#0a0e15]">{c.name}</option>
          ))}
        </SelectInput>
      )}

      {showType && (
        <div className="flex items-center gap-1 rounded-xl bg-white/5 border border-white/10 p-1">
          <ArrowDownUp className="w-3.5 h-3.5 text-slate-500 ml-1.5" />
          {(
            [
              { key: 'all', label: 'Todas' },
              { key: 'income', label: 'Entrada' },
              { key: 'expense', label: 'Saída' },
            ] as Array<{ key: any; label: string }>
          ).map((t) => (
            <button
              key={t.key}
              onClick={() => onChange({ ...value, type: t.key })}
              className={cn(
                'px-2.5 py-1 rounded-lg text-xs font-bold transition-all',
                (value.type || 'all') === t.key
                  ? 'bg-[#00FFCC]/15 text-[#00FFCC]'
                  : 'text-slate-400 hover:text-white'
              )}
            >
              {t.label}
            </button>
          ))}
        </div>
      )}

      {showStatus && (
        <SelectInput
          value={value.status || 'all'}
          onChange={(e) => onChange({ ...value, status: (e.target.value || 'all') as any })}
          selectClassName="bg-white/5 border-white/10 text-white text-xs py-2"
          className="min-w-[120px]"
        >
          <option value="all" className="bg-[#0a0e15]">Todos status</option>
          <option value="realizado" className="bg-[#0a0e15]">Realizado</option>
          <option value="pendente" className="bg-[#0a0e15]">Pendente</option>
        </SelectInput>
      )}

      {activeCount > 0 && (
        <button
          onClick={() => {
            setPeriod('all');
            onChange({ type: 'all', category_id: undefined, status: 'all', search: '' });
            onSearch?.('');
            onPeriodChange?.(null);
          }}
          className="inline-flex items-center gap-1.5 px-3 py-2 rounded-xl text-xs font-bold text-[#00FFCC] hover:bg-[#00FFCC]/10 transition-all"
          title="Limpar filtros"
        >
          <FilterX className="w-3.5 h-3.5" />
          Limpar ({activeCount})
        </button>
      )}
    </div>
  );
}