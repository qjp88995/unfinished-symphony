import { createOpenAI } from "@ai-sdk/openai";
import { prisma } from "@/lib/db";

export interface ProviderConfig {
  model: string;
  apiKey: string;
  baseUrl?: string | null;
}

/** 从 DB 读取默认 AI 提供商配置。无配置时抛出错误。 */
export async function getDefaultProviderConfig(): Promise<ProviderConfig> {
  const provider = await prisma.aIProvider.findFirst({
    where: { isDefault: true },
  });

  if (!provider) {
    throw new Error(
      "No default AI provider configured. Please add one in Settings.",
    );
  }

  return {
    model: provider.model,
    apiKey: provider.apiKey,
    baseUrl: provider.baseUrl,
  };
}

/** 创建 AI 模型实例（基于默认提供商配置）。 */
export async function createAIModel() {
  const config = await getDefaultProviderConfig();

  const openai = createOpenAI({
    apiKey: config.apiKey,
    baseURL: config.baseUrl ?? undefined,
    // Force Chat Completions API (/chat/completions) instead of the new
    // Responses API (/responses). Third-party OpenAI-compatible providers
    // (DeepSeek, etc.) only implement Chat Completions.
    compatibility: "compatible",
  });

  return openai(config.model);
}
