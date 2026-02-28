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
      setSaveError(err instanceof Error ? err.message : "Save failed");
    } finally {
      setSaving(false);
    }
  }

  async function handleDelete(id: string) {
    if (!confirm("Delete this provider?")) return;
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
    { key: "name", label: "Provider Name" },
    {
      key: "apiKey",
      label: editId ? "API Key (leave blank to keep current)" : "API Key",
      type: "password",
    },
    { key: "model", label: "Model (e.g. gpt-4o, claude-sonnet-4-6)" },
    { key: "baseUrl", label: "Base URL (optional, leave blank for default)" },
  ];

  return (
    <div className="max-w-4xl mx-auto p-6 space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-xl font-semibold">AI Providers</h1>
          <p className="text-sm text-zinc-400 mt-1">
            Configure the AI providers used in the chat interface.
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
              Add Provider
            </Button>
          </DialogTrigger>
          <DialogContent className="bg-zinc-900 border-zinc-800 text-white">
            <DialogHeader>
              <DialogTitle>
                {editId ? "Edit Provider" : "Add Provider"}
              </DialogTitle>
            </DialogHeader>
            <div className="space-y-3 mt-2">
              {formFields.map(({ key, label, type }) => (
                <div key={key} className="space-y-1">
                  <label className="text-xs text-zinc-400">{label}</label>
                  <Input
                    type={type ?? "text"}
                    value={form[key]}
                    onChange={(e) =>
                      setForm((f) => ({ ...f, [key]: e.target.value }))
                    }
                    className="bg-zinc-800 border-zinc-700 text-white placeholder:text-zinc-500"
                  />
                </div>
              ))}
              <label className="flex items-center gap-2 text-sm text-zinc-300 cursor-pointer">
                <input
                  type="checkbox"
                  checked={form.isDefault}
                  onChange={(e) =>
                    setForm((f) => ({ ...f, isDefault: e.target.checked }))
                  }
                  className="rounded"
                />
                Set as default provider
              </label>
              {saveError && <p className="text-sm text-red-400">{saveError}</p>}
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
                {saving ? "Saving\u2026" : "Save"}
              </Button>
            </div>
          </DialogContent>
        </Dialog>
      </div>

      <Table>
        <TableHeader>
          <TableRow className="border-zinc-800 hover:bg-transparent">
            <TableHead className="text-zinc-400">Name</TableHead>
            <TableHead className="text-zinc-400">Model</TableHead>
            <TableHead className="text-zinc-400">Base URL</TableHead>
            <TableHead className="text-zinc-400">Status</TableHead>
            <TableHead className="text-right text-zinc-400">Actions</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {providers.length === 0 ? (
            <TableRow className="border-zinc-800">
              <TableCell
                colSpan={5}
                className="text-center text-zinc-500 py-12"
              >
                No providers configured yet. Add one to start using the AI chat.
              </TableCell>
            </TableRow>
          ) : (
            providers.map((p) => (
              <TableRow key={p.id} className="border-zinc-800">
                <TableCell className="font-medium">{p.name}</TableCell>
                <TableCell className="font-mono text-sm text-zinc-400">
                  {p.model}
                </TableCell>
                <TableCell className="text-sm text-zinc-500 max-w-[200px] truncate">
                  {p.baseUrl ?? <span className="text-zinc-600">default</span>}
                </TableCell>
                <TableCell>
                  {p.isDefault && (
                    <Badge variant="secondary" className="text-xs">
                      Default
                    </Badge>
                  )}
                </TableCell>
                <TableCell className="text-right">
                  <div className="flex justify-end gap-1">
                    {!p.isDefault && (
                      <Button
                        size="sm"
                        variant="ghost"
                        className="text-xs text-zinc-400 hover:text-white"
                        onClick={() => handleSetDefault(p.id)}
                      >
                        Set default
                      </Button>
                    )}
                    <Button
                      size="sm"
                      variant="ghost"
                      className="text-xs text-zinc-400 hover:text-white"
                      onClick={() => openEdit(p)}
                    >
                      Edit
                    </Button>
                    <Button
                      size="sm"
                      variant="ghost"
                      className="text-xs text-red-500 hover:text-red-400"
                      onClick={() => handleDelete(p.id)}
                    >
                      Delete
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
