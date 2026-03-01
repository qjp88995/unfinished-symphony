"use client";

import { useState, useEffect, useCallback } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";

interface Provider {
  id: string;
  name: string;
  model: string;
  baseUrl: string | null;
  isDefault: boolean;
}

interface ProviderForm {
  name: string;
  apiKey: string;
  model: string;
  baseUrl: string;
  isDefault: boolean;
}

const emptyForm: ProviderForm = {
  name: "",
  apiKey: "",
  model: "",
  baseUrl: "",
  isDefault: false,
};

export default function SettingsPage() {
  const [providers, setProviders] = useState<Provider[]>([]);
  const [form, setForm] = useState<ProviderForm>(emptyForm);
  const [editId, setEditId] = useState<string | null>(null);
  const [open, setOpen] = useState(false);
  const [saving, setSaving] = useState(false);
  const [saveError, setSaveError] = useState("");
  const [actionError, setActionError] = useState("");

  const loadProviders = useCallback(async () => {
    const res = await fetch("/api/providers");
    const data = await res.json();
    if (data.success) setProviders(data.data);
  }, []);

  useEffect(() => {
    void loadProviders();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  function openAdd() {
    setForm(emptyForm);
    setEditId(null);
    setOpen(true);
  }

  function openEdit(p: Provider) {
    setForm({
      name: p.name,
      apiKey: "",
      model: p.model,
      baseUrl: p.baseUrl ?? "",
      isDefault: p.isDefault,
    });
    setEditId(p.id);
    setOpen(true);
  }

  function closeDialog() {
    setOpen(false);
    setForm(emptyForm);
    setEditId(null);
  }

  async function handleSave() {
    if (!form.name || !form.model) return;
    if (!editId && !form.apiKey) return; // apiKey required for new providers

    setSaving(true);
    setSaveError("");
    const payload: Record<string, unknown> = {
      name: form.name,
      model: form.model,
      baseUrl: form.baseUrl || null,
      isDefault: form.isDefault,
    };
    if (form.apiKey) payload.apiKey = form.apiKey;

    const url = editId ? `/api/providers/${editId}` : "/api/providers";
    const method = editId ? "PUT" : "POST";

    try {
      const res = await fetch(url, {
        method,
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });
      if (!res.ok) {
        const data = await res.json().catch(() => ({}));
        throw new Error(
          (data as { error?: string }).error || `Error ${res.status}`,
        );
      }
      closeDialog();
      loadProviders();
    } catch (err) {
      setSaveError(err instanceof Error ? err.message : "保存失败");
    } finally {
      setSaving(false);
    }
  }

  async function handleDelete(id: string) {
    if (!confirm("确定删除此提供商？")) return;
    setActionError("");
    try {
      const res = await fetch(`/api/providers/${id}`, { method: "DELETE" });
      if (!res.ok) {
        const data = await res.json().catch(() => ({}));
        throw new Error(
          (data as { error?: string }).error || `Error ${res.status}`,
        );
      }
      await loadProviders();
    } catch (err) {
      setActionError(err instanceof Error ? err.message : "删除失败");
    }
  }

  async function handleSetDefault(id: string) {
    setActionError("");
    try {
      const res = await fetch(`/api/providers/${id}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ isDefault: true }),
      });
      if (!res.ok) {
        const data = await res.json().catch(() => ({}));
        throw new Error(
          (data as { error?: string }).error || `Error ${res.status}`,
        );
      }
      await loadProviders();
    } catch (err) {
      setActionError(err instanceof Error ? err.message : "设置默认失败");
    }
  }

  const formFields: Array<{
    key: keyof Omit<ProviderForm, "isDefault">;
    label: string;
    type?: string;
  }> = [
    { key: "name", label: "提供商名称" },
    {
      key: "apiKey",
      label: editId ? "API Key（留空保持不变）" : "API Key",
      type: "password",
    },
    { key: "model", label: "模型（如 gpt-4o、claude-sonnet-4-6）" },
    { key: "baseUrl", label: "Base URL（可选，留空使用默认值）" },
  ];

  return (
    <div className="w-full max-w-4xl mx-auto p-6 space-y-8 relative z-10">
      <div className="flex items-center justify-between border-b border-border/50 pb-6">
        <div className="flex items-center gap-4">
          <div className="w-12 h-12 border border-primary/30 dark:border-primary/50 flex items-center justify-center bg-primary/5 dark:bg-primary/10 shadow-[inset_0_0_15px_rgba(var(--color-primary),0.1)] rounded-xl">
            <span className="text-xl font-mono text-primary animate-pulse">
              ⚙
            </span>
          </div>
          <div>
            <h1 className="text-2xl font-black uppercase tracking-widest text-foreground">
              全局配置 / SYS.CONFIG
            </h1>
            <p className="text-xs font-mono text-muted-foreground/90 dark:text-muted-foreground mt-1 uppercase tracking-wider">
              管理对话终端接口与大语言模型(LLM)提供商网络。
            </p>
          </div>
        </div>
        <Dialog
          open={open}
          onOpenChange={(v) => {
            if (!v) closeDialog();
            else setOpen(v);
          }}
        >
          <DialogTrigger asChild>
            <Button
              size="default"
              onClick={openAdd}
              className="rounded-xl bg-primary text-primary-foreground font-mono text-xs font-bold uppercase tracking-widest hover:bg-primary/90 shadow-[0_4px_14px_rgba(0,0,0,0.1)] dark:shadow-[0_0_15px_rgba(var(--color-primary),0.2)] transition-all hover:-translate-y-0.5"
            >
              + 添 加 节 点
            </Button>
          </DialogTrigger>
          <DialogContent className="bg-background/90 border border-border/50 text-foreground backdrop-blur-2xl shadow-[0_8px_30px_rgba(0,0,0,0.12)] sm:max-w-xl rounded-2xl">
            <DialogHeader className="border-b border-border/50 pb-4 mb-4">
              <DialogTitle className="font-mono text-lg font-bold uppercase tracking-widest flex items-center gap-2">
                <span className="w-2 h-2 bg-primary"></span>
                {editId ? "UPDATE_NODE" : "REGISTER_NEW_NODE"}
              </DialogTitle>
            </DialogHeader>
            <div className="space-y-4">
              {formFields.map(({ key, label, type }) => (
                <div
                  key={key}
                  className="space-y-1.5 focus-within:text-primary transition-colors"
                >
                  <label className="text-[10px] font-mono font-bold uppercase tracking-widest">
                    {label}
                  </label>
                  <Input
                    type={type ?? "text"}
                    value={form[key]}
                    onChange={(e) =>
                      setForm((f) => ({ ...f, [key]: e.target.value }))
                    }
                    className="bg-input/20 border-border/50 focus-visible:border-primary/50 focus-visible:ring-1 focus-visible:ring-primary/20 text-foreground placeholder:text-muted-foreground/30 rounded-xl font-mono text-xs py-5 transition-all"
                  />
                </div>
              ))}
              <label className="flex items-center gap-3 text-xs font-mono uppercase tracking-wider text-foreground cursor-pointer mt-4 bg-muted/20 border border-border/50 p-4 rounded-xl hover:border-primary/30 transition-colors">
                <input
                  type="checkbox"
                  checked={form.isDefault}
                  onChange={(e) =>
                    setForm((f) => ({ ...f, isDefault: e.target.checked }))
                  }
                  className="rounded-none border-primary/50 text-primary focus:ring-primary/50 bg-background"
                />
                设为默认系统提供商 (FORCE_DEFAULT)
              </label>
              {saveError && (
                <p className="text-[10px] font-mono text-destructive uppercase tracking-widest bg-destructive/10 p-2 border border-destructive/30">
                  {saveError}
                </p>
              )}
              <div className="pt-4">
                <Button
                  onClick={handleSave}
                  disabled={
                    saving ||
                    !form.name ||
                    !form.model ||
                    (!editId && !form.apiKey)
                  }
                  className="w-full rounded-xl h-12 bg-primary text-primary-foreground font-mono text-sm font-bold uppercase tracking-[0.2em] shadow-[0_4px_14px_rgba(0,0,0,0.1)] dark:shadow-[0_0_15px_rgba(var(--color-primary),0.2)] hover:bg-primary/90 transition-all hover:-translate-y-0.5"
                >
                  {saving ? "EXECUTING..." : "COMMIT_CHANGES"}
                </Button>
              </div>
            </div>
          </DialogContent>
        </Dialog>
      </div>

      {actionError && (
        <p className="text-[10px] font-mono text-destructive uppercase tracking-widest bg-destructive/10 p-2 border border-destructive/30">
          {actionError}
        </p>
      )}

      <div className="bg-muted/30 dark:bg-card/20 border border-border/80 dark:border-border/40 backdrop-blur-md relative group overflow-hidden rounded-2xl shadow-sm dark:shadow-[4px_0_24px_rgba(0,0,0,0.02)] w-full overflow-x-auto">
        {/* Table frame decorations */}
        <div className="absolute top-0 left-0 w-8 h-8 border-t-2 border-l-2 border-primary/40 z-20 transition-colors group-hover:border-primary/80 rounded-tl-2xl"></div>
        <div className="absolute bottom-0 right-0 w-8 h-8 border-b-2 border-r-2 border-primary/40 z-20 transition-colors group-hover:border-primary/80 rounded-br-2xl"></div>

        <Table className="w-full">
          <TableHeader>
            <TableRow className="border-border/60 bg-muted/40 hover:bg-transparent">
              <TableHead className="text-[10px] font-mono font-bold text-foreground/80 uppercase tracking-widest h-12">
                节点分类/名称
              </TableHead>
              <TableHead className="text-[10px] font-mono font-bold text-foreground/80 uppercase tracking-widest h-12">
                挂载模型
              </TableHead>
              <TableHead className="text-[10px] font-mono font-bold text-foreground/80 uppercase tracking-widest h-12">
                连接协议/Base URL
              </TableHead>
              <TableHead className="text-[10px] font-mono font-bold text-foreground/80 uppercase tracking-widest h-12">
                活动状态
              </TableHead>
              <TableHead className="text-right text-[10px] font-mono font-bold text-foreground/80 uppercase tracking-widest h-12">
                执行操作
              </TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {providers.length === 0 ? (
              <TableRow className="border-border hover:bg-transparent">
                <TableCell
                  colSpan={5}
                  className="text-center text-muted-foreground py-16 w-full"
                >
                  <div className="flex flex-col items-center justify-center space-y-3">
                    <span className="text-2xl font-mono text-muted-foreground/30 animate-pulse">
                      _
                    </span>
                    <p className="text-xs font-mono tracking-widest uppercase">
                      尚未配置提供商，请添加一个以使用 AI 对话。
                    </p>
                  </div>
                </TableCell>
              </TableRow>
            ) : (
              providers.map((p) => (
                <TableRow
                  key={p.id}
                  className="border-border/30 hover:bg-primary/5 transition-colors group/row"
                >
                  <TableCell className="font-mono text-sm font-bold text-foreground">
                    {p.name}
                  </TableCell>
                  <TableCell className="font-mono text-xs text-primary/90 font-bold group-hover/row:text-primary transition-colors">
                    {p.model}
                  </TableCell>
                  <TableCell className="font-mono text-xs text-muted-foreground/90 max-w-50 truncate">
                    {p.baseUrl ?? (
                      <span className="text-muted-foreground/60 italic">
                        SYS_DEFAULT
                      </span>
                    )}
                  </TableCell>
                  <TableCell>
                    {p.isDefault ? (
                      <Badge
                        variant="outline"
                        className="text-[9px] font-mono rounded-md uppercase tracking-widest text-primary border-primary/40 dark:border-primary/50 bg-primary/10 shadow-sm"
                      >
                        SYS_ACTIVE
                      </Badge>
                    ) : (
                      <Badge
                        variant="outline"
                        className="text-[9px] font-mono rounded-md uppercase tracking-widest text-muted-foreground border-border/80 dark:border-border bg-background/50 shadow-sm"
                      >
                        STANDBY
                      </Badge>
                    )}
                  </TableCell>
                  <TableCell className="text-right">
                    <div className="flex justify-end gap-2">
                      {!p.isDefault && (
                        <Button
                          size="sm"
                          variant="outline"
                          className="rounded-lg text-[10px] font-mono uppercase tracking-widest bg-background border-border/80 dark:border-border/60 hover:border-primary/50 hover:text-primary h-8 shadow-sm"
                          onClick={() => handleSetDefault(p.id)}
                        >
                          [SET_ACTIVE]
                        </Button>
                      )}
                      <Button
                        size="sm"
                        variant="outline"
                        className="rounded-lg text-[10px] font-mono uppercase tracking-widest bg-background border-border/80 dark:border-border/60 hover:border-primary/50 hover:text-primary h-8 px-3 shadow-sm"
                        onClick={() => openEdit(p)}
                      >
                        MOD
                      </Button>
                      <Button
                        size="sm"
                        variant="outline"
                        className="rounded-lg text-[10px] font-mono uppercase tracking-widest bg-background border-border/80 dark:border-border/60 hover:border-destructive/50 hover:bg-destructive/10 hover:text-destructive h-8 px-3 shadow-sm"
                        onClick={() => handleDelete(p.id)}
                      >
                        DEL
                      </Button>
                    </div>
                  </TableCell>
                </TableRow>
              ))
            )}
          </TableBody>
        </Table>
      </div>
    </div>
  );
}
