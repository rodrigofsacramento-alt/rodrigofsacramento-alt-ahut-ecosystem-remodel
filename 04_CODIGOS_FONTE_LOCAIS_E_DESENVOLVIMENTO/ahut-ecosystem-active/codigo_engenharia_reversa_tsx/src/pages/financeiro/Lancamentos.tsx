import React, { useEffect, useMemo, useState } from 'react';
import { Plus, Search, Pencil, Trash2, LayoutList, TrendingUp, TrendingDown, CheckCircle2 } from 'lucide-react';
import {
  useFinancialTransactions,
  useFinancialCategories,
  useFinancialBanks,
  useFinancialCards,
  useCreateTransaction,
  useUpdateTransaction,
  useDeleteTransaction,
  useSetTransactionRealized,
} from '../../hooks/useFinancial';
import type { TransactionFilters, FinancialTransaction } from '../../types/financeiro';
import { supabase } from '../../lib/supabase';
import FinancialFilters from './components/FinancialFilters';
import { useFinancialFilters } from '../../contexts/FinancialFiltersContext';
import { formatCurrency, cn } from '../../lib/utils';
import {
  Card,
  CardHeader,
  Modal,
  ConfirmDelete,
  TextInput,
  SelectInput,
  TextAreaInput,
  FormGrid,
  BtnPrimary,
  BtnGhost,
  BtnDanger,
  IconBtn,
  Badge,
  Spinner,
  EmptyState,
  ErrorNote,
  formatDateBR,
} from './components/FinancialUI';
import FinNav from './components/FinNav';

interface FormState {
  name: string;
  type: 'income' | 'expense';
  amount: string;
  category_id: string;
  bank_id: string;
  card_id: string;
  client_id: string;
  due_date: string;
  paid_date: string;
  date: string;
  description: string;
  is_realized: boolean;
}

const emptyForm: FormState = {
  name: '',
  type: 'income',
  amount: '',
  category_id: '',
  bank_id: '',
  card_id: '',
  client_id: '',
  due_date: '',
  paid_date: '',
  date: '',
  description: '',
  is_realized: false,
};

export default function Lancamentos() {
  const { data: transactions = [], isLoading } = useFinancialTransactions();
  const { data: categories = [] } = useFinancialCategories();
  const { data: banks = [] } = useFinancialBanks();
  const { data: cards = [] } = useFinancialCards();

  const createTx = useCreateTransaction();
  const updateTx = useUpdateTransaction();
  const deleteTx = useDeleteTransaction();
  const toggleRealized = useSetTransactionRealized();

  // F1 — filtros compartilhados via FinancialFiltersContext (global, persistido)
  const { filters, setFilters } = useFinancialFilters();
  const [modalOpen, setModalOpen] = useState(false);
  const [editing, setEditing] = useState<FinancialTransaction | null>(null);
  const [form, setForm] = useState<FormState>(emptyForm);
  const [formError, setFormError] = useState('');
  const [deleteTarget, setDeleteTarget] = useState<FinancialTransaction | null>(null);

  const [leads, setLeads] = useState<{ id: string; name: string; phone: string | null }[]>([]);
  useEffect(() => {
    supabase
      .from('leads')
      .select('id, name, phone')
      .then(({ data, error }) => {
        if (!error && data) setLeads(data);
      });
  }, []);

  const filtered = useMemo(() => {
    return transactions.filter((t) => {
      if (filters.type !== 'all' && t.type !== filters.type) return false;
      if (filters.category_id && t.category_id !== filters.category_id) return false;
      if (filters.status === 'realizado' && !t.is_realized) return false;
      if (filters.status === 'pendente' && t.is_realized) return false;
      if (filters.search) {
        const q = filters.search.trim().toLowerCase();
        const hay = `${t.name} ${t.description || ''} ${t.category_name || ''} ${t.bank_name || ''}`.toLowerCase();
        if (!hay.includes(q)) return false;
      }
      return true;
    });
  }, [transactions, filters]);

  const set = (patch: Partial<FormState>) => setForm((f) => ({ ...f, ...patch }));

  const openCreate = () => {
    setEditing(null);
    setForm({ ...emptyForm, date: new Date().toISOString().split('T')[0], due_date: new Date().toISOString().split('T')[0] });
    setFormError('');
    setModalOpen(true);
  };

  const openEdit = (t: FinancialTransaction) => {
    setEditing(t);
    setForm({
      name: t.name,
      type: t.type,
      amount: String(t.amount),
      category_id: t.category_id || '',
      bank_id: t.bank_id || '',
      card_id: t.card_id || '',
      client_id: t.client_id || '',
      due_date: t.due_date || '',
      paid_date: t.paid_date || '',
      date: t.date || '',
      description: t.description || '',
      is_realized: t.is_realized,
    });
    setFormError('');
    setModalOpen(true);
  };

  const submit = async () => {
    if (!form.name.trim()) {
      setFormError('Informe o nome do lançamento.');
      return;
    }
    const amount = Number(form.amount);
    if (!amount || isNaN(amount)) {
      setFormError('Informe um valor válido.');
      return;
    }
    // category (grupo) é NOT NULL no banco — deriva da categoria selecionada ou do tipo
    const categoryId = form.category_id;
    const categoryGroup = categories.find((c) => c.id === categoryId)?.category
      || (form.type === 'income' ? 'Entrada' : 'Custo Fixo');
    const payload = {
      name: form.name.trim(),
      type: form.type,
      amount,
      category: categoryGroup,
      category_id: form.category_id || null,
      bank_id: form.bank_id || null,
      card_id: form.card_id || null,
      client_id: form.client_id || null,
      due_date: form.due_date || null,
      paid_date: form.is_realized ? (form.paid_date || new Date().toISOString().split('T')[0]) : null,
      date: form.date || null,
      description: form.description || null,
      is_realized: form.is_realized,
    };
    setFormError('');
    try {
      if (editing) {
        await updateTx.mutateAsync({ id: editing.id, payload });
      } else {
        await createTx.mutateAsync(payload);
      }
      setModalOpen(false);
    } catch (e: any) {
      setFormError(e.message || 'Erro ao salvar lançamento.');
    }
  };

  const confirmDelete = async () => {
    if (!deleteTarget) return;
    try {
      await deleteTx.mutateAsync(deleteTarget.id);
      setDeleteTarget(null);
    } catch (e: any) {
      alert(e.message || 'Erro ao excluir.');
    }
  };

  const filteredCount = filtered.length;
  const totalFiltered = filtered.filter((t) => t.type === 'income').reduce((s, t) => s + t.amount, 0)
    - filtered.filter((t) => t.type === 'expense').reduce((s, t) => s + t.amount, 0);

  return (
    <div className="space-y-6">
      <FinNav />

      {/* Filtros (F1 — barra reutilizável estilo Notion) */}
      <Card className="p-4">
        <FinancialFilters
          value={filters}
          onChange={(next) => setFilters(next)}
          className="border-0 p-0 bg-transparent"
        />
        <div className="mt-3 flex flex-wrap items-center justify-between gap-2">
          <p className="text-xs text-slate-400">
            {filteredCount} lançamento{filteredCount === 1 ? '' : 's'} · saldo do filtro{' '}
            <span className={cn('font-bold', totalFiltered >= 0 ? 'text-emerald-400' : 'text-rose-400')}>
              {formatCurrency(totalFiltered)}
            </span>
          </p>
        </div>
      </Card>

      {/* Lista */}
      <Card>
        <CardHeader
          title="Lançamentos"
          subtitle="Cadastre e acompanhe receitas e despesas"
          action={
            <BtnPrimary onClick={openCreate}>
              <Plus className="w-4 h-4" /> Novo Lançamento
            </BtnPrimary>
          }
        />
        {isLoading ? (
          <Spinner />
        ) : filtered.length === 0 ? (
          <EmptyState message="Nenhum lançamento encontrado com os filtros atuais." icon={<LayoutList className="w-10 h-10" />} />
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="bg-white/[0.03] text-left">
                  <th className="px-5 py-3 text-xs font-semibold text-slate-400 uppercase">Nome</th>
                  <th className="px-5 py-3 text-xs font-semibold text-slate-400 uppercase">Categoria</th>
                  <th className="px-5 py-3 text-xs font-semibold text-slate-400 uppercase">Tipo</th>
                  <th className="px-5 py-3 text-xs font-semibold text-slate-400 uppercase">Vencimento</th>
                  <th className="px-5 py-3 text-xs font-semibold text-slate-400 uppercase">Conta / Cartão</th>
                  <th className="px-5 py-3 text-xs font-semibold text-slate-400 uppercase">Status</th>
                  <th className="px-5 py-3 text-xs font-semibold text-slate-400 uppercase text-right">Valor</th>
                  <th className="px-5 py-3 text-xs font-semibold text-slate-400 uppercase text-right">Ações</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-white/[0.05]">
                {filtered.map((t) => (
                  <tr key={t.id} className="hover:bg-white/[0.02] transition-colors">
                    <td className="px-5 py-3.5">
                      <div className="text-sm font-semibold text-white">{t.name}</div>
                      {t.description && <div className="text-[11px] text-slate-500 truncate max-w-[220px]">{t.description}</div>}
                    </td>
                    <td className="px-5 py-3.5 text-sm text-slate-300">{t.category_name || '-'}</td>
                    <td className="px-5 py-3.5">
                      {t.type === 'income' ? <Badge tone="emerald">Receita</Badge> : <Badge tone="rose">Despesa</Badge>}
                    </td>
                    <td className="px-5 py-3.5 text-sm text-slate-400">{formatDateBR(t.due_date || t.date)}</td>
                    <td className="px-5 py-3.5 text-sm text-slate-300">
                      {t.bank_name ? <span className="block">{t.bank_name}</span> : null}
                      {t.card_name ? <span className="block text-[11px] text-slate-500">{t.card_name}</span> : null}
                    </td>
                    <td className="px-5 py-3.5">
                      <button
                        onClick={() => toggleRealized.mutate({ id: t.id, is_realized: !t.is_realized })}
                        className={cn(
                          'inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-semibold border transition-all',
                          t.is_realized
                            ? 'bg-emerald-500/10 text-emerald-400 border-emerald-500/25 hover:bg-emerald-500/20'
                            : 'bg-amber-500/10 text-amber-400 border-amber-500/25 hover:bg-amber-500/20'
                        )}
                        title="Clique para alternar"
                      >
                        <CheckCircle2 className="w-3 h-3" />
                        {t.is_realized ? 'Realizado' : 'Pendente'}
                      </button>
                    </td>
                    <td className={cn('px-5 py-3.5 text-right text-sm font-bold whitespace-nowrap', t.type === 'income' ? 'text-emerald-400' : 'text-rose-400')}>
                      {t.type === 'income' ? '+' : '-'} {formatCurrency(t.amount)}
                    </td>
                    <td className="px-5 py-3.5">
                      <div className="flex items-center justify-end gap-1">
                        <IconBtn title="Editar" tone="accent" onClick={() => openEdit(t)}>
                          <Pencil className="w-3.5 h-3.5" />
                        </IconBtn>
                        <IconBtn title="Excluir" tone="danger" onClick={() => setDeleteTarget(t)}>
                          <Trash2 className="w-3.5 h-3.5" />
                        </IconBtn>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </Card>

      {/* Modal de criação/edição */}
      <Modal
        open={modalOpen}
        onClose={() => setModalOpen(false)}
        title={editing ? 'Editar Lançamento' : 'Novo Lançamento'}
        subtitle={editing ? `Editando: ${editing.name}` : 'Preencha os dados da transação'}
        wide
        footer={
          <>
            <BtnGhost onClick={() => setModalOpen(false)}>Cancelar</BtnGhost>
            <BtnPrimary onClick={submit} disabled={createTx.isPending || updateTx.isPending}>
              {editing ? 'Salvar alterações' : 'Criar lançamento'}
            </BtnPrimary>
          </>
        }
      >
        <div className="space-y-4">
          <ErrorNote message={formError} />
          <FormGrid>
            <TextInput label="Nome *" value={form.name} onChange={(e) => set({ name: e.target.value })} placeholder="Ex.: Comissão venda apto 302" />
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <SelectInput label="Tipo" value={form.type} onChange={(e) => set({ type: e.target.value as any })}>
                <option value="income" className="bg-[#0a0e15]">Receita (entrada)</option>
                <option value="expense" className="bg-[#0a0e15]">Despesa (saída)</option>
              </SelectInput>
              <TextInput label="Valor (R$) *" type="number" step="0.01" value={form.amount} onChange={(e) => set({ amount: e.target.value })} placeholder="0,00" />
            </div>
          </FormGrid>
          <FormGrid>
            <SelectInput label="Categoria" value={form.category_id} onChange={(e) => set({ category_id: e.target.value })}>
              <option value="" className="bg-[#0a0e15]">Selecionar...</option>
              {categories.map((c) => (
                <option key={c.id} value={c.id} className="bg-[#0a0e15]">{c.name} ({c.category})</option>
              ))}
            </SelectInput>
            <SelectInput label="Banco / Conta" value={form.bank_id} onChange={(e) => set({ bank_id: e.target.value })}>
              <option value="" className="bg-[#0a0e15]">Nenhum</option>
              {banks.map((b) => (
                <option key={b.id} value={b.id} className="bg-[#0a0e15]">{b.name}</option>
              ))}
            </SelectInput>
          </FormGrid>
          <FormGrid>
            <SelectInput label="Cartão" value={form.card_id} onChange={(e) => set({ card_id: e.target.value })}>
              <option value="" className="bg-[#0a0e15]">Nenhum</option>
              {cards.map((c) => (
                <option key={c.id} value={c.id} className="bg-[#0a0e15]">{c.name}</option>
              ))}
            </SelectInput>
            <SelectInput label="Cliente (ID, opcional)" value={form.client_id} onChange={(e) => set({ client_id: e.target.value })}>
              <option value="" className="bg-[#0a0e15]">Selecionar...</option>
              {leads.map((lead) => (
                <option key={lead.id} value={lead.id} className="bg-[#0a0e15]">{lead.name}</option>
              ))}
            </SelectInput>
          </FormGrid>
          <FormGrid>
            <TextInput label="Data" type="date" value={form.date} onChange={(e) => set({ date: e.target.value })} />
            <TextInput label="Vencimento" type="date" value={form.due_date} onChange={(e) => set({ due_date: e.target.value })} />
          </FormGrid>
          <TextAreaInput label="Descrição" value={form.description} onChange={(e) => set({ description: e.target.value })} placeholder="Detalhes opcionais do lançamento" />
          <label className="flex items-center gap-3 cursor-pointer">
            <input
              type="checkbox"
              checked={form.is_realized}
              onChange={(e) => set({ is_realized: e.target.checked })}
              className="w-4 h-4 accent-[#00FFCC]"
            />
            <span className="text-sm font-semibold text-slate-200">Lançamento realizado (já baixado)</span>
          </label>
        </div>
      </Modal>

      {/* Confirmar exclusão */}
      <ConfirmDelete
        open={!!deleteTarget}
        onCancel={() => setDeleteTarget(null)}
        onConfirm={confirmDelete}
        loading={deleteTx.isPending}
        title="Excluir lançamento"
        message={`Deseja realmente excluir o lançamento "${deleteTarget?.name}" no valor de ${formatCurrency(deleteTarget?.amount || 0)}? Esta ação não pode ser desfeita.`}
      />

      <div className="flex items-center justify-between gap-2 text-xs text-slate-500">
        <span className="inline-flex items-center gap-1.5">
          <TrendingUp className="w-3.5 h-3.5 text-emerald-400" /> Receita
        </span>
        <span className="inline-flex items-center gap-1.5">
          <TrendingDown className="w-3.5 h-3.5 text-rose-400" /> Despesa
        </span>
      </div>
    </div>
  );
}