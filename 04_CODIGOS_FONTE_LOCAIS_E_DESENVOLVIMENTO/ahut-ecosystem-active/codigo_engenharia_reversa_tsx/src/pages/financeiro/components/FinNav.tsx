import React from 'react';
import { NavLink } from 'react-router-dom';
import { LayoutDashboard, ListOrdered, Landmark, CreditCard, ArrowLeftRight, Tags } from 'lucide-react';
import { cn } from '../../../lib/utils';

const links = [
  { to: '/financeiro', label: 'Dashboard', icon: LayoutDashboard, end: true },
  { to: '/financeiro/lancamentos', label: 'Lançamentos', icon: ListOrdered },
  { to: '/financeiro/bancos', label: 'Bancos', icon: Landmark },
  { to: '/financeiro/cartoes', label: 'Cartões', icon: CreditCard },
  { to: '/financeiro/transferencias', label: 'Transferências', icon: ArrowLeftRight },
  { to: '/financeiro/categorias', label: 'Categorias', icon: Tags },
];

export default function FinNav() {
  return (
    <div className="flex flex-wrap items-center gap-1.5 rounded-2xl bg-white/[0.03] border border-white/[0.07] p-1.5 w-fit max-w-full overflow-x-auto">
      {links.map((l) => {
        const Icon = l.icon;
        return (
          <NavLink
            key={l.to}
            to={l.to}
            end={l.end}
            className={({ isActive }) =>
              cn(
                'inline-flex items-center gap-2 px-3.5 py-2 rounded-xl text-xs font-bold whitespace-nowrap transition-all',
                isActive
                  ? 'bg-gradient-to-r from-[#00FFCC] to-[#00DF9A] text-slate-950 shadow-md shadow-emerald-500/20'
                  : 'text-slate-400 hover:bg-white/5 hover:text-white'
              )
            }
          >
            <Icon className="w-3.5 h-3.5" />
            {l.label}
          </NavLink>
        );
      })}
    </div>
  );
}