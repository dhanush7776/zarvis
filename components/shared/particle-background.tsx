"use client";

import { useMemo } from "react";
import { cn } from "@/lib/utils";

interface ParticleBackgroundProps {
  count?: number;
  className?: string;
}

/**
 * Ambient floating-particle field used behind hero sections and full-screen
 * voice mode. Pure CSS animation (no canvas) so it's cheap to render and
 * respects prefers-reduced-motion globally via globals.css.
 */
export function ParticleBackground({ count = 36, className }: ParticleBackgroundProps) {
  const particles = useMemo(
    () =>
      Array.from({ length: count }, (_, i) => ({
        id: i,
        left: Math.random() * 100,
        size: 1 + Math.random() * 2.5,
        duration: 12 + Math.random() * 18,
        delay: Math.random() * 20,
        opacity: 0.3 + Math.random() * 0.5,
        hue: Math.random() > 0.5 ? "#37e6ff" : "#7c5cff",
      })),
    [count],
  );

  return (
    <div className={cn("pointer-events-none absolute inset-0 overflow-hidden", className)} aria-hidden>
      <div className="absolute inset-0 bg-grid-glow" />
      {particles.map((p) => (
        <span
          key={p.id}
          className="absolute rounded-full animate-float-particle"
          style={{
            left: `${p.left}%`,
            bottom: "-10%",
            width: p.size,
            height: p.size,
            backgroundColor: p.hue,
            opacity: p.opacity,
            animationDuration: `${p.duration}s`,
            animationDelay: `${p.delay}s`,
            boxShadow: `0 0 6px 1px ${p.hue}`,
          }}
        />
      ))}
    </div>
  );
}
