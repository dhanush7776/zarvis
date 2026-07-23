"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { MessageSquare, Mic, Hand, Keyboard } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import { CardGridSkeleton } from "@/components/shared/loading-skeleton";
import { useUser } from "@/hooks/useUser";
import { createClient } from "@/lib/supabase/client";
import { formatDate, truncate } from "@/lib/utils";
import type { Conversation, VoiceLog } from "@/types/database";

const TRIGGER_ICON = { wake_word: Mic, double_clap: Hand, manual: Keyboard } as const;

export default function HistoryPage() {
  const { user } = useUser();
  const [conversations, setConversations] = useState<Conversation[]>([]);
  const [voiceLogs, setVoiceLogs] = useState<VoiceLog[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const supabase = createClient();

  useEffect(() => {
    if (!user) return;
    (async () => {
      setIsLoading(true);
      const [{ data: convos }, { data: logs }] = await Promise.all([
        supabase.from("conversations").select("*").eq("user_id", user.id).order("updated_at", { ascending: false }),
        supabase.from("voice_logs").select("*").eq("user_id", user.id).order("created_at", { ascending: false }),
      ]);
      setConversations(convos ?? []);
      setVoiceLogs(logs ?? []);
      setIsLoading(false);
    })();
  }, [user]); // eslint-disable-line react-hooks/exhaustive-deps

  return (
    <div className="mx-auto max-w-4xl space-y-6 p-6">
      <div>
        <h1 className="font-display text-2xl font-semibold">History</h1>
        <p className="text-sm text-muted-foreground">Everything you've asked Zarvis, in one place.</p>
      </div>

      <Tabs defaultValue="chats">
        <TabsList>
          <TabsTrigger value="chats" className="gap-1.5">
            <MessageSquare className="h-3.5 w-3.5" /> Chats
          </TabsTrigger>
          <TabsTrigger value="voice" className="gap-1.5">
            <Mic className="h-3.5 w-3.5" /> Voice
          </TabsTrigger>
        </TabsList>

        <TabsContent value="chats">
          {isLoading ? (
            <CardGridSkeleton count={4} />
          ) : conversations.length === 0 ? (
            <p className="p-8 text-center text-sm text-muted-foreground">No conversations yet.</p>
          ) : (
            <div className="space-y-2">
              {conversations.map((c) => (
                <Link key={c.id} href={`/chat/${c.id}`}>
                  <Card className="transition-colors hover:bg-white/[0.07]">
                    <CardContent className="flex items-center justify-between p-4">
                      <div>
                        <p className="font-medium">{c.title}</p>
                        <p className="text-xs text-muted-foreground">{formatDate(c.updated_at)}</p>
                      </div>
                      {c.is_pinned && <Badge>Pinned</Badge>}
                    </CardContent>
                  </Card>
                </Link>
              ))}
            </div>
          )}
        </TabsContent>

        <TabsContent value="voice">
          {isLoading ? (
            <CardGridSkeleton count={4} />
          ) : voiceLogs.length === 0 ? (
            <p className="p-8 text-center text-sm text-muted-foreground">No voice interactions yet.</p>
          ) : (
            <div className="space-y-2">
              {voiceLogs.map((log) => {
                const Icon = TRIGGER_ICON[log.trigger];
                return (
                  <Card key={log.id}>
                    <CardContent className="space-y-1 p-4">
                      <div className="flex items-center justify-between">
                        <span className="flex items-center gap-1.5 text-xs text-zarvis-cyan">
                          <Icon className="h-3.5 w-3.5" /> {log.trigger.replace("_", " ")}
                        </span>
                        <span className="text-xs text-muted-foreground">{formatDate(log.created_at)}</span>
                      </div>
                      <p className="text-sm font-medium">{truncate(log.transcript ?? "", 100)}</p>
                      <p className="text-sm text-muted-foreground">{truncate(log.response ?? "", 140)}</p>
                    </CardContent>
                  </Card>
                );
              })}
            </div>
          )}
        </TabsContent>
      </Tabs>
    </div>
  );
}
