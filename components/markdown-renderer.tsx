import ReactMarkdown, { type Components } from "react-markdown";
import remarkGfm from "remark-gfm";
import remarkMath from "remark-math";
import rehypeKatex from "rehype-katex";
import rehypeRaw from "rehype-raw";

/** Chip for <project id="...">name</project> inside AI replies */
function ProjectChip({ children }: { children?: React.ReactNode }) {
  return (
    <span className="inline-flex items-center px-1.5 py-0.5 rounded-sm font-mono font-bold text-xs bg-primary/10 text-primary border border-primary/20 mx-0.5">
      {children}
    </span>
  );
}

// eslint-disable-next-line @typescript-eslint/no-explicit-any
const components: Components = {
  // Custom <project> tag — rendered by rehype-raw as an element node
  ...({ project: ProjectChip } as any),

  // Table — scroll wrapper + bordered style matching dark theme
  table: ({ children }) => (
    <div className="overflow-x-auto my-2">
      <table className="w-full border-collapse text-xs font-mono">
        {children}
      </table>
    </div>
  ),
  thead: ({ children }) => (
    <thead className="border-b border-primary/30 text-primary/80">
      {children}
    </thead>
  ),
  th: ({ children }) => (
    <th className="px-3 py-1.5 text-left font-bold tracking-wider uppercase text-[10px]">
      {children}
    </th>
  ),
  td: ({ children }) => (
    <td className="px-3 py-1.5 border-b border-border/30 text-muted-foreground">
      {children}
    </td>
  ),

  // Inline code
  code: ({ children, className }) => {
    // Block code is wrapped in <pre> by remark, so className contains language-*
    const isBlock = Boolean(className);
    if (isBlock) {
      return <code className={`${className ?? ""} text-xs`}>{children}</code>;
    }
    return (
      <code className="px-1 py-0.5 rounded-sm bg-primary/10 text-primary text-[11px] font-mono">
        {children}
      </code>
    );
  },
};

interface MarkdownRendererProps {
  children: string;
  className?: string;
}

/**
 * Enhanced ReactMarkdown with:
 * - GFM (tables, strikethrough, task lists)
 * - Math formulas via KaTeX ($...$ and $$...$$)
 * - Raw HTML pass-through, including custom <project> tags
 */
export function MarkdownRenderer({
  children,
  className,
}: MarkdownRendererProps) {
  return (
    <div className={className}>
      <ReactMarkdown
        remarkPlugins={[remarkGfm, remarkMath]}
        rehypePlugins={[rehypeRaw, rehypeKatex]}
        components={components}
      >
        {children}
      </ReactMarkdown>
    </div>
  );
}
