import React, { useState, useEffect, useRef, useMemo } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import AsyncCombobox, { LookupItem } from '../components/AsyncCombobox';
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
  Filter,
  PhoneCall,
  TrendingUp,
  Target,
  Award,
  Smartphone,
  ArrowLeft
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
  useSendWhatsAppMessage,
  useAcceptConversation,
  useMarkConversationRead,
  useTransferConversation,
  useIgnoreConversation,
  useUpdateClientContact
} from '../hooks/useWhatsapp';
import WhatsAppConnectionModal from '../components/WhatsAppConnectionModal';
import { cn } from '../lib/utils';
import { useResponsive } from '../hooks/useResponsive';

// ── INTERFACES ──────────────────────────────────

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
    name?: string;
    role?: string;
    avatar_url?: string | null;
    phone?: string | null;
  };
  receiver_id?: string;
}

interface Conversation {
  id: string;
  client_id: string;
  agent_id?: string | null;
  subject?: string;
  status: string;
  tenant_id?: string;
  ai_enabled?: boolean;
  unread_count?: number;
  last_message_at?: string;
  tags?: string | null;
  client?: Client | null;
  lead_id?: string | null;
  stage?: string | null;
  whatsapp_contact?: Array<{ is_group?: boolean; remote_jid?: string; phone_number?: string }>;
  whatsapp_contacts?: Array<{ is_group?: boolean; remote_jid?: string; phone_number?: string }>;
}

interface GroupParticipant {
  group_id: string;
  profile_id: string;
  group_role?: string;
  full_name?: string;
  phone?: string;
  profile?: {
    id: string;
    full_name?: string;
    phone?: string;
    role?: string;
  };
}

interface AgentScore {
  agent_id: string;
  full_name: string;
  contatos: number;
  followups: number;
  visitas: number;
  propostas: number;
  vendas: number;
  taxa_conversao: string;
}

// ── TIPOS DE FILTRO ─────────────────────────────

type TabFiltro = 'todos' | 'ativos' | 'pendentes' | 'meus' | 'nao_atribuidos' | 'grupos';
type PeriodoFiltro = 'hoje' | 'semana' | 'mes' | 'todos';

// ── ESTADOS INICIAIS ────────────────────────────

const DEMO_MODE = false; // Desativado para usar dados reais do Supabase

// ── PROTOCOLO ÁUDIO FAIL-SAFE (Ada) ──────────────────
// Webhooks configuráveis. Preencha com as URLs reais do backend.
// Vazio = desativa a chamada HTTP e apenas loga o payload no console.
const AUDIO_FAIL_WEBHOOK = '';      // → notifica falha de áudio
const AUDIO_RESOLVED_WEBHOOK = '';  // → notifica resolução de falha de áudio

// ── FUNIL ÚNICO QUBITS — 12 ESTÁGIOS EXATOS ──────────────────
// Fonte única: conversations.stage espelha leads.stage (NUNCA divergem).
// "Qualificado" (pos.3) = GATILHO de injeção do cartão de Lead (gatilho no banco).
const ESTAGIOS_FUNIL = [
  'Contato Cadastrado',           // 1
  'Primeiro Atendimento / Qualificação', // 2
  'Qualificado',                  // 3 ⭐ GATILHO
  'Follow Up',                    // 4
  'Buscar Imóveis',               // 5
  'Agendamento Visita/Reunião',   // 6
  'Visita/Reunião Agendada',      // 7
  'Match Pronto',                 // 8
  'Apresentar Imóveis',           // 9
  'Imóvel Escolhido',             // 10
  'Proposta Solicitada',          // 11
  'Vendido',                      // 12
];

const demoConversations: Conversation[] = [];

const demoMessages: Message[] = [];

const demoGroupParticipants: GroupParticipant[] = [];

// ── COMPONENTE PRINCIPAL ────────────────────────

export default function Atendimento() {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const conversationParam = searchParams.get('conversation');
  const { isMobile } = useResponsive();

  const { profile, user } = useAuth();
  const isAgent = profile?.role === 'agent' || profile?.role === 'admin' || profile?.role === 'manager';
  const isAdmin = profile?.role === 'admin' || profile?.email === 'sacramento@apexfyhub.com.br';

  const queryResult = useLeads({});
  const leads = queryResult?.data ?? [];
  const { data: visits = [] } = useVisits();
  const { data: agents = [] } = useAgents();
  const whatsappSession = useWhatsapp();
  const startSession = useStartWhatsAppSession();
  const disconnectSession = useDisconnectWhatsAppSession();
  const setAiEnabled = useSetWhatsAppAiEnabled();
  const sendMessageMutation = useSendWhatsAppMessage();
  const acceptConversation = useAcceptConversation();
  const markRead = useMarkConversationRead();
  const transferConversation = useTransferConversation();
  const ignoreConversation = useIgnoreConversation();

  // ── FILTROS ──
  const [activeTab, setActiveTab] = useState<TabFiltro>('meus');
  const [periodoFiltro, setPeriodoFiltro] = useState<PeriodoFiltro>('todos');
  const [searchTerm, setSearchTerm] = useState('');
  const [filtroCorretor, setFiltroCorretor] = useState<string>('');

  // ── CONVERSAS E MENSAGENS ──
  const [conversations, setConversations] = useState<Conversation[]>([]);
  const [messages, setMessages] = useState<Message[]>([]);
  const [isLoadingMessages, setIsLoadingMessages] = useState(false);
  const [messageInput, setMessageInput] = useState('');
  const [activeChatId, setActiveChatId] = useState<string | null>(conversationParam || null);
  const [replyToMessage, setReplyToMessage] = useState<string | null>(null);
  const [showAudioFailHelp, setShowAudioFailHelp] = useState(false); // popup imortal de resolução (Áudio Fail-Safe)
  const [showAddContactModal, setShowAddContactModal] = useState(false);
  const [whatsappModalOpen, setWhatsappModalOpen] = useState(false);
  const [showTransferModal, setShowTransferModal] = useState(false);
  const [transferTargetAgent, setTransferTargetAgent] = useState('');

  // ── EVENTOS AGENDADOS ──
  const [scheduleData, setScheduleData] = useState({ date: '', time: '', message: '' });
  const [activeDropdown, setActiveDropdown] = useState<string | null>(null);
  const [visitPropertyId, setVisitPropertyId] = useState('');

  // ── GRUPO / PARTICIPANTES ──
  const [groupParticipants, setGroupParticipants] = useState<GroupParticipant[]>([]);
  const [showParticipants, setShowParticipants] = useState(false);

  // ── DASHBOARD ──
  const [dashboardPeriodo, setDashboardPeriodo] = useState<'dia' | 'semana' | 'mes'>('dia');
  const [showRanking, setShowRanking] = useState(false);

  // ── NOTAS ──
  const [showNotes, setShowNotes] = useState(false);
  const [leadNotes, setLeadNotes] = useState('');

  const messagesEndRef = useRef<HTMLDivElement>(null);

  // ── CHECAGEM DE GRUPO ──
  const checkIsGroup = (chat: Conversation) => {
    const wContact = chat.whatsapp_contact?.[0] || chat.whatsapp_contacts?.[0];
    return Boolean(
      wContact?.is_group ||
      chat.client?.is_group ||
      chat.client?.phone?.includes('@g.us') ||
      wContact?.remote_jid?.endsWith('@g.us')
    );
  };

  // ── CARREGAR CONVERSAS ──
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
        if (data && data.length > 0) {
          setConversations(data as Conversation[]);
          if (!activeChatId) {
            setActiveChatId(data[0].id);
          }
        }
      } catch (err) {
        console.error('Erro ao carregar conversas:', err);
      }
    }
    loadConversations();
  }, []);

  // ── FILTRAGEM DE CONVERSAS ──
  const filteredConversations = useMemo(() => {
    let filtered = conversations;

    // Filtro por busca
    if (searchTerm) {
      const term = searchTerm.toLowerCase();
      filtered = filtered.filter((c) =>
        c.client?.full_name?.toLowerCase().includes(term) ||
        c.client?.phone?.includes(term) ||
        c.subject?.toLowerCase().includes(term)
      );
    }

    // Filtro por aba
    switch (activeTab) {
      case 'meus':
        filtered = filtered.filter((c) => c.agent_id === user?.id && c.status !== 'closed' && c.status !== 'deleted');
        break;
      case 'ativos':
        filtered = filtered.filter((c) => c.status === 'active' || c.status === 'open');
        break;
      case 'pendentes':
        filtered = filtered.filter((c) => (!c.agent_id || c.agent_id === null) && c.status !== 'closed' && c.status !== 'deleted');
        break;
      case 'nao_atribuidos':
        filtered = filtered.filter((c) => !c.agent_id && c.status !== 'closed' && c.status !== 'deleted');
        break;
      case 'grupos':
        filtered = filtered.filter((c) => checkIsGroup(c) && c.status !== 'closed');
        break;
      default:
        break;
    }

    // Filtro por corretor
    if (filtroCorretor) {
      filtered = filtered.filter((c) => c.agent_id === filtroCorretor);
    }

    // Filtro por período
    if (periodoFiltro !== 'todos') {
      const now = new Date();
      let limit: Date;
      switch (periodoFiltro) {
        case 'hoje':
          limit = new Date(now.getFullYear(), now.getMonth(), now.getDate());
          break;
        case 'semana':
          limit = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
          break;
        case 'mes':
          limit = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);
          break;
      }
      filtered = filtered.filter((c) => c.last_message_at && new Date(c.last_message_at) >= limit!);
    }

    return filtered;
  }, [conversations, searchTerm, activeTab, filtroCorretor, periodoFiltro]);

  // ── LOAD MESSAGES (COM POLLING FALBACK) ──
  const loadMessages = async (convId: string) => {
    setIsLoadingMessages(true);
    try {
      const { data, error } = await supabase
        .from('messages')
        .select('*, sender:profiles!messages_sender_id_fkey(*)')
        .eq('conversation_id', convId)
        .order('created_at', { ascending: true });

      if (error) throw error;
      setMessages((data as Message[]) || []);
    } catch (err) {
      console.error('Erro ao carregar mensagens:', err);
    } finally {
      setIsLoadingMessages(false);
    }
  };

  // Load messages when chat changes
  useEffect(() => {
    if (activeChatId) {
      loadMessages(activeChatId);
    }
  }, [activeChatId]);

  // ── POLLING FALLBACK (a cada 5s busca mensagens novas) ──
  useEffect(() => {
    if (!activeChatId) return;
    const interval = setInterval(async () => {
      try {
        const { data, error } = await supabase
          .from('messages')
          .select('*, sender:profiles!messages_sender_id_fkey(*)')
          .eq('conversation_id', activeChatId)
          .order('created_at', { ascending: false })
          .limit(20);

        if (error) throw error;
        if (data && data.length > 0) {
          setMessages((prev) => {
            const existingIds = new Set(prev.map((m) => m.id));
            const newMsgs = (data as Message[]).filter((m) => !existingIds.has(m.id)).reverse();
            if (newMsgs.length === 0) return prev;
            return [...prev, ...newMsgs].sort(
              (a, b) => new Date(a.created_at).getTime() - new Date(b.created_at).getTime()
            );
          });
        }
      } catch (err) {
        // Silêncio
      }
    }, 5000);
    return () => clearInterval(interval);
  }, [activeChatId]);

  // ── REALTIME SUBSCRIPTION ──
  useEffect(() => {
    if (!activeChatId) return;
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

  const activeChat = useMemo(() => {
    return conversations.find((c) => c.id === activeChatId) || null;
  }, [conversations, activeChatId]);

  const isGroupActiveChat = activeChat ? checkIsGroup(activeChat) : false;

  // ── SCROLL TO BOTTOM ──
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  // ── CARREGAR PARTICIPANTES DO GRUPO (BUG FIX 1) ──
  useEffect(() => {
    if (!activeChatId || !isGroupActiveChat) {
      setGroupParticipants([]);
      return;
    }
    async function loadParticipants() {
      try {
        // Busca participantes do grupo via vw_group_participants
        const { data, error } = await supabase
          .from('vw_group_participants')
          .select('*')
          .eq('group_id', activeChat?.client_id);

        if (error) throw error;
        
        if (data && data.length > 0) {
          setGroupParticipants(data as GroupParticipant[]);
        } else {
          // Fallback: busca direto na group_participants
          const { data: gpData, error: gpErr } = await supabase
            .from('group_participants')
            .select('*, profile:profiles!group_participants_profile_id_fkey(*)')
            .eq('group_id', activeChat?.client_id);
          
          if (!gpErr && gpData) {
            setGroupParticipants(gpData as GroupParticipant[]);
          }
        }
      } catch (err) {
        console.error('Erro ao carregar participantes:', err);
      }
    }
    loadParticipants();
  }, [activeChatId, isGroupActiveChat]);

  // ── ENVIAR MENSAGEM ──
  const handleSendMessage = async (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    if (!messageInput.trim() || !activeChatId) return;

    const content = messageInput.trim();
    setMessageInput('');
    setReplyToMessage(null);

    // ── OPTIMISTIC UPDATE: mostra a mensagem IMEDIATAMENTE ──
    const tempId = `temp-${Date.now()}`;
    const optimisticMsg: Message = {
      id: tempId,
      conversation_id: activeChatId,
      sender_id: user?.id,
      content,
      message_type: 'text',
      created_at: new Date().toISOString(),
      status: 'sent',
      sender: user ? { id: user.id, full_name: profile?.full_name, role: profile?.role } : undefined,
    };
    setMessages((prev) => [...prev, optimisticMsg]);

    try {
      const result = await sendMessageMutation.mutateAsync({
        conversationId: activeChatId,
        content: content
      });
      // Substitui mensagem temporária pela real (se tiver ID de volta)
      if (result?.id) {
        setMessages((prev) =>
          prev.map((m) => (m.id === tempId ? { ...m, id: result.id, status: 'delivered' as any } : m))
        );
      }
    } catch (err) {
      console.error('Erro ao enviar mensagem:', err);
      // Marca como erro
      setMessages((prev) =>
        prev.map((m) => (m.id === tempId ? { ...m, status: 'error' as any } : m))
      );
    }
  };

  // ── PROTOCOLO ÁUDIO FAIL-SAFE (Ada) ──
  const fireWebhook = async (url: string, payload: Record<string, unknown>) => {
    if (!url) {
      console.warn('[Audio Fail-Safe] Webhook não configurado. Payload:', payload);
      return;
    }
    try {
      await fetch(url, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });
    } catch (err) {
      console.error('[Audio Fail-Safe] Erro ao chamar webhook:', err);
    }
  };

  const handleAudioFail = async () => {
    if (!activeChat) return;
    await fireWebhook(AUDIO_FAIL_WEBHOOK, {
      leadName: activeChat.client?.full_name || activeChat.client?.name || 'Desconhecido',
      phone: activeChat.client?.phone || '',
      conversationId: activeChat.id,
    });
    setShowAudioFailHelp(true); // popup imortal — só fecha ao clicar em [Sim]
  };

  const handleAudioResolved = async () => {
    if (!activeChat) return;
    await fireWebhook(AUDIO_RESOLVED_WEBHOOK, {
      conversationId: activeChat.id,
      resolvedAt: new Date().toISOString(),
    });
    setShowAudioFailHelp(false);
  };

  const handleAccept = async () => {
    if (!activeChatId || !user?.id) return;
    try {
      await acceptConversation.mutateAsync({
        conversationId: activeChatId
      });
      setConversations((prev) =>
        prev.map((c) => (c.id === activeChatId ? { ...c, agent_id: user.id } : c))
      );
    } catch (err) {
      console.error('Erro ao aceitar:', err);
    }
  };

  const handleTransfer = async (agentId: string) => {
    if (!activeChatId || !agentId) return;
    try {
      await transferConversation.mutateAsync({
        conversationId: activeChatId,
        toAgentId: agentId
      });
      setConversations((prev) =>
        prev.map((c) => (c.id === activeChatId ? { ...c, agent_id: agentId } : c))
      );
    } catch (err) {
      console.error('Erro ao transferir:', err);
    }
  };

  const handleIgnore = async () => {
    if (!activeChatId) return;
    try {
      await ignoreConversation.mutateAsync({ conversationId: activeChatId });
      setConversations((prev) =>
        prev.map((c) => (c.id === activeChatId ? { ...c, agent_id: null } : c))
      );
    } catch (err) {
      console.error('Erro ao ignorar:', err);
    }
  };

  // ── FUNIL QUBITS: atualizar estágio da conversa (fonte única) ──
  // conversations.stage → espelho sincronizado automaticamente p/ leads.stage
  // via gatilho trg_lead_qualificado (cria o lead em "Qualificado").
  const handleStageChange = async (nextStage: string) => {
    if (!activeChatId) return;
    const current = activeChat?.stage || 'Contato Cadastrado';
    if (nextStage === current) return;
    try {
      const { error } = await supabase
        .from('conversations')
        .update({ stage: nextStage, updated_at: new Date().toISOString() })
        .eq('id', activeChatId);
      if (error) throw error;
      // Espelho local imediato
      setConversations((prev) =>
        prev.map((c) => (c.id === activeChatId ? { ...c, stage: nextStage } : c))
      );
    } catch (err) {
      console.error('Erro ao atualizar estágio:', err);
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
      const { data: existingLead } = await supabase
        .from('leads')
        .select('*, responsible:profiles!leads_responsible_id_fkey(full_name)')
        .eq('phone', phone)
        .maybeSingle();

      if (existingLead) {
        alert(`❌ Bloqueado! Este contato já está cadastrado como lead.`);
        return;
      }

      const { data: clientId, error: rpcErr } = await supabase.rpc('create_client_profile', {
        p_name: newContact.name,
        p_phone: phone,
        p_email: newContact.email || null
      });

      if (rpcErr) throw rpcErr;

      if (clientId && user) {
        const { error: convError } = await supabase.from('conversations').insert({
          client_id: clientId,
          agent_id: user.id,
          status: 'active',
          ai_enabled: true
        });
        if (convError) throw convError;
      }

      setShowAddContactModal(false);
      setNewContact({ name: '', phone: '', email: '' });
    } catch (err: any) {
      console.error(err);
      alert('Erro ao adicionar contato: ' + err.message);
    }
  };

  const [newContact, setNewContact] = useState({ name: '', phone: '', email: '' });

  const isWhatsappConnected = whatsappSession.data?.status === 'connected';

  // ── CÁLCULO DO DASHBOARD ──
  const dashboardData = useMemo(() => {
    const now = new Date();
    let start: Date;
    switch (dashboardPeriodo) {
      case 'dia':
        start = new Date(now.getFullYear(), now.getMonth(), now.getDate());
        break;
      case 'semana':
        start = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
        break;
      case 'mes':
        start = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);
        break;
    }
    if (!user?.id) return null;

    const minhasConv = conversations.filter((c) => c.agent_id === user.id);
    return {
      contatos: minhasConv.length,
      followups: messages.filter(
        (m) => m.sender_id === user.id && new Date(m.created_at) >= start!
      ).length,
      visitas: visits.filter(
        (v: any) => v.agent_id === user.id && new Date(v.created_at || v.date) >= start!
      ).length,
    };
  }, [conversations, messages, visits, dashboardPeriodo, user]);

  // ── RANKING ──
  const ranking = useMemo(() => {
    if (!agents.length || !conversations.length) return [];
    const scores: { [key: string]: AgentScore } = {};
    agents.forEach((a: any) => {
      scores[a.id] = {
        agent_id: a.id,
        full_name: a.full_name || a.email || 'Desconhecido',
        contatos: 0,
        followups: 0,
        visitas: 0,
        propostas: 0,
        vendas: 0,
        taxa_conversao: '0%',
      };
    });
    conversations.forEach((c) => {
      if (c.agent_id && scores[c.agent_id]) scores[c.agent_id].contatos++;
    });
    return Object.values(scores)
      .sort((a, b) => b.contatos - a.contatos)
      .slice(0, 10);
  }, [conversations, agents]);

  return (
    <div className="flex h-[calc(100vh-80px)] w-full overflow-hidden glass-neon-card rounded-3xl relative">
      
      {/* ── 1. SIDEBAR CONVERSAS ── */}
      {/* FASE 0: mobile alterna lista <-> chat (padrão WhatsApp). Em mobile com chat
          aberto (activeChatId) a lista fica oculta; sem chat aberto ocupa a tela toda.
          Em desktop mantém a coluna fixa w-80 ao lado do chat. */}
      <div className={cn(
        "border-r border-cyan-900/30 flex-col bg-white/5",
        isMobile
          ? (activeChatId ? "hidden" : "flex w-full")
          : "flex w-80 shrink-0"
      )}>
        <div className="p-4 space-y-4 border-b border-white/5">
          <div className="flex items-center justify-between">
            <h2 className="text-base font-bold text-white">Conversas</h2>
            <span className="text-xs text-slate-400 font-medium">{filteredConversations.length}</span>
          </div>

          {/* WhatsApp Status Indicator */}
          <div className={cn(
            "flex items-center justify-between p-2 rounded-xl border transition-all",
            isWhatsappConnected 
              ? "bg-emerald-500/10 border-emerald-500/30" 
              : "bg-rose-500/10 border-rose-500/20"
          )}>
            <div className="flex items-center gap-2">
              <div className={cn(
                "w-2 h-2 rounded-full",
                isWhatsappConnected ? "bg-emerald-400 shadow-[0_0_6px_rgba(52,211,153,0.6)]" : "bg-rose-400"
              )} />
              <span className={cn(
                "text-[11px] font-semibold",
                isWhatsappConnected ? "text-emerald-400" : "text-rose-300"
              )}>
                WhatsApp {isWhatsappConnected ? 'Conectado' : 'Desconectado'}
              </span>
            </div>
            <button
              onClick={() => setWhatsappModalOpen(true)}
              className={cn(
                "text-[10px] font-bold px-2.5 py-1 rounded-lg transition-all",
                isWhatsappConnected
                  ? "bg-emerald-500/20 text-emerald-300 hover:bg-emerald-500/30"
                  : "bg-rose-500/20 text-rose-300 hover:bg-rose-500/30"
              )}
            >
              {isWhatsappConnected ? 'Gerenciar' : 'Conectar'}
            </button>
          </div>

          {/* Busca */}
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
            <input 
              type="text" 
              placeholder="Buscar cliente..." 
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full bg-white/5 border border-cyan-900/30 focus:border-cyan-500 rounded-xl py-2 pl-9 pr-3 text-sm text-white placeholder-slate-400 outline-none transition-all"
            />
          </div>

          {/* Abas de filtro */}
          <div className="flex gap-1.5 text-xs overflow-x-auto pb-1 no-scrollbar flex-wrap">
            {(['todos', 'meus', 'ativos', 'pendentes', 'nao_atribuidos', 'grupos'] as const).map((tab) => (
              <button
                key={tab}
                onClick={() => setActiveTab(tab)}
                className={cn(
                  'px-2.5 py-1.5 rounded-lg font-semibold transition-all whitespace-nowrap',
                  activeTab === tab
                    ? 'bg-cyan-500/20 text-cyan-400'
                    : 'text-slate-400 hover:bg-white/5'
                )}
              >
                {tab === 'todos' ? 'Todos' :
                 tab === 'meus' ? 'Meus' :
                 tab === 'ativos' ? 'Ativos' :
                 tab === 'pendentes' ? 'Pendentes' :
                 tab === 'nao_atribuidos' ? 'Não Atrib.' : 'Grupos'}
              </button>
            ))}
          </div>

          {/* Filtro período */}
          <div className="flex gap-1 text-xs">
            {(['hoje', 'semana', 'mes', 'todos'] as const).map((p) => (
              <button
                key={p}
                onClick={() => setPeriodoFiltro(p)}
                className={cn(
                  'px-2 py-1 rounded font-medium',
                  periodoFiltro === p ? 'bg-white/10 text-white' : 'text-slate-400 hover:bg-white/5'
                )}
              >
                {p === 'hoje' ? 'Hoje' : p === 'semana' ? '7d' : p === 'mes' ? '30d' : 'Tudo'}
              </button>
            ))}
          </div>

          {/* Filtro de atendente — VISÍVEL SOMENTE PARA ADMINS (segmentação de conversas por colaborador) */}
          {isAdmin && agents.length > 0 && (
            <select
              value={filtroCorretor}
              onChange={(e) => setFiltroCorretor(e.target.value)}
              className="w-full text-xs p-2 border border-cyan-900/30 rounded-lg outline-none"
              title="Ver conversas de um atendente específico"
            >
              <option value="">Todos os atendentes</option>
              {agents.map((a: any) => (
                <option key={a.id} value={a.id}>{a.full_name}{a.email ? ` — ${a.email}` : ''}</option>
              ))}
            </select>
          )}
        </div>

        {/* Lista de conversas */}
        <div className="flex-1 overflow-y-auto">
          {filteredConversations.length === 0 && (
            <div className="p-8 text-center text-sm text-slate-400">
              Nenhuma conversa encontrada.
            </div>
          )}
          {filteredConversations.map((chat) => {
            const isActive = chat.id === activeChatId;
            const isGroup = checkIsGroup(chat);
            return (
              <button
                key={chat.id}
                onClick={() => setActiveChatId(chat.id)}
                className={cn(
                  'w-full p-4 flex items-start gap-3 border-b border-white/5 hover:bg-white/5 transition-colors text-left',
                  isActive && 'bg-cyan-500/10 border-l-2 border-l-cyan-500'
                )}
              >
                <div className="w-10 h-10 rounded-full flex items-center justify-center font-bold text-sm shrink-0 bg-white/10 text-white">
                  {isGroup ? <Users className="w-5 h-5" /> : (chat.client?.full_name || '?').charAt(0).toUpperCase()}
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center justify-between gap-2">
                    <span className="font-bold text-sm text-white truncate">
                      {chat.client?.full_name || chat.client?.name || (isGroup ? 'Grupo WhatsApp' : 'Cliente')}
                    </span>
                    <span className="text-[10px] text-slate-400 shrink-0">
                      {chat.last_message_at
                        ? new Date(chat.last_message_at).toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' })
                        : ''}
                    </span>
                  </div>
                  {/* Responsável */}
                  <span className={cn(
                    'text-[10px] font-medium',
                    chat.agent_id ? 'text-emerald-600' : 'text-slate-400'
                  )}>
                    {chat.agent_id ? 'Atribuído' : 'Não atribuído'}
                  </span>
                  {/* Badges */}
                  <div className="flex items-center gap-1.5 mt-1 flex-wrap">
                    {isGroup && (
                      <span className="text-[9px] px-1.5 py-0.5 rounded-full bg-blue-500/10 text-cyan-500 border border-blue-500/20">Grupo</span>
                    )}
                    {chat.ai_enabled !== false && (
                      <span className="text-[9px] px-1.5 py-0.5 rounded-full bg-emerald-500/10 text-emerald-600">IA</span>
                    )}
                    {(chat.unread_count || 0) > 0 && (
                      <span className="text-[9px] px-1.5 py-0.5 rounded-full bg-emerald-500 text-white font-bold ml-auto">
                        {chat.unread_count}
                      </span>
                    )}
                    {chat.status === 'pending' && (
                      <span
                        className="flex h-5 w-5 items-center justify-center rounded-full bg-orange-500 text-white text-[11px] font-bold shadow-sm"
                        title="Aguardando atendimento"
                      >
                        !
                      </span>
                    )}
                  </div>
                </div>
              </button>
            );
          })}
        </div>
      </div>

      {/* ── 2. ÁREA CENTRAL: CHAT ── */}
      <div className={cn(
        "flex-col h-full bg-white/5 relative",
        isMobile && !activeChatId ? "hidden" : "flex-1 flex"
      )}>
        {activeChat ? (
          <>
            {/* Header do Chat */}
            <div className="min-h-16 border-b border-cyan-900/30 px-3 md:px-6 py-2 flex items-center justify-between flex-wrap gap-y-2 shrink-0 bg-white/5">
              <div className="flex items-center gap-2 md:gap-4 min-w-0 flex-1 md:flex-initial">
                {isMobile && (
                  <button
                    onClick={() => setActiveChatId(null)}
                    aria-label="Voltar para conversas"
                    className="p-2 -ml-1 rounded-full text-slate-300 hover:bg-white/5 transition-colors shrink-0"
                  >
                    <ArrowLeft className="w-5 h-5" />
                  </button>
                )}
                <div className="w-10 h-10 rounded-full flex items-center justify-center font-bold text-sm bg-white/10 text-white shrink-0">
                  {isGroupActiveChat ? <Users className="w-5 h-5" /> : (activeChat.client?.full_name || 'C').charAt(0).toUpperCase()}
                </div>
                <div className="min-w-0">
                  <h3 className="text-sm md:text-base font-bold text-white flex items-center gap-2 truncate">
                    {activeChat.client?.full_name || activeChat.client?.name || (isGroupActiveChat ? 'Grupo WhatsApp' : 'Cliente')}
                  </h3>
                  <p className="text-xs text-slate-400 font-medium">
                    {isGroupActiveChat ? `${groupParticipants.length} participantes` : 'Conversa'}
                  </p>
                </div>
              </div>

              {/* Ações do Header */}
              <div className="flex items-center flex-wrap justify-end gap-2 md:gap-4">
                <div className="flex items-center gap-1.5 md:gap-2">
                  <button
                    onClick={handleAccept}
                    disabled={acceptConversation.isPending}
                    className="px-2.5 md:px-3 py-1.5 text-[11px] font-bold rounded-lg bg-emerald-500 hover:bg-emerald-600 text-white transition-colors disabled:opacity-50"
                    title="Aceitar atendimento"
                  >
                    Aceitar
                  </button>
                  <button
                    onClick={() => setShowTransferModal(true)}
                    className="px-2.5 md:px-3 py-1.5 text-[11px] font-bold rounded-lg bg-white/5 hover:bg-white/10 text-slate-300 transition-colors"
                    title="Transferir conversa para outro corretor"
                  >
                    Transferir
                  </button>
                  <button
                    onClick={handleIgnore}
                    className="px-2.5 md:px-3 py-1.5 text-[11px] font-bold rounded-lg bg-white/5 hover:bg-white/10 text-slate-300 transition-colors"
                    title="Ignorar conversa"
                  >
                    Ignorar
                  </button>
                </div>
                {/* FUNIL QUBITS: Dropdown de Estágio (fonte única conversations.stage) */}
                {!isGroupActiveChat && activeChatId && (
                  <select
                    value={activeChat?.stage || 'Contato Cadastrado'}
                    onChange={(e) => handleStageChange(e.target.value)}
                    title="Estágio do funil de qualificação"
                    className="px-2.5 py-1.5 text-[11px] font-semibold rounded-lg bg-white/5 border border-cyan-900/30 text-white outline-none focus:border-cyan-500 transition-colors max-w-[150px] md:max-w-[190px] cursor-pointer"
                  >
                    {ESTAGIOS_FUNIL.map((s) => (
                      <option key={s} value={s} className="bg-slate-900 text-white">
                        {s === 'Qualificado' ? '⭐ ' + s : s}
                      </option>
                    ))}
                  </select>
                )}

                <div className="flex items-center gap-2 bg-emerald-500/10 px-2.5 md:px-3 py-1.5 rounded-full border border-emerald-500/30">
                  <Bot className="w-4 h-4 text-emerald-600" />
                  <span className="text-xs font-bold text-emerald-600 mr-1 md:mr-2">IA</span>
                  <div className="w-8 h-4 bg-emerald-500 rounded-full relative cursor-pointer">
                    <div className="absolute right-0.5 top-0.5 w-3 h-3 bg-white/5 rounded-full"></div>
                  </div>
                </div>

                <div className="flex items-center gap-1 md:border-l md:border-cyan-900/30 md:pl-4">
                  {isGroupActiveChat && (
                    <button
                      className={cn('p-2 rounded-full transition-colors', showParticipants ? 'bg-cyan-500/20 text-cyan-400' : 'text-slate-300 hover:bg-white/5')}
                      onClick={() => setShowParticipants(!showParticipants)}
                      title="Participantes do grupo"
                    >
                      <Users className="w-5 h-5" />
                    </button>
                  )}
                  <button className="p-2 text-slate-300 hover:bg-white/5 rounded-full transition-colors" onClick={() => setShowNotes(!showNotes)}>
                    <Info className="w-5 h-5" />
                  </button>
                  <button className="p-2 text-slate-300 hover:bg-white/5 rounded-full transition-colors">
                    <MoreVertical className="w-5 h-5" />
                  </button>
                </div>
              </div>
            </div>

            {/* Lista de Mensagens */}
            <div className="flex-1 overflow-y-auto p-6 space-y-4">
              {isLoadingMessages ? (
                <div className="flex items-center justify-center h-full text-slate-400 text-xs">Carregando mensagens...</div>
              ) : messages.length === 0 ? (
                <div className="flex flex-col items-center justify-center h-full text-slate-400 text-sm space-y-3">
                  <MessageSquare className="w-10 h-10 text-slate-300" />
                  <p>Inicie a conversa.</p>
                </div>
              ) : (
                messages.map((msg) => {
                  // ── BUG FIX 3: CORREÇÃO DA LÓGICA isAgentSender ──
                  // Só o usuário logado é "Atendimento" (lado direito)
                  const isAgentSender = 
                    msg.sender_id === user?.id || 
                    (msg as any).from_me === true ||
                    false;
                  
                  const senderName = msg.sender?.full_name || msg.sender?.name || (isAgentSender ? 'Você' : 'Participante');
                  
                  // ── AGENT HEADER (P_name + P_dept style from production) ──
                  const agentName = isAgentSender
                    ? (senderName + (profile?.role === 'admin' ? ' - Administração' : profile?.role === 'manager' ? ' - Gestão' : ''))
                    : null;

                  // ── GROUP LEAD HEADER: sender name + phone ──
                  const showGroupHeader = isGroupActiveChat && !isAgentSender && (msg.sender?.full_name || msg.sender?.phone);
                  const groupSenderLabel = msg.sender?.full_name || 'Desconhecido';
                  const groupSenderPhone = msg.sender?.phone || null;

                  const messageContent = msg.content || '';
                  const isAudioMessage = msg.message_type === 'audio' || messageContent.startsWith('[Audio]') || messageContent.startsWith('[audio]');
                  const isImageMessage = msg.message_type === 'image' || messageContent.startsWith('[Image]') || messageContent.startsWith('[image]');
                  const isVideoMessage = msg.message_type === 'video' || messageContent.startsWith('[Video]') || messageContent.startsWith('[video]');
                  const isDocumentMessage = msg.message_type === 'document' || messageContent.startsWith('[Arquivo]') || messageContent.startsWith('[Documento]');
                  const isSystemMessage = msg.message_type === 'system';

                  // Extract URL from content pattern: [Type] filename\nurl
                  const extractUrl = (content: string): string | null => {
                    const lines = content.split('\n');
                    return lines.length > 1 ? lines[lines.length - 1].trim() : null;
                  };
                  const mediaUrl = extractUrl(messageContent);
                  const audioFileName = messageContent.includes('.ogg') ? messageContent.split('\n')[0]?.replace('[Audio] ', '') : null;

                  return (
                    <div key={msg.id} className={`flex flex-col ${isAgentSender ? 'items-end' : 'items-start'} ${isSystemMessage ? 'items-center w-full' : ''}`}>
                      {/* GROUP LEAD HEADER: nome + telefone do participante */}
                      {showGroupHeader && (
                        <div className="flex items-center gap-1 ml-1 mb-0.5 max-w-[300px]">
                          <span className="text-[10px] font-semibold text-slate-400 ml-1 truncate">
                            {groupSenderLabel}
                          </span>
                          {groupSenderPhone && (
                            <span className="text-[10px] font-normal text-slate-400 opacity-75 ml-0.5">
                              ({groupSenderPhone})
                            </span>
                          )}
                        </div>
                      )}

                      {/* AGENT HEADER: nome + departamento */}
                      {isAgentSender && !isSystemMessage && (
                        <div className="text-[10px] font-semibold text-muted-foreground mr-1 mb-0.5 max-w-[300px] truncate text-right">
                          {agentName}
                        </div>
                      )}

                      {/* SYSTEM MESSAGE (centralized) */}
                      {isSystemMessage ? (
                        <div className="bg-muted/50 border border-border text-center mx-auto text-xs font-medium py-1 px-3 rounded-full">
                          {messageContent.replace('[system] ', '')}
                        </div>
                      ) : isAudioMessage && mediaUrl ? (
                        /* ── AUDIO PLAYER ── */
                        <div className={cn(
                          'max-w-[85%] sm:max-w-[75%] rounded-2xl p-3 shadow-sm',
                          isAgentSender
                            ? 'bg-emerald-500/10 border border-emerald-500/20 rounded-tr-none'
                            : 'bg-white/5 border border-cyan-900/30 rounded-tl-none'
                        )}>
                          <audio controls className="w-full h-10" preload="metadata">
                            <source src={mediaUrl} type="audio/ogg; codecs=opus" />
                            <source src={mediaUrl} type="audio/ogg" />
                            <source src={mediaUrl.replace('.ogg', '.webm')} type="audio/webm" />
                            <source src={mediaUrl} type="audio/mpeg" />
                            <source src={mediaUrl} type="audio/mp4" />
                          </audio>
                          {/* Gatilho contextual: reportar falha do áudio enviado */}
                          {isAgentSender && (
                            <button
                              type="button"
                              onClick={handleAudioFail}
                              title="Este áudio não reproduziu? Reportar falha"
                              className="mt-2 flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-red-500/10 hover:bg-red-500/20 text-red-400 text-[10px] font-bold uppercase tracking-wide border border-red-500/20 transition-colors"
                            >
                              <AlertTriangle className="w-3.5 h-3.5" /> Falhou Áudio
                            </button>
                          )}
                        </div>
                      ) : isImageMessage && mediaUrl ? (
                        /* ── IMAGE ── */
                        <div className={cn(
                          'max-w-[85%] sm:max-w-[75%] rounded-2xl overflow-hidden shadow-sm',
                          isAgentSender
                            ? 'rounded-tr-none'
                            : 'rounded-tl-none'
                        )}>
                          <img src={mediaUrl} alt="Imagem" className="w-full h-auto max-h-80 object-contain bg-white/5"
                            onClick={() => window.open(mediaUrl, '_blank')} />
                        </div>
                      ) : isVideoMessage && mediaUrl ? (
                        /* ── VIDEO ── */
                        <div className={cn(
                          'max-w-[85%] sm:max-w-[75%] rounded-2xl overflow-hidden shadow-sm',
                          isAgentSender ? 'rounded-tr-none' : 'rounded-tl-none'
                        )}>
                          <video controls className="w-full max-h-80" preload="metadata">
                            <source src={mediaUrl} />
                          </video>
                        </div>
                      ) : isDocumentMessage && mediaUrl ? (
                        /* ── DOCUMENT ── */
                        <a href={mediaUrl} target="_blank" rel="noopener noreferrer"
                          className={cn(
                            'flex items-center gap-3 max-w-[85%] sm:max-w-[75%] rounded-2xl px-4 py-3 shadow-sm text-sm font-medium',
                            isAgentSender
                              ? 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 rounded-tr-none'
                              : 'bg-white/5 text-slate-300 border border-cyan-900/30 rounded-tl-none'
                          )}>
                          <FileText className="w-5 h-5 shrink-0" />
                          <span className="truncate">{audioFileName || 'Documento'}</span>
                        </a>
                      ) : (
                        /* ── TEXT ── */
                        <div className={cn(
                          'max-w-[75%] sm:max-w-[70%] rounded-2xl px-4 py-3 text-[13px] leading-relaxed shadow-sm',
                          isAgentSender 
                            ? 'bg-emerald-500/10 text-white rounded-tr-none border border-emerald-500/20' 
                            : 'bg-white/5 text-white rounded-tl-none border border-cyan-900/30'
                        )}>
                          <p className="whitespace-pre-line break-words">{messageContent}</p>
                        </div>
                      )}

                      {/* TIMESTAMP */}
                      {!isSystemMessage && (
                        <div className={cn(
                          'flex items-center gap-1 text-[10px] mt-0.5',
                          isAgentSender ? 'text-slate-400 justify-end' : 'text-slate-400 justify-start'
                        )}>
                          <span>{new Date(msg.created_at).toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' })}</span>
                          {isAgentSender && <CheckCheck className="w-3 h-3 text-emerald-500" />}
                        </div>
                      )}
                    </div>
                  );
                })
              )}
              <div ref={messagesEndRef} />
            </div>

            {/* Input de Mensagem */}
            <div className="border-t border-cyan-900/30 bg-white/5">
              {/* Atalhos */}
              <div className="px-4 py-3 flex items-center gap-2 border-b border-white/5 overflow-x-auto no-scrollbar bg-white/[0.03] action-dropdown-container">
                <div className="relative">
                  <button onClick={() => setActiveDropdown(activeDropdown === 'message' ? null : 'message')} className="flex items-center gap-2 px-4 py-2 rounded-xl bg-cyan-500/20 hover:bg-cyan-500/30 text-cyan-300 text-[11px] font-black uppercase tracking-wider transition-colors whitespace-nowrap shadow-sm border border-cyan-500/30">
                    <MessageSquare className="w-4 h-4" /> Agendar
                  </button>
                  {activeDropdown === 'message' && (
                    <div className="absolute bottom-full mb-2 left-0 w-64 bg-white/5 rounded-xl shadow-xl border border-cyan-900/30 p-4 z-50">
                      <h4 className="text-sm font-bold text-slate-200 mb-3">Agendar Mensagem</h4>
                      <input type="date" className="w-full mb-2 text-sm p-2 border border-cyan-900/30 rounded-lg" value={scheduleData.date} onChange={e => setScheduleData({...scheduleData, date: e.target.value})} />
                      <input type="time" className="w-full mb-2 text-sm p-2 border border-cyan-900/30 rounded-lg" value={scheduleData.time} onChange={e => setScheduleData({...scheduleData, time: e.target.value})} />
                      <textarea placeholder="Mensagem..." className="w-full mb-3 text-sm p-2 border border-cyan-900/30 rounded-lg resize-none" rows={2} value={scheduleData.message} onChange={e => setScheduleData({...scheduleData, message: e.target.value})} />
                      <button onClick={() => { alert('Mensagem agendada!'); setActiveDropdown(null); }} className="w-full py-2 bg-cyan-500 text-white rounded-lg text-xs font-bold uppercase">Confirmar</button>
                    </div>
                  )}
                </div>

                <div className="relative">
                  <button onClick={() => setActiveDropdown(activeDropdown === 'call' ? null : 'call')} className="flex items-center gap-2 px-4 py-2 rounded-xl bg-cyan-500/20 hover:bg-cyan-500/30 text-cyan-300 text-[11px] font-black uppercase tracking-wider transition-colors whitespace-nowrap shadow-sm border border-cyan-500/30">
                    <Phone className="w-4 h-4" /> Ligação
                  </button>
                  {activeDropdown === 'call' && (
                    <div className="absolute bottom-full mb-2 left-0 w-56 bg-white/5 rounded-xl shadow-xl border border-cyan-900/30 p-4 z-50">
                      <h4 className="text-sm font-bold text-slate-200 mb-3">Registrar Ligação</h4>
                      <select className="w-full mb-2 text-sm p-2 border border-cyan-900/30 rounded-lg">
                        <option>Realizada</option><option>Recebida</option><option>Não atendeu</option>
                      </select>
                      <textarea placeholder="Anotações..." className="w-full mb-3 text-sm p-2 border border-cyan-900/30 rounded-lg resize-none" rows={2} />
                      <button className="w-full py-2 bg-emerald-500 text-white rounded-lg text-xs font-bold uppercase">Registrar</button>
                    </div>
                  )}
                </div>

                <div className="relative">
                  <button onClick={() => setActiveDropdown(activeDropdown === 'visit' ? null : 'visit')} className="flex items-center gap-2 px-4 py-2 rounded-xl bg-cyan-500/20 hover:bg-cyan-500/30 text-cyan-300 text-[11px] font-black uppercase tracking-wider transition-colors whitespace-nowrap shadow-sm border border-cyan-500/30">
                    <Calendar className="w-4 h-4" /> Visita
                  </button>
                  {activeDropdown === 'visit' && (
                    <div className="absolute bottom-full mb-2 left-0 w-64 bg-white/5 rounded-xl shadow-xl border border-cyan-900/30 p-4 z-50">
                      <h4 className="text-sm font-bold text-slate-200 mb-3">Agendar Visita</h4>
                      <input type="date" className="w-full mb-2 text-sm p-2 border border-cyan-900/30 rounded-lg" />
                      <input type="time" className="w-full mb-2 text-sm p-2 border border-cyan-900/30 rounded-lg" />
                      <div className="space-y-1.5 mb-3">
                        <label className="text-xs font-bold text-slate-300">Imóvel / local</label>
                        <AsyncCombobox
                          placeholder="Buscar imóvel ou local..."
                          table="properties"
                          searchFields={["title"]}
                          selectFields="id,title"
                          labelField="title"
                          value={visitPropertyId}
                          onChange={(item: LookupItem | null) => setVisitPropertyId(item?.id || '')}
                        />
                      </div>
                      <button className="w-full py-2 bg-emerald-500 text-white rounded-lg text-xs font-bold uppercase">Confirmar</button>
                    </div>
                  )}
                </div>

                {/* Gatilho Áudio Fail-Safe (Ada): discreto na barra de ações */}
                <div className="relative">
                  <button
                    type="button"
                    onClick={handleAudioFail}
                    disabled={!activeChat}
                    title="Áudio não reproduziu? Reportar falha nesta conversa"
                    className="flex items-center gap-2 px-4 py-2 rounded-xl bg-red-500/10 hover:bg-red-500/20 text-red-400 text-[11px] font-black uppercase tracking-wider transition-colors whitespace-nowrap shadow-sm border border-red-500/20 disabled:opacity-40"
                  >
                    <AlertTriangle className="w-4 h-4" /> Falhou Áudio
                  </button>
                </div>
              </div>

              <form onSubmit={handleSendMessage} className="p-4 flex items-end gap-3 w-full">
                <button type="button" className="p-2 text-slate-400 hover:text-slate-300 hover:bg-white/5 rounded-full transition-colors shrink-0">
                  <Paperclip className="w-5 h-5" />
                </button>
                <textarea 
                  placeholder="Digite sua mensagem..."
                  value={messageInput}
                  onChange={(e) => {
                    setMessageInput(e.target.value);
                    // Auto-ajusta altura vertical
                    e.target.style.height = 'auto';
                    e.target.style.height = Math.min(e.target.scrollHeight, 200) + 'px';
                  }}
                  onKeyDown={(e) => {
                    const isMac = e.metaKey;
                    // Helpers para inserir quebra de linha na posição do cursor
                    const insertNewline = () => {
                      e.preventDefault();
                      const target = e.target as HTMLTextAreaElement;
                      const start = target.selectionStart;
                      const val = target.value;
                      const newVal = val.slice(0, start) + '\n' + val.slice(target.selectionEnd);
                      setMessageInput(newVal);
                      requestAnimationFrame(() => {
                        target.style.height = 'auto';
                        target.style.height = Math.min(target.scrollHeight, 200) + 'px';
                      });
                    };

                    if (e.key === 'Enter') {
                      if (isMac && !e.shiftKey && !e.ctrlKey) {
                        // ⌘ + Enter = quebra linha (Mac)
                        insertNewline();
                        return;
                      }
                      if (e.ctrlKey && !e.shiftKey) {
                        // Ctrl + Enter = quebra linha (Win/Linux)
                        insertNewline();
                        return;
                      }
                      // Enter SEM modificador = envia
                      if (!e.shiftKey && !e.ctrlKey && !e.metaKey) {
                        e.preventDefault();
                        handleSendMessage();
                        return;
                      }
                      // Shift + Enter = quebra linha nativa do textarea (Mac/Win/Linux) — não intercepta
                      return;
                    }
                    // Ctrl+Espaço (Mac / Win / Linux) = quebra linha
                    if (e.key === ' ' && e.ctrlKey) {
                      insertNewline();
                    }
                  }}
                  rows={1}
                  className="flex-1 bg-white/5 border border-cyan-900/30 focus:border-cyan-500 focus:ring-2 focus:ring-cyan-500/20 rounded-2xl py-3 px-4 text-sm text-white placeholder-slate-400 outline-none transition-all resize-none overflow-y-auto whitespace-pre-wrap min-h-[44px] max-h-[200px]"
                />
                {messageInput.trim() ? (
                  <button type="submit" disabled={sendMessageMutation.isPending} className="p-3 rounded-full bg-cyan-500 hover:bg-cyan-600 disabled:opacity-50 text-white transition-all shadow-md shrink-0">
                    <Send className="w-5 h-5" />
                  </button>
                ) : (
                  <button type="button" className="p-3 rounded-full bg-white/5 hover:bg-white/10 text-slate-300 transition-all shrink-0">
                    <Mic className="w-5 h-5" />
                  </button>
                )}
              </form>
            </div>
          </>
        ) : (
          <div className="flex flex-col items-center justify-center h-full text-slate-400 text-sm space-y-4">
            <MessageSquare className="w-16 h-16 text-slate-200" />
            <p>Selecione uma conversa para iniciar o atendimento.</p>
          </div>
        )}
      </div>

      {/* ── 3. SIDEBAR DIREITA: PARTICIPANTES DO GRUPO (BUG FIX 1) ── */}
      {activeChat && isGroupActiveChat && showParticipants && (
        <div className={cn(
          "border-l border-cyan-900/30 bg-white/5 flex flex-col shrink-0",
          isMobile ? "absolute right-0 top-0 bottom-0 w-[85%] max-w-xs z-30 shadow-2xl overflow-y-auto" : "w-72"
        )}>
          <div className="p-4 border-b border-white/5 flex items-center justify-between">
            <h3 className="text-sm font-bold text-white flex items-center gap-2">
              <Users className="w-4 h-4 text-cyan-500" /> Participantes
              <span className="text-xs font-medium text-slate-400">({groupParticipants.length})</span>
            </h3>
            <button onClick={() => setShowParticipants(false)} className="text-slate-400 hover:text-slate-300">
              <X className="w-4 h-4" />
            </button>
          </div>
          <div className="flex-1 overflow-y-auto p-4 space-y-2">
            {groupParticipants.length === 0 && (
              <p className="text-xs text-slate-400 text-center py-8">
                Nenhum participante carregado.
              </p>
            )}
            {groupParticipants.map((p, i) => {
              const nome = p.full_name || p.profile?.full_name || p.profile?.phone || p.phone || `Membro ${i + 1}`;
              const phone = p.phone || p.profile?.phone || '';
              return (
                <div key={p.profile_id || i} className="flex items-center gap-3 p-2 rounded-xl hover:bg-white/5 transition-colors">
                  <div className="w-8 h-8 rounded-full bg-white/10 flex items-center justify-center text-xs font-bold text-slate-300 shrink-0">
                    {(nome as string).charAt(0).toUpperCase()}
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-semibold text-white truncate">{nome}</p>
                    {phone && <p className="text-[10px] text-slate-400">{phone}</p>}
                  </div>
                  <button className="text-slate-400 hover:text-cyan-400 p-1 rounded-full hover:bg-cyan-500/10 transition-colors" title="Chamar no privado">
                    <MessageSquare className="w-3.5 h-3.5" />
                  </button>
                </div>
              );
            })}
            {groupParticipants.length === 0 && isGroupActiveChat && (
              <p className="text-xs text-slate-400 text-center py-8">
                Participantes indisponíveis. <br/>O WhatsApp precisa estar conectado.
              </p>
            )}
          </div>
        </div>
      )}

      {/* ── 3b. SIDEBAR DIREITA: NOTAS ── */}
      {activeChat && showNotes && (
        <div className={cn(
          "border-l border-cyan-900/30 bg-white/5 flex flex-col shrink-0",
          isMobile ? "absolute right-0 top-0 bottom-0 w-[85%] max-w-xs z-30 shadow-2xl overflow-y-auto" : "w-72"
        )}>
          <div className="p-4 border-b border-white/5 flex items-center justify-between">
            <h3 className="text-sm font-bold text-white">Anotações Internas</h3>
            <button onClick={() => setShowNotes(false)} className="text-slate-400 hover:text-slate-300">
              <X className="w-4 h-4" />
            </button>
          </div>
          <div className="flex-1 p-4 flex flex-col gap-4 overflow-y-auto">
            <div className="bg-yellow-500/10 border border-yellow-100 rounded-xl p-3">
              <p className="text-[10px] text-yellow-800 font-medium leading-relaxed">
                <Info className="w-3 h-3 inline mr-1" /> 
                Anotações visíveis <strong>apenas para a equipe interna</strong>.
              </p>
            </div>
            <div className="flex-1 flex flex-col gap-2">
              <label className="text-xs font-bold text-slate-300">Notas sobre o Lead</label>
              <textarea 
                placeholder="Escreva detalhes importantes..."
                value={leadNotes}
                onChange={(e) => setLeadNotes(e.target.value)}
                className="flex-1 bg-white/5 border border-cyan-900/30 focus:border-cyan-500 rounded-xl p-3 text-sm text-slate-300 resize-none outline-none"
              />
            </div>
            <button className="w-full py-2 bg-[#0a0a0a] text-white text-sm font-bold rounded-xl hover:bg-white/10 transition-colors">
              Salvar Notas
            </button>
          </div>
        </div>
      )}

      {/* ── DASHBOARD / RANKING MODAL ── */}
      {showRanking && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 backdrop-blur-sm p-4" onClick={() => setShowRanking(false)}>
          <div className="bg-white/5 rounded-2xl max-w-lg w-full p-6 shadow-2xl" onClick={(e) => e.stopPropagation()}>
            <div className="flex items-center justify-between mb-6">
              <h3 className="text-lg font-bold text-white flex items-center gap-2">
                <Award className="w-5 h-5 text-cyan-500" /> Ranking de Corretores
              </h3>
              <button onClick={() => setShowRanking(false)} className="text-slate-400 hover:text-slate-300 p-1"><X className="w-5 h-5" /></button>
            </div>
            <div className="space-y-2">
              {ranking.map((r, i) => (
                <div key={r.agent_id} className={cn(
                  'flex items-center gap-3 p-3 rounded-xl',
                  i === 0 ? 'bg-yellow-500/10 border border-yellow-500/30' :
                  i === 1 ? 'bg-white/5 border border-cyan-900/30' :
                  i === 2 ? 'bg-cyan-500/10 border border-cyan-500/30' :
                  'bg-white/5 border border-white/5'
                )}>
                  <span className={cn(
                    'w-7 h-7 rounded-full flex items-center justify-center text-xs font-bold',
                    i === 0 ? 'bg-amber-500/20 text-amber-300' :
                    i === 1 ? 'bg-slate-400/20 text-slate-400' :
                    i === 2 ? 'bg-cyan-500/20 text-cyan-400' :
                    'bg-white/5 text-slate-400'
                  )}>{i + 1}º</span>
                  <div className="flex-1">
                    <p className="text-sm font-bold text-white">{r.full_name}</p>
                    <p className="text-xs text-slate-400">{r.contatos} contatos</p>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* MODAL DE ADICIONAR CONTATO */}
      {showAddContactModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 backdrop-blur-sm p-4">
          <div className="bg-[#0a0a0a] border border-slate-800 rounded-3xl max-w-md w-full p-6 space-y-6 shadow-2xl">
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
              <button onClick={() => setShowAddContactModal(false)} className="text-slate-400 hover:text-white p-2 rounded-xl hover:bg-white/10 transition-colors">
                <X className="w-5 h-5" />
              </button>
            </div>
            <form onSubmit={handleAddContact} className="space-y-4">
              <div className="space-y-2">
                <label className="text-xs font-semibold text-slate-400 uppercase tracking-wider">Nome Completo *</label>
                <input type="text" required placeholder="Nome do Cliente" value={newContact.name} onChange={e => setNewContact({...newContact, name: e.target.value})}
                  className="w-full bg-slate-950/50 border border-slate-800 rounded-xl px-4 py-3 text-sm text-white focus:outline-none focus:ring-2 focus:ring-emerald-500/50 focus:border-emerald-500/50 transition-all placeholder:text-slate-300" />
              </div>
              <div className="space-y-2">
                <label className="text-xs font-semibold text-slate-400 uppercase tracking-wider">Telefone *</label>
                <input type="tel" required placeholder="(41) 99999-9999" value={newContact.phone} onChange={e => setNewContact({...newContact, phone: e.target.value})}
                  className="w-full bg-slate-950/50 border border-slate-800 rounded-xl px-4 py-3 text-sm text-white focus:outline-none focus:ring-2 focus:ring-emerald-500/50 focus:border-emerald-500/50 transition-all placeholder:text-slate-300" />
              </div>
              <div className="space-y-2">
                <label className="text-xs font-semibold text-slate-400 uppercase tracking-wider">E-mail (opcional)</label>
                <input type="email" placeholder="cliente@email.com" value={newContact.email} onChange={e => setNewContact({...newContact, email: e.target.value})}
                  className="w-full bg-slate-950/50 border border-slate-800 rounded-xl px-4 py-3 text-sm text-white focus:outline-none focus:ring-2 focus:ring-emerald-500/50 focus:border-emerald-500/50 transition-all placeholder:text-slate-300" />
              </div>
              <button type="submit" className="w-full py-3 bg-emerald-500 hover:bg-emerald-600 text-white font-bold rounded-xl transition-colors">
                Adicionar & Iniciar Conversa
              </button>
            </form>
          </div>
        </div>
      )}

      {/* ── TRANSFER MODAL ── */}
      {showTransferModal && activeChat && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 backdrop-blur-sm p-4" onClick={() => setShowTransferModal(false)}>
          <div className="bg-[#0a0a0a] border border-slate-800 rounded-3xl max-w-md w-full p-6 space-y-6 shadow-2xl" onClick={(e) => e.stopPropagation()}>
            <div className="flex items-center justify-between border-b border-slate-800 pb-4">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-cyan-500/10 text-cyan-400 flex items-center justify-center">
                  <Users className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="text-base font-bold text-white">Transferir Conversa</h3>
                  <p className="text-xs text-slate-400">
                    {activeChat.client?.full_name || 'Cliente'} → Novo corretor
                  </p>
                </div>
              </div>
              <button onClick={() => setShowTransferModal(false)} className="text-slate-400 hover:text-white p-2 rounded-xl hover:bg-white/10 transition-colors">
                <X className="w-5 h-5" />
              </button>
            </div>
            <div className="space-y-2">
              <label className="text-xs font-semibold text-slate-400 uppercase tracking-wider">Selecionar Corretor</label>
              <select
                value={transferTargetAgent}
                onChange={(e) => setTransferTargetAgent(e.target.value)}
                className="w-full bg-slate-950/50 border border-slate-800 rounded-xl px-4 py-3 text-sm text-white focus:outline-none focus:ring-2 focus:ring-cyan-500/50 transition-all"
              >
                <option value="">Selecione um corretor...</option>
                {agents.filter((a: any) => a.id !== activeChat?.agent_id).map((a: any) => (
                  <option key={a.id} value={a.id}>{a.full_name}{a.email ? ` — ${a.email}` : ''}</option>
                ))}
              </select>
            </div>
            <div className="flex items-center gap-3 pt-2">
              <button
                onClick={() => setShowTransferModal(false)}
                className="flex-1 py-3 bg-white/5 hover:bg-white/10 text-slate-300 font-bold rounded-xl text-sm transition-colors"
              >
                Cancelar
              </button>
              <button
                onClick={async () => {
                  if (!transferTargetAgent) return;
                  await handleTransfer(transferTargetAgent);
                  setShowTransferModal(false);
                  setTransferTargetAgent('');
                }}
                disabled={!transferTargetAgent || transferConversation.isPending}
                className="flex-1 py-3 bg-cyan-500 hover:bg-cyan-600 disabled:opacity-50 text-white font-bold rounded-xl text-sm transition-all"
              >
                {transferConversation.isPending ? 'Transferindo...' : 'Confirmar Transferência'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ── WHATSAPP CONNECTION MODAL ── */}
      <WhatsAppConnectionModal 
        isOpen={whatsappModalOpen} 
        onClose={() => setWhatsappModalOpen(false)} 
      />

      {/* ── PROTOCOLO ÁUDIO FAIL-SAFE (Ada): POPUP IMORTAL DE RESOLUÇÃO ── */}
      {/* Não fecha com click-fora nem Escape. Só fecha ao clicar em [Sim]. */}
      {showAudioFailHelp && (
        <div
          className="fixed bottom-6 right-6 z-[100] w-72 rounded-2xl border border-cyan-900/30 bg-[#0c0f18]/95 backdrop-blur-md shadow-2xl p-4 space-y-3"
          onClick={(e) => e.stopPropagation()}
          onPointerDown={(e) => e.stopPropagation()}
          onKeyDown={(e) => e.stopPropagation()}
          role="alertdialog"
          aria-modal="true"
        >
          <div className="flex items-start gap-3">
            <div className="w-9 h-9 rounded-xl bg-red-500/10 text-red-400 flex items-center justify-center shrink-0">
              <AlertTriangle className="w-5 h-5" />
            </div>
            <div className="flex-1 min-w-0">
              <h4 className="text-sm font-bold text-white">Falha de áudio</h4>
              <p className="text-[11px] text-slate-400 mt-0.5">
                O áudio de{' '}
                <span className="text-emerald-400 font-semibold truncate">
                  {activeChat?.client?.full_name || activeChat?.client?.name || 'lead'}
                </span>{' '}
                não foi reproduzido.
              </p>
            </div>
          </div>
          <div>
            <p className="text-xs font-semibold text-slate-200 mb-2">Áudio solucionado?</p>
            <button
              onClick={handleAudioResolved}
              className="w-full flex items-center justify-center gap-2 py-2.5 rounded-xl bg-emerald-500 hover:bg-emerald-600 text-white text-xs font-black uppercase tracking-wider transition-all shadow-md"
            >
              <Check className="w-4 h-4" /> Sim, resolvido
            </button>
          </div>
        </div>
      )}
    </div>
  );
}