"use client";

import { motion, AnimatePresence } from "framer-motion";
import { AIOrb } from "@/components/shared/ai-orb";
import { Waveform } from "@/components/shared/waveform";
import type { VoiceState } from "@/types";

interface VoiceAnimationProps {
  state: VoiceState;
  transcript?: string;
}

const STATE_LABEL: Record<VoiceState, string> = {
  idle: "Say \"Hey Zarvis\" or double-clap to begin",
  listening: "Listening…",
  thinking: "Thinking…",
  speaking: "Speaking…",
  error: "Something went wrong — try again",
};

export function VoiceAnimation({ state, transcript }: VoiceAnimationProps) {
  return (
    <div className="flex flex-col items-center justify-center gap-8">
      <AIOrb state={state} size={220} />

      <div className="flex flex-col items-center gap-3 text-center">
        <AnimatePresence mode="wait">
          <motion.p
            key={state}
            initial={{ opacity: 0, y: 8 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -8 }}
            className="text-lg font-medium text-glow"
          >
            {STATE_LABEL[state]}
          </motion.p>
        </AnimatePresence>

        {(state === "listening" || state === "speaking") && <Waveform active bars={7} className="h-10" />}

        {transcript && state !== "idle" && (
          <motion.p
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            className="max-w-md text-sm text-muted-foreground"
          >
            {transcript}
          </motion.p>
        )}
      </div>
    </div>
  );
}
