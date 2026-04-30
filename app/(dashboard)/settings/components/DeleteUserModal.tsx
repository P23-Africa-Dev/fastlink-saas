"use client";

import React, { useState } from "react";
import { X, Trash2, AlertTriangle } from "lucide-react";
import { ModalButton } from "../../crm/components/ModalButton";
import { User } from "./types";

interface DeleteUserModalProps {
  user:     User;
  onClose:  () => void;
  onDelete: () => void;
}

export function DeleteUserModal({ user, onClose, onDelete }: DeleteUserModalProps) {
  const [confirm, setConfirm] = useState("");
  const ready = confirm === user.name;

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-sm"
      style={{ padding: "16px" }}
      onClick={e => { if (e.target === e.currentTarget) onClose(); }}
    >
      <div className="bg-white rounded-2xl w-full max-w-sm flex flex-col shadow-2xl overflow-hidden">

        {/* Header */}
        <div className="flex items-center justify-between border-b border-[#f0f0f5] bg-[#f8f8fc]" style={{ padding: "18px 22px" }}>
          <div className="flex items-center" style={{ gap: "10px" }}>
            <div className="w-8 h-8 rounded-xl flex items-center justify-center" style={{ background: "#fee2e2" }}>
              <Trash2 size={14} style={{ color: "#dc2626" }} />
            </div>
            <h2 className="text-[15px] font-bold text-(--text-primary)">Delete User</h2>
          </div>
          <button onClick={onClose} className="text-[#9ca3af] hover:text-(--text-primary) transition-colors"><X size={18} /></button>
        </div>

        {/* Body */}
        <div className="flex flex-col" style={{ padding: "22px", gap: "16px" }}>

          {/* Warning */}
          <div className="rounded-xl border border-[#fecaca] bg-[#fff5f5] flex items-start" style={{ padding: "14px 16px", gap: "10px" }}>
            <AlertTriangle size={15} style={{ color: "#dc2626", flexShrink: 0, marginTop: "1px" }} />
            <p className="text-[12px] leading-relaxed" style={{ color: "#991b1b" }}>
              This action is <strong>permanent</strong>. Deleting <strong>{user.name}</strong> will remove all their data, sessions, and history. This cannot be undone.
            </p>
          </div>

          {/* User preview */}
          <div className="flex items-center rounded-xl border border-[#f0f0f5] bg-[#f8f8fc]" style={{ padding: "12px 14px", gap: "10px" }}>
            <div className="rounded-xl flex items-center justify-center text-[12px] font-bold text-white shrink-0" style={{ width: "36px", height: "36px", background: user.color }}>
              {user.initials}
            </div>
            <div className="flex flex-col" style={{ gap: "1px" }}>
              <span className="text-[13px] font-bold text-(--text-primary)">{user.name}</span>
              <span className="text-[11px] text-[#9ca3af]">{user.email}</span>
            </div>
          </div>

          {/* Confirm input */}
          <div className="flex flex-col" style={{ gap: "6px" }}>
            <label className="text-[11px] font-bold text-[#9ca3af] uppercase tracking-wider">
              Type <span style={{ color: "#374151", fontFamily: "monospace" }}>{user.name}</span> to confirm
            </label>
            <input
              type="text"
              placeholder={user.name}
              value={confirm}
              onChange={e => setConfirm(e.target.value)}
              className="w-full rounded-xl border text-[13px] font-medium outline-none transition-colors placeholder:text-[#d1d5db] text-(--text-primary)"
              style={{ padding: "11px 14px", borderColor: ready ? "#dc2626" : "#f0f0f5" }}
            />
          </div>
        </div>

        {/* Footer */}
        <div className="flex items-center justify-end border-t border-[#f0f0f5] bg-[#f8f8fc]" style={{ padding: "14px 22px", gap: "8px" }}>
          <ModalButton variant="secondary" onClick={onClose} style={{ padding: "8px 16px" }}>Cancel</ModalButton>
          <button
            disabled={!ready}
            onClick={onDelete}
            className="inline-flex items-center gap-1.5 rounded-xl text-[13px] font-bold text-white transition-all hover:opacity-90 disabled:opacity-40 disabled:cursor-not-allowed"
            style={{ padding: "8px 18px", background: "#dc2626" }}
          >
            <Trash2 size={13} /> Delete Permanently
          </button>
        </div>
      </div>
    </div>
  );
}
