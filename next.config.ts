import type { NextConfig } from "next";
import path from "path";

// pnpm 设置 INIT_CWD 为调用命令的目录，比 process.cwd() 更可靠
const projectRoot = process.env.INIT_CWD ?? process.cwd();

const nextConfig: NextConfig = {
  turbopack: {
    root: projectRoot,
    resolveAlias: {
      tailwindcss: path.join(projectRoot, "node_modules/tailwindcss"),
      "tw-animate-css": path.join(projectRoot, "node_modules/tw-animate-css"),
      shadcn: path.join(projectRoot, "node_modules/shadcn"),
    },
  },
};

export default nextConfig;
