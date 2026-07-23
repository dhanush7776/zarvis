import { GoogleGenerativeAI, type Content, type Part } from "@google/generative-ai";

function getClient() {
  const apiKey = process.env.GEMINI_API_KEY;
  if (!apiKey) {
    throw new Error(
      "GEMINI_API_KEY is not set. Add it to your .env.local file (see .env.example).",
    );
  }
  return new GoogleGenerativeAI(apiKey);
}

const CHAT_MODEL = process.env.GEMINI_CHAT_MODEL || "gemini-2.0-flash";
const VISION_MODEL = process.env.GEMINI_VISION_MODEL || "gemini-2.0-flash";
const EMBEDDING_MODEL = process.env.GEMINI_EMBEDDING_MODEL || "text-embedding-004";

export const ZARVIS_SYSTEM_PROMPT = `You are Zarvis, a premium AI assistant with a calm, confident,
and precise personality — inspired by a next-generation HUD copilot. You help with conversation,
coding (writing, debugging, explaining, optimizing, and translating code between languages),
document understanding, and image analysis. Be direct and concise by default, use Markdown
(including fenced code blocks with a language tag) when it improves clarity, and never invent
facts you are not confident about. When the user references something from an uploaded document
or image, ground your answer in the provided context.`;

export interface ChatTurn {
  role: "user" | "assistant";
  content: string;
}

interface StreamChatOptions {
  history: ChatTurn[];
  message: string;
  memoryContext?: string;
  documentContext?: string;
}

function toGeminiHistory(history: ChatTurn[]): Content[] {
  return history.map((turn) => ({
    role: turn.role === "assistant" ? "model" : "user",
    parts: [{ text: turn.content }],
  }));
}

/**
 * Streams a Gemini chat response as an async generator of text chunks.
 */
export async function* streamChat({
  history,
  message,
  memoryContext,
  documentContext,
}: StreamChatOptions): AsyncGenerator<string> {
  const genAI = getClient();
  const model = genAI.getGenerativeModel({
    model: CHAT_MODEL,
    systemInstruction: ZARVIS_SYSTEM_PROMPT,
  });

  const chat = model.startChat({
    history: toGeminiHistory(history),
    generationConfig: { temperature: 0.7, maxOutputTokens: 4096 },
  });

  let contextPrefix = "";
  if (memoryContext) {
    contextPrefix += `[Relevant memories about the user]\n${memoryContext}\n\n`;
  }
  if (documentContext) {
    contextPrefix += `[Relevant document excerpts]\n${documentContext}\n\n`;
  }

  const finalMessage = contextPrefix ? `${contextPrefix}[User message]\n${message}` : message;

  const result = await chat.sendMessageStream(finalMessage);
  for await (const chunk of result.stream) {
    const text = chunk.text();
    if (text) yield text;
  }
}

/**
 * Analyzes an image with an optional user question. Returns free-form
 * analysis text and, separately, an OCR-focused pass extracting any visible
 * text in the image.
 */
export async function analyzeImage(params: {
  base64: string;
  mimeType: string;
  question?: string;
}): Promise<{ analysis: string; ocrText: string }> {
  const genAI = getClient();
  const model = genAI.getGenerativeModel({ model: VISION_MODEL });

  const imagePart: Part = {
    inlineData: { data: params.base64, mimeType: params.mimeType },
  };

  const analysisPrompt =
    params.question?.trim() ||
    "Describe this image in detail: what it shows, notable objects, context, and anything unusual.";

  const [analysisResult, ocrResult] = await Promise.all([
    model.generateContent([analysisPrompt, imagePart]),
    model.generateContent([
      "Extract all readable text from this image verbatim, preserving line breaks. " +
        "If there is no text, respond with exactly: NO_TEXT_FOUND",
      imagePart,
    ]),
  ]);

  const ocrRaw = ocrResult.response.text().trim();

  return {
    analysis: analysisResult.response.text(),
    ocrText: ocrRaw === "NO_TEXT_FOUND" ? "" : ocrRaw,
  };
}

/**
 * Generates a 768-dim embedding vector for a piece of text, used for
 * document semantic search (stored in the pgvector `embedding` column).
 */
export async function embedText(text: string): Promise<number[]> {
  const genAI = getClient();
  const model = genAI.getGenerativeModel({ model: EMBEDDING_MODEL });
  const result = await model.embedContent(text.slice(0, 20000));
  return result.embedding.values;
}

/**
 * Answers a question about a document by grounding Gemini in the most
 * relevant chunk of extracted text.
 */
export async function answerFromDocument(params: {
  question: string;
  documentText: string;
  documentName: string;
}): Promise<string> {
  const genAI = getClient();
  const model = genAI.getGenerativeModel({
    model: CHAT_MODEL,
    systemInstruction: ZARVIS_SYSTEM_PROMPT,
  });

  const prompt = `Document "${params.documentName}" content:\n\n${params.documentText.slice(
    0,
    30000,
  )}\n\n---\nQuestion: ${params.question}\n\nAnswer using only information from the document above. If the answer isn't in the document, say so clearly.`;

  const result = await model.generateContent(prompt);
  return result.response.text();
}
