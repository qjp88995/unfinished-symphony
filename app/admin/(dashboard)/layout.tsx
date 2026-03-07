import SignOutButton from "./sign-out-button";
import NavLinks from "./nav-links";

export default function AdminLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div className="h-screen bg-background text-foreground relative flex flex-col overflow-hidden">
      {/* Background Cyber Effects (Shared with frontend) */}
      <div className="absolute inset-0 z-0 pointer-events-none">
        <div className="absolute inset-0 bg-[linear-gradient(to_right,var(--color-primary)_1px,transparent_1px),linear-gradient(to_bottom,var(--color-primary)_1px,transparent_1px)] bg-size-[4rem_4rem] mask-[radial-gradient(ellipse_100%_100%_at_50%_0%,#000_10%,transparent_100%)] opacity-[0.03] dark:opacity-[0.08]"></div>
        <div className="absolute inset-0 bg-[linear-gradient(to_bottom,transparent_50%,var(--color-background)_50%)] bg-size-[100%_4px] opacity-10 mix-blend-overlay"></div>
      </div>

      <header className="relative z-10 border-b border-primary/20 dark:border-primary/30 bg-background/80 dark:bg-background/50 backdrop-blur-md px-6 py-4 flex items-center justify-between shadow-[0_4px_30px_rgba(0,0,0,0.05)] dark:shadow-[0_4px_30px_rgba(0,243,255,0.05)]">
        <div className="flex items-center gap-8">
          <div className="inline-flex items-center gap-2 border border-primary/30 bg-primary/5 px-3 py-1 text-[10px] font-mono text-primary uppercase tracking-widest relative overflow-hidden group mr-4">
            <span className="relative flex h-1.5 w-1.5">
              <span className="animate-ping absolute inline-flex h-full w-full bg-primary opacity-75"></span>
              <span className="relative inline-flex h-1.5 w-1.5 bg-primary"></span>
            </span>
            <span>SYS.ADMIN</span>
          </div>

          <NavLinks />
        </div>
        <div className="flex items-center gap-4 text-xs font-mono uppercase tracking-wider">
          <SignOutButton />
        </div>
      </header>
      <main className="relative z-10 flex-1 flex flex-col overflow-hidden">
        {children}
      </main>
    </div>
  );
}
