"use client";

import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  Tooltip,
  ResponsiveContainer,
  Cell,
} from "recharts";
import { useTheme } from "../../components/ThemeProvider";

const DATA = [
  { stage: "New Leads",    count: 31, color: "#021717" },
  { stage: "Contacted",   count: 18, color: "#8b5cf6" },
  { stage: "Qualified",   count: 11, color: "#06b6d4" },
  { stage: "Proposal",    count: 7,  color: "#10b981" },
  { stage: "Closed Won",  count: 4,  color: "#1D6161" },
];

const MAX = DATA[0].count;

interface TooltipItem {
  value: number;
  payload?: { stage: string; color: string };
}

interface CustomTooltipProps {
  active?: boolean;
  payload?: TooltipItem[];
  isDark: boolean;
}

function CustomTooltip({ active, payload, isDark }: CustomTooltipProps) {
  if (!active || !payload?.length) return null;
  const item = payload[0];
  const convRate = Math.round((item.value / MAX) * 100);
  return (
    <div
      className={`px-3 py-2 rounded-xl border shadow-xl text-sm ${
        isDark ? "bg-[#0d1117] border-white/10" : "bg-white border-slate-200"
      }`}
    >
      <p className={`font-semibold mb-0.5 ${isDark ? "text-slate-200" : "text-slate-700"}`}>
        {item.payload?.stage}
      </p>
      <div className={`text-xs ${isDark ? "text-slate-400" : "text-slate-500"}`}>
        <span className="font-bold text-base" style={{ color: item.payload?.color }}>
          {item.value}
        </span>{" "}
        leads · {convRate}% of pipeline
      </div>
    </div>
  );
}

export function LeadPipeline() {
  const { resolvedTheme } = useTheme();
  const isDark = resolvedTheme === "dark";
  const tickColor = isDark ? "#3f4f6a" : "#94a3b8";
  const convRate = Math.round((DATA[DATA.length - 1].count / DATA[0].count) * 100);

  return (
    <div className="bg-white dark:bg-[#1a2035] rounded-2xl border border-slate-200/60 dark:border-white/6 shadow-sm p-5 flex flex-col gap-4">
      <div className="flex items-start justify-between gap-2">
        <div>
          <h3 className="font-semibold text-slate-900 dark:text-white text-sm">CRM Pipeline</h3>
          <p className="text-xs text-slate-400 dark:text-slate-500 mt-0.5">
            Leads by funnel stage
          </p>
        </div>
        <div className="text-right shrink-0">
          <p className="text-[10px] text-slate-400 dark:text-slate-500 uppercase tracking-wider font-medium">
            Conversion
          </p>
          <p className="text-lg font-bold" style={{ color: "#021717" }}>{convRate}%</p>
        </div>
      </div>

      <ResponsiveContainer width="100%" height={160}>
        <BarChart
          data={DATA}
          layout="vertical"
          margin={{ top: 0, right: 28, left: 4, bottom: 0 }}
        >
          <XAxis
            type="number"
            tick={{ fill: tickColor, fontSize: 10 }}
            axisLine={false}
            tickLine={false}
          />
          <YAxis
            dataKey="stage"
            type="category"
            tick={{ fill: tickColor, fontSize: 10 }}
            axisLine={false}
            tickLine={false}
            width={68}
          />
          <Tooltip
            content={(props) => (
              <CustomTooltip
                active={props.active}
                payload={props.payload as unknown as TooltipItem[] | undefined}
                isDark={isDark}
              />
            )}
            cursor={{ fill: isDark ? "rgba(255,255,255,0.02)" : "rgba(0,0,0,0.02)" }}
          />
          <Bar dataKey="count" radius={[0, 4, 4, 0]} label={{ position: "right", fontSize: 10, fill: tickColor }}>
            {DATA.map((entry) => (
              <Cell key={entry.stage} fill={entry.color} />
            ))}
          </Bar>
        </BarChart>
      </ResponsiveContainer>

      {/* Conversion flow */}
      <div className="flex items-center gap-1 overflow-x-auto pb-0.5">
        {DATA.map((item, i) => (
          <div key={item.stage} className="flex items-center gap-1 shrink-0">
            <div className="flex flex-col items-center">
              <span
                className="w-6 h-6 rounded-full flex items-center justify-center text-[10px] font-bold text-white"
                style={{ background: item.color }}
              >
                {item.count}
              </span>
            </div>
            {i < DATA.length - 1 && (
              <span className="text-slate-300 dark:text-slate-600 text-xs">→</span>
            )}
          </div>
        ))}
      </div>
    </div>
  );
}
