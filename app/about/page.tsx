"use client";

import Link from "next/link";
import { Mic, BrainCircuit, FileText, ImageIcon, Code2, ShieldCheck } from "lucide-react";
import { Button } from "@/components/ui/button";
import { ParticleBackground } from "@/components/shared/particle-background";
import { AIOrb } from "@/components/shared/ai-orb";
import { PublicNav } from "@/components/layout/public-nav";
import { PublicFooter } from "@/components/layout/public-footer";

const PRINCIPLES = [
  {
    icon: Mic,
    title: "Always within reach",
    body: "A wake word or a double clap is all it takes — Zarvis doesn't need a button to find.",
  },
  {
    icon: BrainCircuit,
    title: "Remembers what matters",
    body: "Preferences, facts, and context you share are stored as memories Zarvis draws on later.",
  },
  {
    icon: FileText,
    title: "Understands your documents",
    body: "PDFs are read, indexed, and made searchable so you can ask direct questions about them.",
  },
  {
    icon: ImageIcon,
    title: "Sees what you see",
    body: "Upload a photo or screenshot for analysis, description, or exact text extraction.",
  },
  {
    icon: Code2,
    title: "Writes and reads code",
    body: "Generate, debug, explain, optimize, or translate code between languages in the same chat.",
  },
  {
    icon: ShieldCheck,
    title: "Private by default",
    body: "Every table is protected by row-level security — your data is visible only to you.",
  },
];

export default function AboutPage() {
  return (
    <div className="relative min-h-screen overflow-hidden">
      <ParticleBackground count={30} />
      <PublicNav />

      <section className="relative z-10 mx-auto flex max-w-4xl flex-col items-center px-6 pb-20 pt-8 text-center">
        <AIOrb size={140} className="mb-8" />
        <h1 className="font-display text-4xl font-semibold sm:text-5xl">Built to feel like the future, today.</h1>
        <p className="mt-6 max-w-2xl text-muted-foreground">
          Zarvis is a single assistant that listens, remembers, reads, sees, and codes — designed with the
          calm precision of a HUD copilot rather than a chat window bolted onto a search bar.
        </p>
      </section>

      <section className="relative z-10 mx-auto max-w-6xl px-6 pb-24">
        <div className="grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-3">
          {PRINCIPLES.map(({ icon: Icon, title, body }) => (
            <div key={title} className="gradient-border glass rounded-2xl p-6">
              <div className="mb-4 flex h-10 w-10 items-center justify-center rounded-lg bg-gradient-to-br from-zarvis-cyan/20 to-zarvis-violet/20">
                <Icon className="h-5 w-5 text-zarvis-cyan" />
              </div>
              <h3 className="mb-2 font-medium">{title}</h3>
              <p className="text-sm text-muted-foreground">{body}</p>
            </div>
          ))}
        </div>
      </section>

      <section className="relative z-10 mx-auto max-w-3xl px-6 pb-24 text-center">
        <div className="gradient-border glass-strong rounded-3xl px-8 py-14">
          <h2 className="mb-4 font-display text-3xl font-semibold">Try it yourself</h2>
          <p className="mb-8 text-muted-foreground">Free to start, no credit card required.</p>
          <Button size="lg" asChild>
            <Link href="/signup">Create your account</Link>
          </Button>
        </div>
      </section>

      <PublicFooter />
    </div>
  );
}
