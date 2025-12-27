import { getProfile } from "@/app/actions/profile";
import { ProfileForm } from "./profile-form";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { getImageUrl } from "@/lib/utils/image";
import { formatSmartDate } from "@/lib/utils/date";
import { User } from "lucide-react";

/**
 * 프로필 컨텐츠 컴포넌트
 * 프로필 정보 표시 및 수정 폼
 */
export async function ProfileContent() {
  let user;
  try {
    user = await getProfile();
  } catch (error) {
    console.error("프로필 조회 오류:", error);
    return (
      <Card>
        <CardContent className="pt-6">
          <div className="text-center py-8">
            <p className="text-muted-foreground">프로필을 불러올 수 없습니다.</p>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-6">
      {/* 프로필 요약 */}
      <Card>
        <CardHeader>
          <CardTitle>프로필 정보</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex items-center gap-4">
            <Avatar className="h-16 w-16">
              <AvatarImage src={getImageUrl(user.avatar_url)} />
              <AvatarFallback>
                {user.name[0]?.toUpperCase() || <User className="h-8 w-8" />}
              </AvatarFallback>
            </Avatar>
            <div className="space-y-1">
              <p className="text-lg font-semibold">{user.name}</p>
              {user.email && (
                <p className="text-sm text-muted-foreground">{user.email}</p>
              )}
              <p className="text-sm text-muted-foreground">
                가입일: {formatSmartDate(user.created_at)}
              </p>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* 프로필 수정 폼 */}
      <ProfileForm user={user} />
    </div>
  );
}

