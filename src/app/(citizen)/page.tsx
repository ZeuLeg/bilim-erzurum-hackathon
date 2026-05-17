"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { Sparkles, MapPin, Shield, Leaf, ArrowRight, Zap } from "lucide-react";

type TotalImpact = {
  wastedBudgetTRY: number;
  co2KgSaved: number;
  roadMetersSaved: number;
};

export default function LandingPage() {
  const [impact, setImpact] = useState<TotalImpact | null>(null);

  useEffect(() => {
    fetch("/api/conflicts")
      .then((r) => r.ok ? r.json() : null)
      .then((data) => { if (data?.totalImpact) setImpact(data.totalImpact); })
      .catch(() => {});
  }, []);

  return (
    <main className="min-h-screen bg-white">
      {/* Nav */}
      <nav className="border-b border-slate-100 bg-white/80 px-6 py-4 backdrop-blur-sm sticky top-0 z-10">
        <div className="mx-auto flex max-w-6xl items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-blue-600 text-white">
              <Sparkles className="h-4 w-4" />
            </div>
            <span className="text-lg font-semibold text-slate-900">KentSenkron AI</span>
          </div>
          <div className="flex items-center gap-3">
            <Link
              href="/report"
              className="rounded-full px-4 py-2 text-sm font-medium text-slate-600 transition hover:bg-slate-100"
            >
              Sorun Bildir
            </Link>
            <Link
              href="/dashboard"
              className="rounded-full bg-slate-900 px-4 py-2 text-sm font-medium text-white transition hover:bg-slate-700"
            >
              Admin Paneli
            </Link>
          </div>
        </div>
      </nav>

      {/* Hero */}
      <section className="px-6 pb-20 pt-24 text-center">
        <div className="mx-auto max-w-3xl">
          <span className="inline-flex items-center gap-2 rounded-full border border-blue-100 bg-blue-50 px-4 py-1.5 text-xs font-semibold text-blue-700">
            <Zap className="h-3 w-3" />
            Gemini 2.5 Flash ile güçlendirildi
          </span>
          <h1 className="mt-6 text-5xl font-bold tracking-tight text-slate-900 lg:text-6xl">
            Önce koordinasyon,<br />
            <span className="text-blue-600">sonra kazı.</span>
          </h1>
          <p className="mx-auto mt-6 max-w-xl text-lg text-slate-500">
            KentSenkron AI, aynı caddeyi iki kez kazmayı önler. Yapay zeka destekli
            belediye koordinasyonu ile milyonlarca liralık kaynak israfını ve
            binlerce kilogram karbon emisyonunu engelleyin.
          </p>
          <div className="mt-10 flex flex-col items-center justify-center gap-4 sm:flex-row">
            <Link
              href="/report"
              className="inline-flex items-center gap-2 rounded-full bg-blue-600 px-6 py-3 text-sm font-semibold text-white shadow-sm transition hover:bg-blue-500"
            >
              Sorun Bildir
              <ArrowRight className="h-4 w-4" />
            </Link>
            <Link
              href="/dashboard"
              className="inline-flex items-center gap-2 rounded-full border border-slate-200 bg-white px-6 py-3 text-sm font-semibold text-slate-700 shadow-sm transition hover:bg-slate-50"
            >
              Admin Paneline Git
            </Link>
          </div>
        </div>
      </section>

      {/* Live impact banner */}
      {impact && (
        <section className="border-y border-emerald-100 bg-gradient-to-r from-emerald-50 to-sky-50 px-6 py-12">
          <div className="mx-auto max-w-4xl text-center">
            <p className="text-sm font-semibold uppercase tracking-widest text-emerald-700">
              Bu sezon AI tarafından önlenen israf
            </p>
            <div className="mt-8 grid grid-cols-1 gap-8 sm:grid-cols-3">
              <div>
                <p className="text-4xl font-bold text-slate-900">
                  ₺{impact.wastedBudgetTRY.toLocaleString("tr-TR")}
                </p>
                <p className="mt-2 text-sm text-slate-500">önlenebilir bütçe kaybı</p>
              </div>
              <div>
                <p className="text-4xl font-bold text-slate-900">
                  {impact.co2KgSaved.toLocaleString("tr-TR")} kg
                </p>
                <p className="mt-2 text-sm text-slate-500">CO₂ azaltma</p>
              </div>
              <div>
                <p className="text-4xl font-bold text-slate-900">
                  {impact.roadMetersSaved.toLocaleString("tr-TR")} m
                </p>
                <p className="mt-2 text-sm text-slate-500">kurtarılan yol</p>
              </div>
            </div>
          </div>
        </section>
      )}

      {/* Features */}
      <section className="px-6 py-20">
        <div className="mx-auto max-w-5xl">
          <h2 className="text-center text-3xl font-bold text-slate-900">
            Nasıl çalışır?
          </h2>
          <div className="mt-12 grid gap-8 lg:grid-cols-3">
            <div className="rounded-3xl border border-slate-200 bg-slate-50 p-8">
              <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-blue-100 text-blue-600">
                <Zap className="h-6 w-6" />
              </div>
              <h3 className="mt-6 text-lg font-semibold text-slate-900">
                Yapay Zeka Çakışma Tespiti
              </h3>
              <p className="mt-3 text-sm leading-relaxed text-slate-500">
                Gemini destekli motor, planlanmış tüm iş emirlerini anlık olarak
                tarar. 300 metre yakınlık ve tarih örtüşmesini saniyeler içinde
                tespit eder.
              </p>
            </div>
            <div className="rounded-3xl border border-slate-200 bg-slate-50 p-8">
              <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-emerald-100 text-emerald-600">
                <Leaf className="h-6 w-6" />
              </div>
              <h3 className="mt-6 text-lg font-semibold text-slate-900">
                Ölçülebilir Sürdürülebilirlik
              </h3>
              <p className="mt-3 text-sm leading-relaxed text-slate-500">
                Her önlenen çakışma ortalama 1.600.000 TL tasarruf ve 25.000 kg
                CO₂ azaltması sağlar. Etki gerçek zamanlı olarak raporlanır.
              </p>
            </div>
            <div className="rounded-3xl border border-slate-200 bg-slate-50 p-8">
              <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-violet-100 text-violet-600">
                <Shield className="h-6 w-6" />
              </div>
              <h3 className="mt-6 text-lg font-semibold text-slate-900">
                Vatandaş Katılımı
              </h3>
              <p className="mt-3 text-sm leading-relaxed text-slate-500">
                Harita üzerinden sorun bildirin. Raporunuz doğrudan ilgili
                müdürlüğe yönlendirilir ve altyapı planlamasını şekillendirir.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* CTA */}
      <section className="bg-slate-900 px-6 py-20 text-center">
        <div className="mx-auto max-w-2xl">
          <h2 className="text-3xl font-bold text-white">
            Şehrini daha iyi hale getir
          </h2>
          <p className="mt-4 text-slate-400">
            Bölgendeki altyapı sorunlarını haritaya ekle. Her rapor, bir sonraki
            israfı önlemeye katkıda bulunur.
          </p>
          <Link
            href="/report"
            className="mt-8 inline-flex items-center gap-2 rounded-full bg-blue-500 px-8 py-3 text-sm font-semibold text-white transition hover:bg-blue-400"
          >
            <MapPin className="h-4 w-4" />
            Sorun Bildir
          </Link>
        </div>
      </section>

      {/* Footer */}
      <footer className="border-t border-slate-100 px-6 py-8 text-center text-xs text-slate-400">
        2026 Kamuda Dijital Dönüşüm ve Yapay Zeka Hackathonu &middot; Bilim Erzurum
        &middot; <span className="text-blue-500">Team Zetora</span>
      </footer>
    </main>
  );
}
