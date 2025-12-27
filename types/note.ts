/**
 * 기록 관련 타입 정의
 */

export type NoteType = "quote" | "photo" | "memo" | "transcription";

export interface Note {
  id: string;
  user_id: string;
  book_id: string;
  type: NoteType;
  content: string | null;
  image_url: string | null;
  page_number: number | null;
  is_public: boolean;
  tags: string[] | null;
  created_at: string;
  updated_at: string;
}

export interface NoteWithBook extends Note {
  book?: {
    id: string;
    title: string;
    author: string | null;
    cover_image_url: string | null;
  };
}

export interface CreateNoteInput {
  book_id: string;
  type: NoteType;
  content?: string;
  image_url?: string;
  page_number?: number;
  is_public?: boolean;
  tags?: string[];
}

export interface UpdateNoteInput {
  content?: string;
  page_number?: number;
  is_public?: boolean;
  tags?: string[];
}

