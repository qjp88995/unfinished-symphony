// app/admin/chat/page.tsx
"use client";

import { useState, useRef, useEffect } from "react";
import { useEditor, EditorContent, ReactRenderer } from "@tiptap/react";
import StarterKit from "@tiptap/starter-kit";
import Mention from "@tiptap/extension-mention";
import Placeholder from "@tiptap/extension-placeholder";
import tippy, { type Instance as TippyInstance } from "tippy.js";
import { MarkdownRenderer } from "@/components/markdown-renderer";
import { ImagePlus, Loader2, Camera, PlusCircle } from "lucide-react";
import { Button } from "@/components/ui/button";
import Link from "next/link";
import MentionList, { type MentionListRef } from "@/components/mention-list";
import { useChat } from "@ai-sdk/react";
import { ThinkingBlock } from "@/components/thinking-block";
import { ToolCallBlock } from "@/components/tool-call-block";
import type { UIMessage, DynamicToolUIPart, ReasoningUIPart } from "ai";
import { isStaticToolUIPart, getStaticToolName } from "ai";
import { CompressionDivider } from "@/components/compression-divider";
import { ClearDivider } from "@/components/clear-divider";

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
  ctx.drawImage(
    bitmap,
    cropX,
    cropY,
    cropW,
    cropH,
    0,
    0,
    CROP_TARGET_W,
    CROP_TARGET_H,
  );
  bitmap.close();

  return new Promise<File>((resolve, reject) => {
    canvas.toBlob(
      (blob) => {
        if (!blob) {
          reject(new Error("图片处理失败"));
          return;
        }
        resolve(new File([blob], "image.webp", { type: "image/webp" }));
      },
      "image/webp",
      CROP_QUALITY,
    );
  });
}

function parseTechStack(techStack: string): string[] {
  try {
    return JSON.parse(techStack) as string[];
  } catch {
    return [];
  }
}

/** Parse <project id="...">@name</project> tags in user messages */
function renderUserContent(
  content: string,
  isUserMessage = false,
): React.ReactNode {
  const PROJECT_TAG = /<project id="([^"]*)">(.*?)<\/project>/g;
  const parts: React.ReactNode[] = [];
  let lastIndex = 0;
  let key = 0;
  let match: RegExpExecArray | null;

  // Inside a user bubble (bg-primary), use foreground-based colors so the
  // chip is legible against the primary background.
  const chipClass = isUserMessage
    ? "inline-flex items-center px-1.5 py-0.5 rounded-sm font-mono font-bold text-xs bg-primary-foreground/20 text-primary-foreground border border-primary-foreground/30 mx-0.5"
    : "inline-flex items-center px-1.5 py-0.5 rounded-sm font-mono font-bold text-xs bg-primary/10 text-primary border border-primary/20 mx-0.5";

  while ((match = PROJECT_TAG.exec(content)) !== null) {
    if (match.index > lastIndex) {
      parts.push(
        <span key={key++} className="whitespace-pre-wrap">
          {content.slice(lastIndex, match.index)}
        </span>,
      );
    }
    parts.push(
      <span key={key++} className={chipClass}>
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

type AssistantPart = UIMessage["parts"][number];

function AssistantContent({ parts }: { parts: AssistantPart[] }) {
  return (
    <div>
      {parts.map((part, i) => {
        if (part.type === "reasoning") {
          const reasoningPart = part as ReasoningUIPart;
          const done = reasoningPart.state === "done";
          return (
            <ThinkingBlock
              key={`reasoning-${i}`}
              content={reasoningPart.text}
              done={done}
            />
          );
        }
        if (part.type === "dynamic-tool") {
          const toolPart = part as DynamicToolUIPart;
          const state =
            toolPart.state === "output-available" ||
            toolPart.state === "output-error"
              ? "result"
              : toolPart.state === "input-streaming"
                ? "partial-call"
                : "call";
          return (
            <ToolCallBlock
              key={toolPart.toolCallId}
              toolInvocation={
                state === "result"
                  ? {
                      state: "result",
                      toolCallId: toolPart.toolCallId,
                      toolName: toolPart.toolName,
                      args: toolPart.input,
                      result:
                        toolPart.state === "output-error"
                          ? { error: toolPart.errorText }
                          : toolPart.output,
                    }
                  : {
                      state,
                      toolCallId: toolPart.toolCallId,
                      toolName: toolPart.toolName,
                      args: toolPart.input,
                    }
              }
            />
          );
        }
        if (isStaticToolUIPart(part)) {
          const toolName = String(getStaticToolName(part));
          const anyPart = part as {
            toolCallId: string;
            state: string;
            input: unknown;
            output?: unknown;
            errorText?: string;
          };
          const state =
            anyPart.state === "output-available" ||
            anyPart.state === "output-error"
              ? "result"
              : anyPart.state === "input-streaming"
                ? "partial-call"
                : "call";
          return (
            <ToolCallBlock
              key={anyPart.toolCallId}
              toolInvocation={
                state === "result"
                  ? {
                      state: "result",
                      toolCallId: anyPart.toolCallId,
                      toolName,
                      args: anyPart.input,
                      result:
                        anyPart.state === "output-error"
                          ? { error: anyPart.errorText }
                          : anyPart.output,
                    }
                  : {
                      state,
                      toolCallId: anyPart.toolCallId,
                      toolName,
                      args: anyPart.input,
                    }
              }
            />
          );
        }
        if (part.type === "text") {
          const textPart = part as { type: "text"; text: string };
          if (!textPart.text) return null;
          return (
            <MarkdownRenderer
              key={`text-${i}`}
              className="prose prose-sm prose-invert max-w-none font-mono text-xs leading-relaxed"
            >
              {textPart.text}
            </MarkdownRenderer>
          );
        }
        return null;
      })}
    </div>
  );
}

export default function ChatPage() {
  type DisplayItem =
    | { kind: "message"; message: ReturnType<typeof useChat>["messages"][0] }
    | { kind: "compression"; id: string; summary: string }
    | { kind: "clear"; id: string };

  const {
    messages,
    sendMessage,
    status,
    setMessages,
    error: chatError,
  } = useChat();
  const isLoading = status === "submitted" || status === "streaming";
  const [projects, setProjects] = useState<ProjectItem[]>([]);
  const [isEditorEmpty, setIsEditorEmpty] = useState(true);
  const bottomRef = useRef<HTMLDivElement>(null);
  const [isUploading, setIsUploading] = useState(false);
  const [uploadError, setUploadError] = useState("");
  const [uploadingProjectId, setUploadingProjectId] = useState<string | null>(
    null,
  );
  const chatFileInputRef = useRef<HTMLInputElement>(null);
  const projectFileInputRef = useRef<HTMLInputElement>(null);
  const uploadTargetProjectIdRef = useRef<string | null>(null);

  // Ref to avoid stale closure in Tiptap's editorProps.handleKeyDown
  const handleSubmitRef = useRef<() => void>(() => {});
  // Track whether the @mention suggestion dropdown is open
  const isSuggestionActiveRef = useRef(false);

  // Ref to avoid stale closure in Tiptap suggestion's items() callback
  const projectsRef = useRef<ProjectItem[]>([]);
  projectsRef.current = projects; // updated every render

  const [displayItems, setDisplayItems] = useState<DisplayItem[]>([]);
  const historyLoaded = useRef(false);
  const prevMsgCountRef = useRef(0);

  // Initial project load + SSE subscription for real-time updates
  useEffect(() => {
    let sseHasFired = false;

    const es = new EventSource("/api/projects/events");
    es.addEventListener("project-changed", (e: MessageEvent<string>) => {
      sseHasFired = true;
      try {
        setProjects(JSON.parse(e.data) as ProjectItem[]);
      } catch {
        /* ignore malformed event */
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
  }, [displayItems]);

  // 页面挂载时加载聊天历史
  useEffect(() => {
    async function loadHistory() {
      try {
        const res = await fetch("/api/chat/history");
        const data = (await res.json()) as {
          success: boolean;
          data: Array<{
            id: string;
            type: string;
            parts: string | null;
            summary: string | null;
            createdAt: string;
          }>;
        };
        if (!data.success) return;

        const items: DisplayItem[] = [];
        const msgs: UIMessage[] = [];

        for (const record of data.data) {
          if (record.type === "user" || record.type === "assistant") {
            const parsedParts = (() => {
              try {
                return JSON.parse(record.parts ?? "[]") as UIMessage["parts"];
              } catch {
                return [] as UIMessage["parts"];
              }
            })();
            const msg = {
              id: record.id,
              role: record.type as "user" | "assistant",
              parts: parsedParts,
              createdAt: new Date(record.createdAt),
            };
            msgs.push(msg);
            items.push({ kind: "message", message: msg });
          } else if (record.type === "compression" && record.summary) {
            items.push({
              kind: "compression",
              id: record.id,
              summary: record.summary,
            });
          } else if (record.type === "clear") {
            items.push({ kind: "clear", id: record.id });
          }
        }

        setMessages(msgs);
        setDisplayItems(items);
        historyLoaded.current = true;
        prevMsgCountRef.current = msgs.length;
      } catch {
        // 静默失败，不影响正常使用
      }
    }
    void loadHistory();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // 将 useChat 新增的消息同步到 displayItems
  useEffect(() => {
    if (!historyLoaded.current) return;
    if (messages.length > prevMsgCountRef.current) {
      const newMsgs = messages.slice(prevMsgCountRef.current);
      setDisplayItems((prev) => [
        ...prev,
        ...newMsgs.map((m) => ({ kind: "message" as const, message: m })),
      ]);
      prevMsgCountRef.current = messages.length;
    }
  }, [messages]);

  // ── Image upload helpers ─────────────────────────────────────

  async function uploadImage(file: File): Promise<string> {
    const processed = await cropAndCompress(file);
    const ext = "webp";
    const tokenRes = await fetch(
      `/api/upload/token?ext=${encodeURIComponent(ext)}`,
    );
    const tokenData = (await tokenRes.json().catch(() => ({}))) as {
      token?: string;
      key?: string;
      domain?: string;
      uploadUrl?: string;
      error?: string;
    };
    if (!tokenRes.ok) throw new Error(tokenData.error ?? "获取上传凭证失败");
    const { token, key, domain, uploadUrl } = tokenData as {
      token: string;
      key: string;
      domain: string;
      uploadUrl: string;
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
      setUploadError("仅支持 JPG、PNG、GIF、WebP、AVIF 格式");
      return;
    }
    if (file.size > 5 * 1024 * 1024) {
      setUploadError("图片大小不能超过 5MB");
      return;
    }

    setIsUploading(true);
    setUploadError("");
    try {
      const url = await uploadImage(file);
      editor
        ?.chain()
        .focus()
        .insertContent(url + "\n")
        .run();
    } catch (err) {
      setUploadError(err instanceof Error ? err.message : "上传失败");
    } finally {
      setIsUploading(false);
    }
  }

  async function handleProjectFileChange(
    e: React.ChangeEvent<HTMLInputElement>,
  ) {
    const file = e.target.files?.[0];
    const projectId = uploadTargetProjectIdRef.current;
    e.target.value = "";
    if (!file || !projectId) return;
    if (!(ALLOWED_MIME_TYPES as readonly string[]).includes(file.type)) {
      setUploadError("仅支持 JPG、PNG、GIF、WebP、AVIF 格式");
      return;
    }
    if (file.size > 5 * 1024 * 1024) {
      setUploadError("图片大小不能超过 5MB");
      return;
    }

    setUploadingProjectId(projectId);
    setUploadError("");
    try {
      const url = await uploadImage(file);
      const updateRes = await fetch(`/api/projects/${projectId}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ imageUrl: url }),
      });
      if (!updateRes.ok) {
        const body = (await updateRes.json().catch(() => ({}))) as {
          error?: string;
        };
        throw new Error(body.error ?? "更新项目封面失败");
      }
      // SSE will push the updated project list automatically
    } catch (err) {
      setUploadError(err instanceof Error ? err.message : "上传失败");
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
          // Uses projectsRef to avoid a stale closure — items() is captured
          // once by useEditor but projectsRef.current is updated every render.
          items: ({ query }: { query: string }) =>
            projectsRef.current
              .filter((p) =>
                p.title.toLowerCase().includes(query.toLowerCase()),
              )
              .slice(0, 8)
              .map((p) => ({ id: p.id, title: p.title })),

          render: () => {
            let reactRenderer: ReactRenderer<MentionListRef> | null = null;
            let popup: TippyInstance | null = null;

            return {
              onStart: (props) => {
                isSuggestionActiveRef.current = true;
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
                reactRenderer?.updateProps(props);
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
                return reactRenderer?.ref?.onKeyDown(props) ?? false;
              },

              onExit: () => {
                isSuggestionActiveRef.current = false;
                popup?.destroy();
                reactRenderer?.destroy();
              },
            };
          },
        },
      }),
    ],

    editorProps: {
      // Enter to submit, Shift+Enter to insert line break.
      // When the @mention suggestion dropdown is active, let the suggestion
      // plugin handle Enter first (it runs after editorProps in ProseMirror's
      // someProp chain, so we must yield here).
      handleKeyDown: (_view, event) => {
        if (event.key === "Enter" && !event.shiftKey) {
          if (isSuggestionActiveRef.current) return false;
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
          setUploadError("图片大小不能超过 5MB");
          return true;
        }

        setIsUploading(true);
        setUploadError("");
        uploadImage(file)
          .then((url) => {
            editor
              ?.chain()
              .focus()
              .insertContent(url + "\n")
              .run();
          })
          .catch((err: unknown) => {
            setUploadError(err instanceof Error ? err.message : "上传失败");
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
    void sendMessage({ text });
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

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    handleSubmitRef.current();
  }

  async function handleNewSession() {
    try {
      await fetch("/api/chat/history/clear", { method: "POST" });
      setDisplayItems((prev) => [
        ...prev,
        { kind: "clear", id: `clear-${Date.now()}` },
      ]);
    } catch {
      // 静默失败
    }
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
        {/* Chat header */}
        <div className="shrink-0 flex items-center justify-end px-6 py-2 border-b border-border/30">
          <Button
            variant="ghost"
            size="sm"
            className="text-[10px] font-mono text-muted-foreground hover:text-foreground gap-1.5 h-7"
            onClick={() => void handleNewSession()}
          >
            <PlusCircle className="size-3" />
            新对话
          </Button>
        </div>

        {/* Messages */}
        <div className="flex-1 overflow-y-auto p-6 flex flex-col gap-6">
          {displayItems.length === 0 && (
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

          {displayItems.map((item, idx) => {
            if (item.kind === "compression") {
              return (
                <CompressionDivider key={item.id} summary={item.summary} />
              );
            }
            if (item.kind === "clear") {
              return <ClearDivider key={item.id} />;
            }
            const m = item.message;
            return (
              <div
                key={m.id ?? idx}
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
                    <AssistantContent parts={m.parts ?? []} />
                  ) : (
                    <p className="font-mono text-xs tracking-wide">
                      {renderUserContent(
                        m.parts
                          .filter((p) => p.type === "text")
                          .map(
                            (p) => (p as { type: "text"; text: string }).text,
                          )
                          .join(""),
                        true,
                      )}
                    </p>
                  )}
                </div>
              </div>
            );
          })}

          {isLoading && messages[messages.length - 1]?.role !== "assistant" && (
            <div className="flex justify-start">
              <div className="bg-card/50 border border-border rounded-none px-4 py-3 text-xs font-mono flex items-center gap-2 text-muted-foreground backdrop-blur-sm">
                <Loader2 className="size-3 animate-spin text-primary" />
                [PROCESSING_REQUEST...]
              </div>
            </div>
          )}

          {chatError && (
            <div className="text-destructive text-sm text-center py-2">
              {chatError.message}
            </div>
          )}

          {uploadError && (
            <div className="text-destructive text-sm text-center py-2">
              {uploadError}
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
                className="w-full pl-9 pr-4 font-mono text-sm text-foreground min-h-12 max-h-32 overflow-y-auto py-3.5 [&_.ProseMirror]:outline-none [&_.ProseMirror]:wrap-break-word"
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
