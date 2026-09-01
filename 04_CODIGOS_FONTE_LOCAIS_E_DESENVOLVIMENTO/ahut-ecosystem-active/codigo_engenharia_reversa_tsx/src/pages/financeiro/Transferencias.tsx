import React, { useState } from 'react';
import { Plus, Pencil, Trash2, ArrowLeftRight } from 'lucide-react';
import {
  useFinancialTransfers,
  useFinancialBanks,
  useCreateTransfer,
  useUpdateTransfer,
  useDeleteTransfer,
} from '../../hooks/useFinancial';
import type { FinancialTransfer } from '../../types/financeiro';
import { formatCurrency } from '../../lib/utils';
import {
  Card,
  CardHeader,
  Modal,
  ConfirmDelete,
  TextInput,
  SelectInput,
  TextAreaInput,
  BtnPrimary,
  BtnGhost,
  IconBtn,
  Spinner,
  EmptyState,
  ErrorNote,
  formatDateBR,
} from './components/FinancialUI';
import FinNav from './components/FinNav';

export default function Transferencias() {
  const { data: transfers = [], isLoading } = useFinancialTransfers();
  const { data: banks = [] } = useFinancialBanks();
  const create = useCreateTransfer();
  const update = useUpdateTransfer();
  const del = useDeleteTransfer();

  const [modalOpen, setModalOpen] = useState(false);
  const [editing, setEditing] = useState<FinancialTransfer | null>(null);
  const [fromBank, setFromBank] = useState('');
  const [toBank, setToBank] = useState('');
  const [amount, setAmount] = useState('');
  const [transferDate, setTransferDate] = useState('');
  const [note, setNote] = useState('');
  const [formError, setFormError] = useState('');
  const [deleteTarget, setDeleteTarget] = useState<FinancialTransfer | null>(null);
  const [confirmPendError, setConfirmPendError] = useState(false);

  const openCreate = () => {
    setEditing(null);
    setFromBank('');
    setToBank('');
    setAmount('');
    setTransferDate(new Date().toISOString().split('T')[0]);
    setNote('');
    setFormError('');
    setModalOpen(true);
  };

  const openEdit = (t: FinancialTransfer) => {
    setEditing(t);
    setFromBank(t.from_bank_id || '');
    setToBank(t.to_bank_id || '');
    setAmount(String(t.amount));
    setTransferDate(t.transfer_date || '');
    setNote(t.note || '');
    setFormError('');
    setModalOpen(true);
  };

  const submit = async () => {
    const amt = Number(amount);
    if (!fromBank || !toBank) {
      setFormError('Selecione a conta de origem e a de destino.');
      return;
    }
    if (fromBank === toBank) {
      setFormError('As contas de origem e destino devem ser diferentes.');
      return;
    }
    if (!amt || isNaN(amt)) {
      setFormError('Informe um valor válido.');
      return;
    }
    setConfirmPendError(false);
    setFormError('');
    const payload = {
      from_bank_id: fromBank,
      to_bank_id: toBank,
      amount: amt,
      transfer_date: transferDate || null,
      note: note || null,
    };
    try {
      if (editing) await update.mutateAsync({ id: editing.id, payload });
      else await create.mutateAsync(payload);
      setModalOpen(false);
    } catch (e: any) {
      setFormError(e.message || 'Erro ao salvar transferência.');
    }
  };

  const confirmDelete = async () => {
    if (!deleteTarget) return;
    try {
      await del.mutateAsync(deleteTarget.id);
      setDeleteTarget(null);
    } catch (e: any) {
      alert(e.message || 'Erro ao excluir transferência.');
    }
  };

  const totalMovimentado = transfers.reduce((s, t) => s + t.amount, 0);

  return (
    <div className="space-y-6">
      <FinNav />

      <div className="rounded-2xl bg-white/[0.03] border border-white/[0.07] p-5 flex items-center gap-4">
        <div className="w-11 h-11 rounded-xl bg-cyan-500/10 border border-cyan-500/25 flex items-center justify-center text-cyan-300">
          <ArrowLeftRight className="w-5 h-5" />
        </div>
        <div>
          <p className="text-xs font-bold text-slate-400 uppercase">Total transferido entre contas</p>
          <p className="text-2xl font-bold text-white">{formatCurrency(totalMovimentado)}</p>
        </div>
      </div>

      <Card>
        <CardHeader
          title="Transferências"
          subtitle="Movimentações entre contas bancárias"
          action={
            <BtnPrimary onClick={openCreate}>
              <Plus className="w-4 h-4" /> Nova Transferência
            </BtnPrimary>
          }
        />
        {isLoading ? (
          <Spinner />
        ) : transfers.length === 0 ? (
          <EmptyState message="Nenhuma transferência registrada." icon={<ArrowLeftRight className="w-10 h-10" />} />
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="bg-white/[0.03] text-left">
                  <th className="px-5 py-3 text-xs font-semibold text-slate-400 uppercase">Origem</th>
                  <th className="px-5 py-3 text-xs font-semibold text-slate-400 uppercase">Destino</th>
                  <th className="px-5 py-3 text-xs font-semibold text-slate-400 uppercase">Data</th>
                  <th className="px-5 py-3 text-xs font-semibold text-slate-400 uppercase">Observação</th>
                  <th className="px-5 py-3 text-xs font-semibold text-slate-400 uppercase text-right">Valor</th>
                  <th className="px-5 py-3 text-xs font-semibold text-slate-400 uppercase text-right">Ações</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-white/[0.05]">
                {transfers.map((t) => (
                  <tr key={t.id} className="hover:bg-white/[0.02] transition-colors">
                    <td className="px-5 py-3.5 text-sm font-semibold text-white">{t.from_bank_name || '-'}</td>
                    <td className="px-5 py-3.5">
                      <span className="inline-flex items-center gap-1.5 text-sm text-slate-300">
                        <ArrowLeftRight className="w-3.5 h-3.5 text-cyan-400" />
                        {t.to_bank_name || '-'}
                      </span>
                    </td>
                    <td className="px-5 py-3.5 text-sm text-slate-400">{formatDateBR(t.transfer_date)}</td>
                    <td className="px-5 py-3.5 text-sm text-slate-400 truncate max-w-[200px]">{t.note || '-'}</td>
                    <td className="px-5 py-3.5 text-right text-sm font-bold text-cyan-300 whitespace-nowrap">
                      {formatCurrency(t.amount)}
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

      <Modal
        open={modalOpen}
        onClose={() => setModalOpen(false)}
        title={editing ? 'Editar Transferência' : 'Nova Transferência'}
        wide
        footer={
          <>
            <BtnGhost onClick={() => setModalOpen(false)}>Cancelar</BtnGhost>
            <BtnPrimary onClick={submit} disabled={create.isPending || update.isPending}>
              {editing ? 'Salvar alterações' : 'Registrar transferência'}
            </BtnPrimary>
          </>
        }
      >
        <div className="space-y-4">
          <ErrorNote message={formError} />
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <SelectInput label="Conta de origem *" value={fromBank} onChange={(e) => setFromBank(e.target.value)}>
              <option value="" className="bg-[#0a0e15]">Selecionar...</option>
              {banks.map((b) => (
                <option key={b.id} value={b.id} className="bg-[#0a0e15]">{b.name}</option>
              ))}
            </SelectInput>
            <SelectInput label="Conta de destino *" value={toBank} onChange={(e) => setToBank(e.target.value)}>
              <option value="" className="bg-[#0a0e15]">Selecionar...</option>
              {banks.map((b) => (
                <option key={b.id} value={b.id} className="bg-[#0a0e15]">{b.name}</option>
              ))}
            </SelectInput>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <TextInput label="Valor (R$) *" type="number" step="0.01" value={amount} onChange={(e) => setAmount(e.target.value)} placeholder="0,00" />
            <TextInput label="Data da transferência" type="date" value={transferDate} onChange={(e) => setTransferDate(e.target.value)} />
          </div>
          <TextAreaInput label="Observação" value={note} onChange={(e) => setNote(e.target.value)} placeholder="Nota opcional sobre a transferência" />
          {confirmPendError && <ErrorNote message="Confira os valores selecionados." />}
        </div>
      </Modal>

      <ConfirmDelete
        open={!!deleteTarget}
        onCancel={() => setDeleteTarget(null)}
        onConfirm={confirmDelete}
        loading={del.isPending}
        title="Excluir transferência"
        message={`Deseja excluir esta transferência de ${formatCurrency(deleteTarget?.amount || 0)}? Esta ação não pode ser desfeita.`}
      />
    </div>
  );
}