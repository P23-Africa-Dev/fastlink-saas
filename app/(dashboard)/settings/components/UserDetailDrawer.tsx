"use client";

import React from "react";
import { X, Mail, Building2, Shield, ShieldOff, Calendar, Clock, Pencil, Trash2, UserCheck } from "lucide-react";
import { User, ROLE_CONFIG, fmtDate, fmtLastActive } from "./types";

interface UserDetailDrawerProps {
  user:            User;
  onClose:         () => void;
  onEdit:          () => void;
  onDelete:        () => void;
  onToggleSuspend: () => void;
}

function InfoRow({ icon, label, children }: { icon: React.ReactNode; label: string; children: React.ReactNode }) {
  return (
    <div className="flex items-start border-b border-[#f0f0f5] last:border-0" style={{ padding: "13px 0", gap: "12px" }}>
      <div className="shrink-0 text-[#9ca3af]" style={{ marginTop: "1px" }}>{icon}</div>
      <div className="flex flex-col flex-1" style={{ gap: "2px" }}>
        <span className="text-[10px] font-bold uppercase tracking-wider text-[#9ca3af]">{label}</span>
        <div className="text-[13px] font-semibold text-(--text-primary)">{children}</div>
      </div>
    </div>
  );
}

export function UserDetailDrawer({ user, onClose, onEdit, onDelete, onToggleSuspend }: UserDetailDrawerProps) {
  const roleCfg = ROLE_CONFIG[user.role];

  return (
    <>
      <div className="fixed inset-0 bg-black/30 z-40" onClick={onClose} />

      <div className="fixed top-0 right-0 h-full bg-white z-50 flex flex-col shadow-2xl overflow-hidden" style={{ width: "440px", maxWidth: "100vw" }}>

        {/* Top bar */}
        <div className="flex items-center justify-between border-b border-[#f0f0f5] bg-[#f8f8fc] shrink-0" style={{ padding: "16px 20px" }}>
          <span className="text-[12px] font-bold text-[#9ca3af] uppercase tracking-wider">User Details</span>
          <div className="flex items-center" style={{ gap: "8px" }}>
            <button onClick={onEdit} className="inline-flex items-center gap-1.5 rounded-lg border border-[#f0f0f5] bg-white text-[12px] font-bold text-(--text-primary) hover:border-(--accent-purple) hover:text-(--accent-purple) transition-all" style={{ padding: "6px 12px" }}>
              <Pencil size={12} /> Edit
            </button>
            <button onClick={onDelete} className="inline-flex items-center gap-1.5 rounded-lg border border-[#f0f0f5] bg-white text-[12px] font-bold text-red-500 hover:border-red-300 hover:bg-red-50 transition-all" style={{ padding: "6px 12px" }}>
              <Trash2 size={12} /> Delete
            </button>
            <button onClick={onClose} className="w-8 h-8 flex items-center justify-center rounded-lg text-[#9ca3af] hover:text-(--text-primary) hover:bg-[#f0f0f5] transition-all">
              <X size={16} />
            </button>
          </div>
        </div>

        {/* Body */}
        <div className="flex-1 overflow-y-auto" style={{ padding: "24px", display: "flex", flexDirection: "column", gap: "22px" }}>

          {/* Hero profile */}
          <div className="flex flex-col items-center text-center rounded-2xl border border-[#f0f0f5]" style={{ padding: "28px 20px", gap: "14px" }}>
            {/* Avatar */}
            <div className="relative">
              <div
                className="rounded-2xl flex items-center justify-center text-[26px] font-bold text-white"
                style={{ width: "72px", height: "72px", background: user.suspended ? "#9ca3af" : user.color }}
              >
                {user.initials}
              </div>
              {user.suspended && (
                <div className="absolute -bottom-1 -right-1 w-6 h-6 rounded-full flex items-center justify-center border-2 border-white" style={{ background: "#dc2626" }}>
                  <ShieldOff size={10} className="text-white" />
                </div>
              )}
            </div>

            <div className="flex flex-col" style={{ gap: "6px" }}>
              <h2 className="text-[20px] font-bold text-(--text-primary)">{user.name}</h2>
              <p className="text-[13px] text-[#9ca3af]">{user.email}</p>
              <div className="flex items-center justify-center" style={{ gap: "6px" }}>
                <span className="inline-flex items-center rounded-full text-[11px] font-bold" style={{ padding: "4px 12px", background: roleCfg.bg, color: roleCfg.color }}>
                  {roleCfg.label}
                </span>
                {user.suspended && (
                  <span className="inline-flex items-center rounded-full text-[11px] font-bold" style={{ padding: "4px 12px", background: "#fee2e2", color: "#991b1b" }}>
                    Suspended
                  </span>
                )}
              </div>
            </div>

            {/* Role description */}
            <p className="text-[12px] text-[#9ca3af] leading-relaxed">{roleCfg.description}</p>
          </div>

          {/* Info grid */}
          <div className="rounded-2xl border border-[#f0f0f5]" style={{ padding: "0 16px" }}>
            <InfoRow icon={<Mail size={14} />} label="Email Address">
              {user.email}
            </InfoRow>
            <InfoRow icon={<Shield size={14} />} label="Role">
              <span className="inline-flex rounded-lg text-[12px] font-bold" style={{ padding: "2px 10px", background: roleCfg.bg, color: roleCfg.color }}>
                {roleCfg.label}
              </span>
            </InfoRow>
            {user.department && (
              <InfoRow icon={<Building2 size={14} />} label="Department">
                {user.department}
              </InfoRow>
            )}
            <InfoRow icon={<Calendar size={14} />} label="Member Since">
              {fmtDate(user.created_at)}
            </InfoRow>
            <InfoRow icon={<Clock size={14} />} label="Last Active">
              {user.last_active ? fmtLastActive(user.last_active) : "—"}
            </InfoRow>
            <InfoRow icon={<UserCheck size={14} />} label="Account Status">
              <span className="inline-flex items-center rounded-full text-[11px] font-bold" style={{ padding: "3px 10px", gap: "4px", background: user.suspended ? "#fee2e2" : "#dcfce7", color: user.suspended ? "#991b1b" : "#074616" }}>
                <span className="rounded-full" style={{ width: "5px", height: "5px", background: user.suspended ? "#dc2626" : "#16a34a" }} />
                {user.suspended ? "Suspended" : "Active"}
              </span>
            </InfoRow>
          </div>
        </div>

        {/* Suspend / unsuspend footer */}
        <div className="border-t border-[#f0f0f5] bg-[#f8f8fc] shrink-0" style={{ padding: "16px 20px" }}>
          <button
            onClick={onToggleSuspend}
            className="w-full inline-flex items-center justify-center gap-2 rounded-xl text-[13px] font-bold transition-all hover:opacity-90"
            style={{
              padding: "11px 0",
              background: user.suspended ? "#dcfce7" : "#fef3c7",
              color:      user.suspended ? "#074616" : "#AF580B",
            }}
          >
            {user.suspended ? <Shield size={14} /> : <ShieldOff size={14} />}
            {user.suspended ? "Unsuspend Account" : "Suspend Account"}
          </button>
        </div>
      </div>
    </>
  );
}
