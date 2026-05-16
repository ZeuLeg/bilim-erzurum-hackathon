'use client';

interface StatCardProps {
  emoji: string;
  label: string;
  value: string;
  caption: string;
}

export default function StatCard({ emoji, label, value, caption }: StatCardProps) {
  return (
    <div className="rounded-3xl border border-slate-200 bg-white p-5 shadow-sm">
      <div className="flex items-center gap-3">
        <div className="flex h-11 w-11 items-center justify-center rounded-2xl bg-slate-100 text-xl">{emoji}</div>
        <div>
          <p className="text-sm font-medium text-slate-500">{label}</p>
          <p className="mt-2 text-3xl font-semibold text-slate-900">{value}</p>
        </div>
      </div>
      <p className="mt-4 text-sm text-slate-500">{caption}</p>
    </div>
  );
}
