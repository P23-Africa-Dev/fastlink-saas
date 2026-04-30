"use client";

import React, { useState } from "react";
import { X, CheckCircle2, XCircle } from "lucide-react";
import { ModalButton } from "../../crm/components/ModalButton";
import { LeaveRequest, TYPE_CONFIG, fmtDateRange } from "./types";

interface DecisionModalProps {
  request:  LeaveRequest;
  action:   "approve" | "reject";
  onClose:  () => void;
  onSubmit: (note: string) => void;
}

export function DecisionModal({ request, action, onClose, onSubmit }: DecisionModalProps) {
  const [note, setNote] = useState("");

  const isApprove = action === "approve";
  const typeCfg   = TYPE_CONFIG[request.type];

  const accentColor = isApprove ? "#074616" : "#991b1b";
  const accentBg    = isApprove ? "#dcfce7"  : "#fee2e2";
  const Icon        = isApprove ? CheckCircle2 : XCircle;
  const actionLabel = isApprove ? "Approve" : "Reject";

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
              <Icon size={16} style={{ color: accentColor }} />
            </div>
            <h2 className="text-[15px] font-bold text-(--text-primary)">{actionLabel} Request</h2>
          </div>
          <button onClick={onClose} className="text-[#9ca3af] hover:text-(--text-primary) transition-colors"><X size={18} /></button>
        </div>

        {/* Body */}
        <div className="flex flex-col" style={{ padding: "22px", gap: "16px" }}>

          {/* Request summary */}
          <div className="rounded-xl border border-[#f0f0f5] bg-[#f8f8fc]" style={{ padding: "14px 16px" }}>
            <div className="flex items-center justify-between" style={{ marginBottom: "6px" }}>
              <div className="flex items-center" style={{ gap: "8px" }}>
                <div className="rounded-full flex items-center justify-center text-[10px] font-bold text-white" style={{ width: "24px", height: "24px", background: request.user_color }}>
                  {request.user_initials}
                </div>
                <span className="text-[13px] font-bold text-(--text-primary)">{request.user_name}</span>
              </div>
              <span className="inline-flex rounded-lg text-[11px] font-bold" style={{ padding: "2px 8px", background: typeCfg.bg, color: typeCfg.color }}>
                {typeCfg.label}
              </span>
            </div>
            <p className="text-[12px] font-semibold" style={{ color: "#6b7280" }}>
              {fmtDateRange(request.start_date, request.end_date)} · {request.days} day{request.days !== 1 ? "s" : ""}
            </p>
          </div>

          {/* Decision note */}
          <div className="flex flex-col" style={{ gap: "6px" }}>
            <label className="text-[11px] font-bold text-[#9ca3af] uppercase tracking-wider">
              Decision Note <span className="normal-case font-medium">(optional)</span>
            </label>
            <textarea
              rows={3}
              placeholder={isApprove ? "e.g. Approved. Enjoy your time off!" : "e.g. We are short-staffed during this period."}
              value={note}
              onChange={e => setNote(e.target.value)}
              className="w-full rounded-xl border border-[#f0f0f5] text-[13px] outline-none resize-none transition-colors placeholder:text-[#9ca3af] text-(--text-primary)"
              style={{ padding: "12px 14px", borderColor: note ? accentColor : "#f0f0f5" }}
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
