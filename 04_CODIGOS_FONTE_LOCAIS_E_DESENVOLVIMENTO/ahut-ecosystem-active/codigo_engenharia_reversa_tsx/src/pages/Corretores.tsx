import React, { useState } from 'react';
import { useAgents } from '../hooks/useAgents';
import { Search, Plus, Filter, MoreVertical, MapPin, Mail, Phone, Award, Briefcase, Star, Users, Trash2, Edit2, ShieldAlert } from 'lucide-react';
import { useAuth } from '../hooks/useAuth';

export default function Corretores() {
  const { data: agents = [], isLoading } = useAgents();
  const [searchTerm, setSearchTerm] = useState('');
  const { profile } = useAuth();
  
  const filteredAgents = agents.filter(agent => 
    agent.full_name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
    agent.email?.toLowerCase().includes(searchTerm.toLowerCase())
  );

  return (
    <div className="h-full flex flex-col space-y-6">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h1 className="text-2xl font-bold text-slate-800">Equipe de Corretores</h1>
          <p className="text-slate-500 text-sm">Gerencie o time de vendas e corretores parceiros</p>
        </div>
        
        <div className="flex items-center gap-3 w-full sm:w-auto">
          <div className="relative flex-1 sm:w-64">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
            <input 
              type="text" 
              placeholder="Buscar corretor..." 
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full pl-9 pr-4 py-2 bg-white border border-slate-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-orange-500/20 focus:border-orange-500"
            />
          </div>
          <button className="p-2 bg-white border border-slate-200 rounded-xl text-slate-600 hover:bg-slate-50 transition-colors">
            <Filter className="w-4 h-4" />
          </button>
          {profile?.role === 'admin' && (
            <button className="flex items-center gap-2 px-4 py-2 bg-orange-600 hover:bg-orange-700 text-white rounded-xl text-sm font-medium transition-colors shadow-sm shadow-orange-600/20">
              <Plus className="w-4 h-4" />
              <span>Novo Corretor</span>
            </button>
          )}
        </div>
      </div>

      {isLoading ? (
        <div className="flex-1 flex items-center justify-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-orange-600"></div>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
          {filteredAgents.map(agent => (
            <div key={agent.id} className="bg-white border border-slate-200 rounded-2xl overflow-hidden hover:shadow-xl hover:shadow-slate-200/50 transition-all group">
              <div className="h-24 bg-gradient-to-r from-orange-500 to-amber-500 relative">
                <button className="absolute top-3 right-3 p-1.5 bg-white/20 hover:bg-white/30 text-white rounded-lg backdrop-blur-sm transition-colors">
                  <MoreVertical className="w-4 h-4" />
                </button>
              </div>
              
              <div className="px-6 pt-0 pb-6 relative">
                <div className="absolute -top-12 left-6">
                  <div className="w-24 h-24 rounded-2xl border-4 border-white bg-slate-100 flex items-center justify-center overflow-hidden shadow-sm">
                    {agent.avatar_url ? (
                      <img src={agent.avatar_url} alt={agent.full_name} className="w-full h-full object-cover" />
                    ) : (
                      <span className="text-3xl font-bold text-slate-300">
                        {agent.full_name?.charAt(0).toUpperCase()}
                      </span>
                    )}
                  </div>
                </div>

                <div className="pt-14">
                  <div className="flex items-start justify-between">
                    <div>
                      <h3 className="font-bold text-lg text-slate-800 line-clamp-1">{agent.full_name}</h3>
                      <p className="text-sm text-slate-500 capitalize flex items-center gap-1.5 mt-0.5">
                        {agent.role === 'admin' ? (
                          <ShieldAlert className="w-3.5 h-3.5 text-amber-500" />
                        ) : (
                          <Briefcase className="w-3.5 h-3.5 text-slate-400" />
                        )}
                        {agent.role || 'Corretor'}
                      </p>
                    </div>
                  </div>

                  <div className="mt-4 space-y-2">
                    {agent.creci && (
                      <div className="flex items-center gap-2 text-sm text-slate-600">
                        <Award className="w-4 h-4 text-slate-400 shrink-0" />
                        <span className="truncate">CRECI: {agent.creci}</span>
                      </div>
                    )}
                    {agent.phone && (
                      <div className="flex items-center gap-2 text-sm text-slate-600">
                        <Phone className="w-4 h-4 text-slate-400 shrink-0" />
                        <span className="truncate">{agent.phone}</span>
                      </div>
                    )}
                    <div className="flex items-center gap-2 text-sm text-slate-600">
                      <Mail className="w-4 h-4 text-slate-400 shrink-0" />
                      <span className="truncate">{agent.email}</span>
                    </div>
                  </div>

                  <div className="mt-6 pt-6 border-t border-slate-100 grid grid-cols-3 gap-4 divide-x divide-slate-100">
                    <div className="text-center">
                      <div className="text-xl font-bold text-slate-800">{agent.leads_count || 0}</div>
                      <div className="text-[10px] font-medium text-slate-500 uppercase tracking-wider mt-1">Leads</div>
                    </div>
                    <div className="text-center">
                      <div className="text-xl font-bold text-slate-800">{agent.visits_count || 0}</div>
                      <div className="text-[10px] font-medium text-slate-500 uppercase tracking-wider mt-1">Visitas</div>
                    </div>
                    <div className="text-center">
                      <div className="text-xl font-bold text-slate-800">{agent.proposals_count || 0}</div>
                      <div className="text-[10px] font-medium text-slate-500 uppercase tracking-wider mt-1">Vendas</div>
                    </div>
                  </div>
                </div>
              </div>
              
              {/* Card Actions Footer */}
              <div className="px-6 py-3 bg-slate-50 border-t border-slate-100 flex items-center justify-end gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
                <button className="p-2 text-slate-400 hover:text-orange-600 hover:bg-orange-50 rounded-lg transition-colors">
                  <Edit2 className="w-4 h-4" />
                </button>
                <button className="p-2 text-slate-400 hover:text-red-600 hover:bg-red-50 rounded-lg transition-colors">
                  <Trash2 className="w-4 h-4" />
                </button>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
