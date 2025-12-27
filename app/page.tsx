/**
 * 홈/대시보드 페이지
 * TODO: 실제 대시보드 내용 구현 (TASK-08)
 */
export default function Home() {
  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-3xl font-bold tracking-tight">홈</h1>
        <p className="text-muted-foreground">
          독서 기록을 관리하고 공유하세요.
        </p>
      </div>

      {/* TODO: 올해 독서 목표 진행률 (TASK-08) */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        <div className="rounded-lg border p-6">
          <h3 className="text-sm font-medium text-muted-foreground">올해 읽은 책</h3>
          <p className="text-2xl font-bold mt-2">0권</p>
        </div>
        <div className="rounded-lg border p-6">
          <h3 className="text-sm font-medium text-muted-foreground">작성한 기록</h3>
          <p className="text-2xl font-bold mt-2">0개</p>
        </div>
        <div className="rounded-lg border p-6">
          <h3 className="text-sm font-medium text-muted-foreground">이번 주 기록</h3>
          <p className="text-2xl font-bold mt-2">0개</p>
        </div>
        <div className="rounded-lg border p-6">
          <h3 className="text-sm font-medium text-muted-foreground">참여 중인 모임</h3>
          <p className="text-2xl font-bold mt-2">0개</p>
        </div>
      </div>

      {/* TODO: 최근 기록 목록 (TASK-05) */}
      <div>
        <h2 className="text-2xl font-semibold tracking-tight mb-4">최근 기록</h2>
        <p className="text-muted-foreground">아직 기록이 없습니다.</p>
      </div>
    </div>
  );
}

