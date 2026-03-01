"use client";

import { useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Suspense } from "react";
import { Loader2, ShieldAlert, Terminal } from "lucide-react";

function LoginForm() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    setError("");

    const res = await fetch("/api/auth", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ password }),
    });

    if (res.ok) {
      const raw = searchParams.get("redirect") || "/admin/chat";
      // 只允许重定向到内部路径，防止开放重定向攻击
      const redirect =
        raw.startsWith("/") && !raw.startsWith("//") ? raw : "/admin/chat";
      router.push(redirect);
    } else {
      const data = await res.json();
      setError(data.error || "认证失败 [ACCESS_DENIED]");
      setLoading(false);
    }
  }

  return (
    <div className="relative flex min-h-screen items-center justify-center bg-background overflow-hidden selection:bg-primary/30">
      {/* Background decoration */}
      <div className="absolute inset-0 z-0 bg-[radial-gradient(ellipse_at_center,var(--color-primary)_0%,transparent_70%)] opacity-5 pointer-events-none"></div>
      <div className="absolute top-0 left-0 w-full h-px bg-linear-to-r from-transparent via-primary/20 to-transparent"></div>
      <div className="absolute bottom-0 left-0 w-full h-px bg-linear-to-r from-transparent via-primary/20 to-transparent"></div>

      {/* Grid background */}
      <div className="absolute inset-0 bg-[linear-gradient(var(--color-foreground)_1px,transparent_1px),linear-gradient(90deg,var(--color-foreground)_1px,transparent_1px)] opacity-[0.02] bg-size-[4rem_4rem] mask-[radial-gradient(ellipse_60%_60%_at_50%_50%,#000_70%,transparent_100%)] z-0 pointer-events-none"></div>

      <div className="w-full max-w-sm px-4 relative z-10">
        <div className="relative border border-border/40 bg-card/20 backdrop-blur-md rounded-xl p-8 shadow-sm">
          {/* Tech accents */}
          <div className="absolute top-0 left-0 w-4 h-4 border-t-2 border-l-2 border-primary/50 rounded-tl-xl"></div>
          <div className="absolute top-0 right-0 w-4 h-4 border-t-2 border-r-2 border-primary/50 rounded-tr-xl"></div>
          <div className="absolute bottom-0 left-0 w-4 h-4 border-b-2 border-l-2 border-primary/50 rounded-bl-xl"></div>
          <div className="absolute bottom-0 right-0 w-4 h-4 border-b-2 border-r-2 border-primary/50 rounded-br-xl"></div>

          <div className="space-y-6">
            <div className="flex flex-col items-center justify-center space-y-3 text-center">
              <div className="w-12 h-12 border border-primary/30 bg-primary/10 rounded-xl flex items-center justify-center mb-2 shadow-sm">
                <Terminal className="size-6 text-primary" />
              </div>
              <h1 className="text-xl font-mono font-bold tracking-widest uppercase text-foreground">
                系统访问终端
              </h1>
              <div className="flex items-center gap-2">
                <span className="relative flex h-2 w-2">
                  <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-primary opacity-75"></span>
                  <span className="relative inline-flex rounded-full h-2 w-2 bg-primary"></span>
                </span>
                <p className="text-xs font-mono text-primary/80 uppercase tracking-widest">
                  需要安全认证密钥
                </p>
              </div>
            </div>

            <form onSubmit={handleSubmit} className="space-y-5">
              <div className="space-y-2">
                <div className="relative group">
                  <div className="absolute left-3 top-1/2 -translate-y-1/2 text-primary/70 font-mono text-sm leading-none z-10 font-bold">
                    &gt;
                  </div>
                  <Input
                    type="password"
                    placeholder="输入访问密钥... (ENTER)"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    className="w-full bg-background/50 border-border/60 focus-visible:ring-1 focus-visible:ring-primary/30 focus-visible:border-primary/50 text-foreground placeholder:text-muted-foreground/40 pl-8 font-mono text-sm transition-all duration-300 h-11"
                    autoFocus
                  />
                </div>
                {error && (
                  <div className="flex items-center gap-1.5 text-xs text-destructive font-mono animate-in fade-in slide-in-from-top-1">
                    <ShieldAlert className="size-3" />
                    <span>{error}</span>
                  </div>
                )}
              </div>

              <Button
                type="submit"
                className="w-full h-11 bg-primary text-primary-foreground font-mono text-sm font-bold tracking-widest uppercase hover:bg-primary/90 shadow-sm transition-all hover:-translate-y-0.5"
                disabled={loading}
              >
                {loading ? (
                  <span className="flex items-center gap-2">
                    <Loader2 className="size-4 animate-spin" />
                    [认证中...]
                  </span>
                ) : (
                  "验证并访问"
                )}
              </Button>
            </form>
          </div>
        </div>

        {/* Decorative elements below form */}
        <div className="mt-8 flex justify-between items-center px-2 opacity-40 text-[10px] font-mono uppercase tracking-widest">
          <span>SECURE_CONN_ESTABLISHED</span>
          <span>SYS_VER_2.4.1</span>
        </div>
      </div>
    </div>
  );
}

export default function LoginPage() {
  return (
    <Suspense>
      <LoginForm />
    </Suspense>
  );
}
