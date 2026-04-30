"use client";

import React, { useRef, useState, useCallback } from "react";
import { X, FileUp, CheckCircle2, AlertCircle } from "lucide-react";
import { ModalButton } from "./ModalButton";

interface Drive {
  id: number;
  name: string;
}

interface ImportLeadsModalProps {
  drives: Drive[];
  onClose: () => void;
}

const ACCEPTED_TYPES = [
  "text/csv",
  "text/plain",
  "application/vnd.ms-excel",
  "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
];
const ACCEPTED_EXTENSIONS = [".csv", ".txt", ".xls", ".xlsx"];

function isValidFile(file: File) {
  const ext = "." + file.name.split(".").pop()?.toLowerCase();
  return ACCEPTED_TYPES.includes(file.type) || ACCEPTED_EXTENSIONS.includes(ext);
}

export function ImportLeadsModal({ drives, onClose }: ImportLeadsModalProps) {
  const inputRef = useRef<HTMLInputElement>(null);
  const [isDragOver, setIsDragOver] = useState(false);
  const [uploadedFile, setUploadedFile] = useState<File | null>(null);
  const [error, setError] = useState<string | null>(null);

  const handleFile = useCallback((file: File) => {
    if (!isValidFile(file)) {
      setError(`"${file.name}" is not supported. Please upload a .csv, .txt, .xls, or .xlsx file.`);
      setUploadedFile(null);
      return;
    }
    setError(null);
    setUploadedFile(file);
  }, []);

  const onDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragOver(true);
  };

  const onDragLeave = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragOver(false);
  };

  const onDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragOver(false);
    const file = e.dataTransfer.files[0];
    if (file) handleFile(file);
  };

  const onInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) handleFile(file);
    e.target.value = "";
  };

  const clearFile = () => {
    setUploadedFile(null);
    setError(null);
  };

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-sm"
      style={{ padding: "16px" }}
      onClick={(e) => { if (e.target === e.currentTarget) onClose(); }}
    >
      <div className="bg-white rounded-2xl w-full max-w-lg flex flex-col shadow-2xl overflow-hidden animate-in fade-in zoom-in-95 duration-200">
        {/* Header */}
        <div
          className="flex items-center justify-between border-b border-[#f0f0f5] bg-[#f8f8fc]"
          style={{ padding: "20px 24px" }}
        >
          <h2 className="text-lg font-bold text-[var(--text-primary)]">Import Leads</h2>
          <button
            onClick={onClose}
            className="text-[#9ca3af] hover:text-[var(--text-primary)] transition-colors"
          >
            <X size={20} />
          </button>
        </div>

        {/* Body */}
        <div className="flex flex-col" style={{ padding: "24px", gap: "20px" }}>
          {/* Hidden file input */}
          <input
            ref={inputRef}
            type="file"
            accept=".csv,.txt,.xls,.xlsx"
            className="hidden"
            onChange={onInputChange}
          />

          {/* Drop zone */}
          <div
            role="button"
            tabIndex={0}
            onClick={() => inputRef.current?.click()}
            onKeyDown={(e) => e.key === "Enter" && inputRef.current?.click()}
            onDragOver={onDragOver}
            onDragLeave={onDragLeave}
            onDrop={onDrop}
            className="border-2 border-dashed rounded-2xl flex flex-col items-center justify-center transition-colors cursor-pointer select-none"
            style={{
              padding: "40px 24px",
              gap: "12px",
              borderColor: isDragOver ? "var(--accent-purple)" : uploadedFile ? "#16a34a" : "#d1d5db",
              background: isDragOver ? "rgba(51,8,78,0.04)" : uploadedFile ? "#f0fdf4" : "#f8fafc",
            }}
          >
            {uploadedFile ? (
              <>
                <div className="w-12 h-12 rounded-full bg-green-100 text-green-600 flex items-center justify-center">
                  <CheckCircle2 size={24} />
                </div>
                <div className="text-center">
                  <p className="text-[14px] font-bold text-[var(--text-primary)]">{uploadedFile.name}</p>
                  <p className="text-[12px] text-[var(--text-muted)] mt-1">
                    {(uploadedFile.size / 1024).toFixed(1)} KB &middot; click to replace
                  </p>
                </div>
              </>
            ) : (
              <>
                <div
                  className="w-12 h-12 rounded-full flex items-center justify-center transition-transform"
                  style={{
                    background: "rgba(51,8,78,0.08)",
                    color: "var(--accent-purple)",
                    transform: isDragOver ? "scale(1.1)" : "scale(1)",
                  }}
                >
                  <FileUp size={24} />
                </div>
                <div className="text-center">
                  <p className="text-[14px] font-bold text-[var(--text-primary)]">
                    {isDragOver ? "Drop to upload" : "Click or drag file here"}
                  </p>
                  <p className="text-[12px] text-[var(--text-muted)] mt-1">
                    Supports .csv, .txt, .xls, .xlsx
                  </p>
                </div>
              </>
            )}
          </div>

          {/* Error */}
          {error && (
            <div className="flex items-start gap-2 rounded-xl border border-red-200 bg-red-50 text-red-700 text-[13px]" style={{ padding: "12px 16px" }}>
              <AlertCircle size={16} className="shrink-0 mt-0.5" />
              {error}
            </div>
          )}

          {/* Remove file link */}
          {uploadedFile && (
            <button
              onClick={clearFile}
              className="text-[12px] font-medium text-[#9ca3af] hover:text-red-500 transition-colors self-start"
            >
              Remove file
            </button>
          )}

          {/* Pipeline selector */}
          <div className="flex flex-col" style={{ gap: "8px" }}>
            <label className="text-[13px] font-bold text-[var(--text-primary)]">
              Default Target Pipeline <span className="font-medium text-[var(--text-muted)]">(Optional)</span>
            </label>
            <select
              className="w-full rounded-xl border border-[#f0f0f5] bg-white text-[13px] font-medium outline-none focus:border-[var(--accent-purple)] transition-colors"
              style={{ padding: "12px 16px" }}
            >
              <option value="">Do not override</option>
              {drives.map((d) => (
                <option key={d.id} value={d.id}>{d.name}</option>
              ))}
            </select>
          </div>
        </div>

        {/* Footer */}
        <div
          className="border-t border-[#f0f0f5] flex items-center justify-end bg-[#f8f8fc]"
          style={{ padding: "20px 24px", gap: "12px" }}
        >
          <ModalButton variant="secondary" onClick={onClose}>Cancel</ModalButton>
          <ModalButton variant="primary" disabled={!uploadedFile} onClick={onClose}>
            Import Data
          </ModalButton>
        </div>
      </div>
    </div>
  );
}
