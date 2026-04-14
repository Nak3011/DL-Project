"use client";

import { useEffect, useState } from "react";
import { MapContainer, TileLayer, Polygon, useMap } from "react-leaflet";
import type { PredictionResponse } from "@/lib/api";
import {
  confidenceColor,
  generateZonePolygon,
  generateAqiPolygon,
} from "@/lib/utils";
import "leaflet/dist/leaflet.css";

interface MapViewProps {
  data: PredictionResponse;
  fullscreen?: boolean;
}

/** Fly to prediction point at zoom 14 after mount. */
function RecenterMap({ lat, lng }: { lat: number; lng: number }) {
  const map = useMap();
  useEffect(() => {
    map.flyTo([lat, lng], 14, { duration: 2.0, easeLinearity: 0.2 });
  }, [lat, lng, map]);
  return null;
}

/**
 * Full-screen map view.
 *
 * Tile layers:
 *  1. ESRI World Topo Map — painterly illustrated topographic base
 *  2. OSM label overlay   — readable place-names at 30% opacity
 *
 * A warm saturate + hue-rotate CSS filter (applied via .leaflet-tile-pane
 * in globals.css) gives the map a vivid, hand-painted appearance.
 *
 * Zone shapes:
 *  • Inner zone  — irregular 8-sided polygon ≈ 1 ha, pulsing animation
 *  • Outer halo  — 12-sided irregular AQI ring, slow fade animation
 */
export default function MapView({ data }: MapViewProps) {
  const [mounted, setMounted] = useState(false);
  useEffect(() => setMounted(true), []);

  if (!mounted) {
    return (
      <div
        className="w-full h-full flex items-center justify-center"
        style={{ background: "#0d1117", color: "rgba(255,255,255,0.3)", fontSize: 14 }}
      >
        <span className="loading loading-spinner loading-md mr-2" />
        Loading map…
      </div>
    );
  }

  const color      = confidenceColor(data.confidence);
  const innerZone  = generateZonePolygon(data.latitude, data.longitude, 10_000, 8, 0.28);
  const outerHalo  = generateAqiPolygon(data.latitude, data.longitude, data.confidence);

  return (
    <MapContainer
      center={[20, 0]}
      zoom={2}
      zoomControl={false}
      scrollWheelZoom
      className="w-full h-full"
      style={{ background: "#0d1117" }}
    >
      {/* ── Base: ESRI World Topo Map ─────────────────────────────── */}
      {/* Topographic illustrated style — painting-like at all zoom levels */}
      <TileLayer
        url="https://server.arcgisonline.com/ArcGIS/rest/services/World_Topo_Map/MapServer/tile/{z}/{y}/{x}"
        attribution="Tiles &copy; Esri &mdash; Esri, DeLorme, NAVTEQ, TomTom, Intermap, iPC, USGS, FAO, NPS, NRCAN, GeoBase, Kadaster NL, Ordnance Survey, Esri Japan, METI, Esri China (Hong Kong), and the GIS User Community"
        maxZoom={19}
        maxNativeZoom={17}
      />

      {/* ── Label overlay: OpenStreetMap (roads, names) ───────────── */}
      <TileLayer
        url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
        attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>'
        opacity={0.3}
        maxZoom={19}
      />

      <RecenterMap lat={data.latitude} lng={data.longitude} />

      {/* ── Outer AQI halo: 12-sided, large, slowly pulsing ─────── */}
      <Polygon
        positions={outerHalo}
        className="aqi-halo"
        pathOptions={{
          color,
          fillColor: color,
          fillOpacity: 0.07,
          weight: 1.5,
          dashArray: "7 5",
          opacity: 0.45,
        }}
      />

      {/* ── Inner wildfire zone: 8-sided, 1 ha, pulsing ─────────── */}
      <Polygon
        positions={innerZone}
        className="wf-zone"
        pathOptions={{
          color,
          fillColor: color,
          fillOpacity: 0.32,
          weight: 2.5,
          opacity: 0.9,
          lineCap: "round",
          lineJoin: "round",
        }}
      />
    </MapContainer>
  );
}
