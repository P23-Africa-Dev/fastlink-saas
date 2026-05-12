"use client";

import React, { useMemo, useState } from "react";
import { ChevronLeft, ChevronRight, Plus, RotateCcw, Video, X } from "lucide-react";
import { CustomSelect } from "@/components/ui/CustomSelect";
import { AttendanceSkeleton } from "@/components/AttendanceSkeleton";
import { useAuthStore } from "@/lib/stores/authStore";
import { useProjects } from "../project/hooks/useProject";
import { useUsers } from "../attendance/hooks/useAttendance";
import { useCalendarEvents, useCreateCalendarTask, useCreateMeeting } from "./hooks/useCalendar";
import { toast } from "sonner";
import type { CalendarEvent, CalendarEventType } from "@/lib/types";
import { CreateCalendarTaskModal } from "./components/CreateCalendarTaskModal";
import { CreateMeetingModal } from "./components/CreateMeetingModal";
import { MeetingDetailsModal } from "./components/MeetingDetailsModal";

const EVENT_STYLE: Record<CalendarEventType, { bg: string; color: string; label: string }> = {
  attendance: { bg: "#dbeafe", color: "#1d4ed8", label: "Attendance" },
  leave: { bg: "#fef3c7", color: "#AF580B", label: "Leave" },
  project: { bg: "#ede9fe", color: "#33084E", label: "Project" },
  task: { bg: "#dcfce7", color: "#074616", label: "Task" },
  meeting: { bg: "#e0f2fe", color: "#0369a1", label: "Meeting" },
};

const TYPE_OPTIONS = [
  { value: "all", label: "All Events" },
  { value: "attendance", label: "Attendance" },
  { value: "leave", label: "Leave" },
  { value: "project", label: "Projects" },
  { value: "task", label: "Tasks" },
  { value: "meeting", label: "Meetings" },
];

type CalendarCell = {
  date: string;
  isCurrentMonth: boolean;
  isToday: boolean;
};

type EventMeta = Record<string, unknown>;

function toIso(date: Date) {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, "0");
  const day = String(date.getDate()).padStart(2, "0");
  return `${year}-${month}-${day}`;
}

function fromMonth(month: string) {
  const [year, mo] = month.split("-").map(Number);
  return new Date(year, mo - 1, 1);
}

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
  const cursor = new Date(`${start}T00:00:00`);
  const target = new Date(`${end}T00:00:00`);

  while (cursor <= target) {
    result.push(toIso(cursor));
    cursor.setDate(cursor.getDate() + 1);
  }

  return result;
}

function formatClockTime(time: string) {
  const parts = time.split(":");
  if (parts.length < 2) return "";
  const hour24 = Number(parts[0]);
  const minute = Number(parts[1]);
  if (Number.isNaN(hour24) || Number.isNaN(minute)) return "";
  const period = hour24 >= 12 ? "PM" : "AM";
  const hour12 = hour24 % 12 || 12;
  return minute === 0 ? `${hour12} ${period}` : `${hour12}:${String(minute).padStart(2, "0")} ${period}`;
}

function eventStartTimeLabel(event: CalendarEvent) {
  const meta = event.meta as EventMeta;

  if (event.type === "meeting" && typeof meta.start_at === "string") {
    const d = new Date(meta.start_at as string);
    const h = String(d.getHours()).padStart(2, "0");
    const m = String(d.getMinutes()).padStart(2, "0");
    return formatClockTime(`${h}:${m}`);
  }

  const attendanceStart = typeof meta.signed_in_at === "string" ? meta.signed_in_at : null;
  const genericStart = typeof meta.start_time === "string" ? meta.start_time : null;
  const sourceTime = attendanceStart || genericStart;
  if (!sourceTime) return "";
  return formatClockTime(sourceTime);
}

function EventDetailsModal({ event, onClose }: { event: CalendarEvent; onClose: () => void }) {
  const metaEntries = Object.entries((event.meta as EventMeta) ?? {});

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-sm"
      style={{ padding: "16px" }}
      onClick={(clickedEvent) => {
        if (clickedEvent.target === clickedEvent.currentTarget) onClose();
      }}
    >
      <div className="w-full max-w-lg rounded-2xl bg-white shadow-2xl border border-[#f0f0f5] overflow-hidden">
        <div className="flex items-center justify-between bg-[#f8f8fc] border-b border-[#f0f0f5]" style={{ padding: "16px 18px" }}>
          <div>
            <p className="text-[11px] font-bold uppercase tracking-wide text-[#9ca3af]">{event.type}</p>
            <h3 className="text-[16px] font-bold text-(--text-primary)">{event.title}</h3>
          </div>
          <button onClick={onClose} className="text-[#9ca3af] hover:text-(--text-primary)">
            <X size={18} />
          </button>
        </div>

        <div className="flex flex-col" style={{ padding: "16px 18px", gap: "12px" }}>
          <div className="grid grid-cols-2 gap-3">
            <div className="rounded-lg border border-[#f0f0f5] bg-[#fcfcff]" style={{ padding: "10px" }}>
              <p className="text-[10px] font-bold uppercase text-[#9ca3af]">Start</p>
              <p className="text-[12px] font-semibold text-(--text-primary)">{event.start_date}</p>
            </div>
            <div className="rounded-lg border border-[#f0f0f5] bg-[#fcfcff]" style={{ padding: "10px" }}>
              <p className="text-[10px] font-bold uppercase text-[#9ca3af]">End</p>
              <p className="text-[12px] font-semibold text-(--text-primary)">{event.end_date}</p>
            </div>
          </div>

          <div className="rounded-lg border border-[#f0f0f5] bg-[#fcfcff]" style={{ padding: "10px" }}>
            <p className="text-[10px] font-bold uppercase text-[#9ca3af]">Status</p>
            <p className="text-[12px] font-semibold text-(--text-primary)">{event.status || "N/A"}</p>
          </div>

          <div className="rounded-lg border border-[#f0f0f5]" style={{ padding: "10px" }}>
            <p className="text-[10px] font-bold uppercase text-[#9ca3af]" style={{ marginBottom: "8px" }}>
              Details
            </p>
            <div className="max-h-48 overflow-auto flex flex-col gap-2">
              {metaEntries.length === 0 ? (
                <p className="text-[12px] text-[#9ca3af]">No extra metadata.</p>
              ) : (
                metaEntries.map(([key, value]) => (
                  <div key={key} className="flex items-center justify-between gap-3 rounded-md bg-[#f8f8fc]" style={{ padding: "6px 8px" }}>
                    <span className="text-[11px] font-semibold text-[#6b7280]">{key}</span>
                    <span className="text-[11px] font-bold text-(--text-primary) truncate">{String(value ?? "—")}</span>
                  </div>
                ))
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

export default function CalendarPage() {
  const [month, setMonth] = useState(currentMonth());
  const [typeFilter, setTypeFilter] = useState<"all" | CalendarEventType>("all");
  const [selectedDate, setSelectedDate] = useState("");
  const [scheduleMeetingDate, setScheduleMeetingDate] = useState("");
  const [selectedEvent, setSelectedEvent] = useState<CalendarEvent | null>(null);
  const [expandedDay, setExpandedDay] = useState<string | null>(null);
  const firstDay = useMemo(() => fromMonth(month), [month]);
  const todayIso = useMemo(() => toIso(new Date()), []);
  const user = useAuthStore((state) => state.user);

  const canCreateTask = useMemo(() => {
    const roles = user?.roles?.map((role) => role.name) ?? [];
    return roles.includes("admin") || roles.includes("supervisor");
  }, [user?.roles]);

  const canScheduleMeeting = useMemo(() => {
    const roles = user?.roles?.map((role) => role.name) ?? [];
    return roles.includes("admin") || roles.includes("supervisor") || roles.includes("staff");
  }, [user?.roles]);

  const monthStart = useMemo(() => toIso(new Date(firstDay.getFullYear(), firstDay.getMonth(), 1)), [firstDay]);
  const monthEnd = useMemo(() => toIso(new Date(firstDay.getFullYear(), firstDay.getMonth() + 1, 0)), [firstDay]);

  const createTaskMutation = useCreateCalendarTask();
  const createMeetingMutation = useCreateMeeting();
  const { data: projects = [] } = useProjects();
  const { data: users = [] } = useUsers();
  const { data = [], isLoading, isFetching, isError, refetch } = useCalendarEvents({
    start_date: monthStart,
    end_date: monthEnd,
    type: typeFilter === "all" ? undefined : typeFilter,
  });

  async function handleCreateTask(payload: Parameters<typeof createTaskMutation.mutateAsync>[0]) {
    await createTaskMutation.mutateAsync(payload, {
      onSuccess: () => {
        toast.success("Task created from calendar.");
      },
      onError: () => {
        toast.error("Task creation failed. Check required fields and try again.");
      },
    });
  }

  async function handleCreateMeeting(payload: Parameters<typeof createMeetingMutation.mutateAsync>[0]) {
    await createMeetingMutation.mutateAsync(payload, {
      onSuccess: () => {
        toast.success("Meeting scheduled.");
      },
      onError: () => {
        toast.error("Failed to schedule meeting. Check the details and try again.");
      },
    });
  }

  const eventsByDate = useMemo(() => {
    const map = new Map<string, CalendarEvent[]>();
    const push = (date: string, event: CalendarEvent) => {
      if (!map.has(date)) map.set(date, []);
      map.get(date)!.push(event);
    };

    data.forEach((event) => {
      dayRange(event.start_date, event.end_date).forEach((date) => {
        push(date, event);
      });
    });

    map.forEach((value) => value.sort((a, b) => a.title.localeCompare(b.title)));
    return map;
  }, [data]);

  const gridCells = useMemo<CalendarCell[]>(() => {
    const firstOfMonth = new Date(firstDay.getFullYear(), firstDay.getMonth(), 1);
    const firstCell = new Date(firstOfMonth);
    firstCell.setDate(firstOfMonth.getDate() - firstOfMonth.getDay());
    const cells: CalendarCell[] = [];

    for (let i = 0; i < 42; i += 1) {
      const cursor = new Date(firstCell);
      cursor.setDate(firstCell.getDate() + i);
      const date = toIso(cursor);
      cells.push({
        date,
        isCurrentMonth: cursor.getMonth() === firstDay.getMonth(),
        isToday: date === todayIso,
      });
    }
    return cells;
  }, [firstDay, todayIso]);

  if (isLoading) return <AttendanceSkeleton />;

  return (
    <div className="content-area">
      <div className="content-main col-span-2">
        <div className="chart-card animate-fade-in" style={{ display: "flex", flexDirection: "column", gap: "12px" }}>
          <div className="flex flex-col gap-2 lg:flex-row lg:items-center lg:justify-between">
            <h2 className="chart-card-title">Calendar</h2>
            <div className="flex flex-wrap items-center gap-2">
              <div className="w-full sm:w-45">
                <CustomSelect value={typeFilter} onChange={(value) => setTypeFilter(value as "all" | CalendarEventType)} options={TYPE_OPTIONS} fullWidth />
              </div>
              <button
                onClick={() => setMonth(currentMonth())}
                className="h-8 inline-flex items-center justify-center rounded-lg border border-[#f0f0f5] text-[#9ca3af] hover:text-(--text-primary)"
                style={{ padding: "0 10px", gap: "6px" }}
              >
                <RotateCcw size={13} />
                <span className="text-[11px] font-semibold">Today</span>
              </button>
              <div className="flex items-center rounded-lg border border-[#f0f0f5]" style={{ padding: "2px 4px", gap: "6px" }}>
                <button
                  onClick={() => setMonth(prevMonth(month))}
                  className="w-8 h-8 flex items-center justify-center rounded-lg text-[#9ca3af] hover:text-(--text-primary)"
                >
                  <ChevronLeft size={16} />
                </button>
                <span className="text-[13px] font-bold text-(--text-primary) min-w-33 text-center">{monthLabel(month)}</span>
                <button
                  onClick={() => setMonth(nextMonth(month))}
                  className="w-8 h-8 flex items-center justify-center rounded-lg text-[#9ca3af] hover:text-(--text-primary)"
                >
                  <ChevronRight size={16} />
                </button>
              </div>
              {canCreateTask && (
                <button
                  onClick={() => setSelectedDate(toIso(new Date()))}
                  className="h-8 inline-flex items-center justify-center rounded-lg border border-[#f0f0f5] text-[#6b7280] hover:text-(--text-primary)"
                  style={{ padding: "0 10px", gap: "6px" }}
                >
                  <Plus size={13} />
                  <span className="text-[11px] font-semibold">Add Task</span>
                </button>
              )}
              {canScheduleMeeting && (
                <button
                  onClick={() => setScheduleMeetingDate(toIso(new Date()))}
                  className="h-8 inline-flex items-center justify-center rounded-lg border border-[#f0f0f5] text-[#6b7280] hover:text-(--text-primary)"
                  style={{ padding: "0 10px", gap: "6px" }}
                >
                  <Video size={13} />
                  <span className="text-[11px] font-semibold">Schedule Meeting</span>
                </button>
              )}
            </div>
          </div>

          <p className="stat-card-label">Unified events from attendance, leave, projects, tasks, and meetings. Click through months to inspect activity windows.</p>

          <div className="flex flex-wrap items-center gap-2">
            {(Object.keys(EVENT_STYLE) as CalendarEventType[]).map((type) => (
              <span
                key={type}
                className="text-[10px] font-semibold rounded-md"
                style={{ padding: "4px 8px", background: EVENT_STYLE[type].bg, color: EVENT_STYLE[type].color }}
              >
                {EVENT_STYLE[type].label}
              </span>
            ))}
            {isFetching && <span className="text-[11px] font-semibold text-[#9ca3af]">Refreshing events...</span>}
          </div>

          {isError && (
            <div className="rounded-xl border border-[#f9d7da] bg-[#fef2f2] text-[12px] text-[#991b1b] flex items-center justify-between gap-2" style={{ padding: "10px 12px" }}>
              <span>Could not load calendar events for this month.</span>
              <button className="text-[11px] font-semibold underline" onClick={() => refetch()}>
                Retry
              </button>
            </div>
          )}

          <div className="grid grid-cols-7 rounded-xl border border-[#f0f0f5] overflow-hidden">
            {["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"].map((label) => (
              <div key={label} className="text-[11px] font-bold text-[#9ca3af] uppercase" style={{ padding: "8px", background: "#f8f8fc", borderBottom: "1px solid #f0f0f5" }}>
                {label}
              </div>
            ))}

            {gridCells.map((cell, idx) => {
              const dayEvents = eventsByDate.get(cell.date) || [];
              const dayNum = Number(cell.date.slice(-2));
              const isPastDay = cell.date < todayIso;
              const canOpenCreateTask = canCreateTask && !isPastDay;

              return (
                <div
                  key={cell.date}
                  role={canOpenCreateTask ? "button" : undefined}
                  tabIndex={canOpenCreateTask ? 0 : undefined}
                  onClick={() => {
                    setExpandedDay(null);
                    if (canOpenCreateTask) setSelectedDate(cell.date);
                  }}
                  onKeyDown={(event) => {
                    if (canOpenCreateTask && (event.key === "Enter" || event.key === " ")) {
                      event.preventDefault();
                      setSelectedDate(cell.date);
                    }
                  }}
                  style={{
                    minHeight: "96px",
                    padding: "6px",
                    borderTop: "1px solid #f0f0f5",
                    borderRight: idx % 7 !== 6 ? "1px solid #f0f0f5" : "none",
                    display: "flex",
                    flexDirection: "column",
                    gap: "4px",
                    background: cell.isCurrentMonth ? "#ffffff" : "#fafafa",
                    cursor: canOpenCreateTask ? "pointer" : "default",
                    position: "relative",
                  }}
                >
                  <span className={`text-[11px] font-bold ${cell.isToday ? "text-[#33084E]" : "text-[#6b7280]"} ${!cell.isCurrentMonth ? "opacity-55" : ""}`}>{dayNum}</span>
                  {dayEvents.slice(0, 3).map((event) => (
                    <button
                      type="button"
                      key={`${event.id}-${cell.date}`}
                      className="text-[10px] font-semibold truncate rounded-md text-left"
                      style={{
                        padding: "2px 6px",
                        background: EVENT_STYLE[event.type]?.bg ?? "#f3f4f6",
                        color: EVENT_STYLE[event.type]?.color ?? "#374151",
                      }}
                      title={`${EVENT_STYLE[event.type]?.label ?? event.type}: ${event.title}`}
                      onClick={(clickEvent) => {
                        clickEvent.stopPropagation();
                        setExpandedDay(null);
                        setSelectedEvent(event);
                      }}
                    >
                      {event.title}
                      {eventStartTimeLabel(event) ? ` ${eventStartTimeLabel(event)}` : ""}
                    </button>
                  ))}
                  {dayEvents.length > 3 && (
                    <button
                      type="button"
                      className="text-[10px] font-semibold text-[#9ca3af] text-left hover:text-[#6b7280] underline"
                      onClick={(event) => {
                        event.stopPropagation();
                        setExpandedDay((prev) => (prev === cell.date ? null : cell.date));
                      }}
                    >
                      +{dayEvents.length - 3} more
                    </button>
                  )}
                  {expandedDay === cell.date && (
                    <div
                      className="absolute z-20 rounded-xl border border-[#ececf2] bg-white shadow-xl"
                      style={{ top: "24px", left: "6px", right: "6px", padding: "8px" }}
                      onClick={(event) => event.stopPropagation()}
                    >
                      <div className="max-h-48 overflow-auto flex flex-col gap-1">
                        {dayEvents.map((event) => (
                          <button
                            type="button"
                            key={`${event.id}-expanded-${cell.date}`}
                            className="text-[10px] font-semibold truncate rounded-md text-left"
                            style={{
                              padding: "3px 6px",
                              background: EVENT_STYLE[event.type]?.bg ?? "#f3f4f6",
                              color: EVENT_STYLE[event.type]?.color ?? "#374151",
                            }}
                            title={`${EVENT_STYLE[event.type]?.label ?? event.type}: ${event.title}`}
                            onClick={(clickEvent) => {
                              clickEvent.stopPropagation();
                              setSelectedEvent(event);
                            }}
                          >
                            {event.title}
                            {eventStartTimeLabel(event) ? ` ${eventStartTimeLabel(event)}` : ""}
                          </button>
                        ))}
                      </div>
                    </div>
                  )}
                </div>
              );
            })}
          </div>

          {!isError && data.length === 0 && (
            <div className="rounded-xl border border-dashed border-[#e6e7ee] text-center text-[12px] text-[#9ca3af]" style={{ padding: "18px 12px" }}>
              No events found for {monthLabel(month)} with the selected filter.
            </div>
          )}
        </div>
      </div>

      {canCreateTask && selectedDate && (
        <CreateCalendarTaskModal
          selectedDate={selectedDate}
          projects={projects}
          users={users}
          onClose={() => setSelectedDate("")}
          onSave={handleCreateTask}
        />
      )}

      {canScheduleMeeting && scheduleMeetingDate && (
        <CreateMeetingModal
          selectedDate={scheduleMeetingDate}
          projects={projects}
          users={users}
          onClose={() => setScheduleMeetingDate("")}
          onSave={handleCreateMeeting}
        />
      )}

      {selectedEvent && selectedEvent.type === "meeting" && (
        <MeetingDetailsModal
          event={selectedEvent}
          canManage={canScheduleMeeting}
          onClose={() => setSelectedEvent(null)}
        />
      )}

      {selectedEvent && selectedEvent.type !== "meeting" && (
        <EventDetailsModal event={selectedEvent} onClose={() => setSelectedEvent(null)} />
      )}
    </div>
  );
}
