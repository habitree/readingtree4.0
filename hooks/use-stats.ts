"use client";

import { useState } from "react";
import {
  getReadingStats,
  getGoalProgress,
  getMonthlyStats,
  type TimelineSortBy,
  getTimeline,
} from "@/app/actions/stats";

/**
 * 통계 관련 커스텀 훅
 * 통계 데이터 조회 및 관리
 */
export function useStats() {
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<Error | null>(null);

  const fetchStats = async () => {
    setIsLoading(true);
    setError(null);
    try {
      const [stats, progress, monthly] = await Promise.all([
        getReadingStats(),
        getGoalProgress(),
        getMonthlyStats(),
      ]);
      return { stats, progress, monthly };
    } catch (err) {
      const error = err instanceof Error ? err : new Error("통계 조회에 실패했습니다.");
      setError(error);
      throw error;
    } finally {
      setIsLoading(false);
    }
  };

  const fetchGoalProgress = async () => {
    setIsLoading(true);
    setError(null);
    try {
      return await getGoalProgress();
    } catch (err) {
      const error = err instanceof Error ? err : new Error("목표 진행률 조회에 실패했습니다.");
      setError(error);
      throw error;
    } finally {
      setIsLoading(false);
    }
  };

  const fetchTimeline = async (sortBy: TimelineSortBy = "latest", page: number = 1) => {
    setIsLoading(true);
    setError(null);
    try {
      return await getTimeline(sortBy, page);
    } catch (err) {
      const error = err instanceof Error ? err : new Error("타임라인 조회에 실패했습니다.");
      setError(error);
      throw error;
    } finally {
      setIsLoading(false);
    }
  };

  return {
    fetchStats,
    fetchGoalProgress,
    fetchTimeline,
    isLoading,
    error,
  };
}

