import {
  streamText,
  stepCountIs,
  convertToModelMessages,
  safeValidateUIMessages,
  type ModelMessage,
} from "ai";
import { z } from "zod";
import { createAIModel } from "@/lib/ai/client";
import { portfolioTools } from "@/lib/ai/tools";
import {
  saveUserMessage,
  saveAssistantMessage,
  maybeCompress,
  loadContextMessages,
} from "@/lib/chat-history";

const BASE_SYSTEM_PROMPT = `You are a helpful assistant for managing a personal portfolio website.
You have tools to create, read, update, and delete portfolio projects, and to manage AI provider configurations.
When the user asks you to perform an action, use the appropriate tool.
After executing a tool, summarize what you did in a friendly, concise way.
Always confirm destructive actions (delete) with a brief acknowledgment.
Respond in the same language the user uses.
When a user message contains <project id="SOME_ID">@ProjectName</project>, use the id attribute directly as the project ID in tool calls — do not search for the project by name.`;

// Validate text parts to enforce per-part size limit.
const textPartSchema = z.object({
  type: z.literal("text"),
  text: z.string().max(10_000),
});

// Permissive schema: accept UIMessage shape from useChat, enforce size limits.
// AI SDK v6 UIMessage uses `parts` (not `content`), so `content` is omitted here.
// Restrict roles to user/assistant only — system role must never come from the client.
const uiMessageSchema = z.object({
  id: z.string(),
  role: z.enum(["user", "assistant"]),
  parts: z
    .array(z.union([textPartSchema, z.record(z.string(), z.unknown())]))
    .max(50),
  metadata: z.unknown().optional(),
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

  const validated = await safeValidateUIMessages({
    messages: parsed.data.messages,
  });
  if (!validated.success) {
    return Response.json({ error: "Invalid message format" }, { status: 400 });
  }

  // 提取最新的用户消息（客户端发来的最后一条）
  const allClientMessages = validated.data;
  const latestUserMessage = allClientMessages[allClientMessages.length - 1];
  if (!latestUserMessage || latestUserMessage.role !== "user") {
    return Response.json(
      { error: "Last message must be from user" },
      { status: 400 },
    );
  }

  let model;
  try {
    model = await createAIModel();
  } catch (error) {
    const message =
      error instanceof Error ? error.message : "AI provider not configured";
    return Response.json({ error: message }, { status: 503 });
  }

  // 从 DB 加载上下文（考虑 compression/clear）
  const { messages: dbMessages, compressionSummary } =
    await loadContextMessages();

  // 构建发给 AI 的消息列表：DB 历史 + 当前用户消息
  const contextUIMessages = [
    ...dbMessages.map((m) => ({
      id: m.id,
      role: m.role,
      parts: m.parts as Parameters<typeof convertToModelMessages>[0][0]["parts"],
    })),
    latestUserMessage,
  ];

  // 构建 system prompt（可能包含压缩摘要）
  const systemPrompt = compressionSummary
    ? `${BASE_SYSTEM_PROMPT}\n\nPrevious conversation summary:\n${compressionSummary}`
    : BASE_SYSTEM_PROMPT;

  // 保存用户消息（立即保存，不等 onFinish）
  const userParts = latestUserMessage.parts.filter(
    (p): p is { type: "text"; text: string } => p.type === "text",
  );
  await saveUserMessage(userParts);

  const result = streamText({
    model,
    system: systemPrompt,
    messages: await convertToModelMessages(contextUIMessages),
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    tools: portfolioTools as any,
    stopWhen: stepCountIs(5),
    onFinish: async ({ response }) => {
      // 保存 assistant 响应并检测压缩
      const responseMessages = response.messages as ModelMessage[];
      await saveAssistantMessage(responseMessages);
      // 压缩检测（异步，不阻塞响应）
      maybeCompress().catch(console.error);
    },
  });

  return result.toUIMessageStreamResponse({ sendReasoning: true });
}
