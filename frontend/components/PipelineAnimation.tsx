"use client";

import { motion } from "framer-motion";
import { Upload, MapPin, Cpu, CheckCircle2 } from "lucide-react";

export type PipelineStep = "upload" | "coordinates" | "inference" | "done";

const STEPS: { key: PipelineStep; label: string; Icon: React.ElementType }[] =
  [
    { key: "upload",      label: "Uploading",   Icon: Upload },
    { key: "coordinates", label: "Coordinates", Icon: MapPin },
    { key: "inference",   label: "Inference",   Icon: Cpu },
    { key: "done",        label: "Complete",    Icon: CheckCircle2 },
  ];

function idx(s: PipelineStep) {
  return STEPS.findIndex((x) => x.key === s);
}

export default function PipelineAnimation({ currentStep }: { currentStep: PipelineStep }) {
  const active = idx(currentStep);

  return (
    <motion.div
      initial={{ opacity: 0, y: 12 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5 }}
      className="glass rounded-2xl px-6 py-5 w-full max-w-md"
    >
      <div className="flex items-center justify-between">
        {STEPS.map((step, i) => {
          const done = i < active;
          const current = i === active;
          const pending = i > active;

          return (
            <div key={step.key} className="flex items-center gap-0">
              {/* Step dot */}
              <div className="flex flex-col items-center gap-1.5">
                <motion.div
                  animate={
                    current
                      ? { scale: [1, 1.15, 1], opacity: [1, 0.7, 1] }
                      : { scale: 1, opacity: 1 }
                  }
                  transition={current ? { duration: 1.1, repeat: Infinity } : {}}
                  className="rounded-full p-2"
                  style={{
                    background: done
                      ? "rgba(34,197,94,0.2)"
                      : current
                        ? "rgba(255,120,40,0.2)"
                        : "rgba(255,255,255,0.05)",
                    border: `1.5px solid ${
                      done
                        ? "rgba(34,197,94,0.6)"
                        : current
                          ? "rgba(255,120,40,0.7)"
                          : "rgba(255,255,255,0.1)"
                    }`,
                  }}
                >
                  <step.Icon
                    size={14}
                    style={{
                      color: done
                        ? "#22c55e"
                        : current
                          ? "#ff7a28"
                          : "rgba(255,255,255,0.2)",
                    }}
                  />
                </motion.div>
                <span
                  className="text-[10px] font-medium tracking-wide"
                  style={{
                    color: done
                      ? "#22c55e"
                      : current
                        ? "#ff7a28"
                        : "rgba(255,255,255,0.2)",
                  }}
                >
                  {step.label}
                </span>
              </div>

              {/* Connector */}
              {i < STEPS.length - 1 && (
                <div className="w-8 h-px mx-1 mb-5" style={{ background: done ? "rgba(34,197,94,0.4)" : "rgba(255,255,255,0.06)" }} />
              )}
            </div>
          );
        })}
      </div>
    </motion.div>
  );
}
