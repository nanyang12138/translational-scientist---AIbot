import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "PromptForge · 提示词锻造工坊",
  description:
    "把模糊想法变成规范、可测、可迭代的高质量提示词。澄清意图 → 合成 → 评估 → 自动优化的完整闭环。",
};

export default function RootLayout({
  children,
}: Readonly<{ children: React.ReactNode }>) {
  return (
    <html lang="zh-CN">
      <body>{children}</body>
    </html>
  );
}
