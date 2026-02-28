# 个人作品集 · AI 管理

个人前端作品集网站，通过 AI 自然语言对话管理作品数据。

## 功能

- **公开展示**：暗色主题，渐变光晕背景，作品卡片悬停发光效果
- **AI 对话管理**：用自然语言增删改查作品，支持批量操作和精选标记
- **多模型支持**：可配置任意 OpenAI 兼容的 API（包括 Anthropic、本地模型等）
- **简单认证**：密码保护后台，httpOnly cookie session

## 快速开始

**1. 安装依赖**

```bash
pnpm install
pnpm prisma generate
```

**2. 配置环境变量**

复制 `.env.example` 为 `.env`，填写以下内容：

```env
DATABASE_URL="file:./dev.db"
ADMIN_PASSWORD_HASH="<见下方生成方式>"
COOKIE_SECRET="<见下方生成方式>"
```

生成密码哈希：

```bash
node -e "require('bcryptjs').hash('你的密码', 12).then(console.log)"
```

生成 Cookie 密钥（至少 32 个字符）：

```bash
node -e "console.log(require('crypto').randomBytes(32).toString('hex'))"
```

**3. 初始化数据库**

```bash
pnpm prisma migrate deploy
```

**4. 启动**

```bash
pnpm dev
```

访问 `http://localhost:3000`。

## 使用方式

| 路径 | 说明 |
|------|------|
| `/` | 公开作品集展示 |
| `/admin/login` | 后台登录 |
| `/admin/chat` | AI 对话管理界面 |
| `/admin/settings` | AI 提供商配置 |

### 配置 AI 提供商

登录后台 → Settings → Add Provider，填写：
- **Provider Name**：显示名称（如 `OpenAI`）
- **API Key**：对应提供商的 API Key
- **Model**：模型名称（如 `gpt-4o`、`claude-sonnet-4-6`）
- **Base URL**：自定义接口地址（兼容 OpenAI 协议的服务，留空使用官方默认）

设为默认后，AI 对话将使用该提供商。

### AI 对话示例

```
添加一个项目，名称是"个人博客"，使用 Next.js、TypeScript 和 Tailwind CSS，
网站地址是 https://example.com，代码在 https://github.com/xxx/blog

把"个人博客"设为精选项目

列出所有项目

删除 ID 为 xxx 的项目
```

## 技术栈

- **Next.js 16** (App Router) + **React 19** + **TypeScript 5**
- **Tailwind CSS 4** + **shadcn/ui**
- **Vercel AI SDK v6**（Function Calling，流式输出）
- **Prisma 7** + **SQLite**（better-sqlite3 driver adapter）
- **iron-session v8**（加密 cookie 认证）

## 常用命令

```bash
pnpm dev                               # 开发服务器
pnpm build                             # 生产构建
pnpm lint                              # ESLint
pnpm prisma generate                   # 重新生成 Prisma Client
pnpm prisma migrate dev --name <name>  # 新建迁移
pnpm prisma studio                     # 数据库 GUI
```
