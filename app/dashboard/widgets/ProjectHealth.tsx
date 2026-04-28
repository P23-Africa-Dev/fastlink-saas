import { cn } from "../../lib/utils";

interface Project {
  name: string;
  progress: number;
  status: "on-track" | "at-risk" | "completed";
  tasks: { total: number; done: number };
  daysLeft: number;
  color: string;
}

const PROJECTS: Project[] = [
  {
    name: "Website Redesign",
    progress: 72,
    status: "on-track",
    tasks: { total: 18, done: 13 },
    daysLeft: 8,
    color: "#6366f1",
  },
  {
    name: "Mobile App Dev",
    progress: 41,
    status: "at-risk",
    tasks: { total: 24, done: 10 },
    daysLeft: 14,
    color: "#f59e0b",
  },
  {
    name: "API Integration",
    progress: 94,
    status: "on-track",
    tasks: { total: 12, done: 11 },
    daysLeft: 3,
    color: "#22c55e",
  },
];

const STATUS_STYLES = {
  "on-track":  { label: "On Track",  className: "bg-emerald-50 dark:bg-emerald-500/10 text-emerald-600 dark:text-emerald-400" },
  "at-risk":   { label: "At Risk",   className: "bg-amber-50 dark:bg-amber-500/10 text-amber-600 dark:text-amber-400" },
  "completed": { label: "Completed", className: "bg-slate-100 dark:bg-white/5 text-slate-500 dark:text-slate-400" },
};

export function ProjectHealth() {
  return (
    <div className="bg-white dark:bg-[#1a2035] rounded-2xl border border-slate-200/60 dark:border-white/6 shadow-sm p-5 flex flex-col gap-4">
      <div>
        <h3 className="font-semibold text-slate-900 dark:text-white text-sm">Project Health</h3>
        <p className="text-xs text-slate-400 dark:text-slate-500 mt-0.5">
          Active project completion status
        </p>
      </div>

      <div className="flex flex-col gap-4">
        {PROJECTS.map((project) => {
          const { label, className } = STATUS_STYLES[project.status];
          return (
            <div key={project.name} className="flex flex-col gap-2">
              {/* Row 1: name + badge */}
              <div className="flex items-center justify-between gap-2">
                <div className="flex items-center gap-2 min-w-0">
                  <span
                    className="w-2 h-2 rounded-full shrink-0"
                    style={{ background: project.color }}
                  />
                  <p className="text-sm font-medium text-slate-800 dark:text-slate-200 truncate">
                    {project.name}
                  </p>
                </div>
                <span className={cn("text-[10px] font-semibold px-2 py-0.5 rounded-full shrink-0", className)}>
                  {label}
                </span>
              </div>

              {/* Row 2: progress bar */}
              <div className="h-1.5 bg-slate-100 dark:bg-white/5 rounded-full overflow-hidden">
                <div
                  className="h-full rounded-full transition-all duration-500"
                  style={{ width: `${project.progress}%`, background: project.color }}
                />
              </div>

              {/* Row 3: meta */}
              <div className="flex items-center justify-between text-[11px] text-slate-400 dark:text-slate-500">
                <span>
                  <span className="font-semibold text-slate-700 dark:text-slate-300">
                    {project.tasks.done}
                  </span>
                  /{project.tasks.total} tasks
                </span>
                <span
                  className="font-semibold"
                  style={{ color: project.color }}
                >
                  {project.progress}%
                </span>
                <span>
                  {project.daysLeft}d left
                </span>
              </div>
            </div>
          );
        })}
      </div>

      {/* Summary footer */}
      <div className="pt-2 border-t border-slate-100 dark:border-white/5 flex items-center justify-between text-xs">
        <span className="text-slate-400 dark:text-slate-500">3 active projects</span>
        <span className="text-slate-400 dark:text-slate-500">
          Avg{" "}
          <span className="font-semibold text-indigo-500">
            {Math.round(PROJECTS.reduce((s, p) => s + p.progress, 0) / PROJECTS.length)}%
          </span>{" "}
          complete
        </span>
      </div>
    </div>
  );
}
