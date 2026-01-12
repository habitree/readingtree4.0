"use server";

import { Card, CardHeader, CardTitle, CardContent, CardDescription } from "@/components/ui/card";
import { AdminStatsCard } from "./admin-stats-card";
import { Users, BookOpen, FileText, LayoutGrid, Clock, UserPlus, Settings } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { formatDistanceToNow } from "date-fns";
import { ko } from "date-fns/locale";
import { cn } from "@/lib/utils";
import Link from "next/link";

interface AdminDashboardProps {
    stats: any;
    growth: any;
    activity: any;
}

export async function AdminDashboard({ stats, growth, activity }: AdminDashboardProps) {
    return (
        <div className="space-y-8 pb-10">
            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
                <div className="flex flex-col gap-2">
                    <h1 className="text-3xl font-bold tracking-tight">시스템 대시보드</h1>
                    <p className="text-muted-foreground">ReadingTree 플랫폼의 전체 현황 및 활동 집계</p>
                </div>
                <Link 
                    href="/admin/api-info"
                    className="inline-flex items-center gap-2 px-4 py-2 bg-primary text-primary-foreground rounded-lg hover:bg-primary/90 transition-colors font-medium text-sm"
                >
                    <Settings className="h-4 w-4" />
                    API 연동 정보
                </Link>
            </div>

            {/* Stats Overview */}
            <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
                <AdminStatsCard
                    title="전체 사용자"
                    value={stats.summary.users.toLocaleString()}
                    description="총 가입 계정 수"
                    icon={Users}
                    trend={{ value: 12, isPositive: true }}
                    colorClassName="border-l-blue-500"
                    iconColorClassName="bg-blue-500/10 text-blue-600"
                />
                <AdminStatsCard
                    title="등록된 도서"
                    value={stats.summary.books.toLocaleString()}
                    description="시스템 등록 도서 총합"
                    icon={BookOpen}
                    colorClassName="border-l-forest-500"
                    iconColorClassName="bg-forest-500/10 text-forest-600"
                />
                <AdminStatsCard
                    title="전체 기록"
                    value={stats.summary.notes.toLocaleString()}
                    description="전체 사용자의 독서 노트"
                    icon={FileText}
                    trend={{ value: 8, isPositive: true }}
                    colorClassName="border-l-purple-500"
                    iconColorClassName="bg-purple-500/10 text-purple-600"
                />
                <AdminStatsCard
                    title="활성 그룹"
                    value={stats.summary.groups.toLocaleString()}
                    description="운영 중인 독서 그룹"
                    icon={LayoutGrid}
                    colorClassName="border-l-orange-500"
                    iconColorClassName="bg-orange-500/10 text-orange-600"
                />
            </div>

            <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-7">
                {/* Growth Statistics - Conceptual Placeholder or reuse MonthlyChart if possible */}
                <Card className="col-span-4">
                    <CardHeader>
                        <CardTitle>성장 추이</CardTitle>
                        <CardDescription>최근 6개월간 신규 사용자 가입 현황</CardDescription>
                    </CardHeader>
                    <CardContent className="h-[300px] flex items-end justify-between gap-2 px-6 pb-8">
                        {growth.map((item: any, i: number) => (
                            <div key={i} className="flex-1 flex flex-col items-center gap-2 group">
                                <div
                                    className="w-full bg-primary/20 hover:bg-primary/40 transition-all rounded-t-md relative flex items-end justify-center"
                                    style={{ height: `${Math.max((item.count / (Math.max(...growth.map((g: any) => g.count)) || 1)) * 200, 10)}px` }}
                                >
                                    <span className="absolute -top-6 text-xs font-bold opacity-0 group-hover:opacity-100 transition-opacity">
                                        {item.count}
                                    </span>
                                </div>
                                <span className="text-xs text-muted-foreground font-medium">{item.month}</span>
                            </div>
                        ))}
                    </CardContent>
                </Card>

                {/* Recent New Users */}
                <Card className="col-span-3">
                    <CardHeader>
                        <div className="flex items-center gap-2">
                            <UserPlus className="h-5 w-5 text-blue-500" />
                            <CardTitle>신규 가입자</CardTitle>
                        </div>
                        <CardDescription>가장 최근에 가입한 5명의 사용자</CardDescription>
                    </CardHeader>
                    <CardContent>
                        <div className="space-y-6">
                            {activity.recentUsers.map((user: any) => (
                                <div key={user.id} className="flex items-center gap-4">
                                    <Avatar className="h-9 w-9">
                                        <AvatarImage src={user.avatar_url || ""} />
                                        <AvatarFallback>{user.name[0]}</AvatarFallback>
                                    </Avatar>
                                    <div className="flex-1 min-w-0">
                                        <p className="text-sm font-medium leading-none truncate">{user.name}</p>
                                        <p className="text-xs text-muted-foreground truncate">{user.email}</p>
                                    </div>
                                    <div className="text-[10px] text-muted-foreground font-mono">
                                        {formatDistanceToNow(new Date(user.created_at), { addSuffix: true, locale: ko })}
                                    </div>
                                </div>
                            ))}
                        </div>
                    </CardContent>
                </Card>
            </div>

            {/* System Activity */}
            <Card>
                <CardHeader>
                    <div className="flex items-center gap-2">
                        <Clock className="h-5 w-5 text-purple-500" />
                        <CardTitle>최근 시스템 활동</CardTitle>
                    </div>
                    <CardDescription>시스템 전체에서 발생한 실시간 기록 활동</CardDescription>
                </CardHeader>
                <CardContent>
                    <div className="space-y-6">
                        {activity.recentNotes.map((note: any) => (
                            <div key={note.id} className="flex items-start gap-4 p-3 rounded-lg hover:bg-muted/50 transition-colors border border-transparent hover:border-border">
                                <div className={cn(
                                    "mt-1 p-2 rounded-full",
                                    note.type === 'quote' && "bg-yellow-500/10 text-yellow-600",
                                    note.type === 'photo' && "bg-blue-500/10 text-blue-600",
                                    note.type === 'memo' && "bg-forest-500/10 text-forest-600",
                                    note.type === 'transcription' && "bg-purple-500/10 text-purple-600"
                                )}>
                                    <FileText className="h-4 w-4" />
                                </div>
                                <div className="flex-1 min-w-0">
                                    <div className="flex items-center gap-2 mb-1">
                                        <span className="font-bold text-sm text-foreground">{note.users?.name || "익명"}</span>
                                        <span className="text-xs text-muted-foreground">님이</span>
                                        <Badge variant="secondary" className="text-[10px] px-1.5 h-4">
                                            {note.books?.title || "알 수 없는 책"}
                                        </Badge>
                                    </div>
                                    <p className="text-sm text-muted-foreground line-clamp-1 italic">
                                        {note.content || "이미지 기록"}
                                    </p>
                                </div>
                                <div className="text-[10px] text-muted-foreground shrink-0 self-center">
                                    {formatDistanceToNow(new Date(note.created_at), { addSuffix: true, locale: ko })}
                                </div>
                            </div>
                        ))}
                    </div>
                </CardContent>
            </Card>
        </div>
    );
}
