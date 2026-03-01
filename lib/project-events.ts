// lib/project-events.ts
import { EventEmitter } from "events";
import { prisma } from "@/lib/db";

const globalForEvents = global as typeof globalThis & {
  projectEvents?: EventEmitter;
};

export const projectEvents =
  globalForEvents.projectEvents ?? new EventEmitter();

if (!globalForEvents.projectEvents) {
  projectEvents.setMaxListeners(50); // Support up to 50 concurrent SSE connections
  globalForEvents.projectEvents = projectEvents;
}

/** 查询最新项目列表并广播 project-changed 事件 */
export async function emitProjectChange(): Promise<void> {
  const projects = await prisma.project.findMany({
    orderBy: [{ featured: "desc" }, { order: "asc" }, { createdAt: "desc" }],
  });
  projectEvents.emit("project-changed", projects);
}
