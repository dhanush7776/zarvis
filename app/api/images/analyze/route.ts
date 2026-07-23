import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { analyzeImage } from "@/lib/services/nvidia";

export const runtime = "nodejs";

export async function POST(request: NextRequest) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const formData = await request.formData();
  const file = formData.get("file") as File | null;
  const question = (formData.get("question") as string | null) ?? undefined;
  if (!file) return NextResponse.json({ error: "No file provided" }, { status: 400 });

  const arrayBuffer = await file.arrayBuffer();
  const buffer = Buffer.from(arrayBuffer);
  const base64 = buffer.toString("base64");
  const storagePath = `${user.id}/${Date.now()}-${file.name}`;

  const { error: uploadError } = await supabase.storage.from("images").upload(storagePath, buffer, {
    contentType: file.type || "image/png",
  });
  if (uploadError) return NextResponse.json({ error: uploadError.message }, { status: 500 });

  try {
    const { analysis, ocrText } = await analyzeImage({
      base64,
      mimeType: file.type || "image/png",
      question,
    });

    const { data: image, error: insertError } = await supabase
      .from("images")
      .insert({
        user_id: user.id,
        name: file.name,
        storage_path: storagePath,
        mime_type: file.type || "image/png",
        size_bytes: buffer.byteLength,
        analysis,
        ocr_text: ocrText || null,
      })
      .select("*")
      .single();

    if (insertError) throw new Error(insertError.message);

    return NextResponse.json({ image });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Failed to analyze image";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
