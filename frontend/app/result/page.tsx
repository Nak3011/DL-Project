"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import dynamic from "next/dynamic";
import { motion } from "framer-motion";
import { ArrowLeft, Flame } from "lucide-react";
import type { PredictionResponse } from "@/lib/api";
import MapOverlay from "@/components/MapOverlay";

// Leaflet: client-only
const MapView = dynamic(() => import("@/components/MapView"), { ssr: false });

export default function ResultPage() {
  const router = useRouter();
  const [data, setData] = useState<PredictionResponse | null>(null);

  useEffect(() => {
    const raw = sessionStorage.getItem("prediction");
    if (!raw) { router.replace("/"); return; }
    try { setData(JSON.parse(raw) as PredictionResponse); }
    catch { router.replace("/"); }
  }, [router]);

  if (!data) {
    return (
      <main
        className="flex-1 flex items-center justify-center"
        style={{ minHeight: "100dvh", background: "#050a0f" }}
      >
        <span className="loading loading-spinner loading-lg" style={{ color: "#ff7a28" }} />
      </main>
    );
  }

  return (
    <main
      className="relative flex flex-col"
      style={{ height: "100dvh", background: "#050a0f" }}
    >
      {/* ── Thin top nav bar ───────────────────────────── */}
      <motion.div
        initial={{ opacity: 0, y: -12 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5 }}
        className="absolute top-0 left-0 right-0 z-[1001] flex items-center justify-between px-5 py-3 pointer-events-none"
        style={{
          background: "linear-gradient(to bottom, rgba(5,10,15,0.8) 0%, transparent 100%)",
        }}
      >
        {/* Back button — re-enable pointer events */}
        <motion.button
          whileHover={{ scale: 1.05 }}
          whileTap={{ scale: 0.95 }}
          type="button"
          onClick={() => router.push("/")}
          className="pointer-events-auto flex items-center gap-1.5 rounded-xl px-3 py-1.5 text-xs font-medium glass"
          style={{ color: "rgba(255,255,255,0.55)" }}
        >
          <ArrowLeft size={13} />
          New Prediction
        </motion.button>

        <div className="flex items-center gap-2 pointer-events-none">
          <Flame size={16} style={{ color: "#ff7a28" }} />
          <span
            className="font-display text-sm font-bold text-fire"
            style={{ letterSpacing: "-0.2px" }}
          >
            Wildfire Prediction
          </span>
        </div>
      </motion.div>

      {/* ── Full-screen satellite map ──────────────────── */}
      <div className="flex-1 relative" style={{ minHeight: 0 }}>
        <MapView data={data} fullscreen />

        {/* Glass overlay panels on top of the map */}
        <MapOverlay data={data} />
      </div>
    </main>
  );
}
