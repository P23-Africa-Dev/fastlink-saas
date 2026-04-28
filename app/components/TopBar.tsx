"use client";

import { cn } from "../lib/utils";
import { useTheme, type Theme } from "./ThemeProvider";
import { BellIcon, MenuIcon, SunIcon, MoonIcon, SystemIcon } from "./icons";

const THEME_OPTIONS: {
  value: Theme;
  icon: React.ComponentType<{ size?: number; className?: string }>;
  label: string;
}[] = [
  { value: "light", icon: SunIcon, label: "Light" },
  { value: "dark", icon: MoonIcon, label: "Dark" },
  { value: "system", icon: SystemIcon, label: "System" },
];

interface TopBarProps {
  onMobileMenuOpen: () => void;
}

export function TopBar({ onMobileMenuOpen }: TopBarProps) {
  const { theme, setTheme } = useTheme();

  return (
    <header className="h-16 flex items-center justify-between px-4 md:px-6 border-b border-slate-200/60 dark:border-white/6 bg-white dark:bg-[#0d1117] shrink-0">
      <div className="flex items-center gap-3">
        <button
          onClick={onMobileMenuOpen}
          className="md:hidden p-2 rounded-lg text-slate-500 hover:text-slate-700 dark:text-slate-400 dark:hover:text-slate-200 hover:bg-slate-100 dark:hover:bg-white/10 transition-colors"
          aria-label="Open menu"
        >
          <MenuIcon size={20} />
        </button>
      </div>

      <div className="flex items-center gap-2">
        {/* Theme toggle */}
        <div className="flex items-center gap-0.5 bg-slate-100 dark:bg-white/6 rounded-xl p-1">
          {THEME_OPTIONS.map(({ value, icon: Icon, label }) => (
            <button
              key={value}
              onClick={() => setTheme(value)}
              title={label}
              className={cn(
                "p-1.5 rounded-lg transition-all duration-150",
                theme === value
                  ? "bg-white dark:bg-white/10 text-slate-900 dark:text-white shadow-sm"
                  : "text-slate-400 dark:text-slate-500 hover:text-slate-600 dark:hover:text-slate-300"
              )}
            >
              <Icon size={15} />
            </button>
          ))}
        </div>

        {/* Notification bell */}
        <button
          className="relative p-2 rounded-xl text-slate-500 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-white/6 transition-colors"
          aria-label="Notifications"
        >
          <BellIcon size={18} />
          <span className="absolute top-1.5 right-1.5 w-2 h-2 bg-red-500 rounded-full ring-2 ring-white dark:ring-[#0d1117]" />
        </button>

        {/* User avatar */}
        <button className="flex items-center gap-2 pl-1 pr-3 py-1.5 rounded-xl hover:bg-slate-100 dark:hover:bg-white/6 transition-colors">
          <div className="w-8 h-8 rounded-full bg-indigo-500 flex items-center justify-center text-white font-bold text-sm shrink-0">
            E
          </div>
          <span className="text-sm font-medium text-slate-700 dark:text-slate-200 hidden sm:block">
            David
          </span>
          <svg
            width="12"
            height="12"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="2"
            strokeLinecap="round"
            strokeLinejoin="round"
            className="text-slate-400 hidden sm:block"
          >
            <polyline points="6 9 12 15 18 9" />
          </svg>
        </button>
      </div>
    </header>
  );
}
