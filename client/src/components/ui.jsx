import { useEffect, useId } from 'react';
import { ChevronDown, LoaderCircle, X } from 'lucide-react';

const buttonVariants = {
  primary: 'bg-brand text-white hover:bg-emerald-800 focus-visible:ring-emerald-700',
  secondary: 'border border-slate-300 bg-white text-slate-800 hover:bg-slate-50 focus-visible:ring-slate-500',
  ghost: 'text-slate-700 hover:bg-slate-100 focus-visible:ring-slate-500',
};

export function Button({ variant = 'primary', loading = false, className = '', children, disabled, ...props }) {
  return <button disabled={disabled || loading} className={`inline-flex min-h-11 items-center justify-center gap-2 rounded-full px-5 py-2.5 text-sm font-semibold transition focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-60 ${buttonVariants[variant]} ${className}`} {...props}>
    {loading && <LoaderCircle aria-hidden="true" size={16} className="animate-spin" />}{children}
  </button>;
}

export function Card({ className = '', children, ...props }) {
  return <section className={`rounded-2xl border border-slate-200 bg-white p-5 shadow-card ${className}`} {...props}>{children}</section>;
}

export function Input({ label, error, hint, id, className = '', ...props }) {
  const generatedId = useId();
  const fieldId = id || generatedId;
  return <label htmlFor={fieldId} className="block text-sm font-medium text-slate-800">
    {label}
    <input id={fieldId} aria-invalid={Boolean(error)} aria-describedby={error ? `${fieldId}-error` : hint ? `${fieldId}-hint` : undefined}
      className={`mt-1.5 min-h-11 w-full rounded-xl border bg-white px-3 py-2 text-slate-900 placeholder:text-slate-500 focus-visible:border-brand focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-emerald-700/30 ${error ? 'border-red-700' : 'border-slate-300'} ${className}`} {...props} />
    {hint && !error && <span id={`${fieldId}-hint`} className="mt-1 block text-sm text-slate-600">{hint}</span>}
    {error && <span id={`${fieldId}-error`} role="alert" className="mt-1 block text-sm text-red-800">{error}</span>}
  </label>;
}

export function Select({ label, error, id, className = '', children, ...props }) {
  const generatedId = useId();
  const fieldId = id || generatedId;
  return <label htmlFor={fieldId} className="block text-sm font-medium text-slate-800">{label}
    <select id={fieldId} aria-invalid={Boolean(error)} className={`mt-1.5 min-h-11 w-full rounded-xl border bg-white px-3 py-2 text-slate-900 focus-visible:border-brand focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-emerald-700/30 ${error ? 'border-red-700' : 'border-slate-300'} ${className}`} {...props}>{children}</select>
    {error && <span role="alert" className="mt-1 block text-sm text-red-800">{error}</span>}
  </label>;
}

const badgeVariants = {
  neutral: 'bg-slate-100 text-slate-800',
  success: 'bg-emerald-100 text-emerald-900',
  warning: 'bg-amber-100 text-amber-950',
  danger: 'bg-red-100 text-red-900',
};

export function Badge({ variant = 'neutral', children, className = '' }) {
  return <span className={`inline-flex items-center rounded-full px-3 py-1 text-xs font-semibold ${badgeVariants[variant]} ${className}`}>{children}</span>;
}

export function Modal({ open, onClose, title, children, className = '' }) {
  const titleId = useId();
  useEffect(() => {
    if (!open) return undefined;
    const handleKeyDown = (event) => { if (event.key === 'Escape') onClose(); };
    document.addEventListener('keydown', handleKeyDown);
    return () => document.removeEventListener('keydown', handleKeyDown);
  }, [open, onClose]);
  if (!open) return null;
  return <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/60 p-4" onMouseDown={(event) => { if (event.target === event.currentTarget) onClose(); }}>
    <section role="dialog" aria-modal="true" aria-labelledby={titleId} className={`max-h-[90vh] w-full max-w-xl overflow-y-auto rounded-2xl bg-white p-6 text-slate-900 shadow-xl ${className}`}>
      <div className="mb-5 flex items-start justify-between gap-4"><h2 id={titleId} className="text-xl font-semibold">{title}</h2><button type="button" onClick={onClose} aria-label="Close dialog" className="rounded-full p-2 text-slate-600 hover:bg-slate-100"><X size={20} /></button></div>
      {children}
    </section>
  </div>;
}

export function Tabs({ tabs, value, onChange, className = '' }) {
  return <div role="tablist" className={`flex gap-2 overflow-x-auto ${className}`}>
    {tabs.map((tab) => <button key={tab.value} id={`tab-${tab.value}`} role="tab" aria-selected={value === tab.value} type="button" onClick={() => onChange(tab.value)}
      className={`whitespace-nowrap rounded-full px-4 py-2 text-sm font-semibold ${value === tab.value ? 'bg-brand text-white' : 'bg-slate-100 text-slate-700 hover:bg-slate-200'}`}>{tab.label}</button>)}
  </div>;
}

export function Stepper({ steps, activeStep }) {
  return <ol aria-label="Booking steps" className="grid grid-cols-3 gap-2">
    {steps.map((step, index) => <li key={step} aria-current={index + 1 === activeStep ? 'step' : undefined} className={`flex items-center gap-2 border-b-2 pb-2 text-sm font-semibold ${index + 1 <= activeStep ? 'border-brand text-emerald-900' : 'border-slate-200 text-slate-600'}`}>
      <span className={`flex h-7 w-7 shrink-0 items-center justify-center rounded-full text-xs ${index + 1 <= activeStep ? 'bg-brand text-white' : 'bg-slate-100 text-slate-700'}`}>{index + 1}</span><span>{step}</span>
    </li>)}
  </ol>;
}

export function StatCard({ label, value, detail, icon: Icon }) {
  return <Card className="p-5">
    <div className="flex items-start justify-between gap-3"><div><p className="text-sm font-medium text-slate-600">{label}</p><p className="mt-2 text-2xl font-semibold tracking-tight text-slate-950">{value}</p>{detail && <p className="mt-1 text-sm text-slate-600">{detail}</p>}</div>{Icon && <span className="rounded-xl bg-emerald-50 p-2.5 text-emerald-900"><Icon size={20} aria-hidden="true" /></span>}</div>
  </Card>;
}

export function EmptyState({ title, description, action }) {
  return <div className="rounded-2xl border border-dashed border-slate-300 bg-slate-50 p-8 text-center"><h2 className="font-semibold text-slate-900">{title}</h2>{description && <p className="mx-auto mt-2 max-w-lg text-sm text-slate-600">{description}</p>}{action && <div className="mt-4">{action}</div>}</div>;
}

export function Skeleton({ className = 'h-5 w-full' }) {
  return <div aria-hidden="true" className={`animate-pulse rounded-lg bg-slate-200 ${className}`} />;
}

export function Toast({ message, variant = 'neutral', onClose }) {
  if (!message) return null;
  const variants = { neutral: 'border-slate-300 bg-white text-slate-900', success: 'border-emerald-300 bg-emerald-50 text-emerald-950', error: 'border-red-300 bg-red-50 text-red-950' };
  return <div role="status" className={`flex items-center justify-between gap-3 rounded-xl border p-3 text-sm ${variants[variant]}`}><span>{message}</span>{onClose && <button type="button" onClick={onClose} aria-label="Dismiss notification" className="rounded-full p-1 hover:bg-black/5"><X size={16} /></button>}</div>;
}

export function Accordion({ items }) {
  return <div className="divide-y divide-slate-200 rounded-2xl border border-slate-200 bg-white">
    {items.map((item, index) => <details key={item.title} className="group p-5" open={index === 0}>
      <summary className="flex cursor-pointer list-none items-center justify-between gap-4 font-semibold text-slate-900"><span>{item.title}</span><ChevronDown size={18} className="shrink-0 text-slate-600 transition group-open:rotate-180" /></summary>
      <div className="pt-3 text-sm leading-6 text-slate-700">{item.content}</div>
    </details>)}
  </div>;
}

export function PageContainer({ children, className = '' }) {
  return <div className={`mx-auto w-full max-w-7xl ${className}`}>{children}</div>;
}
