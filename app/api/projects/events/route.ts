// app/api/projects/events/route.ts
import { projectEvents } from "@/lib/project-events";

export const dynamic = "force-dynamic";

export async function GET() {
  const encoder = new TextEncoder();
  let listener: ((projects: unknown) => void) | null = null;

  const stream = new ReadableStream({
    start(controller) {
      // Send initial keepalive comment to open the connection
      controller.enqueue(encoder.encode(": keepalive\n\n"));

      listener = (projects: unknown) => {
        try {
          controller.enqueue(
            encoder.encode(
              `event: project-changed\ndata: ${JSON.stringify(projects)}\n\n`,
            ),
          );
        } catch {
          // Client already disconnected — ignore write error
        }
      };

      projectEvents.on("project-changed", listener);
    },
    cancel() {
      if (listener) {
        projectEvents.off("project-changed", listener);
        listener = null;
      }
    },
  });

  return new Response(stream, {
    headers: {
      "Content-Type": "text/event-stream",
      "Cache-Control": "no-cache, no-transform",
      Connection: "keep-alive",
      "X-Accel-Buffering": "no",
    },
  });
}
