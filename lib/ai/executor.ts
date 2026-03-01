// lib/ai/executor.ts
import { prisma } from "@/lib/db";
import { emitProjectChange } from "@/lib/project-events";

type ToolName =
  | "list_projects"
  | "create_project"
  | "update_project"
  | "delete_project"
  | "set_featured"
  | "reorder_projects"
  | "list_providers"
  | "create_provider"
  | "update_provider"
  | "delete_provider"
  | "set_default_provider";

export async function executeToolCall(
  name: ToolName,
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  params: any,
): Promise<unknown> {
  switch (name) {
    case "list_projects": {
      const where =
        params.featured !== undefined ? { featured: params.featured } : {};
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

    case "create_project": {
      const { techStack, ...rest } = params;
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
      const { id, techStack, ...rest } = params;
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
      await prisma.project.delete({ where: { id: params.id } });
      emitProjectChange().catch((err: unknown) =>
        console.error("[executor] emitProjectChange failed:", err),
      );
      return { deleted: true, id: params.id };
    }

    case "set_featured": {
      await prisma.project.updateMany({
        where: { id: { in: params.ids } },
        data: { featured: params.featured },
      });
      emitProjectChange().catch((err: unknown) =>
        console.error("[executor] emitProjectChange failed:", err),
      );
      return { updated: true, count: params.ids.length };
    }

    case "reorder_projects": {
      const orders = (params.orders as { id: string; order: number }[]).slice(
        0,
        100,
      );
      await prisma.$transaction(
        orders.map(({ id, order }) =>
          prisma.project.update({ where: { id }, data: { order } }),
        ),
      );
      emitProjectChange().catch((err: unknown) =>
        console.error("[executor] emitProjectChange failed:", err),
      );
      return { reordered: true, count: orders.length };
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
      if (params.isDefault) {
        await prisma.aIProvider.updateMany({ data: { isDefault: false } });
      }
      const provider = await prisma.aIProvider.create({ data: params });
      return { created: true, id: provider.id, name: provider.name };
    }

    case "update_provider": {
      const { id, ...data } = params;
      if (data.isDefault === true) {
        await prisma.aIProvider.updateMany({ data: { isDefault: false } });
      }
      const provider = await prisma.aIProvider.update({ where: { id }, data });
      return { updated: true, id: provider.id };
    }

    case "delete_provider": {
      await prisma.aIProvider.delete({ where: { id: params.id } });
      return { deleted: true, id: params.id };
    }

    case "set_default_provider": {
      await prisma.aIProvider.updateMany({ data: { isDefault: false } });
      await prisma.aIProvider.update({
        where: { id: params.id },
        data: { isDefault: true },
      });
      return { updated: true, id: params.id };
    }

    default:
      throw new Error(`Unknown tool: ${name}`);
  }
}
