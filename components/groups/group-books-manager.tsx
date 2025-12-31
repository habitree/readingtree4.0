"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { BookSearch } from "@/components/books/book-search";
import { 
  addGroupBook, 
  getGroupBooksWithUserStatus, 
  addGroupBookToMyLibrary,
  removeGroupBook 
} from "@/app/actions/groups";
import { getUserBooksWithNotes } from "@/app/actions/books";
import { toast } from "sonner";
import { BookOpen, Plus, Trash2, CheckCircle2, X } from "lucide-react";
import Image from "next/image";
import { getImageUrl, isValidImageUrl } from "@/lib/utils/image";
import { BookStatusBadge } from "@/components/books/book-status-badge";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { Loader2 } from "lucide-react";

interface GroupBooksManagerProps {
  groupId: string;
  isLeader: boolean;
}

export function GroupBooksManager({ groupId, isLeader }: GroupBooksManagerProps) {
  const router = useRouter();
  const [isAdding, setIsAdding] = useState(false);
  const [groupBooks, setGroupBooks] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [deletingBookId, setDeletingBookId] = useState<string | null>(null);
  const [myBookIds, setMyBookIds] = useState<Set<string>>(new Set());

  useEffect(() => {
    loadGroupBooks();
    loadMyBooks();
  }, [groupId]);

  const loadMyBooks = async () => {
    try {
      const { books } = await getUserBooksWithNotes();
      const bookIds = new Set(books.map((b) => b.books?.id).filter(Boolean));
      setMyBookIds(bookIds);
    } catch (error) {
      console.error("내 서재 조회 오류:", error);
    }
  };

  const loadGroupBooks = async () => {
    try {
      setIsLoading(true);
      const books = await getGroupBooksWithUserStatus(groupId);
      setGroupBooks(books);
    } catch (error) {
      console.error("지정도서 조회 오류:", error);
      toast.error(
        error instanceof Error ? error.message : "지정도서 조회에 실패했습니다."
      );
    } finally {
      setIsLoading(false);
    }
  };

  const handleAddBook = async (bookId: string) => {
    try {
      await addGroupBook(groupId, bookId);
      toast.success("지정도서가 추가되었습니다.");
      setIsAdding(false);
      loadGroupBooks();
    } catch (error) {
      toast.error(
        error instanceof Error ? error.message : "도서 추가 실패"
      );
    }
  };

  const handleAddToMyLibrary = async (bookId: string) => {
    try {
      await addGroupBookToMyLibrary(groupId, bookId, "reading");
      toast.success("내 서재에 추가되었습니다.");
      loadGroupBooks();
      router.refresh();
    } catch (error) {
      toast.error(
        error instanceof Error ? error.message : "서재 추가 실패"
      );
    }
  };

  const handleRemoveBook = async (bookId: string) => {
    try {
      await removeGroupBook(groupId, bookId);
      toast.success("지정도서가 삭제되었습니다.");
      setDeletingBookId(null);
      loadGroupBooks();
    } catch (error) {
      toast.error(
        error instanceof Error ? error.message : "도서 삭제 실패"
      );
    }
  };

  if (isLoading) {
    return (
      <Card>
        <CardContent className="pt-6">
          <div className="flex items-center justify-center py-12">
            <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <div>
          <h3 className="text-lg font-semibold">지정도서</h3>
          <p className="text-sm text-muted-foreground">
            모임에서 함께 읽을 책을 지정합니다
          </p>
        </div>
        {isLeader && (
          <Button onClick={() => setIsAdding(true)}>
            <Plus className="mr-2 h-4 w-4" />
            도서 추가
          </Button>
        )}
      </div>

      {isAdding && (
        <Card>
          <CardHeader>
            <CardTitle>지정도서 추가</CardTitle>
            <CardDescription>검색하여 도서를 추가하세요</CardDescription>
          </CardHeader>
          <CardContent>
            <BookSearch
              onSelectBook={(result) => {
                if (result.bookId) {
                  handleAddBook(result.bookId);
                }
              }}
            />
            <Button
              variant="ghost"
              className="mt-4 w-full"
              onClick={() => setIsAdding(false)}
            >
              취소
            </Button>
          </CardContent>
        </Card>
      )}

      {groupBooks.length === 0 ? (
        <Card>
          <CardContent className="pt-6">
            <div className="text-center py-12">
              <BookOpen className="mx-auto h-12 w-12 text-muted-foreground mb-4" />
              <p className="text-muted-foreground">
                지정도서가 없습니다.
                {isLeader && " 위의 '도서 추가' 버튼을 눌러 도서를 추가하세요."}
              </p>
            </div>
          </CardContent>
        </Card>
      ) : (
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
          {groupBooks.map((groupBook) => {
            const book = groupBook.books;
            if (!book) return null;

            return (
              <Card key={groupBook.id} className="overflow-hidden">
                <div className="relative aspect-[3/4] w-full bg-muted">
                  {isValidImageUrl(book.cover_image_url) ? (
                    <Image
                      src={getImageUrl(book.cover_image_url)}
                      alt={book.title}
                      fill
                      className="object-cover"
                      sizes="(max-width: 768px) 100vw, (max-width: 1200px) 50vw, 33vw"
                    />
                  ) : (
                    <div className="flex items-center justify-center h-full">
                      <BookOpen className="h-12 w-12 text-muted-foreground" />
                    </div>
                  )}
                </div>
                <CardContent className="p-4">
                  <div className="space-y-2">
                    <h4 className="font-semibold line-clamp-2">{book.title}</h4>
                    {book.author && (
                      <p className="text-sm text-muted-foreground">
                        {book.author}
                      </p>
                    )}
                    
                    {groupBook.isInMyLibrary ? (
                      <div className="flex items-center gap-2">
                        <Badge variant="secondary" className="text-xs">
                          <CheckCircle2 className="mr-1 h-3 w-3" />
                          내 서재에 있음
                        </Badge>
                        {groupBook.myStatus && (
                          <BookStatusBadge status={groupBook.myStatus} />
                        )}
                      </div>
                    ) : (
                      <Button
                        size="sm"
                        variant="outline"
                        className="w-full"
                        onClick={() => handleAddToMyLibrary(book.id)}
                      >
                        내 서재에 추가
                      </Button>
                    )}

                    {isLeader && (
                      <Button
                        size="sm"
                        variant="destructive"
                        className="w-full"
                        onClick={() => setDeletingBookId(book.id)}
                      >
                        <Trash2 className="mr-2 h-4 w-4" />
                        지정도서 삭제
                      </Button>
                    )}
                  </div>
                </CardContent>
              </Card>
            );
          })}
        </div>
      )}

      <AlertDialog
        open={deletingBookId !== null}
        onOpenChange={(open) => !open && setDeletingBookId(null)}
      >
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>지정도서 삭제</AlertDialogTitle>
            <AlertDialogDescription>
              정말로 이 지정도서를 삭제하시겠습니까? 이 작업은 되돌릴 수 없습니다.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>취소</AlertDialogCancel>
            <AlertDialogAction
              onClick={() => deletingBookId && handleRemoveBook(deletingBookId)}
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
            >
              삭제
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}

