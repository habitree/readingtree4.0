"use client";

import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
} from "recharts";
import { format } from "date-fns";
import { ko } from "date-fns/locale";
import { useEffect, useRef, useState } from "react";

interface MonthlyChartProps {
  data: Array<{ month: string; count: number }>;
}

/**
 * 월별 기록 통계 차트 컴포넌트
 * Recharts를 사용하여 막대 그래프 표시
 * ResponsiveContainer 대신 직접 크기 계산 사용 (wrapper width 0px 문제 해결)
 */
export function MonthlyChart({ data }: MonthlyChartProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const [dimensions, setDimensions] = useState<{ width: number; height: number }>({
    width: 0,
    height: 300,
  });

  // 컨테이너 크기 측정 (ResizeObserver 사용)
  useEffect(() => {
    const updateDimensions = () => {
      if (containerRef.current) {
        const rect = containerRef.current.getBoundingClientRect();
        if (rect.width > 0) {
          setDimensions({
            width: rect.width,
            height: 300,
          });
        }
      }
    };

    // 초기 측정
    updateDimensions();

    // ResizeObserver 사용 (더 정확한 크기 감지)
    const resizeObserver = new ResizeObserver((entries) => {
      for (const entry of entries) {
        const { width } = entry.contentRect;
        if (width > 0) {
          setDimensions({
            width,
            height: 300,
          });
        }
      }
    });

    if (containerRef.current) {
      resizeObserver.observe(containerRef.current);
    }

    // 윈도우 리사이즈 이벤트도 함께 처리
    window.addEventListener("resize", updateDimensions);

    // 약간의 지연 후 다시 측정 (레이아웃 완료 후)
    const timeoutId = setTimeout(updateDimensions, 100);
    const timeoutId2 = setTimeout(updateDimensions, 500);

    return () => {
      resizeObserver.disconnect();
      window.removeEventListener("resize", updateDimensions);
      clearTimeout(timeoutId);
      clearTimeout(timeoutId2);
    };
  }, []);

  // 빈 데이터 체크
  if (!data || data.length === 0) {
    return null;
  }

  // 데이터 변환: "YYYY-MM" 형식을 "M월" 형식으로 변환
  const chartData = data.map((item) => {
    try {
      const [year, month] = item.month.split("-");
      const date = new Date(parseInt(year), parseInt(month) - 1, 1);
      return {
        month: format(date, "M월", { locale: ko }),
        count: item.count || 0,
      };
    } catch (error) {
      console.error("[MonthlyChart] 날짜 변환 오류:", item, error);
      return {
        month: item.month,
        count: item.count || 0,
      };
    }
  });

  // 모든 count가 0인 경우 체크
  const hasData = chartData.some((item) => item.count > 0);
  if (!hasData) {
    return null;
  }

  // 컨테이너 크기가 측정되지 않았으면 로딩 표시
  if (dimensions.width === 0) {
    return (
      <div
        ref={containerRef}
        className="w-full"
        style={{
          height: "300px",
          minHeight: "300px",
          position: "relative",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
        }}
      >
        <div className="text-sm text-muted-foreground">차트를 불러오는 중...</div>
      </div>
    );
  }

  return (
    <div
      ref={containerRef}
      className="w-full"
      style={{
        height: "300px",
        minHeight: "300px",
        position: "relative",
      }}
    >
      <BarChart
        width={dimensions.width}
        height={dimensions.height}
        data={chartData}
        margin={{ top: 5, right: 30, left: 20, bottom: 5 }}
      >
        <CartesianGrid strokeDasharray="3 3" />
        <XAxis
          dataKey="month"
          tick={{ fill: "hsl(var(--muted-foreground))", fontSize: 12 }}
        />
        <YAxis tick={{ fill: "hsl(var(--muted-foreground))", fontSize: 12 }} />
        <Tooltip
          contentStyle={{
            backgroundColor: "hsl(var(--background))",
            border: "1px solid hsl(var(--border))",
            borderRadius: "6px",
          }}
        />
        <Bar
          dataKey="count"
          fill="hsl(var(--primary))"
          radius={[4, 4, 0, 0]}
        />
      </BarChart>
    </div>
  );
}
