import React from 'react';
import { useNavigate } from 'react-router-dom';
import {
  PlayCircle, Brain, CheckCircle2, ArrowLeft, BookOpen, User,
  MessageCircle, Target, Lightbulb, Award, Timer, Users, Home
} from 'lucide-react';

// ── PÁGINA DE APRESENTAÇÃO DA AULA — NEUROVENDAS │ AULA 1 (com Christiane Racanelli) ──
// Abre ao clicar no cartão do curso de Neurovendas (do Telegram do Chris / /gestao / /treinamentos)

const topics = [
  'O que é Neurovenda e por que funciona nos imóveis',
  'Como o cérebro decide comprar um imóvel (decisão de alto valor)',
  'Os 3 gatilhos mentais que movem a escolha',
  'Ancoragem de preço na apresentação',
  'Introdução ao neuro-script de 5 passos para corretores',
];

const gatilhos = [
  { icon: Home, title: 'Ancoragem', desc: 'Apresente primeiro o imóvel de maior valor para ancorar a percepção de preço.' },
  { icon: Timer, title: 'Escassez & Urgência', desc: 'Destaque lotes/imóveis limitados e prazos reais (escasez ética).' },
  { icon: Brain, title: 'Loss Aversion', desc: 'O cérebro sente dor 2x mais pela perda que prazer pelo ganho. Mostre o custo de não decidir.' },
];

const scriptPassos = [
  { s: 1, t: 'Quebre o gelo com emoção', f: '"Já imaginou sua família tomando café da manhã vendo essa vista?"' },
  { s: 2, t: 'Explore a dor / desejo real', f: '"O que falta na sua casa hoje para você se sentir realizado?"' },
  { s: 3, t: 'Ancore o valor', f: '"Este é o fundo do mercado — compare com o que você viu antes."' },
  { s: 4, t: 'Use prova social', f: '"Os vizinhos assinaram em 30 dias, rápido pela infraestrutura."' },
  { s: 5, t: 'Feche com perda evitada', f: '"Se deixar para depois, não sei se esse lote fica disponível."' },
];

export default function TreinamentoAula() {
  const navigate = useNavigate();

  return (
    <div className="space-y-6">
      {/* Botão voltar */}
      <button onClick={() => navigate(-1)} className="inline-flex items-center gap-2 text-sm font-bold text-slate-600 hover:text-orange-600 transition-colors">
        <ArrowLeft className="w-4 h-4" /> Voltar para Treinamentos
      </button>

      {/* Player de vídeo (placeholder da aula) */}
      <div className="aspect-video bg-slate-900 rounded-2xl overflow-hidden relative flex items-center justify-center">
        <div className="absolute inset-0 bg-gradient-to-br from-orange-500/20 via-slate-900 to-slate-900" />
        <button className="relative z-10 flex flex-col items-center gap-3 group">
          <span className="w-16 h-16 rounded-full bg-orange-500 flex items-center justify-center shadow-lg shadow-orange-500/40 group-hover:scale-110 transition-transform">
            <PlayCircle className="w-8 h-8 text-white" />
          </span>
          <span className="text-white font-bold text-sm flex items-center gap-2"><Timer className="w-4 h-4" /> 28 min de aula</span>
        </button>
      </div>

      {/* Título e instrutora */}
      <div>
        <span className="text-[10px] font-bold px-2.5 py-1 rounded-full bg-orange-100 text-orange-700 uppercase tracking-wider mb-3 inline-block">Aula 1 · Disponível</span>
        <h2 className="text-2xl font-bold text-slate-900 mb-2 flex items-start gap-2">
          <Brain className="w-7 h-7 text-orange-500 mt-1" /> Introdução à Neurovenda Imobiliária
        </h2>
        <div className="flex items-center gap-3 text-sm text-slate-500">
          <span className="flex items-center gap-1.5"><User className="w-4 h-4 text-orange-500" /> Instrutora: Christiane Racanelli</span>
          <span className="flex items-center gap-1.5"><BookOpen className="w-4 h-4 text-orange-500" /> Módulo 1 — Fundamentos</span>
        </div>
      </div>

      <div className="grid lg:grid-cols-3 gap-6">
        {/* Conteúdo principal */}
        <div className="lg:col-span-2 space-y-6">
          {/* Objetivo da aula */}
          <div className="card-dark rounded-2xl border border-slate-200 p-6">
            <h3 className="font-bold text-slate-900 flex items-center gap-2 mb-3"><Target className="w-5 h-5 text-orange-500" /> Objetivo da aula</h3>
            <p className="text-sm text-slate-600 leading-relaxed">
              Entender como o cérebro toma decisões de compra de alto valor — e aplicar isso na condução da negociação
              de um imóvel, com ética e autoridade.
            </p>
          </div>

          {/* Tópicos */}
          <div className="card-dark rounded-2xl border border-slate-200 p-6">
            <h3 className="font-bold text-slate-900 flex items-center gap-2 mb-3"><BookOpen className="w-5 h-5 text-orange-500" /> O que você vai aprender</h3>
            <div className="space-y-2">
              {topics.map((t, i) => (
                <div key={i} className="flex items-start gap-2.5 bg-slate-50 rounded-xl p-3">
                  <CheckCircle2 className="w-5 h-5 text-emerald-500 shrink-0 mt-0.5" />
                  <p className="text-sm text-slate-700">{t}</p>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Coluna lateral */}
        <div className="space-y-6">
          {/* Gatilhos mentais */}
          <div className="card-dark rounded-2xl border border-slate-200 p-6">
            <h4 className="font-bold text-slate-900 flex items-center gap-2 mb-4"><Lightbulb className="w-4 h-4 text-orange-500" /> Gatilhos da aula</h4>
            {gatilhos.map((g) => (
              <div key={g.title} className="flex gap-3 mb-3 last:mb-0">
                <div className="w-9 h-9 rounded-xl bg-orange-100 text-orange-600 flex items-center justify-center shrink-0"><g.icon className="w-4 h-4" /></div>
                <div>
                  <p className="text-sm font-bold text-slate-900">{g.title}</p>
                  <p className="text-xs text-slate-500 leading-relaxed">{g.desc}</p>
                </div>
              </div>
            ))}
          </div>

          <div className="bg-gradient-to-br from-slate-900 to-slate-800 rounded-2xl p-6 text-white">
            <p className="font-bold flex items-center gap-2 mb-3"><MessageCircle className="w-4 h-4 text-orange-400" /> Neuro-Script — 5 passos</p>
            <div className="space-y-2.5">
              {scriptPassos.map((sp) => (
                <div key={sp.s} className="flex gap-2">
                  <span className="w-5 h-5 rounded-full bg-orange-500 text-[10px] font-bold flex items-center justify-center shrink-0">{sp.s}</span>
                  <div>
                    <span className="text-sm font-bold block">{sp.t}</span>
                    <span className="text-xs text-slate-300 italic">{sp.f}</span>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>

      {/* Exercício / CTA */}
      <div className="card-dark rounded-2xl border-2 border-orange-200 p-6 text-center">
        <Award className="w-8 h-8 text-orange-500 mx-auto mb-2" />
        <h3 className="font-bold text-slate-900 text-lg mb-1">Exercício da Aula</h3>
        <p className="text-sm text-slate-500 mb-4 max-w-xl mx-auto">
          Grave um vídeo de 1 minuto aplicando o passo 1 do script (quebra de gelo emocional) a um imóvel em captação.
        </p>
        <button className="inline-flex items-center gap-2 bg-orange-500 hover:bg-orange-600 text-white px-6 py-3 rounded-xl font-bold transition-colors shadow-sm shadow-orange-500/30">
          <CheckCircle2 className="w-5 h-5" /> Marcar como concluída
        </button>
      </div>
    </div>
  );
}