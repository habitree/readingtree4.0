"use client";

import { useState, useEffect } from "react";
import { getUserBooks, addBook, updateBookStatus } from "@/app/actions/books";
import type { ReadingStatus } from "@/types/book";
import type { AddBookInput } from "@/app/actions/books";

/**
 * 책 관련 커스텀 훅
 * 책 목록 조회, 추가, 상태 변경 기능 제공
 */
export function useBooks(status?: ReadingStatus) {
  const [books, setBooks] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<Error | null>(null);

  const fetchBooks = async () => {
    setIsLoading(true);
    setError(null);
    try {
      const data = await getUserBooks(status);
      setBooks(data);
    } catch (err) {
      const error = err instanceof Error ? err : new Error("책 목록 조회 실패");
      setError(error);
      console.error("책 목록 조회 오류:", error);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchBooks();
  }, [status]);

  const handleAddBook = async (
    bookData: AddBookInput,
    bookStatus: ReadingStatus = "reading"
  ) => {
    try {
      await addBook(bookData, bookStatus);
      await fetchBooks(); // 목록 새로고침
    } catch (err) {
      const error = err instanceof Error ? err : new Error("책 추가 실패");
      setError(error);
      throw error;
    }
  };

  const handleUpdateStatus = async (
    userBookId: string,
    newStatus: ReadingStatus
  ) => {
    try {
      await updateBookStatus(userBookId, newStatus);
      await fetchBooks(); // 목록 새로고침
    } catch (err) {
      const error = err instanceof Error ? err : new Error("상태 변경 실패");
      setError(error);
      throw error;
    }
  };

  return {
    books,
    isLoading,
    error,
    addBook: handleAddBook,
    updateStatus: handleUpdateStatus,
    refetch: fetchBooks,
  };
}

