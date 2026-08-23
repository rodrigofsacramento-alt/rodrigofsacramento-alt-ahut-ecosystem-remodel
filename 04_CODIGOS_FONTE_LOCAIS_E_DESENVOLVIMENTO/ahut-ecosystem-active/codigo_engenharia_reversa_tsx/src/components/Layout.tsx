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
  GraduationCap
} from 'lucide-react';
import { Link, useLocation } from 'react-router-dom';
import { cn } from '../lib/utils';
import { useAuth } from '../hooks/useAuth';

type NavItem = {
  id: string;
  label: string;
  icon: React.ElementType;
  path: string;
  badge?: number;
};

const navItems: NavItem[] = [
  { id: 'dashboard', label: 'Dashboard', icon: LayoutDashboard, path: '/' },
  { id: 'leads', label: 'Leads', icon: Users, path: '/leads', badge: 24 },
  { id: 'atendimento', label: 'Atendimento', icon: MessageSquare, path: '/atendimento', badge: 8 },
  { id: 'agenda', label: 'Agenda & Visitas', icon: Calendar, path: '/agenda', badge: 3 },
  { id: 'imoveis', label: 'Imóveis', icon: Home, path: '/imoveis' },
  { id: 'propostas', label: 'Propostas', icon: FileText, path: '/propostas', badge: 5 },
  { id: 'contratos', label: 'Contratos', icon: Scale, path: '/contratos', badge: 2 },
  { id: 'juridico', label: 'Jurídico & Contratos', icon: Scale, path: '/juridico', badge: 2 },
  { id: 'clientes', label: 'Clientes', icon: Contact, path: '/clientes' },
  { id: 'comissoes', label: 'Comissões', icon: HandCoins, path: '/comissoes' },
  { id: 'marketing', label: 'Marketing', icon: Megaphone, path: '/marketing' },
  { id: 'treinamentos', label: 'Treinamentos', icon: GraduationCap, path: '/treinamentos' },
  { id: 'vendas', label: 'Vendas', icon: DollarSign, path: '/vendas' },
  { id: 'financeiro', label: 'Financeiro', icon: DollarSign, path: '/financeiro' },
  { id: 'corretores', label: 'Corretores', icon: UserCircle, path: '/corretores' },
  { id: 'tecnologia', label: 'Tecnologia & IA', icon: Monitor, path: '/tecnologia' },
  { id: 'notificacoes', label: 'Notificações', icon: Bell, path: '/notificacoes', badge: 1 },
];

interface SidebarProps {
  collapsed: boolean;
  setCollapsed: (collapsed: boolean) => void;
}

export function Sidebar({ collapsed, setCollapsed }: SidebarProps) {
  const location = useLocation();
  const { profile } = useAuth();
  
  const filteredNavItems = navItems.filter(item => {
    if (item.id === 'financeiro' && profile?.role === 'manager') {
      return false;
    }
    return true;
  });

  return (
    <aside className={cn(
      "bg-white border-r border-slate-200 text-slate-600 flex flex-col transition-all duration-300 h-screen sticky top-0",
      collapsed ? "w-20" : "w-64"
    )}>
      <div className="p-6 flex items-center gap-3">
        <div className="w-8 h-8 bg-orange-500 rounded flex items-center justify-center font-bold text-xl italic text-white">A</div>
        {!collapsed && <span className="text-2xl font-bold tracking-tight text-slate-900">ApeX<span className="text-orange-500">fy</span></span>}
      </div>

      <div className="px-4 mb-6">
        <div className="relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
          <input
            type="text"
            placeholder={collapsed ? "" : "Buscar..."}
            className="w-full bg-slate-50 border border-slate-200 rounded-lg py-2 pl-10 pr-4 text-sm focus:ring-1 focus:ring-orange-500 outline-none text-slate-900"
          />
        </div>
      </div>

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
                isActive ? "bg-orange-500 text-white" : "text-slate-500 hover:bg-slate-50 hover:text-slate-900"
              )}
            >
              <item.icon className="w-5 h-5 shrink-0" />
              {!collapsed && <span className="text-sm font-medium">{item.label}</span>}
              {item.badge && !collapsed && (
                <span className={cn(
                  "ml-auto text-[10px] font-bold px-2 py-0.5 rounded-full",
                  isActive ? "bg-white/20 text-white" : "bg-orange-100 text-orange-600"
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

      <div className="p-4 border-t border-slate-200 space-y-1">
        <button className="w-full flex items-center gap-3 px-4 py-3 text-slate-500 hover:bg-slate-50 hover:text-slate-900 rounded-lg transition-colors">
          <Settings className="w-5 h-5" />
          {!collapsed && <span className="text-sm font-medium">Configurações</span>}
        </button>
        <button
          onClick={() => setCollapsed(!collapsed)}
          className="w-full flex items-center gap-3 px-4 py-3 text-slate-500 hover:bg-slate-50 hover:text-slate-900 rounded-lg transition-colors"
        >
          <ChevronLeft className={cn("w-5 h-5 transition-transform", collapsed && "rotate-180")} />
          {!collapsed && <span className="text-sm font-medium">Recolher</span>}
        </button>
      </div>

      <div className="p-4 bg-slate-50 flex items-center gap-3 border-t border-slate-200">
        <div className="w-10 h-10 rounded-full bg-orange-100 flex items-center justify-center font-bold text-sm text-orange-600">JM</div>
        {!collapsed && (
          <div className="flex-1 min-w-0">
            <p className="text-sm font-bold text-slate-900 truncate">João Martins</p>
            <p className="text-xs text-slate-500 truncate">Gestor Comercial</p>
          </div>
        )}
      </div>
    </aside>
  );
}

export function Header({ title, subtitle }: { title: string; subtitle?: string }) {
  return (
    <header className="flex items-center justify-between p-6 bg-white border-b border-slate-200 sticky top-0 z-10">
      <div>
        <h1 className="text-2xl font-bold text-slate-900">{title}</h1>
        {subtitle && <p className="text-sm text-slate-500">{subtitle}</p>}
      </div>

      <div className="flex items-center gap-4">
        <div className="relative hidden md:block">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
          <input
            type="text"
            placeholder="Buscar leads, imóveis, clientes..."
            className="w-80 bg-slate-50 border border-slate-200 rounded-lg py-2 pl-10 pr-4 text-sm focus:ring-1 focus:ring-orange-500 outline-none"
          />
        </div>

        <button className="bg-orange-500 hover:bg-orange-600 text-white px-4 py-2 rounded-lg text-sm font-bold flex items-center gap-2 transition-colors">
          <Plus className="w-4 h-4" />
          Novo
        </button>

        <button className="relative p-2 text-slate-500 hover:bg-slate-100 rounded-full transition-colors">
          <Bell className="w-5 h-5" />
          <span className="absolute top-1.5 right-1.5 w-4 h-4 bg-orange-500 text-white text-[10px] flex items-center justify-center rounded-full border-2 border-white font-bold">5</span>
        </button>
      </div>
    </header>
  );
}
