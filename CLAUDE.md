# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## 项目目标

个人前端作品集网站，核心特性：
- **公开展示**：暗/亮主题切换，渐变光晕背景，作品卡片悬停发光效果
- **AI 对话管理**：通过自然语言对作品数据进行增删改查、批量操作；支持 @project 提及和图片粘贴上传
- **对话持久化**：聊天记录存入数据库，自动压缩历史上下文，支持清除和批量删除
- **多模型支持**：可配置任意 OpenAI 兼容的提供商（baseURL + apiKey + model）
- **简单密码认证**：bcrypt + iron-session cookie 保护后台
- **图床集成**：七牛云存储，支持从剪贴板粘贴图片并上传
- **Docker 部署**：多阶段构建，自动数据库迁移

## 技术栈

- **Next.js 16** (App Router) + **React 19** + **TypeScript 5**
- **Tailwind CSS 4**（CSS-first，`globals.css` 用 `@import "tailwindcss"`，无 `tailwind.config.js`）
- **shadcn/ui**（组件在 `components/ui/`，无 CDN 依赖）
- **next-themes**（`ThemeProvider` 管理暗/亮主题，`defaultTheme="dark"`，`enableSystem`）
- **Tiptap 3**（富文本编辑器，替代 textarea；支持 @project 提及、图片粘贴）
- **Vercel AI SDK v6**（`ai` 包，`streamText` + `inputSchema` tool 格式）
- **Prisma 7** + **SQLite**（需 `@prisma/adapter-better-sqlite3` driver adapter）
- **iron-session v8**（加密 cookie，Edge Runtime 使用三参数 API）
- **KaTeX**（数学公式渲染，集成在 Markdown 渲染组件中）
- **七牛云 SDK**（`qiniu` 包，服务端生成上传 token）
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

# Docker
docker compose up --build              # 构建并启动（自动运行迁移）
```

## 项目结构

```
app/
  (portfolio)/          # 路由组：公开作品集（无鉴权）
    layout.tsx
    page.tsx            # Hero + 作品网格（Server Component，直接读 DB）
  admin/
    login/page.tsx      # 密码登录
    (dashboard)/        # 路由组：鉴权后后台（无 URL 前缀）
      layout.tsx        # 导航 + Sign out
      page.tsx          # 重定向到 /admin/chat
      chat/page.tsx     # AI 对话界面（左右分栏：项目列表 + 对话，SSE 实时同步）
      settings/page.tsx # AI 提供商配置
      sign-out-button.tsx # Client Component
  api/
    auth/route.ts       # POST 登录 / DELETE 登出
    chat/route.ts       # POST 流式 AI 对话（+ Tool Calling）
    chat/history/
      route.ts          # GET 加载聊天历史
      clear/route.ts    # POST 清除聊天历史（插入 clear 标记）
      batch/route.ts    # POST 批量删除聊天记录
    projects/route.ts   # GET/POST
    projects/[id]/route.ts    # PUT/DELETE
    projects/events/route.ts  # GET SSE 实时推送项目变更
    providers/route.ts  # GET/POST
    providers/[id]/route.ts   # PUT/DELETE
    upload/token/route.ts     # GET 七牛云上传 token（鉴权保护）
  layout.tsx            # 根布局（Geist 字体 + ThemeProvider）
  globals.css           # Tailwind 入口 + @theme token（含动画）

lib/
  db.ts                 # Prisma 单例（better-sqlite3 driver adapter）
  session.ts            # iron-session 配置（SessionData + sessionOptions）
  utils.ts              # cn() 工具函数（clsx + tailwind-merge）
  project-events.ts     # Node.js EventEmitter 单例，项目变更事件总线
  chat-history.ts       # 聊天记录持久化（存储/加载/压缩/清除）
  ai/
    client.ts           # createAIModel()：从 DB 读取默认提供商配置
    tools.ts            # portfolioTools：11 个 tool 定义（ai SDK v6 inputSchema）
    executor.ts         # executeToolCall()：所有 DB 操作（写操作后触发 project-events）

components/
  ui/                   # shadcn/ui 组件
  theme-provider.tsx    # next-themes ThemeProvider 封装
  theme-toggle.tsx      # 暗/亮主题切换按钮（悬浮固定）
  mention-list.tsx      # @project 提及下拉列表（Tiptap 插件）
  markdown-renderer.tsx # Markdown 渲染（含 KaTeX 数学公式）
  thinking-block.tsx    # AI 扩展思考过程折叠显示
  tool-call-block.tsx   # AI tool 调用可视化展示
  clear-divider.tsx     # 聊天清除分割线
  compression-divider.tsx # 聊天压缩分割线

proxy.ts                # Next.js 16 中间件（保护 /admin/* + /api/chat + /api/chat/history/* + /api/providers/* + /api/projects/events + /api/upload/token）
prisma.config.ts        # Prisma 7 配置（datasource URL、迁移路径）
prisma/schema.prisma    # Project + AIProvider + ChatRecord 模型
app/generated/prisma/   # Prisma Client 生成产物（勿手动修改）

Dockerfile              # 三阶段多阶段生产构建
docker-compose.yml      # Docker Compose（db-data volume）
entrypoint.sh           # 入口脚本（自动迁移 + 启动）
```

路径别名：`@/*` 映射到项目根目录。

## 架构关键点

### Prisma 7 初始化方式
Prisma 7 要求 driver adapter，`lib/db.ts` 使用：
```typescript
import { PrismaBetterSqlite3 } from '@prisma/adapter-better-sqlite3';
const adapter = new PrismaBetterSqlite3({ url: resolvedUrl });
new PrismaClient({ adapter });
```
`prisma.config.ts` 在根目录提供 `datasource.url`（从 `DATABASE_URL` 读取），`schema.prisma` 中 `datasource db` 只声明 `provider = "sqlite"`，不含 `url` 字段。

每次修改 schema 后必须运行 `pnpm prisma generate`。

### AI SDK v6 Tool 格式
ai SDK v6 使用 `inputSchema` 而非 `parameters`：
```typescript
import { tool } from 'ai';
tool({ description: '...', inputSchema: z.object({...}), execute: async (params) => ... })
```
`streamText` 使用 `stopWhen: stepCountIs(5)` 代替 `maxSteps`，响应用 `toTextStreamResponse()`。

### Next.js 16 中间件文件约定
Next.js 16 将中间件文件名从 `middleware.ts` **更名为 `proxy.ts`**（`middleware.ts` 已废弃）：
- 项目根目录使用 `proxy.ts`，导出函数名为 `proxy`（非 `middleware`）
- 同时存在两个文件时 Next.js 会报错，要求只保留 `proxy.ts`
- `config.matcher` 写法不变

```typescript
// proxy.ts
export async function proxy(req: NextRequest) { ... }
export const config = { matcher: [...] };
```

### iron-session Edge Runtime 用法
`proxy.ts` 中间件中使用三参数形式（不用 `next/headers`）：
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

### 主题系统

- **ThemeProvider**：使用 `next-themes`，`attribute="class"`，`defaultTheme="dark"`，`enableSystem`
- **`<html>`**：不再硬编码 `className="dark"`，需 `suppressHydrationWarning` 避免 SSR 闪烁
- **暗色变体**：`@custom-variant dark (&:where(.dark, .dark *))` 同时匹配根元素及其子元素

### Tailwind CSS v4 规范

- **语义 token**：一律用 `bg-background`、`border-border`、`text-foreground`、`text-muted-foreground`、`text-destructive` 等，禁止直接用 `zinc-*` 原始颜色
- **动画 token**：在 `@theme { --animate-*; @keyframes }` 中定义，直接用 `animate-*` 工具类，不手写 `.animate-xxx` 类
- **`size-*` 简写**：等宽高时用 `size-n` 代替 `w-n h-n`
- **无任意单位**：`w-[600px]` → `w-150`（÷4），`min-h-[44px]` → `min-h-11`，`max-w-[200px]` → `max-w-50`
- **渐变写法**：`bg-linear-to-b`（非 `bg-gradient-to-b`）
- **透明度简写**：`bg-white/2`（非 `bg-white/[0.02]`）

### AI 提供商安全
- API Key 只在服务端 Route Handler 中读取，`GET /api/providers` 不返回 apiKey
- `/api/chat`、`/api/chat/history/*`、`/api/providers/*`、`/api/projects/events`、`/api/upload/token` 由 `proxy.ts` 中间件验证 session
- Chat API 对请求体做 Zod 验证（最多 50 条消息，每条最多 10000 字符）

### 七牛云图片上传
- `GET /api/upload/token?ext=jpg` 返回上传凭证 + 文件 key（服务端签名，不暴露 secretKey）
- 上传后文件 URL = `QINIU_CDN_DOMAIN` + `/` + key
- 仅允许扩展名：`jpg`、`jpeg`、`png`、`gif`、`webp`、`avif`
- Tiptap 编辑器支持从剪贴板粘贴图片，自动调用此接口上传并插入 Markdown 图片语法

### Chat 编辑器（Tiptap）
- 替代原 `<textarea>`，提供富文本编辑体验
- `@` 触发提及下拉，列出已有项目，选中后插入 `<project id="..." name="..." />` 标签
- 系统 prompt 会解析 `<project>` 标签注入项目上下文
- `Enter` 提交，`Shift+Enter` 换行；提及下拉激活时 `Enter` 选中而非提交
- 粘贴图片时自动上传到七牛云并插入 `![...](url)` 语法

### 聊天记录持久化
- 消息以 `ChatRecord` 存入 SQLite，`type` 区分 `user`/`assistant`/`compression`/`clear`
- `parts` 字段存储 JSON 序列化的 UIMessage parts 数组（文本、推理过程、tool 调用）
- 对话达到约 70% 上下文窗口时自动压缩历史，生成摘要存入 `compression` 记录
- 清除操作插入 `clear` 标记，加载时只取最近一次 clear 之后的记录
- `loadContextMessages()` 重建对话时注入压缩摘要作为上下文前缀

### 消息渲染组件
- `markdown-renderer.tsx`：Markdown 渲染 + KaTeX 数学公式（行内 `$...$`、块级 `$$...$$`）
- `thinking-block.tsx`：AI 扩展思考过程（可折叠展示）
- `tool-call-block.tsx`：tool 调用可视化（显示工具名、参数、返回结果）
- `clear-divider.tsx` / `compression-divider.tsx`：历史中的分隔标记

### Docker 部署
- **Dockerfile**：三阶段构建（deps → builder → runner），生产镜像以非 root 用户运行
- **docker-compose.yml**：挂载 `db-data` volume 到 `/app/data` 持久化 SQLite
- **entrypoint.sh**：启动时自动执行 `prisma migrate deploy`，然后启动 Next.js
- Docker 环境中 `DATABASE_URL` 应设为 `file:/app/data/prod.db`

### 环境变量
```env
DATABASE_URL="file:./dev.db"                       # Docker 环境用 file:/app/data/prod.db
ADMIN_PASSWORD_HASH="\$2b\$12\$..."               # bcrypt hash，$ 需用 \$ 转义（dotenv-expand 问题）
COOKIE_SECRET="<至少 32 个字符的随机字符串>"         # node -e "console.log(require('crypto').randomBytes(32).toString('hex'))"
CONTACT_EMAIL="hello@example.com"                  # 作品集页面联系邮箱
ICP_MAP={"example.cn":"晋ICP备XXXXXXXX号-1"}       # ICP 备案号映射（JSON，key=域名，value=备案号）

# 七牛云图床（可选，不配置则无法上传图片）
QINIU_ACCESS_KEY="<AccessKey>"
QINIU_SECRET_KEY="<SecretKey>"
QINIU_BUCKET="<存储空间名>"
QINIU_CDN_DOMAIN="https://your-cdn-domain.com"   # 绑定在 bucket 上的加速域名（预览 URL 前缀）
QINIU_UPLOAD_URL="https://up.qiniup.com"          # 上传地址，按存储区域选择
```

生成哈希（自动转义 `$`）：
```bash
node -e "require('bcryptjs').hash('your-password',12).then(h=>process.stdout.write(h.replaceAll('\$','\\\\\$')+'\n'))"
```
