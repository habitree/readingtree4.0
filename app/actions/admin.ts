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
 * 현재 설정된 모든 외부 API 정보 및 상태 확인
 */
export async function getApiIntegrationInfo() {
    await requireAdmin();
    
    // ========== 환경 변수 확인 ==========
    // OCR 관련
    const geminiApiKey = process.env.GEMINI_API_KEY;
    const visionCredentialsPath = process.env.GOOGLE_APPLICATION_CREDENTIALS;
    
    // 인증 관련
    const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
    const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
    const supabaseServiceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
    const kakaoAppKey = process.env.NEXT_PUBLIC_KAKAO_APP_KEY;
    
    // 검색 관련
    const naverClientId = process.env.NAVER_CLIENT_ID;
    const naverClientSecret = process.env.NAVER_CLIENT_SECRET;
    
    // 기타
    const appUrl = process.env.NEXT_PUBLIC_APP_URL;
    
    // ========== 1. 인증 API (Supabase Auth) ==========
    const supabaseInfo = {
        provider: "Supabase Authentication",
        enabled: !!(supabaseUrl && supabaseAnonKey),
        configured: !!(supabaseUrl && supabaseAnonKey),
        authMethods: {
            oauth: {
                kakao: "카카오 OAuth 로그인",
                google: "구글 OAuth 로그인",
            },
            email: "이메일/비밀번호 로그인",
        },
        urlStatus: supabaseUrl 
            ? `설정됨 (${supabaseUrl.substring(0, 30)}...)` 
            : "미설정",
        anonKeyStatus: supabaseAnonKey 
            ? `설정됨 (${supabaseAnonKey.substring(0, 20)}...)` 
            : "미설정",
        serviceRoleKeyStatus: supabaseServiceRoleKey 
            ? "설정됨 (현재 미사용)" 
            : "미설정 (선택사항)",
        apiReference: "https://supabase.com/docs/guides/auth",
        features: [
            "OAuth 소셜 로그인 (카카오, 구글)",
            "이메일/비밀번호 인증",
            "세션 관리 (쿠키 기반)",
            "Row Level Security (RLS) 지원",
        ],
        notes: "모든 인증 기능의 핵심 인프라",
    };
    
    // 카카오 JavaScript SDK (선택사항)
    const kakaoSdkInfo = {
        provider: "Kakao JavaScript SDK",
        enabled: !!kakaoAppKey,
        configured: !!kakaoAppKey,
        keyStatus: kakaoAppKey 
            ? `설정됨 (${kakaoAppKey.substring(0, 10)}...)` 
            : "미설정",
        apiReference: "https://developers.kakao.com/docs",
        features: [
            "카카오톡 공유 기능 (선택사항)",
            "카카오 로그인 (Supabase OAuth 사용 시 불필요)",
        ],
        notes: "선택사항. Supabase OAuth만으로도 카카오 로그인 가능",
    };
    
    // ========== 2. 검색 API (Naver Book Search) ==========
    const naverInfo = {
        provider: "Naver Book Search API",
        enabled: !!(naverClientId && naverClientSecret),
        configured: !!(naverClientId && naverClientSecret),
        clientIdStatus: naverClientId 
            ? `설정됨 (${naverClientId.substring(0, 10)}...)` 
            : "미설정",
        clientSecretStatus: naverClientSecret 
            ? "설정됨" 
            : "미설정",
        apiReference: "https://developers.naver.com/docs/search/book/",
        features: [
            "책 검색 기능",
            "책 정보 자동 수집 (제목, 저자, 출판사, ISBN 등)",
            "책 표지 이미지 제공",
            "Rate Limit: 분당 60회",
        ],
        notes: "책 검색 기능에 필수",
    };
    
    // ========== 3. OCR API (Gemini & Vision) ==========
    const geminiInfo = {
        provider: "Google Gemini API",
        enabled: !!geminiApiKey,
        configured: !!geminiApiKey,
        model: "gemini-1.5-flash",
        apiVersion: "v1beta",
        keyStatus: geminiApiKey 
            ? `설정됨 (${geminiApiKey.substring(0, 10)}...${geminiApiKey.substring(geminiApiKey.length - 4)})`
            : "미설정",
        priority: 1,
        description: "구글 Gemini API를 사용한 OCR 처리 (1순위)",
        apiReference: "https://ai.google.dev/models/gemini",
        features: [
            "무료 한도: 1,500건/일",
            "빠른 응답 속도",
            "한글/영어 모두 지원",
            "이미지 최대 크기: 20MB",
        ],
        notes: "OCR 처리의 1순위 API",
    };
    
    const visionInfo = {
        provider: "Google Cloud Vision API",
        enabled: !!visionCredentialsPath,
        configured: !!visionCredentialsPath,
        authMethod: "서비스 계정 파일 경로",
        credentialsPath: visionCredentialsPath || "미설정",
        priority: 2,
        description: "Google Vision API를 사용한 OCR 처리 (2순위, 폴백용)",
        apiReference: "https://cloud.google.com/vision",
        features: [
            "Gemini API 실패 시 자동 폴백",
            "서비스 계정 기반 인증",
            "높은 정확도",
            "다양한 언어 지원",
        ],
        notes: "OCR 처리의 2순위 API (폴백용)",
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
    
    // ========== 4. 기타 설정 ==========
    const appInfo = {
        appUrl: appUrl || "미설정",
        notes: "앱 기본 URL (OAuth 리다이렉트 등에 사용)",
    };
    
    // ========== 권장 설정 ==========
    const recommendations = [];
    
    // 인증 관련
    if (!supabaseInfo.enabled) {
        recommendations.push({
            type: "error",
            message: "Supabase 인증 설정이 누락되었습니다!",
            action: "NEXT_PUBLIC_SUPABASE_URL과 NEXT_PUBLIC_SUPABASE_ANON_KEY를 설정하세요.",
            priority: "긴급",
            category: "인증",
        });
    }
    
    // 검색 관련
    if (!naverInfo.enabled) {
        recommendations.push({
            type: "warning",
            message: "네이버 책 검색 API가 설정되지 않았습니다.",
            action: "NAVER_CLIENT_ID와 NAVER_CLIENT_SECRET을 설정하세요.",
            priority: "높음",
            category: "검색",
        });
    }
    
    // OCR 관련
    if (!geminiInfo.enabled) {
        recommendations.push({
            type: "warning",
            message: "Gemini API 키가 설정되지 않았습니다.",
            action: "Vercel 환경 변수에 GEMINI_API_KEY를 추가하세요.",
            priority: "높음",
            category: "OCR",
        });
    }
    if (!visionInfo.enabled) {
        recommendations.push({
            type: "info",
            message: "Vision API가 설정되지 않았습니다. (선택 사항)",
            action: "폴백 기능을 위해 GOOGLE_APPLICATION_CREDENTIALS 설정을 권장합니다.",
            priority: "중간",
            category: "OCR",
        });
    }
    if (geminiInfo.enabled && visionInfo.enabled) {
        recommendations.push({
            type: "success",
            message: "모든 OCR API가 정상적으로 설정되었습니다!",
            action: "이중 폴백 전략으로 안정적인 OCR 서비스를 제공합니다.",
            priority: "정상",
            category: "OCR",
        });
    }
    
    // ========== 요약 통계 ==========
    const allApis = [
        { name: "Supabase Auth", enabled: supabaseInfo.enabled },
        { name: "Kakao SDK", enabled: kakaoSdkInfo.enabled },
        { name: "Naver Search", enabled: naverInfo.enabled },
        { name: "Gemini API", enabled: geminiInfo.enabled },
        { name: "Vision API", enabled: visionInfo.enabled },
    ];
    
    const enabledApis = allApis.filter(api => api.enabled).length;
    const criticalApis = [
        supabaseInfo.enabled, // 필수
        naverInfo.enabled, // 필수
    ];
    const allCriticalEnabled = criticalApis.every(Boolean);
    
    return {
        // 인증
        supabase: supabaseInfo,
        kakaoSdk: kakaoSdkInfo,
        
        // 검색
        naver: naverInfo,
        
        // OCR
        gemini: geminiInfo,
        vision: visionInfo,
        ocrFlow,
        
        // 기타
        app: appInfo,
        
        // 권장 사항
        recommendations,
        
        // 요약
        summary: {
            totalApis: allApis.length,
            enabledApis,
            criticalApis: criticalApis.length,
            criticalEnabled: allCriticalEnabled,
            status: allCriticalEnabled 
                ? (enabledApis === allApis.length ? "완벽" : "정상") 
                : "설정 필요",
        },
    };
}