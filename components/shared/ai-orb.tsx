"use client";

import { motion } from "framer-motion";
import { cn } from "@/lib/utils";
import type { VoiceState } from "@/types";

interface AIOrbProps {
  state?: VoiceState;
  size?: number;
  className?: string;
}

const STATE_COLORS: Record<VoiceState, [string, string]> = {
  idle: ["#37e6ff", "#7c5cff"],
  listening: ["#37e6ff", "#22d3ee"],
  thinking: ["#7c5cff", "#a78bfa"],
  speaking: ["#37e6ff", "#ffb454"],
  error: ["#ff4d6d", "#ff8a65"],
};

/**
 * The Zarvis signature element: a layered, animated orb of light that
 * represents the assistant's presence. Its colors and motion respond to
 * the current voice state.
 */
export function AIOrb({ state = "idle", size = 160, className }: AIOrbProps) {
  const [from, to] = STATE_COLORS[state];
  const isActive = state !== "idle";

  return (
    <div
      className={cn("relative flex items-center justify-center", className)}
      style={{ width: size, height: size }}
    >
      {/* outer glow ring */}
      <motion.div
        className="absolute inset-0 rounded-full blur-2xl"
        style={{ background: `radial-gradient(circle, ${from}55, transparent 70%)` }}
        animate={{ scale: isActive ? [1, 1.25, 1] : [1, 1.08, 1], opacity: [0.6, 0.9, 0.6] }}
        transition={{ duration: isActive ? 1.4 : 3, repeat: Infinity, ease: "easeInOut" }}
      />

      {/* rotating gradient ring */}
      <motion.div
        className="absolute inset-[8%] rounded-full opacity-80"
        style={{
          background: `conic-gradient(from 0deg, ${from}, ${to}, transparent 60%, ${from})`,
          maskImage: "radial-gradient(circle, transparent 58%, black 62%, black 78%, transparent 82%)",
          WebkitMaskImage:
            "radial-gradient(circle, transparent 58%, black 62%, black 78%, transparent 82%)",
        }}
        animate={{ rotate: 360 }}
        transition={{ duration: isActive ? 3 : 12, repeat: Infinity, ease: "linear" }}
      />

      {/* core sphere */}
      <motion.div
        className="absolute inset-[24%] rounded-full"
        style={{
          background: `radial-gradient(circle at 35% 30%, ${from}, ${to} 60%, #05060a 100%)`,
          boxShadow: `0 0 40px 4px ${from}66, inset 0 0 30px 6px ${to}55`,
        }}
        animate={{ scale: state === "listening" ? [1, 1.08, 1] : state === "speaking" ? [1, 1.05, 0.98, 1] : [1, 1.03, 1] }}
        transition={{ duration: isActive ? 0.9 : 3.5, repeat: Infinity, ease: "easeInOut" }}
      />

      {/* highlight */}
      <div
        className="absolute rounded-full bg-white/70 blur-[3px]"
        style={{ width: size * 0.09, height: size * 0.09, top: "32%", left: "36%" }}
      />
    </div>
  );
}
