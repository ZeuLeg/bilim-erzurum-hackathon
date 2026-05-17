"use client";

import { useEffect, useRef, useState } from "react";
import L from "leaflet";
import "leaflet/dist/leaflet.css";
import type { Report, WorkOrder, ConflictAlert } from "@/types";

interface CityMapProps {
  reports: Report[];
  workOrders: WorkOrder[];
  conflicts?: ConflictAlert[];
  selectedLocation?: { locationLat: number; locationLng: number };
  onLocationSelect?: (location: {
    locationLat: number;
    locationLng: number;
  }) => void;
}

const cityCenter = { lat: 39.9055, lng: 41.2714 };

/** Teardrop pin marking the location the citizen picked for their report. */
const selectedPinIcon = L.divIcon({
  className: "",
  html: `<svg width="32" height="40" viewBox="0 0 32 40" xmlns="http://www.w3.org/2000/svg">
    <path d="M16 0C7.2 0 0 7.2 0 16c0 11.2 16 24 16 24s16-12.8 16-24C32 7.2 24.8 0 16 0z" fill="#10b981" stroke="#ffffff" stroke-width="2.5"/>
    <circle cx="16" cy="16" r="6" fill="#ffffff"/>
  </svg>`,
  iconSize: [32, 40],
  iconAnchor: [16, 40],
  popupAnchor: [0, -36],
});

export default function CityMap({
  reports,
  workOrders,
  conflicts,
  selectedLocation,
  onLocationSelect,
}: CityMapProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const mapRef = useRef<L.Map | null>(null);
  const markersRef = useRef<L.CircleMarker[]>([]);
  const conflictLinesRef = useRef<L.Polyline[]>([]);
  const selectedPinRef = useRef<L.Marker | null>(null);
  const heatLayerRef = useRef<L.Circle[]>([]);
  const [showHeatmap, setShowHeatmap] = useState(false);

  useEffect(() => {
    if (!containerRef.current || mapRef.current) return;

    try {
      // Create map instance
      mapRef.current = L.map(containerRef.current).setView(
        [cityCenter.lat, cityCenter.lng],
        13,
      );

      // Add tile layer
      L.tileLayer("https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png", {
        attribution:
          '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors',
        maxZoom: 19,
      }).addTo(mapRef.current);

      // Handle map click for location selection
      mapRef.current.on("click", (event: L.LeafletMouseEvent) => {
        onLocationSelect?.({
          locationLat: event.latlng.lat,
          locationLng: event.latlng.lng,
        });
      });
    } catch (error) {
      console.error("Failed to initialize map:", error);
    }

    return () => {
      if (mapRef.current) {
        mapRef.current.remove();
        mapRef.current = null;
      }
    };
  }, [onLocationSelect]);

  useEffect(() => {
    if (!mapRef.current) return;

    // Clear existing markers
    markersRef.current.forEach((marker) => {
      mapRef.current?.removeLayer(marker);
    });
    markersRef.current = [];

    // Add report markers (red)
    reports.forEach((report) => {
      if (!mapRef.current) return;

      const marker = L.circleMarker([report.locationLat, report.locationLng], {
        radius: 10,
        fillColor: "#ef4444",
        color: "#ef4444",
        weight: 2,
        opacity: 1,
        fillOpacity: 0.7,
      }).addTo(mapRef.current);

      marker.bindPopup(
        `<div style="font-size: 14px; line-height: 1.5;"><strong>${report.title}</strong><br>Durum: ${report.status.replace("_", " ")}<br>${new Date(
          report.createdAt,
        ).toLocaleString("tr-TR")}</div>`,
      );

      marker.on("click", () => {
        onLocationSelect?.({
          locationLat: report.locationLat,
          locationLng: report.locationLng,
        });
      });

      markersRef.current.push(marker);
    });

    // Compute conflict ids set and add work order markers (blue or orange if conflicting)
    const conflictIds = new Set<number>();
    if (conflicts && Array.isArray(conflicts)) {
      conflicts.forEach((c) => {
        if (c?.workOrderA?.id) conflictIds.add(c.workOrderA.id);
        if (c?.workOrderB?.id) conflictIds.add(c.workOrderB.id);
      });
    }

    workOrders.forEach((workOrder) => {
      if (!mapRef.current) return;

      const isConflict = conflictIds.has(workOrder.id);
      const marker = L.circleMarker(
        [workOrder.locationLat, workOrder.locationLng],
        {
          radius: 10,
          fillColor: isConflict ? "#f97316" : "#3b82f6",
          color: isConflict ? "#ea580c" : "#3b82f6",
          weight: 2,
          opacity: 1,
          fillOpacity: 0.7,
        },
      ).addTo(mapRef.current);

      marker.bindPopup(
        `<div style="font-size: 14px; line-height: 1.5;"><strong>${workOrder.departmentName}</strong><br>Durum: ${workOrder.status.replace(
          "_",
          " ",
        )}<br>${new Date(workOrder.plannedStartDate).toLocaleDateString("tr-TR")} - ${new Date(
          workOrder.plannedEndDate,
        ).toLocaleDateString("tr-TR")}</div>`,
      );

      marker.on("click", () => {
        onLocationSelect?.({
          locationLat: workOrder.locationLat,
          locationLng: workOrder.locationLng,
        });
      });

      markersRef.current.push(marker);
    });
  }, [reports, workOrders, onLocationSelect, conflicts]);

  // Manage conflict polylines separately
  useEffect(() => {
    if (!mapRef.current) return;

    // Remove existing conflict lines
    conflictLinesRef.current.forEach((line) => {
      mapRef.current?.removeLayer(line);
    });
    conflictLinesRef.current = [];

    if (!conflicts || !Array.isArray(conflicts) || conflicts.length === 0)
      return;

    conflicts.forEach((c) => {
      const a = c.workOrderA;
      const b = c.workOrderB;
      if (!a || !b) return;

      const latlngs: L.LatLngExpression[] = [
        [a.locationLat, a.locationLng],
        [b.locationLat, b.locationLng],
      ];

      let options: L.PolylineOptions = {
        dashArray: "4,4",
        weight: 2,
        color: "#eab308",
      };

      if (c.severity === "high") {
        options = { dashArray: "8,6", weight: 3, color: "#ef4444" };
      } else if (c.severity === "medium") {
        options = { dashArray: "6,4", weight: 2, color: "#f97316" };
      }

      const line = L.polyline(latlngs, options).addTo(mapRef.current!);

      const popupHtml = `<div style="font-size:14px; line-height:1.4;"><strong>${a.departmentName} ↔ ${b.departmentName}</strong><br>${c.reason}<br>${c.distanceMeters}m mesafe, ${c.overlapDays} gün örtüşme</div>`;
      line.bindPopup(popupHtml);

      conflictLinesRef.current.push(line);
    });
  }, [conflicts]);

  // Show a draggable temporary pin at the location the citizen picked
  useEffect(() => {
    if (!mapRef.current) return;

    if (!selectedLocation) {
      if (selectedPinRef.current) {
        mapRef.current.removeLayer(selectedPinRef.current);
        selectedPinRef.current = null;
      }
      return;
    }

    const { locationLat, locationLng } = selectedLocation;

    if (selectedPinRef.current) {
      selectedPinRef.current.setLatLng([locationLat, locationLng]);
      return;
    }

    const marker = L.marker([locationLat, locationLng], {
      icon: selectedPinIcon,
      draggable: true,
      zIndexOffset: 1000,
    }).addTo(mapRef.current);

    marker.bindPopup(
      '<div style="font-size:14px;line-height:1.4;"><strong>Seçilen rapor konumu</strong><br>Pini sürükleyerek konumu ayarlayabilirsiniz.</div>',
    );

    marker.on("dragend", () => {
      const { lat, lng } = marker.getLatLng();
      onLocationSelect?.({ locationLat: lat, locationLng: lng });
    });

    selectedPinRef.current = marker;
  }, [selectedLocation, onLocationSelect]);

  // Render a soft density heatmap of citizen reports when toggled on
  useEffect(() => {
    if (!mapRef.current) return;

    heatLayerRef.current.forEach((circle) => {
      mapRef.current?.removeLayer(circle);
    });
    heatLayerRef.current = [];

    if (!showHeatmap) return;

    // Stacking translucent rings — overlapping reports read as hotter zones.
    const rings = [
      { radius: 340, fillOpacity: 0.1 },
      { radius: 210, fillOpacity: 0.12 },
      { radius: 95, fillOpacity: 0.16 },
    ];

    reports.forEach((report) => {
      rings.forEach((ring) => {
        const circle = L.circle([report.locationLat, report.locationLng], {
          radius: ring.radius,
          stroke: false,
          fillColor: "#ef4444",
          fillOpacity: ring.fillOpacity,
        }).addTo(mapRef.current!);
        circle.bringToBack();
        heatLayerRef.current.push(circle);
      });
    });
  }, [showHeatmap, reports]);

  return (
    <div className="relative h-full w-full overflow-hidden rounded-3xl border border-slate-200 shadow-sm">
      <button
        type="button"
        onClick={() => setShowHeatmap((value) => !value)}
        className={`absolute left-4 top-4 z-10 rounded-2xl border px-3 py-2 text-sm font-medium shadow-sm backdrop-blur-sm transition ${
          showHeatmap
            ? "border-rose-300 bg-rose-50 text-rose-700"
            : "border-slate-200 bg-white/90 text-slate-700 hover:bg-white"
        }`}
      >
        {showHeatmap ? "🔥 Isı Haritası: Açık" : "🗺️ Isı Haritası: Kapalı"}
      </button>
      <div className="absolute right-4 top-4 z-10 max-w-[240px] rounded-2xl border border-slate-200 bg-white/90 p-3 text-sm shadow-sm backdrop-blur-sm sm:max-w-[280px]">
        <p className="font-semibold text-slate-900">Harita Açıklaması</p>
        <div className="mt-3 space-y-2">
          <div className="flex items-center gap-2">
            <span className="h-3 w-3 rounded-full bg-red-500" />
            <span>İhbar</span>
          </div>
          <div className="flex items-center gap-2">
            <span className="h-3 w-3 rounded-full bg-blue-500" />
            <span>İş emri</span>
          </div>
          <div className="flex items-center gap-2">
            <span
              className="h-3 w-3 rounded-full"
              style={{ backgroundColor: "#f97316" }}
            />
            <span>Çakışan iş emri</span>
          </div>
          <div className="flex items-center gap-2">
            <span
              className="inline-block w-6"
              style={{ borderTop: "3px dashed #f97316", height: 0 }}
            />
            <span>Kırmızı/turuncu çizgi: Aktif çakışma</span>
          </div>
          <div className="flex items-center gap-2">
            <span
              className="h-3 w-3 rounded-full"
              style={{ backgroundColor: "#10b981" }}
            />
            <span>Seçilen rapor konumu</span>
          </div>
        </div>
      </div>
      <div className="h-full w-full" ref={containerRef} />
    </div>
  );
}
