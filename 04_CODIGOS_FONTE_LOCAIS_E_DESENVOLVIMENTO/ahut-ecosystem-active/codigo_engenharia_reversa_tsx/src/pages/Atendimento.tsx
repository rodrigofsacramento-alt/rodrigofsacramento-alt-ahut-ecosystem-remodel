import React, { useState, useEffect, useRef, useMemo } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { 
  Search, 
  Plus, 
  MoreVertical, 
  Phone, 
  Video, 
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
  DollarSign,
  QrCode,
  RefreshCw,
  PowerOff,
  Bot,
  AlertTriangle,
  User,
  Users,
  Mic,
  MicOff,
  Camera,
  MapPin,
  Share2,
  Trash2,
  UserPlus,
  Info,
  CheckCircle2,
  MessageSquare,
  X,
  Filter
} from 'lucide-react';
import { supabase } from '../lib/supabase';
import { useAuth } from '../hooks/useAuth';
import { useLeads } from '../hooks/useLeads';
import { useVisits, useCreateVisit } from '../hooks/useVisits';
import { useAgents } from '../hooks/useAgents';
import { 
  useWhatsapp, 
  useStartWhatsAppSession, 
  useDisconnectWhatsAppSession, 
  useSetWhatsAppAiEnabled, 
  useSendWhatsAppMessage 
} from '../hooks/useWhatsapp';

interface Client {
  id: string;
  full_name?: string;
  name?: string;
  phone?: string | null;
  email?: string | null;
  avatar_url?: string | null;
  is_group?: boolean;
}

interface Message {
  id: string;
  conversation_id: string;
  sender_id?: string;
  content: string;
  message_type?: 'text' | 'image' | 'video' | 'audio' | 'document' | 'system' | 'bot';
  created_at: string;
  is_read?: boolean;
  status?: 'sent' | 'delivered' | 'read';
  sender?: {
    id: string;
    full_name?: string;
    avatar_url?: string;
    role?: string;
    phone?: string;
  };
}

interface Conversation {
  id: string;
  client_id?: string;
  agent_id?: string | null;
  lead_id?: string | null;
  subject?: string;
  status: 'open' | 'pending' | 'closed' | 'deleted';
  priority?: 'low' | 'normal' | 'high' | 'urgent';
  channel?: string;
  tags?: string[];
  unread_count?: number;
  last_message_at?: string;
  ai_enabled?: boolean;
  client?: Client;
  whatsapp_contact?: Array<{ is_group?: boolean; remote_jid?: string; phone_number?: string }>;
  whatsapp_contacts?: Array<{ is_group?: boolean; remote_jid?: string; phone_number?: string }>;
}

export default function Atendimento() {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const { user, profile } = useAuth();
  const isAgent = profile?.role === 'agent';

  // Tabs: 'meus' | 'equipe' | 'grupos' | 'nao-lidas' | 'arquivadas'
  const [activeTab, setActiveTab] = useState<string>(() => {
    try {
      const saved = localStorage.getItem('atendimento_active_tab');
      return saved || 'meus';
    } catch {
      return 'meus';
    }
  });

  const [searchTerm, setSearchTerm] = useState('');
  const [activeChatId, setActiveChatId] = useState<string | null>(null);
  const [messageInput, setMessageInput] = useState('');
  const [showNewChatModal, setShowNewChatModal] = useState(false);
  const [showAddContactModal, setShowAddContactModal] = useState(false);
  const [newContact, setNewContact] = useState({ name: '', phone: '', email: '' });
  const [showWhatsAppModal, setShowWhatsAppModal] = useState(false);
  const [replyToMessage, setReplyToMessage] = useState<Message | null>(null);
  
  // Real Data & Hooks
  const { data: whatsappSession, isLoading: isWhatsappLoading, refetch: refetchWhatsapp } = useWhatsapp();
  const startWhatsappMutation = useStartWhatsAppSession();
  const disconnectWhatsappMutation = useDisconnectWhatsAppSession();
  const toggleAiMutation = useSetWhatsAppAiEnabled();
  const sendMessageMutation = useSendWhatsAppMessage();
  const { data: leads = [] } = useLeads();
  const { data: agents = [] } = useAgents();
  const createVisitMutation = useCreateVisit();

  // Local conversations state (synced with Supabase)
  const [conversations, setConversations] = useState<Conversation[]>([]);
  const [messages, setMessages] = useState<Message[]>([]);
  const [isLoadingMessages, setIsLoadingMessages] = useState(false);

  const messagesEndRef = useRef<HTMLDivElement>(null);

  const checkIsGroup = (chat: Conversation) => {
    const wContact = chat.whatsapp_contact?.[0] || chat.whatsapp_contacts?.[0];
    return Boolean(
      wContact?.is_group ||
      chat.client?.is_group ||
      chat.client?.phone?.includes('@g.us') ||
      wContact?.remote_jid?.endsWith('@g.us') ||
      (chat.client?.phone && chat.client.phone.length > 15 && !chat.client.phone.startsWith('55'))
    );
  };

  // Fetch conversations
  useEffect(() => {
    async function loadConversations() {
      try {
        let query = supabase
          .from('conversations')
          .select('*, client:profiles!conversations_client_id_fkey(*), whatsapp_contact:whatsapp_contacts(*)')
          .neq('status', 'deleted')
          .order('last_message_at', { ascending: false, nullsFirst: false });

        if (isAgent && user?.id) {
          query = query.or(`agent_id.eq.${user.id},agent_id.is.null`);
        }

        const { data, error } = await query;
        if (error) throw error;
        if (data) {
          setConversations(data as Conversation[]);
          if (!activeChatId && data.length > 0) {
            setActiveChatId(data[0].id);
          }
        }
      } catch (err) {
        console.error('Erro ao carregar conversas:', err);
      }
    }
    loadConversations();

    // Subscribe to realtime conversation updates
    const channel = supabase
      .channel('conversations-realtime-feed')
      .on('postgres_changes', {
        event: '*',
        schema: 'public',
        table: 'conversations'
      }, () => {
        loadConversations();
      })
      .subscribe();

    return () => {
      channel.unsubscribe();
    };
  }, [user?.id, isAgent]);

  // Tab counts
  const tabCounts = useMemo(() => {
    let meus = 0;
    let equipe = 0;
    let grupos = 0;
    let naoLidas = 0;

    conversations.forEach((chat) => {
      if (chat.status === 'deleted' || chat.subject === '[deleted]') return;
      const isGroup = checkIsGroup(chat);
      if (isGroup) {
        grupos++;
      } else {
        equipe++;
        if (chat.agent_id === user?.id || !chat.agent_id) meus++;
        if (chat.status === 'pending' || (chat.unread_count || 0) > 0) naoLidas++;
      }
    });

    return { meus, equipe, grupos, naoLidas };
  }, [conversations, user?.id]);

  // Filtered Conversations
  const filteredConversations = useMemo(() => {
    return conversations.filter((chat) => {
      if (chat.status === 'deleted' || chat.subject === '[deleted]') return false;
      const isGroup = checkIsGroup(chat);
      const name = (chat.client?.full_name || chat.client?.name || '').toLowerCase();
      const phone = (chat.client?.phone || '').toLowerCase();
      const subject = (chat.subject || '').toLowerCase();
      const query = searchTerm.trim().toLowerCase();

      if (query && !name.includes(query) && !phone.includes(query) && !subject.includes(query)) {
        return false;
      }

      switch (activeTab) {
        case 'grupos':
          return isGroup;
        case 'meus':
          return !isGroup && (isAgent ? chat.agent_id === user?.id : true) && chat.status !== 'closed';
        case 'equipe':
          return !isGroup && chat.status !== 'closed';
        case 'nao-lidas':
          return !isGroup && (chat.status === 'pending' || (chat.unread_count || 0) > 0);
        case 'arquivadas':
          return chat.status === 'closed';
        default:
          return true;
      }
    });
  }, [conversations, activeTab, searchTerm, user?.id, isAgent]);

  // Fetch messages for active chat
  useEffect(() => {
    if (!activeChatId) return;

    async function loadMessages() {
      setIsLoadingMessages(true);
      try {
        const { data, error } = await supabase
          .from('messages')
          .select('*, sender:profiles!messages_sender_id_fkey(*)')
          .eq('conversation_id', activeChatId)
          .order('created_at', { ascending: true });

        if (error) throw error;
        setMessages((data as Message[]) || []);
      } catch (err) {
        console.error('Erro ao carregar mensagens:', err);
      } finally {
        setIsLoadingMessages(false);
      }
    }

    loadMessages();

    // Subscribe to new messages
    const channel = supabase
      .channel(`chat-messages-${activeChatId}`)
      .on('postgres_changes', {
        event: 'INSERT',
        schema: 'public',
        table: 'messages',
        filter: `conversation_id=eq.${activeChatId}`
      }, async (payload) => {
        const newMsg = payload.new as Message;
        if (newMsg.sender_id && !newMsg.sender) {
          const { data: senderProfile } = await supabase
            .from('profiles')
            .select('*')
            .eq('id', newMsg.sender_id)
            .maybeSingle();
          if (senderProfile) {
            newMsg.sender = senderProfile;
          }
        }
        setMessages((prev) => {
          if (prev.some((m) => m.id === newMsg.id)) return prev;
          return [...prev, newMsg];
        });
      })
      .subscribe();

    return () => {
      channel.unsubscribe();
    };
  }, [activeChatId]);

  // Scroll to bottom on new messages
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  const activeChat = useMemo(() => {
    return conversations.find((c) => c.id === activeChatId) || null;
  }, [conversations, activeChatId]);

  const isGroupActiveChat = activeChat ? checkIsGroup(activeChat) : false;

  const handleSendMessage = async (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    if (!messageInput.trim() || !activeChatId) return;

    const content = messageInput.trim();
    setMessageInput('');
    setReplyToMessage(null);

    try {
      await sendMessageMutation.mutateAsync({
        conversationId: activeChatId,
        content: content
      });
    } catch (err) {
      console.error('Erro ao enviar mensagem:', err);
    }
  };
  const handleAddContact = async (e: React.FormEvent) => {
    e.preventDefault();
    const phone = newContact.phone.replace(/\D/g, '');
    if (!phone || !newContact.name) {
      alert("Preencha nome e telefone.");
      return;
    }

    try {
      // Pré-validação de duplicados (Travas de Segurança)
      const { data: existingLead } = await supabase
        .from('leads')
        .select('*, responsible:profiles!leads_responsible_id_fkey(full_name)')
        .eq('phone', phone)
        .maybeSingle();

      const { data: existingProfile } = await supabase
        .from('profiles')
        .select('full_name')
        .eq('phone', phone)
        .eq('role', 'client')
        .maybeSingle();

      if (existingLead || existingProfile) {
         const responsible = existingLead?.responsible?.full_name || 'Ninguém (Não Atribuído)';
         alert(`❌ Bloqueado!\n\nEste contato já está cadastrado no sistema.\nResponsável atual: ${responsible}\n\nPor favor, solicite autorização na aba de Notificações para prosseguir.`);
         
         // Aqui seria o local para inserir a Notificação de Request Access no BD, mas requer a tabela Notificações
         return; // Aborta a criação
      }

      // Cria se não existir (usa RPC de produção)
      const { data: clientId, error: rpcErr } = await supabase.rpc('create_client_profile', {
        p_name: newContact.name,
        p_phone: phone,
        p_email: newContact.email || null
      });

      if (rpcErr) throw rpcErr;

      // Inicia a conversa atribuindo ao atendente
      if (clientId && user) {
        const { data: newChat, error: chatErr } = await supabase.from('conversations').insert({
          client_id: clientId,
          agent_id: user.id,
          subject: `Conversa com ${newContact.name}`
        }).select('id').single();

        if (newChat) setActiveChatId(newChat.id);
      }
      
      setShowAddContactModal(false);
      setNewContact({ name: '', phone: '', email: '' });
    } catch (err: any) {
      console.error(err);
      alert('Erro ao adicionar contato: ' + err.message);
    }
  };


  const isWhatsappConnected = whatsappSession?.status === 'connected';

  const [showNotes, setShowNotes] = useState(false);
  const [leadNotes, setLeadNotes] = useState('');

  return (
    <div className="flex h-[calc(100vh-80px)] w-full overflow-hidden bg-white border border-slate-200 rounded-3xl shadow-sm">
      
      {/* 1. SIDEBAR CONVERSAS */}
      <div className="w-80 border-r border-slate-200 flex flex-col shrink-0 bg-white">
        
        {/* Header da Sidebar */}
        <div className="p-4 space-y-4 border-b border-slate-100">
          <div className="flex items-center justify-between">
            <h2 className="text-base font-bold text-slate-900">Conversas</h2>
            <span className="text-xs text-slate-500 font-medium">781/980</span>
          </div>

          {/* Busca */}
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
            <input 
              type="text" 
              placeholder="Buscar cliente..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full bg-slate-50 border border-slate-200 focus:border-orange-500 rounded-xl py-2 pl-9 pr-3 text-sm text-slate-900 placeholder-slate-400 outline-none transition-all"
            />
          </div>

          {/* Abas */}
          <div className="flex gap-2 text-xs overflow-x-auto pb-1 no-scrollbar">
            <button 
              onClick={() => setActiveTab('meus')}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-full font-semibold transition-all whitespace-nowrap ${activeTab === 'meus' ? 'bg-orange-100 text-orange-600' : 'text-slate-500 hover:bg-slate-50'}`}
            >
              Meus
              <span className="bg-emerald-500 text-white text-[10px] px-1.5 rounded-full">770</span>
            </button>
            <button 
              onClick={() => setActiveTab('equipe')}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-full font-semibold transition-all whitespace-nowrap ${activeTab === 'equipe' ? 'bg-orange-500 text-white' : 'text-slate-500 hover:bg-slate-50'}`}
            >
              Equipe
            </button>
            <button 
              onClick={() => setActiveTab('grupos')}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-full font-semibold transition-all whitespace-nowrap ${activeTab === 'grupos' ? 'bg-orange-100 text-orange-600' : 'text-slate-500 hover:bg-slate-50'}`}
            >
              Grupos
              <span className="bg-emerald-500 text-white text-[10px] px-1.5 rounded-full">1</span>
            </button>
            <button 
              onClick={() => setActiveTab('nao-lidas')}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-full font-semibold transition-all whitespace-nowrap ${activeTab === 'nao-lidas' ? 'bg-red-100 text-red-600' : 'text-slate-500 hover:bg-slate-50'}`}
            >
              Não lidas
              <span className="bg-red-500 text-white text-[10px] px-1.5 rounded-full">271</span>
            </button>
          </div>

          {/* Filtro secundário */}
          <div className="flex items-center justify-between bg-slate-50 rounded-lg px-3 py-2 border border-slate-200">
            <div className="flex items-center gap-2 text-slate-600 text-sm font-medium">
              <Filter className="w-4 h-4" /> Todas as próximas ações
            </div>
            <span className="text-xs font-bold text-slate-500">119</span>
          </div>
        </div>

        {/* Lista de Chats */}
        <div className="flex-1 overflow-y-auto divide-y divide-slate-100">
          {filteredConversations.length === 0 ? (
            <div className="p-8 text-center text-slate-400 text-sm">
              Nenhuma conversa encontrada.
            </div>
          ) : (
            filteredConversations.map((chat) => {
              const isGroup = checkIsGroup(chat);
              const clientName = chat.client?.full_name || chat.client?.name || (isGroup ? 'Grupo WhatsApp' : 'Cliente');
              const isSelected = chat.id === activeChatId;

              return (
                <button
                  key={chat.id}
                  onClick={() => setActiveChatId(chat.id)}
                  className={`w-full p-4 text-left flex items-start gap-3 transition-all ${
                    isSelected ? 'bg-slate-50 border-l-4 border-l-orange-500' : 'hover:bg-slate-50 border-l-4 border-l-transparent'
                  }`}
                >
                  <div className="relative shrink-0">
                    <div className="w-12 h-12 rounded-full flex items-center justify-center font-bold text-sm bg-slate-800 text-white">
                      {isGroup ? <Users className="w-5 h-5" /> : clientName.split(' ').map((n) => n[0]).slice(0, 2).join('').toUpperCase()}
                    </div>
                  </div>

                  <div className="flex-1 min-w-0">
                    <div className="flex items-center justify-between mb-1">
                      <span className="text-sm font-bold text-slate-900 truncate">
                        {clientName}
                      </span>
                      <span className="text-xs text-slate-500 font-medium">
                        {chat.last_message_at ? new Date(chat.last_message_at).toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' }) : '16:44'}
                      </span>
                    </div>
                    <p className="text-xs text-slate-500 truncate mb-2">Conversa com {chat.agent_id ? 'Corretor' : 'Ninguém'}</p>
                    
                    <div className="flex items-center gap-1.5 flex-wrap">
                      <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-slate-100 text-slate-600 border border-slate-200">
                        Aberta
                      </span>
                      {chat.ai_enabled !== false && (
                        <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-emerald-50 text-emerald-600 border border-emerald-200 flex items-center gap-1">
                          IA ativa
                        </span>
                      )}
                      <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-slate-100 text-slate-400 border border-slate-200">
                        +
                      </span>
                      {(chat.unread_count || 0) > 0 && (
                        <span className="text-[10px] font-bold w-5 h-5 flex items-center justify-center rounded-full bg-emerald-500 text-white ml-auto">
                          {chat.unread_count}
                        </span>
                      )}
                    </div>
                  </div>
                </button>
              );
            })
          )}
        </div>
      </div>

      {/* 2. ÁREA CENTRAL: CHAT */}
      <div className="flex-1 flex flex-col h-full bg-slate-50 relative">
        {activeChat ? (
          <>
            {/* Header do Chat */}
            <div className="h-16 border-b border-slate-200 px-6 flex items-center justify-between shrink-0 bg-white">
              <div className="flex items-center gap-4">
                <div className="w-10 h-10 rounded-full flex items-center justify-center font-bold text-sm bg-slate-800 text-white">
                  {isGroupActiveChat ? <Users className="w-5 h-5" /> : (activeChat.client?.full_name || 'C').charAt(0).toUpperCase()}
                </div>
                <div>
                  <h3 className="text-base font-bold text-slate-900 flex items-center gap-2">
                    {activeChat.client?.full_name || activeChat.client?.name || (isGroupActiveChat ? 'Grupo WhatsApp' : 'Cliente')}
                    <span className="text-xs font-semibold px-2 py-0.5 rounded bg-slate-100 text-slate-600 flex items-center gap-1">
                      <Plus className="w-3 h-3" /> Tag
                    </span>
                  </h3>
                  <p className="text-xs text-slate-500 font-medium">Conversa</p>
                </div>
              </div>

              {/* Ações do Header */}
              <div className="flex items-center gap-4">
                <div className="flex items-center gap-2 bg-emerald-50 px-3 py-1.5 rounded-full border border-emerald-200">
                  <Bot className="w-4 h-4 text-emerald-600" />
                  <span className="text-xs font-bold text-emerald-600 mr-2">IA</span>
                  <div className="w-8 h-4 bg-emerald-500 rounded-full relative cursor-pointer">
                    <div className="absolute right-0.5 top-0.5 w-3 h-3 bg-white rounded-full"></div>
                  </div>
                </div>

                <div className="flex items-center gap-1 border-l border-slate-200 pl-4">
                  <button className="p-2 text-slate-600 hover:bg-slate-100 rounded-full transition-colors"><Phone className="w-5 h-5" /></button>
                  <button className="p-2 text-slate-600 hover:bg-slate-100 rounded-full transition-colors"><Mail className="w-5 h-5" /></button>
                  <button className="p-2 text-slate-600 hover:bg-slate-100 rounded-full transition-colors"><User className="w-5 h-5" /></button>
                  <button className="p-2 text-slate-600 hover:bg-slate-100 rounded-full transition-colors" onClick={() => setShowNotes(!showNotes)}><Info className="w-5 h-5" /></button>
                  <button className="p-2 text-slate-600 hover:bg-slate-100 rounded-full transition-colors"><MoreVertical className="w-5 h-5" /></button>
                </div>
              </div>
            </div>

            {/* Lista de Mensagens */}
            <div className="flex-1 overflow-y-auto p-6 space-y-4">
              {isLoadingMessages ? (
                <div className="flex items-center justify-center h-full text-slate-500 text-xs">
                  Carregando mensagens...
                </div>
              ) : messages.length === 0 ? (
                <div className="flex flex-col items-center justify-center h-full text-slate-400 text-sm space-y-3">
                  <MessageSquare className="w-10 h-10 text-slate-300" />
                  <p>Inicie a conversa.</p>
                </div>
              ) : (
                messages.map((msg) => {
                  const isAgentSender = msg.sender_id === user?.id || 
                                        msg.message_type === 'bot' || 
                                        (msg.sender && msg.sender.role !== 'client') ||
                                        (isGroupActiveChat ? msg.sender_id === activeChat?.client?.id : false);
                  
                  const senderName = msg.sender?.full_name || (isAgentSender ? 'Você' : 'Participante');

                  return (
                    <div 
                      key={msg.id}
                      className={`flex flex-col ${isAgentSender ? 'items-end' : 'items-start'}`}
                    >
                      {/* Em grupos, exibir o nome do remetente para mensagens de participantes */}
                      {isGroupActiveChat && !isAgentSender && (
                        <div className="flex items-center gap-1.5 ml-1 mb-1">
                          <span className="text-[10px] font-semibold text-slate-500">
                            {senderName}
                          </span>
                        </div>
                      )}

                      <div className={`max-w-[75%] sm:max-w-[70%] rounded-2xl px-4 py-3 text-[13px] leading-relaxed shadow-sm ${
                        isAgentSender 
                          ? 'bg-emerald-50 text-slate-900 rounded-tr-none border border-emerald-100' 
                          : 'bg-white text-slate-900 rounded-tl-none border border-slate-200'
                      }`}>
                        <p className="whitespace-pre-line break-words">{msg.content}</p>
                        <div className={`flex items-center gap-1 text-[10px] mt-1 ${isAgentSender ? 'text-slate-500 justify-end' : 'text-slate-400 justify-start'}`}>
                          <span>{new Date(msg.created_at).toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' })}</span>
                          {isAgentSender && <CheckCheck className="w-3 h-3 text-emerald-500" />}
                        </div>
                      </div>
                    </div>
                  );
                })
              )}
              <div ref={messagesEndRef} />
            </div>

            {/* Input de Mensagem e Ações */}
            <div className="border-t border-slate-200 bg-white">
              {/* Atalhos Rápidos */}
              <div className="px-4 py-3 flex items-center gap-2 border-b border-slate-100 overflow-x-auto no-scrollbar bg-slate-50/50">
                <button className="flex items-center gap-2 px-4 py-2 rounded-xl bg-orange-100 hover:bg-orange-200 text-orange-700 text-[11px] font-black uppercase tracking-wider transition-colors whitespace-nowrap shadow-sm border border-orange-200/50">
                  <MessageSquare className="w-4 h-4" /> Agendar Mensagem
                </button>
                <button className="flex items-center gap-2 px-4 py-2 rounded-xl bg-orange-100 hover:bg-orange-200 text-orange-700 text-[11px] font-black uppercase tracking-wider transition-colors whitespace-nowrap shadow-sm border border-orange-200/50">
                  <Phone className="w-4 h-4" /> Ligação
                </button>
                <button className="flex items-center gap-2 px-4 py-2 rounded-xl bg-orange-100 hover:bg-orange-200 text-orange-700 text-[11px] font-black uppercase tracking-wider transition-colors whitespace-nowrap shadow-sm border border-orange-200/50">
                  <Calendar className="w-4 h-4" /> Visita
                </button>
                <button className="flex items-center gap-2 px-4 py-2 rounded-xl bg-orange-100 hover:bg-orange-200 text-orange-700 text-[11px] font-black uppercase tracking-wider transition-colors whitespace-nowrap shadow-sm border border-orange-200/50">
                  <Users className="w-4 h-4" /> Reunião
                </button>
              </div>

              <form onSubmit={handleSendMessage} className="p-4 flex items-end gap-3">
                <button type="button" className="p-2 text-slate-400 hover:text-slate-600 hover:bg-slate-100 rounded-full transition-colors shrink-0">
                  <Paperclip className="w-5 h-5" />
                </button>
                <button type="button" className="p-2 text-slate-400 hover:text-slate-600 hover:bg-slate-100 rounded-full transition-colors shrink-0">
                  <MessageSquare className="w-5 h-5" />
                </button>
                
                <textarea 
                  placeholder="Digite sua mensagem... Pressione Enter para enviar"
                  value={messageInput}
                  onChange={(e) => setMessageInput(e.target.value)}
                  onKeyDown={(e) => {
                    if (e.key === 'Enter' && !e.shiftKey) {
                      e.preventDefault();
                      handleSendMessage();
                    }
                  }}
                  rows={1}
                  className="flex-1 bg-slate-50 border border-slate-200 focus:border-orange-500 focus:ring-2 focus:ring-orange-500/20 rounded-2xl py-3 px-4 text-sm text-slate-900 placeholder-slate-400 outline-none transition-all resize-none max-h-32"
                />
                
                {messageInput.trim() ? (
                  <button 
                    type="submit"
                    disabled={sendMessageMutation.isPending}
                    className="p-3 rounded-full bg-orange-500 hover:bg-orange-600 disabled:opacity-50 text-white transition-all shadow-md shrink-0"
                  >
                    <Send className="w-5 h-5" />
                  </button>
                ) : (
                  <button type="button" className="p-3 rounded-full bg-slate-100 hover:bg-slate-200 text-slate-600 transition-all shrink-0">
                    <Mic className="w-5 h-5" />
                  </button>
                )}
              </form>
              <div className="px-6 pb-2 text-center text-[10px] text-slate-400">
                Pressione Enter para enviar, Shift+Enter para nova linha
              </div>
            </div>
          </>
        ) : (
          <div className="flex flex-col items-center justify-center h-full text-slate-400 text-sm space-y-4">
            <MessageSquare className="w-16 h-16 text-slate-200" />
            <p>Selecione uma conversa para iniciar o atendimento.</p>
          </div>
        )}
      </div>

      {/* 3. SIDEBAR DIREITA (NOTAS / INFO) */}
      {activeChat && showNotes && (
        <div className="w-72 border-l border-slate-200 bg-white flex flex-col shrink-0">
          <div className="p-4 border-b border-slate-100 flex items-center justify-between">
            <h3 className="text-sm font-bold text-slate-900">Anotações Internas</h3>
            <button onClick={() => setShowNotes(false)} className="text-slate-400 hover:text-slate-600">
              <X className="w-4 h-4" />
            </button>
          </div>
          <div className="flex-1 p-4 flex flex-col gap-4 overflow-y-auto">
            <div className="bg-yellow-50 border border-yellow-100 rounded-xl p-3">
              <p className="text-[10px] text-yellow-800 font-medium leading-relaxed">
                <Info className="w-3 h-3 inline mr-1" /> 
                Anotações visíveis <strong>apenas para a equipe interna</strong>. O cliente não verá essas informações.
              </p>
            </div>
            
            <div className="flex-1 flex flex-col gap-2">
              <label className="text-xs font-bold text-slate-700">Notas sobre o Lead</label>
              <textarea 
                placeholder="Escreva detalhes importantes sobre o perfil, interesses, objeções..."
                value={leadNotes}
                onChange={(e) => setLeadNotes(e.target.value)}
                className="flex-1 bg-slate-50 border border-slate-200 focus:border-orange-500 rounded-xl p-3 text-sm text-slate-700 resize-none outline-none"
              />
            </div>
            <button className="w-full py-2 bg-slate-900 text-white text-sm font-bold rounded-xl hover:bg-slate-800 transition-colors">
              Salvar Notas
            </button>
          </div>
        </div>
      )}


      {/* MODAL DE ADICIONAR CONTATO */}
      {showAddContactModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 backdrop-blur-sm p-4">
          <div className="bg-slate-900 border border-slate-800 rounded-3xl max-w-md w-full p-6 space-y-6 shadow-2xl">
            <div className="flex items-center justify-between border-b border-slate-800 pb-4">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-emerald-500/10 text-emerald-400 flex items-center justify-center">
                  <UserPlus className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="text-base font-bold text-white">Adicionar Contato</h3>
                  <p className="text-xs text-slate-400">Criar lead e iniciar conversa</p>
                </div>
              </div>
              <button 
                onClick={() => setShowAddContactModal(false)}
                className="text-slate-400 hover:text-white p-2 rounded-xl hover:bg-slate-800 transition-colors"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleAddContact} className="space-y-4">
              <div className="space-y-2">
                <label className="text-xs font-semibold text-slate-400 uppercase tracking-wider">Nome Completo *</label>
                <input
                  type="text"
                  required
                  placeholder="Nome do Cliente"
                  value={newContact.name}
                  onChange={e => setNewContact({...newContact, name: e.target.value})}
                  className="w-full bg-slate-950/50 border border-slate-800 rounded-xl px-4 py-3 text-sm text-white focus:outline-none focus:ring-2 focus:ring-emerald-500/50 focus:border-emerald-500/50 transition-all placeholder:text-slate-600"
                />
              </div>
              <div className="space-y-2">
                <label className="text-xs font-semibold text-slate-400 uppercase tracking-wider">WhatsApp *</label>
                <input
                  type="text"
                  required
                  placeholder="(11) 99999-9999"
                  value={newContact.phone}
                  onChange={e => {
                     let val = e.target.value.replace(/\D/g, '');
                     // simple mask
                     if (val.length > 2) val = `(${val.substring(0,2)}) ${val.substring(2)}`;
                     if (val.length > 10) val = `${val.substring(0,10)}-${val.substring(10, 14)}`;
                     setNewContact({...newContact, phone: val})
                  }}
                  className="w-full bg-slate-950/50 border border-slate-800 rounded-xl px-4 py-3 text-sm text-white focus:outline-none focus:ring-2 focus:ring-emerald-500/50 focus:border-emerald-500/50 transition-all placeholder:text-slate-600"
                />
              </div>
              <div className="space-y-2">
                <label className="text-xs font-semibold text-slate-400 uppercase tracking-wider">E-mail (Opcional)</label>
                <input
                  type="email"
                  placeholder="cliente@email.com"
                  value={newContact.email}
                  onChange={e => setNewContact({...newContact, email: e.target.value})}
                  className="w-full bg-slate-950/50 border border-slate-800 rounded-xl px-4 py-3 text-sm text-white focus:outline-none focus:ring-2 focus:ring-emerald-500/50 focus:border-emerald-500/50 transition-all placeholder:text-slate-600"
                />
              </div>

              <button 
                type="submit"
                className="w-full py-3 bg-emerald-600 hover:bg-emerald-500 text-white rounded-xl font-bold transition-colors shadow-lg shadow-emerald-500/25 flex items-center justify-center gap-2 mt-6"
              >
                <UserPlus className="w-4 h-4" />
                Criar Contato e Iniciar
              </button>
            </form>
          </div>
        </div>
      )}

      {/* 3. MODAL DE CONEXÃO DO WHATSAPP (QR CODE / STATUS) */}
      {showWhatsAppModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 backdrop-blur-sm p-4">
          <div className="bg-slate-900 border border-slate-800 rounded-3xl max-w-lg w-full p-6 space-y-6 shadow-2xl">
            <div className="flex items-center justify-between border-b border-slate-800 pb-4">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-sky-500/10 text-sky-400 flex items-center justify-center">
                  <QrCode className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="text-base font-bold text-white">Conexão WhatsApp Imobiliária</h3>
                  <p className="text-xs text-slate-400">Integração oficial via Broker</p>
                </div>
              </div>
              <button 
                onClick={() => setShowWhatsAppModal(false)}
                className="text-slate-400 hover:text-white text-xs font-semibold p-1"
              >
                ✕
              </button>
            </div>

            {/* Status da Sessão */}
            <div className="space-y-4">
              <div className="p-4 rounded-2xl bg-slate-950 border border-slate-800 flex items-center justify-between">
                <div>
                  <p className="text-xs text-slate-400">Status da Sessão</p>
                  <p className="text-sm font-bold text-white capitalize">{whatsappSession?.status || 'Desconectado'}</p>
                  {whatsappSession?.phone_number && (
                    <p className="text-xs text-emerald-400 font-mono mt-0.5">{whatsappSession.phone_number}</p>
                  )}
                </div>
                <button 
                  onClick={() => refetchWhatsapp()}
                  className="p-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 text-xs flex items-center gap-1.5"
                >
                  <RefreshCw className="w-3.5 h-3.5" /> Atualizar
                </button>
              </div>

              {/* QR Code se pronto */}
              {whatsappSession?.status === 'qr_ready' && whatsappSession.qr_code && (
                <div className="flex flex-col items-center justify-center p-4 bg-white rounded-2xl">
                  <img 
                    src={whatsappSession.qr_code.startsWith('data:') ? whatsappSession.qr_code : `data:image/png;base64,${whatsappSession.qr_code}`}
                    alt="QR Code WhatsApp" 
                    className="w-56 h-56 object-contain"
                  />
                  <p className="text-slate-800 text-xs font-semibold mt-2">Escaneie com o celular da imobiliária</p>
                </div>
              )}

              {/* Botões de Ação */}
              <div className="flex gap-3">
                {!isWhatsappConnected ? (
                  <button
                    onClick={() => startWhatsappMutation.mutate({})}
                    disabled={startWhatsappMutation.isPending}
                    className="flex-1 py-2.5 rounded-xl bg-emerald-500 hover:bg-emerald-400 text-white text-xs font-bold transition-all shadow-lg shadow-emerald-500/20 flex items-center justify-center gap-2"
                  >
                    <QrCode className="w-4 h-4" /> Gerar Novo QR Code
                  </button>
                ) : (
                  <button
                    onClick={() => disconnectWhatsappMutation.mutate()}
                    disabled={disconnectWhatsappMutation.isPending}
                    className="flex-1 py-2.5 rounded-xl bg-red-500/10 text-red-400 border border-red-500/20 hover:bg-red-500/20 text-xs font-bold transition-all flex items-center justify-center gap-2"
                  >
                    <PowerOff className="w-4 h-4" /> Desconectar Sessão
                  </button>
                )}
              </div>
            </div>
          </div>
        </div>
      )}

    </div>
  );
}
