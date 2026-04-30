"use client";

import React, { useMemo } from "react";
import { ChevronLeft, ChevronRight } from "lucide-react";
import { LeaveRequest, STATUS_CONFIG, TYPE_CONFIG } from "./types";

interface LeaveCalendarProps {
  month:    string;
  requests: LeaveRequest[];
  onPrev:   () => void;
  onNext:   () => void;
  onRequestClick: (r: LeaveRequest) => void;
}

const WEEKDAYS = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];

function fmtMonthYear(m: string) {
  const [y, mo] = m.split("-").map(Number);
  return new Date(y, mo - 1, 1).toLocaleDateString("en-US", { month: "long", year: "numeric" });
}

export function LeaveCalendar({ month, requests, onPrev, onNext, onRequestClick }: LeaveCalendarProps) {
  const [y, mo] = month.split("-").map(Number);
  const daysInMo  = new Date(y, mo, 0).getDate();
  const firstDow  = new Date(y, mo - 1, 1).getDay();
  const today     = new Date().toISOString().split("T")[0];

  // Map date → requests active on that day
  const dayRequests = useMemo(() => {
    const map: Record<string, LeaveRequest[]> = {};
    for (let d = 1; d <= daysInMo; d++) {
      const dateStr = `${month}-${String(d).padStart(2, "0")}`;
      map[dateStr] = requests.filter(r => {
        const active   = r.status === "approved" || r.status === "modified" || r.status === "pending";
        const inRange  = r.start_date <= dateStr && r.end_date >= dateStr;
        return active && inRange;
      });
    }
    return map;
  }, [month, requests]);

  // Build grid cells
  const cells: (string | null)[] = [];
  for (let i = 0; i < firstDow; i++) cells.push(null);
  for (let d = 1; d <= daysInMo; d++) cells.push(`${month}-${String(d).padStart(2, "0")}`);
  while (cells.length % 7 !== 0) cells.push(null);

  // Count stats
  const pendingCount  = requests.filter(r => r.status === "pending").length;
  const approvedCount = requests.filter(r => r.status === "approved").length;
  const modifiedCount = requests.filter(r => r.status === "modified").length;

  return (
    <div className="flex flex-col bg-white rounded-2xl border border-[#f0f0f5] shadow-sm overflow-hidden flex-1">

      {/* Calendar header */}
      <div className="flex items-center justify-between border-b border-[#f0f0f5] bg-[#f8f8fc] shrink-0" style={{ padding: "14px 20px" }}>
        <div className="flex items-center" style={{ gap: "10px" }}>
          <button onClick={onPrev} className="w-8 h-8 flex items-center justify-center rounded-lg border border-[#f0f0f5] bg-white text-[#9ca3af] hover:text-(--text-primary) hover:border-[#d1d5db] transition-all">
            <ChevronLeft size={16} />
          </button>
          <span className="text-[15px] font-bold text-(--text-primary)">{fmtMonthYear(month)}</span>
          <button onClick={onNext} className="w-8 h-8 flex items-center justify-center rounded-lg border border-[#f0f0f5] bg-white text-[#9ca3af] hover:text-(--text-primary) hover:border-[#d1d5db] transition-all">
            <ChevronRight size={16} />
          </button>
        </div>

        {/* Mini stats */}
        <div className="flex items-center" style={{ gap: "10px" }}>
          {[
            { label: "Approved", count: approvedCount, color: "#074616", bg: "#dcfce7" },
            { label: "Pending",  count: pendingCount,  color: "#AF580B", bg: "#fef3c7" },
            { label: "Modified", count: modifiedCount, color: "#1d4ed8", bg: "#dbeafe" },
          ].map(s => s.count > 0 && (
            <span key={s.label} className="inline-flex items-center rounded-full text-[11px] font-bold" style={{ padding: "3px 10px", gap: "4px", background: s.bg, color: s.color }}>
              {s.count} {s.label}
            </span>
          ))}
        </div>
      </div>

      {/* Weekday headers */}
      <div className="grid grid-cols-7 border-b border-[#f0f0f5]" style={{ background: "#f8f8fc" }}>
        {WEEKDAYS.map(d => (
          <div key={d} className="flex items-center justify-center" style={{ padding: "9px 4px" }}>
            <span className="text-[11px] font-bold text-[#9ca3af] uppercase tracking-wider">{d}</span>
          </div>
        ))}
      </div>

      {/* Day grid */}
      <div className="flex-1 grid grid-cols-7" style={{ alignContent: "start" }}>
        {cells.map((dateStr, i) => {
          if (!dateStr) {
            return <div key={i} className="border-b border-r border-[#f0f0f5]" style={{ minHeight: "90px", background: "#fafafa" }} />;
          }

          const dayReqs  = dayRequests[dateStr] ?? [];
          const dayNum   = parseInt(dateStr.split("-")[2]);
          const isToday  = dateStr === today;
          const isWknd   = [0, 6].includes(new Date(dateStr + "T00:00:00").getDay());
          const isFuture = dateStr > today;

          return (
            <div
              key={i}
              className="border-b border-r border-[#f0f0f5] flex flex-col"
              style={{
                minHeight: "90px",
                padding: "6px 8px",
                gap: "3px",
                background: isWknd ? "#fafafa" : "white",
              }}
            >
              {/* Day number */}
              <div className="flex items-center justify-between" style={{ marginBottom: "2px" }}>
                <span
                  className="text-[12px] font-bold flex items-center justify-center"
                  style={{
                    width: "22px", height: "22px", borderRadius: "50%",
                    background: isToday ? "#33084E" : "transparent",
                    color: isToday ? "white" : isFuture ? "#d1d5db" : isWknd ? "#9ca3af" : "#374151",
                  }}
                >
                  {dayNum}
                </span>
              </div>

              {/* Leave bars — up to 3, then overflow */}
              {dayReqs.slice(0, 3).map(r => {
                const cfg = STATUS_CONFIG[r.status];
                return (
                  <button
                    key={r.id}
                    onClick={() => onRequestClick(r)}
                    className="w-full rounded text-left text-[10px] font-bold truncate transition-all hover:opacity-80"
                    style={{ padding: "2px 5px", background: cfg.bg, color: cfg.color }}
                    title={`${r.user_name} – ${TYPE_CONFIG[r.type].label}`}
                  >
                    {r.user_initials} {TYPE_CONFIG[r.type].label}
                  </button>
                );
              })}
              {dayReqs.length > 3 && (
                <span className="text-[10px] font-bold text-[#9ca3af]">+{dayReqs.length - 3} more</span>
              )}
            </div>
          );
        })}
      </div>

      {/* Legend */}
      <div className="flex flex-wrap items-center border-t border-[#f0f0f5] bg-[#f8f8fc] shrink-0" style={{ padding: "10px 20px", gap: "14px" }}>
        <span className="text-[11px] font-bold text-[#9ca3af] uppercase tracking-wider">Status:</span>
        {(["approved","pending","modified","rejected"] as const).map(s => {
          const c = STATUS_CONFIG[s];
          return (
            <div key={s} className="flex items-center" style={{ gap: "5px" }}>
              <span className="rounded-full" style={{ width: "7px", height: "7px", background: c.dot }} />
              <span className="text-[11px] font-semibold" style={{ color: c.color }}>{c.label}</span>
            </div>
          );
        })}
        <div className="flex items-center" style={{ gap: "5px", marginLeft: "auto" }}>
          <span className="rounded-full" style={{ width: "8px", height: "8px", background: "#33084E" }} />
          <span className="text-[11px] font-semibold" style={{ color: "#33084E" }}>Today</span>
        </div>
      </div>
    </div>
  );
}
