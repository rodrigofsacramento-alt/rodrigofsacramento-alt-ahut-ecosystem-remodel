import React, { useState } from 'react';
import { Plus, Pencil, Trash2, CreditCard } from 'lucide-react';
import {
  useFinancialCards,
  useCreateCard,
  useUpdateCard,
  useDeleteCard,
} from '../../hooks/useFinancial';
import type { FinancialCard } from '../../types/financeiro';
import { formatCurrency } from '../../lib/utils';
import {
  Card,
  CardHeader,
  Modal,
  ConfirmDelete,
  TextInput,
  BtnPrimary,
  BtnGhost,
  IconBtn,
  Badge,
  Spinner,
  EmptyState,
  ErrorNote,
} from './components/FinancialUI';
import FinNav from './components/FinNav';

export default function Cartoes() {
  const { data: cards = [], isLoading } = useFinancialCards();
  const create = useCreateCard();
  const update = useUpdateCard();
  const del = useDeleteCard();

  const [modalOpen, setModalOpen] = useState(false);
  const [editing, setEditing] = useState<FinancialCard | null>(null);
  const [name, setName] = useState('');
  const [creditLimit, setCreditLimit] = useState('');
  const [dueDay, setDueDay] = useState('');
  const [isActive, setIsActive] = useState(true);
  const [formError, setFormError] = useState('');
  const [deleteTarget, setDeleteTarget] = useState<FinancialCard | null>(null);

  const openCreate = () => {
    setEditing(null);
    setName('');
    setCreditLimit('');
    setDueDay('');
    setIsActive(true);
    setFormError('');
    setModalOpen(true);
  };

  const openEdit = (c: FinancialCard) => {
    setEditing(c);
    setName(c.name);
    setCreditLimit(c.credit_limit ? String(c.credit_limit) : '');
    setDueDay(c.due_day != null ? String(c.due_day) : '');
    setIsActive(c.is_active);
    setFormError('');
    setModalOpen(true);
  };

  const submit = async () => {
    if (!name.trim()) {
      setFormError('Informe o nome do cartão.');
      return;
    }
    const dayNum = dueDay ? Number(dueDay) : null;
    if (dueDay && (isNaN(dayNum!) || dayNum! < 1 || dayNum! > 31)) {
      setFormError('Dia de vencimento deve estar entre 1 e 31.');
      return;
    }
    setFormError('');
    const payload = {
      name: name.trim(),
      credit_limit: creditLimit ? Number(creditLimit) || 0 : 0,
      due_day: dueDay ? Number(dueDay) : null,
      is_active: isActive,
    };
    try {
      if (editing) await update.mutateAsync({ id: editing.id, payload });
      else await create.mutateAsync(payload);
      setModalOpen(false);
    } catch (e: any) {
      setFormError(e.message || 'Erro ao salvar cartão.');
    }
  };

  const confirmDelete = async () => {
    if (!deleteTarget) return;
    try {
      await del.mutateAsync(deleteTarget.id);
      setDeleteTarget(null);
    } catch (e: any) {
      alert(e.message || 'Erro ao excluir cartão.');
    }
  };

  const totalLimit = cards.reduce((s, c) => s + (c.credit_limit || 0), 0);

  return (
    <div className="space-y-6">
      <FinNav />

      <div className="rounded-2xl bg-white/[0.03] border border-white/[0.07] p-5 flex items-center gap-4">
        <div className="w-11 h-11 rounded-xl bg-violet-500/10 border border-violet-500/25 flex items-center justify-center text-violet-300">
          <CreditCard className="w-5 h-5" />
        </div>
        <div>
          <p className="text-xs font-bold text-slate-400 uppercase">Limite total disponível</p>
          <p className="text-2xl font-bold text-white">{formatCurrency(totalLimit)}</p>
        </div>
      </div>

      <Card>
        <CardHeader
          title="Cartões de Crédito"
          subtitle="Gerencie limites, vencimentos e status"
          action={
            <BtnPrimary onClick={openCreate}>
              <Plus className="w-4 h-4" /> Novo Cartão
            </BtnPrimary>
          }
        />
        {isLoading ? (
          <Spinner />
        ) : cards.length === 0 ? (
          <EmptyState message="Nenhum cartão cadastrado." icon={<CreditCard className="w-10 h-10" />} />
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="bg-white/[0.03] text-left">
                  <th className="px-5 py-3 text-xs font-semibold text-slate-400 uppercase">Cartão</th>
                  <th className="px-5 py-3 text-xs font-semibold text-slate-400 uppercase">Limite</th>
                  <th className="px-5 py-3 text-xs font-semibold text-slate-400 uppercase">Dia Vencimento</th>
                  <th className="px-5 py-3 text-xs font-semibold text-slate-400 uppercase">Status</th>
                  <th className="px-5 py-3 text-xs font-semibold text-slate-400 uppercase text-right">Ações</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-white/[0.05]">
                {cards.map((c) => (
                  <tr key={c.id} className="hover:bg-white/[0.02] transition-colors">
                    <td className="px-5 py-3.5">
                      <div className="flex items-center gap-2.5">
                        <div className="w-8 h-8 rounded-lg bg-white/5 border border-white/10 flex items-center justify-center text-slate-400">
                          <CreditCard className="w-4 h-4" />
                        </div>
                        <span className="text-sm font-semibold text-white">{c.name}</span>
                      </div>
                    </td>
                    <td className="px-5 py-3.5 text-sm font-bold text-white">
                      {formatCurrency(c.credit_limit || 0)}
                    </td>
                    <td className="px-5 py-3.5 text-sm text-slate-300">
                      {c.due_day != null ? `Dia ${c.due_day}` : '-'}
                    </td>
                    <td className="px-5 py-3.5">
                      {c.is_active ? <Badge tone="emerald">Ativo</Badge> : <Badge tone="slate">Inativo</Badge>}
                    </td>
                    <td className="px-5 py-3.5">
                      <div className="flex items-center justify-end gap-1">
                        <IconBtn title="Editar" tone="accent" onClick={() => openEdit(c)}>
                          <Pencil className="w-3.5 h-3.5" />
                        </IconBtn>
                        <IconBtn title="Excluir" tone="danger" onClick={() => setDeleteTarget(c)}>
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

      <Modal
        open={modalOpen}
        onClose={() => setModalOpen(false)}
        title={editing ? 'Editar Cartão' : 'Novo Cartão'}
        footer={
          <>
            <BtnGhost onClick={() => setModalOpen(false)}>Cancelar</BtnGhost>
            <BtnPrimary onClick={submit} disabled={create.isPending || update.isPending}>
              {editing ? 'Salvar alterações' : 'Criar cartão'}
            </BtnPrimary>
          </>
        }
      >
        <div className="space-y-4">
          <ErrorNote message={formError} />
          <TextInput label="Nome do cartão *" value={name} onChange={(e) => setName(e.target.value)} placeholder="Ex.: Nubank Mastercard" autoFocus />
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <TextInput label="Limite (R$)" type="number" step="0.01" value={creditLimit} onChange={(e) => setCreditLimit(e.target.value)} placeholder="0,00" />
            <TextInput label="Dia de vencimento" type="number" min={1} max={31} value={dueDay} onChange={(e) => setDueDay(e.target.value)} placeholder="Ex.: 15" />
          </div>
          <label className="flex items-center gap-3 cursor-pointer">
            <input type="checkbox" checked={isActive} onChange={(e) => setIsActive(e.target.checked)} className="w-4 h-4 accent-[#00FFCC]" />
            <span className="text-sm font-semibold text-slate-200">Cartão ativo</span>
          </label>
        </div>
      </Modal>

      <ConfirmDelete
        open={!!deleteTarget}
        onCancel={() => setDeleteTarget(null)}
        onConfirm={confirmDelete}
        loading={del.isPending}
        title="Excluir cartão"
        message={`Deseja excluir o cartão "${deleteTarget?.name}"? Esta ação não pode ser desfeita.`}
      />
    </div>
  );
}