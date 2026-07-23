"use client";

import { useEffect, useRef, useState } from "react";
import { FileText, Upload, Loader2, MessageCircleQuestion, Trash2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from "@/components/ui/dialog";
import { CardGridSkeleton } from "@/components/shared/loading-skeleton";
import { MarkdownRenderer } from "@/components/chat/markdown-renderer";
import { useUser } from "@/hooks/useUser";
import { useToast } from "@/components/ui/toast";
import { createClient } from "@/lib/supabase/client";
import { formatDate } from "@/lib/utils";
import type { DocumentRow } from "@/types/database";

const STATUS_VARIANT: Record<DocumentRow["status"], "default" | "secondary" | "destructive"> = {
  processing: "secondary",
  ready: "default",
  failed: "destructive",
};

export default function DocumentsPage() {
  const { user } = useUser();
  const { toast } = useToast();
  const [documents, setDocuments] = useState<DocumentRow[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isUploading, setIsUploading] = useState(false);
  const [activeDoc, setActiveDoc] = useState<DocumentRow | null>(null);
  const [question, setQuestion] = useState("");
  const [answer, setAnswer] = useState("");
  const [isAsking, setIsAsking] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const supabase = createClient();

  const load = async () => {
    if (!user) return;
    setIsLoading(true);
    const { data } = await supabase
      .from("documents")
      .select("*")
      .eq("user_id", user.id)
      .order("created_at", { ascending: false });
    setDocuments(data ?? []);
    setIsLoading(false);
  };

  useEffect(() => {
    load();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [user]);

  const handleUpload = async (file: File) => {
    setIsUploading(true);
    try {
      const formData = new FormData();
      formData.append("file", file);
      const res = await fetch("/api/documents/process", { method: "POST", body: formData });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error ?? "Upload failed");
      toast({ title: "Document processed", description: file.name, variant: "success" });
      load();
    } catch (err) {
      toast({
        title: "Upload failed",
        description: err instanceof Error ? err.message : "Please try again",
        variant: "error",
      });
    } finally {
      setIsUploading(false);
    }
  };

  const removeDocument = async (doc: DocumentRow) => {
    await supabase.storage.from("documents").remove([doc.storage_path]);
    await supabase.from("documents").delete().eq("id", doc.id);
    setDocuments((prev) => prev.filter((d) => d.id !== doc.id));
  };

  const askQuestion = async () => {
    if (!activeDoc || !question.trim()) return;
    setIsAsking(true);
    setAnswer("");
    try {
      const res = await fetch("/api/documents/process", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ documentId: activeDoc.id, question }),
      });
      const data = await res.json();
      setAnswer(data.answer ?? data.error ?? "No answer available.");
    } finally {
      setIsAsking(false);
    }
  };

  return (
    <div className="mx-auto max-w-5xl space-y-6 p-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="font-display text-2xl font-semibold">Documents</h1>
          <p className="text-sm text-muted-foreground">Upload a PDF and ask Zarvis questions about it.</p>
        </div>
        <input
          ref={fileInputRef}
          type="file"
          accept="application/pdf"
          className="hidden"
          onChange={(e) => {
            const file = e.target.files?.[0];
            if (file) handleUpload(file);
            e.target.value = "";
          }}
        />
        <Button onClick={() => fileInputRef.current?.click()} disabled={isUploading} className="gap-2">
          {isUploading ? <Loader2 className="h-4 w-4 animate-spin" /> : <Upload className="h-4 w-4" />}
          Upload PDF
        </Button>
      </div>

      {isLoading ? (
        <CardGridSkeleton />
      ) : documents.length === 0 ? (
        <div className="glass flex flex-col items-center gap-3 rounded-2xl p-16 text-center text-muted-foreground">
          <FileText className="h-10 w-10" />
          No documents yet. Upload a PDF to get started.
        </div>
      ) : (
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {documents.map((doc) => (
            <Card key={doc.id} className="flex flex-col">
              <CardContent className="flex flex-1 flex-col gap-3 p-5">
                <div className="flex items-start justify-between gap-2">
                  <FileText className="h-8 w-8 shrink-0 text-zarvis-cyan" />
                  <Badge variant={STATUS_VARIANT[doc.status]}>{doc.status}</Badge>
                </div>
                <p className="line-clamp-2 text-sm font-medium">{doc.name}</p>
                <p className="text-xs text-muted-foreground">{formatDate(doc.created_at)}</p>
                <div className="mt-auto flex gap-2 pt-2">
                  <Button
                    size="sm"
                    variant="outline"
                    className="flex-1 gap-1"
                    disabled={doc.status !== "ready"}
                    onClick={() => {
                      setActiveDoc(doc);
                      setAnswer("");
                      setQuestion("");
                    }}
                  >
                    <MessageCircleQuestion className="h-3.5 w-3.5" /> Ask
                  </Button>
                  <Button size="sm" variant="ghost" onClick={() => removeDocument(doc)}>
                    <Trash2 className="h-3.5 w-3.5 text-rose-400" />
                  </Button>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}

      <Dialog open={!!activeDoc} onOpenChange={(open) => !open && setActiveDoc(null)}>
        <DialogContent className="max-w-xl">
          <DialogHeader>
            <DialogTitle>Ask about {activeDoc?.name}</DialogTitle>
            <DialogDescription>Zarvis will answer using only this document's content.</DialogDescription>
          </DialogHeader>
          <div className="space-y-3">
            <div className="flex gap-2">
              <Input
                value={question}
                onChange={(e) => setQuestion(e.target.value)}
                placeholder="What does this document say about…?"
                onKeyDown={(e) => e.key === "Enter" && askQuestion()}
              />
              <Button onClick={askQuestion} disabled={isAsking || !question.trim()}>
                {isAsking ? <Loader2 className="h-4 w-4 animate-spin" /> : "Ask"}
              </Button>
            </div>
            {answer && (
              <div className="glass max-h-72 overflow-y-auto rounded-xl p-4">
                <MarkdownRenderer content={answer} />
              </div>
            )}
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}
