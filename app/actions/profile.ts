"use server";

import { createServerSupabaseClient } from "@/lib/supabase/server";
import { revalidatePath } from "next/cache";
import sharp from "sharp";

/**
 * 프로필 조회
 */
export async function getProfile() {
  const supabase = await createServerSupabaseClient();

  // 현재 사용자 확인
  const {
    data: { user },
    error: authError,
  } = await supabase.auth.getUser();

  if (authError || !user) {
    throw new Error("로그인이 필요합니다.");
  }

  // 프로필 조회
  const { data, error } = await supabase
    .from("users")
    .select("*")
    .eq("id", user.id)
    .single();

  if (error || !data) {
    throw new Error(`프로필 조회 실패: ${error?.message || "프로필을 찾을 수 없습니다."}`);
  }

  return data;
}

/**
 * 프로필 수정
 * @param data 수정할 프로필 데이터
 */
export async function updateProfile(data: {
  name?: string;
  reading_goal?: number;
}) {
  const supabase = await createServerSupabaseClient();

  // 현재 사용자 확인
  const {
    data: { user },
    error: authError,
  } = await supabase.auth.getUser();

  if (authError || !user) {
    throw new Error("로그인이 필요합니다.");
  }

  // 독서 목표 유효성 검사
  if (data.reading_goal !== undefined) {
    if (data.reading_goal < 1 || data.reading_goal > 100) {
      throw new Error("독서 목표는 1-100 사이의 숫자여야 합니다.");
    }
  }

  // 이름 유효성 검사
  if (data.name !== undefined) {
    if (!data.name.trim() || data.name.length > 100) {
      throw new Error("이름은 1-100자 사이여야 합니다.");
    }
  }

  // 프로필 업데이트
  const updateData: {
    name?: string;
    reading_goal?: number;
  } = {};

  if (data.name !== undefined) {
    updateData.name = data.name.trim();
  }
  if (data.reading_goal !== undefined) {
    updateData.reading_goal = data.reading_goal;
  }

  const { error } = await supabase
    .from("users")
    .update(updateData)
    .eq("id", user.id);

  if (error) {
    throw new Error(`프로필 수정 실패: ${error.message}`);
  }

  revalidatePath("/profile");
  revalidatePath("/");
  return { success: true };
}

/**
 * 프로필 이미지 업로드
 * @param imageFile 이미지 파일 (최대 2MB, jpg/png/webp)
 */
export async function updateProfileImage(imageFile: File) {
  const supabase = await createServerSupabaseClient();

  // 현재 사용자 확인
  const {
    data: { user },
    error: authError,
  } = await supabase.auth.getUser();

  if (authError || !user) {
    throw new Error("로그인이 필요합니다.");
  }

  // 파일 형식 검증
  const allowedTypes = ["image/jpeg", "image/jpg", "image/png", "image/webp"];
  if (!allowedTypes.includes(imageFile.type)) {
    throw new Error("지원하지 않는 파일 형식입니다. (jpg, png, webp만 지원)");
  }

  // 파일 크기 검증 (최대 2MB)
  const MAX_SIZE = 2 * 1024 * 1024; // 2MB
  if (imageFile.size > MAX_SIZE) {
    throw new Error("파일 크기는 2MB 이하여야 합니다.");
  }

  // 이미지 압축 (필요시)
  let fileToUpload = imageFile;
  if (imageFile.size > MAX_SIZE * 0.8) {
    // 1.6MB 이상이면 압축
    try {
      const buffer = await imageFile.arrayBuffer();
      const compressed = await sharp(Buffer.from(buffer))
        .resize(400, 400, { fit: "cover", withoutEnlargement: true })
        .jpeg({ quality: 85 })
        .toBuffer();

      fileToUpload = new File(
        [new Uint8Array(compressed)],
        `avatar-${Date.now()}.jpg`,
        { type: "image/jpeg" }
      );
    } catch (error) {
      console.error("이미지 압축 오류:", error);
      // 압축 실패해도 원본 파일로 업로드 시도
    }
  }

  // 파일 확장자 추출
  const fileExt = fileToUpload.name.split(".").pop() || "jpg";
  const timestamp = Date.now();
  const random = Math.random().toString(36).substring(2, 9);
  const fileName = `avatar-${timestamp}-${random}.${fileExt}`;

  // 업로드 경로: avatars/{userId}/{fileName}
  const filePath = `avatars/${user.id}/${fileName}`;

  // 기존 프로필 이미지 삭제 (있으면)
  const { data: currentProfile } = await supabase
    .from("users")
    .select("avatar_url")
    .eq("id", user.id)
    .single();

  if (currentProfile?.avatar_url) {
    // Supabase Storage URL에서 경로 추출
    const oldPath = currentProfile.avatar_url.split("/avatars/")[1];
    if (oldPath) {
      await supabase.storage.from("images").remove([`avatars/${oldPath}`]);
    }
  }

  // Supabase Storage에 업로드
  const { data: uploadData, error: uploadError } = await supabase.storage
    .from("images")
    .upload(filePath, fileToUpload, {
      cacheControl: "3600",
      upsert: false,
    });

  if (uploadError) {
    console.error("업로드 오류:", uploadError);
    throw new Error(`업로드 실패: ${uploadError.message}`);
  }

  // 공개 URL 생성
  const {
    data: { publicUrl },
  } = supabase.storage.from("images").getPublicUrl(filePath);

  // 프로필에 이미지 URL 저장
  const { error: updateError } = await supabase
    .from("users")
    .update({ avatar_url: publicUrl })
    .eq("id", user.id);

  if (updateError) {
    // 업로드는 성공했지만 DB 업데이트 실패 시 파일 삭제
    await supabase.storage.from("images").remove([filePath]);
    throw new Error(`프로필 업데이트 실패: ${updateError.message}`);
  }

  revalidatePath("/profile");
  revalidatePath("/");
  return { success: true, avatarUrl: publicUrl };
}

