"use client";

import React from "react";
import { CheckCircle2, XCircle, Clock, Timer } from "lucide-react";
import { SummaryStats } from "./types";

interface SummaryStripProps {
  stats: SummaryStats;
}

interface StatCardProps {
  icon:    React.ReactNode;
  label:   string;
  value:   string;
  iconBg:  string;
  iconColor: string;
  accent:  string;
}

function SparklineGraph({ color, points }: { color: string, points: number[] }) {
  const max = Math.max(...points);
  const min = Math.min(...points);
  const range = max - min || 1;
  const width = 100;
  const height = 40;
  
  const mappedPoints = points.map((p, i) => ({
    x: (i / (points.length - 1)) * width,
    y: height - ((p - min) / range) * (height - 10) - 5
  }));

  const pathData = `M ${mappedPoints[0].x} ${mappedPoints[0].y} ` + 
    mappedPoints.slice(1).map(p => `L ${p.x} ${p.y}`).join(' ');
  
  const areaData = `${pathData} L ${width} ${height} L 0 ${height} Z`;

  return (
    <div className="w-24 h-12 relative overflow-hidden shrink-0">
      <svg viewBox={`0 0 ${width} ${height}`} className="w-full h-full preserve-3d">
        <defs>
          <linearGradient id={`grad-${color}`} x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stopColor={color} stopOpacity="0.2" />
            <stop offset="100%" stopColor={color} stopOpacity="0" />
          </linearGradient>
        </defs>
        <path d={areaData} fill={`url(#grad-${color})`} />
        <path d={pathData} fill="none" stroke={color} strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" className="drop-shadow-sm" />
      </svg>
    </div>
  );
}

function StatCard({ icon, label, value, iconBg, iconColor, accent, points }: StatCardProps & { points: number[] }) {
  return (
    <div 
      className="flex-1 bg-white rounded-3xl border border-[#f0f0f5] flex items-center justify-between transition-all duration-300 ease-out hover:-translate-y-1.5 hover:shadow-[0_20px_50px_rgba(0,0,0,0.12)] group"
      style={{ padding: "18px 24px", gap: "20px", minWidth: "220px" }}
    >
      <div className="flex items-center" style={{ gap: "16px" }}>
        <div 
          className="w-12 h-12 rounded-2xl flex items-center justify-center shrink-0 shadow-sm border border-[#00000005] transition-transform group-hover:scale-110 duration-500" 
          style={{ background: `linear-gradient(135deg, ${iconBg} 0%, white 100%)` }}
        >
          <span style={{ color: iconColor }}>{icon}</span>
        </div>
        <div className="flex flex-col" style={{ gap: "2px" }}>
          <span className="text-[10px] font-bold text-[#9ca3af] uppercase tracking-wider">{label}</span>
          <span className="text-[28px] font-black tracking-tight leading-none" style={{ color: accent }}>{value}</span>
        </div>
      </div>

      <SparklineGraph color={accent} points={points} />
    </div>
  );
}

export function SummaryStrip({ stats }: SummaryStripProps) {
  return (
    <div className="flex flex-wrap" style={{ gap: "12px" }}>
      <StatCard
        icon={<CheckCircle2 size={18} />}
        label="Days Present"
        value={String(stats.present)}
        iconBg="#dcfce7"
        iconColor="#16a34a"
        accent="#074616"
        points={[10, 12, 11, 14, 13, 16, 15]}
      />
      <StatCard
        icon={<XCircle size={18} />}
        label="Days Absent"
        value={String(stats.absent)}
        iconBg="#fee2e2"
        iconColor="#dc2626"
        accent="#991b1b"
        points={[2, 1, 3, 2, 0, 1, 2]}
      />
      <StatCard
        icon={<Clock size={18} />}
        label="Late Arrivals"
        value={String(stats.late)}
        iconBg="#fef3c7"
        iconColor="#d97706"
        accent="#AF580B"
        points={[5, 4, 6, 3, 5, 4, 3]}
      />
      <StatCard
        icon={<Timer size={18} />}
        label="Avg Hours / Day"
        value={`${stats.avg_hours.toFixed(1)}h`}
        iconBg="#ede9fe"
        iconColor="#7c3aed"
        accent="#33084E"
        points={[7.2, 7.8, 7.5, 8.1, 7.9, 8.2, 7.7]}
      />
    </div>
  );
}
