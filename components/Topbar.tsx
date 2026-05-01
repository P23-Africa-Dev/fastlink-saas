"use client";

import React, { useState } from "react";
import { Search, Bell, Key } from "lucide-react";

interface TopbarProps {
  isMobileOpen?: boolean;
  onMenuToggle?: () => void;
}

export default function Topbar({ isMobileOpen = false, onMenuToggle }: TopbarProps) {
  const [searchFocused, setSearchFocused] = useState(false);

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
        
        <div className="search-bar">
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
        <div className="topbar-avatar">JD</div>
      </div>
    </header>
  );
}
