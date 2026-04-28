import { StatsCard } from "../components/StatsCard";
import { QuickLinkCard } from "../components/QuickLinkCard";
import {
  FolderIcon,
  ListIcon,
  ClockIcon,
  FilterIcon,
  KanbanIcon,
  GanttIcon,
  PipelineIcon,
  SpreadsheetIcon,
} from "../components/icons";
import { WeeklyActivity } from "./widgets/WeeklyActivity";
import { TaskDonut } from "./widgets/TaskDonut";
import { LeadPipeline } from "./widgets/LeadPipeline";
import { ProjectHealth } from "./widgets/ProjectHealth";
import { RecentActivity } from "./widgets/RecentActivity";

const STATS = [
  {
    label: "Projects",
    value: 3,
    subtitle: "1 active",
    icon: FolderIcon,
    variant: "purple" as const,
    trend: { value: 33, direction: "up" as const, label: "vs last mo." },
    sparkData: [1, 2, 2, 2, 3, 2, 3],
  },
  {
    label: "Tasks",
    value: 2,
    subtitle: "0 completed",
    icon: ListIcon,
    variant: "blue" as const,
    trend: { value: 50, direction: "down" as const, label: "vs last mo." },
    sparkData: [4, 5, 4, 4, 3, 3, 2],
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
  {
    label: "Total Leads",
    value: 31,
    subtitle: "20 new",
    icon: FilterIcon,
    variant: "teal" as const,
    trend: { value: 18, direction: "up" as const, label: "vs last mo." },
    sparkData: [24, 25, 26, 25, 27, 29, 31],
  },
];

const QUICK_LINKS = [
  {
    label: "All Projects",
    href: "/dashboard/projects",
    icon: FolderIcon,
    iconBg: "bg-indigo-500/10 dark:bg-indigo-500/15",
    iconColor: "text-indigo-500 dark:text-indigo-400",
  },
  {
    label: "Kanban Board",
    href: "/dashboard/projects/kanban",
    icon: KanbanIcon,
    iconBg: "bg-blue-500/10 dark:bg-blue-500/15",
    iconColor: "text-blue-500 dark:text-blue-400",
  },
  {
    label: "Task List",
    href: "/dashboard/projects/tasks",
    icon: ListIcon,
    iconBg: "bg-emerald-500/10 dark:bg-emerald-500/15",
    iconColor: "text-emerald-600 dark:text-emerald-400",
  },
  {
    label: "Gantt Chart",
    href: "/dashboard/projects/gantt",
    icon: GanttIcon,
    iconBg: "bg-amber-500/10 dark:bg-amber-500/15",
    iconColor: "text-amber-500 dark:text-amber-400",
  },
  {
    label: "CRM Pipeline",
    href: "/dashboard/crm",
    icon: PipelineIcon,
    iconBg: "bg-cyan-500/10 dark:bg-cyan-500/15",
    iconColor: "text-cyan-500 dark:text-cyan-400",
  },
  {
    label: "Spreadsheets",
    href: "/dashboard/spreadsheets",
    icon: SpreadsheetIcon,
    iconBg: "bg-teal-500/10 dark:bg-teal-500/15",
    iconColor: "text-teal-500 dark:text-teal-400",
  },
] as const;

export default function DashboardPage() {
  return (
    <div className="space-y-6 max-w-360">

      {/* ── Page header ── */}
      <div>
        <h1 className="text-2xl font-bold text-slate-900 dark:text-white">Dashboard</h1>
        <p className="text-sm text-slate-500 dark:text-slate-400 mt-1">
          Welcome back,{" "}
          <span className="font-semibold text-slate-700 dark:text-slate-300">David</span>
        </p>
      </div>

      {/* ── Stats row ── */}
      <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-4">
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

      {/* ── Primary charts ── */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-4">
        <div className="lg:col-span-7">
          <WeeklyActivity />
        </div>
        <div className="lg:col-span-5">
          <TaskDonut />
        </div>
      </div>

      {/* ── Secondary widgets ── */}
      <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
        <ProjectHealth />
        <LeadPipeline />
        <RecentActivity />
      </div>

      {/* ── Quick navigation ── */}
      <div className="bg-white dark:bg-[#1a2035] rounded-2xl border border-slate-200/60 dark:border-white/6 shadow-sm overflow-hidden">
        <div className="flex items-center gap-3 px-6 py-4 border-b border-slate-100 dark:border-white/[0.04]">
          <div className="w-8 h-8 rounded-lg bg-indigo-500/10 dark:bg-indigo-500/15 flex items-center justify-center">
            <FolderIcon size={16} className="text-indigo-500 dark:text-indigo-400" />
          </div>
          <h2 className="text-sm font-semibold text-slate-900 dark:text-white">
            Project Management
          </h2>
          <span className="ml-auto text-[10px] font-medium text-slate-400 dark:text-slate-500 uppercase tracking-wider">
            Quick access
          </span>
        </div>
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3 p-4">
          {QUICK_LINKS.map((link) => (
            <QuickLinkCard
              key={link.label}
              label={link.label}
              href={link.href}
              icon={link.icon}
              iconBg={link.iconBg}
              iconColor={link.iconColor}
            />
          ))}
        </div>
      </div>

    </div>
  );
}
