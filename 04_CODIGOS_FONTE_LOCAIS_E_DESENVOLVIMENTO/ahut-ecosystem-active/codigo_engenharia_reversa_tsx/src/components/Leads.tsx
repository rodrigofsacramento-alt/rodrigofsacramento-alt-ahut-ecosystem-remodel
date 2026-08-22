import { useState } from 'react';
import { 
  Search, 
  Plus, 
  Filter, 
  MoreHorizontal, 
  ChevronLeft, 
  ChevronRight,
  Phone,
  Mail,
  MessageSquare,
  Clock,
  CheckCircle2,
  AlertCircle,
  X,
  Calendar,
  Users,
  Home,
  FileText,
  TrendingUp
} from 'lucide-react';
import { cn } from '../lib/utils';

const leads = [
  { id: 1, initials: 'MV', name: 'Michel Vallota', phone: '11988192658', score: 5, stage: 'Primeiro Atendimento', sla: 'No prazo', responsible: null, createdAt: '2023-10-25', group: 'Loteamentos' },
  { id: 2, initials: 'MV', name: 'Michel Vallota', phone: '11988192659', score: 5, stage: 'Primeiro Atendimento', sla: 'No prazo', responsible: null, createdAt: '2023-10-24', group: 'Loteamentos' },
  { id: 3, initials: 'CR', name: 'Chris Racanelli', phone: '11988192660', score: 5, stage: 'Primeiro Atendimento', sla: 'No prazo', responsible: 'Rodrigo Sacramento', createdAt: '2023-10-23', group: 'Revenda' },
  { id: 4, initials: 'CR', name: 'Chris Racanelli', phone: '11988192661', score: 5, stage: 'Primeiro Atendimento', sla: 'No prazo', responsible: null, createdAt: '2023-10-22', group: 'Revenda' },
  { id: 5, initials: 'MS', name: 'Marcos Sales', phone: '11988192662', score: 5, stage: 'Primeiro Atendimento', sla: 'No prazo', responsible: null, createdAt: '2023-10-21', group: 'Lançamentos' },
  { id: 6, initials: 'A', name: 'audrey', email: 'audrey@gmail.com.BR', phone: '11988192663', score: 5, stage: 'Lead Cadastrado', sla: 'No prazo', responsible: null, createdAt: '2023-10-20', group: 'Lançamentos' },
  { id: 7, initials: 'RS', name: 'Rodrigo Sacramento', email: 'rodrigo.fsacramento@gmail.com', phone: '5511988192658', score: 5, stage: 'Lead Cadastrado', sla: 'No prazo', responsible: null, createdAt: '2023-10-19', group: 'Comercial' },
  { id: 8, initials: 'CD', name: 'Carla Dias', email: 'carla.dias@email.com', phone: '11988192664', score: 5, stage: 'Primeiro Atendimento', sla: 'No prazo', responsible: 'Rodrigo Sacramento', createdAt: '2023-10-18', group: 'Comercial' },
  { id: 9, initials: 'RA', name: 'Roberto Almeida', email: 'roberto.almeida@email.com', phone: '11988192665', score: 9, stage: 'Imóvel Escolhido', sla: 'No prazo', responsible: 'Rodrigo Sacramento', createdAt: '2023-10-17', group: 'Alto Padrão' },
];

export default function Leads() {
  const [showModal, setShowModal] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState('Todos');
  const [dateFilter, setDateFilter] = useState('Todos');
  const [groupFilter, setGroupFilter] = useState('Todos');

  const filteredLeads = leads.filter(lead => {
    const matchesSearch = lead.name.toLowerCase().includes(searchTerm.toLowerCase()) || 
                         (lead.phone && lead.phone.includes(searchTerm));
    const matchesStatus = statusFilter === 'Todos' || lead.stage === statusFilter;
    const matchesGroup = groupFilter === 'Todos' || lead.group === groupFilter;
    
    let matchesDate = true;
    if (dateFilter !== 'Todos') {
      const leadDate = new Date(lead.createdAt);
      const now = new Date();
      if (dateFilter === 'Hoje') {
        matchesDate = leadDate.toDateString() === now.toDateString();
      } else if (dateFilter === 'Este Mês') {
        matchesDate = leadDate.getMonth() === now.getMonth() && leadDate.getFullYear() === now.getFullYear();
      }
    }

    return matchesSearch && matchesStatus && matchesGroup && matchesDate;
  });

  return (
    <div className="p-6 space-y-6 bg-slate-50 min-h-full">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div className="flex flex-wrap items-center gap-4">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
            <input 
              type="text" 
              placeholder="Buscar por nome ou telefone..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="bg-white border border-slate-200 rounded-lg py-1.5 pl-10 pr-4 text-sm focus:ring-1 focus:ring-orange-500 outline-none w-64"
            />
          </div>

          <div className="flex items-center gap-2 bg-white border border-slate-200 rounded-lg px-3 py-1.5 text-sm">
            <Filter className="w-4 h-4 text-slate-400" />
            <span className="text-slate-600">Status:</span>
            <select 
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
              className="font-bold bg-transparent outline-none cursor-pointer"
            >
              <option value="Todos">Todos</option>
              <option value="Lead Cadastrado">Lead Cadastrado</option>
              <option value="Primeiro Atendimento">Primeiro Atendimento</option>
              <option value="Imóvel Escolhido">Imóvel Escolhido</option>
            </select>
          </div>

          <div className="flex items-center gap-2 bg-white border border-slate-200 rounded-lg px-3 py-1.5 text-sm">
            <Users className="w-4 h-4 text-slate-400" />
            <span className="text-slate-600">Grupo:</span>
            <select 
              value={groupFilter}
              onChange={(e) => setGroupFilter(e.target.value)}
              className="font-bold bg-transparent outline-none cursor-pointer"
            >
              <option value="Todos">Todos</option>
              <option value="Loteamentos">Loteamentos</option>
              <option value="Revenda">Revenda</option>
              <option value="Lançamentos">Lançamentos</option>
              <option value="Comercial">Comercial</option>
              <option value="Alto Padrão">Alto Padrão</option>
            </select>
          </div>

          <div className="flex items-center gap-2 bg-white border border-slate-200 rounded-lg px-3 py-1.5 text-sm">
            <Calendar className="w-4 h-4 text-slate-400" />
            <span className="text-slate-600">Data:</span>
            <select 
              value={dateFilter}
              onChange={(e) => setDateFilter(e.target.value)}
              className="font-bold bg-transparent outline-none cursor-pointer"
            >
              <option value="Todos">Todos</option>
              <option value="Hoje">Hoje</option>
              <option value="Este Mês">Este Mês</option>
            </select>
          </div>

          <button 
            onClick={() => {
              setSearchTerm('');
              setStatusFilter('Todos');
              setDateFilter('Todos');
              setGroupFilter('Todos');
            }}
            className="text-orange-500 text-sm font-bold"
          >
            Limpar filtros
          </button>
        </div>
        
        <button 
          onClick={() => setShowModal(true)}
          className="bg-orange-500 hover:bg-orange-600 text-white px-4 py-2 rounded-lg text-sm font-bold flex items-center gap-2 transition-colors whitespace-nowrap"
        >
          <Plus className="w-4 h-4" />
          Cadastrar Lead
        </button>
      </div>

      <div className="bg-white rounded-2xl border border-slate-200 overflow-hidden">
        <table className="w-full text-left border-collapse">
          <thead>
            <tr className="bg-slate-50 border-b border-slate-200">
              <th className="p-4 w-10">
                <input type="checkbox" className="rounded border-slate-300 text-orange-500 focus:ring-orange-500" />
              </th>
              <th className="p-4 text-[10px] font-bold text-slate-500 uppercase tracking-wider">Lead / Contato</th>
              <th className="p-4 text-[10px] font-bold text-slate-500 uppercase tracking-wider text-center">SDR</th>
              <th className="p-4 text-[10px] font-bold text-slate-500 uppercase tracking-wider">Status / SLA</th>
              <th className="p-4 text-[10px] font-bold text-slate-500 uppercase tracking-wider">Responsável</th>
              <th className="p-4 w-10"></th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100">
            {filteredLeads.map((lead) => (
              <tr key={lead.id} className="hover:bg-slate-50 transition-colors group">
                <td className="p-4">
                  <input type="checkbox" className="rounded border-slate-300 text-orange-500 focus:ring-orange-500" />
                </td>
                <td className="p-4">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-full bg-slate-100 flex items-center justify-center text-slate-500 font-bold text-xs">
                      {lead.initials}
                    </div>
                    <div>
                      <p className="text-sm font-bold text-slate-900">{lead.name}</p>
                      {lead.email && <p className="text-xs text-slate-500">{lead.email}</p>}
                    </div>
                  </div>
                </td>
                <td className="p-4 text-center">
                  <span className={cn(
                    "inline-flex items-center justify-center w-6 h-6 rounded-full text-[10px] font-bold border",
                    lead.score >= 8 ? "bg-green-50 text-green-600 border-green-100" : "bg-orange-50 text-orange-600 border-orange-100"
                  )}>
                    {lead.score}
                  </span>
                </td>
                <td className="p-4">
                  <div>
                    <span className={cn(
                      "text-[10px] font-bold px-2 py-0.5 rounded-full border",
                      lead.stage === 'Lead Cadastrado' ? "bg-blue-50 text-blue-600 border-blue-100" :
                      lead.stage === 'Imóvel Escolhido' ? "bg-orange-50 text-orange-600 border-orange-100" :
                      "bg-orange-50 text-orange-600 border-orange-100"
                    )}>
                      {lead.stage}
                    </span>
                    <div className="flex items-center gap-1 mt-1">
                      <CheckCircle2 className="w-3 h-3 text-green-500" />
                      <span className="text-[10px] text-green-600 font-medium">{lead.sla}</span>
                    </div>
                  </div>
                </td>
                <td className="p-4">
                  {lead.responsible ? (
                    <div className="flex items-center gap-2">
                      <div className="w-6 h-6 rounded-full bg-[#1E293B] text-white flex items-center justify-center text-[10px] font-bold">RS</div>
                      <span className="text-xs text-slate-600">{lead.responsible}</span>
                    </div>
                  ) : (
                    <span className="text-xs text-slate-400 italic">Sem responsável</span>
                  )}
                </td>
                <td className="p-4">
                  <button className="p-1 text-slate-400 hover:text-slate-600 rounded-lg hover:bg-slate-100 transition-all">
                    <MoreHorizontal className="w-5 h-5" />
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
        
        <div className="p-4 bg-slate-50 border-t border-slate-200 flex items-center justify-between">
          <p className="text-xs text-slate-500">Mostrando 1-9 de 248 leads</p>
          <div className="flex items-center gap-2">
            <button className="p-2 text-slate-400 hover:text-slate-600 disabled:opacity-50" disabled>
              <ChevronLeft className="w-4 h-4" />
            </button>
            <div className="flex items-center gap-1">
              {[1, 2, 3].map((p) => (
                <button 
                  key={p} 
                  className={cn(
                    "w-8 h-8 rounded-lg text-xs font-bold transition-all",
                    p === 1 ? "bg-orange-500 text-white" : "text-slate-600 hover:bg-slate-200"
                  )}
                >
                  {p}
                </button>
              ))}
            </div>
            <button className="p-2 text-slate-400 hover:text-slate-600">
              <ChevronRight className="w-4 h-4" />
            </button>
          </div>
        </div>
      </div>

      {/* Modal Cadastrar Lead */}
      {showModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm">
          <div className="bg-white rounded-2xl w-full max-w-2xl max-h-[90vh] overflow-y-auto shadow-2xl animate-in fade-in zoom-in duration-200">
            <div className="p-6 border-b border-slate-100 flex items-center justify-between sticky top-0 bg-white z-10">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-full bg-orange-100 text-orange-500 flex items-center justify-center">
                  <Plus className="w-6 h-6" />
                </div>
                <div>
                  <h3 className="text-lg font-bold text-slate-900">Cadastrar Lead</h3>
                  <p className="text-xs text-slate-500">Preencha os dados do novo lead</p>
                </div>
              </div>
              <button onClick={() => setShowModal(false)} className="p-2 text-slate-400 hover:text-slate-600 rounded-full hover:bg-slate-100">
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="p-6 space-y-8">
              {/* Dados Pessoais */}
              <section className="space-y-4">
                <div className="flex items-center gap-2 text-orange-500">
                  <Users className="w-4 h-4" />
                  <h4 className="text-sm font-bold">Dados Pessoais</h4>
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-1.5">
                    <label className="text-xs font-bold text-slate-700">Nome Completo *</label>
                    <input type="text" placeholder="Ex: Rodrigo Sacramento" className="w-full bg-slate-50 border border-slate-200 rounded-lg px-4 py-2 text-sm outline-none focus:ring-1 focus:ring-orange-500" />
                  </div>
                  <div className="space-y-1.5">
                    <label className="text-xs font-bold text-slate-700">Telefone / WhatsApp *</label>
                    <input type="text" placeholder="Ex: 5511988192658" className="w-full bg-slate-50 border border-slate-200 rounded-lg px-4 py-2 text-sm outline-none focus:ring-1 focus:ring-orange-500" />
                  </div>
                  <div className="space-y-1.5">
                    <label className="text-xs font-bold text-slate-700">Email *</label>
                    <input type="email" placeholder="Ex: rodrigosacramento@gmail.com" className="w-full bg-slate-50 border border-slate-200 rounded-lg px-4 py-2 text-sm outline-none focus:ring-1 focus:ring-orange-500" />
                  </div>
                  <div className="space-y-1.5">
                    <label className="text-xs font-bold text-slate-700">Origem do Lead</label>
                    <select className="w-full bg-slate-50 border border-slate-200 rounded-lg px-4 py-2 text-sm outline-none focus:ring-1 focus:ring-orange-500">
                      <option>Selecione a origem</option>
                      <option>Site</option>
                      <option>Instagram</option>
                      <option>Facebook</option>
                      <option>Indicação</option>
                    </select>
                  </div>
                </div>
              </section>

              {/* Imóvel de Interesse */}
              <section className="space-y-4">
                <div className="flex items-center gap-2 text-orange-500">
                  <Home className="w-4 h-4" />
                  <h4 className="text-sm font-bold">Imóvel de Interesse</h4>
                </div>
                <div className="space-y-4">
                  <div className="space-y-1.5">
                    <label className="text-xs font-bold text-slate-700">Imóvel de Interesse</label>
                    <div className="relative">
                      <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                      <input type="text" placeholder="Buscar: código, nome ou localização..." className="w-full bg-slate-50 border border-slate-200 rounded-lg px-10 py-2 text-sm outline-none focus:ring-1 focus:ring-orange-500" />
                    </div>
                  </div>
                  <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-1.5">
                      <label className="text-xs font-bold text-slate-700">Localização do Imóvel</label>
                      <input type="text" placeholder="Ex: São Bernardo do Campo" className="w-full bg-slate-50 border border-slate-200 rounded-lg px-4 py-2 text-sm outline-none focus:ring-1 focus:ring-orange-500" />
                    </div>
                    <div className="space-y-1.5">
                      <label className="text-xs font-bold text-slate-700">Orçamento</label>
                      <input type="text" placeholder="Ex: 1.5M - 2.2M" className="w-full bg-slate-50 border border-slate-200 rounded-lg px-4 py-2 text-sm outline-none focus:ring-1 focus:ring-orange-500" />
                    </div>
                  </div>
                  <div className="space-y-1.5">
                    <label className="text-xs font-bold text-slate-700">Interesse</label>
                    <input type="text" placeholder="Ex: Imóvel 3 dorm no centro de SBC" className="w-full bg-slate-50 border border-slate-200 rounded-lg px-4 py-2 text-sm outline-none focus:ring-1 focus:ring-orange-500" />
                  </div>
                </div>
              </section>

              {/* Gestão do Lead */}
              <section className="space-y-4">
                <div className="flex items-center gap-2 text-orange-500">
                  <TrendingUp className="w-4 h-4" />
                  <h4 className="text-sm font-bold">Gestão do Lead</h4>
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-1.5">
                    <label className="text-xs font-bold text-slate-700">Data e Hora de Cadastro</label>
                    <input type="datetime-local" className="w-full bg-slate-50 border border-slate-200 rounded-lg px-4 py-2 text-sm outline-none focus:ring-1 focus:ring-orange-500" defaultValue="2026-03-16T22:57" />
                  </div>
                  <div className="space-y-1.5">
                    <label className="text-xs font-bold text-slate-700">Estágio de Venda</label>
                    <select className="w-full bg-slate-50 border border-slate-200 rounded-lg px-4 py-2 text-sm outline-none focus:ring-1 focus:ring-orange-500">
                      <option>Lead Cadastrado</option>
                      <option>Primeiro Atendimento</option>
                      <option>Visita Agendada</option>
                      <option>Proposta Enviada</option>
                    </select>
                  </div>
                  <div className="space-y-1.5">
                    <label className="text-xs font-bold text-slate-700">SLA</label>
                    <select className="w-full bg-slate-50 border border-slate-200 rounded-lg px-4 py-2 text-sm outline-none focus:ring-1 focus:ring-orange-500">
                      <option>48h</option>
                      <option>24h</option>
                      <option>12h</option>
                    </select>
                  </div>
                </div>
              </section>

              {/* Histórico */}
              <section className="space-y-4">
                <div className="flex items-center gap-2 text-orange-500">
                  <FileText className="w-4 h-4" />
                  <h4 className="text-sm font-bold">Histórico</h4>
                </div>
                <div className="space-y-1.5">
                  <label className="text-xs font-bold text-slate-700">Histórico de Atendimento</label>
                  <textarea rows={4} placeholder="Descreva o histórico de atendimento..." className="w-full bg-slate-50 border border-slate-200 rounded-lg px-4 py-2 text-sm outline-none focus:ring-1 focus:ring-orange-500 resize-none" />
                </div>
              </section>
            </div>

            <div className="p-6 border-t border-slate-100 flex items-center justify-end gap-3 sticky bottom-0 bg-white">
              <button onClick={() => setShowModal(false)} className="px-6 py-2 rounded-lg text-sm font-bold text-slate-600 hover:bg-slate-100 transition-colors">
                Cancelar
              </button>
              <button className="px-6 py-2 rounded-lg text-sm font-bold bg-orange-500 hover:bg-orange-600 text-white transition-colors shadow-lg shadow-orange-500/20">
                Confirmar Cadastro
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
