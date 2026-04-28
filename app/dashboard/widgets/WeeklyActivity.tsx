"use client";

import {
  ComposedChart,
  Bar,
  Cell,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
} from "recharts";

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

const GRID_COLOR = "rgba(255,255,255,0.06)";
const TICK_COLOR = "#f6f6f6";
const BAR_ODD    = "#1D6161";
const BAR_EVEN   = "#D4CA5C";

interface TooltipPayloadItem {
  name: string;
  value: number;
  color: string;
}

interface CustomTooltipProps {
  active?: boolean;
  payload?: TooltipPayloadItem[];
  label?: string;
}

function CustomTooltip({ active, payload, label }: CustomTooltipProps) {
  if (!active || !payload?.length) return null;
  return (
    <div className="px-3 py-2.5 rounded-xl border border-white/10 shadow-xl text-sm bg-[#021717]">
      <p className="text-xs font-semibold mb-1.5" style={{ color: "#f6f6f6" }}>
        {label}
      </p>
      {payload.map((entry) => (
        <div key={entry.name} className="flex items-center gap-2 py-0.5">
          <span className="w-2 h-2 rounded-full shrink-0" style={{ background: entry.color }} />
          <span className="text-xs" style={{ color: "#f6f6f6" }}>{entry.name}:</span>
          <span className="text-xs font-bold ml-auto pl-3" style={{ color: "#f8f8f8" }}>{entry.value}</span>
        </div>
      ))}
    </div>
  );
}

export function WeeklyActivity() {
  const totalCreated   = DATA.reduce((s, d) => s + d.created, 0);
  const totalCompleted = DATA.reduce((s, d) => s + d.completed, 0);
  const rate = Math.round((totalCompleted / totalCreated) * 100);

  return (
    <div className="bg-[#021717] rounded-2xl border border-white/10 shadow-sm p-5 flex flex-col gap-4">
      {/* Header */}
      <div className="flex items-start justify-between gap-4">
        <div>
          <h3 className="font-semibold text-sm" style={{ color: "#f8f8f8" }}>
            Weekly Task Activity
          </h3>
          <p className="text-xs mt-0.5" style={{ color: "#f6f6f6" }}>
            12-week throughput overview
          </p>
        </div>
        <div className="flex items-center gap-4 shrink-0">
          <div className="text-right">
            <p className="text-[10px] uppercase tracking-wider font-medium" style={{ color: "#f6f6f6" }}>
              Completion rate
            </p>
            <p className="text-lg font-bold text-emerald-500">{rate}%</p>
          </div>
        </div>
      </div>

      {/* Legend */}
      <div className="flex items-center gap-5">
        <div className="flex items-center gap-1.5">
          <span className="w-3 h-3 rounded" style={{ background: BAR_ODD }} />
          <span className="text-xs" style={{ color: "#f6f6f6" }}>Odd weeks</span>
        </div>
        <div className="flex items-center gap-1.5">
          <span className="w-3 h-3 rounded" style={{ background: BAR_EVEN }} />
          <span className="text-xs" style={{ color: "#f6f6f6" }}>Even weeks</span>
        </div>
        <div className="flex items-center gap-1.5">
          <span className="w-5 h-0.5 bg-[#f6f6f6] rounded-full" />
          <span className="text-xs" style={{ color: "#f6f6f6" }}>Completed</span>
        </div>
      </div>

      {/* Chart */}
      <ResponsiveContainer width="100%" height={200}>
        <ComposedChart data={DATA} margin={{ top: 4, right: 4, left: -22, bottom: 0 }}>
          <CartesianGrid strokeDasharray="3 3" stroke={GRID_COLOR} vertical={false} />
          <XAxis
            dataKey="week"
            tick={{ fill: TICK_COLOR, fontSize: 10 }}
            axisLine={false}
            tickLine={false}
          />
          <YAxis
            tick={{ fill: TICK_COLOR, fontSize: 10 }}
            axisLine={false}
            tickLine={false}
          />
          <Tooltip
            content={(props) => (
              <CustomTooltip
                active={props.active}
                payload={props.payload as unknown as TooltipPayloadItem[] | undefined}
                label={props.label as string | undefined}
              />
            )}
            cursor={{ fill: "rgba(255,255,255,0.04)" }}
          />
          <Bar dataKey="created" name="Created" radius={[4, 4, 0, 0]}>
            {DATA.map((_, i) => (
              <Cell key={i} fill={i % 2 === 0 ? BAR_ODD : BAR_EVEN} />
            ))}
          </Bar>
          <Line
            dataKey="completed"
            name="Completed"
            stroke="#f6f6f6"
            strokeWidth={2.5}
            dot={{ fill: "#f6f6f6", r: 3, strokeWidth: 0 }}
            activeDot={{ r: 5, strokeWidth: 0 }}
          />
        </ComposedChart>
      </ResponsiveContainer>
    </div>
  );
}
