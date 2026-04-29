// ─── OLD DASHBOARD (commented out) ───────────────────────────────────────────
// import Link from "next/link";
// import { StatsCard } from "../components/StatsCard";
// import {
//   FolderIcon, ClockIcon, FilterIcon, KanbanIcon, GanttIcon,
//   PipelineIcon, ChevronRightIcon,
// } from "../components/icons";
// import { WeeklyActivity } from "./widgets/WeeklyActivity";
// import { TaskDonut } from "./widgets/TaskDonut";
// import { LeadPipeline } from "./widgets/LeadPipeline";
// import { ProjectHealth } from "./widgets/ProjectHealth";
// import { RecentActivity } from "./widgets/RecentActivity";
//
// const STATS = [
//   { label: "Total Leads", value: 31, subtitle: "20 new", icon: FilterIcon,
//     variant: "teal", trend: { value: 18, direction: "up", label: "vs last mo." },
//     sparkData: [24, 25, 26, 25, 27, 29, 31] },
//   { label: "Total Projects", value: 3, subtitle: "1 active", icon: FolderIcon,
//     variant: "purple", trend: { value: 33, direction: "up", label: "vs last mo." },
//     sparkData: [1, 2, 2, 2, 3, 2, 3] },
//   { label: "Pending Tasks", value: 2, icon: ClockIcon, variant: "orange",
//     trend: { value: 12, direction: "down" }, sparkData: [3, 3, 4, 3, 3, 2, 2] },
// ];
//
// const QUICK_LINKS = [
//   { label: "All Projects",  href: "/dashboard/projects", icon: FolderIcon,   accent: "#021717", accentBg: "bg-[#021717]/10" },
//   { label: "Kanban Board",  href: "/dashboard/projects/kanban", icon: KanbanIcon, accent: "#3b82f6", accentBg: "bg-blue-500/10" },
//   { label: "Gantt Chart",   href: "/dashboard/projects/gantt",  icon: GanttIcon,  accent: "#f59e0b", accentBg: "bg-amber-500/10" },
//   { label: "CRM Pipeline",  href: "/dashboard/crm",  icon: PipelineIcon, accent: "#06b6d4", accentBg: "bg-cyan-500/10" },
// ];
//
// export default function DashboardPage() {
//   return (
//     <div className="space-y-6 max-w-360">
//       <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-3 md:gap-6 -mt-5">
//         <div className="shrink-0">
//           <h1 className="text-2xl font-bold text-slate-900 dark:text-white">Dashboard</h1>
//           <p className="text-sm text-slate-500 dark:text-slate-400 mt-0.5">
//             Welcome back, <span className="font-semibold text-slate-700 dark:text-slate-300">David</span>
//           </p>
//         </div>
//         <div className="flex items-center gap-2 overflow-x-auto pb-0.5 md:pb-0 md:flex-wrap md:justify-end scrollbar-hide">
//           {QUICK_LINKS.map(({ label, href, icon: Icon, accent, accentBg }) => (
//             <Link key={label} href={href}
//               className="group flex items-center gap-2 px-3.5 py-2 rounded-xl border border-slate-300/70 dark:border-white/10 bg-transparent hover:bg-white dark:hover:bg-white/5 hover:shadow-md hover:-translate-y-0.5 hover:border-slate-400/60 dark:hover:border-white/20 transition-all duration-150 shrink-0">
//               <span className={`w-5 h-5 rounded-md ${accentBg} flex items-center justify-center shrink-0`}>
//                 <Icon size={11} style={{ color: accent }} />
//               </span>
//               <span className="text-xs font-semibold text-slate-700 dark:text-slate-200 whitespace-nowrap">{label}</span>
//               <ChevronRightIcon size={10} className="text-slate-300 dark:text-slate-600 group-hover:text-slate-500 dark:group-hover:text-slate-400 group-hover:translate-x-0.5 transition-all duration-150" />
//             </Link>
//           ))}
//         </div>
//       </div>
//       <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
//         {STATS.map((stat) => (
//           <StatsCard key={stat.label} label={stat.label} value={stat.value}
//             subtitle={stat.subtitle} icon={stat.icon} variant={stat.variant as "teal" | "purple" | "orange"}
//             trend={stat.trend as { value: number; direction: "up" | "down"; label?: string }}
//             sparkData={stat.sparkData} />
//         ))}
//       </div>
//       <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-12 gap-4">
//         <div className="lg:col-span-5"><TaskDonut /></div>
//         <div className="lg:col-span-7"><WeeklyActivity /></div>
//       </div>
//       <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4">
//         <ProjectHealth />
//         <LeadPipeline />
//         <RecentActivity />
//       </div>
//     </div>
//   );
// }
// ─────────────────────────────────────────────────────────────────────────────

import { HeroStatCard } from "./widgets/HeroStatCard";
import { StatSparkline } from "../components/StatSparkline";
import { TaskActivityChart } from "./widgets/TaskActivityChart";
import { TaskBreakdownRadar } from "./widgets/TaskBreakdownRadar";
import { LeadSourceCards } from "./widgets/LeadSourceCards";
import { PipelineStats } from "./widgets/PipelineStats";

const SMALL_STATS: {
  label: string;
  value: string;
  trend: { value: number; direction: "up" | "down" };
  sparkData: number[];
}[] = [
  {
    label: "Total Visitors",
    value: "1.6k+",
    trend: { value: 17, direction: "down" },
    sparkData: [28, 25, 30, 22, 20, 18, 16],
  },
  {
    label: "Time Spent, Fr",
    value: "8.49",
    trend: { value: 24, direction: "up" },
    sparkData: [5, 6, 6, 7, 7, 8, 8],
  },
  {
    label: "AVG Requests Received",
    value: "10.4",
    trend: { value: 10, direction: "up" },
    sparkData: [7, 8, 9, 9, 10, 10, 10],
  },
];

export default function DashboardPage() {
  return (
    <div className="space-y-4">

      {/* ── Row 1: stat cards ── */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {/* Hero dark card */}
        <HeroStatCard />

        {/* 3 lighter stat cards */}
        {SMALL_STATS.map((stat) => (
          <div
            key={stat.label}
            className="bg-white rounded-2xl border border-gray-100 shadow-sm p-5 flex flex-col justify-between"
          >
            <p className="text-[10px] font-semibold tracking-widest text-gray-400 uppercase">
              {stat.label}
            </p>
            <div className="flex items-end justify-between mt-3 gap-2">
              <div>
                <p className="text-2xl font-bold text-gray-900 leading-none">{stat.value}</p>
                <span
                  className={`text-xs font-semibold flex items-center gap-0.5 mt-1.5 ${
                    stat.trend.direction === "up" ? "text-emerald-500" : "text-red-500"
                  }`}
                >
                  {stat.trend.direction === "up" ? "↑" : "↓"} {stat.trend.value}%
                </span>
              </div>
              <StatSparkline data={stat.sparkData} direction={stat.trend.direction} />
            </div>
          </div>
        ))}
      </div>

      {/* ── Row 2: activity chart + task breakdown radar ── */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-4">
        <div className="lg:col-span-7">
          <TaskActivityChart />
        </div>
        <div className="lg:col-span-5">
          <TaskBreakdownRadar />
        </div>
      </div>

      {/* ── Row 3: top lead sources + CRM pipeline stats ── */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-4">
        <div className="lg:col-span-7">
          <LeadSourceCards />
        </div>
        <div className="lg:col-span-5">
          <PipelineStats />
        </div>
      </div>

    </div>
  );
}
