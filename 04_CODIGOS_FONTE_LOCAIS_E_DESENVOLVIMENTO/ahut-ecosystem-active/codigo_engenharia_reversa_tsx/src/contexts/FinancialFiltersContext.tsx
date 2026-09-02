import React, { createContext, useContext, useEffect, useMemo, useState } from 'react';
import type { TransactionFilters } from '../types/financeiro';

const STORAGE_KEY = 'qubits_financial_filters_v1';

/**
 * FinancialFiltersContext — estado global de filtros financeiros compartilhado
 * entre Dashboard, Lançamentos e Relatórios (F1 — estilo Notion).
 * Persiste em localStorage para manter a preferência entre páginas/sessões.
 */
export interface FinancialFiltersContextValue {
  filters: TransactionFilters;
  setFilters: React.Dispatch<React.SetStateAction<TransactionFilters>>;
  resetFilters: () => void;
  activeCount: number;
}

const DEFAULT_FILTERS: TransactionFilters = {
  type: 'all',
  category_id: undefined,
  status: 'all',
  search: '',
};

const FinancialFiltersContext = createContext<FinancialFiltersContextValue | null>(null);

function loadInitialFilters(): TransactionFilters {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (raw) {
      const parsed = JSON.parse(raw);
      return { ...DEFAULT_FILTERS, ...parsed };
    }
  } catch {
    /* ignore */
  }
  return DEFAULT_FILTERS;
}

export function FinancialFiltersProvider({ children }: { children: React.ReactNode }) {
  const [filters, setFilters] = useState<TransactionFilters>(loadInitialFilters);

  // persiste ao mudar
  useEffect(() => {
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(filters));
    } catch {
      /* ignore */
    }
  }, [filters]);

  const resetFilters = () => setFilters(DEFAULT_FILTERS);

  const activeCount = useMemo(
    () =>
      (filters.type && filters.type !== 'all' ? 1 : 0) +
      (filters.category_id ? 1 : 0) +
      (filters.status && filters.status !== 'all' ? 1 : 0) +
      (filters.search ? 1 : 0),
    [filters]
  );

  const value = useMemo(
    () => ({ filters, setFilters, resetFilters, activeCount }),
    [filters, activeCount]
  );

  return <FinancialFiltersContext.Provider value={value}>{children}</FinancialFiltersContext.Provider>;
}

export function useFinancialFilters(): FinancialFiltersContextValue {
  const ctx = useContext(FinancialFiltersContext);
  if (!ctx) {
    throw new Error('useFinancialFilters deve ser usado dentro de <FinancialFiltersProvider>');
  }
  return ctx;
}

export default FinancialFiltersProvider;