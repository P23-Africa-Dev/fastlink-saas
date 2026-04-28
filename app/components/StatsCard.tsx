import { cn } from "../lib/utils";
import type { IconProps } from "./icons";
import { StatSparkline } from "./StatSparkline";

type StatVariant = "purple" | "blue" | "orange" | "teal";

interface TrendData {
  value: number;
  direction: "up" | "down";
  label?: string;
}

interface StatsCardProps {
  label: string;
  value: number | string;
  subtitle?: string;
  icon: React.ComponentType<IconProps>;
  variant: StatVariant;
  trend?: TrendData;
  sparkData?: number[];
}

const VARIANT_STYLES: Record<StatVariant, { iconBg: string; iconColor: string }> = {
  purple: {
    iconBg: "bg-indigo-500/10 dark:bg-indigo-500/15",
    iconColor: "text-indigo-500 dark:text-indigo-400",
  },
  blue: {
    iconBg: "bg-blue-500/10 dark:bg-blue-500/15",
    iconColor: "text-blue-500 dark:text-blue-400",
  },
  orange: {
    iconBg: "bg-amber-500/10 dark:bg-amber-500/15",
    iconColor: "text-amber-500 dark:text-amber-400",
  },
  teal: {
    iconBg: "bg-teal-500/10 dark:bg-teal-500/15",
    iconColor: "text-teal-500 dark:text-teal-400",
  },
};

export function StatsCard({
  label,
  value,
  subtitle,
  icon: Icon,
  variant,
  trend,
  sparkData,
}: StatsCardProps) {
  const { iconBg, iconColor } = VARIANT_STYLES[variant];

  return (
    <div className="bg-white dark:bg-[#1a2035] rounded-2xl p-5 flex items-center gap-3 border border-slate-200/60 dark:border-white/6 shadow-sm hover:shadow-md dark:hover:shadow-none hover:-translate-y-0.5 transition-all duration-200">
      {/* Icon */}
      <div className={cn("w-11 h-11 rounded-xl flex items-center justify-center shrink-0", iconBg)}>
        <Icon size={20} className={iconColor} />
      </div>

      {/* Text */}
      <div className="flex-1 min-w-0">
        <p className="text-[10px] font-semibold tracking-widest text-slate-400 dark:text-slate-500 uppercase mb-0.5">
          {label}
        </p>
        <p className="text-2xl font-bold text-slate-900 dark:text-white leading-none">
          {value}
        </p>
        <div className="flex items-center gap-2 mt-0.5 flex-wrap">
          {subtitle && (
            <p className="text-xs text-slate-400 dark:text-slate-500">{subtitle}</p>
          )}
          {trend && (
            <span
              className={cn(
                "text-[11px] font-semibold flex items-center gap-0.5",
                trend.direction === "up" ? "text-emerald-500" : "text-red-500"
              )}
            >
              {trend.direction === "up" ? "↑" : "↓"}
              {trend.value}%
              {trend.label && (
                <span className="text-slate-400 dark:text-slate-500 font-normal ml-0.5">
                  {trend.label}
                </span>
              )}
            </span>
          )}
        </div>
      </div>

      {/* Sparkline */}
      {sparkData && trend && (
        <StatSparkline data={sparkData} direction={trend.direction} />
      )}
    </div>
  );
}
