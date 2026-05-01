"use client";

import React, { useState, useMemo } from "react";
import { ChevronDown, ChevronRight } from "lucide-react";
import { Project, Task, PROJECT_STATUS_CONFIG, TASK_STATUS_CONFIG } from "./types";

interface GanttChartProps {
  projects: Project[];
  tasks:    Task[];
}

function addDays(date: Date, days: number): Date {
  const d = new Date(date);
  d.setDate(d.getDate() + days);
  return d;
}

function diffDays(a: Date, b: Date) {
  return Math.round((b.getTime() - a.getTime()) / (1000 * 60 * 60 * 24));
}

function parseDate(s: string) { return new Date(s + "T00:00:00"); }

function formatMonthYear(d: Date) {
  return d.toLocaleDateString("en-US", { month: "short", year: "numeric" });
}

function formatDay(d: Date) {
  return d.toLocaleDateString("en-US", { month: "short", day: "numeric" });
}

export function GanttChart({ projects, tasks }: GanttChartProps) {
  // Date range controls
  const defaultFrom = useMemo(() => {
    const dates = [...projects.map(p => p.start_date), ...tasks.map(t => t.start_date)]
      .filter(Boolean)
      .map(parseDate)
      .filter(d => !isNaN(d.getTime()));

    if (!dates.length) return new Date();
    const min = new Date(Math.min(...dates.map(d => d.getTime())));
    if (isNaN(min.getTime())) return new Date();
    min.setDate(1);
    return min;
  }, [projects, tasks]);

  const defaultTo = useMemo(() => {
    const dates = [...projects.map(p => p.due_date), ...tasks.map(t => t.due_date)]
      .filter(Boolean)
      .map(parseDate)
      .filter(d => !isNaN(d.getTime()));

    if (!dates.length) return addDays(new Date(), 90);
    const max = new Date(Math.max(...dates.map(d => d.getTime())));
    if (isNaN(max.getTime())) return addDays(new Date(), 90);
    return max;
  }, [projects, tasks]);

  const [rangeFrom, setRangeFrom] = useState(defaultFrom.toISOString().split("T")[0]);
  const [rangeTo,   setRangeTo]   = useState(defaultTo.toISOString().split("T")[0]);
  const [collapsed, setCollapsed] = useState<Set<number>>(new Set());

  const rangeStart = parseDate(rangeFrom);
  const rangeEnd   = parseDate(rangeTo);
  const totalDays  = Math.max(1, diffDays(rangeStart, rangeEnd));

  const today     = new Date();
  const todayLeft = Math.max(0, Math.min(100, (diffDays(rangeStart, today) / totalDays) * 100));
  const showToday = today >= rangeStart && today <= rangeEnd;

  // Generate month markers for the header
  const months: { label: string; left: number; width: number }[] = useMemo(() => {
    const result = [];
    const cur = new Date(rangeStart.getFullYear(), rangeStart.getMonth(), 1);
    while (cur <= rangeEnd) {
      const monthStart = new Date(Math.max(cur.getTime(), rangeStart.getTime()));
      const nextMonth  = new Date(cur.getFullYear(), cur.getMonth() + 1, 1);
      const monthEnd   = new Date(Math.min(nextMonth.getTime() - 86400000, rangeEnd.getTime()));
      const left  = Math.max(0, diffDays(rangeStart, monthStart) / totalDays * 100);
      const width = Math.max(0, (diffDays(monthStart, monthEnd) + 1) / totalDays * 100);
      result.push({ label: formatMonthYear(cur), left, width });
      cur.setMonth(cur.getMonth() + 1);
    }
    return result;
  }, [rangeFrom, rangeTo]);

  function barStyle(start: string, end: string) {
    if (!start || !end) return null;
    const s = parseDate(start);
    const e = parseDate(end);
    const left  = Math.max(0, diffDays(rangeStart, s) / totalDays * 100);
    const width = Math.max(0.5, diffDays(s, e) / totalDays * 100);
    if (left > 100 || left + width < 0) return null;
    return { left: `${left}%`, width: `${Math.min(width, 100 - left)}%` };
  }

  const toggleCollapse = (id: number) =>
    setCollapsed(prev => { const n = new Set(prev); n.has(id) ? n.delete(id) : n.add(id); return n; });

  const ROW_H = 44;
  const LEFT_W = 220;

  const inputCls = "rounded-xl border border-[#f0f0f5] bg-white text-[12px] font-medium outline-none focus:border-(--accent-purple) transition-colors";

  return (
    <div className="flex flex-col bg-white rounded-2xl border border-[#f0f0f5] shadow-sm overflow-hidden flex-1" style={{ minHeight: "0" }}>

      {/* Toolbar */}
      <div className="flex flex-wrap items-center justify-between border-b border-[#f0f0f5] bg-[#f8f8fc] shrink-0" style={{ padding: "14px 20px", gap: "12px" }}>
        <div className="flex items-center" style={{ gap: "6px" }}>
          <span className="text-[13px] font-bold text-(--text-primary)">From</span>
          <input type="date" value={rangeFrom} onChange={e => setRangeFrom(e.target.value)} className={inputCls} style={{ padding: "6px 10px" }} />
          <span className="text-[13px] font-bold text-(--text-primary)">To</span>
          <input type="date" value={rangeTo}   onChange={e => setRangeTo(e.target.value)}   className={inputCls} style={{ padding: "6px 10px" }} />
        </div>
        {showToday && (
          <div className="flex items-center text-[12px] font-bold" style={{ gap: "6px", color: "#33084E" }}>
            <span className="inline-block rounded-full" style={{ width: "8px", height: "8px", background: "#33084E" }} />
            Today: {formatDay(today)}
          </div>
        )}
      </div>

      {/* Gantt body — scrollable */}
      <div className="flex-1 overflow-auto" style={{ minHeight: "0" }}>
        <div style={{ minWidth: `${LEFT_W + 600}px` }}>

          {/* Header row */}
          <div className="flex sticky top-0 bg-[#f8f8fc] border-b border-[#f0f0f5] z-10" style={{ height: `${ROW_H}px` }}>
            {/* Left label column */}
            <div className="shrink-0 border-r border-[#f0f0f5] flex items-center" style={{ width: `${LEFT_W}px`, padding: "0 16px" }}>
              <span className="text-[11px] font-bold text-[#9ca3af] uppercase tracking-wider">Project / Task</span>
            </div>
            {/* Timeline header */}
            <div className="flex-1 relative overflow-hidden">
              {months.map((m, i) => (
                <div key={i} className="absolute flex items-center border-r border-[#f0f0f5]" style={{ left: `${m.left}%`, width: `${m.width}%`, top: 0, bottom: 0, padding: "0 8px" }}>
                  <span className="text-[11px] font-bold text-[#9ca3af] truncate">{m.label}</span>
                </div>
              ))}
            </div>
          </div>

          {/* Rows */}
          {projects.map(project => {
            const projectTasks = tasks.filter(t => t.project_id === project.id);
            const isCollapsed  = collapsed.has(project.id);
            const projBar      = barStyle(project.start_date, project.due_date);
            const cfg          = PROJECT_STATUS_CONFIG[project.status];

            return (
              <React.Fragment key={project.id}>
                {/* Project row */}
                <div
                  className="flex border-b border-[#f0f0f5] hover:bg-[#f8f8fc] transition-colors group"
                  style={{ height: `${ROW_H}px` }}
                >
                  <div
                    className="shrink-0 flex items-center border-r border-[#f0f0f5] cursor-pointer"
                    style={{ width: `${LEFT_W}px`, padding: "0 12px", gap: "6px" }}
                    onClick={() => toggleCollapse(project.id)}
                  >
                    <button className="text-[#9ca3af] shrink-0">
                      {isCollapsed ? <ChevronRight size={14} /> : <ChevronDown size={14} />}
                    </button>
                    <div className="rounded-sm shrink-0" style={{ width: "10px", height: "10px", background: cfg.color }} />
                    <span className="text-[13px] font-bold text-(--text-primary) truncate group-hover:text-(--accent-purple) transition-colors">
                      {project.name}
                    </span>
                  </div>

                  {/* Timeline cell */}
                  <div className="flex-1 relative" style={{ minWidth: "0" }}>
                    {/* Month grid lines */}
                    {months.map((m, i) => (
                      <div key={i} className="absolute top-0 bottom-0 border-r border-[#f0f0f5]" style={{ left: `${m.left + m.width}%` }} />
                    ))}
                    {/* Today line */}
                    {showToday && (
                      <div className="absolute top-0 bottom-0" style={{ left: `${todayLeft}%`, width: "1.5px", background: "#33084E", opacity: 0.5, zIndex: 2 }} />
                    )}
                    {/* Bar */}
                    {projBar && (
                      <div
                        className="absolute rounded-lg flex items-center"
                        style={{
                          top: "10px", height: "24px",
                          left: projBar.left, width: projBar.width,
                          background: cfg.color,
                          zIndex: 1,
                          padding: "0 8px",
                          overflow: "hidden",
                        }}
                        title={`${project.name}: ${project.start_date} → ${project.due_date}`}
                      >
                        <span className="text-white text-[11px] font-bold truncate">{project.name}</span>
                      </div>
                    )}
                  </div>
                </div>

                {/* Task rows */}
                {!isCollapsed && projectTasks.map(task => {
                  const taskBar  = barStyle(task.start_date, task.due_date);
                  const taskCfg  = TASK_STATUS_CONFIG[task.status];

                  return (
                    <div key={task.id} className="flex border-b border-[#f0f0f5] hover:bg-[#f8f8fc] transition-colors" style={{ height: `${ROW_H}px`, background: "rgba(248,248,252,0.5)" }}>
                      <div className="shrink-0 flex items-center border-r border-[#f0f0f5]" style={{ width: `${LEFT_W}px`, padding: "0 12px 0 30px", gap: "6px" }}>
                        <span className="rounded-full shrink-0" style={{ width: "6px", height: "6px", background: taskCfg.color }} />
                        <span className="text-[12px] font-semibold text-[#6b7280] truncate">{task.title}</span>
                      </div>

                      <div className="flex-1 relative" style={{ minWidth: "0" }}>
                        {months.map((m, i) => (
                          <div key={i} className="absolute top-0 bottom-0 border-r border-[#f0f0f5]" style={{ left: `${m.left + m.width}%` }} />
                        ))}
                        {showToday && (
                          <div className="absolute top-0 bottom-0" style={{ left: `${todayLeft}%`, width: "1.5px", background: "#33084E", opacity: 0.3, zIndex: 2 }} />
                        )}
                        {taskBar && (
                          <div
                            className="absolute rounded-md flex items-center"
                            style={{
                              top: "12px", height: "20px",
                              left: taskBar.left, width: taskBar.width,
                              background: taskCfg.bg,
                              border: `1.5px solid ${taskCfg.color}`,
                              zIndex: 1,
                              padding: "0 6px",
                              overflow: "hidden",
                            }}
                            title={`${task.title}: ${task.start_date} → ${task.due_date}`}
                          >
                            <span className="text-[10px] font-bold truncate" style={{ color: taskCfg.color }}>{task.title}</span>
                          </div>
                        )}
                      </div>
                    </div>
                  );
                })}
              </React.Fragment>
            );
          })}

          {projects.length === 0 && (
            <div className="flex items-center justify-center text-[13px] text-[#9ca3af]" style={{ height: "200px" }}>
              No projects to display on the timeline.
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
