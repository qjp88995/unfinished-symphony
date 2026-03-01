// app/api/projects/events/route.ts
import { projectEvents } from "@/lib/project-events";

export const dynamic = "force-dynamic";

export async function GET(req: Request) {
  const encoder = new TextEncoder();
  let listener: ((projects: unknown) => void) | null = null;

  function cleanup() {
    if (listener) {
      projectEvents.off("project-changed", listener);
      listener = null;
    }
  }

  // req.signal fires reliably when client disconnects in Next.js App Router
  req.signal.addEventListener("abort", cleanup, { once: true });

  const stream = new ReadableStream({
    start(controller) {
      controller.enqueue(encoder.encode(": keepalive\n\n"));
      controller.enqueue(encoder.encode("retry: 3000\n\n"));

      listener = (projects: unknown) => {
        try {
          const data = JSON.stringify(projects);
          controller.enqueue(
            encoder.encode(`event: project-changed\ndata: ${data}\n\n`),
          );
        } catch (enqueueErr) {
          // Only swallow stream-closed errors, not serialization errors
          const msg =
            enqueueErr instanceof Error ? enqueueErr.message : String(enqueueErr);
          if (!msg.includes("Invalid state")) {
            console.error("[SSE] Unexpected enqueue error:", enqueueErr);
          }
          cleanup();
        }
      };

      projectEvents.on("project-changed", listener);
    },
    cancel: cleanup,
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
