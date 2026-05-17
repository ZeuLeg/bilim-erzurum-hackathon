'use client';

import Link from 'next/link';
import { useCallback, useEffect, useMemo, useState } from 'react';
import { useChat } from '@ai-sdk/react';
import { DefaultChatTransport } from 'ai';
import { parseConflictReportFromText } from '@/lib/ai/conflictParser';
import ConflictPanel from '@/components/shared/ConflictPanel';
import { CATEGORY_META } from '@/types';
import type { ReportCategory, ReportStatus } from '@/types';

type WorkOrderStatus = 'scheduled' | 'in_progress' | 'completed' | 'cancelled';

type WorkOrderClient = {
  id: number;
  departmentName: string;
  description: string;
  plannedStartDate: string;
  plannedEndDate: string;
  locationLat: number;
  locationLng: number;
  status: WorkOrderStatus;
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

const workOrderStatusBadge: Record<WorkOrderStatus, string> = {
  scheduled: 'bg-sky-50 text-sky-700 ring-sky-100',
  in_progress: 'bg-amber-50 text-amber-800 ring-amber-100',
  completed: 'bg-emerald-50 text-emerald-700 ring-emerald-100',
  cancelled: 'bg-rose-50 text-rose-700 ring-rose-100',
};

const workOrderStatusLabels: Record<WorkOrderStatus, string> = {
  scheduled: 'Planlandı',
  in_progress: 'Devam Ediyor',
  completed: 'Tamamlandı',
  cancelled: 'İptal Edildi',
};

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

const DEPARTMENTS = [
  'Asfalt Müdürlüğü',
  'Su ve Kanalizasyon Müdürlüğü',
  'Elektrik İşleri Müdürlüğü',
  'Doğalgaz Müdürlüğü',
  'Park ve Bahçeler Müdürlüğü',
  'Genel Hizmetler',
];

const emptyForm = {
  departmentName: DEPARTMENTS[0],
  description: '',
  plannedStartDate: '',
  plannedEndDate: '',
  locationLat: 39.9055,
  locationLng: 41.2714,
};

function formatDateRange(start: string, end: string) {
  const fmt = (s: string) =>
    new Date(s).toLocaleDateString('tr-TR', { day: '2-digit', month: 'short' });
  return `${fmt(start)} – ${fmt(end)}`;
}

export default function ClientDashboard({
  workOrders: initialOrders,
  reports: initialReports,
}: ClientDashboardProps) {
  const { messages, sendMessage, status, error } = useChat({
    transport: new DefaultChatTransport({ api: '/api/agent' }),
  });
  const isLoading = status === 'submitted' || status === 'streaming';

  const [orders, setOrders] = useState<WorkOrderClient[]>(initialOrders);
  const [reports, setReports] = useState<ReportClient[]>(initialReports);
  const [conflictImpact, setConflictImpact] = useState<ConflictImpact | null>(null);

  const [showNewForm, setShowNewForm] = useState(false);
  const [newForm, setNewForm] = useState(emptyForm);
  const [addingOrder, setAddingOrder] = useState(false);
  const [formError, setFormError] = useState<string | null>(null);

  const [updatingOrderId, setUpdatingOrderId] = useState<number | null>(null);
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

  const handleAddWorkOrder = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setAddingOrder(true);
    setFormError(null);
    try {
      const res = await fetch('/api/work-orders', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          ...newForm,
          plannedStartDate: new Date(newForm.plannedStartDate).toISOString(),
          plannedEndDate: new Date(newForm.plannedEndDate).toISOString(),
        }),
      });
      if (!res.ok) {
        const err = await res.json().catch(() => null);
        throw new Error(err?.error || 'İş emri eklenemedi.');
      }
      const created: WorkOrderClient & { plannedStartDate: string; plannedEndDate: string } = await res.json();
      const normalized: WorkOrderClient = {
        ...created,
        plannedStartDate: new Date(created.plannedStartDate).toISOString(),
        plannedEndDate: new Date(created.plannedEndDate).toISOString(),
      };
      setOrders((prev) => [...prev, normalized]);
      setNewForm(emptyForm);
      setShowNewForm(false);
    } catch (err) {
      setFormError(err instanceof Error ? err.message : 'Bilinmeyen hata.');
    } finally {
      setAddingOrder(false);
    }
  };

  const handleUpdateOrderStatus = async (id: number, newStatus: WorkOrderStatus) => {
    setUpdatingOrderId(id);
    try {
      const res = await fetch(`/api/work-orders/${id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ status: newStatus }),
      });
      if (!res.ok) return;
      setOrders((prev) => prev.map((o) => (o.id === id ? { ...o, status: newStatus } : o)));
    } finally {
      setUpdatingOrderId(null);
    }
  };

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

  const reportStats = useMemo(() => ({
    total: reports.length,
    pending: reports.filter((r) => r.status === 'pending').length,
    in_progress: reports.filter((r) => r.status === 'in_progress').length,
    resolved: reports.filter((r) => r.status === 'resolved').length,
    resolutionRate: reports.length > 0
      ? Math.round((reports.filter((r) => r.status === 'resolved').length / reports.length) * 100)
      : 0,
  }), [reports]);

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
      return count + (parsed?.conflicts.filter((c) => c.severity === 'high').length ?? 0);
    }, 0);
  }, [textMessages]);

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

  const timelineRange = useMemo(() => {
    if (orders.length === 0) return null;
    const dates = orders.flatMap((o) => [new Date(o.plannedStartDate), new Date(o.plannedEndDate)]);
    const valid = dates.filter((d) => !Number.isNaN(d.getTime()));
    if (valid.length === 0) return null;
    const earliest = new Date(Math.min(...valid.map((d) => d.getTime())));
    const monthStart = new Date(earliest.getFullYear(), earliest.getMonth(), 1);
    return { monthStart, label: monthStart.toLocaleDateString('tr-TR', { month: 'long', year: 'numeric' }) };
  }, [orders]);

  const getBarStyle = (order: WorkOrderClient) => {
    const start = new Date(order.plannedStartDate).getDate();
    const end = new Date(order.plannedEndDate).getDate();
    const width = Math.max(6, ((end - start + 1) / 30) * 100);
    return { left: `${((start - 1) / 30) * 100}%`, width: `${width}%` };
  };

  const isConflicting = (order: WorkOrderClient) =>
    conflictKeys.has(`${order.departmentName}|${order.plannedStartDate}`);

  return (
    <main className="min-h-screen bg-slate-50">
      {/* Header */}
      <header className="border-b border-slate-200 bg-white px-6 py-4 shadow-sm">
        <div className="mx-auto flex max-w-7xl items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-sky-600 text-sm font-bold text-white">
              CS
            </div>
            <div>
              <h1 className="text-base font-semibold text-slate-900">KentSenkron AI — Admin Paneli</h1>
              <p className="text-xs text-slate-400">Belediye koordinasyon ve yapay zeka çakışma tespiti</p>
            </div>
          </div>
          <Link
            href="/"
            className="inline-flex items-center rounded-lg border border-slate-200 bg-white px-3 py-1.5 text-xs font-medium text-slate-600 transition hover:bg-slate-50"
          >
            ← Ana Sayfa
          </Link>
        </div>
      </header>

      <div className="mx-auto max-w-7xl px-6 py-6">

        {/* ── Metrics bar ── */}
        <div className="overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm">
          <div className="grid divide-x divide-slate-100 sm:grid-cols-2 lg:grid-cols-5">
            <div className="p-5">
              <p className="text-xs font-medium uppercase tracking-wide text-slate-400">İş Emri</p>
              <p className="mt-2 text-2xl font-semibold text-slate-900">{orders.length}</p>
            </div>
            <div className="p-5">
              <p className="text-xs font-medium uppercase tracking-wide text-slate-400">Toplam Rapor</p>
              <p className="mt-2 text-2xl font-semibold text-slate-900">{reportStats.total}</p>
            </div>
            <div className="p-5">
              <p className="text-xs font-medium uppercase tracking-wide text-slate-400">Bekleyen</p>
              <p className="mt-2 text-2xl font-semibold text-amber-600">{reportStats.pending}</p>
            </div>
            <div className="p-5">
              <p className="text-xs font-medium uppercase tracking-wide text-slate-400">Çözüm Oranı</p>
              <p className="mt-2 text-2xl font-semibold text-emerald-600">%{reportStats.resolutionRate}</p>
            </div>
            <div className="p-5">
              <p className="text-xs font-medium uppercase tracking-wide text-slate-400">Çakışma Uyarısı</p>
              <p className={`mt-2 text-2xl font-semibold ${highSeverityCount > 0 ? 'text-rose-600' : 'text-slate-900'}`}>
                {highSeverityCount}
              </p>
            </div>
          </div>
        </div>

        {/* AI impact strip */}
        {conflictImpact && (
          <div className="mt-3 flex flex-wrap items-center gap-x-6 gap-y-2 rounded-xl border border-emerald-100 bg-emerald-50 px-5 py-3 text-sm">
            <span className="font-medium text-emerald-800">AI Çakışma Önleme Etkisi</span>
            <span className="text-slate-700">💰 <strong>₺{conflictImpact.wastedBudgetTRY.toLocaleString('tr-TR')}</strong> bütçe</span>
            <span className="text-slate-700">🌱 <strong>{conflictImpact.co2KgSaved.toLocaleString('tr-TR')} kg</strong> CO₂</span>
            <span className="text-slate-700">🛣️ <strong>{conflictImpact.roadMetersSaved.toLocaleString('tr-TR')} m</strong> yol kurtarıldı</span>
          </div>
        )}

        {/* Predictive maintenance */}
        {predictiveClusters.length > 0 && (
          <div className="mt-3 rounded-xl border border-violet-200 bg-violet-50 px-5 py-4">
            <p className="text-sm font-semibold text-violet-900">🔮 Tahminsel Bakım — Yoğun Şikayet Bölgeleri</p>
            <div className="mt-2 flex flex-wrap gap-3">
              {predictiveClusters.map((cluster, i) => {
                const catMeta = CATEGORY_META[cluster.category];
                return (
                  <div key={i} className="flex items-center gap-2 rounded-lg border border-violet-200 bg-white px-3 py-2 text-sm">
                    <span className={`rounded-full px-2 py-0.5 text-xs font-medium ${catMeta.color}`}>{catMeta.label}</span>
                    <span className="text-slate-600">{catMeta.department}</span>
                    <span className="text-xs text-slate-400">{cluster.count} rapor</span>
                  </div>
                );
              })}
            </div>
          </div>
        )}

        {/* Main grid */}
        <div className="mt-6 flex flex-col gap-6 lg:flex-row">

          {/* ── Work orders panel ── */}
          <div className="flex-1 rounded-2xl border border-slate-200 bg-white shadow-sm">
            <div className="flex items-center justify-between gap-4 border-b border-slate-100 px-6 py-4">
              <div>
                <h2 className="text-base font-semibold text-slate-900">Planlanmış İş Emirleri</h2>
                <p className="text-xs text-slate-400 mt-0.5">Kayıtlı emirleri yönetin ve yenilerini ekleyin.</p>
              </div>
              <div className="flex flex-wrap gap-2">
                <button
                  type="button"
                  onClick={() => { setShowNewForm((v) => !v); setFormError(null); }}
                  className="inline-flex items-center rounded-lg border border-sky-200 bg-sky-50 px-3 py-1.5 text-xs font-semibold text-sky-700 transition hover:bg-sky-100"
                >
                  {showNewForm ? '✕ İptal' : '+ Yeni İş Emri'}
                </button>
                <button
                  type="button"
                  onClick={() => sendMessage({ text: ANALYSIS_PROMPT })}
                  disabled={isLoading}
                  className="inline-flex items-center rounded-lg bg-slate-900 px-3 py-1.5 text-xs font-semibold text-white transition hover:bg-slate-700 disabled:opacity-50"
                >
                  {isLoading ? 'Analiz ediliyor…' : 'AI Çakışma Analizi'}
                </button>
                <button
                  type="button"
                  onClick={() => sendMessage({ text: RISK_ANALYSIS_PROMPT })}
                  disabled={isLoading}
                  className="inline-flex items-center rounded-lg border border-slate-200 bg-white px-3 py-1.5 text-xs font-semibold text-slate-700 transition hover:border-rose-300 hover:bg-rose-50 disabled:opacity-50"
                >
                  30 Gün Risk
                </button>
              </div>
            </div>

            <div className="space-y-4 p-6">
              {/* New work order form */}
              {showNewForm && (
                <form onSubmit={handleAddWorkOrder} className="rounded-xl border border-sky-200 bg-sky-50 p-4 space-y-3">
                  <p className="text-xs font-semibold text-sky-800 uppercase tracking-wide">Yeni İş Emri</p>

                  <div>
                    <label className="block text-xs font-medium text-slate-600 mb-1">Müdürlük</label>
                    <select
                      value={newForm.departmentName}
                      onChange={(e) => setNewForm({ ...newForm, departmentName: e.target.value })}
                      className="w-full rounded-lg border border-slate-200 bg-white px-3 py-2 text-sm text-slate-900 focus:outline-none focus:ring-2 focus:ring-sky-300"
                    >
                      {DEPARTMENTS.map((d) => <option key={d} value={d}>{d}</option>)}
                    </select>
                  </div>

                  <div>
                    <label className="block text-xs font-medium text-slate-600 mb-1">Açıklama</label>
                    <textarea
                      value={newForm.description}
                      onChange={(e) => setNewForm({ ...newForm, description: e.target.value })}
                      rows={2}
                      required
                      placeholder="Yapılacak çalışmayı kısaca açıklayın"
                      className="w-full rounded-lg border border-slate-200 bg-white px-3 py-2 text-sm text-slate-900 focus:outline-none focus:ring-2 focus:ring-sky-300"
                    />
                  </div>

                  <div className="grid grid-cols-2 gap-3">
                    <div>
                      <label className="block text-xs font-medium text-slate-600 mb-1">Başlangıç</label>
                      <input
                        type="date"
                        value={newForm.plannedStartDate}
                        onChange={(e) => setNewForm({ ...newForm, plannedStartDate: e.target.value })}
                        required
                        className="w-full rounded-lg border border-slate-200 bg-white px-3 py-2 text-sm text-slate-900 focus:outline-none focus:ring-2 focus:ring-sky-300"
                      />
                    </div>
                    <div>
                      <label className="block text-xs font-medium text-slate-600 mb-1">Bitiş</label>
                      <input
                        type="date"
                        value={newForm.plannedEndDate}
                        onChange={(e) => setNewForm({ ...newForm, plannedEndDate: e.target.value })}
                        required
                        className="w-full rounded-lg border border-slate-200 bg-white px-3 py-2 text-sm text-slate-900 focus:outline-none focus:ring-2 focus:ring-sky-300"
                      />
                    </div>
                  </div>

                  <div className="grid grid-cols-2 gap-3">
                    <div>
                      <label className="block text-xs font-medium text-slate-600 mb-1">Enlem</label>
                      <input
                        type="number"
                        step="any"
                        value={newForm.locationLat}
                        onChange={(e) => setNewForm({ ...newForm, locationLat: Number(e.target.value) })}
                        className="w-full rounded-lg border border-slate-200 bg-white px-3 py-2 text-sm text-slate-900 focus:outline-none focus:ring-2 focus:ring-sky-300"
                      />
                    </div>
                    <div>
                      <label className="block text-xs font-medium text-slate-600 mb-1">Boylam</label>
                      <input
                        type="number"
                        step="any"
                        value={newForm.locationLng}
                        onChange={(e) => setNewForm({ ...newForm, locationLng: Number(e.target.value) })}
                        className="w-full rounded-lg border border-slate-200 bg-white px-3 py-2 text-sm text-slate-900 focus:outline-none focus:ring-2 focus:ring-sky-300"
                      />
                    </div>
                  </div>

                  {formError && <p className="text-xs text-rose-600">{formError}</p>}

                  <button
                    type="submit"
                    disabled={addingOrder}
                    className="w-full rounded-lg bg-sky-600 py-2 text-sm font-semibold text-white transition hover:bg-sky-700 disabled:opacity-60"
                  >
                    {addingOrder ? 'Ekleniyor…' : 'İş Emri Ekle'}
                  </button>
                </form>
              )}

              {/* Timeline */}
              {timelineRange && (
                <section className="rounded-xl border border-slate-100 bg-slate-50 p-4">
                  <div className="mb-3 flex items-center justify-between">
                    <p className="text-xs font-semibold text-slate-600">{timelineRange.label} — Zaman Çizgisi</p>
                    <p className="text-xs text-slate-300 tracking-widest">1·5·10·15·20·25·30</p>
                  </div>
                  <div className="space-y-2.5">
                    {orders.map((order) => (
                      <div key={order.id}>
                        <div className="mb-1 flex items-center justify-between text-xs text-slate-500">
                          <span className="truncate max-w-[60%]">{order.departmentName}</span>
                          <span>{formatDateRange(order.plannedStartDate, order.plannedEndDate)}</span>
                        </div>
                        <div className="relative h-6 overflow-hidden rounded-lg bg-slate-200">
                          <div
                            className={`absolute inset-y-0.5 rounded-md transition-all ${isConflicting(order) ? 'bg-rose-500' : 'bg-sky-500'}`}
                            style={getBarStyle(order)}
                          />
                        </div>
                      </div>
                    ))}
                  </div>
                </section>
              )}

              {/* Work order cards */}
              {orders.length > 0 ? (
                orders.map((order) => (
                  <article
                    key={order.id}
                    className={`rounded-xl border p-4 transition ${isConflicting(order) ? 'border-rose-200 bg-rose-50' : 'border-slate-200 bg-slate-50'}`}
                  >
                    <div className="flex items-start justify-between gap-3">
                      <div className="min-w-0">
                        <p className="text-sm font-semibold text-slate-900">{order.departmentName}</p>
                        <p className="text-xs text-slate-500 mt-0.5">{formatDateRange(order.plannedStartDate, order.plannedEndDate)}</p>
                      </div>
                      <span className={`shrink-0 inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-semibold ring-1 ${workOrderStatusBadge[order.status]}`}>
                        {workOrderStatusLabels[order.status]}
                      </span>
                    </div>
                    <p className="mt-2 text-sm text-slate-600 line-clamp-2">{order.description}</p>
                    <p className="mt-1 text-xs text-slate-400">{order.locationLat.toFixed(4)}, {order.locationLng.toFixed(4)}</p>

                    {/* Status buttons */}
                    <div className="mt-3 flex flex-wrap gap-1.5">
                      {(['scheduled', 'in_progress', 'completed', 'cancelled'] as WorkOrderStatus[]).map((s) => (
                        <button
                          key={s}
                          type="button"
                          disabled={order.status === s || updatingOrderId === order.id}
                          onClick={() => handleUpdateOrderStatus(order.id, s)}
                          className={`rounded-full border px-2.5 py-0.5 text-xs font-medium transition disabled:opacity-40 ${
                            order.status === s
                              ? `${workOrderStatusBadge[s]} cursor-default`
                              : 'border-slate-200 bg-white text-slate-600 hover:bg-slate-100'
                          }`}
                        >
                          {updatingOrderId === order.id && order.status !== s ? '…' : workOrderStatusLabels[s]}
                        </button>
                      ))}
                    </div>
                  </article>
                ))
              ) : (
                <div className="rounded-xl border border-dashed border-slate-200 p-6 text-center text-sm text-slate-400">
                  Planlanmış iş emri yok. Yeni ekleyin.
                </div>
              )}
            </div>
          </div>

          {/* ── Right aside ── */}
          <aside className="space-y-5 lg:w-[400px]">

            {/* AI panel */}
            <div className="rounded-2xl border border-slate-200 bg-white shadow-sm">
              <div className="border-b border-slate-100 px-5 py-4">
                <h2 className="text-base font-semibold text-slate-900">AI Analiz Sonuçları</h2>
                <p className="text-xs text-slate-400 mt-0.5">Çakışma analizi çalıştırıldığında sonuçlar burada görünür.</p>
              </div>
              <div className="p-5">
                <ConflictPanel
                  messages={textMessages}
                  isLoading={isLoading}
                  chatError={error}
                  onRescheduleSuccess={fetchConflictImpact}
                />
              </div>
            </div>

            {/* Report management */}
            <div className="rounded-2xl border border-slate-200 bg-white shadow-sm">
              <div className="border-b border-slate-100 px-5 py-4">
                <h2 className="text-base font-semibold text-slate-900">Rapor Yönetimi</h2>
                <p className="text-xs text-slate-400 mt-0.5">Vatandaş raporlarının durumunu güncelleyin.</p>
              </div>
              <div className="divide-y divide-slate-100">
                {reports.length === 0 ? (
                  <p className="px-5 py-4 text-sm text-slate-400">Rapor bulunamadı.</p>
                ) : (
                  reports
                    .slice()
                    .sort((a, b) => {
                      const order = { pending: 0, in_progress: 1, resolved: 2 };
                      return order[a.status] - order[b.status];
                    })
                    .map((report) => {
                      const catMeta = CATEGORY_META[report.category];
                      return (
                        <div key={report.id} className="px-5 py-3">
                          <div className="flex items-start justify-between gap-2">
                            <p className="text-sm font-medium text-slate-900 leading-snug">{report.title}</p>
                            <span className={`shrink-0 rounded-full px-2 py-0.5 text-xs font-medium ${catMeta.color}`}>
                              {catMeta.label}
                            </span>
                          </div>
                          <p className="mt-0.5 text-xs text-slate-400">{catMeta.department}</p>
                          <div className="mt-2 flex flex-wrap gap-1.5">
                            {(['pending', 'in_progress', 'resolved'] as ReportStatus[]).map((s) => (
                              <button
                                key={s}
                                type="button"
                                disabled={report.status === s || updatingReportId === report.id}
                                onClick={() => handleUpdateReportStatus(report.id, s)}
                                className={`rounded-full border px-2.5 py-0.5 text-xs font-medium transition disabled:opacity-40 ${
                                  report.status === s
                                    ? `${reportStatusStyles[s]} cursor-default`
                                    : 'border-slate-200 bg-white text-slate-600 hover:bg-slate-100'
                                }`}
                              >
                                {updatingReportId === report.id && report.status !== s ? '…' : reportStatusLabels[s]}
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
