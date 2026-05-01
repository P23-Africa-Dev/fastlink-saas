"use client";

import React, { useState } from "react";
import { useRouter } from "next/navigation";
import { Search, Bell, LogOut } from "lucide-react";
import api from "@/lib/api";
import { useAuthStore } from "@/lib/stores/authStore";

interface TopbarProps {
  isMobileOpen?: boolean;
  onMenuToggle?: () => void;
}

export default function Topbar({ isMobileOpen = false, onMenuToggle }: TopbarProps) {
  const router = useRouter();
  const { user, clearAuth } = useAuthStore();
  const [searchFocused, setSearchFocused] = useState(false);
  const [loggingOut, setLoggingOut] = useState(false);

  const initials = user?.name
    ? user.name.split(" ").map((w) => w[0]).join("").slice(0, 2).toUpperCase()
    : "FL";

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

        <div className="topbar-avatar" title={user?.name ?? ""}>{initials}</div>

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
