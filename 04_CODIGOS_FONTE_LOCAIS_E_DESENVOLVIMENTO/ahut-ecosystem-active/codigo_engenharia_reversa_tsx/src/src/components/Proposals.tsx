import React, { useState, useEffect } from 'react';
import { 
  FileText, 
  Plus, 
  Search, 
  Filter, 
  MoreHorizontal, 
  CheckCircle2, 
  Clock, 
  AlertCircle,
  ArrowRight,
  User,
  Home,
  DollarSign,
  XCircle,
  ChevronRight,
  X
} from 'lucide-react';
import { supabase, Proposal, Lead, Property } from '../lib/supabase';
import { cn, formatCurrency } from '../lib/utils';
import AsyncCombobox, { LookupItem } from '../components/AsyncCombobox';
import { motion, AnimatePresence } from 'framer-motion';

export default function Proposals() {
  const [proposals, setProposals] = useState<Proposal[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [isModalOpen, setIsModalOpen] = useState(false);
  
  // Form state
  const [leads, setLeads] = useState<Lead[]>([]);
  const [properties, setProperties] = useState<Property[]>([]);
  const [selectedLead, setSelectedLead] = useState('');
  const [selectedProperty, setSelectedProperty] = useState('');
  const [proposalValue, setProposalValue] = useState('');
  const [paymentType, setPaymentType] = useState('À vista');

  useEffect(() => {
    fetchProposals();
    fetchFormData();
  }, []);

  async function fetchProposals() {
    try {
      const { data, error } = await supabase
        .from('proposals')
        .select('*')
        .order('created_at', { ascending: false });

      if (error) throw error;
      setProposals(data || []);
    } catch (error) {
      console.error('Error fetching proposals:', error);
    } finally {
      setLoading(false);
    }
  }

  async function fetchFormData() {
    const [leadsRes, propsRes] = await Promise.all([
      supabase.from('leads').select('id, name'),
      supabase.from('properties').select('id, title, code')
    ]);
    setLeads((leadsRes.data as any) || []);
    setProperties((propsRes.data as any) || []);
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const { error } = await supabase.from('proposals').insert([{
        proposal_number: `PROP-${Math.floor(1000 + Math.random() * 9000)}`,
        client_name: leads.find(l => l.id === selectedLead)?.name || '',
        value: parseFloat(proposalValue),
        status: 'Em Análise',
        payment_type: paymentType,
        current_stage: 1,
        lead_id: selectedLead,
        property_id: selectedProperty,
      }]);

      if (error) throw error;
      setIsModalOpen(false);
      fetchProposals();
    } catch (error) {
      console.error('Error creating proposal:', error);
    }
  };

  const filteredProposals = proposals.filter(p => 
    p.client_name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    p.proposal_number.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'Aprovada': return 'text-emerald-600 bg-emerald-500/10 border-emerald-500/20';
      case 'Recusada': return 'text-rose-600 bg-rose-500/10 border-rose-100';
      case 'Em Análise': return 'text-amber-400 bg-amber-500/10 border-amber-500/20';
      default: return 'text-slate-300 bg-white/5 border-white/5';
    }
  };

  const stages = [
    { id: 1, name: 'Nova Proposta' },
    { id: 2, name: 'Análise de Crédito' },
    { id: 3, name: 'Aprovação Cliente' },
    { id: 4, name: 'Assinatura' },
    { id: 5, name: 'Fechada' }
  ];

  return (
    <div className="space-y-6">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-white">Propostas</h1>
          <p className="text-slate-400">Acompanhe o funil de negociações e propostas ativas.</p>
        </div>
        <button 
          onClick={() => setIsModalOpen(true)}
          className="flex items-center justify-center gap-2 bg-cyan-500 hover:bg-cyan-600 text-white px-4 py-2 rounded-xl transition-colors font-bold shadow-md shadow-cyan-500/20"
        >
          <Plus className="w-4 h-4" />
          Nova Proposta
        </button>
      </div>

      {/* Stats Summary Dashboard */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="bg-white/5 p-5 rounded-2xl border border-cyan-900/30 shadow-sm hover:shadow-md transition-all">
          <div className="flex items-start justify-between">
            <div>
              <p className="text-sm text-slate-400 font-bold mb-1">Total Ativas</p>
              <p className="text-3xl font-black text-white">{proposals.length}</p>
            </div>
            <div className="w-10 h-10 rounded-xl bg-blue-500/10 flex items-center justify-center text-cyan-500">
              <FileText className="w-5 h-5" />
            </div>
          </div>
        </div>

        <div className="bg-white/5 p-5 rounded-2xl border border-cyan-900/30 shadow-sm hover:shadow-md transition-all">
          <div className="flex items-start justify-between">
            <div>
              <p className="text-sm text-slate-400 font-bold mb-1">Em Análise</p>
              <p className="text-3xl font-black text-white">
                {proposals.filter(p => p.status === 'Em Análise').length}
              </p>
            </div>
            <div className="w-10 h-10 rounded-xl bg-amber-500/10 flex items-center justify-center text-amber-400">
              <Clock className="w-5 h-5" />
            </div>
          </div>
        </div>

        <div className="bg-white/5 p-5 rounded-2xl border border-cyan-900/30 shadow-sm hover:shadow-md transition-all">
          <div className="flex items-start justify-between">
            <div>
              <p className="text-sm text-slate-400 font-bold mb-1">Aprovadas</p>
              <p className="text-3xl font-black text-white">
                {proposals.filter(p => p.status === 'Aprovada').length}
              </p>
            </div>
            <div className="w-10 h-10 rounded-xl bg-emerald-500/10 flex items-center justify-center text-emerald-600">
              <CheckCircle2 className="w-5 h-5" />
            </div>
          </div>
        </div>

        <div className="bg-white/5 p-5 rounded-2xl border border-cyan-900/30 shadow-sm hover:shadow-md transition-all">
          <div className="flex items-start justify-between">
            <div>
              <p className="text-sm text-slate-400 font-bold mb-1">Recusadas</p>
              <p className="text-3xl font-black text-white">
                {proposals.filter(p => p.status === 'Recusada').length}
              </p>
            </div>
            <div className="w-10 h-10 rounded-xl bg-rose-500/10 flex items-center justify-center text-rose-600">
              <XCircle className="w-5 h-5" />
            </div>
          </div>
        </div>
      </div>

      {/* Filters & Search */}
      <div className="bg-white/5 p-4 rounded-2xl border border-cyan-900/30 shadow-sm flex flex-col md:flex-row gap-4">
        <div className="relative flex-1">
          <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
          <input 
            type="text" 
            placeholder="Buscar proposta, cliente ou imóvel..."
            className="w-full pl-12 pr-4 py-2.5 rounded-xl bg-white/5 border border-cyan-900/30 focus:outline-none focus:ring-2 focus:ring-cyan-500/20 focus:border-cyan-500 transition-all text-sm font-medium"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
          />
        </div>
        <div className="flex gap-2">
          <button className="flex items-center gap-2 px-6 py-2.5 border border-cyan-900/30 rounded-xl hover:bg-white/5 transition-colors text-slate-300 font-bold text-sm">
            <Filter className="w-4 h-4" />
            Filtros
          </button>
        </div>
      </div>

      {/* Proposals List */}
      <div className="glass-neon-card shadow-sm overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="bg-white/[0.03] border-b border-white/5">
                <th className="px-6 py-4 text-[10px] font-black text-slate-400 uppercase tracking-wider">Proposta / Imóvel</th>
                <th className="px-6 py-4 text-[10px] font-black text-slate-400 uppercase tracking-wider">Cliente</th>
                <th className="px-6 py-4 text-[10px] font-black text-slate-400 uppercase tracking-wider">Valor / Pagamento</th>
                <th className="px-6 py-4 text-[10px] font-black text-slate-400 uppercase tracking-wider">Estágio Atual (Funil)</th>
                <th className="px-6 py-4 text-[10px] font-black text-slate-400 uppercase tracking-wider text-center">Status</th>
                <th className="px-6 py-4 text-[10px] font-black text-slate-400 uppercase tracking-wider text-right">Ações</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {loading ? (
                <tr>
                  <td colSpan={6} className="px-6 py-8 text-center text-slate-400 font-medium">Carregando propostas...</td>
                </tr>
              ) : filteredProposals.length === 0 ? (
                <tr>
                  <td colSpan={6} className="px-6 py-8 text-center text-slate-400 font-medium">Nenhuma proposta encontrada.</td>
                </tr>
              ) : (
                filteredProposals.map((proposal) => {
                  const currentStageIndex = proposal.current_stage ? proposal.current_stage - 1 : 0;
                  
                  return (
                    <tr key={proposal.id} className="hover:bg-white/5 transition-colors group">
                      <td className="px-6 py-4">
                        <div className="flex items-center gap-3">
                          <div className="w-10 h-10 rounded-xl bg-white/5 flex items-center justify-center text-slate-400">
                            <FileText className="w-5 h-5" />
                          </div>
                          <div>
                            <p className="font-black text-sm text-white">{proposal.proposal_number}</p>
                            <p className="text-[10px] font-bold text-slate-400">ID: {proposal.property_id?.slice(0,6) || 'N/A'}</p>
                          </div>
                        </div>
                      </td>
                      <td className="px-6 py-4">
                        <div className="flex flex-col">
                          <span className="text-sm font-bold text-white">{proposal.client_name}</span>
                          <span className="text-[10px] font-bold text-slate-400">Lead ID: {proposal.lead_id?.slice(0, 8)}</span>
                        </div>
                      </td>
                      <td className="px-6 py-4">
                        <div className="flex flex-col">
                          <span className="text-sm font-black text-white">{formatCurrency(proposal.value)}</span>
                          <span className="text-[10px] font-bold text-slate-400">{proposal.payment_type}</span>
                        </div>
                      </td>
                      <td className="px-6 py-4 w-64">
                        <div className="space-y-2">
                          <div className="flex justify-between text-[10px] font-bold text-slate-400 mb-1">
                            <span>{stages[currentStageIndex]?.name || 'Análise'}</span>
                            <span>{currentStageIndex + 1}/{stages.length}</span>
                          </div>
                          <div className="flex gap-1 h-1.5 w-full">
                            {stages.map((stage, idx) => {
                              let bg = "bg-white/5"; // pending
                              if (idx < currentStageIndex) bg = "bg-emerald-500"; // completed
                              else if (idx === currentStageIndex) {
                                if (proposal.status === 'Recusada') bg = "bg-rose-500";
                                else bg = "bg-cyan-500"; // current
                              }
                              return (
                                <div key={stage.id} className={cn("flex-1 rounded-full", bg)} />
                              )
                            })}
                          </div>
                        </div>
                      </td>
                      <td className="px-6 py-4 text-center">
                        <span className={cn(
                          "inline-flex items-center px-2.5 py-1 rounded-lg text-[10px] font-black border uppercase tracking-wider",
                          getStatusColor(proposal.status)
                        )}>
                          {proposal.status}
                        </span>
                      </td>
                      <td className="px-6 py-4 text-right">
                        <button className="p-2 glass-neon-card hover:border-cyan-500 hover:text-cyan-400 transition-all shadow-sm">
                          <ChevronRight className="w-4 h-4" />
                        </button>
                      </td>
                    </tr>
                  )
                })
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* New Proposal Modal - Slide Over Style */}
      <AnimatePresence>
        {isModalOpen && (
          <>
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setIsModalOpen(false)}
              className="fixed inset-0 bg-[#0a0a0a]/40 backdrop-blur-sm z-40"
            />
            <motion.div
              initial={{ x: '100%', opacity: 0 }}
              animate={{ x: 0, opacity: 1 }}
              exit={{ x: '100%', opacity: 0 }}
              transition={{ type: 'spring', damping: 25, stiffness: 200 }}
              className="fixed inset-y-0 right-0 w-full max-w-md bg-white/5 shadow-2xl z-50 flex flex-col border-l border-cyan-900/30"
            >
              <div className="p-6 border-b border-white/5 flex items-center justify-between bg-white/[0.03]">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-xl bg-cyan-500/20 flex items-center justify-center text-cyan-400">
                    <Plus className="w-5 h-5" />
                  </div>
                  <div>
                    <h2 className="text-lg font-bold text-white">Nova Proposta</h2>
                    <p className="text-xs font-bold text-slate-400">Preencha os dados da negociação</p>
                  </div>
                </div>
                <button 
                  onClick={() => setIsModalOpen(false)}
                  className="p-2 hover:bg-white/10 rounded-full transition-colors text-slate-400"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>

              <div className="flex-1 overflow-y-auto">
                <form id="proposal-form" onSubmit={handleSubmit} className="p-6 space-y-6">
                  {/* Lead Selection */}
                  <div className="space-y-2">
                    <label className="text-xs font-bold text-slate-300 uppercase tracking-wider">Lead / Cliente *</label>
                    <AsyncCombobox
                      placeholder="Buscar lead pelo nome..."
                      table="leads"
                      searchFields={["name"]}
                      selectFields="id,name"
                      labelField="name"
                      value={selectedLead}
                      onChange={(item: LookupItem | null) => setSelectedLead(item?.id || '')}
                    />
                  </div>

                  {/* Property Selection */}
                  <div className="space-y-2">
                    <label className="text-xs font-bold text-slate-300 uppercase tracking-wider">Imóvel *</label>
                    <AsyncCombobox
                      placeholder="Buscar imóvel pelo título ou código..."
                      table="properties"
                      searchFields={["title","code"]}
                      selectFields="id,title,code"
                      labelField="title"
                      subtitleField="code"
                      value={selectedProperty}
                      onChange={(item: LookupItem | null) => setSelectedProperty(item?.id || '')}
                    />
                  </div>

                  {/* Value */}
                  <div className="space-y-2">
                    <label className="text-xs font-bold text-slate-300 uppercase tracking-wider">Valor da Proposta *</label>
                    <div className="relative">
                      <span className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400 font-bold">R$</span>
                      <input 
                        type="number" 
                        required
                        placeholder="0,00"
                        className="w-full pl-12 pr-4 py-3 rounded-xl bg-white/5 border border-cyan-900/30 focus:outline-none focus:ring-2 focus:ring-cyan-500/20 focus:border-cyan-500 transition-all text-sm font-bold"
                        value={proposalValue}
                        onChange={(e) => setProposalValue(e.target.value)}
                      />
                    </div>
                  </div>

                  {/* Payment Type */}
                  <div className="space-y-2">
                    <label className="text-xs font-bold text-slate-300 uppercase tracking-wider">Forma de Pagamento *</label>
                    <select 
                      required
                      className="w-full px-4 py-3 rounded-xl bg-white/5 border border-cyan-900/30 focus:outline-none focus:ring-2 focus:ring-cyan-500/20 focus:border-cyan-500 transition-all text-sm font-medium"
                      value={paymentType}
                      onChange={(e) => setPaymentType(e.target.value)}
                    >
                      <option value="À vista">À vista</option>
                      <option value="Financiamento">Financiamento</option>
                      <option value="Parcelamento Direto">Parcelamento Direto</option>
                      <option value="Permuta">Permuta</option>
                    </select>
                  </div>
                </form>
              </div>

              <div className="p-6 border-t border-white/5 bg-white/[0.03] flex items-center justify-end gap-3">
                <button 
                  type="button"
                  onClick={() => setIsModalOpen(false)}
                  className="px-6 py-3 rounded-xl border border-cyan-900/30 text-slate-300 font-bold hover:bg-white/5 transition-colors"
                >
                  Cancelar
                </button>
                <button 
                  type="submit"
                  form="proposal-form"
                  className="px-6 py-3 rounded-xl bg-cyan-500 text-white font-bold hover:bg-cyan-600 transition-colors shadow-md shadow-cyan-500/20 flex items-center gap-2"
                >
                  Confirmar Proposta
                  <ArrowRight className="w-4 h-4" />
                </button>
              </div>
            </motion.div>
          </>
        )}
      </AnimatePresence>
    </div>
  );
}
