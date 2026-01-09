"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { ChevronRight, ChevronDown, Library, BookOpen } from "lucide-react";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils/cn";
import { getBookshelves } from "@/app/actions/bookshelves";
import { Bookshelf } from "@/types/bookshelf";
import { Skeleton } from "@/components/ui/skeleton";

export function BookshelfTree() {
  const pathname = usePathname();
  const [bookshelves, setBookshelves] = useState<Bookshelf[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isExpanded, setIsExpanded] = useState(true);

  useEffect(() => {
    async function loadBookshelves() {
      try {
        const data = await getBookshelves();
        setBookshelves(data);
      } catch (error) {
        console.error("서재 목록 조회 오류:", error);
      } finally {
        setIsLoading(false);
      }
    }
    loadBookshelves();
  }, []);

  if (isLoading) {
    return (
      <div className="space-y-1 px-3">
        <Skeleton className="h-8 w-full" />
        <Skeleton className="h-8 w-full ml-4" />
        <Skeleton className="h-8 w-full ml-4" />
      </div>
    );
  }

  const mainBookshelf = bookshelves.find((b) => b.is_main);
  const subBookshelves = bookshelves.filter((b) => !b.is_main);

  if (bookshelves.length === 0) {
    return null;
  }

  return (
    <div className="space-y-1 px-3">
      {/* 메인 서재 */}
      {mainBookshelf && (
        <Link
          href="/books"
          aria-label="내 서재 (통합)"
          aria-current={pathname === "/books" ? "page" : undefined}
        >
          <Button
            variant={pathname === "/books" ? "secondary" : "ghost"}
            className={cn(
              "w-full justify-start gap-3 h-9",
              pathname === "/books" && "bg-secondary font-medium"
            )}
          >
            <Library className="h-4 w-4" />
            <span className="flex-1 text-left text-sm">{mainBookshelf.name}</span>
          </Button>
        </Link>
      )}

      {/* 하위 서재 트리 */}
      {subBookshelves.length > 0 && (
        <div>
          <Button
            variant="ghost"
            className="w-full justify-start gap-2 h-8 px-2 text-xs text-muted-foreground hover:text-foreground"
            onClick={() => setIsExpanded(!isExpanded)}
          >
            {isExpanded ? (
              <ChevronDown className="h-3 w-3" />
            ) : (
              <ChevronRight className="h-3 w-3" />
            )}
            <span>서재 ({subBookshelves.length})</span>
          </Button>
          {isExpanded && (
            <div className="ml-4 space-y-1">
              {subBookshelves.map((bookshelf) => {
                const isActive =
                  pathname === `/bookshelves/${bookshelf.id}` ||
                  pathname.startsWith(`/bookshelves/${bookshelf.id}/`);

                return (
                  <Link
                    key={bookshelf.id}
                    href={`/bookshelves/${bookshelf.id}`}
                    aria-label={bookshelf.name}
                    aria-current={isActive ? "page" : undefined}
                  >
                    <Button
                      variant={isActive ? "secondary" : "ghost"}
                      className={cn(
                        "w-full justify-start gap-2 h-8 px-2 text-xs",
                        isActive && "bg-secondary font-medium"
                      )}
                    >
                      <BookOpen className="h-3 w-3" />
                      <span className="flex-1 text-left truncate">{bookshelf.name}</span>
                    </Button>
                  </Link>
                );
              })}
            </div>
          )}
        </div>
      )}
    </div>
  );
}
