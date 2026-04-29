"use client";

import {
  RadarChart,
  Radar,
  PolarGrid,
  PolarAngleAxis,
  ResponsiveContainer,
} from "recharts";

// Axes match the screenshot exactly: Explorer, Firefox, Safari, Chrome
const DATA = [
  { subject: "Explorer", value: 72 },
  { subject: "Firefox",  value: 48 },
  { subject: "Safari",   value: 65 },
  { subject: "Chrome",   value: 80 },
];

export function TaskBreakdownRadar() {
  return (
    <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-5 flex flex-col">
      <div className="flex items-center justify-between mb-1">
        <h3 className="font-semibold text-gray-900 text-sm">Views by Browser</h3>
        <button className="text-gray-300 hover:text-gray-500 transition-colors">
          <svg width="16" height="4" viewBox="0 0 20 4" fill="currentColor">
            <circle cx="2" cy="2" r="2" />
            <circle cx="10" cy="2" r="2" />
            <circle cx="18" cy="2" r="2" />
          </svg>
        </button>
      </div>

      <div className="flex-1">
        <ResponsiveContainer width="100%" height={230}>
          <RadarChart data={DATA} margin={{ top: 10, right: 30, left: 30, bottom: 10 }}>
            <PolarGrid stroke="#e5e7eb" />
            <PolarAngleAxis
              dataKey="subject"
              tick={{ fill: "#6b7280", fontSize: 11, fontWeight: 500 }}
            />
            <Radar
              name="Views"
              dataKey="value"
              stroke="#8b5cf6"
              strokeWidth={2}
              fill="#a78bfa"
              fillOpacity={0.3}
              dot={false}
            />
          </RadarChart>
        </ResponsiveContainer>
      </div>
    </div>
  );
}
