// lib/chat-history.ts
import type { ModelMessage } from "ai";
import { generateText } from "ai";
import { prisma } from "@/lib/db";
import { createAIModel } from "@/lib/ai/client";

const COMPRESSION_PROMPT = `Please summarize the following conversation concisely.
Focus on key decisions, created/modified projects, and important context.
Keep the summary under 500 words.
Respond in the same language as the conversation.`;

// ModelMessage[] → UIMessage parts 格式（用于存储到 DB）
function coreMessagesToParts(messages: ModelMessage[]): object[] {
  const parts: object[] = [];

  // 先收集 tool results
  const toolResults = new Map<string, unknown>();
  for (const msg of messages) {
    if (msg.role === "tool" && Array.isArray(msg.content)) {
      for (const c of msg.content) {
        if (c.type === "tool-result") {
          toolResults.set(c.toolCallId, c.output);
        }
      }
    }
  }

  // 再构建 assistant parts
  for (const msg of messages) {
    if (msg.role === "assistant" && Array.isArray(msg.content)) {
      for (const c of msg.content) {
        if (c.type === "text" && c.text) {
          parts.push({ type: "text", text: c.text });
        } else if (c.type === "tool-call") {
          const result = toolResults.get(c.toolCallId);
          parts.push({
            type: "dynamic-tool",
            toolCallId: c.toolCallId,
            toolName: c.toolName,
            state:
              result !== undefined ? "output-available" : "input-available",
            input: c.input,
            ...(result !== undefined ? { output: result } : {}),
          });
        }
      }
    }
  }

  return parts;
}

/** 保存用户消息到 DB */
export async function saveUserMessage(parts: object[]): Promise<void> {
  await prisma.chatRecord.create({
    data: {
      type: "user",
      parts: JSON.stringify(parts),
    },
  });
}

/** 保存 assistant 响应到 DB（从 onFinish 的 ModelMessage[] 转换） */
export async function saveAssistantMessage(
  coreMessages: ModelMessage[],
): Promise<void> {
  const parts = coreMessagesToParts(coreMessages);
  if (parts.length === 0) return;

  await prisma.chatRecord.create({
    data: {
      type: "assistant",
      parts: JSON.stringify(parts),
    },
  });
}

/** 估算字符数并在达到 70% 阈值时压缩 */
export async function maybeCompress(): Promise<void> {
  const records = await prisma.chatRecord.findMany({
    orderBy: { createdAt: "asc" },
  });

  // 找到最近一条 compression 或 clear 记录
  let lastEventIdx = -1;
  for (let i = records.length - 1; i >= 0; i--) {
    if (records[i].type === "compression" || records[i].type === "clear") {
      lastEventIdx = i;
      break;
    }
  }

  const messagesToCheck =
    lastEventIdx >= 0 ? records.slice(lastEventIdx + 1) : records;
  const messages = messagesToCheck.filter(
    (r) => r.type === "user" || r.type === "assistant",
  );

  // 估算总字符数
  const totalChars = messages.reduce((acc, r) => {
    try {
      const parts = JSON.parse(r.parts ?? "[]") as Array<{
        type: string;
        text?: string;
        input?: unknown;
      }>;
      return (
        acc +
        parts.reduce((a, p) => {
          if (p.type === "text") return a + (p.text?.length ?? 0);
          if (p.type === "dynamic-tool")
            return a + JSON.stringify(p.input ?? {}).length;
          return a;
        }, 0)
      );
    } catch {
      return acc;
    }
  }, 0);

  // 阈值：约 70% × 100k tokens（1 token ≈ 3 字符）
  const THRESHOLD = 210_000;
  if (totalChars < THRESHOLD) return;

  // 生成摘要
  let model;
  try {
    model = await createAIModel();
  } catch {
    return; // AI 未配置时跳过压缩
  }

  const conversationText = messages
    .map((r) => {
      const role = r.type === "user" ? "User" : "Assistant";
      try {
        const parts = JSON.parse(r.parts ?? "[]") as Array<{
          type: string;
          text?: string;
        }>;
        const text = parts
          .filter((p) => p.type === "text")
          .map((p) => p.text ?? "")
          .join("");
        return `${role}: ${text}`;
      } catch {
        return `${role}: [message]`;
      }
    })
    .join("\n\n");

  const { text: summary } = await generateText({
    model,
    system: COMPRESSION_PROMPT,
    prompt: conversationText,
  });

  await prisma.chatRecord.create({
    data: { type: "compression", summary },
  });
}

/** 加载用于发送给 AI 的上下文消息（考虑 compression/clear） */
export async function loadContextMessages(): Promise<{
  messages: Array<{ id: string; role: "user" | "assistant"; parts: object[] }>;
  compressionSummary: string | null;
}> {
  const records = await prisma.chatRecord.findMany({
    orderBy: { createdAt: "asc" },
  });

  // 找到最近一条 compression 或 clear 记录
  let lastEventIdx = -1;
  let compressionSummary: string | null = null;

  for (let i = records.length - 1; i >= 0; i--) {
    if (records[i].type === "compression" || records[i].type === "clear") {
      lastEventIdx = i;
      if (records[i].type === "compression") {
        compressionSummary = records[i].summary;
      }
      break;
    }
  }

  const relevantRecords =
    lastEventIdx >= 0 ? records.slice(lastEventIdx + 1) : records;

  const messages = relevantRecords
    .filter((r) => r.type === "user" || r.type === "assistant")
    .map((r) => ({
      id: r.id,
      role: r.type as "user" | "assistant",
      parts: (() => {
        try {
          return JSON.parse(r.parts ?? "[]") as object[];
        } catch {
          return [];
        }
      })(),
    }));

  return { messages, compressionSummary };
}
