"use client";

import { useState } from "react";
import { BrainCircuit, Plus, Trash2, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectTrigger,
  SelectValue,
  SelectContent,
  SelectItem,
} from "@/components/ui/select";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { useUser } from "@/hooks/useUser";
import { useMemory } from "@/hooks/useMemory";
import { formatDate } from "@/lib/utils";

const CATEGORIES = ["general", "preferences", "work", "people", "goals"];

export default function MemoryPage() {
  const { user } = useUser();
  const { memories, isLoading, addMemory, deleteMemory } = useMemory(user?.id);
  const [open, setOpen] = useState(false);
  const [content, setContent] = useState("");
  const [category, setCategory] = useState("general");
  const [isSaving, setIsSaving] = useState(false);

  const handleAdd = async () => {
    if (!content.trim()) return;
    setIsSaving(true);
    await addMemory(content, category);
    setIsSaving(false);
    setContent("");
    setOpen(false);
  };

  return (
    <div className="mx-auto max-w-4xl space-y-6 p-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="font-display text-2xl font-semibold">Memory</h1>
          <p className="text-sm text-muted-foreground">What Zarvis remembers about you across conversations.</p>
        </div>
        <Button onClick={() => setOpen(true)} className="gap-2">
          <Plus className="h-4 w-4" /> Add memory
        </Button>
      </div>

      {isLoading ? (
        <p className="p-8 text-center text-sm text-muted-foreground">Loading memories…</p>
      ) : memories.length === 0 ? (
        <div className="glass flex flex-col items-center gap-3 rounded-2xl p-16 text-center text-muted-foreground">
          <BrainCircuit className="h-10 w-10" />
          Nothing saved yet. Add a memory so Zarvis remembers it in future conversations.
        </div>
      ) : (
        <div className="space-y-2">
          {memories.map((m) => (
            <Card key={m.id}>
              <CardContent className="flex items-start justify-between gap-3 p-4">
                <div className="space-y-1">
                  <div className="flex items-center gap-2">
                    <Badge variant="secondary">{m.category}</Badge>
                    <span className="text-xs text-muted-foreground">{formatDate(m.created_at)}</span>
                  </div>
                  <p className="text-sm">{m.content}</p>
                </div>
                <Button size="icon" variant="ghost" onClick={() => deleteMemory(m.id)}>
                  <Trash2 className="h-4 w-4 text-rose-400" />
                </Button>
              </CardContent>
            </Card>
          ))}
        </div>
      )}

      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Add a memory</DialogTitle>
          </DialogHeader>
          <div className="space-y-3">
            <Input
              value={content}
              onChange={(e) => setContent(e.target.value)}
              placeholder="e.g. I prefer concise answers with bullet points"
            />
            <Select value={category} onValueChange={setCategory}>
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {CATEGORIES.map((c) => (
                  <SelectItem key={c} value={c}>
                    {c}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            <Button onClick={handleAdd} disabled={isSaving || !content.trim()} className="w-full">
              {isSaving && <Loader2 className="h-4 w-4 animate-spin" />}
              Save memory
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}
