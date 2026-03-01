"use client";

import { useState } from "react";
import ReactMarkdown, { type Components } from "react-markdown";
import remarkGfm from "remark-gfm";
import remarkMath from "remark-math";
import rehypeKatex from "rehype-katex";
import rehypeRaw from "rehype-raw";
import { Prism as SyntaxHighlighter } from "react-syntax-highlighter";
import { oneDark } from "react-syntax-highlighter/dist/esm/styles/prism";
import { Check, Copy } from "lucide-react";

/** Chip for <project id="...">name</project> inside AI replies */
function ProjectChip({ children }: { children?: React.ReactNode }) {
  return (
    <span className="inline-flex items-center px-1.5 py-0.5 rounded-sm font-mono font-bold text-xs bg-primary/10 text-primary border border-primary/20 mx-0.5">
      {children}
    </span>
  );
}

/** Syntax-highlighted code block with language label + copy button */
function CodeBlock({
  language,
  children,
}: {
  language: string;
  children: string;
}) {
  const [copied, setCopied] = useState(false);

  function handleCopy() {
    void navigator.clipboard.writeText(children).then(() => {
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    });
  }

  return (
    <div className="my-3 rounded-md overflow-hidden border border-border/40 bg-[#282c34]">
      {/* Header bar */}
      <div className="flex items-center justify-between px-3 py-1.5 border-b border-border/30 bg-black/30">
        <span className="text-[10px] font-mono uppercase tracking-widest text-primary/70">
          {language || "code"}
        </span>
        <button
          type="button"
          onClick={handleCopy}
          className="flex items-center gap-1 text-[10px] font-mono text-muted-foreground hover:text-foreground transition-colors"
        >
          {copied ? (
            <Check className="size-3 text-primary" />
          ) : (
            <Copy className="size-3" />
          )}
          {copied ? "已复制" : "复制"}
        </button>
      </div>
      <SyntaxHighlighter
        language={language}
        style={oneDark}
        PreTag="div"
        customStyle={{
          margin: 0,
          padding: "12px 16px",
          background: "transparent",
          fontSize: "11px",
          lineHeight: "1.6",
          fontFamily: "var(--font-geist-mono), monospace",
        }}
        codeTagProps={{ style: { fontFamily: "inherit" } }}
      >
        {children}
      </SyntaxHighlighter>
    </div>
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

  // Let CodeBlock handle the <pre> wrapper
  pre: ({ children }) => <>{children}</>,

  // Block code → SyntaxHighlighter; inline code → styled chip
  code: ({ className, children }) => {
    const match = /language-(\w+)/.exec(className ?? "");
    if (match) {
      return (
        <CodeBlock language={match[1]}>
          {String(children).replace(/\n$/, "")}
        </CodeBlock>
      );
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
 * - Syntax-highlighted code blocks with copy button
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
