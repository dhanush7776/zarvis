import { NextRequest } from "next/server";
import { createClient } from "@/lib/supabase/server";
import {
  streamChat,
  type ChatTurn,
} from "@/lib/services/nvidia";

export const runtime = "nodejs";

interface ChatRequestBody {
  conversationId?: string;
  history: ChatTurn[];
}


export async function POST(
  request: NextRequest,
) {

  try {

    console.log("[CHAT] Request received");


    const supabase = await createClient();


    const {
      data: {
        user,
      },
    } = await supabase.auth.getUser();


    if (!user) {

      console.log("[CHAT] Unauthorized");

      return new Response(
        "Unauthorized",
        {
          status: 401,
        },
      );
    }


    const body =
      (await request.json()) as ChatRequestBody;


    const {
      history,
    } = body;


    if (
      !history ||
      history.length === 0
    ) {

      return new Response(
        "Missing chat history",
        {
          status: 400,
        },
      );
    }


    const lastMessage =
      history[history.length - 1];


    const previousMessages =
      history.slice(
        0,
        -1,
      );


    console.log(
      "[CHAT] User:",
      user.id,
    );


    console.log(
      "[CHAT] Message:",
      lastMessage.content,
    );


    const {
      data: memories,
      error: memoryError,
    } =
      await supabase
        .from("memories")
        .select(
          "content, importance",
        )
        .eq(
          "user_id",
          user.id,
        )
        .order(
          "importance",
          {
            ascending: false,
          },
        )
        .order(
          "created_at",
          {
            ascending: false,
          },
        )
        .limit(8);



    if (memoryError) {

      console.error(
        "[CHAT] Memory error:",
        memoryError,
      );

    }


    const memoryContext =
      memories?.length
        ? memories
            .map(
              (memory) =>
                `- ${memory.content}`,
            )
            .join("\n")
        : undefined;



    const encoder =
      new TextEncoder();



    const stream =
      new ReadableStream({

        async start(controller) {


          try {


            console.log(
              "[CHAT] Starting NVIDIA stream",
            );


            for await (
              const chunk of streamChat({

                history:
                  previousMessages,

                message:
                  lastMessage.content,

                memoryContext,

              })
            ) {


              console.log(
                "[CHAT] Chunk received",
              );


              controller.enqueue(
                encoder.encode(chunk),
              );

            }


            console.log(
              "[CHAT] Stream finished",
            );


          } catch(error) {


            console.error(
              "[CHAT] Stream error:",
              error,
            );


            const message =
              error instanceof Error
                ? error.message
                : "AI generation failed";


            controller.enqueue(
              encoder.encode(
                `\n\nError: ${message}`,
              ),
            );


          } finally {


            controller.close();


          }

        },

      });



    return new Response(
      stream,
      {
        headers: {

          "Content-Type":
            "text/plain; charset=utf-8",

          "Cache-Control":
            "no-cache, no-transform",

          Connection:
            "keep-alive",

        },
      },
    );



  } catch(error) {


    console.error(
      "[CHAT] Fatal error:",
      error,
    );


    return new Response(
      "Internal server error",
      {
        status: 500,
      },
    );

  }

}
