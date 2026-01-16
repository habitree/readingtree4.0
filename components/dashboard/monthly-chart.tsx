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

interface MonthlyChartProps {
  data: Array<{ month: string; count: number }>;
}

/**
 * 월별 기록 통계 차트 컴포넌트
 * Recharts를 사용하여 막대 그래프 표시
 */
export function MonthlyChart({ data }: MonthlyChartProps) {
  // 빈 데이터 체크
  if (!data || data.length === 0) {
    console.warn("MonthlyChart: 데이터가 없습니다", data);
    return null;
  }

  const chartData = data.map((item) => {
    const [year, month] = item.month.split("-");
    const date = new Date(parseInt(year), parseInt(month) - 1, 1);
    return {
      month: format(date, "M월", { locale: ko }),
      count: item.count,
    };
  });

  // 모든 count가 0인 경우도 빈 데이터로 처리
  const hasData = chartData.some((item) => item.count > 0);
  if (!hasData) {
    console.warn("MonthlyChart: 모든 count가 0입니다", chartData);
    return null;
  }

  // 디버깅: 차트 데이터 로그
  if (process.env.NODE_ENV === 'development') {
    console.log("MonthlyChart 렌더링:", chartData);
  }

  return (
    <div className="w-full h-[300px]">
      <ResponsiveContainer width="100%" height="100%">
        <BarChart data={chartData} margin={{ top: 5, right: 30, left: 20, bottom: 5 }}>
          <CartesianGrid strokeDasharray="3 3" />
          <XAxis dataKey="month" />
          <YAxis />
          <Tooltip />
          <Bar dataKey="count" fill="hsl(var(--primary))" />
        </BarChart>
      </ResponsiveContainer>
    </div>
  );
}

