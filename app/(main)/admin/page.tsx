import { getAdminStats, getUserGrowthData, getRecentSystemActivity } from "@/app/actions/admin";
import { AdminDashboard } from "@/components/admin/admin-dashboard";
import { Metadata } from "next";

export const metadata: Metadata = {
    title: "관리자 대시보드 | ReadingTree",
    description: "ReadingTree 서비스 전체 통계 및 활동 관리",
};

export default async function AdminPage() {
    // 데이터 페칭 (서버 컴포넌트)
    const [stats, growth, activity] = await Promise.all([
        getAdminStats(),
        getUserGrowthData(),
        getRecentSystemActivity(),
    ]);

    return (
        <div className="container py-8 max-w-7xl mx-auto">
            <AdminDashboard
                stats={stats}
                growth={growth}
                activity={activity}
            />
        </div>
    );
}
