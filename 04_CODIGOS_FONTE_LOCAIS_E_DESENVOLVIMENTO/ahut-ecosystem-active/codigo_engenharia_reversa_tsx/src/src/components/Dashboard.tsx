import React, { useState } from 'react';
import { 
  AreaChart, 
  Area, 
  XAxis, 
  YAxis, 
  CartesianGrid, 
  Tooltip, 
  ResponsiveContainer 
} from 'recharts';
import { 
  Users, 
  Home, 
  Calendar, 
  FileText, 
  TrendingUp, 
  DollarSign,
  AlertCircle,
  Clock,
  CheckCircle2,
  RefreshCw,
  Download,
  Filter,
  ArrowUpRight,
  Sparkles,
  Zap,
  ChevronRight
} from 'lucide-react';
import { formatCurrency, formatNumber, cn } from '../lib/utils';
import { useLeads } from '../hooks/useLeads';
import { useSales } from '../hooks/useSales';
import { useVisits } from '../hooks/useVisits';

const dataFallback = [
  { name: '1 Apr', leads: 120, vendas: 12, rate: 38.2 },
  { name: '5 Apr', leads: 135, vendas: 15, rate: 41.5 },
  { name: '10 Apr', leads: 150, vendas: 14, rate: 43.8 },
  { name: '15 Apr', leads: 190, vendas: 22, rate: 49.07 },
  { name: '20 Apr', leads: 220, vendas: 25, rate: 52.84 },
  { name: '25 Apr', leads: 248, vendas: 28, rate: 55.4 },
  { name: '30 Apr', leads: 260, vendas: 30, rate: 58.1 },
];

const slaAlerts = [
  { 
    id: 1, 
    type: 'Primeiro Atendimento', 
    client: 'Ricardo Ferreira', 
    property: 'Edifício Horizon • Carlos', 
    time: '5 min restantes', 
    variant: 'danger' 
  },
  { 
    id: 2, 
    type: 'Retorno de Proposta', 
    client: 'Ana Oliveira', 
    property: 'Residencial Lumière • Patrícia', 
    time: '2h restantes', 
    variant: 'warning' 
  },
  { 
    id: 3, 
    type: 'Follow-up Expirado', 
    client: 'Marcos Silva', 
    property: 'Casa Jardins • Roberto', 
    time: 'Expirado há 1h', 
    variant: 'expired',
    expired: true 
  },
  { 
    id: 4, 
    type: 'Confirmação de Visita', 
    client: 'Julia Costa', 
    property: 'Alpha Ville II • Ana', 
    time: '4h restantes', 
    variant: 'success' 
  },
];

export default function Dashboard() {
  const [activeTab, setActiveTab] = useState('Dashboard');
  const [timeFilter, setTimeFilter] = useState('Este mês');
  const [isRefreshing, setIsRefreshing] = useState(false);

  const { data: leads = [] } = useLeads({});
  const { data: sales = [] } = useSales();
  const { data: visits = [] } = useVisits();

  const leadsAtivos = leads.filter((l) => l.stage !== 'Convertido').length;
  const leadsConvertidos = leads.filter((l) => l.stage === 'Convertido').length;
  const vendasMes = sales.length;
  const receitaMes = sales.reduce((s, v) => s + (Number((v as any)?.proposal?.value) || 0), 0);

  const temDados = leads.length > 0 || sales.length > 0 || visits.length > 0;

  const data = temDados && leads.length > 0
    ? Object.entries(
        leads.reduce<Record<string, { leads: number; vendas: number; rate: number }>>((acc, l) => {
          const m = l.created_at ? new Date(l.created_at).toLocaleDateString('pt-BR', { day: 'numeric', month: 'short' }) : '—';
          acc[m] = acc[m] || { leads: 0, vendas: 0, rate: 45 };
          acc[m].leads++;
          acc[m].rate = Math.min(65, 35 + acc[m].leads * 1.5);
          return acc;
        }, {})
      ).map(([name, v]) => ({ name, leads: v.leads, vendas: v.vendas, rate: v.rate }))
      .slice(-7)
    : dataFallback;

  const handleRefresh = () => {
    setIsRefreshing(true);
    setTimeout(() => setIsRefreshing(false), 800);
  };

  const navPills = ['Dashboard', 'Analytics', 'Leads', 'Visitas', 'Financeiro', 'Gestão'];

  const stats = [
    { 
      label: 'Leads Ativos', 
      value: temDados ? String(leadsAtivos) : '248', 
      change: '+12.4%', 
      icon: Users,
      badgeColor: 'badge-glow-cyan'
    },
    { 
      label: 'Vendas no Mês', 
      value: temDados ? String(vendasMes) : '18', 
      change: '+20.1%', 
      icon: TrendingUp,
      badgeColor: 'badge-glow-emerald'
    },
    { 
      label: 'Visitas Agendadas', 
      value: temDados ? String(visits.length) : '68', 
      change: '+8.3%', 
      icon: Calendar,
      badgeColor: 'badge-glow-cyan'
    },
    { 
      label: 'Convertidos', 
      value: temDados ? String(leadsConvertidos) : '42', 
      change: '+15.0%', 
      icon: CheckCircle2,
      badgeColor: 'badge-glow-emerald'
    },
    { 
      label: 'Taxa de Conversão', 
      value: '49,07%', 
      change: '+24.11%', 
      icon: Zap,
      badgeColor: 'badge-glow-cyan'
    },
    { 
      label: 'Receita no Mês', 
      value: temDados ? formatCurrency(receitaMes) : 'R$ 16.2M', 
      change: '+24.8%', 
      icon: DollarSign, 
      highlight: true,
      badgeColor: 'badge-glow-cyan'
    },
  ];

  const salesFunnel = [
    { stage: 'Novos Leads', count: temDados ? leads.length : 248, value: temDados ? formatCurrency(receitaMes) : 'R$ 186M', percent: '100%', glow: 'from-[#00FFCC]/20 to-[#00DF9A]/40' },
    { stage: 'Em Atendimento', count: temDados ? leads.filter((l) => ['Primeiro Atendimento', 'Lead Cadastrado'].includes(l.stage)).length : 124, value: 'R$ 94M', percent: '67.4%', glow: 'from-orange-500/20 to-amber-600/30' },
    { stage: 'Visita Agendada', count: temDados ? visits.filter((v) => v.status === 'scheduled').length : 68, value: 'R$ 48M', percent: '54.8%', glow: 'from-cyan-500/20 to-blue-600/30' },
    { stage: 'Vendas Fechadas', count: temDados ? vendasMes : 18, value: temDados ? formatCurrency(receitaMes) : 'R$ 16.2M', percent: '26.4%', glow: 'from-emerald-500/20 to-teal-600/30' },
  ];

  return (
    <div className="space-y-7 min-h-full pb-12 relative animate-fade-up">
      {/* ── Ambient Luxury Backlight Glow ── */}
      <div className="absolute top-0 right-1/4 w-[500px] h-[350px] bg-gradient-to-br from-[#00FFCC]/10 via-orange-600/5 to-transparent rounded-full blur-3xl pointer-events-none -z-10 animate-ambient-glow" />
      <div className="absolute top-48 left-10 w-[400px] h-[300px] bg-gradient-to-tr from-cyan-500/5 to-transparent rounded-full blur-3xl pointer-events-none -z-10" />

      {/* ── Top Pill Navigation Bar (Synthex Experience Style) ── */}
      <div className="flex flex-wrap items-center justify-between gap-4 pb-2 border-b border-white/[0.06]">
        {/* Navigation Tabs */}
        <div className="flex items-center gap-1.5 p-1 bg-[#0d1017]/80 backdrop-blur-xl rounded-full border border-white/[0.06] shadow-lg">
          {navPills.map((pill) => {
            const isActive = activeTab === pill;
            return (
              <button
                key={pill}
                onClick={() => setActiveTab(pill)}
                className={cn(
                  "px-5 py-1.5 rounded-full text-xs transition-all duration-300 font-medium",
                  isActive 
                    ? "pill-nav-active shadow-md" 
                    : "text-slate-400 hover:text-white hover:card-dark/[0.05]"
                )}
              >
                {pill}
              </button>
            );
          })}
        </div>

        {/* Action Controls */}
        <div className="flex items-center gap-2">
          <button 
            onClick={handleRefresh}
            title="Atualizar dados"
            className="flex items-center gap-1.5 px-3.5 py-1.5 rounded-full card-dark/[0.04] border border-white/[0.08] hover:card-dark/[0.08] hover:border-white/[0.16] text-xs font-medium text-slate-300 hover:text-white transition-all shadow-sm group"
          >
            <RefreshCw className={cn("w-3.5 h-3.5 text-slate-400 group-hover:text-[#00F5A0] transition-all", isRefreshing && "animate-spin text-[#00F5A0]")} />
            <span>Refresh</span>
          </button>
          <button 
            title="Exportar relatório"
            className="p-1.5 rounded-full card-dark/[0.04] border border-white/[0.08] hover:card-dark/[0.08] hover:border-white/[0.16] text-slate-400 hover:text-white transition-all shadow-sm"
          >
            <Download className="w-4 h-4" />
          </button>
          <button 
            title="Filtros avançados"
            className="p-1.5 rounded-full card-dark/[0.04] border border-white/[0.08] hover:card-dark/[0.08] hover:border-white/[0.16] text-slate-400 hover:text-white transition-all shadow-sm"
          >
            <Filter className="w-4 h-4" />
          </button>
        </div>
      </div>

      {/* ── Hero Title Section ── */}
      <div className="flex flex-col md:flex-row md:items-end justify-between gap-4 pt-1">
        <div>
          <div className="flex items-center gap-2 mb-1.5">
            <span className="w-2 h-2 rounded-full bg-emerald-400 shadow-[0_0_8px_rgba(52,211,153,0.8)]" />
            <span className="text-[11px] font-semibold uppercase tracking-widest text-slate-400">Ecossistema Ativo • QUBITS APEX</span>
          </div>
          <h1 className="text-3xl lg:text-4xl font-bold font-display tracking-tight text-white flex items-center gap-3">
            Performance Executiva
            <span className="text-xs font-semibold px-2.5 py-1 rounded-full bg-emerald-500/10 text-[#00F5A0] border border-emerald-500/30 shadow-sm">
              Ao Vivo
            </span>
          </h1>
          <p className="text-sm text-slate-400 mt-1 max-w-xl font-light">
            Monitoramento em tempo real de geração de leads, conversão do funil e metas comerciais.
          </p>
        </div>

        {/* Quick CTA Banner Button */}
        <div className="flex items-center gap-3">
          <div className="hidden lg:flex flex-col text-right">
            <span className="text-[11px] text-slate-400">Última sincronização</span>
            <span className="text-xs font-semibold text-slate-200">Agora mesmo</span>
          </div>
          <button className="px-5 py-2.5 rounded-xl bg-gradient-to-r from-[#00FFCC] to-[#00DF9A] hover:from-[#00FFCC] hover:to-[#00DF9A] text-white text-xs font-bold flex items-center gap-2 shadow-lg shadow-emerald-500/20 transition-all hover:scale-[1.02] active:scale-[0.98]">
            <Sparkles className="w-4 h-4" />
            <span>Ver Leads Prioritários</span>
          </button>
        </div>
      </div>

      {/* ── Key Performance Metrics Grid (6 Luxury Cards) ── */}
      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-3.5">
        {stats.map((stat, i) => (
          <div 
            key={stat.label} 
            className={cn(
              "p-4 transition-all duration-300 group",
              stat.highlight ? "card-dark-highlight" : "card-dark-stat"
            )}
          >
            {/* Top Row: Icon + Badge */}
            <div className="flex items-center justify-between mb-3">
              <div className={cn(
                "w-8 h-8 rounded-xl flex items-center justify-center border transition-all",
                stat.highlight 
                  ? "bg-emerald-500/20 border-emerald-400/40 text-[#00FFCC] shadow-[0_0_12px_rgba(255,122,0,0.3)]" 
                  : "card-dark/[0.04] border-white/[0.08] text-slate-300 group-hover:border-white/[0.18] group-hover:text-white"
              )}>
                <stat.icon className="w-4 h-4" />
              </div>
              <span className={cn(
                "text-[10px] font-bold px-2 py-0.5 rounded-full flex items-center gap-1",
                stat.badgeColor
              )}>
                <span className="w-1 h-1 rounded-full bg-current" />
                {stat.change}
              </span>
            </div>

            {/* Value & Label */}
            <p className="text-[11px] font-medium text-slate-400 tracking-wide mb-0.5 truncate">
              {stat.label}
            </p>
            <p className={cn(
              "text-2xl font-bold font-display tracking-tight",
              stat.highlight ? "text-gradient-cyan" : "text-white"
            )}>
              {stat.value}
            </p>
          </div>
        ))}
      </div>

      {/* ── Middle Section: Luxury Performance Chart + SLA Alerts ── */}
      <div className="grid lg:grid-cols-3 gap-6">
        {/* Main Performance AreaChart */}
        <div className="lg:col-span-2 card-dark p-6 relative overflow-hidden flex flex-col justify-between">
          <div className="flex flex-wrap items-center justify-between gap-4 mb-6">
            <div>
              <div className="flex items-center gap-2">
                <h3 className="text-lg font-bold font-display text-white">Evolução de Conversão & Leads</h3>
                <span className="px-2 py-0.5 rounded-full text-[10px] font-semibold card-dark/[0.06] text-slate-300 border border-white/[0.08]">
                  7 dias
                </span>
              </div>
              <p className="text-xs text-slate-400 mt-0.5">Taxa de adição ao funil vs volume gerado</p>
            </div>

            {/* Legend & Time Filter */}
            <div className="flex items-center gap-4 text-xs">
              <div className="flex items-center gap-3">
                <div className="flex items-center gap-1.5">
                  <span className="w-2.5 h-2.5 rounded-full bg-gradient-to-r from-[#00FFCC] to-[#00DF9A] shadow-[0_0_8px_rgba(255,122,0,0.6)]" />
                  <span className="text-slate-300 font-medium">Conversão</span>
                </div>
                <div className="flex items-center gap-1.5">
                  <span className="w-2.5 h-2.5 rounded-full bg-cyan-400 shadow-[0_0_8px_rgba(6,182,212,0.6)]" />
                  <span className="text-slate-400 font-medium">Leads</span>
                </div>
              </div>

              <select 
                value={timeFilter}
                onChange={(e) => setTimeFilter(e.target.value)}
                className="bg-[#0b0e14] border border-white/[0.08] text-slate-300 rounded-lg px-3 py-1 text-xs outline-none focus:border-[#00F5A0]/50 transition-all cursor-pointer"
              >
                <option>Este mês</option>
                <option>Últimos 30 dias</option>
                <option>Último trimestre</option>
              </select>
            </div>
          </div>

          {/* Chart Container */}
          <div className="h-[280px] w-full relative">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={data} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                <defs>
                  <linearGradient id="amberGradient" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="0%" stopColor="#00F5A0" stopOpacity={0.35}/>
                    <stop offset="90%" stopColor="#00F5A0" stopOpacity={0.0}/>
                  </linearGradient>
                  <linearGradient id="cyanGradient" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="0%" stopColor="#00FFCC" stopOpacity={0.20}/>
                    <stop offset="90%" stopColor="#00FFCC" stopOpacity={0.0}/>
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="rgba(255, 255, 255, 0.05)" />
                <XAxis 
                  dataKey="name" 
                  axisLine={false} 
                  tickLine={false} 
                  tick={{ fontSize: 11, fill: '#64748B' }} 
                  dy={10} 
                />
                <YAxis 
                  axisLine={false} 
                  tickLine={false} 
                  tick={{ fontSize: 11, fill: '#64748B' }} 
                />
                <Tooltip 
                  content={({ active, payload, label }) => {
                    if (active && payload && payload.length) {
                      return (
                        <div className="p-3 rounded-2xl bg-[#0b0e14]/90 backdrop-blur-2xl border border-white/[0.12] shadow-2xl space-y-1.5 min-w-[140px]">
                          <p className="text-[11px] font-semibold text-slate-400">{label}</p>
                          <div className="flex items-center justify-between gap-4">
                            <span className="text-xs text-slate-300 font-medium">Conversão:</span>
                            <span className="text-xs font-bold text-[#00F5A0]">+{payload[0]?.value}%</span>
                          </div>
                          {payload[1] && (
                            <div className="flex items-center justify-between gap-4">
                              <span className="text-xs text-slate-300 font-medium">Leads:</span>
                              <span className="text-xs font-bold text-cyan-400">{payload[1]?.value} un</span>
                            </div>
                          )}
                          <div className="pt-1 border-t border-white/[0.08] text-[9px] text-emerald-400 font-semibold flex items-center gap-1">
                            <span className="w-1.5 h-1.5 rounded-full bg-emerald-400" />
                            Pico de Performance
                          </div>
                        </div>
                      );
                    }
                    return null;
                  }}
                />
                <Area 
                  type="monotone" 
                  dataKey="rate" 
                  stroke="#00F5A0" 
                  strokeWidth={3} 
                  fillOpacity={1} 
                  fill="url(#amberGradient)" 
                />
                <Area 
                  type="monotone" 
                  dataKey="leads" 
                  stroke="#00FFCC" 
                  strokeWidth={2} 
                  strokeDasharray="4 4"
                  fillOpacity={1} 
                  fill="url(#cyanGradient)" 
                />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* SLA Alerts (Luxury Dark Cards) */}
        <div className="card-dark p-6 flex flex-col justify-between">
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center gap-2">
              <h3 className="text-lg font-bold font-display text-white">Alertas de SLA</h3>
              <span className="badge-glow-rose text-[10px] font-bold px-2 py-0.5 rounded-full">
                4 Pendentes
              </span>
            </div>
            <button className="text-[#00F5A0] text-xs font-semibold hover:underline flex items-center gap-1">
              <span>Gerenciar</span>
              <ChevronRight className="w-3.5 h-3.5" />
            </button>
          </div>

          <div className="space-y-2.5 flex-1 overflow-y-auto pr-1">
            {slaAlerts.map((alert) => (
              <div 
                key={alert.id} 
                className={cn(
                  "p-3 rounded-xl border transition-all duration-300 flex items-start gap-3 relative group",
                  alert.expired 
                    ? "bg-rose-500/[0.06] border-rose-500/20 hover:border-rose-500/40" 
                    : alert.variant === 'warning'
                    ? "bg-[#00F5A0]/[0.06] border-emerald-500/30 hover:border-[#00F5A0]/40"
                    : alert.variant === 'success'
                    ? "bg-emerald-500/[0.06] border-emerald-500/20 hover:border-emerald-500/40"
                    : "bg-cyan-500/[0.06] border-cyan-500/20 hover:border-cyan-500/40"
                )}
              >
                <div className={cn(
                  "mt-0.5 w-7 h-7 rounded-lg flex items-center justify-center shrink-0 border",
                  alert.expired 
                    ? "bg-rose-500/10 border-rose-500/30 text-rose-400" 
                    : alert.variant === 'warning'
                    ? "bg-emerald-500/10 border-[#00F5A0]/30 text-[#00F5A0]"
                    : alert.variant === 'success'
                    ? "bg-emerald-500/10 border-emerald-500/30 text-emerald-400"
                    : "bg-cyan-500/10 border-cyan-500/30 text-cyan-400"
                )}>
                  {alert.expired ? <AlertCircle className="w-3.5 h-3.5" /> : <Clock className="w-3.5 h-3.5" />}
                </div>

                <div className="flex-1 min-w-0">
                  <p className="text-xs font-bold text-white truncate">{alert.type}</p>
                  <p className="text-[11px] text-slate-400 truncate mt-0.5">{alert.client}</p>
                  <p className="text-[10px] text-slate-500 truncate">{alert.property}</p>
                </div>

                <div className={cn(
                  "text-[10px] font-bold px-2 py-0.5 rounded-full whitespace-nowrap self-center",
                  alert.expired ? "badge-glow-rose" : "badge-glow-cyan"
                )}>
                  {alert.time}
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* ── Bottom Section: Funil de Conversão & Ações Rápidas ── */}
      <div className="grid lg:grid-cols-3 gap-6">
        {/* Sales Funnel */}
        <div className="lg:col-span-2 card-dark p-6">
          <div className="flex items-center justify-between mb-6">
            <div>
              <h3 className="text-lg font-bold font-display text-white">Funil Comercial & Conversão</h3>
              <p className="text-xs text-slate-400">Eficiência de transição entre etapas</p>
            </div>
            <div className="px-3 py-1 rounded-lg card-dark/[0.04] border border-white/[0.08] text-xs font-semibold text-slate-300">
              Taxa Geral: <span className="text-[#00F5A0] font-bold">52.84%</span>
            </div>
          </div>

          <div className="space-y-3">
            {salesFunnel.map((item, idx) => (
              <div key={item.stage} className="space-y-1 group">
                <div className="flex items-center justify-between text-xs font-medium px-1">
                  <span className="text-slate-300 flex items-center gap-2">
                    <span className="w-1.5 h-1.5 rounded-full bg-[#00F5A0]" />
                    {item.stage}
                  </span>
                  <div className="flex items-center gap-4">
                    <span className="text-white font-bold">{item.count} leads</span>
                    <span className="text-slate-400 w-24 text-right">{item.value}</span>
                    <span className="badge-glow-cyan text-[10px] font-bold px-2 py-0.5 rounded-full w-14 text-center">
                      {item.percent}
                    </span>
                  </div>
                </div>
                {/* Visual Progress Bar */}
                <div className="h-2.5 w-full card-dark/[0.04] rounded-full overflow-hidden p-0.5 border border-white/[0.06]">
                  <div 
                    className={cn("h-full rounded-full bg-gradient-to-r transition-all duration-700", item.glow)}
                    style={{ width: item.percent }}
                  />
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Quick Actions (Sleek Glass Grid) */}
        <div className="card-dark p-6 flex flex-col justify-between">
          <div>
            <h3 className="text-lg font-bold font-display text-white mb-1">Ações Rápidas</h3>
            <p className="text-xs text-slate-400 mb-4">Atalhos para fluxos operacionais</p>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <button className="p-3.5 rounded-xl border border-white/[0.08] card-dark/[0.03] hover:bg-emerald-500/10 hover:border-[#00F5A0]/40 transition-all duration-300 text-left group">
              <div className="w-9 h-9 rounded-lg bg-gradient-to-br from-[#00FFCC] to-[#00DF9A] text-white flex items-center justify-center mb-2.5 shadow-md shadow-emerald-500/20 group-hover:scale-105 transition-transform">
                <Users className="w-4 h-4" />
              </div>
              <p className="text-xs font-bold text-white group-hover:text-[#00FFCC] transition-colors">Novo Lead</p>
              <p className="text-[10px] text-slate-400 truncate">Cadastrar lead...</p>
            </button>

            <button className="p-3.5 rounded-xl border border-white/[0.08] card-dark/[0.03] hover:bg-cyan-500/10 hover:border-cyan-500/30 transition-all duration-300 text-left group">
              <div className="w-9 h-9 rounded-lg bg-gradient-to-br from-cyan-500 to-blue-600 text-white flex items-center justify-center mb-2.5 shadow-md shadow-cyan-500/20 group-hover:scale-105 transition-transform">
                <Calendar className="w-4 h-4" />
              </div>
              <p className="text-xs font-bold text-white group-hover:text-cyan-300 transition-colors">Agendar</p>
              <p className="text-[10px] text-slate-400 truncate">Nova visita...</p>
            </button>

            <button className="p-3.5 rounded-xl border border-white/[0.08] card-dark/[0.03] hover:bg-emerald-500/10 hover:border-emerald-500/30 transition-all duration-300 text-left group">
              <div className="w-9 h-9 rounded-lg bg-gradient-to-br from-emerald-500 to-teal-600 text-white flex items-center justify-center mb-2.5 shadow-md shadow-emerald-500/20 group-hover:scale-105 transition-transform">
                <FileText className="w-4 h-4" />
              </div>
              <p className="text-xs font-bold text-white group-hover:text-emerald-300 transition-colors">Nova Proposta</p>
              <p className="text-[10px] text-slate-400 truncate">Criar proposta...</p>
            </button>

            <button className="p-3.5 rounded-xl border border-white/[0.08] card-dark/[0.03] hover:bg-purple-500/10 hover:border-purple-500/30 transition-all duration-300 text-left group">
              <div className="w-9 h-9 rounded-lg bg-gradient-to-br from-purple-500 to-indigo-600 text-white flex items-center justify-center mb-2.5 shadow-md shadow-purple-500/20 group-hover:scale-105 transition-transform">
                <Home className="w-4 h-4" />
              </div>
              <p className="text-xs font-bold text-white group-hover:text-purple-300 transition-colors">Novo Imóvel</p>
              <p className="text-[10px] text-slate-400 truncate">Cadastrar imóvel...</p>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
