import { NextResponse } from "next/server";
import type {
  ChatCompletionMessageParam,
  ChatCompletionTool,
} from "openai/resources/chat/completions";
import { z } from "zod";
import { getOpenAI, isOpenAIConfigured } from "@/lib/openai/config";
import {
  formatCatalogChatReply,
  searchCatalogForChat,
} from "@/lib/support/catalog-lookup";
import {
  buildSupportSystemPrompt,
  parseSupportReply,
} from "@/lib/support/chat-prompt";
import { matchQuickSupportReply } from "@/lib/support/quick-replies";

const messageSchema = z.object({
  role: z.enum(["user", "agent"]),
  // Allow longer history from earlier verbose replies; we trim before the model.
  text: z.string().trim().min(1).max(8000),
});

const bodySchema = z.object({
  messages: z.array(messageSchema).min(1).max(40),
  online: z.boolean(),
  hoursLabel: z.string().trim().max(120).optional(),
});

const catalogToolArgsSchema = z.object({
  query: z.string().trim().min(1).max(120),
  limit: z.number().int().min(1).max(8).optional(),
});

const SUPPORT_TOOLS: ChatCompletionTool[] = [
  {
    type: "function",
    function: {
      name: "search_catalog",
      description:
        "Search Titan Safety live catalog for products by name, SKU, brand, or keywords. Returns price, stock, ratings, and product page links.",
      parameters: {
        type: "object",
        properties: {
          query: {
            type: "string",
            description: "Product name, SKU, brand, or keywords to search",
          },
          limit: {
            type: "integer",
            description: "Max results (1–8). Default 5.",
          },
        },
        required: ["query"],
        additionalProperties: false,
      },
    },
  },
];

const MAX_TOOL_ROUNDS = 2;
const MODEL_HISTORY_LIMIT = 12;
const MODEL_TEXT_LIMIT = 600;

function trimForModel(
  messages: { role: "user" | "agent"; text: string }[],
): { role: "user" | "agent"; text: string }[] {
  return messages.slice(-MODEL_HISTORY_LIMIT).map((message) => ({
    role: message.role,
    text:
      message.text.length > MODEL_TEXT_LIMIT
        ? `${message.text.slice(0, MODEL_TEXT_LIMIT - 1)}…`
        : message.text,
  }));
}

/**
 * Storefront AI support chat.
 * POST { messages, online, hoursLabel? } → { text, links? }
 */
export async function POST(request: Request) {
  let json: unknown;
  try {
    json = await request.json();
  } catch {
    return NextResponse.json({ error: "Invalid JSON body." }, { status: 400 });
  }

  const parsed = bodySchema.safeParse(json);
  if (!parsed.success) {
    return NextResponse.json(
      { error: "Invalid chat payload.", details: parsed.error.flatten() },
      { status: 400 },
    );
  }

  const { messages, online, hoursLabel = "See support hours" } = parsed.data;
  const last = messages[messages.length - 1];
  if (last.role !== "user") {
    return NextResponse.json(
      { error: "Last message must be from the user." },
      { status: 400 },
    );
  }

  // FAQ / resources / shipping / etc. — instant, no OpenAI required.
  const quick = matchQuickSupportReply(last.text);
  if (quick) {
    return NextResponse.json(quick);
  }

  try {
    // Product hits → compact server-formatted reply (no long model prose / URLs).
    const prefetch = await searchCatalogForChat(last.text, 6);
    if (prefetch.length > 0) {
      return NextResponse.json(formatCatalogChatReply(prefetch));
    }

    if (!isOpenAIConfigured()) {
      return NextResponse.json(
        {
          error:
            "OpenAI is not configured. Add OPENAI_API_KEY to the environment.",
          configured: false,
        },
        { status: 503 },
      );
    }

    const openai = getOpenAI();
    const history = trimForModel(messages);
    const thread: ChatCompletionMessageParam[] = [
      {
        role: "system",
        content: buildSupportSystemPrompt({ online, hoursLabel }),
      },
      {
        role: "system",
        content:
          "Live catalog pre-search returned 0 products for the latest message. You may call search_catalog with a shorter brand/SKU/keyword. If still empty, say you couldn't find it — do not invent items.",
      },
      ...history.map((message) => ({
        role:
          message.role === "agent"
            ? ("assistant" as const)
            : ("user" as const),
        content: message.text,
      })),
    ];

    let raw = "";
    for (let round = 0; round <= MAX_TOOL_ROUNDS; round++) {
      const completion = await openai.chat.completions.create({
        model: "gpt-4o-mini",
        temperature: 0.2,
        max_tokens: 220,
        tools: SUPPORT_TOOLS,
        tool_choice: "auto",
        messages: thread,
      });

      const choice = completion.choices[0]?.message;
      if (!choice) {
        return NextResponse.json(
          { error: "Empty response from OpenAI." },
          { status: 502 },
        );
      }

      const toolCalls = choice.tool_calls;
      if (toolCalls?.length && round < MAX_TOOL_ROUNDS) {
        thread.push({
          role: "assistant",
          content: choice.content,
          tool_calls: toolCalls,
        });

        for (const call of toolCalls) {
          if (call.type !== "function") continue;
          const name = call.function.name;
          let toolPayload: unknown = { error: "Unknown tool" };

          if (name === "search_catalog") {
            let args: unknown = {};
            try {
              args = JSON.parse(call.function.arguments || "{}");
            } catch {
              args = {};
            }
            const argsParsed = catalogToolArgsSchema.safeParse(args);
            if (!argsParsed.success) {
              toolPayload = { error: "Invalid search_catalog arguments." };
            } else {
              const hits = await searchCatalogForChat(
                argsParsed.data.query,
                argsParsed.data.limit ?? 5,
              );
              if (hits.length > 0) {
                return NextResponse.json(formatCatalogChatReply(hits));
              }
              toolPayload = { products: hits, count: hits.length };
            }
          }

          thread.push({
            role: "tool",
            tool_call_id: call.id,
            content: JSON.stringify(toolPayload),
          });
        }
        continue;
      }

      raw = choice.content?.trim() ?? "";
      break;
    }

    if (!raw) {
      return NextResponse.json(
        { error: "Empty response from OpenAI." },
        { status: 502 },
      );
    }

    const reply = parseSupportReply(raw);
    return NextResponse.json({ text: reply.text, links: reply.links });
  } catch (err) {
    return NextResponse.json(
      {
        error:
          err instanceof Error ? err.message : "OpenAI support chat failed.",
      },
      { status: 502 },
    );
  }
}
