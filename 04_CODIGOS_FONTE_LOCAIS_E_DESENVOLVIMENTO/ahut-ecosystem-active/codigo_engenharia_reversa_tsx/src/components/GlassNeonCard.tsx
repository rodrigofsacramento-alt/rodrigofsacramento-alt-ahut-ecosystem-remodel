import React from 'react';
import { cn } from '../lib/utils';

interface GlassNeonCardProps {
  children: React.ReactNode;
  className?: string;
  icon?: React.ReactNode;
  iconBg?: string;
  title?: string;
  titleAccent?: string;
  description?: string;
  action?: React.ReactNode;
  hover?: boolean;
}

export function GlassNeonCard({
  children,
  className,
  icon,
  iconBg,
  title,
  titleAccent,
  description,
  action,
  hover = true,
}: GlassNeonCardProps) {
  return (
    <div
      className={cn(
        'relative overflow-hidden rounded-3xl bg-[#0a0a0a] border border-white/5 p-8',
        hover && 'transition-all duration-500 hover:border-white/10',
        className
      )}
    >
      {/* Tech Grid Background Subliminar */}
      <div className="absolute inset-0 opacity-[0.03] tech-grid pointer-events-none" />

      {/* Aura Neon */}
      <div className="absolute -inset-4 bg-[#00FFCC] rounded-[2rem] blur-3xl opacity-[0.04] pointer-events-none" />

      {icon && (
        <div className="relative w-16 h-16 mb-6 group">
          <div className="absolute inset-0 bg-[#00FFCC] rounded-2xl blur-md opacity-20 group-hover:opacity-30 transition-opacity duration-500" />
          <div className="relative w-full h-full glass-neon-icon rounded-2xl flex items-center justify-center">
            {icon}
          </div>
        </div>
      )}

      {title && (
        <h3 className="text-white text-2xl font-bold tracking-tight mb-2 relative z-10">
          {title} {titleAccent && <span className="text-[#00FFCC] neon-text">{titleAccent}</span>}
        </h3>
      )}

      {description && (
        <p className="text-slate-400 text-sm font-light leading-relaxed relative z-10">
          {description}
        </p>
      )}

      {children}

      {action && (
        <div className="mt-6 relative z-10">
          {action}
        </div>
      )}
    </div>
  );
}

export function GlassNeonIcon({ children, className }: { children: React.ReactNode; className?: string }) {
  return (
    <div className={cn('relative w-16 h-16 group shrink-0', className)}>
      <div className="absolute inset-0 bg-[#00FFCC] rounded-2xl blur-md opacity-20 group-hover:opacity-35 transition-all duration-500" />
      <div className="relative w-full h-full glass-neon-icon rounded-2xl flex items-center justify-center transition-transform duration-500 group-hover:scale-105">
        {children}
      </div>
    </div>
  );
}

export function NeonGhostButton({ children, className, ...props }: React.ButtonHTMLAttributes<HTMLButtonElement>) {
  return (
    <button className={cn('btn-neon-ghost', className)} {...props}>
      {children}
    </button>
  );
}