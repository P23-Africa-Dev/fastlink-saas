"use client";

import React from "react";
import { X, CalendarDays, User, Briefcase, Clock, CheckCircle2, XCircle, AlertCircle, MessageSquare } from "lucide-react";
import { LeaveRequest, STATUS_CONFIG, TYPE_CONFIG, fmtDate, fmtDateRange } from "./types";

interface RequestDetailDrawerProps {
  request:      LeaveRequest;
  isAdmin:      boolean;
  onClose:      () => void;
  onApprove:    () => void;
  onReject:     () => void;
  onModify:     () => void;
  onAccept:     () => void;
  onDecline:    () => void;
}

function InfoRow({ icon, label, children }: { icon: React.ReactNode; label: string; children: React.ReactNode }) {
  return (
    <div className="flex items-start border-b border-[#f0f0f5] last:border-0" style={{ padding: "12px 0", gap: "12px" }}>
      <div className="shrink-0 text-[#9ca3af]" style={{ marginTop: "1px" }}>{icon}</div>
      <div className="flex flex-col flex-1" style={{ gap: "2px" }}>
        <span className="text-[10px] font-bold uppercase tracking-wider text-[#9ca3af]">{label}</span>
        <div className="text-[13px] font-semibold text-(--text-primary)">{children}</div>
      </div>
    </div>
  );
}

function TimelineStep({
  icon, label, note, active, variant,
}: { icon: React.ReactNode; label: string; note?: string | null; active: boolean; variant: "default" | "success" | "danger" | "info" | "warning" }) {
  const colors = {
    default: { dot: "#d1d5db",  line: "#f0f0f5" },
    success: { dot: "#16a34a",  line: "#dcfce7" },
    danger:  { dot: "#dc2626",  line: "#fee2e2" },
    info:    { dot: "#2563eb",  line: "#dbeafe" },
    warning: { dot: "#d97706",  line: "#fef3c7" },
  }[variant];

  return (
    <div className="flex items-start" style={{ gap: "12px" }}>
      <div className="flex flex-col items-center shrink-0">
        <div
          className="rounded-full flex items-center justify-center"
          style={{ width: "28px", height: "28px", background: active ? colors.dot : "#f3f4f6", color: active ? "white" : "#9ca3af" }}
        >
          {icon}
        </div>
      </div>
      <div className="flex flex-col flex-1 pb-4" style={{ gap: "3px" }}>
        <span className="text-[12px] font-bold" style={{ color: active ? "#1f2937" : "#9ca3af" }}>{label}</span>
        {note && <p className="text-[12px] text-[#6b7280] leading-relaxed">{note}</p>}
      </div>
    </div>
  );
}

export function RequestDetailDrawer({ request, isAdmin, onClose, onApprove, onReject, onModify, onAccept, onDecline }: RequestDetailDrawerProps) {
  const statusCfg = STATUS_CONFIG[request.status];
  const typeCfg   = TYPE_CONFIG[request.type];

  const showDecideButtons  = isAdmin && request.status === "pending";
  const showRespondButtons = !isAdmin && request.status === "modified";

  return (
    <>
      <div className="fixed inset-0 bg-black/30 z-40" onClick={onClose} />

      <div className="fixed top-0 right-0 h-full bg-white z-50 flex flex-col shadow-2xl overflow-hidden" style={{ width: "480px", maxWidth: "100vw" }}>

        {/* Top bar */}
        <div className="flex items-center justify-between border-b border-[#f0f0f5] bg-[#f8f8fc] shrink-0" style={{ padding: "16px 20px" }}>
          <div className="flex items-center" style={{ gap: "10px" }}>
            <span className="inline-flex items-center rounded-full text-[11px] font-bold"
              style={{ padding: "4px 12px", gap: "5px", background: typeCfg.bg, color: typeCfg.color }}>
              {typeCfg.label} Leave
            </span>
            <span className="inline-flex items-center rounded-full text-[11px] font-bold"
              style={{ padding: "4px 12px", gap: "5px", background: statusCfg.bg, color: statusCfg.color }}>
              <span className="rounded-full" style={{ width: "5px", height: "5px", background: statusCfg.dot }} />
              {statusCfg.label}
            </span>
          </div>
          <button onClick={onClose} className="w-8 h-8 flex items-center justify-center rounded-lg text-[#9ca3af] hover:text-(--text-primary) hover:bg-[#f0f0f5] transition-all">
            <X size={16} />
          </button>
        </div>

        {/* Body */}
        <div className="flex-1 overflow-y-auto" style={{ padding: "24px", display: "flex", flexDirection: "column", gap: "22px" }}>

          {/* Title */}
          <div>
            <h2 className="text-[20px] font-bold text-(--text-primary) leading-tight">{typeCfg.label} Leave Request</h2>
            <p className="text-[12px] text-[#9ca3af]" style={{ marginTop: "4px" }}>Submitted {new Date(request.created_at).toLocaleDateString("en-US", { month: "long", day: "numeric", year: "numeric" })}</p>
          </div>

          {/* Modified alert */}
          {request.status === "modified" && (
            <div className="rounded-xl border border-[#bfdbfe] bg-[#eff6ff] flex items-start" style={{ padding: "14px 16px", gap: "10px" }}>
              <AlertCircle size={16} style={{ color: "#2563eb", flexShrink: 0, marginTop: "1px" }} />
              <div className="flex flex-col" style={{ gap: "4px" }}>
                <p className="text-[13px] font-bold" style={{ color: "#1d4ed8" }}>Supervisor Requested Changes</p>
                <p className="text-[12px]" style={{ color: "#2563eb" }}>{request.supervisor_note}</p>
                {request.modified_start_date && request.modified_end_date && (
                  <p className="text-[12px] font-bold" style={{ color: "#1d4ed8" }}>
                    Proposed: {fmtDateRange(request.modified_start_date, request.modified_end_date)}
                  </p>
                )}
              </div>
            </div>
          )}

          {/* Details card */}
          <div className="rounded-2xl border border-[#f0f0f5]" style={{ padding: "0 16px" }}>
            <InfoRow icon={<User size={14} />} label="Applicant">
              <div className="flex items-center" style={{ gap: "8px" }}>
                <div className="rounded-full flex items-center justify-center text-[10px] font-bold text-white" style={{ width: "22px", height: "22px", background: request.user_color }}>
                  {request.user_initials}
                </div>
                {request.user_name}
              </div>
            </InfoRow>
            <InfoRow icon={<Briefcase size={14} />} label="Leave Type">
              <span className="inline-flex items-center rounded-lg text-[12px] font-bold" style={{ padding: "2px 10px", background: typeCfg.bg, color: typeCfg.color }}>
                {typeCfg.label}
              </span>
            </InfoRow>
            <InfoRow icon={<CalendarDays size={14} />} label="Original Dates">
              <div className="flex items-center" style={{ gap: "8px" }}>
                <span>{fmtDateRange(request.start_date, request.end_date)}</span>
                <span className="rounded-lg text-[11px] font-bold" style={{ padding: "2px 8px", background: "#f3e8ff", color: "#33084E" }}>
                  {request.days} day{request.days !== 1 ? "s" : ""}
                </span>
              </div>
            </InfoRow>
            {request.modified_start_date && (
              <InfoRow icon={<CalendarDays size={14} />} label="Proposed Dates">
                <span style={{ color: "#2563eb" }}>{fmtDateRange(request.modified_start_date, request.modified_end_date!)}</span>
              </InfoRow>
            )}
            <InfoRow icon={<User size={14} />} label="Supervisor">
              <div className="flex items-center" style={{ gap: "8px" }}>
                <div className="rounded-full flex items-center justify-center text-[10px] font-bold text-white" style={{ width: "22px", height: "22px", background: "#AF580B" }}>
                  {request.supervisor_initials}
                </div>
                {request.supervisor_name}
              </div>
            </InfoRow>
            <InfoRow icon={<MessageSquare size={14} />} label="Reason">
              {request.reason}
            </InfoRow>
          </div>

          {/* Decision timeline */}
          <div className="flex flex-col" style={{ gap: "6px" }}>
            <h3 className="text-[11px] font-bold text-[#9ca3af] uppercase tracking-wider">Activity Timeline</h3>
            <div className="flex flex-col" style={{ paddingTop: "8px" }}>
              <TimelineStep
                icon={<Clock size={12} />}
                label="Request Submitted"
                note={`By ${request.user_name}`}
                active={true}
                variant="default"
              />
              <TimelineStep
                icon={request.status === "approved" ? <CheckCircle2 size={12} /> : request.status === "rejected" ? <XCircle size={12} /> : request.status === "modified" ? <AlertCircle size={12} /> : <Clock size={12} />}
                label={request.status === "approved" ? "Approved by Supervisor" : request.status === "rejected" ? "Rejected by Supervisor" : request.status === "modified" ? "Modification Requested" : "Awaiting Decision"}
                note={request.decision_note || request.supervisor_note || (request.status === "pending" ? "Pending supervisor review" : null)}
                active={request.status !== "pending"}
                variant={request.status === "approved" ? "success" : request.status === "rejected" ? "danger" : request.status === "modified" ? "info" : "warning"}
              />
              {(request.status === "modified" || request.sender_response_note) && (
                <TimelineStep
                  icon={<MessageSquare size={12} />}
                  label={request.sender_response_note ? "Staff Responded" : "Awaiting Your Response"}
                  note={request.sender_response_note}
                  active={!!request.sender_response_note}
                  variant={request.sender_response_note ? "success" : "warning"}
                />
              )}
            </div>
          </div>
        </div>

        {/* Action footer */}
        {(showDecideButtons || showRespondButtons) && (
          <div className="border-t border-[#f0f0f5] bg-[#f8f8fc] shrink-0" style={{ padding: "16px 20px" }}>
            {showDecideButtons && (
              <div className="flex flex-col" style={{ gap: "8px" }}>
                <p className="text-[11px] font-bold text-[#9ca3af] uppercase tracking-wider">Supervisor Actions</p>
                <div className="flex items-center" style={{ gap: "8px" }}>
                  <button onClick={onApprove} className="flex-1 rounded-xl text-[13px] font-bold text-white transition-all hover:opacity-90" style={{ padding: "10px 0", background: "#074616" }}>
                    Approve
                  </button>
                  <button onClick={onModify}  className="flex-1 rounded-xl text-[13px] font-bold text-white transition-all hover:opacity-90" style={{ padding: "10px 0", background: "#1d4ed8" }}>
                    Modify
                  </button>
                  <button onClick={onReject}  className="flex-1 rounded-xl text-[13px] font-bold text-white transition-all hover:opacity-90" style={{ padding: "10px 0", background: "#dc2626" }}>
                    Reject
                  </button>
                </div>
              </div>
            )}
            {showRespondButtons && (
              <div className="flex flex-col" style={{ gap: "8px" }}>
                <p className="text-[11px] font-bold text-[#9ca3af] uppercase tracking-wider">Your Response</p>
                <div className="flex items-center" style={{ gap: "8px" }}>
                  <button onClick={onAccept}  className="flex-1 rounded-xl text-[13px] font-bold text-white transition-all hover:opacity-90" style={{ padding: "10px 0", background: "#074616" }}>
                    Accept Changes
                  </button>
                  <button onClick={onDecline} className="flex-1 rounded-xl text-[13px] font-bold text-white transition-all hover:opacity-90" style={{ padding: "10px 0", background: "#dc2626" }}>
                    Decline
                  </button>
                </div>
              </div>
            )}
          </div>
        )}
      </div>
    </>
  );
}
