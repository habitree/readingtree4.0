import { NextRequest, NextResponse } from "next/server";
import { ensureBook } from "@/app/actions/books";

export async function POST(request: NextRequest) {
  try {
    const bookData = await request.json();
    const { bookId } = await ensureBook(bookData);
    return NextResponse.json({ bookId });
  } catch (error) {
    return NextResponse.json(
      { message: error instanceof Error ? error.message : "책 확인 실패" },
      { status: 400 }
    );
  }
}

