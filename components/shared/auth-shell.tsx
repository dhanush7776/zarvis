import Link from "next/link";
import { Sparkles } from "lucide-react";
import { ParticleBackground } from "@/components/shared/particle-background";

export function AuthShell({
  title,
  subtitle,
  children,
}: {
  title: string;
  subtitle: string;
  children: React.ReactNode;
}) {
  return (
    <div className="relative flex min-h-screen items-center justify-center overflow-hidden px-4 py-12">
      <ParticleBackground count={30} />
      <div className="relative z-10 w-full max-w-md">
        <Link href="/" className="mb-8 flex items-center justify-center gap-2">
          <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-gradient-to-br from-zarvis-cyan to-zarvis-violet">
            <Sparkles className="h-4 w-4 text-black" />
          </div>
          <span className="text-lg font-semibold tracking-tight">Zarvis</span>
        </Link>

        <div className="gradient-border glass-strong rounded-2xl p-8 shadow-2xl">
          <h1 className="mb-1 text-center font-display text-2xl font-semibold">{title}</h1>
          <p className="mb-6 text-center text-sm text-muted-foreground">{subtitle}</p>
          {children}
        </div>
      </div>
    </div>
  );
}
