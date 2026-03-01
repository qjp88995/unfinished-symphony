import type { Metadata, Viewport } from "next";
import { GeistSans } from "geist/font/sans";
import { GeistMono } from "geist/font/mono";
import "./globals.css";
import "katex/dist/katex.min.css";
import { ThemeProvider } from "@/components/theme-provider";
import { ThemeToggle } from "@/components/theme-toggle";

export const viewport: Viewport = {
  themeColor: [
    { media: "(prefers-color-scheme: light)", color: "#ffffff" },
    { media: "(prefers-color-scheme: dark)", color: "#050505" },
  ],
  width: "device-width",
  initialScale: 1,
  maximumScale: 1,
};

export const metadata: Metadata = {
  title: {
    default: "创意开发者 | Portfolio",
    template: "%s | 创意开发者",
  },
  description:
    "Next.js 16 高性能个人投资组合站点，融合沉浸式赛博朋克深色外观与极简亮色主题。",
  keywords: [
    "开发者",
    "前端工程师",
    "Next.js",
    "React",
    "Portfolio",
    "个人主页",
  ],
  authors: [{ name: "Your Name" }],
  openGraph: {
    type: "website",
    locale: "zh_CN",
    title: "创意开发者 | Portfolio",
    description:
      "Next.js 16 高性能个人投资组合站点，融合沉浸式赛博朋克深色外观与极简亮色主题。",
    siteName: "Portfolio",
  },
  robots: {
    index: true,
    follow: true,
    googleBot: {
      index: true,
      follow: true,
      "max-video-preview": -1,
      "max-image-preview": "large",
      "max-snippet": -1,
    },
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="zh-Hans" suppressHydrationWarning>
      <body
        className={`${GeistSans.variable} ${GeistMono.variable} antialiased`}
      >
        <ThemeProvider
          attribute="class"
          defaultTheme="dark"
          enableSystem
          disableTransitionOnChange
        >
          {children}
          <ThemeToggle />
        </ThemeProvider>
      </body>
    </html>
  );
}
