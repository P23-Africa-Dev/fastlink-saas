"use client";

import {
  ComposedChart,
  Bar,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
} from "recharts";
import { useTheme } from "../../components/ThemeProvider";

const DATA = [
  { week: "Wk 1",  created: 8,  completed: 5  },
  { week: "Wk 2",  created: 12, completed: 9  },
  { week: "Wk 3",  created: 7,  completed: 11 },
  { week: "Wk 4",  created: 15, completed: 8  },
  { week: "Wk 5",  created: 10, completed: 13 },
  { week: "Wk 6",  created: 18, completed: 14 },
  { week: "Wk 7",  created: 14, completed: 16 },
  { week: "Wk 8",  created: 9,  completed: 14 },
  { week: "Wk 9",  created: 22, completed: 18 },
  { week: "Wk 10", created: 16, completed: 20 },
  { week: "Wk 11", created: 13, completed: 15 },
  { week: "Wk 12", created: 19, completed: 17 },
];

interface TooltipPayloadItem {
  name: string;
  value: number;
  color: string;
}

interface CustomTooltipProps {
  active?: boolean;
  payload?: TooltipPayloadItem[];
  label?: string;
  isDark: boolean;
}

function CustomTooltip({ active, payload, label, isDark }: CustomTooltipProps) {
  if (!active || !payload?.length) return null;
  return (
    <div
      className={`px-3 py-2.5 rounded-xl border shadow-xl text-sm ${
        isDark
          ? "bg-[#0d1117] border-white/10 text-slate-200"
          : "bg-white border-slate-200 text-slate-700"
      }`}
    >
      <p className={`text-xs font-semibold mb-1.5 ${isDark ? "text-slate-400" : "text-slate-500"}`}>
        {label}
      </p>
      {payload.map((entry) => (
        <div key={entry.name} className="flex items-center gap-2 py-0.5">
          <span className="w-2 h-2 rounded-full shrink-0" style={{ background: entry.color }} />
          <span className={`text-xs ${isDark ? "text-slate-400" : "text-slate-500"}`}>
            {entry.name}:
          </span>
          <span className="text-xs font-bold ml-auto pl-3">{entry.value}</span>
        </div>
      ))}
    </div>
  );
}

export function WeeklyActivity() {
  const { resolvedTheme } = useTheme();
  const isDark = resolvedTheme === "dark";

  const gridColor = isDark ? "rgba(255,255,255,0.04)" : "rgba(0,0,0,0.05)";
  const tickColor = isDark ? "#3f4f6a" : "#94a3b8";
  const barFill = isDark ? "rgba(99,102,241,0.18)" : "rgba(99,102,241,0.12)";
  const barStroke = isDark ? "rgba(99,102,241,0.45)" : "rgba(99,102,241,0.35)";

  const totalCreated = DATA.reduce((s, d) => s + d.created, 0);
  const totalCompleted = DATA.reduce((s, d) => s + d.completed, 0);
  const rate = Math.round((totalCompleted / totalCreated) * 100);

  return (
    <div className="bg-white dark:bg-[#1a2035] rounded-2xl border border-slate-200/60 dark:border-white/6 shadow-sm p-5 flex flex-col gap-4">
      {/* Header */}
      <div className="flex items-start justify-between gap-4">
        <div>
          <h3 className="font-semibold text-slate-900 dark:text-white text-sm">
            Weekly Task Activity
          </h3>
          <p className="text-xs text-slate-400 dark:text-slate-500 mt-0.5">
            12-week throughput overview
          </p>
        </div>
        <div className="flex items-center gap-4 shrink-0">
          <div className="text-right">
            <p className="text-[10px] text-slate-400 dark:text-slate-500 uppercase tracking-wider font-medium">
              Completion rate
            </p>
            <p className="text-lg font-bold text-emerald-500">{rate}%</p>
          </div>
        </div>
      </div>

      {/* Legend */}
      <div className="flex items-center gap-5">
        <div className="flex items-center gap-1.5">
          <span
            className="w-3 h-3 rounded"
            style={{ background: barFill, border: `1px solid ${barStroke}` }}
          />
          <span className="text-xs text-slate-500 dark:text-slate-400">Created</span>
        </div>
        <div className="flex items-center gap-1.5">
          <span className="w-5 h-0.5 bg-indigo-500 rounded-full" />
          <span className="text-xs text-slate-500 dark:text-slate-400">Completed</span>
        </div>
      </div>

      {/* Chart */}
      <ResponsiveContainer width="100%" height={200}>
        <ComposedChart data={DATA} margin={{ top: 4, right: 4, left: -22, bottom: 0 }}>
          <CartesianGrid
            strokeDasharray="3 3"
            stroke={gridColor}
            vertical={false}
          />
          <XAxis
            dataKey="week"
            tick={{ fill: tickColor, fontSize: 10 }}
            axisLine={false}
            tickLine={false}
          />
          <YAxis
            tick={{ fill: tickColor, fontSize: 10 }}
            axisLine={false}
            tickLine={false}
          />
          <Tooltip
            content={(props) => (
              <CustomTooltip
                active={props.active}
                payload={props.payload as unknown as TooltipPayloadItem[] | undefined}
                label={props.label as string | undefined}
                isDark={isDark}
              />
            )}
            cursor={{ fill: isDark ? "rgba(255,255,255,0.02)" : "rgba(0,0,0,0.02)" }}
          />
          <Bar
            dataKey="created"
            name="Created"
            fill={barFill}
            stroke={barStroke}
            strokeWidth={1}
            radius={[4, 4, 0, 0]}
          />
          <Line
            dataKey="completed"
            name="Completed"
            stroke="#6366f1"
            strokeWidth={2.5}
            dot={{ fill: "#6366f1", r: 3, strokeWidth: 0 }}
            activeDot={{ r: 5, strokeWidth: 0 }}
          />
        </ComposedChart>
      </ResponsiveContainer>
    </div>
  );
}
