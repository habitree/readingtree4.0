import { Header } from "@/components/layout/header";
import { Sidebar } from "@/components/layout/sidebar";
import { MobileNav } from "@/components/layout/mobile-nav";
import { Footer } from "@/components/layout/footer";

/**
 * 메인 레이아웃
 * 사이드바와 헤더를 포함하는 레이아웃
 * (main) 그룹의 모든 페이지에 적용됨
 */
export default function MainLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div className="flex min-h-screen flex-col">
      <Header />
      <div className="flex flex-1">
        <Sidebar />
        <main className="flex-1 lg:pl-64">
          <div className="container mx-auto px-4 py-6 pb-20 lg:pb-6">
            {children}
          </div>
        </main>
      </div>
      <MobileNav />
      <Footer />
    </div>
  );
}

