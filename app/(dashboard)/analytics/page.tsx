"use client";

import React, { useMemo } from "react";
import {
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer,
  AreaChart, Area, PieChart, Pie, Cell, LineChart, Line, Legend
} from "recharts";
import { 
  TrendingUp, Users, Briefcase, Target, Download, 
  Calendar, ArrowUpRight, ArrowDownRight, Filter
} from "lucide-react";
import { useAnalytics } from "./hooks/useAnalytics";
import { AnalyticsSkeleton } from "@/components/AnalyticsSkeleton";
import { toast } from "sonner";

// ─── Helpers & Config ─────────────────────────────────────────────────────────

const COLORS = ["#33084E", "#AF580B", "#074616", "#1d4ed8", "#ef4444"];

interface TooltipPayloadItem {
  name?: string;
  value?: number | string;
  color?: string;
  fill?: string;
}

const CustomTooltip = ({ active, payload, label }: { active?: boolean; payload?: TooltipPayloadItem[]; label?: string }) => {
  if (active && payload && payload.length) {
    return (
      <div className="bg-white border border-slate-100 p-3 rounded-xl shadow-xl">
        <p className="text-[12px] font-bold text-slate-400 mb-2">{label}</p>
        {payload.map((p: TooltipPayloadItem, i: number) => (
          <div key={i} className="flex items-center gap-2 text-[13px]">
            <div className="w-2 h-2 rounded-full" style={{ background: p.color || p.fill }} />
            <span className="font-medium text-slate-700">{p.name}:</span>
            <span className="font-bold text-slate-900">{p.value}</span>
          </div>
        ))}
      </div>
    );
  }
  return null;
};

// ─── Main Page ────────────────────────────────────────────────────────────────

export default function AnalyticsPage() {
  const { data: stats, isLoading, error } = useAnalytics();

  const crmData = useMemo(() => {
    if (!stats) return [];
    return [
      { name: "New Leads", value: stats.crm.new },
      { name: "Won", value: stats.crm.won },
      { name: "Lost", value: stats.crm.lost },
    ];
  }, [stats]);

  const taskData = useMemo(() => {
    if (!stats) return [];
    return [
      { name: "Completed", value: stats.projects.completed_tasks, fill: "#074616" },
      { name: "Pending", value: stats.projects.pending_tasks, fill: "#AF580B" },
    ];
  }, [stats]);

  // Mock historical data for trends
  const trendData = [
    { month: "Jan", leads: 45, projects: 12, attendance: 92 },
    { month: "Feb", leads: 52, projects: 15, attendance: 88 },
    { month: "Mar", leads: 48, projects: 18, attendance: 94 },
    { month: "Apr", leads: 61, projects: 22, attendance: 91 },
    { month: "May", leads: 55, projects: 20, attendance: 95 },
    { month: "Jun", leads: 67, projects: 25, attendance: 93 },
  ];

  if (isLoading) return <AnalyticsSkeleton />;

  if (error) {
    toast.error("Failed to load analytics data");
    return (
      <div className="flex flex-col items-center justify-center h-[calc(100vh-75px)]">
        <p className="text-slate-500">Error loading analytics. Please try again.</p>
      </div>
    );
  }

  return (
    <div className="flex flex-col w-full bg-[#f8f9fc] overflow-y-auto" style={{ height: "calc(100vh - 75px)", padding: "32px", gap: "24px" }}>
      
      {/* ── Header ────────────────────────────────────────────────────────────── */}
      <div className="flex flex-wrap items-start justify-between gap-4">
        <div className="flex flex-col gap-1">
          <h1 className="text-[24px] font-bold text-[#1a1a2e]">Analytics & Reports</h1>
          <p className="text-[14px] text-slate-500">Comprehensive overview of your enterprise performance.</p>
        </div>
        <div className="flex items-center gap-3">
          <button className="inline-flex items-center gap-2 px-4 py-2 rounded-xl border border-slate-200 bg-white text-[13px] font-semibold text-slate-600 hover:bg-slate-50 transition-all">
            <Filter size={14} /> Filters
          </button>
          <button className="inline-flex items-center gap-2 px-4 py-2 rounded-xl bg-[#33084E] text-[13px] font-semibold text-white hover:opacity-90 transition-all">
            <Download size={14} /> Export Report
          </button>
        </div>
      </div>

      {/* ── Key Metrics Grid ─────────────────────────────────────────────────── */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-5">
        {[
          { label: "Total Users", value: stats?.overview.users_total, change: "+12%", icon: <Users size={18} />, color: "#33084E", up: true },
          { label: "Active Projects", value: stats?.overview.projects_total, change: "+5%", icon: <Briefcase size={18} />, color: "#AF580B", up: true },
          { label: "Pipeline Value", value: `$${stats?.crm.pipeline_value.toLocaleString()}`, change: "+18%", icon: <Target size={18} />, color: "#074616", up: true },
          { label: "Conv. Rate", value: `${stats?.crm.conversion_rate}%`, change: "-2%", icon: <TrendingUp size={18} />, color: "#1d4ed8", up: false },
        ].map((m, i) => (
          <div key={i} className="bg-white p-5 rounded-2xl border border-slate-100 shadow-sm flex flex-col gap-3">
            <div className="flex items-center justify-between">
              <div className="w-10 h-10 rounded-xl flex items-center justify-center" style={{ background: `${m.color}10`, color: m.color }}>
                {m.icon}
              </div>
              <span className={`flex items-center gap-1 text-[12px] font-bold ${m.up ? "text-green-600" : "text-red-500"}`}>
                {m.up ? <ArrowUpRight size={14} /> : <ArrowDownRight size={14} />} {m.change}
              </span>
            </div>
            <div className="flex flex-col">
              <span className="text-[22px] font-bold text-[#1a1a2e]">{m.value}</span>
              <span className="text-[13px] font-medium text-slate-400">{m.label}</span>
            </div>
          </div>
        ))}
      </div>

      {/* ── Charts Row 1 ─────────────────────────────────────────────────────── */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 min-h-[350px]">
        {/* Growth Trend */}
        <div className="bg-white p-6 rounded-2xl border border-slate-100 shadow-sm flex flex-col gap-6">
          <div className="flex items-center justify-between">
            <h3 className="text-[16px] font-bold text-[#1a1a2e]">Growth Trends</h3>
            <div className="flex items-center gap-2">
              <div className="flex items-center gap-1.5">
                <div className="w-2 h-2 rounded-full bg-[#33084E]" />
                <span className="text-[11px] font-bold text-slate-400 uppercase">Leads</span>
              </div>
              <div className="flex items-center gap-1.5">
                <div className="w-2 h-2 rounded-full bg-[#AF580B]" />
                <span className="text-[11px] font-bold text-slate-400 uppercase">Projects</span>
              </div>
            </div>
          </div>
          <div className="flex-1">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={trendData}>
                <defs>
                  <linearGradient id="colorLeads" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#33084E" stopOpacity={0.1}/>
                    <stop offset="95%" stopColor="#33084E" stopOpacity={0}/>
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f0f0f5" />
                <XAxis dataKey="month" axisLine={false} tickLine={false} tick={{ fontSize: 12, fill: "#94a3b8" }} dy={10} />
                <YAxis axisLine={false} tickLine={false} tick={{ fontSize: 12, fill: "#94a3b8" }} />
                <Tooltip content={<CustomTooltip />} />
                <Area type="monotone" dataKey="leads" stroke="#33084E" strokeWidth={3} fillOpacity={1} fill="url(#colorLeads)" />
                <Area type="monotone" dataKey="projects" stroke="#AF580B" strokeWidth={3} fill="transparent" />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Task Distribution */}
        <div className="bg-white p-6 rounded-2xl border border-slate-100 shadow-sm flex flex-col gap-6">
          <h3 className="text-[16px] font-bold text-[#1a1a2e]">Task Distribution</h3>
          <div className="flex-1 flex flex-col md:flex-row items-center justify-around gap-8">
            <div className="relative w-[200px] h-[200px]">
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie
                    data={taskData}
                    cx="50%"
                    cy="50%"
                    innerRadius={60}
                    outerRadius={80}
                    paddingAngle={5}
                    dataKey="value"
                    stroke="none"
                  >
                    {taskData.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={entry.fill} />
                    ))}
                  </Pie>
                  <Tooltip content={<CustomTooltip />} />
                </PieChart>
              </ResponsiveContainer>
              <div className="absolute inset-0 flex flex-col items-center justify-center">
                <span className="text-[24px] font-bold text-[#1a1a2e]">{stats?.overview.tasks_total}</span>
                <span className="text-[11px] font-bold text-slate-400 uppercase tracking-tight">Total Tasks</span>
              </div>
            </div>
            <div className="flex flex-col gap-4">
              {taskData.map((t, i) => (
                <div key={i} className="flex items-center gap-4">
                  <div className="w-10 h-10 rounded-xl flex items-center justify-center" style={{ background: `${t.fill}10`, color: t.fill }}>
                    {t.name === "Completed" ? <CheckCircle2 size={18} /> : <Clock size={18} />}
                  </div>
                  <div className="flex flex-col">
                    <span className="text-[14px] font-bold text-[#1a1a2e]">{t.value}</span>
                    <span className="text-[12px] font-medium text-slate-400">{t.name}</span>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>

      {/* ── Charts Row 2 ─────────────────────────────────────────────────────── */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 min-h-[300px]">
        {/* CRM Pipeline */}
        <div className="lg:col-span-2 bg-white p-6 rounded-2xl border border-slate-100 shadow-sm flex flex-col gap-6">
          <h3 className="text-[16px] font-bold text-[#1a1a2e]">CRM Funnel Performance</h3>
          <div className="flex-1">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={crmData} layout="vertical" margin={{ left: 40 }}>
                <CartesianGrid strokeDasharray="3 3" horizontal={true} vertical={false} stroke="#f0f0f5" />
                <XAxis type="number" hide />
                <YAxis dataKey="name" type="category" axisLine={false} tickLine={false} tick={{ fontSize: 12, fontWeight: 600, fill: "#1a1a2e" }} />
                <Tooltip content={<CustomTooltip />} cursor={{ fill: "#f8f9fc" }} />
                <Bar dataKey="value" radius={[0, 8, 8, 0]} barSize={32}>
                  {crmData.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                  ))}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Attendance Score */}
        <div className="bg-white p-6 rounded-2xl border border-slate-100 shadow-sm flex flex-col gap-6">
          <h3 className="text-[16px] font-bold text-[#1a1a2e]">Punctuality Rate</h3>
          <div className="flex-1 flex flex-col items-center justify-center gap-6">
            <div className="w-32 h-32 rounded-full border-[10px] border-slate-50 flex items-center justify-center relative">
              <svg className="absolute inset-0 w-full h-full -rotate-90">
                <circle
                  cx="64"
                  cy="64"
                  r="57"
                  fill="none"
                  stroke="#33084E"
                  strokeWidth="10"
                  strokeDasharray={`${2 * Math.PI * 57}`}
                  strokeDashoffset={`${2 * Math.PI * 57 * (1 - 0.85)}`}
                  strokeLinecap="round"
                />
              </svg>
              <div className="flex flex-col items-center">
                <span className="text-[28px] font-bold text-[#33084E]">85%</span>
                <span className="text-[10px] font-bold text-slate-400 uppercase">On Time</span>
              </div>
            </div>
            <div className="flex flex-col w-full gap-3">
              <div className="flex items-center justify-between text-[13px]">
                <span className="text-slate-500 font-medium">Present Today</span>
                <span className="font-bold text-[#1a1a2e]">{stats?.overview.attendance_today} users</span>
              </div>
              <div className="w-full h-2 bg-slate-50 rounded-full overflow-hidden">
                <div className="h-full bg-[#33084E]" style={{ width: "85%" }} />
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

// Additional icons for the UI
const CheckCircle2 = ({ size, ...props }: { size?: number } & React.SVGProps<SVGSVGElement>) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" {...props}>
    <circle cx="12" cy="12" r="10" />
    <path d="m9 12 2 2 4-4" />
  </svg>
);

const Clock = ({ size, ...props }: { size?: number } & React.SVGProps<SVGSVGElement>) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" {...props}>
    <circle cx="12" cy="12" r="10" />
    <polyline points="12 6 12 12 16 14" />
  </svg>
);
