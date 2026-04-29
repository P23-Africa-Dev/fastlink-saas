"use client";

import React, { useState, useRef, useEffect } from "react";
import Link from "next/link";
import {
  AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip,
  ResponsiveContainer, PieChart, Pie, Cell,
} from "recharts";
import {
  ArrowUpRight, ChevronDown, Search, Check,
  MoreHorizontal, Target, TrendingUp, FolderUp,
  CheckCircle2, Clock, AlertCircle, ChevronRight,
} from "lucide-react";

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
  { day: "Mon", Completed: 8,  InProgress: 5, Pending: 3 },
  { day: "Tue", Completed: 12, InProgress: 6, Pending: 4 },
  { day: "Wed", Completed: 7,  InProgress: 4, Pending: 6 },
  { day: "Thu", Completed: 15, InProgress: 8, Pending: 2 },
  { day: "Fri", Completed: 10, InProgress: 7, Pending: 5 },
  { day: "Sat", Completed: 4,  InProgress: 2, Pending: 1 },
  { day: "Sun", Completed: 2,  InProgress: 1, Pending: 1 },
];

const taskBreakdownData = [
  { name: "Completed",   value: 58, color: "#074616" },
  { name: "In Progress", value: 27, color: "#33084E" },
  { name: "Pending",     value: 15, color: "#AF580B" },
];

const pipelineGroups: { label: string; color: string; stages: StageKey[] }[] = [
  { label: "Sales",     color: "#33084E", stages: ["Lead", "Qualified", "Proposal", "Negotiation", "Closed Won"] },
  { label: "Marketing", color: "#0891b2", stages: ["Awareness", "Interest", "Consideration", "Intent", "Purchase"] },
  { label: "Support",   color: "#059669", stages: ["Open", "In Review", "Escalated", "Resolved"] },
];

const stageColors: Record<StageKey, string> = {
  "Lead":          "#33084E",
  "Qualified":     "#33084E",
  "Proposal":      "#33084E",
  "Negotiation":   "#33084E",
  "Closed Won":    "#074616",
  "Awareness":     "#0891b2",
  "Interest":      "#0e7490",
  "Consideration": "#06b6d4",
  "Intent":        "#0284c7",
  "Purchase":      "#074616",
  "Open":          "#059669",
  "In Review":     "#AF580B",
  "Escalated":     "#ef4444",
  "Resolved":      "#074616",
};

const leadsData: Record<StageKey, Lead[]> = {
  "Lead": [
    { id: "1",  name: "Sarah Chen",       initials: "SC", email: "sarah.chen@techcorp.io",      department: "Engineering",      value: "$12,400",      date: "Apr 22", score: 72,  avatarColor: "#33084E" },
    { id: "2",  name: "Marcus Bell",      initials: "MB", email: "m.bell@ventures.co",          department: "Finance",          value: "$8,200",       date: "Apr 24", score: 58,  avatarColor: "#0891b2" },
    { id: "3",  name: "Priya Nair",       initials: "PN", email: "priya@novadesign.com",        department: "Design",           value: "$15,600",      date: "Apr 25", score: 81,  avatarColor: "#059669" },
    { id: "4",  name: "Jordan Wells",     initials: "JW", email: "j.wells@globalops.net",       department: "Operations",       value: "$6,800",       date: "Apr 27", score: 44,  avatarColor: "#AF580B" },
  ],
  "Qualified": [
    { id: "5",  name: "Elena Russo",      initials: "ER", email: "e.russo@italiansol.eu",       department: "Sales",            value: "$22,000",      date: "Apr 18", score: 85,  avatarColor: "#33084E" },
    { id: "6",  name: "Tyler Brooks",     initials: "TB", email: "tbrooks@growthlab.io",        department: "Marketing",        value: "$18,500",      date: "Apr 20", score: 79,  avatarColor: "#ef4444" },
    { id: "7",  name: "Mei Tanaka",       initials: "MT", email: "m.tanaka@asiabridge.jp",      department: "Business Dev",     value: "$31,000",      date: "Apr 21", score: 90,  avatarColor: "#0891b2" },
  ],
  "Proposal": [
    { id: "8",  name: "Ryan Okafor",      initials: "RO", email: "r.okafor@continental.ng",     department: "Procurement",      value: "$45,200",      date: "Apr 15", score: 88,  avatarColor: "#059669" },
    { id: "9",  name: "Hannah Levy",      initials: "HL", email: "h.levy@innovex.us",           department: "R&D",              value: "$29,700",      date: "Apr 17", score: 76,  avatarColor: "#33084E" },
  ],
  "Negotiation": [
    { id: "10", name: "Dmitri Volkov",    initials: "DV", email: "d.volkov@eastware.ru",        department: "C-Suite",          value: "$88,000",      date: "Apr 10", score: 92,  avatarColor: "#AF580B" },
    { id: "11", name: "Fatima Al-Hassan", initials: "FA", email: "f.alhassan@gulfco.ae",        department: "Enterprise",       value: "$120,000",     date: "Apr 12", score: 95,  avatarColor: "#ef4444" },
  ],
  "Closed Won": [
    { id: "12", name: "Chris Nguyen",     initials: "CN", email: "cnguyen@cloudbase.io",        department: "Engineering",      value: "$54,000",      date: "Apr 05", score: 100, avatarColor: "#074616" },
    { id: "13", name: "Amara Diallo",     initials: "AD", email: "a.diallo@saheltech.ml",       department: "Logistics",        value: "$38,500",      date: "Apr 08", score: 100, avatarColor: "#059669" },
    { id: "14", name: "Sofia Pereira",    initials: "SP", email: "sofia@brazilsol.br",          department: "Sales",            value: "$72,000",      date: "Apr 09", score: 100, avatarColor: "#33084E" },
  ],
  "Awareness": [
    { id: "15", name: "Lena Hoffman",     initials: "LH", email: "l.hoffman@mediatop.de",       department: "Media",            value: "$3,200",       date: "Apr 26", score: 30,  avatarColor: "#0891b2" },
    { id: "16", name: "Victor Santos",    initials: "VS", email: "vsantos@latamads.co",         department: "Advertising",      value: "$2,800",       date: "Apr 27", score: 25,  avatarColor: "#AF580B" },
    { id: "17", name: "Grace Kim",        initials: "GK", email: "grace@koreacreative.kr",      department: "Creative",         value: "$4,100",       date: "Apr 28", score: 35,  avatarColor: "#33084E" },
    { id: "18", name: "Aiden Walsh",      initials: "AW", email: "a.walsh@irishmarkets.ie",     department: "Digital",          value: "$1,900",       date: "Apr 29", score: 20,  avatarColor: "#059669" },
  ],
  "Interest": [
    { id: "19", name: "Yuki Sato",        initials: "YS", email: "y.sato@tokyobrand.jp",        department: "Branding",         value: "$9,400",       date: "Apr 22", score: 55,  avatarColor: "#0891b2" },
    { id: "20", name: "Clara Osei",       initials: "CO", email: "c.osei@accradigital.gh",      department: "SEO",              value: "$7,800",       date: "Apr 23", score: 48,  avatarColor: "#ef4444" },
  ],
  "Consideration": [
    { id: "21", name: "Max Fischer",      initials: "MF", email: "m.fischer@berlintech.de",     department: "Product",          value: "$16,500",      date: "Apr 18", score: 67,  avatarColor: "#AF580B" },
    { id: "22", name: "Nadia Petrov",     initials: "NP", email: "n.petrov@euromed.bg",         department: "Healthcare",       value: "$21,000",      date: "Apr 19", score: 72,  avatarColor: "#33084E" },
  ],
  "Intent": [
    { id: "23", name: "Samuel Park",      initials: "SP", email: "s.park@seoulai.kr",           department: "AI/ML",            value: "$34,000",      date: "Apr 14", score: 83,  avatarColor: "#0891b2" },
  ],
  "Purchase": [
    { id: "24", name: "Isabelle Dupont",  initials: "ID", email: "i.dupont@parisdigital.fr",    department: "E-commerce",       value: "$48,000",      date: "Apr 06", score: 100, avatarColor: "#074616" },
    { id: "25", name: "Kwame Mensah",     initials: "KM", email: "k.mensah@accratech.gh",       department: "Fintech",          value: "$26,500",      date: "Apr 07", score: 100, avatarColor: "#059669" },
  ],
  "Open": [
    { id: "26", name: "Brett Collins",    initials: "BC", email: "b.collins@supportco.au",      department: "IT",               value: "Ticket #1042", date: "Apr 28", score: 40,  avatarColor: "#ef4444" },
    { id: "27", name: "Tanya Rivers",     initials: "TR", email: "t.rivers@helpdeskpro.us",     department: "HR",               value: "Ticket #1043", date: "Apr 28", score: 30,  avatarColor: "#0891b2" },
    { id: "28", name: "Oscar Jiménez",    initials: "OJ", email: "o.jimenez@clientzone.mx",     department: "Legal",            value: "Ticket #1044", date: "Apr 29", score: 45,  avatarColor: "#AF580B" },
  ],
  "In Review": [
    { id: "29", name: "Nina Blackwood",   initials: "NB", email: "n.blackwood@techline.ca",     department: "Engineering",      value: "Ticket #1038", date: "Apr 25", score: 60,  avatarColor: "#AF580B" },
    { id: "30", name: "Paulo Ferreira",   initials: "PF", email: "p.ferreira@suporte.br",       department: "Customer Success", value: "Ticket #1039", date: "Apr 26", score: 55,  avatarColor: "#33084E" },
  ],
  "Escalated": [
    { id: "31", name: "Zara Ahmed",       initials: "ZA", email: "z.ahmed@enterprise.pk",       department: "C-Suite",          value: "Ticket #1035", date: "Apr 22", score: 90,  avatarColor: "#ef4444" },
  ],
  "Resolved": [
    { id: "32", name: "Tom Bergmann",     initials: "TB", email: "t.bergmann@solved.de",        department: "Finance",          value: "Ticket #1030", date: "Apr 20", score: 100, avatarColor: "#074616" },
    { id: "33", name: "Lily Chen",        initials: "LC", email: "l.chen@happy.hk",             department: "Sales",            value: "Ticket #1031", date: "Apr 21", score: 100, avatarColor: "#059669" },
    { id: "34", name: "Abe Kowalski",     initials: "AK", email: "a.kowalski@support.pl",       department: "Operations",       value: "Ticket #1032", date: "Apr 22", score: 100, avatarColor: "#0891b2" },
  ],
};

const attendanceData: { name: string; initials: string; role: string; status: Status }[] = [
  { name: "Alice Johnson", initials: "AJ", role: "Engineering", status: "present" },
  { name: "Bob Smith",     initials: "BS", role: "Design",      status: "absent"  },
  { name: "Clara Davis",   initials: "CD", role: "Marketing",   status: "present" },
  { name: "David Lee",     initials: "DL", role: "Engineering", status: "late"    },
  { name: "Eva Martinez",  initials: "EM", role: "Sales",       status: "present" },
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
  absent:  { label: "Absent",  color: "#ef4444", Icon: AlertCircle  },
  late:    { label: "Late",    color: "#AF580B", Icon: Clock        },
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
          <span className="chart-tooltip-dot" style={{ background: p.fill }}/>
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

function PipelineSelect({ value, onChange }: { value: StageKey; onChange: (v: StageKey) => void }) {
  const [open, setOpen] = useState(false);
  const [search, setSearch] = useState("");
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    function handler(e: MouseEvent) {
      if (ref.current && !ref.current.contains(e.target as Node)) {
        setOpen(false);
        setSearch("");
      }
    }
    document.addEventListener("mousedown", handler);
    return () => document.removeEventListener("mousedown", handler);
  }, []);

  const q = search.toLowerCase();
  const filtered = pipelineGroups
    .map(g => ({ ...g, stages: g.stages.filter(s => s.toLowerCase().includes(q)) }))
    .filter(g => g.stages.length > 0);

  return (
    <div className="crm-select-wrap" ref={ref}>
      <button className="crm-select-trigger" onClick={() => setOpen(v => !v)}>
        <span className="crm-select-label">Pipeline</span>
        <span className="crm-select-value">{value}</span>
        <ChevronDown
          size={14}
          className="crm-select-chevron"
          style={{ transform: open ? "rotate(180deg)" : "rotate(0deg)", transition: "transform 0.2s ease" }}
        />
      </button>

      {open && (
        <div className="crm-select-dropdown">
          <div className="crm-select-search">
            <Search size={13} />
            <input
              autoFocus
              placeholder="Search stages…"
              value={search}
              onChange={e => setSearch(e.target.value)}
            />
          </div>
          <div className="crm-select-list">
            {filtered.length === 0 ? (
              <div className="crm-select-empty">No stages found</div>
            ) : (
              filtered.map(group => (
                <div key={group.label}>
                  <div className="crm-select-group-label" style={{ color: group.color }}>
                    {group.label}
                  </div>
                  {group.stages.map(stage => (
                    <button
                      key={stage}
                      className={`crm-select-option ${stage === value ? "crm-select-option--active" : ""}`}
                      onClick={() => { onChange(stage); setOpen(false); setSearch(""); }}
                    >
                      <span className="crm-select-option-dot" style={{ background: stageColors[stage] }} />
                      {stage}
                      {stage === value && <Check size={13} className="crm-select-check" />}
                    </button>
                  ))}
                </div>
              ))
            )}
          </div>
        </div>
      )}
    </div>
  );
}

// ─── Main page ────────────────────────────────────────────────────────────────

export default function DashboardPage() {
  const [activeStage, setActiveStage] = useState<StageKey>("Lead");

  const leads = leadsData[activeStage];
  const stageGroup = pipelineGroups.find(g => g.stages.includes(activeStage))!;
  const avgScore = leads.length > 0
    ? Math.round(leads.reduce((s, l) => s + l.score, 0) / leads.length)
    : 0;

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
        <div className="mhc-row">
          {metricDefs.map((m) => (
            <div key={m.label} className="mhc-card" style={{ background: m.grad, border: "1px solid rgba(0,0,0,0.06)" }}>
              <div className="mhc-blob mhc-blob--a" />
              <div className="mhc-blob mhc-blob--b" />

              <div className="mhc-top">
                <div className="mhc-icon-wrap" style={{ background: m.iconBg, color: m.iconColor }}>
                  <m.Icon size={18} strokeWidth={2.2} />
                </div>
                <span className="mhc-badge" style={{ background: m.badgeBg, color: m.badgeColor }}>
                  <ArrowUpRight size={11} strokeWidth={3} />
                  {m.change}
                </span>
              </div>

              <div className="mhc-value" style={{ color: m.textColor }}>{m.value}</div>
              <div className="mhc-label" style={{ color: m.textColor, opacity: 0.55 }}>{m.label}</div>

              <div className="mhc-spark">
                <ResponsiveContainer width="100%" height={52}>
                  <AreaChart data={m.sparkData} margin={{ top: 4, right: 0, left: 0, bottom: 0 }}>
                    <defs>
                      <linearGradient id={m.gradId} x1="0" y1="0" x2="0" y2="1">
                        <stop offset="0%"   stopColor={m.sparkColor} stopOpacity={0.25} />
                        <stop offset="100%" stopColor={m.sparkColor} stopOpacity={0}    />
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

        {/* Weekly Task Activity */}
        <div className="chart-card animate-fade-in-delay-2">
          <div className="chart-card-header">
            <h2 className="chart-card-title">Weekly Task Activity</h2>
            <div className="chart-legend">
              {[["#074616","Completed"],["#33084E","In Progress"],["#AF580B","Pending"]].map(([c,n]) => (
                <span key={n} className="chart-legend-item">
                  <span className="chart-legend-dot" style={{ background: c }}/>
                  {n}
                </span>
              ))}
            </div>
          </div>
          <ResponsiveContainer width="100%" height={240}>
            <AreaChart data={weeklyTaskData} margin={{ top:10, right:10, left:-20, bottom:0 }}>
              <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f5" vertical={false}/>
              <XAxis dataKey="day" axisLine={false} tickLine={false} tick={{ fontSize:12, fill:"#9ca3af" }} dy={10}/>
              <YAxis axisLine={false} tickLine={false} tick={{ fontSize:12, fill:"#9ca3af" }} dx={-5}/>
              <Tooltip content={<TaskTooltip />} cursor={{ stroke:"rgba(51,8,78,0.15)", strokeWidth:10, fill:"none" }}/>
              <Area type="monotone" dataKey="Completed" stroke="#074616" strokeWidth={2}
                fill="#074616" fillOpacity={0.12} dot={false} activeDot={{ r:4, fill:"#fff", stroke:"#074616", strokeWidth:2 }}/>
              <Area type="monotone" dataKey="InProgress" stroke="#33084E" strokeWidth={2}
                fill="#33084E" fillOpacity={0.1} dot={false} activeDot={{ r:4, fill:"#fff", stroke:"#33084E", strokeWidth:2 }}/>
              <Area type="monotone" dataKey="Pending" stroke="#AF580B" strokeWidth={1.5}
                fill="#AF580B" fillOpacity={0.08} dot={false} strokeDasharray="4 4"/>
            </AreaChart>
          </ResponsiveContainer>
        </div>

        {/* CRM Pipeline */}
        <div className="crm-card">
          <div className="crm-header">
            <div>
              <h2 className="crm-title">CRM Pipeline</h2>
              <p className="crm-sub">
                <span
                  className="crm-stage-indicator"
                  style={{ background: `${stageColors[activeStage]}18`, color: stageColors[activeStage] }}
                >
                  <span className="crm-stage-dot" style={{ background: stageColors[activeStage] }} />
                  {stageGroup.label} · {leads.length} lead{leads.length !== 1 ? "s" : ""}
                </span>
              </p>
            </div>
            <PipelineSelect value={activeStage} onChange={setActiveStage} />
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

          <div className="crm-footer">
            <div className="crm-footer-stat">
              <span className="crm-footer-label">In stage</span>
              <span className="crm-footer-val">{leads.length}</span>
            </div>
            <div className="crm-footer-stat">
              <span className="crm-footer-label">Avg score</span>
              <span className="crm-footer-val" style={{ color: avgScore >= 80 ? "#074616" : avgScore >= 60 ? "#AF580B" : "#ef4444" }}>
                {avgScore}
              </span>
            </div>
            <div className="crm-footer-stat">
              <span className="crm-footer-label">Category</span>
              <span className="crm-footer-val" style={{ color: stageGroup.color, fontSize: 14 }}>
                {stageGroup.label}
              </span>
            </div>
          </div>
        </div>
      </div>

      {/* ══ RIGHT COLUMN ══════════════════════════════════════════════════════ */}
      <div className="content-sidebar">

        {/* Task Breakdown */}
        <div className="tbd-card">
          <div className="tbd-header">
            <h3 className="tbd-title">Task Breakdown</h3>
            <button className="more-btn"><MoreHorizontal size={18}/></button>
          </div>

          <div className="tbd-donut-wrap">
            <ResponsiveContainer width="100%" height={190}>
              <PieChart>
                <defs>
                  <filter id="donut-glow">
                    <feGaussianBlur stdDeviation="3" result="coloredBlur"/>
                    <feMerge><feMergeNode in="coloredBlur"/><feMergeNode in="SourceGraphic"/></feMerge>
                  </filter>
                </defs>
                <Pie data={taskBreakdownData} cx="50%" cy="50%"
                  innerRadius={52} outerRadius={80}
                  dataKey="value" paddingAngle={4}
                  startAngle={90} endAngle={-270} stroke="none"
                >
                  {taskBreakdownData.map((entry, i) => (
                    <Cell key={i} fill={entry.color} filter="url(#donut-glow)"/>
                  ))}
                </Pie>
                <Tooltip content={<DonutTooltip/>}/>
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
                  <span className="tbd-stat-dot" style={{ background: item.color }}/>
                  <span className="tbd-stat-name">{item.name}</span>
                </div>
                <div className="tbd-stat-right">
                  <div className="tbd-stat-track">
                    <div className="tbd-stat-fill" style={{ width:`${item.value}%`, background: item.color }}/>
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
              View All <ChevronRight size={13}/>
            </Link>
          </div>

          <div className="atd-sum-stats">
            {[
              { num: presentCount, label: "Present", color: "#074616", bg: "rgba(7,70,22,0.08)"  },
              { num: lateCount,    label: "Late",    color: "#AF580B", bg: "rgba(175,88,11,0.08)" },
              { num: absentCount,  label: "Absent",  color: "#ef4444", bg: "rgba(239,68,68,0.08)"  },
            ].map(({ num, label, color, bg }) => (
              <div key={label} className="atd-sum-stat" style={{ color, background: bg }}>
                <span className="atd-sum-stat-num">{num}</span>
                <span className="atd-sum-stat-lbl">{label}</span>
              </div>
            ))}
          </div>

          <div className="atd-sum-bar">
            <div className="atd-sum-bar-seg" style={{ width:`${(presentCount/total)*100}%`, background:"#074616" }}/>
            <div className="atd-sum-bar-seg" style={{ width:`${(lateCount/total)*100}%`,    background:"#AF580B" }}/>
            <div className="atd-sum-bar-seg" style={{ width:`${(absentCount/total)*100}%`,  background:"#ef4444" }}/>
          </div>

          <div className="atd-sum-list">
            {attendanceData.map((person) => {
              const cfg = statusConfig[person.status];
              return (
                <div key={person.name} className="atd-sum-row">
                  <div className="atd-sum-avatar" style={{ boxShadow:`0 0 0 2.5px ${cfg.color}` }}>
                    {person.initials}
                  </div>
                  <div className="atd-sum-info">
                    <span className="atd-sum-name">{person.name}</span>
                    <span className="atd-sum-role">{person.role}</span>
                  </div>
                  <span className="atd-sum-badge" style={{ color: cfg.color, background:`${cfg.color}18` }}>
                    <cfg.Icon size={11} strokeWidth={2.5}/>
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
