"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { v4 as uuid } from "uuid";
import { createClient } from "@/lib/supabase/client";
import { toChatMessage, type ChatMessage, type MessageAttachment } from "@/types";
import { generateChatTitle } from "@/lib/utils";

interface UseChatOptions {
  conversationId: string | null;
  userId: string | undefined;
  onConversationCreated?: (id: string) => void;
}

export function useChat({ conversationId, userId, onConversationCreated }: UseChatOptions) {
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [isLoadingHistory, setIsLoadingHistory] = useState(true);
  const [isStreaming, setIsStreaming] = useState(false);
  const abortRef = useRef<AbortController | null>(null);

  const supabase = createClient();

  // Load existing history when switching conversations.
  useEffect(() => {
    if (!conversationId) {
      setMessages([]);
      setIsLoadingHistory(false);
      return;
    }
    let cancelled = false;
    setIsLoadingHistory(true);
    (async () => {
      const { data } = await supabase
        .from("messages")
        .select("*")
        .eq("conversation_id", conversationId)
        .order("created_at", { ascending: true });
      if (!cancelled) {
        setMessages((data ?? []).map(toChatMessage));
        setIsLoadingHistory(false);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [conversationId]); // eslint-disable-line react-hooks/exhaustive-deps

  const ensureConversation = useCallback(
    async (firstMessage: string): Promise<string> => {
      if (conversationId) return conversationId;
      if (!userId) throw new Error("Not authenticated");
      const { data, error } = await supabase
        .from("conversations")
        .insert({ user_id: userId, title: generateChatTitle(firstMessage) })
        .select("id")
        .single();
      if (error || !data) throw error ?? new Error("Failed to create conversation");
      onConversationCreated?.(data.id);
      return data.id;
    },
    [conversationId, userId, onConversationCreated], // eslint-disable-line react-hooks/exhaustive-deps
  );

  const streamAssistantReply = useCallback(
    async (targetConversationId: string, history: ChatMessage[], assistantMessageId: string) => {
      abortRef.current?.abort();
      const controller = new AbortController();
      abortRef.current = controller;

      const response = await fetch("/api/chat", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          conversationId: targetConversationId,
          history: history.map((m) => ({ role: m.role, content: m.content })),
        }),
        signal: controller.signal,
      });

      if (!response.ok || !response.body) {
        throw new Error(`Chat request failed (${response.status})`);
      }

      const reader = response.body.getReader();
      const decoder = new TextDecoder();
      let fullText = "";

      while (true) {
        const { done, value } = await reader.read();
        if (done) break;
        const chunk = decoder.decode(value, { stream: true });
        fullText += chunk;
        setMessages((prev) =>
          prev.map((m) => (m.id === assistantMessageId ? { ...m, content: fullText } : m)),
        );
      }

      return fullText;
    },
    [],
  );

  const sendMessage = useCallback(
    async (content: string, attachments?: MessageAttachment[]) => {
      if (!content.trim() || !userId) return;

      const targetConversationId = await ensureConversation(content);

      const userMessage: ChatMessage = {
        id: uuid(),
        role: "user",
        content,
        createdAt: new Date().toISOString(),
        attachments,
      };
      const assistantMessageId = uuid();
      const assistantPlaceholder: ChatMessage = {
        id: assistantMessageId,
        role: "assistant",
        content: "",
        createdAt: new Date().toISOString(),
        pending: true,
      };

      const historyForRequest = [...messages, userMessage];
      setMessages((prev) => [...prev, userMessage, assistantPlaceholder]);
      setIsStreaming(true);

      await supabase.from("messages").insert({
        conversation_id: targetConversationId,
        user_id: userId,
        role: "user",
        content,
        attachments: attachments ? JSON.parse(JSON.stringify(attachments)) : null,
      });

      try {
        const fullText = await streamAssistantReply(
          targetConversationId,
          historyForRequest,
          assistantMessageId,
        );
        setMessages((prev) =>
          prev.map((m) => (m.id === assistantMessageId ? { ...m, content: fullText, pending: false } : m)),
        );
        await supabase.from("messages").insert({
          conversation_id: targetConversationId,
          user_id: userId,
          role: "assistant",
          content: fullText,
        });
      } catch {
        setMessages((prev) =>
          prev.map((m) =>
            m.id === assistantMessageId
              ? { ...m, content: "Sorry — I couldn't generate a response. Please try again.", pending: false }
              : m,
          ),
        );
      } finally {
        setIsStreaming(false);
      }

      return targetConversationId;
    },
    [messages, userId, ensureConversation, streamAssistantReply], // eslint-disable-line react-hooks/exhaustive-deps
  );

  const regenerateLast = useCallback(async () => {
    if (!conversationId || !userId) return;
    const lastUserIndex = [...messages].reverse().findIndex((m) => m.role === "user");
    if (lastUserIndex === -1) return;
    const cutIndex = messages.length - 1 - lastUserIndex;
    const historyUpToUser = messages.slice(0, cutIndex + 1);

    const assistantMessageId = uuid();
    setMessages([...historyUpToUser, { id: assistantMessageId, role: "assistant", content: "", createdAt: new Date().toISOString(), pending: true }]);
    setIsStreaming(true);
    try {
      const fullText = await streamAssistantReply(conversationId, historyUpToUser, assistantMessageId);
      setMessages((prev) =>
        prev.map((m) => (m.id === assistantMessageId ? { ...m, content: fullText, pending: false } : m)),
      );
      await supabase.from("messages").insert({
        conversation_id: conversationId,
        user_id: userId,
        role: "assistant",
        content: fullText,
      });
    } finally {
      setIsStreaming(false);
    }
  }, [conversationId, messages, streamAssistantReply, userId]); // eslint-disable-line react-hooks/exhaustive-deps

  const stopStreaming = useCallback(() => {
    abortRef.current?.abort();
    setIsStreaming(false);
  }, []);

  return { messages, isLoadingHistory, isStreaming, sendMessage, regenerateLast, stopStreaming };
}
