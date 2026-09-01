import React from 'react';
import {
  LayoutDashboard,
  Users,
  MessageSquare,
  Calendar,
  Home,
  FileText,
  Scale,
  DollarSign,
  UserCircle,
  Settings,
  ChevronLeft,
  Search,
  Plus,
  Bell,
  Monitor,
  Megaphone,
  HandCoins,
  Contact,
  GraduationCap,
  ClipboardList,
  Globe,
  Image as ImageIcon
} from 'lucide-react';
import { Link, useLocation } from 'react-router-dom';
import { cn } from '../lib/utils';
import { useAuth } from '../hooks/useAuth';
import { useLanguage } from '../contexts/LanguageContext';
import QubitsLogo from './QubitsLogo';

function LanguageToggle() {
  const { lang, toggleLang } = useLanguage();
  const isPT = lang === 'pt';

  return (
    <button
      onClick={toggleLang}
      title={isPT ? 'Español' : 'Português'}
      className="flex items-center gap-2 px-2.5 py-1.5 rounded-lg hover:card-dark/5 transition-colors group"
    >
      {isPT ? (
        <svg className="w-4 h-4 rounded-sm shrink-0" viewBox="0 0 24 24">
          <rect width="24" height="24" fill="#009739"/>
          <polygon points="12,3 22,12 12,21 2,12" fill="#FEDD00"/>
          <circle cx="12" cy="12" r="4" fill="#002776"/>
          <circle cx="12" cy="12" r="2" fill="#FEDD00"/>
        </svg>
      ) : (
        <svg className="w-4 h-4 rounded-sm shrink-0" viewBox="0 0 24 24">
          <rect width="24" height="16" y="4" fill="#C60B1E"/>
          <rect width="24" height="8" y="8" fill="#FFC400"/>
          <rect width="24" height="2" y="8" fill="#C60B1E"/>
          <rect width="8" height="16" x="8" y="4" fill="#FFC400"/>
          <rect width="2" height="16" x="11" y="4" fill="#C60B1E"/>
          <rect width="24" height="2" y="14" fill="#C60B1E"/>
          <rect width="24" height="2" y="10" fill="#C60B1E"/>
        </svg>
      )}
      <span className="text-xs font-bold text-slate-400 group-hover:text-[#00F5A0] transition-colors">
        {isPT ? 'PT' : 'ES'}
      </span>
    </button>
  );
}

type NavItem = {
  id: string;
  labelKey: string;
  icon: React.ElementType;
  path: string;
  badge?: number;
};

const navItems: NavItem[] = [
  { id: 'dashboard', labelKey: 'nav.dashboard', icon: LayoutDashboard, path: '/' },
  { id: 'leads', labelKey: 'nav.leads', icon: Users, path: '/leads', badge: 24 },
  { id: 'atendimento', labelKey: 'nav.atendimento', icon: MessageSquare, path: '/atendimento', badge: 8 },
  { id: 'agenda', labelKey: 'nav.agenda', icon: Calendar, path: '/agenda', badge: 3 },
  { id: 'imoveis', labelKey: 'nav.imoveis', icon: Home, path: '/imoveis' },
  { id: 'propostas', labelKey: 'nav.propostas', icon: FileText, path: '/propostas', badge: 5 },
  { id: 'contratos', labelKey: 'nav.contratos', icon: Scale, path: '/contratos', badge: 2 },
  { id: 'juridico', labelKey: 'nav.juridico', icon: Scale, path: '/juridico', badge: 2 },
  { id: 'clientes', labelKey: 'nav.clientes', icon: Contact, path: '/clientes' },
  { id: 'comissoes', labelKey: 'nav.comissoes', icon: HandCoins, path: '/comissoes' },
  { id: 'marketing', labelKey: 'nav.marketing', icon: Megaphone, path: '/marketing' },
  { id: 'treinamentos', labelKey: 'nav.treinamentos', icon: GraduationCap, path: '/treinamentos' },
  { id: 'gestao', labelKey: 'nav.gestao', icon: ClipboardList, path: '/gestao' },
  { id: 'vendas', labelKey: 'nav.vendas', icon: DollarSign, path: '/vendas' },
  { id: 'financeiro', labelKey: 'nav.financeiro', icon: DollarSign, path: '/financeiro' },
  { id: 'corretores', labelKey: 'nav.corretores', icon: UserCircle, path: '/corretores' },
  { id: 'editor', labelKey: 'Editor de Imagens', icon: ImageIcon, path: '/editor' },
  { id: 'tecnologia', labelKey: 'nav.tecnologia', icon: Monitor, path: '/tecnologia' },
  { id: 'notificacoes', labelKey: 'nav.notificacoes', icon: Bell, path: '/notificacoes', badge: 1 },
];

interface SidebarProps {
  collapsed: boolean;
  setCollapsed: (collapsed: boolean) => void;
  onOpenWhatsApp?: () => void;
}

export function Sidebar({ collapsed, setCollapsed, onOpenWhatsApp }: SidebarProps) {
  const location = useLocation();
  const { profile } = useAuth();
  const { t } = useLanguage();
  
  const filteredNavItems = navItems.filter(item => {
    if (item.id === 'financeiro' && profile?.role === 'manager') {
      return false;
    }
    return true;
  });

  return (
    <aside className={cn(
      "flex flex-col transition-all duration-300 h-screen sticky top-0 z-20",
      collapsed ? "w-20" : "w-64",
      "bg-[#07090e]/85 backdrop-blur-2xl border-r border-white/[0.06] shadow-2xl"
    )}>
      {/* Brand Header */}
      <div className="p-5 flex items-center justify-between gap-3">
        <QubitsLogo collapsed={collapsed} />
      </div>

      {/* Search Input */}
      <div className="px-4 mb-3">
        <div className="relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-500" />
          <input
            type="text"
            placeholder={collapsed ? "" : t('atd.busca')}
            className="w-full card-dark/[0.04] border border-white/[0.07] rounded-xl py-2 pl-9 pr-3 text-xs focus:ring-1 focus:ring-emerald-500/50 focus:border-[#00F5A0]/50 outline-none text-white placeholder-slate-500 transition-all"
          />
        </div>
      </div>

      {/* Nav List */}
      <nav className="flex-1 py-2 flex flex-col gap-1 overflow-y-auto px-3">
        {filteredNavItems.map((item) => {
          const Icon = item.icon;
          const isActive =
            location.pathname === item.path || location.pathname.startsWith(item.path + '/');
          return (
            <Link
              key={item.id}
              to={item.path}
              className={cn(
                "w-full flex items-center gap-3 px-3.5 py-2.5 rounded-xl transition-all duration-200 group relative",
                isActive 
                  ? "bg-gradient-to-r from-[#00FFCC]/15 to-[#00DF9A]/5 text-white border-l-2 border-[#00F5A0] font-semibold shadow-sm" 
                  : "text-slate-400 hover:card-dark/[0.04] hover:text-slate-100 font-medium"
              )}
            >
              <Icon className={cn("w-4 h-4 shrink-0 transition-colors", isActive ? "text-[#00F5A0]" : "group-hover:text-slate-200")} />
              {!collapsed && <span className="text-xs truncate">{t(item.labelKey)}</span>}
              {item.badge && !collapsed && (
                <span className={cn(
                  "ml-auto text-[10px] font-bold px-2 py-0.5 rounded-full",
                  isActive ? "bg-emerald-500/20 text-[#00FFCC] border border-emerald-500/30" : "card-dark/[0.06] text-slate-300"
                )}>
                  {item.badge}
                </span>
              )}
              {collapsed && item.badge && (
                <span className="absolute top-2 right-2 w-2 h-2 bg-[#00F5A0] rounded-full shadow-[0_0_8px_rgba(0,245,160,0.8)]" />
              )}
            </Link>
          );
        })}
      </nav>

      {/* Footer Controls */}
      <div className="p-3 border-t border-white/[0.06] space-y-1">
        {/* WhatsApp Connection Button */}
        <button
          onClick={onOpenWhatsApp}
          className="w-full flex items-center gap-3 px-3 py-2 text-emerald-400 hover:bg-emerald-500/10 rounded-xl transition-colors text-xs font-medium border border-emerald-500/20 hover:border-emerald-500/40"
        >
          <MessageSquare className="w-4 h-4" />
          {!collapsed && <span>WhatsApp Broker</span>}
        </button>
        <button className="w-full flex items-center gap-3 px-3 py-2 text-slate-400 hover:card-dark/[0.04] hover:text-white rounded-xl transition-colors text-xs font-medium">
          <Settings className="w-4 h-4" />
          {!collapsed && <span>{t('header.configuracoes')}</span>}
        </button>
        <button
          onClick={() => setCollapsed(!collapsed)}
          className="w-full flex items-center gap-3 px-3 py-2 text-slate-400 hover:card-dark/[0.04] hover:text-white rounded-xl transition-colors text-xs font-medium"
        >
          <ChevronLeft className={cn("w-4 h-4 transition-transform", collapsed && "rotate-180")} />
          {!collapsed && <span>Recolher menu</span>}
        </button>
      </div>

      {/* User Card */}
      <div className="p-3.5 card-dark/[0.02] flex items-center gap-3 border-t border-white/[0.06]">
        <div className="w-9 h-9 rounded-xl bg-gradient-to-tr from-[#00FFCC]/20 to-[#00DF9A]/20 border border-emerald-500/30 flex items-center justify-center font-bold text-xs text-[#00FFCC] shadow-sm">
          JM
        </div>
        {!collapsed && (
          <div className="flex-1 min-w-0">
            <p className="text-xs font-bold text-white truncate">João Martins</p>
            <p className="text-[10px] text-slate-400 truncate">Gestor Comercial</p>
          </div>
        )}
      </div>
    </aside>
  );
}

export function Header({ title, subtitle }: { title: string; subtitle?: string }) {
  const { t } = useLanguage();
  
  return (
    <header className="flex items-center justify-between px-6 py-4 bg-[#07090e]/70 backdrop-blur-2xl border-b border-white/[0.06] sticky top-0 z-10">
      <div>
        <h1 className="text-xl font-bold font-display text-white tracking-tight">{title}</h1>
        {subtitle && <p className="text-xs text-slate-400 mt-0.5 font-light">{subtitle}</p>}
      </div>

      <div className="flex items-center gap-3">
        {/* Language Switcher */}
        <LanguageToggle />

        {/* Quick Search */}
        <div className="relative hidden md:block">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-500" />
          <input
            type="text"
            placeholder={t('atd.busca')}
            className="w-64 card-dark/[0.04] border border-white/[0.07] rounded-xl py-1.5 pl-9 pr-3 text-xs focus:ring-1 focus:ring-emerald-500/50 outline-none text-white placeholder-slate-500 transition-all"
          />
        </div>

        {/* New Prospect Button */}
        <button className="px-4 py-2 rounded-xl bg-gradient-to-r from-[#00FFCC] to-[#00DF9A] hover:from-[#00FFCC] hover:to-[#00C988] text-slate-950 text-xs font-bold flex items-center gap-1.5 shadow-md shadow-emerald-500/20 transition-all hover:scale-[1.02] active:scale-[0.98]">
          <Plus className="w-3.5 h-3.5" />
          <span>{t('lead.novo')}</span>
        </button>

        {/* Notifications Icon with Glowing Badge */}
        <button className="relative p-2 text-slate-400 hover:card-dark/[0.06] rounded-xl transition-colors border border-transparent hover:border-white/[0.08]">
          <Bell className="w-4 h-4" />
          <span className="absolute top-1.5 right-1.5 w-2 h-2 bg-[#00F5A0] rounded-full shadow-[0_0_8px_rgba(0,245,160,0.9)]" />
        </button>
      </div>
    </header>
  );
}
