import Link from "next/link";
import { Sparkles } from "lucide-react";
import { Button } from "@/components/ui/button";

export function PublicNav() {
  return (
    <header className="relative z-10 mx-auto flex max-w-7xl items-center justify-between px-6 py-6">
      <Link href="/" className="flex items-center gap-2">
        <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-gradient-to-br from-zarvis-cyan to-zarvis-violet">
          <Sparkles className="h-4 w-4 text-black" />
        </div>
        <span className="text-lg font-semibold tracking-tight">Zarvis</span>
      </Link>
      <nav className="hidden items-center gap-8 text-sm text-muted-foreground md:flex">
        <Link href="/about" className="hover:text-foreground transition-colors">About</Link>
        <Link href="/pricing" className="hover:text-foreground transition-colors">Pricing</Link>
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
  );
}
