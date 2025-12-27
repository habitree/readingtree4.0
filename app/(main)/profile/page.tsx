import { Suspense } from "react";
import { ProfileContent } from "@/components/profile/profile-content";
import { Skeleton } from "@/components/ui/skeleton";

/**
 * 프로필 페이지
 * US-005: 프로필 관리
 */
export default function ProfilePage() {
  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold tracking-tight">프로필</h1>
        <p className="text-muted-foreground">
          프로필 정보를 수정하고 관리하세요
        </p>
      </div>

      <Suspense
        fallback={
          <div className="space-y-6">
            <Skeleton className="h-32 w-full" />
            <Skeleton className="h-64 w-full" />
          </div>
        }
      >
        <ProfileContent />
      </Suspense>
    </div>
  );
}

