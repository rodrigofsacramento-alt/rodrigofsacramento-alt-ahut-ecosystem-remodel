import { useState, useEffect, useRef, useMemo } from 'react';
import AsyncCombobox, { LookupItem } from '../components/AsyncCombobox';
import { 
  Plus, 
  ChevronLeft, 
  ChevronRight, 
  Search, 
  Clock, 
  MapPin, 
  CheckCircle2, 
  AlertCircle,
  X,
  Bell,
  BellOff,
  Calendar as CalendarIcon,
  MessageSquare,
  Phone,
  Video,
  Users,
  ChevronDown,
  ChevronUp
} from 'lucide-react';
import { cn } from '../lib/utils';
import { useAuth } from '../hooks/useAuth';
import { useVisits, useCreateVisit, Visit } from '../hooks/useVisits';
import { useCreateAgendaEvent } from '../hooks/useAgendaEvents';
import { useReminders, REMINDER_TRIGGERS } from '../hooks/useReminders';

const days = ['DOM', 'SEG', 'TER', 'QUA', 'QUI', 'SEX', 'SÁB'];
const months = ['Janeiro', 'Fevereiro', 'Março', 'Abril', 'Maio', 'Junho', 'Julho', 'Agosto', 'Setembro', 'Outubro', 'Novembro', 'Dezembro'];

type EventType = 'visita' | 'ligacao' | 'mensagem' | 'reuniao' | 'lembrete';

interface Event {
  id: string;
  day: number;
  month: number;
  year: number;
  time: string;
  client: string;
  property?: string;
  status: 'pending' | 'completed' | 'cancelled';
  type: EventType;
  user_id: string;
  scheduled_at: string;
  title?: string;
  description?: string;
}

// ─── Sound notification using Web Audio API ───
function playNotificationSound() {
  try {
    const AudioCtx = window.AudioContext || (window as any).webkitAudioContext;
    if (!AudioCtx) return;
    const ctx = new AudioCtx();
    const frequencies = [523, 659, 784]; // C E G pleasant chord
    let startTime = ctx.currentTime;
    frequencies.forEach((freq) => {
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();
      osc.connect(gain);
      gain.connect(ctx.destination);
      osc.type = 'sine';
      osc.frequency.value = freq;
      gain.gain.setValueAtTime(0.2, startTime);
      gain.gain.exponentialRampToValueAtTime(0.001, startTime + 0.3);
      osc.start(startTime);
      osc.stop(startTime + 0.3);
      startTime += 0.15;
    });
  } catch (e) {
    console.warn('[Agenda] Áudio não disponível:', e);
  }
}

export default function Agenda() {
  const { user } = useAuth();
  const { data: visits = [], isLoading } = useVisits();
  const createVisit = useCreateVisit();
  const createAgendaEvent = useCreateAgendaEvent();
  const [modalType, setModalType] = useState<EventType | null>(null);
  const now = new Date();
  const [currentDate, setCurrentDate] = useState(new Date(now.getFullYear(), now.getMonth(), 1));
  const [showDropdown, setShowDropdown] = useState(false);
  const [viewMode, setViewMode] = useState<'month' | 'week' | 'day'>('month');
  // ── Converte Visit (Supabase) + eventos mockados para o formato Event do calendário ──
  const currentUserId = user?.id || 'any';
  const myEvents: Event[] = useMemo(() => {
    const events: Event[] = visits.map((v) => {
      const d = new Date(v.scheduled_at);
      const time = `${d.getHours().toString().padStart(2, '0')}:${d.getMinutes().toString().padStart(2, '0')}`;
      return {
        id: v.id,
        day: d.getDate(),
        month: d.getMonth(),
        year: d.getFullYear(),
        time,
        client: v.lead?.name || v.property?.title || 'Cliente',
        property: v.property?.title || v.notes || undefined,
        status: (v.status === 'completed' ? 'completed' : v.status === 'cancelled' ? 'cancelled' : 'pending') as Event['status'],
        type: 'visita' as EventType,
        user_id: v.agent_id || currentUserId,
        scheduled_at: v.scheduled_at,
        title: v.lead?.name || 'Visita',
        description: v.notes || undefined,
      };
    });
    return events;
  }, [visits, currentUserId]);

  const [showSnoozeToast, setShowSnoozeToast] = useState(false);
  const [toastMessage, setToastMessage] = useState('');
  const [toastEventId, setToastEventId] = useState<string | null>(null);
  const snoozeTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  // Estado do formulário de novo evento (com lembrete)
  const [eventForm, setEventForm] = useState({
    date: '',
    time: '10:00',
    leadId: '',
    leadName: '',
    propertyId: '',
    propertyName: '',
    message: '',
    meetingType: 'Online (Google Meet/Zoom)',
    saving: false,
    reminderMinutes: 30, // default reminder 30 min before
  });

  // ── Inicializar hook de lembretes ──
  useReminders();

  // ── Verificação de eventos próximos (lembretes visuais) ──
  useEffect(() => {
    const checkUpcoming = () => {
      const nowMs = Date.now();
      const upcomingEvents = myEvents.filter(e => {
        if (e.status !== 'pending') return false;
        const eventDate = new Date(e.scheduled_at);
        const diffMs = eventDate.getTime() - nowMs;
        // Notify 5 min before
        return diffMs > 0 && diffMs <= 5 * 60 * 1000;
      });
      for (const evt of upcomingEvents) {
        playNotificationSound();
        setToastMessage(`🔔 ${evt.type.toUpperCase()}: ${evt.client} às ${evt.time}`);
        setToastEventId(evt.id);
        setShowSnoozeToast(true);
      }
    };

    checkUpcoming();
    const interval = setInterval(checkUpcoming, 30_000); // check every 30s
    return () => clearInterval(interval);
  }, [myEvents]);

  // Cleanup snooze timer
  useEffect(() => {
    return () => {
      if (snoozeTimerRef.current) clearTimeout(snoozeTimerRef.current);
    };
  }, []);

  const handleSnooze = () => {
    setShowSnoozeToast(false);
    // Re-show after 5 min
    if (snoozeTimerRef.current) clearTimeout(snoozeTimerRef.current);
    snoozeTimerRef.current = setTimeout(() => {
      if (toastEventId) {
        playNotificationSound();
        setShowSnoozeToast(true);
      }
    }, 5 * 60 * 1000);
  };

  // ── Pending events count for badge ──
  const pendingCount = useMemo(() => {
    return myEvents.filter(e => e.status === 'pending').length;
  }, [myEvents]);

  // Navigation helpers
  const goToPrevMonth = () => {
    setCurrentDate(prev => new Date(prev.getFullYear(), prev.getMonth() - 1, 1));
  };
  const goToNextMonth = () => {
    setCurrentDate(prev => new Date(prev.getFullYear(), prev.getMonth() + 1, 1));
  };
  const goToToday = () => {
    setCurrentDate(new Date(now.getFullYear(), now.getMonth(), 1));
  };

  const currentMonthStr = `${months[currentDate.getMonth()]} ${currentDate.getFullYear()}`;
  const isCurrentMonth = currentDate.getMonth() === now.getMonth() && currentDate.getFullYear() === now.getFullYear();

  const handleSaveEvent = async () => {
    if (!modalType || !eventForm.date) {
      alert('Preencha a data do evento.');
      return;
    }
    setEventForm((f) => ({ ...f, saving: true }));
    try {
      const scheduledAt = new Date(`${eventForm.date}T${eventForm.time}:00`).toISOString();

      // Cria o evento na agenda com tipo específico
      const mappedType = modalType === 'lembrete' ? 'mensagem' : modalType;
      await createAgendaEvent.mutateAsync({
        type: mappedType,
        sub_type: modalType === 'reuniao' ? eventForm.meetingType : 
                  modalType === 'mensagem' ? eventForm.message :
                  modalType === 'lembrete' ? eventForm.message : undefined,
        scheduled_at: scheduledAt,
        lead_id: eventForm.leadId || null,
        property_id: eventForm.propertyId || null,
        notes: eventForm.message || null,
      });

      // Som de confirmação
      playNotificationSound();

      alert(`✅ Evento agendado! Lembrete em ${eventForm.reminderMinutes}min.`);
      setModalType(null);
      setEventForm({ date: '', time: '10:00', leadId: '', leadName: '', propertyId: '', propertyName: '', message: '', meetingType: 'Online (Google Meet/Zoom)', saving: false, reminderMinutes: 30 });
    } catch (err: any) {
      console.error('Erro ao salvar evento:', err);
      alert('Erro ao salvar evento: ' + (err?.message || 'tente novamente'));
    } finally {
      setEventForm((f) => ({ ...f, saving: false }));
    }
  };

  // Filter events for current month
  const monthEvents = useMemo(() => {
    return myEvents.filter(
      e => e.month === currentDate.getMonth() && e.year === currentDate.getFullYear()
    );
  }, [myEvents, currentDate]);

  // Get events for a specific day
  const getDayEvents = (dayNum: number) => {
    return monthEvents.filter(v => v.day === dayNum);
  };

  // Upcoming events for sidebar
  const todayEvents = useMemo(() => {
    return myEvents.filter(
      e => e.day === now.getDate() && e.month === now.getMonth() && e.year === now.getFullYear() && e.status === 'pending'
    ).sort((a, b) => {
      const [aH, aM] = a.time.split(':').map(Number);
      const [bH, bM] = b.time.split(':').map(Number);
      return (aH * 60 + aM) - (bH * 60 + bM);
    });
  }, [myEvents, now]);

  // Calendar grid
  const firstDayOfMonth = new Date(currentDate.getFullYear(), currentDate.getMonth(), 1).getDay();
  const daysInMonth = new Date(currentDate.getFullYear(), currentDate.getMonth() + 1, 0).getDate();
  const calendarDays = Array.from({ length: daysInMonth + firstDayOfMonth }, (_, i) => i - firstDayOfMonth + 1);

  const getEventIcon = (type: EventType) => {
    switch (type) {
      case 'visita': return <MapPin className="w-3 h-3" />;
      case 'ligacao': return <Phone className="w-3 h-3" />;
      case 'mensagem': return <MessageSquare className="w-3 h-3" />;
      case 'reuniao': return <Video className="w-3 h-3" />;
      case 'lembrete': return <Bell className="w-3 h-3" />;
    }
  };

  const getEventColor = (type: EventType) => {
    switch (type) {
      case 'visita': return "bg-cyan-500/10 text-cyan-400 border-cyan-500/20";
      case 'ligacao': return "bg-blue-500/10 text-cyan-500 border-blue-500/20";
      case 'mensagem': return "bg-emerald-500/10 text-emerald-600 border-emerald-500/20";
      case 'reuniao': return "bg-purple-500/10 text-purple-600 border-purple-500/20";
      case 'lembrete': return "bg-amber-500/10 text-amber-400 border-amber-500/20";
    }
  };

  const getEventColorBg = (type: EventType) => {
    switch (type) {
      case 'visita': return "bg-cyan-500";
      case 'ligacao': return "bg-blue-500";
      case 'mensagem': return "bg-emerald-500";
      case 'reuniao': return "bg-purple-500";
      case 'lembrete': return "bg-amber-500";
    }
  };

  // Get next event
  const nextEvent = todayEvents[0] || null;
  const getNextEventTimeStr = () => {
    if (!nextEvent) return '';
    const [h, m] = nextEvent.time.split(':').map(Number);
    const eventDate = new Date();
    eventDate.setHours(h, m, 0, 0);
    const diffMs = eventDate.getTime() - Date.now();
    if (diffMs <= 0) return 'Agora';
    const diffMin = Math.round(diffMs / 60000);
    if (diffMin < 60) return `Em ${diffMin} min`;
    const diffH = Math.floor(diffMin / 60);
    const diffM = diffMin % 60;
    return `Em ${diffH}h${diffM > 0 ? diffM : ''}`;
  };

  return (
    <div className="p-6 space-y-6 bg-transparent min-h-full">
      {/* Toast de notificação */}
      {showSnoozeToast && toastMessage && (
        <div className="fixed top-4 right-4 z-[100] animate-in slide-in-from-right-5 fade-in duration-200">
          <div className="bg-white/5 border border-amber-500/30 rounded-2xl shadow-2xl p-4 max-w-sm flex items-start gap-3">
            <div className="w-10 h-10 rounded-full bg-amber-500/20 text-amber-400 flex items-center justify-center shrink-0">
              <Bell className="w-5 h-5" />
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-sm font-bold text-white mb-1">Lembrete</p>
              <p className="text-xs text-slate-300">{toastMessage}</p>
              <div className="flex items-center gap-2 mt-3">
                <button
                  onClick={() => setShowSnoozeToast(false)}
                  className="px-3 py-1 text-[10px] font-bold bg-white/5 text-slate-300 rounded-lg hover:bg-white/10 transition-colors"
                >
                  OK
                </button>
                <button
                  onClick={handleSnooze}
                  className="px-3 py-1 text-[10px] font-bold bg-amber-500/20 text-amber-400 rounded-lg hover:bg-amber-200 transition-colors flex items-center gap-1"
                >
                  <Clock className="w-3 h-3" /> Snooze 5min
                </button>
              </div>
            </div>
            <button onClick={() => setShowSnoozeToast(false)} className="text-slate-400 hover:text-slate-300 p-1">
              <X className="w-4 h-4" />
            </button>
          </div>
        </div>
      )}

      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          <div className="flex items-center gap-2 bg-white/5 border border-cyan-900/30 rounded-xl p-1">
            <button onClick={goToPrevMonth} className="p-2 hover:bg-white/5 rounded-lg text-slate-400">
              <ChevronLeft className="w-4 h-4" />
            </button>
            <span className="text-sm font-bold px-4 min-w-[140px] text-center">{currentMonthStr}</span>
            <button onClick={goToNextMonth} className="p-2 hover:bg-white/5 rounded-lg text-slate-400">
              <ChevronRight className="w-4 h-4" />
            </button>
          </div>
          <button 
            onClick={goToToday}
            className={cn(
              "px-4 py-2 border rounded-xl text-sm font-bold transition-colors",
              isCurrentMonth 
                ? "bg-cyan-500 text-white border-cyan-500" 
                : "bg-white/5 border-cyan-900/30 text-slate-300 hover:bg-white/5"
            )}
          >
            Hoje
          </button>
          
          <div className="flex p-1 bg-white/5 rounded-xl ml-4">
            <button 
              onClick={() => setViewMode('month')}
              className={cn(
                "px-4 py-1.5 text-xs font-bold rounded-lg transition-all",
                viewMode === 'month' ? "bg-white/5 text-white shadow-sm" : "text-slate-400 hover:text-slate-300"
              )}
            >
              Mês
            </button>
            <button 
              onClick={() => setViewMode('week')}
              className={cn(
                "px-4 py-1.5 text-xs font-bold rounded-lg transition-all",
                viewMode === 'week' ? "bg-white/5 text-white shadow-sm" : "text-slate-400 hover:text-slate-300"
              )}
            >
              Semana
            </button>
            <button 
              onClick={() => setViewMode('day')}
              className={cn(
                "px-4 py-1.5 text-xs font-bold rounded-lg transition-all",
                viewMode === 'day' ? "bg-white/5 text-white shadow-sm" : "text-slate-400 hover:text-slate-300"
              )}
            >
              Dia
            </button>
          </div>
        </div>

        <div className="flex items-center gap-3">
          {/* Badge de Lembretes Pendentes */}
          {pendingCount > 0 && (
            <div className="flex items-center gap-1.5 px-3 py-1.5 bg-amber-500/10 border border-amber-500/30 rounded-full">
              <Bell className="w-4 h-4 text-amber-500" />
              <span className="text-xs font-bold text-amber-300">{pendingCount} pendente{pendingCount > 1 ? 's' : ''}</span>
            </div>
          )}

          <div className="relative">
            <button 
              onClick={() => setShowDropdown(!showDropdown)}
              className="bg-cyan-500 hover:bg-cyan-600 text-white px-4 py-2 rounded-lg text-sm font-bold flex items-center gap-2 transition-colors"
            >
              <Plus className="w-4 h-4" />
              Novo Evento
            </button>
            
            {showDropdown && (
              <div className="absolute right-0 mt-2 w-56 bg-white/5 border border-cyan-900/30 rounded-xl shadow-lg z-20 py-2">
                <button onClick={() => { setModalType('mensagem'); setShowDropdown(false); }} className="w-full px-4 py-2 text-left text-sm text-slate-300 hover:bg-white/5 flex items-center gap-2">
                  <MessageSquare className="w-4 h-4 text-emerald-500" /> Agendar Mensagem
                </button>
                <button onClick={() => { setModalType('ligacao'); setShowDropdown(false); }} className="w-full px-4 py-2 text-left text-sm text-slate-300 hover:bg-white/5 flex items-center gap-2">
                  <Phone className="w-4 h-4 text-blue-500" /> Registrar Ligação
                </button>
                <button onClick={() => { setModalType('visita'); setShowDropdown(false); }} className="w-full px-4 py-2 text-left text-sm text-slate-300 hover:bg-white/5 flex items-center gap-2">
                  <MapPin className="w-4 h-4 text-cyan-500" /> Agendar Visita
                </button>
                <button onClick={() => { setModalType('reuniao'); setShowDropdown(false); }} className="w-full px-4 py-2 text-left text-sm text-slate-300 hover:bg-white/5 flex items-center gap-2">
                  <Video className="w-4 h-4 text-purple-500" /> Agendar Reunião
                </button>
                <div className="border-t border-white/5 my-1" />
                <button onClick={() => { setModalType('lembrete'); setShowDropdown(false); }} className="w-full px-4 py-2 text-left text-sm text-slate-300 hover:bg-white/5 flex items-center gap-2">
                  <Bell className="w-4 h-4 text-amber-500" /> Criar Lembrete
                </button>
              </div>
            )}
          </div>
        </div>
      </div>

      <div className="grid lg:grid-cols-3 gap-6">
        {/* Calendar Grid */}
        <div className="lg:col-span-2 glass-neon-card overflow-hidden">
          <div className="grid grid-cols-7 border-b border-white/5">
            {days.map(day => (
              <div key={day} className="p-4 text-center text-[10px] font-bold text-slate-400 uppercase tracking-wider">{day}</div>
            ))}
          </div>
          <div className="grid grid-cols-7">
            {calendarDays.map((dayNum, i) => {
              const dayEvents = getDayEvents(dayNum);
              const isToday = dayNum === now.getDate() && isCurrentMonth;
              const isValidDay = dayNum > 0 && dayNum <= daysInMonth;
              
              return (
                <div key={i} className={cn(
                  "min-h-[120px] p-2 border-r border-b border-white/5 last:border-r-0 relative",
                  !isValidDay ? "bg-white/[0.03]" : "bg-white/5 hover:bg-white/10 transition-colors cursor-pointer"
                )}>
                  {isValidDay && (
                    <>
                      <span className={cn(
                        "text-xs font-bold w-6 h-6 flex items-center justify-center rounded-full mb-1",
                        isToday ? "bg-cyan-500 text-white" : "text-slate-400"
                      )}>
                        {dayNum}
                      </span>
                      <div className="space-y-1">
                        {dayEvents.slice(0, 3).map(event => (
                          <div key={event.id} className={cn(
                            "p-1 rounded-md text-[9px] font-bold truncate border flex items-center gap-1",
                            getEventColor(event.type),
                            event.status === 'completed' && "opacity-50 line-through"
                          )}>
                            {getEventIcon(event.type)}
                            {event.time} - {event.client.split(' ')[0]}
                          </div>
                        ))}
                        {dayEvents.length > 3 && (
                          <span className="text-[9px] font-bold text-slate-400 pl-1">
                            +{dayEvents.length - 3} mais
                          </span>
                        )}
                      </div>
                    </>
                  )}
                </div>
              );
            })}
          </div>
        </div>

        {/* Sidebar Info */}
        <div className="space-y-6">
          <div className="bg-white/5 p-6 rounded-2xl border border-cyan-900/30">
            <div className="flex items-center justify-between mb-6">
              <h3 className="text-lg font-bold text-white">
                {viewMode === 'day' ? 'Eventos do Dia' : 'Próximos Eventos'}
              </h3>
              <span className="text-xs text-slate-400">
                {now.toLocaleDateString('pt-BR', { weekday: 'long', day: 'numeric', month: 'short' })}
              </span>
            </div>

            {nextEvent && (
              <div className={cn(
                "rounded-2xl p-6 text-white mb-6 relative overflow-hidden",
                getEventColorBg(nextEvent.type)
              )}>
                <div className="relative z-10">
                  <div className="flex items-center justify-between mb-4">
                    <span className="text-[10px] font-bold px-2 py-1 bg-white/20 rounded-full uppercase flex items-center gap-1">
                      {getEventIcon(nextEvent.type)}
                      Próximo {nextEvent.type}
                    </span>
                    <span className="text-[10px] font-bold opacity-80">{getNextEventTimeStr()}</span>
                  </div>
                  <h4 className="text-xl font-bold mb-1">{nextEvent.client}</h4>
                  {nextEvent.property && (
                    <p className="text-sm opacity-80 mb-4">{nextEvent.property}</p>
                  )}
                  <div className="flex items-center gap-2 text-sm font-bold mb-4">
                    <Clock className="w-4 h-4" />
                    {nextEvent.time}
                  </div>
                  <div className="flex items-center gap-2">
                    <button className="flex-1 py-2 bg-white/5 text-white rounded-lg text-xs font-bold hover:bg-white/5 transition-colors">
                      {nextEvent.type === 'visita' ? 'Iniciar Rota' : 'Confirmar'}
                    </button>
                    <button className="flex-1 py-2 bg-white/20 text-white rounded-lg text-xs font-bold hover:bg-white/30 transition-colors">
                      {nextEvent.type === 'ligacao' ? 'Ligar Agora' : 'Check-in'}
                    </button>
                  </div>
                </div>
                <div className="absolute top-0 right-0 w-32 h-32 bg-white/10 rounded-full -translate-y-1/2 translate-x-1/2 blur-2xl" />
              </div>
            )}

            {!nextEvent && (
              <div className="bg-white/5 rounded-2xl p-8 text-center mb-6">
                <CalendarIcon className="w-10 h-10 text-slate-300 mx-auto mb-3" />
                <p className="text-sm font-semibold text-slate-400">Nenhum evento hoje</p>
                <p className="text-xs text-slate-400 mt-1">Clique em "Novo Evento" para agendar</p>
              </div>
            )}

            {/* Lista de eventos do dia */}
            <div className="space-y-2 max-h-64 overflow-y-auto">
              {todayEvents.length === 0 ? (
                <p className="text-xs text-slate-400 text-center py-4">Nenhum evento pendente para hoje.</p>
              ) : (
                todayEvents.map(event => (
                  <div key={event.id} className="flex items-center gap-3 p-3 bg-white/5 rounded-xl border border-white/5">
                    <div className={cn(
                      "w-8 h-8 rounded-full flex items-center justify-center",
                      event.type === 'visita' ? 'bg-cyan-500/20 text-cyan-500' :
                      event.type === 'ligacao' ? 'bg-blue-500/20 text-blue-400' :
                      event.type === 'reuniao' ? 'bg-purple-500/20 text-purple-400' :
                      event.type === 'lembrete' ? 'bg-amber-500/20 text-amber-400' :
                      'bg-emerald-500/20 text-emerald-400'
                    )}>
                      {getEventIcon(event.type)}
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-xs font-bold text-white truncate">{event.client}</p>
                      <p className="text-[10px] text-slate-400">{event.time}{event.property ? ` · ${event.property}` : ''}</p>
                    </div>
                    <span className={cn(
                      "text-[10px] font-bold px-2 py-0.5 rounded-full",
                      event.status === 'pending' ? 'bg-amber-500/20 text-amber-400' :
                      event.status === 'completed' ? 'bg-emerald-500/20 text-emerald-400' :
                      'bg-white/5 text-slate-400'
                    )}>
                      {event.status === 'pending' ? 'Pendente' : event.status === 'completed' ? 'Concluído' : 'Cancelado'}
                    </span>
                  </div>
                ))
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Modal Multi-uso */}
      {modalType && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm">
          <div className="bg-white/5 rounded-2xl w-full max-w-lg max-h-[90vh] overflow-y-auto shadow-2xl animate-in fade-in zoom-in duration-200">
            <div className="p-6 border-b border-white/5 flex items-center justify-between sticky top-0 bg-white/5 z-10">
              <div className="flex items-center gap-3">
                <div className={cn("w-10 h-10 rounded-full flex items-center justify-center", 
                  modalType === 'visita' ? 'bg-cyan-500/20 text-cyan-500' :
                  modalType === 'ligacao' ? 'bg-blue-500/20 text-blue-400' :
                  modalType === 'reuniao' ? 'bg-purple-500/20 text-purple-400' :
                  modalType === 'lembrete' ? 'bg-amber-500/20 text-amber-400' :
                  'bg-emerald-500/20 text-emerald-400'
                )}>
                  {getEventIcon(modalType)}
                </div>
                <div>
                  <h3 className="text-lg font-bold text-white capitalize">
                    {modalType === 'mensagem' ? 'Agendar Mensagem' :
                     modalType === 'ligacao' ? 'Registrar Ligação' :
                     modalType === 'reuniao' ? 'Agendar Reunião' :
                     modalType === 'lembrete' ? 'Criar Lembrete' : 'Agendar Visita'}
                  </h3>
                  <p className="text-xs text-slate-400">Configure os detalhes do evento</p>
                </div>
              </div>
              <button onClick={() => setModalType(null)} className="p-2 text-slate-400 hover:text-slate-300 rounded-full hover:bg-white/5">
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="p-6 space-y-6">
              {modalType !== 'lembrete' && (
                <div className="space-y-1.5">
                  <label className="text-xs font-bold text-slate-300">Lead *</label>
                  <AsyncCombobox
                    placeholder="Buscar lead pelo nome, email ou telefone..."
                    table="profiles"
                    searchFields={["full_name","phone"]}
                    selectFields="id,full_name,phone"
                    labelField="full_name"
                    subtitleField="phone"
                    value={eventForm.leadId}
                    onChange={(item: LookupItem | null) => setEventForm({ ...eventForm, leadId: item?.id || '', leadName: item?.label || '' })}
                  />
                </div>
              )}

              {/* Lembrete: campo de título */}
              {modalType === 'lembrete' && (
                <div className="space-y-1.5">
                  <label className="text-xs font-bold text-slate-300">Título do Lembrete *</label>
                  <input 
                    type="text" 
                    placeholder="Ex: Revisar proposta do cliente, Ligar para Maria..." 
                    value={eventForm.leadName}
                    onChange={(e) => setEventForm({ ...eventForm, leadName: e.target.value })}
                    className="w-full bg-white/5 border border-cyan-900/30 rounded-lg px-4 py-2 text-sm outline-none focus:ring-1 focus:ring-amber-500"
                  />
                </div>
              )}

              {modalType === 'visita' && (
                <div className="space-y-1.5">
                  <label className="text-xs font-bold text-slate-300">Imóvel *</label>
                  <AsyncCombobox
                    placeholder="Buscar imóvel..."
                    table="properties"
                    searchFields={["title"]}
                    selectFields="id,title"
                    labelField="title"
                    value={eventForm.propertyId}
                    onChange={(item: LookupItem | null) => setEventForm({ ...eventForm, propertyId: item?.id || '', propertyName: item?.label || '' })}
                  />
                </div>
              )}

              {modalType === 'reuniao' && (
                <div className="space-y-1.5">
                  <label className="text-xs font-bold text-slate-300">Tipo de Reunião *</label>
                  <select value={eventForm.meetingType} onChange={(e) => setEventForm({ ...eventForm, meetingType: e.target.value })} className="w-full bg-white/5 border border-cyan-900/30 rounded-lg px-4 py-2 text-sm outline-none focus:ring-1 focus:ring-purple-500">
                    <option>Online (Google Meet/Zoom)</option>
                    <option>Presencial (Escritório)</option>
                    <option>Presencial (Cliente)</option>
                  </select>
                </div>
              )}

              {(modalType === 'mensagem' || modalType === 'lembrete') && (
                <div className="space-y-1.5">
                  <label className="text-xs font-bold text-slate-300">
                    {modalType === 'mensagem' ? 'Mensagem (Template ou Texto Livre) *' : 'Descrição (opcional)'}
                  </label>
                  <textarea rows={3} placeholder={modalType === 'lembrete' ? "Detalhes do lembrete..." : "Escreva a mensagem a ser enviada..."} value={eventForm.message} onChange={(e) => setEventForm({ ...eventForm, message: e.target.value })} className="w-full bg-white/5 border border-cyan-900/30 rounded-lg px-4 py-2 text-sm outline-none focus:ring-1 focus:ring-amber-500" />
                </div>
              )}

              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-1.5">
                  <label className="text-xs font-bold text-slate-300">Data *</label>
                  <input type="date" value={eventForm.date} onChange={(e) => setEventForm({ ...eventForm, date: e.target.value })} className="w-full bg-white/5 border border-cyan-900/30 rounded-lg px-4 py-2 text-sm outline-none focus:ring-1 focus:ring-slate-400" />
                </div>
                <div className="space-y-1.5">
                  <label className="text-xs font-bold text-slate-300">Horário *</label>
                  <input type="time" value={eventForm.time} onChange={(e) => setEventForm({ ...eventForm, time: e.target.value })} className="w-full bg-white/5 border border-cyan-900/30 rounded-lg px-4 py-2 text-sm outline-none focus:ring-1 focus:ring-slate-400" />
                </div>
              </div>

              {/* Seletor de tempo do lembrete */}
              <div className="space-y-1.5">
                <label className="text-xs font-bold text-slate-300">Lembrete</label>
                <select 
                  value={eventForm.reminderMinutes} 
                  onChange={(e) => setEventForm({ ...eventForm, reminderMinutes: Number(e.target.value) })}
                  className="w-full bg-white/5 border border-cyan-900/30 rounded-lg px-4 py-2 text-sm outline-none focus:ring-1 focus:ring-slate-400"
                >
                  {REMINDER_TRIGGERS.filter(t => t.offsetMinutes <= 0).map(t => (
                    <option key={t.offsetMinutes} value={Math.abs(t.offsetMinutes)}>
                      {t.label}
                    </option>
                  ))}
                </select>
                <p className="text-[10px] text-slate-400">🔔 Notificação com som será disparada automaticamente.</p>
              </div>
            </div>

            <div className="p-6 border-t border-white/5 flex items-center justify-end gap-3 sticky bottom-0 bg-white/5">
              <button onClick={() => setModalType(null)} className="px-6 py-2 rounded-lg text-sm font-bold text-slate-300 hover:bg-white/5 transition-colors">
                Cancelar
              </button>
              <button onClick={handleSaveEvent} disabled={eventForm.saving} className={cn(
                "px-6 py-2 rounded-lg text-sm font-bold text-white transition-colors shadow-lg flex items-center gap-2 disabled:opacity-60",
                modalType === 'visita' ? 'bg-cyan-500 hover:bg-cyan-600 shadow-cyan-500/20' :
                modalType === 'ligacao' ? 'bg-blue-500 hover:bg-cyan-600 shadow-blue-500/20' :
                modalType === 'reuniao' ? 'bg-purple-500 hover:bg-purple-600 shadow-purple-500/20' :
                modalType === 'lembrete' ? 'bg-amber-500 hover:bg-amber-600 shadow-amber-500/20' :
                'bg-emerald-500 hover:bg-emerald-600 shadow-emerald-500/20'
              )}>
                {eventForm.saving ? 'Salvando...' : 'Salvar Evento'}
                <Clock className="w-4 h-4" />
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}