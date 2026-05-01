"use client";

import React from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  LayoutGrid,
  Briefcase,
  Layers,
  CalendarCheck,
  Users,
  CalendarDays,
  Settings,
  ChevronRight,
} from "lucide-react";

const navItems = [
  { icon: LayoutGrid, label: "Dashboard", href: "/dashboard" },
  { icon: Briefcase, label: "CRM", href: "/crm" },
  { icon: Layers, label: "Project", href: "/project" },
  { icon: CalendarCheck, label: "Attendance", href: "/attendance" },
  { icon: Users, label: "Users", href: "/users" },
];

const bottomItems = [
  // { icon: CalendarDays, label: "Calendar", href: "/calendar" },
  { icon: Settings, label: "Settings", href: "/settings" },
];

interface SidebarProps {
  isExpanded: boolean;
  onToggle: () => void;
}

export default function Sidebar({ isExpanded, onToggle }: SidebarProps) {
  const pathname = usePathname();

  const renderItem = (item: { icon: React.ElementType; label: string; href: string }) => {
    const isActive =
      pathname === item.href ||
      (item.href === "/dashboard" && (pathname === "/" || pathname === "/dashboard"));

    return (
      <div
        key={item.label}
        className={`sidebar-nav-item-wrapper ${isActive ? "active" : ""}`}
      >
        {isActive && <div className="active-bg" />}
        <Link href={item.href} className="sidebar-nav-item" title={item.label}>
          <item.icon size={isActive ? 22 : 20} strokeWidth={isActive ? 2.5 : 1.8} />
          {isExpanded && (
            <span className="sidebar-nav-label">{item.label}</span>
          )}
        </Link>
      </div>
    );
  };

  return (
    <aside className={`sidebar ${isExpanded ? "sidebar--expanded" : ""}`}>
      <div className="sidebar-header">
        <div className="sidebar-logo">Q</div>
        <button
          className={`sidebar-toggle ${isExpanded ? "sidebar-toggle--rotated" : ""}`}
          onClick={onToggle}
          aria-label={isExpanded ? "Collapse sidebar" : "Expand sidebar"}
        >
          <ChevronRight size={16} />
        </button>
      </div>

      <nav className="sidebar-nav">
        {navItems.map(renderItem)}
        <div className="sidebar-divider" />
      </nav>

      <div className="sidebar-bottom">{bottomItems.map(renderItem)}</div>
    </aside>
  );
}
