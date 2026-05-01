"use client";

import React, { useState } from "react";
import { X, CheckCircle2, XCircle, CalendarDays } from "lucide-react";
import { ModalButton } from "../../crm/components/ModalButton";
import { LeaveRequest, TYPE_CONFIG, fmtDateRange } from "./types";

interface RespondModalProps {
  request:  LeaveRequest;
  accept:   boolean;
  onClose:  () => void;
  onSubmit: (note: string) => void;
}

export function RespondModal({ request, accept, onClose, onSubmit }: RespondModalProps) {
  const [note, setNote] = useState("");

  const typeCfg     = TYPE_CONFIG[request.type];
  const accentColor = accept ? "#074616" : "#991b1b";
  const accentBg    = accept ? "#dcfce7"  : "#fee2e2";
  const Icon        = accept ? CheckCircle2 : XCircle;
  const actionLabel = accept ? "Accept Changes" : "Decline";

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-sm"
      style={{ padding: "16px" }}
      onClick={e => { if (e.target === e.currentTarget) onClose(); }}
    >
      <div className="bg-white rounded-2xl w-full max-w-md flex flex-col shadow-2xl overflow-hidden">

        {/* Header */}
        <div className="flex items-center justify-between border-b border-[#f0f0f5] bg-[#f8f8fc]" style={{ padding: "18px 22px" }}>
          <div className="flex items-center" style={{ gap: "10px" }}>
            <div className="w-8 h-8 rounded-xl flex items-center justify-center" style={{ background: accentBg }}>
              <Icon size={15} style={{ color: accentColor }} />
            </div>
            <div>
              <h2 className="text-[15px] font-bold text-(--text-primary)">{actionLabel}</h2>
              <p className="text-[11px] text-[#9ca3af]">Modification response</p>
            </div>
          </div>
          <button onClick={onClose} className="text-[#9ca3af] hover:text-(--text-primary) transition-colors"><X size={18} /></button>
        </div>

        {/* Body */}
        <div className="flex flex-col" style={{ padding: "22px", gap: "16px" }}>

          {/* Proposed dates summary */}
          <div className="rounded-xl border border-[#f0f0f5]" style={{ padding: "14px 16px" }}>
            <div className="flex items-center" style={{ gap: "6px", marginBottom: "8px" }}>
              <CalendarDays size={13} style={{ color: "#2563eb" }} />
              <span className="text-[11px] font-bold text-[#9ca3af] uppercase tracking-wider">Supervisor's Proposed Dates</span>
            </div>
            <p className="text-[14px] font-bold" style={{ color: "#1d4ed8" }}>
              {fmtDateRange(request.modified_start_date!, request.modified_end_date!)}
            </p>
            {request.supervisor_note && (
              <p className="text-[12px] text-[#6b7280]" style={{ marginTop: "6px" }}>"{request.supervisor_note}"</p>
            )}
          </div>

          {/* Response note */}
          <div className="flex flex-col" style={{ gap: "6px" }}>
            <label className="text-[11px] font-bold text-[#9ca3af] uppercase tracking-wider">
              Your Note <span className="normal-case font-medium">(optional)</span>
            </label>
            <textarea
              rows={3}
              placeholder={accept ? "e.g. Works for me, thank you!" : "e.g. Those dates don't work for me either."}
              value={note}
              onChange={e => setNote(e.target.value)}
              className="w-full rounded-xl border border-[#f0f0f5] text-[13px] outline-none resize-none transition-colors placeholder:text-[#9ca3af] text-(--text-primary)"
              style={{ padding: "12px 14px" }}
            />
          </div>
        </div>

        {/* Footer */}
        <div className="flex items-center justify-end border-t border-[#f0f0f5] bg-[#f8f8fc]" style={{ padding: "14px 22px", gap: "8px" }}>
          <ModalButton variant="secondary" onClick={onClose} style={{ padding: "8px 16px" }}>Cancel</ModalButton>
          <button
            onClick={() => onSubmit(note)}
            className="inline-flex items-center gap-1.5 rounded-xl text-[13px] font-bold text-white transition-all hover:opacity-90"
            style={{ padding: "8px 18px", background: accentColor }}
          >
            <Icon size={13} /> {actionLabel}
          </button>
        </div>
      </div>
    </div>
  );
}
