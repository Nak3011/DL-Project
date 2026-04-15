"use client";

import { useEffect, useState } from "react";
import { MapContainer, TileLayer, useMap } from "react-leaflet";
import type { LatLngExpression } from "leaflet";
import type { PredictionResponse } from "@/lib/api";
import {
  generateZonePolygon,
  toPolarVertices,
  smoothClosedCurve,
  destPoint,
  fireZoneStyle,
  aqiHaloStyle,
} from "@/lib/utils";
import "leaflet/dist/leaflet.css";

// ─────────────────────────────────────────────────────────────────────────────
//  AnimatedFireZones
//
//  Uses the direct Leaflet API + requestAnimationFrame — zero React re-renders.
//
//  Geographic-correct morphing:
//    Each vertex is stored in POLAR coordinates (bearing + distance in metres)
//    relative to the fire centre. The animation only scales the DISTANCE, which
//    preserves geographic proportions at every zoom level.
//
//  Smooth curves:
//    12 control points → Catmull-Rom spline → 12 × 8 = 96 smooth points.
//    Still looks like a smooth organic blob, not a polygon.
// ─────────────────────────────────────────────────────────────────────────────
function AnimatedFireZones({ data }: { data: PredictionResponse }) {
  const map = useMap();

  useEffect(() => {
    let frame: number;

    // Dynamic import avoids SSR issues with Leaflet
    const init = async () => {
      const L = (await import("leaflet")).default;

      const { latitude: lat, longitude: lng, confidence } = data;
      const isWf   = data.predicted_class === 1;
      const fStyle = fireZoneStyle(confidence, isWf);
      const aStyle = aqiHaloStyle(confidence, isWf);

      // ── Generate base CONTROL POINTS (seeded → deterministic) ────────────
      // Fire zone: 12 control points, 5 ha base area × size multiplier
      const baseAreaM2  = 50_000 * fStyle.sizeMultiplier;
      const fireSides   = 12;
      const fireCtrl    = generateZonePolygon(lat, lng, baseAreaM2, fireSides, 0.35);

      // AQI halo: 16 control points, radius = fire radius × radiusMultiplier
      const aqiAreaM2   = baseAreaM2 * fStyle.sizeMultiplier
                          * aStyle.radiusMultiplier
                          * aStyle.radiusMultiplier;
      const aqiSides    = 16;
      const aqiCtrl     = generateZonePolygon(lat, lng, aqiAreaM2, aqiSides, 0.20);

      // ── Convert to POLAR for geographic-correct morphing ─────────────────
      const firePolar = toPolarVertices(lat, lng, fireCtrl);
      const aqiPolar  = toPolarVertices(lat, lng, aqiCtrl);

      // ── Create Leaflet polygons with smooth initial shapes ───────────────
      const initialFireSmooth = smoothClosedCurve(fireCtrl, 8) as LatLngExpression[];
      const initialAqiSmooth  = smoothClosedCurve(aqiCtrl,  8) as LatLngExpression[];

      const firePoly = L.polygon(initialFireSmooth, {
        color:       fStyle.strokeColor,
        fillColor:   fStyle.fillColor,
        fillOpacity: fStyle.fillOpacity,
        weight:      fStyle.weight,
        opacity:     0.92,
        lineCap:     "round",
        lineJoin:    "round",
        // smoothFactor=0 prevents Leaflet from simplifying our spline points
        smoothFactor: 0,
      }).addTo(map);

      const aqiPoly = L.polygon(initialAqiSmooth, {
        color:        aStyle.strokeColor,
        fillColor:    aStyle.fillColor,
        fillOpacity:  aStyle.fillOpacity,
        weight:       1.5,
        opacity:      0.65,
        dashArray:    "6 5",
        lineCap:      "round",
        lineJoin:     "round",
        smoothFactor: 0,
      }).addTo(map);

      // ── requestAnimationFrame animation loop ─────────────────────────────
      const animate = () => {
        const t = Date.now() / 1000;

        // Fire zone: each vertex oscillates independently via two sine waves.
        // Factor applied to METRE DISTANCE (geographically correct).
        const morphedFire: [number, number][] = firePolar.map(({ bearing, distM }, i) => {
          const phase  = i * 0.65;
          const factor =
            1 +
            Math.sin(t * 1.1  + phase)       * 0.13 +
            Math.sin(t * 0.62 + phase * 1.4) * 0.07;
          return destPoint(lat, lng, bearing, distM * factor);
        });

        // AQI halo: slower, calmer drift
        const morphedAqi: [number, number][] = aqiPolar.map(({ bearing, distM }, i) => {
          const phase  = i * 0.80;
          const factor =
            1 +
            Math.sin(t * 0.55 + phase) * 0.06 +
            Math.sin(t * 0.32 + phase * 1.6) * 0.04;
          return destPoint(lat, lng, bearing, distM * factor);
        });

        // Apply Catmull-Rom spline → smooth curved boundary
        firePoly.setLatLngs(smoothClosedCurve(morphedFire, 8) as LatLngExpression[]);
        aqiPoly.setLatLngs(smoothClosedCurve(morphedAqi,   8) as LatLngExpression[]);

        frame = requestAnimationFrame(animate);
      };

      frame = requestAnimationFrame(animate);
    };

    init();

    return () => {
      cancelAnimationFrame(frame);
    };
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [map, data.latitude, data.longitude, data.confidence, data.predicted_class]);

  return null;
}

// ─────────────────────────────────────────────────────────────────────────────
//  Fly-to component
// ─────────────────────────────────────────────────────────────────────────────
function RecenterMap({ lat, lng }: { lat: number; lng: number }) {
  const map = useMap();
  useEffect(() => {
    // Zoom 13 — entire 5ha zone visible, enough terrain context
    map.flyTo([lat, lng], 13, { duration: 2.2, easeLinearity: 0.2 });
  }, [lat, lng, map]);
  return null;
}

// ─────────────────────────────────────────────────────────────────────────────
//  MapView — full-screen tile map + animated fire zone
// ─────────────────────────────────────────────────────────────────────────────
export default function MapView({ data }: { data: PredictionResponse }) {
  const [mounted, setMounted] = useState(false);
  useEffect(() => setMounted(true), []);

  if (!mounted) {
    return (
      <div
        className="w-full h-full flex items-center justify-center"
        style={{ background: "#0b0f14", color: "rgba(255,255,255,0.3)", fontSize: 14 }}
      >
        <span className="loading loading-spinner loading-md mr-2" />
        Loading map…
      </div>
    );
  }

  return (
    <MapContainer
      center={[20, 0]}
      zoom={2}
      zoomControl
      scrollWheelZoom
      className="w-full h-full"
      style={{ background: "#0b0f14" }}
    >
      {/* ── ESRI World Imagery — true satellite tiles ──────────────── */}
      <TileLayer
        url="https://server.arcgisonline.com/ArcGIS/rest/services/World_Imagery/MapServer/tile/{z}/{y}/{x}"
        attribution="Tiles &copy; Esri"
        maxZoom={19}
        maxNativeZoom={17}
      />

      {/* ── ESRI Reference overlay: labels + boundaries ────────────── */}
      <TileLayer
        url="https://server.arcgisonline.com/ArcGIS/rest/services/Reference/World_Boundaries_and_Places/MapServer/tile/{z}/{y}/{x}"
        attribution=""
        opacity={0.55}
        maxZoom={19}
      />

      <RecenterMap lat={data.latitude} lng={data.longitude} />

      {/* 60fps morphing fire zone + AQI halo */}
      <AnimatedFireZones data={data} />
    </MapContainer>
  );
}
