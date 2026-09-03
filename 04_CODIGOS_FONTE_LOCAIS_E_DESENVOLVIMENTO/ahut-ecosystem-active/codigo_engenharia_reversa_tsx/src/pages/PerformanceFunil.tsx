import { useMemo, useState } from 'react';
import {
  FunnelChart, Funnel, LabelList, Tooltip as RcTooltip, ResponsiveContainer,
  AreaChart, Area, XAxis, YAxis, CartesianGrid, BarChart, Bar,
} from 'recharts';
import {
  Filter, RefreshCw, TrendingUp, Clock, CheckCircle2, Target, Users, Trophy,
  ChevronRight, Calendar, Building2, UserRound, Download,
} from 'lucide-react';
import { usePerformance } from '../hooks/usePerformance';
import { useAgents } from '../hooks/useAgents';
import { formatNumber, cn } from '../lib/utils';

const NEON = ['#00FFCC', '#00F5A0', '#38BDF8', '#22d3ee', '#34d399', '#0ea5e9', '#00DF9A', '#a78bfa'];

function fmtSeconds(s: number) {
  if (!s || s < 0) return '—';
  if (s < 60) return `${Math.round(s)}s`;
  if (s < 3600) return `${Math.floor(s / 60)}min ${Math.round(s % 60)}s`;
  const h = Math.floor(s / 3600);
  const m = Math.round((s % 3600) / 60);
  return `${h}h ${m}min`;
}

export default function PerformanceFunil() {
  const [preset, setPreset] = useState<any>('30d');
  const [scope, setScope] = useState<'team' | 'agent'>('team');
  const [agentId, setAgentId] = useState<string | null>(null);
  const [customStart, setCustomStart] = useState('');
  const [customEnd, setCustomEnd] = useState('');

  const { data: agents } = useAgents();
  const report = usePerformance({ preset, customStart, customEnd, scope, agentId });

  const funnelData = useMemo(() => (report.data?.funnel || []).map((s, i) => ({
    ...s, fill: NEON[i % NEON.length],
  })), [report.data]);

  const topBrokers = report.data?.ranking || [];

  const overallMacro = funnelData.length ? funnelData[funnelData.length - 1].macro : 0;
  const totalLeads = funnelData.length ? funnelData[0].count : 0;
  const slaToday = report.data?.sla?.filter((s) => s.day === new Date().toISOString().slice(0, 10))[0];

  return (
    <div className="space-y-7 min-h-full pb-12 relative animate-fade-up">
      {/* Backlight */}
      <div className="absolute top-0 right-1/4 w-[500px] h-[350px] bg-gradient-to-br from-[#00FFCC]/10 via-cyan-600/5 to-transparent rounded-full blur-3xl pointer-events-none -z-10" />
      <div className="absolute top-64 left-8 w-[420px] h-[320px] bg-gradient-to-tr from-[#00DF9A]/5 to-transparent rounded-full blur-3xl pointer-events-none -z-10" />

      {/* ── Header / Controles ── */}
      <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2 mb-1.5">
            <span className="w-2 h-2 rounded-full bg-[#00FFCC] shadow-[0_0_10px_rgba(0,255,204,0.9)]" />
            <span className="text-[11px] font-semibold uppercase tracking-widest text-slate-400">QUBITS APEX • Performance</span>
          </div>
          <h1 className="text-3xl font-bold font-display tracking-tight text-white flex items-center gap-3">
            Funil de Performance
            <span className="text-[10px] font-bold px-2.5 py-1 rounded-full bg-emerald-500/10 text-[#00F5A0] border border-emerald-500/30">
              {scope === 'team' ? 'EQUIPE' : 'CORRETOR'}
            </span>
          </h1>
          <p className="text-sm text-slate-400 mt-1 max-w-2xl font-light">
            Conversão do funil comercial, SLA de atendimento e ranking de corretores em tempo real.
          </p>
        </div>

        {/* Controles: período + escopo */}
        <div className="flex flex-wrap items-center gap-2.5">
          {/* Escopo switch */}
          <div className="flex items-center gap-1 p-1 bg-[#0d1017]/80 backdrop-blur-xl rounded-full border border-white/[0.06]">
            <button
              onClick={() => setScope('team')}
              className={cn('px-3.5 py-1.5 rounded-full text-xs font-semibold flex items-center gap-1.5 transition-all',
                scope === 'team' ? 'pill-nav-active' : 'text-slate-400 hover:text-white')}
            >
              <Building2 className="w-3.5 h-3.5" /> Equipe
            </button>
            <button
              onClick={() => setScope('agent')}
              className={cn('px-3.5 py-1.5 rounded-full text-xs font-semibold flex items-center gap-1.5 transition-all',
                scope === 'agent' ? 'pill-nav-active' : 'text-slate-400 hover:text-white')}
            >
              <UserRound className="w-3.5 h-3.5" /> Individual
            </button>
          </div>

          {/* Time range picker */}
          <div className="flex items-center gap-1 p-1 bg-[#0d1017]/80 backdrop-blur-xl rounded-full border border-white/[0.06]">
            <Calendar className="w-3.5 h-3.5 text-slate-500 ml-2 mr-1" />
            {[['7d', '7d'], ['30d', '30d'], ['90d', '90d'], ['year', '1a']].map(([k, l]) => (
              <button
                key={k}
                onClick={() => setPreset(k)}
                className={cn('px-3 py-1.5 rounded-full text-xs font-semibold transition-all',
                  preset === k ? 'pill-nav-active' : 'text-slate-400 hover:text-white')}
              >
                {l}
              </button>
            ))}
          </div>

          {scope === 'agent' && (
            <select
              value={agentId || ''}
              onChange={(e) => setAgentId(e.target.value || null)}
              className="bg-[#0b0e14] border border-white/[0.08] text-slate-200 rounded-xl px-3 py-2 text-xs outline-none focus:border-[#00F5A0]/50 transition-all cursor-pointer"
            >
              <option value="">Selecionar corretor</option>
              {(agents || []).map((a) => (
                <option key={a.id} value={a.id}>{a.full_name}</option>
              ))}
            </select>
          )}
        </div>
      </div>

      {/* ── KPI Cards ── */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3.5">
        {[
          { label: 'Leads Encaminhados', value: formatNumber(totalLeads), icon: Users, sub: 'no período' },
          { label: 'Conversão Geral (Macro)', value: `${overallMacro.toLocaleString('pt-BR')}%`, icon: Target, sub: 'leaeds → contrato' },
          { label: 'SLA Hoje (1ª resposta)', value: slaToday ? fmtSeconds(slaToday.avgSeconds) : '—', icon: Clock, sub: slaToday ? `${slaToday.answered} respondido(s)` : 'sem dados' },
          { label: 'Contratos / Vendas', value: formatNumber(funnelData[funnelData.length - 1]?.count || 0), icon: TrendingUp, sub: 'meta critica' },
        ].map((s) => (
          <div key={s.label} className="card-dark-stat p-4">
            <div className="flex items-center justify-between mb-3">
              <div className="w-8 h-8 rounded-xl card-dark/[0.04] border border-white/[0.08] text-[#00FFCC] flex items-center justify-center">
                <s.icon className="w-4 h-4" />
              </div>
              <span className="badge-glow-cyan text-[10px] px-2 py-0.5 rounded-full">{s.sub}</span>
            </div>
            <p className="text-[11px] font-medium text-slate-400 mb-0.5">{s.label}</p>
            <p className="text-2xl font-bold font-display text-white">{s.value}</p>
          </div>
        ))}
      </div>

      {/* ── Funnel + Detalhamento ── */}
      <div className="grid lg:grid-cols-5 gap-6">
        <div className="lg:col-span-3 card-dark p-6">
          <div className="flex items-center justify-between mb-5">
            <div>
              <h3 className="text-lg font-bold font-display text-white">Funil de Conversão</h3>
              <p className="text-xs text-slate-400">Etapas em cascata — valor e % de conversão</p>
            </div>
            <span className="badge-glow-cyan text-[10px] px-2 py-0.5 rounded-full">Micro + Macro</span>
          </div>
          <div className="h-[420px] w-full">
            <ResponsiveContainer width="100%" height="100%">
              <FunnelChart>
                <RcTooltip
                  cursor={{ fill: 'rgba(255,255,255,0.04)' }}
                  content={({ active, payload }: any) => {
                    if (!active || !payload?.length) return null;
                    const d = payload[0]?.payload;
                    return (
                      <div className="p-3 rounded-2xl bg-[#0b0e14]/90 backdrop-blur-2xl border border-white/[0.12] shadow-2xl space-y-1 min-w-[160px]">
                        <p className="text-[11px] font-bold text-white">{d?.name}</p>
                        <div className="flex justify-between text-xs gap-4">
                          <span className="text-slate-300">Valor</span>
                          <span className="text-[#00FFCC] font-bold">{formatNumber(d?.value || d?.count || 0)}</span>
                        </div>
                        <div className="flex justify-between text-xs gap-4">
                          <span className="text-slate-300">Micro (vs anterior)</span>
                          <span className="text-cyan-400 font-bold">{d?.micro ?? 0}%</span>
                        </div>
                        <div className="flex justify-between text-xs gap-4">
                          <span className="text-slate-300">Macro (vs Leads)</span>
                          <span className="text-emerald-400 font-bold">{d?.macro ?? 0}%</span>
                        </div>
                      </div>
                    );
                  }}
                />
                <Funnel dataKey="count" data={funnelData} isAnimationActive lastShapeType="rectangle">
                  <LabelList position="right" fill="#fff" stroke="none" dataKey="name" className="text-[11px] font-semibold" />
                </Funnel>
              </FunnelChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Detalhamento por etapa */}
        <div className="lg:col-span-2 card-dark p-6">
          <h3 className="text-lg font-bold font-display text-white mb-4">Detalhamento por Etapa</h3>
          <div className="space-y-2.5">
            {funnelData.map((s, i) => (
              <div key={s.key} className="p-3 rounded-xl card-dark/[0.04] border border-white/[0.06] transition-all hover:border-white/[0.14]">
                <div className="flex items-center justify-between mb-1.5">
                  <span className="text-xs font-semibold text-slate-200 flex items-center gap-2">
                    <span className="w-2 h-2 rounded-full" style={{ background: NEON[i % NEON.length], boxShadow: `0 0 8px ${NEON[i % NEON.length]}` }} />
                    {s.label}
                  </span>
                  <span className="text-sm font-bold font-display text-white">{formatNumber(s.count)}</span>
                </div>
                <div className="flex items-center justify-between text-[10px] text-slate-400">
                  <span>Micro <span className="text-cyan-400 font-bold">{s.micro}%</span></span>
                  <span className="w-px h-3 bg-white/10" />
                  <span>Macro <span className="text-emerald-400 font-bold">{s.macro}%</span></span>
                </div>
                <div className="mt-1.5 h-1 rounded-full bg-white/[0.05] overflow-hidden">
                  <div className="h-full rounded-full" style={{ width: `${Math.min(100, s.macro)}%`, background: `linear-gradient(90deg, ${NEON[i % NEON.length]}55, ${NEON[i % NEON.length]})` }} />
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* ── SLA diário (concatena dia a dia) ── */}
      <div className="grid lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2 card-dark p-6">
          <div className="flex items-center justify-between mb-4">
            <div>
              <h3 className="text-lg font-bold font-display text-white">SLA de Atendimento — diário</h3>
              <p className="text-xs text-slate-400">Tempo médio de resposta do corretor ao lead, dia a dia</p>
            </div>
            <span className="badge-glow-cyan text-[10px] px-2 py-0.5 rounded-full">média em tempo real</span>
          </div>
          <div className="h-[220px] w-full">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={report.data?.sla || []} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                <defs>
                  <linearGradient id="slaGrad" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="0%" stopColor="#00FFCC" stopOpacity={0.4} />
                    <stop offset="100%" stopColor="#00FFCC" stopOpacity={0} />
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="rgba(255,255,255,0.05)" />
                <XAxis dataKey="day" axisLine={false} tickLine={false} tick={{ fontSize: 10, fill: '#64748B' }} dy={8} />
                <YAxis axisLine={false} tickLine={false} tick={{ fontSize: 10, fill: '#64748B' }} width={40} />
                <RcTooltip
                  content={({ active, payload }: any) => {
                    if (!active || !payload?.length) return null;
                    const d = payload[0];
                    return (
                      <div className="p-3 rounded-2xl bg-[#0b0e14]/90 backdrop-blur-2xl border border-white/[0.12] shadow-2xl space-y-1 min-w-[150px]">
                        <p className="text-[11px] font-semibold text-slate-300">{d?.payload?.day}</p>
                        <div className="flex justify-between text-xs gap-4"><span className="text-slate-300">Média</span><span className="text-[#00FFCC] font-bold">{fmtSeconds(d?.value)}</span></div>
                        <div className="flex justify-between text-xs gap-4"><span className="text-slate-300">Respondidos</span><span className="text-emerald-400 font-bold">{d?.payload?.answered ?? 0}</span></div>
                        <div className="flex justify-between text-xs gap-4"><span className="text-slate-300">Pendentes</span><span className="text-amber-400 font-bold">{d?.payload?.pending ?? 0}</span></div>
                      </div>
                    );
                  }}
                />
                <Area type="monotone" dataKey="avgSeconds" stroke="#00FFCC" strokeWidth={2.5} fill="url(#slaGrad)" name="Tempo médio (s)" />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </div>

        <div className="card-dark p-6 flex flex-col justify-between">
          <div>
            <div className="flex items-center gap-2 mb-3">
              <CheckCircle2 className="w-4 h-4 text-[#00F5A0]" />
              <h3 className="text-base font-bold font-display text-white">Saúde do Atendimento</h3>
            </div>
            <div className="space-y-3">
              <div className="p-3 rounded-xl bg-cyan-500/[0.06] border border-cyan-500/20">
                <p className="text-[11px] text-slate-300">SLA Hoje (média)</p>
                <p className="text-2xl font-bold font-display text-[#00FFCC]">{fmtSeconds(slaToday?.avgSeconds || 0)}</p>
              </div>
              <div className="p-3 rounded-xl bg-emerald-500/[0.06] border border-emerald-500/20">
                <p className="text-[11px] text-slate-300">Respondidos hoje</p>
                <p className="text-2xl font-bold font-display text-emerald-300">{slaToday?.answered ?? 0}</p>
              </div>
              <div className="p-3 rounded-xl bg-amber-500/[0.06] border border-amber-500/20">
                <p className="text-[11px] text-slate-300">Em aberto hoje</p>
                <p className="text-2xl font-bold font-display text-amber-300">{slaToday?.pending ?? 0}</p>
              </div>
            </div>
          </div>
          <p className="text-[10px] text-slate-500 mt-4">
            SLA = intervalo entre a mensagem do lead e a 1ª resposta do corretor (limiar {10} min).
          </p>
        </div>
      </div>

      {/* ── Ranking de Corretores (escopo global) / Resumo individual ── */}
      <div className="card-dark p-6">
        {scope === 'team' ? (
          <>
            <div className="flex items-center justify-between mb-5">
              <div>
                <h3 className="text-lg font-bold font-display text-white flex items-center gap-2">
                  <Trophy className="w-4 h-4 text-amber-400" /> Ranking de Corretores
                </h3>
                <p className="text-xs text-slate-400">Performance individual no período — ordenado por contratos</p>
              </div>
              <button className="flex items-center gap-1.5 text-xs text-slate-400 hover:text-white transition-colors">
                <Download className="w-3.5 h-3.5" /> Exportar
              </button>
            </div>

            <div className="overflow-x-auto">
              <table className="w-full text-xs">
                <thead>
                  <tr className="text-left text-[10px] uppercase tracking-wider text-slate-500 border-b border-white/[0.08]">
                    <th className="py-2.5 pr-3">#</th>
                    <th className="py-2.5 pr-3">Corretor</th>
                    <th className="py-2.5 px-2 text-right">Leads</th>
                    <th className="py-2.5 px-2 text-right">Atend.</th>
                    <th className="py-2.5 px-2 text-right">SLA %</th>
                    <th className="py-2.5 px-2 text-right">Inter.</th>
                    <th className="py-2.5 px-2 text-right">Follow</th>
                    <th className="py-2.5 px-2 text-right">Agend.</th>
                    <th className="py-2.5 px-2 text-right">Propostas</th>
                    <th className="py-2.5 px-2 text-right">Contratos</th>
                    <th className="py-2.5 pl-2 text-right">Tx Conv.</th>
                  </tr>
                </thead>
                <tbody>
                  {(topBrokers.length ? topBrokers : Array.from({ length: 6 }).map((_, i) => ({
                    id: String(i), name: `—`, leads: 0, atendimentos: 0, slaOk: 0, interessados: 0,
                    followups: 0, agendamentos: 0, propostas: 0, contratos: 0, taxa: 0,
                  }))).slice(0, 10).map((b, i) => (
                    <tr key={b.id} className="border-b border-white/[0.04] hover:bg-white/[0.02] transition-colors">
                      <td className="py-2.5 pr-3">
                        <span className={cn('w-6 h-6 rounded-lg flex items-center justify-center text-[10px] font-bold',
                          i === 0 ? 'bg-amber-500/15 text-amber-300 border border-amber-500/30'
                            : i === 1 ? 'bg-slate-400/10 text-slate-300 border border-white/10'
                            : i === 2 ? 'bg-orange-500/10 text-orange-300 border border-orange-500/20'
                            : 'card-dark/[0.04] text-slate-400 border border-white/[0.05]')}>
                          {i + 1}
                        </span>
                      </td>
                      <td className="py-2.5 pr-3 font-semibold text-slate-100">{b.name}</td>
                      <td className="py-2.5 px-2 text-right text-slate-300">{formatNumber(b.leads)}</td>
                      <td className="py-2.5 px-2 text-right text-slate-300">{formatNumber(b.atendimentos)}</td>
                      <td className="py-2.5 px-2 text-right text-[#00F5A0]">{b.atendimentos ? Math.round((b.slaOk / b.atendimentos) * 100) : 0}%</td>
                      <td className="py-2.5 px-2 text-right text-slate-300">{formatNumber(b.interessados)}</td>
                      <td className="py-2.5 px-2 text-right text-slate-300">{formatNumber(b.followups)}</td>
                      <td className="py-2.5 px-2 text-right text-slate-300">{formatNumber(b.agendamentos)}</td>
                      <td className="py-2.5 px-2 text-right text-cyan-300">{formatNumber(b.propostas)}</td>
                      <td className="py-2.5 px-2 text-right text-emerald-300 font-bold">{formatNumber(b.contratos)}</td>
                      <td className="py-2.5 pl-2 text-right text-white font-bold">{b.taxa}%</td>
                    </tr>
                  ))}
                  {topBrokers.length === 0 && (
                    <tr><td colSpan={11} className="py-6 text-center text-slate-500 text-xs">Sem dados no período selecionado.</td></tr>
                  )}
                </tbody>
              </table>
            </div>
          </>
        ) : (
          <div className="flex items-center justify-between gap-4 flex-wrap">
            <div className="flex items-center gap-3">
              <div className="w-11 h-11 rounded-xl bg-gradient-to-tr from-[#00FFCC]/20 to-[#00DF9A]/20 border border-emerald-500/30 flex items-center justify-center font-bold text-[#00FFCC]">
                {(report.data?.broker?.name || '?').slice(0, 2).toUpperCase()}
              </div>
              <div>
                <p className="text-sm font-bold text-white">{report.data?.broker?.name || 'Corretor'}</p>
                <p className="text-[11px] text-slate-400">Meta: {formatNumber(report.data?.broker?.contratos || 0)} contratos</p>
              </div>
            </div>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
              {[
                { l: 'Leads', v: report.data?.broker?.leads, c: 'text-white' },
                { l: 'Atendimentos', v: report.data?.broker?.atendimentos, c: 'text-white' },
                { l: 'SLA %', v: report.data?.broker?.atendimentos ? Math.round((report.data?.broker?.slaOk || 0) / report.data?.broker?.atendimentos * 100) : 0, c: 'text-[#00F5A0]' },
                { l: 'Contratos', v: report.data?.broker?.contratos, c: 'text-emerald-300' },
              ].map((k) => (
                <div key={k.l} className="card-dark/[0.04] border border-white/[0.06] rounded-xl p-3">
                  <p className="text-[10px] text-slate-400">{k.l}</p>
                  <p className={cn('text-lg font-bold font-display', k.c)}>{k.v ?? '—'}</p>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}