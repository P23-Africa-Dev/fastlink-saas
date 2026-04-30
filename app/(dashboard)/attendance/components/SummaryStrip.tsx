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

function StatCard({ icon, label, value, iconBg, iconColor, accent }: StatCardProps) {
  return (
    <div className="flex-1 bg-white rounded-2xl border border-[#f0f0f5] flex items-center" style={{ padding: "16px 20px", gap: "14px", minWidth: "140px" }}>
      <div className="w-10 h-10 rounded-xl flex items-center justify-center shrink-0" style={{ background: iconBg }}>
        <span style={{ color: iconColor }}>{icon}</span>
      </div>
      <div className="flex flex-col" style={{ gap: "2px" }}>
        <span className="text-[11px] font-bold text-[#9ca3af] uppercase tracking-wider">{label}</span>
        <span className="text-[22px] font-bold leading-none" style={{ color: accent }}>{value}</span>
      </div>
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
      />
      <StatCard
        icon={<XCircle size={18} />}
        label="Days Absent"
        value={String(stats.absent)}
        iconBg="#fee2e2"
        iconColor="#dc2626"
        accent="#991b1b"
      />
      <StatCard
        icon={<Clock size={18} />}
        label="Late Arrivals"
        value={String(stats.late)}
        iconBg="#fef3c7"
        iconColor="#d97706"
        accent="#AF580B"
      />
      <StatCard
        icon={<Timer size={18} />}
        label="Avg Hours / Day"
        value={`${stats.avg_hours.toFixed(1)}h`}
        iconBg="#ede9fe"
        iconColor="#7c3aed"
        accent="#33084E"
      />
    </div>
  );
}
