"use client";

import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
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
 */
export function MonthlyChart({ data }: MonthlyChartProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const [containerWidth, setContainerWidth] = useState<number>(0);

  // 컨테이너 크기 측정
  useEffect(() => {
    const updateWidth = () => {
      if (containerRef.current) {
        const width = containerRef.current.offsetWidth;
        if (width > 0) {
          setContainerWidth(width);
        }
      }
    };

    updateWidth();
    window.addEventListener("resize", updateWidth);
    // 약간의 지연 후 다시 측정 (레이아웃 완료 후)
    const timeoutId = setTimeout(updateWidth, 100);

    return () => {
      window.removeEventListener("resize", updateWidth);
      clearTimeout(timeoutId);
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
  if (containerWidth === 0) {
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
          justifyContent: "center"
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
        position: "relative"
      }}
    >
      <ResponsiveContainer width="100%" height={300}>
        <BarChart data={chartData} margin={{ top: 5, right: 30, left: 20, bottom: 5 }}>
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
      </ResponsiveContainer>
    </div>
  );
}
