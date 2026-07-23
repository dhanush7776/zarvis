const NVIDIA_BASE_URL = "https://integrate.api.nvidia.com/v1";

function getApiKey(): string {
  const apiKey = process.env.NVIDIA_API_KEY;

  if (!apiKey) {
    throw new Error(
      "NVIDIA_API_KEY is not set. Add it to your .env.local file.",
    );
  }

  return apiKey;
}

const CHAT_MODEL =
  process.env.NVIDIA_CHAT_MODEL || "meta/llama-3.1-8b-instruct";


const VISION_MODEL =
  process.env.NVIDIA_VISION_MODEL || "meta/llama-3.2-11b-vision-instruct";

const EMBEDDING_MODEL =
  process.env.NVIDIA_EMBEDDING_MODEL || "nvidia/nv-embedqa-e5-v5";

export const ZARVIS_SYSTEM_PROMPT = `
You are Zarvis, a premium AI assistant with a calm, confident,
and precise personality.

You help with:
- conversation
- coding
- debugging
- document understanding
- image analysis
- technical explanations

Be concise by default.
Use Markdown when useful.
Never invent facts.
Ground answers in provided context.
`;

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

interface NvidiaChatMessage {
  role: "system" | "user" | "assistant";
  content:
    | string
    | Array<
        | {
            type: "text";
            text: string;
          }
        | {
            type: "image_url";
            image_url: {
              url: string;
            };
          }
      >;
}


/**
 * NVIDIA request helper with:
 * - 30 second timeout
 * - proper error reporting
 * - AbortController support
 */
async function nvidiaFetch(
  path: string,
  body: Record<string, unknown>,
): Promise<Response> {
  const controller = new AbortController();

  const timeout = setTimeout(() => {
    controller.abort();
  }, 30000);

  try {
    const response = await fetch(`${NVIDIA_BASE_URL}${path}`, {
      method: "POST",
      signal: controller.signal,

      headers: {
        Authorization: `Bearer ${getApiKey()}`,
        "Content-Type": "application/json",
        Accept: body.stream
          ? "text/event-stream"
          : "application/json",
      },

      body: JSON.stringify(body),
    });


    if (!response.ok) {
      const errorText = await response.text().catch(() => "");

      throw new Error(
        `NVIDIA API error ${response.status}: ${
          errorText || response.statusText
        }`,
      );
    }


    return response;

  } catch (error) {

    if (
      error instanceof DOMException &&
      error.name === "AbortError"
    ) {
      throw new Error(
        "NVIDIA request timed out after 30 seconds.",
      );
    }

    throw error;

  } finally {

    clearTimeout(timeout);

  }
}


/**
 * Streaming chat completion
 */
export async function* streamChat({
  history,
  message,
  memoryContext,
  documentContext,
}: StreamChatOptions): AsyncGenerator<string> {

  let context = "";

  if (memoryContext) {
    context +=
      `[User memories]\n${memoryContext}\n\n`;
  }

  if (documentContext) {
    context +=
      `[Documents]\n${documentContext}\n\n`;
  }


  const finalMessage = context
    ? `${context}[User]\n${message}`
    : message;


  const messages: NvidiaChatMessage[] = [
    {
      role: "system",
      content: ZARVIS_SYSTEM_PROMPT,
    },

    ...history.map((item) => ({
      role: item.role,
      content: item.content,
    })),

    {
      role: "user",
      content: finalMessage,
    },
  ];


  console.log("Sending request to NVIDIA...");


  const response = await nvidiaFetch(
    "/chat/completions",
    {
      model: CHAT_MODEL,
      messages,
      temperature: 0.7,
      max_tokens: 512,
      stream: true,
    },
  );


  console.log("NVIDIA connected");


  if (!response.body) {
    throw new Error(
      "NVIDIA returned no response stream.",
    );
  }


  const reader = response.body.getReader();

  const decoder = new TextDecoder();

  let buffer = "";


  while (true) {

    const { done, value } =
      await reader.read();


    if (done) {
      break;
    }


    buffer += decoder.decode(value, {
      stream: true,
    });


    const lines = buffer.split("\n");

    buffer = lines.pop() ?? "";


    for (const line of lines) {

      const trimmed = line.trim();


      if (!trimmed.startsWith("data:")) {
        continue;
      }


      const payload =
        trimmed.replace(/^data:\s*/, "");


      if (payload === "[DONE]") {
        return;
      }


      try {
        const json = JSON.parse(payload);

        const token =
          json.choices?.[0]?.delta?.content;


        if (token) {
          yield token;
        }

      } catch {
        // Ignore incomplete SSE chunks
      }
    }
  }
}
/**
 * Analyze an image using NVIDIA vision model.
 */
export async function analyzeImage(params: {
  base64: string;
  mimeType: string;
  question?: string;
}): Promise<{
  analysis: string;
  ocrText: string;
}> {
  const imageUrl =
    `data:${params.mimeType};base64,${params.base64}`;

  const prompt =
    params.question?.trim() ||
    "Describe this image in detail.";

  async function runVision(promptText: string) {
    const response = await nvidiaFetch(
      "/chat/completions",
      {
        model: VISION_MODEL,

        messages: [
          {
            role: "user",
            content: [
              {
                type: "text",
                text: promptText,
              },
              {
                type: "image_url",
                image_url: {
                  url: imageUrl,
                },
              },
            ],
          },
        ],

        temperature: 0.4,
        max_tokens: 1024,
        stream: false,
      },
    );


    const data = await response.json();


    return (
      data.choices?.[0]?.message?.content ?? ""
    ).trim();
  }


  const [analysis, ocr] =
    await Promise.all([
      runVision(prompt),

      runVision(
        "Extract all readable text from this image. " +
        "Preserve line breaks. " +
        "If there is no text respond exactly: NO_TEXT_FOUND",
      ),
    ]);


  return {
    analysis,

    ocrText:
      ocr === "NO_TEXT_FOUND"
        ? ""
        : ocr,
  };
}


/**
 * Generate embeddings for semantic search.
 */
export async function embedText(
  text: string,
  inputType: "passage" | "query" = "passage",
): Promise<number[]> {

  const response = await nvidiaFetch(
    "/embeddings",
    {
      model: EMBEDDING_MODEL,

      input: [
        text.slice(0, 20000),
      ],

      input_type: inputType,

      encoding_format: "float",
    },
  );


  const data = await response.json();


  return (
    data.data?.[0]?.embedding ?? []
  );
}


/**
 * Answer questions from uploaded documents.
 */
export async function answerFromDocument(params: {
  question: string;
  documentText: string;
  documentName: string;
}): Promise<string> {


  const prompt =
`Document:
"${params.documentName}"


Content:

${params.documentText.slice(
  0,
  30000,
)}


Question:
${params.question}


Answer only using information from this document.
If the answer is not present, say that clearly.`;


  const response = await nvidiaFetch(
    "/chat/completions",
    {
      model: CHAT_MODEL,

      messages: [
        {
          role: "system",
          content: ZARVIS_SYSTEM_PROMPT,
        },

        {
          role: "user",
          content: prompt,
        },
      ],

      temperature: 0.3,

      max_tokens: 2048,

      stream: false,
    },
  );


  const data = await response.json();


  return (
    data.choices?.[0]?.message?.content ?? ""
  ).trim();
}
  