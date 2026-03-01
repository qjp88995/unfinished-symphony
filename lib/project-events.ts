// lib/project-events.ts
import { EventEmitter } from "events";

const globalForEvents = global as typeof globalThis & {
  projectEvents?: EventEmitter;
};

export const projectEvents =
  globalForEvents.projectEvents ?? new EventEmitter();

if (!globalForEvents.projectEvents) {
  projectEvents.setMaxListeners(50); // Support up to 50 concurrent SSE connections
  globalForEvents.projectEvents = projectEvents;
}
