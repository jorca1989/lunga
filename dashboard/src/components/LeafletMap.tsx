"use client";

import React, { useEffect, useRef } from "react";
import L from "leaflet";
import "leaflet/dist/leaflet.css";

interface Report {
  _id: string;
  title: string;
  description: string;
  category: string;
  location: string;
  latitude: number;
  longitude: number;
  status: string;
}

interface LeafletMapProps {
  reports: Report[];
  onSelectReport: (id: string) => void;
}

export default function LeafletMap({ reports, onSelectReport }: LeafletMapProps) {
  const mapRef = useRef<HTMLDivElement>(null);
  const mapInstance = useRef<L.Map | null>(null);
  const markersRef = useRef<L.Marker[]>([]);

  useEffect(() => {
    if (!mapRef.current || mapInstance.current) return;

    // Override default icon resolution for Next.js bundling to use CDN assets
    const DefaultIcon = L.icon({
      iconUrl: "https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon.png",
      shadowUrl: "https://unpkg.com/leaflet@1.9.4/dist/images/marker-shadow.png",
      iconSize: [25, 41],
      iconAnchor: [12, 41],
      popupAnchor: [1, -34],
      shadowSize: [41, 41]
    });
    L.Marker.prototype.options.icon = DefaultIcon;

    // Center map around Luanda/Cazenga area
    mapInstance.current = L.map(mapRef.current, {
      center: [-8.8159, 13.2922],
      zoom: 12,
    });

    // Dark-slate map tiles matching dashboard theme
    L.tileLayer("https://{s}.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}{r}.png", {
      attribution: '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors &copy; <a href="https://carto.com/attributions">CARTO</a>',
      maxZoom: 20,
    }).addTo(mapInstance.current);

    return () => {
      if (mapInstance.current) {
        mapInstance.current.remove();
        mapInstance.current = null;
      }
    };
  }, []);

  // Update map markers when reports list changes
  useEffect(() => {
    const map = mapInstance.current;
    if (!map) return;

    // Remove old markers
    markersRef.current.forEach((m) => m.remove());
    markersRef.current = [];

    // Plot markers
    reports.forEach((report) => {
      if (!report.latitude || !report.longitude) return;

      // Color coding pins based on status: Aberto (Red), Em Progresso (Amber), Resolvido (Emerald)
      const statusColor = 
        report.status === "Aberto" ? "#EF4444" : 
        report.status === "Em Progresso" ? "#F59E0B" : "#10B981";

      const customIcon = L.divIcon({
        className: "custom-leaflet-pin",
        html: `<div style="background-color: ${statusColor}; width: 14px; height: 14px; border-radius: 50%; border: 2px solid white; box-shadow: 0 0 6px rgba(0,0,0,0.55);"></div>`,
        iconSize: [14, 14],
        iconAnchor: [7, 7]
      });

      const marker = L.marker([report.latitude, report.longitude], { icon: customIcon })
        .addTo(map)
        .bindPopup(`
          <div style="color: black; font-family: system-ui, sans-serif; font-size: 12px; max-width: 200px; padding: 2px;">
            <strong style="color: ${statusColor}; font-size: 13px;">${report.category}</strong><br/>
            <strong style="display: block; margin-top: 4px;">${report.title}</strong>
            <p style="margin: 4px 0 0 0; color: #666; line-height: 1.3;">${report.location}</p>
            <span style="display: inline-block; margin-top: 6px; font-size: 10px; font-weight: bold; background: ${statusColor}1A; color: ${statusColor}; padding: 2px 6px; border-radius: 4px;">
              ${report.status}
            </span>
          </div>
        `);

      marker.on("click", () => {
        onSelectReport(report._id);
      });

      markersRef.current.push(marker);
    });
  }, [reports, onSelectReport]);

  return <div ref={mapRef} style={{ width: "100%", height: "100%" }} />;
}
