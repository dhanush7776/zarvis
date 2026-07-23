"use client";

import { useRef, useState } from "react";
import { Send, Square, Paperclip, X } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import type { MessageAttachment } from "@/types";

interface MessageComposerProps {
  onSend: (content: string, attachments?: MessageAttachment[]) => void;
  isStreaming: boolean;
  onStop: () => void;
}

export function MessageComposer({ onSend, isStreaming, onStop }: MessageComposerProps) {
  const [value, setValue] = useState("");
  const [pendingFiles, setPendingFiles] = useState<File[]>([]);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleSubmit = () => {
    if (!value.trim() || isStreaming) return;
    const attachments: MessageAttachment[] = pendingFiles.map((f) => ({
      type: f.type.startsWith("image/") ? "image" : "document",
      name: f.name,
      url: URL.createObjectURL(f),
    }));
    onSend(value, attachments.length ? attachments : undefined);
    setValue("");
    setPendingFiles([]);
  };

  return (
    <div className="border-t border-white/10 p-4">
      {pendingFiles.length > 0 && (
        <div className="mb-2 flex flex-wrap gap-2">
          {pendingFiles.map((f, i) => (
            <div key={i} className="flex items-center gap-1 rounded-full bg-white/10 px-3 py-1 text-xs">
              <span className="max-w-[10rem] truncate">{f.name}</span>
              <button onClick={() => setPendingFiles((prev) => prev.filter((_, idx) => idx !== i))}>
                <X className="h-3 w-3" />
              </button>
            </div>
          ))}
        </div>
      )}

      <div className="glass flex items-end gap-2 rounded-2xl p-2">
        <input
          ref={fileInputRef}
          type="file"
          multiple
          accept="image/*,application/pdf"
          className="hidden"
          onChange={(e) => setPendingFiles((prev) => [...prev, ...Array.from(e.target.files ?? [])])}
        />
        <Button
          type="button"
          variant="ghost"
          size="icon"
          className="shrink-0"
          onClick={() => fileInputRef.current?.click()}
        >
          <Paperclip className="h-4 w-4" />
        </Button>

        <Textarea
          value={value}
          onChange={(e) => setValue(e.target.value)}
          onKeyDown={(e) => {
            if (e.key === "Enter" && !e.shiftKey) {
              e.preventDefault();
              handleSubmit();
            }
          }}
          placeholder="Message Zarvis…"
          rows={1}
          className="max-h-40 flex-1 resize-none border-none bg-transparent focus-visible:ring-0"
        />

        {isStreaming ? (
          <Button type="button" size="icon" variant="destructive" onClick={onStop}>
            <Square className="h-4 w-4" />
          </Button>
        ) : (
          <Button type="button" size="icon" onClick={handleSubmit} disabled={!value.trim()}>
            <Send className="h-4 w-4" />
          </Button>
        )}
      </div>
      <p className="mt-2 text-center text-[11px] text-muted-foreground">
        Zarvis can make mistakes. Verify important information.
      </p>
    </div>
  );
}
