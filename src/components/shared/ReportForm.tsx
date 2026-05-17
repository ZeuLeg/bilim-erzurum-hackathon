"use client";

import { useEffect, useState } from "react";
import type { NewReport, ReportCategory } from "@/types";
import { CATEGORY_META } from "@/types";

interface ReportFormProps {
  selectedLocation?: { locationLat: number; locationLng: number };
  onSubmit: () => Promise<void>;
  onLocationChange: (location: {
    locationLat: number;
    locationLng: number;
  }) => void;
}

const CATEGORIES: ReportCategory[] = ['road', 'water', 'electricity', 'gas', 'other'];

const initialFormState: NewReport & { category: ReportCategory } = {
  title: "",
  description: "",
  category: "road",
  locationLat: 39.9055,
  locationLng: 41.2714,
};

export default function ReportForm({
  selectedLocation,
  onSubmit,
  onLocationChange,
}: ReportFormProps) {
  const [formData, setFormData] = useState(initialFormState);
  const [loading, setLoading] = useState(false);
  const [locating, setLocating] = useState(false);
  const [message, setMessage] = useState<string | null>(null);
  const [duplicateWarning, setDuplicateWarning] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (selectedLocation) {
      setFormData((current) => ({
        ...current,
        locationLat: selectedLocation.locationLat,
        locationLng: selectedLocation.locationLng,
      }));
    }
  }, [selectedLocation]);

  function updateLocation(locationLat: number, locationLng: number) {
    setFormData((current) => ({ ...current, locationLat, locationLng }));
    onLocationChange({ locationLat, locationLng });
  }

  function handleUseMyLocation() {
    if (!navigator.geolocation) {
      setError("Tarayıcınız konum servisini desteklemiyor.");
      return;
    }
    setLocating(true);
    setError(null);
    navigator.geolocation.getCurrentPosition(
      (position) => {
        updateLocation(position.coords.latitude, position.coords.longitude);
        setLocating(false);
      },
      () => {
        setError("Konum alınamadı. Lütfen izin verin veya haritadan seçin.");
        setLocating(false);
      },
      { enableHighAccuracy: true, timeout: 10000 },
    );
  }

  async function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setLoading(true);
    setError(null);
    setMessage(null);
    setDuplicateWarning(null);

    try {
      const response = await fetch("/api/reports", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(formData),
      });

      if (!response.ok) {
        const payload = await response.json().catch(() => null);
        throw new Error(payload?.error || "Rapor gönderilemedi.");
      }

      const result = await response.json();
      if (result.nearbyReport) {
        setDuplicateWarning(
          `Bu bölgede benzer bir rapor zaten mevcut: "${result.nearbyReport.title}" — yine de raporunuz kaydedildi.`,
        );
      }

      setFormData(initialFormState);
      setMessage("Rapor başarıyla gönderildi.");
      await onSubmit();
    } catch (caught) {
      setError(caught instanceof Error ? caught.message : "Bilinmeyen bir hata oluştu.");
    } finally {
      setLoading(false);
    }
  }

  const selectedMeta = CATEGORY_META[formData.category];

  return (
    <form onSubmit={handleSubmit} className="space-y-5">
      {/* Sorun türü */}
      <div>
        <label htmlFor="category" className="block text-sm font-medium text-slate-700">
          Sorun Türü
        </label>
        <select
          id="category"
          value={formData.category}
          onChange={(e) => setFormData({ ...formData, category: e.target.value as ReportCategory })}
          className="mt-2 block w-full rounded-2xl border border-slate-300 bg-white px-4 py-3 text-sm text-slate-900 shadow-sm focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-200"
        >
          {CATEGORIES.map((cat) => (
            <option key={cat} value={cat}>{CATEGORY_META[cat].label}</option>
          ))}
        </select>
        <p className="mt-1.5 text-xs text-slate-500">
          Yönlendirilecek birim:{" "}
          <span className="font-medium text-slate-700">{selectedMeta.department}</span>
        </p>
      </div>

      <div>
        <label htmlFor="title" className="block text-sm font-medium text-slate-700">
          Başlık
        </label>
        <input
          id="title"
          value={formData.title}
          onChange={(e) => setFormData({ ...formData, title: e.target.value })}
          className="mt-2 block w-full rounded-2xl border border-slate-300 bg-white px-4 py-3 text-sm text-slate-900 shadow-sm focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-200"
          placeholder="Örnek: Sokak ışığı yanmıyor"
          required
        />
      </div>

      <div>
        <label htmlFor="description" className="block text-sm font-medium text-slate-700">
          Açıklama
        </label>
        <textarea
          id="description"
          value={formData.description}
          onChange={(e) => setFormData({ ...formData, description: e.target.value })}
          className="mt-2 block h-28 w-full rounded-2xl border border-slate-300 bg-white px-4 py-3 text-sm text-slate-900 shadow-sm focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-200"
          placeholder="Kısa ve net bir şekilde sorunuzu anlatın"
          required
        />
      </div>

      <div className="grid grid-cols-2 gap-4">
        <div>
          <label htmlFor="locationLat" className="block text-sm font-medium text-slate-700">
            Enlem
          </label>
          <input
            id="locationLat"
            type="number"
            step="any"
            value={formData.locationLat}
            onChange={(e) => updateLocation(Number(e.target.value), formData.locationLng)}
            className="mt-2 block w-full rounded-2xl border border-slate-300 bg-white px-4 py-3 text-sm text-slate-900 shadow-sm focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-200"
            required
          />
        </div>
        <div>
          <label htmlFor="locationLng" className="block text-sm font-medium text-slate-700">
            Boylam
          </label>
          <input
            id="locationLng"
            type="number"
            step="any"
            value={formData.locationLng}
            onChange={(e) => updateLocation(formData.locationLat, Number(e.target.value))}
            className="mt-2 block w-full rounded-2xl border border-slate-300 bg-white px-4 py-3 text-sm text-slate-900 shadow-sm focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-200"
            required
          />
        </div>
      </div>

      <button
        type="button"
        onClick={handleUseMyLocation}
        disabled={locating}
        className="inline-flex w-full items-center justify-center gap-2 rounded-2xl border border-slate-300 bg-white px-4 py-2.5 text-sm font-medium text-slate-700 shadow-sm transition hover:border-blue-300 hover:bg-blue-50 disabled:cursor-not-allowed disabled:opacity-60"
      >
        {locating ? "Konum alınıyor…" : "📍 Konumumu Kullan"}
      </button>

      <p className="text-xs text-slate-500">
        Haritaya tıklayarak, pini sürükleyerek ya da konumunuzu kullanarak koordinatları belirleyebilirsiniz.
      </p>

      <div className="flex flex-col gap-3">
        <button
          type="submit"
          disabled={loading}
          className="inline-flex items-center justify-center rounded-2xl bg-blue-600 px-4 py-3 text-sm font-semibold text-white shadow-sm transition hover:bg-blue-700 disabled:cursor-not-allowed disabled:opacity-60"
        >
          {loading ? "Gönderiliyor..." : "Sorunu Bildir"}
        </button>
        {message && <p className="text-sm text-green-600">{message}</p>}
        {duplicateWarning && (
          <p className="rounded-xl bg-amber-50 px-3 py-2 text-sm text-amber-700">
            ⚠️ {duplicateWarning}
          </p>
        )}
        {error && <p className="text-sm text-red-600">{error}</p>}
      </div>
    </form>
  );
}
