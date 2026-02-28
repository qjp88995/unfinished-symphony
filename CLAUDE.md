# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## 项目目标

这是一个个人前端作品集网站，核心特性：
- 通过 AI 自然语言对话管理作品数据（增删改查）
- 支持配置多个模型提供商（如 OpenAI、Anthropic、自定义 API）和具体模型
- 公开展示作品集，后台通过对话界面维护数据

## 技术栈

- **Next.js 16** (App Router) + **React 19** + **TypeScript 5**
- **Tailwind CSS 4**（CSS-first 配置，`globals.css` 用 `@import "tailwindcss"` 而非配置文件）
- **pnpm** 包管理器
- **ESLint 9**（`eslint-config-next` core-web-vitals + typescript 规则）

## 常用命令

```bash
pnpm dev        # 启动开发服务器 (http://localhost:3000)
pnpm build      # 生产构建
pnpm start      # 运行生产构建
pnpm lint       # 运行 ESLint

# Prisma
pnpm prisma migrate dev --name <name>  # 创建并应用迁移
pnpm prisma migrate deploy             # 生产环境应用迁移
pnpm prisma studio                     # 打开数据库 GUI
pnpm prisma generate                   # 重新生成 Prisma Client
```

## 项目结构

```
app/            # Next.js App Router 根目录
  layout.tsx    # 根布局（Geist 字体、全局样式）
  page.tsx      # 首页
  globals.css   # 全局样式（Tailwind CSS 4 入口）
public/         # 静态资源
```

路径别名：`@/*` 映射到项目根目录（如 `@/app/...`、`@/lib/...`）。

## 架构约定

**计划中的目录结构（随项目演进）：**
- `app/` — 页面路由（公开作品集展示 + 后台管理路由）
- `lib/` — 工具函数、AI 客户端适配层
- `components/` — 共享 UI 组件
- `store/` 或 `hooks/` — 客户端状态管理

**数据层：**
- 数据库：**SQLite** + **Prisma ORM**（schema 位于 `prisma/schema.prisma`，DB 文件 `prisma/dev.db`）
- 作品数据（`Project`）、模型提供商配置（`AIProvider`）均持久化到 SQLite
- Prisma Client 生成至 `app/generated/prisma/`（已 gitignore，每次需运行 `pnpm prisma generate`）
- Prisma Client 单例封装在 `lib/db.ts`，在 Next.js dev 模式下避免热重载创建多余连接
- 在 Route Handlers 和 Server Actions 中通过 `import { prisma } from "@/lib/db"` 使用

**AI 集成关键点：**
- 模型提供商配置（provider、baseURL、apiKey、model）存储在 SQLite，通过服务端读取
- AI 对话通过 Next.js Route Handlers（`app/api/`）代理，API Key 仅在服务端使用，不暴露给客户端

**Tailwind CSS 4 注意事项：**
- 使用 CSS 变量定义主题 token（`@theme inline { ... }`），不使用 `tailwind.config.js`
- 暗色模式通过 `@media (prefers-color-scheme: dark)` 控制
