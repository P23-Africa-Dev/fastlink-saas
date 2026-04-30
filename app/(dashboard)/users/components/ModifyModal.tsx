"use client";

import React, { useState } from "react";
import { X, CalendarDays, ChevronRight, Pencil } from "lucide-react";
import { ModalButton } from "../../crm/components/ModalButton";
import { LeaveRequest, TYPE_CONFIG, fmtDateRange, countDays } from "./types";

interface ModifyModalProps {
  request:  LeaveRequest;
  onClose:  () => void;
  onSubmit: (data: { supervisor_note: string; modified_start_date: string; modified_end_date: string }) => void;
}

export function ModifyModal({ request, onClose, onSubmit }: ModifyModalProps) {
  const [supNote,  setSupNote]  = useState("");
  const [newStart, setNewStart] = useState(request.start_date);
  const [newEnd,   setNewEnd]   = useState(request.end_date);

  const typeCfg  = TYPE_CONFIG[request.type];
  const newDays  = countDays(newStart, newEnd);
  const valid    = supNote.trim() && newStart && newEnd && newEnd >= newStart;

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
            <div className="w-8 h-8 rounded-xl flex items-center justify-center" style={{ background: "#dbeafe" }}>
              <Pencil size={14} style={{ color: "#1d4ed8" }} />
            </div>
            <div>
              <h2 className="text-[15px] font-bold text-(--text-primary)">Request Modification</h2>
              <p className="text-[11px] text-[#9ca3af]">Propose alternative dates</p>
            </div>
          </div>
          <button onClick={onClose} className="text-[#9ca3af] hover:text-(--text-primary) transition-colors"><X size={18} /></button>
        </div>

        {/* Body */}
        <div className="flex flex-col" style={{ padding: "22px", gap: "16px" }}>

          {/* Original request summary */}
          <div className="rounded-xl border border-[#f0f0f5] bg-[#f8f8fc]" style={{ padding: "12px 16px" }}>
            <div className="flex items-center justify-between" style={{ marginBottom: "4px" }}>
              <span className="text-[11px] font-bold text-[#9ca3af] uppercase tracking-wider">Original Request</span>
              <span className="inline-flex rounded-lg text-[11px] font-bold" style={{ padding: "2px 8px", background: typeCfg.bg, color: typeCfg.color }}>
                {typeCfg.label}
              </span>
            </div>
            <p className="text-[13px] font-semibold text-(--text-primary)">{fmtDateRange(request.start_date, request.end_date)}</p>
            <p className="text-[12px] text-[#9ca3af]">{request.days} day{request.days !== 1 ? "s" : ""} by {request.user_name}</p>
          </div>

          {/* Proposed new dates */}
          <div className="flex flex-col" style={{ gap: "8px" }}>
            <label className="text-[11px] font-bold text-[#9ca3af] uppercase tracking-wider">Proposed Dates</label>
            <div className="flex items-center rounded-xl border border-[#bfdbfe] overflow-hidden divide-x divide-[#dbeafe]">
              <div className="flex flex-col flex-1" style={{ padding: "10px 14px", gap: "3px" }}>
                <span className="text-[10px] font-bold text-[#2563eb] uppercase tracking-wider">New Start</span>
                <input
                  type="date"
                  value={newStart}
                  onChange={e => setNewStart(e.target.value)}
                  className="text-[13px] font-semibold text-(--text-primary) outline-none bg-transparent"
                />
              </div>
              <div className="flex items-center justify-center" style={{ padding: "0 10px" }}>
                <ChevronRight size={14} style={{ color: "#2563eb" }} />
              </div>
              <div className="flex flex-col flex-1" style={{ padding: "10px 14px", gap: "3px" }}>
                <span className="text-[10px] font-bold text-[#2563eb] uppercase tracking-wider">New End</span>
                <input
                  type="date"
                  value={newEnd}
                  min={newStart}
                  onChange={e => setNewEnd(e.target.value)}
                  className="text-[13px] font-semibold text-(--text-primary) outline-none bg-transparent"
                />
              </div>
            </div>
            {newDays > 0 && (
              <div className="flex items-center" style={{ gap: "6px" }}>
                <CalendarDays size={12} style={{ color: "#2563eb" }} />
                <span className="text-[12px] font-bold" style={{ color: "#1d4ed8" }}>{newDays} day{newDays !== 1 ? "s" : ""} proposed</span>
              </div>
            )}
          </div>

          {/* Supervisor note — required */}
          <div className="flex flex-col" style={{ gap: "6px" }}>
            <label className="text-[11px] font-bold text-[#9ca3af] uppercase tracking-wider">
              Note to Employee <span className="text-red-400">*</span>
            </label>
            <textarea
              rows={3}
              placeholder="Explain why you're proposing different dates…"
              value={supNote}
              onChange={e => setSupNote(e.target.value)}
              className="w-full rounded-xl border border-[#f0f0f5] text-[13px] outline-none resize-none focus:border-[#1d4ed8] transition-colors placeholder:text-[#9ca3af] text-(--text-primary)"
              style={{ padding: "12px 14px" }}
            />
          </div>
        </div>

        {/* Footer */}
        <div className="flex items-center justify-end border-t border-[#f0f0f5] bg-[#f8f8fc]" style={{ padding: "14px 22px", gap: "8px" }}>
          <ModalButton variant="secondary" onClick={onClose} style={{ padding: "8px 16px" }}>Cancel</ModalButton>
          <button
            disabled={!valid}
            onClick={() => valid && onSubmit({ supervisor_note: supNote, modified_start_date: newStart, modified_end_date: newEnd })}
            className="inline-flex items-center gap-1.5 rounded-xl text-[13px] font-bold text-white transition-all hover:opacity-90 disabled:opacity-50 disabled:cursor-not-allowed"
            style={{ padding: "8px 18px", background: "#1d4ed8" }}
          >
            <Pencil size={13} /> Send Modification
          </button>
        </div>
      </div>
    </div>
  );
}
