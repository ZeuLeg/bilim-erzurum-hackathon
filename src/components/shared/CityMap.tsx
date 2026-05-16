"use client";

import { useEffect, useRef } from "react";
import L from "leaflet";
import type { Report, WorkOrder } from "@/types";

interface CityMapProps {
  reports: Report[];
  workOrders: WorkOrder[];
  onLocationSelect?: (location: {
    locationLat: number;
    locationLng: number;
  }) => void;
}

const cityCenter = { lat: 39.9055, lng: 41.2714 };

export default function CityMap({
  reports,
  workOrders,
  onLocationSelect,
}: CityMapProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const mapRef = useRef<L.Map | null>(null);
  const markersRef = useRef<L.CircleMarker[]>([]);

  useEffect(() => {
    import("leaflet/dist/leaflet.css");
  }, []);

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
      if (mapRef.current) {
        const marker = L.circleMarker(
          [report.locationLat, report.locationLng],
          {
            radius: 10,
            fillColor: "#ef4444",
            color: "#ef4444",
            weight: 2,
            opacity: 1,
            fillOpacity: 0.7,
          },
        ).addTo(mapRef.current);

        marker.bindPopup(
          `<div style="font-size: 14px; line-height: 1.5;">
            <strong>${report.title}</strong><br>
            Durum: ${report.status.replace("_", " ")}<br>
            ${new Date(report.createdAt).toLocaleString("tr-TR")}
          </div>`,
        );

        markersRef.current.push(marker);
      }
    });

    // Add work order markers (blue)
    workOrders.forEach((workOrder) => {
      if (mapRef.current) {
        const marker = L.circleMarker(
          [workOrder.locationLat, workOrder.locationLng],
          {
            radius: 10,
            fillColor: "#3b82f6",
            color: "#3b82f6",
            weight: 2,
            opacity: 1,
            fillOpacity: 0.7,
          },
        ).addTo(mapRef.current);

        marker.bindPopup(
          `<div style="font-size: 14px; line-height: 1.5;">
            <strong>${workOrder.departmentName}</strong><br>
            Durum: ${workOrder.status.replace("_", " ")}<br>
            ${new Date(workOrder.plannedStartDate).toLocaleDateString("tr-TR")} - ${new Date(workOrder.plannedEndDate).toLocaleDateString("tr-TR")}
          </div>`,
        );

        markersRef.current.push(marker);
      }
    });
  }, [reports, workOrders]);

  return (
    <div
      className="h-full w-full overflow-hidden rounded-3xl border border-slate-200 shadow-sm"
      ref={containerRef}
    />
  );
}
