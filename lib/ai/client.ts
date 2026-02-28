import { createOpenAI } from '@ai-sdk/openai';
import { createOpenAICompatible } from '@ai-sdk/openai-compatible';
import { prisma } from '@/lib/db';

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
      'No default AI provider configured. Please add one in Settings.'
    );
  }

  return { model: provider.model, apiKey: provider.apiKey, baseUrl: provider.baseUrl };
}

/** 创建 AI 模型实例（基于默认提供商配置）。 */
export async function createAIModel() {
  const config = await getDefaultProviderConfig();

  if (config.baseUrl) {
    // 第三方 OpenAI-compatible 提供商（DeepSeek 等）：使用 Chat Completions API
    const provider = createOpenAICompatible({
      name: 'custom',
      apiKey: config.apiKey,
      baseURL: config.baseUrl,
    });
    return provider(config.model);
  }

  // 原生 OpenAI：使用新 Responses API
  return createOpenAI({ apiKey: config.apiKey })(config.model);
}
