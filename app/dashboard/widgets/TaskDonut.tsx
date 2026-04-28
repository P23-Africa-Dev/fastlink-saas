"use client";

import { PieChart, Pie, Cell, ResponsiveContainer, Tooltip } from "recharts";
import { useTheme } from "../../components/ThemeProvider";

const DATA = [
  { name: "Completed", value: 18, color: "#22c55e" },
  { name: "In Progress", value: 8,  color: "#6366f1" },
  { name: "Pending",     value: 12, color: "#f59e0b" },
  { name: "Overdue",     value: 3,  color: "#ef4444" },
];

const TOTAL = DATA.reduce((s, d) => s + d.value, 0);

interface TooltipItem {
  name: string;
  value: number;
  payload?: { color: string };
}

interface CustomTooltipProps {
  active?: boolean;
  payload?: TooltipItem[];
  isDark: boolean;
}

function CustomTooltip({ active, payload, isDark }: CustomTooltipProps) {
  if (!active || !payload?.length) return null;
  const item = payload[0];
  const pct = Math.round((item.value / TOTAL) * 100);
  return (
    <div
      className={`px-3 py-2 rounded-xl border shadow-xl text-sm ${
        isDark ? "bg-[#0d1117] border-white/10" : "bg-white border-slate-200"
      }`}
    >
      <div className="flex items-center gap-2">
        <span
          className="w-2.5 h-2.5 rounded-full shrink-0"
          style={{ background: item.payload?.color }}
        />
        <span className={`font-medium ${isDark ? "text-slate-200" : "text-slate-700"}`}>
          {item.name}
        </span>
      </div>
      <div className={`mt-1 text-xs ${isDark ? "text-slate-400" : "text-slate-500"}`}>
        <span className="font-bold text-sm" style={{ color: item.payload?.color }}>
          {item.value}
        </span>{" "}
        tasks · {pct}%
      </div>
    </div>
  );
}

export function TaskDonut() {
  const { resolvedTheme } = useTheme();
  const isDark = resolvedTheme === "dark";

  return (
    <div className="bg-white dark:bg-[#1a2035] rounded-2xl border border-slate-200/60 dark:border-white/6 shadow-sm p-5 flex flex-col">
      <div>
        <h3 className="font-semibold text-slate-900 dark:text-white text-sm">Task Breakdown</h3>
        <p className="text-xs text-slate-400 dark:text-slate-500 mt-0.5">
          Status distribution across all projects
        </p>
      </div>

      {/* Donut chart with center stat */}
      <div className="relative flex items-center justify-center my-2">
        <ResponsiveContainer width="100%" height={180}>
          <PieChart>
            <Pie
              data={DATA}
              cx="50%"
              cy="50%"
              innerRadius={55}
              outerRadius={80}
              paddingAngle={3}
              dataKey="value"
              strokeWidth={0}
            >
              {DATA.map((entry) => (
                <Cell key={entry.name} fill={entry.color} />
              ))}
            </Pie>
            <Tooltip
              content={(props) => (
                <CustomTooltip
                  active={props.active}
                  payload={props.payload as unknown as TooltipItem[] | undefined}
                  isDark={isDark}
                />
              )}
            />
          </PieChart>
        </ResponsiveContainer>

        {/* Center overlay */}
        <div className="absolute inset-0 flex flex-col items-center justify-center pointer-events-none">
          <span className="text-3xl font-bold text-slate-900 dark:text-white leading-none">
            {TOTAL}
          </span>
          <span className="text-[10px] text-slate-400 dark:text-slate-500 font-medium tracking-wider uppercase mt-0.5">
            Total
          </span>
        </div>
      </div>

      {/* Legend */}
      <div className="grid grid-cols-2 gap-x-4 gap-y-2.5 mt-1">
        {DATA.map((item) => {
          const pct = Math.round((item.value / TOTAL) * 100);
          return (
            <div key={item.name} className="flex items-center gap-2 min-w-0">
              <span
                className="w-2.5 h-2.5 rounded-full shrink-0"
                style={{ background: item.color }}
              />
              <div className="min-w-0 flex-1">
                <div className="flex items-baseline justify-between gap-1">
                  <span className="text-xs text-slate-600 dark:text-slate-400 truncate">
                    {item.name}
                  </span>
                  <span className="text-xs font-bold text-slate-900 dark:text-white shrink-0">
                    {item.value}
                  </span>
                </div>
                {/* Mini bar */}
                <div className="mt-0.5 h-1 bg-slate-100 dark:bg-white/5 rounded-full overflow-hidden">
                  <div
                    className="h-full rounded-full"
                    style={{ width: `${pct}%`, background: item.color }}
                  />
                </div>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
