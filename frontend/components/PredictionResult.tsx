"use client";

import type { PredictionResponse } from "@/lib/api";
import { confidenceColor, aqiBadgeClass } from "@/lib/utils";
import { Flame, MapPin, Wind, Activity } from "lucide-react";

interface PredictionResultProps {
  data: PredictionResponse;
}

/**
 * Format coordinates with proper N/S · E/W labels using absolute values.
 */
function formatCoord(lat: number, lon: number): string {
  const latDir = lat >= 0 ? "N" : "S";
  const lonDir = lon >= 0 ? "E" : "W";
  return `${Math.abs(lat).toFixed(4)}° ${latDir},  ${Math.abs(lon).toFixed(4)}° ${lonDir}`;
}

/**
 * Card displaying the model prediction result, coordinates, and AQI.
 */
export default function PredictionResult({ data }: PredictionResultProps) {
  const color = confidenceColor(data.confidence);
  const pct = Math.round(data.confidence * 100);
  const isWildfire = data.predicted_class === 1;

  return (
    <div className="glass-card rounded-2xl shadow-md w-full animate-fade-in-up hover-lift">
      <div className="p-6 flex flex-col gap-5">
        {/* Header */}
        <div className="flex items-center justify-between">
          <h2 className="font-display text-xl font-semibold flex items-center gap-2.5">
            <div
              className="p-1.5 rounded-lg"
              style={{ backgroundColor: `${color}15` }}
            >
              <Flame size={20} style={{ color }} />
            </div>
            Prediction Result
          </h2>
          <div
            className="badge badge-lg font-bold text-xs tracking-wider px-4 py-3"
            style={{
              backgroundColor: `${color}15`,
              color,
              borderColor: `${color}30`,
            }}
          >
            {isWildfire ? "HIGH RISK" : "LOW RISK"}
          </div>
        </div>

        {/* Confidence meter */}
        <div className="flex items-center gap-4 animate-fade-in-up delay-100">
          <div
            className="radial-progress text-sm font-bold"
            style={
              {
                "--value": pct,
                "--size": "4rem",
                "--thickness": "5px",
                color,
              } as React.CSSProperties
            }
            role="progressbar"
          >
            {pct}%
          </div>
          <div>
            <p className="font-semibold text-base">
              {isWildfire ? "Wildfire Detected" : "No Wildfire Detected"}
            </p>
            <p className="text-xs text-base-content/40 mt-0.5">
              Model confidence: {(data.confidence * 100).toFixed(1)}%
            </p>
          </div>
        </div>

        <div className="divider my-0 opacity-40" />

        {/* Coordinates */}
        <div className="flex items-center gap-2.5 text-sm animate-fade-in-up delay-200">
          <div className="p-1.5 rounded-lg bg-base-200/60">
            <MapPin size={16} className="text-base-content/40" />
          </div>
          <span className="font-mono text-base-content/70 tracking-wide">
            {formatCoord(data.latitude, data.longitude)}
          </span>
        </div>

        {/* AQI */}
        <div className="flex items-center justify-between animate-fade-in-up delay-300">
          <div className="flex items-center gap-2.5 text-sm">
            <div className="p-1.5 rounded-lg bg-base-200/60">
              <Wind size={16} className="text-base-content/40" />
            </div>
            <span className="text-base-content/60">Estimated AQI</span>
          </div>
          <div className="flex items-center gap-2.5">
            <span className="text-3xl font-bold tabular-nums tracking-tight">
              {data.aqi}
            </span>
            <span
              className={`badge ${aqiBadgeClass(data.aqi_status)} badge-sm font-medium`}
            >
              {data.aqi_status}
            </span>
          </div>
        </div>
      </div>
    </div>
  );
}
