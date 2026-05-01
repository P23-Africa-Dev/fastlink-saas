"use client";

import React, { useState } from "react";
import { useRouter } from "next/navigation";
import { Search, Bell, LogOut, User, Settings, ChevronDown } from "lucide-react";
import Link from "next/link";
import api from "@/lib/api";
import { useAuthStore } from "@/lib/stores/authStore";
import { useCurrentUser } from "@/lib/hooks/useCurrentUser";
import { useRef, useEffect } from "react";

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
  const [dropdownOpen, setDropdownOpen] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setDropdownOpen(false);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

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

        {/* User Dropdown */}
        <div className="relative" ref={dropdownRef}>
          <button
            onClick={() => setDropdownOpen(!dropdownOpen)}
            className="flex items-center gap-3 p-1 pr-2 rounded-xl hover:bg-[#f5f5fa] transition-all duration-200"
            style={{ border: "1px solid transparent" }}
          >
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
              style={{ background: "#33084E", color: "white", fontWeight: 700, marginLeft: 0 }}
            >
              {initials}
            </div>
            
            <ChevronDown 
              size={14} 
              className={`text-gray-400 transition-transform duration-200 cursor-pointer ${dropdownOpen ? 'rotate-180' : ''}`} 
            />
          </button>

          {dropdownOpen && (
            <div 
              className="absolute right-0 mt-2 w-56 bg-white rounded-2xl shadow-[0_10px_40px_-10px_rgba(0,0,0,0.1)] border border-gray-100 py-2 z-50 overflow-hidden"
              style={{ 
                animation: "dropdownIn 0.2s ease-out forwards",
                transformOrigin: "top right"
              }}
            >
              <div className="px-4 py-2 mb-1 border-bottom border-gray-50 sm:hidden">
                <p className="text-xs font-bold text-gray-900 truncate">{user?.name}</p>
                <p className="text-[10px] text-gray-500 truncate capitalize">{role}</p>
              </div>

              <Link 
                href="/settings" 
                className="flex items-center gap-3 px-4 py-2.5 text-sm text-gray-700 hover:bg-[#f5f5fa] hover:text-[#33084E] transition-colors cursor-pointer"
                onClick={() => setDropdownOpen(false)}
              >
                <div className="w-8 h-8 rounded-lg bg-purple-50 flex items-center justify-center text-[#33084E]">
                  <User size={16} />
                </div>
                <span className="font-medium">Profile</span>
              </Link>

              <div className="h-px bg-gray-50 my-1 mx-2" />

              <button
                onClick={handleLogout}
                disabled={loggingOut}
                className="w-full flex items-center gap-3 px-4 py-2.5 text-sm text-red-600 hover:bg-red-50 transition-colors text-left cursor-pointer"
              >
                <div className="w-8 h-8 rounded-lg bg-red-50 flex items-center justify-center text-red-600">
                  <LogOut size={16} />
                </div>
                <span className="font-medium">{loggingOut ? "Logging out..." : "Logout"}</span>
              </button>
            </div>
          )}
        </div>
      </div>
    </header>
  );
}
