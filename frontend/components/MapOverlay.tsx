"use client";

import { motion } from "framer-motion";
import type { PredictionResponse } from "@/lib/api";
import { confidenceColor, formatCoord, riskLabel } from "@/lib/utils";
import { Flame, Wind, MapPin } from "lucide-react";

interface MapOverlayProps {
  data: PredictionResponse;
}

/**
 * Overlay panels positioned on the map.
 *
 * Layout:
 *  LEFT COLUMN  (top-16, left-5) → Wildfire Risk card stacked above AQI card
 *  BOTTOM-CENTRE                 → Coordinate pill
 *  BOTTOM-RIGHT                  → Legend
 *
 * Cards use macOS-style background: black + 20 % backdrop blur.
 */
export default function MapOverlay({ data }: MapOverlayProps) {
  const color = confidenceColor(data.confidence);
  const pct   = Math.round(data.confidence * 100);
  const isWf  = data.predicted_class === 1;
  const label = riskLabel(data.confidence);

  const aqiColor =
    data.aqi <= 50  ? "#22c55e" :
    data.aqi <= 100 ? "#84cc16" :
    data.aqi <= 150 ? "#eab308" :
    data.aqi <= 200 ? "#f97316" :
    data.aqi <= 300 ? "#ef4444" :
                      "#7c3aed";

  return (
    <>
      {/* ══════════════════════════════════════════════════════════
          LEFT COLUMN — Wildfire Risk + AQI stacked
         ══════════════════════════════════════════════════════════ */}
      <motion.div
        initial={{ opacity: 0, x: -24 }}
        animate={{ opacity: 1, x: 0 }}
        transition={{ duration: 0.65, delay: 0.2, ease: [0.16, 1, 0.3, 1] }}
        className="absolute top-16 left-5 z-[1000] flex flex-col gap-3"
      >
        {/* ── Wildfire Risk Card ─────────────────────────────────── */}
        <div className="macos-card rounded-2xl w-52 overflow-hidden">
          <div className="p-4 flex flex-col gap-3">

            {/* Header */}
            <div className="flex items-center gap-2">
              <div
                className="p-1.5 rounded-lg"
                style={{ background: `${color}22`, border: `1px solid ${color}35` }}
              >
                <Flame size={13} style={{ color }} />
              </div>
              <span className="text-[10px] font-bold tracking-widest uppercase text-white/40">
                Wildfire Risk
              </span>
            </div>

            {/* Confidence number */}
            <div className="flex items-baseline gap-0.5">
              <span
                className="text-5xl font-black tabular-nums leading-none"
                style={{ color }}
              >
                {pct}
              </span>
              <span className="text-xl font-bold mb-0.5" style={{ color: `${color}80` }}>%</span>
            </div>

            {/* Label */}
            <div
              className="text-[11px] font-semibold"
              style={{ color }}
            >
              {label}
            </div>

            {/* Animated confidence bar */}
            <div className="w-full h-1.5 rounded-full overflow-hidden bg-white/10">
              <motion.div
                initial={{ width: 0 }}
                animate={{ width: `${pct}%` }}
                transition={{ duration: 1.3, delay: 0.6, ease: "easeOut" }}
                className="h-full rounded-full"
                style={{
                  background: `linear-gradient(90deg, ${color}60, ${color})`,
                  boxShadow: `0 0 8px ${color}70`,
                }}
              />
            </div>

            {/* Detection status chip */}
            <div
              className="text-[11px] font-semibold text-center rounded-lg py-1.5"
              style={{
                background: isWf ? "rgba(239,68,68,0.18)" : "rgba(34,197,94,0.15)",
                color:      isWf ? "#f87171" : "#4ade80",
                border:     `1px solid ${isWf ? "rgba(239,68,68,0.28)" : "rgba(34,197,94,0.25)"}`,
              }}
            >
              {isWf ? "Wildfire Detected" : "No Wildfire"}
            </div>

          </div>
        </div>

        {/* ── AQI Card ───────────────────────────────────────────── */}
        <div className="macos-card rounded-2xl w-52 overflow-hidden">
          <div className="p-4 flex flex-col gap-3">

            {/* Header */}
            <div className="flex items-center gap-2">
              <div
                className="p-1.5 rounded-lg"
                style={{ background: `${aqiColor}20`, border: `1px solid ${aqiColor}35` }}
              >
                <Wind size={13} style={{ color: aqiColor }} />
              </div>
              <span className="text-[10px] font-bold tracking-widest uppercase text-white/40">
                Est. AQI
              </span>
            </div>

            {/* AQI number */}
            <div className="flex items-baseline gap-1">
              <span
                className="text-5xl font-black tabular-nums leading-none"
                style={{ color: aqiColor }}
              >
                {data.aqi}
              </span>
            </div>

            {/* Colour-coded gauge */}
            <div className="w-full h-1.5 rounded-full overflow-hidden bg-white/10">
              <motion.div
                initial={{ width: 0 }}
                animate={{ width: `${Math.min((data.aqi / 500) * 100, 100)}%` }}
                transition={{ duration: 1.3, delay: 0.7, ease: "easeOut" }}
                className="h-full rounded-full"
                style={{
                  background: `linear-gradient(90deg, #22c55e, #eab308, #f97316, ${aqiColor})`,
                }}
              />
            </div>

            {/* Status chip */}
            <div
              className="text-[11px] font-semibold text-center rounded-lg py-1.5"
              style={{
                background: `${aqiColor}18`,
                color: aqiColor,
                border: `1px solid ${aqiColor}30`,
              }}
            >
              {data.aqi_status}
            </div>

          </div>
        </div>
      </motion.div>

      {/* ── Coordinates — bottom centre ───────────────────────────── */}
      <motion.div
        initial={{ opacity: 0, y: 14 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.55, delay: 0.4, ease: [0.16, 1, 0.3, 1] }}
        className="absolute bottom-6 left-1/2 -translate-x-1/2 z-[1000]"
      >
        <div className="macos-card rounded-xl">
          <div className="px-5 py-2.5 flex items-center gap-2">
            <MapPin size={12} className="text-white/35" />
            <span className="font-mono text-xs text-white/55 tracking-wide">
              {formatCoord(data.latitude, data.longitude)}
            </span>
          </div>
        </div>
      </motion.div>

      {/* ── Legend — bottom right ──────────────────────────────────── */}
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ duration: 0.5, delay: 0.55 }}
        className="absolute bottom-6 right-5 z-[1000]"
      >
        <div className="macos-card rounded-xl">
          <div className="p-3.5 flex flex-col gap-1.5">
            <p className="text-[9px] font-bold uppercase tracking-widest text-white/30 mb-0.5">
              Confidence
            </p>
            {[
              { label: "0–25%",   hex: "#22c55e" },
              { label: "25–50%",  hex: "#eab308" },
              { label: "50–75%",  hex: "#f97316" },
              { label: "75–100%", hex: "#ef4444" },
            ].map((item) => (
              <div key={item.label} className="flex items-center gap-2">
                <div className="w-2 h-2 rounded-sm" style={{ background: item.hex }} />
                <span className="text-[10px] text-white/35">{item.label}</span>
              </div>
            ))}
          </div>
        </div>
      </motion.div>
    </>
  );
}
