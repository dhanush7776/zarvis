import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { extractPdfText } from "@/lib/services/documents";
import { embedText, answerFromDocument } from "@/lib/services/nvidia";

export const runtime = "nodejs";

export async function POST(request: NextRequest) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const formData = await request.formData();
  const file = formData.get("file") as File | null;
  if (!file) return NextResponse.json({ error: "No file provided" }, { status: 400 });

  const arrayBuffer = await file.arrayBuffer();
  const buffer = Buffer.from(arrayBuffer);
  const storagePath = `${user.id}/${Date.now()}-${file.name}`;

  const { error: uploadError } = await supabase.storage.from("documents").upload(storagePath, buffer, {
    contentType: file.type || "application/pdf",
  });
  if (uploadError) return NextResponse.json({ error: uploadError.message }, { status: 500 });

  const { data: doc, error: insertError } = await supabase
    .from("documents")
    .insert({
      user_id: user.id,
      name: file.name,
      storage_path: storagePath,
      mime_type: file.type || "application/pdf",
      size_bytes: buffer.byteLength,
      status: "processing",
    })
    .select("*")
    .single();

  if (insertError || !doc) {
    return NextResponse.json({ error: insertError?.message ?? "Failed to save document" }, { status: 500 });
  }

  try {
    const text = await extractPdfText(buffer);
    const embedding = await embedText(text || file.name);

    await supabase
      .from("documents")
      .update({ content_text: text, embedding, status: "ready" })
      .eq("id", doc.id);

    return NextResponse.json({ document: { ...doc, content_text: text, status: "ready" } });
  } catch (error) {
    await supabase.from("documents").update({ status: "failed" }).eq("id", doc.id);
    const message = error instanceof Error ? error.message : "Failed to process document";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}

export async function PUT(request: NextRequest) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { documentId, question } = (await request.json()) as { documentId: string; question: string };

  const { data: doc } = await supabase
    .from("documents")
    .select("name, content_text")
    .eq("id", documentId)
    .eq("user_id", user.id)
    .single();

  if (!doc?.content_text) {
    return NextResponse.json({ error: "Document not found or not yet processed" }, { status: 404 });
  }

  const answer = await answerFromDocument({
    question,
    documentText: doc.content_text,
    documentName: doc.name,
  });

  return NextResponse.json({ answer });
}
