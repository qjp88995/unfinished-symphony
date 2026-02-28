# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## 项目目标

个人前端作品集网站，核心特性：
- **公开展示**：暗色主题 + 渐变光晕，作品卡片悬停发光效果
- **AI 对话管理**：通过自然语言对作品数据进行增删改查、批量操作
- **多模型支持**：可配置任意 OpenAI 兼容的提供商（baseURL + apiKey + model）
- **简单密码认证**：bcrypt + iron-session cookie 保护后台

## 技术栈

- **Next.js 16** (App Router) + **React 19** + **TypeScript 5**
- **Tailwind CSS 4**（CSS-first，`globals.css` 用 `@import "tailwindcss"`，无 `tailwind.config.js`）
- **shadcn/ui**（组件在 `components/ui/`，无 CDN 依赖）
- **Vercel AI SDK v6**（`ai` 包，`streamText` + `inputSchema` tool 格式）
- **Prisma 7** + **SQLite**（需 `@prisma/adapter-better-sqlite3` driver adapter）
- **iron-session v8**（加密 cookie，Edge Runtime 使用三参数 API）
- **pnpm** 包管理器

## 常用命令

```bash
pnpm dev        # 开发服务器 (http://localhost:3000)
pnpm build      # 生产构建
pnpm start      # 运行生产构建
pnpm lint       # ESLint

# Prisma
pnpm prisma generate                   # 重新生成 Prisma Client（必须在 build 前运行）
pnpm prisma migrate dev --name <name>  # 创建并应用迁移
pnpm prisma migrate deploy             # 生产环境迁移
pnpm prisma studio                     # 数据库 GUI
```

## 项目结构

```
app/
  (portfolio)/          # 路由组：公开作品集（无鉴权）
    layout.tsx
    page.tsx            # Hero + 作品网格（Server Component，直接读 DB）
  admin/                # 后台路由（/admin/* URL，middleware 保护）
    layout.tsx          # 导航 + Sign out
    login/page.tsx      # 密码登录
    chat/page.tsx       # AI 对话界面（自定义流式读取）
    settings/page.tsx   # AI 提供商配置
    sign-out-button.tsx # Client Component
  api/
    auth/route.ts       # POST 登录 / DELETE 登出
    chat/route.ts       # POST 流式 AI 对话（+ Tool Calling）
    projects/route.ts   # GET/POST
    projects/[id]/route.ts  # PUT/DELETE
    providers/route.ts  # GET/POST
    providers/[id]/route.ts # PUT/DELETE
  layout.tsx            # 根布局（Geist 字体）
  globals.css           # Tailwind 入口 + 自定义动画

lib/
  db.ts                 # Prisma 单例（better-sqlite3 driver adapter）
  session.ts            # iron-session 配置（SessionData + sessionOptions）
  utils.ts              # cn() 工具函数（clsx + tailwind-merge）
  ai/
    client.ts           # createAIModel()：从 DB 读取默认提供商配置
    tools.ts            # portfolioTools：11 个 tool 定义（ai SDK v6 inputSchema）
    executor.ts         # executeToolCall()：所有 DB 操作

components/ui/          # shadcn/ui 组件
middleware.ts           # 保护 /admin/* + /api/chat + /api/providers/*
prisma/schema.prisma    # Project + AIProvider 模型
app/generated/prisma/   # Prisma Client 生成产物（勿手动修改）
```

路径别名：`@/*` 映射到项目根目录。

## 架构关键点

### Prisma 7 初始化方式
Prisma 7 要求 driver adapter，`lib/db.ts` 使用：
```typescript
import { PrismaBetterSqlite3 } from '@prisma/adapter-better-sqlite3';
import BetterSqlite3 from 'better-sqlite3';
// new PrismaClient({ adapter: new PrismaBetterSqlite3(db) })
```
每次修改 schema 后必须运行 `pnpm prisma generate`。

### AI SDK v6 Tool 格式
ai SDK v6 使用 `inputSchema` 而非 `parameters`：
```typescript
import { tool } from 'ai';
tool({ description: '...', inputSchema: z.object({...}), execute: async (params) => ... })
```
`streamText` 使用 `stopWhen: stepCountIs(5)` 代替 `maxSteps`，响应用 `toTextStreamResponse()`。

### iron-session Edge Runtime 用法
Middleware 中使用三参数形式（不用 `next/headers`）：
```typescript
const session = await getIronSession<SessionData>(req, res, sessionOptions);
```
Route Handler 中使用两参数形式：
```typescript
const session = await getIronSession<SessionData>(await cookies(), sessionOptions);
```

### 路由组 vs 实际 URL
- `app/(portfolio)/page.tsx` → URL `/`（路由组不生成 URL 前缀）
- `app/admin/chat/page.tsx` → URL `/admin/chat`（真实目录生成 URL）
- Middleware matcher 对应真实 URL，与路由组括号名无关

### AI 提供商安全
- API Key 只在服务端 Route Handler 中读取，`GET /api/providers` 不返回 apiKey
- `/api/chat` 和 `/api/providers/*` 由 middleware 验证 session
- Chat API 对请求体做 Zod 验证（最多 50 条消息，每条最多 10000 字符）

### 环境变量
```env
DATABASE_URL="file:./dev.db"
ADMIN_PASSWORD_HASH="\$2b\$12\$..."               # bcrypt hash，$ 需用 \$ 转义（dotenv-expand 问题）
COOKIE_SECRET="<至少 32 个字符的随机字符串>"         # node -e "console.log(require('crypto').randomBytes(32).toString('hex'))"
```

生成哈希（自动转义 `$`）：
```bash
node -e "require('bcryptjs').hash('your-password',12).then(h=>process.stdout.write(h.replaceAll('\$','\\\\\$')+'\n'))"
```
