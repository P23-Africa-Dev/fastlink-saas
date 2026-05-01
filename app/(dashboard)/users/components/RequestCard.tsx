"use client";

import React from "react";
import { CalendarDays, Clock, User, AlertCircle, CheckCircle2, XCircle } from "lucide-react";
import { LeaveRequest, STATUS_CONFIG, TYPE_CONFIG, fmtDateRange } from "./types";

interface RequestCardProps {
  request:    LeaveRequest;
  isAdmin:    boolean;
  onClick:    () => void;
  onApprove?: () => void;
  onReject?:  () => void;
  onModify?:  () => void;
}

export function RequestCard({ request, isAdmin, onClick, onApprove, onReject, onModify }: RequestCardProps) {
  const statusCfg = STATUS_CONFIG[request.status];
  const typeCfg   = TYPE_CONFIG[request.type];
  const needsResponse = request.status === "modified";
  const needsDecision = isAdmin && request.status === "pending";

  return (
    <div
      onClick={onClick}
      className="bg-white rounded-2xl border border-[#f0f0f5] rounded-2xl border cursor-pointer group transition-all shadow-md border-[#d1d5db] hover:bg-[#f0f8ff] hover:border-[#d1d5db] flex flex-col overflow-hidden"
      style={{ borderLeft: `4px solid ${statusCfg.dot}` }}
    >
      {/* Attention banner — modified requests */}
      {needsResponse && (
        <div className="flex items-center" style={{ padding: "7px 16px", gap: "6px", background: "#eff6ff", borderBottom: "1px solid #dbeafe" }}>
          <AlertCircle size={12} style={{ color: "#2563eb" }} />
          <span className="text-[11px] font-bold" style={{ color: "#1d4ed8" }}>Response required from you</span>
        </div>
      )}

      <div className="flex flex-col" style={{ padding: "16px 18px", gap: "12px" }}>

        {/* Top row — type + status */}
        <div className="flex items-center justify-between" style={{ gap: "8px" }}>
          <span
            className="inline-flex items-center rounded-lg text-[11px] font-bold"
            style={{ padding: "3px 10px", background: typeCfg.bg, color: typeCfg.color }}
          >
            {typeCfg.label}
          </span>
          <span
            className="inline-flex items-center rounded-full text-[10px] font-bold"
            style={{ padding: "3px 10px", gap: "4px", background: statusCfg.bg, color: statusCfg.color }}
          >
            <span className="rounded-full" style={{ width: "5px", height: "5px", background: statusCfg.dot }} />
            {statusCfg.label}
          </span>
        </div>

        {/* Applicant (admin view) */}
        {isAdmin && (
          <div className="flex items-center" style={{ gap: "8px" }}>
            <div
              className="rounded-full flex items-center justify-center text-[10px] font-bold text-white shrink-0"
              style={{ width: "26px", height: "26px", background: request.user_color }}
            >
              {request.user_initials}
            </div>
            <span className="text-[13px] font-bold text-(--text-primary)">{request.user_name}</span>
          </div>
        )}

        {/* Date range */}
        <div className="flex items-start" style={{ gap: "8px" }}>
          <CalendarDays size={14} className="text-[#9ca3af] shrink-0 mt-0.5" />
          <div className="flex flex-col" style={{ gap: "2px" }}>
            <span className="text-[13px] font-semibold text-(--text-primary)">{fmtDateRange(request.start_date, request.end_date)}</span>
            {request.modified_start_date && (
              <span className="text-[11px] font-bold" style={{ color: "#2563eb" }}>
                Proposed: {fmtDateRange(request.modified_start_date, request.modified_end_date!)}
              </span>
            )}
          </div>
        </div>

        {/* Days + supervisor row */}
        <div className="flex items-center justify-between">
          <div className="flex items-center" style={{ gap: "6px" }}>
            <span className="rounded-lg text-[11px] font-bold" style={{ padding: "2px 8px", background: "#f3e8ff", color: "#33084E" }}>
              {request.days} day{request.days !== 1 ? "s" : ""}
            </span>
          </div>
          <div className="flex items-center" style={{ gap: "5px" }}>
            <User size={11} className="text-[#9ca3af]" />
            <span className="text-[11px] text-[#9ca3af]">{request.supervisor_name}</span>
          </div>
        </div>

        {/* Reason preview */}
        {request.reason && (
          <p className="text-[12px] text-[#6b7280] leading-relaxed line-clamp-2">{request.reason}</p>
        )}

        {/* Decision note */}
        {request.decision_note && (
          <div className="rounded-lg border border-[#f0f0f5] bg-[#f8f8fc]" style={{ padding: "8px 12px" }}>
            <p className="text-[11px] font-bold text-[#9ca3af] uppercase tracking-wider" style={{ marginBottom: "2px" }}>Decision Note</p>
            <p className="text-[12px] text-[#6b7280] line-clamp-2">{request.decision_note}</p>
          </div>
        )}

        {/* Quick admin action buttons */}
        {needsDecision && (
          <div className="flex items-center" style={{ gap: "6px", borderTop: "1px solid #f0f0f5", paddingTop: "12px" }}>
            <button
              onClick={e => { e.stopPropagation(); onApprove?.(); }}
              className="flex-1 inline-flex items-center justify-center gap-1 rounded-xl text-[11px] font-bold text-white transition-all hover:opacity-90"
              style={{ padding: "7px 0", background: "#074616" }}
            >
              <CheckCircle2 size={11} /> Approve
            </button>
            <button
              onClick={e => { e.stopPropagation(); onModify?.(); }}
              className="flex-1 inline-flex items-center justify-center gap-1 rounded-xl text-[11px] font-bold text-white transition-all hover:opacity-90"
              style={{ padding: "7px 0", background: "#1d4ed8" }}
            >
              Modify
            </button>
            <button
              onClick={e => { e.stopPropagation(); onReject?.(); }}
              className="flex-1 inline-flex items-center justify-center gap-1 rounded-xl text-[11px] font-bold text-white transition-all hover:opacity-90"
              style={{ padding: "7px 0", background: "#dc2626" }}
            >
              <XCircle size={11} /> Reject
            </button>
          </div>
        )}
      </div>
    </div>
  );
}
