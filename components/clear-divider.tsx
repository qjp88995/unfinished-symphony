// components/clear-divider.tsx

export function ClearDivider() {
  return (
    <div className="flex items-center gap-3 my-2">
      <div className="flex-1 h-px bg-border/50"></div>
      <span className="text-[10px] font-mono text-muted-foreground/70 border border-border/40 px-2.5 py-1 rounded-sm">
        新会话
      </span>
      <div className="flex-1 h-px bg-border/50"></div>
    </div>
  );
}
