"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { motion, AnimatePresence } from "framer-motion";
import UploadCard from "@/components/UploadCard";
import PipelineAnimation from "@/components/PipelineAnimation";
import type { PipelineStep } from "@/components/PipelineAnimation";
import { predict } from "@/lib/api";

export default function HomePage() {
  const router  = useRouter();
  const [loading, setLoading] = useState(false);
  const [step, setStep]       = useState<PipelineStep | null>(null);
  const [error, setError]     = useState<string | null>(null);

  const handleUpload = async (file: File) => {
    setLoading(true);
    setError(null);
    try {
      setStep("upload");
      await new Promise((r) => setTimeout(r, 320));
      setStep("coordinates");
      await new Promise((r) => setTimeout(r, 320));
      setStep("inference");
      const data = await predict(file);
      setStep("done");
      await new Promise((r) => setTimeout(r, 400));
      sessionStorage.setItem("prediction", JSON.stringify(data));
      router.push("/result");
    } catch (err: unknown) {
      let msg = "Prediction failed. Filename must be  lon,lat.jpg  (e.g. -113.92,50.90.jpg).";
      if (typeof err === "object" && err !== null && "response" in err) {
        const r = (err as { response?: { data?: { detail?: string } } }).response;
        if (r?.data?.detail) msg = r.data.detail;
      } else if (err instanceof Error) msg = err.message;
      setError(msg);
      setLoading(false);
      setStep(null);
    }
  };

  return (
    <main
      className="relative flex-1 flex flex-col items-center justify-center px-4 pb-16 pt-12 gap-8 overflow-hidden"
      style={{ minHeight: "100dvh", background: "#050a0f" }}
    >
      {/* ── Background layers ─────────────────────────────────────── */}
      {/* Grid wallpaper — clear top-right, fades to fog bottom-left */}
      <div className="absolute inset-0 grid-wallpaper pointer-events-none" />
      <div className="absolute inset-0 grid-fog pointer-events-none" />

      {/* Orange glow orb — top-right anchor */}
      <motion.div
        animate={{ scale: [1, 1.14, 1], opacity: [0.2, 0.32, 0.2] }}
        transition={{ duration: 9, repeat: Infinity, ease: "easeInOut" }}
        className="absolute top-0 right-0 w-[700px] h-[700px] rounded-full pointer-events-none"
        style={{
          background: "radial-gradient(circle, rgba(255,75,20,0.22) 0%, transparent 62%)",
          transform: "translate(30%, -30%)",
        }}
      />
      {/* Cooler secondary orb */}
      <motion.div
        animate={{ scale: [1, 1.07, 1], opacity: [0.09, 0.16, 0.09] }}
        transition={{ duration: 13, repeat: Infinity, ease: "easeInOut", delay: 4 }}
        className="absolute left-0 bottom-0 w-[420px] h-[420px] rounded-full pointer-events-none"
        style={{
          background: "radial-gradient(circle, rgba(255,130,40,0.18) 0%, transparent 65%)",
          transform: "translate(-40%, 40%)",
        }}
      />

      {/* ── Title block ────────────────────────────────────────────── */}
      <motion.div
        initial={{ opacity: 0, y: -28 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.8, ease: [0.16, 1, 0.3, 1] }}
        className="text-center relative z-10"
      >
        {/* ⟵ no logo / flame icon */}

        {/* Project name in Cinzel cinematic white */}
        <h1
          className="font-cinematic font-bold text-white leading-none"
          style={{
            fontSize: "clamp(2.8rem, 7vw, 5rem)",
            letterSpacing: "0.06em",
            textShadow: "0 0 60px rgba(255,255,255,0.08)",
          }}
        >
          INVENIO IGNIS
        </h1>

        {/* Subtitle — Cormorant Garamond italic, orange */}
        <p
          className="font-italic-premium mt-4 max-w-md mx-auto leading-relaxed"
          style={{
            fontSize: "1.05rem",
            color: "#f97316",
            fontWeight: 400,
          }}
        >
          AI-powered system that detects and predicts wildfires early by
          analyzing environmental and satellite data to enable rapid prevention
          and response.
        </p>
      </motion.div>

      {/* ── Upload bar ─────────────────────────────────────────────── */}
      <div className="relative z-10 w-full flex justify-center">
        <UploadCard onUpload={handleUpload} disabled={loading} />
      </div>

      {/* ── Pipeline ───────────────────────────────────────────────── */}
      <AnimatePresence>
        {step && (
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
  );
}
