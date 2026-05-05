"use client";

import React, { useState, useRef, useMemo } from "react";
import Link from "next/link";
import {
  AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip,
  ResponsiveContainer, PieChart, Pie, Cell,
} from "recharts";
import { useDashboardStats } from "./hooks/useDashboard";
import type { Lead as ApiLead, Attendance as ApiAttendance, DashboardStats } from "@/lib/types";
import { useTasks } from "../project/hooks/useProject";
import { useLeads } from "../crm/hooks/useCrm";
import { useAttendance } from "../attendance/hooks/useAttendance";
import {
  ArrowUpRight,
  MoreHorizontal, Target, TrendingUp, FolderUp,
  CheckCircle2, Clock, AlertCircle, ChevronRight,
  Calendar, ListTodo, Briefcase,
} from "lucide-react";
import { CustomSelect, SelectOption } from "@/components/ui/CustomSelect";
import { DashboardSkeleton } from "@/components/DashboardSkeleton";

// ─── Types ────────────────────────────────────────────────────────────────────

type Status = "present" | "absent" | "late";


function statusFromAttendance(row: ApiAttendance): Status {
  if (!row.signed_in_at) return "absent";
  const signIn = new Date(row.signed_in_at);
  const late = signIn.getHours() > 9 || (signIn.getHours() === 9 && signIn.getMinutes() > 15);
  return late ? "late" : "present";
}

function initials(name: string): string {
  return name
    .split(" ")
    .map((w) => w[0])
    .slice(0, 2)
    .join("")
    .toUpperCase();
}

// ─── Static data ──────────────────────────────────────────────────────────────


const taskBreakdownData = [
  { name: "Completed", value: 58, color: "#074616" },
  { name: "In Progress", value: 27, color: "#33084E" },
  { name: "Pending", value: 15, color: "#AF580B" },
];





// Pre-compute sparkData at module level so render never recreates these arrays
const metricDefs = [
  {
    label: "Total Leads",
    value: "1,284",
    change: "+12%",
    Icon: Target,
    grad: "#ffffff",
    gradId: "spark-purple",
    sparkData: [40, 55, 45, 65, 58, 72, 68, 85, 80, 92].map((v) => ({ v })),
    textColor: "#1a1a2e",
    sparkColor: "#33084E",
    badgeBg: "rgba(51,8,78,0.1)",
    badgeColor: "#33084E",
    iconBg: "rgba(51,8,78,0.08)",
    iconColor: "#33084E",
  },
  {
    label: "Leads This Week",
    value: "47",
    change: "+8%",
    Icon: TrendingUp,
    grad: "#0e0e0e",
    gradId: "spark-teal",
    sparkData: [20, 28, 22, 35, 30, 42, 38, 47, 51, 47].map((v) => ({ v })),
    textColor: "#ffffff",
    sparkColor: "rgba(255,255,255,0.8)",
    badgeBg: "rgba(255,255,255,0.15)",
    badgeColor: "#ffffff",
    iconBg: "rgba(255,255,255,0.12)",
    iconColor: "#ffffff",
  },
  {
    label: "Projects Uploaded",
    value: "36",
    change: "+3 this week",
    Icon: FolderUp,
    grad: "#ffffff",
    gradId: "spark-fire",
    sparkData: [10, 14, 12, 18, 15, 22, 20, 28, 32, 36].map((v) => ({ v })),
    textColor: "#1a1a2e",
    sparkColor: "#AF580B",
    badgeBg: "rgba(175,88,11,0.1)",
    badgeColor: "#AF580B",
    iconBg: "rgba(175,88,11,0.08)",
    iconColor: "#AF580B",
  },
];

const statusConfig: Record<Status, { label: string; color: string; Icon: React.ElementType }> = {
  present: { label: "Present", color: "#074616", Icon: CheckCircle2 },
  absent: { label: "Absent", color: "#ef4444", Icon: AlertCircle },
  late: { label: "Late", color: "#AF580B", Icon: Clock },
};

const TODAY = new Date().toLocaleDateString("en-US", { weekday: "long", month: "short", day: "numeric" });

// ─── Sub-components ───────────────────────────────────────────────────────────

interface PayloadItem {
  value: string | number;
  name: string;
  fill?: string;
  payload?: Record<string, unknown>;
}

interface TooltipProps {
  active?: boolean;
  payload?: PayloadItem[];
  label?: string;
}

function SparkTooltip({ active, payload }: TooltipProps) {
  if (!active || !payload?.length) return null;
  return (
    <div className="chart-tooltip-custom">
      <div className="chart-tooltip-value">{payload[0].value}</div>
    </div>
  );
}

function TaskTooltip({ active, payload }: TooltipProps) {
  if (!active || !payload?.length) return null;
  return (
    <div className="chart-tooltip-custom">
      <div className="chart-tooltip-label" style={{ marginBottom: 6 }}>{payload[0]?.payload?.day as string}</div>
      {payload.map((p: PayloadItem) => (
        <div key={p.name} className="chart-tooltip-row">
          <span className="chart-tooltip-dot" style={{ background: p.fill }} />
          {p.name}: <strong>{p.value as React.ReactNode}</strong>
        </div>
      ))}
    </div>
  );
}

function DonutTooltip({ active, payload }: TooltipProps) {
  if (!active || !payload?.length) return null;
  return (
    <div className="chart-tooltip-custom">
      <div className="chart-tooltip-label">{payload[0].name}</div>
      <div className="chart-tooltip-value">{payload[0].value}%</div>
    </div>
  );
}


function DatePicker({
  value,
  onChange,
}: {
  value: string;
  onChange: (v: string) => void;
}) {
  const inputRef = useRef<HTMLInputElement>(null);

  // Format date for display (e.g., "Apr 30, 2026")
  const displayDate = new Date(value).toLocaleDateString("en-US", {
    month: "short",
    day: "numeric",
    year: "numeric",
  });

  return (
    <div className="relative">
      <button
        onClick={() => inputRef.current?.showPicker()}
        className="flex items-center gap-2 px-4 py-2.5 rounded-xl bg-white hover:bg-slate-50 transition-all group"
      >
        <Calendar size={14} className="text-[var(--text-muted)] group-hover:text-[var(--accent-purple)]" />
        <span className="text-[13px] font-semibold text-[var(--text-primary)]">{displayDate}</span>
      </button>
      <input
        ref={inputRef}
        type="date"
        value={value}
        onChange={(e) => onChange(e.target.value)}
        className="absolute inset-0 opacity-0 cursor-pointer pointer-events-none"
      />
    </div>
  );
}

// ─── Main page ────────────────────────────────────────────────────────────────

export default function DashboardPage() {
  const { data: stats, isLoading: isStatsLoading } = useDashboardStats() as { data: DashboardStats | undefined, isLoading: boolean };
  const { data: tasksRaw, isLoading: tasksLoading } = useTasks({});
  const { data: leadsRaw, isLoading: leadsLoading } = useLeads({});
  const { data: attendanceRaw, isLoading: attLoading } = useAttendance({});

  const [activePipeline, setActivePipeline] = useState<string>("All Leads");
  const [activeDate, setActiveDate] = useState<string>(new Date().toISOString().split("T")[0]);

  const loading = isStatsLoading || tasksLoading || leadsLoading || attLoading;

  const weeklyData = useMemo(() => {
    const weeklySeed: { day: string; Completed: number; InProgress: number; Pending: number }[] = [
      { day: "Mon", Completed: 0, InProgress: 0, Pending: 0 },
      { day: "Tue", Completed: 0, InProgress: 0, Pending: 0 },
      { day: "Wed", Completed: 0, InProgress: 0, Pending: 0 },
      { day: "Thu", Completed: 0, InProgress: 0, Pending: 0 },
      { day: "Fri", Completed: 0, InProgress: 0, Pending: 0 },
      { day: "Sat", Completed: 0, InProgress: 0, Pending: 0 },
      { day: "Sun", Completed: 0, InProgress: 0, Pending: 0 },
    ];

    (tasksRaw || []).forEach((task) => {
      if (!task.due_date) return;
      const d = new Date(task.due_date).getDay();
      const dayIndex = d === 0 ? 6 : d - 1;
      if (task.status === "completed") weeklySeed[dayIndex].Completed += 1;
      else if (task.status === "in_progress") weeklySeed[dayIndex].InProgress += 1;
      else weeklySeed[dayIndex].Pending += 1;
    });
    return weeklySeed;
  }, [tasksRaw]);

  const dailyData = useMemo(() => {
    const iconByStatus = {
      completed: Briefcase,
      in_progress: Target,
      review: ListTodo,
      todo: Calendar,
    } as const;

    return (tasksRaw || [])
      .filter((t) => t.due_date === activeDate)
      .slice(0, 20)
      .map((t) => ({
        id: String(t.id),
        title: t.title,
        time: t.due_date ? new Date(`${t.due_date}T09:00:00`).toLocaleTimeString("en-US", { hour: "2-digit", minute: "2-digit" }) : "--",
        status: t.status === "in_progress" ? "in-progress" : t.status === "completed" ? "completed" : "pending",
        color: t.status === "completed" ? "#074616" : t.status === "in_progress" ? "#33084E" : "#AF580B",
        icon: iconByStatus[t.status as keyof typeof iconByStatus] || Calendar,
        date: t.due_date ?? activeDate,
      }));
  }, [tasksRaw, activeDate]);

  const crmLeadList = useMemo(() => {
    return (leadsRaw || []).map((l: ApiLead) => {
      const status = l.statusDefinition ?? l.status_definition;
      const fullName = `${l.first_name} ${l.last_name}`.trim();
      return {
        id: String(l.id),
        name: fullName,
        initials: initials(fullName),
        email: l.email,
        department: status?.name ?? "Unclassified",
        value: new Intl.NumberFormat("en-US", { style: "currency", currency: "USD", maximumFractionDigits: 0 }).format(Number(l.estimated_value ?? 0)),
        date: l.created_at?.split("T")[0] ?? "",
        score: 0,
        avatarColor: status?.color ?? "#33084E",
      };
    });
  }, [leadsRaw]);

  const attendanceList = useMemo(() => {
    return (attendanceRaw || [])
      .filter(row => row.date === activeDate)
      .map((row: ApiAttendance) => {
        const name = row.user?.name ?? `User #${row.user_id}`;
        return {
          name,
          initials: initials(name),
          role: "Team",
          status: statusFromAttendance(row),
        };
      });
  }, [attendanceRaw, activeDate]);

  const crmStatuses = useMemo(() => {
    const statusMap = new Map();
    (leadsRaw || []).forEach((l: ApiLead) => {
      const s = l.statusDefinition ?? l.status_definition;
      if (s && !statusMap.has(s.id)) statusMap.set(s.id, s);
    });
    return Array.from(statusMap.values());
  }, [leadsRaw]);
  const leads =
    activePipeline === "All Leads"
      ? crmLeadList
      : crmLeadList.filter((lead) => lead.department === activePipeline);
  const pipelineColor = crmStatuses.find(s => s.name === activePipeline)?.color ?? "#33084E";
  const totalAmount = leads.reduce((sum, lead) => {
    const numeric = Number(lead.value.replace(/[^0-9.]/g, ""));
    return Number.isFinite(numeric) && numeric > 0 ? sum + numeric : sum;
  }, 0);
  const amountLabel = totalAmount > 0 ? `$${totalAmount.toLocaleString()}` : "--";
  console.log(amountLabel); // Use it to avoid unused warning if not used elsewhere

  const pipelineSelectOptions: SelectOption[] = [
    { value: "All Leads", label: "All Leads", color: "#33084E" },
    ...crmStatuses.map((s) => ({ value: s.name, label: s.name, color: s.color })),
  ];

  // Single pass over attendanceData instead of three separate filters
  const { present: presentCount = 0, absent: absentCount = 0, late: lateCount = 0 } =
    attendanceList.reduce<Record<string, number>>((acc, p) => {
      acc[p.status] = (acc[p.status] ?? 0) + 1;
      return acc;
    }, {});

  // Live stats derived values
  const liveMetricValues = stats
    ? [
      stats.overview.leads_total.toLocaleString(),
      stats.monthly.new_leads.toLocaleString(),
      stats.overview.projects_total.toLocaleString(),
    ]
    : null;

  const totalTasks = stats?.overview.tasks_total ?? 0;
  const doneTasks = stats?.projects.completed_tasks ?? 0;
  const pendingTasks = stats?.projects.pending_tasks ?? 0;
  const donePct = totalTasks > 0 ? Math.round((doneTasks / totalTasks) * 100) : 0;
  const pendingPct = totalTasks > 0 ? Math.round((pendingTasks / totalTasks) * 100) : 0;

  const liveTaskBreakdown = stats
    ? [
      { name: "Completed", value: donePct, color: "#074616" },
      { name: "Pending", value: pendingPct, color: "#AF580B" },
    ]
    : taskBreakdownData;

  const livePresentCount = stats?.overview.attendance_today ?? presentCount;

  if (loading || isStatsLoading) {
    return <DashboardSkeleton />;
  }

  return (
    <div className="content-area">

      {/* ══ LEFT COLUMN ══════════════════════════════════════════════════════ */}
      <div className="content-main">

        {/* Key Metrics */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5 mb-2">
          {metricDefs.map((m, i) => (
            <div key={m.label} className="mhc-card" style={{ background: m.grad, border: "1px solid rgba(0,0,0,0.06)" }}>
              <div className="mhc-blob mhc-blob--a" />
              <div className="mhc-blob mhc-blob--b" />

              <div className="mhc-top flex justify-between">
                <div>
                  <div className="mhc-value" style={{ color: m.textColor }}>{liveMetricValues?.[i] ?? m.value}</div>
                  <div className="mhc-label" style={{ color: m.textColor, opacity: 0.55 }}>{m.label}</div>
                </div>
                <span className="mhc-badge" style={{ background: m.badgeBg, color: m.badgeColor }}>
                  <ArrowUpRight size={11} strokeWidth={3} />
                  {m.change}
                </span>
              </div>



              <div className="mhc-spark">
                <ResponsiveContainer width="100%" height={40}>
                  <AreaChart data={m.sparkData} margin={{ top: 4, right: 0, left: 0, bottom: 0 }}>
                    <defs>
                      <linearGradient id={m.gradId} x1="0" y1="0" x2="0" y2="1">
                        <stop offset="0%" stopColor={m.sparkColor} stopOpacity={0.25} />
                        <stop offset="100%" stopColor={m.sparkColor} stopOpacity={0} />
                      </linearGradient>
                    </defs>
                    <Area type="monotone" dataKey="v" stroke={m.sparkColor}
                      strokeWidth={2} fill={`url(#${m.gradId})`} dot={false} />
                    <Tooltip content={<SparkTooltip />} />
                  </AreaChart>
                </ResponsiveContainer>
              </div>
            </div>
          ))}
        </div>

        {/* Task Activity Layout Split */}
        <div className="grid grid-cols-1 lg:grid-cols-[2fr_1fr] gap-6">

          {/* Weekly Task Activity */}
          <div className="chart-card animate-fade-in-delay-2">
            <div className="chart-card-header flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 mb-5">
              <h2 className="chart-card-title">Weekly Task Activity</h2>
              <div className="chart-legend flex flex-wrap gap-3">
                {[["#074616", "Completed"], ["#33084E", "In Progress"], ["#AF580B", "Pending"]].map(([c, n]) => (
                  <span key={n} className="chart-legend-item flex items-center gap-1.5 whitespace-nowrap">
                    <span className="chart-legend-dot" style={{ background: c }} />
                    {n}
                  </span>
                ))}
              </div>
            </div>
            <ResponsiveContainer width="100%" height={200}>
              <AreaChart data={weeklyData} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f5" vertical={false} />
                <XAxis dataKey="day" axisLine={false} tickLine={false} tick={{ fontSize: 12, fill: "#9ca3af" }} dy={10} />
                <YAxis axisLine={false} tickLine={false} tick={{ fontSize: 12, fill: "#9ca3af" }} dx={-5} />
                <Tooltip content={<TaskTooltip />} cursor={{ stroke: "rgba(51,8,78,0.15)", strokeWidth: 10, fill: "none" }} />
                <Area type="monotone" dataKey="Completed" stroke="#074616" strokeWidth={2}
                  fill="transparent" fillOpacity={0} dot={false} activeDot={{ r: 4, fill: "#fff", stroke: "#074616", strokeWidth: 2 }} />
                <Area type="monotone" dataKey="InProgress" stroke="#33084E" strokeWidth={2}
                  fill="transparent" fillOpacity={0} dot={false} activeDot={{ r: 4, fill: "#fff", stroke: "#33084E", strokeWidth: 2 }} />
                <Area type="monotone" dataKey="Pending" stroke="#AF580B" strokeWidth={1.5}
                  fill="transparent" fillOpacity={0} dot={false} strokeDasharray="4 4" />
              </AreaChart>
            </ResponsiveContainer>
          </div>

          {/* Daily Task Activity */}
          <div className="chart-card flex flex-col gap-6 animate-fade-in-delay-2">
            <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
              <h2 className="text-base font-bold text-[var(--text-primary)]">Daily Tasks</h2>
              <div className="w-full sm:w-auto">
                <DatePicker value={activeDate} onChange={setActiveDate} />
              </div>
            </div>
            <div className="flex flex-col gap-3 flex-1 max-h-[300px] overflow-y-auto px-1 pb-2">
              {(() => {
                const tasks = dailyData.filter(t => t.date === activeDate);

                if (tasks.length === 0) {
                  return <div className="p-10 text-center text-[14px] text-[var(--text-muted)]">No tasks scheduled for this date</div>;
                }

                return tasks.map((task) => (
                  <div
                    key={task.id}
                    className="flex items-center justify-between p-[20px] rounded-2xl bg-white hover:bg-[#f8f8fc] transition-all cursor-pointer group"
                  >
                    <div className="flex items-center gap-4 min-w-0">
                      <div className="flex-1 flex flex-col gap-1 min-w-0">
                        <span className="text-[13px] font-medium text-[var(--text-primary)] truncate group-hover:text-[var(--accent-purple)] transition-colors">
                          {task.title}
                        </span>
                        <span className="text-[12px] font-medium text-[var(--text-muted)] flex items-center gap-1.5">
                          <Clock size={12} strokeWidth={2.5} />
                          {task.time}
                        </span>
                      </div>
                    </div>
                    <span className="px-3 py-1 rounded-full text-[11px] font-bold tracking-wide uppercase shrink-0 ml-3" style={{ background: `${task.color}15`, color: task.color }}>
                      {task.status.replace('-', ' ')}
                    </span>
                  </div>
                ));
              })()}
            </div>
          </div>
        </div>

        {/* CRM Pipeline */}
        <div className="crm-card">
          <div className="crm-header flex flex-col sm:flex-row items-start sm:items-end justify-between gap-4 sm:gap-0">
            <div>
              <h2 className="crm-title">CRM Pipeline</h2>
              <p className="crm-sub">
                <span
                  className="crm-stage-indicator"
                  style={{ background: `${pipelineColor}18`, color: pipelineColor }}
                >
                  <span className="crm-stage-dot" style={{ background: pipelineColor }} />
                  {activePipeline} · {leads.length} lead{leads.length !== 1 ? "s" : ""}
                </span>
              </p>
            </div>
            <div className="w-full sm:w-auto mt-3 sm:mt-0">
              <CustomSelect
                value={activePipeline}
                onChange={setActivePipeline}
                options={pipelineSelectOptions}
                searchPlaceholder="Search pipelines…"
              />
            </div>
          </div>

          {/* Leads Table */}
          <div className="crm-leads-table">
            <div className="crm-leads-thead">
              <span className="crm-th">Name</span>
              <span className="crm-th crm-th--hide-sm">Department</span>
              <span className="crm-th">Value</span>
              <span className="crm-th crm-th--hide-sm">Added</span>
              <span className="crm-th">Score</span>
            </div>
            <div className="crm-leads-body">
              {leads.length === 0 ? (
                <div className="crm-leads-empty">No leads in this stage</div>
              ) : (
                leads.map(lead => {
                  const scoreColor = lead.score >= 80 ? "#074616" : lead.score >= 60 ? "#AF580B" : "#ef4444";
                  return (
                    <div key={lead.id} className="crm-lead-row">
                      <div className="crm-lead-identity">
                        <div className="crm-lead-avatar" style={{ background: lead.avatarColor }}>
                          {lead.initials}
                        </div>
                        <div className="crm-lead-info">
                          <span className="crm-lead-name">{lead.name}</span>
                          <span className="crm-lead-email">{lead.email}</span>
                        </div>
                      </div>
                      <span className="crm-lead-dept crm-td--hide-sm">
                        <span className="crm-lead-dept-badge">{lead.department}</span>
                      </span>
                      <span className="crm-lead-value">{lead.value}</span>
                      <span className="crm-lead-date crm-td--hide-sm">{lead.date}</span>
                      <div className="crm-lead-score">
                        <div className="crm-lead-score-track">
                          <div
                            className="crm-lead-score-fill"
                            style={{ width: `${lead.score}%`, background: scoreColor }}
                          />
                        </div>
                        <span className="crm-lead-score-num" style={{ color: scoreColor }}>{lead.score}</span>
                      </div>
                    </div>
                  );
                })
              )}
            </div>
          </div>

          {/* <div className="crm-footer">
            <div className="crm-footer-stat">
              <span className="crm-footer-label">Total leads</span>
              <span className="crm-footer-val">{leads.length}</span>
            </div>
            <div className="crm-footer-stat">
              <span className="crm-footer-label">Amount</span>
              <span className="crm-footer-val" style={{ color: pipelineColor }}>
                {amountLabel}
              </span>
            </div>
            <div className="crm-footer-stat">
              <span className="crm-footer-label">Pipeline</span>
              <span className="crm-footer-val" style={{ color: pipelineColor, fontSize: 14 }}>
                {activePipeline}
              </span>
            </div>
          </div> */}
        </div>
      </div>

      {/* ══ RIGHT COLUMN ══════════════════════════════════════════════════════ */}
      <div className="content-sidebar">

        {/* Project Breakdown */}
        <div className="tbd-card">
          <div className="tbd-header">
            <h3 className="tbd-title">Project Breakdown</h3>
            <button className="more-btn"><MoreHorizontal size={18} /></button>
          </div>

          <div className="tbd-donut-wrap">
            <ResponsiveContainer width="100%" height={160}>
              <PieChart>
                <defs>
                  <filter id="donut-glow">
                    <feGaussianBlur stdDeviation="3" result="coloredBlur" />
                    <feMerge><feMergeNode in="coloredBlur" /><feMergeNode in="SourceGraphic" /></feMerge>
                  </filter>
                </defs>
                <Pie data={liveTaskBreakdown} cx="50%" cy="50%"
                  innerRadius={52} outerRadius={80}
                  dataKey="value" paddingAngle={4}
                  startAngle={90} endAngle={-270} stroke="none"
                >
                  {liveTaskBreakdown.map((entry, i) => (
                    <Cell key={i} fill={entry.color} filter="url(#donut-glow)" />
                  ))}
                </Pie>
                <Tooltip content={<DonutTooltip />} />
              </PieChart>
            </ResponsiveContainer>
            <div className="tbd-donut-center">
              <span className="tbd-donut-pct">{donePct}%</span>
              <span className="tbd-donut-sub">done</span>
            </div>
          </div>

          <div className="tbd-stats" style={{ gridTemplateColumns: `repeat(${liveTaskBreakdown.length}, 1fr)` }}>
            {liveTaskBreakdown.map((item) => (
              <div key={item.name} className="tbd-stat-row">
                <div className="tbd-stat-left">
                  <span className="tbd-stat-dot" style={{ background: item.color }} />
                  <span className="tbd-stat-name">{item.name}</span>
                </div>
                <div className="tbd-stat-right">
                  <div className="tbd-stat-track">
                    <div className="tbd-stat-fill" style={{ width: `${item.value}%`, background: item.color }} />
                  </div>
                  <span className="tbd-stat-pct" style={{ color: item.color }}>{item.value}%</span>
                </div>
              </div>
            ))}
          </div>

          <div className="tbd-footer">
            <span className="tbd-footer-label">Total tasks</span>
            <span className="tbd-footer-val">{totalTasks || "—"}</span>
          </div>
        </div>

        {/* Attendance Summary */}
        <div className="atd-sum-card animate-fade-in-delay-1">
          <div className="atd-sum-header">
            <div>
              <h3 className="atd-sum-title">Attendance Summary</h3>
              <p className="atd-sum-date">{TODAY}</p>
            </div>
            <Link href="/attendance" className="atd-sum-viewall">
              View All <ChevronRight size={13} />
            </Link>
          </div>

          <div className="atd-sum-stats">
            {[
              { num: livePresentCount, label: "Present", color: "#074616", bg: "rgba(7,70,22,0.08)" },
              { num: lateCount, label: "Late", color: "#AF580B", bg: "rgba(175,88,11,0.08)" },
              { num: absentCount, label: "Absent", color: "#ef4444", bg: "rgba(239,68,68,0.08)" },
            ].map(({ num, label, color, bg }) => (
              <div key={label} className="atd-sum-stat" style={{ color, background: bg }}>
                <span className="atd-sum-stat-num">{num}</span>
                <span className="atd-sum-stat-lbl">{label}</span>
              </div>
            ))}
          </div>

          <div className="atd-sum-bar">
            <div className="atd-sum-bar-seg" style={{ width: `${(livePresentCount / (livePresentCount + lateCount + absentCount || 1)) * 100}%`, background: "#074616" }} />
            <div className="atd-sum-bar-seg" style={{ width: `${(lateCount / (livePresentCount + lateCount + absentCount || 1)) * 100}%`, background: "#AF580B" }} />
            <div className="atd-sum-bar-seg" style={{ width: `${(absentCount / (livePresentCount + lateCount + absentCount || 1)) * 100}%`, background: "#ef4444" }} />
          </div>

          <div className="atd-sum-list">
            {attendanceList.map((person) => {
              const cfg = statusConfig[person.status];
              return (
                <div key={person.name} className="atd-sum-row">
                  <div className="atd-sum-avatar" style={{ boxShadow: `0 0 0 2.5px ${cfg.color}` }}>
                    {person.initials}
                  </div>
                  <div className="atd-sum-info">
                    <span className="atd-sum-name">{person.name}</span>
                    <span className="atd-sum-role">{person.role}</span>
                  </div>
                  <span className="atd-sum-badge" style={{ color: cfg.color, background: `${cfg.color}18` }}>
                    <cfg.Icon size={11} strokeWidth={2.5} />
                    {cfg.label}
                  </span>
                </div>
              );
            })}
          </div>
        </div>
      </div>
    </div>
  );
}
