"use client";

import { useMemo, useState } from "react";
import type { Report, ReportStatus, ReportCategory } from "@/types";
import { CATEGORY_META } from "@/types";

const statusMeta: Record<ReportStatus, { label: string; badge: string }> = {
  pending:     { label: "Bekliyor", badge: "bg-amber-50 text-amber-700 ring-amber-100" },
  in_progress: { label: "İşlemde", badge: "bg-blue-50 text-blue-700 ring-blue-100" },
  resolved:    { label: "Çözüldü", badge: "bg-emerald-50 text-emerald-700 ring-emerald-100" },
};

type Filter = ReportStatus | "all";

const filterOrder: Filter[] = ["all", "pending", "in_progress", "resolved"];
const filterLabels: Record<Filter, string> = {
  all: "Tümü",
  pending: "Bekliyor",
  in_progress: "İşlemde",
  resolved: "Çözüldü",
};

function formatDate(value: Date | string) {
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return "—";
  return date.toLocaleDateString("tr-TR", {
    day: "2-digit",
    month: "short",
    year: "numeric",
  });
}

interface ReportListProps {
  reports: Report[];
  /** Optional: called when a report is clicked, e.g. to focus it on the map. */
  onSelect?: (report: Report) => void;
}

export default function ReportList({ reports, onSelect }: ReportListProps) {
  const [filter, setFilter] = useState<Filter>("all");

  const counts = useMemo(() => {
    const next: Record<Filter, number> = {
      all: reports.length,
      pending: 0,
      in_progress: 0,
      resolved: 0,
    };
    reports.forEach((report) => {
      next[report.status] += 1;
    });
    return next;
  }, [reports]);

  const visible = useMemo(() => {
    const filtered =
      filter === "all" ? reports : reports.filter((report) => report.status === filter);
    return [...filtered].sort(
      (a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime(),
    );
  }, [reports, filter]);

  return (
    <section className="rounded-[28px] border border-slate-200 bg-white p-6 shadow-sm">
      <div className="flex flex-col gap-1">
        <h2 className="text-xl font-semibold text-slate-900">Bildirilen Sorunlar</h2>
        <p className="text-sm text-slate-500">
          Şehir genelinde bildirilen altyapı sorunları, güncel durumları ve yönlendirilen birimler.
        </p>
      </div>

      <div className="mt-5 flex flex-wrap gap-2">
        {filterOrder.map((option) => (
          <button
            key={option}
            type="button"
            onClick={() => setFilter(option)}
            className={`inline-flex items-center gap-2 rounded-full px-4 py-1.5 text-sm font-medium transition ${
              filter === option
                ? "bg-slate-900 text-white"
                : "bg-slate-100 text-slate-600 hover:bg-slate-200"
            }`}
          >
            {filterLabels[option]}
            <span
              className={`rounded-full px-1.5 text-xs ${
                filter === option ? "bg-white/20" : "bg-white text-slate-500"
              }`}
            >
              {counts[option]}
            </span>
          </button>
        ))}
      </div>

      <div className="mt-5 grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
        {visible.length === 0 ? (
          <div className="col-span-full rounded-2xl border border-dashed border-slate-300 bg-slate-50 p-6 text-center text-sm text-slate-500">
            Bu filtrede gösterilecek rapor yok.
          </div>
        ) : (
          visible.map((report) => {
            const meta = statusMeta[report.status];
            const catMeta = CATEGORY_META[(report.category as ReportCategory) ?? "other"];
            const interactive = typeof onSelect === "function";
            return (
              <article
                key={report.id}
                onClick={interactive ? () => onSelect?.(report) : undefined}
                className={`rounded-2xl border border-slate-200 bg-slate-50 p-4 transition ${
                  interactive ? "cursor-pointer hover:border-blue-300 hover:bg-blue-50" : ""
                }`}
              >
                <div className="flex items-start justify-between gap-3">
                  <p className="text-sm font-semibold text-slate-900">{report.title}</p>
                  <span className={`inline-flex shrink-0 items-center rounded-full px-2.5 py-1 text-xs font-semibold ring-1 ${meta.badge}`}>
                    {meta.label}
                  </span>
                </div>
                <p className="mt-1.5 text-sm text-slate-600 line-clamp-2">{report.description}</p>
                <div className="mt-3 flex flex-wrap items-center gap-2">
                  <span className={`inline-flex items-center rounded-full px-2 py-0.5 text-xs font-medium ${catMeta.color}`}>
                    {catMeta.label}
                  </span>
                  <span className="text-xs text-slate-400">→ {catMeta.department}</span>
                </div>
                <div className="mt-2 flex flex-wrap items-center gap-x-4 gap-y-1 text-xs text-slate-400">
                  <span>{formatDate(report.createdAt)}</span>
                  <span>{report.locationLat.toFixed(4)}, {report.locationLng.toFixed(4)}</span>
                </div>
              </article>
            );
          })
        )}
      </div>
    </section>
  );
}
