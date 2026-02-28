"use client";
import { useRouter } from "next/navigation";

export default function SignOutButton() {
  const router = useRouter();

  async function handleSignOut() {
    await fetch("/api/auth", { method: "DELETE" });
    router.push("/admin/login");
  }

  return (
    <button
      onClick={handleSignOut}
      className="text-sm text-zinc-400 hover:text-white transition-colors"
    >
      退出登录
    </button>
  );
}
