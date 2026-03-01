"use client";

import {
  forwardRef,
  useEffect,
  useImperativeHandle,
  useState,
} from "react";

interface ProjectItem {
  id: string;
  title: string;
}

interface MentionListProps {
  items: ProjectItem[];
  command: (item: { id: string; label: string }) => void;
}

// Matches SuggestionKeyDownProps from @tiptap/suggestion v3:
// { view: EditorView; event: KeyboardEvent; range: Range }
// We only need `event` here, so we use a structural supertype.
export interface MentionListRef {
  onKeyDown: (props: { event: KeyboardEvent }) => boolean;
}

const MentionList = forwardRef<MentionListRef, MentionListProps>(
  ({ items, command }, ref) => {
    const [selectedIndex, setSelectedIndex] = useState(0);

    // Reset selection when items change
    useEffect(() => setSelectedIndex(0), [items]);

    function selectItem(index: number) {
      const item = items[index];
      if (item) {
        command({ id: item.id, label: item.title });
      }
    }

    useImperativeHandle(ref, () => ({
      onKeyDown({ event }) {
        if (event.key === "ArrowUp") {
          setSelectedIndex((i) => (i + items.length - 1) % Math.max(items.length, 1));
          return true;
        }
        if (event.key === "ArrowDown") {
          setSelectedIndex((i) => (i + 1) % Math.max(items.length, 1));
          return true;
        }
        if (event.key === "Enter") {
          selectItem(selectedIndex);
          return true;
        }
        return false;
      },
    }));

    if (items.length === 0) {
      return (
        <div className="z-50 min-w-40 overflow-hidden rounded-xl border border-border/40 bg-card/95 backdrop-blur-xl shadow-lg p-2">
          <p className="text-[10px] font-mono text-muted-foreground px-2 py-1 uppercase tracking-wider">
            无匹配项目
          </p>
        </div>
      );
    }

    return (
      <div className="z-50 min-w-40 max-h-60 overflow-y-auto rounded-xl border border-border/40 bg-card/95 backdrop-blur-xl shadow-lg p-1.5">
        <p className="text-[9px] font-mono text-muted-foreground/60 px-2 py-1 uppercase tracking-widest mb-0.5">
          项目
        </p>
        {items.map((item, index) => (
          <button
            key={item.id}
            type="button"
            className={`w-full text-left px-2.5 py-1.5 rounded-md text-xs font-mono transition-colors flex items-center gap-2 ${
              index === selectedIndex
                ? "bg-primary/10 text-primary border border-primary/20"
                : "text-foreground hover:bg-muted/50 border border-transparent"
            }`}
            onMouseEnter={() => setSelectedIndex(index)}
            onClick={() => selectItem(index)}
          >
            <span className="text-primary/60 font-bold">@</span>
            <span className="line-clamp-1">{item.title}</span>
          </button>
        ))}
      </div>
    );
  }
);

MentionList.displayName = "MentionList";

export default MentionList;
