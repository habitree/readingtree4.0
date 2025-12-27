"use client";

import { useState } from "react";
import {
  getGroups,
  getPublicGroups,
  getGroupDetail,
  joinGroup,
  createGroup,
  approveMember,
  rejectMember,
  shareNoteToGroup,
} from "@/app/actions/groups";

/**
 * 모임 관련 커스텀 훅
 * 모임 데이터 조회 및 관리
 */
export function useGroups() {
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<Error | null>(null);

  const fetchGroups = async (isPublic?: boolean) => {
    setIsLoading(true);
    setError(null);
    try {
      return await getGroups(isPublic);
    } catch (err) {
      const error = err instanceof Error ? err : new Error("모임 목록 조회에 실패했습니다.");
      setError(error);
      throw error;
    } finally {
      setIsLoading(false);
    }
  };

  const fetchPublicGroups = async (searchQuery?: string) => {
    setIsLoading(true);
    setError(null);
    try {
      return await getPublicGroups(searchQuery);
    } catch (err) {
      const error = err instanceof Error ? err : new Error("공개 모임 조회에 실패했습니다.");
      setError(error);
      throw error;
    } finally {
      setIsLoading(false);
    }
  };

  const fetchGroupDetail = async (groupId: string) => {
    setIsLoading(true);
    setError(null);
    try {
      return await getGroupDetail(groupId);
    } catch (err) {
      const error = err instanceof Error ? err : new Error("모임 상세 조회에 실패했습니다.");
      setError(error);
      throw error;
    } finally {
      setIsLoading(false);
    }
  };

  const handleJoin = async (groupId: string) => {
    setIsLoading(true);
    setError(null);
    try {
      return await joinGroup(groupId);
    } catch (err) {
      const error = err instanceof Error ? err : new Error("모임 참여에 실패했습니다.");
      setError(error);
      throw error;
    } finally {
      setIsLoading(false);
    }
  };

  const handleCreate = async (data: {
    name: string;
    description?: string;
    isPublic: boolean;
  }) => {
    setIsLoading(true);
    setError(null);
    try {
      return await createGroup(data);
    } catch (err) {
      const error = err instanceof Error ? err : new Error("모임 생성에 실패했습니다.");
      setError(error);
      throw error;
    } finally {
      setIsLoading(false);
    }
  };

  const handleApprove = async (groupId: string, userId: string) => {
    setIsLoading(true);
    setError(null);
    try {
      return await approveMember(groupId, userId);
    } catch (err) {
      const error = err instanceof Error ? err : new Error("멤버 승인에 실패했습니다.");
      setError(error);
      throw error;
    } finally {
      setIsLoading(false);
    }
  };

  const handleReject = async (groupId: string, userId: string) => {
    setIsLoading(true);
    setError(null);
    try {
      return await rejectMember(groupId, userId);
    } catch (err) {
      const error = err instanceof Error ? err : new Error("멤버 거부에 실패했습니다.");
      setError(error);
      throw error;
    } finally {
      setIsLoading(false);
    }
  };

  const handleShareNote = async (noteId: string, groupId: string) => {
    setIsLoading(true);
    setError(null);
    try {
      return await shareNoteToGroup(noteId, groupId);
    } catch (err) {
      const error = err instanceof Error ? err : new Error("기록 공유에 실패했습니다.");
      setError(error);
      throw error;
    } finally {
      setIsLoading(false);
    }
  };

  return {
    fetchGroups,
    fetchPublicGroups,
    fetchGroupDetail,
    handleJoin,
    handleCreate,
    handleApprove,
    handleReject,
    handleShareNote,
    isLoading,
    error,
  };
}

