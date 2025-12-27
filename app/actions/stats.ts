"use server";

import { createServerSupabaseClient } from "@/lib/supabase/server";
import type { NoteWithBook } from "@/types/note";

export type TimelineSortBy = "latest" | "oldest" | "book";

/**
 * 타임라인 조회
 * @param sortBy 정렬 방식 (latest: 최신순, oldest: 오래된순, book: 책별)
 * @param page 페이지 번호 (기본값: 1)
 */
export async function getTimeline(
  sortBy: TimelineSortBy = "latest",
  page: number = 1
) {
  const supabase = await createServerSupabaseClient();

  // 현재 사용자 확인
  const {
    data: { user },
    error: authError,
  } = await supabase.auth.getUser();

  if (authError || !user) {
    throw new Error("로그인이 필요합니다.");
  }

  const ITEMS_PER_PAGE = 20;
  const from = (page - 1) * ITEMS_PER_PAGE;
  const to = from + ITEMS_PER_PAGE - 1;

  let query = supabase
    .from("notes")
    .select(
      `
      *,
      books (
        id,
        title,
        author,
        cover_image_url
      )
    `,
      { count: "exact" }
    )
    .eq("user_id", user.id);

  // 정렬 적용
  if (sortBy === "latest") {
    query = query.order("created_at", { ascending: false });
  } else if (sortBy === "oldest") {
    query = query.order("created_at", { ascending: true });
  } else if (sortBy === "book") {
    query = query
      .order("book_id", { ascending: true })
      .order("created_at", { ascending: false });
  }

  // 페이지네이션
  query = query.range(from, to);

  const { data, error, count } = await query;

  if (error) {
    throw new Error(`타임라인 조회 실패: ${error.message}`);
  }

  const totalPages = count ? Math.ceil(count / ITEMS_PER_PAGE) : 0;

  return {
    items: (data || []) as NoteWithBook[],
    total: count || 0,
    page,
    totalPages,
    itemsPerPage: ITEMS_PER_PAGE,
  };
}

/**
 * 독서 통계 조회
 * 이번 주, 올해 통계 및 인기 책 반환
 */
export async function getReadingStats() {
  const supabase = await createServerSupabaseClient();

  // 현재 사용자 확인
  const {
    data: { user },
    error: authError,
  } = await supabase.auth.getUser();

  if (authError || !user) {
    throw new Error("로그인이 필요합니다.");
  }

  const now = new Date();
  const startOfWeek = new Date(now);
  startOfWeek.setDate(now.getDate() - now.getDay());
  startOfWeek.setHours(0, 0, 0, 0);

  const startOfYear = new Date(now.getFullYear(), 0, 1);

  // 이번 주 기록 수
  const { count: thisWeekNotes } = await supabase
    .from("notes")
    .select("*", { count: "exact", head: true })
    .eq("user_id", user.id)
    .gte("created_at", startOfWeek.toISOString());

  // 올해 완독한 책 수
  const { count: thisYearCompleted } = await supabase
    .from("user_books")
    .select("*", { count: "exact", head: true })
    .eq("user_id", user.id)
    .eq("status", "completed")
    .gte("completed_at", startOfYear.toISOString());

  // 올해 작성한 기록 수
  const { count: thisYearNotes } = await supabase
    .from("notes")
    .select("*", { count: "exact", head: true })
    .eq("user_id", user.id)
    .gte("created_at", startOfYear.toISOString());

  // 가장 많이 기록한 책 (상위 5개)
  const { data: topBooksData } = await supabase
    .from("notes")
    .select(
      `
      book_id,
      books (
        id,
        title,
        author,
        cover_image_url
      )
    `
    )
    .eq("user_id", user.id);

  // 책별 기록 수 집계
  const bookCounts = new Map<string, { count: number; book: any }>();
  if (topBooksData) {
    topBooksData.forEach((note) => {
      const bookId = note.book_id;
      const book = (note.books as any);
      if (book) {
        const existing = bookCounts.get(bookId);
        if (existing) {
          existing.count++;
        } else {
          bookCounts.set(bookId, { count: 1, book });
        }
      }
    });
  }

  const topBooks = Array.from(bookCounts.values())
    .sort((a, b) => b.count - a.count)
    .slice(0, 5)
    .map((item) => ({
      book: item.book,
      noteCount: item.count,
    }));

  return {
    thisWeek: {
      notes: thisWeekNotes || 0,
    },
    thisYear: {
      completedBooks: thisYearCompleted || 0,
      notes: thisYearNotes || 0,
    },
    topBooks,
  };
}

/**
 * 목표 진행률 조회
 * 올해 독서 목표 대비 완독한 책 수
 */
export async function getGoalProgress() {
  const supabase = await createServerSupabaseClient();

  // 현재 사용자 확인
  const {
    data: { user },
    error: authError,
  } = await supabase.auth.getUser();

  if (authError || !user) {
    throw new Error("로그인이 필요합니다.");
  }

  // 사용자 목표 조회
  const { data: profile, error: profileError } = await supabase
    .from("users")
    .select("reading_goal")
    .eq("id", user.id)
    .single();

  if (profileError || !profile) {
    throw new Error("사용자 정보를 찾을 수 없습니다.");
  }

  const goal = profile.reading_goal || 0;

  // 올해 완독한 책 수
  const startOfYear = new Date(new Date().getFullYear(), 0, 1);
  const { count: completed } = await supabase
    .from("user_books")
    .select("*", { count: "exact", head: true })
    .eq("user_id", user.id)
    .eq("status", "completed")
    .gte("completed_at", startOfYear.toISOString());

  const completedCount = completed || 0;
  const progress = goal > 0 ? Math.min((completedCount / goal) * 100, 100) : 0;

  return {
    goal,
    completed: completedCount,
    progress: Math.round(progress),
    remaining: Math.max(goal - completedCount, 0),
  };
}

/**
 * 월별 기록 통계 조회
 * 최근 6개월간의 기록 수
 */
export async function getMonthlyStats() {
  const supabase = await createServerSupabaseClient();

  // 현재 사용자 확인
  const {
    data: { user },
    error: authError,
  } = await supabase.auth.getUser();

  if (authError || !user) {
    throw new Error("로그인이 필요합니다.");
  }

  const now = new Date();
  const months: { month: string; count: number }[] = [];

  // 최근 6개월
  for (let i = 5; i >= 0; i--) {
    const date = new Date(now.getFullYear(), now.getMonth() - i, 1);
    const nextMonth = new Date(now.getFullYear(), now.getMonth() - i + 1, 1);

    const { count } = await supabase
      .from("notes")
      .select("*", { count: "exact", head: true })
      .eq("user_id", user.id)
      .gte("created_at", date.toISOString())
      .lt("created_at", nextMonth.toISOString());

    months.push({
      month: `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, "0")}`,
      count: count || 0,
    });
  }

  return months;
}

