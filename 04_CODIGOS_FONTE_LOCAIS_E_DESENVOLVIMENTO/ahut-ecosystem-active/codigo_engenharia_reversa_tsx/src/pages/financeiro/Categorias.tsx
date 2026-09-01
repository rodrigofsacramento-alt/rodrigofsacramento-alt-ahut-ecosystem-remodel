import React, { useState } from 'react';
import { Plus, Pencil, Trash2, Tags } from 'lucide-react';
import {
  useFinancialCategories,
  useCreateCategory,
  useUpdateCategory,
  useDeleteCategory,
} from '../../hooks/useFinancial';
import type { FinancialCategory } from '../../types/financeiro';
import { CATEGORY_TYPES } from '../../types/financeiro';
import {
  Card,
  CardHeader,
  Modal,
  ConfirmDelete,
  TextInput,
  SelectInput,
  BtnPrimary,
  BtnGhost,
  IconBtn,
  Badge,
  Spinner,
  EmptyState,
  ErrorNote,
} from './components/FinancialUI';
import FinNav from './components/FinNav';

const toneByCategory: Record<string, 'emerald' | 'rose' | 'amber' | 'cyan' | 'violet' | 'slate'> = {
  Entrada: 'emerald',
  'Custo Fixo': 'rose',
  'Custo Variável': 'amber',
  'Operação Financeira': 'cyan',
  Investimentos: 'violet',
  'Retirada Sócios': 'slate',
  'Aporte Sócios': 'emerald',
};

export default function Categorias() {
  const { data: categories = [], isLoading } = useFinancialCategories();
  const create = useCreateCategory();
  const update = useUpdateCategory();
  const del = useDeleteCategory();

  const [modalOpen, setModalOpen] = useState(false);
  const [editing, setEditing] = useState<FinancialCategory | null>(null);
  const [name, setName] = useState('');
  const [category, setCategory] = useState<(typeof CATEGORY_TYPES)[number]>(CATEGORY_TYPES[0]);
  const [ordem, setOrdem] = useState('');
  const [isActive, setIsActive] = useState(true);
  const [formError, setFormError] = useState('');
  const [deleteTarget, setDeleteTarget] = useState<FinancialCategory | null>(null);

  const openCreate = () => {
    setEditing(null);
    setName('');
    setCategory(CATEGORY_TYPES[0]);
    setOrdem(String(Math.max(0, ...categories.filter((c) => c.ordem != null).map((c) => c.ordem!)) + 1));
    setIsActive(true);
    setFormError('');
    setModalOpen(true);
  };

  const openEdit = (c: FinancialCategory) => {
    setEditing(c);
    setName(c.name);
    setCategory(c.category as (typeof CATEGORY_TYPES)[number]);
    setOrdem(c.ordem != null ? String(c.ordem) : '');
    setIsActive(c.is_active);
    setFormError('');
    setModalOpen(true);
  };

  const submit = async () => {
    if (!name.trim()) {
      setFormError('Informe o nome da categoria.');
      return;
    }
    setFormError('');
    const payload = {
      name: name.trim(),
      category,
      ordem: ordem ? Number(ordem) : null,
      is_active: isActive,
    };
    try {
      if (editing) await update.mutateAsync({ id: editing.id, payload });
      else await create.mutateAsync(payload);
      setModalOpen(false);
    } catch (e: any) {
      setFormError(e.message || 'Erro ao salvar categoria.');
    }
  };

  const confirmDelete = async () => {
    if (!deleteTarget) return;
    try {
      await del.mutateAsync(deleteTarget.id);
      setDeleteTarget(null);
    } catch (e: any) {
      alert(e.message || 'Erro ao excluir categoria.');
    }
  };

  return (
    <div className="space-y-6">
      <FinNav />

      <Card>
        <CardHeader
          title="Categorias"
          subtitle="Organize seus lançamentos por tipo e finalidade"
          action={
            <BtnPrimary onClick={openCreate}>
              <Plus className="w-4 h-4" /> Nova Categoria
            </BtnPrimary>
          }
        />
        {isLoading ? (
          <Spinner />
        ) : categories.length === 0 ? (
          <EmptyState message="Nenhuma categoria cadastrada." icon={<Tags className="w-10 h-10" />} />
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="bg-white/[0.03] text-left">
                  <th className="px-5 py-3 text-xs font-semibold text-slate-400 uppercase">Categoria</th>
                  <th className="px-5 py-3 text-xs font-semibold text-slate-400 uppercase">Tipo</th>
                  <th className="px-5 py-3 text-xs font-semibold text-slate-400 uppercase">Ordem</th>
                  <th className="px-5 py-3 text-xs font-semibold text-slate-400 uppercase">Status</th>
                  <th className="px-5 py-3 text-xs font-semibold text-slate-400 uppercase text-right">Ações</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-white/[0.05]">
                {categories.map((c) => (
                  <tr key={c.id} className="hover:bg-white/[0.02] transition-colors">
                    <td className="px-5 py-3.5">
                      <div className="flex items-center gap-2.5">
                        <div className="w-8 h-8 rounded-lg bg-white/5 border border-white/10 flex items-center justify-center text-slate-400">
                          <Tags className="w-4 h-4" />
                        </div>
                        <span className="text-sm font-semibold text-white">{c.name}</span>
                      </div>
                    </td>
                    <td className="px-5 py-3.5">
                      <Badge tone={toneByCategory[c.category] || 'slate'}>{c.category}</Badge>
                    </td>
                    <td className="px-5 py-3.5 text-sm text-slate-400">{c.ordem ?? '-'}</td>
                    <td className="px-5 py-3.5">
                      {c.is_active ? <Badge tone="emerald">Ativa</Badge> : <Badge tone="slate">Inativa</Badge>}
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
        title={editing ? 'Editar Categoria' : 'Nova Categoria'}
        footer={
          <>
            <BtnGhost onClick={() => setModalOpen(false)}>Cancelar</BtnGhost>
            <BtnPrimary onClick={submit} disabled={create.isPending || update.isPending}>
              {editing ? 'Salvar alterações' : 'Criar categoria'}
            </BtnPrimary>
          </>
        }
      >
        <div className="space-y-4">
          <ErrorNote message={formError} />
          <TextInput label="Nome da categoria *" value={name} onChange={(e) => setName(e.target.value)} placeholder="Ex.: Comissões, Aluguel, Energia..." autoFocus />
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <SelectInput label="Tipo" value={category} onChange={(e) => setCategory(e.target.value as (typeof CATEGORY_TYPES)[number])}>
              {CATEGORY_TYPES.map((t) => (
                <option key={t} value={t} className="bg-[#0a0e15]">{t}</option>
              ))}
            </SelectInput>
            <TextInput label="Ordem" type="number" value={ordem} onChange={(e) => setOrdem(e.target.value)} placeholder="Posição na listagem" />
          </div>
          <label className="flex items-center gap-3 cursor-pointer">
            <input type="checkbox" checked={isActive} onChange={(e) => setIsActive(e.target.checked)} className="w-4 h-4 accent-[#00FFCC]" />
            <span className="text-sm font-semibold text-slate-200">Categoria ativa</span>
          </label>
        </div>
      </Modal>

      <ConfirmDelete
        open={!!deleteTarget}
        onCancel={() => setDeleteTarget(null)}
        onConfirm={confirmDelete}
        loading={del.isPending}
        title="Excluir categoria"
        message={`Deseja excluir a categoria "${deleteTarget?.name}"? Lançamentos vinculados a ela podem ser afetados.`}
      />
    </div>
  );
}