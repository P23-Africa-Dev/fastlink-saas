"use client";

import React, { useState } from "react";
import { X, LogOut, Clock } from "lucide-react";
import { ModalButton } from "../../crm/components/ModalButton";

interface SignOutModalProps {
  onClose:     () => void;
  onConfirm:   (note: string) => void;
  signInTime:  string;
}

function calcHours(signInISO: string) {
  const diff = Date.now() - new Date(signInISO).getTime();
  const h = Math.floor(diff / 3600000);
  const m = Math.floor((diff % 3600000) / 60000);
  return `${h}h ${m}m`;
}

export function SignOutModal({ onClose, onConfirm, signInTime }: SignOutModalProps) {
  const [note, setNote] = useState("");

  const now        = new Date().toLocaleTimeString("en-US", { hour: "2-digit", minute: "2-digit" });
  const signInFmt  = new Date(signInTime).toLocaleTimeString("en-US", { hour: "2-digit", minute: "2-digit" });
  const hoursWkd   = calcHours(signInTime);

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-sm"
      style={{ padding: "16px" }}
      onClick={e => { if (e.target === e.currentTarget) onClose(); }}
    >
      <div className="bg-white rounded-2xl w-full max-w-sm flex flex-col shadow-2xl overflow-hidden">

        {/* Header */}
        <div className="flex items-center justify-between border-b border-[#f0f0f5] bg-[#f8f8fc]" style={{ padding: "18px 20px" }}>
          <div className="flex items-center" style={{ gap: "10px" }}>
            <div className="w-8 h-8 rounded-xl flex items-center justify-center" style={{ background: "#AF580B" }}>
              <LogOut size={15} className="text-white" />
            </div>
            <h2 className="text-[15px] font-bold text-(--text-primary)">Clock Out</h2>
          </div>
          <button onClick={onClose} className="text-[#9ca3af] hover:text-(--text-primary) transition-colors">
            <X size={18} />
          </button>
        </div>

        {/* Body */}
        <div className="flex flex-col" style={{ padding: "22px 20px", gap: "16px" }}>
          {/* Time summary */}
          <div className="rounded-xl border border-[#f0f0f5] overflow-hidden">
            <div className="flex items-center justify-between border-b border-[#f0f0f5] bg-[#f8f8fc]" style={{ padding: "10px 16px" }}>
              <span className="text-[12px] font-bold text-[#9ca3af] uppercase tracking-wider">Clocked in at</span>
              <span className="text-[14px] font-bold text-(--text-primary)">{signInFmt}</span>
            </div>
            <div className="flex items-center justify-between border-b border-[#f0f0f5] bg-[#f8f8fc]" style={{ padding: "10px 16px" }}>
              <span className="text-[12px] font-bold text-[#9ca3af] uppercase tracking-wider">Clock-out time</span>
              <span className="text-[14px] font-bold text-(--text-primary)">{now}</span>
            </div>
            <div className="flex items-center justify-between bg-[#f8f8fc]" style={{ padding: "10px 16px" }}>
              <div className="flex items-center" style={{ gap: "6px" }}>
                <Clock size={13} className="text-[#9ca3af]" />
                <span className="text-[12px] font-bold text-[#9ca3af] uppercase tracking-wider">Hours worked</span>
              </div>
              <span className="text-[16px] font-bold" style={{ color: "#33084E" }}>{hoursWkd}</span>
            </div>
          </div>

          {/* Note */}
          <div className="flex flex-col" style={{ gap: "6px" }}>
            <label className="text-[12px] font-bold text-[#9ca3af] uppercase tracking-wider">Note <span className="normal-case text-[#9ca3af] font-medium">(optional)</span></label>
            <textarea
              rows={3}
              placeholder="e.g. Done for today, all tasks completed…"
              value={note}
              onChange={e => setNote(e.target.value)}
              className="w-full rounded-xl border border-[#f0f0f5] bg-[#f8f8fc] text-[13px] outline-none resize-none focus:border-[#AF580B] transition-colors placeholder:text-[#9ca3af]"
              style={{ padding: "12px 14px" }}
            />
          </div>
        </div>

        {/* Footer */}
        <div className="flex items-center justify-end border-t border-[#f0f0f5] bg-[#f8f8fc]" style={{ padding: "14px 20px", gap: "8px" }}>
          <ModalButton variant="secondary" onClick={onClose} style={{ padding: "8px 16px" }}>Cancel</ModalButton>
          <button
            onClick={() => onConfirm(note)}
            className="inline-flex items-center gap-1.5 rounded-xl text-[13px] font-bold text-white transition-all hover:opacity-90"
            style={{ padding: "8px 16px", background: "#AF580B" }}
          >
            <LogOut size={13} /> Clock Out
          </button>
        </div>
      </div>
    </div>
  );
}
