"use server";

import { createServerSupabaseClient } from "@/lib/supabase/server";

/**
 * 관리자용 전체 시스템 통계 조회
 */
export async function getAdminStats() {
    const supabase = await createServerSupabaseClient();

    // 전체 사용자 수
    const { count: totalUsers } = await supabase
        .from("users")
        .select("*", { count: "exact", head: true });

    // 전체 도서 수
    const { count: totalBooks } = await supabase
        .from("books")
        .select("*", { count: "exact", head: true });

    // 전체 기록 수
    const { count: totalNotes } = await supabase
        .from("notes")
        .select("*", { count: "exact", head: true });

    // 전체 그룹 수
    const { count: totalGroups } = await supabase
        .from("groups")
        .select("*", { count: "exact", head: true });

    // 최근 24시간 내 생성된 데이터
    const yesterday = new Date();
    yesterday.setHours(yesterday.getHours() - 24);
    const yesterdayISO = yesterday.toISOString();

    const { count: newUsersToday } = await supabase
        .from("users")
        .select("*", { count: "exact", head: true })
        .gte("created_at", yesterdayISO);

    const { count: newNotesToday } = await supabase
        .from("notes")
        .select("*", { count: "exact", head: true })
        .gte("created_at", yesterdayISO);

    return {
        summary: {
            users: totalUsers || 0,
            books: totalBooks || 0,
            notes: totalNotes || 0,
            groups: totalGroups || 0,
        },
        today: {
            newUsers: newUsersToday || 0,
            newNotes: newNotesToday || 0,
        }
    };
}

/**
 * 월별 사용자 성장 데이터 조회 (최근 6개월)
 */
export async function getUserGrowthData() {
    const supabase = await createServerSupabaseClient();
    const now = new Date();
    const growthData = [];

    for (let i = 5; i >= 0; i--) {
        const startOfMonth = new Date(now.getFullYear(), now.getMonth() - i, 1);
        const endOfMonth = new Date(now.getFullYear(), now.getMonth() - i + 1, 0, 23, 59, 59);

        const { count } = await supabase
            .from("users")
            .select("*", { count: "exact", head: true })
            .gte("created_at", startOfMonth.toISOString())
            .lte("created_at", endOfMonth.toISOString());

        growthData.push({
            month: `${startOfMonth.getMonth() + 1}월`,
            count: count || 0,
            fullDate: startOfMonth.toISOString(),
        });
    }

    return growthData;
}

/**
 * 최근 시스템 활동 조회 (최근 가입자 및 최근 기록)
 */
export async function getRecentSystemActivity() {
    const supabase = await createServerSupabaseClient();

    // 최근 가입한 사용자 5명
    const { data: recentUsers } = await supabase
        .from("users")
        .select("id, name, email, avatar_url, created_at")
        .order("created_at", { ascending: false })
        .limit(5);

    // 최근 작성된 기록 5개
    const { data: recentNotes } = await supabase
        .from("notes")
        .select(`
      id,
      content,
      type,
      created_at,
      user_id,
      users (name),
      books (title)
    `)
        .order("created_at", { ascending: false })
        .limit(10);

    return {
        recentUsers: recentUsers || [],
        recentNotes: recentNotes || [],
    };
}
