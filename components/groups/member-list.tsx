"use client";

import { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { approveMember, rejectMember, getGroupDetail } from "@/app/actions/groups";
import { toast } from "sonner";
import { Crown, Check, X, Loader2 } from "lucide-react";
import { useRouter } from "next/navigation";

interface MemberListProps {
  members: Array<{
    id: string;
    user_id: string;
    role: string;
    status: string;
    users: {
      id: string;
      name: string;
      avatar_url: string | null;
    } | null; // users가 null일 수 있음
  }>;
  isLeader: boolean;
  groupId: string;
}

/**
 * 구성원 목록 컴포넌트
 * 구성원 목록 및 참여 신청 승인/거부
 */
export function MemberList({ members, isLeader, groupId }: MemberListProps) {
  const router = useRouter();
  const [pendingMembers, setPendingMembers] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    if (isLeader) {
      loadPendingMembers();
    } else {
      setIsLoading(false);
    }
  }, [isLeader, groupId]);

  const loadPendingMembers = async () => {
    try {
      const data = await getGroupDetail(groupId);
      // pending 상태인 멤버는 별도로 조회 필요
      // 여기서는 간단히 표시만 함
      setIsLoading(false);
    } catch (error) {
      console.error("대기 중인 멤버 로드 오류:", error);
      setIsLoading(false);
    }
  };

  const handleApprove = async (userId: string) => {
    try {
      await approveMember(groupId, userId);
      toast.success("멤버가 승인되었습니다.");
      router.refresh();
    } catch (error) {
      console.error("멤버 승인 오류:", error);
      toast.error(
        error instanceof Error ? error.message : "멤버 승인에 실패했습니다."
      );
    }
  };

  const handleReject = async (userId: string) => {
    try {
      await rejectMember(groupId, userId);
      toast.success("멤버가 거부되었습니다.");
      router.refresh();
    } catch (error) {
      console.error("멤버 거부 오류:", error);
      toast.error(
        error instanceof Error ? error.message : "멤버 거부에 실패했습니다."
      );
    }
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-12">
        <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <Card>
        <CardHeader>
          <CardTitle>구성원 목록</CardTitle>
        </CardHeader>
        <CardContent>
          {members.length === 0 ? (
            <div className="text-center py-8">
              <p className="text-muted-foreground">구성원이 없습니다.</p>
            </div>
          ) : (
            <div className="space-y-3">
              {members.map((member) => {
                // users가 null인 경우에도 표시 (RLS 정책으로 인해 조인 실패 가능)
                const userName = member.users?.name || `사용자 ${member.user_id.slice(0, 8)}`;
                const userInitial = member.users?.name?.[0] || "?";
                
                return (
                  <div
                    key={member.id}
                    className="flex items-center justify-between p-3 rounded-lg border"
                  >
                    <div className="flex items-center gap-3">
                      <Avatar>
                        <AvatarImage src={member.users?.avatar_url || undefined} />
                        <AvatarFallback>{userInitial}</AvatarFallback>
                      </Avatar>
                      <div>
                        <div className="flex items-center gap-2">
                          <span className="font-medium">{userName}</span>
                          {member.role === "leader" && (
                            <Badge variant="default" className="text-xs">
                              <Crown className="mr-1 h-3 w-3" />
                              리더
                            </Badge>
                          )}
                        </div>
                        {!member.users && (
                          <p className="text-xs text-muted-foreground">
                            프로필 정보를 불러올 수 없습니다
                          </p>
                        )}
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}

