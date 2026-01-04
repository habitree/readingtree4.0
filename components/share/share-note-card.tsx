"use client";

import { useState } from "react";
import Image from "next/image";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { getImageUrl } from "@/lib/utils/image";
import { parseNoteContentFields, getNoteTypeLabel } from "@/lib/utils/note";
import type { NoteWithBook } from "@/types/note";
import { Quote, BookOpen, Calendar, ChevronDown, ChevronUp, Trees } from "lucide-react";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { ImageLightbox } from "@/components/notes/image-lightbox";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";

interface ShareNoteCardProps {
    note: NoteWithBook;
    className?: string;
    isPublicView?: boolean;
    hideActions?: boolean; // 캡처 시 버튼 숨김용
    showTimestamp?: boolean; // 타임스탬프 표시 여부
    user?: {
        id: string;
        name: string;
        avatar_url: string | null;
    } | null; // 사용자 정보
}

/**
 * 텍스트 더보기 제어를 위한 서브 컴포넌트
 */
function ExpandableText({
    text,
    limit = 180,
    className,
    hideActions = false
}: {
    text: string;
    limit?: number;
    className?: string;
    hideActions?: boolean;
}) {
    const [isExpanded, setIsExpanded] = useState(false);
    const shouldTruncate = text.length > limit;

    // [UPDATE] 캡처 시(hideActions=true)에도 확장하지 않고 limit 내에서 유지하여 카드 사이즈 고정
    const displayText = isExpanded ? text : (text.length > limit ? text.slice(0, limit) + "..." : text);

    return (
        <div className={cn("relative group", className)}>
            <p className="whitespace-pre-wrap transition-all duration-300">
                {displayText}
            </p>
            {shouldTruncate && !hideActions && (
                <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => setIsExpanded(!isExpanded)}
                    className="h-6 px-2 mt-1 text-[10px] font-bold text-forest-600 hover:bg-forest-50 gap-1 transition-all"
                >
                    {isExpanded ? (
                        <>접기 <ChevronUp className="w-3 h-3" /></>
                    ) : (
                        <>더보기 <ChevronDown className="w-3 h-3" /></>
                    )}
                </Button>
            )}
        </div>
    );
}

/**
 * 날짜를 YYYY.MM.DD 형식으로 변환
 */
const formatDate = (dateStr: string) => {
    const date = new Date(dateStr);
    const y = date.getFullYear();
    const m = String(date.getMonth() + 1).padStart(2, '0');
    const d = String(date.getDate()).padStart(2, '0');
    return `${y}.${m}.${d}`;
};

/**
 * 날짜와 시간을 YYYY.MM.DD HH:mm 형식으로 변환
 */
const formatDateTime = (dateStr: string) => {
    const date = new Date(dateStr);
    const y = date.getFullYear();
    const m = String(date.getMonth() + 1).padStart(2, '0');
    const d = String(date.getDate()).padStart(2, '0');
    const hh = String(date.getHours()).padStart(2, '0');
    const mm = String(date.getMinutes()).padStart(2, '0');
    return `${y}.${m}.${d} ${hh}:${mm}`;
};

/**
 * 사용자 피드백 가이드 기반 고도화된 독서 기록 카드
 * - [v4.0] 모든 케이스(이미지 유/무)에 대해 '좌우 분할' 단일 레이아웃 적용
 * - 표준 너비: max-w-[960px]
 */
export function ShareNoteCard({ note, className, isPublicView = false, hideActions = false, showTimestamp = true, user }: ShareNoteCardProps) {
    // [데이터 매핑 수정] Supabase 쿼리 결과인 'books' 필드와 'book' 필드 모두를 지원하도록 정규화
    const book = note.book || (note as any).books;

    const { quote, memo } = parseNoteContentFields(note.content);
    const hasQuote = quote && quote.trim().length > 0;
    const hasMemo = memo && memo.trim().length > 0;
    const hasImage = !!note.image_url;
    const typeLabel = getNoteTypeLabel(note.type, hasImage);
    const formattedDate = formatDate(note.created_at);

    // 공통 푸터 (Habitree 로고)
    const FooterLogo = () => (
        <div className="flex items-center gap-2">
            <div className="w-9 h-9 bg-forest-600 dark:bg-forest-500 rounded-xl flex items-center justify-center shadow-lg shadow-forest-200 dark:shadow-forest-900/20 transition-transform hover:scale-110">
                <Trees className="w-5 h-5 text-white" />
            </div>
            <div className="flex flex-col -gap-1 text-left">
                <span className="text-sm font-black tracking-tight text-slate-900 dark:text-slate-100 leading-none">
                    Habitree
                </span>
                <span className="text-[9px] font-bold text-slate-400 uppercase tracking-tighter">Your Intelligence Forest</span>
            </div>
        </div>
    );

    return (
        <Card className={cn("overflow-hidden border-none shadow-2xl bg-white dark:bg-slate-950 w-full max-w-[960px] mx-auto", className)}>
            <CardContent className="p-0">
                <div className="flex flex-col md:flex-row min-h-[560px]">
                    {/* 좌측 섹션: 이미지 또는 책 표지 (폭 480px 고정) */}
                    <div className="w-full md:w-[480px] bg-slate-50 dark:bg-slate-900/50 p-6 md:p-10 flex flex-col border-b md:border-b-0 md:border-r border-slate-100 dark:border-slate-800">
                        {/* 상단: 책 정보 요약 (항상 표시) */}
                        <div className="flex items-start gap-4 md:gap-5 mb-6 md:mb-10">
                            <ImageLightbox src={book?.cover_image_url || "/placeholder-book.png"} alt={book?.title || "Book"}>
                                <div className="relative w-20 h-28 shrink-0 shadow-lg rounded-sm overflow-hidden border border-white dark:border-slate-700 bg-white">
                                    <Image
                                        src={book?.cover_image_url || "/placeholder-book.png"}
                                        alt={book?.title || "Book"}
                                        fill
                                        className="object-cover"
                                    />
                                </div>
                            </ImageLightbox>
                            <div className="flex-1 min-w-0 pt-0.5">
                                <h3 className="font-black text-lg text-slate-900 dark:text-slate-100 leading-[1.2] tracking-tighter break-keep">
                                    {book?.title || "제목 없음"}
                                </h3>
                                <p className="text-sm text-forest-600 font-bold mt-2">
                                    {book?.author || "저자 미상"}
                                </p>
                                {note.page_number && (
                                    <p className="text-[10px] text-slate-400 font-bold mt-3 flex items-center gap-1.5 uppercase tracking-widest">
                                        <BookOpen className="w-3 h-3 text-forest-400" />
                                        {note.page_number}P Record
                                    </p>
                                )}
                            </div>
                        </div>

                        {/* 메인 비주얼 영역: 사용자 이미지 또는 대형 책 표지 */}
                        <div className="flex-1 flex flex-col justify-center">
                            {hasImage ? (
                                <div className="flex flex-col h-full">
                                    <ImageLightbox src={note.image_url!} alt="Captured Moment">
                                        <div className="relative flex-1 min-h-[300px] rounded-2xl overflow-hidden shadow-inner bg-slate-100 dark:bg-slate-800 border-2 border-slate-200 dark:border-slate-700">
                                            <Image
                                                src={getImageUrl(note.image_url!)}
                                                alt="Captured Moment"
                                                fill
                                                className="object-contain p-2"
                                                priority
                                            />
                                            {showTimestamp && (
                                                <div className="absolute bottom-4 left-4 z-20">
                                                    <p className="text-[10px] font-bold text-slate-400/80 drop-shadow-sm bg-white/10 backdrop-blur-[2px] px-2 py-0.5 rounded-md">
                                                        {formatDateTime(note.created_at)}
                                                    </p>
                                                </div>
                                            )}
                                        </div>
                                    </ImageLightbox>
                                    <div className="mt-4 text-center">
                                        <p className="text-[10px] font-black tracking-[0.4em] text-slate-300 dark:text-slate-600 uppercase">
                                            Captured Moment
                                        </p>
                                    </div>
                                </div>
                            ) : (
                                <div className="flex flex-col items-center justify-center py-6">
                                    <ImageLightbox src={book?.cover_image_url || "/placeholder-book.png"} alt={book?.title || "Book"}>
                                        <div className="relative w-56 h-80 shadow-[0_30px_60px_-12px_rgba(0,0,0,0.3)] transition-transform duration-500 hover:scale-[1.03]">
                                            <Image
                                                src={book?.cover_image_url || "/placeholder-book.png"}
                                                alt={book?.title || "Book"}
                                                fill
                                                className="object-cover rounded-sm"
                                                priority
                                            />
                                            <div className="absolute inset-0 rounded-sm ring-1 ring-inset ring-black/10" />
                                        </div>
                                    </ImageLightbox>
                                    <div className="mt-8 text-center">
                                        <p className="text-[10px] font-black tracking-[0.4em] text-slate-300 dark:text-slate-600 uppercase">
                                            Original Book Cover
                                        </p>
                                    </div>
                                </div>
                            )}
                        </div>
                    </div>

                    {/* 우측 섹션: 기록 내용 */}
                    <div className="flex-1 p-6 md:p-14 flex flex-col relative bg-white dark:bg-slate-950">
                        <div className="absolute top-0 right-0 w-48 h-48 bg-slate-50 dark:bg-slate-900/80 rounded-bl-[120px] -z-0" />

                        <div className="relative z-10 flex-1 flex flex-col">
                            <div className="flex justify-between items-center mb-12">
                                <Badge variant="outline" className="px-4 py-1.5 text-[10px] font-black uppercase tracking-widest bg-white dark:bg-slate-900 border-slate-200 dark:border-slate-800 text-slate-500 shadow-sm">
                                    {typeLabel}
                                </Badge>
                                <div className="flex items-center gap-2 text-xs font-bold text-slate-400">
                                    <Calendar className="w-3.5 h-3.5 text-forest-500" />
                                    {formattedDate}
                                </div>
                            </div>

                            <div className="flex-1 flex flex-col justify-center space-y-8 md:space-y-12">
                                {hasQuote && (
                                    <div className="relative group/quote">
                                        <Quote className="absolute -top-5 -left-5 w-12 h-12 text-forest-50 dark:text-forest-900/20 -z-10 transition-colors group-hover/quote:text-forest-100" />
                                        <ExpandableText
                                            text={`"${quote}"`}
                                            className="text-xl md:text-2xl font-medium leading-relaxed text-slate-800 dark:text-slate-200 indent-4 tracking-tight italic"
                                            limit={hasImage ? 180 : 300} // 이미지가 없을 때 더 많은 텍스트 수용
                                            hideActions={hideActions}
                                        />
                                    </div>
                                )}

                                {hasMemo && (
                                    <div className="space-y-5">
                                        <div className="flex items-center gap-3">
                                            <div className="h-0.5 w-6 bg-forest-600" />
                                            <span className="text-[11px] font-black text-slate-400 uppercase tracking-widest">My Reflection</span>
                                        </div>
                                        <ExpandableText
                                            text={memo}
                                            className="text-base md:text-lg leading-relaxed text-slate-600 dark:text-slate-400 font-medium"
                                            limit={hasImage ? 200 : 400}
                                            hideActions={hideActions}
                                        />
                                    </div>
                                )}
                            </div>

                            <div className="mt-auto pt-10 space-y-4">
                                {/* Habitree 로고 먼저 표시 */}
                                <FooterLogo />
                                {/* 사용자 정보 표시 */}
                                {user && (
                                    <div className="flex items-center gap-3 text-sm">
                                        <span className="text-slate-400 font-medium">by</span>
                                        <Avatar className="h-8 w-8">
                                            <AvatarImage src={getImageUrl(user.avatar_url)} />
                                            <AvatarFallback className="bg-forest-100 text-forest-700 text-xs font-bold">
                                                {user.name[0]?.toUpperCase() || "U"}
                                            </AvatarFallback>
                                        </Avatar>
                                        <span className="font-semibold text-slate-700 dark:text-slate-300">
                                            {user.name}
                                        </span>
                                    </div>
                                )}
                            </div>
                        </div>
                    </div>
                </div>
            </CardContent>
        </Card>
    );
}
