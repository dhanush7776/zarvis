import Link from "next/link";
import {
  Mic,
  FileText,
  ImageIcon,
  Code2,
  BrainCircuit,
  Sparkles,
  ArrowRight,
  Hand,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { ParticleBackground } from "@/components/shared/particle-background";
import { AIOrb } from "@/components/shared/ai-orb";

const FEATURES = [
  {
    icon: Mic,
    title: "Wake word & double clap",
    description:
      "Say \"Hey Zarvis\" or clap twice and it's listening — no touchscreen, no wake button.",
  },
  {
    icon: BrainCircuit,
    title: "Persistent memory",
    description: "Zarvis remembers what matters across conversations, so you never repeat yourself.",
  },
  {
    icon: FileText,
    title: "Document intelligence",
    description: "Drop in a PDF and ask questions — Zarvis reads, indexes, and answers from it directly.",
  },
  {
    icon: ImageIcon,
    title: "Vision & OCR",
    description: "Upload a photo or screenshot and ask what's in it, or pull the exact text out of it.",
  },
  {
    icon: Code2,
    title: "Code assistant",
    description: "Generate, debug, explain, optimize, or translate code between languages, in context.",
  },
  {
    icon: Sparkles,
    title: "Built on Gemini",
    description: "Fast, streaming responses with full conversation history and one-click regenerate.",
  },
];

const STEPS = [
  { label: "Speak or type", detail: "Trigger Zarvis by voice, clap, or just start typing." },
  { label: "Zarvis thinks", detail: "Your request is grounded in memory, documents, and images you've shared." },
  { label: "Get an answer", detail: "Streamed back instantly, in text or spoken out loud." },
];

export default function LandingPage() {
  return (
    <div className="relative min-h-screen overflow-hidden">
      <ParticleBackground count={44} className="z-0" />

      {/* Nav */}
      <header className="relative z-10 mx-auto flex max-w-7xl items-center justify-between px-6 py-6">
        <div className="flex items-center gap-2">
          <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-gradient-to-br from-zarvis-cyan to-zarvis-violet">
            <Sparkles className="h-4 w-4 text-black" />
          </div>
          <span className="text-lg font-semibold tracking-tight">Zarvis</span>
        </div>
        <nav className="hidden items-center gap-8 text-sm text-muted-foreground md:flex">
          <Link href="/about" className="hover:text-foreground transition-colors">
            About
          </Link>
          <Link href="/pricing" className="hover:text-foreground transition-colors">
            Pricing
          </Link>
        </nav>
        <div className="flex items-center gap-3">
          <Button variant="ghost" asChild>
            <Link href="/login">Log in</Link>
          </Button>
          <Button asChild>
            <Link href="/signup">Get started</Link>
          </Button>
        </div>
      </header>

      {/* Hero */}
      <section className="relative z-10 mx-auto flex max-w-5xl flex-col items-center px-6 pb-24 pt-12 text-center">
        <div className="mb-10 flex items-center gap-2 rounded-full border border-white/10 bg-white/5 px-4 py-1.5 text-xs text-muted-foreground">
          <Hand className="h-3.5 w-3.5 text-zarvis-cyan" />
          Double-clap or say "Hey Zarvis" — it's always listening for you
        </div>

        <AIOrb size={200} className="mb-10" />

        <h1 className="text-glow font-display text-5xl font-semibold leading-[1.05] tracking-tight sm:text-6xl md:text-7xl">
          An assistant that
          <br />
          <span className="bg-gradient-to-r from-zarvis-cyan to-zarvis-violet bg-clip-text text-transparent">
            actually feels ahead of you.
          </span>
        </h1>

        <p className="mt-6 max-w-2xl text-lg text-muted-foreground">
          Zarvis listens, remembers, reads your documents, sees your images, and writes your code —
          all in one calm, precise interface built for people who expect their tools to keep up.
        </p>

        <div className="mt-10 flex flex-col gap-3 sm:flex-row">
          <Button size="lg" asChild>
            <Link href="/signup" className="gap-2">
              Start free <ArrowRight className="h-4 w-4" />
            </Link>
          </Button>
          <Button size="lg" variant="outline" asChild>
            <Link href="/about">See how it works</Link>
          </Button>
        </div>
      </section>

      {/* Feature grid */}
      <section className="relative z-10 mx-auto max-w-6xl px-6 pb-24">
        <div className="grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-3">
          {FEATURES.map(({ icon: Icon, title, description }) => (
            <div
              key={title}
              className="gradient-border glass rounded-2xl p-6 transition-transform hover:-translate-y-1"
            >
              <div className="mb-4 flex h-10 w-10 items-center justify-center rounded-lg bg-gradient-to-br from-zarvis-cyan/20 to-zarvis-violet/20">
                <Icon className="h-5 w-5 text-zarvis-cyan" />
              </div>
              <h3 className="mb-2 font-medium">{title}</h3>
              <p className="text-sm text-muted-foreground">{description}</p>
            </div>
          ))}
        </div>
      </section>

      {/* How it works */}
      <section className="relative z-10 mx-auto max-w-4xl px-6 pb-28">
        <h2 className="mb-12 text-center font-display text-3xl font-semibold">How it works</h2>
        <div className="grid grid-cols-1 gap-8 sm:grid-cols-3">
          {STEPS.map((step, i) => (
            <div key={step.label} className="text-center">
              <div className="mx-auto mb-4 flex h-12 w-12 items-center justify-center rounded-full border border-zarvis-cyan/30 bg-zarvis-cyan/10 font-display text-lg text-zarvis-cyan">
                {i + 1}
              </div>
              <h3 className="mb-2 font-medium">{step.label}</h3>
              <p className="text-sm text-muted-foreground">{step.detail}</p>
            </div>
          ))}
        </div>
      </section>

      {/* CTA */}
      <section className="relative z-10 mx-auto max-w-4xl px-6 pb-24 text-center">
        <div className="gradient-border glass-strong rounded-3xl px-8 py-16">
          <h2 className="mb-4 font-display text-3xl font-semibold sm:text-4xl">
            Ready to talk to Zarvis?
          </h2>
          <p className="mb-8 text-muted-foreground">
            Free to start. No credit card required.
          </p>
          <Button size="lg" asChild>
            <Link href="/signup" className="gap-2">
              Create your account <ArrowRight className="h-4 w-4" />
            </Link>
          </Button>
        </div>
      </section>

      <footer className="relative z-10 border-t border-white/10 py-8 text-center text-sm text-muted-foreground">
        © {new Date().getFullYear()} Zarvis. All rights reserved.
      </footer>
    </div>
  );
}
