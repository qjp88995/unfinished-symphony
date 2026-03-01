import { streamText, stepCountIs, convertToModelMessages } from "ai";
import type { UIMessage } from "ai";
import { z } from "zod";
import { createAIModel } from "@/lib/ai/client";
import { portfolioTools } from "@/lib/ai/tools";

const SYSTEM_PROMPT = `You are a helpful assistant for managing a personal portfolio website.
You have tools to create, read, update, and delete portfolio projects, and to manage AI provider configurations.
When the user asks you to perform an action, use the appropriate tool.
After executing a tool, summarize what you did in a friendly, concise way.
Always confirm destructive actions (delete) with a brief acknowledgment.
Respond in the same language the user uses.
When a user message contains <project id="SOME_ID">@ProjectName</project>, use the id attribute directly as the project ID in tool calls — do not search for the project by name.`;

// Permissive schema: accept UIMessage shape from useChat, enforce size limits
const uiMessageSchema = z.object({
  id: z.string().optional(),
  role: z.enum(["user", "assistant", "system"]),
  content: z.string().max(10_000),
  parts: z.array(z.unknown()).optional(),
  createdAt: z.union([z.string(), z.date()]).optional(),
});

const bodySchema = z.object({
  messages: z.array(uiMessageSchema).max(50),
});

export async function POST(req: Request) {
  const parsed = bodySchema.safeParse(await req.json());
  if (!parsed.success) {
    return Response.json({ error: "Invalid request body" }, { status: 400 });
  }

  let model;
  try {
    model = await createAIModel();
  } catch (error) {
    const message =
      error instanceof Error ? error.message : "AI provider not configured";
    return Response.json({ error: message }, { status: 503 });
  }

  const result = streamText({
    model,
    system: SYSTEM_PROMPT,
    messages: await convertToModelMessages(parsed.data.messages as UIMessage[]),
    // portfolioTools uses `inputSchema` (ai SDK v6 format); cast to any to satisfy
    // the CoreTool union type which still expects `parameters` in some type paths.
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    tools: portfolioTools as any,
    // ai SDK v6 uses `stopWhen` + `stepCountIs` instead of `maxSteps`
    stopWhen: stepCountIs(5),
  });

  return result.toUIMessageStreamResponse({ sendReasoning: true });
}
