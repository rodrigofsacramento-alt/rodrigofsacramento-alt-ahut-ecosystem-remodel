/**
 * Tipos do módulo Financeiro — espelham as tabelas já criadas no Supabase PROD.
 *
 * Tabelas:
 *  - financial_transactions
 *  - financial_categories
 *  - financial_banks
 *  - financial_cards
 *  - financial_transfers
 *  - VIEW financial_saldo (bank_id, banco, saldo)
 */

export type TransactionType = 'income' | 'expense';

export interface FinancialTransaction {
  id: string;
  tenant_id: string | null;
  name: string;
  type: TransactionType;
  amount: number;
  category_id: string | null;
  bank_id: string | null;
  card_id: string | null;
  client_id: string | null;
  description: string | null;
  due_date: string | null; // yyyy-mm-dd
  paid_date: string | null; // yyyy-mm-dd
  is_realized: boolean;
  date: string | null; // yyyy-mm-dd
  source: string | null;
  created_at: string;
  updated_at: string;
  // Campos resolvidos no front-end (joins manuais)
  category_name?: string;
  bank_name?: string;
  card_name?: string;
}

/** Valores aceitos pela coluna `category` de financial_categories */
export const CATEGORY_TYPES = [
  'Entrada',
  'Custo Fixo',
  'Custo Variável',
  'Operação Financeira',
  'Investimentos',
  'Retirada Sócios',
  'Aporte Sócios',
] as const;
export type CategoryType = (typeof CATEGORY_TYPES)[number];

export interface FinancialCategory {
  id: string;
  tenant_id: string | null;
  name: string;
  category: string;
  ordem: number | null;
  is_active: boolean;
  created_at?: string;
}

export interface FinancialBank {
  id: string;
  tenant_id: string | null;
  name: string;
  is_active: boolean;
  created_at?: string;
}

export interface FinancialCard {
  id: string;
  tenant_id: string | null;
  name: string;
  credit_limit: number | null;
  due_day: number | null;
  is_active: boolean;
  created_at?: string;
}

export interface FinancialTransfer {
  id: string;
  tenant_id: string | null;
  from_bank_id: string | null;
  to_bank_id: string | null;
  amount: number;
  transfer_date: string | null; // yyyy-mm-dd
  note: string | null;
  created_at?: string;
  // Campos resolvidos no front-end
  from_bank_name?: string;
  to_bank_name?: string;
}

/** Linha da VIEW financial_saldo */
export interface BankSaldo {
  bank_id: string;
  banco: string;
  saldo: number;
}

/** Filtros usados na tela de Lançamentos */
export interface TransactionFilters {
  type?: 'income' | 'expense' | 'all';
  category_id?: string;
  status?: 'realizado' | 'pendente' | 'all';
  search?: string;
}