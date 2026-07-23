"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  LayoutDashboard,
  MessageSquare,
  Mic,
  FileText,
  Image as ImageIcon,
  History,
  BrainCircuit,
  Settings,
  Sparkles,
} from "lucide-react";
import { cn } from "@/lib/utils";

const NAV_ITEMS = [
  { href: "/dashboard", label: "Dashboard", icon: LayoutDashboard },
  { href: "/chat", label: "Chat", icon: MessageSquare },
  { href: "/voice", label: "Voice", icon: Mic },
  { href: "/documents", label: "Documents", icon: FileText },
  { href: "/images", label: "Images", icon: ImageIcon },
  { href: "/history", label: "History", icon: History },
  { href: "/memory", label: "Memory", icon: BrainCircuit },
  { href: "/settings", label: "Settings", icon: Settings },
];

export function Sidebar() {
  const pathname = usePathname();

  return (
    <aside className="hidden w-64 shrink-0 flex-col border-r border-white/10 bg-black/20 backdrop-blur-xl md:flex">
      <Link href="/dashboard" className="flex items-center gap-2 px-6 py-6">
        <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-gradient-to-br from-zarvis-cyan to-zarvis-violet">
          <Sparkles className="h-4 w-4 text-black" />
        </div>
        <span className="text-lg font-semibold tracking-tight">Zarvis</span>
      </Link>

      <nav className="flex-1 space-y-1 px-3">
        {NAV_ITEMS.map(({ href, label, icon: Icon }) => {
          const active = pathname === href || pathname.startsWith(`${href}/`);
          return (
            <Link
              key={href}
              href={href}
              className={cn(
                "flex items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-medium transition-colors",
                active
                  ? "bg-gradient-to-r from-zarvis-cyan/15 to-zarvis-violet/15 text-zarvis-cyan border border-zarvis-cyan/20"
                  : "text-muted-foreground hover:bg-white/5 hover:text-foreground",
              )}
            >
              <Icon className="h-4 w-4" />
              {label}
            </Link>
          );
        })}
      </nav>

      <div className="p-4">
        <Link
          href="/pricing"
          className="gradient-border glass flex items-center justify-between rounded-xl px-4 py-3 text-sm"
        >
          <span>Upgrade to Pro</span>
          <Sparkles className="h-4 w-4 text-zarvis-cyan" />
        </Link>
      </div>
    </aside>
  );
}
