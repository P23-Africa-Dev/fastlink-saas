"use client";

import React from "react";
import { AlertTriangle } from "lucide-react";
import { ModalButton } from "./ModalButton";

interface DeleteProjectModalProps {
  projectName: string;
  onClose:     () => void;
  onConfirm:   () => void;
}

export function DeleteProjectModal({ projectName, onClose, onConfirm }: DeleteProjectModalProps) {
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-sm" style={{ padding: "16px" }}
      onClick={e => { if (e.target === e.currentTarget) onClose(); }}>
      <div className="bg-white rounded-2xl w-full max-w-sm flex flex-col shadow-2xl overflow-hidden">

        <div className="flex flex-col items-center text-center" style={{ padding: "32px 28px", gap: "16px" }}>
          <div className="w-14 h-14 rounded-2xl flex items-center justify-center" style={{ background: "#fef2f2", color: "#ef4444" }}>
            <AlertTriangle size={26} />
          </div>
          <div className="flex flex-col" style={{ gap: "8px" }}>
            <h2 className="text-[18px] font-bold text-(--text-primary)">Delete Project?</h2>
            <p className="text-[13px] text-[#9ca3af] leading-relaxed">
              This will permanently delete <span className="font-bold text-(--text-primary)">{projectName}</span> and all its tasks. This cannot be undone.
            </p>
          </div>
        </div>

        <div className="border-t border-[#f0f0f5] flex items-center justify-end bg-[#f8f8fc]" style={{ padding: "16px 24px", gap: "12px" }}>
          <ModalButton variant="secondary" onClick={onClose}>Cancel</ModalButton>
          <ModalButton variant="danger" onClick={() => { onConfirm(); onClose(); }}>Delete Project</ModalButton>
        </div>
      </div>
    </div>
  );
}
