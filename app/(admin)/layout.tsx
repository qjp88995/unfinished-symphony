import Link from 'next/link';
import SignOutButton from './sign-out-button';

export default function AdminLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="min-h-screen bg-zinc-950 text-white">
      <header className="border-b border-zinc-800 px-6 py-3 flex items-center justify-between">
        <div className="flex items-center gap-6">
          <Link
            href="/admin/chat"
            className="text-sm font-medium text-zinc-300 hover:text-white transition-colors"
          >
            Chat
          </Link>
          <Link
            href="/admin/settings"
            className="text-sm font-medium text-zinc-300 hover:text-white transition-colors"
          >
            Settings
          </Link>
        </div>
        <SignOutButton />
      </header>
      <main>{children}</main>
    </div>
  );
}
