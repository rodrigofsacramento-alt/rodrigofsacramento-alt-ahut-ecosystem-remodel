import { useState } from 'react';
import { 
  Search, 
  Plus, 
  MoreVertical, 
  Phone, 
  Video, 
  Info,
  Send,
  Smile,
  Paperclip,
  Check,
  CheckCheck,
  Calendar,
  FileText,
  Clock,
  Mail,
  MoreHorizontal,
  Home,
  DollarSign
} from 'lucide-react';
import { cn } from '../lib/utils';

const conversations = [
  { id: 1, name: 'Ricardo Ferreira', message: 'Gostaria de agendar uma visita para o...', time: '10:42', badge: 1, sla: '5 min', type: 'Venda', status: 'online' },
  { id: 2, name: 'Ana Oliveira', message: 'Ok, vou aguardar a proposta então.', time: '09:15', sla: '2h', type: 'Aluguel' },
  { id: 3, name: 'Marcos Silva', message: 'Pode me enviar as fotos do imóvel?', time: 'Ontem', sla: 'Follow-up', type: 'Facebook' },
  { id: 4, name: 'Julia Costa', message: 'Confirmo a visita para quinta-feira.', time: 'Ontem', sla: '4h', type: 'Venda' },
];

const messages = [
  { id: 1, sender: 'system', content: 'Ticket criado automaticamente via Lead Capture (Landing Page Horizon).', time: '10:38', type: 'info' },
  { id: 2, sender: 'client', content: 'Olá! Vi o anúncio do Edifício Horizon e gostaria de saber se a cobertura ainda está disponível.', time: '10:38' },
  { id: 3, sender: 'bot', content: 'Olá Ricardo! 👋 Obrigado pelo interesse. Um de nossos consultores especializados irá te atender em instantes.', time: '10:38', type: 'bot' },
  { id: 4, sender: 'agent', content: 'Bom dia, Ricardo! Tudo bem? Sou o João. A cobertura do Horizon está disponível sim e temos uma condição especial para este mês. Você tem disponibilidade para uma visita amanhã?', time: '10:40', status: 'read' },
  { id: 5, sender: 'client', content: 'Amanhã não consigo, pode ser na sexta-feira às 14h?', time: '10:42' },
];

export default function Attendance() {
  const [activeChat, setActiveChat] = useState(1);

  return (
    <div className="flex h-[calc(100vh-80px)] overflow-hidden card-dark">
      {/* Sidebar Conversas */}
      <div className="w-80 border-r border-slate-200 flex flex-col shrink-0">
        <div className="p-4 space-y-4">
          <div className="flex items-center justify-between">
            <h2 className="text-lg font-bold text-slate-900">Conversas</h2>
            <span className="text-xs font-bold text-slate-400">8 ativos</span>
          </div>
          <div className="flex p-1 bg-slate-100 rounded-lg">
            <button className="flex-1 py-1.5 text-xs font-bold card-dark text-orange-500 rounded-md shadow-sm">Meus (8)</button>
            <button className="flex-1 py-1.5 text-xs font-bold text-slate-500 hover:text-slate-700">Equipe</button>
          </div>
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
            <input type="text" placeholder="Buscar conversas..." className="w-full bg-slate-50 border border-slate-200 rounded-lg py-2 pl-10 pr-4 text-sm outline-none focus:ring-1 focus:ring-orange-500" />
          </div>
        </div>

        <div className="flex-1 overflow-y-auto">
          {conversations.map((chat) => (
            <button
              key={chat.id}
              onClick={() => setActiveChat(chat.id)}
              className={cn(
                "w-full p-4 flex gap-3 border-l-4 transition-all hover:bg-slate-50",
                activeChat === chat.id ? "border-orange-50 bg-orange-50/30 border-l-orange-500" : "border-l-transparent"
              )}
            >
              <div className="relative shrink-0">
                <div className="w-12 h-12 rounded-full bg-slate-200 flex items-center justify-center font-bold text-slate-500">
                  {chat.name.split(' ').map(n => n[0]).join('')}
                </div>
                {chat.status === 'online' && (
                  <div className="absolute bottom-0 right-0 w-3 h-3 bg-green-500 rounded-full border-2 border-white" />
                )}
              </div>
              <div className="flex-1 min-w-0 text-left">
                <div className="flex items-center justify-between mb-1">
                  <span className="text-sm font-bold text-slate-900 truncate">{chat.name}</span>
                  <span className="text-[10px] text-slate-400">{chat.time}</span>
                </div>
                <p className="text-xs text-slate-500 truncate mb-2">{chat.message}</p>
                <div className="flex items-center gap-2">
                  <span className={cn(
                    "text-[9px] font-bold px-1.5 py-0.5 rounded uppercase",
                    chat.sla === '5 min' ? "bg-red-100 text-red-600" : "bg-yellow-100 text-yellow-600"
                  )}>
                    SLA: {chat.sla}
                  </span>
                  <span className="text-[9px] font-bold px-1.5 py-0.5 rounded bg-slate-100 text-slate-500 uppercase">
                    {chat.type}
                  </span>
                </div>
              </div>
              {chat.badge && (
                <div className="w-5 h-5 bg-orange-500 text-white text-[10px] font-bold rounded-full flex items-center justify-center shrink-0">
                  {chat.badge}
                </div>
              )}
            </button>
          ))}
        </div>
      </div>

      {/* Chat Area */}
      <div className="flex-1 flex flex-col bg-slate-50">
        {/* Chat Header */}
        <div className="p-4 card-dark border-b border-slate-200 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-full bg-slate-200 flex items-center justify-center font-bold text-slate-500">RF</div>
            <div>
              <div className="flex items-center gap-2">
                <h3 className="text-sm font-bold text-slate-900">Ricardo Ferreira</h3>
                <span className="text-[10px] text-green-500 font-bold flex items-center gap-1">
                  <div className="w-1.5 h-1.5 bg-green-500 rounded-full" />
                  Online
                </span>
              </div>
              <p className="text-xs text-slate-500">Interessado no Edifício Horizon • Ticket #4829</p>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <button className="p-2 text-slate-400 hover:text-slate-600 rounded-lg hover:bg-slate-100"><Phone className="w-5 h-5" /></button>
            <button className="p-2 text-slate-400 hover:text-slate-600 rounded-lg hover:bg-slate-100"><Video className="w-5 h-5" /></button>
            <button className="p-2 text-slate-400 hover:text-slate-600 rounded-lg hover:bg-slate-100"><MoreVertical className="w-5 h-5" /></button>
          </div>
        </div>

        {/* Messages */}
        <div className="flex-1 overflow-y-auto p-6 space-y-6">
          <div className="flex justify-center">
            <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider card-dark px-3 py-1 rounded-full border border-slate-100 shadow-sm">Hoje, 24 de Outubro</span>
          </div>

          {messages.map((msg) => (
            <div key={msg.id} className={cn(
              "flex flex-col",
              msg.sender === 'agent' ? "items-end" : msg.sender === 'system' ? "items-center" : "items-start"
            )}>
              {msg.sender === 'system' ? (
                <div className="bg-yellow-50 border border-yellow-100 text-yellow-700 p-3 rounded-xl text-xs max-w-md flex gap-2">
                  <Info className="w-4 h-4 shrink-0" />
                  {msg.content}
                </div>
              ) : (
                <div className="max-w-[70%] space-y-1">
                  <div className={cn(
                    "p-4 rounded-2xl text-sm relative",
                    msg.sender === 'agent' ? "bg-orange-500 text-white rounded-tr-none" : 
                    msg.sender === 'bot' ? "bg-slate-100 text-slate-700 rounded-tl-none border border-slate-200" :
                    "card-dark text-slate-700 rounded-tl-none border border-slate-200"
                  )}>
                    {msg.content}
                    {msg.sender === 'bot' && <span className="absolute -right-10 top-0 text-[10px] font-bold text-slate-400 uppercase">Bot</span>}
                    {msg.sender === 'agent' && <span className="absolute -left-10 top-0 text-[10px] font-bold text-slate-400 uppercase">JM</span>}
                  </div>
                  <div className={cn("flex items-center gap-1 px-1", msg.sender === 'agent' ? "justify-end" : "justify-start")}>
                    <span className="text-[10px] text-slate-400">{msg.time}</span>
                    {msg.sender === 'agent' && (
                      msg.status === 'read' ? <CheckCheck className="w-3 h-3 text-blue-500" /> : <Check className="w-3 h-3 text-slate-400" />
                    )}
                  </div>
                </div>
              )}
            </div>
          ))}
        </div>

        {/* Chat Input */}
        <div className="p-4 card-dark border-t border-slate-200">
          <div className="flex items-center gap-2 mb-4 overflow-x-auto pb-2 scrollbar-hide">
            <button className="px-3 py-1.5 bg-slate-50 border border-slate-200 rounded-lg text-xs font-bold text-slate-600 hover:bg-slate-100 whitespace-nowrap">Agendar Visita</button>
            <button className="px-3 py-1.5 bg-slate-50 border border-slate-200 rounded-lg text-xs font-bold text-slate-600 hover:bg-slate-100 whitespace-nowrap">Enviar Ficha Técnica</button>
            <button className="px-3 py-1.5 bg-slate-50 border border-slate-200 rounded-lg text-xs font-bold text-slate-600 hover:bg-slate-100 whitespace-nowrap">Solicitar Documentos</button>
          </div>
          <div className="flex items-end gap-3">
            <div className="flex-1 bg-slate-50 border border-slate-200 rounded-2xl p-2 focus-within:ring-1 focus-within:ring-orange-500 transition-all">
              <textarea 
                placeholder="Digite sua mensagem..." 
                rows={1}
                className="w-full bg-transparent border-none outline-none px-3 py-2 text-sm resize-none"
              />
              <div className="flex items-center justify-between px-2 pt-1">
                <div className="flex items-center gap-1">
                  <button className="p-1.5 text-slate-400 hover:text-slate-600 rounded-lg hover:bg-slate-200"><Smile className="w-5 h-5" /></button>
                  <button className="p-1.5 text-slate-400 hover:text-slate-600 rounded-lg hover:bg-slate-200"><Paperclip className="w-5 h-5" /></button>
                </div>
                <div className="flex items-center gap-2">
                  <label className="flex items-center gap-2 cursor-pointer group">
                    <input type="checkbox" className="hidden" />
                    <div className="w-4 h-4 rounded border border-slate-300 group-hover:border-orange-500 transition-colors" />
                    <span className="text-[10px] font-bold text-slate-400 group-hover:text-slate-600">Nota Interna</span>
                  </label>
                  <span className="text-[10px] text-slate-400">Pressione Enter para enviar</span>
                </div>
              </div>
            </div>
            <button className="w-12 h-12 bg-orange-500 hover:bg-orange-600 text-white rounded-2xl flex items-center justify-center transition-all shadow-lg shadow-orange-500/20">
              <Send className="w-5 h-5" />
            </button>
          </div>
        </div>
      </div>

      {/* Right Sidebar Info */}
      <div className="w-80 border-l border-slate-200 card-dark overflow-y-auto shrink-0 hidden xl:block">
        <div className="p-6 text-center">
          <div className="w-24 h-24 rounded-full bg-slate-200 flex items-center justify-center font-bold text-2xl text-slate-500 mx-auto mb-4">RF</div>
          <h3 className="text-lg font-bold text-slate-900">Ricardo Ferreira</h3>
          <p className="text-sm text-slate-500">Investidor • Quente</p>
          <div className="flex justify-center gap-3 mt-4">
            <button className="p-2 rounded-full border border-slate-200 text-slate-400 hover:bg-slate-50"><Phone className="w-4 h-4" /></button>
            <button className="p-2 rounded-full border border-slate-200 text-slate-400 hover:bg-slate-50"><Mail className="w-4 h-4" /></button>
            <button className="p-2 rounded-full border border-slate-200 text-slate-400 hover:bg-slate-50"><MoreHorizontal className="w-4 h-4" /></button>
          </div>
        </div>

        <div className="px-6 py-4 border-t border-slate-100">
          <div className="flex items-center justify-between mb-2">
            <span className="text-[10px] font-bold text-slate-400 uppercase">Status do Lead</span>
            <span className="text-[10px] font-bold text-orange-500">Score: 85</span>
          </div>
          <div className="h-1.5 bg-slate-100 rounded-full overflow-hidden mb-2">
            <div className="h-full bg-orange-500 rounded-full" style={{ width: '85%' }} />
          </div>
          <p className="text-xs text-slate-600">Etapa: <span className="font-bold">Negociação</span></p>
        </div>

        <div className="px-6 py-4 border-t border-slate-100 space-y-4">
          <h4 className="text-xs font-bold text-slate-900 uppercase tracking-wider">Informações</h4>
          <div className="space-y-3">
            <div className="flex gap-3">
              <div className="w-4 h-4 text-slate-400 shrink-0 mt-0.5"><Search className="w-full h-full" /></div>
              <div>
                <p className="text-[10px] text-slate-400 font-bold uppercase">Localização</p>
                <p className="text-xs text-slate-700">São Paulo, SP - Moema</p>
              </div>
            </div>
            <div className="flex gap-3">
              <div className="w-4 h-4 text-slate-400 shrink-0 mt-0.5"><DollarSign className="w-full h-full" /></div>
              <div>
                <p className="text-[10px] text-slate-400 font-bold uppercase">Orçamento</p>
                <p className="text-xs text-slate-700">R$ 1.5M - R$ 2.0M</p>
              </div>
            </div>
            <div className="flex gap-3">
              <div className="w-4 h-4 text-slate-400 shrink-0 mt-0.5"><Home className="w-full h-full" /></div>
              <div>
                <p className="text-[10px] text-slate-400 font-bold uppercase">Interesse</p>
                <p className="text-xs text-slate-700">Cobertura, 3 Quartos</p>
              </div>
            </div>
          </div>
        </div>

        <div className="px-6 py-4 border-t border-slate-100">
          <h4 className="text-xs font-bold text-slate-900 uppercase tracking-wider mb-3">Tags</h4>
          <div className="flex flex-wrap gap-2">
            <span className="px-2 py-1 bg-purple-50 text-purple-600 text-[10px] font-bold rounded">Investidor</span>
            <span className="px-2 py-1 bg-blue-50 text-blue-600 text-[10px] font-bold rounded">Alto Padrão</span>
            <button className="px-2 py-1 border border-dashed border-slate-300 text-slate-400 text-[10px] font-bold rounded hover:border-slate-400">+ Adicionar</button>
          </div>
        </div>

        <div className="p-6 border-t border-slate-100 space-y-3">
          <button className="w-full py-2.5 card-dark border border-slate-200 rounded-xl text-xs font-bold text-slate-700 hover:bg-slate-50 flex items-center justify-center gap-2 transition-all">
            <Calendar className="w-4 h-4" />
            Agendar Visita
          </button>
          <button className="w-full py-2.5 card-dark border border-slate-200 rounded-xl text-xs font-bold text-slate-700 hover:bg-slate-50 flex items-center justify-center gap-2 transition-all">
            <FileText className="w-4 h-4" />
            Criar Proposta
          </button>
        </div>
      </div>
    </div>
  );
}
