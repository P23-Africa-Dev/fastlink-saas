"use client";

import React, { useState, useRef } from "react";
import { X, Paperclip, FileText, XCircle, AlertCircle } from "lucide-react";
import { ModalButton } from "./ModalButton";
import type { FollowUp, FollowUpUpdateResponse } from "../hooks/useCrm";

interface EditFollowUpModalProps {
  followUp: FollowUp;
  leadName: string;
  onClose: () => void;
  onSave: (payload: FormData | Record<string, unknown>) => Promise<FollowUpUpdateResponse>;
  isSaving?: boolean;
}

const inputCls = "w-full rounded-xl border border-[#f0f0f5] bg-white text-[13px] outline-none focus:border-(--accent-purple) transition-colors";
const labelCls = "text-[13px] font-bold text-(--text-primary)";

const CHANNELS = ["Email", "Phone", "WhatsApp", "In-person", "Video call", "Other"];

function formatBytes(bytes: number): string {
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
}

function getStringContent(followUp: FollowUp, key: string): string {
  const val = followUp.content[key];
  return typeof val === "string" ? val : "";
}

export function EditFollowUpModal({ followUp, leadName, onClose, onSave, isSaving }: EditFollowUpModalProps) {
  const [title, setTitle] = useState(followUp.title);
  const [description, setDescription] = useState(getStringContent(followUp, "description"));
  const [channel, setChannel] = useState(getStringContent(followUp, "channel"));
  const [followUpDate, setFollowUpDate] = useState(getStringContent(followUp, "follow_up_date"));
  const [newFiles, setNewFiles] = useState<File[]>([]);
  const [removeIds, setRemoveIds] = useState<number[]>([]);
  const [approvalBanner, setApprovalBanner] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const existingAttachments = followUp.attachments.filter(a => !removeIds.includes(a.id));

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const selected = Array.from(e.target.files ?? []);
    setNewFiles(prev => [...prev, ...selected].slice(0, 10 - existingAttachments.length));
    e.target.value = "";
  };

  const removeNewFile = (idx: number) => setNewFiles(prev => prev.filter((_, i) => i !== idx));
  const removeExisting = (id: number) => setRemoveIds(prev => [...prev, id]);

  const handleSave = async () => {
    if (!title.trim()) return;

    const content: Record<string, unknown> = {
      title: title.trim(),
      description: description.trim() || undefined,
      channel: channel || undefined,
      follow_up_date: followUpDate || undefined,
    };

    const hasChanges = newFiles.length > 0 || removeIds.length > 0;

    let payload: FormData | Record<string, unknown>;

    if (hasChanges) {
      const fd = new FormData();
      fd.append("title", title.trim());
      fd.append("content", JSON.stringify(content));
      newFiles.forEach(f => fd.append("attachments_add[]", f));
      removeIds.forEach(id => fd.append("attachment_ids_remove[]", String(id)));
      payload = fd;
    } else {
      payload = { title: title.trim(), content };
    }

    const result = await onSave(payload);
    if (result.mode === "approval_required") {
      setApprovalBanner(true);
    } else {
      onClose();
    }
  };

  if (approvalBanner) {
    return (
      <div
        className="fixed inset-0 z-[60] flex items-center justify-center bg-black/40 backdrop-blur-sm"
        style={{ padding: "16px" }}
      >
        <div className="bg-white rounded-2xl w-full max-w-md flex flex-col shadow-2xl overflow-hidden">
          <div className="flex flex-col items-center text-center" style={{ padding: "40px 32px", gap: "16px" }}>
            <div className="w-14 h-14 rounded-full bg-amber-50 flex items-center justify-center">
              <AlertCircle size={28} className="text-amber-500" />
            </div>
            <div className="flex flex-col" style={{ gap: "8px" }}>
              <h3 className="text-[17px] font-bold text-(--text-primary)">Approval Required</h3>
              <p className="text-[13px] text-[#9ca3af]">
                Your changes have been submitted for review. A supervisor or admin will approve or reject the update.
              </p>
            </div>
            <ModalButton variant="primary" onClick={onClose} style={{ width: "100%" }}>
              Got it
            </ModalButton>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div
      className="fixed inset-0 z-[60] flex items-center justify-center bg-black/40 backdrop-blur-sm"
      style={{ padding: "16px" }}
      onClick={e => { if (e.target === e.currentTarget) onClose(); }}
    >
      <div className="bg-white rounded-2xl w-full max-w-lg flex flex-col shadow-2xl overflow-hidden max-h-[90vh]">

        {/* Header */}
        <div className="flex items-center justify-between border-b border-[#f0f0f5] bg-[#f8f8fc] shrink-0" style={{ padding: "20px 24px" }}>
          <div>
            <h2 className="text-lg font-bold text-(--text-primary)">Edit Follow-Up</h2>
            <p className="text-[12px] text-[#9ca3af]" style={{ marginTop: "2px" }}>{leadName}</p>
          </div>
          <button onClick={onClose} className="text-[#9ca3af] hover:text-(--text-primary) transition-colors">
            <X size={20} />
          </button>
        </div>

        {/* Body */}
        <div className="flex-1 overflow-y-auto flex flex-col" style={{ padding: "24px", gap: "20px" }}>

          {/* Title */}
          <div className="flex flex-col" style={{ gap: "8px" }}>
            <label className={labelCls}>Title <span className="text-red-500">*</span></label>
            <input
              type="text"
              value={title}
              onChange={e => setTitle(e.target.value)}
              className={inputCls}
              style={{ padding: "12px 16px" }}
            />
          </div>

          {/* Description */}
          <div className="flex flex-col" style={{ gap: "8px" }}>
            <label className={labelCls}>Description</label>
            <textarea
              rows={4}
              value={description}
              onChange={e => setDescription(e.target.value)}
              className={`${inputCls} resize-none`}
              style={{ padding: "12px 16px" }}
            />
          </div>

          {/* Channel */}
          <div className="flex flex-col" style={{ gap: "8px" }}>
            <label className={labelCls}>Communication Channel</label>
            <select
              value={channel}
              onChange={e => setChannel(e.target.value)}
              className={inputCls}
              style={{ padding: "12px 16px" }}
            >
              <option value="">— Select channel —</option>
              {CHANNELS.map(c => <option key={c} value={c}>{c}</option>)}
            </select>
          </div>

          {/* Follow-up date */}
          <div className="flex flex-col" style={{ gap: "8px" }}>
            <label className={labelCls}>Follow-Up Date</label>
            <input
              type="date"
              value={followUpDate}
              onChange={e => setFollowUpDate(e.target.value)}
              className={inputCls}
              style={{ padding: "12px 16px" }}
            />
          </div>

          {/* Attachments */}
          <div className="flex flex-col" style={{ gap: "8px" }}>
            <label className={labelCls}>Attachments</label>

            {existingAttachments.length > 0 && (
              <div className="flex flex-col" style={{ gap: "6px" }}>
                {existingAttachments.map(a => (
                  <div
                    key={a.id}
                    className="flex items-center justify-between rounded-xl border border-[#f0f0f5] bg-[#f8f8fc]"
                    style={{ padding: "10px 12px", gap: "8px" }}
                  >
                    <div className="flex items-center min-w-0" style={{ gap: "8px" }}>
                      <FileText size={14} className="text-[#9ca3af] shrink-0" />
                      <span className="text-[12px] font-semibold text-(--text-primary) truncate">{a.filename}</span>
                      {a.size && <span className="text-[11px] text-[#9ca3af] shrink-0">{formatBytes(a.size)}</span>}
                    </div>
                    <button onClick={() => removeExisting(a.id)} className="text-[#9ca3af] hover:text-red-500 transition-colors shrink-0">
                      <XCircle size={15} />
                    </button>
                  </div>
                ))}
              </div>
            )}

            <input ref={fileInputRef} type="file" multiple className="hidden" onChange={handleFileChange} />
            <button
              type="button"
              onClick={() => fileInputRef.current?.click()}
              disabled={(existingAttachments.length + newFiles.length) >= 10}
              className="flex items-center justify-center gap-2 rounded-xl border-2 border-dashed border-[#f0f0f5] text-[13px] font-bold text-[#9ca3af] hover:border-(--accent-purple) hover:text-(--accent-purple) transition-all disabled:opacity-40 disabled:cursor-not-allowed"
              style={{ padding: "14px" }}
            >
              <Paperclip size={15} />
              Add more files
            </button>

            {newFiles.length > 0 && (
              <div className="flex flex-col" style={{ gap: "6px" }}>
                {newFiles.map((f, idx) => (
                  <div
                    key={idx}
                    className="flex items-center justify-between rounded-xl border border-[#f0f0f5] bg-[#f8f8fc]"
                    style={{ padding: "10px 12px", gap: "8px" }}
                  >
                    <div className="flex items-center min-w-0" style={{ gap: "8px" }}>
                      <FileText size={14} className="text-(--accent-purple) shrink-0" />
                      <span className="text-[12px] font-semibold text-(--text-primary) truncate">{f.name}</span>
                      <span className="text-[11px] text-[#9ca3af] shrink-0">{formatBytes(f.size)}</span>
                    </div>
                    <button onClick={() => removeNewFile(idx)} className="text-[#9ca3af] hover:text-red-500 transition-colors shrink-0">
                      <XCircle size={15} />
                    </button>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>

        {/* Footer */}
        <div className="border-t border-[#f0f0f5] flex items-center justify-end bg-[#f8f8fc] shrink-0" style={{ padding: "20px 24px", gap: "12px" }}>
          <ModalButton variant="secondary" onClick={onClose}>Cancel</ModalButton>
          <ModalButton variant="primary" onClick={handleSave} disabled={!title.trim() || isSaving}>
            {isSaving ? "Saving..." : "Save Changes"}
          </ModalButton>
        </div>
      </div>
    </div>
  );
}
