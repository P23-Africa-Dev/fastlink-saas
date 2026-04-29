"use client";

import { AreaChart, Area, ResponsiveContainer } from "recharts";

interface CircularProgressProps {
  progress: number;
  color: string;
  size?: number;
}

function CircularProgress({ progress, color, size = 52 }: CircularProgressProps) {
  const strokeWidth = 5;
  const radius = (size - strokeWidth) / 2;
  const circumference = 2 * Math.PI * radius;
  const offset = circumference * (1 - progress / 100);

  return (
    <svg width={size} height={size} style={{ transform: "rotate(-90deg)" }}>
      <circle cx={size / 2} cy={size / 2} r={radius} fill="none" stroke="#f3f4f6" strokeWidth={strokeWidth} />
      <circle
        cx={size / 2} cy={size / 2} r={radius}
        fill="none" stroke={color} strokeWidth={strokeWidth}
        strokeDasharray={circumference} strokeDashoffset={offset}
        strokeLinecap="round"
      />
      {/* Percentage label — rotated back upright */}
      <text
        x={size / 2} y={size / 2}
        textAnchor="middle" dominantBaseline="central"
        style={{ transform: `rotate(90deg)`, transformOrigin: `${size / 2}px ${size / 2}px` }}
        fontSize="9" fontWeight="700" fill={color}
      >
        {progress}%
      </text>
    </svg>
  );
}

const TREND_SPARK = [
  { v: 20 }, { v: 25 }, { v: 22 }, { v: 30 },
  { v: 28 }, { v: 35 }, { v: 38 },
];

const STATS = [
  {
    label: "Online Visitors",
    sub: "Max 878",
    progress: 30,
    color: "#0d9488",
    value: "320",
    type: "circle" as const,
  },
  {
    label: "Online Visitors",
    sub: "Max 878",
    progress: 87,
    color: "#7c3aed",
    value: "320",
    type: "circle" as const,
  },
  {
    label: "Average Revenue",
    sub: "+21%",
    color: "#10b981",
    value: "3.1k+",
    type: "trend" as const,
  },
];

export function PipelineStats() {
  return (
    <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-5 flex flex-col">
      <div className="flex items-center justify-between mb-4">
        <h3 className="font-semibold text-gray-900 text-sm">Statistics</h3>
        <button className="text-gray-300 hover:text-gray-500 transition-colors">
          <svg width="16" height="4" viewBox="0 0 20 4" fill="currentColor">
            <circle cx="2" cy="2" r="2" />
            <circle cx="10" cy="2" r="2" />
            <circle cx="18" cy="2" r="2" />
          </svg>
        </button>
      </div>

      <div className="flex flex-col divide-y divide-gray-50">
        {STATS.map((stat, i) => (
          <div key={i} className="flex items-center justify-between py-3.5 gap-3">
            {/* Left: label + sub */}
            <div className="flex-1 min-w-0">
              <p className="text-xs font-semibold text-gray-700 truncate">{stat.label}</p>
              <p
                className="text-[10px] mt-0.5 font-medium"
                style={{ color: stat.type === "trend" ? stat.color : "#9ca3af" }}
              >
                {stat.sub}
              </p>
            </div>

            {/* Center: circle progress or sparkline */}
            {stat.type === "circle" ? (
              <CircularProgress progress={stat.progress} color={stat.color} />
            ) : (
              <div className="w-14 h-9 shrink-0">
                <ResponsiveContainer width="100%" height="100%">
                  <AreaChart data={TREND_SPARK} margin={{ top: 2, right: 1, left: 1, bottom: 2 }}>
                    <defs>
                      <linearGradient id="revGrad" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="0%" stopColor="#10b981" stopOpacity={0.3} />
                        <stop offset="100%" stopColor="#10b981" stopOpacity={0} />
                      </linearGradient>
                    </defs>
                    <Area
                      type="monotone" dataKey="v"
                      stroke="#10b981" strokeWidth={1.5}
                      fill="url(#revGrad)"
                      dot={false} isAnimationActive={false}
                    />
                  </AreaChart>
                </ResponsiveContainer>
              </div>
            )}

            {/* Right: value */}
            <p className="text-xl font-bold text-gray-900 shrink-0 w-14 text-right">
              {stat.value}
            </p>
          </div>
        ))}
      </div>
    </div>
  );
}
