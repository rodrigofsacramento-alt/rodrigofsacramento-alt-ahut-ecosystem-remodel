import React, { useState, useEffect } from 'react';
import { 
  X, 
  QrCode, 
  RefreshCw, 
  PowerOff, 
  Smartphone, 
  ShieldCheck, 
  AlertCircle, 
  CheckCircle2, 
  KeyRound,
  ExternalLink,
  MessageSquare,
  Sparkles
} from 'lucide-react';
import { supabase } from '../lib/supabase';
import { useLanguage } from '../contexts/LanguageContext';
import { cn } from '../lib/utils';

interface WhatsAppConnectionModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export default function WhatsAppConnectionModal({ isOpen, onClose }: WhatsAppConnectionModalProps) {
  const { t } = useLanguage();
  const [session, setSession] = useState<any>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [pairingPhone, setPairingPhone] = useState('');
  const [showPairingInput, setShowPairingInput] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  // Escuta status e QR Code em tempo real do Supabase
  useEffect(() => {
    if (!isOpen) return;

    async function fetchSession() {
      try {
        const { data, error } = await supabase
          .from('whatsapp_sessions')
          .select('*')
          .order('created_at', { ascending: false })
          .limit(1)
          .maybeSingle();

        if (error && error.code !== 'PGRST116') throw error;
        setSession(data);
      } catch (err: any) {
        console.error('Erro ao buscar sessão do WhatsApp:', err);
      }
    }

    fetchSession();

    // Inscrição Realtime no canal do banco
    const channel = supabase
      .channel('whatsapp_session_realtime')
      .on(
        'postgres_changes',
        { event: '*', schema: 'public', table: 'whatsapp_sessions' },
        (payload) => {
          if (payload.new) {
            setSession(payload.new);
            setIsLoading(false);
          }
        }
      )
      .subscribe();

    const interval = setInterval(fetchSession, 3000);

    return () => {
      supabase.removeChannel(channel);
      clearInterval(interval);
    };
  }, [isOpen]);

  if (!isOpen) return null;

  const isConnected = session?.status === 'connected';
  const isConnecting = session?.status === 'connecting';
  const hasQr = Boolean(session?.qr_code);
  const pairingCode = session?.pairing_code;

  // Ação de reconectar / gerar novo QR Code
  const handleReconnect = async () => {
    setIsLoading(true);
    setErrorMsg(null);
    try {
      if (session?.id) {
        await supabase
          .from('whatsapp_sessions')
          .update({
            status: 'connecting',
            qr_code: null,
            pairing_code: null,
            last_error: null
          })
          .eq('id', session.id);
      } else {
        await supabase.from('whatsapp_sessions').insert({
          session_name: 'default',
          status: 'connecting'
        });
      }
    } catch (err: any) {
      setErrorMsg(err?.message || 'Erro ao inicializar sessão');
    } finally {
      setTimeout(() => setIsLoading(false), 2000);
    }
  };

  // Ação de desconectar sessão
  const handleDisconnect = async () => {
    if (!confirm('Deseja realmente desconectar o WhatsApp oficial da imobiliária?')) return;
    setIsLoading(true);
    try {
      if (session?.id) {
        await supabase
          .from('whatsapp_sessions')
          .update({
            status: 'disconnected',
            qr_code: null,
            pairing_code: null,
            last_error: null
          })
          .eq('id', session.id);
      }
    } catch (err: any) {
      setErrorMsg(err?.message || 'Erro ao desconectar sessão');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-md p-4 animate-fade-up">
      <div 
        className="card-dark w-full max-w-lg overflow-hidden border border-cyan-500/30 shadow-[0_0_50px_rgba(0,245,160,0.15)] rounded-3xl"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header do Modal */}
        <div className="p-6 border-b border-white/10 flex items-center justify-between bg-gradient-to-r from-cyan-950/40 via-slate-900/60 to-emerald-950/40">
          <div className="flex items-center gap-3">
            <div className="w-12 h-12 rounded-2xl bg-gradient-to-br from-cyan-400 to-emerald-400 p-0.5 shadow-lg shadow-cyan-500/20">
              <div className="w-full h-full bg-slate-950 rounded-[14px] flex items-center justify-center text-[#00F5A0]">
                <QrCode className="w-6 h-6 animate-pulse" />
              </div>
            </div>
            <div>
              <h3 className="text-lg font-bold text-white flex items-center gap-2">
                Conexão WhatsApp Broker
                <span className={cn(
                  "text-[10px] uppercase font-bold px-2 py-0.5 rounded-full border",
                  isConnected ? "bg-emerald-500/10 text-emerald-400 border-emerald-500/30 shadow-[0_0_10px_rgba(16,185,129,0.2)]" :
                  isConnecting ? "bg-amber-500/10 text-amber-400 border-amber-500/30 animate-pulse" :
                  "bg-rose-500/10 text-rose-400 border-rose-500/30"
                )}>
                  {isConnected ? 'Conectado' : isConnecting ? 'Conectando...' : 'Desconectado'}
                </span>
              </h3>
              <p className="text-xs text-slate-400">Integração oficial Multi-Device (Baileys + VPS)</p>
            </div>
          </div>
          <button 
            onClick={onClose}
            className="text-slate-400 hover:text-white p-2 rounded-xl hover:bg-white/10 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Corpo do Modal */}
        <div className="p-6 space-y-6">
          {errorMsg && (
            <div className="p-3 bg-rose-500/10 border border-rose-500/30 rounded-xl flex items-center gap-3 text-rose-300 text-xs">
              <AlertCircle className="w-4 h-4 shrink-0" />
              <span>{errorMsg}</span>
            </div>
          )}

          {isConnected ? (
            /* Estado: CONECTADO */
            <div className="text-center py-6 space-y-4">
              <div className="w-20 h-20 mx-auto rounded-3xl bg-emerald-500/10 border border-emerald-500/30 flex items-center justify-center text-emerald-400 shadow-[0_0_30px_rgba(16,185,129,0.25)]">
                <ShieldCheck className="w-10 h-10" />
              </div>
              <div>
                <h4 className="text-base font-bold text-white">WhatsApp 100% Operacional</h4>
                <p className="text-xs text-slate-400 mt-1">
                  Número Ativo: <span className="text-[#00FFCC] font-mono font-bold">+{session?.phone_number || 'Conectado'}</span>
                </p>
                {session?.last_connected_at && (
                  <p className="text-[11px] text-slate-500 mt-0.5">
                    Última sincronização: {new Date(session.last_connected_at).toLocaleString('pt-BR')}
                  </p>
                )}
              </div>

              <div className="pt-4 flex items-center justify-center gap-3">
                <button
                  onClick={handleReconnect}
                  disabled={isLoading}
                  className="px-4 py-2.5 bg-white/5 hover:bg-white/10 border border-cyan-500/30 text-cyan-300 rounded-xl text-xs font-bold transition-all flex items-center gap-2"
                >
                  <RefreshCw className={cn("w-4 h-4", isLoading && "animate-spin")} />
                  Sincronizar / Reiniciar
                </button>
                <button
                  onClick={handleDisconnect}
                  disabled={isLoading}
                  className="px-4 py-2.5 bg-rose-500/10 hover:bg-rose-500/20 border border-rose-500/30 text-rose-300 rounded-xl text-xs font-bold transition-all flex items-center gap-2"
                >
                  <PowerOff className="w-4 h-4" />
                  Desconectar
                </button>
              </div>
            </div>
          ) : (
            /* Estado: DESCONECTADO OU GERANDO QR CODE */
            <div className="space-y-6">
              {hasQr ? (
                <div className="flex flex-col items-center space-y-4">
                  <div className="p-4 bg-white rounded-3xl shadow-2xl border-4 border-cyan-400/50 relative group">
                    <img 
                      src={session.qr_code.startsWith('data:') ? session.qr_code : `data:image/png;base64,${session.qr_code}`}
                      alt="WhatsApp QR Code"
                      className="w-56 h-56 object-contain"
                    />
                  </div>
                  <p className="text-xs text-slate-300 text-center flex items-center gap-2">
                    <Smartphone className="w-4 h-4 text-[#00F5A0]" />
                    Abra o WhatsApp no celular &gt; <strong>Aparelhos Conectados</strong> &gt; <strong>Conectar aparelho</strong>
                  </p>
                </div>
              ) : pairingCode ? (
                <div className="text-center py-4 space-y-3">
                  <p className="text-xs text-slate-400">Código de Pareamento por Número:</p>
                  <div className="p-4 bg-slate-950/80 border border-cyan-500/40 rounded-2xl">
                    <span className="text-2xl font-mono font-bold tracking-widest text-[#00FFCC]">
                      {pairingCode}
                    </span>
                  </div>
                  <p className="text-[11px] text-slate-400">
                    Insira este código na notificação do WhatsApp no celular para conectar sem câmera.
                  </p>
                </div>
              ) : (
                <div className="text-center py-8 space-y-4">
                  <div className="w-16 h-16 mx-auto rounded-2xl bg-cyan-500/10 border border-cyan-500/20 flex items-center justify-center text-cyan-400">
                    <QrCode className="w-8 h-8 opacity-70" />
                  </div>
                  <div>
                    <h4 className="text-sm font-bold text-white">Nenhum QR Code ativo no momento</h4>
                    <p className="text-xs text-slate-400 mt-1 max-w-xs mx-auto">
                      Clique no botão abaixo para inicializar o broker na VPS e gerar um novo QR Code de autenticação.
                    </p>
                  </div>
                </div>
              )}

              {/* Botões de Ação */}
              <div className="pt-2 flex flex-col gap-2.5">
                <button
                  onClick={handleReconnect}
                  disabled={isLoading}
                  className="w-full py-3 bg-gradient-to-r from-cyan-500 via-[#00F5A0] to-emerald-400 hover:opacity-95 text-slate-950 font-bold rounded-xl text-sm shadow-[0_0_20px_rgba(0,245,160,0.3)] transition-all flex items-center justify-center gap-2"
                >
                  <RefreshCw className={cn("w-4 h-4", isLoading && "animate-spin")} />
                  {hasQr ? 'Atualizar QR Code' : 'Gerar Novo QR Code'}
                </button>
              </div>
            </div>
          )}

          {/* Dica de Segurança e Infraestrutura */}
          <div className="p-3.5 bg-slate-950/50 border border-white/5 rounded-2xl flex items-start gap-3 text-[11px] text-slate-400">
            <Sparkles className="w-4 h-4 text-[#00FFCC] shrink-0 mt-0.5" />
            <span>
              O broker roda em segundo plano na VPS (<code className="text-slate-300">2.24.95.98:3001</code>). Ele mantém a conexão ativa mesmo com o celular sem internet ou desligado.
            </span>
          </div>
        </div>
      </div>
    </div>
  );
}