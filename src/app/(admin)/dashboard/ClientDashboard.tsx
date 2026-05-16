'use client';

import Link from 'next/link';
import { useMemo } from 'react';
import { useChat } from 'ai/react';
import { parseConflictReportFromText } from '@/lib/ai/conflictParser';
import ConflictPanel from '@/components/shared/ConflictPanel';

type WorkOrderClient = {
  id: number;
  departmentName: string;
  description: string;
  plannedStartDate: string;
  plannedEndDate: string;
  locationLat: number;
  locationLng: number;
  status: 'scheduled' | 'in_progress' | 'completed' | 'cancelled';
};

interface ClientDashboardProps {
  workOrders: WorkOrderClient[];
  pendingReportsCount: number;
  totalWorkOrders: number;
}

const ANALYSIS_PROMPT =
  'Analyze all scheduled work orders for conflicts and resource waste. Check location proximity (within 300 meters) and date overlaps. Provide a structured conflict report as JSON in a fenced code block with summary and conflicts.';

const statusBadgeStyles: Record<WorkOrderClient['status'], string> = {
  scheduled: 'bg-blue-50 text-blue-700 ring-blue-100',
  in_progress: 'bg-yellow-50 text-yellow-800 ring-yellow-100',
  completed: 'bg-emerald-50 text-emerald-700 ring-emerald-100',
  cancelled: 'bg-rose-50 text-rose-700 ring-rose-100',
};

function formatOrderDateRange(start: string, end: string) {
  const startDate = new Date(start);
  const endDate = new Date(end);
  return `${startDate.toLocaleDateString('tr-TR', {
    day: '2-digit',
    month: 'short',
  })} – ${endDate.toLocaleDateString('tr-TR', {
    day: '2-digit',
    month: 'short',
  })}`;
}

export default function ClientDashboard({ workOrders, pendingReportsCount, totalWorkOrders }: ClientDashboardProps) {
  const { messages, append, isLoading, error } = useChat({ api: '/api/agent' });

  const highSeverityCount = useMemo(() => {
    return messages.reduce((count, message) => {
      if (message.role !== 'assistant' || typeof message.content !== 'string') return count;
      const parsed = parseConflictReportFromText(message.content);
      return count + (parsed?.conflicts.filter((conflict) => conflict.severity === 'high').length ?? 0);
    }, 0);
  }, [messages]);

  const handleRunAnalysis = async () => {
    await append({ role: 'user', content: ANALYSIS_PROMPT });
  };

  return (
    <main className="min-h-screen bg-slate-50">
      <header className="border-b border-slate-200 bg-white px-6 py-5 shadow-sm">
        <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
          <div className="flex items-center gap-4">
            <div className="flex h-10 w-10 items-center justify-center rounded-2xl bg-sky-600 text-sm font-semibold text-white">
              CS
            </div>
            <div>
              <h1 className="text-xl font-semibold text-slate-900">CitySync AI Admin</h1>
              <p className="text-sm text-slate-500">Belediye koordinasyon paneli ve yapay zeka çakışma tespiti.</p>
            </div>
          </div>
          <Link
            href="/"
            className="inline-flex items-center justify-center rounded-full border border-slate-200 bg-white px-4 py-2 text-sm font-medium text-slate-700 transition hover:bg-slate-50"
          >
            Vatandaş sayfasına git
          </Link>
        </div>
      </header>

      <div className="mx-auto max-w-7xl px-6 py-8">
        <div className="grid gap-4 lg:grid-cols-3">
          <div className="rounded-3xl border border-slate-200 bg-white p-5 shadow-sm">
            <p className="text-sm font-medium text-slate-500">Toplam İş Emri</p>
            <p className="mt-3 text-3xl font-semibold text-slate-900">{totalWorkOrders}</p>
          </div>
          <div className="rounded-3xl border border-slate-200 bg-white p-5 shadow-sm">
            <p className="text-sm font-medium text-slate-500">Bekleyen Raporlar</p>
            <p className="mt-3 text-3xl font-semibold text-slate-900">{pendingReportsCount}</p>
          </div>
          <div className="rounded-3xl border border-rose-200 bg-rose-50 p-5 shadow-sm">
            <p className="text-sm font-medium text-rose-700">Çakışma Uyarısı</p>
            <p className="mt-3 text-3xl font-semibold text-rose-900">{highSeverityCount}</p>
          </div>
        </div>

        <div className="mt-8 flex flex-col gap-6 lg:flex-row">
          <div className="flex-1 rounded-3xl border border-slate-200 bg-white p-6 shadow-sm">
            <div className="mb-6 flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
              <div>
                <h2 className="text-lg font-semibold text-slate-900">Planlanmış İş Emirleri</h2>
                <p className="mt-1 text-sm text-slate-500">Sistemde kayıtlı iş emirlerini ve mevcut durumlarını görüntüleyin.</p>
              </div>
              <button
                type="button"
                onClick={handleRunAnalysis}
                disabled={isLoading}
                className="inline-flex items-center justify-center rounded-full bg-slate-900 px-5 py-2.5 text-sm font-semibold text-white transition hover:bg-slate-700 disabled:cursor-not-allowed disabled:opacity-60"
              >
                {isLoading ? 'AI Analizi Çalıştırılıyor...' : 'AI Çakışma Analizi Çalıştır'}
              </button>
            </div>
            <div className="space-y-4">
              {workOrders.length > 0 ? (
                workOrders.map((order) => (
                  <article key={order.id} className="rounded-3xl border border-slate-200 bg-slate-50 p-5">
                    <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
                      <div>
                        <p className="text-sm font-semibold text-slate-900">{order.departmentName}</p>
                        <p className="mt-1 text-sm text-slate-500">{formatOrderDateRange(order.plannedStartDate, order.plannedEndDate)}</p>
                      </div>
                      <span
                        className={`inline-flex items-center rounded-full px-3 py-1 text-xs font-semibold ring-1 ${statusBadgeStyles[order.status]}`}
                      >
                        {order.status.replace('_', ' ').toUpperCase()}
                      </span>
                    </div>
                    <div className="mt-4 grid gap-2 sm:grid-cols-2">
                      <p className="text-sm text-slate-600">{order.description}</p>
                      <p className="text-sm text-slate-600">
                        Konum: {order.locationLat.toFixed(4)}, {order.locationLng.toFixed(4)}
                      </p>
                    </div>
                  </article>
                ))
              ) : (
                <div className="rounded-3xl border border-dashed border-slate-300 bg-slate-50 p-6 text-center text-sm text-slate-500">
                  Şu anda görüntülenecek planlanmış iş emri yok.
                </div>
              )}
            </div>
          </div>

          <aside className="lg:w-[420px] rounded-3xl border border-slate-200 bg-white p-6 shadow-sm">
            <h2 className="text-lg font-semibold text-slate-900">AI Sonuç Paneli</h2>
            <p className="mt-1 text-sm text-slate-500">Yapay zeka çakışma analizini çalıştırdığınızda burada sonuçlar gözükecek.</p>
            <div className="mt-6">
              <ConflictPanel messages={messages} isLoading={isLoading} chatError={error} />
            </div>
          </aside>
        </div>
      </div>
    </main>
  );
}
