"use client";

import React, { useState, useMemo } from "react";
import { X, CalendarDays, ChevronRight } from "lucide-react";
import { ModalButton } from "../../crm/components/ModalButton";
import { LeaveType, LEAVE_TYPES, TYPE_CONFIG, SUPERVISORS, countDays } from "./types";

interface NewLeaveRequestModalProps {
  onClose:  () => void;
  onCreate: (data: {
    type: LeaveType; reason: string;
    start_date: string; end_date: string; supervisor_id: number;
  }) => void;
}

export function NewLeaveRequestModal({ onClose, onCreate }: NewLeaveRequestModalProps) {
  const [type,      setType]      = useState<LeaveType>("annual");
  const [reason,    setReason]    = useState("");
  const [startDate, setStartDate] = useState("");
  const [endDate,   setEndDate]   = useState("");
  const [supId,     setSupId]     = useState<number>(SUPERVISORS[0].id);

  const days = useMemo(() => (startDate && endDate ? countDays(startDate, endDate) : 0), [startDate, endDate]);
  const valid = reason.trim() && startDate && endDate && endDate >= startDate;

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-sm"
      style={{ padding: "16px" }}
      onClick={e => { if (e.target === e.currentTarget) onClose(); }}
    >
      <div className="bg-white rounded-2xl w-full flex flex-col shadow-2xl overflow-hidden" style={{ maxWidth: "520px", maxHeight: "90vh" }}>

        {/* Header */}
        <div className="flex items-center justify-between border-b border-[#f0f0f5] bg-[#f8f8fc] shrink-0" style={{ padding: "18px 22px" }}>
          <div className="flex flex-col" style={{ gap: "2px" }}>
            <h2 className="text-[16px] font-bold text-(--text-primary)">New Leave Request</h2>
            <p className="text-[12px] text-[#9ca3af]">Submit a request for supervisor approval</p>
          </div>
          <button onClick={onClose} className="w-8 h-8 flex items-center justify-center rounded-lg text-[#9ca3af] hover:text-(--text-primary) hover:bg-[#f0f0f5] transition-all">
            <X size={16} />
          </button>
        </div>

        {/* Scrollable body */}
        <div className="flex-1 overflow-y-auto" style={{ padding: "22px" }}>
          <div className="flex flex-col" style={{ gap: "20px" }}>

            {/* Leave type pills */}
            <div className="flex flex-col" style={{ gap: "8px" }}>
              <label className="text-[11px] font-bold text-[#9ca3af] uppercase tracking-wider">Leave Type</label>
              <div className="flex flex-wrap" style={{ gap: "6px" }}>
                {LEAVE_TYPES.map(t => {
                  const cfg     = TYPE_CONFIG[t];
                  const active  = type === t;
                  return (
                    <button
                      key={t}
                      onClick={() => setType(t)}
                      className="rounded-xl text-[12px] font-bold border transition-all"
                      style={{
                        padding: "6px 14px",
                        background: active ? cfg.bg       : "white",
                        color:      active ? cfg.color    : "#9ca3af",
                        borderColor: active ? cfg.color   : "#f0f0f5",
                      }}
                    >
                      {cfg.label}
                    </button>
                  );
                })}
              </div>
            </div>

            {/* Date range */}
            <div className="flex flex-col" style={{ gap: "8px" }}>
              <label className="text-[11px] font-bold text-[#9ca3af] uppercase tracking-wider">Date Range</label>
              <div className="flex items-center rounded-xl border border-[#f0f0f5] overflow-hidden divide-x divide-[#f0f0f5]">
                <div className="flex flex-col flex-1" style={{ padding: "10px 14px", gap: "3px" }}>
                  <span className="text-[10px] font-bold text-[#9ca3af] uppercase tracking-wider">Start</span>
                  <input
                    type="date"
                    value={startDate}
                    onChange={e => setStartDate(e.target.value)}
                    className="text-[13px] font-semibold text-(--text-primary) outline-none bg-transparent"
                  />
                </div>
                <div className="flex items-center justify-center" style={{ padding: "0 12px" }}>
                  <ChevronRight size={14} className="text-[#9ca3af]" />
                </div>
                <div className="flex flex-col flex-1" style={{ padding: "10px 14px", gap: "3px" }}>
                  <span className="text-[10px] font-bold text-[#9ca3af] uppercase tracking-wider">End</span>
                  <input
                    type="date"
                    value={endDate}
                    min={startDate}
                    onChange={e => setEndDate(e.target.value)}
                    className="text-[13px] font-semibold text-(--text-primary) outline-none bg-transparent"
                  />
                </div>
              </div>

              {/* Day count badge */}
              {days > 0 && (
                <div className="flex items-center" style={{ gap: "6px" }}>
                  <CalendarDays size={13} className="text-[#9ca3af]" />
                  <span className="text-[12px] font-bold" style={{ color: "#33084E" }}>
                    {days} working day{days !== 1 ? "s" : ""} requested
                  </span>
                </div>
              )}
            </div>

            {/* Reason */}
            <div className="flex flex-col" style={{ gap: "8px" }}>
              <label className="text-[11px] font-bold text-[#9ca3af] uppercase tracking-wider">Reason</label>
              <textarea
                rows={3}
                placeholder="Briefly explain the reason for your leave…"
                value={reason}
                onChange={e => setReason(e.target.value)}
                className="w-full rounded-xl border border-[#f0f0f5] text-[13px] outline-none resize-none focus:border-[#33084E] transition-colors placeholder:text-[#9ca3af] text-(--text-primary)"
                style={{ padding: "12px 14px" }}
              />
            </div>

            {/* Supervisor */}
            <div className="flex flex-col" style={{ gap: "8px" }}>
              <label className="text-[11px] font-bold text-[#9ca3af] uppercase tracking-wider">Supervisor</label>
              <div className="flex flex-col rounded-xl border border-[#f0f0f5] overflow-hidden">
                {SUPERVISORS.map((s, i) => {
                  const active = supId === s.id;
                  return (
                    <button
                      key={s.id}
                      onClick={() => setSupId(s.id)}
                      className="flex items-center justify-between hover:bg-[#f8f8fc] transition-colors text-left"
                      style={{ padding: "11px 16px", borderTop: i > 0 ? "1px solid #f0f0f5" : "none" }}
                    >
                      <div className="flex items-center" style={{ gap: "10px" }}>
                        <div className="rounded-full flex items-center justify-center text-[10px] font-bold text-white shrink-0"
                          style={{ width: "28px", height: "28px", background: s.color }}>
                          {s.initials}
                        </div>
                        <span className="text-[13px] font-semibold text-(--text-primary)">{s.name}</span>
                      </div>
                      <div
                        className="rounded-full flex items-center justify-center transition-all shrink-0"
                        style={{ width: "18px", height: "18px", background: active ? "#33084E" : "#f0f0f5", border: `1.5px solid ${active ? "#33084E" : "#d1d5db"}` }}
                      >
                        {active && <div className="rounded-full bg-white" style={{ width: "6px", height: "6px" }} />}
                      </div>
                    </button>
                  );
                })}
              </div>
            </div>
          </div>
        </div>

        {/* Footer */}
        <div className="flex items-center justify-between border-t border-[#f0f0f5] bg-[#f8f8fc] shrink-0" style={{ padding: "14px 22px" }}>
          <span className="text-[12px] text-[#9ca3af]">
            {days > 0 ? `${days} day${days !== 1 ? "s" : ""} · ${TYPE_CONFIG[type].label} leave` : "Fill in all fields"}
          </span>
          <div className="flex items-center" style={{ gap: "8px" }}>
            <ModalButton variant="secondary" onClick={onClose} style={{ padding: "8px 16px" }}>Cancel</ModalButton>
            <ModalButton
              variant="primary"
              disabled={!valid}
              onClick={() => valid && onCreate({ type, reason, start_date: startDate, end_date: endDate, supervisor_id: supId })}
              style={{ padding: "8px 16px", opacity: valid ? 1 : 0.5, cursor: valid ? "pointer" : "not-allowed" }}
            >
              Submit Request
            </ModalButton>
          </div>
        </div>
      </div>
    </div>
  );
}
