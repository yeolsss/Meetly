import type { Metadata } from 'next';
import './globals.css';

export const metadata: Metadata = {
  title: 'Meetly - 모임 일정 조율',
  description: '여러 사람이 참여하는 모임의 일정을 효율적으로 조율하고 관리하는 플랫폼',
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="ko">
      <body>{children}</body>
    </html>
  );
}
