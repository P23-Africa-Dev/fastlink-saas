"use client";

import React, { useState, useRef } from "react";
import { X, Paperclip, FileText, XCircle } from "lucide-react";
import { ModalButton } from "./ModalButton";
import type { FollowUp } from "../hooks/useCrm";

interface CreateFollowUpModalProps {
  leadName: string;
  onClose: () => void;
  onSave: (payload: FormData | Record<string, unknown>) => void;
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

export function CreateFollowUpModal({ leadName, onClose, onSave, isSaving }: CreateFollowUpModalProps) {
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [channel, setChannel] = useState("");
  const [followUpDate, setFollowUpDate] = useState("");
  const [files, setFiles] = useState<File[]>([]);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const selected = Array.from(e.target.files ?? []);
    setFiles(prev => {
      const merged = [...prev, ...selected].slice(0, 10);
      return merged;
    });
    e.target.value = "";
  };

  const removeFile = (idx: number) => setFiles(prev => prev.filter((_, i) => i !== idx));

  const handleSave = () => {
    if (!title.trim()) return;

    const content: Record<string, unknown> = {
      title: title.trim(),
      description: description.trim() || undefined,
      channel: channel || undefined,
      follow_up_date: followUpDate || undefined,
    };

    const formSchema = {
      fields: [
        { label: "Title", type: "text", required: true },
        { label: "Description", type: "textarea", required: false },
        { label: "Channel", type: "select", required: false, options: CHANNELS },
        { label: "Follow-up Date", type: "date", required: false },
      ],
    };

    if (files.length > 0) {
      const fd = new FormData();
      fd.append("title", title.trim());
      fd.append("content", JSON.stringify(content));
      fd.append("form_schema", JSON.stringify(formSchema));
      files.forEach(f => fd.append("attachments[]", f));
      onSave(fd);
    } else {
      onSave({ title: title.trim(), content, form_schema: formSchema });
    }
  };

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
            <h2 className="text-lg font-bold text-(--text-primary)">Log Follow-Up</h2>
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
              placeholder="e.g. Sent pricing proposal"
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
              placeholder="What happened or was discussed..."
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
            <label className={labelCls}>Attachments <span className="text-[#9ca3af] font-normal">(max 10 files, 10MB each)</span></label>
            <input
              ref={fileInputRef}
              type="file"
              multiple
              className="hidden"
              onChange={handleFileChange}
            />
            <button
              type="button"
              onClick={() => fileInputRef.current?.click()}
              disabled={files.length >= 10}
              className="flex items-center justify-center gap-2 rounded-xl border-2 border-dashed border-[#f0f0f5] text-[13px] font-bold text-[#9ca3af] hover:border-(--accent-purple) hover:text-(--accent-purple) transition-all disabled:opacity-40 disabled:cursor-not-allowed"
              style={{ padding: "14px" }}
            >
              <Paperclip size={15} />
              Attach files
            </button>
            {files.length > 0 && (
              <div className="flex flex-col" style={{ gap: "6px" }}>
                {files.map((f, idx) => (
                  <div
                    key={idx}
                    className="flex items-center justify-between rounded-xl border border-[#f0f0f5] bg-[#f8f8fc]"
                    style={{ padding: "10px 12px", gap: "8px" }}
                  >
                    <div className="flex items-center min-w-0" style={{ gap: "8px" }}>
                      <FileText size={14} className="text-[#9ca3af] shrink-0" />
                      <span className="text-[12px] font-semibold text-(--text-primary) truncate">{f.name}</span>
                      <span className="text-[11px] text-[#9ca3af] shrink-0">{formatBytes(f.size)}</span>
                    </div>
                    <button onClick={() => removeFile(idx)} className="text-[#9ca3af] hover:text-red-500 transition-colors shrink-0">
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
            {isSaving ? "Saving..." : "Log Follow-Up"}
          </ModalButton>
        </div>
      </div>
    </div>
  );
}
