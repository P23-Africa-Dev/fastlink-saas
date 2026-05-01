"use client";

import React, { useState } from "react";
import { useRouter } from "next/navigation";
import { Search, Bell, LogOut } from "lucide-react";
import api from "@/lib/api";
import { useAuthStore } from "@/lib/stores/authStore";
import { useCurrentUser } from "@/lib/hooks/useCurrentUser";

interface TopbarProps {
  isMobileOpen?: boolean;
  onMenuToggle?: () => void;
}

export default function Topbar({ isMobileOpen = false, onMenuToggle }: TopbarProps) {
  const router = useRouter();
  const { user: storedUser, clearAuth } = useAuthStore();
  const { data: liveUser } = useCurrentUser();
  const [searchFocused, setSearchFocused] = useState(false);
  const [loggingOut, setLoggingOut] = useState(false);

  // Prefer live data from /auth/me, fall back to the value stored at login
  const user = liveUser ?? storedUser;

  const initials = user?.name
    ? user.name.split(" ").map((w) => w[0]).join("").slice(0, 2).toUpperCase()
    : "FL";

  const role = user?.roles?.[0]?.name ?? "";

  const handleLogout = async () => {
    if (loggingOut) return;
    setLoggingOut(true);
    try {
      await api.post("/auth/logout");
    } catch {
      // token may already be invalid — proceed anyway
    } finally {
      clearAuth();
      router.replace("/");
    }
  };

  return (
    <header className="topbar">
      <div className="flex items-center">
        <button
          className={`menu-toggle ${isMobileOpen ? "menu-toggle--open" : ""}`}
          onClick={onMenuToggle}
          aria-label="Toggle menu"
        >
          <span />
          <span />
          <span />
        </button>

        <div className={`search-bar ${searchFocused ? "search-bar--focused" : ""}`}>
          <Search size={16} color="#9ca3af" />
          <input
            type="text"
            placeholder="Search ..."
            onFocus={() => setSearchFocused(true)}
            onBlur={() => setSearchFocused(false)}
          />
        </div>
      </div>

      <div className="topbar-actions">
        <button className="topbar-action-btn" title="Notifications">
          <Bell size={18} />
          <span className="notification-dot" />
        </button>

        {/* User info + avatar */}
        <div className="hidden sm:flex flex-col items-end leading-tight" style={{ gap: "1px" }}>
          <span className="text-[12px] font-bold text-(--text-primary)">{user?.name ?? "—"}</span>
          {role && (
            <span className="text-[11px] font-medium capitalize" style={{ color: "#9ca3af" }}>{role}</span>
          )}
        </div>

        <div
          className="topbar-avatar"
          title={user?.name ?? ""}
          style={{ background: "#33084E", color: "white", fontWeight: 700 }}
        >
          {initials}
        </div>

        <button
          onClick={handleLogout}
          className="topbar-action-btn"
          title="Sign out"
          disabled={loggingOut}
        >
          <LogOut size={17} />
        </button>
      </div>
    </header>
  );
}
