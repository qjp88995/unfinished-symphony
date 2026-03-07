// lib/ai/executor.ts
import { prisma } from "@/lib/db";
import { emitProjectChange } from "@/lib/project-events";

// 每个工具的参数类型
type ToolParams = {
  list_projects: { featured?: boolean };
  get_project: { id: string };
  create_project: {
    title: string;
    description: string;
    techStack?: string[];
    imageUrl?: string | null;
    liveUrl?: string | null;
    repoUrl?: string | null;
    featured?: boolean;
    order?: number;
  };
  update_project: {
    id: string;
    title?: string;
    description?: string;
    techStack?: string[];
    imageUrl?: string | null;
    liveUrl?: string | null;
    repoUrl?: string | null;
    featured?: boolean;
    order?: number;
  };
  delete_project: { id: string };
  set_featured: { ids: string[]; featured: boolean };
  reorder_projects: { orders: { id: string; order: number }[] };
  list_providers: Record<string, never>;
  create_provider: {
    name: string;
    apiKey: string;
    model: string;
    baseUrl?: string | null;
    isDefault?: boolean;
  };
  update_provider: {
    id: string;
    name?: string;
    apiKey?: string;
    model?: string;
    baseUrl?: string | null;
    isDefault?: boolean;
  };
  delete_provider: { id: string };
  set_default_provider: { id: string };
};

type ToolName = keyof ToolParams;

export async function executeToolCall<T extends ToolName>(
  name: T,
  params: ToolParams[T],
): Promise<unknown> {
  switch (name) {
    case "list_projects": {
      const p = params as ToolParams["list_projects"];
      const where = p.featured !== undefined ? { featured: p.featured } : {};
      const projects = await prisma.project.findMany({
        where,
        orderBy: [
          { featured: "desc" },
          { order: "asc" },
          { createdAt: "desc" },
        ],
      });
      return { projects, count: projects.length };
    }

    case "get_project": {
      const { id } = params as ToolParams["get_project"];
      const project = await prisma.project.findUnique({ where: { id } });
      if (!project) {
        return { found: false, error: `Project with ID "${id}" not found` };
      }
      return { found: true, project };
    }

    case "create_project": {
      const { techStack, ...rest } = params as ToolParams["create_project"];
      const project = await prisma.project.create({
        data: {
          ...rest,
          techStack: JSON.stringify(techStack ?? []),
        },
      });
      emitProjectChange().catch((err: unknown) =>
        console.error("[executor] emitProjectChange failed:", err),
      );
      return { created: true, project };
    }

    case "update_project": {
      const { id, techStack, ...rest } = params as ToolParams["update_project"];
      const data: Record<string, unknown> = { ...rest };
      if (techStack !== undefined) {
        data.techStack = JSON.stringify(techStack);
      }
      const project = await prisma.project.update({ where: { id }, data });
      emitProjectChange().catch((err: unknown) =>
        console.error("[executor] emitProjectChange failed:", err),
      );
      return { updated: true, project };
    }

    case "delete_project": {
      const { id } = params as ToolParams["delete_project"];
      await prisma.project.delete({ where: { id } });
      emitProjectChange().catch((err: unknown) =>
        console.error("[executor] emitProjectChange failed:", err),
      );
      return { deleted: true, id };
    }

    case "set_featured": {
      const { ids, featured } = params as ToolParams["set_featured"];
      await prisma.project.updateMany({
        where: { id: { in: ids } },
        data: { featured },
      });
      emitProjectChange().catch((err: unknown) =>
        console.error("[executor] emitProjectChange failed:", err),
      );
      return { updated: true, count: ids.length };
    }

    case "reorder_projects": {
      const { orders } = params as ToolParams["reorder_projects"];
      const capped = orders.slice(0, 100);
      await prisma.$transaction(
        capped.map(({ id, order }) =>
          prisma.project.update({ where: { id }, data: { order } }),
        ),
      );
      emitProjectChange().catch((err: unknown) =>
        console.error("[executor] emitProjectChange failed:", err),
      );
      return { reordered: true, count: capped.length };
    }

    case "list_providers": {
      const providers = await prisma.aIProvider.findMany({
        orderBy: { createdAt: "asc" },
        select: {
          id: true,
          name: true,
          baseUrl: true,
          model: true,
          isDefault: true,
        },
      });
      return { providers };
    }

    case "create_provider": {
      const p = params as ToolParams["create_provider"];
      if (p.isDefault) {
        await prisma.aIProvider.updateMany({ data: { isDefault: false } });
      }
      const provider = await prisma.aIProvider.create({ data: p });
      return { created: true, id: provider.id, name: provider.name };
    }

    case "update_provider": {
      const { id, ...data } = params as ToolParams["update_provider"];
      if (data.isDefault === true) {
        await prisma.aIProvider.updateMany({ data: { isDefault: false } });
      }
      const provider = await prisma.aIProvider.update({ where: { id }, data });
      return { updated: true, id: provider.id };
    }

    case "delete_provider": {
      const { id } = params as ToolParams["delete_provider"];
      await prisma.aIProvider.delete({ where: { id } });
      return { deleted: true, id };
    }

    case "set_default_provider": {
      const { id } = params as ToolParams["set_default_provider"];
      await prisma.aIProvider.updateMany({ data: { isDefault: false } });
      await prisma.aIProvider.update({
        where: { id },
        data: { isDefault: true },
      });
      return { updated: true, id };
    }

    default:
      throw new Error(`Unknown tool: ${name}`);
  }
}
