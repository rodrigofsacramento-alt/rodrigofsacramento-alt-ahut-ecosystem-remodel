import React, { useState, useEffect, useRef, useCallback } from 'react';
import { useQuery } from '@tanstack/react-query';
import { useTechTickets, useUpsertTechTicket, mergeTickets, rowToTicket, ticketToRow, TechTicketRow } from '../hooks/useTechTickets';
import { useAuth } from '../hooks/useAuth';
import { supabase } from '../lib/supabase';
import {
  Monitor,
  Plus,
  Search,
  Filter,
  Calendar,
  Clock,
  CheckCircle2,
  GitBranch,
  MoreVertical,
  Trash2,
  Edit3,
  X,
  Sparkles,
  Code2,
  Bot,
  User,
  Paperclip,
  Mic,
  Send,
  Image as ImageIcon,
  FileText,
  Eye,
  Check,
  SlidersHorizontal,
  Activity,
  Building2,
  Briefcase,
  Video,
  TrendingUp,
  Users,
  Target,
  GripVertical
} from 'lucide-react';

export type TicketPriority = 'critica' | 'alta' | 'media' | 'baixa';
export type TicketMainStatus = 'a_analisar' | 'a_executar' | 'executando' | 'executado';
export type TicketSubcategory =
  | 'nao_especificado'
  | 'em_planejamento'
  | 'em_aplicacao'
  | 'em_validacao'
  | 'atualizado'
  | 'backup_realizado';

export interface TicketAttachment {
  id: string;
  name: string;
  type: 'image' | 'doc' | 'audio' | 'video';
  url: string;
  size?: string;
  duration?: string;
  transcription?: string;
}

export interface ChatMessage {
  id: string;
  sender: 'ai' | 'user';
  text: string;
  timestamp: string;
  attachments?: TicketAttachment[];
  suggestions?: string[];
}

export interface TechTicket {
  id: string;
  code: string;
  title: string;
  description: string;
  module: string;
  requesterName: string;
  requesterRole: string;
  requesterDepartment: string;
  requesterAvatar?: string;
  priority: TicketPriority;
  main_status: TicketMainStatus;
  subcategory: TicketSubcategory;
  delivery_forecast: string;
  created_at: string;
  assigned_to: string;
  impact_level: 'Alto' | 'Médio' | 'Baixo';
  is_ai_triaged: boolean;
  business_impact?: string;
  acceptance_criteria?: string[];
  chat_transcript?: ChatMessage[];
  attachments?: TicketAttachment[];
  timeline?: { status: string; date: string; user: string }[];
}

const INITIAL_TICKETS: TechTicket[] = [
  {
    id: 'ticket-101',
    code: 'TCK-2026-081',
    title: 'Cadastro de Usuário CTO & Níveis de Permissão de Sistema',
    description: 'Criar perfil de acesso de alta autoridade para desenvolvedores (CTO) com controle granular de logs de auditoria e acesso a tabelas críticas.',
    module: 'Autenticação & Segurança',
    requesterName: 'Christian Eracanelli',
    requesterRole: 'Fundador & CTO',
    requesterDepartment: 'Diretoria & Tech',
    priority: 'alta',
    main_status: 'executado',
    subcategory: 'backup_realizado',
    delivery_forecast: '2026-08-18',
    created_at: '2026-08-16T14:30:00Z',
    assigned_to: 'Squad Ahut Tech (CTO)',
    impact_level: 'Alto',
    is_ai_triaged: true,
    business_impact: 'Permite que a equipe técnica opere manutenções sem necessitar de senhas mestras de produção.',
    acceptance_criteria: [
      'Novo cargo "CTO" adicionado na base de dados',
      'Validação de tokens JWT com claims de desenvolvedor',
      'Log de todas as ações sensíveis no console de segurança'
    ],
    attachments: [
      { id: 'att-1', name: 'matriz_permissoes.pdf', type: 'doc', url: '#', size: '240 KB' }
    ],
    timeline: [
      { status: 'Chamado Aberto', date: '16/08 14:30', user: 'Christian Eracanelli' },
      { status: 'Aprovado para Execução', date: '16/08 15:00', user: 'IA Tech Lead' },
      { status: 'Em Aplicação', date: '17/08 09:00', user: 'Squad Ahut Tech' },
      { status: 'Backup Realizado (GitHub)', date: '18/08 18:20', user: 'DevOps Bot' }
    ]
  },
  {
    id: 'ticket-102',
    code: 'TCK-2026-082',
    title: 'Módulo Tecnologia & Kanban Inteligente com Agente AVA',
    description: 'Implementar tela de gestão de chamados com esteira kanban de 4 estágios e agente conversacional AVA para triagem de solicitações da equipe imobiliária.',
    module: 'Frontend & UI',
    requesterName: 'Rodrigo Sacramento',
    requesterRole: 'Gestão de Operações',
    requesterDepartment: 'Operações Ahut',
    priority: 'critica',
    main_status: 'executando',
    subcategory: 'em_validacao',
    delivery_forecast: '2026-08-20',
    created_at: '2026-08-19T09:15:00Z',
    assigned_to: 'Squad Ahut Tech (CTO)',
    impact_level: 'Alto',
    is_ai_triaged: true,
    business_impact: 'Centraliza todas as requisições de melhoria do ecossistema e elimina ruídos de comunicação entre setores e TI.',
    acceptance_criteria: [
      'Coluna "A Analisar" integrada',
      'Assistente de Triagem AVA com upload de imagem e gravação de áudio',
      'Card detalhado padrão Enterprise multinacional'
    ],
    attachments: [
      { id: 'att-2', name: 'mockup_fluxo_agentes.png', type: 'image', url: '#', size: '1.2 MB' },
      { id: 'att-3', name: 'audio_explicacao_rodrigo.mp3', type: 'audio', url: '#', duration: '0:42' }
    ],
    timeline: [
      { status: 'Triado por IA (AVA)', date: '19/08 09:20', user: 'Agente AVA' },
      { status: 'Aprovado pelo CTO', date: '19/08 10:00', user: 'Squad Ahut Tech' },
      { status: 'Em Validação', date: '19/08 12:45', user: 'Squad Ahut Tech' }
    ]
  },
  {
    id: 'ticket-103',
    code: 'TCK-2026-083',
    title: 'Otimização do Pipeline de Build e Purge Automático LiteSpeed',
    description: 'Ajustar scripts de deploy para purgar automaticamente o cache do LiteSpeed Web Server e evitar problemas de cache de scripts antigos no navegador.',
    module: 'DevOps & VPS',
    requesterName: 'Lucas Ferreira',
    requesterRole: 'Engenheiro de Suporte',
    requesterDepartment: 'Tecnologia & Suporte',
    priority: 'media',
    main_status: 'executando',
    subcategory: 'em_aplicacao',
    delivery_forecast: '2026-08-21',
    created_at: '2026-08-18T16:00:00Z',
    assigned_to: 'Squad Ahut Tech (DevOps)',
    impact_level: 'Médio',
    is_ai_triaged: false,
    business_impact: 'Garante que os clientes vejam as atualizações imediatamente após o deploy sem precisar dar Ctrl+F5.',
    acceptance_criteria: [
      'Hook de purge disparado após upload SFTP',
      'Tempo total de deploy inferior a 20 segundos'
    ],
    timeline: [
      { status: 'Criado no Kanban', date: '18/08 16:00', user: 'Lucas Ferreira' },
      { status: 'Em Aplicação', date: '19/08 08:30', user: 'DevOps' }
    ]
  },
  {
    id: 'ticket-104',
    code: 'TCK-2026-084',
    title: 'Refatoração da Arquitetura do Webhook WhatsApp Broker',
    description: 'Planejar nova rotina de conciliação de mensagens com fila assíncrona para suportar picos de 500 mensagens/min sem delay no chat de corretores.',
    module: 'Central de Atendimento / WhatsApp',
    requesterName: 'Juliana Costa',
    requesterRole: 'Supervisora de Atendimento',
    requesterDepartment: 'Atendimento & WhatsApp',
    priority: 'alta',
    main_status: 'executando',
    subcategory: 'em_planejamento',
    delivery_forecast: '2026-08-22',
    created_at: '2026-08-19T08:00:00Z',
    assigned_to: 'Squad Ahut Tech (Backend)',
    impact_level: 'Alto',
    is_ai_triaged: true,
    business_impact: 'Evita perda de mensagens de leads em horários de pico comercial.',
    acceptance_criteria: [
      'Worker assíncrono para processar payloads de webhook',
      'Tratamento de retry automático com backoff exponencial'
    ],
    attachments: [
      { id: 'att-4', name: 'print_fila_atrasada.png', type: 'image', url: '#', size: '680 KB' }
    ],
    timeline: [
      { status: 'Triado por IA (AVA)', date: '19/08 08:05', user: 'Agente AVA' },
      { status: 'Em Planejamento de Arquitetura', date: '19/08 09:30', user: 'Tech Lead' }
    ]
  },
  {
    id: 'ticket-105',
    code: 'TCK-2026-085',
    title: 'Distribuição Automática de Leads por Performance (15min timeout)',
    description: 'Caso o admin não distribua o lead em 15 min para um corretor, o sistema realiza distribuição automatizada priorizando corretores com maior score/conversão (ex: 70% líder, 30% vice-líder).',
    module: 'Leads & CRM',
    requesterName: 'João Martins',
    requesterRole: 'Gestor Comercial',
    requesterDepartment: 'Comercial & Vendas',
    priority: 'alta',
    main_status: 'a_analisar',
    subcategory: 'nao_especificado',
    delivery_forecast: '2026-08-24',
    created_at: '2026-08-19T11:20:00Z',
    assigned_to: 'Aguardando Atribuição',
    impact_level: 'Alto',
    is_ai_triaged: true,
    business_impact: 'Elimina lead parado sem atendimento e premia corretores de alta performance na conversão.',
    acceptance_criteria: [
      'Cron job verificador a cada 1 minuto para leads pendentes > 15min',
      'Cálculo proporcional de leads ponderado pela taxa de conversão do corretor',
      'Notificação instantânea enviada via WhatsApp ao corretor sorteado'
    ],
    attachments: [
      { id: 'att-5', name: 'audio_explicacao_rodrigo_leads.mp3', type: 'audio', url: '#', duration: '1:15' }
    ],
    timeline: [
      { status: 'Chamado Aberto com Agente AVA', date: '19/08 11:20', user: 'Agente AVA' },
      { status: 'Aguardando Análise do Squad', date: '19/08 11:20', user: 'Fila A Analisar' }
    ]
  },
  {
    id: 'ticket-106',
    code: 'TCK-2026-086',
    title: 'Checklist Automático de Matrículas e Minutas de Contrato de Venda',
    description: 'Validação automatizada de certidões negativas do vendedor e geração automática de minutas contratuais de compra e venda de lotes e imóveis.',
    module: 'Propostas & Contratos',
    requesterName: 'Dra. Camila Alves',
    requesterRole: 'Advogada Imobiliária',
    requesterDepartment: 'Jurídico & Contratos',
    priority: 'media',
    main_status: 'a_executar',
    subcategory: 'nao_especificado',
    delivery_forecast: '2026-08-26',
    created_at: '2026-08-19T10:00:00Z',
    assigned_to: 'Squad Ahut Tech (Frontend)',
    impact_level: 'Médio',
    is_ai_triaged: true,
    business_impact: 'Reduz o tempo de emissão de minutas de 4 horas para menos de 5 minutos.',
    acceptance_criteria: [
      'Geração de PDF pré-preenchido com dados do comprador e do imóvel',
      'Validação de cláusula de comissão e sinal de pagamento'
    ],
    timeline: [
      { status: 'Triado por IA (AVA)', date: '19/08 10:05', user: 'Agente AVA' },
      { status: 'Aprovado e movido para A Executar', date: '19/08 10:45', user: 'Squad Ahut Tech' }
    ]
  }
];

const LOCAL_STORAGE_KEY = 'ahut_crm_tech_tickets_v4';

export default function Tecnologia() {
  const { profile } = useAuth();
  const { data: remoteTickets } = useTechTickets();
  const upsertTicket = useUpsertTechTicket();
  const [tickets, setTickets] = useState<TechTicket[]>([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [priorityFilter, setPriorityFilter] = useState<string>('todos');
  const [moduleFilter, setModuleFilter] = useState<string>('todos');
  // Drag-and-drop state
  const [dragTicketId, setDragTicketId] = useState<string | null>(null);
  const [dragOverCol, setDragOverCol] = useState<string | null>(null);

  // Performance coefficient state
  const [coeficiente, setCoeficiente] = useState({
    resolvidos: 0,
    tempoMedio: 0,
    taxaPrazo: 0,
    performanceGeral: 0
  });

  // Fetch profiles for solicitantes
  const { data: profilesList = [] } = useQuery({
    queryKey: ['profiles-solicitantes'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('profiles')
        .select('id, full_name, email, role')
        .in('role', ['admin', 'agent', 'manager']);
      if (error) throw error;
      return data || [];
    },
    staleTime: 1000 * 60 * 5,
  });

  const isSacramento = profile?.email === 'sacramento@apexfyhub.com.br';

  // Modais
  const [isAiAgentModalOpen, setIsAiAgentModalOpen] = useState(false);
  const [isManualModalOpen, setIsManualModalOpen] = useState(false);
  const [selectedTicketDetail, setSelectedTicketDetail] = useState<TechTicket | null>(null);
  const [editingTicket, setEditingTicket] = useState<TechTicket | null>(null);

  // Manual Form State
  const [formData, setFormData] = useState<{
    title: string;
    description: string;
    module: string;
    requesterName: string;
    requesterDepartment: string;
    priority: TicketPriority;
    main_status: TicketMainStatus;
    subcategory: TicketSubcategory;
    delivery_forecast: string;
    assigned_to: string;
    impact_level: 'Alto' | 'Médio' | 'Baixo';
  }>({
    title: '',
    description: '',
    module: 'Frontend & UI',
    requesterName: 'Equipe Interna',
    requesterDepartment: 'Operações',
    priority: 'media',
    main_status: 'a_analisar',
    subcategory: 'nao_especificado',
    delivery_forecast: new Date(Date.now() + 86400000 * 3).toISOString().split('T')[0],
    assigned_to: 'Squad Ahut Tech (CTO)',
    impact_level: 'Médio'
  });

  // Sincroniza com o Supabase (real): seed initial + chamados do banco
  useEffect(() => {
    const saved = localStorage.getItem(LOCAL_STORAGE_KEY);
    let local: TechTicket[] = [];
    if (saved) {
      try { local = JSON.parse(saved); } catch { local = INITIAL_TICKETS; }
    }
    // Merge: inicial (seed) + local (cache antigo, se houver) + remoto (Supabase)
    const merged = mergeTickets(INITIAL_TICKETS as unknown as TechTicketRow[], remoteTickets as unknown as TechTicketRow[] | undefined) as unknown as TechTicket[];
    const finalTickets = merged.length > 0 ? merged : (local.length > 0 ? local : INITIAL_TICKETS);
    setTickets(finalTickets);

    // Calculate performance coefficient
    const resolvidos = finalTickets.filter(t => t.main_status === 'executado').length;
    const total = finalTickets.length;
    const comPrazo = finalTickets.filter(t => {
      if (t.main_status !== 'executado' || !t.delivery_forecast) return false;
      // Simple heuristic: tickets with a forecast were resolved within it
      return true;
    }).length;
    const tempoMedio = total > 0 ? Math.round(
      finalTickets.reduce((acc, t) => {
        if (t.main_status === 'executado' && t.created_at) {
          return acc + Math.round((Date.now() - new Date(t.created_at).getTime()) / (1000 * 60 * 60 * 24));
        }
        return acc;
      }, 0) / Math.max(resolvidos, 1)
    ) : 0;
    const taxaPrazo = resolvidos > 0 ? Math.round((comPrazo / resolvidos) * 100) : 0;
    const performanceGeral = total > 0 ? Math.round((resolvidos / total) * 100) : 0;

    setCoeficiente({
      resolvidos,
      tempoMedio,
      taxaPrazo,
      performanceGeral
    });
  }, [remoteTickets]);

  const saveTickets = (updated: TechTicket[]) => {
    setTickets(updated);
    localStorage.setItem(LOCAL_STORAGE_KEY, JSON.stringify(updated));
    synchronizedSave(updated);
  };

  // Persiste remotamente (async, sem travar o fluxo local)
  async function synchronizedSave(updated: TechTicket[]) {
    try {
      // Persiste apenas os chamados "do sistema" (não os seeds iniciais, para não poluir o banco)
      const toSync = updated.filter((t) => !t.id.startsWith('ticket-10'));
      if (toSync.length === 0) return;
      for (const t of toSync) {
        try {
          await upsertTicket.mutateAsync(t as unknown as TechTicketRow);
        } catch (err: any) {
          console.warn('[Tecnologia] Falha ao sincronizar chamado', t.id, err?.message);
        }
      }
      console.info(`[Tecnologia] ${toSync.length} chamado(s) sincronizado(s) com o Supabase`);
    } catch (e) {
      console.warn('[Tecnologia] Erro na sincronização remota:', e);
    }
  };

  // Drop target column mapping: status → subcategory
  const statusSubMap: Record<string, TicketSubcategory> = {
    a_analisar: 'nao_especificado',
    a_executar: 'nao_especificado',
    executando: 'em_aplicacao',
    executado: 'atualizado'
  };

  // Drag and drop handlers
  const handleDragStart = (ticketId: string) => {
    setDragTicketId(ticketId);
  };

  const handleDragOver = (e: React.DragEvent, colStatus: string) => {
    e.preventDefault();
    setDragOverCol(colStatus);
  };

  const handleDragLeave = () => {
    setDragOverCol(null);
  };

  const handleDrop = (e: React.DragEvent, targetStatus: string) => {
    e.preventDefault();
    if (!dragTicketId) return;
    const ticket = tickets.find(t => t.id === dragTicketId);
    if (!ticket) return;
    const targetSub = statusSubMap[targetStatus] || 'nao_especificado';
    handleMoveTicket(dragTicketId, targetStatus as TicketMainStatus, targetSub);
    setDragTicketId(null);
    setDragOverCol(null);
  };

  const handleOpenAddManualModal = (defaultStatus: TicketMainStatus = 'a_analisar', defaultSub: TicketSubcategory = 'nao_especificado') => {
    setEditingTicket(null);
    setFormData({
      title: '',
      description: '',
      module: 'Frontend & UI',
      requesterName: 'Christian Eracanelli',
      requesterDepartment: 'Diretoria / Tech',
      priority: 'media',
      main_status: defaultStatus,
      subcategory: defaultStatus === 'a_analisar' || defaultStatus === 'a_executar' ? 'nao_especificado' : defaultSub,
      delivery_forecast: new Date(Date.now() + 86400000 * 3).toISOString().split('T')[0],
      assigned_to: 'Squad Ahut Tech (CTO)',
      impact_level: 'Médio'
    });
    setIsManualModalOpen(true);
  };

  const handleOpenEditModal = (ticket: TechTicket) => {
    setEditingTicket(ticket);
    setFormData({
      title: ticket.title,
      description: ticket.description,
      module: ticket.module,
      requesterName: ticket.requesterName,
      requesterDepartment: ticket.requesterDepartment,
      priority: ticket.priority,
      main_status: ticket.main_status,
      subcategory: ticket.subcategory,
      delivery_forecast: ticket.delivery_forecast || new Date().toISOString().split('T')[0],
      assigned_to: ticket.assigned_to || 'Squad Ahut Tech (CTO)',
      impact_level: ticket.impact_level || 'Médio'
    });
    setIsManualModalOpen(true);
  };

  const handleManualSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.title.trim()) return;

    let updated: TechTicket[];
    if (editingTicket) {
      updated = tickets.map(t => t.id === editingTicket.id ? {
        ...t,
        title: formData.title,
        description: formData.description,
        module: formData.module,
        requesterName: formData.requesterName,
        requesterDepartment: formData.requesterDepartment,
        priority: formData.priority,
        main_status: formData.main_status,
        subcategory: (formData.main_status === 'a_analisar' || formData.main_status === 'a_executar') ? 'nao_especificado' : formData.subcategory,
        delivery_forecast: formData.delivery_forecast,
        assigned_to: formData.assigned_to,
        impact_level: formData.impact_level
      } : t);
    } else {
      const ticketNum = Math.floor(100 + Math.random() * 900);
      const newTicket: TechTicket = {
        id: `ticket-${Date.now()}`,
        code: `TCK-2026-${ticketNum}`,
        title: formData.title,
        description: formData.description,
        module: formData.module,
        requesterName: formData.requesterName,
        requesterRole: 'Colaborador',
        requesterDepartment: formData.requesterDepartment,
        priority: formData.priority,
        main_status: formData.main_status,
        subcategory: (formData.main_status === 'a_analisar' || formData.main_status === 'a_executar') ? 'nao_especificado' : formData.subcategory,
        delivery_forecast: formData.delivery_forecast,
        created_at: new Date().toISOString(),
        assigned_to: formData.assigned_to,
        impact_level: formData.impact_level,
        is_ai_triaged: false,
        timeline: [
          { status: 'Chamado Criado Manualmente', date: new Date().toLocaleDateString('pt-BR') + ' ' + new Date().toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' }), user: formData.requesterName }
        ]
      };
      updated = [newTicket, ...tickets];
    }

    saveTickets(updated);
    setIsManualModalOpen(false);
  };

  const handleAiTicketCreated = (newTicket: TechTicket) => {
    const updated = [newTicket, ...tickets];
    saveTickets(updated);
    setIsAiAgentModalOpen(false);
  };

  const handleDeleteTicket = (id: string) => {
    if (confirm('Deseja realmente excluir este chamado de tecnologia?')) {
      const updated = tickets.filter(t => t.id !== id);
      saveTickets(updated);
      if (selectedTicketDetail?.id === id) {
        setSelectedTicketDetail(null);
      }
    }
  };

  const handleMoveTicket = (id: string, newMain: TicketMainStatus, newSub: TicketSubcategory) => {
    const updated = tickets.map(t => {
      if (t.id === id) {
        const newTimeline = t.timeline ? [...t.timeline] : [];
        const statusMap: Record<string, string> = {
          a_analisar: 'Movido para A Analisar',
          a_executar: 'Movido para A Executar',
          executando: `Em Execução (${newSub.replace('_', ' ')})`,
          executado: `Executado (${newSub.replace('_', ' ')})`
        };
        newTimeline.push({
          status: statusMap[newMain] || 'Status Atualizado',
          date: new Date().toLocaleDateString('pt-BR') + ' ' + new Date().toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' }),
          user: 'Squad Ahut Tech'
        });

        return {
          ...t,
          main_status: newMain,
          subcategory: (newMain === 'a_analisar' || newMain === 'a_executar') ? 'nao_especificado' as TicketSubcategory : newSub,
          timeline: newTimeline
        };
      }
      return t;
    });
    saveTickets(updated);
    if (selectedTicketDetail && selectedTicketDetail.id === id) {
      const refreshed = updated.find(t => t.id === id);
      if (refreshed) setSelectedTicketDetail(refreshed);
    }
  };

  // Filtragem
  const [departmentFilter, setDepartmentFilter] = useState<string>('todos');
  const modulesList = Array.from(new Set(tickets.map(t => t.module).filter(Boolean)));
  const departmentsList = Array.from(new Set(tickets.map(t => t.requesterDepartment).filter(Boolean)));

  const filteredTickets = tickets.filter(t => {
    const matchesSearch =
      t.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
      t.description.toLowerCase().includes(searchTerm.toLowerCase()) ||
      t.code.toLowerCase().includes(searchTerm.toLowerCase()) ||
      t.requesterName.toLowerCase().includes(searchTerm.toLowerCase()) ||
      (t.requesterDepartment && t.requesterDepartment.toLowerCase().includes(searchTerm.toLowerCase())) ||
      (t.module && t.module.toLowerCase().includes(searchTerm.toLowerCase()));
    const matchesPriority = priorityFilter === 'todos' || t.priority === priorityFilter;
    const matchesModule = moduleFilter === 'todos' || t.module === moduleFilter;
    const matchesDepartment = departmentFilter === 'todos' || t.requesterDepartment === departmentFilter;
    return matchesSearch && matchesPriority && matchesModule && matchesDepartment;
  });

  const colAAnalisar = filteredTickets.filter(t => t.main_status === 'a_analisar');
  const colAExecutar = filteredTickets.filter(t => t.main_status === 'a_executar');
  const colExecutando = filteredTickets.filter(t => t.main_status === 'executando');
  const colExecutado = filteredTickets.filter(t => t.main_status === 'executado');

  return (
    <div className="space-y-6">
      {/* Top Banner de Orquestração & Squad de Tecnologia */}
      <div className="relative overflow-hidden rounded-2xl bg-gradient-to-r from-[#0d1321] via-[#11192e] to-[#0d1829] p-6 border border-sky-900/40 shadow-xl">
        <div className="absolute -right-10 -top-10 w-72 h-72 bg-sky-500/10 rounded-full blur-3xl pointer-events-none"></div>
        <div className="absolute right-40 -bottom-10 w-60 h-60 bg-purple-500/10 rounded-full blur-3xl pointer-events-none"></div>

        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-6 relative z-10">
          <div className="space-y-2">
            <div className="flex items-center gap-3">
              <div className="p-2.5 bg-sky-500/10 text-sky-400 rounded-xl border border-sky-500/20 shadow-[0_0_20px_rgba(14,165,233,0.2)] flex items-center justify-center">
                <Monitor className="h-6 w-6 animate-pulse text-sky-400" />
              </div>
              <div>
                <div className="flex items-center gap-2">
                  <h1 className="text-2xl font-black tracking-tight text-white">
                    Squad de Tecnologia & Chamados
                  </h1>
                  <span className="text-[10px] px-2.5 py-0.5 rounded-full bg-gradient-to-r from-sky-500/20 to-purple-500/20 text-sky-300 border border-sky-500/30 font-mono font-bold uppercase tracking-wider">
                    Orquestração IA v2.4
                  </span>
                </div>
                <p className="text-xs text-gray-400 mt-0.5">
                  Pipeline contínuo de esteira ágil, triagem com IA conversacional e entrega de sprints no ecossistema
                </p>
              </div>
            </div>

            {/* Quick Stats Pills */}
            <div className="flex flex-wrap items-center gap-3 pt-2">
              <div className="flex items-center gap-1.5 px-3 py-1 rounded-lg bg-gray-900/80 border border-gray-800 text-[11px] text-gray-300">
                <span className="h-2 w-2 rounded-full bg-sky-400 animate-ping"></span>
                <span className="font-semibold text-white">{tickets.length}</span> Chamados Totais
              </div>
              <div className="flex items-center gap-1.5 px-3 py-1 rounded-lg bg-gray-900/80 border border-amber-500/20 text-[11px] text-amber-300">
                <span className="h-2 w-2 rounded-full bg-amber-400"></span>
                <span className="font-semibold text-white">{colAAnalisar.length}</span> Aguardando Triagem
              </div>
              <div className="flex items-center gap-1.5 px-3 py-1 rounded-lg bg-gray-900/80 border border-purple-500/20 text-[11px] text-purple-300">
                <Sparkles className="h-3 w-3 text-purple-400" />
                <span className="font-semibold text-white">{tickets.filter(t => t.is_ai_triaged).length}</span> Triados por IA
              </div>
              <div className="flex items-center gap-1.5 px-3 py-1 rounded-lg bg-gray-900/80 border border-emerald-500/20 text-[11px] text-emerald-300">
                <CheckCircle2 className="h-3 w-3 text-emerald-400" />
                <span className="font-semibold text-white">{colExecutado.length}</span> Entregues em Produção
              </div>
            </div>
          </div>

          {/* Action Buttons */}
          <div className="flex flex-wrap items-center gap-3 shrink-0">
            <button
              onClick={() => handleOpenAddManualModal()}
              className="bg-gray-900 hover:bg-gray-800 text-gray-300 hover:text-white font-medium text-xs px-4 py-2.5 rounded-xl border border-gray-700 transition-all flex items-center gap-2"
            >
              <Plus className="h-4 w-4" />
              Ticket Manual
            </button>

            <button
              onClick={() => setIsAiAgentModalOpen(true)}
              className="bg-gradient-to-r from-sky-500 via-sky-400 to-cyan-400 hover:from-sky-400 hover:to-cyan-300 text-slate-950 font-black text-xs uppercase tracking-wider px-5 py-2.5 rounded-xl transition-all shadow-[0_0_25px_rgba(14,165,233,0.35)] flex items-center gap-2 transform active:scale-95"
            >
              <Bot className="h-4 w-4" />
              <Sparkles className="h-3.5 w-3.5" />
              Abrir Chamado com Agente IA
            </button>
          </div>
        </div>
      </div>

      {/* Performance Coefficient Cards */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
        <div className="bg-gradient-to-br from-emerald-900/40 to-emerald-950/40 border border-emerald-500/20 rounded-xl p-4">
          <div className="flex items-center justify-between mb-2">
            <div className="p-2 bg-emerald-500/10 rounded-lg text-emerald-400">
              <CheckCircle2 className="w-4 h-4" />
            </div>
          </div>
          <p className="text-2xl font-bold text-emerald-400">{coeficiente.resolvidos}</p>
          <p className="text-[11px] text-emerald-300/60">Chamados Resolvidos</p>
        </div>
        <div className="bg-gradient-to-br from-sky-900/40 to-sky-950/40 border border-sky-500/20 rounded-xl p-4">
          <div className="flex items-center justify-between mb-2">
            <div className="p-2 bg-sky-500/10 rounded-lg text-sky-400">
              <Clock className="w-4 h-4" />
            </div>
          </div>
          <p className="text-2xl font-bold text-sky-400">{coeficiente.tempoMedio}d</p>
          <p className="text-[11px] text-sky-300/60">Tempo Médio Resolução</p>
        </div>
        <div className="bg-gradient-to-br from-amber-900/40 to-amber-950/40 border border-amber-500/20 rounded-xl p-4">
          <div className="flex items-center justify-between mb-2">
            <div className="p-2 bg-amber-500/10 rounded-lg text-amber-400">
              <Target className="w-4 h-4" />
            </div>
          </div>
          <p className="text-2xl font-bold text-amber-400">{coeficiente.taxaPrazo}%</p>
          <p className="text-[11px] text-amber-300/60">Dentro do Prazo</p>
        </div>
        <div className="bg-gradient-to-br from-purple-900/40 to-purple-950/40 border border-purple-500/20 rounded-xl p-4">
          <div className="flex items-center justify-between mb-2">
            <div className="p-2 bg-purple-500/10 rounded-lg text-purple-400">
              <TrendingUp className="w-4 h-4" />
            </div>
          </div>
          <p className="text-2xl font-bold text-purple-400">{coeficiente.performanceGeral}%</p>
          <p className="text-[11px] text-purple-300/60">Performance Geral</p>
        </div>
      </div>

      {/* Filter and Search Bar */}
      <div className="flex flex-col lg:flex-row items-center justify-between gap-4 bg-[#0d1321]/70 p-4 rounded-xl border border-gray-800/80 backdrop-blur-md">
        <div className="relative flex-1 w-full">
          <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 text-gray-400 h-4 w-4" />
          <input
            type="text"
            placeholder="Buscar por código (TCK-...), título, solicitante, departamento, módulo..."
            className="w-full bg-gray-900/90 border border-gray-800 rounded-lg py-2 pl-10 pr-4 text-xs text-gray-200 focus:ring-1 focus:ring-sky-500 outline-none transition-all placeholder:text-gray-500"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
          />
        </div>

        <div className="flex flex-wrap items-center gap-3 w-full lg:w-auto">
          <div className="flex items-center gap-2">
            <Filter className="text-gray-400 h-3.5 w-3.5" />
            <span className="text-[11px] text-gray-400 font-medium">Prioridade:</span>
            <select
              className="bg-gray-900 border border-gray-800 rounded-lg px-2.5 py-1.5 text-xs text-gray-300 outline-none focus:ring-1 focus:ring-sky-500"
              value={priorityFilter}
              onChange={(e) => setPriorityFilter(e.target.value)}
            >
              <option value="todos">Todas</option>
              <option value="critica">🟣 Crítica</option>
              <option value="alta">🔴 Alta</option>
              <option value="media">🟡 Média</option>
              <option value="baixa">🟢 Baixa</option>
            </select>
          </div>

          <div className="flex items-center gap-2">
            <Building2 className="text-gray-400 h-3.5 w-3.5" />
            <span className="text-[11px] text-gray-400 font-medium">Departamento:</span>
            <select
              className="bg-gray-900 border border-gray-800 rounded-lg px-2.5 py-1.5 text-xs text-gray-300 outline-none focus:ring-1 focus:ring-sky-500"
              value={departmentFilter}
              onChange={(e) => setDepartmentFilter(e.target.value)}
            >
              <option value="todos">Todos os Departamentos</option>
              {departmentsList.map(dep => (
                <option key={dep} value={dep}>{dep}</option>
              ))}
            </select>
          </div>

          <div className="flex items-center gap-2">
            <SlidersHorizontal className="text-gray-400 h-3.5 w-3.5" />
            <span className="text-[11px] text-gray-400 font-medium">Módulo:</span>
            <select
              className="bg-gray-900 border border-gray-800 rounded-lg px-2.5 py-1.5 text-xs text-gray-300 outline-none focus:ring-1 focus:ring-sky-500"
              value={moduleFilter}
              onChange={(e) => setModuleFilter(e.target.value)}
            >
              <option value="todos">Todos os Módulos</option>
              {modulesList.map(mod => (
                <option key={mod} value={mod}>{mod}</option>
              ))}
            </select>
          </div>
        </div>
      </div>

      {/* Kanban Board Grid - 4 Full Stages */}
      <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-4 gap-5">

        {/* COLUNA 1: A ANALISAR */}
        <div
          className={`bg-[#0d1321] border rounded-2xl p-4 flex flex-col h-[780px] shadow-lg transition-all duration-200 ${
            dragOverCol === 'a_analisar' ? 'border-sky-400 ring-2 ring-sky-500/30 scale-[1.01]' : 'border-sky-500/20'
          }`}
          onDragOver={(e) => handleDragOver(e, 'a_analisar')}
          onDragLeave={handleDragLeave}
          onDrop={(e) => handleDrop(e, 'a_analisar')}
        >
          <div className="flex items-center justify-between pb-3 border-b border-sky-500/20 mb-3.5">
            <div className="flex items-center gap-2">
              <span className="h-3 w-3 rounded-full bg-sky-400 animate-pulse"></span>
              <div>
                <h3 className="font-bold text-xs text-sky-400 uppercase tracking-wider flex items-center gap-1.5">
                  A Analisar
                </h3>
                <p className="text-[10px] text-gray-500">Triagem & Diagnóstico</p>
              </div>
            </div>
            <div className="flex items-center gap-2">
              <span className="text-xs bg-sky-500/20 text-sky-300 font-mono font-bold px-2 py-0.5 rounded-full border border-sky-500/30">
                {colAAnalisar.length}
              </span>
              <button
                onClick={() => handleOpenAddManualModal('a_analisar')}
                className="text-gray-400 hover:text-white p-1 hover:bg-gray-800 rounded"
                title="Adicionar chamado"
              >
                <Plus className="h-4 w-4" />
              </button>
            </div>
          </div>

          <div className="flex-1 overflow-y-auto space-y-3 pr-1 custom-scrollbar">
            {colAAnalisar.map(ticket => (
              <TicketCard
                key={ticket.id}
                ticket={ticket}
                onSelect={() => setSelectedTicketDetail(ticket)}
                onEdit={handleOpenEditModal}
                onDelete={handleDeleteTicket}
                onMove={handleMoveTicket}
                showEditDelete={isSacramento}
                onDragStartCb={handleDragStart}
              />
            ))}
            {colAAnalisar.length === 0 && (
              <div className="h-40 flex flex-col items-center justify-center border border-dashed border-gray-800 rounded-xl text-xs text-gray-500 p-4 text-center">
                <Bot className="h-6 w-6 text-gray-600 mb-1 opacity-50" />
                Nenhum chamado pendente de análise
              </div>
            )}
          </div>
        </div>

        {/* COLUNA 2: A EXECUTAR */}
        <div
          className={`bg-[#0d1321] border rounded-2xl p-4 flex flex-col h-[780px] shadow-lg transition-all duration-200 ${
            dragOverCol === 'a_executar' ? 'border-blue-400 ring-2 ring-blue-500/30 scale-[1.01]' : 'border-gray-800'
          }`}
          onDragOver={(e) => handleDragOver(e, 'a_executar')}
          onDragLeave={handleDragLeave}
          onDrop={(e) => handleDrop(e, 'a_executar')}
        >
          <div className="flex items-center justify-between pb-3 border-b border-gray-800 mb-3.5">
            <div className="flex items-center gap-2">
              <span className="h-3 w-3 rounded-full bg-blue-500"></span>
              <div>
                <h3 className="font-bold text-xs text-gray-200 uppercase tracking-wider">A Executar</h3>
                <p className="text-[10px] text-gray-500">Sprint Backlog</p>
              </div>
            </div>
            <div className="flex items-center gap-2">
              <span className="text-xs bg-gray-800 text-gray-400 font-mono font-bold px-2 py-0.5 rounded-full">
                {colAExecutar.length}
              </span>
              <button
                onClick={() => handleOpenAddManualModal('a_executar')}
                className="text-gray-400 hover:text-white p-1 hover:bg-gray-800 rounded"
              >
                <Plus className="h-4 w-4" />
              </button>
            </div>
          </div>

          <div className="flex-1 overflow-y-auto space-y-3 pr-1 custom-scrollbar">
            {colAExecutar.map(ticket => (
              <TicketCard
                key={ticket.id}
                ticket={ticket}
                onSelect={() => setSelectedTicketDetail(ticket)}
                onEdit={handleOpenEditModal}
                onDelete={handleDeleteTicket}
                onMove={handleMoveTicket}
                showEditDelete={isSacramento}
                onDragStartCb={handleDragStart}
              />
            ))}
            {colAExecutar.length === 0 && (
              <div className="h-40 flex flex-col items-center justify-center border border-dashed border-gray-800 rounded-xl text-xs text-gray-600 p-4 text-center">
                Fila de execução limpa
              </div>
            )}
          </div>
        </div>

        {/* COLUNA 3: EM EXECUÇÃO */}
        <div
          className={`bg-[#0d1321] border rounded-2xl p-4 flex flex-col h-[780px] shadow-lg transition-all duration-200 ${
            dragOverCol === 'executando' ? 'border-amber-400 ring-2 ring-amber-500/30 scale-[1.01]' : 'border-amber-500/20'
          }`}
          onDragOver={(e) => handleDragOver(e, 'executando')}
          onDragLeave={handleDragLeave}
          onDrop={(e) => handleDrop(e, 'executando')}
        >
          <div className="flex items-center justify-between pb-3 border-b border-amber-500/20 mb-3.5">
            <div className="flex items-center gap-2">
              <span className="h-3 w-3 rounded-full bg-amber-400 animate-pulse"></span>
              <div>
                <h3 className="font-bold text-xs text-amber-400 uppercase tracking-wider">Em Execução</h3>
                <p className="text-[10px] text-gray-500">Desenvolvimento Ativo</p>
              </div>
            </div>
            <div className="flex items-center gap-2">
              <span className="text-xs bg-amber-500/20 text-amber-300 font-mono font-bold px-2 py-0.5 rounded-full border border-amber-500/30">
                {colExecutando.length}
              </span>
              <button
                onClick={() => handleOpenAddManualModal('executando', 'em_planejamento')}
                className="text-amber-400 hover:text-white p-1 hover:bg-amber-500/10 rounded"
              >
                <Plus className="h-4 w-4" />
              </button>
            </div>
          </div>

          <div className="flex-1 overflow-y-auto space-y-4 pr-1 custom-scrollbar">
            {/* Subetapa 1: Em Planejamento */}
            <div className="space-y-2">
              <div className="text-[10px] font-bold text-sky-400 uppercase tracking-wider px-2 py-1 bg-sky-500/10 rounded-md border border-sky-500/20 flex items-center justify-between">
                <span className="flex items-center gap-1.5">
                  <Clock className="h-3 w-3" />
                  Em Planejamento
                </span>
                <span className="font-mono text-[9px] text-sky-300">
                  {colExecutando.filter(t => t.subcategory === 'em_planejamento').length}
                </span>
              </div>
              {colExecutando.filter(t => t.subcategory === 'em_planejamento').map(ticket => (
                <TicketCard key={ticket.id} ticket={ticket} onSelect={() => setSelectedTicketDetail(ticket)} onEdit={handleOpenEditModal} onDelete={handleDeleteTicket} onMove={handleMoveTicket} showEditDelete={isSacramento} onDragStartCb={handleDragStart} />
              ))}
            </div>

            {/* Subetapa 2: Em Aplicação */}
            <div className="space-y-2">
              <div className="text-[10px] font-bold text-amber-400 uppercase tracking-wider px-2 py-1 bg-amber-500/10 rounded-md border border-amber-500/20 flex items-center justify-between">
                <span className="flex items-center gap-1.5">
                  <Code2 className="h-3 w-3" />
                  Em Aplicação
                </span>
                <span className="font-mono text-[9px] text-amber-300">
                  {colExecutando.filter(t => t.subcategory === 'em_aplicacao').length}
                </span>
              </div>
              {colExecutando.filter(t => t.subcategory === 'em_aplicacao').map(ticket => (
                <TicketCard key={ticket.id} ticket={ticket} onSelect={() => setSelectedTicketDetail(ticket)} onEdit={handleOpenEditModal} onDelete={handleDeleteTicket} onMove={handleMoveTicket} showEditDelete={isSacramento} onDragStartCb={handleDragStart} />
              ))}
            </div>

            {/* Subetapa 3: Em Validação */}
            <div className="space-y-2">
              <div className="text-[10px] font-bold text-purple-400 uppercase tracking-wider px-2 py-1 bg-purple-500/10 rounded-md border border-purple-500/20 flex items-center justify-between">
                <span className="flex items-center gap-1.5">
                  <Sparkles className="h-3 w-3" />
                  Em Validação (QA)
                </span>
                <span className="font-mono text-[9px] text-purple-300">
                  {colExecutando.filter(t => t.subcategory === 'em_validacao').length}
                </span>
              </div>
              {colExecutando.filter(t => t.subcategory === 'em_validacao').map(ticket => (
                <TicketCard key={ticket.id} ticket={ticket} onSelect={() => setSelectedTicketDetail(ticket)} onEdit={handleOpenEditModal} onDelete={handleDeleteTicket} onMove={handleMoveTicket} showEditDelete={isSacramento} onDragStartCb={handleDragStart} />
              ))}
            </div>
          </div>
        </div>

        {/* COLUNA 4: EXECUTADAS */}
        <div
          className={`bg-[#0d1321] border rounded-2xl p-4 flex flex-col h-[780px] shadow-lg transition-all duration-200 ${
            dragOverCol === 'executado' ? 'border-emerald-400 ring-2 ring-emerald-500/30 scale-[1.01]' : 'border-emerald-500/20'
          }`}
          onDragOver={(e) => handleDragOver(e, 'executado')}
          onDragLeave={handleDragLeave}
          onDrop={(e) => handleDrop(e, 'executado')}
        >
          <div className="flex items-center justify-between pb-3 border-b border-emerald-500/20 mb-3.5">
            <div className="flex items-center gap-2">
              <span className="h-3 w-3 rounded-full bg-emerald-400"></span>
              <div>
                <h3 className="font-bold text-xs text-emerald-400 uppercase tracking-wider">Executadas</h3>
                <p className="text-[10px] text-gray-500">Concluído & Publicado</p>
              </div>
            </div>
            <div className="flex items-center gap-2">
              <span className="text-xs bg-emerald-500/20 text-emerald-300 font-mono font-bold px-2 py-0.5 rounded-full border border-emerald-500/30">
                {colExecutado.length}
              </span>
              <button
                onClick={() => handleOpenAddManualModal('executado', 'atualizado')}
                className="text-emerald-400 hover:text-white p-1 hover:bg-emerald-500/10 rounded"
              >
                <Plus className="h-4 w-4" />
              </button>
            </div>
          </div>

          <div className="flex-1 overflow-y-auto space-y-4 pr-1 custom-scrollbar">
            {/* Subetapa 1: Atualizado */}
            <div className="space-y-2">
              <div className="text-[10px] font-bold text-emerald-400 uppercase tracking-wider px-2 py-1 bg-emerald-500/10 rounded-md border border-emerald-500/20 flex items-center justify-between">
                <span className="flex items-center gap-1.5">
                  <CheckCircle2 className="h-3 w-3" />
                  Atualizado em Produção
                </span>
                <span className="font-mono text-[9px] text-emerald-300">
                  {colExecutado.filter(t => t.subcategory === 'atualizado' || t.subcategory === 'nao_especificado').length}
                </span>
              </div>
              {colExecutado.filter(t => t.subcategory === 'atualizado' || t.subcategory === 'nao_especificado').map(ticket => (
                <TicketCard key={ticket.id} ticket={ticket} onSelect={() => setSelectedTicketDetail(ticket)} onEdit={handleOpenEditModal} onDelete={handleDeleteTicket} onMove={handleMoveTicket} showEditDelete={isSacramento} onDragStartCb={handleDragStart} />
              ))}
            </div>

            {/* Subetapa 2: Backup Realizado (GitHub) */}
            <div className="space-y-2">
              <div className="text-[10px] font-bold text-indigo-400 uppercase tracking-wider px-2 py-1 bg-indigo-500/10 rounded-md border border-indigo-500/20 flex items-center justify-between">
                <span className="flex items-center gap-1.5">
                  <GitBranch className="h-3 w-3" />
                  Backup Realizado (GitHub)
                </span>
                <span className="font-mono text-[9px] text-indigo-300">
                  {colExecutado.filter(t => t.subcategory === 'backup_realizado').length}
                </span>
              </div>
              {colExecutado.filter(t => t.subcategory === 'backup_realizado').map(ticket => (
                <TicketCard key={ticket.id} ticket={ticket} onSelect={() => setSelectedTicketDetail(ticket)} onEdit={handleOpenEditModal} onDelete={handleDeleteTicket} onMove={handleMoveTicket} showEditDelete={isSacramento} onDragStartCb={handleDragStart} />
              ))}
            </div>
          </div>
        </div>

      </div>

      {/* MODAL 1: AGENTE DE IA INTERATIVO PARA ABERTURA DE CHAMADOS */}
      {isAiAgentModalOpen && (
        <AiTicketIntakeModal
          onClose={() => setIsAiAgentModalOpen(false)}
          onTicketCreated={handleAiTicketCreated}
        />
      )}

      {/* MODAL 2: DETALHES COMPLETOS DO TICKET */}
      {selectedTicketDetail && (
        <TicketDetailModal
          ticket={selectedTicketDetail}
          onClose={() => setSelectedTicketDetail(null)}
          onEdit={() => {
            handleOpenEditModal(selectedTicketDetail);
            setSelectedTicketDetail(null);
          }}
          onDelete={() => handleDeleteTicket(selectedTicketDetail.id)}
          onMove={handleMoveTicket}
        />
      )}

      {/* MODAL 3: CRIAR / EDITAR MANUALMENTE */}
      {isManualModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-md animate-in fade-in duration-200">
          <div className="bg-[#0d1321] border border-gray-800 rounded-2xl w-full max-w-lg p-6 space-y-4 shadow-2xl">
            <div className="flex justify-between items-center border-b border-gray-800 pb-3">
              <div className="flex items-center gap-2">
                <div className="p-2 bg-sky-500/10 rounded-lg text-sky-400">
                  <Code2 className="h-5 w-5" />
                </div>
                <h3 className="text-base font-bold text-white tracking-tight">
                  {editingTicket ? 'Editar Chamado de Tecnologia' : 'Novo Chamado Manual'}
                </h3>
              </div>
              <button onClick={() => setIsManualModalOpen(false)} className="text-gray-400 hover:text-white">
                <X className="h-5 w-5" />
              </button>
            </div>

            <form onSubmit={handleManualSubmit} className="space-y-4 text-xs">
              <div>
                <label className="text-gray-400 font-medium block mb-1">Título do Chamado *</label>
                <input
                  type="text"
                  required
                  placeholder="Ex: Ajustar botão de exportação na agenda"
                  className="w-full bg-gray-900 border border-gray-800 rounded-lg p-2.5 text-white outline-none focus:border-sky-500"
                  value={formData.title}
                  onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                />
              </div>

              <div>
                <label className="text-gray-400 font-medium block mb-1">Descrição Detalhada *</label>
                <textarea
                  rows={3}
                  required
                  placeholder="Descreva o que precisa ser ajustado ou implementado..."
                  className="w-full bg-gray-900 border border-gray-800 rounded-lg p-2.5 text-white outline-none focus:border-sky-500 resize-none"
                  value={formData.description}
                  onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-gray-400 font-medium block mb-1">Solicitante</label>
                  <select
                    className="w-full bg-gray-900 border border-gray-800 rounded-lg p-2 text-white outline-none focus:border-sky-500"
                    value={formData.requesterName}
                    onChange={(e) => setFormData({ ...formData, requesterName: e.target.value })}
                  >
                    <option value="">Selecione um solicitante</option>
                    {profilesList.map((p: any) => (
                      <option key={p.id} value={p.full_name || p.email}>{p.full_name || p.email}</option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="text-gray-400 font-medium block mb-1">Departamento</label>
                  <select
                    className="w-full bg-gray-900 border border-gray-800 rounded-lg p-2 text-white outline-none focus:border-sky-500"
                    value={formData.requesterDepartment}
                    onChange={(e) => setFormData({ ...formData, requesterDepartment: e.target.value })}
                  >
                    <option value="Diretoria">Diretoria</option>
                    <option value="Comercial & Vendas">Comercial & Vendas / Atendimento</option>
                    <option value="Jurídico & Contratos">Jurídico & Contratos</option>
                    <option value="Operações">Operações</option>
                    <option value="Tecnologia">Tecnologia</option>
                  </select>
                </div>
              </div>

              <div className="grid grid-cols-3 gap-3">
                <div>
                  <label className="text-gray-400 font-medium block mb-1">Módulo</label>
                  <select
                    className="w-full bg-gray-900 border border-gray-800 rounded-lg p-2 text-white outline-none focus:border-sky-500"
                    value={formData.module}
                    onChange={(e) => setFormData({ ...formData, module: e.target.value })}
                  >
                    <option value="Frontend & UI">Frontend & UI</option>
                    <option value="Central de Chat & Agenda">Central de Chat & Agenda</option>
                    <option value="Imóveis & Catálogo">Imóveis & Catálogo</option>
                    <option value="Backend & WhatsApp">Backend & WhatsApp</option>
                    <option value="DevOps & VPS">DevOps & VPS</option>
                    <option value="Autenticação & Segurança">Autenticação & Segurança</option>
                  </select>
                </div>
                <div>
                  <label className="text-gray-400 font-medium block mb-1">Prioridade</label>
                  <select
                    className="w-full bg-gray-900 border border-gray-800 rounded-lg p-2 text-white outline-none focus:border-sky-500"
                    value={formData.priority}
                    onChange={(e) => setFormData({ ...formData, priority: e.target.value as TicketPriority })}
                  >
                    <option value="critica">🟣 Crítica</option>
                    <option value="alta">🔴 Alta</option>
                    <option value="media">🟡 Média</option>
                    <option value="baixa">🟢 Baixa</option>
                  </select>
                </div>
                <div>
                  <label className="text-gray-400 font-medium block mb-1">Impacto</label>
                  <select
                    className="w-full bg-gray-900 border border-gray-800 rounded-lg p-2 text-white outline-none focus:border-sky-500"
                    value={formData.impact_level}
                    onChange={(e) => setFormData({ ...formData, impact_level: e.target.value as 'Alto' | 'Médio' | 'Baixo' })}
                  >
                    <option value="Alto">Alto</option>
                    <option value="Médio">Médio</option>
                    <option value="Baixo">Baixo</option>
                  </select>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-gray-400 font-medium block mb-1">Coluna Inicial</label>
                  <select
                    className="w-full bg-gray-900 border border-gray-800 rounded-lg p-2 text-white outline-none focus:border-sky-500"
                    value={formData.main_status}
                    onChange={(e) => {
                      const newMain = e.target.value as TicketMainStatus;
                      let defaultSub: TicketSubcategory = 'nao_especificado';
                      if (newMain === 'executando') defaultSub = 'em_planejamento';
                      if (newMain === 'executado') defaultSub = 'atualizado';
                      setFormData({ ...formData, main_status: newMain, subcategory: defaultSub });
                    }}
                  >
                    <option value="a_analisar">A Analisar</option>
                    <option value="a_executar">A Executar</option>
                    <option value="executando">Em Execução</option>
                    <option value="executado">Executado</option>
                  </select>
                </div>

                {(formData.main_status === 'executando' || formData.main_status === 'executado') && (
                  <div>
                    <label className="text-gray-400 font-medium block mb-1">Subfase</label>
                    <select
                      className="w-full bg-gray-900 border border-gray-800 rounded-lg p-2 text-white outline-none focus:border-sky-500"
                      value={formData.subcategory}
                      onChange={(e) => setFormData({ ...formData, subcategory: e.target.value as TicketSubcategory })}
                    >
                      {formData.main_status === 'executando' && (
                        <>
                          <option value="em_planejamento">Em Planejamento</option>
                          <option value="em_aplicacao">Em Aplicação</option>
                          <option value="em_validacao">Em Validação (QA)</option>
                        </>
                      )}
                      {formData.main_status === 'executado' && (
                        <>
                          <option value="atualizado">Atualizado em Produção</option>
                          <option value="backup_realizado">Backup Realizado (GitHub)</option>
                        </>
                      )}
                    </select>
                  </div>
                )}
              </div>

              <div>
                <label className="text-gray-400 font-medium block mb-1">Previsão de Entrega</label>
                <input
                  type="date"
                  className="w-full bg-gray-900 border border-gray-800 rounded-lg p-2.5 text-white outline-none focus:border-sky-500"
                  value={formData.delivery_forecast}
                  onChange={(e) => setFormData({ ...formData, delivery_forecast: e.target.value })}
                />
              </div>

              <div className="pt-3 flex gap-3">
                <button
                  type="button"
                  onClick={() => setIsManualModalOpen(false)}
                  className="flex-1 py-2.5 bg-gray-800 hover:bg-gray-700 text-gray-300 rounded-xl font-bold uppercase tracking-wider"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  className="flex-1 py-2.5 bg-sky-500 hover:bg-sky-400 text-slate-950 rounded-xl font-bold uppercase tracking-wider shadow-[0_0_15px_rgba(14,165,233,0.3)]"
                >
                  {editingTicket ? 'Salvar Alterações' : 'Criar Chamado'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}

// -------------------------------------------------------------
// CARD DE TICKET PADRÃO MULTINACIONAL (ENTERPRISE HIGH-TECH CARD)
// -------------------------------------------------------------
function TicketCard({
  ticket,
  onSelect,
  onEdit,
  onDelete,
  onMove,
  showEditDelete,
  onDragStartCb
}: {
  ticket: TechTicket;
  onSelect: () => void;
  onEdit: (t: TechTicket) => void;
  onDelete: (id: string) => void;
  onMove: (id: string, main: TicketMainStatus, sub: TicketSubcategory) => void;
  showEditDelete: boolean;
  onDragStartCb?: (id: string) => void;
}) {
  const [showMenu, setShowMenu] = useState(false);

  const priorityBadge = {
    critica: { bg: 'bg-purple-500/10', text: 'text-purple-400', border: 'border-purple-500/30', label: 'Crítica' },
    alta: { bg: 'bg-red-500/10', text: 'text-red-400', border: 'border-red-500/30', label: 'Alta' },
    media: { bg: 'bg-amber-500/10', text: 'text-amber-400', border: 'border-amber-500/30', label: 'Média' },
    baixa: { bg: 'bg-emerald-500/10', text: 'text-emerald-400', border: 'border-emerald-500/30', label: 'Baixa' }
  }[ticket.priority];

  const formatDate = (dateStr?: string) => {
    if (!dateStr) return 'Sem previsão';
    const parts = dateStr.split('-');
    if (parts.length === 3) return `${parts[2]}/${parts[1]}/${parts[0]}`;
    return dateStr;
  };

  const hasAttachments = (ticket.attachments && ticket.attachments.length > 0);
  const audioAttachment = ticket.attachments?.find(a => a.type === 'audio');

  return (
    <div
      className="group relative bg-[#111827]/90 hover:bg-[#151e33] border border-gray-800 hover:border-sky-500/40 rounded-xl p-3.5 transition-all duration-200 shadow-md hover:shadow-sky-500/5 flex flex-col justify-between gap-3 cursor-grab active:cursor-grabbing"
      draggable={true}
      onDragStart={() => {
        if (typeof onDragStartCb === 'function') onDragStartCb(ticket.id);
      }}
    >
      {/* Header do Card: Código, IA Badge & Prioridade */}
      <div className="flex items-center justify-between gap-2">
        <div className="flex items-center gap-1.5">
          <div className="flex items-center gap-1 text-gray-500">
            <GripVertical className="h-3.5 w-3.5 opacity-30 group-hover:opacity-70 transition-opacity" />
          </div>
          <span className="font-mono text-[10px] font-bold text-sky-400 bg-sky-500/10 px-2 py-0.5 rounded border border-sky-500/20">
            {ticket.code}
          </span>
          {ticket.is_ai_triaged && (
            <span className="text-[9px] flex items-center gap-1 bg-purple-500/15 text-purple-300 px-1.5 py-0.5 rounded border border-purple-500/20" title="Triado por Agente de IA">
              <Bot className="h-2.5 w-2.5" />
              IA
            </span>
          )}
        </div>

        <div className="flex items-center gap-1.5">
          <span className={`text-[9px] font-bold uppercase px-2 py-0.5 rounded border ${priorityBadge.bg} ${priorityBadge.text} ${priorityBadge.border}`}>
            {priorityBadge.label}
          </span>

          {showEditDelete && (
          <div className="relative">
            <button
              onClick={(e) => {
                e.stopPropagation();
                setShowMenu(!showMenu);
              }}
              className="text-gray-500 hover:text-gray-200 p-1 rounded hover:bg-gray-800"
            >
              <MoreVertical className="h-3.5 w-3.5" />
            </button>

            {showMenu && (
              <div
                className="absolute right-0 top-6 z-30 w-48 bg-gray-950 border border-gray-800 rounded-xl shadow-2xl py-1.5 text-xs animate-in fade-in"
                onMouseLeave={() => setShowMenu(false)}
                onClick={(e) => e.stopPropagation()}
              >
                <button
                  onClick={() => { onSelect(); setShowMenu(false); }}
                  className="w-full text-left px-3 py-1.5 text-sky-400 hover:bg-sky-500/10 flex items-center gap-2"
                >
                  <Eye className="h-3.5 w-3.5" /> Inspecionar Detalhes
                </button>
                <button
                  onClick={() => { onEdit(ticket); setShowMenu(false); }}
                  className="w-full text-left px-3 py-1.5 text-gray-300 hover:bg-gray-800 flex items-center gap-2"
                >
                  <Edit3 className="h-3.5 w-3.5" /> Editar Chamado
                </button>

                <div className="border-t border-gray-800 my-1" />
                <div className="px-3 py-0.5 text-[9px] uppercase text-gray-500 font-bold">Mover para:</div>
                <button onClick={() => { onMove(ticket.id, 'a_analisar', 'nao_especificado'); setShowMenu(false); }} className="w-full text-left px-3 py-1 text-sky-400 text-[11px] hover:bg-gray-800">
                  ➔ A Analisar
                </button>
                <button onClick={() => { onMove(ticket.id, 'a_executar', 'nao_especificado'); setShowMenu(false); }} className="w-full text-left px-3 py-1 text-blue-400 text-[11px] hover:bg-gray-800">
                  ➔ A Executar
                </button>
                <button onClick={() => { onMove(ticket.id, 'executando', 'em_planejamento'); setShowMenu(false); }} className="w-full text-left px-3 py-1 text-amber-400 text-[11px] hover:bg-gray-800">
                  ➔ Em Planejamento
                </button>
                <button onClick={() => { onMove(ticket.id, 'executando', 'em_aplicacao'); setShowMenu(false); }} className="w-full text-left px-3 py-1 text-amber-400 text-[11px] hover:bg-gray-800">
                  ➔ Em Aplicação
                </button>
                <button onClick={() => { onMove(ticket.id, 'executando', 'em_validacao'); setShowMenu(false); }} className="w-full text-left px-3 py-1 text-purple-400 text-[11px] hover:bg-gray-800">
                  ➔ Em Validação
                </button>
                <button onClick={() => { onMove(ticket.id, 'executado', 'atualizado'); setShowMenu(false); }} className="w-full text-left px-3 py-1 text-emerald-400 text-[11px] hover:bg-gray-800">
                  ➔ Atualizado
                </button>
                <button onClick={() => { onMove(ticket.id, 'executado', 'backup_realizado'); setShowMenu(false); }} className="w-full text-left px-3 py-1 text-indigo-400 text-[11px] hover:bg-gray-800">
                  ➔ Backup GitHub
                </button>

                <div className="border-t border-gray-800 my-1" />
                <button
                  onClick={() => { onDelete(ticket.id); setShowMenu(false); }}
                  className="w-full text-left px-3 py-1.5 text-red-400 hover:bg-red-500/10 flex items-center gap-2"
                >
                  <Trash2 className="h-3.5 w-3.5" /> Excluir Chamado
                </button>
              </div>
            )}
          </div>
          )}
        </div>
      </div>

      {/* Corpo do Card: Módulo, Departamento & Título */}
      <div className="cursor-pointer space-y-1.5" onClick={onSelect}>
        <div className="flex flex-wrap items-center gap-1.5">
          <span className="inline-block text-[10px] text-gray-400 font-medium px-2 py-0.5 bg-gray-900 rounded border border-gray-800/80">
            📁 {ticket.module}
          </span>
          {ticket.requesterDepartment && (
            <span className="inline-flex items-center gap-1 text-[10px] text-sky-400 font-medium px-2 py-0.5 bg-sky-950/70 rounded border border-sky-800/50">
              <Building2 className="h-2.5 w-2.5 text-sky-400" />
              {ticket.requesterDepartment}
            </span>
          )}
        </div>
        <h4 className="text-xs font-bold text-gray-100 group-hover:text-sky-300 transition-colors leading-snug line-clamp-2">
          {ticket.title}
        </h4>
        <p className="text-[11px] text-gray-400 line-clamp-2 leading-relaxed">
          {ticket.description}
        </p>
      </div>

      {/* Badges de Anexos & Áudio */}
      {hasAttachments && (
        <div className="flex flex-wrap items-center gap-1.5 pt-1">
          {ticket.attachments?.some(a => a.type === 'video') && (
            <span className="text-[9px] text-purple-300 flex items-center gap-1 bg-purple-500/10 px-2 py-0.5 rounded border border-purple-500/30">
              <Video className="h-2.5 w-2.5 text-purple-400" />
              Vídeo + Transcrição
            </span>
          )}

          {ticket.attachments?.filter(a => a.type === 'image' || a.type === 'doc').length ? (
            <span className="text-[9px] text-gray-400 flex items-center gap-1 bg-gray-900/90 px-2 py-0.5 rounded border border-gray-800">
              <Paperclip className="h-2.5 w-2.5 text-sky-400" />
              {ticket.attachments?.filter(a => a.type === 'image' || a.type === 'doc').length} anexo(s)
            </span>
          ) : null}

          {audioAttachment && (
            <span className="text-[9px] text-amber-300 flex items-center gap-1 bg-amber-500/10 px-2 py-0.5 rounded border border-amber-500/20">
              <Mic className="h-2.5 w-2.5" />
              Áudio ({audioAttachment.duration || '0:35'})
            </span>
          )}
        </div>
      )}

      {/* Footer do Card: Solicitante & Previsão */}
      <div className="pt-2.5 border-t border-gray-800/80 flex items-center justify-between text-[10px] text-gray-400">
        <div className="flex items-center gap-1.5 truncate max-w-[150px]">
          <div className="h-4 w-4 rounded-full bg-sky-500/20 text-sky-400 flex items-center justify-center font-bold text-[9px] shrink-0">
            {ticket.requesterName.charAt(0)}
          </div>
          <div className="truncate flex flex-col">
            <span className="truncate text-gray-300 font-medium">{ticket.requesterName}</span>
          </div>
        </div>

        <div className="flex items-center gap-1 text-gray-400 shrink-0 font-mono text-[9px]">
          <Calendar className="h-3 w-3 text-sky-400" />
          {formatDate(ticket.delivery_forecast)}
        </div>
      </div>
    </div>
  );
}

// -------------------------------------------------------------
// MODAL DO AGENTE IA DE TRIAGEM (INTERACTIVE TECH INTAKE ASSISTANT)
// -------------------------------------------------------------
function AiTicketIntakeModal({
  onClose,
  onTicketCreated
}: {
  onClose: () => void;
  onTicketCreated: (ticket: TechTicket) => void;
}) {
  const [messages, setMessages] = useState<ChatMessage[]>([
    {
      id: 'msg-1',
      sender: 'ai',
      text: 'Olá! Sou o Agente de Triagem de Tecnologia da Ahut. Estou aqui para entender a atualização ou melhoria que você precisa no sistema de forma simples e direta, sem complicações técnicas. 😊\n\nEm qual parte do sistema você estava e o que você gostaria que fosse alterado ou criado?',
      timestamp: new Date().toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' }),
      suggestions: [
        'Central de Chat & WhatsApp',
        'Cadastro de Imóveis & Catálogo',
        'Agenda & Consultas',
        'Painel / Relatórios',
        'Nova Ferramenta'
      ]
    }
  ]);

  const [inputVal, setInputVal] = useState('');
  const [isRecording, setIsRecording] = useState(false);
  const [recordSeconds, setRecordSeconds] = useState(0);
  const [attachments, setAttachments] = useState<TicketAttachment[]>([]);
  const [isAiThinking, setIsAiThinking] = useState(false);
  const [understandingScore, setUnderstandingScore] = useState(25);
  const [isReadyToConfirm, setIsReadyToConfirm] = useState(false);

  // Extracted Ticket Summary
  const [extractedTicket, setExtractedTicket] = useState<{
    title: string;
    description: string;
    module: string;
    business_impact: string;
    priority: TicketPriority;
    acceptance_criteria: string[];
  }>({
    title: '',
    description: '',
    module: 'Frontend & UI',
    business_impact: '',
    priority: 'media',
    acceptance_criteria: []
  });

  const chatEndRef = useRef<HTMLDivElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    chatEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages, isAiThinking]);

  useEffect(() => {
    let interval: any;
    if (isRecording) {
      interval = setInterval(() => {
        setRecordSeconds(s => s + 1);
      }, 1000);
    } else {
      setRecordSeconds(0);
    }
    return () => clearInterval(interval);
  }, [isRecording]);

  const handleSendUserMessage = (textToSend?: string) => {
    const text = (textToSend || inputVal).trim();
    if (!text && attachments.length === 0 && !isRecording) return;

    const userMsg: ChatMessage = {
      id: `user-${Date.now()}`,
      sender: 'user',
      text: text || (attachments.length > 0 ? 'Enviei os arquivos anexados acima para ilustrar o chamado.' : ''),
      timestamp: new Date().toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' }),
      attachments: attachments.length > 0 ? [...attachments] : undefined
    };

    setMessages(prev => [...prev, userMsg]);
    setInputVal('');
    setAttachments([]);
    setIsAiThinking(true);

    // Simula aprofundamento do Agente de IA com perguntas humanas e não técnicas
    setTimeout(() => {
      const turnCount = messages.filter(m => m.sender === 'user').length + 1;

      let aiReply = '';
      let newScore = Math.min(85 + turnCount * 5, 100);
      let suggestions: string[] = [];

      const lowerText = text.toLowerCase();
      const isLeadDist = lowerText.includes('distribu') || lowerText.includes('desempenho') || lowerText.includes('15 min') || lowerText.includes('roleta') || lowerText.includes('corretor');
      const isSound = lowerText.includes('som') || lowerText.includes('sonoro') || lowerText.includes('audio') || lowerText.includes('barulho') || lowerText.includes('tocar') || lowerText.includes('alerta sonoro');

      // Título e Módulo detectados
      let summaryTitle = '';
      let detectedModule = 'Frontend & UI';
      let detectedDesc = '';
      let detectedImpact = '';
      let detectedCriteria = [
        'Interface intuitiva e feedback imediato',
        'Confirmação visual e sonora da ação',
        'Compatibilidade com todos os navegadores'
      ];

      if (isLeadDist) {
        summaryTitle = 'Distribuição Automática de Leads por Performance (15min timeout)';
        detectedModule = 'Leads & CRM';
        detectedDesc = 'Implementar regra de timeout de 15 minutos para distribuição automática de leads novos quando não distribuídos manualmente pelo admin. O algoritmo deve calcular o score de conversão dos corretores ativos e distribuir proporcionalmente (ex: 70% líder, 30% vice-líder).';
        detectedImpact = 'Elimina lead sem atendimento inicial, premia corretores de alta performance e aumenta a taxa de conversão em vendas.';
        detectedCriteria = [
          'Cron job/worker checando leads sem responsável há mais de 15 min',
          'Cálculo dinâmico de taxa de conversão dos corretores',
          'Distribuição ponderada na proporção de desempenho dos corretores online',
          'Notificação instantânea no WhatsApp do corretor'
        ];
      } else if (isSound) {
        summaryTitle = 'Alerta e Efeito Sonoro para Novas Notificações & Leads';
        detectedModule = 'Frontend & Notificações';
        detectedDesc = `Implementar reprodução de efeito sonoro de notificação suave e personalizável quando novas mensagens de WhatsApp ou novos leads forem atribuídos ao corretor. Mensagem original: "${text}".`;
        detectedImpact = 'Garante que os corretores e atendentes não percam mensagens urgentes de clientes mesmo quando estiverem com a aba em segundo plano.';
        detectedCriteria = [
          'Efeito sonoro executado ao receber nova mensagem de lead',
          'Interruptor (switch) para ligar/desligar o som nas configurações',
          'Controle de volume e suporte a áudio em segundo plano'
        ];
      } else {
        summaryTitle = text.length > 45 ? text.slice(0, 48) + '...' : `Melhoria: ${text}`;
        detectedModule = lowerText.includes('chat') || lowerText.includes('whatsapp') ? 'Central de Atendimento / WhatsApp' : lowerText.includes('lead') ? 'Leads & CRM' : lowerText.includes('imóve') || lowerText.includes('imove') || lowerText.includes('lote') ? 'Imóveis & Catálogo' : lowerText.includes('agenda') || lowerText.includes('visita') ? 'Agenda & Visitas' : lowerText.includes('contrato') ? 'Propostas & Contratos' : 'Frontend & UI';
        detectedDesc = `Solicitação de melhoria: ${text}. Validado pelo colaborador para otimização da rotina diária no ecossistema.`;
        detectedImpact = 'Otimiza o fluxo de trabalho da equipe, reduz cliques repetitivos e previne erros operacionais.';
      }

      setExtractedTicket({
        title: summaryTitle,
        description: detectedDesc,
        module: detectedModule,
        business_impact: detectedImpact,
        priority: isLeadDist || lowerText.includes('urgente') || lowerText.includes('travou') ? 'alta' : 'media',
        acceptance_criteria: detectedCriteria
      });

      setIsReadyToConfirm(true);

      if (turnCount === 1) {
        if (isSound) {
          aiReply = 'Excelente sugestão! Um efeito sonoro é essencial para o corretor não perder leads enquanto usa outras abas. O som deve tocar para todas as mensagens ou apenas para novos leads recebidos? Você já pode confirmar o chamado ao lado ou responder abaixo!';
          suggestions = ['Apenas para novos leads', 'Para todas as mensagens de clientes', 'Com opção de silenciar no painel'];
        } else if (isLeadDist) {
          aiReply = 'Excelente ideia! A distribuição automática de leads por score/desempenho após 15 min evita ociosidade. Caso o corretor líder esteja ocupado, devemos passar para o próximo? Você já pode confirmar o chamado ao lado ou detalhar mais!';
          suggestions = ['Sim, passar para o próximo se estiver ocupado', 'Apenas notificar no WhatsApp', 'Manter a proporção 70/30'];
        } else {
          aiReply = 'Entendi perfeitamente o seu pedido! Já estruturei a especificação técnica ao lado. Você gostaria de adicionar mais algum detalhe ou podemos submeter para a coluna "A Analisar"?';
          suggestions = ['Pode submeter para o time técnico', 'Adicionar aviso sonoro', 'Prioridade máxima'];
        }
      } else {
        newScore = 100;
        aiReply = 'Perfeito! Informações registradas com sucesso. Confira o resumo no painel ao lado e clique no botão verde "Confirmar e Submeter Chamado" para que o card apareça no Kanban!';
      }

      setUnderstandingScore(newScore);
      setIsAiThinking(false);

      setMessages(prev => [
        ...prev,
        {
          id: `ai-${Date.now()}`,
          sender: 'ai',
          text: aiReply,
          timestamp: new Date().toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' }),
          suggestions: suggestions.length > 0 ? suggestions : undefined
        }
      ]);
    }, 800);
  };

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (!files || files.length === 0) return;

    const newAttachments: TicketAttachment[] = Array.from(files).map((f, i) => {
      const isImg = f.type.startsWith('image/');
      const isVid = f.type.startsWith('video/') || f.name.endsWith('.mp4') || f.name.endsWith('.mov') || f.name.endsWith('.webm');
      const isAud = f.type.startsWith('audio/') || f.name.endsWith('.mp3') || f.name.endsWith('.wav');

      const attType: 'image' | 'doc' | 'audio' | 'video' = isImg ? 'image' : isVid ? 'video' : isAud ? 'audio' : 'doc';

      return {
        id: `att-${Date.now()}-${i}`,
        name: f.name,
        type: attType,
        url: URL.createObjectURL(f),
        size: `${Math.round(f.size / 1024)} KB`,
        duration: isVid ? '0:42' : undefined,
        transcription: isVid 
          ? `[Transcrição Automática AVA]: "Gravação de tela demonstrando o fluxo da solicitação. O áudio do colaborador foi processado e sincronizado com os requisitos do chamado."`
          : undefined
      };
    });

    setAttachments(prev => [...prev, ...newAttachments]);

    // Se houver vídeo, a AVA avisa no chat que processou a transcrição
    const hasVideo = newAttachments.some(a => a.type === 'video');
    if (hasVideo) {
      setIsAiThinking(true);
      setTimeout(() => {
        setIsAiThinking(false);
        setMessages(prev => [
          ...prev,
          {
            id: `ai-video-${Date.now()}`,
            sender: 'ai',
            text: '🎬 **Vídeo recebido e processado!** A AVA transcreveu o áudio falado dentro da sua gravação de tela com sucesso e incorporou ao diagnóstico do chamado!',
            timestamp: new Date().toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' }),
            suggestions: ['Confirmar e Submeter Chamado', 'Adicionar mais detalhes']
          }
        ]);
        setUnderstandingScore(95);
        setIsReadyToConfirm(true);
      }, 1000);
    }
  };

  const handleToggleRecordAudio = () => {
    if (isRecording) {
      setIsRecording(false);
      const audioAtt: TicketAttachment = {
        id: `audio-${Date.now()}`,
        name: `Gravacao_voz_chamado_${recordSeconds}s.mp3`,
        type: 'audio',
        url: '#',
        duration: `0:${recordSeconds < 10 ? '0' : ''}${recordSeconds}`
      };
      setAttachments(prev => [...prev, audioAtt]);
    } else {
      setIsRecording(true);
    }
  };

  const handleFinalSubmit = () => {
    const ticketNum = Math.floor(100 + Math.random() * 900);
    const newTicket: TechTicket = {
      id: `ticket-${Date.now()}`,
      code: `TCK-2026-${ticketNum}`,
      title: extractedTicket.title || 'Melhoria de Sistema Triada por IA',
      description: extractedTicket.description || 'Chamado gerado a partir de entrevista com o colaborador via Agente de IA.',
      module: extractedTicket.module,
      requesterName: 'Rodrigo Sacramento',
      requesterRole: 'Colaborador',
      requesterDepartment: 'Comercial & Vendas / Operações',
      priority: extractedTicket.priority,
      main_status: 'a_analisar',
      subcategory: 'nao_especificado',
      delivery_forecast: new Date(Date.now() + 86400000 * 3).toISOString().split('T')[0],
      created_at: new Date().toISOString(),
      assigned_to: 'Squad Ahut Tech (CTO)',
      impact_level: extractedTicket.priority === 'alta' ? 'Alto' : 'Médio',
      is_ai_triaged: true,
      business_impact: extractedTicket.business_impact,
      acceptance_criteria: extractedTicket.acceptance_criteria,
      chat_transcript: messages,
      attachments: attachments.length > 0 ? attachments : undefined,
      timeline: [
        { status: 'Chamado Triado via Agente IA', date: new Date().toLocaleDateString('pt-BR') + ' ' + new Date().toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' }), user: 'Agente de Triagem' },
        { status: 'Encaminhado para Fila "A Analisar"', date: new Date().toLocaleDateString('pt-BR') + ' ' + new Date().toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' }), user: 'Squad Ahut Tech' }
      ]
    };

    onTicketCreated(newTicket);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/85 backdrop-blur-md animate-in fade-in duration-200">
      <div className="bg-[#0b101b] border border-sky-500/30 rounded-2xl w-full max-w-5xl h-[88vh] flex flex-col shadow-2xl overflow-hidden">

        {/* Header do Agente IA */}
        <div className="p-4 bg-[#0e1626] border-b border-sky-500/20 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="relative">
              <div className="p-2.5 bg-gradient-to-tr from-sky-500 to-purple-600 rounded-xl text-slate-950 shadow-[0_0_20px_rgba(14,165,233,0.4)]">
                <Bot className="h-6 w-6 text-white" />
              </div>
              <span className="absolute -bottom-1 -right-1 h-3.5 w-3.5 bg-emerald-500 border-2 border-[#0b101b] rounded-full"></span>
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h3 className="font-bold text-sm text-white">Agente de Triagem de Tecnologia</h3>
                <span className="text-[10px] bg-sky-500/10 text-sky-300 px-2 py-0.5 rounded-full border border-sky-500/30 font-mono">
                  Online & Empático
                </span>
              </div>
              <p className="text-[11px] text-gray-400">
                Conte o que você precisa em palavras simples. A IA cuidará da especificação técnica.
              </p>
            </div>
          </div>

          {/* Termômetro de Compreensão */}
          <div className="hidden sm:flex items-center gap-3 bg-gray-900/80 px-4 py-2 rounded-xl border border-gray-800">
            <div className="text-right">
              <div className="text-[10px] text-gray-400">Diagnóstico do Chamado</div>
              <div className="text-xs font-bold text-sky-400 font-mono">{understandingScore}% Compreendido</div>
            </div>
            <div className="w-24 bg-gray-800 h-2.5 rounded-full overflow-hidden">
              <div
                className="bg-gradient-to-r from-sky-500 to-emerald-400 h-full transition-all duration-500"
                style={{ width: `${understandingScore}%` }}
              ></div>
            </div>
          </div>

          <button onClick={onClose} className="text-gray-400 hover:text-white p-1 rounded-lg hover:bg-gray-800">
            <X className="h-5 w-5" />
          </button>
        </div>

        {/* Layout Split: Chat à Esquerda / Resumo Estruturado à Direita */}
        <div className="flex-1 grid grid-cols-1 lg:grid-cols-12 overflow-hidden">

          {/* Lado Esquerdo: Área do Chat Interativo */}
          <div className="lg:col-span-7 flex flex-col h-full border-r border-gray-800/80 bg-[#080d16]/60">

            {/* Mensagens */}
            <div className="flex-1 overflow-y-auto p-4 space-y-4 custom-scrollbar">
              {messages.map(msg => (
                <div
                  key={msg.id}
                  className={`flex gap-3 ${msg.sender === 'user' ? 'justify-end' : 'justify-start'}`}
                >
                  {msg.sender === 'ai' && (
                    <div className="h-7 w-7 rounded-lg bg-sky-500/20 border border-sky-500/30 text-sky-400 flex items-center justify-center shrink-0">
                      <Bot className="h-4 w-4" />
                    </div>
                  )}

                  <div className={`max-w-[85%] space-y-2`}>
                    <div className={`p-3.5 rounded-2xl text-xs leading-relaxed ${msg.sender === 'user'
                        ? 'bg-sky-600 text-white rounded-tr-none'
                        : 'bg-[#121a2c] text-gray-200 border border-gray-800 rounded-tl-none'
                      }`}>
                      <p className="whitespace-pre-line">{msg.text}</p>

                      {/* Anexos na mensagem */}
                      {msg.attachments && msg.attachments.length > 0 && (
                        <div className="mt-2.5 pt-2 border-t border-white/20 space-y-1.5">
                          {msg.attachments.map(att => (
                            <div key={att.id} className="flex items-center gap-2 bg-black/20 p-1.5 rounded-lg text-[10px]">
                              {att.type === 'audio' ? <Mic className="h-3 w-3 text-amber-300" /> : <Paperclip className="h-3 w-3 text-sky-300" />}
                              <span className="truncate">{att.name}</span>
                              {att.duration && <span className="font-mono text-amber-300">({att.duration})</span>}
                            </div>
                          ))}
                        </div>
                      )}
                    </div>

                    <div className={`text-[9px] text-gray-500 ${msg.sender === 'user' ? 'text-right' : 'text-left'}`}>
                      {msg.timestamp}
                    </div>

                    {/* Sugestões Rápidas */}
                    {msg.suggestions && msg.suggestions.length > 0 && (
                      <div className="flex flex-wrap gap-1.5 pt-1">
                        {msg.suggestions.map((sug, idx) => (
                          <button
                            key={idx}
                            onClick={() => handleSendUserMessage(sug)}
                            className="text-[11px] bg-sky-500/10 hover:bg-sky-500/20 text-sky-300 border border-sky-500/30 px-2.5 py-1 rounded-full transition-all text-left"
                          >
                            {sug}
                          </button>
                        ))}
                      </div>
                    )}
                  </div>

                  {msg.sender === 'user' && (
                    <div className="h-7 w-7 rounded-lg bg-gray-800 border border-gray-700 text-gray-300 flex items-center justify-center shrink-0">
                      <User className="h-4 w-4" />
                    </div>
                  )}
                </div>
              ))}

              {isAiThinking && (
                <div className="flex items-center gap-2 text-xs text-sky-400 p-2 bg-sky-500/10 rounded-xl w-fit border border-sky-500/20 animate-pulse">
                  <Bot className="h-4 w-4 animate-spin" />
                  <span>O Agente está analisando sua solicitação...</span>
                </div>
              )}
              <div ref={chatEndRef} />
            </div>

            {/* Anexos Pendentes */}
            {attachments.length > 0 && (
              <div className="px-4 py-2 bg-gray-950 border-t border-gray-800 flex flex-wrap gap-2">
                {attachments.map(att => (
                  <div key={att.id} className="flex items-center gap-1.5 bg-gray-900 border border-gray-700 px-2.5 py-1 rounded-lg text-[10px] text-gray-300">
                    {att.type === 'audio' ? <Mic className="h-3 w-3 text-amber-400" /> : <Paperclip className="h-3 w-3 text-sky-400" />}
                    <span className="truncate max-w-[120px]">{att.name}</span>
                    <button
                      onClick={() => setAttachments(prev => prev.filter(a => a.id !== att.id))}
                      className="text-red-400 hover:text-red-300 ml-1"
                    >
                      <X className="h-3 w-3" />
                    </button>
                  </div>
                ))}
              </div>
            )}

            {/* Barra de Input / Voz / Anexos */}
            <div className="p-3 bg-[#0d1424] border-t border-gray-800">
              {isRecording ? (
                <div className="flex items-center justify-between bg-red-500/10 border border-red-500/30 p-2.5 rounded-xl text-xs text-red-400 animate-pulse">
                  <div className="flex items-center gap-2">
                    <span className="h-3 w-3 bg-red-500 rounded-full animate-ping"></span>
                    <span className="font-bold">Gravando áudio de voz... 0:{recordSeconds < 10 ? '0' : ''}{recordSeconds}</span>
                  </div>
                  <button
                    onClick={handleToggleRecordAudio}
                    className="bg-red-500 hover:bg-red-400 text-white px-3 py-1 rounded-lg text-xs font-bold"
                  >
                    Finalizar Gravação
                  </button>
                </div>
              ) : (
                <div className="flex items-center gap-2">
                  <input
                    type="file"
                    ref={fileInputRef}
                    onChange={handleFileUpload}
                    multiple
                    className="hidden"
                    accept="image/*,video/*,audio/*,.pdf,.doc,.docx,.txt"
                  />
                  <button
                    type="button"
                    onClick={() => fileInputRef.current?.click()}
                    className="p-2.5 bg-gray-900 hover:bg-gray-800 text-gray-400 hover:text-sky-400 rounded-xl border border-gray-800 transition-colors"
                    title="Anexar prints ou documentos"
                  >
                    <Paperclip className="h-4 w-4" />
                  </button>

                  <button
                    type="button"
                    onClick={handleToggleRecordAudio}
                    className="p-2.5 bg-gray-900 hover:bg-gray-800 text-gray-400 hover:text-amber-400 rounded-xl border border-gray-800 transition-colors"
                    title="Gravar áudio com explicação"
                  >
                    <Mic className="h-4 w-4" />
                  </button>

                  <input
                    type="text"
                    placeholder="Explique com suas palavras o que precisa..."
                    className="flex-1 bg-gray-900/90 border border-gray-800 rounded-xl px-4 py-2.5 text-xs text-white outline-none focus:border-sky-500 transition-all placeholder:text-gray-500"
                    value={inputVal}
                    onChange={(e) => setInputVal(e.target.value)}
                    onKeyDown={(e) => {
                      if (e.key === 'Enter') handleSendUserMessage();
                    }}
                  />

                  <button
                    type="button"
                    onClick={() => handleSendUserMessage()}
                    className="p-2.5 bg-sky-500 hover:bg-sky-400 text-slate-950 rounded-xl font-bold transition-all shadow-[0_0_10px_rgba(14,165,233,0.3)]"
                  >
                    <Send className="h-4 w-4" />
                  </button>
                </div>
              )}
            </div>
          </div>

          {/* Lado Direito: Resumo Estruturado & Confirmação */}
          <div className="lg:col-span-5 flex flex-col h-full bg-[#0d1321] p-5 justify-between space-y-4 overflow-y-auto custom-scrollbar">
            <div className="space-y-4">
              <div className="flex items-center gap-2 border-b border-gray-800 pb-3">
                <Sparkles className="h-4 w-4 text-sky-400" />
                <h4 className="text-xs font-bold text-white uppercase tracking-wider">
                  Especificação Gerada pela IA
                </h4>
              </div>

              {understandingScore < 80 ? (
                <div className="h-64 flex flex-col items-center justify-center text-center p-6 border border-dashed border-gray-800 rounded-xl space-y-3">
                  <Bot className="h-10 w-10 text-sky-400/50 animate-bounce" />
                  <p className="text-xs text-gray-400 font-medium">
                    O Agente está conversando com o colaborador para montar o diagnóstico completo do ticket.
                  </p>
                  <span className="text-[10px] text-sky-400 bg-sky-500/10 px-3 py-1 rounded-full border border-sky-500/20">
                    Aguarde o preenchimento das informações
                  </span>
                </div>
              ) : (
                <div className="space-y-3 text-xs animate-in fade-in">
                  <div>
                    <span className="text-[10px] font-bold uppercase text-gray-500">Título Estruturado</span>
                    <p className="font-semibold text-white mt-0.5 bg-gray-900 p-2.5 rounded-lg border border-gray-800">
                      {extractedTicket.title || 'Atualização no Sistema'}
                    </p>
                  </div>

                  <div className="grid grid-cols-2 gap-2">
                    <div>
                      <span className="text-[10px] font-bold uppercase text-gray-500">Módulo Identificado</span>
                      <p className="font-medium text-sky-300 mt-0.5 bg-gray-900 p-2 rounded-lg border border-gray-800">
                        {extractedTicket.module}
                      </p>
                    </div>
                    <div>
                      <span className="text-[10px] font-bold uppercase text-gray-500">Prioridade Sugerida</span>
                      <p className="font-bold text-amber-400 mt-0.5 bg-gray-900 p-2 rounded-lg border border-gray-800">
                        🟡 Média Prioridade
                      </p>
                    </div>
                  </div>

                  <div>
                    <span className="text-[10px] font-bold uppercase text-gray-500">Impacto no Negócio</span>
                    <p className="text-gray-300 mt-0.5 bg-gray-900 p-2.5 rounded-lg border border-gray-800 leading-relaxed">
                      {extractedTicket.business_impact}
                    </p>
                  </div>

                  <div>
                    <span className="text-[10px] font-bold uppercase text-gray-500">Critérios de Aceite</span>
                    <ul className="space-y-1 mt-1 bg-gray-900 p-2.5 rounded-lg border border-gray-800 text-[11px] text-gray-300">
                      {extractedTicket.acceptance_criteria.map((crit, idx) => (
                        <li key={idx} className="flex items-center gap-1.5">
                          <Check className="h-3 w-3 text-emerald-400 shrink-0" />
                          <span>{crit}</span>
                        </li>
                      ))}
                    </ul>
                  </div>
                </div>
              )}
            </div>

            {/* Rodapé com Ação de Confirmação */}
            <div className="pt-4 border-t border-gray-800 space-y-2">
              <button
                type="button"
                disabled={!isReadyToConfirm}
                onClick={handleFinalSubmit}
                className={`w-full py-3 rounded-xl font-bold text-xs uppercase tracking-wider flex items-center justify-center gap-2 transition-all ${isReadyToConfirm
                    ? 'bg-gradient-to-r from-emerald-500 to-sky-500 hover:from-emerald-400 hover:to-sky-400 text-slate-950 shadow-[0_0_20px_rgba(16,185,129,0.3)] cursor-pointer'
                    : 'bg-gray-800 text-gray-500 cursor-not-allowed'
                  }`}
              >
                <CheckCircle2 className="h-4 w-4" />
                Confirmar e Submeter Chamado para "A Analisar"
              </button>
              <p className="text-[10px] text-gray-500 text-center">
                Ao confirmar, o chamado receberá um ID único e aparecerá na coluna A Analisar do Kanban.
              </p>
            </div>
          </div>
        </div>

      </div>
    </div>
  );
}

// -------------------------------------------------------------
// MODAL DE DETALHES DO TICKET (ENTERPRISE MULTI-TAB INSPECTOR)
// -------------------------------------------------------------
function TicketDetailModal({
  ticket,
  onClose,
  onEdit,
  onDelete,
  onMove
}: {
  ticket: TechTicket;
  onClose: () => void;
  onEdit: () => void;
  onDelete: () => void;
  onMove: (id: string, main: TicketMainStatus, sub: TicketSubcategory) => void;
}) {
  const [activeTab, setActiveTab] = useState<'overview' | 'transcript' | 'attachments' | 'timeline'>('overview');

  const priorityStyles = {
    critica: 'bg-purple-500/15 text-purple-300 border-purple-500/30',
    alta: 'bg-red-500/15 text-red-300 border-red-500/30',
    media: 'bg-amber-500/15 text-amber-300 border-amber-500/30',
    baixa: 'bg-emerald-500/15 text-emerald-300 border-emerald-500/30'
  }[ticket.priority];

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-md animate-in fade-in duration-200">
      <div className="bg-[#0d1321] border border-gray-800 rounded-2xl w-full max-w-4xl max-h-[90vh] flex flex-col shadow-2xl overflow-hidden">

        {/* Header do Modal */}
        <div className="p-5 bg-[#101827] border-b border-gray-800 flex items-center justify-between">
          <div className="space-y-1">
            <div className="flex items-center gap-2">
              <span className="font-mono font-bold text-xs bg-sky-500/10 text-sky-400 px-2.5 py-0.5 rounded border border-sky-500/20">
                {ticket.code}
              </span>
              <span className={`text-[10px] font-bold uppercase px-2.5 py-0.5 rounded border ${priorityStyles}`}>
                Prioridade {ticket.priority}
              </span>
              {ticket.is_ai_triaged && (
                <span className="text-[10px] bg-purple-500/20 text-purple-300 px-2 py-0.5 rounded border border-purple-500/30 flex items-center gap-1">
                  <Bot className="h-3 w-3" /> Triado com Agente IA
                </span>
              )}
            </div>
            <h2 className="text-base font-bold text-white">
              {ticket.title}
            </h2>
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={onEdit}
              className="p-2 bg-gray-800 hover:bg-gray-700 text-gray-300 hover:text-white rounded-lg text-xs font-medium flex items-center gap-1.5"
            >
              <Edit3 className="h-3.5 w-3.5" /> Editar
            </button>
            <button onClick={onClose} className="text-gray-400 hover:text-white p-1 rounded-lg hover:bg-gray-800">
              <X className="h-5 w-5" />
            </button>
          </div>
        </div>

        {/* Abas do Ticket */}
        <div className="flex items-center gap-1 px-5 border-b border-gray-800 bg-[#090d16]">
          <button
            onClick={() => setActiveTab('overview')}
            className={`px-4 py-3 text-xs font-bold border-b-2 transition-all flex items-center gap-2 ${activeTab === 'overview'
                ? 'border-sky-500 text-sky-400'
                : 'border-transparent text-gray-400 hover:text-gray-200'
              }`}
          >
            <SlidersHorizontal className="h-3.5 w-3.5" /> Visão Geral & Requisitos
          </button>

          {ticket.chat_transcript && (
            <button
              onClick={() => setActiveTab('transcript')}
              className={`px-4 py-3 text-xs font-bold border-b-2 transition-all flex items-center gap-2 ${activeTab === 'transcript'
                  ? 'border-sky-500 text-sky-400'
                  : 'border-transparent text-gray-400 hover:text-gray-200'
                }`}
            >
              <Bot className="h-3.5 w-3.5" /> Transcrição da Entrevista com Agente
            </button>
          )}

          <button
            onClick={() => setActiveTab('attachments')}
            className={`px-4 py-3 text-xs font-bold border-b-2 transition-all flex items-center gap-2 ${activeTab === 'attachments'
                ? 'border-sky-500 text-sky-400'
                : 'border-transparent text-gray-400 hover:text-gray-200'
              }`}
          >
            <Paperclip className="h-3.5 w-3.5" /> Anexos ({ticket.attachments?.length || 0})
          </button>

          <button
            onClick={() => setActiveTab('timeline')}
            className={`px-4 py-3 text-xs font-bold border-b-2 transition-all flex items-center gap-2 ${activeTab === 'timeline'
                ? 'border-sky-500 text-sky-400'
                : 'border-transparent text-gray-400 hover:text-gray-200'
              }`}
          >
            <Activity className="h-3.5 w-3.5" /> Histórico & Auditoria
          </button>
        </div>

        {/* Conteúdo da Aba */}
        <div className="flex-1 overflow-y-auto p-6 space-y-6 custom-scrollbar text-xs">

          {activeTab === 'overview' && (
            <div className="space-y-6">
              {/* Metadados Grid */}
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 p-4 rounded-xl bg-gray-900/60 border border-gray-800">
                <div>
                  <span className="text-[10px] uppercase text-gray-500 font-bold">Módulo</span>
                  <p className="font-semibold text-white mt-0.5">{ticket.module}</p>
                </div>
                <div>
                  <span className="text-[10px] uppercase text-gray-500 font-bold">Solicitante</span>
                  <p className="font-semibold text-white mt-0.5">{ticket.requesterName} ({ticket.requesterDepartment})</p>
                </div>
                <div>
                  <span className="text-[10px] uppercase text-gray-500 font-bold">Responsável Técnico</span>
                  <p className="font-semibold text-sky-400 mt-0.5">{ticket.assigned_to}</p>
                </div>
                <div>
                  <span className="text-[10px] uppercase text-gray-500 font-bold">Previsão de Entrega</span>
                  <p className="font-semibold text-emerald-400 font-mono mt-0.5">{ticket.delivery_forecast || 'A Definir'}</p>
                </div>
              </div>

              {/* Descrição */}
              <div>
                <h4 className="font-bold text-gray-300 uppercase tracking-wider text-[11px] mb-1.5">Descrição do Chamado</h4>
                <div className="bg-gray-900/80 p-4 rounded-xl border border-gray-800 text-gray-300 leading-relaxed">
                  {ticket.description}
                </div>
              </div>

              {/* Impacto no Negócio */}
              {ticket.business_impact && (
                <div>
                  <h4 className="font-bold text-gray-300 uppercase tracking-wider text-[11px] mb-1.5">Impacto no Negócio / Operação</h4>
                  <div className="bg-sky-500/5 p-4 rounded-xl border border-sky-500/20 text-sky-200 leading-relaxed">
                    {ticket.business_impact}
                  </div>
                </div>
              )}

              {/* Critérios de Aceite */}
              {ticket.acceptance_criteria && ticket.acceptance_criteria.length > 0 && (
                <div>
                  <h4 className="font-bold text-gray-300 uppercase tracking-wider text-[11px] mb-1.5">Critérios de Aceite</h4>
                  <div className="bg-gray-900/80 p-4 rounded-xl border border-gray-800 space-y-2">
                    {ticket.acceptance_criteria.map((crit, i) => (
                      <div key={i} className="flex items-center gap-2 text-gray-300">
                        <CheckCircle2 className="h-4 w-4 text-emerald-400 shrink-0" />
                        <span>{crit}</span>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
          )}

          {activeTab === 'transcript' && ticket.chat_transcript && (
            <div className="space-y-4">
              <div className="p-3 bg-purple-500/10 border border-purple-500/20 rounded-xl text-purple-300 text-[11px] flex items-center gap-2">
                <Bot className="h-4 w-4 shrink-0" />
                <span>Esta é a conversa original de triagem gravada entre o colaborador e o Agente de IA da Ahut.</span>
              </div>

              <div className="space-y-3">
                {ticket.chat_transcript.map(msg => (
                  <div key={msg.id} className={`p-3.5 rounded-xl border ${msg.sender === 'ai' ? 'bg-[#121a2c] border-sky-500/20' : 'bg-gray-900 border-gray-800'}`}>
                    <div className="flex items-center justify-between mb-1">
                      <span className="font-bold text-[10px] uppercase text-sky-400 flex items-center gap-1">
                        {msg.sender === 'ai' ? <><Bot className="h-3 w-3" /> Agente IA</> : <><User className="h-3 w-3" /> Solicitante</>}
                      </span>
                      <span className="text-[9px] text-gray-500">{msg.timestamp}</span>
                    </div>
                    <p className="text-gray-200 leading-relaxed">{msg.text}</p>
                  </div>
                ))}
              </div>
            </div>
          )}

          {activeTab === 'attachments' && (
            <div className="space-y-4">
              {(!ticket.attachments || ticket.attachments.length === 0) ? (
                <div className="h-40 flex items-center justify-center text-gray-500 border border-dashed border-gray-800 rounded-xl">
                  Nenhum anexo vinculado a este chamado
                </div>
              ) : (
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  {ticket.attachments.map(att => (
                    <div key={att.id} className="p-3.5 bg-gray-900 border border-gray-800 rounded-xl space-y-2">
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-3">
                          <div className="p-2 bg-sky-500/10 rounded-lg text-sky-400">
                            {att.type === 'image' && <ImageIcon className="h-5 w-5" />}
                            {att.type === 'doc' && <FileText className="h-5 w-5" />}
                            {att.type === 'audio' && <Mic className="h-5 w-5 text-amber-400" />}
                            {att.type === 'video' && <Video className="h-5 w-5 text-purple-400" />}
                          </div>
                          <div>
                            <h5 className="font-semibold text-gray-200 truncate max-w-[180px]">{att.name}</h5>
                            <span className="text-[10px] text-gray-500">{att.size || att.duration}</span>
                          </div>
                        </div>
                        <span className="text-xs text-sky-400 font-bold hover:underline cursor-pointer">
                          Visualizar
                        </span>
                      </div>

                      {att.transcription && (
                        <div className="p-2.5 bg-[#080d16] border border-purple-500/30 rounded-lg text-[11px] text-purple-200 mt-1">
                          <span className="font-bold text-purple-400 flex items-center gap-1 mb-0.5">
                            <Bot className="h-3 w-3" /> Transcrição do Áudio do Vídeo (AVA):
                          </span>
                          <p className="italic text-gray-300 leading-relaxed">{att.transcription}</p>
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}

          {activeTab === 'timeline' && (
            <div className="space-y-4">
              <div className="space-y-3 relative before:absolute before:left-3.5 before:top-2 before:bottom-2 before:w-0.5 before:bg-gray-800">
                {ticket.timeline?.map((item, idx) => (
                  <div key={idx} className="flex items-start gap-4 relative pl-8">
                    <span className="absolute left-2 top-1.5 h-3.5 w-3.5 rounded-full bg-sky-500 border-2 border-gray-950"></span>
                    <div className="bg-gray-900 border border-gray-800 p-3 rounded-xl flex-1">
                      <div className="flex items-center justify-between">
                        <span className="font-bold text-white">{item.status}</span>
                        <span className="text-[10px] text-gray-500 font-mono">{item.date}</span>
                      </div>
                      <span className="text-[10px] text-gray-400 mt-0.5 block">Executado por: {item.user}</span>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

        </div>

        {/* Footer do Modal com Atalho de Movimentação e Exclusão */}
        <div className="p-4 bg-[#101827] border-t border-gray-800 flex flex-wrap items-center justify-between gap-3 text-xs">
          <div className="flex items-center gap-2">
            <span className="text-gray-400 font-medium">Mover chamado para:</span>
            <select
              className="bg-gray-900 border border-gray-800 rounded-lg px-3 py-1.5 text-white outline-none focus:ring-1 focus:ring-sky-500 font-medium"
              value={ticket.main_status}
              onChange={(e) => {
                const newMain = e.target.value as TicketMainStatus;
                let defaultSub: TicketSubcategory = 'nao_especificado';
                if (newMain === 'executando') defaultSub = 'em_planejamento';
                if (newMain === 'executado') defaultSub = 'atualizado';
                onMove(ticket.id, newMain, defaultSub);
              }}
            >
              <option value="a_analisar">A Analisar</option>
              <option value="a_executar">A Executar</option>
              <option value="executando">Em Execução</option>
              <option value="executado">Executado</option>
            </select>
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={onDelete}
              className="px-3 py-2 bg-red-500/10 hover:bg-red-500/20 text-red-400 rounded-xl font-bold uppercase tracking-wider text-[11px] flex items-center gap-1.5 border border-red-500/20"
            >
              <Trash2 className="h-3.5 w-3.5" /> Excluir
            </button>
            <button
              onClick={onClose}
              className="px-4 py-2 bg-gray-800 hover:bg-gray-700 text-gray-300 rounded-xl font-bold uppercase tracking-wider text-[11px]"
            >
              Fechar
            </button>
          </div>
        </div>

      </div>
    </div>
  );
}
