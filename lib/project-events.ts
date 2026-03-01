// lib/project-events.ts
import { EventEmitter } from "events";

export const projectEvents = new EventEmitter();
projectEvents.setMaxListeners(50); // Support up to 50 concurrent SSE connections
