import { NextRequest, NextResponse } from "next/server";
import { createServerSupabaseClient } from "@/lib/supabase/server";

/**
 * OCR 처리 요청 API
 * 즉시 응답하고 백그라운드에서 OCR 처리를 시작합니다.
 * 실제 OCR 처리는 /api/ocr/process에서 수행됩니다.
 */
export async function POST(request: NextRequest) {
  try {
    const supabase = await createServerSupabaseClient();

    // 인증 확인
    const {
      data: { user },
      error: authError,
    } = await supabase.auth.getUser();

    if (authError || !user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { noteId, imageUrl } = await request.json();

    if (!noteId || !imageUrl) {
      return NextResponse.json(
        { error: "noteId와 imageUrl이 필요합니다." },
        { status: 400 }
      );
    }

    // 기록 소유 확인
    const { data: note } = await supabase
      .from("notes")
      .select("id, user_id")
      .eq("id", noteId)
      .eq("user_id", user.id)
      .single();

    if (!note) {
      return NextResponse.json({ error: "권한이 없습니다." }, { status: 403 });
    }

    // 백그라운드에서 OCR 처리 시작
    // 실제 프로덕션에서는 Queue 시스템(Vercel Queue, Supabase Edge Functions 등)을 사용
    // 여기서는 즉시 처리하되, 실제로는 비동기로 처리되어야 함
    fetch(`${request.nextUrl.origin}/api/ocr/process`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({ noteId, imageUrl }),
    }).catch((error) => {
      console.error("OCR 처리 요청 오류:", error);
      // 실패해도 사용자에게는 즉시 응답 반환
    });

    // 즉시 응답 반환
    return NextResponse.json({ success: true, noteId });
  } catch (error) {
    console.error("OCR 요청 API 오류:", error);
    return NextResponse.json(
      {
        error:
          error instanceof Error ? error.message : "OCR 요청에 실패했습니다.",
      },
      { status: 500 }
    );
  }
}

