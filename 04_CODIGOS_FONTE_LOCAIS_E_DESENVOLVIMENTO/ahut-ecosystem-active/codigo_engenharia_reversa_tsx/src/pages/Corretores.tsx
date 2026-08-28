import React, { useState } from 'react';
import { useAgents } from '../hooks/useAgents';
import { Search, Plus, Filter, MoreVertical, MapPin, Mail, Phone, Award, Briefcase, Star, Users, Trash2, Edit2, ShieldAlert, TrendingUp } from 'lucide-react';
import { useAuth } from '../hooks/useAuth';
import { cn } from '../lib/utils';

export default function Corretores() {
  const { data: agents = [], isLoading } = useAgents();
  const [searchTerm, setSearchTerm] = useState('');
  const [tab, setTab] = useState<'equipe' | 'performance'>('equipe');
  const { profile } = useAuth();
  
  const filteredAgents = agents.filter(agent => 
    agent.full_name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
    agent.email?.toLowerCase().includes(searchTerm.toLowerCase())
  );

  // Ranking por desempenho acumulado (leads + visitas + vendas)
  const ranking = [...agents]
    .map((a) => ({ agent: a, score: (a.leads_count || 0) + (a.visits_count || 0) + (a.proposals_count || 0) * 3 }))
    .sort((x, y) => y.score - x.score)
    .slice(0, 6);
    const maxScore = ranking[0]?.score || 1;

  return (
    <div className="h-full flex flex-col space-y-6">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h1 className="text-2xl font-bold text-slate-200">Equipe de Corretores</h1>
          <p className="text-slate-400 text-sm">Gerencie o time de vendas e corretores parceiros</p>
        </div>
        
        <div className="flex items-center gap-3 w-full sm:w-auto">
          <div className="flex gap-1 bg-white/5 rounded-xl p-1">
            {(['equipe', 'performance'] as const).map((t) => (
              <button
                key={t}
                onClick={() => setTab(t)}
                className={cn(
                  'px-4 py-1.5 rounded-lg text-sm font-semibold capitalize transition-colors',
                  tab === t ? 'bg-white/5 shadow text-cyan-400' : 'text-slate-400 hover:text-slate-300'
                )}
              >
                {t === 'equipe' ? 'Equipe' : 'Performance'}
              </button>
            ))}
          </div>
          <div className="relative flex-1 sm:w-64">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
            <input 
              type="text" 
              placeholder="Buscar corretor..." 
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full pl-9 pr-4 py-2 bg-white/5 border border-cyan-900/30 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-cyan-500/20 focus:border-orange-500"
            />
          </div>
          <button className="p-2 bg-white/5 border border-cyan-900/30 rounded-xl text-slate-300 hover:bg-white/5 transition-colors">
            <Filter className="w-4 h-4" />
          </button>
          {profile?.role === 'admin' && (
            <button className="flex items-center gap-2 px-4 py-2 bg-orange-600 hover:bg-orange-700 text-white rounded-xl text-sm font-medium transition-colors shadow-sm shadow-cyan-600/20">
              <Plus className="w-4 h-4" />
              <span>Novo Corretor</span>
            </button>
          )}
        </div>
      </div>

      {tab === 'performance' && (
        <div className="glass-neon-card p-6">
          <h3 className="text-lg font-bold text-white flex items-center gap-2 mb-6">
            <TrendingUp className="w-5 h-5 text-cyan-500" /> Ranking e Performance dos Corretores
          </h3>
          <div className="space-y-4">
            {ranking.map(({ agent: a, score }, i) => (
              <div key={a.id} className="flex items-center gap-4">
                <span className={cn(
                  'w-8 h-8 rounded-lg flex items-center justify-center text-sm font-bold shrink-0',
                  i === 0 ? 'bg-amber-500/20 text-amber-400' : i === 1 ? 'bg-white/5 text-slate-300' : i === 2 ? 'bg-cyan-500/20 text-cyan-400' : 'bg-white/5 text-slate-400'
                )}>
                  {i + 1}
                </span>
                <div className="w-10 h-10 rounded-full bg-white/10 text-white flex items-center justify-center text-sm font-bold shrink-0">
                  {a.full_name?.charAt(0)?.toUpperCase() || '?'}
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-bold text-white truncate">{a.full_name}</p>
                  <div className="flex items-center gap-3 text-[10px] text-slate-400 mt-1">
                    <span>{a.leads_count || 0} leads</span>
                    <span>{a.visits_count || 0} visitas</span>
                    <span>{a.proposals_count || 0} vendas</span>
                  </div>
                </div>
                {/* Barra de meta (realizado vs melhor) */}
                <div className="w-40 h-2.5 bg-white/5 rounded-full overflow-hidden">
                  <div
                    className="h-full bg-gradient-to-r from-orange-400 to-orange-600 rounded-full"
                    style={{ width: `${Math.round((score / maxScore) * 100)}%` }}
                  />
                </div>
                <span className="text-sm font-bold text-slate-200 w-10 text-right">{score}</span>
              </div>
            ))}
            {ranking.length === 0 && (
              <p className="text-sm text-slate-400 py-6 text-center">Nenhum corretor com dados de performance ainda.</p>
            )}
          </div>
        </div>
      )}

      {isLoading ? (
        <div className="flex-1 flex items-center justify-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-orange-600"></div>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
          {filteredAgents.map(agent => (
            <div key={agent.id} className="glass-neon-card overflow-hidden hover:shadow-xl hover:shadow-cyan-900/20 transition-all group">
              <div className="h-24 bg-gradient-to-r from-orange-500 to-amber-500 relative">
                <button className="absolute top-3 right-3 p-1.5 bg-white/20 hover:bg-white/30 text-white rounded-lg backdrop-blur-sm transition-colors">
                  <MoreVertical className="w-4 h-4" />
                </button>
              </div>
              
              <div className="px-6 pt-0 pb-6 relative">
                <div className="absolute -top-12 left-6">
                  <div className="w-24 h-24 rounded-2xl border-4 border-white bg-white/5 flex items-center justify-center overflow-hidden shadow-sm">
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
                      <h3 className="font-bold text-lg text-slate-200 line-clamp-1">{agent.full_name}</h3>
                      <p className="text-sm text-slate-400 capitalize flex items-center gap-1.5 mt-0.5">
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
                      <div className="flex items-center gap-2 text-sm text-slate-300">
                        <Award className="w-4 h-4 text-slate-400 shrink-0" />
                        <span className="truncate">CRECI: {agent.creci}</span>
                      </div>
                    )}
                    {agent.phone && (
                      <div className="flex items-center gap-2 text-sm text-slate-300">
                        <Phone className="w-4 h-4 text-slate-400 shrink-0" />
                        <span className="truncate">{agent.phone}</span>
                      </div>
                    )}
                    <div className="flex items-center gap-2 text-sm text-slate-300">
                      <Mail className="w-4 h-4 text-slate-400 shrink-0" />
                      <span className="truncate">{agent.email}</span>
                    </div>
                  </div>

                  <div className="mt-6 pt-6 border-t border-white/5 grid grid-cols-3 gap-4 divide-x divide-slate-100">
                    <div className="text-center">
                      <div className="text-xl font-bold text-slate-200">{agent.leads_count || 0}</div>
                      <div className="text-[10px] font-medium text-slate-400 uppercase tracking-wider mt-1">Leads</div>
                    </div>
                    <div className="text-center">
                      <div className="text-xl font-bold text-slate-200">{agent.visits_count || 0}</div>
                      <div className="text-[10px] font-medium text-slate-400 uppercase tracking-wider mt-1">Visitas</div>
                    </div>
                    <div className="text-center">
                      <div className="text-xl font-bold text-slate-200">{agent.proposals_count || 0}</div>
                      <div className="text-[10px] font-medium text-slate-400 uppercase tracking-wider mt-1">Vendas</div>
                    </div>
                  </div>
                </div>
              </div>
              
              {/* Card Actions Footer */}
              <div className="px-6 py-3 bg-white/5 border-t border-white/5 flex items-center justify-end gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
                <button className="p-2 text-slate-400 hover:text-cyan-400 hover:bg-cyan-500/10 rounded-lg transition-colors">
                  <Edit2 className="w-4 h-4" />
                </button>
                <button className="p-2 text-slate-400 hover:text-rose-400 hover:bg-red-500/10 rounded-lg transition-colors">
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
