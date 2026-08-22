import React, { useState, useEffect } from 'react';
import { Bell, Check, X, ShieldAlert } from 'lucide-react';
import { useAuth } from '../hooks/useAuth';
import { supabase } from '../lib/supabase';

export default function Notificacoes() {
  const { user } = useAuth();
  const isAdmin = user?.role === 'admin';

  return (
    <div className="flex-1 flex flex-col min-h-0 bg-slate-950 p-6 lg:p-8">
      <div className="max-w-4xl mx-auto w-full space-y-6">
        
        {/* Header */}
        <div className="flex items-center gap-3 border-b border-slate-800 pb-4">
          <div className="w-12 h-12 rounded-2xl bg-sky-500/10 text-sky-400 flex items-center justify-center">
            <Bell className="w-6 h-6" />
          </div>
          <div>
            <h1 className="text-2xl font-bold text-white tracking-tight">Notificações</h1>
            <p className="text-sm text-slate-400">
              {isAdmin ? 'Central de Autorizações e Alertas do Sistema' : 'Acompanhe as respostas das suas solicitações'}
            </p>
          </div>
        </div>

        {/* Content */}
        <div className="bg-slate-900 border border-slate-800 rounded-3xl p-8 flex flex-col items-center justify-center min-h-[400px] text-center shadow-xl">
          <div className="w-16 h-16 rounded-full bg-slate-800 flex items-center justify-center mb-4">
            <Bell className="w-8 h-8 text-slate-500" />
          </div>
          <h3 className="text-lg font-bold text-white mb-2">Nenhuma Notificação</h3>
          <p className="text-sm text-slate-400 max-w-sm">
            {isAdmin 
              ? 'Nenhum usuário solicitou liberação de leads até o momento.'
              : 'Você não possui notificações ou alertas pendentes.'}
          </p>
        </div>

      </div>
    </div>
  );
}
