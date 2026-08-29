import { createContext, useContext, useState, useEffect, useCallback, ReactNode } from 'react';

type Lang = 'pt' | 'es';

const STORAGE_KEY = 'estate_lang';

const translations: Record<Lang, Record<string, string>> = {
  pt: {
    // Sidebar
    'nav.dashboard': 'Dashboard',
    'nav.leads': 'Leads',
    'nav.atendimento': 'Atendimento',
    'nav.agenda': 'Agenda & Visitas',
    'nav.imoveis': 'Imóveis',
    'nav.propostas': 'Propostas',
    'nav.contratos': 'Contratos',
    'nav.juridico': 'Jurídico & Contratos',
    'nav.clientes': 'Clientes',
    'nav.comissoes': 'Comissões',
    'nav.marketing': 'Marketing',
    'nav.treinamentos': 'Treinamentos',
    'nav.gestao': 'Gestão',
    'nav.vendas': 'Vendas',
    'nav.financeiro': 'Financeiro',
    'nav.corretores': 'Corretores',
    'nav.tecnologia': 'Tecnologia & IA',
    'nav.notificacoes': 'Notificações',
    'nav.sair': 'Sair',

    // Header
    'header.perfil': 'Perfil',
    'header.configuracoes': 'Configurações',
    'header.sair': 'Sair',

    // Login
    'login.bemvindo': 'Bem-vindo de volta',
    'login.credenciais': 'Entre com suas credenciais para acessar o sistema.',
    'login.entrar': 'Entrar',
    'login.email': 'Email',
    'login.senha': 'Senha',
    'login.esqueceu': 'Esqueceu a senha?',
    'login.invalido': 'Email ou senha inválidos',
    'login.google': 'Entrar com Google',
    'login.ou': 'OU',

    // Atendimento
    'atd.busca': 'Buscar conversas...',
    'atd.nova': 'Nova conversa',
    'atd.meus': 'Meus',
    'atd.equipe': 'Equipe',
    'atd.grupos': 'Grupos',
    'atd.naolidas': 'Não lidas',
    'atd.arquivadas': 'Arquivadas',
    'atd.todos': 'Todas',
    'atd.digitando': 'Digite sua mensagem...',
    'atd.enviar': 'Enviar',
    'atd.transferir': 'Transferir',
    'atd.aceitar': 'Aceitar',
    'atd.ignorar': 'Ignorar',
    'atd.notas': 'Anotações',
    'atd.ia': 'IA Ativa',
    'atd.semConversa': 'Selecione uma conversa para iniciar o atendimento.',
    'atd.participantes': 'Participantes',
    'atd.anexar': 'Anexar',
    'atd.audio': 'Áudio',
    'atd.tag': 'Adicionar tag...',
    'atd.contato': 'Editar Contato',
    'atd.excluir': 'Excluir conversa',

    // Dashboard
    'dash.novosLeads': 'Novos Leads',
    'dash.vendasHoje': 'Vendas Hoje',
    'dash.visitas': 'Visitas Hoje',
    'dash.taxaConversao': 'Taxa de Conversão',
    'dash.periodo': 'Período',

    // Leads  
    'lead.novo': 'Novo Lead',
    'lead.busca': 'Buscar leads...',
    'lead.score': 'Score',
    'lead.fonte': 'Fonte',
    'lead.status': 'Status',
    'lead.responsavel': 'Responsável',
    'lead.data': 'Data',
    'lead.telefone': 'Telefone',
    'lead.email': 'Email',
    'lead.semResultados': 'Nenhum lead encontrado.',

    // Notificações
    'notif.titulo': 'Notificações',
    'notif.novas': 'novas',
    'notif.todas': 'Todas',
    'notif.naolidas': 'Não lidas',
    'notif.leads': 'Leads',
    'notif.vendas': 'Vendas',
    'notif.lembretes': 'Lembretes',
    'notif.atrasos': 'Atrasos',
    'notif.vazio': 'Tudo em dia!',
    'notif.semNotif': 'Nenhuma notificação pendente.',
    'notif.marcarLidas': 'Marcar todas lidas',
    'notif.som': 'Som',

    // Tecnologia
    'tec.titulo': 'Tecnologia & IA',
    'tec.chamados': 'Chamados',
    'tec.novo': 'Novo Chamado',
    'tec.analisar': 'A Analisar',
    'tec.executar': 'A Executar',
    'tec.executando': 'Executando',
    'tec.executado': 'Executado',

    // Configurações
    'config.titulo': 'Configurações',
    'config.perfil': 'Perfil',
    'config.empresa': 'Empresa',
    'config.notificacoes': 'Notificações',
    'config.idioma': 'Idioma',
    'config.seguranca': 'Segurança',
    'config.aparencia': 'Aparência',
    'config.salvar': 'Salvar alterações',

    // Geral
    'geral.sim': 'Sim',
    'geral.nao': 'Não',
    'geral.cancelar': 'Cancelar',
    'geral.confirmar': 'Confirmar',
    'geral.carregando': 'Carregando...',
    'geral.erro': 'Erro',
    'geral.sucesso': 'Sucesso',
    'geral.voltando': 'Voltando...',

    // Idioma toggle
    'lang.pt': 'Português',
    'lang.es': 'Español',
  },

  es: {
    // Sidebar
    'nav.dashboard': 'Panel',
    'nav.leads': 'Prospectos',
    'nav.atendimento': 'Atención',
    'nav.agenda': 'Agenda & Visitas',
    'nav.imoveis': 'Propiedades',
    'nav.propostas': 'Propuestas',
    'nav.contratos': 'Contratos',
    'nav.juridico': 'Jurídico & Contratos',
    'nav.clientes': 'Clientes',
    'nav.comissoes': 'Comisiones',
    'nav.marketing': 'Marketing',
    'nav.treinamentos': 'Capacitaciones',
    'nav.gestao': 'Gestión',
    'nav.vendas': 'Ventas',
    'nav.financeiro': 'Financiero',
    'nav.corretores': 'Corredores',
    'nav.tecnologia': 'Tecnología & IA',
    'nav.notificacoes': 'Notificaciones',
    'nav.sair': 'Salir',

    // Header
    'header.perfil': 'Perfil',
    'header.configuracoes': 'Configuraciones',
    'header.sair': 'Salir',

    // Login
    'login.bemvindo': 'Bienvenido de vuelta',
    'login.credenciais': 'Ingrese sus credenciales para acceder al sistema.',
    'login.entrar': 'Entrar',
    'login.email': 'Correo',
    'login.senha': 'Contraseña',
    'login.esqueceu': '¿Olvidó su contraseña?',
    'login.invalido': 'Correo o contraseña inválidos',
    'login.google': 'Entrar con Google',
    'login.ou': 'O',

    // Atendimento
    'atd.busca': 'Buscar conversaciones...',
    'atd.nova': 'Nueva conversación',
    'atd.meus': 'Mis chats',
    'atd.equipe': 'Equipo',
    'atd.grupos': 'Grupos',
    'atd.naolidas': 'No leídas',
    'atd.arquivadas': 'Archivadas',
    'atd.todos': 'Todas',
    'atd.digitando': 'Escriba su mensaje...',
    'atd.enviar': 'Enviar',
    'atd.transferir': 'Transferir',
    'atd.aceitar': 'Aceptar',
    'atd.ignorar': 'Ignorar',
    'atd.notas': 'Notas',
    'atd.ia': 'IA Activa',
    'atd.semConversa': 'Seleccione una conversación para iniciar la atención.',
    'atd.participantes': 'Participantes',
    'atd.anexar': 'Adjuntar',
    'atd.audio': 'Audio',
    'atd.tag': 'Agregar etiqueta...',
    'atd.contato': 'Editar Contacto',
    'atd.excluir': 'Eliminar conversación',

    // Dashboard
    'dash.novosLeads': 'Nuevos Prospectos',
    'dash.vendasHoje': 'Ventas Hoy',
    'dash.visitas': 'Visitas Hoy',
    'dash.taxaConversao': 'Tasa de Conversión',
    'dash.periodo': 'Período',

    // Leads
    'lead.novo': 'Nuevo Prospecto',
    'lead.busca': 'Buscar prospectos...',
    'lead.score': 'Score',
    'lead.fonte': 'Fuente',
    'lead.status': 'Estado',
    'lead.responsavel': 'Responsable',
    'lead.data': 'Fecha',
    'lead.telefone': 'Teléfono',
    'lead.email': 'Correo',
    'lead.semResultados': 'Ningún prospecto encontrado.',

    // Notificações
    'notif.titulo': 'Notificaciones',
    'notif.novas': 'nuevas',
    'notif.todas': 'Todas',
    'notif.naolidas': 'No leídas',
    'notif.leads': 'Prospectos',
    'notif.vendas': 'Ventas',
    'notif.lembretes': 'Recordatorios',
    'notif.atrasos': 'Atrasos',
    'notif.vazio': '¡Todo al día!',
    'notif.semNotif': 'Ninguna notificación pendiente.',
    'notif.marcarLidas': 'Marcar todas leídas',
    'notif.som': 'Sonido',

    // Tecnologia
    'tec.titulo': 'Tecnología & IA',
    'tec.chamados': 'Tickets',
    'tec.novo': 'Nuevo Ticket',
    'tec.analisar': 'Por Analizar',
    'tec.executar': 'Por Ejecutar',
    'tec.executando': 'Ejecutando',
    'tec.executado': 'Ejecutado',

    // Configurações
    'config.titulo': 'Configuraciones',
    'config.perfil': 'Perfil',
    'config.empresa': 'Empresa',
    'config.notificacoes': 'Notificaciones',
    'config.idioma': 'Idioma',
    'config.seguranca': 'Seguridad',
    'config.aparencia': 'Apariencia',
    'config.salvar': 'Guardar cambios',

    // Geral
    'geral.sim': 'Sí',
    'geral.nao': 'No',
    'geral.cancelar': 'Cancelar',
    'geral.confirmar': 'Confirmar',
    'geral.carregando': 'Cargando...',
    'geral.erro': 'Error',
    'geral.sucesso': 'Éxito',
    'geral.voltando': 'Volviendo...',

    // Idioma toggle
    'lang.pt': 'Português',
    'lang.es': 'Español',
  },
};

interface LanguageContextType {
  lang: Lang;
  setLang: (lang: Lang) => void;
  t: (key: string) => string;
  toggleLang: () => void;
}

const LanguageContext = createContext<LanguageContextType>({
  lang: 'pt',
  setLang: () => {},
  t: (key: string) => key,
  toggleLang: () => {},
});

export function LanguageProvider({ children }: { children: ReactNode }) {
  const [lang, setLangState] = useState<Lang>(() => {
    try {
      const stored = localStorage.getItem(STORAGE_KEY);
      if (stored === 'pt' || stored === 'es') return stored;
    } catch {}
    return 'pt';
  });

  useEffect(() => {
    try {
      localStorage.setItem(STORAGE_KEY, lang);
      document.documentElement.lang = lang === 'pt' ? 'pt-BR' : 'es';
    } catch {}
  }, [lang]);

  const setLang = useCallback((newLang: Lang) => setLangState(newLang), []);

  const toggleLang = useCallback(() => {
    setLangState(prev => (prev === 'pt' ? 'es' : 'pt'));
  }, []);

  const t = useCallback((key: string): string => {
    return translations[lang]?.[key] || translations['pt']?.[key] || key;
  }, [lang]);

  return (
    <LanguageContext.Provider value={{ lang, setLang, t, toggleLang }}>
      {children}
    </LanguageContext.Provider>
  );
}

export function useLanguage() {
  return useContext(LanguageContext);
}

export { translations };