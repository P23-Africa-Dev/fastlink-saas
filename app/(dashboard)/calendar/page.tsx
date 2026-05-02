"use client";

import React, { useMemo, useState } from "react";
import { ChevronLeft, ChevronRight } from "lucide-react";
import { useAttendanceCalendar } from "../attendance/hooks/useAttendance";
import { useAuthStore } from "@/lib/stores/authStore";
import { AttendanceSkeleton } from "@/components/AttendanceSkeleton";

type EventType = "attendance" | "leave" | "task_start" | "task_due";

interface CalendarEvent {
  id: string;
  type: EventType;
  label: string;
}

const EVENT_STYLE: Record<EventType, { bg: string; color: string }> = {
  attendance: { bg: "#dbeafe", color: "#1d4ed8" },
  leave: { bg: "#fef3c7", color: "#AF580B" },
  task_start: { bg: "#ede9fe", color: "#33084E" },
  task_due: { bg: "#dcfce7", color: "#074616" },
};

function currentMonth() {
  const d = new Date();
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}`;
}

function prevMonth(month: string) {
  const [y, mo] = month.split("-").map(Number);
  const d = new Date(y, mo - 2, 1);
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}`;
}

function nextMonth(month: string) {
  const [y, mo] = month.split("-").map(Number);
  const d = new Date(y, mo, 1);
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}`;
}

function monthLabel(month: string) {
  const [y, mo] = month.split("-").map(Number);
  return new Date(y, mo - 1, 1).toLocaleDateString("en-US", { month: "long", year: "numeric" });
}

function dayRange(start: string, end: string): string[] {
  const result: string[] = [];
  const cursor = new Date(start + "T00:00:00");
  const target = new Date(end + "T00:00:00");

  while (cursor <= target) {
    result.push(cursor.toISOString().split("T")[0]);
    cursor.setDate(cursor.getDate() + 1);
  }

  return result;
}

export default function CalendarPage() {
  const currentUser = useAuthStore((s) => s.user);
  const [month, setMonth] = useState(currentMonth());

  const { data, isLoading } = useAttendanceCalendar({
    month,
    userId: currentUser?.id,
  });

  const eventsByDate = useMemo(() => {
    const map = new Map<string, CalendarEvent[]>();

    const push = (date: string, event: CalendarEvent) => {
      if (!map.has(date)) map.set(date, []);
      map.get(date)!.push(event);
    };

    (data?.attendances || []).forEach((attendance) => {
      const date = String(attendance.date).split("T")[0];
      push(date, {
        id: `a-${attendance.id}`,
        type: "attendance",
        label: `Attendance: ${attendance.status}`,
      });
    });

    (data?.leave_requests || []).forEach((leave) => {
      const effectiveStart = leave.modified_start_date || leave.start_date;
      const effectiveEnd = leave.modified_end_date || leave.end_date;

      dayRange(effectiveStart, effectiveEnd).forEach((date) => {
        push(date, {
          id: `l-${leave.id}-${date}`,
          type: "leave",
          label: `Leave: ${leave.type || leave.leave_type}`,
        });
      });
    });

    (data?.tasks || []).forEach((task) => {
      if (task.start_date) {
        push(task.start_date, {
          id: `ts-${task.id}`,
          type: "task_start",
          label: `Task start: ${task.title}`,
        });
      }

      if (task.due_date) {
        push(task.due_date, {
          id: `td-${task.id}`,
          type: "task_due",
          label: `Task due: ${task.title}`,
        });
      }
    });

    return map;
  }, [data]);

  const gridCells = useMemo(() => {
    const [y, mo] = month.split("-").map(Number);
    const first = new Date(y, mo - 1, 1);
    const startDow = first.getDay();
    const daysInMo = new Date(y, mo, 0).getDate();
    const cells: Array<{ date: string } | null> = [];

    for (let i = 0; i < startDow; i++) cells.push(null);

    for (let d = 1; d <= daysInMo; d++) {
      const date = `${month}-${String(d).padStart(2, "0")}`;
      cells.push({ date });
    }

    while (cells.length % 7 !== 0) cells.push(null);

    return cells;
  }, [month]);

  if (isLoading) {
    return <AttendanceSkeleton />;
  }

  return (
    <div className="content-area">
      <div className="content-main">
        <div className="chart-card animate-fade-in" style={{ display: "flex", flexDirection: "column", gap: "12px" }}>
          <div className="flex items-center justify-between" style={{ gap: "8px" }}>
            <h2 className="chart-card-title">Calendar</h2>
            <div className="flex items-center" style={{ gap: "8px" }}>
              <button
                onClick={() => setMonth(prevMonth(month))}
                className="w-8 h-8 flex items-center justify-center rounded-lg border border-[#f0f0f5] text-[#9ca3af] hover:text-(--text-primary)"
              >
                <ChevronLeft size={16} />
              </button>
              <span className="text-[13px] font-bold text-(--text-primary)">{monthLabel(month)}</span>
              <button
                onClick={() => setMonth(nextMonth(month))}
                className="w-8 h-8 flex items-center justify-center rounded-lg border border-[#f0f0f5] text-[#9ca3af] hover:text-(--text-primary)"
              >
                <ChevronRight size={16} />
              </button>
            </div>
          </div>

          <p className="stat-card-label">Attendance, leave requests, and task dates are reflected directly from backend data.</p>

          <div className="grid grid-cols-7 rounded-xl border border-[#f0f0f5] overflow-hidden">
            {["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"].map((label) => (
              <div key={label} className="text-[11px] font-bold text-[#9ca3af] uppercase" style={{ padding: "8px", background: "#f8f8fc", borderBottom: "1px solid #f0f0f5" }}>
                {label}
              </div>
            ))}

            {gridCells.map((cell, idx) => {
              if (!cell) {
                return <div key={`empty-${idx}`} style={{ minHeight: "92px", borderTop: "1px solid #f0f0f5", borderRight: idx % 7 !== 6 ? "1px solid #f0f0f5" : "none", background: "#fafafa" }} />;
              }

              const dayEvents = eventsByDate.get(cell.date) || [];
              const dayNum = Number(cell.date.slice(-2));

              return (
                <div
                  key={cell.date}
                  style={{
                    minHeight: "92px",
                    padding: "6px",
                    borderTop: "1px solid #f0f0f5",
                    borderRight: idx % 7 !== 6 ? "1px solid #f0f0f5" : "none",
                    display: "flex",
                    flexDirection: "column",
                    gap: "4px",
                  }}
                >
                  <span className="text-[11px] font-bold text-[#6b7280]">{dayNum}</span>
                  {dayEvents.slice(0, 3).map((event) => (
                    <span
                      key={event.id}
                      className="text-[10px] font-semibold truncate rounded-md"
                      style={{
                        padding: "2px 6px",
                        background: EVENT_STYLE[event.type].bg,
                        color: EVENT_STYLE[event.type].color,
                      }}
                      title={event.label}
                    >
                      {event.label}
                    </span>
                  ))}
                  {dayEvents.length > 3 && (
                    <span className="text-[10px] font-semibold text-[#9ca3af]">+{dayEvents.length - 3} more</span>
                  )}
                </div>
              );
            })}
          </div>
        </div>
      </div>
    </div>
  );
}
