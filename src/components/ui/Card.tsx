import type { HTMLAttributes } from 'react';
import { cn } from '@/lib/utils';

/** The shared surface primitive — rounded, bordered, soft-shadowed white panel. */
export function Card({ className, ...props }: HTMLAttributes<HTMLDivElement>) {
  return (
    <div
      className={cn('rounded-3xl border border-slate-200 bg-white p-6 shadow-sm', className)}
      {...props}
    />
  );
}
