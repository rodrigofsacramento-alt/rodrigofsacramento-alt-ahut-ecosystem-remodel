import { useState } from 'react';
import {
  Search,
  Plus,
  Filter,
  MoreHorizontal,
  ChevronLeft,
  ChevronRight,
  CheckCircle2,
  X,
  Calendar,
  Users,
  Home,
  FileText,
  TrendingUp,
  Phone,
  Mail,
  MessageSquare,
  UserPlus,
  Loader2
} from 'lucide-react';
import { cn } from '../lib/utils';
import { useLeads, useCreateLead, useUpdateLead, Lead } from '../hooks/useLeads';
import { useAuth } from '../hooks/useAuth';

const ESTAGIOS = ['Lead Cadastrado', 'Primeiro Atendimento', 'Visita Agendada', 'Proposta Enviada', 'Imóvel Escolhido', 'Convertido'];

function getInitials(name?: string) {
  if (!name) return '?';
  return name.split(' ').map((n) => n[0]?.[0] || '').join('').slice(0, 2).toUpperCase() || '?';
}

export default function Leads() {
  const { user } = useAuth();
  const [showModal, setShowModal] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState('Todos');
  const [groupFilter, setGroupFilter] = useState('Todos');

  const { data: leads = [], isLoading } = useLeads({ search: searchTerm || undefined });
  const createLead = useCreateLead();
  const updateLead = useUpdateLead();

  const [newLead, setNewLead] = useState({
    name: '', phone: '', email: '', source: 'Site', stage: 'Lead Cadastrado', notes: '', budget: ''
  });

  const filteredLeads = leads.filter((lead) => {
    const matchesStatus = statusFilter === 'Todos' || lead.stage === statusFilter;
    const group = Array.isArray(lead.tags) ? lead.tags.join(', ') : '';
    const matchesGroup = groupFilter === 'Todos' || group.includes(groupFilter);
    return matchesStatus && matchesGroup;
  });

  const ativos = leads.filter((l) => l.stage !== 'Convertido').length;
  const convertidos = leads.filter((l) => l.stage === 'Convertido').length;

  const handleCreate = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newLead.name || !newLead.phone) return;
    await createLead.mutateAsync({
      name: newLead.name,
      phone: newLead.phone,
      email: newLead.email || null,
      source: newLead.source,
      stage: newLead.stage,
      notes: newLead.notes || null,
      responsible_id: user?.id || null,
      created_by: user?.id,
      budget_min: null,
      budget_max: null,
      tags: []
    });
    setShowModal(false);
    setNewLead({ name: '', phone: '', email: '', source: 'Site', stage: 'Lead Cadastrado', notes: '', budget: '' });
  };

  const handleMoveStage = (lead: Lead, stage: string) => {
    updateLead.mutate({ id: lead.id, stage });
  };

  const handleAssume = (lead: Lead) => {
    updateLead.mutate({ id: lead.id, responsible_id: user?.id });
  };

  return (
    <div className="p-6 space-y-6 bg-transparent min-h-full">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div className="flex flex-wrap items-center gap-4">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
            <input
              type="text"
              placeholder="Buscar por nome, email ou telefone..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="bg-white/5 border border-cyan-900/30 rounded-lg py-1.5 pl-10 pr-4 text-sm focus:ring-1 focus:ring-cyan-500 outline-none w-64"
            />
          </div>

          <div className="flex items-center gap-2 bg-white/5 border border-cyan-900/30 rounded-lg px-3 py-1.5 text-sm">
            <Filter className="w-4 h-4 text-slate-400" />
            <span className="text-slate-300">Status:</span>
            <select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
              className="font-bold bg-transparent outline-none cursor-pointer text-white"
            >
              <option>Todos</option>
              {ESTAGIOS.map((s) => <option key={s}>{s}</option>)}
            </select>
          </div>

          <button onClick={() => { setSearchTerm(''); setStatusFilter('Todos'); }} className="text-cyan-500 text-sm font-bold">
            Limpar filtros
          </button>

          {/* KPIs */}
          <div className="flex items-center gap-3 ml-auto">
            <span className="text-xs font-bold text-slate-300 bg-white/5 border border-cyan-900/30 rounded-lg px-3 py-1.5">Ativos no funil: <span className="text-cyan-400">{ativos}</span></span>
            <span className="text-xs font-bold text-slate-300 bg-white/5 border border-cyan-900/30 rounded-lg px-3 py-1.5">Convertidos: <span className="text-emerald-600">{convertidos}</span></span>
          </div>
        </div>

        <button onClick={() => setShowModal(true)} className="bg-cyan-500 hover:bg-cyan-600 text-white px-4 py-2 rounded-lg text-sm font-bold flex items-center gap-2 transition-colors whitespace-nowrap">
          <Plus className="w-4 h-4" /> Cadastrar Lead
        </button>
      </div>

      <div className="glass-neon-card overflow-hidden">
        <table className="w-full text-left border-collapse">
          <thead>
            <tr className="bg-white/5 border-b border-cyan-900/30">
              <th className="p-4 text-[10px] font-bold text-slate-400 uppercase tracking-wider">Lead / Contato</th>
              <th className="p-4 text-[10px] font-bold text-slate-400 uppercase tracking-wider text-center">Score</th>
              <th className="p-4 text-[10px] font-bold text-slate-400 uppercase tracking-wider">Status / SLA</th>
              <th className="p-4 text-[10px] font-bold text-slate-400 uppercase tracking-wider">Responsável</th>
              <th className="p-4 w-32"></th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100">
            {isLoading && (
              <tr><td colSpan={5} className="p-8 text-center text-sm text-slate-400">Carregando leads...</td></tr>
            )}
            {!isLoading && filteredLeads.length === 0 && (
              <tr><td colSpan={5} className="p-8 text-center text-sm text-slate-400">Nenhum lead encontrado.</td></tr>
            )}
            {!isLoading && filteredLeads.map((lead) => (
              <tr key={lead.id} className="hover:bg-white/5 transition-colors group">
                <td className="p-4">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-full bg-white/5 flex items-center justify-center text-slate-400 font-bold text-xs">
                      {getInitials(lead.name)}
                    </div>
                    <div>
                      <p className="text-sm font-bold text-white">{lead.name}</p>
                      <div className="flex items-center gap-2 text-xs text-slate-400">
                        {lead.phone && <span className="flex items-center gap-1"><Phone className="w-3 h-3" />{lead.phone}</span>}
                        {lead.email && <span className="flex items-center gap-1"><Mail className="w-3 h-3" />{lead.email}</span>}
                      </div>
                    </div>
                  </div>
                </td>
                <td className="p-4 text-center">
                  <span className={cn(
                    "inline-flex items-center justify-center w-6 h-6 rounded-full text-[10px] font-bold border",
                    (lead.score || 0) >= 8 ? "bg-green-500/10 text-emerald-400 border-green-500/20" : "bg-cyan-500/10 text-cyan-400 border-cyan-500/20"
                  )}>
                    {lead.score ?? '—'}
                  </span>
                </td>
                <td className="p-4">
                  <select
                    value={lead.stage}
                    onChange={(e) => handleMoveStage(lead, e.target.value)}
                    className={cn(
                      "text-[10px] font-bold px-2 py-0.5 rounded-full border outline-none cursor-pointer",
                      lead.stage === 'Convertido' ? "bg-emerald-500/10 text-emerald-600 border-emerald-500/20" :
                      "bg-cyan-500/10 text-cyan-400 border-cyan-500/20"
                    )}
                  >
                    {ESTAGIOS.map((s) => <option key={s} value={s}>{s}</option>)}
                  </select>
                </td>
                <td className="p-4">
                  {lead.responsible ? (
                    <div className="flex items-center gap-2">
                      <div className="w-6 h-6 rounded-full bg-[#0a0a0a] text-white flex items-center justify-center text-[10px] font-bold">
                        {getInitials(lead.responsible.full_name)}
                      </div>
                      <span className="text-xs text-slate-300">{lead.responsible.full_name}</span>
                    </div>
                  ) : (
                    <button
                      onClick={() => handleAssume(lead)}
                      className="text-xs text-cyan-400 font-bold flex items-center gap-1 hover:underline"
                    >
                      <UserPlus className="w-3.5 h-3.5" /> Assumir Lead
                    </button>
                  )}
                </td>
                <td className="p-4">
                  <div className="flex items-center gap-1">
                    <button className="p-1.5 text-slate-400 hover:text-cyan-500 rounded-lg hover:bg-cyan-500/10" title="WhatsApp">
                      <MessageSquare className="w-4 h-4" />
                    </button>
                    <button className="p-1.5 text-slate-400 hover:text-slate-300 rounded-lg hover:bg-white/5" title="Abrir detalhes">
                      <MoreHorizontal className="w-4 h-4" />
                    </button>
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
        <div className="p-4 bg-white/5 border-t border-cyan-900/30 flex items-center justify-between">
          <p className="text-xs text-slate-400">Mostrando {filteredLeads.length} de {leads.length} leads</p>
          {/* Página única por ora — paginação completa no próximo ciclo */}
        </div>
      </div>

      {/* Modal Cadastrar Lead */}
      {showModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm">
          <div className="bg-white/5 rounded-2xl w-full max-w-2xl max-h-[90vh] overflow-y-auto shadow-2xl">
            <div className="p-6 border-b border-white/5 flex items-center justify-between sticky top-0 bg-white/5 z-10">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-full bg-cyan-500/20 text-cyan-500 flex items-center justify-center">
                  <Plus className="w-6 h-6" />
                </div>
                <div>
                  <h3 className="text-lg font-bold text-white">Cadastrar Lead</h3>
                  <p className="text-xs text-slate-400">Preencha os dados do novo lead</p>
                </div>
              </div>
              <button onClick={() => setShowModal(false)} className="p-2 text-slate-400 hover:text-slate-300 rounded-full hover:bg-white/5">
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleCreate} className="p-6 space-y-8">
              <section className="space-y-4">
                <div className="flex items-center gap-2 text-cyan-500">
                  <Users className="w-4 h-4" />
                  <h4 className="text-sm font-bold">Dados Pessoais</h4>
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-1.5">
                    <label className="text-xs font-bold text-slate-300">Nome Completo *</label>
                    <input required type="text" placeholder="Ex: Rodrigo Sacramento" value={newLead.name} onChange={(e) => setNewLead({ ...newLead, name: e.target.value })} className="w-full bg-white/5 border border-cyan-900/30 rounded-lg px-4 py-2 text-sm outline-none focus:ring-1 focus:ring-cyan-500" />
                  </div>
                  <div className="space-y-1.5">
                    <label className="text-xs font-bold text-slate-300">Telefone / WhatsApp *</label>
                    <input required type="text" placeholder="Ex: 5511988192658" value={newLead.phone} onChange={(e) => setNewLead({ ...newLead, phone: e.target.value })} className="w-full bg-white/5 border border-cyan-900/30 rounded-lg px-4 py-2 text-sm outline-none focus:ring-1 focus:ring-cyan-500" />
                  </div>
                  <div className="space-y-1.5">
                    <label className="text-xs font-bold text-slate-300">Email</label>
                    <input type="email" placeholder="Ex: rodrigosacramento@gmail.com" value={newLead.email} onChange={(e) => setNewLead({ ...newLead, email: e.target.value })} className="w-full bg-white/5 border border-cyan-900/30 rounded-lg px-4 py-2 text-sm outline-none focus:ring-1 focus:ring-cyan-500" />
                  </div>
                  <div className="space-y-1.5">
                    <label className="text-xs font-bold text-slate-300">Origem do Lead</label>
                    <select value={newLead.source} onChange={(e) => setNewLead({ ...newLead, source: e.target.value })} className="w-full bg-white/5 border border-cyan-900/30 rounded-lg px-4 py-2 text-sm outline-none focus:ring-1 focus:ring-cyan-500">
                      <option>Site</option><option>Instagram</option><option>Facebook</option><option>Indicação</option>
                    </select>
                  </div>
                  <div className="space-y-1.5 col-span-2">
                    <label className="text-xs font-bold text-slate-300">Notas / Interesse</label>
                    <textarea rows={3} placeholder="Descreva o interesse do lead..." value={newLead.notes} onChange={(e) => setNewLead({ ...newLead, notes: e.target.value })} className="w-full bg-white/5 border border-cyan-900/30 rounded-lg px-4 py-2 text-sm outline-none focus:ring-1 focus:ring-cyan-500 resize-none" />
                  </div>
                </div>
              </section>

              <div className="p-6 border-t border-white/5 flex items-center justify-end gap-3 sticky bottom-0 bg-white/5">
                <button type="button" onClick={() => setShowModal(false)} className="px-6 py-2 rounded-lg text-sm font-bold text-slate-300 hover:bg-white/5 transition-colors">
                  Cancelar
                </button>
                <button type="submit" disabled={createLead.isPending} className="px-6 py-2 rounded-lg text-sm font-bold bg-cyan-500 hover:bg-cyan-600 text-white transition-colors shadow-lg shadow-cyan-500/20 flex items-center gap-2 disabled:opacity-60">
                  {createLead.isPending && <Loader2 className="w-4 h-4 animate-spin" />}
                  Confirmar Cadastro
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}