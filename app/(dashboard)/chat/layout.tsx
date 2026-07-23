import { ConversationList } from "@/components/chat/conversation-list";

export default function ChatLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="flex h-[calc(100vh-4rem)]">
      <ConversationList />
      <div className="flex-1">{children}</div>
    </div>
  );
}
