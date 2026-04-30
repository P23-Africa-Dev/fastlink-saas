"use client";

import React, { useMemo } from "react";
import { ChevronLeft, ChevronRight } from "lucide-react";
import { CalendarDay, STATUS_CONFIG, AttendanceStatus } from "./types";

interface CalendarViewProps {
  month:    string; // "YYYY-MM"
  days:     CalendarDay[];
  onPrev:   () => void;
  onNext:   () => void;
  onDayClick: (day: CalendarDay) => void;
}

const WEEKDAYS = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];

function parseMonth(m: string) {
  const [y, mo] = m.split("-").map(Number);
  return new Date(y, mo - 1, 1);
}

function fmtMonthYear(m: string) {
  const d = parseMonth(m);
  return d.toLocaleDateString("en-US", { month: "long", year: "numeric" });
}

const LEGEND: { key: AttendanceStatus; label: string }[] = [
  { key: "present",  label: "Present"  },
  { key: "absent",   label: "Absent"   },
  { key: "late",     label: "Late"     },
  { key: "half_day", label: "Half Day" },
];

export function CalendarView({ month, days, onPrev, onNext, onDayClick }: CalendarViewProps) {
  const dayMap = useMemo(() => {
    const m: Record<string, CalendarDay> = {};
    days.forEach(d => { m[d.date] = d; });
    return m;
  }, [days]);

  const cells = useMemo(() => {
    const first     = parseMonth(month);
    const startDow  = first.getDay(); // 0=Sun
    const [y, mo]   = month.split("-").map(Number);
    const daysInMo  = new Date(y, mo, 0).getDate();
    const grid: (CalendarDay | null)[] = [];

    for (let i = 0; i < startDow; i++) grid.push(null);
    for (let d = 1; d <= daysInMo; d++) {
      const dateStr = `${month}-${String(d).padStart(2, "0")}`;
      grid.push(dayMap[dateStr] ?? {
        date: dateStr,
        status: null,
        sign_in: null,
        sign_out: null,
        hours: null,
        is_today: dateStr === new Date().toISOString().split("T")[0],
        is_weekend: [0, 6].includes(new Date(dateStr + "T00:00:00").getDay()),
      });
    }
    // Pad to complete last row
    while (grid.length % 7 !== 0) grid.push(null);
    return grid;
  }, [month, dayMap]);

  function fmt(iso: string | null) {
    if (!iso) return null;
    return new Date(iso).toLocaleTimeString("en-US", { hour: "2-digit", minute: "2-digit" });
  }

  return (
    <div className="flex flex-col bg-white rounded-2xl border border-[#f0f0f5] shadow-sm overflow-hidden flex-1">

      {/* Calendar header */}
      <div className="flex items-center justify-between border-b border-[#f0f0f5] bg-[#f8f8fc] shrink-0" style={{ padding: "16px 20px" }}>
        <button
          onClick={onPrev}
          className="w-8 h-8 flex items-center justify-center rounded-lg border border-[#f0f0f5] bg-white text-[#9ca3af] hover:text-(--text-primary) hover:border-[#d1d5db] transition-all"
        >
          <ChevronLeft size={16} />
        </button>
        <span className="text-[15px] font-bold text-(--text-primary)">{fmtMonthYear(month)}</span>
        <button
          onClick={onNext}
          className="w-8 h-8 flex items-center justify-center rounded-lg border border-[#f0f0f5] bg-white text-[#9ca3af] hover:text-(--text-primary) hover:border-[#d1d5db] transition-all"
        >
          <ChevronRight size={16} />
        </button>
      </div>

      {/* Weekday labels */}
      <div className="grid grid-cols-7 border-b border-[#f0f0f5]" style={{ background: "#f8f8fc" }}>
        {WEEKDAYS.map(d => (
          <div key={d} className="flex items-center justify-center" style={{ padding: "10px 4px" }}>
            <span className="text-[11px] font-bold text-[#9ca3af] uppercase tracking-wider">{d}</span>
          </div>
        ))}
      </div>

      {/* Day grid */}
      <div className="flex-1 grid grid-cols-7" style={{ alignContent: "start" }}>
        {cells.map((cell, i) => {
          if (!cell) {
            return <div key={i} className="border-b border-r border-[#f0f0f5] bg-[#fafafa]" style={{ minHeight: "80px" }} />;
          }

          const cfg        = cell.status ? STATUS_CONFIG[cell.status] : null;
          const isToday    = cell.is_today;
          const isWeekend  = cell.is_weekend;
          const isFuture   = cell.date > new Date().toISOString().split("T")[0];
          const dayNum     = parseInt(cell.date.split("-")[2]);
          const inTime     = fmt(cell.sign_in);

          return (
            <div
              key={i}
              onClick={() => !isFuture && onDayClick(cell)}
              className="border-b border-r border-[#f0f0f5] flex flex-col transition-all group"
              style={{
                minHeight: "80px",
                padding: "8px 10px",
                gap: "4px",
                background: cfg ? cfg.bg + "55" : isWeekend ? "#fafafa" : "white",
                cursor: isFuture ? "default" : "pointer",
                opacity: isFuture ? 0.45 : 1,
                outline: isToday ? `2px solid #33084E` : "none",
                outlineOffset: "-2px",
              }}
            >
              {/* Day number + status dot */}
              <div className="flex items-center justify-between">
                <span
                  className="text-[12px] font-bold"
                  style={{
                    color: isToday ? "#33084E" : isFuture ? "#d1d5db" : "#374151",
                    background: isToday ? "#ede9fe" : "transparent",
                    borderRadius: "50%",
                    width: "22px", height: "22px",
                    display: "flex", alignItems: "center", justifyContent: "center",
                  }}
                >
                  {dayNum}
                </span>
                {cfg && (
                  <span className="rounded-full shrink-0" style={{ width: "7px", height: "7px", background: cfg.dot }} />
                )}
              </div>

              {/* Status label + time */}
              {cfg && (
                <div className="flex flex-col" style={{ gap: "1px" }}>
                  <span className="text-[10px] font-bold truncate" style={{ color: cfg.color }}>{cfg.label}</span>
                  {inTime && <span className="text-[10px] font-medium text-[#9ca3af]">{inTime}</span>}
                </div>
              )}

              {/* Hover highlight ring */}
              {!isFuture && !isToday && (
                <div className="absolute inset-0 opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none rounded" style={{ boxShadow: "inset 0 0 0 1.5px #33084E22" }} />
              )}
            </div>
          );
        })}
      </div>

      {/* Legend */}
      <div className="flex flex-wrap items-center border-t border-[#f0f0f5] bg-[#f8f8fc] shrink-0" style={{ padding: "10px 20px", gap: "16px" }}>
        <span className="text-[11px] font-bold text-[#9ca3af] uppercase tracking-wider">Legend:</span>
        {LEGEND.map(l => {
          const c = STATUS_CONFIG[l.key];
          return (
            <div key={l.key} className="flex items-center" style={{ gap: "6px" }}>
              <span className="rounded-full" style={{ width: "8px", height: "8px", background: c.dot }} />
              <span className="text-[11px] font-semibold" style={{ color: c.color }}>{l.label}</span>
            </div>
          );
        })}
        <div className="flex items-center" style={{ gap: "6px" }}>
          <span className="rounded-full border-2 border-[#33084E]" style={{ width: "8px", height: "8px" }} />
          <span className="text-[11px] font-semibold" style={{ color: "#33084E" }}>Today</span>
        </div>
      </div>
    </div>
  );
}
