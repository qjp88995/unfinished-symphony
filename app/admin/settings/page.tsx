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
    await fetch(`/api/providers/${id}`, { method: "DELETE" });
    loadProviders();
  }

  async function handleSetDefault(id: string) {
    await fetch(`/api/providers/${id}`, {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ isDefault: true }),
    });
    loadProviders();
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
    <div className="max-w-4xl mx-auto p-6 space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-xl font-semibold">AI 提供商</h1>
          <p className="text-sm text-muted-foreground mt-1">
            配置对话界面使用的 AI 提供商。
          </p>
        </div>
        <Dialog
          open={open}
          onOpenChange={(v) => {
            if (!v) closeDialog();
            else setOpen(v);
          }}
        >
          <DialogTrigger asChild>
            <Button size="sm" onClick={openAdd}>
              添加提供商
            </Button>
          </DialogTrigger>
          <DialogContent className="bg-card border-border text-foreground">
            <DialogHeader>
              <DialogTitle>{editId ? "编辑提供商" : "添加提供商"}</DialogTitle>
            </DialogHeader>
            <div className="space-y-3 mt-2">
              {formFields.map(({ key, label, type }) => (
                <div key={key} className="space-y-1">
                  <label className="text-xs text-muted-foreground">
                    {label}
                  </label>
                  <Input
                    type={type ?? "text"}
                    value={form[key]}
                    onChange={(e) =>
                      setForm((f) => ({ ...f, [key]: e.target.value }))
                    }
                    className="bg-input border-input text-foreground placeholder:text-muted-foreground"
                  />
                </div>
              ))}
              <label className="flex items-center gap-2 text-sm text-foreground cursor-pointer">
                <input
                  type="checkbox"
                  checked={form.isDefault}
                  onChange={(e) =>
                    setForm((f) => ({ ...f, isDefault: e.target.checked }))
                  }
                  className="rounded"
                />
                设为默认提供商
              </label>
              {saveError && (
                <p className="text-sm text-destructive">{saveError}</p>
              )}
              <Button
                onClick={handleSave}
                disabled={
                  saving ||
                  !form.name ||
                  !form.model ||
                  (!editId && !form.apiKey)
                }
                className="w-full"
              >
                {saving ? "保存中…" : "保存"}
              </Button>
            </div>
          </DialogContent>
        </Dialog>
      </div>

      <Table>
        <TableHeader>
          <TableRow className="border-border hover:bg-transparent">
            <TableHead className="text-muted-foreground">名称</TableHead>
            <TableHead className="text-muted-foreground">模型</TableHead>
            <TableHead className="text-muted-foreground">Base URL</TableHead>
            <TableHead className="text-muted-foreground">状态</TableHead>
            <TableHead className="text-right text-muted-foreground">
              操作
            </TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {providers.length === 0 ? (
            <TableRow className="border-border">
              <TableCell
                colSpan={5}
                className="text-center text-muted-foreground py-12"
              >
                尚未配置提供商，请添加一个以使用 AI 对话。
              </TableCell>
            </TableRow>
          ) : (
            providers.map((p) => (
              <TableRow key={p.id} className="border-border">
                <TableCell className="font-medium">{p.name}</TableCell>
                <TableCell className="font-mono text-sm text-muted-foreground">
                  {p.model}
                </TableCell>
                <TableCell className="text-sm text-muted-foreground max-w-50 truncate">
                  {p.baseUrl ?? (
                    <span className="text-muted-foreground">默认</span>
                  )}
                </TableCell>
                <TableCell>
                  {p.isDefault && (
                    <Badge variant="secondary" className="text-xs">
                      默认
                    </Badge>
                  )}
                </TableCell>
                <TableCell className="text-right">
                  <div className="flex justify-end gap-1">
                    {!p.isDefault && (
                      <Button
                        size="sm"
                        variant="ghost"
                        className="text-xs text-muted-foreground hover:text-foreground"
                        onClick={() => handleSetDefault(p.id)}
                      >
                        设为默认
                      </Button>
                    )}
                    <Button
                      size="sm"
                      variant="ghost"
                      className="text-xs text-muted-foreground hover:text-foreground"
                      onClick={() => openEdit(p)}
                    >
                      编辑
                    </Button>
                    <Button
                      size="sm"
                      variant="ghost"
                      className="text-xs text-destructive hover:text-destructive/80"
                      onClick={() => handleDelete(p.id)}
                    >
                      删除
                    </Button>
                  </div>
                </TableCell>
              </TableRow>
            ))
          )}
        </TableBody>
      </Table>
    </div>
  );
}
