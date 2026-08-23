import React, { useState } from 'react';
import { DollarSign, TrendingUp, RefreshCw, Percent, Award, Users, Filter, Download } from 'lucide-react';
import { formatCurrency } from '../lib/utils';
import { cn } from '../lib/utils';

// Comissões — engenharia reversa do chunk Comissoes-CGxgjlaK.js (agent_commissions, commission_rules)

type TipoCalculo = 'fixo' | 'faixa' | 'progressivo';

interface Comissao {
  id: number;
  agente: string;
  valorVenda: number;
  percentual: number;
  valorComissao: number;
  faixa: string;
  status: 'paga' | 'pendente' | 'prevista';
}

const comissoesMock: Comissao[] = [
  { id: 1, agente: 'João Martins', valorVenda: 450000, percentual: 5, valorComissao: 22500, faixa: 'Automático (Progressivo por Faixa)', status: 'pendente' },
  { id: 2, agente: 'Maria Silva', valorVenda: 820000, percentual: 5, valorComissao: 41000, faixa: 'Agente (Faixa)', status: 'paga' },
  { id: 3, agente: 'Pedro Costa', valorVenda: 250000, percentual: 4, valorComissao: 10000, faixa: 'Comissão Fixa', status: 'prevista' },
  { id: 4, agente: 'Ana Beatriz', valorVenda: 1200000, percentual: 6, valorComissao: 72000, faixa: 'Agente (Faixa)', status: 'pendente' },
];

const faixasComissao = [
  { de: 0, ate: 300000, pct: 3 },
  { de: 300000, ate: 600000, pct: 4 },
  { de: 600000, ate: 1000000, pct: 5 },
  { de: 1000000, ate: 5000000, pct: 6 },
];

export default function ComissoesComercial() {
  const [tipo, setTipo] = useState<TipoCalculo>('faixa');
  const [tab, setTab] = useState<'comissoes' | 'regras'>('comissoes');
  const [cambio, setCambio] = useState<string>('R$ 5,42');

  const totalPendente = comissoesMock.filter((c) => c.status === 'pendente').reduce((s, c) => s + c.valorComissao, 0);
  const totalPago = comissoesMock.filter((c) => c.status === 'paga').reduce((s, c) => s + c.valorComissao, 0);

  return (
    <div className="space-y-6">
      {/* KPIs */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <div className="bg-white rounded-2xl border border-slate-200 p-5">
          <p className="text-xs text-slate-500 font-bold uppercase">Comissões Pendentes</p>
          <p className="text-2xl font-bold text-slate-900 mt-1">{formatCurrency(totalPendente)}</p>
        </div>
        <div className="bg-white rounded-2xl border border-slate-200 p-5">
          <p className="text-xs text-slate-500 font-bold uppercase">Comissões Pagas</p>
          <p className="text-2xl font-bold text-emerald-600 mt-1">{formatCurrency(totalPago)}</p>
        </div>
        <div className="bg-white rounded-2xl border border-slate-200 p-5">
          <div className="flex items-center justify-between">
            <p className="text-xs text-slate-500 font-bold uppercase">Câmbio (USD)</p>
            <button
              onClick={() => setCambio(cambio === 'R$ 5,42' ? 'R$ 5,38' : 'R$ 5,42')}
              className="text-[10px] text-orange-500 font-bold flex items-center gap-1 hover:underline"
            >
              <RefreshCw className="w-3 h-3" /> Atualizar
            </button>
          </div>
          <p className="text-2xl font-bold text-slate-900 mt-1">{cambio}</p>
          <p className="text-[10px] text-slate-400">Atualizar câmbio em tempo real</p>
        </div>
      </div>

      {/* Cabeçalho + abas */}
      <div className="flex flex-col md:flex-row items-center justify-between gap-3">
        <div className="flex gap-1 bg-slate-100 rounded-xl p-1">
          {(['comissoes', 'regras'] as const).map((t) => (
            <button
              key={t}
              onClick={() => setTab(t)}
              className={cn(
                'px-4 py-1.5 rounded-lg text-sm font-semibold capitalize transition-colors',
                tab === t ? 'bg-white shadow text-orange-600' : 'text-slate-500 hover:text-slate-700'
              )}
            >
              {t === 'comissoes' ? 'Comissões' : 'Regras'}
            </button>
          ))}
        </div>
        <button className="inline-flex items-center gap-2 bg-slate-100 hover:bg-slate-200 text-slate-700 px-4 py-2 rounded-xl text-sm font-bold transition-colors">
          <Download className="w-4 h-4" /> Exportar
        </button>
      </div>

      {tab === 'comissoes' ? (
        <div className="bg-white rounded-2xl border border-slate-200 overflow-hidden">
          <table className="w-full text-sm">
            <thead>
              <tr className="bg-slate-50 text-left text-xs text-slate-500 uppercase font-bold border-b border-slate-200">
                <th className="px-5 py-3">Agente</th>
                <th className="px-5 py-3">Valor da Venda</th>
                <th className="px-5 py-3">%</th>
                <th className="px-5 py-3">Comissão</th>
                <th className="px-5 py-3">Tipo de Cálculo</th>
                <th className="px-5 py-3">Status</th>
              </tr>
            </thead>
            <tbody>
              {comissoesMock.map((c) => (
                <tr key={c.id} className="border-b border-slate-100 hover:bg-slate-50/50">
                  <td className="px-5 py-3 font-bold text-slate-900">{c.agente}</td>
                  <td className="px-5 py-3">{formatCurrency(c.valorVenda)}</td>
                  <td className="px-5 py-3"><span className="inline-flex items-center gap-1"><Percent className="w-3 h-3 text-slate-400" />{c.percentual}%</span></td>
                  <td className="px-5 py-3 font-bold text-orange-600">{formatCurrency(c.valorComissao)}</td>
                  <td className="px-5 py-3 text-xs text-slate-500">{c.faixa}</td>
                  <td className="px-5 py-3">
                    <span className={cn(
                      'text-[10px] font-bold px-2 py-0.5 rounded-full capitalize',
                      c.status === 'paga' ? 'bg-emerald-100 text-emerald-700' :
                      c.status === 'pendente' ? 'bg-amber-100 text-amber-700' : 'bg-slate-100 text-slate-500'
                    )}>{c.status}</span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {/* Regra por Faixa */}
          <div className="bg-white rounded-2xl border border-slate-200 p-6">
            <h4 className="text-sm font-bold text-slate-900 mb-4 flex items-center gap-2"><Award className="w-4 h-4 text-orange-500" /> Regras de Comissão</h4>
            <div className="space-y-3">
              {faixasComissao.map((f, i) => (
                <div key={i} className="flex items-center justify-between bg-slate-50 rounded-xl p-3">
                  <div className="flex items-center gap-2">
                    <div className="w-8 h-8 rounded-lg bg-orange-100 text-orange-600 flex items-center justify-center text-xs font-bold">{f.pct}%</div>
                    <span className="text-sm text-slate-700">{formatCurrency(f.de)} - {formatCurrency(f.ate)}</span>
                  </div>
                  <span className="text-xs text-slate-400">Faixa {i + 1}</span>
                </div>
              ))}
            </div>
            <p className="text-xs text-slate-400 mt-4">Automático (Progressivo por Faixa): quanto maior o valor da venda, maior o percentual.</p>
          </div>

          {/* Split Assessoria */}
          <div className="bg-white rounded-2xl border border-slate-200 p-6">
            <h4 className="text-sm font-bold text-slate-900 mb-4 flex items-center gap-2"><Users className="w-4 h-4 text-orange-500" /> Split de Comissão</h4>
            <div className="space-y-3">
              <div className="flex items-center justify-between bg-slate-50 rounded-xl p-3">
                <span className="text-sm text-slate-700">Assessoria Comercial</span>
                <span className="text-sm font-bold text-orange-600">3%</span>
              </div>
              <div className="flex items-center justify-between bg-slate-50 rounded-xl p-3">
                <span className="text-sm text-slate-700">Corretor (Agente / Corretor)</span>
                <span className="text-sm font-bold text-slate-900">5%</span>
              </div>
              <div className="flex items-center justify-between bg-slate-50 rounded-xl p-3">
                <span className="text-sm text-slate-700">Bônus Cumulativo não cumulativo</span>
                <span className="text-sm font-bold text-slate-900">+0,5%</span>
              </div>
            </div>
            <p className="text-xs text-slate-400 mt-4">Beneficiário / Função configura a divisão da comissão da operação.</p>
          </div>
        </div>
      )}
    </div>
  );
}