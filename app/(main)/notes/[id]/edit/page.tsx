import { notFound, redirect } from "next/navigation";
import { Metadata } from "next";
import { getNoteDetail, updateNote } from "@/app/actions/notes";
import { NoteEditForm } from "@/components/notes/note-edit-form";

export const metadata: Metadata = {
  title: "기록 수정 | Habitree Reading Hub",
  description: "기록을 수정하세요",
};

interface NoteEditPageProps {
  params: {
    id: string;
  };
}

/**
 * 기록 수정 페이지
 * US-018: 기록 수정 및 삭제
 */
export default async function NoteEditPage({ params }: NoteEditPageProps) {
  let note;
  try {
    note = await getNoteDetail(params.id);
  } catch (error) {
    console.error("기록 상세 조회 오류:", error);
    notFound();
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold tracking-tight">기록 수정</h1>
        <p className="text-muted-foreground">
          기록 내용을 수정하세요
        </p>
      </div>

      <NoteEditForm note={note} />
    </div>
  );
}

