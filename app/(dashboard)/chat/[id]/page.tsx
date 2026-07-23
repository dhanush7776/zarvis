"use client";

import { useParams } from "next/navigation";
import { ChatView } from "@/components/chat/chat-view";

export default function ConversationPage() {
  const params = useParams<{ id: string }>();
  return <ChatView conversationId={params.id} />;
}
