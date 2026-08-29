import React, { useState, useEffect, useCallback, useRef } from 'react';
import {
  Bell,
  BellRing,
  Check,
  Clock,
  Calendar,
  Phone,
  Users,
  MessageSquare,
  ShieldAlert,
  Trash2,
  Volume2,
  RefreshCw,
  Eye,
  AlertTriangle,
  UserPlus,
  DollarSign,
  Sparkles,
  Handshake,
  TrendingUp,
  PartyPopper,
  X
} from 'lucide-react';
import { useAuth } from '../hooks/useAuth';
import { supabase } from '../lib/supabase';
import { cn } from '../lib/utils';

interface Notification {
  id: string;
  user_id: string;
  title: string;
  body: string;
  message?: string;
  type: 'new_lead' | 'sale_completed' | 'lead_contacted' | 'lead_qualified' | 'proposal_created' | 'visit_scheduled' | 'contract_signed' | 'reminder' | 'late' | 'system' | 'approval';
  is_read: boolean;
  is_global?: boolean;
  created_at: string;
  metadata?: any;
  sender_name?: string;
  lead_id?: string;
  sale_value?: number;
}

const TYPE_CONFIG: Record<string, { icon: React.ElementType; color: string; bg: string; sound?: string }> = {
  new_lead:        { icon: UserPlus,     color: 'text-emerald-600', bg: 'bg-emerald-500/10 border-emerald-500/30', sound: 'new_lead' },
  sale_completed:  { icon: PartyPopper,  color: 'text-amber-400',  bg: 'bg-amber-500/10 border-amber-500/30',    sound: 'sale' },
  lead_contacted:  { icon: Phone,        color: 'text-cyan-500',   bg: 'bg-blue-500/10 border-blue-500/30' },
  lead_qualified:  { icon: Sparkles,     color: 'text-violet-600', bg: 'bg-violet-500/10 border-violet-500/30' },
  proposal_created:{ icon: Handshake,    color: 'text-cyan-500', bg: 'bg-indigo-500/10 border-indigo-500/30' },
  visit_scheduled: { icon: Calendar,     color: 'text-teal-600',   bg: 'bg-teal-500/10 border-teal-500/30' },
  contract_signed: { icon: TrendingUp,   color: 'text-amber-300',  bg: 'bg-amber-500/10 border-amber-500/30' },
  reminder:        { icon: Bell,         color: 'text-sky-600',    bg: 'bg-sky-500/10 border-sky-500/20' },
  late:            { icon: AlertTriangle,color: 'text-rose-600',   bg: 'bg-rose-500/10 border-rose-100' },
  system:          { icon: ShieldAlert,  color: 'text-slate-300',  bg: 'bg-white/5 border-white/5' },
  approval:        { icon: Check,        color: 'text-emerald-600',bg: 'bg-emerald-500/10 border-emerald-500/20' },
};

function formatTimeAgo(dateStr: string): string {
  const diff = Date.now() - new Date(dateStr).getTime();
  const min  = Math.floor(diff / 60_000);
  if (min < 1)  return 'agora';
  if (min < 60) return `${min}min atrás`;
  const hr = Math.floor(min / 60);
  if (hr < 24)  return `${hr}h atrás`;
  if (hr < 48)  return 'ontem';
  return `${Math.floor(hr / 24)}d atrás`;
}

function formatCurrency(value: number): string {
  return new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(value);
}

// ─── Sons ─────────────────────────────────────────────────────────
const SOUND_URLS: Record<string, string> = {
  new_lead: 'https://assets.mixkit.co/active_storage/sfx/2355/2355-preview.mp3',
  sale:     'https://assets.mixkit.co/active_storage/sfx/2000/2000-preview.mp3',
  default:  'https://assets.mixkit.co/active_storage/sfx/2355/2355-preview.mp3',
};

function playSound(type: string) {
  try {
    const url = SOUND_URLS[type] || SOUND_URLS.default;
    const audio = new Audio(url);
    audio.volume = type === 'sale' ? 0.8 : 0.4;
    audio.play().catch(() => {}); // ignora bloqueio autoplay
  } catch {}
}

export default function Notificacoes() {
  const { user, profile } = useAuth();
  const isAdmin   = profile?.role === 'admin' || profile?.role === 'manager';
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [loading, setLoading]   = useState(true);
  const [filter, setFilter]     = useState<'all' | 'unread' | 'new_lead' | 'sale_completed' | 'reminder' | 'late'>('all');
  const [soundEnabled, setSoundEnabled] = useState(true);
  const prevCountRef = useRef(0);
  const [toast, setToast] = useState<Notification | null>(null);

  // Sound effect for new notifications
  useEffect(() => {
    if (notifications.length > prevCountRef.current && soundEnabled) {
      const newest = notifications[0];
      if (newest && !newest.is_read) {
        playSound(newest.type === 'sale_completed' ? 'sale' : newest.type);
        // Show toast for sale_completed
        if (newest.type === 'sale_completed' || newest.type === 'new_lead') {
          setToast(newest);
          setTimeout(() => setToast(null), 6000);
        }
      }
    }
    prevCountRef.current = notifications.length;
  }, [notifications, soundEnabled]);

  const fetchNotifications = useCallback(async () => {
    if (!user?.id) return;
    setLoading(true);
    try {
      const { data, error } = await supabase
        .from('notifications')
        .select('*')
        .order('created_at', { ascending: false })
        .limit(100);

      if (error) {
        console.warn('[Notificacoes] erro:', error.message);
        setNotifications(getMockNotifications());
      } else {
        setNotifications((data || []).map((n: any) => ({
          ...n,
          body: n.body || n.message || '',
        })));
      }
    } catch {
      setNotifications(getMockNotifications());
    } finally {
      setLoading(false);
    }
  }, [user?.id]);

  useEffect(() => { fetchNotifications(); }, [fetchNotifications]);

  // Realtime subscription
  useEffect(() => {
    if (!user?.id) return;
    const channel = supabase
      .channel('notifications-realtime')
      .on('postgres_changes' as any, {
        event: 'INSERT',
        schema: 'public',
        table: 'notifications',
      }, (payload: any) => {
        const newNotif = { ...payload.new, body: payload.new.body || payload.new.message || '' };
        setNotifications(prev => [newNotif as Notification, ...prev]);
      })
      .subscribe();
    return () => { supabase.removeChannel(channel); };
  }, [user?.id]);

  const markAllRead = async () => {
    if (!user?.id) return;
    await supabase.from('notifications').update({ is_read: true }).eq('is_read', false);
    setNotifications(prev => prev.map(n => ({ ...n, is_read: true })));
  };

  const markRead = async (id: string) => {
    await supabase.from('notifications').update({ is_read: true }).eq('id', id);
    setNotifications(prev => prev.map(n => n.id === id ? { ...n, is_read: true } : n));
  };

  const deleteNotification = async (id: string) => {
    await supabase.from('notifications').delete().eq('id', id);
    setNotifications(prev => prev.filter(n => n.id !== id));
  };

  const filtered = notifications.filter(n => {
    if (filter === 'unread')       return !n.is_read;
    if (filter === 'new_lead')     return n.type === 'new_lead';
    if (filter === 'sale_completed') return n.type === 'sale_completed';
    if (filter === 'reminder')     return n.type === 'reminder';
    if (filter === 'late')         return n.type === 'late';
    return true;
  });

  const unreadCount = notifications.filter(n => !n.is_read).length;
  const saleCount = notifications.filter(n => n.type === 'sale_completed').length;
  const leadCount = notifications.filter(n => n.type === 'new_lead').length;

  return (
    <div className="space-y-6 max-w-4xl mx-auto relative">
      {/* ─── Toast Notification ─── */}
      {toast && (
        <div className="fixed top-4 right-4 z-50 animate-in slide-in-from-top-2 fade-in duration-300">
          <div className={cn(
            "flex items-start gap-3 p-4 rounded-2xl border-2 shadow-2xl min-w-[320px] max-w-md",
            toast.type === 'sale_completed'
              ? "bg-gradient-to-r from-amber-500/10 to-yellow-500/10 border-amber-400"
              : "bg-emerald-500/10 border-emerald-300"
          )}>
            <div className={cn(
              "w-12 h-12 rounded-full flex items-center justify-center shrink-0",
              toast.type === 'sale_completed' ? "bg-amber-500/20" : "bg-emerald-500/20"
            )}>
              {toast.type === 'sale_completed' ? (
                <PartyPopper className="w-6 h-6 text-amber-400" />
              ) : (
                <UserPlus className="w-6 h-6 text-emerald-400" />
              )}
            </div>
            <div className="flex-1 min-w-0">
              <p className="font-bold text-sm text-white">{toast.title}</p>
              <p className="text-xs text-slate-300 mt-0.5">{toast.body}</p>
              {toast.sale_value && (
                <p className="text-lg font-black text-amber-400 mt-1">
                  {formatCurrency(Number(toast.sale_value))}
                </p>
              )}
            </div>
            <button onClick={() => setToast(null)} className="text-slate-400 hover:text-slate-300">
              <X className="w-4 h-4" />
            </button>
          </div>
        </div>
      )}

      {/* ─── Header ─── */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div className="flex items-center gap-4">
          <div className="w-12 h-12 rounded-2xl bg-gradient-to-br from-sky-500 to-indigo-600 flex items-center justify-center shadow-lg shadow-indigo-500/20">
            {unreadCount > 0 ? <BellRing className="w-6 h-6 text-white" /> : <Bell className="w-6 h-6 text-white" />}
          </div>
          <div>
            <h1 className="text-2xl font-bold text-white">
              Notificações
              {unreadCount > 0 && (
                <span className="ml-3 text-sm font-black text-white bg-rose-500 px-2.5 py-0.5 rounded-full">
                  {unreadCount} novas
                </span>
              )}
            </h1>
            <p className="text-slate-400 text-sm">
              {isAdmin
                ? `Visão Admin — ${notifications.length} registros`
                : 'Seus alertas e eventos'}
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2">
          <button
            onClick={() => setSoundEnabled(!soundEnabled)}
            title={soundEnabled ? 'Desativar som' : 'Ativar som'}
            className={cn(
              "p-2 rounded-xl border transition-all",
              soundEnabled
                ? "bg-sky-500/10 border-sky-500/30 text-sky-600"
                : "bg-white/5 border-cyan-900/30 text-slate-400"
            )}
          >
            <Volume2 className="w-4 h-4" />
          </button>

          <button onClick={fetchNotifications} className="p-2 rounded-xl border border-cyan-900/30 text-slate-400 hover:bg-white/5 transition-colors">
            <RefreshCw className="w-4 h-4" />
          </button>

          {unreadCount > 0 && (
            <button
              onClick={markAllRead}
              className="flex items-center gap-2 px-4 py-2 bg-[#0a0a0a] text-white rounded-xl text-sm font-medium hover:bg-white/5 transition-colors"
            >
              <Eye className="w-4 h-4" />
              Marcar todas lidas
            </button>
          )}
        </div>
      </div>

      {/* ─── Stats Cards ─── */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        <div className="glass-neon-card p-4">
          <div className="flex items-center gap-2 text-emerald-600 mb-1">
            <UserPlus className="w-4 h-4" />
            <span className="text-xs font-semibold uppercase tracking-wider">Novos Leads</span>
          </div>
          <p className="text-2xl font-black text-white">{leadCount}</p>
        </div>
        <div className="glass-neon-card p-4">
          <div className="flex items-center gap-2 text-amber-400 mb-1">
            <PartyPopper className="w-4 h-4" />
            <span className="text-xs font-semibold uppercase tracking-wider">Vendas</span>
          </div>
          <p className="text-2xl font-black text-white">{saleCount}</p>
        </div>
        <div className="glass-neon-card p-4">
          <div className="flex items-center gap-2 text-sky-600 mb-1">
            <BellRing className="w-4 h-4" />
            <span className="text-xs font-semibold uppercase tracking-wider">Não lidas</span>
          </div>
          <p className="text-2xl font-black text-white">{unreadCount}</p>
        </div>
        <div className="glass-neon-card p-4">
          <div className="flex items-center gap-2 text-slate-300 mb-1">
            <Bell className="w-4 h-4" />
            <span className="text-xs font-semibold uppercase tracking-wider">Total</span>
          </div>
          <p className="text-2xl font-black text-white">{notifications.length}</p>
        </div>
      </div>

      {/* ─── Filtros ─── */}
      <div className="flex gap-2 flex-wrap">
        {([
          { key: 'all', label: `Todas (${notifications.length})` },
          { key: 'unread', label: `Não lidas (${unreadCount})` },
          { key: 'new_lead', label: `🆕 Leads (${leadCount})` },
          { key: 'sale_completed', label: `💰 Vendas (${saleCount})` },
          { key: 'reminder', label: '🔔 Lembretes' },
          { key: 'late', label: '⚠️ Atrasos' },
        ] as const).map(f => (
          <button
            key={f.key}
            onClick={() => setFilter(f.key as any)}
            className={cn(
              "px-4 py-2 rounded-xl text-sm font-semibold border transition-all",
              filter === f.key
                ? "bg-[#0a0a0a] text-white border-slate-900"
                : "bg-white/5 text-slate-400 border-cyan-900/30 hover:border-cyan-900/40"
            )}
          >
            {f.label}
          </button>
        ))}
      </div>

      {/* ─── Lista ─── */}
      {loading ? (
        <div className="flex items-center justify-center py-24">
          <div className="w-8 h-8 animate-spin rounded-full border-2 border-cyan-900/30 border-t-indigo-600" />
        </div>
      ) : filtered.length === 0 ? (
        <div className="glass-neon-card p-16 flex flex-col items-center text-center">
          <div className="w-16 h-16 rounded-full bg-white/5 flex items-center justify-center mb-4">
            <Bell className="w-8 h-8 text-slate-300" />
          </div>
          <h3 className="text-lg font-bold text-slate-300 mb-1">Tudo em dia!</h3>
          <p className="text-sm text-slate-400">Nenhuma notificação {filter !== 'all' ? 'nessa categoria' : 'pendente'}.</p>
        </div>
      ) : (
        <div className="space-y-3">
          {filtered.map(notif => {
            const cfg = TYPE_CONFIG[notif.type] || TYPE_CONFIG.system;
            const Icon = cfg.icon;
            return (
              <div
                key={notif.id}
                className={cn(
                  "flex items-start gap-4 p-4 rounded-2xl border transition-all group",
                  notif.is_read
                    ? "bg-white/5 border-cyan-900/30"
                    : `${cfg.bg} border-2 shadow-sm`
                )}
              >
                <div className={cn("w-10 h-10 rounded-xl flex items-center justify-center shrink-0", notif.is_read ? "bg-white/5" : "bg-white/5 shadow-sm")}>
                  <Icon className={cn("w-5 h-5", notif.is_read ? "text-slate-400" : cfg.color)} />
                </div>

                <div className="flex-1 min-w-0">
                  <div className="flex items-start justify-between gap-2">
                    <div>
                      <p className={cn("font-bold text-sm", notif.is_read ? "text-slate-300" : "text-white")}>
                        {notif.title}
                        {!notif.is_read && (
                          <span className="ml-2 inline-block w-2 h-2 rounded-full bg-sky-500" />
                        )}
                      </p>
                      <p className="text-sm text-slate-400 mt-0.5">{notif.body}</p>
                      {notif.sale_value && (
                        <p className="text-base font-bold text-amber-400 mt-1">
                          {formatCurrency(Number(notif.sale_value))}
                        </p>
                      )}
                      {notif.metadata?.lead_name && (
                        <p className="text-xs text-slate-400 mt-1 flex items-center gap-1">
                          <Users className="w-3 h-3" /> {notif.metadata.lead_name}
                        </p>
                      )}
                    </div>
                    <span className="text-xs text-slate-400 whitespace-nowrap shrink-0">
                      {formatTimeAgo(notif.created_at)}
                    </span>
                  </div>
                </div>

                <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                  {!notif.is_read && (
                    <button
                      onClick={() => markRead(notif.id)}
                      title="Marcar como lida"
                      className="p-1.5 rounded-lg text-slate-400 hover:text-emerald-600 hover:bg-emerald-500/10 transition-colors"
                    >
                      <Check className="w-4 h-4" />
                    </button>
                  )}
                  <button
                    onClick={() => deleteNotification(notif.id)}
                    title="Remover"
                    className="p-1.5 rounded-lg text-slate-400 hover:text-rose-600 hover:bg-rose-500/10 transition-colors"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}

// ─── Dados mock ─────────────────────────
function getMockNotifications(): Notification[] {
  const now = new Date();
  const mins = (m: number) => new Date(now.getTime() - m * 60_000).toISOString();
  return [
    { id: 'm1', user_id: '', title: '💰 VENDA CONCLUÍDA! 🎉', body: 'Parabéns! Venda para "Maria Silva" — Imóvel: APT-42 — Valor: R$ 450.000,00', type: 'sale_completed', is_read: false, created_at: mins(2), sale_value: 450000, metadata: { lead_name: 'Maria Silva', property_code: 'APT-42' } },
    { id: 'm2', user_id: '', title: '🆕 Novo Lead Recebido', body: 'Lead "João Oliveira" (21 99876-5432) entrou no sistema. Fonte: WhatsApp', type: 'new_lead', is_read: false, created_at: mins(15), metadata: { lead_name: 'João Oliveira', phone: '21 99876-5432', source: 'WhatsApp' } },
    { id: 'm3', user_id: '', title: '🔔 Lembrete: Visita', body: '30 minutos antes — Imóvel Cod. APT-42', type: 'reminder', is_read: false, created_at: mins(28) },
    { id: 'm4', user_id: '', title: '📞 Lead Contatado', body: 'Lead "Carlos Santos" foi contatado. Iniciar acompanhamento.', type: 'lead_contacted', is_read: false, created_at: mins(35), metadata: { lead_name: 'Carlos Santos' } },
    { id: 'm5', user_id: '', title: '⏰ Atraso: Reunião', body: '5 minutos atrasado — Reunião com Cliente', type: 'late', is_read: false, created_at: mins(5) },
    { id: 'm6', user_id: '', title: '🔔 Lembrete: Ligação', body: '1 hora antes — Retorno p/ Lead João', type: 'reminder', is_read: true, created_at: mins(55) },
    { id: 'm7', user_id: '', title: '⭐ Lead Qualificado', body: 'Lead "Ana Costa" qualificado — Score: 85 — Interesse: APT Zona Sul', type: 'lead_qualified', is_read: true, created_at: mins(120), metadata: { lead_name: 'Ana Costa', score: 85 } },
  ];
}