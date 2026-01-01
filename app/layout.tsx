import type { Metadata } from "next";
import { Inter } from "next/font/google";
import "./globals.css";
import { Toaster } from "@/components/ui/sonner";
import { AuthProvider } from "@/contexts/auth-context";
import { ThemeProvider } from "@/components/theme/theme-provider";
import { getCurrentUser } from "@/app/actions/auth";

const inter = Inter({ subsets: ["latin"] });

export const metadata: Metadata = {
  title: "Habitree Reading Hub",
  description: "독서 기록 및 공유 플랫폼",
  icons: {
    icon: "/favicon.ico",
  },
  viewport: {
    width: "device-width",
    initialScale: 1,
    maximumScale: 5,
    userScalable: true,
  },
};

/**
 * 루트 레이아웃
 * 모든 페이지에 공통으로 적용되는 레이아웃
 * 
 * 규칙: 서버 중심 세션 관리
 * - 서버에서 초기 사용자 정보를 조회하여 AuthProvider에 전달
 * - 클라이언트는 서버에서 받은 정보만 표시
 */
export default async function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  // 서버에서 초기 사용자 정보 조회 (쿠키 기반 세션)
  const initialUser = await getCurrentUser();

  return (
    <html lang="ko" suppressHydrationWarning>
      <body className={inter.className}>
        <ThemeProvider
          attribute="class"
          defaultTheme="forest"
          enableSystem={false}
          themes={["light", "dark", "forest"]}
        >
          <AuthProvider initialUser={initialUser}>
            {children}
            <Toaster />
          </AuthProvider>
        </ThemeProvider>
      </body>
    </html>
  );
}

