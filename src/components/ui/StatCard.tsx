import type { ReactNode } from 'react';
import { cn } from '@/lib/utils';

const surfaceTones = {
  default: 'border-slate-200 bg-white',
  brand: 'border-blue-200 bg-blue-50',
  danger: 'border-rose-200 bg-rose-50',
  success: 'border-emerald-200 bg-emerald-50',
} as const;

const valueTones = {
  default: 'text-slate-900',
  brand: 'text-blue-900',
  danger: 'text-rose-900',
  success: 'text-emerald-900',
} as const;

export type StatCardTone = keyof typeof surfaceTones;

/** A headline metric tile — used for dashboard stats and the impact panel. */
export function StatCard({
  label,
  value,
  hint,
  icon,
  tone = 'default',
}: {
  label: string;
  value: ReactNode;
  hint?: string;
  icon?: ReactNode;
  tone?: StatCardTone;
}) {
  return (
    <div className={cn('rounded-3xl border p-5 shadow-sm', surfaceTones[tone])}>
      <div className="flex items-center justify-between gap-3">
        <p className="text-sm font-medium text-slate-500">{label}</p>
        {icon ? <span className="text-slate-400">{icon}</span> : null}
      </div>
      <p className={cn('mt-3 text-3xl font-semibold tracking-tight', valueTones[tone])}>{value}</p>
      {hint ? <p className="mt-1 text-xs text-slate-500">{hint}</p> : null}
    </div>
  );
}
