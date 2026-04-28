import Link from "next/link";
import { StatsCard } from "../components/StatsCard";
import {
  FolderIcon,
  ClockIcon,
  FilterIcon,
  KanbanIcon,
  GanttIcon,
  PipelineIcon,
  ChevronRightIcon,
} from "../components/icons";
import { WeeklyActivity } from "./widgets/WeeklyActivity";
import { TaskDonut } from "./widgets/TaskDonut";
import { LeadPipeline } from "./widgets/LeadPipeline";
import { ProjectHealth } from "./widgets/ProjectHealth";
import { RecentActivity } from "./widgets/RecentActivity";

const STATS = [
  {
    label: "Total Leads",
    value: 31,
    subtitle: "20 new",
    icon: FilterIcon,
    variant: "teal" as const,
    trend: { value: 18, direction: "up" as const, label: "vs last mo." },
    sparkData: [24, 25, 26, 25, 27, 29, 31],
  },
  {
    label: "Total Projects",
    value: 3,
    subtitle: "1 active",
    icon: FolderIcon,
    variant: "purple" as const,
    trend: { value: 33, direction: "up" as const, label: "vs last mo." },
    sparkData: [1, 2, 2, 2, 3, 2, 3],
  },
  {
    label: "Pending Tasks",
    value: 2,
    subtitle: undefined,
    icon: ClockIcon,
    variant: "orange" as const,
    trend: { value: 12, direction: "down" as const },
    sparkData: [3, 3, 4, 3, 3, 2, 2],
  },
];

const QUICK_LINKS = [
  {
    label: "All Projects",
    href: "/dashboard/projects",
    icon: FolderIcon,
    accent: "#021717",
    accentBg: "bg-[#021717]/10",
  },
  {
    label: "Kanban Board",
    href: "/dashboard/projects/kanban",
    icon: KanbanIcon,
    accent: "#3b82f6",
    accentBg: "bg-blue-500/10",
  },
  {
    label: "Gantt Chart",
    href: "/dashboard/projects/gantt",
    icon: GanttIcon,
    accent: "#f59e0b",
    accentBg: "bg-amber-500/10",
  },
  {
    label: "CRM Pipeline",
    href: "/dashboard/crm",
    icon: PipelineIcon,
    accent: "#06b6d4",
    accentBg: "bg-cyan-500/10",
  },
] as const;

export default function DashboardPage() {
  return (
    <div className="space-y-6 max-w-360">

      {/* ── Page header + quick links ── */}
      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-3 md:gap-6 -mt-5">
        {/* Title */}
        <div className="shrink-0">
          <h1 className="text-2xl font-bold text-slate-900 dark:text-white">Dashboard</h1>
          <p className="text-sm text-slate-500 dark:text-slate-400 mt-0.5">
            Welcome back,{" "}
            <span className="font-semibold text-slate-700 dark:text-slate-300">David</span>
          </p>
        </div>

        {/* Quick links — horizontally scrollable on mobile, natural wrap on md+ */}
        <div className="flex items-center gap-2 overflow-x-auto pb-0.5 md:pb-0 md:flex-wrap md:justify-end scrollbar-hide">
          {QUICK_LINKS.map(({ label, href, icon: Icon, accent, accentBg }) => (
            <Link
              key={label}
              href={href}
              className="group flex items-center gap-2 px-3.5 py-2 rounded-xl border border-slate-300/70 dark:border-white/10 bg-transparent hover:bg-white dark:hover:bg-white/5 hover:shadow-md hover:-translate-y-0.5 hover:border-slate-400/60 dark:hover:border-white/20 transition-all duration-150 shrink-0"
            >
              <span className={`w-5 h-5 rounded-md ${accentBg} flex items-center justify-center shrink-0`}>
                <Icon size={11} style={{ color: accent }} />
              </span>
              <span className="text-xs font-semibold text-slate-700 dark:text-slate-200 whitespace-nowrap">
                {label}
              </span>
              <ChevronRightIcon
                size={10}
                className="text-slate-300 dark:text-slate-600 group-hover:text-slate-500 dark:group-hover:text-slate-400 group-hover:translate-x-0.5 transition-all duration-150"
              />
            </Link>
          ))}
        </div>
      </div>

      {/* ── Stats row ── */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        {STATS.map((stat) => (
          <StatsCard
            key={stat.label}
            label={stat.label}
            value={stat.value}
            subtitle={stat.subtitle}
            icon={stat.icon}
            variant={stat.variant}
            trend={stat.trend}
            sparkData={stat.sparkData}
          />
        ))}
      </div>

      {/* ── Row 1: Task Breakdown + Weekly Activity ── */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-12 gap-4">
        <div className="lg:col-span-5">
          <TaskDonut />
        </div>
        <div className="lg:col-span-7">
          <WeeklyActivity />
        </div>
      </div>

      {/* ── Row 2: Project Health + CRM Pipeline + Recent Activity ── */}
      <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4">
        <ProjectHealth />
        <LeadPipeline />
        <RecentActivity />
      </div>

    </div>
  );
}
