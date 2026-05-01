"use client";

import React, { useState } from "react";
import { X, LogIn } from "lucide-react";
import { ModalButton } from "../../crm/components/ModalButton";

interface SignInModalProps {
  onClose:   () => void;
  onConfirm: (note: string) => void;
}

export function SignInModal({ onClose, onConfirm }: SignInModalProps) {
  const [note, setNote] = useState("");

  const now = new Date().toLocaleTimeString("en-US", { hour: "2-digit", minute: "2-digit" });

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
            <div className="w-8 h-8 rounded-xl flex items-center justify-center" style={{ background: "#33084E" }}>
              <LogIn size={15} className="text-white" />
            </div>
            <h2 className="text-[15px] font-bold text-(--text-primary)">Clock In</h2>
          </div>
          <button onClick={onClose} className="text-[#9ca3af] hover:text-(--text-primary) transition-colors">
            <X size={18} />
          </button>
        </div>

        {/* Body */}
        <div className="flex flex-col" style={{ padding: "22px 20px", gap: "16px" }}>
          {/* Time display */}
          <div className="flex items-center justify-between rounded-xl bg-[#f8f8fc] border border-[#f0f0f5]" style={{ padding: "12px 16px" }}>
            <span className="text-[12px] font-bold text-[#9ca3af] uppercase tracking-wider">Clock-in time</span>
            <span className="text-[20px] font-bold" style={{ color: "#33084E" }}>{now}</span>
          </div>

          {/* Note */}
          <div className="flex flex-col" style={{ gap: "6px" }}>
            <label className="text-[12px] font-bold text-[#9ca3af] uppercase tracking-wider">Note <span className="normal-case text-[#9ca3af] font-medium">(optional)</span></label>
            <textarea
              rows={3}
              placeholder="e.g. Starting work from office…"
              value={note}
              onChange={e => setNote(e.target.value)}
              className="w-full rounded-xl border border-[#f0f0f5] bg-[#f8f8fc] text-[13px] outline-none resize-none focus:border-[#33084E] transition-colors placeholder:text-[#9ca3af]"
              style={{ padding: "12px 14px" }}
            />
          </div>
        </div>

        {/* Footer */}
        <div className="flex items-center justify-end border-t border-[#f0f0f5] bg-[#f8f8fc]" style={{ padding: "14px 20px", gap: "8px" }}>
          <ModalButton variant="secondary" onClick={onClose} style={{ padding: "8px 16px" }}>Cancel</ModalButton>
          <ModalButton variant="primary" onClick={() => onConfirm(note)} style={{ padding: "8px 16px" }}>Clock In</ModalButton>
        </div>
      </div>
    </div>
  );
}
