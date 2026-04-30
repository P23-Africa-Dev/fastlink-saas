"use client";

import React, { useState } from "react";
import { X } from "lucide-react";
import { ModalButton } from "./ModalButton";

interface Status { id: number; name: string; }
interface Drive  { id: number; name: string; }

interface NewLeadModalProps {
  statuses: Status[];
  drives:   Drive[];
  onClose:  () => void;
}

const PRIORITIES = ["low", "normal", "high"] as const;
type Priority = typeof PRIORITIES[number];
const CURRENCIES = ["USD", "EUR", "GBP", "NGN"] as const;

const PRIORITY_STYLES: Record<Priority, { activeBg: string; activeColor: string; activeBorder: string }> = {
  low:    { activeBg: "#f0f0f5",   activeColor: "#9ca3af", activeBorder: "#9ca3af"  },
  normal: { activeBg: "#33084E15", activeColor: "#33084E", activeBorder: "#33084E"  },
  high:   { activeBg: "#AF580B15", activeColor: "#AF580B", activeBorder: "#AF580B"  },
};

const inputCls = "w-full rounded-xl border border-[#f0f0f5] bg-white text-[13px] outline-none focus:border-(--accent-purple) transition-colors";
const labelCls = "text-[13px] font-bold text-(--text-primary)";
const selectCls = `${inputCls} font-medium`;

export function NewLeadModal({ statuses, drives, onClose }: NewLeadModalProps) {
  const [priority, setPriority] = useState<Priority>("normal");

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-sm"
      style={{ padding: "16px" }}
      onClick={(e) => { if (e.target === e.currentTarget) onClose(); }}
    >
      <div className="bg-white rounded-2xl w-full max-w-2xl flex flex-col shadow-2xl overflow-hidden">

        {/* Header */}
        <div className="flex items-center justify-between border-b border-[#f0f0f5] bg-[#f8f8fc]" style={{ padding: "20px 24px" }}>
          <h2 className="text-lg font-bold text-(--text-primary)">Create New Lead</h2>
          <button onClick={onClose} className="text-[#9ca3af] hover:text-(--text-primary) transition-colors">
            <X size={20} />
          </button>
        </div>

        {/* Body */}
        <div className="overflow-y-auto" style={{ padding: "24px", maxHeight: "70vh", display: "flex", flexDirection: "column", gap: "20px" }}>

          {/* Row 1 */}
          <div className="grid grid-cols-1 sm:grid-cols-2" style={{ gap: "20px" }}>
            <div className="flex flex-col" style={{ gap: "8px" }}>
              <label className={labelCls}>First Name <span className="text-red-500">*</span></label>
              <input type="text" placeholder="e.g. Alice" className={inputCls} style={{ padding: "12px 16px" }} />
            </div>
            <div className="flex flex-col" style={{ gap: "8px" }}>
              <label className={labelCls}>Last Name</label>
              <input type="text" placeholder="e.g. Smith" className={inputCls} style={{ padding: "12px 16px" }} />
            </div>
          </div>

          {/* Row 2 */}
          <div className="grid grid-cols-1 sm:grid-cols-2" style={{ gap: "20px" }}>
            <div className="flex flex-col" style={{ gap: "8px" }}>
              <label className={labelCls}>Email</label>
              <input type="email" placeholder="alice@example.com" className={inputCls} style={{ padding: "12px 16px" }} />
            </div>
            <div className="flex flex-col" style={{ gap: "8px" }}>
              <label className={labelCls}>Phone</label>
              <input type="tel" placeholder="+1 234 567 8900" className={inputCls} style={{ padding: "12px 16px" }} />
            </div>
          </div>

          {/* Row 3 */}
          <div className="grid grid-cols-1 sm:grid-cols-2" style={{ gap: "20px" }}>
            <div className="flex flex-col" style={{ gap: "8px" }}>
              <label className={labelCls}>Company</label>
              <input type="text" placeholder="Globex Corp" className={inputCls} style={{ padding: "12px 16px" }} />
            </div>
            <div className="flex flex-col" style={{ gap: "8px" }}>
              <label className={labelCls}>Pipeline</label>
              <select className={selectCls} style={{ padding: "12px 16px" }}>
                {drives.map(d => <option key={d.id} value={d.id}>{d.name}</option>)}
              </select>
            </div>
          </div>

          {/* Row 4 */}
          <div className="grid grid-cols-1 sm:grid-cols-2" style={{ gap: "20px" }}>
            <div className="flex flex-col" style={{ gap: "8px" }}>
              <label className={labelCls}>Status</label>
              <select className={selectCls} style={{ padding: "12px 16px" }}>
                {statuses.map(s => <option key={s.id} value={s.id}>{s.name}</option>)}
              </select>
            </div>
            <div className="flex flex-col" style={{ gap: "8px" }}>
              <label className={labelCls}>Assigned To</label>
              <select className={selectCls} style={{ padding: "12px 16px" }}>
                <option value="">Unassigned</option>
                <option value="1">Me</option>
              </select>
            </div>
          </div>

          {/* Row 5 */}
          <div className="grid grid-cols-1 sm:grid-cols-2" style={{ gap: "20px" }}>
            <div className="flex flex-col" style={{ gap: "8px" }}>
              <label className={labelCls}>Estimated Value</label>
              <input type="number" placeholder="15000" className={inputCls} style={{ padding: "12px 16px" }} />
            </div>
            <div className="flex flex-col" style={{ gap: "8px" }}>
              <label className={labelCls}>Currency</label>
              <select className={selectCls} style={{ padding: "12px 16px" }}>
                {CURRENCIES.map(c => <option key={c} value={c}>{c}</option>)}
              </select>
            </div>
          </div>

          {/* Priority pill toggle */}
          <div className="flex flex-col" style={{ gap: "8px" }}>
            <label className={labelCls}>Priority</label>
            <div className="flex items-center" style={{ gap: "8px" }}>
              {PRIORITIES.map(p => {
                const s = PRIORITY_STYLES[p];
                const active = priority === p;
                return (
                  <button
                    key={p}
                    type="button"
                    onClick={() => setPriority(p)}
                    style={{
                      padding: "6px 16px",
                      borderRadius: "8px",
                      fontSize: "12px",
                      fontWeight: "700",
                      cursor: "pointer",
                      border: `1.5px solid ${active ? s.activeBorder : "#f0f0f5"}`,
                      background: active ? s.activeBg : "white",
                      color: active ? s.activeColor : "#9ca3af",
                      transition: "all 0.15s",
                      textTransform: "capitalize",
                    }}
                  >
                    {p}
                  </button>
                );
              })}
            </div>
          </div>

          {/* Notes */}
          <div className="flex flex-col" style={{ gap: "8px" }}>
            <label className={labelCls}>Notes</label>
            <textarea
              rows={3}
              placeholder="Add any background context..."
              className="w-full rounded-xl border border-[#f0f0f5] bg-white text-[13px] outline-none focus:border-(--accent-purple) transition-colors resize-none"
              style={{ padding: "12px 16px" }}
            />
          </div>
        </div>

        {/* Footer */}
        <div className="border-t border-[#f0f0f5] flex items-center justify-end bg-[#f8f8fc]" style={{ padding: "20px 24px", gap: "12px" }}>
          <ModalButton variant="secondary" onClick={onClose}>Cancel</ModalButton>
          <ModalButton variant="primary" onClick={onClose}>Save Lead</ModalButton>
        </div>
      </div>
    </div>
  );
}
