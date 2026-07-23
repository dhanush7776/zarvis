"use client";

import { useEffect, useRef } from "react";
import { useRouter } from "next/navigation";
import { Sparkles } from "lucide-react";
import { ChatBubble } from "./chat-bubble";
import { MessageComposer } from "./message-composer";
import { ChatMessagesSkeleton } from "@/components/shared/loading-skeleton";
import { ScrollArea } from "@/components/ui/scroll-area";
import { useChat } from "@/hooks/useChat";
import { useUser } from "@/hooks/useUser";

const SUGGESTIONS = [
  "Explain this concept like I'm five",
  "Write a Python script to rename files in bulk",
  "Debug this error message for me",
  "Draft a polite follow-up email",
];

export function ChatView({ conversationId }: { conversationId: string | null }) {
  const { user } = useUser();
  const router = useRouter();
  const bottomRef = useRef<HTMLDivElement>(null);

  const { messages, isLoadingHistory, isStreaming, sendMessage, regenerateLast, stopStreaming } = useChat({
    conversationId,
    userId: user?.id,
    onConversationCreated: (id) => router.replace(`/chat/${id}`),
  });

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  return (
    <div className="flex h-full flex-col">
      <ScrollArea className="flex-1">
        {isLoadingHistory ? (
          <ChatMessagesSkeleton />
        ) : messages.length === 0 ? (
          <div className="flex h-full flex-col items-center justify-center gap-6 px-6 py-20 text-center">
            <div className="flex h-14 w-14 items-center justify-center rounded-full bg-gradient-to-br from-zarvis-cyan to-zarvis-violet">
              <Sparkles className="h-6 w-6 text-black" />
            </div>
            <h2 className="font-display text-2xl font-semibold">What's on your mind?</h2>
            <div className="grid w-full max-w-lg grid-cols-1 gap-2 sm:grid-cols-2">
              {SUGGESTIONS.map((s) => (
                <button
                  key={s}
                  onClick={() => sendMessage(s)}
                  className="glass rounded-xl px-4 py-3 text-left text-sm hover:bg-white/10 transition-colors"
                >
                  {s}
                </button>
              ))}
            </div>
          </div>
        ) : (
          <div className="space-y-6 py-6">
            {messages.map((m, i) => (
              <ChatBubble
                key={m.id}
                message={m}
                isLast={i === messages.length - 1}
                onRegenerate={m.role === "assistant" ? regenerateLast : undefined}
              />
            ))}
            <div ref={bottomRef} />
          </div>
        )}
      </ScrollArea>

      <MessageComposer onSend={sendMessage} isStreaming={isStreaming} onStop={stopStreaming} />
    </div>
  );
}
