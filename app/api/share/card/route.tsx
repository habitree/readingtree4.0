import { ImageResponse } from "@vercel/og";
import { NextRequest } from "next/server";
import { getTemplateById } from "@/lib/templates/card-news-templates";
import { createServerSupabaseClient } from "@/lib/supabase/server";
import { getPublicNote, getTranscription } from "@/app/actions/notes";
import { parseNoteContentFields } from "@/lib/utils/note";
import { formatDate } from "@/lib/utils/date";
import { getImageUrl, isValidImageUrl, convertToHttps } from "@/lib/utils/image";
import React from "react";

export const runtime = "edge";

/**
 * 카드뉴스 생성 API
 * @vercel/og를 사용하여 1080x1080 이미지 생성
 * 책 표지 이미지, quote/memo 구분, 작성 날짜 포함
 * shareType="image"인 경우 필사/사진 이미지를 메인으로 표시
 */
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const noteId = searchParams.get("noteId");
    const templateId = searchParams.get("templateId") || "default";
    const shareType = searchParams.get("shareType") || "text";

    if (!noteId) {
      return new Response("noteId가 필요합니다.", { status: 400 });
    }

    // 사용자 확인 (선택적)
    const supabase = await createServerSupabaseClient();
    const {
      data: { user },
    } = await supabase.auth.getUser();

    // 기록 조회 (공개 기록 또는 본인 기록 조회 가능)
    const note = await getPublicNote(noteId, user?.id);

    // 템플릿 가져오기
    const template = getTemplateById(templateId);

    // 카드뉴스 내용 준비
    const book = note.books as any;
    const bookTitle = book?.title || "제목 없음";
    const bookAuthor = book?.author || "";
    const bookCoverUrl = book?.cover_image_url || null;
    const hasBookCover = isValidImageUrl(bookCoverUrl);
    
    // 책 표지 이미지 URL 처리: 절대 URL로 변환
    let processedBookCoverUrl: string | null = null;
    if (hasBookCover && bookCoverUrl) {
      try {
        // 이미 절대 URL인지 확인
        const urlObj = new URL(bookCoverUrl);
        processedBookCoverUrl = convertToHttps(bookCoverUrl);
      } catch {
        // 상대 경로이거나 유효하지 않은 URL인 경우
        const processedUrl = getImageUrl(bookCoverUrl);
        try {
          // getImageUrl이 반환한 URL이 절대 URL인지 확인
          const urlObj = new URL(processedUrl);
          processedBookCoverUrl = processedUrl;
        } catch {
          // 여전히 상대 경로인 경우 Supabase Storage 공개 URL로 변환
          const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
          if (supabaseUrl) {
            // Supabase Storage 경로 형식 확인
            if (bookCoverUrl.startsWith("images/") || bookCoverUrl.startsWith("/images/")) {
              const cleanPath = bookCoverUrl.replace(/^\/+/, "");
              processedBookCoverUrl = `${supabaseUrl}/storage/v1/object/public/${cleanPath}`;
            } else {
              // 다른 형식의 경로인 경우 그대로 사용
              processedBookCoverUrl = processedUrl;
            }
          } else {
            processedBookCoverUrl = processedUrl;
          }
        }
      }
    }
    
    // quote/memo 구분 파싱
    const { quote, memo } = parseNoteContentFields(note.content);
    const pageNumber = note.page_number;
    const createdAt = note.created_at;
    const formattedDate = createdAt ? formatDate(createdAt) : "";

    // 필사/사진 이미지 확인
    const hasImage = !!note.image_url;
    const isTranscription = note.type === "transcription";
    const isPhoto = note.type === "photo";
    
    // 이미지 URL 처리: 절대 URL로 변환하고 유효성 검증
    let noteImageUrl: string | null = null;
    if (note.image_url) {
      try {
        // 이미 절대 URL인지 확인
        const urlObj = new URL(note.image_url);
        noteImageUrl = convertToHttps(note.image_url);
      } catch {
        // 상대 경로이거나 유효하지 않은 URL인 경우
        const processedUrl = getImageUrl(note.image_url);
        try {
          // getImageUrl이 반환한 URL이 절대 URL인지 확인
          const urlObj = new URL(processedUrl);
          noteImageUrl = processedUrl;
        } catch {
          // 여전히 상대 경로인 경우 Supabase Storage 공개 URL로 변환
          const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
          if (supabaseUrl) {
            // Supabase Storage 경로 형식 확인
            if (note.image_url.startsWith("images/") || note.image_url.startsWith("/images/")) {
              const cleanPath = note.image_url.replace(/^\/+/, "");
              noteImageUrl = `${supabaseUrl}/storage/v1/object/public/${cleanPath}`;
            } else {
              // 다른 형식의 경로인 경우 그대로 사용
              noteImageUrl = processedUrl;
            }
          } else {
            noteImageUrl = processedUrl;
          }
        }
      }
    }

    // 필사인 경우 transcription 데이터 조회
    let transcriptionMemo = null;
    if (isTranscription && shareType === "image") {
      try {
        const transcription = await getTranscription(noteId);
        if (transcription && transcription.memo_content) {
          transcriptionMemo = transcription.memo_content;
        }
      } catch (error) {
        console.error("필사 데이터 조회 오류:", error);
      }
    }

    // shareType이 "image"이고 이미지가 있는 경우 이미지 중심 레이아웃
    const useImageLayout = shareType === "image" && hasImage && (isTranscription || isPhoto);
    const displayMemo = useImageLayout ? (transcriptionMemo || memo) : memo;

    // 이미지 생성
    return new ImageResponse(
      React.createElement(
        "div",
        {
          style: {
            height: "100%",
            width: "100%",
            display: "flex",
            flexDirection: "column",
            backgroundColor: template.backgroundColor,
            padding: "60px",
            fontFamily: template.fontFamily,
          },
        },
        // 이미지 중심 레이아웃
        useImageLayout
          ? React.createElement(
              React.Fragment,
              null,
              // 상단: 책 정보 영역 (간소화)
              React.createElement(
                "div",
                {
                  style: {
                    display: "flex",
                    flexDirection: "row",
                    alignItems: "center",
                    marginBottom: "30px",
                    gap: "20px",
                  },
                },
                processedBookCoverUrl &&
                  React.createElement("img", {
                    src: processedBookCoverUrl,
                    alt: bookTitle,
                    style: {
                      width: "80px",
                      height: "110px",
                      objectFit: "cover",
                      borderRadius: "6px",
                      boxShadow: "0 2px 8px rgba(0,0,0,0.1)",
                    },
                  }),
                React.createElement(
                  "div",
                  {
                    style: {
                      display: "flex",
                      flexDirection: "column",
                      flex: 1,
                    },
                  },
                  React.createElement("div", {
                    style: {
                      fontSize: "28px",
                      fontWeight: "bold",
                      color: template.accentColor,
                      marginBottom: "4px",
                      lineHeight: "1.2",
                    },
                    children: bookTitle,
                  }),
                  bookAuthor &&
                    React.createElement("div", {
                      style: {
                        fontSize: "18px",
                        color: template.textColor,
                        opacity: 0.7,
                      },
                      children: bookAuthor,
                    })
                )
              ),
              // 중앙: 필사/사진 이미지 (메인) - 더 크고 명확하게
              noteImageUrl &&
                React.createElement(
                  "div",
                  {
                    style: {
                      display: "flex",
                      flex: 1,
                      justifyContent: "center",
                      alignItems: "center",
                      marginBottom: "20px",
                      minHeight: "0",
                    },
                  },
                  React.createElement("img", {
                    src: noteImageUrl,
                    alt: isTranscription ? "필사 이미지" : "사진",
                    style: {
                      width: "800px",
                      height: "600px",
                      objectFit: "contain",
                      borderRadius: "16px",
                      boxShadow: "0 8px 24px rgba(0,0,0,0.2)",
                      backgroundColor: template.backgroundColor === "#FFFFFF" ? "#F9FAFB" : "rgba(255,255,255,0.1)",
                    },
                  })
                ),
              // 하단: 내 생각만 표시 - 가시성 개선
              displayMemo &&
                React.createElement(
                  "div",
                  {
                    style: {
                      display: "flex",
                      flexDirection: "column",
                      marginTop: "20px",
                      paddingTop: "20px",
                      borderTop: `2px solid ${template.accentColor}20`,
                    },
                  },
                  React.createElement("div", {
                    style: {
                      fontSize: "20px",
                      fontWeight: "700",
                      color: template.accentColor,
                      marginBottom: "14px",
                      opacity: 0.9,
                      letterSpacing: "0.5px",
                    },
                    children: "내 생각",
                  }),
                  React.createElement("div", {
                    style: {
                      fontSize: "26px",
                      fontWeight: "400",
                      color: template.textColor,
                      lineHeight: "1.7",
                      textAlign: "left",
                      padding: "20px",
                      backgroundColor:
                        template.backgroundColor === "#FFFFFF"
                          ? "#F3F4F6"
                          : "rgba(255,255,255,0.08)",
                      borderRadius: "12px",
                      boxShadow: "0 2px 8px rgba(0,0,0,0.06)",
                      maxHeight: "180px",
                      overflow: "hidden",
                    },
                    children: displayMemo,
                  })
                ),
              // 최하단: 페이지 번호 및 브랜드
              React.createElement(
                "div",
                {
                  style: {
                    display: "flex",
                    flexDirection: "row",
                    justifyContent: "space-between",
                    alignItems: "center",
                    marginTop: "20px",
                  },
                },
                pageNumber &&
                  React.createElement("div", {
                    style: {
                      fontSize: "16px",
                      color: template.textColor,
                      opacity: 0.6,
                    },
                    children: `${pageNumber}페이지`,
                  }),
                React.createElement("div", {
                  style: {
                    fontSize: "14px",
                    color: template.textColor,
                    opacity: 0.5,
                  },
                  children: "Habitree Reading Hub",
                })
              )
            )
          : React.createElement(
              React.Fragment,
              null,
              // 상단: 책 정보 영역 - 이미지와 텍스트 배치 개선
              React.createElement(
                "div",
                {
                  style: {
                    display: "flex",
                    flexDirection: "row",
                    alignItems: "flex-start",
                    marginBottom: "40px",
                    gap: "30px",
                    paddingBottom: "30px",
                    borderBottom: `2px solid ${template.accentColor}20`,
                  },
                },
                processedBookCoverUrl &&
                  React.createElement("div", {
                    style: {
                      flexShrink: 0,
                    },
                    children: React.createElement("img", {
                      src: processedBookCoverUrl,
                      alt: bookTitle,
                      style: {
                        width: "140px",
                        height: "190px",
                        objectFit: "cover",
                        borderRadius: "10px",
                        boxShadow: "0 6px 20px rgba(0,0,0,0.2)",
                      },
                    }),
                  }),
                React.createElement(
                  "div",
                  {
                    style: {
                      display: "flex",
                      flexDirection: "column",
                      flex: 1,
                      justifyContent: "space-between",
                      minHeight: 0,
                    },
                  },
                  React.createElement("div", {
                    style: {
                      fontSize: "38px",
                      fontWeight: "bold",
                      color: template.accentColor,
                      marginBottom: "12px",
                      lineHeight: "1.3",
                      wordBreak: "break-word",
                    },
                    children: bookTitle,
                  }),
                  bookAuthor &&
                    React.createElement("div", {
                      style: {
                        fontSize: "26px",
                        color: template.textColor,
                        opacity: 0.8,
                        marginBottom: "10px",
                        fontWeight: "500",
                      },
                      children: bookAuthor,
                    }),
                  formattedDate &&
                    React.createElement("div", {
                      style: {
                        fontSize: "20px",
                        color: template.textColor,
                        opacity: 0.6,
                        marginTop: "auto",
                      },
                      children: formattedDate,
                    })
                )
              ),
              // 중앙: 기록 내용 영역 - 가시성 개선
              React.createElement(
                "div",
                {
                  style: {
                    display: "flex",
                    flexDirection: "column",
                    flex: 1,
                    justifyContent: "flex-start",
                    gap: "35px",
                    overflow: "hidden",
                  },
                },
                // 인상깊은 구절 - 가시성 개선
                quote &&
                  React.createElement(
                    "div",
                    {
                      style: {
                        display: "flex",
                        flexDirection: "column",
                      },
                    },
                    React.createElement("div", {
                      style: {
                        fontSize: "22px",
                        fontWeight: "700",
                        color: template.accentColor,
                        marginBottom: "16px",
                        opacity: 0.9,
                        letterSpacing: "0.5px",
                      },
                      children: "인상깊은 구절",
                    }),
                    React.createElement("div", {
                      style: {
                        fontSize: "34px",
                        fontWeight: "500",
                        color: template.textColor,
                        lineHeight: "1.7",
                        textAlign: "left",
                        padding: "28px",
                        backgroundColor:
                          template.backgroundColor === "#FFFFFF"
                            ? "#F9FAFB"
                            : "rgba(255,255,255,0.12)",
                        borderRadius: "12px",
                        borderLeft: `5px solid ${template.accentColor}`,
                        boxShadow: "0 2px 8px rgba(0,0,0,0.08)",
                        maxHeight: "300px",
                        overflow: "hidden",
                      },
                      children: quote,
                    })
                  ),
                // 내 생각 - 가시성 개선
                memo &&
                  React.createElement(
                    "div",
                    {
                      style: {
                        display: "flex",
                        flexDirection: "column",
                      },
                    },
                    React.createElement("div", {
                      style: {
                        fontSize: "22px",
                        fontWeight: "700",
                        color: template.accentColor,
                        marginBottom: "16px",
                        opacity: 0.9,
                        letterSpacing: "0.5px",
                      },
                      children: "내 생각",
                    }),
                    React.createElement("div", {
                      style: {
                        fontSize: "30px",
                        fontWeight: "400",
                        color: template.textColor,
                        lineHeight: "1.7",
                        textAlign: "left",
                        padding: "28px",
                        backgroundColor:
                          template.backgroundColor === "#FFFFFF"
                            ? "#F3F4F6"
                            : "rgba(255,255,255,0.08)",
                        borderRadius: "12px",
                        boxShadow: "0 2px 8px rgba(0,0,0,0.06)",
                        maxHeight: "280px",
                        overflow: "hidden",
                      },
                      children: memo,
                    })
                  )
              ),
              // 하단: 페이지 번호 및 브랜드
              React.createElement(
                "div",
                {
                  style: {
                    display: "flex",
                    flexDirection: "row",
                    justifyContent: "space-between",
                    alignItems: "center",
                    marginTop: "20px",
                  },
                },
                pageNumber &&
                  React.createElement("div", {
                    style: {
                      fontSize: "18px",
                      color: template.textColor,
                      opacity: 0.6,
                    },
                    children: `${pageNumber}페이지`,
                  }),
                React.createElement("div", {
                  style: {
                    fontSize: "16px",
                    color: template.textColor,
                    opacity: 0.5,
                  },
                  children: "Habitree Reading Hub",
                })
              )
            )
      ),
      {
        width: 1080,
        height: 1080,
      }
    );
  } catch (error) {
    console.error("카드뉴스 생성 오류:", error);
    return new Response(
      error instanceof Error ? error.message : "카드뉴스 생성에 실패했습니다.",
      { status: 500 }
    );
  }
}
