"use client";

import { useState, useEffect, useRef } from "react";
import { useRouter } from "next/navigation";
import {
  motion,
  AnimatePresence,
  useMotionValue,
  animate,
  useTransform,
} from "framer-motion";
import UploadCard from "@/components/UploadCard";
import PipelineAnimation from "@/components/PipelineAnimation";
import type { PipelineStep } from "@/components/PipelineAnimation";
import { predict } from "@/lib/api";
import type { PredictionResponse } from "@/lib/api";
import { confidenceColor, riskLabel } from "@/lib/utils";

// ─────────────────────────────────────────────────────────────────────────────
//  Confidence transition — full-screen reveal between upload and result
// ─────────────────────────────────────────────────────────────────────────────
function ConfidenceTransition({
  data,
  onDone,
}: {
  data: PredictionResponse;
  onDone: () => void;
}) {
  const isWf  = data.predicted_class === 1;
  const pct   = Math.round(data.confidence * 100);
  const color = confidenceColor(data.confidence);
  const label = riskLabel(data.confidence);

  // Framer-motion imperative counter
  const count   = useMotionValue(0);
  const display = useTransform(count, (v) => Math.round(v));

  useEffect(() => {
    const ctrl  = animate(count, pct, { duration: 1.6, ease: "easeOut" });
    const timer = setTimeout(onDone, 2700);
    return () => {
      ctrl.stop();
      clearTimeout(timer);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const bg = isWf
    ? "radial-gradient(ellipse at center, #1a0000 0%, #060000 70%)"
    : "radial-gradient(ellipse at center, #001a0f 0%, #000605 70%)";

  return (
    <motion.div
      className="fixed inset-0 z-[9999] flex flex-col items-center justify-center select-none"
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0, transition: { duration: 0.55 } }}
      style={{ background: bg }}
    >
      {/* Pulsing concentric rings */}
      {[240, 320, 420].map((size, i) => (
        <motion.div
          key={size}
          className="absolute rounded-full pointer-events-none"
          style={{ width: size, height: size, border: `1px solid ${color}` }}
          animate={{ scale: [1, 1.12, 1], opacity: [0.55, 0.15, 0.55] }}
          transition={{
            duration: 2.4,
            repeat: Infinity,
            delay: i * 0.35,
            ease: "easeInOut",
          }}
        />
      ))}

      {/* Small status label */}
      <motion.p
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 0.25 }}
        className="font-cinematic text-[10px] tracking-[0.4em] mb-6 z-10"
        style={{ color: "rgba(255,255,255,0.28)" }}
      >
        ANALYSIS COMPLETE
      </motion.p>

      {/* Giant confidence counter */}
      <div className="flex items-start z-10" style={{ color }}>
        <motion.span
          className="font-cinematic font-black tabular-nums leading-none"
          style={{ fontSize: "clamp(5rem, 14vw, 7.5rem)" }}
        >
          {display}
        </motion.span>
        <span
          className="font-cinematic font-bold mt-3 ml-1"
          style={{ fontSize: "2.5rem", color: color + "99" }}
        >
          %
        </span>
      </div>

      {/* Risk label */}
      <motion.div
        initial={{ opacity: 0, y: 16 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.55 }}
        className="font-cinematic font-bold tracking-widest text-base mt-3 z-10"
        style={{ color: isWf ? "#f87171" : "#4ade80" }}
      >
        {isWf ? "WILDFIRE DETECTED" : "NO WILDFIRE DETECTED"}
      </motion.div>

      {/* Confidence decimal */}
      <motion.p
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 1.2 }}
        className="text-xs mt-2 font-mono z-10"
        style={{ color: "rgba(255,255,255,0.28)" }}
      >
        {label} · confidence {data.confidence.toFixed(4)}
      </motion.p>

      {/* Warning strip (wildfire only) */}
      {isWf && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.9 }}
          className="absolute bottom-8 left-1/2 -translate-x-1/2 z-10
                     px-5 py-2 rounded-full text-xs font-bold tracking-widest"
          style={{
            background: "rgba(239,68,68,0.15)",
            border: "1px solid rgba(239,68,68,0.3)",
            color: "#fca5a5",
          }}
        >
          ⚠ IMMEDIATE RESPONSE RECOMMENDED
        </motion.div>
      )}
    </motion.div>
  );
}

// ─────────────────────────────────────────────────────────────────────────────
//  HomePage
// ─────────────────────────────────────────────────────────────────────────────
export default function HomePage() {
  const router  = useRouter();
  const [loading,        setLoading]        = useState(false);
  const [step,           setStep]           = useState<PipelineStep | null>(null);
  const [error,          setError]          = useState<string | null>(null);
  const [transitionData, setTransitionData] = useState<PredictionResponse | null>(null);
  const navigatedRef = useRef(false);

  const handleUpload = async (file: File) => {
    setLoading(true);
    setError(null);
    navigatedRef.current = false;
    try {
      setStep("upload");
      await new Promise((r) => setTimeout(r, 320));
      setStep("coordinates");
      await new Promise((r) => setTimeout(r, 320));
      setStep("inference");
      const data = await predict(file);
      sessionStorage.setItem("prediction", JSON.stringify(data));
      setStep("done");
      // Trigger the confidence transition overlay
      setTransitionData(data);
      setLoading(false);
    } catch (err: unknown) {
      let msg =
        "Prediction failed. Filename must be  lon,lat.jpg  (e.g. -113.92,50.90.jpg).";
      if (typeof err === "object" && err !== null && "response" in err) {
        const r = (err as { response?: { data?: { detail?: string } } }).response;
        if (r?.data?.detail) msg = r.data.detail;
      } else if (err instanceof Error) msg = err.message;
      setError(msg);
      setLoading(false);
      setStep(null);
    }
  };

  const handleTransitionDone = () => {
    if (!navigatedRef.current) {
      navigatedRef.current = true;
      router.push("/result");
    }
  };

  return (
    <>
      {/* ══════════════════════════════════════════════════════════
          CONFIDENCE TRANSITION OVERLAY
         ══════════════════════════════════════════════════════════ */}
      <AnimatePresence>
        {transitionData && (
          <ConfidenceTransition
            key="transition"
            data={transitionData}
            onDone={handleTransitionDone}
          />
        )}
      </AnimatePresence>

      <main
        className="relative flex-1 flex flex-col items-center justify-center px-4 pb-16 pt-12 gap-8 overflow-hidden"
        style={{ minHeight: "100dvh" }}
      >
        {/* ══════════════════════════════════════════════════════════
            BACKGROUND LAYER STACK
            1. Blurred Background.jpg — full page, brighter
            2. Unified dark overlay (lighter so image shows)
            3. Orange grid — materialises toward the right diagonal
           ══════════════════════════════════════════════════════════ */}

        {/* Layer 1 — blurred background image (full page) */}
        <div
          className="absolute inset-0 pointer-events-none"
          style={{
            backgroundImage:    "url('/Background.jpg')",
            backgroundSize:     "cover",
            backgroundPosition: "center",
            filter:             "blur(5px) brightness(0.88)",
            transform:          "scale(1.07)",
          }}
        />

        {/* Layer 2 — unified dark overlay */}
        <div
          className="absolute inset-0 pointer-events-none"
          style={{ background: "rgba(5, 10, 15, 0.28)" }}
        />

        {/* Layer 3 — orange grid, visible across page, denser on right */}
        <div className="absolute inset-0 grid-wallpaper pointer-events-none" />

        {/* Subtle warm glow — top-right corner */}
        <motion.div
          animate={{ opacity: [0.15, 0.25, 0.15] }}
          transition={{ duration: 8, repeat: Infinity, ease: "easeInOut" }}
          className="absolute top-0 right-0 pointer-events-none"
          style={{
            width: "55vw", height: "55vw",
            background:
              "radial-gradient(circle, rgba(255,80,20,0.18) 0%, transparent 65%)",
            transform: "translate(25%, -25%)",
          }}
        />

        {/* ══════════════════════════════════════════════════════════
            CONTENT
           ══════════════════════════════════════════════════════════ */}
        <motion.div
          initial={{ opacity: 0, y: -24 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.85, ease: [0.16, 1, 0.3, 1] }}
          className="text-center relative z-10"
        >
          {/* Project name — Cinzel cinematic white */}
          <h1
            className="font-cinematic font-bold text-white leading-none"
            style={{
              fontSize: "clamp(2.9rem, 7.5vw, 5.2rem)",
              textShadow:
                "0 2px 40px rgba(0,0,0,0.9), 0 0 80px rgba(255,80,20,0.1)",
            }}
          >
            INVENIO IGNIS
          </h1>

          {/* Description — EB Garamond italic, orange */}
          <p
            className="font-latin-italic mt-5 max-w-lg mx-auto leading-relaxed"
            style={{
              fontSize:  "1.05rem",
              color:     "#f97316",
              fontWeight: 400,
              textShadow: "0 1px 10px rgba(0,0,0,0.8)",
              opacity: 0.92,
            }}
          >
            AI-powered system that detects and predicts wildfires early by
            analyzing environmental and satellite data to enable rapid
            prevention and response.
          </p>
        </motion.div>

        {/* ── Upload bar ─────────────────────────────────────────────── */}
        <div className="relative z-10 w-full flex justify-center">
          <UploadCard onUpload={handleUpload} disabled={loading} />
        </div>

        {/* ── Pipeline ───────────────────────────────────────────────── */}
        <AnimatePresence>
          {step && !transitionData && (
            <motion.div
              key="pipeline"
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -8 }}
              className="relative z-10"
            >
              <PipelineAnimation currentStep={step} />
            </motion.div>
          )}
        </AnimatePresence>

        {/* ── Error ──────────────────────────────────────────────────── */}
        <AnimatePresence>
          {error && (
            <motion.div
              key="error"
              initial={{ opacity: 0, scale: 0.94 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0 }}
              className="relative z-10 alert alert-error max-w-md shadow-xl"
            >
              <span className="text-sm font-mono">{error}</span>
            </motion.div>
          )}
        </AnimatePresence>
      </main>
    </>
  );
}
