import type { Metadata } from 'next';
import './globals.css';

export const metadata: Metadata = {
  title: '知薪',
  description: '基于多智能体与大模型的高校个性化学习资源生成智能体',
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="zh-CN" suppressHydrationWarning>
      <body className="antialiased">{children}</body>
    </html>
  );
}
