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
  Loader2,
  X,
  Edit3,
  Trash2,
  Eye,
  GripVertical,
  Sparkles
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

  const isChris = profile?.email === 'chris@apexfyhub.com.br';

  const [aba, setAba] = useState<'tarefas' | 'resumo'>('tarefas');
  const [showModal, setShowModal] = useState(false);
  const [novaTarefa, setNovaTarefa] = useState({ titulo: '', responsavel: 'Squad Tech', prioridade: 'media' as any, mensagem: '' });

  // Detail modal
  const [selectedTask, setSelectedTask] = useState<TarefaGestao | null>(null);

  // Drag-and-drop state
  const [dragTaskId, setDragTaskId] = useState<string | null>(null);
  const [dragOverCol, setDragOverCol] = useState<string | null>(null);

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

  const handleDragStart = (taskId: string) => {
    setDragTaskId(taskId);
  };

  const handleDragOver = (e: React.DragEvent, colStatus: string) => {
    e.preventDefault();
    setDragOverCol(colStatus);
  };

  const handleDragLeave = () => {
    setDragOverCol(null);
  };

  const handleDrop = (e: React.DragEvent, targetStatus: string) => {
    e.preventDefault();
    if (!dragTaskId) return;
    const task = tarefas.find(t => t.id === dragTaskId);
    if (!task) return;
    moverStatus(dragTaskId, targetStatus as TarefaGestao['status']);
    setDragTaskId(null);
    setDragOverCol(null);
  };

  const deletarTarefa = async (id: string) => {
    if (!confirm('Deseja realmente excluir esta tarefa?')) return;
    const { supabase } = await import('../lib/supabase');
    await supabase.from('gestao_tasks').delete().eq('id', id);
    window.location.reload();
  };

  // Status column groups
  const statusColumns: { key: TarefaGestao['status']; label: string; color: string; borderColor: string; glowColor: string }[] = [
    { key: 'nova', label: 'Novas', color: 'text-sky-400', borderColor: 'border-sky-500/20', glowColor: 'border-sky-400' },
    { key: 'em_analise', label: 'Em Análise', color: 'text-amber-400', borderColor: 'border-amber-500/20', glowColor: 'border-amber-400' },
    { key: 'em_execucao', label: 'Em Execução', color: 'text-cyan-400', borderColor: 'border-cyan-500/20', glowColor: 'border-cyan-500' },
    { key: 'concluida', label: 'Concluída', color: 'text-emerald-400', borderColor: 'border-emerald-500/20', glowColor: 'border-emerald-400' },
  ];

  const statusColor: Record<TarefaGestao['status'], string> = {
    nova: 'bg-sky-100 text-sky-700',
    em_analise: 'bg-amber-500/20 text-amber-400',
    em_execucao: 'bg-cyan-500/20 text-cyan-300',
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
          <span className="inline-flex items-center gap-1.5 bg-cyan-500/20 text-orange-300 text-[10px] font-bold px-2.5 py-1 rounded-full uppercase tracking-wider mb-3">
            <Cpu className="w-3.5 h-3.5" /> Painel de Gestão · Business Advisor
          </span>
          <h2 className="text-2xl font-bold mb-1">Olá, Christiane! 👋</h2>
          <p className="text-slate-300 text-sm mb-5">Aqui está o resumo das suas atividades e as solicitações da gestão da empresa.</p>
          <div className="flex flex-wrap gap-4 text-xs text-slate-300">
            <span className="flex items-center gap-1.5"><ShieldAlert className="w-4 h-4 text-cyan-400" /> Cargo: Business Advisor</span>
            <span className="flex items-center gap-1.5"><TrendingUp className="w-4 h-4 text-cyan-400" /> {leads.length} leads · {visits.length} visitas · {sales.length} vendas</span>
          </div>
        </div>
        <div className="absolute top-0 right-0 w-64 h-64 bg-cyan-500/10 rounded-full -translate-y-1/2 translate-x-1/3 blur-3xl" />
      </div>

      {/* Ações + abas */}
      <div className="flex flex-col md:flex-row items-center justify-between gap-3">
        <div className="flex gap-1 bg-white/5 rounded-xl p-1">
          {(['tarefas', 'resumo'] as const).map((t) => (
            <button
              key={t}
              onClick={() => setAba(t)}
              className={cn(
                'px-4 py-1.5 rounded-lg text-sm font-semibold capitalize transition-colors',
                aba === t ? 'bg-white/5 shadow text-cyan-400' : 'text-slate-400 hover:text-slate-300'
              )}
            >
              {t === 'tarefas' ? 'Tarefas & Solicitações' : 'Resumo'}
            </button>
          ))}
        </div>
        <button
          onClick={() => setShowModal(true)}
          className="inline-flex items-center gap-2 bg-cyan-500 hover:bg-cyan-600 text-white px-4 py-2 rounded-xl text-sm font-bold transition-colors shadow-sm shadow-cyan-500/20"
        >
          <Plus className="w-4 h-4" /> Nova Solicitação
        </button>
      </div>

      {aba === 'tarefas' ? (
        <>
          {/* Kanban Columns with Drag-and-Drop */}
          <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-4 gap-4">
            {statusColumns.map(col => {
              const colTarefas = tarefas.filter(t => t.status === col.key);
              return (
                <div
                  key={col.key}
                  className={`bg-white/5 rounded-2xl border ${dragOverCol === col.key ? `${col.glowColor} ring-2 ring-offset-2` : col.borderColor} p-4 flex flex-col min-h-[400px] transition-all duration-200`}
                  onDragOver={(e) => handleDragOver(e, col.key)}
                  onDragLeave={handleDragLeave}
                  onDrop={(e) => handleDrop(e, col.key)}
                >
                  <div className="flex items-center justify-between mb-3 pb-2 border-b border-white/5">
                    <div className="flex items-center gap-2">
                      <span className={`h-2.5 w-2.5 rounded-full ${col.color.replace('text-', 'bg-')}`}></span>
                      <h3 className="font-bold text-xs uppercase tracking-wider text-slate-300">{col.label}</h3>
                    </div>
                    <span className="text-xs font-mono font-bold text-slate-400 bg-white/5 px-2 py-0.5 rounded-full">
                      {colTarefas.length}
                    </span>
                  </div>

                  <div className="flex-1 overflow-y-auto space-y-3 pr-1">
                    {colTarefas.map(task => (
                      <div
                        key={task.id}
                        className={`group bg-white/5 hover:bg-white/5 border border-cyan-900/30 rounded-xl p-3.5 transition-all cursor-grab active:cursor-grabbing ${isChris ? 'hover:border-orange-300' : ''}`}
                        draggable
                        onDragStart={() => handleDragStart(task.id)}
                        onClick={() => setSelectedTask(task)}
                      >
                        <div className="flex items-start gap-2 mb-2">
                          <GripVertical className="w-3.5 h-3.5 text-slate-300 mt-0.5 opacity-0 group-hover:opacity-100 transition-opacity shrink-0" />
                          <div className="flex-1 min-w-0">
                            <div className="flex items-center gap-1.5 mb-1">
                              <span className="text-[10px] font-bold px-1.5 py-0.5 rounded-full bg-white/5 text-slate-400 whitespace-nowrap">
                                {origemLabel[task.origem]}
                              </span>
                              <span className={cn('text-[10px] font-bold px-1.5 py-0.5 rounded-full whitespace-nowrap', statusColor[task.status])}>
                                {task.status.replace('_', ' ')}
                              </span>
                            </div>
                            <p className="font-bold text-white text-sm line-clamp-2">{task.titulo}</p>
                            {task.mensagem && (
                              <p className="text-xs text-slate-400 italic mt-1 line-clamp-2">"{task.mensagem}"</p>
                            )}
                          </div>
                          {isChris && (
                            <button
                              onClick={(e) => { e.stopPropagation(); deletarTarefa(task.id); }}
                              className="text-slate-300 hover:text-red-400 opacity-0 group-hover:opacity-100 transition-opacity"
                            >
                              <Trash2 className="w-3.5 h-3.5" />
                            </button>
                          )}
                        </div>
                        <div className="flex items-center justify-between mt-2 pt-2 border-t border-white/5">
                          <div className="flex items-center gap-2 text-[10px] text-slate-400">
                            <Clock className="w-3 h-3" /> {task.criada_em}
                            <Briefcase className="w-3 h-3 ml-1" /> {task.responsavel}
                          </div>
                          <div className="flex gap-1">
                            {(['em_analise', 'em_execucao', 'concluida'] as const).map((s) => (
                              <button
                                key={s}
                                onClick={(e) => { e.stopPropagation(); moverStatus(task.id, s); }}
                                className={cn(
                                  'w-2.5 h-2.5 rounded-full border transition-transform',
                                  task.status === s ? 'scale-125 ring-2 ring-offset-1 ' + colorDot(s) : 'bg-transparent border-cyan-900/40 hover:bg-white/5'
                                )}
                                title={s.replace('_', ' ')}
                              />
                            ))}
                          </div>
                        </div>
                      </div>
                    ))}
                    {colTarefas.length === 0 && (
                      <div className="h-24 flex items-center justify-center border border-dashed border-cyan-900/30 rounded-xl text-xs text-slate-400">
                        Nenhuma tarefa
                      </div>
                    )}
                  </div>
                </div>
              );
            })}
          </div>

          {/* Card Detail Modal */}
          {selectedTask && (
            <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm" onClick={() => setSelectedTask(null)}>
              <div className="bg-white/5 rounded-2xl w-full max-w-lg p-6 shadow-2xl" onClick={(e) => e.stopPropagation()}>
                <div className="flex items-center justify-between mb-4">
                  <h3 className="text-lg font-bold text-white flex items-center gap-2">
                    <Eye className="w-5 h-5 text-cyan-500" /> Detalhes da Tarefa
                  </h3>
                  <button onClick={() => setSelectedTask(null)} className="text-slate-400 hover:text-slate-300">
                    <X className="w-5 h-5" />
                  </button>
                </div>
                <div className="space-y-4">
                  <div>
                    <span className="text-xs font-bold text-slate-400 uppercase">Título</span>
                    <p className="font-bold text-white mt-1">{selectedTask.titulo}</p>
                  </div>
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <span className="text-xs font-bold text-slate-400 uppercase">Origem</span>
                      <p className="text-sm text-slate-300 mt-1">{origemLabel[selectedTask.origem]}</p>
                    </div>
                    <div>
                      <span className="text-xs font-bold text-slate-400 uppercase">Status</span>
                      <p className={cn('text-sm font-bold mt-1', statusColor[selectedTask.status].replace('text-', 'text-'))}>
                        {selectedTask.status.replace('_', ' ')}
                      </p>
                    </div>
                    <div>
                      <span className="text-xs font-bold text-slate-400 uppercase">Responsável</span>
                      <p className="text-sm text-slate-300 mt-1">{selectedTask.responsavel}</p>
                    </div>
                    <div>
                      <span className="text-xs font-bold text-slate-400 uppercase">Data</span>
                      <p className="text-sm text-slate-300 mt-1">{selectedTask.criada_em}</p>
                    </div>
                  </div>
                  {selectedTask.mensagem && (
                    <div>
                      <span className="text-xs font-bold text-slate-400 uppercase">Mensagem / Contexto</span>
                      <p className="text-sm text-slate-300 mt-1 italic bg-white/5 p-3 rounded-xl border border-cyan-900/30">"{selectedTask.mensagem}"</p>
                    </div>
                  )}
                  <div className="flex gap-2 pt-2">
                    {(['em_analise', 'em_execucao', 'concluida'] as const).map(s => (
                      <button
                        key={s}
                        onClick={() => { moverStatus(selectedTask.id, s); setSelectedTask(null); }}
                        className={cn(
                          'flex-1 py-2 rounded-lg text-xs font-bold uppercase transition-colors',
                          selectedTask.status === s
                            ? 'bg-white/10 text-slate-400 cursor-not-allowed'
                            : 'bg-cyan-500 hover:bg-cyan-600 text-white'
                        )}
                        disabled={selectedTask.status === s}
                      >
                        Mover para {s.replace('_', ' ')}
                      </button>
                    ))}
                  </div>
                  {isChris && (
                    <button
                      onClick={() => { deletarTarefa(selectedTask.id); setSelectedTask(null); }}
                      className="w-full py-2 bg-red-500/10 hover:bg-red-100 text-rose-400 rounded-lg text-xs font-bold"
                    >
                      Excluir Tarefa
                    </button>
                  )}
                </div>
              </div>
            </div>
          )}

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
              <div key={k.label} className="glass-neon-card p-5">
                <div className="flex items-center justify-between mb-2">
                  <div className="p-2 rounded-lg bg-white/5 text-slate-300"><k.icon className="w-4 h-4" /></div>
                </div>
                <p className="text-2xl font-bold text-white">{k.valor}</p>
                <p className="text-xs text-slate-400">{k.label}</p>
              </div>
            ))}
          </div>

          <div className="glass-neon-card p-6">
            <h4 className="font-bold text-white flex items-center gap-2 mb-4"><MessageSquare className="w-4 h-4 text-cyan-500" /> Últimas mensagens da Christiane (Telegram)</h4>
            {tarefas.filter((t) => t.origem === 'telegram_chris').length === 0 ? (
              <p className="text-sm text-slate-400 py-4 text-center">Nenhuma solicitação da Christiane registrada ainda. Quando ela enviar uma tarefa pelo Telegram, aparece aqui.</p>
            ) : (
              <div className="space-y-3">
                {tarefas.filter((t) => t.origem === 'telegram_chris').map((t) => (
                  <div key={t.id} className="bg-cyan-500/10 border border-orange-500/30 rounded-xl p-3">
                    <p className="text-sm font-bold text-white">{t.titulo}</p>
                    {t.mensagem && <p className="text-xs text-slate-300 mt-1">"{t.mensagem}"</p>}
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
          <div className="bg-white/5 rounded-2xl w-full max-w-md p-6 shadow-2xl">
            <h3 className="text-lg font-bold text-white mb-4 flex items-center gap-2"><Plus className="w-5 h-5 text-cyan-500" /> Nova Solicitação</h3>
            <div className="space-y-4">
              <div className="space-y-1.5">
                <label className="text-xs font-bold text-slate-300">Título *</label>
                <input value={novaTarefa.titulo} onChange={(e) => setNovaTarefa({ ...novaTarefa, titulo: e.target.value })} placeholder="Descrição da tarefa/solicitação" className="w-full bg-white/5 border border-cyan-900/30 rounded-lg px-4 py-2 text-sm outline-none focus:ring-1 focus:ring-cyan-500" />
              </div>
              <div className="space-y-1.5">
                <label className="text-xs font-bold text-slate-300">Responsável</label>
                <input value={novaTarefa.responsavel} onChange={(e) => setNovaTarefa({ ...novaTarefa, responsavel: e.target.value })} className="w-full bg-white/5 border border-cyan-900/30 rounded-lg px-4 py-2 text-sm outline-none focus:ring-1 focus:ring-cyan-500" />
              </div>
              <div className="space-y-1.5">
                <label className="text-xs font-bold text-slate-300">Prioridade</label>
                <select value={novaTarefa.prioridade} onChange={(e) => setNovaTarefa({ ...novaTarefa, prioridade: e.target.value }) } className="w-full bg-white/5 border border-cyan-900/30 rounded-lg px-4 py-2 text-sm outline-none focus:ring-1 focus:ring-cyan-500">
                  <option value="alta">Alta</option>
                  <option value="media">Média</option>
                  <option value="baixa">Baixa</option>
                </select>
              </div>
              <div className="space-y-1.5">
                <label className="text-xs font-bold text-slate-300">Mensagem / Contexto</label>
                <textarea rows={3} value={novaTarefa.mensagem} onChange={(e) => setNovaTarefa({ ...novaTarefa, mensagem: e.target.value })} placeholder="Detalhe da solicitação (ex: do Telegram/WhatsApp)" className="w-full bg-white/5 border border-cyan-900/30 rounded-lg px-4 py-2 text-sm outline-none focus:ring-1 focus:ring-cyan-500 resize-none" />
              </div>
            </div>
            <div className="flex justify-end gap-3 mt-6">
              <button onClick={() => setShowModal(false)} className="px-4 py-2 rounded-lg text-sm font-bold text-slate-300 hover:bg-white/5">Cancelar</button>
              <button onClick={adicionarTarefa} className="px-4 py-2 rounded-lg text-sm font-bold bg-cyan-500 hover:bg-cyan-600 text-white">Registrar</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );

  function colorDot(s: TarefaGestao['status']) {
    switch (s) {
      case 'em_analise': return 'bg-amber-500 border-amber-500';
      case 'em_execucao': return 'bg-cyan-500 border-orange-500';
      case 'concluida': return 'bg-emerald-500 border-emerald-500';
      default: return 'bg-sky-500 border-sky-500';
    }
  }
}