// components/compression-divider.tsx
"use client";

import { useState } from "react";
import { ChevronDown, ChevronUp } from "lucide-react";

interface CompressionDividerProps {
  summary: string;
}

export function CompressionDivider({ summary }: CompressionDividerProps) {
  const [expanded, setExpanded] = useState(false);

  return (
    <div className="flex flex-col gap-2 my-2">
      <div className="flex items-center gap-3">
        <div className="flex-1 h-px bg-border/50"></div>
        <button
          onClick={() => setExpanded((v) => !v)}
          className="flex items-center gap-1.5 text-[10px] font-mono text-muted-foreground/70 hover:text-muted-foreground border border-border/40 hover:border-border/70 px-2.5 py-1 rounded-sm transition-colors"
        >
          {expanded ? (
            <ChevronUp className="size-3" />
          ) : (
            <ChevronDown className="size-3" />
          )}
          COMPRESSION
        </button>
        <div className="flex-1 h-px bg-border/50"></div>
      </div>
      {expanded && (
        <div className="mx-auto max-w-xl w-full border border-border/30 bg-card/30 backdrop-blur-sm rounded-sm px-4 py-3">
          <p className="text-[11px] font-mono text-muted-foreground leading-relaxed whitespace-pre-wrap">
            {summary}
          </p>
        </div>
      )}
    </div>
  );
}
