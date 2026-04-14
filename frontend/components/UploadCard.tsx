"use client";

import { useCallback, useRef, useState } from "react";
import { motion } from "framer-motion";
import { CloudUpload, Loader2, CheckCircle2 } from "lucide-react";

interface UploadCardProps {
  onUpload: (file: File) => void;
  disabled?: boolean;
}

/**
 * Minimal white pill upload bar.
 * Prediction is triggered immediately when a file is selected or dropped —
 * no separate "Analyse" button required.
 */
export default function UploadCard({ onUpload, disabled }: UploadCardProps) {
  const inputRef = useRef<HTMLInputElement>(null);
  const [dragOver, setDragOver] = useState(false);
  const [fileName, setFileName] = useState<string | null>(null);

  const handleFile = useCallback(
    (f: File | undefined) => {
      if (!f || disabled) return;
      setFileName(f.name);
      onUpload(f); // ← auto-trigger, no button
    },
    [onUpload, disabled]
  );

  return (
    <motion.div
      initial={{ opacity: 0, y: 18 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.6, ease: [0.16, 1, 0.3, 1], delay: 0.12 }}
      className="w-full max-w-sm"
    >
      {/* White pill bar */}
      <motion.div
        animate={{
          boxShadow: dragOver
            ? "0 0 0 2px #f97316, 0 8px 32px rgba(249,115,22,0.25)"
            : disabled
              ? "0 4px 20px rgba(0,0,0,0.3)"
              : "0 4px 24px rgba(0,0,0,0.25), 0 0 0 1px rgba(255,255,255,0.08)",
        }}
        transition={{ duration: 0.2 }}
        className="bg-white rounded-full px-6 py-4 flex items-center gap-3.5 cursor-pointer select-none"
        style={{ opacity: disabled ? 0.88 : 1 }}
        onClick={() => !disabled && inputRef.current?.click()}
        onDragOver={(e) => { e.preventDefault(); if (!disabled) setDragOver(true); }}
        onDragLeave={() => setDragOver(false)}
        onDrop={(e) => {
          e.preventDefault();
          setDragOver(false);
          handleFile(e.dataTransfer.files[0]);
        }}
      >
        {/* Left icon */}
        {disabled ? (
          <Loader2 size={18} className="animate-spin shrink-0" style={{ color: "#f97316" }} />
        ) : fileName ? (
          <CheckCircle2 size={18} className="shrink-0" style={{ color: "#22c55e" }} />
        ) : (
          <CloudUpload size={18} className="shrink-0" style={{ color: "#9ca3af" }} />
        )}

        {/* Label */}
        <span
          className="text-sm font-medium truncate"
          style={{
            color: disabled
              ? "#f97316"
              : fileName
                ? "#374151"
                : "#9ca3af",
          }}
        >
          {disabled
            ? "Analysing…"
            : fileName
              ? fileName
              : "Drop satellite image or click to upload"}
        </span>

        {/* Hint chip */}
        {!disabled && !fileName && (
          <span
            className="ml-auto shrink-0 text-[10px] font-mono rounded-full px-2 py-0.5"
            style={{ background: "#f3f4f6", color: "#9ca3af" }}
          >
            lon,lat.jpg
          </span>
        )}

        <input
          ref={inputRef}
          type="file"
          accept="image/*"
          className="hidden"
          onChange={(e) => handleFile(e.target.files?.[0])}
        />
      </motion.div>
    </motion.div>
  );
}
