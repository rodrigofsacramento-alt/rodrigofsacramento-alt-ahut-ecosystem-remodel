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
  LogOut,
  Monitor,
  Megaphone,
  HandCoins,
  Contact,
  GraduationCap,
  ClipboardList,
  Globe
} from 'lucide-react';
import { Link, useLocation } from 'react-router-dom';
import { cn } from '../lib/utils';
import { useAuth } from '../hooks/useAuth';
import { useLanguage } from '../contexts/LanguageContext';

// ── Language Toggle ─────────────────────────────────
function LanguageToggle() {
  const { lang, toggleLang } = useLanguage();
  const isPT = lang === 'pt';

  return (
    <button
      onClick={toggleLang}
      title={isPT ? 'Español' : 'Português'}
      className="flex items-center gap-2 px-3 py-2 rounded-lg hover:bg-slate-100 transition-colors group"
    >
      {/* Bandeira atual */}
      {isPT ? (
        <svg className="w-5 h-5 rounded-sm shrink-0" viewBox="0 0 24 24">
          <rect width="24" height="24" fill="#009739"/>
          <polygon points="12,3 22,12 12,21 2,12" fill="#FEDD00"/>
          <circle cx="12" cy="12" r="4" fill="#002776"/>
          <circle cx="12" cy="12" r="2" fill="#FEDD00"/>
        </svg>
      ) : (
        <svg className="w-5 h-5 rounded-sm shrink-0" viewBox="0 0 24 24">
          <rect width="24" height="16" y="4" fill="#C60B1E"/>
          <rect width="24" height="8" y="8" fill="#FFC400"/>
          <rect width="24" height="2" y="8" fill="#C60B1E"/>
          <rect width="8" height="16" x="8" y="4" fill="#FFC400"/>
          <rect width="2" height="16" x="11" y="4" fill="#C60B1E"/>
          <rect width="24" height="2" y="14" fill="#C60B1E"/>
          <rect width="24" height="2" y="10" fill="#C60B1E"/>
        </svg>
      )}
      <span className="text-xs font-semibold text-slate-400 group-hover:text-cyan-400">
        {isPT ? 'PT' : 'ES'}
      </span>
    </button>
  );
}

// ── Nav Items ────────────────────────────────────────
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
  { id: 'tecnologia', labelKey: 'nav.tecnologia', icon: Monitor, path: '/tecnologia' },
  { id: 'notificacoes', labelKey: 'nav.notificacoes', icon: Bell, path: '/notificacoes', badge: 1 },
];

interface SidebarProps {
  collapsed: boolean;
  setCollapsed: (collapsed: boolean) => void;
}

export function Sidebar({ collapsed, setCollapsed }: SidebarProps) {
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
      "bg-black/60 backdrop-blur-xl border-r border-cyan-900/30"
    )}>
      <div className="p-6 flex items-center gap-3">
        <div className="w-8 h-8 bg-cyan-500 rounded flex items-center justify-center font-bold text-xl italic text-white">A</div>
        {!collapsed && <span className="text-2xl font-bold tracking-tight text-white">ApeX<span className="text-cyan-400">fy</span></span>}
      </div>

      <div className="px-4 mb-6">
        <div className="relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-500" />
          <input
            type="text"
            placeholder={collapsed ? "" : t('atd.busca')}
            className="w-full bg-white/5 border border-cyan-900/30 rounded-lg py-2 pl-10 pr-4 text-sm focus:ring-1 focus:ring-cyan-500 outline-none text-white placeholder-slate-500"
          />
        </div>
      </div>

      {/* Language Toggle */}
      {!collapsed && (
        <div className="px-4 mb-2">
          <div className="flex items-center gap-2 px-3 py-1.5 bg-white/5 rounded-lg border border-cyan-900/20">
            <Globe className="w-4 h-4 text-cyan-400" />
            <LanguageToggle />
          </div>
        </div>
      )}

      <nav className="flex-1 py-4 flex flex-col gap-1 overflow-y-auto px-3 mt-4">
        {filteredNavItems.map((item) => {
          const Icon = item.icon;
          const isActive = location.pathname === item.path;
          return (
            <Link
              key={item.id}
              to={item.path}
              className={cn(
                "w-full flex items-center gap-3 px-4 py-3 rounded-lg transition-colors group relative",
                isActive ? "bg-cyan-500/20 text-white border-l-2 border-cyan-400" : "text-slate-400 hover:bg-white/5 hover:text-white"
              )}
            >
              <Icon className="w-5 h-5 shrink-0" />
              {!collapsed && <span className="text-sm font-medium">{t(item.labelKey)}</span>}
              {item.badge && !collapsed && (
                <span className={cn(
                  "ml-auto text-[10px] font-bold px-2 py-0.5 rounded-full",
                  isActive ? "bg-cyan-500/30 text-cyan-300" : "bg-cyan-900/40 text-cyan-300"
                )}>
                  {item.badge}
                </span>
              )}
              {collapsed && item.badge && (
                <span className="absolute top-2 right-2 w-2 h-2 bg-orange-500 rounded-full border-2 border-white" />
              )}
            </Link>
          );
        })}
      </nav>

      <div className="p-4 border-t border-cyan-900/30 space-y-1">
        <button className="w-full flex items-center gap-3 px-4 py-3 text-slate-400 hover:bg-white/5 hover:text-white rounded-lg transition-colors">
          <Settings className="w-5 h-5" />
          {!collapsed && <span className="text-sm font-medium">{t('header.configuracoes')}</span>}
        </button>
        <button
          onClick={() => setCollapsed(!collapsed)}
          className="w-full flex items-center gap-3 px-4 py-3 text-slate-400 hover:bg-white/5 hover:text-white rounded-lg transition-colors"
        >
          <ChevronLeft className={cn("w-5 h-5 transition-transform", collapsed && "rotate-180")} />
          {!collapsed && <span className="text-sm font-medium">{t('geral.cancelar')}</span>}
        </button>
      </div>

      <div className="p-4 bg-white/5 flex items-center gap-3 border-t border-cyan-900/30">
        <div className="w-10 h-10 rounded-full bg-cyan-500/20 flex items-center justify-center font-bold text-sm text-cyan-400">JM</div>
        {!collapsed && (
          <div className="flex-1 min-w-0">
            <p className="text-sm font-bold text-white truncate">João Martins</p>
            <p className="text-xs text-slate-400 truncate">Gestor Comercial</p>
          </div>
        )}
      </div>
    </aside>
  );
}

export function Header({ title, subtitle }: { title: string; subtitle?: string }) {
  const { t, lang, toggleLang } = useLanguage();
  
  return (
    <header className="flex items-center justify-between p-6 bg-black/40 backdrop-blur-xl border-b border-cyan-900/20 sticky top-0 z-10">
      <div>
        <h1 className="text-2xl font-bold text-white">{title}</h1>
        {subtitle && <p className="text-sm text-slate-400">{subtitle}</p>}
      </div>

      <div className="flex items-center gap-4">
        {/* ── Language Toggle Centralizado ── */}
        <button
          onClick={toggleLang}
          title={lang === 'pt' ? 'Español' : 'Português'}
          className="flex items-center gap-2 px-4 py-2 rounded-xl bg-white/5 border border-cyan-900/30 hover:bg-white/10 hover:border-cyan-500/50 transition-all group shadow-sm"
        >
          {lang === 'pt' ? (
            <svg className="w-5 h-5 rounded-sm shrink-0" viewBox="0 0 24 24">
              <rect width="24" height="24" fill="#009739"/>
              <polygon points="12,3 22,12 12,21 2,12" fill="#FEDD00"/>
              <circle cx="12" cy="12" r="4" fill="#002776"/>
              <circle cx="12" cy="12" r="2" fill="#FEDD00"/>
            </svg>
          ) : (
            <svg className="w-5 h-5 rounded-sm shrink-0" viewBox="0 0 24 24">
              <rect width="24" height="16" y="4" fill="#C60B1E"/>
              <rect width="24" height="8" y="8" fill="#FFC400"/>
              <rect width="24" height="2" y="8" fill="#C60B1E"/>
              <rect width="8" height="16" x="8" y="4" fill="#FFC400"/>
              <rect width="2" height="16" x="11" y="4" fill="#C60B1E"/>
              <rect width="24" height="2" y="14" fill="#C60B1E"/>
              <rect width="24" height="2" y="10" fill="#C60B1E"/>
            </svg>
          )}
          <span className="text-xs font-bold text-slate-400 group-hover:text-cyan-400 transition-colors">
            {lang === 'pt' ? 'PT' : 'ES'}
          </span>
          <span className="text-[10px] text-slate-500 group-hover:text-cyan-400 transition-colors">
            {lang === 'pt' ? '🇧🇷' : '🇪🇸'}
          </span>
        </button>

        <div className="relative hidden md:block">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-500" />
          <input
            type="text"
            placeholder={t('atd.busca')}
            className="w-80 bg-white/5 border border-cyan-900/30 rounded-lg py-2 pl-10 pr-4 text-sm focus:ring-1 focus:ring-cyan-500 outline-none text-white placeholder-slate-500"
          />
        </div>

        <button className="bg-cyan-500 hover:bg-cyan-400 text-white px-4 py-2 rounded-lg text-sm font-bold flex items-center gap-2 transition-colors">
          <Plus className="w-4 h-4" />
          {t('lead.novo')}
        </button>

        <button className="relative p-2 text-slate-400 hover:bg-white/5 rounded-full transition-colors">
          <Bell className="w-5 h-5" />
          <span className="absolute top-1.5 right-1.5 w-4 h-4 bg-orange-500 text-white text-[10px] flex items-center justify-center rounded-full border-2 border-white font-bold">5</span>
        </button>
      </div>
    </header>
  );
}