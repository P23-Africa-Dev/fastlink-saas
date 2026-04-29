"use client";

import {
  AreaChart,
  Area,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  ReferenceArea,
} from "recharts";

const DATA = [
  { date: "28 Ma", tasks: 85 },
  { date: "29 Ma", tasks: 120 },
  { date: "30 Ma", tasks: 180 },
  { date: "31 Ma", tasks: 165 },
  { date: "01 Ap", tasks: 255 },
  { date: "02 Ap", tasks: 170 },
  { date: "03 Ap", tasks: 200 },
  { date: "04 Ap", tasks: 185 },
  { date: "05 Ap", tasks: 215 },
  { date: "06 Ap", tasks: 195 },
];

interface TooltipProps {
  active?: boolean;
  payload?: { value: number }[];
  label?: string;
}

function CustomTooltip({ active, payload, label }: TooltipProps) {
  if (!active || !payload?.length) return null;
  return (
    <div className="bg-white border border-gray-100 rounded-xl shadow-lg px-3 py-2 text-xs">
      <p className="font-semibold text-gray-600 mb-0.5">{label}</p>
      <p className="text-violet-600 font-bold">{payload[0].value}</p>
    </div>
  );
}

export function TaskActivityChart() {
  return (
    <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-5">
      {/* Header */}
      <div className="flex items-center justify-between gap-4 mb-5">
        <h3 className="font-semibold text-gray-900 text-sm">Sessions Overview</h3>
        <div className="flex items-center gap-2">
          <button className="flex items-center gap-1.5 text-xs font-medium text-gray-600 border border-gray-200 rounded-lg px-3 py-1.5 hover:bg-gray-50 transition-colors">
            Last 10 days
            <svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
              <polyline points="6 9 12 15 18 9" />
            </svg>
          </button>
          <button className="flex items-center gap-1.5 text-xs font-semibold text-white bg-gray-900 rounded-lg px-3 py-1.5 hover:bg-gray-800 transition-colors">
            <svg width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
              <path d="M21 15v4a2 2 0 01-2 2H5a2 2 0 01-2-2v-4" />
              <polyline points="7 10 12 15 17 10" />
              <line x1="12" y1="15" x2="12" y2="3" />
            </svg>
            Download CSV
          </button>
        </div>
      </div>

      {/* Chart */}
      <ResponsiveContainer width="100%" height={220}>
        <AreaChart data={DATA} margin={{ top: 24, right: 10, left: -20, bottom: 0 }}>
          <defs>
            <linearGradient id="sessionGrad" x1="0" y1="0" x2="0" y2="1">
              <stop offset="0%" stopColor="#7c3aed" stopOpacity={0.2} />
              <stop offset="100%" stopColor="#7c3aed" stopOpacity={0} />
            </linearGradient>
          </defs>
          <CartesianGrid strokeDasharray="3 3" stroke="#f3f4f6" vertical={false} />
          <XAxis
            dataKey="date"
            tick={{ fill: "#9ca3af", fontSize: 10 }}
            axisLine={false}
            tickLine={false}
          />
          <YAxis
            domain={[0, 300]}
            ticks={[0, 100, 200, 300]}
            tick={{ fill: "#9ca3af", fontSize: 10 }}
            axisLine={false}
            tickLine={false}
          />
          <Tooltip content={<CustomTooltip />} />
          {/* Spike highlight at 01 Ap */}
          <ReferenceArea
            x1="31 Ma"
            x2="01 Ap"
            fill="#8b5cf6"
            fillOpacity={0.12}
            label={{
              value: "↑17%",
              position: "insideTopRight",
              fill: "#7c3aed",
              fontSize: 11,
              fontWeight: 700,
            }}
          />
          <Area
            type="monotone"
            dataKey="tasks"
            stroke="#7c3aed"
            strokeWidth={2.5}
            fill="url(#sessionGrad)"
            dot={false}
            activeDot={{ r: 5, fill: "#7c3aed", strokeWidth: 0 }}
          />
        </AreaChart>
      </ResponsiveContainer>
    </div>
  );
}
