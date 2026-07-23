"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { useParams, useRouter } from "next/navigation";
import { Pin, MoreHorizontal, Pencil, Trash2, Plus } from "lucide-react";
import { Button } from "@/components/ui/button";
import { ScrollArea } from "@/components/ui/scroll-area";
import {
  DropdownMenu,
  DropdownMenuTrigger,
  DropdownMenuContent,
  DropdownMenuItem,
} from "@/components/ui/dropdown-menu";
import { ConversationListSkeleton } from "@/components/shared/loading-skeleton";
import { createClient } from "@/lib/supabase/client";
import { useUser } from "@/hooks/useUser";
import { cn, truncate } from "@/lib/utils";
import type { Conversation } from "@/types/database";

export function ConversationList() {
  const { user } = useUser();
  const params = useParams<{ id?: string }>();
  const router = useRouter();
  const [conversations, setConversations] = useState<Conversation[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [renamingId, setRenamingId] = useState<string | null>(null);
  const [renameValue, setRenameValue] = useState("");
  const supabase = createClient();

  const load = async () => {
    if (!user) return;
    setIsLoading(true);
    const { data } = await supabase
      .from("conversations")
      .select("*")
      .eq("user_id", user.id)
      .order("is_pinned", { ascending: false })
      .order("updated_at", { ascending: false });
    setConversations(data ?? []);
    setIsLoading(false);
  };

  useEffect(() => {
    load();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [user]);

  const togglePin = async (c: Conversation) => {
    await supabase.from("conversations").update({ is_pinned: !c.is_pinned }).eq("id", c.id);
    load();
  };

  const remove = async (c: Conversation) => {
    await supabase.from("conversations").delete().eq("id", c.id);
    if (params.id === c.id) router.push("/chat");
    load();
  };

  const startRename = (c: Conversation) => {
    setRenamingId(c.id);
    setRenameValue(c.title);
  };

  const submitRename = async (c: Conversation) => {
    await supabase.from("conversations").update({ title: renameValue || "Untitled" }).eq("id", c.id);
    setRenamingId(null);
    load();
  };

  return (
    <div className="flex h-full w-72 shrink-0 flex-col border-r border-white/10">
      <div className="p-3">
        <Button asChild className="w-full gap-2">
          <Link href="/chat">
            <Plus className="h-4 w-4" /> New chat
          </Link>
        </Button>
      </div>

      <ScrollArea className="flex-1">
        {isLoading ? (
          <ConversationListSkeleton />
        ) : conversations.length === 0 ? (
          <p className="p-4 text-center text-sm text-muted-foreground">No conversations yet.</p>
        ) : (
          <div className="space-y-1 p-2">
            {conversations.map((c) => (
              <div
                key={c.id}
                className={cn(
                  "group flex items-center gap-1 rounded-lg px-2 py-2 text-sm",
                  params.id === c.id ? "bg-white/10" : "hover:bg-white/5",
                )}
              >
                {renamingId === c.id ? (
                  <input
                    autoFocus
                    value={renameValue}
                    onChange={(e) => setRenameValue(e.target.value)}
                    onBlur={() => submitRename(c)}
                    onKeyDown={(e) => e.key === "Enter" && submitRename(c)}
                    className="flex-1 rounded bg-white/10 px-2 py-1 text-sm outline-none"
                  />
                ) : (
                  <Link href={`/chat/${c.id}`} className="flex flex-1 items-center gap-1.5 truncate">
                    {c.is_pinned && <Pin className="h-3 w-3 shrink-0 text-zarvis-cyan" />}
                    <span className="truncate">{truncate(c.title, 28)}</span>
                  </Link>
                )}

                <DropdownMenu>
                  <DropdownMenuTrigger className="rounded p-1 opacity-0 hover:bg-white/10 group-hover:opacity-100">
                    <MoreHorizontal className="h-3.5 w-3.5" />
                  </DropdownMenuTrigger>
                  <DropdownMenuContent align="end">
                    <DropdownMenuItem onClick={() => togglePin(c)} className="gap-2">
                      <Pin className="h-3.5 w-3.5" /> {c.is_pinned ? "Unpin" : "Pin"}
                    </DropdownMenuItem>
                    <DropdownMenuItem onClick={() => startRename(c)} className="gap-2">
                      <Pencil className="h-3.5 w-3.5" /> Rename
                    </DropdownMenuItem>
                    <DropdownMenuItem onClick={() => remove(c)} className="gap-2 text-rose-400">
                      <Trash2 className="h-3.5 w-3.5" /> Delete
                    </DropdownMenuItem>
                  </DropdownMenuContent>
                </DropdownMenu>
              </div>
            ))}
          </div>
        )}
      </ScrollArea>
    </div>
  );
}
