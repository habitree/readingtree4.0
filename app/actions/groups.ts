"use server";

import { createServerSupabaseClient } from "@/lib/supabase/server";
import { revalidatePath } from "next/cache";
import { sanitizeSearchQuery } from "@/lib/utils/validation";

export type MemberRole = "leader" | "member";
export type MemberStatus = "pending" | "approved" | "rejected";

/**
 * 모임 생성
 * 생성자는 자동으로 리더가 됨
 */
export async function createGroup(data: {
  name: string;
  description?: string;
  isPublic: boolean;
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

  // 모임 생성 (RLS 재귀 방지를 위해 select 제거)
  const { data: insertResult, error: groupError } = await supabase
    .from("groups")
    .insert({
      name: data.name,
      description: data.description || null,
      leader_id: user.id,
      is_public: data.isPublic,
    })
    .select("id")
    .single();

  if (groupError || !insertResult) {
    throw new Error(`모임 생성 실패: ${groupError?.message || "알 수 없는 오류"}`);
  }

  const groupId = insertResult.id;

  // 생성자를 리더로 자동 추가
  const { error: memberError } = await supabase.from("group_members").insert({
    group_id: groupId,
    user_id: user.id,
    role: "leader",
    status: "approved",
  });

  if (memberError) {
    // 모임은 생성되었지만 멤버 추가 실패 시 모임 삭제
    await supabase.from("groups").delete().eq("id", groupId);
    throw new Error(`멤버 추가 실패: ${memberError.message}`);
  }

  revalidatePath("/groups");
  return { success: true, groupId };
}

/**
 * 모임 참여 신청
 * 공개 모임은 자동 승인, 비공개 모임은 리더 승인 필요
 */
export async function joinGroup(groupId: string) {
  const supabase = await createServerSupabaseClient();

  // 현재 사용자 확인
  const {
    data: { user },
    error: authError,
  } = await supabase.auth.getUser();

  if (authError || !user) {
    throw new Error("로그인이 필요합니다.");
  }

  // 모임 정보 조회
  const { data: group, error: groupError } = await supabase
    .from("groups")
    .select("is_public")
    .eq("id", groupId)
    .single();

  if (groupError || !group) {
    throw new Error("모임을 찾을 수 없습니다.");
  }

  // 이미 멤버인지 확인
  const { data: existingMember } = await supabase
    .from("group_members")
    .select("id, status")
    .eq("group_id", groupId)
    .eq("user_id", user.id)
    .single();

  if (existingMember) {
    if (existingMember.status === "approved") {
      throw new Error("이미 모임 멤버입니다.");
    }
    if (existingMember.status === "pending") {
      throw new Error("이미 참여 신청이 대기 중입니다.");
    }
  }

  // 공개 모임은 자동 승인, 비공개 모임은 대기
  const status: MemberStatus = group.is_public ? "approved" : "pending";

  const { error: memberError } = await supabase.from("group_members").insert({
    group_id: groupId,
    user_id: user.id,
    role: "member",
    status,
  });

  if (memberError) {
    throw new Error(`참여 신청 실패: ${memberError.message}`);
  }

  revalidatePath(`/groups/${groupId}`);
  revalidatePath("/groups");
  return { success: true, autoApproved: group.is_public };
}

/**
 * 모임 참여 승인
 * 리더만 승인 가능
 */
export async function approveMember(groupId: string, userId: string) {
  const supabase = await createServerSupabaseClient();

  // 현재 사용자 확인
  const {
    data: { user },
    error: authError,
  } = await supabase.auth.getUser();

  if (authError || !user) {
    throw new Error("로그인이 필요합니다.");
  }

  // 리더 권한 확인
  const { data: group, error: groupError } = await supabase
    .from("groups")
    .select("leader_id")
    .eq("id", groupId)
    .single();

  if (groupError || !group) {
    throw new Error("모임을 찾을 수 없습니다.");
  }

  if (group.leader_id !== user.id) {
    throw new Error("리더만 멤버를 승인할 수 있습니다.");
  }

  // 멤버 승인
  const { error: updateError } = await supabase
    .from("group_members")
    .update({ status: "approved" })
    .eq("group_id", groupId)
    .eq("user_id", userId);

  if (updateError) {
    throw new Error(`승인 실패: ${updateError.message}`);
  }

  revalidatePath(`/groups/${groupId}`);
  return { success: true };
}

/**
 * 모임 참여 거부
 * 리더만 거부 가능
 */
export async function rejectMember(groupId: string, userId: string) {
  const supabase = await createServerSupabaseClient();

  // 현재 사용자 확인
  const {
    data: { user },
    error: authError,
  } = await supabase.auth.getUser();

  if (authError || !user) {
    throw new Error("로그인이 필요합니다.");
  }

  // 리더 권한 확인
  const { data: group, error: groupError } = await supabase
    .from("groups")
    .select("leader_id")
    .eq("id", groupId)
    .single();

  if (groupError || !group) {
    throw new Error("모임을 찾을 수 없습니다.");
  }

  if (group.leader_id !== user.id) {
    throw new Error("리더만 멤버를 거부할 수 있습니다.");
  }

  // 멤버 거부 (삭제)
  const { error: deleteError } = await supabase
    .from("group_members")
    .delete()
    .eq("group_id", groupId)
    .eq("user_id", userId);

  if (deleteError) {
    throw new Error(`거부 실패: ${deleteError.message}`);
  }

  revalidatePath(`/groups/${groupId}`);
  return { success: true };
}

/**
 * 모임 목록 조회
 * @param isPublic 공개 모임만 조회 (선택)
 */
export async function getGroups(isPublic?: boolean) {
  const supabase = await createServerSupabaseClient();

  // 현재 사용자 확인
  const {
    data: { user },
    error: authError,
  } = await supabase.auth.getUser();

  if (authError || !user) {
    throw new Error("로그인이 필요합니다.");
  }

  // 먼저 사용자가 멤버인 그룹 ID 목록 조회 (RLS 재귀 방지)
  const { data: memberships, error: membersError } = await supabase
    .from("group_members")
    .select("group_id, role, status")
    .eq("user_id", user.id)
    .eq("status", "approved");

  if (membersError) {
    throw new Error(`멤버십 조회 실패: ${membersError.message}`);
  }

  // 멤버인 그룹 ID 목록 추출
  const groupIds = (memberships || []).map((m) => m.group_id);

  // 그룹이 없으면 빈 배열 반환
  if (groupIds.length === 0) {
    return [];
  }

  // 그룹 정보 조회 (멤버십 정보 포함)
  let query = supabase
    .from("groups")
    .select(
      `
      *,
      group_members (
        user_id,
        role,
        status
      )
    `
    )
    .in("id", groupIds);

  if (isPublic !== undefined) {
    query = query.eq("is_public", isPublic);
  }

  const { data, error } = await query;

  if (error) {
    throw new Error(`모임 목록 조회 실패: ${error.message}`);
  }

  // 조회된 그룹에 사용자의 멤버십 정보 추가
  const groupsWithMembership = (data || []).map((group) => {
    const membership = memberships?.find((m) => m.group_id === group.id);
    return {
      ...group,
      group_members: group.group_members?.filter(
        (m: { user_id: string; role: string; status: string }) =>
          m.user_id === user.id
      ) || [],
    };
  });

  return groupsWithMembership;
}

/**
 * 공개 모임 목록 조회 (검색용)
 */
export async function getPublicGroups(searchQuery?: string) {
  const supabase = await createServerSupabaseClient();

  let query = supabase
    .from("groups")
    .select(
      `
      *,
      users!groups_leader_id_fkey (
        id,
        name,
        avatar_url
      )
    `
    )
    .eq("is_public", true)
    .order("created_at", { ascending: false });

  if (searchQuery) {
    // 검색어 이스케이프 처리 (SQL Injection 방지)
    const sanitizedQuery = sanitizeSearchQuery(searchQuery);
    if (sanitizedQuery) {
      query = query.or(`name.ilike.%${sanitizedQuery}%,description.ilike.%${sanitizedQuery}%`);
    }
  }

  const { data, error } = await query;

  if (error) {
    throw new Error(`공개 모임 조회 실패: ${error.message}`);
  }

  return data || [];
}

/**
 * 모임 상세 조회
 */
export async function getGroupDetail(groupId: string) {
  const supabase = await createServerSupabaseClient();

  // 현재 사용자 확인
  const {
    data: { user },
    error: authError,
  } = await supabase.auth.getUser();

  if (authError || !user) {
    throw new Error("로그인이 필요합니다.");
  }

  // 모임 정보 조회
  const { data: group, error: groupError } = await supabase
    .from("groups")
    .select(
      `
      *,
      users!groups_leader_id_fkey (
        id,
        name,
        avatar_url
      )
    `
    )
    .eq("id", groupId)
    .single();

  if (groupError || !group) {
    throw new Error("모임을 찾을 수 없습니다.");
  }

  // 멤버 목록 조회
  const { data: members, error: membersError } = await supabase
    .from("group_members")
    .select(
      `
      *,
      users (
        id,
        name,
        avatar_url
      )
    `
    )
    .eq("group_id", groupId)
    .eq("status", "approved");

  if (membersError) {
    throw new Error(`멤버 목록 조회 실패: ${membersError.message}`);
  }

  // 현재 사용자의 멤버십 확인
  const { data: myMembership } = await supabase
    .from("group_members")
    .select("role, status")
    .eq("group_id", groupId)
    .eq("user_id", user.id)
    .single();

  // 공유된 기록 목록 조회
  const { data: sharedNotes, error: notesError } = await supabase
    .from("group_notes")
    .select(
      `
      *,
      notes (
        *,
        books (
          id,
          title,
          author,
          cover_image_url
        )
      )
    `
    )
    .eq("group_id", groupId)
    .order("shared_at", { ascending: false })
    .limit(20);

  if (notesError) {
    console.error("공유 기록 조회 오류:", notesError);
  }

  return {
    group,
    members: members || [],
    myMembership: myMembership || null,
    sharedNotes: sharedNotes || [],
    isLeader: group.leader_id === user.id,
  };
}

/**
 * 구성원 진행 상황 조회
 */
export async function getMemberProgress(groupId: string) {
  const supabase = await createServerSupabaseClient();

  // 현재 사용자 확인
  const {
    data: { user },
    error: authError,
  } = await supabase.auth.getUser();

  if (authError || !user) {
    throw new Error("로그인이 필요합니다.");
  }

  // 리더 권한 확인
  const { data: group, error: groupError } = await supabase
    .from("groups")
    .select("leader_id")
    .eq("id", groupId)
    .single();

  if (groupError || !group) {
    throw new Error("모임을 찾을 수 없습니다.");
  }

  if (group.leader_id !== user.id) {
    throw new Error("리더만 진행 상황을 조회할 수 있습니다.");
  }

  // 승인된 멤버 목록 조회
  const { data: members, error: membersError } = await supabase
    .from("group_members")
    .select(
      `
      user_id,
      users (
        id,
        name,
        avatar_url
      )
    `
    )
    .eq("group_id", groupId)
    .eq("status", "approved");

  if (membersError) {
    throw new Error(`멤버 목록 조회 실패: ${membersError.message}`);
  }

  // 각 멤버의 진행 상황 조회
  const progress = await Promise.all(
    (members || []).map(async (member) => {
      const userId = member.user_id;

      // 완독한 책 수
      const { count: completedBooks } = await supabase
        .from("user_books")
        .select("*", { count: "exact", head: true })
        .eq("user_id", userId)
        .eq("status", "completed");

      // 작성한 기록 수
      const { count: notesCount } = await supabase
        .from("notes")
        .select("*", { count: "exact", head: true })
        .eq("user_id", userId);

      // 최근 활동 일자
      const { data: recentNote } = await supabase
        .from("notes")
        .select("created_at")
        .eq("user_id", userId)
        .order("created_at", { ascending: false })
        .limit(1)
        .single();

      return {
        user: member.users,
        completedBooks: completedBooks || 0,
        notesCount: notesCount || 0,
        lastActivity: recentNote?.created_at || null,
      };
    })
  );

  return progress;
}

/**
 * 모임 내 기록 공유
 */
export async function shareNoteToGroup(noteId: string, groupId: string) {
  const supabase = await createServerSupabaseClient();

  // 현재 사용자 확인
  const {
    data: { user },
    error: authError,
  } = await supabase.auth.getUser();

  if (authError || !user) {
    throw new Error("로그인이 필요합니다.");
  }

  // 기록 소유자 확인
  const { data: note, error: noteError } = await supabase
    .from("notes")
    .select("user_id")
    .eq("id", noteId)
    .single();

  if (noteError || !note) {
    throw new Error("기록을 찾을 수 없습니다.");
  }

  if (note.user_id !== user.id) {
    throw new Error("본인의 기록만 공유할 수 있습니다.");
  }

  // 모임 멤버 확인
  const { data: membership } = await supabase
    .from("group_members")
    .select("id")
    .eq("group_id", groupId)
    .eq("user_id", user.id)
    .eq("status", "approved")
    .single();

  if (!membership) {
    throw new Error("모임 멤버만 기록을 공유할 수 있습니다.");
  }

  // 이미 공유된 기록인지 확인
  const { data: existing } = await supabase
    .from("group_notes")
    .select("id")
    .eq("group_id", groupId)
    .eq("note_id", noteId)
    .single();

  if (existing) {
    throw new Error("이미 공유된 기록입니다.");
  }

  // 기록 공유
  const { error: shareError } = await supabase.from("group_notes").insert({
    group_id: groupId,
    note_id: noteId,
  });

  if (shareError) {
    throw new Error(`공유 실패: ${shareError.message}`);
  }

  revalidatePath(`/groups/${groupId}`);
  return { success: true };
}

