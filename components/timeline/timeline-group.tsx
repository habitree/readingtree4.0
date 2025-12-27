import { TimelineItem } from "./timeline-item";
import type { NoteWithBook } from "@/types/note";
import { format } from "date-fns";
import { ko } from "date-fns/locale";

interface TimelineGroupProps {
  month: string;
  notes: NoteWithBook[];
}

/**
 * 타임라인 그룹 컴포넌트
 * 월별로 기록을 그룹화하여 표시
 */
export function TimelineGroup({ month, notes }: TimelineGroupProps) {
  // YYYY-MM 형식을 "2024년 1월" 형식으로 변환
  const [year, monthNum] = month.split("-");
  const date = new Date(parseInt(year), parseInt(monthNum) - 1, 1);
  const formattedMonth = format(date, "yyyy년 M월", { locale: ko });

  return (
    <div className="space-y-4">
      <div className="sticky top-20 bg-background py-2 z-10">
        <h2 className="text-lg font-semibold">{formattedMonth}</h2>
      </div>
      <div className="space-y-3">
        {notes.map((note) => (
          <TimelineItem key={note.id} note={note} />
        ))}
      </div>
    </div>
  );
}

