import React, { useState, useMemo } from 'react';
import {
  Scale,
  Search,
  Plus,
  FileText,
  FileCheck,
  FileSignature,
  Download,
  Upload,
  ShieldCheck,
  CheckCircle2,
  Clock,
  Hourglass,
  AlertCircle,
  ChevronRight,
  User,
  Landmark,
  StickyNote,
  X,
  MessageSquare,
  ScrollText,
  Gavel,
  TrendingUp,
} from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { cn, formatCurrency } from '../lib/utils';

/* ============================================================================
   ENGENHARIA REVERSA — Juridico-C5My9t3I.js (produção)
   String/features extraídas:
   - Etapas: Proposta → Jurídico → Documentação → Assinatura → Entrega
   - Checklist de Validação: Documentos do Comprador, Certidões Negativas
     (cíveis, trabalhistas e fiscais), Matrícula Atualizada do Imóvel,
     Aprovação da Minuta do Contrato, Assinatura Digital
   - Tipos de contrato: Compra e Venda, Locação, Permuta, Cessão de Direitos, Distrato
   - Status: Em Análise, Em Andamento, Aprovado, Aguardando Fechamento
   - Comissão (5%), Advogado Responsável, Observações
   - Ações: Anexar / Baixar / Aprovar / reprovar · Confirmar Assinatura e Venda
     · REGISTRO DE VENDA / Venda Finalizada
   ============================================================================ */

type ProcessStatus =
  | 'Em Análise'
  | 'Em Andamento'
  | 'Aprovado'
  | 'Aguardando Fechamento'
  | 'Aprovados';

type ProcessType = 'Compra e Venda' | 'Cessão de Direitos' | 'Distrato';

interface LegalProcess {
  id: string;
  numero: string;
  cliente: string;
  compradorLocatario: string;
  advogadoResponsavel: string;
  tipo: ProcessType;
  comissao: number;
  valor: number;
  status: ProcessStatus;
  etapa: number; // 0-Proposta 1-Jurídico 2-Documentação 3-Assinatura 4-Entrega
  criadoEm: string;
  observacoes?: string;
}

interface ChecklistDoc {
  id: string;
  title: string;
  icon: React.ElementType;
  approved: boolean;
  files: { name: string; status: 'Aprovado' | 'Pendente' }[];
}

const ETAPAS = [
  { label: 'Proposta', icon: FileText },
  { label: 'Jurídico', icon: Gavel },
  { label: 'Documentação', icon: FileCheck },
  { label: 'Assinatura', icon: FileSignature },
  { label: 'Entrega', icon: Landmark },
];

const STATUS_META: Record<ProcessStatus, { color: string; dot: string }> = {
  'Em Análise': { color: 'text-cyan-500 bg-blue-500/10 border-blue-500/20', dot: 'bg-blue-500' },
  'Em Andamento': { color: 'text-amber-400 bg-amber-500/10 border-amber-500/20', dot: 'bg-amber-500' },
  Aprovado: { color: 'text-emerald-600 bg-emerald-500/10 border-emerald-500/20', dot: 'bg-emerald-500' },
  'Aguardando Fechamento': { color: 'text-violet-600 bg-violet-500/10 border-violet-500/20', dot: 'bg-violet-500' },
  Aprovados: { color: 'text-cyan-500 bg-indigo-500/10 border-indigo-500/20', dot: 'bg-indigo-500' },
};

/* Dados mock locais (sem backend) — estilo compatível com os demais componentes */
const MOCK_PROCESSOS: LegalProcess[] = [
  {
    id: 'p1', numero: 'PROP-001', cliente: 'Mariana Souza', compradorLocatario: 'Rafael Lima',
    advogadoResponsavel: 'Dr. Silvio Santos', tipo: 'Compra e Venda', comissao: 5,
    valor: 1250000, status: 'Em Andamento', etapa: 2, criadoEm: '2026-08-12',
    observacoes: 'Imóvel no Jardim Europa. Aguardando certidões do cartório.',
  },
  {
    id: 'p2', numero: 'PROP-002', cliente: 'Carlos Pereira', compradorLocatario: 'Juliana Alves',
    advogadoResponsavel: 'Dr. Marta Rocha', tipo: 'Cessão de Direitos', comissao: 5,
    valor: 690000, status: 'Em Análise', etapa: 0, criadoEm: '2026-08-18',
  },
  {
    id: 'p3', numero: 'PROP-003', cliente: 'Fernanda Costa', compradorLocatario: 'André Ferreira',
    advogadoResponsavel: 'Dr. Silvio Santos', tipo: 'Compra e Venda', comissao: 5,
    valor: 870000, status: 'Aprovado', etapa: 3, criadoEm: '2026-08-02',
    observacoes: 'Minuta aprovada, aguardando assinatura digital.',
  },
  {
    id: 'p4', numero: 'PROP-004', cliente: 'Ricardo Nunes', compradorLocatario: 'Beatriz Ramos',
    advogadoResponsavel: 'Dr. Marta Rocha', tipo: 'Distrato', comissao: 5,
    valor: 340000, status: 'Aguardando Fechamento', etapa: 4, criadoEm: '2026-07-28',
  },
  {
    id: 'p5', numero: 'PROP-005', cliente: 'Patrícia Mendes', compradorLocatario: 'Gustavo Dias',
    advogadoResponsavel: 'Dr. Silvio Santos', tipo: 'Cessão de Direitos', comissao: 5,
    valor: 510000, status: 'Aprovados', etapa: 4, criadoEm: '2026-07-15',
  },
];

const MOCK_DOCS: Record<string, ChecklistDoc[]> = {
  p1: [
    { id: 'c1', title: 'Documentos do Comprador — RG, CPF, comprovante de renda e endereço', icon: FileText, approved: true, files: [{ name: 'rg_mariana.pdf', status: 'Aprovado' }] },
    { id: 'c2', title: 'Certidões Negativas — cíveis, trabalhistas e fiscais', icon: ShieldCheck, approved: false, files: [] },
    { id: 'c3', title: 'Matrícula Atualizada do Imóvel — cartório de registro', icon: ScrollText, approved: true, files: [{ name: 'matricula_1250.pdf', status: 'Aprovado' }] },
    { id: 'c4', title: 'Aprovação da Minuta do Contrato — revisão e aprovação jurídica', icon: FileCheck, approved: false, files: [{ name: 'minuta_v3.docx', status: 'Pendente' }] },
    { id: 'c5', title: 'Assinatura Digital — assinatura eletrônica das partes', icon: FileSignature, approved: false, files: [] },
  ],
  p3: [
    { id: 'c1', title: 'Documentos do Comprador — RG, CPF, comprovante de renda e endereço', icon: FileText, approved: true, files: [{ name: 'rg_andre.pdf', status: 'Aprovado' }] },
    { id: 'c2', title: 'Certidões Negativas — cíveis, trabalhistas e fiscais', icon: ShieldCheck, approved: true, files: [{ name: 'certidoes_andre.pdf', status: 'Aprovado' }] },
    { id: 'c3', title: 'Matrícula Atualizada do Imóvel — cartório de registro', icon: ScrollText, approved: true, files: [{ name: 'matricula_870.pdf', status: 'Aprovado' }] },
    { id: 'c4', title: 'Aprovação da Minuta do Contrato — revisão e aprovação jurídica', icon: FileCheck, approved: true, files: [{ name: 'minuta_aprovada.pdf', status: 'Aprovado' }] },
    { id: 'c5', title: 'Assinatura Digital — assinatura eletrônica das partes', icon: FileSignature, approved: false, files: [] },
  ],
};

export default function Juridico() {
  const [searchTerm, setSearchTerm] = useState('');
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [selectedProcess, setSelectedProcess] = useState<LegalProcess | null>(null);
  const [processos, setProcessos] = useState<LegalProcess[]>(MOCK_PROCESSOS);
  const [activeTab, setActiveTab] = useState<'checklist' | 'juridico' | 'assinatura'>('checklist');

  // Modal "Criar Processo"
  const [form, setForm] = useState({
    cliente: '',
    compradorLocatario: '',
    advogadoResponsavel: '',
    tipo: 'Compra e Venda' as ProcessType,
    comissao: 5,
    valor: 0,
    observacoes: '',
  });

  const filtered = useMemo(
    () =>
      processos.filter(
        (p) =>
          p.cliente.toLowerCase().includes(searchTerm.toLowerCase()) ||
          p.numero.toLowerCase().includes(searchTerm.toLowerCase()) ||
          p.compradorLocatario.toLowerCase().includes(searchTerm.toLowerCase()),
      ),
    [processos, searchTerm],
  );

  const totalValue = processos.reduce((s, p) => s + p.valor, 0);

  const openCreate = () => {
    setForm({ cliente: '', compradorLocatario: '', advogadoResponsavel: '', tipo: 'Compra e Venda', comissao: 5, valor: 0, observacoes: '' });
    setIsModalOpen(true);
  };

  const handleCreate = (e: React.FormEvent) => {
    e.preventDefault();
    const novo: LegalProcess = {
      id: `p${Date.now()}`,
      numero: `PROP-${String(processos.length + 1).padStart(3, '0')}`,
      cliente: form.cliente,
      compradorLocatario: form.compradorLocatario,
      advogadoResponsavel: form.advogadoResponsavel,
      tipo: form.tipo,
      comissao: form.comissao,
      valor: form.valor,
      status: 'Em Análise',
      etapa: 0,
      criadoEm: new Date().toISOString().slice(0, 10),
      observacoes: form.observacoes || undefined,
    };
    setProcessos((prev) => [novo, ...prev]);
    setIsModalOpen(false);
  };

  const docs = selectedProcess ? MOCK_DOCS[selectedProcess.id] ?? [] : [];
  const approvedCount = docs.filter((d) => d.approved).length;
  const progress = docs.length > 0 ? Math.round((approvedCount / docs.length) * 100) : 0;

  return (
    <div className="space-y-6">
      {/* Cabeçalho + ações */}
      <div className="flex items-center justify-between gap-4 flex-wrap">
        <div>
          <h2 className="text-xl font-bold text-white flex items-center gap-2">
            <Scale className="w-6 h-6 text-cyan-500" />
            Processos Jurídicos
          </h2>
          <p className="text-sm text-slate-400">Gerencie processos jurídicos e contratos · Comissão padrão 5%</p>
        </div>
        <button
          onClick={openCreate}
          className="bg-cyan-500 hover:bg-cyan-600 text-white px-4 py-2 rounded-lg text-sm font-bold flex items-center gap-2 transition-colors"
        >
          <Plus className="w-4 h-4" />
          Novo Processo
        </button>
      </div>

      {/* Cards de resumo */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <SummaryCard icon={FileText} label="Total de Processos" value={String(processos.length)} bg="bg-cyan-500" />
        <SummaryCard icon={Hourglass} label="Em Análise" value={String(processos.filter((p) => p.status === 'Em Análise').length)} bg="bg-blue-500" />
        <SummaryCard icon={CheckCircle2} label="Aprovados" value={String(processos.filter((p) => p.status === 'Aprovado' || p.status === 'Aprovados').length)} bg="bg-emerald-500" />
        <SummaryCard icon={TrendingUp} label="Valor Total" value={formatCurrency(totalValue)} bg="bg-violet-500" />
      </div>

      {/* Busca funcional */}
      <div className="relative max-w-md">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
        <input
          type="text"
          placeholder="Buscar por cliente ou número do processo..."
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          className="w-full bg-white/5 border border-cyan-900/30 rounded-lg py-2.5 pl-10 pr-4 text-sm focus:ring-1 focus:ring-cyan-500 outline-none text-white"
        />
      </div>

      {/* Lista de processos / cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
        {filtered.map((p) => {
          const meta = STATUS_META[p.status];
          return (
            <motion.button
              key={p.id}
              layout
              initial={{ opacity: 0, y: 8 }}
              animate={{ opacity: 1, y: 0 }}
              onClick={() => setSelectedProcess(p)}
              className="text-left glass-neon-card shadow-sm hover:shadow-md hover:border-cyan-500/30 p-5 transition-all"
            >
              <div className="flex items-start justify-between gap-2">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-full bg-cyan-500/20 flex items-center justify-center font-bold text-sm text-cyan-400">
                    {p.cliente.split(' ').map((w) => w[0]).join('').slice(0, 2).toUpperCase()}
                  </div>
                  <div>
                    <p className="font-semibold text-white">{p.cliente}</p>
                    <p className="text-xs text-slate-400">{p.numero}</p>
                  </div>
                </div>
                <span className={cn('text-[11px] font-bold px-2 py-1 rounded-full border', meta.color)}>
                  {p.status}
                </span>
              </div>

              <div className="mt-3 space-y-1.5 text-sm">
                <p className="text-slate-300"><span className="text-slate-400">Comprador/Locatário:</span> {p.compradorLocatario}</p>
                <p className="text-slate-300"><span className="text-slate-400">Tipo:</span> {p.tipo}</p>
                <p className="text-slate-300"><span className="text-slate-400">Advogado:</span> {p.advogadoResponsavel}</p>
                <p className="text-slate-300"><span className="text-slate-400">Comissão:</span> {p.comissao}% · {formatCurrency(p.valor * p.comissao / 100)}</p>
              </div>

              {/* Barra de etapas */}
              <div className="mt-4">
                <div className="flex gap-1.5">
                  {ETAPAS.map((et, i) => (
                    <div
                      key={et.label}
                      className={cn(
                        'flex-1 h-1.5 rounded-full',
                        i < p.etapa ? 'bg-emerald-500' : i === p.etapa ? 'bg-cyan-500' : 'bg-white/10',
                      )}
                    />
                  ))}
                </div>
                <p className="text-xs text-slate-400 mt-1.5">
                  Etapa: {ETAPAS[p.etapa].label} · {formatCurrency(p.valor)}
                </p>
              </div>
            </motion.button>
          );
        })}
        {filtered.length === 0 && (
          <div className="col-span-full text-center py-16 text-slate-400">
            Nenhum processo encontrado para "{searchTerm}".
          </div>
        )}
      </div>

      {/* ============ MODAL CRIAR PROCESSO ============ */}
      <AnimatePresence>
        {isModalOpen && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-50 bg-black/40 flex items-center justify-center p-4"
            onClick={() => setIsModalOpen(false)}
          >
            <motion.form
              initial={{ scale: 0.95, y: 10 }}
              animate={{ scale: 1, y: 0 }}
              exit={{ scale: 0.95, y: 10 }}
              onClick={(e) => e.stopPropagation()}
              onSubmit={handleCreate}
              className="bg-white/5 rounded-2xl shadow-2xl max-w-lg w-full max-h-[90vh] overflow-y-auto"
            >
              <div className="sticky top-0 bg-white/5 border-b border-cyan-900/30 px-6 py-5 flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className="h-10 w-10 rounded-xl bg-cyan-500/10 flex items-center justify-center">
                    <Scale className="h-5 w-5 text-cyan-500" />
                  </div>
                  <div>
                    <h3 className="text-xl font-semibold text-white flex items-center gap-2">Criar Processo</h3>
                    <p className="text-sm text-slate-400">Novo processo jurídico</p>
                  </div>
                </div>
                <button type="button" onClick={() => setIsModalOpen(false)} className="p-2 text-slate-400 hover:bg-white/5 rounded-full">
                  <X className="w-5 h-5" />
                </button>
              </div>

              <div className="px-6 py-5 space-y-5">
                <Field label="Cliente" icon={<User className="h-4 w-4 text-cyan-500" />}>
                  <input
                    required
                    placeholder="Ex: João Silva"
                    value={form.cliente}
                    onChange={(e) => setForm({ ...form, cliente: e.target.value })}
                    className="w-full bg-white/5 border border-cyan-900/30 rounded-lg px-3 py-2 text-sm focus:ring-1 focus:ring-cyan-500 outline-none"
                  />
                </Field>

                <Field label="Comprador/Locatário" icon={<User className="h-4 w-4 text-cyan-500" />}>
                  <input
                    required
                    placeholder="Ex: Maria Souza"
                    value={form.compradorLocatario}
                    onChange={(e) => setForm({ ...form, compradorLocatario: e.target.value })}
                    className="w-full bg-white/5 border border-cyan-900/30 rounded-lg px-3 py-2 text-sm focus:ring-1 focus:ring-cyan-500 outline-none"
                  />
                </Field>

                <Field label="Advogado Responsável" icon={<Gavel className="h-4 w-4 text-cyan-500" />}>
                  <input
                    required
                    placeholder="Ex: Dr. Silvio Santos"
                    value={form.advogadoResponsavel}
                    onChange={(e) => setForm({ ...form, advogadoResponsavel: e.target.value })}
                    className="w-full bg-white/5 border border-cyan-900/30 rounded-lg px-3 py-2 text-sm focus:ring-1 focus:ring-cyan-500 outline-none"
                  />
                </Field>

                <div className="grid grid-cols-2 gap-4">
                  <Field label="Tipo" icon={<FileText className="h-4 w-4 text-cyan-500" />}>
                    <select
                      value={form.tipo}
                      onChange={(e) => setForm({ ...form, tipo: e.target.value as ProcessType })}
                      className="w-full bg-white/5 border border-cyan-900/30 rounded-lg px-3 py-2 text-sm focus:ring-1 focus:ring-cyan-500 outline-none"
                    >
                      <option>Compra e Venda</option>
                      <option>Cessão de Direitos</option>
                      <option>Distrato</option>
                    </select>
                  </Field>
                  <Field label="Comissão (%)" icon={<TrendingUp className="h-4 w-4 text-cyan-500" />}>
                    <input
                      type="number"
                      min={0}
                      value={form.comissao}
                      onChange={(e) => setForm({ ...form, comissao: Number(e.target.value) })}
                      className="w-full bg-white/5 border border-cyan-900/30 rounded-lg px-3 py-2 text-sm focus:ring-1 focus:ring-cyan-500 outline-none"
                    />
                  </Field>
                </div>

                <Field label="Valor do Contrato (R$)" icon={<TrendingUp className="h-4 w-4 text-cyan-500" />}>
                  <input
                    required
                    type="number"
                    min={0}
                    placeholder="Ex: 1250000"
                    value={form.valor || ''}
                    onChange={(e) => setForm({ ...form, valor: Number(e.target.value) })}
                    className="w-full bg-white/5 border border-cyan-900/30 rounded-lg px-3 py-2 text-sm focus:ring-1 focus:ring-cyan-500 outline-none"
                  />
                </Field>

                <Field label="Observações" icon={<StickyNote className="h-4 w-4 text-cyan-500" />}>
                  <textarea
                    placeholder="Notas adicionais sobre o processo..."
                    value={form.observacoes}
                    onChange={(e) => setForm({ ...form, observacoes: e.target.value })}
                    className="w-full bg-white/5 border border-cyan-900/30 rounded-lg px-3 py-2 text-sm focus:ring-1 focus:ring-cyan-500 outline-none min-h-[70px]"
                  />
                </Field>
              </div>

              <div className="sticky bottom-0 bg-white/5 border-t border-cyan-900/30 px-6 py-4 flex justify-end gap-3">
                <button type="button" onClick={() => setIsModalOpen(false)} className="px-4 py-2 text-sm font-bold text-slate-300 border border-cyan-900/40 rounded-lg hover:bg-white/5">
                  Cancelar
                </button>
                <button type="submit" className="px-4 py-2 text-sm font-bold text-white bg-cyan-500 hover:bg-cyan-600 rounded-lg">
                  Criar Processo
                </button>
              </div>
            </motion.form>
          </motion.div>
        )}
      </AnimatePresence>

      {/* ============ MODAL DETALHE DO PROCESSO ============ */}
      <AnimatePresence>
        {selectedProcess && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-50 bg-black/40 flex items-center justify-center p-4"
            onClick={() => setSelectedProcess(null)}
          >
            <motion.div
              initial={{ scale: 0.95, y: 10 }}
              animate={{ scale: 1, y: 0 }}
              exit={{ scale: 0.95, y: 10 }}
              onClick={(e) => e.stopPropagation()}
              className="bg-white/5 rounded-2xl shadow-2xl max-w-3xl w-full max-h-[90vh] overflow-y-auto"
            >
              {/* Header */}
              <div className="sticky top-0 bg-white/5 border-b border-cyan-900/30 px-6 py-5">
                <div className="flex items-start justify-between">
                  <div className="flex items-center gap-3">
                    <div className="w-11 h-11 rounded-full bg-cyan-500/20 flex items-center justify-center font-bold text-sm text-cyan-400">
                      {selectedProcess.cliente.split(' ').map((w) => w[0]).join('').slice(0, 2).toUpperCase()}
                    </div>
                    <div>
                      <h3 className="text-lg font-bold text-white">{selectedProcess.cliente}</h3>
                      <p className="text-sm text-slate-400">{selectedProcess.numero} · {selectedProcess.tipo}</p>
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    <span className={cn('text-[11px] font-bold px-2 py-1 rounded-full border', STATUS_META[selectedProcess.status].color)}>
                      {selectedProcess.status}
                    </span>
                    <button onClick={() => setSelectedProcess(null)} className="p-2 text-slate-400 hover:bg-white/5 rounded-full">
                      <X className="w-5 h-5" />
                    </button>
                  </div>
                </div>
                {/* Stepper de etapas */}
                <div className="flex items-center mt-5">
                  {ETAPAS.map((et, i) => {
                    const done = i < selectedProcess.etapa;
                    const current = i === selectedProcess.etapa;
                    return (
                      <React.Fragment key={et.label}>
                        {i > 0 && <div className="flex-1 h-0.5 bg-white/10"><div className={cn('h-full bg-emerald-500', done ? 'w-full' : 'w-0')} /></div>}
                        <div className="flex flex-col items-center gap-1">
                          <div className={cn('w-5 h-5 rounded-full flex items-center justify-center', done ? 'bg-emerald-500' : current ? 'bg-cyan-500' : 'bg-white/10')}>
                            {done ? <CheckCircle2 className="w-3.5 h-3.5 text-white" /> : <span className="text-[9px] text-white font-bold">{i + 1}</span>}
                          </div>
                          <span className={cn('text-[10px] font-medium', current ? 'text-cyan-500' : done ? 'text-emerald-600' : 'text-slate-400')}>{et.label}</span>
                        </div>
                      </React.Fragment>
                    );
                  })}
                </div>
              </div>

              <div className="px-6 py-5 space-y-5">
                {/* Abas */}
                <div className="flex gap-2 border-b border-cyan-900/30">
                  {(['checklist', 'juridico', 'assinatura'] as const).map((tab) => (
                    <button
                      key={tab}
                      onClick={() => setActiveTab(tab)}
                      className={cn(
                        'px-4 py-2 text-sm font-semibold border-b-2 -mb-px transition-colors',
                        activeTab === tab ? 'text-cyan-500 border-cyan-500' : 'text-slate-400 border-transparent hover:text-slate-300',
                      )}
                    >
                      {tab === 'checklist' && 'Checklist de Validação'}
                      {tab === 'juridico' && 'Análise Jurídica'}
                      {tab === 'assinatura' && 'Assinatura / Fechamento'}
                    </button>
                  ))}
                </div>

                {/* Checklist */}
                {activeTab === 'checklist' && (
                  <div>
                    <div className="flex items-center justify-between mb-3">
                      <p className="text-sm font-semibold text-slate-300">Certidões Negativas — cíveis, trabalhistas e fiscais</p>
                      <span className="text-sm font-bold text-emerald-600">{approvedCount}/{docs.length} aprovado(s)</span>
                    </div>
                    <div className="h-2 bg-white/5 rounded-full overflow-hidden mb-4">
                      <div className="h-full bg-emerald-500 transition-all" style={{ width: `${progress}%` }} />
                    </div>

                    <div className="space-y-2.5">
                      {docs.map((doc) => (
                        <div key={doc.id} className={cn(
                          'rounded-lg border p-4 flex items-start gap-3 transition-colors',
                          doc.approved ? 'border-emerald-500/30 bg-emerald-500/10' : 'border-cyan-900/30 bg-white/5',
                        )}>
                          {doc.approved ? (
                            <CheckCircle2 className="w-5 h-5 text-emerald-500 mt-0.5 shrink-0" />
                          ) : (
                            <Clock className="w-5 h-5 text-amber-500 mt-0.5 shrink-0" />
                          )}
                          <div className="flex-1 min-w-0">
                            <p className="font-medium text-sm text-slate-200">{doc.title}</p>
                            <p className="text-xs text-slate-400 mt-0.5">
                              {doc.title.includes('Certidões') ? 'Certidões cíveis, trabalhistas e fiscais' :
                               doc.title.includes('Matrícula') ? 'Matrícula do cartório de registro' :
                               doc.title.includes('Minuta') ? 'Revisão e aprovação jurídica' :
                               doc.title.includes('Assinatura') ? 'Assinatura eletrônica das partes' :
                               'Documentos do comprador'}
                            </p>
                            {doc.files.map((f, i) => (
                              <div key={i} className="flex items-center gap-2 text-xs text-slate-400 mt-2">
                                <FileText className="w-3.5 h-3.5" />
                                {f.name}
                                <span className={cn('px-1.5 py-0.5 rounded-full text-[10px] font-bold',
                                  f.status === 'Aprovado' ? 'bg-emerald-500/20 text-emerald-400' : 'bg-amber-500/20 text-amber-400')}>
                                  {f.status}
                                </span>
                                <button className="text-slate-400 hover:text-cyan-500 flex items-center gap-1">
                                  <Download className="w-3.5 h-3.5" /> Baixar
                                </button>
                              </div>
                            ))}
                            <div className="flex items-center gap-2 mt-3">
                              <button className={cn(
                                'px-3 py-1.5 rounded-lg text-xs font-bold flex items-center gap-1.5 transition-colors',
                                doc.approved
                                  ? 'bg-emerald-500/20 text-emerald-400'
                                  : 'bg-cyan-500 hover:bg-cyan-600 text-white',
                              )} onClick={() => { }}>
                                {doc.approved ? <CheckCircle2 className="w-3.5 h-3.5" /> : <Upload className="w-3.5 h-3.5" />}
                                {doc.approved ? 'Aprovado' : 'Anexar'}
                              </button>
                              {!doc.approved && (
                                <button className="px-3 py-1.5 rounded-lg text-xs font-bold text-slate-300 border border-cyan-900/30 hover:bg-white/5 flex items-center gap-1.5">
                                  <FileCheck className="w-3.5 h-3.5" /> Aprovar
                                </button>
                              )}
                            </div>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                {/* Análise Jurídica */}
                {activeTab === 'juridico' && (
                  <div className="space-y-4">
                    <p className="text-sm text-slate-300">
                      Análise jurídica do processo <strong>{selectedProcess.numero}</strong> — {selectedProcess.tipo} de
                      <strong> {selectedProcess.cliente}</strong>. Advogado responsável: <strong>{selectedProcess.advogadoResponsavel}</strong>.
                    </p>
                    <div className="rounded-lg border border-cyan-900/30 bg-white/5 p-4 text-sm text-slate-300">
                      <p className="font-semibold text-slate-200 mb-2 flex items-center gap-2"><Gavel className="h-4 w-4 text-cyan-500" /> Parecer Jurídico</p>
                      <p>{selectedProcess.observacoes || 'Nenhuma observação cadastrada para este processo.'}</p>
                    </div>
                    <div className="grid grid-cols-2 gap-4">
                      <InfoItem label="Cliente" value={selectedProcess.cliente} />
                      <InfoItem label="Comprador/Locatário" value={selectedProcess.compradorLocatario} />
                      <InfoItem label="Advogado Responsável" value={selectedProcess.advogadoResponsavel} />
                      <InfoItem label="Tipo de Contrato" value={selectedProcess.tipo} />
                      <InfoItem label="Valor" value={formatCurrency(selectedProcess.valor)} />
                      <InfoItem label="Comissão (5%)" value={formatCurrency(selectedProcess.valor * selectedProcess.comissao / 100)} />
                    </div>
                  </div>
                )}

                {/* Assinatura / Fechamento */}
                {activeTab === 'assinatura' && (
                  <div className="space-y-4">
                    <p className="text-sm text-slate-300">
                      Fluxo de assinatura digital. Aprovação da minuta do contrato, assinatura eletrônica das partes e confirmação da venda.
                    </p>

                    <div className="rounded-lg border border-cyan-900/30 p-4 space-y-3">
                      <FlowStep icon={FileSignature} done={selectedProcess.etapa >= 3} label="Aprovação da Minuta do Contrato" sub="Revisão e aprovação jurídica da minuta" />
                      <FlowStep icon={FileSignature} done={selectedProcess.etapa >= 3} label="Assinatura Digital" sub="Assinatura eletrônica das partes" />
                      <FlowStep icon={CheckCircle2} done={selectedProcess.status === 'Aprovado' || selectedProcess.status === 'Aprovados' || selectedProcess.status === 'Aguardando Fechamento'} label="Confirmar Assinatura e Venda" sub="Registro de venda e finalização do contrato" />
                    </div>

                    <div className={cn('rounded-lg border p-4', selectedProcess.status === 'Aprovados' || selectedProcess.status === 'Aguardando Fechamento' ? 'border-emerald-500/30 bg-emerald-500/10' : 'border-cyan-900/30 bg-white/5')}>
                      {selectedProcess.status === 'Aprovados' || selectedProcess.status === 'Aguardando Fechamento' ? (
                        <div className="flex items-center gap-2 text-emerald-400 font-semibold">
                          <CheckCircle2 className="w-5 h-5" />
                          ✓ Venda Finalizada
                        </div>
                      ) : (
                        <div className="flex items-center justify-between gap-3">
                          <div className="flex items-center gap-2 text-slate-300">
                            <AlertCircle className="w-4 h-4 text-amber-500" />
                            <span className="text-sm">Aguardando assinatura digital para fechar a venda.</span>
                          </div>
                          <button
                            className="px-4 py-2 bg-emerald-500 hover:bg-emerald-600 text-white text-sm font-bold rounded-lg flex items-center gap-2"
                            onClick={() => {
                              const status: ProcessStatus = selectedProcess.status === 'Aprovado' ? 'Aguardando Fechamento' : 'Aprovado';
                              setProcessos((prev) => prev.map((p) => p.id === selectedProcess.id ? { ...p, status, etapa: Math.max(p.etapa, 3) } : p));
                              setSelectedProcess((p) => p ? { ...p, status, etapa: Math.max(p.etapa, 3) } : p);
                            }}
                          >
                            <FileSignature className="w-4 h-4" />
                            Confirmar Assinatura e Venda
                          </button>
                        </div>
                      )}
                    </div>

                    {selectedProcess.status === 'Em Andamento' && (
                      <div className="flex gap-2">
                        <button className="px-4 py-2 bg-emerald-500 hover:bg-emerald-600 text-white text-sm font-bold rounded-lg flex items-center gap-2"
                          onClick={() => setSelectedProcess((p) => p ? { ...p, status: 'Aprovado', etapa: 3 } : p)}>
                          <CheckCircle2 className="w-4 h-4" /> Aprovar
                        </button>
                        <button className="px-4 py-2 bg-rose-500 hover:bg-rose-600 text-white text-sm font-bold rounded-lg flex items-center gap-2"
                          onClick={() => setSelectedProcess((p) => p ? { ...p, status: 'Em Análise', etapa: 0 } : p)}>
                          <AlertCircle className="w-4 h-4" /> Reprovar
                        </button>
                      </div>
                    )}
                  </div>
                )}
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}

/* -------- Componentes auxiliares -------- */
function SummaryCard({ icon: Icon, label, value, bg }: { icon: React.ElementType; label: string; value: string; bg: string }) {
  return (
    <div className="glass-neon-card p-5 shadow-sm">
      <div className="flex items-center justify-between">
        <div>
          <p className="text-xs font-medium text-slate-400">{label}</p>
          <p className="text-2xl font-bold text-white mt-1">{value}</p>
        </div>
        <div className={cn('w-10 h-10 rounded-xl flex items-center justify-center', bg)}>
          <Icon className="h-5 w-5 text-white" />
        </div>
      </div>
    </div>
  );
}

function Field({ label, icon, children }: { label: string; icon: React.ReactNode; children: React.ReactNode }) {
  return (
    <div className="space-y-1.5">
      <label className="flex items-center gap-2 text-sm font-medium text-slate-300">
        <span className="text-cyan-500">{icon}</span>
        {label}
      </label>
      {children}
    </div>
  );
}

function InfoItem({ label, value }: { label: string; value: string }) {
  return (
    <div className="bg-white/5 rounded-lg border border-cyan-900/30 p-3">
      <p className="text-xs text-slate-400">{label}</p>
      <p className="text-sm font-semibold text-slate-200 mt-0.5">{value}</p>
    </div>
  );
}

function FlowStep({ icon: Icon, done, label, sub }: { icon: React.ElementType; done: boolean; label: string; sub: string }) {
  return (
    <div className="flex items-start gap-3">
      <div className={cn('w-7 h-7 rounded-full flex items-center justify-center shrink-0', done ? 'bg-emerald-500' : 'bg-white/10')}>
        <Icon className={cn('w-4 h-4', done ? 'text-white' : 'text-slate-400')} />
      </div>
      <div>
        <p className={cn('text-sm font-semibold', done ? 'text-emerald-400' : 'text-slate-300')}>{label}</p>
        <p className="text-xs text-slate-400">{sub}</p>
      </div>
    </div>
  );
}