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
    };
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
          <div className="space-y-3">
            {members.map((member) => (
              <div
                key={member.id}
                className="flex items-center justify-between p-3 rounded-lg border"
              >
                <div className="flex items-center gap-3">
                  <Avatar>
                    <AvatarImage src={member.users.avatar_url || undefined} />
                    <AvatarFallback>
                      {member.users.name[0]}
                    </AvatarFallback>
                  </Avatar>
                  <div>
                    <div className="flex items-center gap-2">
                      <span className="font-medium">{member.users.name}</span>
                      {member.role === "leader" && (
                        <Badge variant="default" className="text-xs">
                          <Crown className="mr-1 h-3 w-3" />
                          리더
                        </Badge>
                      )}
                    </div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}

