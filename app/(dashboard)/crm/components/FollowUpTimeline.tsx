"use client";

import React, { useState } from "react";
import {
  Plus, FileText, Download, Clock, CheckCircle2, XCircle, Eye,
  ChevronDown, ChevronUp, Pencil, MessageSquare,
} from "lucide-react";
import api from "@/lib/api";
import type { FollowUp, FollowUpUpdateRequest } from "../hooks/useCrm";

interface FollowUpTimelineProps {
  followUps: FollowUp[];
  isLoading: boolean;
  currentUserId?: number;
  onLogFollowUp: () => void;
  onEditFollowUp: (f: FollowUp) => void;
  onApprove: (f: FollowUp, req: FollowUpUpdateRequest) => void;
  onReject: (f: FollowUp, req: FollowUpUpdateRequest) => void;
}

function formatDate(raw: string) {
  try {
    return new Date(raw).toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" });
  } catch {
    return raw;
  }
}

function formatDatetime(raw: string) {
  try {
    return new Date(raw).toLocaleString("en-US", {
      month: "short", day: "numeric", year: "numeric",
      hour: "numeric", minute: "2-digit",
    });
  } catch {
    return raw;
  }
}

const STATUS_STYLE: Record<string, { bg: string; color: string; label: string }> = {
  pending: { bg: "#FEF3C7", color: "#D97706", label: "Pending Approval" },
  approved: { bg: "#D1FAE5", color: "#059669", label: "Approved" },
  rejected: { bg: "#FEE2E2", color: "#DC2626", label: "Rejected" },
};

function normalizeAttachmentApiPath(path: string): string {
  if (path.startsWith("/api/v1/")) {
    return path.replace("/api/v1", "");
  }

  return path;
}

function AttachmentChip({ followUpId, attachment }: { followUpId: number; attachment: FollowUp["attachments"][0] }) {
  const [downloading, setDownloading] = useState(false);
  const [previewing, setPreviewing] = useState(false);

  const fetchAttachmentBlob = async (rawPath: string): Promise<Blob> => {
    const endpoint = normalizeAttachmentApiPath(rawPath);
    const response = await api.get(endpoint, { responseType: "blob" });

    return new Blob([response.data as BlobPart], {
      type: attachment.mime_type || "application/octet-stream",
    });
  };

  const handlePreview = async () => {
    if (previewing || downloading) return;

    setPreviewing(true);

    try {
      const previewPath = attachment.preview_url || attachment.file_url || attachment.download_url;
      const blob = await fetchAttachmentBlob(previewPath);
      const url = window.URL.createObjectURL(blob);

      window.open(url, "_blank", "noopener,noreferrer");

      // Give the new tab enough time to load before revoking the object URL.
      window.setTimeout(() => window.URL.revokeObjectURL(url), 60_000);
    } catch {
      // silent — user will notice if preview didn't open
    } finally {
      setPreviewing(false);
    }
  };

  const handleDownload = async () => {
    if (downloading || previewing) return;
    setDownloading(true);

    try {
      const downloadPath = attachment.download_url || `/crm/followups/${followUpId}/attachments/${attachment.id}/download`;
      const blob = await fetchAttachmentBlob(downloadPath);
      const url = window.URL.createObjectURL(blob);

      const a = document.createElement("a");
      a.href = url;
      a.download = attachment.original_filename;
      a.click();

      window.URL.revokeObjectURL(url);
    } catch {
      // silent — user will notice nothing downloaded
    } finally {
      setDownloading(false);
    }
  };

  return (
    <div
      className="inline-flex items-center rounded-lg border border-[#f0f0f5] bg-[#f8f8fc] text-[11px] font-semibold text-(--text-primary)"
      style={{ gap: "2px", padding: "3px 4px 3px 8px" }}
    >
      <button
        onClick={handlePreview}
        disabled={previewing || downloading}
        className="inline-flex items-center gap-1.5 rounded-md hover:text-(--accent-purple) transition-colors disabled:opacity-50"
        style={{ padding: "2px 4px" }}
      >
        <FileText size={12} className="shrink-0" />
        <span className="truncate max-w-[120px]">{attachment.original_filename}</span>
        <Eye size={11} className="shrink-0 text-[#9ca3af]" />
      </button>

      <button
        onClick={handleDownload}
        disabled={downloading || previewing}
        className="inline-flex items-center justify-center rounded-md text-[#9ca3af] hover:text-(--accent-purple) transition-colors disabled:opacity-50"
        style={{ width: "24px", height: "24px" }}
        aria-label="Download attachment"
      >
        <Download size={11} />
      </button>
    </div>
  );
}

function ContentDisplay({ content }: { content: Record<string, unknown> }) {
  const skip = new Set(["title"]);
  const entries = Object.entries(content).filter(([k, v]) => !skip.has(k) && v !== undefined && v !== null && v !== "");

  if (entries.length === 0) return null;

  const labels: Record<string, string> = {
    description: "Description",
    channel: "Channel",
    follow_up_date: "Follow-up Date",
  };

  return (
    <div className="flex flex-col" style={{ gap: "6px" }}>
      {entries.map(([key, value]) => (
        <div key={key} className="flex flex-col" style={{ gap: "2px" }}>
          <span className="text-[10px] font-bold uppercase tracking-wider text-[#9ca3af]">
            {labels[key] ?? key.replace(/_/g, " ")}
          </span>
          <span className="text-[13px] text-(--text-primary)">{String(value)}</span>
        </div>
      ))}
    </div>
  );
}

function UpdateRequestBadge({
  req,
  followUp,
  currentUserId,
  onApprove,
  onReject,
}: {
  req: FollowUpUpdateRequest;
  followUp: FollowUp;
  currentUserId?: number;
  onApprove: () => void;
  onReject: () => void;
}) {
  const style = STATUS_STYLE[req.status] ?? STATUS_STYLE.pending;
  const canAct = req.status === "pending" && currentUserId !== undefined && currentUserId !== req.requested_by;

  return (
    <div
      className="rounded-xl border flex flex-col"
      style={{ padding: "12px 14px", gap: "8px", borderColor: `${style.color}30`, background: style.bg + "55" }}
    >
      <div className="flex items-center justify-between" style={{ gap: "8px" }}>
        <span className="text-[11px] font-bold uppercase tracking-wider" style={{ color: style.color }}>
          {style.label}
        </span>
        {req.status === "pending" && <Clock size={13} style={{ color: style.color }} />}
        {req.status === "approved" && <CheckCircle2 size={13} style={{ color: style.color }} />}
        {req.status === "rejected" && <XCircle size={13} style={{ color: style.color }} />}
      </div>

      {Object.keys(req.proposed_changes).length > 0 && (
        <p className="text-[12px] text-[#9ca3af]">
          Proposed: {Object.keys(req.proposed_changes).join(", ")}
        </p>
      )}

      {req.reason && (
        <p className="text-[12px] text-(--text-primary) italic">&quot;{req.reason}&quot;</p>
      )}

      {canAct && (
        <div className="flex items-center" style={{ gap: "8px", marginTop: "4px" }}>
          <button
            onClick={onApprove}
            className="inline-flex items-center gap-1.5 rounded-lg bg-green-600 text-white text-[11px] font-bold hover:opacity-90 transition-all"
            style={{ padding: "5px 12px" }}
          >
            <CheckCircle2 size={12} /> Approve
          </button>
          <button
            onClick={onReject}
            className="inline-flex items-center gap-1.5 rounded-lg bg-red-500 text-white text-[11px] font-bold hover:opacity-90 transition-all"
            style={{ padding: "5px 12px" }}
          >
            <XCircle size={12} /> Reject
          </button>
        </div>
      )}
    </div>
  );
}

function FollowUpCard({
  followUp,
  currentUserId,
  onEdit,
  onApprove,
  onReject,
}: {
  followUp: FollowUp;
  currentUserId?: number;
  onEdit: () => void;
  onApprove: (req: FollowUpUpdateRequest) => void;
  onReject: (req: FollowUpUpdateRequest) => void;
}) {
  const [expanded, setExpanded] = useState(true);
  const hasPending = followUp.update_requests.some(r => r.status === "pending");
  const isOwner = currentUserId !== undefined && followUp.creator.id === currentUserId;

  return (
    <div
      className="bg-white rounded-2xl border flex flex-col overflow-hidden"
      style={{
        borderColor: hasPending ? "#D9770630" : "#f0f0f5",
        boxShadow: hasPending ? "0 0 0 2px #D9770615" : "0 1px 4px rgba(0,0,0,0.05)",
      }}
    >
      {/* Card header */}
      <div
        className="flex items-center justify-between cursor-pointer"
        style={{ padding: "14px 16px", borderBottom: expanded ? "1px solid #f0f0f5" : "none" }}
        onClick={() => setExpanded(v => !v)}
      >
        <div className="flex items-center min-w-0" style={{ gap: "10px" }}>
          <div
            className="shrink-0 w-8 h-8 rounded-full flex items-center justify-center text-[12px] font-bold"
            style={{ background: "#33084E15", color: "#33084E" }}
          >
            <MessageSquare size={14} />
          </div>
          <div className="min-w-0">
            <p className="text-[13px] font-bold text-(--text-primary) truncate">{followUp.title}</p>
            <p className="text-[11px] text-[#9ca3af]" style={{ marginTop: "2px" }}>
              {followUp.creator.name} · {formatDatetime(followUp.created_at)}
            </p>
          </div>
        </div>
        <div className="flex items-center shrink-0" style={{ gap: "8px" }}>
          {hasPending && (
            <span className="text-[10px] font-bold rounded-full px-2 py-0.5" style={{ background: "#FEF3C7", color: "#D97706" }}>
              Pending
            </span>
          )}
          {isOwner && (
            <button
              onClick={e => { e.stopPropagation(); onEdit(); }}
              className="w-7 h-7 flex items-center justify-center rounded-lg text-[#9ca3af] hover:text-(--accent-purple) hover:bg-[#f0f0f5] transition-all"
            >
              <Pencil size={13} />
            </button>
          )}
          {expanded ? <ChevronUp size={15} className="text-[#9ca3af]" /> : <ChevronDown size={15} className="text-[#9ca3af]" />}
        </div>
      </div>

      {expanded && (
        <div className="flex flex-col" style={{ padding: "16px", gap: "14px" }}>
          {/* Content fields */}
          <ContentDisplay content={followUp.content} />

          {/* Attachments */}
          {followUp.attachments.length > 0 && (
            <div className="flex flex-col" style={{ gap: "6px" }}>
              <span className="text-[10px] font-bold uppercase tracking-wider text-[#9ca3af]">Attachments</span>
              <div className="flex flex-wrap" style={{ gap: "6px" }}>
                {followUp.attachments.map(a => (
                  <AttachmentChip key={a.id} followUpId={followUp.id} attachment={a} />
                ))}
              </div>
            </div>
          )}

          {/* Update requests */}
          {followUp.update_requests.length > 0 && (
            <div className="flex flex-col" style={{ gap: "6px" }}>
              <span className="text-[10px] font-bold uppercase tracking-wider text-[#9ca3af]">Change Requests</span>
              {followUp.update_requests.map(req => (
                <UpdateRequestBadge
                  key={req.id}
                  req={req}
                  followUp={followUp}
                  currentUserId={currentUserId}
                  onApprove={() => onApprove(req)}
                  onReject={() => onReject(req)}
                />
              ))}
            </div>
          )}

          {/* Audit trail */}
          {followUp.activities.length > 0 && (
            <div className="flex flex-col" style={{ gap: "4px" }}>
              <span className="text-[10px] font-bold uppercase tracking-wider text-[#9ca3af]">Audit Trail</span>
              {followUp.activities.map(act => (
                <div key={act.id} className="flex items-start" style={{ gap: "6px" }}>
                  <div className="w-1.5 h-1.5 rounded-full bg-[#d1d5db] shrink-0" style={{ marginTop: "6px" }} />
                  <div>
                    <span className="text-[11px] font-semibold text-(--text-primary)">{act.event}</span>
                    {act.description && <span className="text-[11px] text-[#9ca3af]"> — {act.description}</span>}
                    <span className="block text-[10px] text-[#9ca3af]">{formatDate(act.created_at)}</span>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}
    </div>
  );
}

export function FollowUpTimeline({
  followUps,
  isLoading,
  currentUserId,
  onLogFollowUp,
  onEditFollowUp,
  onApprove,
  onReject,
}: FollowUpTimelineProps) {
  const sorted = [...followUps].sort(
    (a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime(),
  );

  return (
    <div className="flex flex-col" style={{ gap: "0" }}>
      {/* Section header */}
      <div className="flex items-center justify-between" style={{ marginBottom: "16px" }}>
        <h3 className="text-[13px] font-bold text-(--text-primary) uppercase tracking-wider">Follow-Ups</h3>
        <button
          onClick={onLogFollowUp}
          className="inline-flex items-center gap-1.5 rounded-lg text-[12px] font-bold text-white transition-all hover:opacity-90"
          style={{ padding: "6px 12px", background: "#33084E", gap: "6px" }}
        >
          <Plus size={13} />
          Log Follow-Up
        </button>
      </div>

      {isLoading && (
        <div className="flex flex-col" style={{ gap: "12px" }}>
          {[1, 2].map(i => (
            <div key={i} className="h-20 rounded-2xl bg-[#f0f0f5] animate-pulse" />
          ))}
        </div>
      )}

      {!isLoading && sorted.length === 0 && (
        <div className="flex flex-col items-center justify-center text-center rounded-2xl border border-dashed border-[#f0f0f5]" style={{ padding: "40px 24px", gap: "8px" }}>
          <div className="w-10 h-10 rounded-full bg-[#f0f0f5] flex items-center justify-center text-[#9ca3af]">
            <MessageSquare size={18} />
          </div>
          <p className="text-[13px] font-bold text-(--text-primary)">No follow-ups yet</p>
          <p className="text-[12px] text-[#9ca3af]">Log a follow-up to track your outreach.</p>
        </div>
      )}

      {!isLoading && sorted.length > 0 && (
        <div className="flex flex-col" style={{ gap: "12px" }}>
          {sorted.map(f => (
            <FollowUpCard
              key={f.id}
              followUp={f}
              currentUserId={currentUserId}
              onEdit={() => onEditFollowUp(f)}
              onApprove={req => onApprove(f, req)}
              onReject={req => onReject(f, req)}
            />
          ))}
        </div>
      )}
    </div>
  );
}
