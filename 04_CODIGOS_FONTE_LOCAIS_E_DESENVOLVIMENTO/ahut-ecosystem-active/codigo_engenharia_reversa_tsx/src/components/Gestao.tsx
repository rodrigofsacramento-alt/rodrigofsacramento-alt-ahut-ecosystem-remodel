import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  LayoutDashboard,
  MessageSquare,
  Users,
  Calendar,
  FileText,
  Home,
  TrendingUp,
  ShieldAlert,
  CheckCircle2,
  Plus,
  Search,
  Bell,
  Clock,
  Briefcase,
  Cpu,
  Target,
  Play,
  Loader2
} from 'lucide-react';
import { cn } from '../lib/utils';
import { useAuth } from '../hooks/useAuth';
import { useLeads } from '../hooks/useLeads';
import { useVisits } from '../hooks/useVisits';
import { useSales } from '../hooks/useSales';
import { useGestaoTasks, useUpsertGestaoTask, mergeGestaoTasks, type GestaoTaskRow } from '../hooks/useGestao';

// ── PAINEL DE GESTÃO — CHRISTIANE RACANELLI (Business Advisor da Ahut) ────────
// Semelhante ao Dashboard do Corretor (Rodrigo Sacramento), adaptado ao papel de
// Business Advisor. Núcleo: registrar e gerir as SOLICITAÇÕES/TAREFAS que chegam
// (via WhatsApp/Telegram da Christiane) e o acompanhamento das operações da empresa.

// Tipo replicado do modelo persistido (gestao_tasks) — mantém o alias local para o JSX
type TarefaGestao = GestaoTaskRow;

// Seed/mock inicial usado apenas quando ainda não há dados no banco (fallback)
const tarefasIniciais: TarefaGestao[] = [
  { id: 't1', titulo: 'Curso de Neurovendas — estruturação do módulo', origem: 'telegram_chris', status: 'em_analise', prioridade: 'alta', responsavel: 'Christiane Racanelli', criada_em: '23/08 18:00', mensagem: 'Estruturar a aula de Neurovendas no app (página Treinamentos).', created_at: new Date().toISOString() },
  { id: 't2', titulo: 'Revisão do módulo de Chamados (Tecnologia)', origem: 'whatsapp', status: 'em_execucao', prioridade: 'alta', responsavel: 'Squad Tech', criada_em: '23/08 17:20', mensagem: 'Validar o fluxo AVA → ATOM na página de chamados.', created_at: new Date().toISOString() },
  { id: 't3', titulo: 'Comunicação aos admins sobre WhatsApp desconectado', origem: 'painel', status: 'concluida', prioridade: 'media', responsavel: 'Squad Tech', criada_em: '23/08 16:00', created_at: new Date().toISOString() },
];

export default function Gestao() {
  const { profile } = useAuth();
  const { data: leads = [] } = useLeads({});
  const { data: visits = [] } = useVisits();
  const { data: sales = [] } = useSales();
  const { data: remoteTarefas, isLoading } = useGestaoTasks();
  const upsertGestaoTask = useUpsertGestaoTask();
  const tarefas = mergeGestaoTasks(tarefasIniciais, remoteTarefas);
  const navigate = useNavigate();

  const [aba, setAba] = useState<'tarefas' | 'resumo'>('tarefas');
  const [showModal, setShowModal] = useState(false);
  const [novaTarefa, setNovaTarefa] = useState({ titulo: '', responsavel: 'Squad Tech', prioridade: 'media' as any, mensagem: '' });

  const adicionarTarefa = () => {
    if (!novaTarefa.titulo.trim()) return;
    const nova: TarefaGestao = {
      id: `t-${Date.now()}`,
      titulo: novaTarefa.titulo,
      origem: 'painel',
      status: 'nova',
      prioridade: novaTarefa.prioridade,
      responsavel: novaTarefa.responsavel,
      criada_em: new Date().toLocaleDateString('pt-BR') + ' ' + new Date().toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' }),
      mensagem: novaTarefa.mensagem || undefined,
      created_at: new Date().toISOString(),
    };
    upsertGestaoTask.mutate(nova);
    setShowModal(false);
    setNovaTarefa({ titulo: '', responsavel: 'Squad Tech', prioridade: 'media', mensagem: '' });
  };

  const moverStatus = (id: string, status: TarefaGestao['status']) => {
    const alvo = tarefas.find((t) => t.id === id);
    if (!alvo || alvo.status === status) return;
    upsertGestaoTask.mutate({ ...alvo, status });
  };

  const statusColor: Record<TarefaGestao['status'], string> = {
    nova: 'bg-sky-100 text-sky-700',
    em_analise: 'bg-amber-100 text-amber-700',
    em_execucao: 'bg-orange-100 text-orange-700',
    concluida: 'bg-emerald-100 text-emerald-700',
  };
  const origemLabel: Record<TarefaGestao['origem'], string> = {
    telegram_chris: '📱 Telegram (Chris)',
    whatsapp: '💬 WhatsApp',
    painel: '📋 Painel',
    squad: '🤖 Squad',
  };

  return (
    <div className="space-y-6">
      {/* Cabeçalho da Business Advisor */}
      <div className="bg-gradient-to-r from-slate-900 to-slate-800 rounded-2xl p-6 text-white relative overflow-hidden">
        <div className="relative z-10">
          <span className="inline-flex items-center gap-1.5 bg-orange-500/20 text-orange-300 text-[10px] font-bold px-2.5 py-1 rounded-full uppercase tracking-wider mb-3">
            <Cpu className="w-3.5 h-3.5" /> Painel de Gestão · Business Advisor
          </span>
          <h2 className="text-2xl font-bold mb-1">Olá, Christiane! 👋</h2>
          <p className="text-slate-300 text-sm mb-5">Aqui está o resumo das suas atividades e as solicitações da gestão da empresa.</p>
          <div className="flex flex-wrap gap-4 text-xs text-slate-300">
            <span className="flex items-center gap-1.5"><ShieldAlert className="w-4 h-4 text-orange-400" /> Cargo: Business Advisor</span>
            <span className="flex items-center gap-1.5"><TrendingUp className="w-4 h-4 text-orange-400" /> {leads.length} leads · {visits.length} visitas · {sales.length} vendas</span>
          </div>
        </div>
        <div className="absolute top-0 right-0 w-64 h-64 bg-orange-500/10 rounded-full -translate-y-1/2 translate-x-1/3 blur-3xl" />
      </div>

      {/* Ações + abas */}
      <div className="flex flex-col md:flex-row items-center justify-between gap-3">
        <div className="flex gap-1 bg-slate-100 rounded-xl p-1">
          {(['tarefas', 'resumo'] as const).map((t) => (
            <button
              key={t}
              onClick={() => setAba(t)}
              className={cn(
                'px-4 py-1.5 rounded-lg text-sm font-semibold capitalize transition-colors',
                aba === t ? 'bg-white shadow text-orange-600' : 'text-slate-500 hover:text-slate-700'
              )}
            >
              {t === 'tarefas' ? 'Tarefas & Solicitações' : 'Resumo'}
            </button>
          ))}
        </div>
        <button
          onClick={() => setShowModal(true)}
          className="inline-flex items-center gap-2 bg-orange-500 hover:bg-orange-600 text-white px-4 py-2 rounded-xl text-sm font-bold transition-colors shadow-sm shadow-orange-500/20"
        >
          <Plus className="w-4 h-4" /> Nova Solicitação
        </button>
      </div>

      {aba === 'tarefas' ? (
        <>
          {/* Kanban simples de tarefas da gestão */}
          <div className="grid lg:grid-cols-2 gap-4">
            {tarefas.map((t) => (
              <div key={t.id} className="bg-white rounded-2xl border border-slate-200 p-5 hover:shadow-md transition-all cursor-pointer" onClick={() => t.titulo.includes('Neurovendas') ? navigate('/treinamentos/aula') : null}>
                <div className="flex items-start justify-between gap-2 mb-2">
                  <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-slate-100 text-slate-500">{origemLabel[t.origem]}</span>
                  <span className={cn('text-[10px] font-bold px-2 py-0.5 rounded-full', statusColor[t.status])}>
                    {t.status.replace('_', ' ')}
                  </span>
                </div>
                <p className="font-bold text-slate-900 text-sm mb-1">{t.titulo}</p>
                {t.mensagem && <p className="text-xs text-slate-500 italic mb-2 leading-relaxed">"{t.mensagem}"</p>}
                <div className="flex items-center justify-between mt-3">
                  <div className="flex items-center gap-2 text-xs text-slate-400">
                    <Clock className="w-3.5 h-3.5" /> {t.criada_em}
                    <Briefcase className="w-3.5 h-3.5 ml-1" /> {t.responsavel}
                  </div>
                  <div className="flex gap-1">
                    {(['em_analise', 'em_execucao', 'concluida'] as const).map((s) => (
                      <button
                        key={s}
                        onClick={() => moverStatus(t.id, s)}
                        className={cn(
                          'w-2.5 h-2.5 rounded-full border transition-transform',
                          t.status === s ? 'scale-125 ring-2 ring-offset-1 ' + colorDot(s) : 'bg-transparent border-slate-300 hover:bg-slate-100'
                        )}
                        title={s.replace('_', ' ')}
                      />
                    ))}
                  </div>
                </div>
              </div>
            ))}
            {tarefas.length === 0 && (
              <div className="lg:col-span-2 text-center text-sm text-slate-400 py-10">Nenhuma tarefa registrada ainda.</div>
            )}
          </div>
          <p className="text-xs text-slate-400">
            📱 <strong>Toda mensagem da Christiane (Telegram) que for uma solicitação chega aqui automaticamente</strong> para a gestão da empresa.
          </p>
        </>
      ) : (
        <>
          {/* Resumo do CTO */}
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
            {[
              { label: 'Leads Ativos', valor: leads.length, icon: Users },
              { label: 'Visitas Agendadas', valor: visits.length, icon: Calendar },
              { label: 'Vendas', valor: sales.length, icon: TrendingUp },
              { label: 'Tarefas em aberto', valor: tarefas.filter((t) => t.status !== 'concluida').length, icon: Target },
            ].map((k) => (
              <div key={k.label} className="bg-white rounded-2xl border border-slate-200 p-5">
                <div className="flex items-center justify-between mb-2">
                  <div className="p-2 rounded-lg bg-slate-100 text-slate-600"><k.icon className="w-4 h-4" /></div>
                </div>
                <p className="text-2xl font-bold text-slate-900">{k.valor}</p>
                <p className="text-xs text-slate-500">{k.label}</p>
              </div>
            ))}
          </div>

          <div className="bg-white rounded-2xl border border-slate-200 p-6">
            <h4 className="font-bold text-slate-900 flex items-center gap-2 mb-4"><MessageSquare className="w-4 h-4 text-orange-500" /> Últimas mensagens da Christiane (Telegram)</h4>
            {tarefas.filter((t) => t.origem === 'telegram_chris').length === 0 ? (
              <p className="text-sm text-slate-400 py-4 text-center">Nenhuma solicitação da Christiane registrada ainda. Quando ela enviar uma tarefa pelo Telegram, aparece aqui.</p>
            ) : (
              <div className="space-y-3">
                {tarefas.filter((t) => t.origem === 'telegram_chris').map((t) => (
                  <div key={t.id} className="bg-orange-50 border border-orange-200 rounded-xl p-3">
                    <p className="text-sm font-bold text-slate-900">{t.titulo}</p>
                    {t.mensagem && <p className="text-xs text-slate-600 mt-1">"{t.mensagem}"</p>}
                    <span className="text-[10px] text-slate-400 mt-1 block">{t.criada_em}</span>
                  </div>
                ))}
              </div>
            )}
          </div>
        </>
      )}

      {/* Modal Nova Solicitação */}
      {showModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm">
          <div className="bg-white rounded-2xl w-full max-w-md p-6 shadow-2xl">
            <h3 className="text-lg font-bold text-slate-900 mb-4 flex items-center gap-2"><Plus className="w-5 h-5 text-orange-500" /> Nova Solicitação</h3>
            <div className="space-y-4">
              <div className="space-y-1.5">
                <label className="text-xs font-bold text-slate-700">Título *</label>
                <input value={novaTarefa.titulo} onChange={(e) => setNovaTarefa({ ...novaTarefa, titulo: e.target.value })} placeholder="Descrição da tarefa/solicitação" className="w-full bg-slate-50 border border-slate-200 rounded-lg px-4 py-2 text-sm outline-none focus:ring-1 focus:ring-orange-500" />
              </div>
              <div className="space-y-1.5">
                <label className="text-xs font-bold text-slate-700">Responsável</label>
                <input value={novaTarefa.responsavel} onChange={(e) => setNovaTarefa({ ...novaTarefa, responsavel: e.target.value })} className="w-full bg-slate-50 border border-slate-200 rounded-lg px-4 py-2 text-sm outline-none focus:ring-1 focus:ring-orange-500" />
              </div>
              <div className="space-y-1.5">
                <label className="text-xs font-bold text-slate-700">Prioridade</label>
                <select value={novaTarefa.prioridade} onChange={(e) => setNovaTarefa({ ...novaTarefa, prioridade: e.target.value }) } className="w-full bg-slate-50 border border-slate-200 rounded-lg px-4 py-2 text-sm outline-none focus:ring-1 focus:ring-orange-500">
                  <option value="alta">Alta</option>
                  <option value="media">Média</option>
                  <option value="baixa">Baixa</option>
                </select>
              </div>
              <div className="space-y-1.5">
                <label className="text-xs font-bold text-slate-700">Mensagem / Contexto</label>
                <textarea rows={3} value={novaTarefa.mensagem} onChange={(e) => setNovaTarefa({ ...novaTarefa, mensagem: e.target.value })} placeholder="Detalhe da solicitação (ex: do Telegram/WhatsApp)" className="w-full bg-slate-50 border border-slate-200 rounded-lg px-4 py-2 text-sm outline-none focus:ring-1 focus:ring-orange-500 resize-none" />
              </div>
            </div>
            <div className="flex justify-end gap-3 mt-6">
              <button onClick={() => setShowModal(false)} className="px-4 py-2 rounded-lg text-sm font-bold text-slate-600 hover:bg-slate-100">Cancelar</button>
              <button onClick={adicionarTarefa} className="px-4 py-2 rounded-lg text-sm font-bold bg-orange-500 hover:bg-orange-600 text-white">Registrar</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );

  function colorDot(s: TarefaGestao['status']) {
    switch (s) {
      case 'em_analise': return 'bg-amber-500 border-amber-500';
      case 'em_execucao': return 'bg-orange-500 border-orange-500';
      case 'concluida': return 'bg-emerald-500 border-emerald-500';
      default: return 'bg-sky-500 border-sky-500';
    }
  }
}