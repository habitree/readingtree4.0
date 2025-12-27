"use client";

import { useState, useEffect, useCallback } from "react";
import { getNotes, createNote, updateNote, deleteNote } from "@/app/actions/notes";
import type { NoteType, NoteWithBook } from "@/types/note";
import type { CreateNoteInput, UpdateNoteInput } from "@/types/note";

/**
 * 기록 관련 커스텀 훅
 * 기록 목록 조회, 생성, 수정, 삭제 기능 제공
 */
export function useNotes(bookId?: string, type?: NoteType) {
  const [notes, setNotes] = useState<NoteWithBook[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<Error | null>(null);

  const fetchNotes = useCallback(async () => {
    setIsLoading(true);
    setError(null);
    try {
      const data = await getNotes(bookId, type);
      setNotes(data);
    } catch (err) {
      const error = err instanceof Error ? err : new Error("기록 목록 조회 실패");
      setError(error);
      console.error("기록 목록 조회 오류:", error);
    } finally {
      setIsLoading(false);
    }
  }, [bookId, type]);

  useEffect(() => {
    fetchNotes();
  }, [fetchNotes]);

  const handleCreateNote = async (data: CreateNoteInput) => {
    try {
      const result = await createNote(data);
      await fetchNotes(); // 목록 새로고침
      return result;
    } catch (err) {
      const error = err instanceof Error ? err : new Error("기록 생성 실패");
      setError(error);
      throw error;
    }
  };

  const handleUpdateNote = async (noteId: string, data: UpdateNoteInput) => {
    try {
      await updateNote(noteId, data);
      await fetchNotes(); // 목록 새로고침
    } catch (err) {
      const error = err instanceof Error ? err : new Error("기록 수정 실패");
      setError(error);
      throw error;
    }
  };

  const handleDeleteNote = async (noteId: string) => {
    try {
      await deleteNote(noteId);
      await fetchNotes(); // 목록 새로고침
    } catch (err) {
      const error = err instanceof Error ? err : new Error("기록 삭제 실패");
      setError(error);
      throw error;
    }
  };

  return {
    notes,
    isLoading,
    error,
    createNote: handleCreateNote,
    updateNote: handleUpdateNote,
    deleteNote: handleDeleteNote,
    refetch: fetchNotes,
  };
}

