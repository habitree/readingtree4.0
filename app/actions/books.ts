"use server";

import { createServerSupabaseClient } from "@/lib/supabase/server";
import { revalidatePath } from "next/cache";
import { searchBooks, transformNaverBookItem } from "@/lib/api/naver";
import type { ReadingStatus } from "@/types/book";
import { isValidUUID, sanitizeErrorForLogging } from "@/lib/utils/validation";

export interface AddBookInput {
  isbn?: string | null;
  title: string;
  author?: string | null;
  publisher?: string | null;
  published_date?: string | null;
  cover_image_url?: string | null;
}

/**
 * 책 추가
 * Books 테이블에 없으면 생성하고, UserBooks에 추가
 * ISBN이 있으면 기존 책을 재사용 (review_issues.md 5번 이슈 참고)
 */
export async function addBook(
  bookData: AddBookInput,
  status: ReadingStatus = "reading"
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

  // 사용자 프로필이 users 테이블에 존재하는지 확인
  const { data: userProfile, error: profileCheckError } = await supabase
    .from("users")
    .select("id")
    .eq("id", user.id)
    .maybeSingle();

  // 프로필이 없으면 생성 (Foreign Key Constraint 방지)
  if (!userProfile) {
    const { error: insertProfileError } = await supabase.from("users").insert({
      id: user.id,
      email: user.email,
      name: user.user_metadata?.name || user.email?.split("@")[0] || "사용자",
      avatar_url: user.user_metadata?.avatar_url || null,
      reading_goal: 12, // 기본값
    });

    if (insertProfileError) {
      throw new Error(`프로필 생성 실패: ${insertProfileError.message}`);
    }
  }

  let bookId: string;

  // ISBN이 있고 기존 책이 있는지 확인
  if (bookData.isbn) {
    const { data: existingBook, error: findError } = await supabase
      .from("books")
      .select("id")
      .eq("isbn", bookData.isbn)
      .maybeSingle(); // .single() 대신 .maybeSingle() 사용하여 에러 없이 null 반환

    if (findError && findError.code !== "PGRST116") {
      // PGRST116은 "결과가 없음" 에러이므로 무시
      throw new Error(`책 조회 실패: ${findError.message}`);
    }

    if (existingBook) {
      // 기존 책 재사용
      bookId = existingBook.id;
    } else {
      // 새 책 생성
      const { data: newBook, error: insertError } = await supabase
        .from("books")
        .insert({
          isbn: bookData.isbn,
          title: bookData.title,
          author: bookData.author,
          publisher: bookData.publisher,
          published_date: bookData.published_date,
          cover_image_url: bookData.cover_image_url,
        })
        .select("id")
        .single();

      if (insertError || !newBook) {
        throw new Error(`책 추가 실패: ${insertError?.message || "알 수 없는 오류"}`);
      }

      bookId = newBook.id;
    }
  } else {
    // ISBN이 없으면 새 책 생성
    const { data: newBook, error: insertError } = await supabase
      .from("books")
      .insert({
        title: bookData.title,
        author: bookData.author,
        publisher: bookData.publisher,
        published_date: bookData.published_date,
        cover_image_url: bookData.cover_image_url,
      })
      .select("id")
      .single();

    if (insertError || !newBook) {
      throw new Error(`책 추가 실패: ${insertError?.message || "알 수 없는 오류"}`);
    }

    bookId = newBook.id;
  }

  // 사용자가 이미 이 책을 추가했는지 확인 (UNIQUE 제약조건으로도 방지되지만 명시적 체크)
  const { data: existingUserBook, error: checkError } = await supabase
    .from("user_books")
    .select("id")
    .eq("user_id", user.id)
    .eq("book_id", bookId)
    .maybeSingle(); // .single() 대신 .maybeSingle() 사용

  if (checkError && checkError.code !== "PGRST116") {
    // PGRST116은 "결과가 없음" 에러이므로 무시
    throw new Error(`중복 체크 실패: ${checkError.message}`);
  }

  if (existingUserBook) {
    throw new Error("이미 추가된 책입니다.");
  }

  // UserBooks에 추가
  const { error: userBookError } = await supabase.from("user_books").insert({
    user_id: user.id,
    book_id: bookId,
    status,
    started_at: new Date().toISOString(),
  });

  if (userBookError) {
    throw new Error(`책 추가 실패: ${userBookError.message}`);
  }

  revalidatePath("/books");
  revalidatePath("/");

  return { success: true, bookId };
}

/**
 * 독서 상태 변경
 * @param userBookId UserBooks 테이블의 ID
 * @param status 새로운 상태
 */
export async function updateBookStatus(
  userBookId: string,
  status: ReadingStatus
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

  // 사용자의 책인지 확인
  const { data: userBook } = await supabase
    .from("user_books")
    .select("id")
    .eq("id", userBookId)
    .eq("user_id", user.id)
    .single();

  if (!userBook) {
    throw new Error("권한이 없습니다.");
  }

  // 상태 변경 데이터 준비
  const updateData: {
    status: ReadingStatus;
    completed_at?: string | null;
  } = {
    status,
  };

  // 완독 시 completed_at 자동 기록
  if (status === "completed") {
    updateData.completed_at = new Date().toISOString();
  } else {
    // 완독이 아닌 상태로 변경 시 completed_at 초기화
    updateData.completed_at = null;
  }

  const { error } = await supabase
    .from("user_books")
    .update(updateData)
    .eq("id", userBookId);

  if (error) {
    throw new Error(`상태 변경 실패: ${error.message}`);
  }

  revalidatePath("/books");
  revalidatePath(`/books/${userBookId}`);
  revalidatePath("/");

  return { success: true };
}

/**
 * 사용자 책 목록 조회
 * 게스트 사용자의 경우 샘플 데이터 반환
 * @param status 필터링할 상태 (선택)
 */
export async function getUserBooks(status?: ReadingStatus) {
  const supabase = await createServerSupabaseClient();

  // 현재 사용자 확인
  const {
    data: { user },
    error: authError,
  } = await supabase.auth.getUser();

  // 게스트 사용자인 경우 샘플 데이터 반환
  if (authError || !user) {
    // 샘플 책 데이터 조회
    let query = supabase
      .from("books")
      .select(
        `
        id,
        isbn,
        title,
        author,
        publisher,
        published_date,
        cover_image_url,
        is_sample,
        created_at,
        updated_at
      `
      )
      .eq("is_sample", true)
      .order("created_at", { ascending: false })
      .limit(20); // 샘플 데이터는 최대 20개만

    const { data: sampleBooks, error: sampleError } = await query;

    if (sampleError) {
      // 샘플 데이터가 없어도 빈 배열 반환 (에러 발생하지 않음)
      return [];
    }

    // 샘플 데이터의 이미지가 없으면 네이버 API를 통해 가져오기
    // 이미지가 없는 책만 필터링하여 처리 (성능 최적화)
    const booksWithoutImages = (sampleBooks || []).filter(
      (book) => !book.cover_image_url && book.isbn
    );

    // 이미지가 없는 책들만 네이버 API로 검색 (배치 처리)
    if (booksWithoutImages.length > 0) {
      await Promise.all(
        booksWithoutImages.map(async (book) => {
          try {
            const searchQuery = `${book.title} ${book.author || ""}`.trim();
            const naverResponse = await searchBooks({ query: searchQuery, display: 1 });
            
            if (naverResponse.items && naverResponse.items.length > 0) {
              const naverBook = transformNaverBookItem(naverResponse.items[0]);
              
              // 네이버 API에서 가져온 이미지 URL로 업데이트
              if (naverBook.cover_image_url) {
                await supabase
                  .from("books")
                  .update({ cover_image_url: naverBook.cover_image_url })
                  .eq("id", book.id);
                
                // 메모리상의 book 객체도 업데이트
                book.cover_image_url = naverBook.cover_image_url;
              }
            }
          } catch (error) {
            // 네이버 API 호출 실패 시 무시 (기존 이미지 없음 상태 유지)
            // 에러 로깅은 개발 환경에서만
            if (process.env.NODE_ENV === "development") {
              console.error(`네이버 API 이미지 검색 실패 (${book.title}):`, error);
            }
          }
        })
      );
    }

    // 모든 책 반환 (이미지가 업데이트된 책 포함)
    const booksWithImages = sampleBooks || [];

    // 샘플 데이터를 user_books 형식으로 변환
    // 샘플 데이터는 상세 페이지 접근이 불가능하도록 특별한 ID 형식 사용
    return booksWithImages.map((book) => ({
      id: `sample-${book.id}`, // 샘플 데이터임을 표시하는 접두사 추가
      user_id: null, // 게스트는 user_id가 없음
      book_id: book.id,
      status: "reading" as ReadingStatus, // 기본값
      started_at: book.created_at || new Date().toISOString(),
      completed_at: null,
      created_at: book.created_at || new Date().toISOString(),
      updated_at: book.updated_at || new Date().toISOString(),
      books: book,
    }));
  }

  // 인증된 사용자는 기존 로직 사용
  let query = supabase
    .from("user_books")
    .select(
      `
      *,
      books (
        id,
        isbn,
        title,
        author,
        publisher,
        published_date,
        cover_image_url
      )
    `
    )
    .eq("user_id", user.id)
    .order("created_at", { ascending: false });

  if (status) {
    query = query.eq("status", status);
  }

  const { data, error } = await query;

  if (error) {
    throw new Error(`책 목록 조회 실패: ${error.message}`);
  }

  return data || [];
}

/**
 * 책 상세 조회
 * @param userBookId UserBooks 테이블의 ID
 */
export async function getBookDetail(userBookId: string) {
  const supabase = await createServerSupabaseClient();

  // 현재 사용자 확인
  const {
    data: { user },
    error: authError,
  } = await supabase.auth.getUser();

  // 게스트 사용자가 샘플 책 상세 페이지에 접근 시도
  if (!user) {
    if (userBookId.startsWith("sample-")) {
      const bookId = userBookId.replace("sample-", "");
      const { data: sampleBook, error: sampleError } = await supabase
        .from("books")
        .select("*")
        .eq("id", bookId)
        .eq("is_sample", true)
        .single();

      if (sampleError || !sampleBook) {
        throw new Error("샘플 책을 찾을 수 없습니다.");
      }

      // 이미지 URL이 없으면 네이버 API로 동적 검색
      let finalCoverImageUrl = sampleBook.cover_image_url;
      if (!finalCoverImageUrl && sampleBook.isbn) {
        try {
          const { searchBooks, transformNaverBookItem } = await import("@/lib/api/naver");
          const naverResponse = await searchBooks({ query: sampleBook.isbn, display: 1 });
          if (naverResponse.items && naverResponse.items.length > 0) {
            finalCoverImageUrl = naverResponse.items[0].image;
            // 데이터베이스 업데이트
            await supabase
              .from("books")
              .update({ cover_image_url: finalCoverImageUrl })
              .eq("id", sampleBook.id);
          }
        } catch (naverApiError) {
          console.warn(`네이버 API 이미지 검색 실패 (ISBN: ${sampleBook.isbn}):`, naverApiError);
        }
      }

      return {
        id: userBookId,
        user_id: null,
        book_id: sampleBook.id,
        status: "reading" as ReadingStatus,
        started_at: sampleBook.created_at || new Date().toISOString(),
        completed_at: null,
        created_at: sampleBook.created_at || new Date().toISOString(),
        updated_at: sampleBook.updated_at || new Date().toISOString(),
        books: { ...sampleBook, cover_image_url: finalCoverImageUrl },
      };
    } else {
      throw new Error("로그인이 필요합니다.");
    }
  }

  console.log("getBookDetail: 책 상세 조회 시작", { userBookId, userId: user.id });

  const { data, error } = await supabase
    .from("user_books")
    .select(
      `
      *,
      books (
        id,
        isbn,
        title,
        author,
        publisher,
        published_date,
        cover_image_url
      )
    `
    )
    .eq("id", userBookId)
    .eq("user_id", user.id)
    .single();

  if (error) {
    console.error("getBookDetail: Supabase 쿼리 오류", {
      userBookId,
      userId: user.id,
      error: error.message,
      errorCode: error.code,
      errorDetails: error.details,
      errorHint: error.hint,
    });
    throw new Error(`책 상세 조회 실패: ${error.message || "책을 찾을 수 없습니다."}`);
  }

  if (!data) {
    console.error("getBookDetail: 데이터가 없습니다", {
      userBookId,
      userId: user.id,
    });
    throw new Error("책을 찾을 수 없습니다.");
  }

  console.log("getBookDetail: 책 상세 조회 성공", {
    userBookId,
    bookId: data.book_id,
    bookTitle: data.books?.title,
  });

  return data;
}

/**
 * 책 삭제
 * @param userBookId UserBooks 테이블의 ID
 */
export async function deleteBook(userBookId: string) {
  const supabase = await createServerSupabaseClient();

  // 현재 사용자 확인
  const {
    data: { user },
    error: authError,
  } = await supabase.auth.getUser();

  if (authError || !user) {
    throw new Error("로그인이 필요합니다.");
  }

  // UUID 검증
  if (!isValidUUID(userBookId)) {
    throw new Error("유효하지 않은 책 ID입니다.");
  }

  // 사용자의 책인지 확인 및 book_id 조회
  const { data: userBook, error: bookCheckError } = await supabase
    .from("user_books")
    .select("id, book_id")
    .eq("id", userBookId)
    .eq("user_id", user.id)
    .maybeSingle();

  if (bookCheckError && bookCheckError.code !== "PGRST116") {
    throw new Error("책 조회에 실패했습니다.");
  }

  if (!userBook) {
    throw new Error("권한이 없습니다. 해당 책을 삭제할 권한이 없습니다.");
  }

  // 해당 책의 모든 기록 조회 (이미지 파일 삭제를 위해)
  const { data: notes, error: notesError } = await supabase
    .from("notes")
    .select("id, image_url")
    .eq("book_id", userBook.book_id)
    .eq("user_id", user.id);

  if (notesError) {
    console.error("기록 조회 오류:", notesError);
    // 기록 조회 실패해도 책 삭제는 진행
  }

  // 기록의 이미지 파일 삭제
  if (notes && notes.length > 0) {
    for (const note of notes) {
      if (note.image_url) {
        try {
          const url = new URL(note.image_url);
          const pathParts = url.pathname.split("/storage/v1/object/public/");
          
          if (pathParts.length === 2) {
            const fullPath = pathParts[1];
            const pathSegments = fullPath.split("/");
            
            if (pathSegments.length >= 2) {
              const bucket = pathSegments[0];
              const filePath = pathSegments.slice(1).join("/");

              const { error: removeError } = await supabase.storage
                .from(bucket)
                .remove([filePath]);

              if (removeError) {
                const safeError = sanitizeErrorForLogging(removeError);
                console.error("이미지 삭제 오류:", safeError);
                // 이미지 삭제 실패해도 책 삭제는 진행
              }
            }
          }
        } catch (error) {
          const safeError = sanitizeErrorForLogging(error);
          console.error("이미지 삭제 오류:", safeError);
          // 이미지 삭제 실패해도 책 삭제는 진행
        }
      }
    }
  }

  // user_books에서 삭제 (CASCADE로 notes도 자동 삭제됨)
  const { error } = await supabase
    .from("user_books")
    .delete()
    .eq("id", userBookId);

  if (error) {
    throw new Error(`책 삭제 실패: ${error.message}`);
  }

  revalidatePath("/books");
  revalidatePath("/");
  revalidatePath(`/books/${userBookId}`);

  return { success: true };
}

