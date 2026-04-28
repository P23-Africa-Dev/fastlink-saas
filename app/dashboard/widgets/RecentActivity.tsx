import { cn } from "../../lib/utils";

interface ActivityItem {
  initial: string;
  color: string;
  user: string;
  action: string;
  item: string;
  time: string;
  type: "task" | "comment" | "lead" | "update" | "project";
}

const ACTIVITY: ActivityItem[] = [
  {
    initial: "A",
    color: "#021717",
    user: "Amara K.",
    action: "completed task",
    item: "Homepage mockups",
    time: "2m ago",
    type: "task",
  },
  {
    initial: "J",
    color: "#06b6d4",
    user: "James O.",
    action: "commented on",
    item: "API Integration",
    time: "15m ago",
    type: "comment",
  },
  {
    initial: "S",
    color: "#10b981",
    user: "Sarah M.",
    action: "added lead",
    item: "TechCorp Ltd.",
    time: "1h ago",
    type: "lead",
  },
  {
    initial: "D",
    color: "#f59e0b",
    user: "David A.",
    action: "updated",
    item: "Q1 Spreadsheet",
    time: "2h ago",
    type: "update",
  },
  {
    initial: "E",
    color: "#021717",
    user: "David",
    action: "created project",
    item: "Mobile App Dev",
    time: "3h ago",
    type: "project",
  },
];

const TYPE_DOT: Record<ActivityItem["type"], string> = {
  task:    "bg-[#1D6161]",
  comment: "bg-cyan-500",
  lead:    "bg-[#021717]",
  update:  "bg-amber-500",
  project: "bg-violet-500",
};

export function RecentActivity() {
  return (
    <div className="bg-white dark:bg-[#1a2035] rounded-2xl border border-slate-200/60 dark:border-white/6 shadow-sm p-5 flex flex-col gap-4">
      <div className="flex items-center justify-between">
        <div>
          <h3 className="font-semibold text-slate-900 dark:text-white text-sm">Recent Activity</h3>
          <p className="text-xs text-slate-400 dark:text-slate-500 mt-0.5">Latest team actions</p>
        </div>
        <button className="text-[11px] font-medium transition-colors" style={{ color: "#021717" }}>
          View all →
        </button>
      </div>

      <div className="flex flex-col">
        {ACTIVITY.map((item, i) => (
          <div
            key={i}
            className={cn(
              "flex items-start gap-3 py-3 group",
              i < ACTIVITY.length - 1 && "border-b border-slate-100 dark:border-white/[0.04]"
            )}
          >
            {/* Avatar */}
            <div
              className="w-8 h-8 rounded-full flex items-center justify-center text-white text-xs font-bold shrink-0 mt-0.5"
              style={{ background: item.color }}
            >
              {item.initial}
            </div>

            {/* Content */}
            <div className="flex-1 min-w-0">
              <p className="text-xs text-slate-700 dark:text-slate-300 leading-snug">
                <span className="font-semibold text-slate-900 dark:text-white">
                  {item.user}
                </span>{" "}
                <span className="text-slate-500 dark:text-slate-400">{item.action}</span>{" "}
                <span className="font-medium">{item.item}</span>
              </p>
              <div className="flex items-center gap-1.5 mt-1">
                <span className={cn("w-1.5 h-1.5 rounded-full shrink-0", TYPE_DOT[item.type])} />
                <span className="text-[10px] text-slate-400 dark:text-slate-500 capitalize">
                  {item.type}
                </span>
                <span className="text-[10px] text-slate-300 dark:text-slate-600">·</span>
                <span className="text-[10px] text-slate-400 dark:text-slate-500">{item.time}</span>
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
