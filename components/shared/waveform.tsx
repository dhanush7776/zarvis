"use client";

import { motion } from "framer-motion";
import { cn } from "@/lib/utils";

interface WaveformProps {
  active?: boolean;
  bars?: number;
  className?: string;
}

/** Simple animated audio waveform used during voice listening/speaking states. */
export function Waveform({ active = true, bars = 5, className }: WaveformProps) {
  return (
    <div className={cn("flex items-center gap-1 h-8", className)}>
      {Array.from({ length: bars }).map((_, i) => (
        <motion.span
          key={i}
          className="w-1 rounded-full bg-gradient-to-t from-zarvis-cyan to-zarvis-violet"
          style={{ height: "100%" }}
          animate={
            active
              ? { scaleY: [0.3, 1, 0.4, 0.9, 0.3] }
              : { scaleY: 0.15 }
          }
          transition={{
            duration: 0.9 + (i % 3) * 0.15,
            repeat: active ? Infinity : 0,
            ease: "easeInOut",
            delay: i * 0.08,
          }}
        />
      ))}
    </div>
  );
}
