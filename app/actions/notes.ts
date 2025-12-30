"use server";

import { createServerSupabaseClient } from "@/lib/supabase/server";
import { revalidatePath } from "next/cache";
import type { CreateNoteInput, UpdateNoteInput, NoteType, NoteWithBook } from "@/types/note";
import { isValidUUID, isValidLength, isValidTags, sanitizeErrorMessage, sanitizeErrorForLogging } from "@/lib/utils/validation";
import type { User } from "@supabase/supabase-js";

/**
 * 기록 생성
 * @param data 기록 데이터
 * @param user 선택적 사용자 정보 (전달되지 않으면 자동 조회)
 */
export async function createNote(data: CreateNoteInput, user?: User | null) {
  const supabase = await createServerSupabaseClient();

  // 현재 사용자 확인
  let currentUser = user;
  if (!currentUser) {
    const {
      data: { user: fetchedUser },
      error: authError,
    } = await supabase.auth.getUser();

    if (authError || !fetchedUser) {
      throw new Error("로그인이 필요합니다.");
    }
    currentUser = fetchedUser;
  }

  // UUID 검증
  if (!isValidUUID(data.book_id)) {
    throw new Error("유효하지 않은 책 ID입니다.");
  }

  // 입력 검증
  if (data.content && !isValidLength(data.content, 1, 10000)) {
    throw new Error("내용은 1자 이상 10,000자 이하여야 합니다.");
  }

  if (data.tags && !isValidTags(data.tags, 10, 50)) {
    throw new Error("태그는 최대 10개까지, 각 태그는 50자 이하여야 합니다.");
  }

  if (data.page_number !== null && data.page_number !== undefined) {
    if (!Number.isInteger(data.page_number) || data.page_number < 1) {
      throw new Error("페이지 번호는 1 이상의 정수여야 합니다.");
    }
  }

  // 책 소유 확인 및 book_id 조회
  // data.book_id는 user_books.id이므로, user_books에서 book_id를 조회해야 함
  const { data: userBook, error: bookCheckError } = await supabase
    .from("user_books")
    .select("id, book_id")
    .eq("id", data.book_id)
    .eq("user_id", currentUser.id)
    .maybeSingle(); // .single() 대신 .maybeSingle() 사용

  if (bookCheckError && bookCheckError.code !== "PGRST116") {
    // PGRST116은 "결과가 없음" 에러이므로 무시
    throw new Error("책 소유 확인에 실패했습니다.");
  }

  if (!userBook || !userBook.book_id) {
    throw new Error("권한이 없습니다. 해당 책을 소유하고 있지 않습니다.");
  }

  // 기록 생성
  // notes.book_id는 books.id를 참조하므로 userBook.book_id를 사용
  const { data: note, error } = await supabase
    .from("notes")
    .insert({
      user_id: currentUser.id,
      book_id: userBook.book_id,
      type: data.type,
      content: data.content || null,
      image_url: data.image_url || null,
      page_number: data.page_number || null,
      is_public: data.is_public ?? false,
      tags: data.tags || null,
    })
    .select()
    .single();

  if (error || !note) {
    throw new Error(sanitizeErrorMessage(error || new Error("기록 생성에 실패했습니다.")));
  }

  revalidatePath("/notes");
  revalidatePath(`/books/${data.book_id}`);
  revalidatePath(`/notes/${note.id}`);
  revalidatePath("/"); // 홈페이지도 갱신

  return { success: true, noteId: note.id };
}

/**
 * 기록 수정
 * @param noteId 기록 ID
 * @param data 수정할 데이터
 * @param user 선택적 사용자 정보 (전달되지 않으면 자동 조회)
 */
export async function updateNote(noteId: string, data: UpdateNoteInput, user?: User | null) {
  const supabase = await createServerSupabaseClient();

  // 현재 사용자 확인
  let currentUser = user;
  if (!currentUser) {
    const {
      data: { user: fetchedUser },
      error: authError,
    } = await supabase.auth.getUser();

    if (authError || !fetchedUser) {
      throw new Error("로그인이 필요합니다.");
    }
    currentUser = fetchedUser;
  }

  // 기록 소유 확인
  const { data: note, error: noteCheckError } = await supabase
    .from("notes")
    .select("id, book_id")
    .eq("id", noteId)
    .eq("user_id", currentUser.id)
    .maybeSingle(); // .single() 대신 .maybeSingle() 사용

  if (noteCheckError && noteCheckError.code !== "PGRST116") {
    // PGRST116은 "결과가 없음" 에러이므로 무시
    throw new Error("기록 조회에 실패했습니다.");
  }

  if (!note) {
    throw new Error("권한이 없습니다. 해당 기록을 수정할 권한이 없습니다.");
  }

  // 기록 수정
  const { error } = await supabase
    .from("notes")
    .update({
      content: data.content !== undefined ? data.content : undefined,
      page_number: data.page_number !== undefined ? data.page_number : undefined,
      is_public: data.is_public !== undefined ? data.is_public : undefined,
      tags: data.tags !== undefined ? data.tags : undefined,
    })
    .eq("id", noteId);

  if (error) {
    throw new Error(sanitizeErrorMessage(error));
  }

  // revalidatePath: note.book_id를 알고 있으므로 재조회 없이 처리
  // /books 경로 전체를 갱신하여 해당 book_id를 가진 모든 페이지 갱신
  revalidatePath("/notes");
  revalidatePath("/books"); // 책 목록 페이지 갱신
  revalidatePath(`/notes/${noteId}`);
  revalidatePath("/"); // 홈페이지도 갱신

  return { success: true };
}

/**
 * 기록 삭제
 * @param noteId 기록 ID
 * @param user 선택적 사용자 정보 (전달되지 않으면 자동 조회)
 */
export async function deleteNote(noteId: string, user?: User | null) {
  const supabase = await createServerSupabaseClient();

  // 현재 사용자 확인
  let currentUser = user;
  if (!currentUser) {
    const {
      data: { user: fetchedUser },
      error: authError,
    } = await supabase.auth.getUser();

    if (authError || !fetchedUser) {
      throw new Error("로그인이 필요합니다.");
    }
    currentUser = fetchedUser;
  }

  // 기록 소유 확인
  const { data: note, error: noteCheckError } = await supabase
    .from("notes")
    .select("id, book_id, image_url")
    .eq("id", noteId)
    .eq("user_id", currentUser.id)
    .maybeSingle(); // .single() 대신 .maybeSingle() 사용

  if (noteCheckError && noteCheckError.code !== "PGRST116") {
    // PGRST116은 "결과가 없음" 에러이므로 무시
    throw new Error("기록 조회에 실패했습니다.");
  }

  if (!note) {
    throw new Error("권한이 없습니다. 해당 기록을 삭제할 권한이 없습니다.");
  }

  // 이미지가 있으면 Storage에서 삭제
  if (note.image_url) {
    try {
      // Supabase Storage 경로 추출
      // URL 형식: https://[project].supabase.co/storage/v1/object/public/images/photos/[userId]/[fileName]
      const url = new URL(note.image_url);
      const pathParts = url.pathname.split("/storage/v1/object/public/");
      
      if (pathParts.length === 2) {
        const fullPath = pathParts[1];
        const pathSegments = fullPath.split("/");
        
        if (pathSegments.length >= 2) {
          const bucket = pathSegments[0]; // "images"
          const filePath = pathSegments.slice(1).join("/"); // "photos/[userId]/[fileName]"

          const { error: removeError } = await supabase.storage
            .from(bucket)
            .remove([filePath]);

          if (removeError) {
            const safeError = sanitizeErrorForLogging(removeError);
            console.error("이미지 삭제 오류:", safeError);
            // 이미지 삭제 실패해도 기록은 삭제 진행
          }
        }
      }
    } catch (error) {
      const safeError = sanitizeErrorForLogging(error);
      console.error("이미지 삭제 오류:", safeError);
      // 이미지 삭제 실패해도 기록은 삭제 진행
    }
  }

  // 기록 삭제
  const { error } = await supabase.from("notes").delete().eq("id", noteId);

  if (error) {
    throw new Error(sanitizeErrorMessage(error));
  }

  // revalidatePath: note.book_id를 알고 있으므로 재조회 없이 처리
  // /books 경로 전체를 갱신하여 해당 book_id를 가진 모든 페이지 갱신
  revalidatePath("/notes");
  revalidatePath("/books"); // 책 목록 페이지 갱신
  revalidatePath("/"); // 홈페이지도 갱신

  return { success: true };
}

/**
 * 기록 목록 조회
 * 게스트 사용자의 경우 샘플 데이터 반환
 * @param bookId 책 ID (선택)
 * @param type 기록 유형 필터 (선택)
 * @param user 선택적 사용자 정보 (전달되지 않으면 자동 조회)
 * @param includeBook books 정보 포함 여부 (기본값: true, 하위 호환성 유지)
 */
export async function getNotes(bookId?: string, type?: NoteType, user?: User | null, includeBook: boolean = true): Promise<NoteWithBook[]> {
  const supabase = await createServerSupabaseClient();

  // 현재 사용자 확인
  let currentUser = user;
  let authError = null;
  if (!currentUser) {
    const {
      data: { user: fetchedUser },
      error: fetchedError,
    } = await supabase.auth.getUser();
    currentUser = fetchedUser;
    authError = fetchedError;
  }

  // 게스트 사용자인 경우 샘플 데이터 반환
  if (authError || !currentUser) {
    const selectQuery = includeBook
      ? `*, books (id, title, author, cover_image_url)`
      : `*`;
    
    let query = supabase
      .from("notes")
      .select(selectQuery)
      .eq("is_sample", true)
      .order("created_at", { ascending: false })
      .limit(50); // 샘플 데이터는 최대 50개

    if (bookId) {
      query = query.eq("book_id", bookId);
    }

    if (type) {
      query = query.eq("type", type);
    }

    const { data: sampleNotes, error: sampleError } = await query;

    if (sampleError) {
      // 샘플 데이터가 없어도 빈 배열 반환 (에러 발생하지 않음)
      return [];
    }

    return (sampleNotes || []) as unknown as NoteWithBook[];
  }

  // 인증된 사용자는 기존 로직 사용
  // bookId 변환과 notes 쿼리 준비를 병렬로 시작
  const selectQuery = includeBook
    ? `*, books (id, title, author, cover_image_url)`
    : `*`;

  const [userBookResult] = await Promise.all([
    // bookId가 user_books.id인 경우, books.id를 조회
    bookId && isValidUUID(bookId)
      ? supabase
          .from("user_books")
          .select("book_id")
          .eq("id", bookId)
          .eq("user_id", currentUser.id)
          .maybeSingle()
      : Promise.resolve({ data: null, error: null }),
  ]);

  // userBook 결과에 따라 bookId 설정
  let actualBookId = bookId;
  if (userBookResult.data) {
    actualBookId = userBookResult.data.book_id;
  }

  // notes 쿼리 구성 및 실행
  let query = supabase
    .from("notes")
    .select(selectQuery)
    .eq("user_id", currentUser.id)
    .order("page_number", { ascending: true, nullsFirst: false })
    .order("created_at", { ascending: false });

  if (actualBookId) {
    query = query.eq("book_id", actualBookId);
  }

  if (type) {
    query = query.eq("type", type);
  }

  const { data, error } = await query;

  if (error) {
    throw new Error(sanitizeErrorMessage(error));
  }

  return (data || []) as unknown as NoteWithBook[];
}

/**
 * 기록 상세 조회
 * @param noteId 기록 ID
 * @param user 선택적 사용자 정보 (전달되지 않으면 자동 조회)
 */
export async function getNoteDetail(noteId: string, user?: User | null) {
  const supabase = await createServerSupabaseClient();

  // 현재 사용자 확인
  let currentUser = user;
  if (!currentUser) {
    const {
      data: { user: fetchedUser },
      error: authError,
    } = await supabase.auth.getUser();

    if (authError || !fetchedUser) {
      throw new Error("로그인이 필요합니다.");
    }
    currentUser = fetchedUser;
  }

  const { data, error } = await supabase
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
    `
    )
    .eq("id", noteId)
    .eq("user_id", currentUser.id)
    .maybeSingle(); // .single() 대신 .maybeSingle() 사용

  if (error && error.code !== "PGRST116") {
    // PGRST116은 "결과가 없음" 에러이므로 무시
    throw new Error(sanitizeErrorMessage(error));
  }

  if (!data) {
    throw new Error("기록을 찾을 수 없거나 권한이 없습니다.");
  }

  // user_books.id 조회 (책 상세 페이지 링크용)
  let userBookId = null;
  if (data.book_id) {
    const { data: userBook } = await supabase
      .from("user_books")
      .select("id")
      .eq("book_id", data.book_id)
      .eq("user_id", currentUser.id)
      .maybeSingle();

    if (userBook) {
      userBookId = userBook.id;
    }
  }

  return {
    ...data,
    user_book_id: userBookId,
  };
}

/**
 * 기록 소유권 검증
 * @param noteId 기록 ID
 * @param userId 사용자 ID
 * @returns 소유권이 있으면 true, 없으면 false
 */
export async function verifyNoteOwnership(noteId: string, userId: string): Promise<boolean> {
  const supabase = await createServerSupabaseClient();

  const { data: note, error: noteCheckError } = await supabase
    .from("notes")
    .select("id, user_id")
    .eq("id", noteId)
    .eq("user_id", userId)
    .maybeSingle();

  if (noteCheckError && noteCheckError.code !== "PGRST116") {
    // PGRST116은 "결과가 없음" 에러이므로 무시
    throw new Error(`기록 조회 실패: ${noteCheckError.message}`);
  }

  return note !== null;
}

/**
 * 공개 기록 조회 (카드뉴스용)
 * 공개 기록 또는 본인 기록 조회 가능
 * @param noteId 기록 ID
 * @param userId 사용자 ID (선택, 로그인한 경우)
 * @returns 기록 데이터 (books 정보 포함)
 */
export async function getPublicNote(noteId: string, userId?: string) {
  const supabase = await createServerSupabaseClient();

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
    `
    )
    .eq("id", noteId);

  // 로그인한 사용자인 경우 본인 기록도 조회 가능
  if (userId) {
    query = query.or(`is_public.eq.true,user_id.eq.${userId}`);
  } else {
    // 비로그인 사용자는 공개 기록만 조회 가능
    query = query.eq("is_public", true);
  }

  const { data: note, error } = await query.single();

  if (error || !note) {
    throw new Error("기록을 찾을 수 없거나 공개되지 않은 기록입니다.");
  }

  return note;
}

/**
 * 기록 내용 업데이트 (OCR 결과 저장용)
 * @param noteId 기록 ID
 * @param content 업데이트할 내용
 */
export async function updateNoteContent(noteId: string, content: string) {
  const supabase = await createServerSupabaseClient();

  // 기록 존재 확인 (RLS 정책으로 인해 권한 확인도 함께 수행)
  const { data: note, error: noteError } = await supabase
    .from("notes")
    .select("id")
    .eq("id", noteId)
    .maybeSingle();

  if (noteError && noteError.code !== "PGRST116") {
    throw new Error(`기록 조회 실패: ${noteError.message}`);
  }

  if (!note) {
    throw new Error("기록을 찾을 수 없습니다.");
  }

  // Notes 테이블 업데이트
  const { error: updateError } = await supabase
    .from("notes")
    .update({ content })
    .eq("id", noteId);

  if (updateError) {
    throw new Error(`기록 업데이트 실패: ${updateError.message}`);
  }

  return { success: true };
}

