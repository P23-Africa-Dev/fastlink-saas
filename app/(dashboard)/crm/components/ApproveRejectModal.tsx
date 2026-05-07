"use client";

import React, { useState } from "react";
import { X, CheckCircle2, XCircle } from "lucide-react";
import { ModalButton } from "./ModalButton";
import type { FollowUp, FollowUpUpdateRequest } from "../hooks/useCrm";

interface ApproveRejectModalProps {
  followUp: FollowUp;
  updateRequest: FollowUpUpdateRequest;
  leadName: string;
  mode: "approve" | "reject";
  onClose: () => void;
  onConfirm: (reason: string) => void;
  isSaving?: boolean;
}

export function ApproveRejectModal({
  followUp,
  updateRequest,
  leadName,
  mode,
  onClose,
  onConfirm,
  isSaving,
}: ApproveRejectModalProps) {
  const [reason, setReason] = useState("");

  const isApprove = mode === "approve";

  const proposedChanges = updateRequest.proposed_changes as Record<string, unknown>;
  const changedKeys = Object.keys(proposedChanges);

  const getDisplayValue = (val: unknown): string => {
    if (val === null || val === undefined) return "—";
    if (typeof val === "object") return JSON.stringify(val);
    return String(val);
  };

  return (
    <div
      className="fixed inset-0 z-70 flex items-center justify-center bg-black/40 backdrop-blur-sm"
      style={{ padding: "16px" }}
      onClick={e => { if (e.target === e.currentTarget) onClose(); }}
    >
      <div className="bg-white rounded-2xl w-full max-w-md flex flex-col shadow-2xl overflow-hidden">

        {/* Header */}
        <div className="flex items-center justify-between border-b border-[#f0f0f5] bg-[#f8f8fc]" style={{ padding: "20px 24px" }}>
          <div>
            <h2 className="text-lg font-bold text-(--text-primary)">
              {isApprove ? "Approve Changes" : "Reject Changes"}
            </h2>
            <p className="text-[12px] text-[#9ca3af]" style={{ marginTop: "2px" }}>{leadName}</p>
          </div>
          <button onClick={onClose} className="text-[#9ca3af] hover:text-(--text-primary) transition-colors">
            <X size={20} />
          </button>
        </div>

        {/* Body */}
        <div className="flex flex-col" style={{ padding: "24px", gap: "20px" }}>

          {/* Follow-up reference */}
          <div className="rounded-xl border border-[#f0f0f5] bg-[#f8f8fc]" style={{ padding: "14px 16px" }}>
            <p className="text-[11px] font-bold uppercase tracking-wider text-[#9ca3af]">Follow-Up</p>
            <p className="text-[13px] font-bold text-(--text-primary)" style={{ marginTop: "4px" }}>{followUp.title}</p>
          </div>

          {/* Proposed changes diff */}
          {changedKeys.length > 0 && (
            <div className="flex flex-col" style={{ gap: "8px" }}>
              <p className="text-[13px] font-bold text-(--text-primary)">Proposed Changes</p>
              <div className="rounded-xl border border-[#f0f0f5] overflow-hidden">
                {changedKeys.map((key, idx) => {
                  const currentVal = key === "title" ? followUp.title : (followUp.content[key] ?? (followUp as unknown as Record<string, unknown>)[key]);
                  const proposed = proposedChanges[key];
                  return (
                    <div
                      key={key}
                      className={`flex flex-col ${idx < changedKeys.length - 1 ? "border-b border-[#f0f0f5]" : ""}`}
                      style={{ padding: "10px 14px", gap: "4px" }}
                    >
                      <span className="text-[10px] font-bold uppercase tracking-wider text-[#9ca3af]">{key.replace(/_/g, " ")}</span>
                      <div className="flex flex-col" style={{ gap: "2px" }}>
                        <span className="text-[12px] text-[#9ca3af] line-through">{getDisplayValue(currentVal)}</span>
                        <span className="text-[12px] font-semibold text-(--text-primary)">{getDisplayValue(proposed)}</span>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          )}

          {/* Reason */}
          <div className="flex flex-col" style={{ gap: "8px" }}>
            <label className="text-[13px] font-bold text-(--text-primary)">
              Reason <span className="text-[#9ca3af] font-normal">(optional)</span>
            </label>
            <textarea
              rows={3}
              placeholder={isApprove ? "Why are you approving these changes?" : "Why are you rejecting these changes?"}
              value={reason}
              onChange={e => setReason(e.target.value)}
              className="w-full rounded-xl border border-[#f0f0f5] bg-white text-[13px] outline-none focus:border-(--accent-purple) transition-colors resize-none"
              style={{ padding: "12px 16px" }}
            />
          </div>
        </div>

        {/* Footer */}
        <div className="border-t border-[#f0f0f5] flex items-center justify-end bg-[#f8f8fc]" style={{ padding: "20px 24px", gap: "12px" }}>
          <ModalButton variant="secondary" onClick={onClose}>Cancel</ModalButton>
          {isApprove ? (
            <ModalButton
              variant="primary"
              onClick={() => onConfirm(reason)}
              disabled={isSaving}
            >
              <CheckCircle2 size={14} />
              {isSaving ? "Approving..." : "Approve"}
            </ModalButton>
          ) : (
            <ModalButton
              variant="danger"
              onClick={() => onConfirm(reason)}
              disabled={isSaving}
            >
              <XCircle size={14} />
              {isSaving ? "Rejecting..." : "Reject"}
            </ModalButton>
          )}
        </div>
      </div>
    </div>
  );
}
