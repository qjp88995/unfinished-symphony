"use client";

import { useState, useId } from "react";
import { ChevronDown, ChevronRight, Brain } from "lucide-react";

interface ThinkingBlockProps {
  content: string;
  done: boolean;
}

export function ThinkingBlock({ content, done }: ThinkingBlockProps) {
  const regionId = useId();
  // Start open while streaming; collapse when done unless user already toggled
  const [userToggled, setUserToggled] = useState(false);
  const [manualOpen, setManualOpen] = useState(true);
  const open = userToggled ? manualOpen : !done;

  return (
    <div className="mb-3 border border-border/40 rounded-lg overflow-hidden text-xs font-mono">
      <button
        type="button"
        aria-expanded={open}
        aria-controls={regionId}
        onClick={() => {
          setUserToggled(true);
          setManualOpen((v) => !v);
        }}
        className="w-full flex items-center gap-2 px-3 py-2 bg-muted/20 hover:bg-muted/40 transition-colors text-muted-foreground"
      >
        {open ? (
          <ChevronDown aria-hidden="true" className="size-3 shrink-0" />
        ) : (
          <ChevronRight aria-hidden="true" className="size-3 shrink-0" />
        )}
        <Brain aria-hidden="true" className="size-3 shrink-0" />
        <span className="uppercase tracking-wider text-[10px]">
          {done ? "查看思考过程" : "思考中..."}
        </span>
        {!done && (
          <span className="ml-auto inline-block size-1.5 rounded-full bg-primary animate-pulse" />
        )}
      </button>
      {open && (
        <div
          id={regionId}
          role="region"
          aria-label="思考过程"
          className="px-3 py-2 bg-muted/10 text-muted-foreground/80 leading-relaxed whitespace-pre-wrap max-h-64 overflow-y-auto"
        >
          {content || "…"}
        </div>
      )}
    </div>
  );
}
