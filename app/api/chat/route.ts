import { streamText, stepCountIs } from "ai";
import { createAIModel } from "@/lib/ai/client";
import { portfolioTools } from "@/lib/ai/tools";

const SYSTEM_PROMPT = `You are a helpful assistant for managing a personal portfolio website.
You have tools to create, read, update, and delete portfolio projects, and to manage AI provider configurations.
When the user asks you to perform an action, use the appropriate tool.
After executing a tool, summarize what you did in a friendly, concise way.
Always confirm destructive actions (delete) with a brief acknowledgment.
Respond in the same language the user uses.`;

export async function POST(req: Request) {
  const { messages } = await req.json();

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
    messages,
    // portfolioTools uses `inputSchema` (ai SDK v6 format); cast to any to satisfy
    // the CoreTool union type which still expects `parameters` in some type paths.
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    tools: portfolioTools as any,
    // ai SDK v6 uses `stopWhen` + `stepCountIs` instead of `maxSteps`
    stopWhen: stepCountIs(5),
  });

  return result.toTextStreamResponse();
}
