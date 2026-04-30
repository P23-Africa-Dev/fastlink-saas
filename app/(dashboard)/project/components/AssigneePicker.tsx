"use client";

import React, { useState } from "react";
import { X, Check } from "lucide-react";
import { ModalButton } from "./ModalButton";
import { MOCK_TEAM } from "./types";

interface AssigneePickerProps {
  currentIds: number[];
  onClose:    () => void;
  onSave:     (ids: number[]) => void;
}

export function AssigneePicker({ currentIds, onClose, onSave }: AssigneePickerProps) {
  const [selected, setSelected] = useState<number[]>(currentIds);

  const toggle = (id: number) =>
    setSelected(prev => prev.includes(id) ? prev.filter(a => a !== id) : [...prev, id]);

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-sm" style={{ padding: "16px" }}
      onClick={e => { if (e.target === e.currentTarget) onClose(); }}>
      <div className="bg-white rounded-2xl w-full max-w-xs flex flex-col shadow-2xl overflow-hidden">

        <div className="flex items-center justify-between border-b border-[#f0f0f5] bg-[#f8f8fc]" style={{ padding: "18px 20px" }}>
          <h2 className="text-[15px] font-bold text-(--text-primary)">Manage Assignees</h2>
          <button onClick={onClose} className="text-[#9ca3af] hover:text-(--text-primary) transition-colors"><X size={18} /></button>
        </div>

        <div className="flex flex-col overflow-y-auto" style={{ maxHeight: "60vh" }}>
          {MOCK_TEAM.map((m, i) => {
            const isSelected = selected.includes(m.id);
            return (
              <button
                key={m.id}
                onClick={() => toggle(m.id)}
                className="flex items-center justify-between hover:bg-[#f8f8fc] transition-colors text-left"
                style={{ padding: "12px 20px", borderTop: i > 0 ? "1px solid #f0f0f5" : "none" }}
              >
                <div className="flex items-center" style={{ gap: "10px" }}>
                  <div className="rounded-full flex items-center justify-center text-[11px] font-bold text-white shrink-0" style={{ width: "32px", height: "32px", background: m.color }}>
                    {m.initials}
                  </div>
                  <span className="text-[13px] font-semibold text-(--text-primary)">{m.name}</span>
                </div>
                <div
                  className="rounded-full flex items-center justify-center transition-all"
                  style={{ width: "20px", height: "20px", background: isSelected ? "#33084E" : "#f0f0f5", border: `1.5px solid ${isSelected ? "#33084E" : "#d1d5db"}` }}
                >
                  {isSelected && <Check size={11} className="text-white" />}
                </div>
              </button>
            );
          })}
        </div>

        <div className="border-t border-[#f0f0f5] flex items-center justify-between bg-[#f8f8fc]" style={{ padding: "16px 20px" }}>
          <span className="text-[12px] text-[#9ca3af] font-medium">{selected.length} selected</span>
          <div className="flex items-center" style={{ gap: "8px" }}>
            <ModalButton variant="secondary" onClick={onClose} style={{ padding: "7px 14px" }}>Cancel</ModalButton>
            <ModalButton variant="primary" onClick={() => { onSave(selected); onClose(); }} style={{ padding: "7px 14px" }}>Save</ModalButton>
          </div>
        </div>
      </div>
    </div>
  );
}
