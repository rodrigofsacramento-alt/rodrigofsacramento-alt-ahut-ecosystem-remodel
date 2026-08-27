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
  CheckCircle2
} from 'lucide-react';
import { formatCurrency, formatNumber, cn } from '../lib/utils';
import { useLeads } from '../hooks/useLeads';
import { useSales } from '../hooks/useSales';
import { useVisits } from '../hooks/useVisits';

const dataFallback = [
  { name: 'Jan', leads: 120, vendas: 12 },
  { name: 'Fev', leads: 135, vendas: 15 },
  { name: 'Mar', leads: 150, vendas: 14 },
  { name: 'Abr', leads: 180, vendas: 18 },
  { name: 'Mai', leads: 220, vendas: 17 },
  { name: 'Jun', leads: 248, vendas: 18 },
];

const slaAlerts = [
  { id: 1, type: 'Primeiro Atendimento', client: 'Ricardo Ferreira', property: 'Carlos', time: '5 min restantes', color: 'bg-red-50 text-red-600 border-red-100' },
  { id: 2, type: 'Retorno de Proposta', client: 'Ana Oliveira', property: 'Patrícia', time: '2h restantes', color: 'bg-yellow-50 text-yellow-600 border-yellow-100' },
  { id: 3, type: 'Follow-up', client: 'Marcos Silva', property: 'Roberto', time: 'Expirado há 1h', color: 'bg-red-50 text-red-600 border-red-100', expired: true },
  { id: 4, type: 'Confirmação de Visita', client: 'Julia Costa', property: 'Ana', time: '4h restantes', color: 'bg-green-50 text-green-600 border-green-100' },
];

export default function Dashboard() {
  const { data: leads = [] } = useLeads({});
  const { data: sales = [] } = useSales();
  const { data: visits = [] } = useVisits();

  const leadsAtivos = leads.filter((l) => l.stage !== 'Convertido').length;
  const leadsConvertidos = leads.filter((l) => l.stage === 'Convertido').length;
  const vendasMes = sales.length;
  const receitaMes = sales.reduce((s, v) => s + (Number((v as any)?.proposal?.value) || 0), 0);

  const temDados = leads.length > 0 || sales.length > 0 || visits.length > 0;

  // Gráfico: se tiver dados reais, monta por mês dos leads; senão usa fallback
  const data =
    temDados && leads.length > 0
      ? Object.entries(
          leads.reduce<Record<string, { leads: number; vendas: number }>>((acc, l) => {
            const m = l.created_at ? new Date(l.created_at).toLocaleDateString('pt-BR', { month: 'short' }).replace('.', '') : '—';
            acc[m] = acc[m] || { leads: 0, vendas: 0 };
            acc[m].leads++;
            return acc;
          }, {})
        ).map(([name, v]) => ({ name, leads: v.leads, vendas: v.vendas }))
        .slice(-6)
      : dataFallback;

  const stats = [
    { label: 'Leads Ativos', value: temDados ? String(leadsAtivos) : '248', change: '+12%', icon: Users },
    { label: 'Vendas no Mês', value: temDados ? String(vendasMes) : '18', change: '+20%', icon: TrendingUp },
    { label: 'Visitas Mês', value: temDados ? String(visits.length) : '68', change: '+8%', icon: Calendar },
    { label: 'Convertidos', value: temDados ? String(leadsConvertidos) : '42', change: '+15%', icon: CheckCircle2 },
    { label: 'Receita Mês', value: temDados ? formatCurrency(receitaMes) : 'R$ 16.2M', change: '+24%', icon: DollarSign, highlight: true },
  ];

  const salesFunnel = [
    { stage: 'Novos Leads', count: temDados ? leads.length : 248, value: temDados ? formatCurrency(receitaMes) : 'R$ 186M', color: 'bg-orange-100 text-orange-700' },
    { stage: 'Em Atendimento', count: temDados ? leads.filter((l) => ['Primeiro Atendimento', 'Lead Cadastrado'].includes(l.stage)).length : 124, value: '—', color: 'bg-emerald-100 text-emerald-700', percent: '67%' },
    { stage: 'Visita Agendada', count: temDados ? visits.filter((v) => v.status === 'scheduled').length : 68, value: '—', color: 'bg-sky-100 text-sky-700', percent: '55%' },
    { stage: 'Vendas Fechadas', count: temDados ? vendasMes : 18, value: temDados ? formatCurrency(receitaMes) : 'R$ 16.2M', color: 'bg-orange-200 text-orange-800', percent: '64%' },
  ];

  return (
    <div className="p-6 space-y-6 bg-slate-50 min-h-full">
      {/* Welcome Banner */}
      <div className="bg-[#1E293B] rounded-2xl p-8 text-white relative overflow-hidden">
        <div className="relative z-10">
          <h2 className="text-3xl font-bold mb-2">Bom dia, João! 👋</h2>
          <p className="text-slate-400 mb-6">Você tem <span className="text-orange-400 font-bold">5 alertas</span> de SLA e <span className="text-orange-400 font-bold">24 leads</span> aguardando atendimento.</p>
          <div className="flex gap-4">
            <button className="bg-orange-500 hover:bg-orange-600 text-white px-6 py-2.5 rounded-xl font-bold flex items-center gap-2 transition-colors">
              <Users className="w-4 h-4" />
              Ver Leads Prioritários
            </button>
            <button className="bg-slate-800 hover:bg-slate-700 text-white px-6 py-2.5 rounded-xl font-bold flex items-center gap-2 transition-colors">
              <Calendar className="w-4 h-4" />
              Agenda do Dia
            </button>
          </div>
        </div>
        <div className="absolute top-0 right-0 w-64 h-64 bg-orange-500/10 rounded-full -translate-y-1/2 translate-x-1/2 blur-3xl" />
      </div>

      {/* Stats Grid */}
      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4">
        {stats.map((stat) => (
          <div key={stat.label} className={`p-4 rounded-2xl border ${stat.highlight ? 'bg-orange-500 text-white border-orange-400' : 'bg-white border-slate-200 text-slate-900'}`}>
            <div className="flex items-center justify-between mb-2">
              <div className={`p-2 rounded-lg ${stat.highlight ? 'bg-white/20' : 'bg-slate-100'}`}>
                <stat.icon className={`w-4 h-4 ${stat.highlight ? 'text-white' : 'text-slate-600'}`} />
              </div>
              <span className={`text-[10px] font-bold px-1.5 py-0.5 rounded-full ${stat.highlight ? 'bg-white/20' : 'bg-green-100 text-green-700'}`}>
                {stat.change} vs. mês ant.
              </span>
            </div>
            <p className={`text-xs font-medium ${stat.highlight ? 'text-white/80' : 'text-slate-500'}`}>{stat.label}</p>
            <p className="text-xl font-bold">{stat.value}</p>
          </div>
        ))}
      </div>

      <div className="grid lg:grid-cols-3 gap-6">
        {/* Performance Chart */}
        <div className="lg:col-span-2 bg-white p-6 rounded-2xl border border-slate-200">
          <div className="flex items-center justify-between mb-6">
            <div>
              <h3 className="text-lg font-bold text-slate-900">Performance Mensal</h3>
              <p className="text-sm text-slate-500">Evolução de leads e vendas</p>
            </div>
            <div className="flex items-center gap-4 text-xs font-bold">
              <div className="flex items-center gap-2">
                <div className="w-3 h-3 rounded-full bg-orange-500" />
                <span>Leads</span>
              </div>
              <div className="flex items-center gap-2">
                <div className="w-3 h-3 rounded-full bg-[#1E293B]" />
                <span>Vendas</span>
              </div>
            </div>
          </div>
          <div className="h-[300px] glass-card rounded-2xl p-4">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={data}>
                <defs>
                  <linearGradient id="colorLeads" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#F97316" stopOpacity={0.15}/>
                    <stop offset="95%" stopColor="#F97316" stopOpacity={0}/>
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#E2E8F0" />
                <XAxis dataKey="name" axisLine={false} tickLine={false} tick={{fontSize: 12, fill: '#64748B'}} dy={10} />
                <YAxis axisLine={false} tickLine={false} tick={{fontSize: 12, fill: '#64748B'}} />
                <Tooltip contentStyle={{ borderRadius: 12, border: '1px solid rgba(249,115,22,0.2)', boxShadow: '0 8px 32px rgba(0,0,0,0.08)', backdropFilter: 'blur(12px)', background: 'rgba(255,255,255,0.9)' }} />
                <Area type="monotone" dataKey="leads" stroke="#F97316" strokeWidth={3} fillOpacity={1} fill="url(#colorLeads)" />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* SLA Alerts */}
        <div className="bg-white p-6 rounded-2xl border border-slate-200">
          <div className="flex items-center justify-between mb-6">
            <div className="flex items-center gap-2">
              <h3 className="text-lg font-bold text-slate-900">Alertas de SLA</h3>
              <span className="bg-red-500 text-white text-[10px] font-bold px-1.5 py-0.5 rounded-full">2</span>
            </div>
            <button className="text-orange-500 text-sm font-bold hover:underline">Gerenciar</button>
          </div>
          <div className="space-y-3">
            {slaAlerts.map((alert) => (
              <div key={alert.id} className={cn("p-4 rounded-xl border flex items-start gap-3", alert.color)}>
                <div className="mt-1">
                  {alert.expired ? <AlertCircle className="w-4 h-4" /> : <Clock className="w-4 h-4" />}
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-bold truncate">{alert.type}</p>
                  <p className="text-xs opacity-80 truncate">{alert.client} • {alert.property}</p>
                </div>
                <div className="text-[10px] font-bold px-2 py-1 rounded-full bg-white/50 whitespace-nowrap">
                  {alert.time}
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>

      <div className="grid lg:grid-cols-3 gap-6">
        {/* Sales Funnel */}
        <div className="lg:col-span-2 bg-white p-6 rounded-2xl border border-slate-200">
          <div className="flex items-center justify-between mb-6">
            <div>
              <h3 className="text-lg font-bold text-slate-900">Funil de Vendas</h3>
              <p className="text-sm text-slate-500">Conversão por etapa</p>
            </div>
            <select className="bg-slate-50 border border-slate-200 rounded-lg px-3 py-1.5 text-sm outline-none">
              <option>Este mês</option>
              <option>Últimos 3 meses</option>
            </select>
          </div>
          <div className="space-y-2">
            {salesFunnel.map((item, idx) => (
              <div key={item.stage} className="relative group">
                <div 
                  className={cn("h-12 rounded-lg flex items-center px-4 transition-all group-hover:opacity-90", item.color)}
                  style={{ width: `${100 - (idx * 5)}%` }}
                >
                  <div className="flex-1 flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <div className="w-1.5 h-1.5 rounded-full bg-current" />
                      <span className="text-sm font-bold">{item.stage}</span>
                    </div>
                    <div className="flex items-center gap-8">
                      <span className="text-sm font-bold">{item.count}</span>
                      <span className="text-sm font-medium opacity-60 w-20 text-right">{item.value}</span>
                    </div>
                  </div>
                  {item.percent && (
                    <div className="absolute -right-12 top-1/2 -translate-y-1/2 text-[10px] font-bold text-green-600">
                      {item.percent}
                    </div>
                  )}
                </div>
              </div>
            ))}
          </div>
          <div className="mt-8 flex items-center justify-between border-t border-slate-100 pt-6">
            <div>
              <p className="text-xs text-slate-500">Taxa de conversão geral</p>
              <p className="text-xl font-bold text-slate-900">7.3%</p>
            </div>
            <div className="text-right">
              <p className="text-xs text-slate-500">Ticket médio</p>
              <p className="text-xl font-bold text-orange-500">R$ 900.000</p>
            </div>
          </div>
        </div>

        {/* Quick Actions & Recent Activity */}
        <div className="space-y-6">
          <div className="bg-white p-6 rounded-2xl border border-slate-200">
            <h3 className="text-lg font-bold text-slate-900 mb-4">Ações Rápidas</h3>
            <div className="grid grid-cols-2 gap-3">
              <button className="p-4 rounded-xl border border-slate-100 bg-slate-50 hover:bg-orange-50 hover:border-orange-200 transition-all text-left group">
                <div className="w-10 h-10 rounded-lg bg-orange-500 text-white flex items-center justify-center mb-3">
                  <Users className="w-5 h-5" />
                </div>
                <p className="text-sm font-bold text-slate-900">Novo Lead</p>
                <p className="text-[10px] text-slate-500">Cadastrar le...</p>
              </button>
              <button className="p-4 rounded-xl border border-slate-100 bg-slate-50 hover:bg-blue-50 hover:border-blue-200 transition-all text-left group">
                <div className="w-10 h-10 rounded-lg bg-[#1E293B] text-white flex items-center justify-center mb-3">
                  <Home className="w-5 h-5" />
                </div>
                <p className="text-sm font-bold text-slate-900">Novo Im...</p>
                <p className="text-[10px] text-slate-500">Cadastrar i...</p>
              </button>
              <button className="p-4 rounded-xl border border-slate-100 bg-slate-50 hover:bg-emerald-50 hover:border-emerald-200 transition-all text-left group">
                <div className="w-10 h-10 rounded-lg bg-emerald-500 text-white flex items-center justify-center mb-3">
                  <Calendar className="w-5 h-5" />
                </div>
                <p className="text-sm font-bold text-slate-900">Agendar ...</p>
                <p className="text-[10px] text-slate-500">Criar agend...</p>
              </button>
              <button className="p-4 rounded-xl border border-slate-100 bg-slate-50 hover:bg-amber-50 hover:border-amber-200 transition-all text-left group">
                <div className="w-10 h-10 rounded-lg bg-amber-500 text-white flex items-center justify-center mb-3">
                  <FileText className="w-5 h-5" />
                </div>
                <p className="text-sm font-bold text-slate-900">Nova Pro...</p>
                <p className="text-[10px] text-slate-500">Gerar prop...</p>
              </button>
            </div>
          </div>

          <div className="bg-white p-6 rounded-2xl border border-slate-200">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-bold text-slate-900">Atividade Recente</h3>
              <button className="text-orange-500 text-xs font-bold hover:underline">Ver tudo</button>
            </div>
            <div className="space-y-4">
              {[
                { icon: Users, color: 'text-blue-500 bg-blue-50', title: 'Novo lead qualificado', meta: 'Maria Silva - Apt 3 quartos Jardins', time: '2 min', user: 'Carlos' },
                { icon: Calendar, color: 'text-emerald-500 bg-emerald-50', title: 'Visita confirmada', meta: 'Casa Alphaville - João Pedro', time: '15 min', user: 'Ana' },
                { icon: FileText, color: 'text-amber-500 bg-amber-50', title: 'Proposta enviada', meta: 'Cobertura Moema - R$ 2.8M', time: '32 min', user: 'Roberto' },
              ].map((activity, i) => (
                <div key={i} className="flex gap-3">
                  <div className={cn("w-8 h-8 rounded-lg flex items-center justify-center shrink-0", activity.color)}>
                    <activity.icon className="w-4 h-4" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-xs font-bold text-slate-900 truncate">{activity.title}</p>
                    <p className="text-[10px] text-slate-500 truncate">{activity.meta}</p>
                  </div>
                  <div className="text-right shrink-0">
                    <p className="text-[10px] font-bold text-slate-400">{activity.time}</p>
                    <p className="text-[10px] text-slate-400">{activity.user}</p>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
