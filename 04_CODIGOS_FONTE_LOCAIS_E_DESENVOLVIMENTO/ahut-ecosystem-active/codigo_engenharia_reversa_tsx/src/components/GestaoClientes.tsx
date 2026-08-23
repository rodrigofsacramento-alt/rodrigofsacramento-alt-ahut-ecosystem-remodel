import React, { useState, useMemo } from 'react';
import { Search, Users, Mail, Phone, Calendar, MessageSquare, ChevronRight, Activity, UserPlus, Home, FileText } from 'lucide-react';
import { cn } from '../lib/utils';

// Gestão de Clientes — engenharia reversa do chunk GestaoClientes-CQ6OAHuF.js

interface Cliente {
  id: number;
  nome: string;
  email: string;
  telefone: string;
  ativo: boolean;
  desde: string;
  propositas: number;
}

const clientesMock: Cliente[] = [
  { id: 1, nome: 'Carlos Andrade', email: 'carlos@email.com', telefone: '(11) 99888-4455', ativo: true, desde: '2025-03-12', propositas: 2 },
  { id: 2, nome: 'Marina Souza', email: 'marina@email.com', telefone: '(11) 97777-8899', ativo: true, desde: '2025-06-01', propositas: 1 },
  { id: 3, nome: 'João Pedro Lima', email: 'joao@email.com', telefone: '(11) 96666-3322', ativo: false, desde: '2024-11-20', propositas: 0 },
  { id: 4, nome: 'Ana Beatriz Ramos', email: 'ana@email.com', telefone: '(11) 95555-2211', ativo: true, desde: '2025-01-05', propositas: 3 },
];

export default function GestaoClientes() {
  const [busca, setBusca] = useState('');
  const [aba, setAba] = useState<'todos' | 'ativos' | 'inativos'>('todos');
  const [selecionado, setSelecionado] = useState<Cliente | null>(null);

  const filtrados = useMemo(() => {
    const q = busca.trim().toLowerCase();
    return clientesMock.filter((c) => {
      const matchQ = !q || c.nome.toLowerCase().includes(q) || c.email.toLowerCase().includes(q) || c.telefone.includes(q);
      let matchAba = true;
      if (aba === 'ativos') matchAba = c.ativo;
      if (aba === 'inativos') matchAba = !c.ativo;
      return matchQ && matchAba;
    });
  }, [busca, aba]);

  const totalAtivos = clientesMock.filter((c) => c.ativo).length;

  return (
    <div className="space-y-6">
      {/* Cabeçalho */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-lg font-bold text-slate-900">Gestão de Clientes</h2>
          <p className="text-sm text-slate-500">Visualize e gerencie os clientes da imobiliária.</p>
        </div>
        <div className="flex items-center gap-2 bg-slate-100 rounded-full px-4 py-2 text-sm font-bold text-slate-700">
          <Users className="w-4 h-4 text-orange-500" />
          Total de Clientes: {clientesMock.length}
        </div>
      </div>

      {/* Busca + abas */}
      <div className="flex flex-col md:flex-row gap-3">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
          <input
            value={busca}
            onChange={(e) => setBusca(e.target.value)}
            placeholder="Buscar por nome, email ou telefone..."
            className="w-full bg-white border border-slate-200 rounded-xl py-2.5 pl-10 pr-4 text-sm focus:ring-2 focus:ring-orange-500/30 focus:border-orange-500 outline-none"
          />
        </div>
        <div className="flex gap-1 bg-slate-100 rounded-xl p-1">
          {(['todos', 'ativos', 'inativos'] as const).map((t) => (
            <button
              key={t}
              onClick={() => setAba(t)}
              className={cn(
                'px-4 py-1.5 rounded-lg text-sm font-semibold transition-colors capitalize',
                aba === t ? 'bg-white shadow text-orange-600' : 'text-slate-500 hover:text-slate-700'
              )}
            >
              {t === 'ativos' ? `Ativos (${totalAtivos})` : t === 'inativos' ? 'Inativos' : 'Todos'}
            </button>
          ))}
        </div>
      </div>

      {/* Layout: lista + detalhe */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Lista */}
        <div className="lg:col-span-1 bg-white rounded-2xl border border-slate-200 p-2 space-y-1">
          {filtrados.length === 0 && (
            <div className="text-center text-sm text-slate-400 py-8">Nenhum cliente encontrado.</div>
          )}
          {filtrados.map((c) => (
            <button
              key={c.id}
              onClick={() => setSelecionado(c)}
              className={cn(
                'w-full flex items-center gap-3 p-3 rounded-xl text-left transition-colors',
                selecionado?.id === c.id ? 'bg-orange-50 border border-orange-200' : 'hover:bg-slate-50 border border-transparent'
              )}
            >
              <div className="w-10 h-10 rounded-full bg-slate-800 text-white flex items-center justify-center font-bold text-sm shrink-0">
                {c.nome.split(' ').map((n) => n[0]).slice(0, 2).join('').toUpperCase()}
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-sm font-bold text-slate-900 truncate">{c.nome}</p>
                <p className="text-xs text-slate-500 truncate">{c.email}</p>
              </div>
              <span className={cn(
                'text-[10px] font-bold px-2 py-0.5 rounded-full',
                c.ativo ? 'bg-emerald-100 text-emerald-700' : 'bg-slate-100 text-slate-500'
              )}>
                {c.ativo ? 'Cliente Ativo' : 'Cliente Inativo'}
              </span>
              <ChevronRight className="w-4 h-4 text-slate-300" />
            </button>
          ))}
        </div>

        {/* Detalhe */}
        <div className="lg:col-span-2 bg-white rounded-2xl border border-slate-200 p-6">
          {!selecionado ? (
            <div className="flex flex-col items-center justify-center h-64 text-slate-400">
              <Users className="w-12 h-12 text-slate-200 mb-2" />
              <p className="text-sm">Selecione um cliente para ver os detalhes.</p>
            </div>
          ) : (
            <div className="space-y-6">
              <div className="flex items-center gap-4">
                <div className="w-14 h-14 rounded-full bg-slate-800 text-white flex items-center justify-center font-bold text-lg">
                  {selecionado.nome.split(' ').map((n) => n[0]).slice(0, 2).join('').toUpperCase()}
                </div>
                <div>
                  <h3 className="text-lg font-bold text-slate-900">{selecionado.nome}</h3>
                  <span className={cn(
                    'text-xs font-bold px-2 py-0.5 rounded-full',
                    selecionado.ativo ? 'bg-emerald-100 text-emerald-700' : 'bg-slate-100 text-slate-500'
                  )}>
                    {selecionado.ativo ? 'Cliente Ativo' : 'Cliente Inativo'}
                  </span>
                </div>
              </div>

              {/* Informações de Contato */}
              <div>
                <h4 className="text-sm font-bold text-slate-900 mb-3">Informações de Contato</h4>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                  <div className="flex items-center gap-2 bg-slate-50 rounded-xl p-3">
                    <Mail className="w-4 h-4 text-orange-500" />
                    <span className="text-sm text-slate-700">{selecionado.email || 'Sem email'}</span>
                  </div>
                  <div className="flex items-center gap-2 bg-slate-50 rounded-xl p-3">
                    <Phone className="w-4 h-4 text-orange-500" />
                    <span className="text-sm text-slate-700">{selecionado.telefone}</span>
                  </div>
                  <div className="flex items-center gap-2 bg-slate-50 rounded-xl p-3">
                    <Calendar className="w-4 h-4 text-orange-500" />
                    <span className="text-sm text-slate-700">Cliente desde {selecionado.desde}</span>
                  </div>
                  <div className="flex items-center gap-2 bg-slate-50 rounded-xl p-3">
                    <FileText className="w-4 h-4 text-orange-500" />
                    <span className="text-sm text-slate-700">{selecionado.propositas} Proposta(s)</span>
                  </div>
                </div>
              </div>

              {/* Ações */}
              <div className="flex flex-wrap gap-2">
                <button className="inline-flex items-center gap-2 bg-orange-500 hover:bg-orange-600 text-white px-4 py-2 rounded-xl text-sm font-bold transition-colors">
                  <MessageSquare className="w-4 h-4" /> Iniciar Conversa
                </button>
                <button className="inline-flex items-center gap-2 bg-slate-100 hover:bg-slate-200 text-slate-700 px-4 py-2 rounded-xl text-sm font-bold transition-colors">
                  <Calendar className="w-4 h-4" /> Agendar Visita
                </button>
                <button className="inline-flex items-center gap-2 bg-slate-100 hover:bg-slate-200 text-slate-700 px-4 py-2 rounded-xl text-sm font-bold transition-colors">
                  <Activity className="w-4 h-4" /> Atividade
                </button>
                <button className="inline-flex items-center gap-2 bg-slate-100 hover:bg-slate-200 text-slate-700 px-4 py-2 rounded-xl text-sm font-bold transition-colors">
                  <UserPlus className="w-4 h-4" /> Ver Portal do Cliente
                </button>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}