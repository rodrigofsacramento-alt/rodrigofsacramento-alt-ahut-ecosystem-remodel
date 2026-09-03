import { useQuery } from '@tanstack/react-query';
import { supabase } from '../lib/supabase';

/* ============================================================================
 * QUBITS — Performance & Funil de Corretores
 * Camada de dados (Supabase). Chama as RPCs otimizadas do
 * `supabase/rpc_performance_funil.sql` (aplicadas no DEV 03/09):
 *   get_performance_funnel / get_performance_ranking / get_performance_sla_daily
 * ==========================================================================*/

export type PeriodPreset = '7d' | '30d' | '90d' | 'year' | 'custom';
export type FunnelScope = 'team' | 'agent';

export const PRESETS: { key: PeriodPreset; label: string; days?: number }[] = [
  { key: '7d', label: 'Últimos 7 dias', days: 7 },
  { key: '30d', label: 'Últimos 30 dias', days: 30 },
  { key: '90d', label: 'Últimos 90 dias', days: 90 },
  { key: 'year', label: 'Último ano', days: 365 },
  { key: 'custom', label: 'Período personalizado' },
];

export function periodRange(preset: PeriodPreset, customStart?: string, customEnd?: string) {
  const end = customEnd && preset === 'custom' ? new Date(customEnd) : new Date();
  const presetDays =
    preset === '7d' ? 7 : preset === '30d' ? 30 : preset === '90d' ? 90 : preset === 'year' ? 365 : 0;
  const start =
    preset === 'custom' && customStart
      ? new Date(customStart)
      : new Date(end.getTime() - presetDays * 24 * 60 * 60 * 1000);
  return { start: start.toISOString(), end: end.toISOString() };
}

export interface FunnelStep {
  key: string;
  label: string;
  count: number;
  micro: number; // conversão vs etapa anterior
  macro: number; // conversão vs etapa 1 (Leads Encaminhados)
}

export interface SlaDaily {
  day: string;
  avgSeconds: number;
  answered: number;
  pending: number;
}

export interface BrokerPerformance {
  id: string;
  name: string;
  leads: number;
  atendimentos: number;
  slaOk: number;
  interessados: number;
  followups: number;
  agendamentos: number;
  propostas: number;
  contratos: number;
  taxa: number;
}

export interface PerformanceReport {
  funnel: FunnelStep[];
  sla: SlaDaily[];
  ranking: BrokerPerformance[];
  broker: BrokerPerformance | null;
}

const STAGES_FALLBACK = [
  { key: 'leads_encaminhados', label: 'Leads Encaminhados' },
  { key: 'atendimentos', label: 'Atendimentos Iniciados' },
  { key: 'atendimentos_eficientes', label: 'Atendimentos Eficientes' },
  { key: 'leads_interessados', label: 'Leads Interessados' },
  { key: 'followups', label: 'Follow Up' },
  { key: 'agendamento', label: 'Agendamento' },
  { key: 'proposta', label: 'Proposta' },
  { key: 'contrato_venda', label: 'Contrato / Venda' },
];

/** Converte linhas do get_performance_funnel em FunnelStep[] com micro/macro. */
function funnelSteps(rows: any[]): FunnelStep[] {
  const counts = (rows || []).map((r) => ({
    key: r.funnel_key,
    label: r.funnel_label || STAGES_FALLBACK.find((s) => s.key === r.funnel_key)?.label || r.funnel_key,
    count: Number(r.count || 0),
  }));
  const base = counts[0]?.count || 0;
  return counts.map((c, i) => {
    const prev = i > 0 ? counts[i - 1].count : c.count;
    return {
      ...c,
      micro: prev ? Math.round((c.count / prev) * 1000) / 10 : 100,
      macro: base ? Math.round((c.count / base) * 1000) / 10 : 0,
    };
  });
}

function slaRows(rows: any[]): SlaDaily[] {
  return (rows || []).map((r) => ({
    day: typeof r.dia === 'string' ? r.dia.slice(0, 10) : String(r.dia).slice(0, 10),
    avgSeconds: Number(r.avg_response_seconds || 0),
    answered: Number(r.answered || 0),
    pending: Number(r.pending || 0),
  }));
}

function brokerRow(r: any): BrokerPerformance {
  return {
    id: r.agent_id,
    name: r.full_name || 'Corretor',
    leads: Number(r.leads || 0),
    atendimentos: Number(r.atendimentos || 0),
    slaOk: Number(r.sla_ok || 0),
    interessados: Number(r.interessados || 0),
    followups: Number(r.followups || 0),
    agendamentos: Number(r.agendamentos || 0),
    propostas: Number(r.propostas || 0),
    contratos: Number(r.contratos || 0),
    taxa: Number(r.taxa_conversao || 0),
  };
}

export function usePerformance(opts: {
  preset: PeriodPreset;
  customStart?: string;
  customEnd?: string;
  scope: FunnelScope;
  agentId?: string | null;
}) {
  const { start, end } = periodRange(opts.preset, opts.customStart, opts.customEnd);
  const agentId = opts.scope === 'agent' ? opts.agentId || null : null;

  return useQuery<PerformanceReport>({
    queryKey: ['performance-funnel', start, end, agentId],
    queryFn: async () => {
      const [funRows, slaRes, rankRes] = await Promise.all([
        supabase.rpc('get_performance_funnel', { p_start: start, p_end: end, p_agent_id: agentId }),
        supabase.rpc('get_performance_sla_daily', { p_start: start, p_end: end, p_agent_id: agentId }),
        supabase.rpc('get_performance_ranking', { p_start: start, p_end: end }),
      ]);

      if (funRows.error) throw funRows.error;
      if (slaRes.error) throw slaRes.error;
      if (rankRes.error) throw rankRes.error;

      const funnel = funnelSteps(funRows.data || []);
      const sla = slaRows(slaRes.data || []);
      const ranking = (rankRes.data || []).map(brokerRow).sort(
        (a, b) => b.contratos - a.contratos || b.atendimentos - a.atendimentos
      );
      const broker = agentId ? ranking.find((b) => b.id === agentId) || null : null;

      return { funnel, sla, ranking, broker };
    },
    staleTime: 1000 * 60,
  });
}