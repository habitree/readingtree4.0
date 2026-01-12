"use server";

import { createServerSupabaseClient } from "@/lib/supabase/server";
import { isAdmin } from "@/app/actions/auth";

/**
 * 관리자 권한 확인 및 예외 발생
 */
async function requireAdmin() {
    const admin = await isAdmin();
    if (!admin) {
        throw new Error("관리자 권한이 필요합니다.");
    }
}

/**
 * 관리자용 전체 시스템 통계 조회
 */
export async function getAdminStats() {
    await requireAdmin();
    
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
    await requireAdmin();
    
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
    await requireAdmin();
    
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

/**
 * API 연동 정보 조회
 * 현재 설정된 OCR API 정보 및 상태 확인
 */
export async function getApiIntegrationInfo() {
    await requireAdmin();
    
    // 환경 변수 확인
    const geminiApiKey = process.env.GEMINI_API_KEY;
    const visionCredentialsPath = process.env.GOOGLE_APPLICATION_CREDENTIALS;
    
    // Gemini API 정보
    const geminiInfo = {
        enabled: !!geminiApiKey,
        configured: !!geminiApiKey,
        model: "gemini-1.5-flash-latest",
        apiVersion: "v1beta",
        keyStatus: geminiApiKey 
            ? `설정됨 (${geminiApiKey.substring(0, 10)}...${geminiApiKey.substring(geminiApiKey.length - 4)})`
            : "미설정",
        priority: 1,
        description: "구글 Gemini API를 사용한 OCR 처리 (1순위)",
        features: [
            "무료 한도: 1,500건/일",
            "빠른 응답 속도",
            "한글/영어 모두 지원",
            "이미지 최대 크기: 20MB"
        ]
    };
    
    // Vision API 정보
    const visionInfo = {
        enabled: !!visionCredentialsPath,
        configured: !!visionCredentialsPath,
        authMethod: "서비스 계정 파일 경로",
        credentialsPath: visionCredentialsPath || "미설정",
        priority: 2,
        description: "Google Vision API를 사용한 OCR 처리 (2순위, 폴백용)",
        features: [
            "Gemini API 실패 시 자동 폴백",
            "서비스 계정 기반 인증",
            "높은 정확도",
            "다양한 언어 지원"
        ]
    };
    
    // OCR 처리 흐름
    const ocrFlow = {
        step1: {
            title: "1순위: Gemini API",
            status: geminiInfo.enabled ? "사용 가능" : "미설정",
            action: geminiInfo.enabled 
                ? "Gemini API로 OCR 처리 시도" 
                : "건너뛰고 2순위로 이동"
        },
        step2: {
            title: "2순위: Vision API (폴백)",
            status: visionInfo.enabled ? "사용 가능" : "미설정",
            action: visionInfo.enabled
                ? "Vision API로 OCR 처리 시도"
                : "OCR 처리 실패"
        },
        currentStrategy: geminiInfo.enabled && visionInfo.enabled
            ? "이중 폴백 전략 (Gemini → Vision)"
            : geminiInfo.enabled
            ? "Gemini API 단독 사용"
            : visionInfo.enabled
            ? "Vision API 단독 사용"
            : "OCR 사용 불가"
    };
    
    // 권장 설정
    const recommendations = [];
    if (!geminiInfo.enabled) {
        recommendations.push({
            type: "warning",
            message: "Gemini API 키가 설정되지 않았습니다.",
            action: "Vercel 환경 변수에 GEMINI_API_KEY를 추가하세요.",
            priority: "높음"
        });
    }
    if (!visionInfo.enabled) {
        recommendations.push({
            type: "info",
            message: "Vision API가 설정되지 않았습니다. (선택 사항)",
            action: "폴백 기능을 위해 GOOGLE_APPLICATION_CREDENTIALS 설정을 권장합니다.",
            priority: "중간"
        });
    }
    if (geminiInfo.enabled && visionInfo.enabled) {
        recommendations.push({
            type: "success",
            message: "모든 OCR API가 정상적으로 설정되었습니다!",
            action: "이중 폴백 전략으로 안정적인 OCR 서비스를 제공합니다.",
            priority: "정상"
        });
    }
    
    return {
        gemini: geminiInfo,
        vision: visionInfo,
        ocrFlow,
        recommendations,
        summary: {
            totalApis: 2,
            enabledApis: [geminiInfo.enabled, visionInfo.enabled].filter(Boolean).length,
            status: geminiInfo.enabled || visionInfo.enabled ? "정상" : "설정 필요"
        }
    };
}