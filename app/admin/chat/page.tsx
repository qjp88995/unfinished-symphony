// app/admin/chat/page.tsx
"use client";

import { useState, useRef, useEffect, useCallback } from "react";
import ReactMarkdown from "react-markdown";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import Link from "next/link";

interface Message {
  id: string;
  role: "user" | "assistant";
  content: string;
}

interface ProjectItem {
  id: string;
  title: string;
  description: string;
  techStack: string;
  imageUrl: string | null;
  liveUrl: string | null;
  repoUrl: string | null;
  featured: boolean;
  order: number;
}

function parseTechStack(techStack: string): string[] {
  try {
    return JSON.parse(techStack) as string[];
  } catch {
    return [];
  }
}

function ProjectCard({
  project,
  onSelect,
}: {
  project: ProjectItem;
  onSelect: (title: string) => void;
}) {
  const techs = parseTechStack(project.techStack);
  const visibleTechs = techs.slice(0, 3);
  const extraCount = techs.length - 3;

  return (
    <div
      className="rounded-lg border border-border bg-card p-3 cursor-pointer hover:border-border/80 hover:bg-accent/50 transition-colors"
      onClick={() => onSelect(project.title)}
    >
      {project.imageUrl ? (
        // eslint-disable-next-line @next/next/no-img-element
        <img
          src={project.imageUrl}
          alt={project.title}
          className="w-full h-24 object-cover rounded mb-2"
        />
      ) : (
        <div className="w-full h-24 rounded mb-2 bg-linear-to-br from-violet-600/20 to-blue-600/20 flex items-center justify-center">
          <span className="text-2xl font-bold text-muted-foreground/50">
            {project.title.charAt(0).toUpperCase()}
          </span>
        </div>
      )}

      <div className="flex items-start justify-between gap-1 mb-1">
        <h3 className="text-sm font-medium text-foreground line-clamp-1 flex-1">
          {project.title}
        </h3>
        {project.featured && (
          <span className="text-xs text-yellow-400 shrink-0">⭐</span>
        )}
      </div>

      <p className="text-xs text-muted-foreground line-clamp-1 mb-2">
        {project.description}
      </p>

      {techs.length > 0 && (
        <div className="flex flex-wrap gap-1 mb-2">
          {visibleTechs.map((t) => (
            <Badge
              key={t}
              variant="secondary"
              className="text-xs px-1.5 py-0 bg-secondary/50 text-muted-foreground"
            >
              {t}
            </Badge>
          ))}
          {extraCount > 0 && (
            <Badge
              variant="secondary"
              className="text-xs px-1.5 py-0 bg-secondary/50 text-muted-foreground"
            >
              +{extraCount}
            </Badge>
          )}
        </div>
      )}

      {(project.liveUrl ?? project.repoUrl) && (
        <div className="flex gap-3" onClick={(e) => e.stopPropagation()}>
          {project.liveUrl && (
            <Link
              href={project.liveUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="text-xs text-violet-400 hover:text-violet-300 transition-colors"
            >
              🔗 预览
            </Link>
          )}
          {project.repoUrl && (
            <Link
              href={project.repoUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="text-xs text-muted-foreground hover:text-foreground transition-colors"
            >
              📁 源码
            </Link>
          )}
        </div>
      )}
    </div>
  );
}

export default function ChatPage() {
  const [messages, setMessages] = useState<Message[]>([]);
  const [input, setInput] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState("");
  const [projects, setProjects] = useState<ProjectItem[]>([]);
  const bottomRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLTextAreaElement>(null);

  // Initial project load + SSE subscription for real-time updates
  useEffect(() => {
    let sseHasFired = false;

    const es = new EventSource("/api/projects/events");
    es.addEventListener("project-changed", (e: MessageEvent<string>) => {
      sseHasFired = true;
      try {
        setProjects(JSON.parse(e.data) as ProjectItem[]);
      } catch {
        // ignore malformed event
      }
    });

    fetch("/api/projects")
      .then((r) => r.json())
      .then((d: { success: boolean; data: ProjectItem[] }) => {
        if (!sseHasFired && d.success) setProjects(d.data);
      })
      .catch(() => {});

    return () => es.close();
  }, []);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  function handleProjectSelect(title: string) {
    setInput(`编辑项目「${title}」：`);
    inputRef.current?.focus();
  }

  const sendMessage = useCallback(
    async (userContent: string) => {
      if (!userContent.trim() || isLoading) return;

      const userMessage: Message = {
        id: crypto.randomUUID(),
        role: "user",
        content: userContent.trim(),
      };

      const messagesWithUser = [...messages, userMessage];
      setMessages(messagesWithUser);
      setInput("");
      setIsLoading(true);
      setError("");

      const assistantId = crypto.randomUUID();
      setMessages((prev) => [
        ...prev,
        { id: assistantId, role: "assistant", content: "" },
      ]);

      try {
        const response = await fetch("/api/chat", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            messages: messagesWithUser.map(({ role, content }) => ({
              role,
              content,
            })),
          }),
        });

        if (!response.ok) {
          const data = await response.json().catch(() => ({}));
          throw new Error(
            (data as { error?: string }).error || `Error ${response.status}`,
          );
        }

        const reader = response.body!.getReader();
        const decoder = new TextDecoder();
        let accumulated = "";

        while (true) {
          const { done, value } = await reader.read();
          if (done) break;
          const chunk = decoder.decode(value, { stream: true });
          accumulated += chunk;
          setMessages((prev) =>
            prev.map((m) =>
              m.id === assistantId ? { ...m, content: accumulated } : m,
            ),
          );
        }
      } catch (err) {
        const message = err instanceof Error ? err.message : "出现错误";
        setError(message);
        setMessages((prev) => prev.filter((m) => m.id !== assistantId));
      } finally {
        setIsLoading(false);
      }
    },
    [messages, isLoading],
  );

  function handleKeyDown(e: React.KeyboardEvent<HTMLTextAreaElement>) {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      sendMessage(input);
    }
  }

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    sendMessage(input);
  }

  return (
    <div className="flex h-[calc(100vh-57px)]">
      {/* Left panel: project list */}
      <aside className="w-90 shrink-0 border-r border-border flex flex-col overflow-hidden">
        <div className="px-4 py-3 border-b border-border shrink-0">
          <span className="text-sm font-medium text-foreground">
            项目 ({projects.length})
          </span>
        </div>
        <div className="flex-1 overflow-y-auto p-3 space-y-2">
          {projects.length === 0 ? (
            <p className="text-xs text-muted-foreground text-center py-8">
              暂无项目
            </p>
          ) : (
            projects.map((p) => (
              <ProjectCard
                key={p.id}
                project={p}
                onSelect={handleProjectSelect}
              />
            ))
          )}
        </div>
      </aside>

      {/* Right panel: chat */}
      <div className="flex flex-col flex-1 min-w-0">
        {/* Messages */}
        <div className="flex-1 overflow-y-auto p-6 space-y-4">
          {messages.length === 0 && (
            <div className="text-center text-muted-foreground mt-20">
              <p className="text-lg font-medium text-foreground">作品集管理</p>
              <p className="text-sm mt-2">使用自然语言管理你的作品集。</p>
              <p className="text-xs text-muted-foreground mt-1">
                例如：&quot;添加一个名为 XYZ 的项目，使用 React 和
                TypeScript&quot;
              </p>
            </div>
          )}

          {messages.map((m) => (
            <div
              key={m.id}
              className={`flex ${m.role === "user" ? "justify-end" : "justify-start"}`}
            >
              <div
                className={`max-w-[80%] rounded-xl px-4 py-3 text-sm ${
                  m.role === "user"
                    ? "bg-primary text-primary-foreground"
                    : "bg-muted text-foreground"
                }`}
              >
                {m.role === "assistant" ? (
                  <div className="prose prose-sm prose-invert max-w-none">
                    <ReactMarkdown>{m.content || "…"}</ReactMarkdown>
                  </div>
                ) : (
                  <p className="whitespace-pre-wrap">{m.content}</p>
                )}
              </div>
            </div>
          ))}

          {isLoading && messages[messages.length - 1]?.role !== "assistant" && (
            <div className="flex justify-start">
              <div className="bg-muted rounded-xl px-4 py-3 text-sm text-muted-foreground">
                思考中…
              </div>
            </div>
          )}

          {error && (
            <div className="text-destructive text-sm text-center py-2">
              {error}
            </div>
          )}

          <div ref={bottomRef} />
        </div>

        {/* Input */}
        <div className="border-t border-border p-4 shrink-0">
          <form onSubmit={handleSubmit} className="flex gap-3 items-end">
            <Textarea
              ref={inputRef}
              value={input}
              onChange={(e) => setInput(e.target.value)}
              onKeyDown={handleKeyDown}
              placeholder="输入消息…（Enter 发送，Shift+Enter 换行）"
              className="flex-1 bg-input border-input text-foreground placeholder:text-muted-foreground resize-none min-h-11 max-h-32"
              rows={1}
            />
            <Button type="submit" disabled={isLoading || !input.trim()}>
              发送
            </Button>
          </form>
        </div>
      </div>
    </div>
  );
}
