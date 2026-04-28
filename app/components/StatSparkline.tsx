"use client";

import { AreaChart, Area, ResponsiveContainer } from "recharts";

interface StatSparklineProps {
  data: number[];
  direction: "up" | "down";
}

export function StatSparkline({ data, direction }: StatSparklineProps) {
  const chartData = data.map((v) => ({ v }));
  const color = direction === "up" ? "#22c55e" : "#ef4444";

  return (
    <div className="w-16 h-9 shrink-0">
      <ResponsiveContainer width="100%" height="100%">
        <AreaChart data={chartData} margin={{ top: 2, right: 1, left: 1, bottom: 2 }}>
          <Area
            type="monotone"
            dataKey="v"
            stroke={color}
            strokeWidth={1.5}
            fill={color}
            fillOpacity={0.1}
            dot={false}
            isAnimationActive={false}
          />
        </AreaChart>
      </ResponsiveContainer>
    </div>
  );
}
