import React from 'react';
import { X, Loader2, AlertTriangle } from 'lucide-react';
import { cn } from '../../../lib/utils';

/**
 * Conjunto de primitivas reutilizáveis do módulo Financeiro,
 * seguindo a estética Glassmorphism QUBITS (bg-white/5, card-dark, neon).
 */

const inputCls =
  'w-full bg-white/5 border border-white/10 rounded-xl px-3.5 py-2.5 text-sm text-white placeholder-slate-500 outline-none focus:ring-1 focus:ring-[#00FFCC]/50 focus:border-[#00F5A0]/40 transition-all';

export function FieldLabel({ children, className }: { children: React.ReactNode; className?: string }) {
  return <label className={cn('block text-xs font-bold text-slate-300 mb-1.5', className)}>{children}</label>;
}

export function TextInput({
  label,
  className,
  inputClassName,
  ...props
}: React.InputHTMLAttributes<HTMLInputElement> & { label?: string; inputClassName?: string }) {
  return (
    <div className={className}>
      {label && <FieldLabel>{label}</FieldLabel>}
      <input className={cn(inputCls, inputClassName)} {...props} />
    </div>
  );
}

export function SelectInput({
  label,
  className,
  selectClassName,
  children,
  ...props
}: React.SelectHTMLAttributes<HTMLSelectElement> & { label?: string; selectClassName?: string }) {
  return (
    <div className={className}>
      {label && <FieldLabel>{label}</FieldLabel>}
      <select className={cn(inputCls, 'appearance-none cursor-pointer', selectClassName)} {...props}>
        {children}
      </select>
    </div>
  );
}

export function TextAreaInput({
  label,
  className,
  ...props
}: React.TextareaHTMLAttributes<HTMLTextAreaElement> & { label?: string }) {
  return (
    <div className={className}>
      {label && <FieldLabel>{label}</FieldLabel>}
      <textarea className={cn(inputCls, 'min-h-[72px] resize-y')} {...props} />
    </div>
  );
}

/** 2 colunas em telas médias / 1 coluna em mobile */
export function FormGrid({ children }: { children: React.ReactNode }) {
  return <div className="grid grid-cols-1 md:grid-cols-2 gap-4">{children}</div>;
}

export function BtnPrimary({
  children,
  className,
  ...props
}: React.ButtonHTMLAttributes<HTMLButtonElement>) {
  return (
    <button
      className={cn(
        'inline-flex items-center justify-center gap-2 px-4 py-2.5 rounded-xl bg-gradient-to-r from-[#00FFCC] to-[#00DF9A] hover:from-[#00FFCC] hover:to-[#00C988] text-slate-950 text-sm font-bold shadow-md shadow-emerald-500/20 transition-all hover:scale-[1.02] active:scale-[0.98] disabled:opacity-50 disabled:pointer-events-none',
        className
      )}
      {...props}
    >
      {children}
    </button>
  );
}

export function BtnGhost({
  children,
  className,
  ...props
}: React.ButtonHTMLAttributes<HTMLButtonElement>) {
  return (
    <button
      className={cn(
        'inline-flex items-center justify-center gap-2 px-4 py-2.5 rounded-xl bg-white/5 border border-white/10 text-slate-300 text-sm font-bold hover:bg-white/[0.08] hover:text-white transition-all disabled:opacity-50',
        className
      )}
      {...props}
    >
      {children}
    </button>
  );
}

export function BtnDanger({
  children,
  className,
  ...props
}: React.ButtonHTMLAttributes<HTMLButtonElement>) {
  return (
    <button
      className={cn(
        'inline-flex items-center justify-center gap-2 px-4 py-2.5 rounded-xl bg-rose-500/10 border border-rose-500/30 text-rose-400 text-sm font-bold hover:bg-rose-500/20 transition-all disabled:opacity-50',
        className
      )}
      {...props}
    >
      {children}
    </button>
  );
}

export function IconBtn({
  title,
  className,
  tone = 'muted',
  ...props
}: React.ButtonHTMLAttributes<HTMLButtonElement> & { tone?: 'muted' | 'danger' | 'accent' }) {
  return (
    <button
      title={title}
      className={cn(
        'p-2 rounded-lg border transition-all',
        tone === 'danger' && 'text-rose-400 border-rose-500/20 hover:bg-rose-500/10',
        tone === 'accent' && 'text-[#00FFCC] border-emerald-500/20 hover:bg-emerald-500/10',
        tone === 'muted' && 'text-slate-400 border-white/10 hover:bg-white/5 hover:text-white',
        className
      )}
      {...props}
    />
  );
}

export function Badge({
  tone,
  children,
  className,
}: {
  tone: 'emerald' | 'rose' | 'slate' | 'amber' | 'cyan' | 'violet';
  children: React.ReactNode;
  className?: string;
}) {
  const tones: Record<string, string> = {
    emerald: 'bg-emerald-500/10 text-emerald-400 border-emerald-500/25',
    rose: 'bg-rose-500/10 text-rose-400 border-rose-500/25',
    slate: 'bg-white/5 text-slate-300 border-white/10',
    amber: 'bg-amber-500/10 text-amber-400 border-amber-500/25',
    cyan: 'bg-cyan-500/10 text-cyan-300 border-cyan-500/25',
    violet: 'bg-violet-500/10 text-violet-300 border-violet-500/25',
  };
  return (
    <span
      className={cn(
        'inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-semibold border whitespace-nowrap',
        tones[tone],
        className
      )}
    >
      {children}
    </span>
  );
}

export function Card({ children, className }: { children: React.ReactNode; className?: string }) {
  return (
    <div
      className={cn(
        'rounded-2xl bg-white/[0.03] border border-white/[0.07] backdrop-blur-xl transition-all',
        className
      )}
    >
      {children}
    </div>
  );
}

export function CardHeader({
  title,
  subtitle,
  action,
  className,
}: {
  title: string;
  subtitle?: string;
  action?: React.ReactNode;
  className?: string;
}) {
  return (
    <div className={cn('flex flex-col sm:flex-row sm:items-center justify-between gap-3 px-5 py-4 border-b border-white/[0.06]', className)}>
      <div>
        <h3 className="text-white font-bold">{title}</h3>
        {subtitle && <p className="text-xs text-slate-400 font-light mt-0.5">{subtitle}</p>}
      </div>
      {action}
    </div>
  );
}

export function Spinner({ label = 'Carregando...' }: { label?: string }) {
  return (
    <div className="flex items-center justify-center gap-2 py-12 text-sm text-slate-400">
      <Loader2 className="w-5 h-5 animate-spin text-[#00F5A0]" />
      {label}
    </div>
  );
}

export function EmptyState({ message, icon }: { message: string; icon?: React.ReactNode }) {
  return (
    <div className="flex flex-col items-center justify-center gap-2 py-14 text-center">
      {icon && <div className="text-slate-600">{icon}</div>}
      <p className="text-sm text-slate-500">{message}</p>
    </div>
  );
}

export function Modal({
  open,
  onClose,
  title,
  subtitle,
  children,
  footer,
  wide,
}: {
  open: boolean;
  onClose: () => void;
  title: string;
  subtitle?: string;
  children: React.ReactNode;
  footer?: React.ReactNode;
  wide?: boolean;
}) {
  if (!open) return null;
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <div className="absolute inset-0 bg-black/70 backdrop-blur-sm" onClick={onClose} />
      <div
        className={cn(
          'relative w-full rounded-2xl bg-[#0a0e15] border border-white/[0.09] shadow-2xl shadow-black/60 max-h-[90vh] flex flex-col',
          wide ? 'max-w-3xl' : 'max-w-lg'
        )}
      >
        <div className="flex items-start justify-between gap-4 px-6 py-4 border-b border-white/[0.06]">
          <div>
            <h3 className="text-white font-bold text-lg">{title}</h3>
            {subtitle && <p className="text-xs text-slate-400 mt-0.5">{subtitle}</p>}
          </div>
          <button
            onClick={onClose}
            className="p-1.5 rounded-lg text-slate-400 hover:bg-white/5 hover:text-white transition-colors"
          >
            <X className="w-4 h-4" />
          </button>
        </div>
        <div className="px-6 py-5 overflow-y-auto flex-1">{children}</div>
        {footer && (
          <div className="px-6 py-4 border-t border-white/[0.06] flex items-center justify-end gap-3">{footer}</div>
        )}
      </div>
    </div>
  );
}

export function ConfirmDelete({
  open,
  onCancel,
  onConfirm,
  title,
  message,
  loading,
}: {
  open: boolean;
  onCancel: () => void;
  onConfirm: () => void;
  title: string;
  message: string;
  loading?: boolean;
}) {
  return (
    <Modal open={open} onClose={onCancel} title={title} footer={
      <>
        <BtnGhost onClick={onCancel}>Cancelar</BtnGhost>
        <BtnDanger onClick={onConfirm} disabled={loading}>
          {loading && <Loader2 className="w-4 h-4 animate-spin" />}
          Excluir
        </BtnDanger>
      </>
    }>
      <div className="flex items-start gap-3">
        <div className="w-10 h-10 shrink-0 rounded-xl bg-rose-500/10 border border-rose-500/25 flex items-center justify-center text-rose-400">
          <AlertTriangle className="w-5 h-5" />
        </div>
        <p className="text-sm text-slate-300 leading-relaxed">{message}</p>
      </div>
    </Modal>
  );
}

/** Alertas de erro de mutation */
export function ErrorNote({ message }: { message?: string }) {
  if (!message) return null;
  return (
    <div className="rounded-xl bg-rose-500/10 border border-rose-500/25 text-rose-300 text-sm px-4 py-3">
      {message}
    </div>
  );
}

/** Filtro global inline para tabelas (texto) */
export function useTextFilter(items: { id: string }[], term: string) {
  const lower = term.trim().toLowerCase();
  if (!lower) return items;
  return items.filter((it) =>
    JSON.stringify(Object.values(it)).toLowerCase().includes(lower)
  );
}

export function formatDateBR(dateStr?: string | null) {
  if (!dateStr) return '-';
  const d = new Date(dateStr + (dateStr.length === 10 ? 'T12:00:00' : ''));
  if (isNaN(d.getTime())) return dateStr;
  return d.toLocaleDateString('pt-BR');
}