"use client";

import { AreaChart, Area, ResponsiveContainer } from "recharts";

const SPARK = [
  { v: 180 }, { v: 200 }, { v: 185 }, { v: 220 },
  { v: 210 }, { v: 240 }, { v: 230 }, { v: 260 },
  { v: 245 }, { v: 280 },
];

export function HeroStatCard() {
  return (
    <div
      className="relative overflow-hidden rounded-2xl p-5 flex flex-col justify-between"
      style={{
        background: "linear-gradient(135deg, #1a1a3a 0%, #0f0f22 100%)",
        minHeight: "160px",
      }}
    >
      <div className="relative z-10">
        <p className="text-[10px] font-semibold tracking-widest text-slate-400 uppercase">
          Total Sessions
        </p>
        <p className="text-4xl font-bold text-white mt-1 leading-none">2.4k+</p>
        <span className="mt-2 inline-flex items-center gap-0.5 text-xs font-semibold text-emerald-400 bg-emerald-400/15 rounded-full px-2 py-0.5">
          ↑ 5.1%
        </span>
      </div>

      {/* Embedded area chart at the bottom */}
      <div className="absolute bottom-0 left-0 right-0 h-20 pointer-events-none">
        <ResponsiveContainer width="100%" height="100%">
          <AreaChart data={SPARK} margin={{ top: 0, right: 0, left: 0, bottom: 0 }}>
            <defs>
              <linearGradient id="heroGrad" x1="0" y1="0" x2="0" y2="1">
                <stop offset="0%" stopColor="#7c3aed" stopOpacity={0.5} />
                <stop offset="100%" stopColor="#7c3aed" stopOpacity={0} />
              </linearGradient>
            </defs>
            <Area
              type="monotone"
              dataKey="v"
              stroke="#8b5cf6"
              strokeWidth={2}
              fill="url(#heroGrad)"
              dot={false}
              isAnimationActive={false}
            />
          </AreaChart>
        </ResponsiveContainer>
      </div>
    </div>
  );
}
