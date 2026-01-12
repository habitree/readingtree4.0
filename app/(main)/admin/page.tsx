import { getAdminStats, getUserGrowthData, getRecentSystemActivity, getOcrMonthlyUsage, getOcrTotalStats } from "@/app/actions/admin";
import { AdminDashboard } from "@/components/admin/admin-dashboard";
import { Metadata } from "next";
import { isAdmin } from "@/app/actions/auth";
import { redirect } from "next/navigation";

export const metadata: Metadata = {
    title: "관리자 대시보드 | ReadingTree",
    description: "ReadingTree 서비스 전체 통계 및 활동 관리",
};

export default async function AdminPage() {
    // 관리자 권한 확인
    const admin = await isAdmin();
    
    if (!admin) {
        // 관리자가 아닌 경우 홈으로 리다이렉트
        redirect("/");
    }
    
    // 데이터 페칭 (서버 컴포넌트)
    const [stats, growth, activity, ocrMonthlyUsage, ocrTotalStats] = await Promise.all([
        getAdminStats(),
        getUserGrowthData(),
        getRecentSystemActivity(),
        getOcrMonthlyUsage(),
        getOcrTotalStats(),
    ]);

    return (
        <div className="container py-8 max-w-7xl mx-auto">
            <AdminDashboard
                stats={stats}
                growth={growth}
                activity={activity}
                ocrMonthlyUsage={ocrMonthlyUsage}
                ocrTotalStats={ocrTotalStats}
            />
        </div>
    );
}
