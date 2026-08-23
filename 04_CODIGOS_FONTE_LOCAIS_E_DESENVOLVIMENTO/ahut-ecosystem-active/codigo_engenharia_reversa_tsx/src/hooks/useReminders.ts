import { useEffect, useRef, useCallback } from 'react';
import { supabase } from '../lib/supabase';
import { useAuth } from './useAuth';

// ─── Tipos ────────────────────────────────────────────────────────────────────
export interface ReminderTrigger {
  offsetMinutes: number; // negativo = antes, positivo = depois, 0 = exato
  label: string;
}

export const REMINDER_TRIGGERS: ReminderTrigger[] = [
  { offsetMinutes: -120, label: '2 horas antes' },
  { offsetMinutes: -60,  label: '1 hora antes' },
  { offsetMinutes: -30,  label: '30 minutos antes' },
  { offsetMinutes: -5,   label: '5 minutos antes' },
  { offsetMinutes: 0,    label: 'Horário do evento' },
  { offsetMinutes: 5,    label: '5 minutos atrasado' },
  { offsetMinutes: 10,   label: '10 minutos atrasado' },
];

// ─── Áudio sintético (Web Audio API) ─────────────────────────────────────────
function playReminderBeep(isLate = false) {
  try {
    const AudioCtx = window.AudioContext || (window as any).webkitAudioContext;
    if (!AudioCtx) return;
    const ctx = new AudioCtx();

    const frequencies = isLate
      ? [880, 660, 880, 660] // tom de urgência para atraso
      : [523, 659, 784];     // tom amigável para aviso

    let startTime = ctx.currentTime;
    frequencies.forEach((freq) => {
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();
      osc.connect(gain);
      gain.connect(ctx.destination);
      osc.type = 'sine';
      osc.frequency.value = freq;
      gain.gain.setValueAtTime(0.3, startTime);
      gain.gain.exponentialRampToValueAtTime(0.001, startTime + 0.25);
      osc.start(startTime);
      osc.stop(startTime + 0.25);
      startTime += 0.3;
    });
  } catch (e) {
    console.warn('[useReminders] Áudio não disponível:', e);
  }
}

// ─── Notificação do Browser ───────────────────────────────────────────────────
async function requestNotificationPermission(): Promise<boolean> {
  if (!('Notification' in window)) return false;
  if (Notification.permission === 'granted') return true;
  const perm = await Notification.requestPermission();
  return perm === 'granted';
}

function showBrowserNotification(title: string, body: string) {
  if (Notification.permission === 'granted') {
    new Notification(title, {
      body,
      icon: '/favicon.ico',
      badge: '/favicon.ico',
      tag: `reminder-${Date.now()}`,
    });
  }
}

// ─── Hook Principal ────────────────────────────────────────────────────────────
export function useReminders() {
  const { user, profile } = useAuth();
  const firedRef = useRef<Set<string>>(new Set()); // evita disparos duplicados
  const intervalRef = useRef<ReturnType<typeof setInterval> | null>(null);

  const checkAndFire = useCallback(async () => {
    if (!user?.id) return;

    try {
      // Busca eventos agendados no futuro próximo e no passado recente
      const now = new Date();
      const windowStart = new Date(now.getTime() - 15 * 60 * 1000).toISOString(); // -15min
      const windowEnd   = new Date(now.getTime() + 130 * 60 * 1000).toISOString(); // +130min

      let query = supabase
        .from('agenda_events')
        .select('*')
        .gte('scheduled_at', windowStart)
        .lte('scheduled_at', windowEnd)
        .eq('status', 'pending');

      // RBAC: admin vê todos, agentes veem apenas seus próprios
      if (profile?.role !== 'admin' && profile?.role !== 'manager') {
        query = query.eq('user_id', user.id);
      }

      const { data: events, error } = await query;
      if (error || !events) return;

      for (const event of events) {
        const scheduledAt = new Date(event.scheduled_at).getTime();

        for (const trigger of REMINDER_TRIGGERS) {
          const triggerTime = scheduledAt + trigger.offsetMinutes * 60 * 1000;
          const key = `${event.id}__${trigger.offsetMinutes}`;

          // Dispara se estivermos dentro de uma janela de 1 minuto ao redor do trigger
          const diff = Math.abs(now.getTime() - triggerTime);
          if (diff <= 30_000 && !firedRef.current.has(key)) {
            firedRef.current.add(key);

            const isLate = trigger.offsetMinutes > 0;
            const title = isLate
              ? `⏰ Atraso: ${event.type || 'Evento'}`
              : `🔔 Lembrete: ${event.type || 'Evento'}`;
            const body = `${trigger.label} — ${event.sub_type || ''}`.trim();

            // 1. Som
            playReminderBeep(isLate);

            // 2. Notificação do sistema
            showBrowserNotification(title, body);

            // 3. Persiste na tabela de notificações para o painel
            await supabase.from('notifications').insert({
              user_id: event.user_id,
              title,
              body,
              type: isLate ? 'late' : 'reminder',
              agenda_event_id: event.id,
              is_read: false,
            }).then(({ error: insertErr }) => {
              if (insertErr) console.warn('[useReminders] insert notification error:', insertErr.message);
            });

            console.info(`[useReminders] 🔔 Fired: ${key} → ${title}`);
          }
        }
      }
    } catch (err) {
      console.error('[useReminders] Erro ao verificar lembretes:', err);
    }
  }, [user?.id, profile?.role]);

  useEffect(() => {
    // Pede permissão de notificação do browser na montagem
    requestNotificationPermission();

    // Roda de imediato e depois a cada 30s
    checkAndFire();
    intervalRef.current = setInterval(checkAndFire, 30_000);

    return () => {
      if (intervalRef.current) clearInterval(intervalRef.current);
    };
  }, [checkAndFire]);
}
