import Link from "next/link";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Users, Lock, Globe } from "lucide-react";
import { formatSmartDate } from "@/lib/utils/date";

interface GroupCardProps {
  group: {
    id: string;
    name: string;
    description: string | null;
    is_public: boolean;
    created_at: string;
    users?: {
      id: string;
      name: string;
      avatar_url: string | null;
    };
    group_members?: Array<{
      user_id: string;
    }>;
  };
  memberCount?: number;
}

/**
 * 모임 카드 컴포넌트
 * 모임 목록에서 사용
 */
export function GroupCard({ group, memberCount }: GroupCardProps) {
  return (
    <Link href={`/groups/${group.id}`}>
      <Card className="hover:shadow-lg transition-shadow cursor-pointer h-full">
        <CardHeader>
          <div className="flex items-start justify-between">
            <div className="flex-1">
              <CardTitle className="line-clamp-1">{group.name}</CardTitle>
              <CardDescription className="mt-1 line-clamp-2">
                {group.description || "설명이 없습니다."}
              </CardDescription>
            </div>
            <Badge variant={group.is_public ? "default" : "secondary"}>
              {group.is_public ? (
                <>
                  <Globe className="mr-1 h-3 w-3" />
                  공개
                </>
              ) : (
                <>
                  <Lock className="mr-1 h-3 w-3" />
                  비공개
                </>
              )}
            </Badge>
          </div>
        </CardHeader>
        <CardContent>
          <div className="flex items-center justify-between text-sm text-muted-foreground">
            <div className="flex items-center gap-4">
              {memberCount !== undefined && (
                <div className="flex items-center gap-1">
                  <Users className="h-4 w-4" />
                  <span>{memberCount}명</span>
                </div>
              )}
              {group.users && (
                <span>리더: {group.users.name}</span>
              )}
            </div>
            <span>{formatSmartDate(group.created_at)}</span>
          </div>
        </CardContent>
      </Card>
    </Link>
  );
}

