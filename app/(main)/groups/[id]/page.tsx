import { Suspense } from "react";
import { notFound } from "next/navigation";
import { GroupDashboard } from "@/components/groups/group-dashboard";
import { Skeleton } from "@/components/ui/skeleton";
import { getGroupDetail } from "@/app/actions/groups";

interface GroupDetailPageProps {
  params: {
    id: string;
  };
}

/**
 * 모임 대시보드 페이지
 * US-036: 모임 대시보드
 */
export default async function GroupDetailPage({ params }: GroupDetailPageProps) {
  let groupData;
  try {
    groupData = await getGroupDetail(params.id);
  } catch (error) {
    console.error("모임 상세 조회 오류:", error);
    notFound();
  }

  return (
    <Suspense
      fallback={
        <div className="space-y-6">
          <Skeleton className="h-32 w-full" />
          <Skeleton className="h-64 w-full" />
        </div>
      }
    >
      <GroupDashboard groupData={groupData} />
    </Suspense>
  );
}

