"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { MessageSquare, Mic, FileText, ImageIcon, ArrowRight, BrainCircuit } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { AIOrb } from "@/components/shared/ai-orb";
import { useUser } from "@/hooks/useUser";
import { createClient } from "@/lib/supabase/client";

interface Counts {
  conversations: number;
  documents: number;
  images: number;
  memories: number;
}

const QUICK_ACTIONS = [
  { href: "/chat", icon: MessageSquare, label: "Start a chat", description: "Ask anything, get streamed answers" },
  { href: "/voice", icon: Mic, label: "Talk to Zarvis", description: "Wake word or double-clap activation" },
  { href: "/documents", icon: FileText, label: "Upload a document", description: "Ask questions about a PDF" },
  { href: "/images", icon: ImageIcon, label: "Analyze an image", description: "Vision + OCR in one upload" },
];

export default function DashboardPage() {
  const { user, profile } = useUser();
  const [counts, setCounts] = useState<Counts>({ conversations: 0, documents: 0, images: 0, memories: 0 });
  const supabase = createClient();

  useEffect(() => {
    if (!user) return;
    (async () => {
      const [conversations, documents, images, memories] = await Promise.all([
        supabase.from("conversations").select("id", { count: "exact", head: true }).eq("user_id", user.id),
        supabase.from("documents").select("id", { count: "exact", head: true }).eq("user_id", user.id),
        supabase.from("images").select("id", { count: "exact", head: true }).eq("user_id", user.id),
        supabase.from("memories").select("id", { count: "exact", head: true }).eq("user_id", user.id),
      ]);
      setCounts({
        conversations: conversations.count ?? 0,
        documents: documents.count ?? 0,
        images: images.count ?? 0,
        memories: memories.count ?? 0,
      });
    })();
  }, [user]); // eslint-disable-line react-hooks/exhaustive-deps

  const firstName = profile?.full_name?.split(" ")[0] || "there";

  return (
    <div className="mx-auto max-w-6xl space-y-8 p-6">
      <div className="gradient-border glass flex flex-col items-center gap-6 rounded-2xl p-8 text-center sm:flex-row sm:text-left">
        <AIOrb size={100} />
        <div className="flex-1">
          <h1 className="font-display text-2xl font-semibold">Welcome back, {firstName}.</h1>
          <p className="mt-1 text-muted-foreground">
            You have {counts.conversations} conversation{counts.conversations === 1 ? "" : "s"} and{" "}
            {counts.memories} saved {counts.memories === 1 ? "memory" : "memories"}.
          </p>
        </div>
        <Button asChild size="lg">
          <Link href="/chat" className="gap-2">
            New chat <ArrowRight className="h-4 w-4" />
          </Link>
        </Button>
      </div>

      <div className="grid grid-cols-2 gap-4 sm:grid-cols-4">
        {[
          { label: "Conversations", value: counts.conversations, icon: MessageSquare },
          { label: "Documents", value: counts.documents, icon: FileText },
          { label: "Images", value: counts.images, icon: ImageIcon },
          { label: "Memories", value: counts.memories, icon: BrainCircuit },
        ].map(({ label, value, icon: Icon }) => (
          <Card key={label}>
            <CardContent className="flex items-center gap-3 p-5">
              <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-white/5">
                <Icon className="h-4 w-4 text-zarvis-cyan" />
              </div>
              <div>
                <p className="text-xl font-semibold">{value}</p>
                <p className="text-xs text-muted-foreground">{label}</p>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      <div>
        <h2 className="mb-4 font-display text-lg font-semibold">Quick actions</h2>
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
          {QUICK_ACTIONS.map(({ href, icon: Icon, label, description }) => (
            <Link key={href} href={href}>
              <Card className="h-full transition-transform hover:-translate-y-1">
                <CardHeader className="flex-row items-center gap-4 space-y-0">
                  <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-gradient-to-br from-zarvis-cyan/20 to-zarvis-violet/20">
                    <Icon className="h-5 w-5 text-zarvis-cyan" />
                  </div>
                  <div>
                    <CardTitle className="text-base">{label}</CardTitle>
                    <p className="text-sm text-muted-foreground">{description}</p>
                  </div>
                </CardHeader>
              </Card>
            </Link>
          ))}
        </div>
      </div>
    </div>
  );
}
