import type { Message } from "./database";

export type ChatRole = "user" | "assistant" | "system";

export interface ChatMessage {
  id: string;
  role: ChatRole;
  content: string;
  createdAt: string;
  attachments?: MessageAttachment[];
  pending?: boolean;
}

export interface MessageAttachment {
  type: "image" | "document";
  name: string;
  url: string;
}

export type VoiceState = "idle" | "listening" | "thinking" | "speaking" | "error";

export type VoiceTrigger = "wake_word" | "double_clap" | "manual";

export interface SettingsFormValues {
  theme: "dark" | "light" | "system";
  language: string;
  voiceName: string;
  wakeModeEnabled: boolean;
  wakeWord: string;
  clapDetectionEnabled: boolean;
  clapSensitivity: number;
  notificationsEnabled: boolean;
}

export function toChatMessage(row: Message): ChatMessage {
  return {
    id: row.id,
    role: row.role,
    content: row.content,
    createdAt: row.created_at,
    attachments: (row.attachments as unknown as MessageAttachment[] | null) ?? undefined,
  };
}
