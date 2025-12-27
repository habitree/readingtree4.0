"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { Home, Library, PenTool, Search, Clock, Users, User } from "lucide-react";
import { cn } from "@/lib/utils/cn";
import { Button } from "@/components/ui/button";

/**
 * 모바일 네비게이션 아이템 타입
 */
interface MobileNavItem {
  icon: React.ComponentType<{ className?: string }>;
  label: string;
  href: string;
}

/**
 * 모바일 네비게이션 아이템 목록
 * 주요 5개 메뉴만 표시
 */
const mobileNavItems: MobileNavItem[] = [
  { icon: Home, label: "홈", href: "/" },
  { icon: Library, label: "서재", href: "/books" },
  { icon: PenTool, label: "기록", href: "/notes/new" },
  { icon: Search, label: "검색", href: "/search" },
  { icon: User, label: "프로필", href: "/profile" },
];

/**
 * 모바일 하단 네비게이션 컴포넌트
 * 모바일에서만 표시되는 하단 고정 네비게이션
 */
export function MobileNav() {
  const pathname = usePathname();

  return (
    <nav 
      className="fixed bottom-0 left-0 right-0 z-50 border-t bg-background lg:hidden"
      aria-label="모바일 네비게이션"
    >
      <div className="flex items-center justify-around h-16" role="list">
        {mobileNavItems.map((item) => {
          const Icon = item.icon;
          const isActive = pathname === item.href || pathname.startsWith(item.href + "/");

          return (
            <Link 
              key={item.href} 
              href={item.href} 
              className="flex-1"
              aria-label={item.label}
              aria-current={isActive ? "page" : undefined}
            >
              <Button
                variant="ghost"
                className={cn(
                  "w-full flex flex-col items-center justify-center h-full gap-1 rounded-none",
                  isActive && "text-primary bg-secondary/50"
                )}
                aria-label={item.label}
                aria-pressed={isActive}
              >
                <Icon className={cn("h-5 w-5", isActive && "text-primary")} aria-hidden="true" />
                <span className={cn("text-xs", isActive && "text-primary font-medium")}>
                  {item.label}
                </span>
              </Button>
            </Link>
          );
        })}
      </div>
    </nav>
  );
}

