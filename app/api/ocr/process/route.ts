import { NextRequest, NextResponse } from "next/server";
import { extractTextFromImage } from "@/lib/api/gemini";
import { updateNoteContent } from "@/app/actions/notes";

/**
 * OCR 실제 처리 API
 * Queue에서 호출되어 실제 OCR 처리를 수행합니다.
 */
export async function POST(request: NextRequest) {
  try {
    const { noteId, imageUrl } = await request.json();

    // 파라미터 검증
    if (!noteId || !imageUrl) {
      return NextResponse.json(
        { error: "noteId와 imageUrl이 필요합니다." },
        { status: 400 }
      );
    }

    // OCR 처리 (비동기)
    const extractedText = await extractTextFromImage(imageUrl);

    // Notes 테이블 업데이트
    await updateNoteContent(noteId, extractedText);

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

