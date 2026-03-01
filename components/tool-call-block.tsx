"use client";

import { useState, useId } from "react";
import {
  ChevronDown,
  ChevronRight,
  CheckCircle2,
  Loader2,
  Wrench,
} from "lucide-react";

interface ToolInvocationCall {
  state: "call" | "partial-call";
  toolCallId: string;
  toolName: string;
  args: unknown;
}
interface ToolInvocationResult extends Omit<ToolInvocationCall, "state"> {
  state: "result";
  result: unknown;
}
type ToolInvocation = ToolInvocationCall | ToolInvocationResult;

interface ToolCallBlockProps {
  toolInvocation: ToolInvocation;
}

export function ToolCallBlock({ toolInvocation }: ToolCallBlockProps) {
  const regionId = useId();
  const [open, setOpen] = useState(false);
  const done = toolInvocation.state === "result";

  return (
    <div className="mb-3 border border-border/40 rounded-lg overflow-hidden text-xs font-mono">
      <button
        type="button"
        aria-expanded={open}
        aria-controls={regionId}
        onClick={() => setOpen((v) => !v)}
        className="w-full flex items-center gap-2 px-3 py-2 bg-muted/20 hover:bg-muted/40 transition-colors text-muted-foreground"
      >
        {open ? (
          <ChevronDown aria-hidden="true" className="size-3 shrink-0" />
        ) : (
          <ChevronRight aria-hidden="true" className="size-3 shrink-0" />
        )}
        {done ? (
          <CheckCircle2
            aria-hidden="true"
            className="size-3 shrink-0 text-primary"
          />
        ) : (
          <Loader2
            aria-hidden="true"
            className="size-3 shrink-0 animate-spin"
          />
        )}
        <Wrench aria-hidden="true" className="size-3 shrink-0" />
        <span className="uppercase tracking-wider text-[10px]">
          {toolInvocation.toolName}
        </span>
      </button>
      {open && (
        <div
          id={regionId}
          role="region"
          aria-label={`工具调用: ${toolInvocation.toolName}`}
          className="divide-y divide-border/40"
        >
          <div className="px-3 py-2 bg-muted/10">
            <p className="text-[10px] uppercase tracking-wider text-muted-foreground/60 mb-1">
              参数
            </p>
            <pre className="text-muted-foreground/80 text-[11px] overflow-x-auto whitespace-pre-wrap break-all">
              {JSON.stringify(toolInvocation.args, null, 2)}
            </pre>
          </div>
          {done && (
            <div className="px-3 py-2 bg-muted/10">
              <p className="text-[10px] uppercase tracking-wider text-muted-foreground/60 mb-1">
                返回
              </p>
              <pre className="text-muted-foreground/80 text-[11px] overflow-x-auto whitespace-pre-wrap break-all">
                {JSON.stringify(
                  (toolInvocation as ToolInvocationResult).result,
                  null,
                  2,
                )}
              </pre>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
