import { NextRequest, NextResponse } from "next/server";
import { createServerSupabaseClient } from "@/lib/supabase/server";
import { extractTextFromImage } from "@/lib/api/gemini";

/**
 * OCR 실제 처리 API
 * Queue에서 호출되어 실제 OCR 처리를 수행합니다.
 */
export async function POST(request: NextRequest) {
  try {
    const supabase = await createServerSupabaseClient();

    const { noteId, imageUrl } = await request.json();

    // 파라미터 검증
    if (!noteId || !imageUrl) {
      return NextResponse.json(
        { error: "noteId와 imageUrl이 필요합니다." },
        { status: 400 }
      );
    }

    // 기록 존재 확인 (RLS 정책으로 인해 권한 확인도 함께 수행)
    const { data: note, error: noteError } = await supabase
      .from("notes")
      .select("id")
      .eq("id", noteId)
      .maybeSingle();

    if (noteError && noteError.code !== "PGRST116") {
      console.error("기록 조회 오류:", noteError);
      return NextResponse.json(
        { error: `기록 조회 실패: ${noteError.message}` },
        { status: 500 }
      );
    }

    if (!note) {
      return NextResponse.json(
        { error: "기록을 찾을 수 없습니다." },
        { status: 404 }
      );
    }

    // OCR 처리 (비동기)
    const extractedText = await extractTextFromImage(imageUrl);

    // Notes 테이블 업데이트
    const { error: updateError } = await supabase
      .from("notes")
      .update({ content: extractedText })
      .eq("id", noteId);

    if (updateError) {
      console.error("OCR 결과 저장 오류:", updateError);
      throw updateError;
    }

    return NextResponse.json({ success: true, extractedText });
  } catch (error) {
    console.error("OCR 처리 오류:", error);
    // 실패 시 재시도 로직은 Queue 시스템에서 처리
    return NextResponse.json(
      {
        error:
          error instanceof Error ? error.message : "OCR 처리에 실패했습니다.",
      },
      { status: 500 }
    );
  }
}

