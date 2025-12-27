import { NextRequest, NextResponse } from "next/server";
import { createServerSupabaseClient } from "@/lib/supabase/server";
import sharp from "sharp";
import { validateImageSize, validateImageType } from "@/lib/utils/image";

/**
 * 이미지 업로드 API
 * Supabase Storage에 이미지를 업로드합니다.
 * 파일 크기가 5MB를 초과하면 자동으로 압축합니다.
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

    // 폼 데이터 파싱
    const formData = await request.formData();
    const file = formData.get("file") as File;
    const type = formData.get("type") as string; // 'photo' | 'transcription'

    if (!file) {
      return NextResponse.json({ error: "파일이 제공되지 않았습니다." }, { status: 400 });
    }

    // 파일 형식 검증
    if (!validateImageType(file)) {
      return NextResponse.json(
        { error: "지원하지 않는 파일 형식입니다. (jpg, png, webp, heic만 지원)" },
        { status: 400 }
      );
    }

    // 파일 크기 확인 및 압축
    const MAX_SIZE = 5 * 1024 * 1024; // 5MB
    let fileToUpload = file;

    if (file.size > MAX_SIZE) {
      // 이미지 압축
      try {
        const buffer = await file.arrayBuffer();
        const compressed = await sharp(Buffer.from(buffer))
          .resize(1920, 1920, { fit: "inside", withoutEnlargement: true })
          .jpeg({ quality: 80 })
          .toBuffer();

        fileToUpload = new File([new Uint8Array(compressed)], file.name.replace(/\.[^.]+$/, ".jpg"), {
          type: "image/jpeg",
        });
      } catch (error) {
        console.error("이미지 압축 오류:", error);
        return NextResponse.json(
          { error: "이미지 압축에 실패했습니다." },
          { status: 500 }
        );
      }
    }

    // 파일 확장자 추출
    const fileExt = fileToUpload.name.split(".").pop() || "jpg";
    const timestamp = Date.now();
    const random = Math.random().toString(36).substring(2, 9);
    const fileName = `${timestamp}-${random}.${fileExt}`;

    // 업로드 경로: ${type}s/${userId}/${fileName}
    const filePath = `${type}s/${user.id}/${fileName}`;

    // Supabase Storage에 업로드
    const { data, error: uploadError } = await supabase.storage
      .from("images")
      .upload(filePath, fileToUpload, {
        cacheControl: "3600",
        upsert: false,
      });

    if (uploadError) {
      console.error("업로드 오류:", uploadError);
      return NextResponse.json(
        { error: `업로드 실패: ${uploadError.message}` },
        { status: 500 }
      );
    }

    // 공개 URL 생성
    const {
      data: { publicUrl },
    } = supabase.storage.from("images").getPublicUrl(filePath);

    return NextResponse.json({ url: publicUrl });
  } catch (error) {
    console.error("업로드 API 오류:", error);
    return NextResponse.json(
      {
        error:
          error instanceof Error ? error.message : "업로드에 실패했습니다.",
      },
      { status: 500 }
    );
  }
}

