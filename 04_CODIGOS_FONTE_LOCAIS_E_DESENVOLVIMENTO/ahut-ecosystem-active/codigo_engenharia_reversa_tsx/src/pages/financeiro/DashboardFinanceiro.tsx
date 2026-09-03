import React, { useMemo, useState } from 'react';
import { Link } from 'react-router-dom';
import {
  Wallet,
  CalendarDays,
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

/* ──────────────────────────────────────────────────────────────────────────
 * Visualização A — Fluxo de Caixa
 * Receitas (income) e despesas (expense) realizadas no período filtrado,
 * com presets de período e date-range picker customizado.
 * ────────────────────────────────────────────────────────────────────────── */
const PERIOD_PRESETS = [
  { key: '7d', label: 'Últimos 7 dias' },
  { key: 'month', label: 'Este Mês' },
  { key: 'quarter', label: 'Trimestre' },
] as const;
type PeriodKey = (typeof PERIOD_PRESETS)[number]['key'] | 'custom';

const dateInputCls =
  'bg-white/5 border border-white/10 rounded-lg px-3 py-2 text-sm text-white color-scheme:dark outline-none focus:ring-1 focus:ring-[#00FFCC]/50 focus:border-[#00F5A0]/40 transition-all';

function iso(d: Date) {
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
}

function FlowStatCard({
  label,
  value,
  hint,
  icon,
  tone,
  loading,
}: {
  label: string;
  value: number;
  hint?: string;
  icon: React.ReactNode;
  tone: 'in' | 'out' | 'balance';
  loading?: boolean;
}) {
  const valueColor =
    tone === 'in'
      ? 'text-[#00FFCC]'
      : tone === 'out'
      ? 'text-rose-400'
      : value >= 0
      ? 'text-[#00FFCC]'
      : 'text-rose-400';
  return (
    <div className="relative overflow-hidden rounded-2xl bg-white/[0.03] border border-white/[0.07] backdrop-blur-xl p-5">
      <div className="relative flex items-start justify-between">
        <div className="min-w-0">
          <p className="text-xs font-bold text-slate-400 uppercase tracking-wide">{label}</p>
          <p className={cn('text-2xl font-bold mt-2 truncate', valueColor)}>
            {loading ? '...' : formatCurrency(value)}
          </p>
          {hint && <p className="text-xs text-slate-500 mt-1">{hint}</p>}
        </div>
        <div className="w-11 h-11 rounded-xl bg-white/5 border border-white/10 flex items-center justify-center shrink-0">
          {icon}
        </div>
      </div>
    </div>
  );
}

function FluxoDeCaixa({ transactions, loading }: { transactions: Array<any>; loading?: boolean }) {
  const [period, setPeriod] = useState<PeriodKey>('month');
  const [start, setStart] = useState('');
  const [end, setEnd] = useState('');

  const selectPreset = (p: PeriodKey) => {
    if (p === 'custom') {
      const now = new Date();
      let from = new Date(now);
      if (period === '7d') {
        from.setDate(now.getDate() - 6);
      } else if (period === 'quarter') {
        from = new Date(now.getFullYear(), now.getMonth() - (now.getMonth() % 3), 1);
      } else {
        from = new Date(now.getFullYear(), now.getMonth(), 1);
      }
      setStart(iso(from));
      setEnd(iso(now));
    }
    setPeriod(p);
  };

  const { range, rangeLabel } = useMemo(() => {
    const now = new Date();
    let from: Date;
    if (period === 'custom') {
      from = start ? new Date(`${start}T00:00:00`) : new Date(now.getFullYear(), now.getMonth(), 1);
    } else if (period === '7d') {
      from = new Date(now);
      from.setDate(now.getDate() - 6);
      from.setHours(0, 0, 0, 0);
    } else if (period === 'quarter') {
      from = new Date(now.getFullYear(), now.getMonth() - (now.getMonth() % 3), 1);
    } else {
      from = new Date(now.getFullYear(), now.getMonth(), 1);
    }
    const to = period === 'custom' && end ? new Date(`${end}T23:59:59`) : now;
    return {
      range: { from, to },
      rangeLabel: `${formatDateBR(iso(from))} → ${formatDateBR(iso(to))}`,
    };
  }, [period, start, end]);

  const { entradas, saidas, saldo, count } = useMemo(() => {
    let entradas = 0;
    let saidas = 0;
    let count = 0;
    for (const t of transactions) {
      if (!t.is_realized) continue;
      const dStr = t.date || t.paid_date || t.due_date;
      if (!dStr) continue;
      const d = new Date(dStr + (dStr.length === 10 ? 'T12:00:00' : ''));
      if (isNaN(d.getTime())) continue;
      if (d < range.from || d > range.to) continue;
      count++;
      if (t.type === 'income') entradas += t.amount;
      else saidas += t.amount;
    }
    return { entradas, saidas, saldo: entradas - saidas, count };
  }, [transactions, range]);

  return (
    <Card>
      <CardHeader
        title="Fluxo de Caixa"
        subtitle={`${rangeLabel} · ${count} lançamento${count === 1 ? '' : 's'} realizados no período`}
      />
      <div className="p-5 space-y-4">
        <div className="flex flex-col lg:flex-row lg:items-end gap-3 justify-between">
          <div className="flex flex-wrap gap-2">
            {PERIOD_PRESETS.map((p) => (
              <button
                key={p.key}
                onClick={() => selectPreset(p.key)}
                className={cn(
                  'px-3.5 py-2 rounded-lg text-xs font-bold border transition-all',
                  period === p.key
                    ? 'bg-[#00FFCC]/10 text-[#00FFCC] border-[#00FFCC]/40'
                    : 'bg-white/5 text-slate-300 border-white/10 hover:bg-white/[0.08] hover:text-white'
                )}
              >
                {p.label}
              </button>
            ))}
            <button
              onClick={() => selectPreset('custom')}
              className={cn(
                'px-3.5 py-2 rounded-lg text-xs font-bold border transition-all',
                period === 'custom'
                  ? 'bg-[#00FFCC]/10 text-[#00FFCC] border-[#00FFCC]/40'
                  : 'bg-white/5 text-slate-300 border-white/10 hover:bg-white/[0.08] hover:text-white'
              )}
            >
              Personalizado
            </button>
          </div>
          {period === 'custom' && (
            <div className="flex items-center gap-2">
              <input
                type="date"
                value={start}
                onChange={(e) => setStart(e.target.value)}
                className={dateInputCls}
              />
              <span className="text-sm text-slate-500">até</span>
              <input
                type="date"
                value={end}
                onChange={(e) => setEnd(e.target.value)}
                className={dateInputCls}
              />
            </div>
          )}
        </div>
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          <FlowStatCard
            label="Entradas"
            value={entradas}
            hint="Receitas realizadas"
            icon={<ArrowDownToLine className="w-5 h-5 text-[#00FFCC]" />}
            tone="in"
            loading={loading}
          />
          <FlowStatCard
            label="Saídas"
            value={saidas}
            hint="Despesas realizadas"
            icon={<ArrowUpFromLine className="w-5 h-5 text-rose-400" />}
            tone="out"
            loading={loading}
          />
          <FlowStatCard
            label="Saldo do Período"
            value={saldo}
            hint="Entradas − saídas"
            icon={<PiggyBank className="w-5 h-5 text-[#00FFCC]" />}
            tone="balance"
            loading={loading}
          />
        </div>
      </div>
    </Card>
  );
}

/* ──────────────────────────────────────────────────────────────────────────
 * Visualização C — Saldo por Categoria
 * Consolida os totais acumulados de receitas (income → verde) e despesas
 * (expense → vermelho) agrupados por categoria, ordenados por maior volume.
 * ────────────────────────────────────────────────────────────────────────── */
function SaldoPorCategoria({ transactions, loading }: { transactions: Array<any>; loading?: boolean }) {
  const rows = useMemo(() => {
    const map = new Map<string, { key: string; name: string; tipo: 'income' | 'expense'; valor: number }>();

    for (const t of transactions) {
      const name = t.category_name || t.category_id || 'Sem categoria';
      const key = t.category_id || t.category_name || 'uncategorized';
      const tipo: 'income' | 'expense' = t.type === 'income' ? 'income' : 'expense';

      const found = map.get(key);
      if (found) {
        if (found.tipo === tipo) {
          found.valor += t.amount;
        }
      } else {
        map.set(key, { key, name, tipo, valor: t.amount });
      }
    }

    return Array.from(map.values()).sort((a, b) => b.valor - a.valor);
  }, [transactions]);

  const totalGeral = rows.reduce((s, r) => s + r.valor, 0);

  return (
    <Card>
      <CardHeader
        title="Saldo por Categoria"
        subtitle="Totais acumulados por categoria de receita e despesa"
      />
      {loading ? (
        <Spinner label="Carregando categorias..." />
      ) : rows.length === 0 ? (
        <EmptyState message="Nenhuma transação cadastrada para consolidar por categoria." />
      ) : (
        <div className="p-5">
          <ul className="space-y-2.5">
            {rows.map((r) => (
              <li
                key={r.key}
                className="flex items-center justify-between gap-3 rounded-xl px-4 py-3 border backdrop-blur-xl transition-colors"
              >
                <div className="flex items-center gap-3 min-w-0">
                  <span
                    className={cn(
                      'inline-flex items-center gap-1.5 rounded-lg border px-2.5 py-1 text-xs font-bold capitalize',
                      r.tipo === 'income'
                        ? 'bg-green-500/10 text-green-400 border-green-500/20'
                        : 'bg-red-500/10 text-red-400 border-red-500/20'
                    )}
                  >
                    {r.name}
                  </span>
                  <span className="text-[11px] text-slate-500">
                    {r.tipo === 'income' ? 'Entrada' : 'Despesa'}
                  </span>
                </div>
                <span
                  className={cn(
                    'text-sm font-bold tabular-nums whitespace-nowrap',
                    r.tipo === 'income' ? 'text-green-400' : 'text-red-400'
                  )}
                >
                  {r.tipo === 'income' ? '+' : '-'} {formatCurrency(r.valor)}
                </span>
              </li>
            ))}
          </ul>
          <div className="mt-4 flex items-center justify-between rounded-xl bg-white/[0.03] border border-white/[0.07] px-4 py-3">
            <span className="text-xs font-bold text-slate-400 uppercase tracking-wide">
              Total consolidado · {rows.length} categoria{rows.length === 1 ? '' : 's'}
            </span>
            <span className="text-sm font-bold text-white tabular-nums">
              {formatCurrency(totalGeral)}
            </span>
          </div>
        </div>
      )}
    </Card>
  );
}

/* ──────────────────────────────────────────────────────────────────────────
 * Visualização D — DFC (Demonstração do Fluxo de Caixa)
 * Documento contábil executivo em hierarquia: Atividades Operacionais,
 * de Investimento e de Financiamento, com categorias agregadas das
 * transações reais no período e subtotais em destaque.
 * ────────────────────────────────────────────────────────────────────────── */

type GrupoDFC = 'operacional' | 'investimento' | 'financiamento';

// Palavras-chave (sem acento) que classificam uma categoria em cada seção.
const KEY_INVESTIMENTO = [
  'investimento', 'ativo', 'equipamento', 'maquina', 'mobiliario', 'veiculo',
  'software', 'aquisicao', 'obra', 'imovel', 'patrimonio', 'maquinas',
];
const KEY_FINANCIAMENTO = [
  'financiamento', 'emprestimo', 'capital', 'socio', 'integralizacao',
  'divida', 'juros', 'credito', 'debito de capital',
];

// Espaços fixos das despesas operacionais na hierarquia executiva.
const OPERACIONAIS_DESPESA: { chave: string | null; label: string }[] = [
  { chave: 'custo fixo', label: 'Custo Fixo' },
  { chave: 'custo variavel', label: 'Custo Variável' },
  { chave: 'comissao', label: 'Comissões' },
  { chave: 'imposto', label: 'Impostos' },
  { chave: 'operacao financeira', label: 'Operação Financeira' },
  { chave: null, label: 'Outros' },
];

function norm(s: string): string {
  return s
    .toLowerCase()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .trim();
}

function grupoDaCategoria(categoryName?: string | null): GrupoDFC {
  const c = norm(categoryName || '');
  if (!c) return 'operacional';
  if (KEY_INVESTIMENTO.some((k) => c.includes(norm(k)))) return 'investimento';
  if (KEY_FINANCIAMENTO.some((k) => c.includes(norm(k)))) return 'financiamento';
  return 'operacional';
}

function slotDespesaOperacional(categoryName?: string | null): string {
  const c = norm(categoryName || '');
  for (const s of OPERACIONAIS_DESPESA) {
    if (s.chave === null) continue;
    if (c.includes(s.chave)) return s.label;
  }
  return OPERACIONAIS_DESPESA[OPERACIONAIS_DESPESA.length - 1].label;
}

function ContabilRow({
  label,
  value,
  indent = 0,
  kind = 'line',
  minus = false,
}: {
  label: React.ReactNode;
  value: number;
  indent?: number;
  kind?: 'line' | 'subtotal' | 'total';
  minus?: boolean;
}) {
  const isNeg = value < 0;
  const valueCls =
    kind === 'total'
      ? isNeg
        ? 'text-rose-400'
        : 'text-white'
      : kind === 'subtotal'
      ? isNeg
        ? 'text-rose-400'
        : 'text-[#00FFCC]'
      : minus
      ? 'text-slate-300'
      : 'text-slate-200';
  const labelCls =
    kind === 'total'
      ? 'text-white'
      : kind === 'subtotal'
      ? 'text-[#00FFCC]'
      : minus
      ? 'text-slate-500'
      : indent > 0
      ? 'text-slate-400'
      : 'text-slate-300';
  return (
    <div
      className={cn(
        'flex items-center justify-between gap-3 py-[7px]',
        kind === 'total' && 'border-t border-white/30 mt-1',
        kind === 'subtotal' && 'border-t border-white/10'
      )}
    >
      <span
        className={cn(
          'flex items-center gap-2 text-[13px] font-semibold tracking-wide',
          indent > 0 && 'pl-5',
          kind === 'subtotal' && 'uppercase text-[11px] tracking-widest',
          kind === 'total' && 'uppercase text-xs tracking-widest',
          labelCls
        )}
      >
        {minus && <span className="text-slate-600">−</span>}
        {label}
      </span>
      <span className={cn('ml-auto whitespace-nowrap tabular-nums text-sm font-bold', valueCls)}>
        {minus && kind === 'line' ? '− ' : ''}
        {formatCurrency(Math.abs(value))}
      </span>
    </div>
  );
}

// Visualização B — Balanço Mensal (Previsto × Realizado)
function BalancoMensal({ transactions, loading }: { transactions: Array<any>; loading?: boolean }) {
  const now = new Date();
  const monthKey = iso(now).substring(0, 7); // yyyy-mm

  const monthTx = useMemo(
    () =>
      (transactions || []).filter((t) => {
        const d = t.date || t.paid_date || t.due_date;
        return d && String(d).substring(0, 7) === monthKey;
      }),
    [transactions, monthKey]
  );

  const entradas = monthTx.filter((t) => t.type === 'income');
  const saidas = monthTx.filter((t) => t.type === 'expense');

  const realized = (arr: Array<any>) => arr.filter((t) => t.is_realized).reduce((s, t) => s + Number(t.amount || 0), 0);
  const pending = (arr: Array<any>) => arr.filter((t) => !t.is_realized).reduce((s, t) => s + Number(t.amount || 0), 0);

  const entradasReal = realized(entradas);
  const entradasPrev = pending(entradas);
  const saidasReal = realized(saidas);
  const saidasPrev = pending(saidas);

  const row = (label: string, realized: number, pending: number, tone: 'in' | 'out') => (
    <div className="flex items-center justify-between gap-3 py-2.5 border-b border-white/[0.05] last:border-0">
      <span className="text-sm font-semibold text-slate-300">{label}</span>
      <div className="flex items-center gap-5 text-right">
        <div>
          <p className="text-[10px] uppercase tracking-wide text-slate-500">Previsto</p>
          <p className={cn('text-sm font-bold', tone === 'in' ? 'text-amber-400' : 'text-amber-400')}>{formatCurrency(pending)}</p>
        </div>
        <div>
          <p className="text-[10px] uppercase tracking-wide text-slate-500">Realizado</p>
          <p className={cn('text-sm font-bold', tone === 'in' ? 'text-[#00FFCC]' : 'text-rose-400')}>{formatCurrency(realized)}</p>
        </div>
      </div>
    </div>
  );

  return (
    <Card>
      <CardHeader
        title="Balanço Mensal"
        subtitle={new Date(now.getFullYear(), now.getMonth(), 1).toLocaleDateString('pt-BR', { month: 'long', year: 'numeric' })}
      />
      <div className="p-5">
        {loading && transactions.length === 0 ? (
          <Spinner />
        ) : monthTx.length === 0 ? (
          <EmptyState message="Nenhum lançamento neste mês." icon={<CalendarDays className="w-10 h-10" />} />
        ) : (
          <>
            {row('Entradas (receitas)', entradasReal, entradasPrev, 'in')}
            {row('Saídas (despesas)', saidasReal, saidasPrev, 'out')}
            <div className="flex items-center justify-between gap-3 pt-4">
              <span className="text-sm font-bold text-white">Saldo do mês</span>
              <span className={cn('text-lg font-bold', entradasReal + entradasPrev - saidasReal - saidasPrev >= 0 ? 'text-[#00FFCC]' : 'text-rose-400')}>
                {formatCurrency(entradasReal + entradasPrev - saidasReal - saidasPrev)}
              </span>
            </div>
            <div className="mt-4 grid grid-cols-2 gap-2">
              <div className="rounded-xl bg-amber-500/10 border border-amber-500/20 px-3 py-2">
                <p className="text-[10px] uppercase tracking-wide text-amber-400 font-bold">Previsto (pendente)</p>
                <p className="text-sm font-bold text-white">{formatCurrency(entradasPrev + saidasPrev)}</p>
              </div>
              <div className="rounded-xl bg-white/[0.03] border border-white/[0.07] px-3 py-2">
                <p className="text-[10px] uppercase tracking-wide text-slate-400 font-bold">Realizado (liquidado)</p>
                <p className="text-sm font-bold text-white">{formatCurrency(entradasReal + saidasReal)}</p>
              </div>
            </div>
          </>
        )}
      </div>
    </Card>
  );
}

function DFC({ transactions, loading }: { transactions: Array<any>; loading?: boolean }) {
  const [period, setPeriod] = useState<PeriodKey>('month');
  const [start, setStart] = useState('');
  const [end, setEnd] = useState('');

  const selectPreset = (p: PeriodKey) => {
    if (p === 'custom') {
      const now = new Date();
      let from = new Date(now);
      if (period === '7d') {
        from.setDate(now.getDate() - 6);
      } else if (period === 'quarter') {
        from = new Date(now.getFullYear(), now.getMonth() - (now.getMonth() % 3), 1);
      } else {
        from = new Date(now.getFullYear(), now.getMonth(), 1);
      }
      setStart(iso(from));
      setEnd(iso(now));
    }
    setPeriod(p);
  };

  const { range, rangeLabel } = useMemo(() => {
    const now = new Date();
    let from: Date;
    if (period === 'custom') {
      from = start ? new Date(`${start}T00:00:00`) : new Date(now.getFullYear(), now.getMonth(), 1);
    } else if (period === '7d') {
      from = new Date(now);
      from.setDate(now.getDate() - 6);
      from.setHours(0, 0, 0, 0);
    } else if (period === 'quarter') {
      from = new Date(now.getFullYear(), now.getMonth() - (now.getMonth() % 3), 1);
    } else {
      from = new Date(now.getFullYear(), now.getMonth(), 1);
    }
    const to = period === 'custom' && end ? new Date(`${end}T23:59:59`) : now;
    return {
      range: { from, to },
      rangeLabel: `${formatDateBR(iso(from))} → ${formatDateBR(iso(to))}`,
    };
  }, [period, start, end]);

  const dados = useMemo(() => {
    const realizadas = transactions.filter((t) => {
      if (!t.is_realized) return false;
      const dStr = t.date || t.paid_date || t.due_date;
      if (!dStr) return false;
      const d = new Date(dStr + (dStr.length === 10 ? 'T12:00:00' : ''));
      if (isNaN(d.getTime())) return false;
      return d >= range.from && d <= range.to;
    });

    const soma = (arr: any[]) => arr.reduce((s, x) => s + x.amount, 0);

    const op = realizadas.filter((t) => grupoDaCategoria(t.category_name) === 'operacional');
    const inv = realizadas.filter((t) => grupoDaCategoria(t.category_name) === 'investimento');
    const fin = realizadas.filter((t) => grupoDaCategoria(t.category_name) === 'financiamento');

    const opRec = op.filter((t) => t.type === 'income');
    const opDesp = op.filter((t) => t.type !== 'income');
    const receitasOperacionais = soma(opRec);
    const despesasOperacionaisTotal = soma(opDesp);

    // Receitas operacionais agregadas por categoria (todas "Entrada")
    const receitasPorCat = new Map<string, number>();
    for (const t of opRec) {
      const k = t.category_name || 'Entrada';
      receitasPorCat.set(k, (receitasPorCat.get(k) || 0) + t.amount);
    }
    if (receitasPorCat.size === 0) receitasPorCat.set('Entrada', 0);

    // Despesas operacionais na hierarquia fixa executiva
    const despesasOperacionais = OPERACIONAIS_DESPESA.map((slot) => ({
      label: slot.label,
      value: opDesp
        .filter((t) => slotDespesaOperacional(t.category_name) === slot.label)
        .reduce((s, t) => s + t.amount, 0),
    }));

    // Categorias avulsas (investimento / financiamento)
    const categoriasSecao = (arr: any[]) => {
      const map = new Map<string, number>();
      for (const t of arr) {
        const k = t.category_name || 'Sem categoria';
        const sinal = t.type === 'income' ? 1 : -1;
        map.set(k, (map.get(k) || 0) + sinal * t.amount);
      }
      return [...map.entries()]
        .map(([label, value]) => ({ label, value }))
        .sort((a, b) => Math.abs(b.value) - Math.abs(a.value));
    };
    const linhasInvestimento = categoriasSecao(inv);
    const linhasFinanciamento = categoriasSecao(fin);

    const subtotalOp = receitasOperacionais - despesasOperacionaisTotal;
    const subtotalInv = soma(inv.filter((t) => t.type === 'income')) - soma(inv.filter((t) => t.type !== 'income'));
    const subtotalFin = soma(fin.filter((t) => t.type === 'income')) - soma(fin.filter((t) => t.type !== 'income'));

    return {
      rangeLabel,
      count: realizadas.length,
      receitasPorCat: [...receitasPorCat.entries()].map(([label, value]) => ({ label, value })),
      despesasOperacionais,
      subtotalOp,
      subtotalInv,
      subtotalFin,
      totalGeral: subtotalOp + subtotalInv + subtotalFin,
      linhasInvestimento,
      linhasFinanciamento,
    };
  }, [transactions, range, rangeLabel]);

  return (
    <Card>
      <CardHeader
        title="Demonstração do Fluxo de Caixa"
        subtitle={`${dados.rangeLabel} · ${dados.count} lançamento${dados.count === 1 ? '' : 's'} realizado${dados.count === 1 ? '' : 's'} no período`}
        action={loading ? <Spinner /> : undefined}
      />
      <div className="p-5 space-y-4">
        {/* Seletor de período */}
        <div className="flex flex-col lg:flex-row lg:items-center gap-3 justify-between">
          <div className="flex flex-wrap gap-2">
            {PERIOD_PRESETS.map((p) => (
              <button
                key={p.key}
                onClick={() => selectPreset(p.key)}
                className={cn(
                  'px-3 py-1.5 rounded-lg text-[11px] font-bold border transition-all',
                  period === p.key
                    ? 'bg-[#00FFCC]/10 text-[#00FFCC] border-[#00FFCC]/40'
                    : 'bg-white/5 text-slate-400 border-white/10 hover:bg-white/[0.08] hover:text-white'
                )}
              >
                {p.label}
              </button>
            ))}
            <button
              onClick={() => selectPreset('custom')}
              className={cn(
                'px-3 py-1.5 rounded-lg text-[11px] font-bold border transition-all',
                period === 'custom'
                  ? 'bg-[#00FFCC]/10 text-[#00FFCC] border-[#00FFCC]/40'
                  : 'bg-white/5 text-slate-400 border-white/10 hover:bg-white/[0.08] hover:text-white'
              )}
            >
              Personalizado
            </button>
          </div>
          {period === 'custom' && (
            <div className="flex items-center gap-2">
              <input type="date" value={start} onChange={(e) => setStart(e.target.value)} className={dateInputCls} />
              <span className="text-xs text-slate-500">até</span>
              <input type="date" value={end} onChange={(e) => setEnd(e.target.value)} className={dateInputCls} />
            </div>
          )}
        </div>

        {/* Documento contábil */}
        <div className="rounded-2xl bg-white/[0.02] border border-white/[0.06] p-4 max-w-2xl">
          <div className="flex items-center justify-between pb-2 border-b border-white/10">
            <span className="text-xs font-bold text-white uppercase tracking-widest">DFC</span>
            <span className="text-[11px] text-slate-500">Demonstração do Fluxo de Caixa</span>
          </div>

          {/* ATIVIDADES OPERACIONAIS */}
          <ContabilRow label='· Atividades Operacionais' value={0} minus={false} kind="total" />
          {dados.receitasPorCat.map((r) => (
            <ContabilRow key={r.label} label={r.label} value={r.value} indent={1} />
          ))}
          {dados.despesasOperacionais.map((d) =>
            d.value === 0 ? null : (
              <ContabilRow key={d.label} label={d.label} value={d.value} indent={1} minus />
            )
          )}
          <ContabilRow label="Subtotal Operacional" value={dados.subtotalOp} kind="subtotal" />

          {/* ATIVIDADES DE INVESTIMENTO */}
          <ContabilRow label="· Atividades de Investimento" value={0} kind="total" />
          {dados.linhasInvestimento.length === 0 ? (
            <ContabilRow label="Sem movimentações no período" value={0} indent={1} />
          ) : (
            dados.linhasInvestimento.map((r) => (
              <ContabilRow key={r.label} label={r.label} value={r.value} indent={1} minus={r.value < 0} />
            ))
          )}
          <ContabilRow label="Subtotal Investimento" value={dados.subtotalInv} kind="subtotal" />

          {/* ATIVIDADES DE FINANCIAMENTO */}
          <ContabilRow label="· Atividades de Financiamento" value={0} kind="total" />
          {dados.linhasFinanciamento.length === 0 ? (
            <ContabilRow label="Sem movimentações no período" value={0} indent={1} />
          ) : (
            dados.linhasFinanciamento.map((r) => (
              <ContabilRow key={r.label} label={r.label} value={r.value} indent={1} minus={r.value < 0} />
            ))
          )}
          <ContabilRow label="Subtotal Financiamento" value={dados.subtotalFin} kind="subtotal" />

          {/* VARIAÇÃO DO CAIXA */}
          <ContabilRow label="Variação do Caixa no Período" value={dados.totalGeral} kind="total" />
        </div>
      </div>
    </Card>
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

      {/* Visualização A — Fluxo de Caixa */}
      <FluxoDeCaixa transactions={transactions} loading={txLoading} />

      {/* Visualização B — Balanço Mensal (Previsto × Realizado) */}
      <BalancoMensal transactions={transactions} loading={txLoading} />

      {/* Visualização C — Saldo por Categoria */}
      <SaldoPorCategoria transactions={transactions} loading={txLoading} />

      {/* Visualização D — DFC (Demonstração do Fluxo de Caixa) */}
      <DFC transactions={transactions} loading={txLoading} />

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