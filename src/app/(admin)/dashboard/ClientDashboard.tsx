'use client';

import Link from 'next/link';
import { useCallback, useEffect, useMemo, useState } from 'react';
import { useChat } from '@ai-sdk/react';
import { DefaultChatTransport } from 'ai';
import { parseConflictReportFromText } from '@/lib/ai/conflictParser';
import ConflictPanel from '@/components/shared/ConflictPanel';
import { StatCard } from '@/components/ui/StatCard';
import { CATEGORY_META } from '@/types';
import type { ReportCategory, ReportStatus } from '@/types';

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

type ReportClient = {
  id: number;
  title: string;
  description: string;
  status: ReportStatus;
  category: ReportCategory;
  locationLat: number;
  locationLng: number;
  createdAt: string;
};

type ConflictImpact = {
  wastedBudgetTRY: number;
  co2KgSaved: number;
  roadMetersSaved: number;
};

interface ClientDashboardProps {
  workOrders: WorkOrderClient[];
  reports: ReportClient[];
  pendingReportsCount: number;
  totalWorkOrders: number;
}

const ANALYSIS_PROMPT =
  'Tüm planlanmış iş emirlerini çakışmalar ve kaynak israfı açısından analiz et. Konum yakınlığını (300 metre içinde) ve tarih örtüşmelerini kontrol et. Özet ve çakışmalar içeren JSON formatında yapılandırılmış bir çakışma raporu sun.';

const RISK_ANALYSIS_PROMPT =
  'Önümüzdeki 30 gün içinde başlayacak veya bu dönemde devam edecek iş emirlerine odaklan. '
  + 'Bu yakın dönemdeki çakışmaları aciliyet sırasına göre değerlendir; her biri için risk seviyesini, '
  + 'tahmini maliyetini ve önerilen acil aksiyonu belirt. Sonucu özet ve çakışmalar içeren JSON formatında sun.';

const statusBadgeStyles: Record<WorkOrderClient['status'], string> = {
  scheduled: 'bg-blue-50 text-blue-700 ring-blue-100',
  in_progress: 'bg-yellow-50 text-yellow-800 ring-yellow-100',
  completed: 'bg-emerald-50 text-emerald-700 ring-emerald-100',
  cancelled: 'bg-rose-50 text-rose-700 ring-rose-100',
};

const statusLabels: Record<WorkOrderClient['status'], string> = {
  scheduled: 'Planlandı',
  in_progress: 'Devam Ediyor',
  completed: 'Tamamlandı',
  cancelled: 'İptal Edildi',
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

const reportStatusLabels: Record<ReportStatus, string> = {
  pending: 'Bekliyor',
  in_progress: 'İşlemde',
  resolved: 'Çözüldü',
};
const reportStatusStyles: Record<ReportStatus, string> = {
  pending: 'bg-amber-50 text-amber-700 border-amber-200 hover:bg-amber-100',
  in_progress: 'bg-blue-50 text-blue-700 border-blue-200 hover:bg-blue-100',
  resolved: 'bg-emerald-50 text-emerald-700 border-emerald-200 hover:bg-emerald-100',
};

export default function ClientDashboard({ workOrders, reports: initialReports, pendingReportsCount, totalWorkOrders }: ClientDashboardProps) {
  const { messages, sendMessage, status, error } = useChat({
    transport: new DefaultChatTransport({ api: '/api/agent' }),
  });
  const isLoading = status === 'submitted' || status === 'streaming';

  const [conflictImpact, setConflictImpact] = useState<ConflictImpact | null>(null);
  const [reports, setReports] = useState<ReportClient[]>(initialReports);
  const [updatingReportId, setUpdatingReportId] = useState<number | null>(null);

  const fetchConflictImpact = useCallback(async () => {
    try {
      const res = await fetch('/api/conflicts');
      if (!res.ok) return;
      const data = await res.json();
      if (data?.totalImpact) setConflictImpact(data.totalImpact);
    } catch {
      // non-critical
    }
  }, []);

  useEffect(() => { fetchConflictImpact(); }, [fetchConflictImpact]);

  const handleUpdateReportStatus = async (reportId: number, newStatus: ReportStatus) => {
    setUpdatingReportId(reportId);
    try {
      const res = await fetch(`/api/reports/${reportId}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ status: newStatus }),
      });
      if (!res.ok) return;
      const updated = await res.json();
      setReports((prev) => prev.map((r) => (r.id === reportId ? { ...r, status: updated.status } : r)));
    } finally {
      setUpdatingReportId(null);
    }
  };

  // Report stats
  const reportStats = useMemo(() => ({
    total: reports.length,
    pending: reports.filter((r) => r.status === 'pending').length,
    in_progress: reports.filter((r) => r.status === 'in_progress').length,
    resolved: reports.filter((r) => r.status === 'resolved').length,
    resolutionRate: reports.length > 0 ? Math.round((reports.filter((r) => r.status === 'resolved').length / reports.length) * 100) : 0,
  }), [reports]);

  // Predictive maintenance: 3+ unresolved reports clustered within 300m of each other
  const predictiveClusters = useMemo(() => {
    const unresolved = reports.filter((r) => r.status !== 'resolved');
    const clusters: { center: ReportClient; count: number; category: ReportCategory }[] = [];
    const visited = new Set<number>();
    unresolved.forEach((r) => {
      if (visited.has(r.id)) return;
      const nearby = unresolved.filter((other) => {
        const dLat = (other.locationLat - r.locationLat) * 111000;
        const dLng = (other.locationLng - r.locationLng) * 111000 * Math.cos((r.locationLat * Math.PI) / 180);
        return Math.sqrt(dLat * dLat + dLng * dLng) < 300;
      });
      if (nearby.length >= 3) {
        nearby.forEach((n) => visited.add(n.id));
        clusters.push({ center: r, count: nearby.length, category: r.category });
      }
    });
    return clusters;
  }, [reports]);

  // ai v6 messages are parts-based — flatten each to plain { role, content } text.
  const textMessages = useMemo(
    () =>
      messages.map((message) => ({
        role: message.role,
        content: message.parts
          .filter((part) => part.type === 'text')
          .map((part) => part.text)
          .join(''),
      })),
    [messages],
  );

  const highSeverityCount = useMemo(() => {
    return textMessages.reduce((count, message) => {
      if (message.role !== 'assistant') return count;
      const parsed = parseConflictReportFromText(message.content);
      return count + (parsed?.conflicts.filter((conflict) => conflict.severity === 'high').length ?? 0);
    }, 0);
  }, [textMessages]);

  // Track which work orders are involved in AI-detected conflicts (for timeline colouring)
  const conflictKeys = useMemo(() => {
    const keys = new Set<string>();
    textMessages.forEach((message) => {
      if (message.role !== 'assistant') return;
      const parsed = parseConflictReportFromText(message.content);
      parsed?.conflicts.forEach((c) => {
        keys.add(`${c.workOrderA.departmentName}|${c.workOrderA.plannedStartDate}`);
        keys.add(`${c.workOrderB.departmentName}|${c.workOrderB.plannedStartDate}`);
      });
    });
    return keys;
  }, [textMessages]);

  // Timeline helpers
  const timelineRange = useMemo(() => {
    if (workOrders.length === 0) return null;
    const dates = workOrders.flatMap((o) => [new Date(o.plannedStartDate), new Date(o.plannedEndDate)]);
    const valid = dates.filter((d) => !Number.isNaN(d.getTime()));
    if (valid.length === 0) return null;
    const earliest = new Date(Math.min(...valid.map((d) => d.getTime())));
    const monthStart = new Date(earliest.getFullYear(), earliest.getMonth(), 1);
    return { monthStart, label: monthStart.toLocaleDateString('tr-TR', { month: 'long', year: 'numeric' }) };
  }, [workOrders]);

  const getBarStyle = (order: WorkOrderClient) => {
    const start = new Date(order.plannedStartDate).getDate();
    const end = new Date(order.plannedEndDate).getDate();
    const width = Math.max(6, ((end - start + 1) / 30) * 100);
    return { left: `${((start - 1) / 30) * 100}%`, width: `${width}%` };
  };

  const isConflicting = (order: WorkOrderClient) =>
    conflictKeys.has(`${order.departmentName}|${order.plannedStartDate}`);

  const handleRunAnalysis = async () => {
    await sendMessage({ text: ANALYSIS_PROMPT });
  };

  const handleRunRiskAnalysis = async () => {
    await sendMessage({ text: RISK_ANALYSIS_PROMPT });
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
            Ana Sayfaya Git
          </Link>
        </div>
      </header>

      <div className="mx-auto max-w-7xl px-6 py-8">
        {/* Top stats */}
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

        {/* AI impact stats */}
        {conflictImpact && (
          <div className="mt-4 grid gap-4 lg:grid-cols-3">
            <StatCard emoji="💰" label="AI Çakışma Önleme Etkisi" value={`₺${conflictImpact.wastedBudgetTRY.toLocaleString('tr-TR')}`} caption="Önlenebilir bütçe kaybı" />
            <StatCard emoji="🌱" label="CO₂ Tasarrufu" value={`${conflictImpact.co2KgSaved.toLocaleString('tr-TR')} kg`} caption="Tahmini karbon azaltımı" />
            <StatCard emoji="🛣️" label="Yol Kurtarımı" value={`${conflictImpact.roadMetersSaved.toLocaleString('tr-TR')} m`} caption="Çakışma nedeniyle kurtarılan yol" />
          </div>
        )}

        {/* Report stats */}
        <div className="mt-4 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          <div className="rounded-3xl border border-slate-200 bg-white p-5 shadow-sm">
            <p className="text-sm font-medium text-slate-500">Toplam Rapor</p>
            <p className="mt-2 text-3xl font-semibold text-slate-900">{reportStats.total}</p>
          </div>
          <div className="rounded-3xl border border-amber-200 bg-amber-50 p-5 shadow-sm">
            <p className="text-sm font-medium text-amber-700">Bekleyen</p>
            <p className="mt-2 text-3xl font-semibold text-amber-900">{reportStats.pending}</p>
          </div>
          <div className="rounded-3xl border border-blue-200 bg-blue-50 p-5 shadow-sm">
            <p className="text-sm font-medium text-blue-700">İşlemde</p>
            <p className="mt-2 text-3xl font-semibold text-blue-900">{reportStats.in_progress}</p>
          </div>
          <div className="rounded-3xl border border-emerald-200 bg-emerald-50 p-5 shadow-sm">
            <p className="text-sm font-medium text-emerald-700">Çözüm Oranı</p>
            <p className="mt-2 text-3xl font-semibold text-emerald-900">%{reportStats.resolutionRate}</p>
          </div>
        </div>

        {/* Predictive maintenance */}
        {predictiveClusters.length > 0 && (
          <div className="mt-4 rounded-3xl border border-violet-200 bg-violet-50 p-5 shadow-sm">
            <p className="text-sm font-semibold text-violet-900">🔮 Tahminsel Bakım Önerisi</p>
            <p className="mt-1 text-sm text-violet-700">Aşağıdaki bölgelerde yoğun vatandaş şikayeti tespit edildi. Proaktif iş emri planlanması önerilir.</p>
            <div className="mt-3 grid gap-3 sm:grid-cols-2">
              {predictiveClusters.map((cluster, i) => {
                const catMeta = CATEGORY_META[cluster.category];
                return (
                  <div key={i} className="rounded-2xl border border-violet-200 bg-white p-4">
                    <p className="text-sm font-semibold text-slate-900">{catMeta.department}</p>
                    <p className="text-xs text-slate-500 mt-1">{cluster.count} rapor · {cluster.center.locationLat.toFixed(3)}, {cluster.center.locationLng.toFixed(3)}</p>
                    <span className={`mt-2 inline-flex items-center rounded-full px-2 py-0.5 text-xs font-medium ${catMeta.color}`}>{catMeta.label}</span>
                  </div>
                );
              })}
            </div>
          </div>
        )}

        <div className="mt-8 flex flex-col gap-6 lg:flex-row">
          <div className="flex-1 rounded-3xl border border-slate-200 bg-white p-6 shadow-sm">
            <div className="mb-6 flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
              <div>
                <h2 className="text-lg font-semibold text-slate-900">Planlanmış İş Emirleri</h2>
                <p className="mt-1 text-sm text-slate-500">Sistemde kayıtlı iş emirlerini ve mevcut durumlarını görüntüleyin.</p>
              </div>
              <div className="flex flex-col gap-2 sm:flex-row">
                <button
                  type="button"
                  onClick={handleRunAnalysis}
                  disabled={isLoading}
                  className="inline-flex items-center justify-center rounded-full bg-slate-900 px-5 py-2.5 text-sm font-semibold text-white transition hover:bg-slate-700 disabled:cursor-not-allowed disabled:opacity-60"
                >
                  {isLoading ? 'AI Analizi Çalıştırılıyor...' : 'AI Çakışma Analizi Çalıştır'}
                </button>
                <button
                  type="button"
                  onClick={handleRunRiskAnalysis}
                  disabled={isLoading}
                  className="inline-flex items-center justify-center rounded-full border border-slate-300 bg-white px-5 py-2.5 text-sm font-semibold text-slate-700 transition hover:border-rose-300 hover:bg-rose-50 disabled:cursor-not-allowed disabled:opacity-60"
                >
                  30 Gün Risk Analizi
                </button>
              </div>
            </div>

            <div className="space-y-4">
              {/* Timeline / Gantt */}
              {timelineRange && (
                <section className="rounded-3xl border border-slate-200 bg-slate-50 p-5">
                  <div className="mb-3 flex items-center justify-between">
                    <div>
                      <p className="text-sm font-medium text-slate-500">Zaman Çizgisi</p>
                      <p className="text-sm font-semibold text-slate-900">{timelineRange.label}</p>
                    </div>
                    <p className="text-xs font-medium tracking-widest text-slate-400">1 · 5 · 10 · 15 · 20 · 25 · 30</p>
                  </div>
                  <div className="space-y-3">
                    {workOrders.map((order) => (
                      <div key={order.id}>
                        <div className="mb-1 flex items-center justify-between text-xs text-slate-500">
                          <span>{order.departmentName}</span>
                          <span>{formatOrderDateRange(order.plannedStartDate, order.plannedEndDate)}</span>
                        </div>
                        <div className="relative h-8 overflow-hidden rounded-xl bg-slate-200">
                          <div
                            className={`absolute inset-y-1 rounded-xl transition-all ${isConflicting(order) ? 'bg-rose-500' : 'bg-sky-500'}`}
                            style={getBarStyle(order)}
                          />
                        </div>
                      </div>
                    ))}
                  </div>
                </section>
              )}

              {/* Work order cards */}
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
                        {statusLabels[order.status]}
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

          <aside className="lg:w-[420px] space-y-6">
            {/* AI Panel */}
            <div className="rounded-3xl border border-slate-200 bg-white p-6 shadow-sm">
              <h2 className="text-lg font-semibold text-slate-900">AI Sonuç Paneli</h2>
              <p className="mt-1 text-sm text-slate-500">Yapay zeka çakışma analizini çalıştırdığınızda burada sonuçlar gözükecek.</p>
              <div className="mt-6">
                <ConflictPanel
                  messages={textMessages}
                  isLoading={isLoading}
                  chatError={error}
                  onRescheduleSuccess={fetchConflictImpact}
                />
              </div>
            </div>

            {/* Report management */}
            <div className="rounded-3xl border border-slate-200 bg-white p-6 shadow-sm">
              <h2 className="text-lg font-semibold text-slate-900">Rapor Yönetimi</h2>
              <p className="mt-1 text-sm text-slate-500">Vatandaş raporlarının durumunu güncelleyin.</p>
              <div className="mt-4 space-y-3">
                {reports.length === 0 ? (
                  <p className="text-sm text-slate-400">Rapor bulunamadı.</p>
                ) : (
                  reports.slice().sort((a, b) => {
                    const order = { pending: 0, in_progress: 1, resolved: 2 };
                    return order[a.status] - order[b.status];
                  }).map((report) => {
                    const catMeta = CATEGORY_META[report.category];
                    return (
                      <div key={report.id} className="rounded-2xl border border-slate-200 bg-slate-50 p-4">
                        <div className="flex items-start justify-between gap-2">
                          <p className="text-sm font-semibold text-slate-900 leading-snug">{report.title}</p>
                          <span className={`shrink-0 inline-flex items-center rounded-full px-2 py-0.5 text-xs font-medium ${catMeta.color}`}>
                            {catMeta.label}
                          </span>
                        </div>
                        <p className="mt-1 text-xs text-slate-500">{catMeta.department}</p>
                        <div className="mt-3 flex flex-wrap gap-1.5">
                          {(['pending', 'in_progress', 'resolved'] as ReportStatus[]).map((s) => (
                            <button
                              key={s}
                              type="button"
                              disabled={report.status === s || updatingReportId === report.id}
                              onClick={() => handleUpdateReportStatus(report.id, s)}
                              className={`rounded-full border px-3 py-1 text-xs font-medium transition disabled:opacity-40 ${
                                report.status === s
                                  ? reportStatusStyles[s] + ' opacity-100 cursor-default'
                                  : 'border-slate-200 bg-white text-slate-600 hover:bg-slate-100'
                              }`}
                            >
                              {updatingReportId === report.id && report.status !== s ? '...' : reportStatusLabels[s]}
                            </button>
                          ))}
                        </div>
                      </div>
                    );
                  })
                )}
              </div>
            </div>
          </aside>
        </div>
      </div>
    </main>
  );
}
