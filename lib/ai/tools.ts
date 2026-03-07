import { tool } from "ai";
import { z } from "zod";
import { executeToolCall } from "./executor";

export const portfolioTools = {
  list_projects: tool({
    description:
      "List all projects in the portfolio. Optionally filter by featured status.",
    inputSchema: z.object({
      featured: z.boolean().optional().describe("Filter by featured status"),
    }),
    execute: async (params) => executeToolCall("list_projects", params),
  }),

  get_project: tool({
    description: "Get a single project by its ID.",
    inputSchema: z.object({
      id: z.string().describe("Project ID to retrieve"),
    }),
    execute: async (params) => executeToolCall("get_project", params),
  }),

  create_project: tool({
    description: "Create a new portfolio project.",
    inputSchema: z.object({
      title: z.string().describe("Project title"),
      description: z.string().describe("Project description"),
      techStack: z
        .array(z.string())
        .describe('List of technologies, e.g. ["React", "TypeScript"]'),
      imageUrl: z
        .string()
        .url()
        .optional()
        .describe("Screenshot or preview image URL"),
      liveUrl: z.string().url().optional().describe("Live demo URL"),
      repoUrl: z
        .string()
        .url()
        .optional()
        .describe("Source code repository URL"),
      featured: z
        .boolean()
        .optional()
        .default(false)
        .describe("Whether to feature this project"),
      order: z
        .number()
        .int()
        .optional()
        .default(0)
        .describe("Display order (lower = first)"),
    }),
    execute: async (params) => executeToolCall("create_project", params),
  }),

  update_project: tool({
    description:
      "Update fields of an existing project. Only provide fields to change.",
    inputSchema: z.object({
      id: z.string().describe("Project ID to update"),
      title: z.string().optional(),
      description: z.string().optional(),
      techStack: z.array(z.string()).optional(),
      imageUrl: z.string().url().nullable().optional(),
      liveUrl: z.string().url().nullable().optional(),
      repoUrl: z.string().url().nullable().optional(),
      featured: z.boolean().optional(),
      order: z.number().int().optional(),
    }),
    execute: async (params) => executeToolCall("update_project", params),
  }),

  delete_project: tool({
    description: "Delete a project by ID.",
    inputSchema: z.object({
      id: z.string().describe("Project ID to delete"),
    }),
    execute: async (params) => executeToolCall("delete_project", params),
  }),

  set_featured: tool({
    description: "Set the featured status for one or more projects.",
    inputSchema: z.object({
      ids: z.array(z.string()).describe("Project IDs to update"),
      featured: z.boolean().describe("True to feature, false to unfeature"),
    }),
    execute: async (params) => executeToolCall("set_featured", params),
  }),

  reorder_projects: tool({
    description: "Set the display order for projects.",
    inputSchema: z.object({
      orders: z
        .array(
          z.object({
            id: z.string(),
            order: z.number().int(),
          }),
        )
        .describe("Array of {id, order} pairs"),
    }),
    execute: async (params) => executeToolCall("reorder_projects", params),
  }),

  list_providers: tool({
    description: "List all configured AI providers.",
    inputSchema: z.object({}),
    execute: async (params) => executeToolCall("list_providers", params),
  }),

  create_provider: tool({
    description: "Add a new AI provider configuration.",
    inputSchema: z.object({
      name: z.string().describe('Display name, e.g. "OpenAI" or "Anthropic"'),
      apiKey: z.string().describe("API key for this provider"),
      model: z
        .string()
        .describe('Model identifier, e.g. "gpt-4o" or "claude-sonnet-4-6"'),
      baseUrl: z
        .string()
        .url()
        .optional()
        .describe("Custom base URL (leave empty for official API)"),
      isDefault: z
        .boolean()
        .optional()
        .default(false)
        .describe("Set as the default provider"),
    }),
    execute: async (params) => executeToolCall("create_provider", params),
  }),

  update_provider: tool({
    description: "Update an existing AI provider configuration.",
    inputSchema: z.object({
      id: z.string().describe("Provider ID to update"),
      name: z.string().optional(),
      apiKey: z.string().optional(),
      model: z.string().optional(),
      baseUrl: z.string().url().nullable().optional(),
      isDefault: z.boolean().optional(),
    }),
    execute: async (params) => executeToolCall("update_provider", params),
  }),

  delete_provider: tool({
    description: "Delete an AI provider configuration.",
    inputSchema: z.object({
      id: z.string().describe("Provider ID to delete"),
    }),
    execute: async (params) => executeToolCall("delete_provider", params),
  }),

  set_default_provider: tool({
    description: "Set an AI provider as the default.",
    inputSchema: z.object({
      id: z.string().describe("Provider ID to set as default"),
    }),
    execute: async (params) => executeToolCall("set_default_provider", params),
  }),
};
