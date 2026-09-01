import React, { useState } from 'react';
import { Plus, Pencil, Trash2, Landmark } from 'lucide-react';
import {
  useFinancialBanks,
  useCreateBank,
  useUpdateBank,
  useDeleteBank,
  useBankSaldos,
} from '../../hooks/useFinancial';
import type { FinancialBank } from '../../types/financeiro';
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

export default function Bancos() {
  const { data: banks = [], isLoading } = useFinancialBanks();
  const { data: saldos = [] } = useBankSaldos();
  const create = useCreateBank();
  const update = useUpdateBank();
  const del = useDeleteBank();

  const [modalOpen, setModalOpen] = useState(false);
  const [editing, setEditing] = useState<FinancialBank | null>(null);
  const [name, setName] = useState('');
  const [isActive, setIsActive] = useState(true);
  const [formError, setFormError] = useState('');
  const [deleteTarget, setDeleteTarget] = useState<FinancialBank | null>(null);

  const saldoByBank = new Map(saldos.map((s) => [s.bank_id, s.saldo]));
  const totalSaldo = saldos.reduce((s, x) => s + x.saldo, 0);

  const openCreate = () => {
    setEditing(null);
    setName('');
    setIsActive(true);
    setFormError('');
    setModalOpen(true);
  };

  const openEdit = (b: FinancialBank) => {
    setEditing(b);
    setName(b.name);
    setIsActive(b.is_active);
    setFormError('');
    setModalOpen(true);
  };

  const submit = async () => {
    if (!name.trim()) {
      setFormError('Informe o nome do banco.');
      return;
    }
    setFormError('');
    const payload = { name: name.trim(), is_active: isActive };
    try {
      if (editing) await update.mutateAsync({ id: editing.id, payload });
      else await create.mutateAsync(payload);
      setModalOpen(false);
    } catch (e: any) {
      setFormError(e.message || 'Erro ao salvar banco.');
    }
  };

  const confirmDelete = async () => {
    if (!deleteTarget) return;
    try {
      await del.mutateAsync(deleteTarget.id);
      setDeleteTarget(null);
    } catch (e: any) {
      alert(e.message || 'Erro ao excluir banco.');
    }
  };

  return (
    <div className="space-y-6">
      <FinNav />

      {/* Resumo de saldo */}
      <div className="rounded-2xl bg-white/[0.03] border border-white/[0.07] p-5 flex items-center gap-4">
        <div className="w-11 h-11 rounded-xl bg-emerald-500/10 border border-emerald-500/25 flex items-center justify-center text-[#00FFCC]">
          <Landmark className="w-5 h-5" />
        </div>
        <div>
          <p className="text-xs font-bold text-slate-400 uppercase">Saldo total em contas</p>
          <p className="text-2xl font-bold text-white">{formatCurrency(totalSaldo)}</p>
        </div>
      </div>

      <Card>
        <CardHeader
          title="Bancos & Contas"
          subtitle="Gerencie suas contas bancárias"
          action={
            <BtnPrimary onClick={openCreate}>
              <Plus className="w-4 h-4" /> Novo Banco
            </BtnPrimary>
          }
        />
        {isLoading ? (
          <Spinner />
        ) : banks.length === 0 ? (
          <EmptyState message="Nenhum banco cadastrado ainda." icon={<Landmark className="w-10 h-10" />} />
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="bg-white/[0.03] text-left">
                  <th className="px-5 py-3 text-xs font-semibold text-slate-400 uppercase">Banco</th>
                  <th className="px-5 py-3 text-xs font-semibold text-slate-400 uppercase">Saldo (vista)</th>
                  <th className="px-5 py-3 text-xs font-semibold text-slate-400 uppercase">Status</th>
                  <th className="px-5 py-3 text-xs font-semibold text-slate-400 uppercase text-right">Ações</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-white/[0.05]">
                {banks.map((b) => (
                  <tr key={b.id} className="hover:bg-white/[0.02] transition-colors">
                    <td className="px-5 py-3.5">
                      <div className="flex items-center gap-2.5">
                        <div className="w-8 h-8 rounded-lg bg-white/5 border border-white/10 flex items-center justify-center text-slate-400">
                          <Landmark className="w-4 h-4" />
                        </div>
                        <span className="text-sm font-semibold text-white">{b.name}</span>
                      </div>
                    </td>
                    <td className="px-5 py-3.5 text-sm font-bold text-white">
                      {formatCurrency(saldoByBank.get(b.id) ?? 0)}
                    </td>
                    <td className="px-5 py-3.5">
                      {b.is_active ? <Badge tone="emerald">Ativo</Badge> : <Badge tone="slate">Inativo</Badge>}
                    </td>
                    <td className="px-5 py-3.5">
                      <div className="flex items-center justify-end gap-1">
                        <IconBtn title="Editar" tone="accent" onClick={() => openEdit(b)}>
                          <Pencil className="w-3.5 h-3.5" />
                        </IconBtn>
                        <IconBtn title="Excluir" tone="danger" onClick={() => setDeleteTarget(b)}>
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
        title={editing ? 'Editar Banco' : 'Novo Banco'}
        footer={
          <>
            <BtnGhost onClick={() => setModalOpen(false)}>Cancelar</BtnGhost>
            <BtnPrimary onClick={submit} disabled={create.isPending || update.isPending}>
              {editing ? 'Salvar alterações' : 'Criar banco'}
            </BtnPrimary>
          </>
        }
      >
        <div className="space-y-4">
          <ErrorNote message={formError} />
          <TextInput label="Nome do banco *" value={name} onChange={(e) => setName(e.target.value)} placeholder="Ex.: Itaú, Nubank, Banco do Brasil..." autoFocus />
          <label className="flex items-center gap-3 cursor-pointer">
            <input type="checkbox" checked={isActive} onChange={(e) => setIsActive(e.target.checked)} className="w-4 h-4 accent-[#00FFCC]" />
            <span className="text-sm font-semibold text-slate-200">Banco ativo</span>
          </label>
        </div>
      </Modal>

      <ConfirmDelete
        open={!!deleteTarget}
        onCancel={() => setDeleteTarget(null)}
        onConfirm={confirmDelete}
        loading={del.isPending}
        title="Excluir banco"
        message={`Deseja excluir o banco "${deleteTarget?.name}"? Lançamentos vinculados a ele podem ser afetados.`}
      />
    </div>
  );
}