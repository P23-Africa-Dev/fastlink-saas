"use client";

import React, { useState } from "react";
import { X, Check } from "lucide-react";
import { ModalButton } from "./ModalButton";
import { useUsers } from "../hooks/useProject";
import type { User } from "@/lib/types";

interface AssigneePickerProps {
  currentIds: number[];
  onClose: () => void;
  onSave: (ids: number[]) => void;
}

const colors = ["#33084E", "#AF580B", "#074616", "#1d4ed8", "#be185d", "#047857", "#dc2626", "#7c3aed"];

export function AssigneePicker({ currentIds, onClose, onSave }: AssigneePickerProps) {
  const [selected, setSelected] = useState<number[]>(currentIds);
  const { data: users = [], isLoading, isError } = useUsers();

  const toggle = (id: number) =>
    setSelected(prev => prev.includes(id) ? prev.filter(a => a !== id) : [...prev, id]);

  const getInitials = (name: string): string =>
    name.split(" ").map(p => p[0]).join("").toUpperCase().slice(0, 2);

  const getUserColor = (userId: number): string =>
    colors[userId % colors.length];

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-sm" style={{ padding: "16px" }}
      onClick={e => { if (e.target === e.currentTarget) onClose(); }}>
      <div className="bg-white rounded-2xl w-full max-w-xs flex flex-col shadow-2xl overflow-hidden">

        <div className="flex items-center justify-between border-b border-[#f0f0f5] bg-[#f8f8fc]" style={{ padding: "18px 20px" }}>
          <h2 className="text-[15px] font-bold text-(--text-primary)">Manage Assignees</h2>
          <button onClick={onClose} className="text-[#9ca3af] hover:text-(--text-primary) transition-colors"><X size={18} /></button>
        </div>

        <div className="flex flex-col overflow-y-auto" style={{ maxHeight: "60vh" }}>
          {isLoading ? (
            <div className="flex items-center justify-center" style={{ padding: "20px" }}>
              <p className="text-[13px] text-[#9ca3af]">Loading users...</p>
            </div>
          ) : isError ? (
            <div className="flex items-center justify-center" style={{ padding: "20px" }}>
              <p className="text-[13px] text-[#b91c1c]">Unable to load users. Please refresh and try again.</p>
            </div>
          ) : users.length === 0 ? (
            <div className="flex items-center justify-center" style={{ padding: "20px" }}>
              <p className="text-[13px] text-[#9ca3af]">No users available</p>
            </div>
          ) : (
            users.map((user: User, i: number) => {
              const isSelected = selected.includes(user.id);
              const initials = getInitials(user.name);
              const color = getUserColor(user.id);
              return (
                <button
                  key={user.id}
                  onClick={() => toggle(user.id)}
                  className="flex items-center justify-between hover:bg-[#f8f8fc] transition-colors text-left"
                  style={{ padding: "12px 20px", borderTop: i > 0 ? "1px solid #f0f0f5" : "none" }}
                >
                  <div className="flex items-center" style={{ gap: "10px" }}>
                    <div className="rounded-full flex items-center justify-center text-[11px] font-bold text-white shrink-0" style={{ width: "32px", height: "32px", background: color }}>
                      {initials}
                    </div>
                    <div className="flex flex-col">
                      <span className="text-[13px] font-semibold text-(--text-primary)">{user.name}</span>
                      <span className="text-[12px] text-[#9ca3af]">{user.email}</span>
                    </div>
                  </div>
                  <div
                    className="rounded-full flex items-center justify-center transition-all"
                    style={{ width: "20px", height: "20px", background: isSelected ? "#33084E" : "#f0f0f5", border: `1.5px solid ${isSelected ? "#33084E" : "#d1d5db"}` }}
                  >
                    {isSelected && <Check size={11} className="text-white" />}
                  </div>
                </button>
              );
            })
          )}
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
