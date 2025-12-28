import { ImageResponse } from "@vercel/og";
import { NextRequest } from "next/server";
import { getTemplateById } from "@/lib/templates/card-news-templates";
import { createServerSupabaseClient } from "@/lib/supabase/server";
import React from "react";

export const runtime = "edge";

/**
 * 카드뉴스 생성 API
 * @vercel/og를 사용하여 1080x1080 이미지 생성
 */
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const noteId = searchParams.get("noteId");
    const templateId = searchParams.get("templateId") || "minimal";

    if (!noteId) {
      return new Response("noteId가 필요합니다.", { status: 400 });
    }

    // 기록 조회 (공개 기록 또는 본인 기록 조회 가능)
    const supabase = await createServerSupabaseClient();
    const {
      data: { user },
    } = await supabase.auth.getUser();

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
    if (user) {
      query = query.or(`is_public.eq.true,user_id.eq.${user.id}`);
    } else {
      // 비로그인 사용자는 공개 기록만 조회 가능
      query = query.eq("is_public", true);
    }

    const { data: note, error } = await query.single();

    if (error || !note) {
      return new Response("기록을 찾을 수 없거나 공개되지 않은 기록입니다.", { status: 404 });
    }

    // 템플릿 가져오기
    const template = getTemplateById(templateId);

    // 카드뉴스 내용 준비
    const bookTitle = (note.books as any)?.title || "제목 없음";
    const bookAuthor = (note.books as any)?.author || "";
    const content = note.content || "";
    const pageNumber = note.page_number;

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
            alignItems: "center",
            justifyContent: "center",
            backgroundColor: template.backgroundColor,
            padding: "80px",
            fontFamily: template.fontFamily,
          },
        },
        React.createElement(
          "div",
          {
            style: {
              display: "flex",
              flexDirection: "column",
              alignItems: "center",
              marginBottom: "40px",
            },
          },
          React.createElement(
            "div",
            {
              style: {
                fontSize: "32px",
                fontWeight: "bold",
                color: template.accentColor,
                marginBottom: "8px",
              },
            },
            bookTitle
          ),
          bookAuthor &&
            React.createElement(
              "div",
              {
                style: {
                  fontSize: "24px",
                  color: template.textColor,
                  opacity: 0.7,
                },
              },
              bookAuthor
            )
        ),
        React.createElement(
          "div",
          {
            style: {
              display: "flex",
              flexDirection: "column",
              alignItems: "center",
              justifyContent: "center",
              flex: 1,
              textAlign: "center",
            },
          },
          React.createElement(
            "div",
            {
              style: {
                fontSize: "48px",
                fontWeight: "600",
                color: template.textColor,
                lineHeight: "1.4",
                maxWidth: "900px",
                marginBottom: "40px",
              },
            },
            content
          )
        ),
        pageNumber &&
          React.createElement(
            "div",
            {
              style: {
                fontSize: "20px",
                color: template.textColor,
                opacity: 0.6,
                marginTop: "40px",
              },
            },
            `${pageNumber}페이지`
          ),
        React.createElement(
          "div",
          {
            style: {
              position: "absolute",
              bottom: "40px",
              fontSize: "18px",
              color: template.textColor,
              opacity: 0.5,
            },
          },
          "Habitree Reading Hub"
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
