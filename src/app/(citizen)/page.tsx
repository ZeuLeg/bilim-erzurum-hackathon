"use client";

import dynamic from "next/dynamic";
import Link from "next/link";
import { MapPin, ShieldCheck, Sparkles } from "lucide-react";
import { useCallback, useEffect, useState } from "react";
import type { Report, WorkOrder } from "@/types";
import ReportForm from "@/components/shared/ReportForm";

const CityMap = dynamic(() => import("@/components/shared/CityMap"), {
  ssr: false,
  loading: () => (
    <div className="flex h-full w-full items-center justify-center rounded-3xl border border-slate-200 bg-white text-sm text-slate-500 shadow-sm">
      Harita yükleniyor…
    </div>
  ),
});

const initialReports: Report[] = [];
const initialWorkOrders: WorkOrder[] = [];

export default function CitizenPage() {
  const [reports, setReports] = useState<Report[]>(initialReports);
  const [workOrders, setWorkOrders] = useState<WorkOrder[]>(initialWorkOrders);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [selectedLocation, setSelectedLocation] = useState<
    { locationLat: number; locationLng: number } | undefined
  >(undefined);

  const fetchData = useCallback(async () => {
    setLoading(true);
    setError(null);

    try {
      const [reportsRes, workOrdersRes] = await Promise.all([
        fetch("/api/reports"),
        fetch("/api/work-orders"),
      ]);

      if (!reportsRes.ok || !workOrdersRes.ok) {
        throw new Error("Veri alınırken bir hata oluştu.");
      }

      const reportsData: Report[] = await reportsRes.json();
      const workOrdersData: WorkOrder[] = await workOrdersRes.json();

      setReports(reportsData);
      setWorkOrders(workOrdersData);
    } catch (caught) {
      const nextError =
        caught instanceof Error
          ? caught.message
          : "Bilinmeyen bir hata oluştu.";
      setError(nextError);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  return (
    <main className="min-h-screen bg-slate-50">
      <header className="border-b bg-white px-6 py-5 shadow-sm">
        <div className="mx-auto flex max-w-7xl items-center justify-between gap-6">
          <div className="flex items-center gap-4">
            <div className="flex h-11 w-11 items-center justify-center rounded-2xl bg-blue-600 text-white shadow">
              <Sparkles className="h-5 w-5" />
            </div>
            <div>
              <p className="text-xs font-semibold uppercase tracking-[0.24em] text-slate-500">
                CitySync AI
              </p>
              <h1 className="text-2xl font-semibold text-slate-900">
                Vatandaş Portalı
              </h1>
            </div>
          </div>
          <div className="flex items-center gap-3 text-sm text-slate-600">
            <MapPin className="h-4 w-4 text-blue-600" />
            <span>Erzurum Belediyesi</span>
            <Link
              href="/dashboard"
              className="rounded-full border border-slate-200 bg-white px-4 py-2 text-slate-700 transition hover:border-blue-300 hover:bg-blue-50"
            >
              Admin Sayfası
            </Link>
          </div>
        </div>
      </header>

      <div className="mx-auto flex min-h-[calc(100vh-88px)] max-w-[1480px] flex-col gap-6 px-4 py-6 lg:flex-row lg:px-6">
        <section className="min-h-[60vh] flex-1 overflow-hidden rounded-[28px] bg-white p-4 shadow-sm lg:min-h-[calc(100vh-220px)]">
          <div className="mb-5 flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
            <div>
              <p className="text-sm font-medium text-slate-500">
                Şehir Haritası
              </p>
              <h2 className="text-xl font-semibold text-slate-900">
                Altyapı raporlarını ve iş emirlerini haritada görüntüleyin
              </h2>
            </div>
            <div className="rounded-2xl bg-slate-100 px-4 py-2 text-sm text-slate-700">
              {loading
                ? "Veri yükleniyor…"
                : `${reports.length} rapor, ${workOrders.length} iş emri`}
            </div>
          </div>

          {error ? (
            <div className="rounded-2xl border border-red-200 bg-red-50 p-4 text-sm text-red-700">
              {error}
            </div>
          ) : null}

          <div className="h-[60vh] sm:h-[65vh] lg:h-[calc(100vh-220px)]">
            <CityMap
              reports={reports}
              workOrders={workOrders}
              onLocationSelect={setSelectedLocation}
            />
          </div>
        </section>

        <aside className="w-full rounded-[28px] border border-slate-200 bg-white p-6 shadow-sm lg:w-[320px]">
          <div className="mb-6 space-y-3">
            <div className="flex items-center gap-3 text-slate-900">
              <ShieldCheck className="h-5 w-5 text-blue-600" />
              <h2 className="text-lg font-semibold">Sorun Bildir</h2>
            </div>
            <p className="text-sm text-slate-500">
              Şehrin herhangi bir yerine tıklayarak rapor konumunu seçebilir,
              ardından sorunu bildirebilirsiniz.
            </p>
          </div>

          <ReportForm
            selectedLocation={selectedLocation}
            onLocationChange={setSelectedLocation}
            onSubmit={fetchData}
          />
        </aside>
      </div>
    </main>
  );
}
