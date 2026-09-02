import React, { useMemo } from 'react';
import { Link } from 'react-router-dom';
import {
  Wallet,
  TrendingUp,
  TrendingDown,
  PiggyBank,
  ArrowDownToLine,
  ArrowUpFromLine,
  Landmark,
  CreditCard,
  ArrowLeftRight,
  Tags,
  ArrowRight,
} from 'lucide-react';
import {
  ResponsiveContainer,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  Tooltip,
  CartesianGrid,
  Legend,
} from 'recharts';
import { useFinancialTransactions, useBankSaldos, useFinancialCategories, useFinancialBanks, useFinancialCards, useFinancialTransfers } from '../../hooks/useFinancial';
import { formatCurrency, cn } from '../../lib/utils';
import { Card, CardHeader, Spinner, EmptyState, Badge, formatDateBR } from './components/FinancialUI';
import FinNav from './components/FinNav';

function StatCard({
  label,
  value,
  hint,
  icon,
  accent,
  loading,
}: {
  label: string;
  value: number;
  hint?: string;
  icon: React.ReactNode;
  accent: 'emerald' | 'rose' | 'cyan' | 'violet';
  loading?: boolean;
}) {
  const accents: Record<string, string> = {
    emerald: 'from-emerald-500/15 to-transparent text-emerald-400',
    rose: 'from-rose-500/15 to-transparent text-rose-400',
    cyan: 'from-cyan-500/15 to-transparent text-cyan-300',
    violet: 'from-violet-500/15 to-transparent text-violet-300',
  };
  return (
    <Card className="relative overflow-hidden p-5">
      <div className={cn('absolute -inset-0 bg-gradient-to-t pointer-events-none opacity-60', accents[accent])} />
      <div className="relative flex items-start justify-between">
        <div className="min-w-0">
          <p className="text-xs font-bold text-slate-400 uppercase tracking-wide">{label}</p>
          <p className="text-2xl font-bold text-white mt-2 truncate">
            {loading ? '...' : formatCurrency(value)}
          </p>
          {hint && <p className="text-xs text-slate-500 mt-1">{hint}</p>}
        </div>
        <div className={cn('w-11 h-11 rounded-xl bg-white/5 border border-white/10 flex items-center justify-center shrink-0', accents[accent].split(' ')[0])}>
          {icon}
        </div>
      </div>
    </Card>
  );
}

function ShortcutCard({
  to,
  title,
  subtitle,
  icon,
}: {
  to: string;
  title: string;
  subtitle: string;
  icon: React.ReactNode;
}) {
  return (
    <Link
      to={to}
      className="group rounded-2xl bg-white/[0.03] border border-white/[0.07] backdrop-blur-xl p-5 hover:border-[#00F5A0]/40 transition-all hover:bg-white/[0.05]"
    >
      <div className="flex items-center justify-between">
        <div className="w-10 h-10 rounded-xl bg-emerald-500/10 border border-emerald-500/25 flex items-center justify-center text-[#00FFCC]">
          {icon}
        </div>
        <ArrowRight className="w-4 h-4 text-slate-500 group-hover:text-[#00FFCC] group-hover:translate-x-0.5 transition-all" />
      </div>
      <p className="text-sm font-bold text-white mt-4">{title}</p>
      <p className="text-xs text-slate-500 mt-0.5">{subtitle}</p>
    </Link>
  );
}

export default function DashboardFinanceiro() {
  const { data: transactions = [], isLoading: txLoading } = useFinancialTransactions();
  const { data: saldos = [], isLoading: saldoLoading } = useBankSaldos();
  const { data: categories = [] } = useFinancialCategories();
  const { data: banks = [] } = useFinancialBanks();
  const { data: cards = [] } = useFinancialCards();
  const { data: transfers = [] } = useFinancialTransfers();

  const totals = useMemo(() => {
    const now = new Date();
    const monthKey = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}`;

    // Realizadas (baixadas) no mês corrente
    const realizedInMonth = transactions.filter(
      (t) => t.is_realized && (t.date || t.paid_date || '').startsWith(monthKey)
    );
    const receitasMes = realizedInMonth
      .filter((t) => t.type === 'income')
      .reduce((s, t) => s + t.amount, 0);
    const despesasMes = realizedInMonth
      .filter((t) => t.type === 'expense')
      .reduce((s, t) => s + t.amount, 0);

    // Pendentes (não realizadas) no mês corrente
    const pendingInMonth = transactions.filter((t) => !t.is_realized && (t.due_date || '').startsWith(monthKey));
    const receitasPendentes = pendingInMonth.filter((t) => t.type === 'income').reduce((s, t) => s + t.amount, 0);
    const despesasPendentes = pendingInMonth.filter((t) => t.type === 'expense').reduce((s, t) => s + t.amount, 0);

    // Saldo total (soma da VIEW financial_saldo)
    const saldoTotal = saldos.reduce((s, b) => s + b.saldo, 0);

    return {
      saldoTotal,
      receitasMes,
      despesasMes,
      lucroMes: receitasMes - despesasMes,
      receitasPendentes,
      despesasPendentes,
    };
  }, [transactions, saldos]);

  // Gráfico: receita vs despesa realizadas, últimos 6 meses
  const chartData = useMemo(() => {
    const labels: string[] = [];
    const map = new Map<string, { receita: number; despesa: number }>();
    const now = new Date();
    for (let i = 5; i >= 0; i--) {
      const d = new Date(now.getFullYear(), now.getMonth() - i, 1);
      const key = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`;
      map.set(key, { receita: 0, despesa: 0 });
      labels.push(key);
    }
    transactions
      .filter((t) => t.is_realized)
      .forEach((t) => {
        const d = (t.date || t.paid_date || '')?.substring(0, 7);
        if (d && map.has(d)) {
          const bucket = map.get(d)!;
          if (t.type === 'income') bucket.receita += t.amount;
          else bucket.despesa += t.amount;
        }
      });
    return labels.map((key) => {
      const d = new Date(key + '-01');
      return {
        mês: d.toLocaleDateString('pt-BR', { month: 'short' }),
        Receitas: Math.round(map.get(key)!.receita),
        Despesas: Math.round(map.get(key)!.despesa),
      };
    });
  }, [transactions]);

  const recentes = transactions.slice(0, 8);

  return (
    <div className="space-y-6">
      <FinNav />

      {/* Cards de resumo */}
      <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-4">
        <StatCard
          label="Saldo Total"
          value={totals.saldoTotal}
          hint={`${saldos.length} banco${saldos.length === 1 ? '' : 's'} integrado${saldos.length === 1 ? '' : 's'}`}
          icon={<Wallet className="w-5 h-5" />}
          accent="cyan"
          loading={saldoLoading}
        />
        <StatCard
          label="Receitas do Mês"
          value={totals.receitasMes}
          hint={`${formatCurrency(totals.receitasPendentes)} pendentes`}
          icon={<ArrowDownToLine className="w-5 h-5" />}
          accent="emerald"
          loading={txLoading}
        />
        <StatCard
          label="Despesas do Mês"
          value={totals.despesasMes}
          hint={`${formatCurrency(totals.despesasPendentes)} pendentes`}
          icon={<ArrowUpFromLine className="w-5 h-5" />}
          accent="rose"
          loading={txLoading}
        />
        <StatCard
          label="Lucro do Mês"
          value={totals.lucroMes}
          hint="Receitas realizadas − despesas realizadas"
          icon={<PiggyBank className="w-5 h-5" />}
          accent="violet"
          loading={txLoading}
        />
      </div>

      {/* Gráfico + atalhos */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
        <Card className="lg:col-span-2">
          <CardHeader
            title="Receitas vs Despesas"
            subtitle="Valores realizados nos últimos 6 meses"
          />
          <div className="p-5 h-72">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={chartData} barGap={6}>
                <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.06)" vertical={false} />
                <XAxis dataKey="mês" tick={{ fill: '#94a3b8', fontSize: 12 }} axisLine={false} tickLine={false} />
                <YAxis tick={{ fill: '#94a3b8', fontSize: 12 }} axisLine={false} tickLine={false} tickFormatter={(v: number) => `${Math.round(v / 1000)}k`} />
                <Tooltip
                  cursor={{ fill: 'rgba(255,255,255,0.03)' }}
                  contentStyle={{
                    backgroundColor: '#0a0e15',
                    border: '1px solid rgba(255,255,255,0.1)',
                    borderRadius: 12,
                    fontSize: 13,
                    color: '#fff',
                  }}
                  formatter={(value: any) => formatCurrency(Number(value))}
                />
                <Legend wrapperStyle={{ fontSize: 12 }} />
                <Bar dataKey="Receitas" fill="#00FFCC" radius={[6, 6, 0, 0]} />
                <Bar dataKey="Despesas" fill="#FB7185" radius={[6, 6, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </Card>

        <div className="flex flex-col gap-4">
          <ShortcutCard to="/financeiro/lancamentos" title="Lançamentos" subtitle={`${transactions.length} transações cadastradas`} icon={<TrendingUp className="w-5 h-5" />} />
          <ShortcutCard to="/financeiro/bancos" title="Bancos" subtitle={`${banks.length} contas e ${saldos.length} com saldo`} icon={<Landmark className="w-5 h-5" />} />
          <ShortcutCard to="/financeiro/cartoes" title="Cartões" subtitle={`${cards.length} cartões cadastrados`} icon={<CreditCard className="w-5 h-5" />} />
          <ShortcutCard to="/financeiro/transferencias" title="Transferências" subtitle={`${transfers.length} movimentações entre contas`} icon={<ArrowLeftRight className="w-5 h-5" />} />
          <ShortcutCard to="/financeiro/categorias" title="Categorias" subtitle={`${categories.length} categorias configuradas`} icon={<Tags className="w-5 h-5" />} />
        </div>
      </div>

      {/* Lançamentos recentes */}
      <Card>
        <CardHeader
          title="Lançamentos Recentes"
          subtitle="Últimas movimentações registradas"
          action={
            <Link
              to="/financeiro/lancamentos"
              className="inline-flex items-center gap-1.5 text-xs font-bold text-[#00FFCC] hover:text-white transition-colors"
            >
              Ver todos <ArrowRight className="w-3.5 h-3.5" />
            </Link>
          }
        />
        {txLoading ? (
          <Spinner label="Carregando lançamentos..." />
        ) : recentes.length === 0 ? (
          <EmptyState message="Nenhum lançamento cadastrado ainda. Crie o primeiro em Lançamentos." />
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="bg-white/[0.03] text-left">
                  <th className="px-5 py-3 text-xs font-semibold text-slate-400 uppercase">Nome</th>
                  <th className="px-5 py-3 text-xs font-semibold text-slate-400 uppercase">Categoria</th>
                  <th className="px-5 py-3 text-xs font-semibold text-slate-400 uppercase">Tipo</th>
                  <th className="px-5 py-3 text-xs font-semibold text-slate-400 uppercase">Data</th>
                  <th className="px-5 py-3 text-xs font-semibold text-slate-400 uppercase">Status</th>
                  <th className="px-5 py-3 text-xs font-semibold text-slate-400 uppercase text-right">Valor</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-white/[0.05]">
                {recentes.map((t) => (
                  <tr key={t.id} className="hover:bg-white/[0.02] transition-colors">
                    <td className="px-5 py-3.5">
                      <div className="text-sm font-semibold text-white">{t.name}</div>
                      {t.bank_name && <div className="text-[11px] text-slate-500">{t.bank_name}</div>}
                    </td>
                    <td className="px-5 py-3.5 text-sm text-slate-300">{t.category_name || '-'}</td>
                    <td className="px-5 py-3.5">
                      {t.type === 'income' ? (
                        <Badge tone="emerald">Receita</Badge>
                      ) : (
                        <Badge tone="rose">Despesa</Badge>
                      )}
                    </td>
                    <td className="px-5 py-3.5 text-sm text-slate-400">{formatDateBR(t.date || t.due_date)}</td>
                    <td className="px-5 py-3.5">
                      {t.is_realized ? <Badge tone="emerald">Realizado</Badge> : <Badge tone="amber">Pendente</Badge>}
                    </td>
                    <td className={cn('px-5 py-3.5 text-right text-sm font-bold', t.type === 'income' ? 'text-emerald-400' : 'text-rose-400')}>
                      {t.type === 'income' ? '+' : '-'} {formatCurrency(t.amount)}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </Card>
    </div>
  );
}