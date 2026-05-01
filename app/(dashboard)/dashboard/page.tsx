"use client";

import React, { useState, useRef } from "react";
import Link from "next/link";
import {
  AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip,
  ResponsiveContainer, PieChart, Pie, Cell,
} from "recharts";
import {
  ArrowUpRight,
  MoreHorizontal, Target, TrendingUp, FolderUp,
  CheckCircle2, Clock, AlertCircle, ChevronRight,
  Calendar, ListTodo, Briefcase, Users,
} from "lucide-react";
import { CustomSelect, SelectOption } from "@/components/ui/CustomSelect";

// ─── Types ────────────────────────────────────────────────────────────────────

type Status = "present" | "absent" | "late";
type StageKey =
  | "Lead" | "Qualified" | "Proposal" | "Negotiation" | "Closed Won"
  | "Awareness" | "Interest" | "Consideration" | "Intent" | "Purchase"
  | "Open" | "In Review" | "Escalated" | "Resolved";

interface Lead {
  id: string;
  name: string;
  initials: string;
  email: string;
  department: string;
  value: string;
  date: string;
  score: number;
  avatarColor: string;
}

// ─── Static data ──────────────────────────────────────────────────────────────

const weeklyTaskData = [
  { day: "Mon", Completed: 8, InProgress: 5, Pending: 3 },
  { day: "Tue", Completed: 12, InProgress: 6, Pending: 4 },
  { day: "Wed", Completed: 7, InProgress: 4, Pending: 6 },
  { day: "Thu", Completed: 15, InProgress: 8, Pending: 2 },
  { day: "Fri", Completed: 10, InProgress: 7, Pending: 5 },
  { day: "Sat", Completed: 4, InProgress: 2, Pending: 1 },
  { day: "Sun", Completed: 2, InProgress: 1, Pending: 1 },
];

const taskBreakdownData = [
  { name: "Completed", value: 58, color: "#074616" },
  { name: "In Progress", value: 27, color: "#33084E" },
  { name: "Pending", value: 15, color: "#AF580B" },
];

const pipelineGroups: { label: string; color: string; stages: StageKey[] }[] = [
  { label: "Sales", color: "#33084E", stages: ["Lead", "Qualified", "Proposal", "Negotiation", "Closed Won"] },
  { label: "Marketing", color: "#0891b2", stages: ["Awareness", "Interest", "Consideration", "Intent", "Purchase"] },
  { label: "Support", color: "#059669", stages: ["Open", "In Review", "Escalated", "Resolved"] },
];

const stageColors: Record<StageKey, string> = {
  "Lead": "#33084E",
  "Qualified": "#33084E",
  "Proposal": "#33084E",
  "Negotiation": "#33084E",
  "Closed Won": "#074616",
  "Awareness": "#0891b2",
  "Interest": "#0e7490",
  "Consideration": "#06b6d4",
  "Intent": "#0284c7",
  "Purchase": "#074616",
  "Open": "#059669",
  "In Review": "#AF580B",
  "Escalated": "#ef4444",
  "Resolved": "#074616",
};

const leadsData: Record<StageKey, Lead[]> = {
  "Lead": [
    { id: "1", name: "Sarah Chen", initials: "SC", email: "sarah.chen@techcorp.io", department: "Engineering", value: "$12,400", date: "Apr 22", score: 72, avatarColor: "#33084E" },
    { id: "2", name: "Marcus Bell", initials: "MB", email: "m.bell@ventures.co", department: "Finance", value: "$8,200", date: "Apr 24", score: 58, avatarColor: "#0891b2" },
    { id: "3", name: "Priya Nair", initials: "PN", email: "priya@novadesign.com", department: "Design", value: "$15,600", date: "Apr 25", score: 81, avatarColor: "#059669" },
    { id: "4", name: "Jordan Wells", initials: "JW", email: "j.wells@globalops.net", department: "Operations", value: "$6,800", date: "Apr 27", score: 44, avatarColor: "#AF580B" },
  ],
  "Qualified": [
    { id: "5", name: "Elena Russo", initials: "ER", email: "e.russo@italiansol.eu", department: "Sales", value: "$22,000", date: "Apr 18", score: 85, avatarColor: "#33084E" },
    { id: "6", name: "Tyler Brooks", initials: "TB", email: "tbrooks@growthlab.io", department: "Marketing", value: "$18,500", date: "Apr 20", score: 79, avatarColor: "#ef4444" },
    { id: "7", name: "Mei Tanaka", initials: "MT", email: "m.tanaka@asiabridge.jp", department: "Business Dev", value: "$31,000", date: "Apr 21", score: 90, avatarColor: "#0891b2" },
  ],
  "Proposal": [
    { id: "8", name: "Ryan Okafor", initials: "RO", email: "r.okafor@continental.ng", department: "Procurement", value: "$45,200", date: "Apr 15", score: 88, avatarColor: "#059669" },
    { id: "9", name: "Hannah Levy", initials: "HL", email: "h.levy@innovex.us", department: "R&D", value: "$29,700", date: "Apr 17", score: 76, avatarColor: "#33084E" },
  ],
  "Negotiation": [
    { id: "10", name: "Dmitri Volkov", initials: "DV", email: "d.volkov@eastware.ru", department: "C-Suite", value: "$88,000", date: "Apr 10", score: 92, avatarColor: "#AF580B" },
    { id: "11", name: "Fatima Al-Hassan", initials: "FA", email: "f.alhassan@gulfco.ae", department: "Enterprise", value: "$120,000", date: "Apr 12", score: 95, avatarColor: "#ef4444" },
  ],
  "Closed Won": [
    { id: "12", name: "Chris Nguyen", initials: "CN", email: "cnguyen@cloudbase.io", department: "Engineering", value: "$54,000", date: "Apr 05", score: 100, avatarColor: "#074616" },
    { id: "13", name: "Amara Diallo", initials: "AD", email: "a.diallo@saheltech.ml", department: "Logistics", value: "$38,500", date: "Apr 08", score: 100, avatarColor: "#059669" },
    { id: "14", name: "Sofia Pereira", initials: "SP", email: "sofia@brazilsol.br", department: "Sales", value: "$72,000", date: "Apr 09", score: 100, avatarColor: "#33084E" },
  ],
  "Awareness": [
    { id: "15", name: "Lena Hoffman", initials: "LH", email: "l.hoffman@mediatop.de", department: "Media", value: "$3,200", date: "Apr 26", score: 30, avatarColor: "#0891b2" },
    { id: "16", name: "Victor Santos", initials: "VS", email: "vsantos@latamads.co", department: "Advertising", value: "$2,800", date: "Apr 27", score: 25, avatarColor: "#AF580B" },
    { id: "17", name: "Grace Kim", initials: "GK", email: "grace@koreacreative.kr", department: "Creative", value: "$4,100", date: "Apr 28", score: 35, avatarColor: "#33084E" },
    { id: "18", name: "Aiden Walsh", initials: "AW", email: "a.walsh@irishmarkets.ie", department: "Digital", value: "$1,900", date: "Apr 29", score: 20, avatarColor: "#059669" },
  ],
  "Interest": [
    { id: "19", name: "Yuki Sato", initials: "YS", email: "y.sato@tokyobrand.jp", department: "Branding", value: "$9,400", date: "Apr 22", score: 55, avatarColor: "#0891b2" },
    { id: "20", name: "Clara Osei", initials: "CO", email: "c.osei@accradigital.gh", department: "SEO", value: "$7,800", date: "Apr 23", score: 48, avatarColor: "#ef4444" },
  ],
  "Consideration": [
    { id: "21", name: "Max Fischer", initials: "MF", email: "m.fischer@berlintech.de", department: "Product", value: "$16,500", date: "Apr 18", score: 67, avatarColor: "#AF580B" },
    { id: "22", name: "Nadia Petrov", initials: "NP", email: "n.petrov@euromed.bg", department: "Healthcare", value: "$21,000", date: "Apr 19", score: 72, avatarColor: "#33084E" },
  ],
  "Intent": [
    { id: "23", name: "Samuel Park", initials: "SP", email: "s.park@seoulai.kr", department: "AI/ML", value: "$34,000", date: "Apr 14", score: 83, avatarColor: "#0891b2" },
  ],
  "Purchase": [
    { id: "24", name: "Isabelle Dupont", initials: "ID", email: "i.dupont@parisdigital.fr", department: "E-commerce", value: "$48,000", date: "Apr 06", score: 100, avatarColor: "#074616" },
    { id: "25", name: "Kwame Mensah", initials: "KM", email: "k.mensah@accratech.gh", department: "Fintech", value: "$26,500", date: "Apr 07", score: 100, avatarColor: "#059669" },
  ],
  "Open": [
    { id: "26", name: "Brett Collins", initials: "BC", email: "b.collins@supportco.au", department: "IT", value: "Ticket #1042", date: "Apr 28", score: 40, avatarColor: "#ef4444" },
    { id: "27", name: "Tanya Rivers", initials: "TR", email: "t.rivers@helpdeskpro.us", department: "HR", value: "Ticket #1043", date: "Apr 28", score: 30, avatarColor: "#0891b2" },
    { id: "28", name: "Oscar Jiménez", initials: "OJ", email: "o.jimenez@clientzone.mx", department: "Legal", value: "Ticket #1044", date: "Apr 29", score: 45, avatarColor: "#AF580B" },
  ],
  "In Review": [
    { id: "29", name: "Nina Blackwood", initials: "NB", email: "n.blackwood@techline.ca", department: "Engineering", value: "Ticket #1038", date: "Apr 25", score: 60, avatarColor: "#AF580B" },
    { id: "30", name: "Paulo Ferreira", initials: "PF", email: "p.ferreira@suporte.br", department: "Customer Success", value: "Ticket #1039", date: "Apr 26", score: 55, avatarColor: "#33084E" },
  ],
  "Escalated": [
    { id: "31", name: "Zara Ahmed", initials: "ZA", email: "z.ahmed@enterprise.pk", department: "C-Suite", value: "Ticket #1035", date: "Apr 22", score: 90, avatarColor: "#ef4444" },
  ],
  "Resolved": [
    { id: "32", name: "Tom Bergmann", initials: "TB", email: "t.bergmann@solved.de", department: "Finance", value: "Ticket #1030", date: "Apr 20", score: 100, avatarColor: "#074616" },
    { id: "33", name: "Lily Chen", initials: "LC", email: "l.chen@happy.hk", department: "Sales", value: "Ticket #1031", date: "Apr 21", score: 100, avatarColor: "#059669" },
    { id: "34", name: "Abe Kowalski", initials: "AK", email: "a.kowalski@support.pl", department: "Operations", value: "Ticket #1032", date: "Apr 22", score: 100, avatarColor: "#0891b2" },
  ],
};

const attendanceData: { name: string; initials: string; role: string; status: Status }[] = [
  { name: "Alice Johnson", initials: "AJ", role: "Engineering", status: "present" },
  { name: "Bob Smith", initials: "BS", role: "Design", status: "absent" },
  { name: "Clara Davis", initials: "CD", role: "Marketing", status: "present" },
  { name: "David Lee", initials: "DL", role: "Engineering", status: "late" },
  { name: "Eva Martinez", initials: "EM", role: "Sales", status: "present" },
];

const dailyTaskData = [
  { id: "1", title: "Review Q2 Marketing Deck", time: "09:00 AM", status: "completed", color: "#074616", icon: Briefcase, date: "2026-04-30" },
  { id: "10", title: "One-on-One with Sarah", time: "10:00 AM", status: "completed", color: "#074616", icon: Users, date: "2026-04-30" },
  { id: "2", title: "Client Onboarding Sync", time: "11:30 AM", status: "in-progress", color: "#33084E", icon: Users, date: "2026-04-30" },
  { id: "3", title: "Approve Budget Requests", time: "02:00 PM", status: "pending", color: "#AF580B", icon: ListTodo, date: "2026-04-30" },
  // { id: "4", title: "Engineering Standup", time: "04:15 PM", status: "pending", color: "#AF580B", icon: Users, date: "2026-04-30" },
  // { id: "9", title: "Update Security Policy", time: "05:30 PM", status: "pending", color: "#AF580B", icon: ListTodo, date: "2026-04-30" },
  // { id: "11", title: "Sprint Planning", time: "09:00 AM", status: "pending", color: "#AF580B", icon: Calendar, date: "2026-05-01" },
  { id: "5", title: "Design Review Session", time: "10:00 AM", status: "pending", color: "#AF580B", icon: Briefcase, date: "2026-05-01" },
  { id: "13", title: "Lunch with Investors", time: "12:30 PM", status: "pending", color: "#AF580B", icon: Briefcase, date: "2026-05-01" },
  { id: "12", title: "Code Review: Auth Module", time: "02:30 PM", status: "pending", color: "#AF580B", icon: ListTodo, date: "2026-05-01" },
  { id: "6", title: "Weekly All-Hands", time: "01:00 PM", status: "pending", color: "#AF580B", icon: Users, date: "2026-05-01" },
  { id: "7", title: "Vendor Negotiations", time: "09:30 AM", status: "pending", color: "#AF580B", icon: Briefcase, date: "2026-05-02" },
  { id: "14", title: "Draft Annual Report", time: "11:00 AM", status: "pending", color: "#AF580B", icon: Briefcase, date: "2026-05-02" },
  { id: "16", title: "Fix Sidebar Responsiveness", time: "01:30 PM", status: "pending", color: "#AF580B", icon: ListTodo, date: "2026-05-02" },
  { id: "8", title: "Product Launch Prep", time: "03:00 PM", status: "pending", color: "#AF580B", icon: Target, date: "2026-05-02" },
  { id: "15", title: "Database Migration Sync", time: "04:00 PM", status: "pending", color: "#AF580B", icon: Target, date: "2026-05-02" },
  { id: "17", title: "Quarterly Sales Review", time: "10:00 AM", status: "pending", color: "#AF580B", icon: TrendingUp, date: "2026-05-03" },
  { id: "18", title: "Team Building Session", time: "03:00 PM", status: "pending", color: "#AF580B", icon: Users, date: "2026-05-03" },
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

function SparkTooltip({ active, payload }: any) {
  if (!active || !payload?.length) return null;
  return (
    <div className="chart-tooltip-custom">
      <div className="chart-tooltip-value">{payload[0].value}</div>
    </div>
  );
}

function TaskTooltip({ active, payload }: any) {
  if (!active || !payload?.length) return null;
  return (
    <div className="chart-tooltip-custom">
      <div className="chart-tooltip-label" style={{ marginBottom: 6 }}>{payload[0]?.payload?.day}</div>
      {payload.map((p: any) => (
        <div key={p.name} className="chart-tooltip-row">
          <span className="chart-tooltip-dot" style={{ background: p.fill }} />
          {p.name}: <strong>{p.value}</strong>
        </div>
      ))}
    </div>
  );
}

function DonutTooltip({ active, payload }: any) {
  if (!active || !payload?.length) return null;
  return (
    <div className="chart-tooltip-custom">
      <div className="chart-tooltip-label">{payload[0].name}</div>
      <div className="chart-tooltip-value">{payload[0].value}%</div>
    </div>
  );
}

const pipelineSelectOptions: SelectOption[] = [
  { value: "All Leads", label: "All Leads", color: "#33084E" },
  ...pipelineGroups.map(g => ({ value: g.label, label: g.label, color: g.color })),
];

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
  const [activePipeline, setActivePipeline] = useState<string>("All Leads");
  const [activeDate, setActiveDate] = useState<string>(new Date().toISOString().split("T")[0]);
  const selectedGroup = pipelineGroups.find((g) => g.label === activePipeline);
  const leads =
    activePipeline === "All Leads"
      ? Object.values(leadsData).flat()
      : (selectedGroup?.stages ?? []).flatMap((stage) => leadsData[stage]);
  const pipelineColor = selectedGroup?.color ?? "#33084E";
  const totalAmount = leads.reduce((sum, lead) => {
    const numeric = Number(lead.value.replace(/[^0-9.]/g, ""));
    return Number.isFinite(numeric) && numeric > 0 ? sum + numeric : sum;
  }, 0);
  const amountLabel = totalAmount > 0 ? `$${totalAmount.toLocaleString()}` : "--";

  // Single pass over attendanceData instead of three separate filters
  const { present: presentCount = 0, absent: absentCount = 0, late: lateCount = 0 } =
    attendanceData.reduce<Record<string, number>>((acc, p) => {
      acc[p.status] = (acc[p.status] ?? 0) + 1;
      return acc;
    }, {});
  const total = attendanceData.length;

  return (
    <div className="content-area">

      {/* ══ LEFT COLUMN ══════════════════════════════════════════════════════ */}
      <div className="content-main">

        {/* Key Metrics */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5 mb-2">
          {metricDefs.map((m) => (
            <div key={m.label} className="mhc-card" style={{ background: m.grad, border: "1px solid rgba(0,0,0,0.06)" }}>
              <div className="mhc-blob mhc-blob--a" />
              <div className="mhc-blob mhc-blob--b" />

              <div className="mhc-top flex justify-between">
                {/* <div className="mhc-icon-wrap" style={{ background: m.iconBg, color: m.iconColor }}>
                  <m.Icon size={18} strokeWidth={2.2} />
                </div> */}
                <div>
                  <div className="mhc-value" style={{ color: m.textColor }}>{m.value}</div>
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
              <AreaChart data={weeklyTaskData} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
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
                const tasks = dailyTaskData.filter(t => t.date === activeDate);
                
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

        {/* Task Breakdown */}
        <div className="tbd-card">
          <div className="tbd-header">
            <h3 className="tbd-title">Task Breakdown</h3>
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
                <Pie data={taskBreakdownData} cx="50%" cy="50%"
                  innerRadius={52} outerRadius={80}
                  dataKey="value" paddingAngle={4}
                  startAngle={90} endAngle={-270} stroke="none"
                >
                  {taskBreakdownData.map((entry, i) => (
                    <Cell key={i} fill={entry.color} filter="url(#donut-glow)" />
                  ))}
                </Pie>
                <Tooltip content={<DonutTooltip />} />
              </PieChart>
            </ResponsiveContainer>
            <div className="tbd-donut-center">
              <span className="tbd-donut-pct">58%</span>
              <span className="tbd-donut-sub">done</span>
            </div>
          </div>

          <div className="tbd-stats">
            {taskBreakdownData.map((item) => (
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
            <span className="tbd-footer-label">Total tasks this sprint</span>
            <span className="tbd-footer-val">100</span>
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
              { num: presentCount, label: "Present", color: "#074616", bg: "rgba(7,70,22,0.08)" },
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
            <div className="atd-sum-bar-seg" style={{ width: `${(presentCount / total) * 100}%`, background: "#074616" }} />
            <div className="atd-sum-bar-seg" style={{ width: `${(lateCount / total) * 100}%`, background: "#AF580B" }} />
            <div className="atd-sum-bar-seg" style={{ width: `${(absentCount / total) * 100}%`, background: "#ef4444" }} />
          </div>

          <div className="atd-sum-list">
            {attendanceData.map((person) => {
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
