"use client";

import React from "react";
import { MoreHorizontal, Shield, ShieldOff, Mail, Building2 } from "lucide-react";
import { User, ROLE_CONFIG, fmtLastActive } from "./types";

interface UserCardProps {
  user:       User;
  onClick:    () => void;
  onEdit:     () => void;
  onDelete:   () => void;
  onToggleSuspend: () => void;
  menuOpen:   boolean;
  onMenuToggle: (e: React.MouseEvent<HTMLButtonElement>) => void;
  menuRef:    React.RefObject<HTMLDivElement | null>;
}

export function UserCard({ user, onClick, onEdit, onDelete, onToggleSuspend, menuOpen, onMenuToggle, menuRef }: UserCardProps) {
  const roleCfg = ROLE_CONFIG[user.role];

  return (
    <div
      onClick={onClick}
      className="bg-white rounded-2xl border cursor-pointer group transition-all shadow-md border-[#d1d5db] flex flex-col overflow-hidden relative hover:bg-[#f0f8ff] hover:border-[#d1d5db]"
      style={{ borderTop: `3px solid ${roleCfg.color}` }}
    >
      {/* Suspended overlay banner */}
      {user.suspended && (
        <div className="flex items-center" style={{ padding: "5px 14px", gap: "5px", background: "#fee2e2", borderBottom: "1px solid #fecaca" }}>
          <ShieldOff size={11} style={{ color: "#dc2626" }} />
          <span className="text-[10px] font-bold" style={{ color: "#991b1b" }}>Account Suspended</span>
        </div>
      )}

      <div className="flex flex-col" style={{ padding: "18px", gap: "14px" }}>

        {/* Top row — avatar + menu */}
        <div className="flex items-start justify-between">
          <div className="flex items-center" style={{ gap: "12px" }}>
            {/* Avatar */}
            <div
              className="rounded-2xl flex items-center justify-center text-[15px] font-bold text-white shrink-0 relative"
              style={{ width: "46px", height: "46px", background: user.suspended ? "#9ca3af" : user.color }}
            >
              {user.initials}
              {/* Online dot */}
              {!user.suspended && (
                <span
                  className="absolute rounded-full border-2 border-white"
                  style={{
                    width: "10px", height: "10px",
                    bottom: "0px", right: "0px",
                    background: fmtLastActive(user.last_active ?? "") === "Just now" || fmtLastActive(user.last_active ?? "").endsWith("m ago") ? "#16a34a" : "#d1d5db",
                  }}
                />
              )}
            </div>

            {/* Name + email */}
            <div className="flex flex-col" style={{ gap: "2px" }}>
              <span className="text-[14px] font-bold text-(--text-primary) group-hover:text-(--accent-purple) transition-colors leading-tight">
                {user.name}
              </span>
              <div className="flex items-center" style={{ gap: "4px" }}>
                <Mail size={10} className="text-[#9ca3af]" />
                <span className="text-[11px] text-[#9ca3af] truncate" style={{ maxWidth: "150px" }}>{user.email}</span>
              </div>
            </div>
          </div>

          {/* ⋮ menu */}
          <div className="relative" onClick={e => e.stopPropagation()}>
            <button
              onClick={onMenuToggle}
              className="w-7 h-7 flex items-center justify-center rounded-lg text-[#9ca3af] hover:bg-[#f0f0f5] hover:text-(--text-primary) transition-all"
            >
              <MoreHorizontal size={15} />
            </button>

            {menuOpen && (
              <div
                ref={menuRef}
                className="absolute right-0 top-8 bg-white rounded-xl border border-[#f0f0f5] shadow-lg z-20 overflow-hidden"
                style={{ minWidth: "160px" }}
                onClick={e => e.stopPropagation()}
              >
                <button onClick={onEdit}   className="w-full flex items-center text-left text-[12px] font-semibold text-(--text-primary) hover:bg-[#f8f8fc] transition-colors" style={{ padding: "10px 14px", gap: "8px" }}>
                  <span>Edit User</span>
                </button>
                <button onClick={onToggleSuspend} className="w-full flex items-center text-left text-[12px] font-semibold hover:bg-[#f8f8fc] transition-colors" style={{ padding: "10px 14px", gap: "8px", color: user.suspended ? "#074616" : "#AF580B" }}>
                  {user.suspended ? <Shield size={13} /> : <ShieldOff size={13} />}
                  {user.suspended ? "Unsuspend" : "Suspend"}
                </button>
                <div className="border-t border-[#f0f0f5]" />
                <button onClick={onDelete} className="w-full flex items-center text-left text-[12px] font-semibold text-red-500 hover:bg-red-50 transition-colors" style={{ padding: "10px 14px", gap: "8px" }}>
                  Delete User
                </button>
              </div>
            )}
          </div>
        </div>

        {/* Role + department */}
        <div className="flex items-center justify-between">
          <span
            className="inline-flex items-center rounded-lg text-[11px] font-bold"
            style={{ padding: "3px 10px", background: roleCfg.bg, color: roleCfg.color }}
          >
            {roleCfg.label}
          </span>
          {user.department && (
            <div className="flex items-center" style={{ gap: "4px" }}>
              <Building2 size={11} className="text-[#9ca3af]" />
              <span className="text-[11px] text-[#9ca3af]">{user.department}</span>
            </div>
          )}
        </div>

        {/* Last active */}
        <div className="flex items-center justify-between border-t border-[#f0f0f5]" style={{ paddingTop: "10px" }}>
          <span className="text-[11px] text-[#9ca3af]">Last active</span>
          <span className="text-[11px] font-bold" style={{ color: user.suspended ? "#9ca3af" : "#374151" }}>
            {user.last_active ? fmtLastActive(user.last_active) : "—"}
          </span>
        </div>
      </div>
    </div>
  );
}
