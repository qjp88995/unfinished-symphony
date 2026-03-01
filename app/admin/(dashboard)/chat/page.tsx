// app/admin/chat/page.tsx
"use client";

import { useState, useRef, useEffect, useCallback } from "react";
import { useEditor, EditorContent, ReactRenderer } from "@tiptap/react";
import StarterKit from "@tiptap/starter-kit";
import Mention from "@tiptap/extension-mention";
import Placeholder from "@tiptap/extension-placeholder";
import tippy, { type Instance as TippyInstance } from "tippy.js";
import ReactMarkdown from "react-markdown";
import { ImagePlus, Loader2, Camera } from "lucide-react";
import { Button } from "@/components/ui/button";
import Link from "next/link";
import MentionList, { type MentionListRef } from "@/components/mention-list";

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

const CROP_TARGET_W = 800;
const CROP_TARGET_H = 450; // 16:9
const CROP_QUALITY = 0.85;

const ALLOWED_MIME_TYPES = [
  "image/jpeg",
  "image/png",
  "image/gif",
  "image/webp",
  "image/avif",
] as const;

async function cropAndCompress(file: File): Promise<File> {
  const bitmap = await createImageBitmap(file);
  const { width: sw, height: sh } = bitmap;

  const targetRatio = CROP_TARGET_W / CROP_TARGET_H;
  const srcRatio = sw / sh;

  let cropW: number, cropH: number, cropX: number, cropY: number;
  if (srcRatio > targetRatio) {
    cropH = sh;
    cropW = sh * targetRatio;
    cropX = (sw - cropW) / 2;
    cropY = 0;
  } else {
    cropW = sw;
    cropH = sw / targetRatio;
    cropX = 0;
    cropY = (sh - cropH) / 2;
  }

  const canvas = document.createElement("canvas");
  canvas.width = CROP_TARGET_W;
  canvas.height = CROP_TARGET_H;
  const ctx = canvas.getContext("2d");
  if (!ctx) throw new Error("Canvas 2D context unavailable");
  ctx.drawImage(bitmap, cropX, cropY, cropW, cropH, 0, 0, CROP_TARGET_W, CROP_TARGET_H);
  bitmap.close();

  return new Promise<File>((resolve, reject) => {
    canvas.toBlob(
      (blob) => {
        if (!blob) { reject(new Error("图片处理失败")); return; }
        resolve(new File([blob], "image.webp", { type: "image/webp" }));
      },
      "image/webp",
      CROP_QUALITY,
    );
  });
}

function parseTechStack(techStack: string): string[] {
  try { return JSON.parse(techStack) as string[]; }
  catch { return []; }
}

/** Parse <project id="...">@name</project> tags in user messages */
function renderUserContent(content: string): React.ReactNode {
  const PROJECT_TAG = /<project id="([^"]*)">(.*?)<\/project>/g;
  const parts: React.ReactNode[] = [];
  let lastIndex = 0;
  let key = 0;
  let match: RegExpExecArray | null;

  while ((match = PROJECT_TAG.exec(content)) !== null) {
    if (match.index > lastIndex) {
      parts.push(
        <span key={key++} className="whitespace-pre-wrap">
          {content.slice(lastIndex, match.index)}
        </span>,
      );
    }
    parts.push(
      <span
        key={key++}
        className="inline-flex items-center px-1.5 py-0.5 rounded-sm font-mono font-bold text-xs bg-primary/10 text-primary border border-primary/20 mx-0.5"
      >
        {match[2]}
      </span>,
    );
    lastIndex = match.index + match[0].length;
  }

  if (lastIndex < content.length) {
    parts.push(
      <span key={key++} className="whitespace-pre-wrap">
        {content.slice(lastIndex)}
      </span>,
    );
  }

  return parts.length > 0 ? parts : content;
}

function ProjectCard({
  project,
  onSelect,
  onUpload,
  isUploading,
}: {
  project: ProjectItem;
  onSelect: (id: string, title: string) => void;
  onUpload: (projectId: string) => void;
  isUploading: boolean;
}) {
  const techs = parseTechStack(project.techStack);
  const visibleTechs = techs.slice(0, 3);
  const extraCount = techs.length - 3;

  return (
    <div
      className="group relative rounded-xl border border-border/40 bg-card/20 p-4 cursor-pointer hover:border-primary/40 hover:bg-card/50 transition-all duration-300 shadow-sm hover:shadow-md dark:shadow-none dark:hover:shadow-[0_0_15px_rgba(0,243,255,0.15)] flex flex-col backdrop-blur-sm"
      onClick={() => onSelect(project.id, project.title)}
    >
      {/* Tech corner accents */}
      <div className="absolute top-0 right-0 w-6 h-6 bg-[linear-gradient(225deg,var(--color-primary)_50%,transparent_50%)] opacity-0 group-hover:opacity-20 dark:group-hover:opacity-40 transition-opacity z-20 rounded-tr-xl"></div>

      <div className="relative group mb-3 overflow-hidden border border-border/30 rounded-md group-hover:border-primary/30 transition-colors">
        {project.imageUrl ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img
            src={project.imageUrl}
            alt={project.title}
            className="w-full h-28 object-cover transition-transform duration-700 group-hover:scale-105 opacity-90 dark:opacity-75 group-hover:opacity-100"
          />
        ) : (
          <div className="w-full h-28 bg-[linear-gradient(45deg,transparent_25%,rgba(128,128,128,0.05)_50%,transparent_75%,transparent_100%)] bg-size-[10px_10px] bg-background/50 flex items-center justify-center">
            <span className="text-2xl font-mono font-bold text-muted-foreground/30 uppercase">
              {project.title.charAt(0)}
            </span>
          </div>
        )}
        <div
          className="absolute inset-0 bg-background/40 backdrop-blur-sm opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center cursor-pointer"
          onClick={(e) => {
            e.stopPropagation();
            onUpload(project.id);
          }}
        >
          {isUploading ? (
            <Loader2 className="size-5 text-white animate-spin" />
          ) : (
            <Camera className="size-5 text-white" />
          )}
        </div>
      </div>

      <div className="flex items-start justify-between gap-2 mb-2">
        <h3 className="text-sm font-bold text-foreground line-clamp-1 flex-1 uppercase tracking-tight group-hover:text-primary transition-colors">
          {project.title}
        </h3>
        {project.featured && (
          <span className="text-[10px] bg-accent/10 border border-accent/20 text-accent px-1 py-0.5 font-mono uppercase tracking-wider shrink-0">
            Feat
          </span>
        )}
      </div>

      <p className="text-xs text-muted-foreground leading-relaxed line-clamp-2 mb-3 font-light">
        {project.description}
      </p>

      {techs.length > 0 && (
        <div className="flex flex-wrap gap-1.5 mb-3 mt-auto">
          {visibleTechs.map((t) => (
            <span
              key={t}
              className="px-1.5 py-0.5 bg-primary/5 text-[9px] text-primary/80 font-mono border border-primary/20 group-hover:border-primary/40 uppercase tracking-widest rounded-sm"
            >
              {t}
            </span>
          ))}
          {extraCount > 0 && (
            <span className="px-1.5 py-0.5 bg-muted/20 text-[9px] text-muted-foreground font-mono border border-border/50 uppercase rounded-sm">
              +{extraCount}
            </span>
          )}
        </div>
      )}

      {(project.liveUrl ?? project.repoUrl) && (
        <div
          className="flex gap-4 pt-3 border-t border-border/50 items-center justify-between"
          onClick={(e) => e.stopPropagation()}
        >
          <div className="flex gap-4">
            {project.repoUrl && (
              <Link
                href={project.repoUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="text-muted-foreground hover:text-primary transition-colors flex items-center gap-1"
                title="Source Code"
              >
                <span className="text-[10px] font-mono uppercase">SRC</span>
              </Link>
            )}
          </div>
          {project.liveUrl && (
            <Link
              href={project.liveUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="text-[10px] font-mono font-bold text-foreground hover:text-primary uppercase tracking-wider transition-colors flex items-center gap-1 group/link"
            >
              [LAUNCH]
            </Link>
          )}
        </div>
      )}
    </div>
  );
}

export default function ChatPage() {
  const [messages, setMessages] = useState<Message[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState("");
  const [projects, setProjects] = useState<ProjectItem[]>([]);
  const [isEditorEmpty, setIsEditorEmpty] = useState(true);
  const bottomRef = useRef<HTMLDivElement>(null);
  const [isUploading, setIsUploading] = useState(false);
  const [uploadingProjectId, setUploadingProjectId] = useState<string | null>(null);
  const chatFileInputRef = useRef<HTMLInputElement>(null);
  const projectFileInputRef = useRef<HTMLInputElement>(null);
  const uploadTargetProjectIdRef = useRef<string | null>(null);

  // Ref to avoid stale closure in Tiptap's editorProps.handleKeyDown
  const handleSubmitRef = useRef<() => void>(() => {});

  // Initial project load + SSE subscription for real-time updates
  useEffect(() => {
    let sseHasFired = false;

    const es = new EventSource("/api/projects/events");
    es.addEventListener("project-changed", (e: MessageEvent<string>) => {
      sseHasFired = true;
      try { setProjects(JSON.parse(e.data) as ProjectItem[]); }
      catch { /* ignore malformed event */ }
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

  // ── Image upload helpers ─────────────────────────────────────

  async function uploadImage(file: File): Promise<string> {
    const processed = await cropAndCompress(file);
    const ext = "webp";
    const tokenRes = await fetch(`/api/upload/token?ext=${encodeURIComponent(ext)}`);
    const tokenData = (await tokenRes.json().catch(() => ({}))) as {
      token?: string; key?: string; domain?: string; uploadUrl?: string; error?: string;
    };
    if (!tokenRes.ok) throw new Error(tokenData.error ?? "获取上传凭证失败");
    const { token, key, domain, uploadUrl } = tokenData as {
      token: string; key: string; domain: string; uploadUrl: string;
    };

    const form = new FormData();
    form.append("token", token);
    form.append("key", key);
    form.append("file", processed);

    const upRes = await fetch(uploadUrl, { method: "POST", body: form });
    if (!upRes.ok) throw new Error("上传到七牛失败");
    return `${domain}/${key}`;
  }

  async function handleChatFileChange(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    e.target.value = "";
    if (!file) return;
    if (!(ALLOWED_MIME_TYPES as readonly string[]).includes(file.type)) {
      setError("仅支持 JPG、PNG、GIF、WebP、AVIF 格式");
      return;
    }
    if (file.size > 5 * 1024 * 1024) { setError("图片大小不能超过 5MB"); return; }

    setIsUploading(true);
    setError("");
    try {
      const url = await uploadImage(file);
      editor?.chain().focus().insertContent(url + "\n").run();
    } catch (err) {
      setError(err instanceof Error ? err.message : "上传失败");
    } finally {
      setIsUploading(false);
    }
  }

  async function handleProjectFileChange(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    const projectId = uploadTargetProjectIdRef.current;
    e.target.value = "";
    if (!file || !projectId) return;
    if (!(ALLOWED_MIME_TYPES as readonly string[]).includes(file.type)) {
      setError("仅支持 JPG、PNG、GIF、WebP、AVIF 格式");
      return;
    }
    if (file.size > 5 * 1024 * 1024) { setError("图片大小不能超过 5MB"); return; }

    setUploadingProjectId(projectId);
    setError("");
    try {
      const url = await uploadImage(file);
      const updateRes = await fetch(`/api/projects/${projectId}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ imageUrl: url }),
      });
      if (!updateRes.ok) {
        const body = (await updateRes.json().catch(() => ({}))) as { error?: string };
        throw new Error(body.error ?? "更新项目封面失败");
      }
      // SSE will push the updated project list automatically
    } catch (err) {
      setError(err instanceof Error ? err.message : "上传失败");
    } finally {
      setUploadingProjectId(null);
      uploadTargetProjectIdRef.current = null;
    }
  }

  // ── Tiptap editor ────────────────────────────────────────────

  const editor = useEditor({
    immediatelyRender: false, // Required for Next.js SSR compatibility
    extensions: [
      StarterKit.configure({
        // Disable block-level features not needed in a chat input
        heading: false,
        bulletList: false,
        orderedList: false,
        listItem: false,
        blockquote: false,
        codeBlock: false,
        horizontalRule: false,
      }),
      Placeholder.configure({
        placeholder: "输入指令... (Enter 执行，Shift+Enter 换行)",
      }),
      Mention.configure({
        HTMLAttributes: { class: "mention" },
        renderText: ({ node }) =>
          `<project id="${node.attrs.id as string}">@${node.attrs.label as string}</project>`,
        suggestion: {
          // Filter projects matching the query typed after @
          items: ({ query }: { query: string }) =>
            projects
              .filter((p) =>
                p.title.toLowerCase().includes(query.toLowerCase()),
              )
              .slice(0, 8)
              .map((p) => ({ id: p.id, title: p.title })),

          render: () => {
            let reactRenderer: ReactRenderer<MentionListRef>;
            let popup: TippyInstance;

            return {
              onStart: (props) => {
                reactRenderer = new ReactRenderer(MentionList, {
                  props,
                  editor: props.editor,
                });

                if (!props.clientRect) return;

                [popup] = tippy("body", {
                  getReferenceClientRect: props.clientRect as () => DOMRect,
                  appendTo: () => document.body,
                  content: reactRenderer.element,
                  showOnCreate: true,
                  interactive: true,
                  trigger: "manual",
                  placement: "top-start",
                });
              },

              onUpdate: (props) => {
                reactRenderer.updateProps(props);
                if (!props.clientRect) return;
                popup?.setProps({
                  getReferenceClientRect: props.clientRect as () => DOMRect,
                });
              },

              onKeyDown: (props) => {
                if (props.event.key === "Escape") {
                  popup?.hide();
                  return true;
                }
                return reactRenderer.ref?.onKeyDown(props) ?? false;
              },

              onExit: () => {
                popup?.destroy();
                reactRenderer.destroy();
              },
            };
          },
        },
      }),
    ],

    editorProps: {
      // Enter to submit, Shift+Enter to insert line break
      handleKeyDown: (_view, event) => {
        if (event.key === "Enter" && !event.shiftKey) {
          event.preventDefault();
          handleSubmitRef.current();
          return true;
        }
        return false;
      },

      // Image paste support (mirrors original textarea onPaste logic)
      handlePaste: (_view, event) => {
        const items = Array.from(event.clipboardData?.items ?? []);
        const imageItem = items.find(
          (item) =>
            item.kind === "file" &&
            (ALLOWED_MIME_TYPES as readonly string[]).includes(
              item.type as (typeof ALLOWED_MIME_TYPES)[number],
            ),
        );
        if (!imageItem) return false;

        event.preventDefault();
        const file = imageItem.getAsFile();
        if (!file) return false;

        if (file.size > 5 * 1024 * 1024) {
          setError("图片大小不能超过 5MB");
          return true;
        }

        setIsUploading(true);
        setError("");
        uploadImage(file)
          .then((url) => {
            editor?.chain().focus().insertContent(url + "\n").run();
          })
          .catch((err: unknown) => {
            setError(err instanceof Error ? err.message : "上传失败");
          })
          .finally(() => setIsUploading(false));

        return true;
      },
    },

    onUpdate: ({ editor }) => {
      setIsEditorEmpty(editor.isEmpty);
    },
  });

  // Update ref every render so handleKeyDown always uses latest closures
  handleSubmitRef.current = () => {
    if (!editor || editor.isEmpty || isLoading) return;
    const text = editor.getText({ blockSeparator: "\n" });
    editor.commands.clearContent();
    editor.commands.focus();
    sendMessage(text);
  };

  // ── Project card click: insert mention at cursor ─────────────

  function handleProjectSelect(id: string, title: string) {
    if (!editor) return;
    editor
      .chain()
      .focus()
      .insertContent({
        type: "mention",
        attrs: { id, label: title },
      })
      .insertContent(" ") // space after chip for comfortable typing
      .run();
  }

  // ── Send message ─────────────────────────────────────────────

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

        if (!response.body) throw new Error("响应体为空，无法读取流");
        const reader = response.body.getReader();
        const decoder = new TextDecoder();
        let accumulated = "";

        while (true) {
          const { done, value } = await reader.read();
          if (done) break;
          accumulated += decoder.decode(value, { stream: true });
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

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    handleSubmitRef.current();
  }

  // ── Render ───────────────────────────────────────────────────

  return (
    <div className="flex h-0 flex-1">
      {/* Left panel: project list */}
      <aside className="w-90 shrink-0 border-r border-border/40 bg-background/40 backdrop-blur-md flex flex-col overflow-hidden relative z-10 shadow-[4px_0_24px_rgba(0,0,0,0.02)] dark:shadow-[4px_0_24px_rgba(0,0,0,0.2)]">
        <div className="px-5 py-4 border-b border-border/40 shrink-0 bg-card/20 flex items-center justify-between backdrop-blur-sm">
          <div className="flex items-center gap-2.5">
            <span className="relative flex h-2 w-2">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-primary opacity-75"></span>
              <span className="relative inline-flex rounded-full h-2 w-2 bg-primary"></span>
            </span>
            <span className="text-xs font-mono font-bold text-foreground uppercase tracking-widest">
              项目数据库
            </span>
          </div>
          <span className="text-[10px] font-mono text-muted-foreground border border-border/50 bg-background/50 px-2 py-0.5 rounded-sm">
            {projects.length}
          </span>
        </div>
        <div className="flex-1 overflow-y-auto p-4 space-y-4">
          <input
            ref={projectFileInputRef}
            type="file"
            accept="image/*"
            className="hidden"
            onChange={handleProjectFileChange}
          />
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
                onUpload={(projectId) => {
                  uploadTargetProjectIdRef.current = projectId;
                  projectFileInputRef.current?.click();
                }}
                isUploading={uploadingProjectId === p.id}
              />
            ))
          )}
        </div>
      </aside>

      {/* Right panel: chat */}
      <div className="flex flex-col flex-1 min-w-0 relative z-10 bg-background/30 backdrop-blur-sm">
        {/* Messages */}
        <div className="flex-1 overflow-y-auto p-6 flex flex-col gap-6">
          {messages.length === 0 && (
            <div className="flex-1 flex flex-col items-center justify-center text-muted-foreground opacity-80">
              <div className="w-16 h-16 border border-primary/20 bg-primary/5 rounded-2xl flex items-center justify-center mb-6 shadow-sm">
                <span className="text-2xl font-mono text-primary animate-pulse w-4 border-b-2 border-primary"></span>
              </div>
              <p className="text-lg font-mono font-bold text-foreground tracking-widest uppercase mb-2">
                作品集管理控制台
              </p>
              <p className="text-xs font-mono uppercase tracking-wider mb-6 text-primary/70">
                自然语言处理模块已就绪
              </p>
              <div className="border border-border/40 bg-card/40 backdrop-blur-md p-5 max-w-sm rounded-xl shadow-sm">
                <p className="text-[11px] font-mono text-muted-foreground leading-relaxed">
                  &gt; 示例指令: <br />
                  <span className="text-foreground/70">
                    &gt; &quot;添加一个名为 XYZ 的项目，使用 React&quot;
                  </span>{" "}
                  <br />
                  <span className="text-foreground/70">
                    &gt; &quot;点击左侧卡片快速 @提及 项目&quot;
                  </span>
                </p>
              </div>
            </div>
          )}

          {messages.map((m) => (
            <div
              key={m.id}
              className={`flex ${m.role === "user" ? "justify-end" : "justify-start"}`}
            >
              <div
                className={`relative max-w-[80%] rounded-none px-5 py-4 text-sm shadow-sm ${
                  m.role === "user"
                    ? "bg-primary border border-primary/50 text-primary-foreground"
                    : "bg-card/80 dark:bg-card/50 border border-border text-foreground backdrop-blur-sm"
                }`}
              >
                {/* Tech Accents for message bubbles */}
                <div
                  className={`absolute top-0 left-0 w-2 h-2 border-t border-l ${m.role === "user" ? "border-primary-foreground/50" : "border-primary/50"}`}
                ></div>
                <div
                  className={`absolute bottom-0 right-0 w-2 h-2 border-b border-r ${m.role === "user" ? "border-primary-foreground/50" : "border-primary/50"}`}
                ></div>

                {m.role === "assistant" ? (
                  <div className="prose prose-sm prose-invert max-w-none font-mono text-xs leading-relaxed">
                    <ReactMarkdown>{m.content || "…"}</ReactMarkdown>
                  </div>
                ) : (
                  <p className="font-mono text-xs tracking-wide">
                    {renderUserContent(m.content)}
                  </p>
                )}
              </div>
            </div>
          ))}

          {isLoading && messages[messages.length - 1]?.role !== "assistant" && (
            <div className="flex justify-start">
              <div className="bg-card/50 border border-border rounded-none px-4 py-3 text-xs font-mono flex items-center gap-2 text-muted-foreground backdrop-blur-sm">
                <Loader2 className="size-3 animate-spin text-primary" />
                [PROCESSING_REQUEST...]
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
        <div className="border-t border-border/40 bg-background/70 backdrop-blur-xl p-4 shrink-0 relative shadow-[0_-4px_24px_rgba(0,0,0,0.02)]">
          <div className="absolute top-0 left-0 w-full h-px bg-linear-to-r from-transparent via-primary/20 to-transparent"></div>
          <form
            onSubmit={handleSubmit}
            className="flex gap-3 items-end max-w-4xl mx-auto relative group"
          >
            <input
              ref={chatFileInputRef}
              type="file"
              accept="image/*"
              className="hidden"
              onChange={handleChatFileChange}
            />
            <div className="flex-1 relative border border-border/60 rounded-xl focus-within:border-primary/50 focus-within:ring-1 focus-within:ring-primary/20 bg-background/80 shadow-inner transition-all duration-300">
              <div className="absolute left-4 top-3.5 text-primary/70 font-mono text-sm leading-none z-10 font-bold select-none">
                &gt;
              </div>
              {/* Tiptap editor replaces <Textarea> */}
              <EditorContent
                editor={editor}
                className="w-full pl-9 pr-4 font-mono text-sm text-foreground min-h-12 max-h-32 overflow-y-auto py-3.5 [&_.ProseMirror]:outline-none [&_.ProseMirror]:break-words"
              />
            </div>

            <Button
              type="button"
              variant="outline"
              size="icon"
              className="size-12 rounded-xl border-border/60 bg-background/50 hover:border-primary/50 hover:bg-primary/10 hover:text-primary transition-all shrink-0"
              onClick={() => chatFileInputRef.current?.click()}
              disabled={isUploading || isLoading || uploadingProjectId !== null}
              title="Upload media"
            >
              {isUploading ? (
                <Loader2 className="size-4 animate-spin" />
              ) : (
                <ImagePlus className="size-4" />
              )}
            </Button>
            <Button
              type="submit"
              disabled={isLoading || isEditorEmpty}
              className="h-12 rounded-xl bg-primary text-primary-foreground font-mono text-sm font-bold px-8 tracking-widest uppercase hover:bg-primary/90 shadow-[0_4px_14px_rgba(0,0,0,0.1)] dark:shadow-[0_0_15px_rgba(var(--color-primary),0.2)] shrink-0 transition-all hover:-translate-y-0.5"
            >
              执行指令
            </Button>
          </form>
        </div>
      </div>
    </div>
  );
}
