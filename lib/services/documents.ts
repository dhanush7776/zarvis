import "server-only";

/**
 * Extracts plain text from a PDF buffer using pdf.js's legacy Node build.
 * Runs entirely server-side (Route Handlers only).
 */
export async function extractPdfText(buffer: Buffer): Promise<string> {
  const pdfjs = await import("pdfjs-dist/legacy/build/pdf.mjs");

  const loadingTask = pdfjs.getDocument({
    data: new Uint8Array(buffer),
    useSystemFonts: true,
  });

  const doc = await loadingTask.promise;
  const pageTexts: string[] = [];

  for (let pageNum = 1; pageNum <= doc.numPages; pageNum++) {
    const page = await doc.getPage(pageNum);
    const content = await page.getTextContent();
    const text = content.items
      .map((item) => ("str" in item ? item.str : ""))
      .join(" ");
    pageTexts.push(text);
  }

  return pageTexts.join("\n\n").replace(/[ \t]+/g, " ").trim();
}

/**
 * Splits long document text into overlapping chunks for embedding when the
 * document is large. For most PDFs a single embedding of the first ~20k
 * characters is enough for retrieval quality; this helper exists for
 * documents that need coarse chunk-level context in `answerFromDocument`.
 */
export function chunkText(text: string, chunkSize = 6000, overlap = 400): string[] {
  const chunks: string[] = [];
  let start = 0;
  while (start < text.length) {
    const end = Math.min(start + chunkSize, text.length);
    chunks.push(text.slice(start, end));
    start += chunkSize - overlap;
  }
  return chunks;
}
