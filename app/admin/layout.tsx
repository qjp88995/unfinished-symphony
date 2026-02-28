import Link from "next/link";
import SignOutButton from "./sign-out-button";

export default function AdminLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div className="min-h-screen bg-background text-foreground">
      <header className="border-b border-border px-6 py-3 flex items-center justify-between">
        <div className="flex items-center gap-6">
          <Link
            href="/admin/chat"
            className="text-sm font-medium text-muted-foreground hover:text-foreground transition-colors"
          >
            对话
          </Link>
          <Link
            href="/admin/settings"
            className="text-sm font-medium text-muted-foreground hover:text-foreground transition-colors"
          >
            设置
          </Link>
        </div>
        <SignOutButton />
      </header>
      <main>{children}</main>
    </div>
  );
}
