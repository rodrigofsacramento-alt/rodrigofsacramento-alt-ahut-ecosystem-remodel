import { useState } from 'react';
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
  Calendar as CalendarIcon,
  MessageSquare,
  Phone,
  Video,
  Users
} from 'lucide-react';
import { cn } from '../lib/utils';
import { useAuth } from '../hooks/useAuth';

const days = ['DOM', 'SEG', 'TER', 'QUA', 'QUI', 'SEX', 'SÁB'];
const months = ['Janeiro', 'Fevereiro', 'Março', 'Abril', 'Maio', 'Junho', 'Julho', 'Agosto', 'Setembro', 'Outubro', 'Novembro', 'Dezembro'];

type EventType = 'visita' | 'ligacao' | 'mensagem' | 'reuniao';

interface Event {
  id: number;
  day: number;
  time: string;
  client: string;
  property?: string;
  status: 'scheduled' | 'completed' | 'confirmed';
  type: EventType;
  user_id: string; // To mock RBAC
}

const mockEvents: Event[] = [
  { id: 1, day: 2, time: '10:00', client: 'Ricardo Oliveira', property: 'Apto. Duplex', status: 'confirmed', type: 'visita', user_id: 'mock-user-id' },
  { id: 2, day: 4, time: '14:30', client: 'Ana Clara Souza', property: 'Casa no Lago', status: 'completed', type: 'visita', user_id: 'mock-user-id' },
  { id: 3, day: 4, time: '16:00', client: 'Marcos Silva', status: 'scheduled', type: 'ligacao', user_id: 'mock-user-id' },
  { id: 4, day: 8, time: '09:00', client: 'Ana Clara Souza', property: 'Casa no Lago', status: 'completed', type: 'visita', user_id: 'mock-user-id' },
  { id: 5, day: 8, time: '14:00', client: 'Ricardo Oliveira', property: 'Zoom Meeting', status: 'scheduled', type: 'reuniao', user_id: 'mock-user-id' },
  { id: 6, day: 9, time: '11:00', client: 'Vila Nova', status: 'confirmed', type: 'mensagem', user_id: 'mock-user-id' },
  { id: 7, day: 9, time: '12:00', client: 'Outro Corretor', status: 'confirmed', type: 'mensagem', user_id: 'other-user' }, // Should be hidden
];

export default function Agenda() {
  const { user } = useAuth();
  const [modalType, setModalType] = useState<EventType | null>(null);
  const [currentDate, setCurrentDate] = useState(new Date(2023, 9, 1)); // Outubro 2023
  const [showDropdown, setShowDropdown] = useState(false);

  // MOCK RBAC: Filtering events by current user id. 
  // Since we are mocking, we assume 'mock-user-id' represents the logged in user if user is null.
  const currentUserId = user?.id || 'mock-user-id';
  const myEvents = mockEvents.filter(e => e.user_id === currentUserId);

  const getEventIcon = (type: EventType) => {
    switch (type) {
      case 'visita': return <MapPin className="w-3 h-3" />;
      case 'ligacao': return <Phone className="w-3 h-3" />;
      case 'mensagem': return <MessageSquare className="w-3 h-3" />;
      case 'reuniao': return <Video className="w-3 h-3" />;
    }
  };

  const getEventColor = (type: EventType) => {
    switch (type) {
      case 'visita': return "bg-orange-50 text-orange-600 border-orange-100";
      case 'ligacao': return "bg-blue-50 text-blue-600 border-blue-100";
      case 'mensagem': return "bg-emerald-50 text-emerald-600 border-emerald-100";
      case 'reuniao': return "bg-purple-50 text-purple-600 border-purple-100";
    }
  };

  return (
    <div className="p-6 space-y-6 bg-slate-50 min-h-full">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          <div className="flex items-center gap-2 bg-white border border-slate-200 rounded-xl p-1">
            <button className="p-2 hover:bg-slate-50 rounded-lg text-slate-400"><ChevronLeft className="w-4 h-4" /></button>
            <span className="text-sm font-bold px-4">Outubro 2023</span>
            <button className="p-2 hover:bg-slate-50 rounded-lg text-slate-400"><ChevronRight className="w-4 h-4" /></button>
          </div>
          <button className="px-4 py-2 bg-white border border-slate-200 rounded-xl text-sm font-bold text-slate-600 hover:bg-slate-50">Hoje</button>
          
          <div className="flex p-1 bg-slate-200/50 rounded-xl ml-4">
            <button className="px-4 py-1.5 text-xs font-bold bg-white text-slate-900 rounded-lg shadow-sm">Mês</button>
            <button className="px-4 py-1.5 text-xs font-bold text-slate-500 hover:text-slate-700">Semana</button>
            <button className="px-4 py-1.5 text-xs font-bold text-slate-500 hover:text-slate-700">Dia</button>
          </div>
        </div>

        <div className="relative">
          <button 
            onClick={() => setShowDropdown(!showDropdown)}
            className="bg-orange-500 hover:bg-orange-600 text-white px-4 py-2 rounded-lg text-sm font-bold flex items-center gap-2 transition-colors"
          >
            <Plus className="w-4 h-4" />
            Novo Evento
          </button>
          
          {showDropdown && (
            <div className="absolute right-0 mt-2 w-48 bg-white border border-slate-200 rounded-xl shadow-lg z-20 py-2">
              <button onClick={() => { setModalType('mensagem'); setShowDropdown(false); }} className="w-full px-4 py-2 text-left text-sm text-slate-700 hover:bg-slate-50 flex items-center gap-2">
                <MessageSquare className="w-4 h-4 text-emerald-500" /> Agendar Mensagem
              </button>
              <button onClick={() => { setModalType('ligacao'); setShowDropdown(false); }} className="w-full px-4 py-2 text-left text-sm text-slate-700 hover:bg-slate-50 flex items-center gap-2">
                <Phone className="w-4 h-4 text-blue-500" /> Registrar Ligação
              </button>
              <button onClick={() => { setModalType('visita'); setShowDropdown(false); }} className="w-full px-4 py-2 text-left text-sm text-slate-700 hover:bg-slate-50 flex items-center gap-2">
                <MapPin className="w-4 h-4 text-orange-500" /> Agendar Visita
              </button>
              <button onClick={() => { setModalType('reuniao'); setShowDropdown(false); }} className="w-full px-4 py-2 text-left text-sm text-slate-700 hover:bg-slate-50 flex items-center gap-2">
                <Video className="w-4 h-4 text-purple-500" /> Agendar Reunião
              </button>
            </div>
          )}
        </div>
      </div>

      <div className="grid lg:grid-cols-3 gap-6">
        {/* Calendar Grid */}
        <div className="lg:col-span-2 bg-white rounded-2xl border border-slate-200 overflow-hidden">
          <div className="grid grid-cols-7 border-b border-slate-100">
            {days.map(day => (
              <div key={day} className="p-4 text-center text-[10px] font-bold text-slate-400 uppercase tracking-wider">{day}</div>
            ))}
          </div>
          <div className="grid grid-cols-7">
            {Array.from({ length: 35 }).map((_, i) => {
              const dayNum = i - 0; 
              const dayVisits = myEvents.filter(v => v.day === dayNum);
              
              return (
                <div key={i} className={cn(
                  "min-h-[120px] p-2 border-r border-b border-slate-50 last:border-r-0 relative",
                  dayNum <= 0 || dayNum > 31 ? "bg-slate-50/50" : "bg-white"
                )}>
                  {dayNum > 0 && dayNum <= 31 && (
                    <>
                      <span className={cn(
                        "text-xs font-bold w-6 h-6 flex items-center justify-center rounded-full mb-1",
                        dayNum === 8 ? "bg-orange-500 text-white" : "text-slate-400"
                      )}>
                        {dayNum}
                      </span>
                      <div className="space-y-1">
                        {dayVisits.map(visit => (
                          <div key={visit.id} className={cn(
                            "p-1.5 rounded-md text-[9px] font-bold truncate border flex items-center gap-1",
                            getEventColor(visit.type)
                          )}>
                            {getEventIcon(visit.type)}
                            {visit.time} - {visit.client.split(' ')[0]}
                          </div>
                        ))}
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
          <div className="bg-white p-6 rounded-2xl border border-slate-200">
            <div className="flex items-center justify-between mb-6">
              <h3 className="text-lg font-bold text-slate-900">Visitas do Dia</h3>
              <span className="text-xs text-slate-400">8 Out, Terça</span>
            </div>

            <div className="bg-orange-500 rounded-2xl p-6 text-white mb-6 relative overflow-hidden">
              <div className="relative z-10">
                <div className="flex items-center justify-between mb-4">
                  <span className="text-[10px] font-bold px-2 py-1 bg-white/20 rounded-full uppercase">Próxima Visita</span>
                  <span className="text-[10px] font-bold opacity-80">Em 45 min</span>
                </div>
                <h4 className="text-xl font-bold mb-1">Ricardo Oliveira</h4>
                <p className="text-sm opacity-80 mb-4">Apto. Duplex, Jardins</p>
                <div className="flex items-center gap-2 text-sm font-bold mb-6">
                  <Clock className="w-4 h-4" />
                  14:00 - 15:30
                </div>
                <div className="grid grid-cols-2 gap-3">
                  <button className="py-2 bg-white text-orange-500 rounded-lg text-xs font-bold hover:bg-slate-50 transition-colors">Iniciar Rota</button>
                  <button className="py-2 bg-white/20 text-white rounded-lg text-xs font-bold hover:bg-white/30 transition-colors">Check-in</button>
                </div>
              </div>
              <div className="absolute top-0 right-0 w-32 h-32 bg-white/10 rounded-full -translate-y-1/2 translate-x-1/2 blur-2xl" />
            </div>

            <div className="rounded-2xl border border-slate-100 overflow-hidden mb-6">
              <img src="https://picsum.photos/seed/map/400/200" alt="Map" className="w-full h-32 object-cover" referrerPolicy="no-referrer" />
              <div className="p-3 bg-slate-50 flex items-center gap-2">
                <MapPin className="w-4 h-4 text-orange-500" />
                <span className="text-[10px] font-bold text-slate-600">R. Augusta, 1402 - SP</span>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Modal Multi-uso */}
      {modalType && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm">
          <div className="bg-white rounded-2xl w-full max-w-lg max-h-[90vh] overflow-y-auto shadow-2xl animate-in fade-in zoom-in duration-200">
            <div className="p-6 border-b border-slate-100 flex items-center justify-between sticky top-0 bg-white z-10">
              <div className="flex items-center gap-3">
                <div className={cn("w-10 h-10 rounded-full flex items-center justify-center", 
                  modalType === 'visita' ? 'bg-orange-100 text-orange-500' :
                  modalType === 'ligacao' ? 'bg-blue-100 text-blue-500' :
                  modalType === 'reuniao' ? 'bg-purple-100 text-purple-500' :
                  'bg-emerald-100 text-emerald-500'
                )}>
                  {getEventIcon(modalType)}
                </div>
                <div>
                  <h3 className="text-lg font-bold text-slate-900 capitalize">
                    {modalType === 'mensagem' ? 'Agendar Mensagem' :
                     modalType === 'ligacao' ? 'Registrar Ligação' :
                     modalType === 'reuniao' ? 'Agendar Reunião' : 'Agendar Visita'}
                  </h3>
                  <p className="text-xs text-slate-500">Configure os detalhes do evento</p>
                </div>
              </div>
              <button onClick={() => setModalType(null)} className="p-2 text-slate-400 hover:text-slate-600 rounded-full hover:bg-slate-100">
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="p-6 space-y-6">
              <div className="space-y-1.5">
                <label className="text-xs font-bold text-slate-700">Lead *</label>
                <div className="relative">
                  <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                  <input type="text" placeholder="Buscar lead pelo nome, email ou telefone..." className="w-full bg-slate-50 border border-slate-200 rounded-lg px-10 py-2 text-sm outline-none focus:ring-1 focus:ring-slate-400" />
                </div>
              </div>

              {modalType === 'visita' && (
                <div className="space-y-1.5">
                  <label className="text-xs font-bold text-slate-700">Imóvel *</label>
                  <div className="relative">
                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                    <input type="text" placeholder="Buscar imóvel..." className="w-full bg-slate-50 border border-slate-200 rounded-lg px-10 py-2 text-sm outline-none focus:ring-1 focus:ring-orange-500" />
                  </div>
                </div>
              )}

              {modalType === 'reuniao' && (
                <div className="space-y-1.5">
                  <label className="text-xs font-bold text-slate-700">Tipo de Reunião *</label>
                  <select className="w-full bg-slate-50 border border-slate-200 rounded-lg px-4 py-2 text-sm outline-none focus:ring-1 focus:ring-purple-500">
                    <option>Online (Google Meet/Zoom)</option>
                    <option>Presencial (Escritório)</option>
                    <option>Presencial (Cliente)</option>
                  </select>
                </div>
              )}

              {modalType === 'mensagem' && (
                <div className="space-y-1.5">
                  <label className="text-xs font-bold text-slate-700">Mensagem (Template ou Texto Livre) *</label>
                  <textarea rows={3} placeholder="Escreva a mensagem a ser enviada..." className="w-full bg-slate-50 border border-slate-200 rounded-lg px-4 py-2 text-sm outline-none focus:ring-1 focus:ring-emerald-500" />
                </div>
              )}

              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-1.5">
                  <label className="text-xs font-bold text-slate-700">Data *</label>
                  <input type="date" className="w-full bg-slate-50 border border-slate-200 rounded-lg px-4 py-2 text-sm outline-none focus:ring-1 focus:ring-slate-400" />
                </div>
                <div className="space-y-1.5">
                  <label className="text-xs font-bold text-slate-700">Horário *</label>
                  <select className="w-full bg-slate-50 border border-slate-200 rounded-lg px-4 py-2 text-sm outline-none focus:ring-1 focus:ring-slate-400">
                    <option>09:00</option><option>10:00</option><option>14:00</option>
                  </select>
                </div>
              </div>
            </div>

            <div className="p-6 border-t border-slate-100 flex items-center justify-end gap-3 sticky bottom-0 bg-white">
              <button onClick={() => setModalType(null)} className="px-6 py-2 rounded-lg text-sm font-bold text-slate-600 hover:bg-slate-100 transition-colors">
                Cancelar
              </button>
              <button onClick={() => setModalType(null)} className={cn(
                "px-6 py-2 rounded-lg text-sm font-bold text-white transition-colors shadow-lg",
                modalType === 'visita' ? 'bg-orange-500 hover:bg-orange-600 shadow-orange-500/20' :
                modalType === 'ligacao' ? 'bg-blue-500 hover:bg-blue-600 shadow-blue-500/20' :
                modalType === 'reuniao' ? 'bg-purple-500 hover:bg-purple-600 shadow-purple-500/20' :
                'bg-emerald-500 hover:bg-emerald-600 shadow-emerald-500/20'
              )}>
                Salvar Evento
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
