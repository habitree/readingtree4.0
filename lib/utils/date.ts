import { format, formatDistanceToNow, formatRelative, isToday, isYesterday } from "date-fns";
import { ko } from "date-fns/locale";

/**
 * 날짜를 포맷팅하는 유틸리티 함수들
 */

/**
 * 상대 시간 표시 (예: "3시간 전", "2일 전")
 */
export function formatRelativeTime(date: Date | string): string {
  const dateObj = typeof date === "string" ? new Date(date) : date;
  return formatDistanceToNow(dateObj, { addSuffix: true, locale: ko });
}

/**
 * 날짜를 "YYYY년 MM월 DD일" 형식으로 포맷
 */
export function formatDate(date: Date | string): string {
  const dateObj = typeof date === "string" ? new Date(date) : date;
  return format(dateObj, "yyyy년 MM월 dd일", { locale: ko });
}

/**
 * 날짜를 "YYYY-MM-DD" 형식으로 포맷
 */
export function formatDateISO(date: Date | string): string {
  const dateObj = typeof date === "string" ? new Date(date) : date;
  return format(dateObj, "yyyy-MM-dd");
}

/**
 * 날짜와 시간을 "YYYY년 MM월 DD일 HH:mm" 형식으로 포맷
 */
export function formatDateTime(date: Date | string): string {
  const dateObj = typeof date === "string" ? new Date(date) : date;
  return format(dateObj, "yyyy년 MM월 dd일 HH:mm", { locale: ko });
}

/**
 * 스마트 날짜 포맷 (오늘/어제는 상대 시간, 그 외는 날짜)
 */
export function formatSmartDate(date: Date | string): string {
  const dateObj = typeof date === "string" ? new Date(date) : date;

  if (isToday(dateObj)) {
    return format(dateObj, "HH:mm", { locale: ko });
  }

  if (isYesterday(dateObj)) {
    return `어제 ${format(dateObj, "HH:mm", { locale: ko })}`;
  }

  // 일주일 이내는 상대 시간
  const daysDiff = Math.floor(
    (new Date().getTime() - dateObj.getTime()) / (1000 * 60 * 60 * 24)
  );

  if (daysDiff < 7) {
    return formatRelative(dateObj, new Date(), { locale: ko });
  }

  // 그 외는 날짜
  return formatDate(dateObj);
}

/**
 * 월별 그룹 키 생성 (예: "2024년 12월")
 */
export function getMonthKey(date: Date | string): string {
  const dateObj = typeof date === "string" ? new Date(date) : date;
  return format(dateObj, "yyyy년 MM월", { locale: ko });
}

/**
 * 날짜를 "yyyy - MM - dd" 형식으로 포맷 (완독일용)
 */
export function formatDateWithDashes(date: Date | string): string {
  const dateObj = typeof date === "string" ? new Date(date) : date;
  return format(dateObj, "yyyy - MM - dd");
}
