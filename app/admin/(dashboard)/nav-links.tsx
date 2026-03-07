"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";

const links = [
  { href: "/admin/chat", label: "对话终端", index: "01" },
  { href: "/admin/settings", label: "全局配置", index: "02" },
];

export default function NavLinks() {
  const pathname = usePathname();

  return (
    <>
      {links.map(({ href, label, index }) => {
        const isActive = pathname === href || pathname.startsWith(href + "/");
        return (
          <Link
            key={href}
            href={href}
            className={`text-xs font-mono font-bold uppercase tracking-wider transition-colors flex items-center gap-2 ${
              isActive
                ? "text-primary"
                : "text-muted-foreground hover:text-primary"
            }`}
          >
            <span className={isActive ? "opacity-80" : "opacity-50"}>
              [{index}]
            </span>{" "}
            {label}
          </Link>
        );
      })}
    </>
  );
}
