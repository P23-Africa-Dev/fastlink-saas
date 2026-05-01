"use client";

import React from "react";
import { X, LogIn, LogOut, Clock, FileText, Calendar } from "lucide-react";
import { CalendarDay, STATUS_CONFIG } from "./types";

interface DayDetailDrawerProps {
  day:     CalendarDay;
  onClose: () => void;
}

function fmt(iso: string | null) {
  if (!iso) return "—";
  return new Date(iso).toLocaleTimeString("en-US", { hour: "2-digit", minute: "2-digit" });
}

function calcDuration(signIn: string | null, signOut: string | null) {
  if (!signIn || !signOut) return null;
  const diff = new Date(signOut).getTime() - new Date(signIn).getTime();
  const h = Math.floor(diff / 3600000);
  const m = Math.floor((diff % 3600000) / 60000);
  return `${h}h ${m}m`;
}

function fmtDate(dateStr: string) {
  return new Date(dateStr + "T00:00:00").toLocaleDateString("en-US", {
    weekday: "long", month: "long", day: "numeric", year: "numeric",
  });
}

export function DayDetailDrawer({ day, onClose }: DayDetailDrawerProps) {
  const cfg      = day.status ? STATUS_CONFIG[day.status] : null;
  const duration = calcDuration(day.sign_in, day.sign_out);

  return (
    <>
      <div className="fixed inset-0 bg-black/30 z-40" onClick={onClose} />

      <div className="fixed top-0 right-0 h-full bg-white z-50 flex flex-col shadow-2xl overflow-hidden" style={{ width: "400px", maxWidth: "100vw" }}>

        {/* Top bar */}
        <div className="flex items-center justify-between border-b border-[#f0f0f5] bg-[#f8f8fc] shrink-0" style={{ padding: "16px 20px" }}>
          <div className="flex items-center" style={{ gap: "10px" }}>
            <div className="w-8 h-8 rounded-xl flex items-center justify-center" style={{ background: "#33084E" }}>
              <Calendar size={14} className="text-white" />
            </div>
            <span className="text-[13px] font-bold text-(--text-primary)">Attendance Details</span>
          </div>
          <button onClick={onClose} className="w-8 h-8 flex items-center justify-center rounded-lg text-[#9ca3af] hover:text-(--text-primary) hover:bg-[#f0f0f5] transition-all">
            <X size={16} />
          </button>
        </div>

        {/* Body */}
        <div className="flex-1 overflow-y-auto" style={{ padding: "24px", display: "flex", flexDirection: "column", gap: "20px" }}>

          {/* Date hero */}
          <div className="flex flex-col rounded-2xl border border-[#f0f0f5] overflow-hidden">
            <div className="bg-[#f8f8fc] flex items-start justify-between" style={{ padding: "16px 18px" }}>
              <div className="flex flex-col" style={{ gap: "4px" }}>
                <span className="text-[11px] font-bold text-[#9ca3af] uppercase tracking-wider">Date</span>
                <span className="text-[16px] font-bold text-(--text-primary)">{fmtDate(day.date)}</span>
              </div>
              {cfg ? (
                <span
                  className="inline-flex items-center rounded-full text-[11px] font-bold shrink-0"
                  style={{ padding: "4px 12px", gap: "5px", background: cfg.bg, color: cfg.color }}
                >
                  <span className="rounded-full shrink-0" style={{ width: "6px", height: "6px", background: cfg.dot }} />
                  {cfg.label}
                </span>
              ) : (
                <span className="inline-flex items-center rounded-full text-[11px] font-bold" style={{ padding: "4px 12px", background: "#f3f4f6", color: "#9ca3af" }}>
                  No Record
                </span>
              )}
            </div>
          </div>

          {/* Time info */}
          <div className="rounded-2xl border border-[#f0f0f5] overflow-hidden">
            {/* Sign In */}
            <div className="flex items-center justify-between border-b border-[#f0f0f5]" style={{ padding: "14px 18px" }}>
              <div className="flex items-center" style={{ gap: "10px" }}>
                <div className="w-8 h-8 rounded-lg flex items-center justify-center" style={{ background: "#dcfce7" }}>
                  <LogIn size={14} style={{ color: "#16a34a" }} />
                </div>
                <span className="text-[13px] font-semibold text-(--text-primary)">Clock In</span>
              </div>
              <span className="text-[15px] font-bold text-(--text-primary)">{fmt(day.sign_in)}</span>
            </div>

            {/* Sign Out */}
            <div className="flex items-center justify-between border-b border-[#f0f0f5]" style={{ padding: "14px 18px" }}>
              <div className="flex items-center" style={{ gap: "10px" }}>
                <div className="w-8 h-8 rounded-lg flex items-center justify-center" style={{ background: "#fee2e2" }}>
                  <LogOut size={14} style={{ color: "#dc2626" }} />
                </div>
                <span className="text-[13px] font-semibold text-(--text-primary)">Clock Out</span>
              </div>
              <span className="text-[15px] font-bold text-(--text-primary)">{fmt(day.sign_out)}</span>
            </div>

            {/* Duration */}
            <div className="flex items-center justify-between" style={{ padding: "14px 18px" }}>
              <div className="flex items-center" style={{ gap: "10px" }}>
                <div className="w-8 h-8 rounded-lg flex items-center justify-center" style={{ background: "#ede9fe" }}>
                  <Clock size={14} style={{ color: "#7c3aed" }} />
                </div>
                <span className="text-[13px] font-semibold text-(--text-primary)">Total Hours</span>
              </div>
              <span className="text-[15px] font-bold" style={{ color: "#33084E" }}>
                {duration ?? (day.hours != null ? `${day.hours}h` : "—")}
              </span>
            </div>
          </div>

          {/* Weekend / no record notice */}
          {(day.is_weekend || !day.status) && (
            <div className="rounded-xl border border-dashed border-[#f0f0f5] flex items-center" style={{ padding: "14px 16px", gap: "10px" }}>
              <span className="text-[12px] font-medium text-[#9ca3af]">
                {day.is_weekend ? "Weekend — no attendance tracked." : "No attendance record found for this day."}
              </span>
            </div>
          )}
        </div>
      </div>
    </>
  );
}
