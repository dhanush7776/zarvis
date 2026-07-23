"use client";

import { useEffect, useRef, useState } from "react";
import Image from "next/image";
import { ImageIcon, Upload, Loader2, Trash2, ScanText } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import { CardGridSkeleton } from "@/components/shared/loading-skeleton";
import { useUser } from "@/hooks/useUser";
import { useToast } from "@/components/ui/toast";
import { createClient } from "@/lib/supabase/client";
import type { ImageRow } from "@/types/database";

export default function ImagesPage() {
  const { user } = useUser();
  const { toast } = useToast();
  const [images, setImages] = useState<ImageRow[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isUploading, setIsUploading] = useState(false);
  const [question, setQuestion] = useState("");
  const [activeImage, setActiveImage] = useState<ImageRow | null>(null);
  const [signedUrls, setSignedUrls] = useState<Record<string, string>>({});
  const fileInputRef = useRef<HTMLInputElement>(null);
  const supabase = createClient();

  const load = async () => {
    if (!user) return;
    setIsLoading(true);
    const { data } = await supabase
      .from("images")
      .select("*")
      .eq("user_id", user.id)
      .order("created_at", { ascending: false });
    setImages(data ?? []);

    if (data?.length) {
      const entries = await Promise.all(
        data.map(async (img) => {
          const { data: signed } = await supabase.storage
            .from("images")
            .createSignedUrl(img.storage_path, 3600);
          return [img.id, signed?.signedUrl ?? ""] as const;
        }),
      );
      setSignedUrls(Object.fromEntries(entries));
    }
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
      if (question.trim()) formData.append("question", question);
      const res = await fetch("/api/images/analyze", { method: "POST", body: formData });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error ?? "Analysis failed");
      toast({ title: "Image analyzed", description: file.name, variant: "success" });
      setQuestion("");
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

  const removeImage = async (img: ImageRow) => {
    await supabase.storage.from("images").remove([img.storage_path]);
    await supabase.from("images").delete().eq("id", img.id);
    setImages((prev) => prev.filter((i) => i.id !== img.id));
  };

  return (
    <div className="mx-auto max-w-5xl space-y-6 p-6">
      <div>
        <h1 className="font-display text-2xl font-semibold">Images</h1>
        <p className="text-sm text-muted-foreground">Upload an image for vision analysis and text extraction.</p>
      </div>

      <Card>
        <CardContent className="flex flex-col gap-3 p-5 sm:flex-row sm:items-center">
          <Input
            value={question}
            onChange={(e) => setQuestion(e.target.value)}
            placeholder="Optional: ask a specific question about the image…"
            className="flex-1"
          />
          <input
            ref={fileInputRef}
            type="file"
            accept="image/*"
            className="hidden"
            onChange={(e) => {
              const file = e.target.files?.[0];
              if (file) handleUpload(file);
              e.target.value = "";
            }}
          />
          <Button onClick={() => fileInputRef.current?.click()} disabled={isUploading} className="gap-2">
            {isUploading ? <Loader2 className="h-4 w-4 animate-spin" /> : <Upload className="h-4 w-4" />}
            Upload image
          </Button>
        </CardContent>
      </Card>

      {isLoading ? (
        <CardGridSkeleton />
      ) : images.length === 0 ? (
        <div className="glass flex flex-col items-center gap-3 rounded-2xl p-16 text-center text-muted-foreground">
          <ImageIcon className="h-10 w-10" />
          No images yet. Upload one to see vision analysis and OCR.
        </div>
      ) : (
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {images.map((img) => (
            <Card key={img.id} className="overflow-hidden">
              <button className="relative block h-40 w-full" onClick={() => setActiveImage(img)}>
                {signedUrls[img.id] && (
                  <Image src={signedUrls[img.id]} alt={img.name} fill className="object-cover" unoptimized />
                )}
              </button>
              <CardContent className="flex items-center justify-between gap-2 p-3">
                <p className="truncate text-xs text-muted-foreground">{img.name}</p>
                <Button size="icon" variant="ghost" onClick={() => removeImage(img)}>
                  <Trash2 className="h-3.5 w-3.5 text-rose-400" />
                </Button>
              </CardContent>
            </Card>
          ))}
        </div>
      )}

      <Dialog open={!!activeImage} onOpenChange={(open) => !open && setActiveImage(null)}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle>{activeImage?.name}</DialogTitle>
          </DialogHeader>
          {activeImage && (
            <div className="space-y-4">
              {signedUrls[activeImage.id] && (
                <div className="relative h-64 w-full overflow-hidden rounded-xl">
                  <Image
                    src={signedUrls[activeImage.id]}
                    alt={activeImage.name}
                    fill
                    className="object-contain"
                    unoptimized
                  />
                </div>
              )}
              <Tabs defaultValue="analysis">
                <TabsList>
                  <TabsTrigger value="analysis">Analysis</TabsTrigger>
                  <TabsTrigger value="ocr" className="gap-1">
                    <ScanText className="h-3.5 w-3.5" /> OCR text
                  </TabsTrigger>
                </TabsList>
                <TabsContent value="analysis">
                  <p className="whitespace-pre-wrap text-sm text-muted-foreground">
                    {activeImage.analysis || "No analysis available."}
                  </p>
                </TabsContent>
                <TabsContent value="ocr">
                  <p className="whitespace-pre-wrap text-sm text-muted-foreground">
                    {activeImage.ocr_text || "No text was detected in this image."}
                  </p>
                </TabsContent>
              </Tabs>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}
