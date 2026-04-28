import Link from "next/link";
import { cn } from "../lib/utils";
import type { IconProps } from "./icons";

interface QuickLinkCardProps {
  label: string;
  href: string;
  icon: React.ComponentType<IconProps>;
  iconBg: string;
  iconColor: string;
}

export function QuickLinkCard({
  label,
  href,
  icon: Icon,
  iconBg,
  iconColor,
}: QuickLinkCardProps) {
  return (
    <Link
      href={href}
      className="group flex items-center gap-3 bg-white dark:bg-[#1a2035] rounded-2xl p-4 border border-slate-200/60 dark:border-white/[0.06] shadow-sm hover:shadow-md dark:hover:shadow-black/20 hover:-translate-y-0.5 hover:border-slate-300 dark:hover:border-white/10 transition-all duration-200"
    >
      <div
        className={cn(
          "w-10 h-10 rounded-xl flex items-center justify-center flex-shrink-0 transition-transform duration-200 group-hover:scale-110",
          iconBg
        )}
      >
        <Icon size={18} className={iconColor} />
      </div>
      <span className="text-sm font-medium text-slate-700 dark:text-slate-300 group-hover:text-slate-900 dark:group-hover:text-white transition-colors">
        {label}
      </span>
    </Link>
  );
}
