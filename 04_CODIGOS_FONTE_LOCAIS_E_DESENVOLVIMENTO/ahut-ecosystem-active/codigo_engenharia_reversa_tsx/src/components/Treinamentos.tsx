import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Brain,
  Play,
  BookOpen,
  ClipboardList,
  Target,
  Users,
  Home,
  TrendingUp,
  CheckCircle2,
  ArrowRight,
  MessageCircle,
  Sparkles,
  Layers,
  Lightbulb,
  Timer,
  Mic,
  Award,
  Lock
} from 'lucide-react';
import { cn } from '../lib/utils';

// ── Curso de NEUROVENDAS — Aula 1 (com Chris Racanelli) ──────────────────────────
// Conteúdo didático de Neurovendas aplicado ao mercado imobiliário.

interface Aula {
  id: number;
  title: string;
  duration: string;
  status: 'disponivel' | 'em_producao' | 'em_breve';
  topics: string[];
}

const modulo1: Aula[] = [
  { id: 1, title: 'Aula 1 — Introdução à Neurovenda Imobiliária', duration: '28 min', status: 'disponivel', topics: ['O que é Neurovenda e por que funciona', 'Como o cérebro decide comprar um imóvel', 'Os gatilhos mentais em negociações de alto valor'] },
  { id: 2, title: 'Aula 2 — Gatilhos Mentais na Apresentação de Imóveis', duration: '35 min', status: 'em_producao', topics: ['Escassez e Urgência', 'Prova Social e Autoridade', 'Reciprocidade no relacionamento'] },
  { id: 3, title: 'Aula 3 — Neurocomunicação: como falar a linguagem do seu cliente', duration: '32 min', status: 'em_breve', topics: ['Perfis comportamentais (DISC)', 'Ancoragem e framing de preço', 'Espelhamento e rapport'] },
];

const tecnicas = [
  { icon: Home, title: 'Ancoragem de Preço', desc: 'Apresente primeiro o imóvel de valor mais alto para ancorar a percepção do cliente, tornando as demais opções mais acessíveis.' },
  { icon: Sparkles, title: 'Storytelling com Prova Social', desc: 'Conte a história de famílias que se realizaram no empreendimento. O cérebro compra emoção e justifica com lógica.' },
  { icon: Timer, title: 'Escassez e Urgência', desc: 'Destaque lotes/imóveis limitados e prazos de condições. Use com ética: escassez real, nunca artificial.' },
  { icon: Brain, title: 'Percepção de Perda (Loss Aversion)', desc: 'O cérebro sente dor 2x mais pela perda do que prazer pelo ganho. Mostre o custo de perder a oportunidade.' },
];

const scriptNeurovenda = [
  { passo: 1, titulo: 'Quebre o gelo com emoção', fala: '"Já imaginou sua família tomando café da manhã vendo essa vista todos os dias?"' },
  { passo: 2, titulo: 'Explore a dor / desejo real', fala: '"O que está faltando na sua casa de hoje para você se sentir realizado de verdade?"' },
  { passo: 3, titulo: 'Ancore o valor', fala: '"Este é o fundo do mercado. Compare com o que você viu antes — a diferença é enorme, certo?"' },
  { passo: 4, titulo: 'Use prova social', fala: '"Os vizinhos do condomínio assinaram em 30 dias. Foi rápido porque a infraestrutura é completa."' },
  { passo: 5, titulo: 'Feche com perda evitada', fala: '"Se você deixar para depois de amanhã, não sei se esse lote fica disponível — temos 2 interessados."' },
];

const metricasNeuro = [
  { label: 'Taxa de conversão ideal (visita → proposta)', valor: '≥ 25%', nota: 'Meta interna do curso' },
  { label: 'Tempo médio ideal de qualificação', valor: '< 12 min', nota: 'Ouça mais, fale menos' },
  { label: 'Imóveis mostrados por visita', valor: '2 a 3', nota: 'Nunca mais que 3 — decisão paralisa' },
];

export default function Treinamentos() {
  const [aulaAberta, setAulaAberta] = useState<number | null>(null);
  const navigate = useNavigate();

  return (
    <div className="space-y-6">
      {/* Cabeçalho do curso */}
      <div className="bg-gradient-to-r from-slate-900 to-slate-800 rounded-2xl p-8 text-white relative overflow-hidden">
        <div className="relative z-10 max-w-3xl">
          <span className="inline-flex items-center gap-1.5 bg-cyan-500/20 text-orange-300 text-[10px] font-bold px-2.5 py-1 rounded-full uppercase tracking-wider mb-4">
            <Award className="w-3.5 h-3.5" /> Curso Oficial · Neurovendas Imobiliárias
          </span>
          <h2 className="text-3xl font-bold mb-3 flex items-center gap-3">
            <Brain className="w-8 h-8 text-cyan-400" /> Neurovendas: a ciência de vender imóveis
          </h2>
          <p className="text-slate-300 text-sm leading-relaxed mb-6">
            Aprenda a aplicar os princípios da neurociência nas negociações imobiliárias — como o cérebro do seu cliente
            decide, e como conduzir a conversa para fechar mais vendas com ética e autoridade.
          </p>
          <div className="flex flex-wrap items-center gap-4 text-xs text-slate-400">
            <span className="flex items-center gap-1.5"><Users className="w-4 h-4 text-cyan-400" /> Instrutor: Chris Racanelli</span>
            <span className="flex items-center gap-1.5"><BookOpen className="w-4 h-4 text-cyan-400" /> 3 aulas · 3 módulos</span>
            <span className="flex items-center gap-1.5"><Timer className="w-4 h-4 text-cyan-400" /> ~ 1h35 de conteúdo</span>
          </div>
        </div>
        <div className="absolute top-0 right-0 w-72 h-72 bg-cyan-500/10 rounded-full -translate-y-1/2 translate-x-1/3 blur-3xl" />
      </div>

      {/* Grid: conteúdo + progresso */}
      <div className="grid lg:grid-cols-3 gap-6">
        {/* Coluna principal: módulos/aulas */}
        <div className="lg:col-span-2 space-y-6">
          {/* Módulo 1 */}
          <div className="glass-neon-card overflow-hidden">
            <div className="px-6 py-4 bg-white/5 border-b border-white/5 flex items-center justify-between">
              <h3 className="font-bold text-white flex items-center gap-2">
                <Layers className="w-4 h-4 text-cyan-500" /> Módulo 1 — Fundamentos
              </h3>
              <span className="text-xs text-slate-400 font-medium">1 aula disponível</span>
            </div>
            <div className="divide-y divide-slate-100">
              {modulo1.map((aula) => (
                <div key={aula.id} className="p-5 flex items-start gap-4 hover:bg-white/50 transition-colors">
                  <div className={cn(
                    'w-10 h-10 rounded-xl flex items-center justify-center shrink-0',
                    aula.status === 'disponivel' ? 'bg-cyan-500/20 text-cyan-400' :
                    aula.status === 'em_producao' ? 'bg-amber-500/20 text-amber-400' : 'bg-white/5 text-slate-400'
                  )}>
                    {aula.status === 'disponivel' ? <Play className="w-5 h-5" /> : aula.status === 'em_producao' ? <Timer className="w-5 h-5" /> : <Lock className="w-4 h-4" />}
                  </div>
                  <button
                    onClick={() => aula.status === 'disponivel' ? navigate('/treinamentos/aula') : setAulaAberta(aulaAberta === aula.id ? null : aula.id)}
                    className="flex-1 text-left"
                  >
                    <div className="flex items-center justify-between">
                      <p className="font-bold text-white text-sm">{aula.title}</p>
                      <span className="text-xs text-slate-400 font-medium">{aula.duration}</span>
                    </div>
                    <span className={cn(
                      'text-[10px] font-bold px-2 py-0.5 rounded-full uppercase',
                      aula.status === 'disponivel' ? 'bg-emerald-100 text-emerald-700' :
                      aula.status === 'em_producao' ? 'bg-amber-500/20 text-amber-400' : 'bg-white/5 text-slate-400'
                    )}>
                      {aula.status === 'disponivel' ? 'Disponível' : aula.status === 'em_producao' ? 'Em produção' : 'Em breve'}
                    </span>
                  </button>
                </div>
              ))}
            </div>
          </div>

          {/* Detalhe da Aula 1 */}
          {aulaAberta === 1 && (
            <div className="glass-neon-card p-6 space-y-5">
              <h4 className="text-lg font-bold text-white flex items-center gap-2">
                <BookOpen className="w-5 h-5 text-cyan-500" /> Conteúdo da Aula 1
              </h4>
              {modulo1.find((a) => a.id === 1)!.topics.map((t, i) => (
                <div key={i} className="flex items-start gap-3 bg-white/5 rounded-xl p-3">
                  <CheckCircle2 className="w-5 h-5 text-emerald-500 shrink-0 mt-0.5" />
                  <p className="text-sm text-slate-300">{t}</p>
                </div>
              ))}
              <div className="bg-cyan-500/10 border border-orange-500/30 rounded-xl p-4 text-sm text-cyan-300">
                <strong>🎯 Objetivo da aula:</strong> entender como o cérebro toma decisões de compra de alto valor
                e os 3 gatilhos que movem a escolha de um imóvel.
              </div>
            </div>
          )}

          {/* Técnicas de Neurovenda */}
          <div>
            <h3 className="text-lg font-bold text-white mb-4 flex items-center gap-2">
              <Lightbulb className="w-5 h-5 text-cyan-500" /> Técnicas de Neurovenda aplicadas ao mercado imobiliário
            </h3>
            <div className="grid sm:grid-cols-2 gap-4">
              {tecnicas.map((t) => (
                <div key={t.title} className="glass-neon-card p-5 hover:shadow-lg hover:shadow-cyan-900/10 transition-shadow">
                  <div className="w-10 h-10 rounded-xl bg-cyan-500/20 text-cyan-400 flex items-center justify-center mb-3">
                    <t.icon className="w-5 h-5" />
                  </div>
                  <p className="font-bold text-white text-sm mb-1">{t.title}</p>
                  <p className="text-xs text-slate-400 leading-relaxed">{t.desc}</p>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Coluna lateral: script + métricas */}
        <div className="space-y-6">
          {/* Script de Neurovenda */}
          <div className="glass-neon-card p-6">
            <h4 className="font-bold text-white flex items-center gap-2 mb-4">
              <MessageCircle className="w-4 h-4 text-cyan-500" /> Script de Neurovenda — 5 passos
            </h4>
            <div className="space-y-3">
              {scriptNeurovenda.map((s) => (
                <div key={s.passo} className="flex gap-3">
                  <div className="w-6 h-6 rounded-full bg-cyan-500 text-white text-[10px] font-bold flex items-center justify-center shrink-0">{s.passo}</div>
                  <div>
                    <p className="text-sm font-bold text-white">{s.titulo}</p>
                    <p className="text-xs text-slate-400 italic leading-relaxed">{s.fala}</p>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Métricas de referência */}
          <div className="glass-neon-card p-6">
            <h4 className="font-bold text-white flex items-center gap-2 mb-4">
              <Target className="w-4 h-4 text-cyan-500" /> Métricas de referência
            </h4>
            <div className="space-y-3">
              {metricasNeuro.map((m) => (
                <div key={m.label} className="bg-white/5 rounded-xl p-3">
                  <p className="text-xs text-slate-400 mb-0.5">{m.label}</p>
                  <p className="text-lg font-bold text-cyan-400">{m.valor}</p>
                  <p className="text-[10px] text-slate-400">{m.nota}</p>
                </div>
              ))}
            </div>
          </div>

          {/* CTA: próxima aula em produção */}
          <div className="bg-[#0a0a0a] rounded-2xl p-6 text-white">
            <p className="text-sm font-bold mb-1 flex items-center gap-2"><Award className="w-4 h-4 text-cyan-400" /> Curso em evolução</p>
            <p className="text-xs text-slate-400 leading-relaxed">
              As Aulas 2 e 3 estão em produção. Acompanhamento de desempenho dos corretores no curso será liberado em breve.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}

// Ícone Lock já importado no topo (lucide-react)