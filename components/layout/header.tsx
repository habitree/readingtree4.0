"use client";

import { Bell, User, Trees } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import Link from "next/link";
import { useAuth } from "@/hooks/use-auth";
import { signOut } from "@/app/actions/auth";
import { ThemeSelector } from "@/components/theme/theme-selector";

/**
 * 관리자 여부 확인
 */
function isAdminUser(user: any): boolean {
  if (!user || !user.email) {
    return false;
  }
  const ADMIN_EMAIL = "cdhnaya@kakao.com";
  return user.email.toLowerCase() === ADMIN_EMAIL.toLowerCase();
}

/**
 * 헤더 컴포넌트
 * 로고, 검색, 알림, 프로필 메뉴 포함
 */
export function Header() {
  const { user, isLoading } = useAuth();
  const userName = user?.user_metadata?.name || user?.email?.split("@")[0] || "사용자";
  const userAvatar = user?.user_metadata?.avatar_url || null;
  const isAdmin = isAdminUser(user);

  return (
    <header className="sticky top-0 z-40 w-full border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
      <div className="container flex h-14 sm:h-16 items-center justify-between px-3 sm:px-4">
        {/* 로고 - 모바일에서만 표시 */}
        <Link href="/" className="lg:hidden flex items-center gap-2 font-bold text-base sm:text-lg">
          <Trees className="w-6 h-6 text-forest-600" />
          Habitree
        </Link>

        {/* 우측 메뉴 */}
        <div className="flex items-center gap-2 ml-auto">

          {/* 테마 선택 */}
          <ThemeSelector />

          {/* 알림 */}
          <Button variant="ghost" size="icon" className="relative h-9 w-9 sm:h-10 sm:w-10">
            <Bell className="h-4 w-4 sm:h-5 sm:w-5" />
            {/* TODO: 알림 배지 표시 */}
          </Button>

          {/* 프로필 메뉴 */}
          {user ? (
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="ghost" className="relative h-9 w-9 sm:h-10 sm:w-10 rounded-full">
                  <Avatar className="h-9 w-9 sm:h-10 sm:w-10">
                    <AvatarImage src={userAvatar || undefined} alt={userName} />
                    <AvatarFallback>
                      {userName.charAt(0).toUpperCase()}
                    </AvatarFallback>
                  </Avatar>
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end" className="w-56">
                <DropdownMenuLabel>
                  <div className="flex flex-col space-y-1">
                    <p className="text-sm font-medium leading-none">{userName}</p>
                    <p className="text-xs leading-none text-muted-foreground">
                      프로필 보기
                    </p>
                  </div>
                </DropdownMenuLabel>
                <DropdownMenuSeparator />
                <DropdownMenuItem asChild>
                  <Link href="/profile">프로필 설정</Link>
                </DropdownMenuItem>
                {isAdmin && (
                  <DropdownMenuItem asChild>
                    <Link href="/admin">관리자 대시보드</Link>
                  </DropdownMenuItem>
                )}
                <DropdownMenuItem>설정</DropdownMenuItem>
                <DropdownMenuSeparator />
                <DropdownMenuItem
                  onClick={async () => {
                    try {
                      await signOut();
                    } catch (error) {
                      console.error("로그아웃 오류:", error);
                    }
                  }}
                >
                  로그아웃
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          ) : (
            <Button asChild variant="default">
              <Link href="/login">로그인</Link>
            </Button>
          )}
        </div>
      </div>
    </header>
  );
}

