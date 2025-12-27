/**
 * 독서모임 관련 타입 정의
 */

export type MemberRole = "leader" | "member";
export type MemberStatus = "pending" | "approved" | "rejected";

export interface Group {
  id: string;
  name: string;
  description: string | null;
  leader_id: string;
  is_public: boolean;
  created_at: string;
  updated_at: string;
}

export interface GroupMember {
  id: string;
  group_id: string;
  user_id: string;
  role: MemberRole;
  status: MemberStatus;
  joined_at: string;
}

export interface GroupBook {
  id: string;
  group_id: string;
  book_id: string;
  started_at: string;
  target_completed_at: string | null;
  created_at: string;
}

export interface GroupWithDetails extends Group {
  members_count?: number;
  books_count?: number;
  leader?: {
    id: string;
    name: string;
    avatar_url: string | null;
  };
}

