"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useState } from "react";
import { cn } from "../lib/utils";
import {
  DashboardIcon,
  CRMIcon,
  SpreadsheetIcon,
  FolderIcon,
  AttendanceIcon,
  SettingsIcon,
  ChevronDownIcon,
  ChevronRightIcon,
  ChevronLeftIcon,
  XIcon,
  type IconProps,
} from "./icons";

interface NavChild {
  label: string;
  href: string;
}

interface NavItemDef {
  id: string;
  icon: React.ComponentType<IconProps>;
  label: string;
  href?: string;
  children?: NavChild[];
}

const NAV_ITEMS: NavItemDef[] = [
  { id: "dashboard", icon: DashboardIcon, label: "Dashboard", href: "/dashboard" },
  { id: "crm", icon: CRMIcon, label: "CRM", href: "/dashboard/crm" },
  { id: "spreadsheets", icon: SpreadsheetIcon, label: "Spreadsheets", href: "/dashboard/spreadsheets" },
  {
    id: "projects",
    icon: FolderIcon,
    label: "Projects",
    children: [
      { label: "All Projects", href: "/dashboard/projects" },
      { label: "My Projects", href: "/dashboard/projects/mine" },
    ],
  },
  {
    id: "attendance",
    icon: AttendanceIcon,
    label: "Attendance",
    children: [
      { label: "Overview", href: "/dashboard/attendance" },
      { label: "My Attendance", href: "/dashboard/attendance/me" },
    ],
  },
  { id: "settings", icon: SettingsIcon, label: "Settings", href: "/dashboard/settings" },
];

interface SidebarProps {
  collapsed: boolean;
  mobileOpen: boolean;
  onCollapse: () => void;
  onMobileClose: () => void;
}

function Logo({ collapsed }: { collapsed: boolean }) {
  return (
    <div className="flex items-center gap-3 min-w-0">
      <div className="w-8 h-8 rounded-lg bg-indigo-600 flex items-center justify-center text-white font-bold text-sm shrink-0">
        P
      </div>
      {!collapsed && (
        <div className="flex flex-col leading-none">
          <span className="font-bold text-slate-900 dark:text-white text-base tracking-tight">
            P23
          </span>
          <span className="text-[9px] font-semibold text-slate-400 dark:text-slate-500 tracking-[0.2em] uppercase">
            Africa
          </span>
        </div>
      )}
    </div>
  );
}

function NavLink({
  item,
  collapsed,
  isActive,
}: {
  item: NavItemDef;
  collapsed: boolean;
  isActive: boolean;
}) {
  const Icon = item.icon;
  return (
    <Link
      href={item.href!}
      className={cn(
        "relative flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium transition-all duration-150 group",
        collapsed && "justify-center px-2",
        isActive
          ? "bg-violet-50 dark:bg-violet-500/10 text-violet-700 dark:text-violet-400"
          : "text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-white/5 hover:text-slate-900 dark:hover:text-slate-200"
      )}
    >
      {isActive && (
        <span className="absolute left-0 top-2 bottom-2 w-0.75 bg-violet-600 dark:bg-violet-500 rounded-full" />
      )}
      <Icon
        size={18}
        className={cn(
          "shrink-0 transition-colors",
          isActive
            ? "text-violet-600 dark:text-violet-400"
            : "text-slate-400 dark:text-slate-500 group-hover:text-slate-600 dark:group-hover:text-slate-300"
        )}
      />
      {!collapsed && <span className="truncate">{item.label}</span>}
      {collapsed && (
        <span className="absolute left-full ml-3 px-2 py-1 bg-slate-900 dark:bg-slate-700 text-white text-xs rounded-lg opacity-0 group-hover:opacity-100 pointer-events-none whitespace-nowrap z-50 shadow-lg transition-opacity">
          {item.label}
        </span>
      )}
    </Link>
  );
}

function NavGroup({
  item,
  collapsed,
  pathname,
}: {
  item: NavItemDef;
  collapsed: boolean;
  pathname: string;
}) {
  const isChildActive = item.children?.some((c) => pathname.startsWith(c.href)) ?? false;
  const [open, setOpen] = useState(isChildActive);
  const Icon = item.icon;

  if (collapsed) {
    return (
      <button
        className="relative flex w-full items-center justify-center px-2 py-2.5 rounded-xl text-sm font-medium transition-all duration-150 group text-slate-400 dark:text-slate-500 hover:bg-slate-100 dark:hover:bg-white/5"
        title={item.label}
      >
        <Icon size={18} className="shrink-0" />
        <span className="absolute left-full ml-3 px-2 py-1 bg-slate-900 dark:bg-slate-700 text-white text-xs rounded-lg opacity-0 group-hover:opacity-100 pointer-events-none whitespace-nowrap z-50 shadow-lg transition-opacity">
          {item.label}
        </span>
      </button>
    );
  }

  return (
    <div>
      <button
        onClick={() => setOpen(!open)}
        className={cn(
          "relative flex w-full items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium transition-all duration-150",
          isChildActive
            ? "text-violet-700 dark:text-violet-400"
            : "text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-white/5 hover:text-slate-900 dark:hover:text-slate-200"
        )}
      >
        <Icon
          size={18}
          className={cn(
            "shrink-0",
            isChildActive
              ? "text-violet-600 dark:text-violet-400"
              : "text-slate-400 dark:text-slate-500"
          )}
        />
        <span className="flex-1 text-left truncate">{item.label}</span>
        <span className={cn("transition-transform duration-200", open && "rotate-180")}>
          <ChevronDownIcon size={14} />
        </span>
      </button>

      {open && (
        <div className="mt-1 ml-9 space-y-0.5">
          {item.children?.map((child) => {
            const childActive = pathname === child.href;
            return (
              <Link
                key={child.href}
                href={child.href}
                className={cn(
                  "flex items-center gap-2 px-3 py-2 rounded-lg text-sm transition-colors",
                  childActive
                    ? "text-violet-700 dark:text-violet-400 font-medium"
                    : "text-slate-500 dark:text-slate-400 hover:text-slate-800 dark:hover:text-slate-200 hover:bg-slate-100 dark:hover:bg-white/5"
                )}
              >
                <ChevronRightIcon size={12} className="shrink-0 opacity-50" />
                {child.label}
              </Link>
            );
          })}
        </div>
      )}
    </div>
  );
}

function SidebarContent({
  collapsed,
  onCollapse,
  onMobileClose,
  showCloseButton,
}: {
  collapsed: boolean;
  onCollapse: () => void;
  onMobileClose: () => void;
  showCloseButton?: boolean;
}) {
  const pathname = usePathname();

  return (
    <div className="flex flex-col h-full">
      <div
        className={cn(
          "flex items-center py-5 px-4 border-b border-slate-200/60 dark:border-white/6",
          collapsed ? "justify-center" : "justify-between"
        )}
      >
        <Logo collapsed={collapsed} />
        {showCloseButton ? (
          <button
            onClick={onMobileClose}
            className="p-1.5 rounded-lg text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 hover:bg-slate-100 dark:hover:bg-white/10 transition-colors"
          >
            <XIcon size={16} />
          </button>
        ) : (
          !collapsed && (
            <button
              onClick={onCollapse}
              className="p-1.5 rounded-lg text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 hover:bg-slate-100 dark:hover:bg-white/10 transition-colors"
              title="Collapse sidebar"
            >
              <ChevronLeftIcon size={16} />
            </button>
          )
        )}
      </div>

      {collapsed && !showCloseButton && (
        <button
          onClick={onCollapse}
          className="mx-auto mt-3 p-1.5 rounded-lg text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 hover:bg-slate-100 dark:hover:bg-white/10 transition-colors"
          title="Expand sidebar"
        >
          <ChevronRightIcon size={16} />
        </button>
      )}

      <nav className="flex-1 overflow-y-auto sidebar-scroll px-3 py-4 space-y-1">
        {!collapsed && (
          <p className="text-[10px] font-semibold tracking-widest text-slate-400 dark:text-slate-600 uppercase px-3 mb-3">
            Navigation
          </p>
        )}
        {NAV_ITEMS.map((item) => {
          if (item.children) {
            return (
              <NavGroup key={item.id} item={item} collapsed={collapsed} pathname={pathname} />
            );
          }
          return (
            <NavLink
              key={item.id}
              item={item}
              collapsed={collapsed}
              isActive={pathname === item.href}
            />
          );
        })}
      </nav>

      <div
        className={cn(
          "border-t border-slate-200/60 dark:border-white/6 p-3",
          collapsed && "flex justify-center"
        )}
      >
        <div
          className={cn(
            "flex items-center gap-3 rounded-xl px-2 py-2 hover:bg-slate-100 dark:hover:bg-white/5 transition-colors cursor-pointer",
            collapsed && "px-1"
          )}
        >
          <div className="w-8 h-8 rounded-full bg-indigo-500 flex items-center justify-center text-white font-bold text-sm shrink-0">
            E
          </div>
          {!collapsed && (
            <div className="flex-1 min-w-0">
              <p className="text-sm font-semibold text-slate-900 dark:text-white truncate">David</p>
              <p className="text-xs text-slate-400 dark:text-slate-500 truncate">Staff</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

export function Sidebar({ collapsed, mobileOpen, onCollapse, onMobileClose }: SidebarProps) {
  return (
    <>
      {mobileOpen && (
        <div className="fixed inset-0 z-50 md:hidden flex">
          <div className="absolute inset-0 bg-black/50 backdrop-blur-sm" onClick={onMobileClose} />
          <div className="relative z-10 w-64 bg-white dark:bg-[#0d1117] shadow-2xl">
            <SidebarContent
              collapsed={false}
              onCollapse={onCollapse}
              onMobileClose={onMobileClose}
              showCloseButton
            />
          </div>
        </div>
      )}

      <aside
        className={cn(
          "hidden md:flex flex-col h-full shrink-0",
          "bg-white dark:bg-[#0d1117]",
          "border-r border-slate-200/60 dark:border-white/6",
          "transition-all duration-300 ease-in-out",
          collapsed ? "w-18" : "w-64"
        )}
      >
        <SidebarContent
          collapsed={collapsed}
          onCollapse={onCollapse}
          onMobileClose={onMobileClose}
        />
      </aside>
    </>
  );
}
