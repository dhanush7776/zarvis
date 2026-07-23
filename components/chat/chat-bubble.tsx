"use client";

import { motion } from "framer-motion";
import { Bot, RotateCcw, User } from "lucide-react";
import { MarkdownRenderer } from "./markdown-renderer";
import { TypingAnimation } from "@/components/shared/typing-animation";
import { Button } from "@/components/ui/button";
import { cn, formatDate } from "@/lib/utils";
import type { ChatMessage } from "@/types";

interface ChatBubbleProps {
  message: ChatMessage;
  isLast?: boolean;
  onRegenerate?: () => void;
}

export function ChatBubble({ message, isLast, onRegenerate }: ChatBubbleProps) {
  const isUser = message.role === "user";

  return (
    <motion.div
      initial={{ opacity: 0, y: 12 }}
      animate={{ opacity: 1, y: 0 }}
      className={cn("flex gap-3 px-2", isUser ? "justify-end" : "justify-start")}
    >
      {!isUser && (
        <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-gradient-to-br from-zarvis-cyan to-zarvis-violet">
          <Bot className="h-4 w-4 text-black" />
        </div>
      )}

      <div className={cn("group max-w-[75%] flex flex-col gap-1", isUser && "items-end")}>
        <div
          className={cn(
            "rounded-2xl px-4 py-3 text-sm",
            isUser
              ? "bg-gradient-to-br from-zarvis-cyan/20 to-zarvis-violet/20 border border-zarvis-cyan/20"
              : "glass",
          )}
        >
          {message.pending && !message.content ? (
            <TypingAnimation />
          ) : isUser ? (
            <p className="whitespace-pre-wrap leading-relaxed">{message.content}</p>
          ) : (
            <MarkdownRenderer content={message.content} />
          )}
        </div>

        <div className="flex items-center gap-2 px-1 opacity-0 transition-opacity group-hover:opacity-100">
          <span className="text-[11px] text-muted-foreground">{formatDate(message.createdAt)}</span>
          {!isUser && isLast && !message.pending && onRegenerate && (
            <Button variant="ghost" size="sm" className="h-6 gap-1 px-2 text-[11px]" onClick={onRegenerate}>
              <RotateCcw className="h-3 w-3" /> Regenerate
            </Button>
          )}
        </div>
      </div>

      {isUser && (
        <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-white/10">
          <User className="h-4 w-4" />
        </div>
      )}
    </motion.div>
  );
}
