import React, { useState } from 'react';
import { Megaphone, TrendingUp, Clapperboard, CalendarClock, Share2, Download, Trash2, Link2, MessageCircle, Plus, Settings } from 'lucide-react';
import { AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, BarChart, Bar } from 'recharts';
import { cn } from '../lib/utils';

// Marketing — engenharia reversa do chunk MarketingLayout-Bc67obq9.js
// tabelas: marketing_assets, marketing_posts, social_integrations | rpc: get_my_tenant_id

const alcanceMensal = [
  { mes: 'Ago', alcance: 5200, engajamento: 340 },
  { mes: 'Set', alcance: 6800, engajamento: 420 },
  { mes: 'Out', alcance: 7400, engajamento: 510 },
  { mes: 'Nov', alcance: 8100, engajamento: 580 },
  { mes: 'Dez', alcance: 9500, engajamento: 640 },
  { mes: 'Jan', alcance: 11200, engajamento: 770 },
];

const midiasMock = [
  { id: 1, nome: 'Flyer Lote Villa Verde', categoria: 'Flyer', tipo: 'image', url: '#' },
  { id: 2, nome: 'Story Condomínio Fechado', categoria: 'Story', tipo: 'image', url: '#' },
  { id: 3, nome: 'Vídeo Tour Apartamento', categoria: 'Vídeo', tipo: 'video', url: '#' },
];

const postsMock = [
  { id: 1, titulo: 'Lançamento Villa dos Ipês', data: '2026-01-15', status: 'agendado', categoria: 'Lançamento' },
  { id: 2, titulo: 'Dica: Financiamento Imobiliário', data: '2026-01-22', status: 'publicado', categoria: 'Dicas' },
];

export default function Marketing() {
  const [tab, setTab] = useState<'dashboard' | 'midias' | 'publicacoes' | 'integracoes'>('dashboard');

  const tabs = [
    { id: 'dashboard', label: 'Dashboard', icon: TrendingUp },
    { id: 'midias', label: 'Biblioteca de Mídias', icon: Clapperboard },
    { id: 'publicacoes', label: 'Publicações', icon: CalendarClock },
    { id: 'integracoes', label: 'Integrações', icon: Share2 },
  ] as const;

  return (
    <div className="space-y-6">
      {/* Cabeçalho + abas */}
      <div className="flex flex-col md:flex-row items-center justify-between gap-3">
        <div>
          <h2 className="text-lg font-bold text-white">Marketing</h2>
          <p className="text-sm text-slate-400">Agende postagens e acompanhe o engajamento.</p>
        </div>
        <div className="flex gap-1 bg-white/5 rounded-xl p-1 flex-wrap">
          {tabs.map((t) => (
            <button
              key={t.id}
              onClick={() => setTab(t.id)}
              className={cn(
                'px-3 py-1.5 rounded-lg text-xs font-semibold flex items-center gap-1.5 transition-colors',
                tab === t.id ? 'bg-white/5 shadow text-cyan-400' : 'text-slate-400 hover:text-slate-300'
              )}
            >
              <t.icon className="w-3.5 h-3.5" /> {t.label}
            </button>
          ))}
        </div>
      </div>

      {tab === 'dashboard' && (
        <>
          {/* KPIs */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            {[
              { label: 'Alcance Total', valor: '48.200', sub: 'últimos 6 meses' },
              { label: 'Cliques nos Links', valor: '3.940', sub: '12,4% CTR' },
              { label: 'Conversões de tráfego', valor: '127', sub: '+8,2% vs anterior' },
            ].map((k) => (
              <div key={k.label} className="glass-neon-card p-5">
                <p className="text-xs text-slate-400 font-bold uppercase flex items-center gap-1.5"><Megaphone className="w-3.5 h-3.5 text-cyan-500" /> {k.label}</p>
                <p className="text-2xl font-bold text-white mt-2">{k.valor}</p>
                <p className="text-[11px] text-slate-400 mt-1">{k.sub}</p>
              </div>
            ))}
          </div>

          {/* Gráfico Alcance vs Engajamento */}
          <div className="glass-card rounded-2xl p-5">
            <h4 className="text-sm font-bold text-white mb-4">Alcance vs Engajamento (últimos 6 meses)</h4>
            <ResponsiveContainer width="100%" height={260}>
              <AreaChart data={alcanceMensal}>
                <defs>
                  <linearGradient id="alc" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#f97316" stopOpacity={0.3} />
                    <stop offset="95%" stopColor="#f97316" stopOpacity={0} />
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" />
                <XAxis dataKey="mes" stroke="#94a3b8" fontSize={12} />
                <YAxis stroke="#94a3b8" fontSize={12} />
                <Tooltip />
                <Area type="monotone" dataKey="alcance" name="Alcance" stroke="#f97316" fill="url(#alc)" strokeWidth={2} />
                <Area type="monotone" dataKey="engajamento" name="Engajamento" stroke="#0ea5e9" fill="none" strokeWidth={2} />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </>
      )}

      {tab === 'midias' && (
        <div className="glass-neon-card p-6">
          <div className="flex items-center justify-between mb-4">
            <h4 className="text-sm font-bold text-white">Biblioteca de Mídias</h4>
            <button className="inline-flex items-center gap-2 bg-cyan-500 hover:bg-cyan-600 text-white px-3 py-2 rounded-xl text-sm font-bold transition-colors">
              <Plus className="w-4 h-4" /> Concluir Upload
            </button>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            {midiasMock.map((m) => (
              <div key={m.id} className="group bg-white/5 rounded-xl border border-cyan-900/30 overflow-hidden">
                <div className="h-32 bg-white/10 flex items-center justify-center text-slate-400 text-xs">{m.categoria}</div>
                <div className="p-3">
                  <p className="text-sm font-bold text-white truncate">{m.nome}</p>
                  <div className="flex gap-1 mt-2">
                    <button className="p-1.5 text-slate-400 hover:text-slate-300 hover:bg-white/5 rounded-lg" title="Baixar"><Download className="w-4 h-4" /></button>
                    <button className="p-1.5 text-slate-400 hover:text-rose-400 hover:bg-red-500/10 rounded-lg" title="Apagar mídia"><Trash2 className="w-4 h-4" /></button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {tab === 'publicacoes' && (
        <div className="glass-neon-card p-6">
          <div className="flex items-center justify-between mb-4">
            <h4 className="text-sm font-bold text-white">Agende postagens e acompanhe o engajamento.</h4>
            <button className="inline-flex items-center gap-2 bg-cyan-500 hover:bg-cyan-600 text-white px-3 py-2 rounded-xl text-sm font-bold transition-colors">
              <Plus className="w-4 h-4" /> Criar Nova Publicação
            </button>
          </div>
          {postsMock.length === 0 && (
            <p className="text-sm text-slate-400 py-8 text-center">Crie sua primeira postagem para aparecer aqui.</p>
          )}
          <div className="space-y-2">
            {postsMock.map((p) => (
              <div key={p.id} className="flex items-center justify-between bg-white/5 rounded-xl p-3">
                <div>
                  <p className="text-sm font-bold text-white">{p.titulo}</p>
                  <p className="text-xs text-slate-400">{p.data} · {p.categoria}</p>
                </div>
                <span className={cn(
                  'text-[10px] font-bold px-2 py-0.5 rounded-full capitalize',
                  p.status === 'agendado' ? 'bg-amber-500/20 text-amber-400' : 'bg-emerald-500/20 text-emerald-400'
                )}>{p.status}</span>
              </div>
            ))}
          </div>
        </div>
      )}

      {tab === 'integracoes' && (
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div className="glass-neon-card p-6">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-[#0a0a0a] text-white flex items-center justify-center"><MessageCircle className="w-5 h-5" /></div>
                <div>
                  <p className="text-sm font-bold text-white">WhatsApp</p>
                  <span className="text-xs text-emerald-600 font-semibold">Conta Conectada</span>
                </div>
              </div>
              <button className="text-xs text-slate-400 hover:text-rose-400 font-semibold">Desconectar</button>
            </div>
            <p className="text-xs text-slate-400 mt-3">Atenda clientes via WhatsApp diretamente no sistema.</p>
          </div>
          <div className="glass-neon-card p-6">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-cyan-600 text-white flex items-center justify-center"><Share2 className="w-5 h-5" /></div>
                <div>
                  <p className="text-sm font-bold text-white">Redes Sociais</p>
                  <span className="text-xs text-slate-400 font-semibold">Desconectado</span>
                </div>
              </div>
              <button className="inline-flex items-center gap-1.5 text-xs text-cyan-400 font-bold"><Settings className="w-3.5 h-3.5" /> Conectar</button>
            </div>
            <p className="text-xs text-slate-400 mt-3">Conecte o User Access Token para gerenciar publicações.</p>
          </div>
        </div>
      )}
    </div>
  );
}