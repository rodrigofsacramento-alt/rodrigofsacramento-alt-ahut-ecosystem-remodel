import React, { useState, useEffect, useCallback } from 'react';
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
  AlertTriangle
} from 'lucide-react';
import { useAuth } from '../hooks/useAuth';
import { supabase } from '../lib/supabase';
import { cn } from '../lib/utils';

interface Notification {
  id: string;
  user_id: string;
  title: string;
  body: string;
  type: 'reminder' | 'late' | 'system' | 'approval';
  is_read: boolean;
  created_at: string;
  agenda_event_id?: string;
  sender_name?: string;
}

const TYPE_CONFIG: Record<string, { icon: React.ElementType; color: string; bg: string }> = {
  reminder: { icon: Bell,          color: 'text-sky-600',    bg: 'bg-sky-50 border-sky-100' },
  late:     { icon: AlertTriangle, color: 'text-rose-600',   bg: 'bg-rose-50 border-rose-100' },
  system:   { icon: ShieldAlert,   color: 'text-slate-600',  bg: 'bg-slate-50 border-slate-100' },
  approval: { icon: Check,         color: 'text-emerald-600',bg: 'bg-emerald-50 border-emerald-100' },
};

function formatTimeAgo(dateStr: string): string {
  const diff = Date.now() - new Date(dateStr).getTime();
  const min  = Math.floor(diff / 60_000);
  if (min < 1)  return 'agora';
  if (min < 60) return `${min}min atrás`;
  const hr = Math.floor(min / 60);
  if (hr < 24)  return `${hr}h atrás`;
  return `${Math.floor(hr / 24)}d atrás`;
}

export default function Notificacoes() {
  const { user, profile } = useAuth();
  const isAdmin   = profile?.role === 'admin' || profile?.role === 'manager';
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [loading, setLoading]   = useState(true);
  const [filter, setFilter]     = useState<'all' | 'unread' | 'reminder' | 'late'>('all');
  const [soundEnabled, setSoundEnabled] = useState(true);

  const fetchNotifications = useCallback(async () => {
    if (!user?.id) return;
    setLoading(true);
    try {
      let query = supabase
        .from('notifications')
        .select('*')
        .order('created_at', { ascending: false })
        .limit(100);

      // RBAC: admin vê todas; usuário comum vê só as suas
      if (!isAdmin) {
        query = query.eq('user_id', user.id);
      }

      const { data, error } = await query;
      if (error) {
        // Tabela pode não existir ainda — usa mock
        console.warn('[Notificacoes] tabela notifications não encontrada, usando mock:', error.message);
        setNotifications(getMockNotifications());
      } else {
        setNotifications(data as Notification[]);
      }
    } catch {
      setNotifications(getMockNotifications());
    } finally {
      setLoading(false);
    }
  }, [user?.id, isAdmin]);

  useEffect(() => { fetchNotifications(); }, [fetchNotifications]);

  // Realtime subscription
  useEffect(() => {
    if (!user?.id) return;
    const channel = supabase
      .channel('notifications-realtime')
      .on('postgres_changes', {
        event: 'INSERT',
        schema: 'public',
        table: 'notifications',
        filter: isAdmin ? undefined : `user_id=eq.${user.id}`,
      }, (payload) => {
        setNotifications(prev => [payload.new as Notification, ...prev]);
      })
      .subscribe();
    return () => { supabase.removeChannel(channel); };
  }, [user?.id, isAdmin]);

  const markAllRead = async () => {
    if (!user?.id) return;
    let q = supabase.from('notifications').update({ is_read: true }).eq('is_read', false);
    if (!isAdmin) q = q.eq('user_id', user.id);
    await q;
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
    if (filter === 'unread')   return !n.is_read;
    if (filter === 'reminder') return n.type === 'reminder';
    if (filter === 'late')     return n.type === 'late';
    return true;
  });

  const unreadCount = notifications.filter(n => !n.is_read).length;

  return (
    <div className="space-y-6 max-w-4xl mx-auto">
      {/* ─── Header ─── */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div className="flex items-center gap-4">
          <div className="w-12 h-12 rounded-2xl bg-gradient-to-br from-sky-500 to-indigo-600 flex items-center justify-center shadow-lg shadow-indigo-200">
            {unreadCount > 0 ? <BellRing className="w-6 h-6 text-white" /> : <Bell className="w-6 h-6 text-white" />}
          </div>
          <div>
            <h1 className="text-2xl font-bold text-slate-900">
              Notificações
              {unreadCount > 0 && (
                <span className="ml-3 text-sm font-black text-white bg-rose-500 px-2.5 py-0.5 rounded-full">
                  {unreadCount} novas
                </span>
              )}
            </h1>
            <p className="text-slate-500 text-sm">
              {isAdmin
                ? `Visão Admin — todos os usuários (${notifications.length} registros)`
                : 'Seus alertas e lembretes de agenda'}
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2">
          {/* Toggle som */}
          <button
            onClick={() => setSoundEnabled(!soundEnabled)}
            title={soundEnabled ? 'Desativar som' : 'Ativar som'}
            className={cn(
              "p-2 rounded-xl border transition-all",
              soundEnabled
                ? "bg-sky-50 border-sky-200 text-sky-600"
                : "bg-slate-100 border-slate-200 text-slate-400"
            )}
          >
            <Volume2 className="w-4 h-4" />
          </button>

          <button onClick={fetchNotifications} className="p-2 rounded-xl border border-slate-200 text-slate-500 hover:bg-slate-50 transition-colors">
            <RefreshCw className="w-4 h-4" />
          </button>

          {unreadCount > 0 && (
            <button
              onClick={markAllRead}
              className="flex items-center gap-2 px-4 py-2 bg-slate-900 text-white rounded-xl text-sm font-medium hover:bg-slate-700 transition-colors"
            >
              <Eye className="w-4 h-4" />
              Marcar todas lidas
            </button>
          )}
        </div>
      </div>

      {/* ─── Filtros ─── */}
      <div className="flex gap-2 flex-wrap">
        {(['all', 'unread', 'reminder', 'late'] as const).map(f => (
          <button
            key={f}
            onClick={() => setFilter(f)}
            className={cn(
              "px-4 py-2 rounded-xl text-sm font-semibold border transition-all",
              filter === f
                ? "bg-slate-900 text-white border-slate-900"
                : "bg-white text-slate-500 border-slate-200 hover:border-slate-300"
            )}
          >
            {f === 'all' && `Todas (${notifications.length})`}
            {f === 'unread' && `Não lidas (${unreadCount})`}
            {f === 'reminder' && 'Lembretes'}
            {f === 'late' && '⚠️ Atrasos'}
          </button>
        ))}
      </div>

      {/* ─── Lista ─── */}
      {loading ? (
        <div className="flex items-center justify-center py-24">
          <div className="w-8 h-8 animate-spin rounded-full border-2 border-slate-200 border-t-indigo-600" />
        </div>
      ) : filtered.length === 0 ? (
        <div className="bg-white border border-slate-200 rounded-2xl p-16 flex flex-col items-center text-center">
          <div className="w-16 h-16 rounded-full bg-slate-100 flex items-center justify-center mb-4">
            <Bell className="w-8 h-8 text-slate-300" />
          </div>
          <h3 className="text-lg font-bold text-slate-700 mb-1">Tudo em dia!</h3>
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
                    ? "bg-white border-slate-200"
                    : `${cfg.bg} border-2 shadow-sm`
                )}
              >
                {/* Ícone */}
                <div className={cn("w-10 h-10 rounded-xl flex items-center justify-center shrink-0", notif.is_read ? "bg-slate-100" : "bg-white shadow-sm")}>
                  <Icon className={cn("w-5 h-5", notif.is_read ? "text-slate-400" : cfg.color)} />
                </div>

                {/* Conteúdo */}
                <div className="flex-1 min-w-0">
                  <div className="flex items-start justify-between gap-2">
                    <div>
                      <p className={cn("font-bold text-sm", notif.is_read ? "text-slate-600" : "text-slate-900")}>
                        {notif.title}
                        {!notif.is_read && (
                          <span className="ml-2 inline-block w-2 h-2 rounded-full bg-sky-500" />
                        )}
                      </p>
                      <p className="text-sm text-slate-500 mt-0.5">{notif.body}</p>
                      {isAdmin && notif.sender_name && (
                        <p className="text-xs text-slate-400 mt-1 flex items-center gap-1">
                          <ShieldAlert className="w-3 h-3" /> De: {notif.sender_name}
                        </p>
                      )}
                    </div>
                    <span className="text-xs text-slate-400 whitespace-nowrap shrink-0">
                      {formatTimeAgo(notif.created_at)}
                    </span>
                  </div>
                </div>

                {/* Ações */}
                <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                  {!notif.is_read && (
                    <button
                      onClick={() => markRead(notif.id)}
                      title="Marcar como lida"
                      className="p-1.5 rounded-lg text-slate-400 hover:text-emerald-600 hover:bg-emerald-50 transition-colors"
                    >
                      <Check className="w-4 h-4" />
                    </button>
                  )}
                  <button
                    onClick={() => deleteNotification(notif.id)}
                    title="Remover"
                    className="p-1.5 rounded-lg text-slate-400 hover:text-rose-600 hover:bg-rose-50 transition-colors"
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

// ─── Dados mock para quando a tabela não existe ainda ─────────────────────────
function getMockNotifications(): Notification[] {
  const now = new Date();
  const mins = (m: number) => new Date(now.getTime() - m * 60_000).toISOString();
  return [
    { id: '1', user_id: '', title: '🔔 Lembrete: Visita', body: '30 minutos antes — Imóvel Cod. APT-42', type: 'reminder', is_read: false, created_at: mins(28) },
    { id: '2', user_id: '', title: '⏰ Atraso: Reunião', body: '5 minutos atrasado — Reunião com Cliente', type: 'late', is_read: false, created_at: mins(5) },
    { id: '3', user_id: '', title: '🔔 Lembrete: Ligação', body: '1 hora antes — Retorno p/ Lead João', type: 'reminder', is_read: true, created_at: mins(55) },
    { id: '4', user_id: '', title: '🔔 Lembrete: Visita', body: 'Horário do evento — Visita APT-18', type: 'reminder', is_read: true, created_at: mins(2) },
  ];
}
