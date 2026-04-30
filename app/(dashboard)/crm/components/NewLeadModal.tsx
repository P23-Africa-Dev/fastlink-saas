"use client";

import React from "react";
import { X } from "lucide-react";
import { ModalButton } from "./ModalButton";

interface Status {
  id: number;
  name: string;
}

interface NewLeadModalProps {
  statuses: Status[];
  onClose: () => void;
}

export function NewLeadModal({ statuses, onClose }: NewLeadModalProps) {
  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-sm"
      style={{ padding: "16px" }}
      onClick={(e) => { if (e.target === e.currentTarget) onClose(); }}
    >
      <div className="bg-white rounded-2xl w-full max-w-2xl flex flex-col shadow-2xl overflow-hidden animate-in fade-in zoom-in-95 duration-200">
        {/* Header */}
        <div
          className="flex items-center justify-between border-b border-[#f0f0f5] bg-[#f8f8fc]"
          style={{ padding: "20px 24px" }}
        >
          <h2 className="text-lg font-bold text-[var(--text-primary)]">Create New Lead</h2>
          <button
            onClick={onClose}
            className="text-[#9ca3af] hover:text-[var(--text-primary)] transition-colors"
          >
            <X size={20} />
          </button>
        </div>

        {/* Body */}
        <div className="overflow-y-auto flex-col" style={{ padding: "24px", maxHeight: "65vh" }}>
          <div className="grid grid-cols-1 sm:grid-cols-2" style={{ gap: "20px" }}>
            <div className="flex flex-col" style={{ gap: "8px" }}>
              <label className="text-[13px] font-bold text-[var(--text-primary)]">First Name</label>
              <input
                type="text"
                placeholder="e.g. Alice"
                className="w-full rounded-xl border border-[#f0f0f5] bg-white text-[13px] outline-none focus:border-[var(--accent-purple)] transition-colors"
                style={{ padding: "12px 16px" }}
              />
            </div>
            <div className="flex flex-col" style={{ gap: "8px" }}>
              <label className="text-[13px] font-bold text-[var(--text-primary)]">Last Name</label>
              <input
                type="text"
                placeholder="e.g. Smith"
                className="w-full rounded-xl border border-[#f0f0f5] bg-white text-[13px] outline-none focus:border-[var(--accent-purple)] transition-colors"
                style={{ padding: "12px 16px" }}
              />
            </div>
            <div className="flex flex-col" style={{ gap: "8px" }}>
              <label className="text-[13px] font-bold text-[var(--text-primary)]">Email</label>
              <input
                type="email"
                placeholder="alice@example.com"
                className="w-full rounded-xl border border-[#f0f0f5] bg-white text-[13px] outline-none focus:border-[var(--accent-purple)] transition-colors"
                style={{ padding: "12px 16px" }}
              />
            </div>
            <div className="flex flex-col" style={{ gap: "8px" }}>
              <label className="text-[13px] font-bold text-[var(--text-primary)]">Company</label>
              <input
                type="text"
                placeholder="Globex Corp"
                className="w-full rounded-xl border border-[#f0f0f5] bg-white text-[13px] outline-none focus:border-[var(--accent-purple)] transition-colors"
                style={{ padding: "12px 16px" }}
              />
            </div>
            <div className="flex flex-col" style={{ gap: "8px" }}>
              <label className="text-[13px] font-bold text-[var(--text-primary)]">Status</label>
              <select
                className="w-full rounded-xl border border-[#f0f0f5] bg-white text-[13px] font-medium outline-none focus:border-[var(--accent-purple)] transition-colors"
                style={{ padding: "12px 16px" }}
              >
                {statuses.map((s) => (
                  <option key={s.id} value={s.id}>{s.name}</option>
                ))}
              </select>
            </div>
            <div className="flex flex-col" style={{ gap: "8px" }}>
              <label className="text-[13px] font-bold text-[var(--text-primary)]">Estimated Value ($)</label>
              <input
                type="number"
                placeholder="15000"
                className="w-full rounded-xl border border-[#f0f0f5] bg-white text-[13px] outline-none focus:border-[var(--accent-purple)] transition-colors"
                style={{ padding: "12px 16px" }}
              />
            </div>
          </div>

          <div className="flex flex-col" style={{ gap: "8px", marginTop: "20px" }}>
            <label className="text-[13px] font-bold text-[var(--text-primary)]">Notes</label>
            <textarea
              rows={3}
              placeholder="Add any background context..."
              className="w-full rounded-xl border border-[#f0f0f5] bg-white text-[13px] outline-none focus:border-[var(--accent-purple)] transition-colors resize-none"
              style={{ padding: "12px 16px" }}
            />
          </div>
        </div>

        {/* Footer */}
        <div
          className="border-t border-[#f0f0f5] flex items-center justify-end bg-[#f8f8fc]"
          style={{ padding: "20px 24px", gap: "12px" }}
        >
          <ModalButton variant="secondary" onClick={onClose}>Cancel</ModalButton>
          <ModalButton variant="primary" onClick={onClose}>Save Lead</ModalButton>
        </div>
      </div>
    </div>
  );
}
