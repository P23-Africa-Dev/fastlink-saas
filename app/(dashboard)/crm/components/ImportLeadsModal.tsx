"use client";

import React, { useRef, useState, useCallback } from "react";
import { X, FileUp, CheckCircle2, AlertCircle, ChevronDown } from "lucide-react";
import { ModalButton } from "./ModalButton";

interface Drive { id: number; name: string; }
interface Status { id: number; name: string; }

interface ImportLeadsModalProps {
  drives:   Drive[];
  statuses: Status[];
  onClose:  () => void;
}

interface ImportResult {
  imported: number;
  skipped:  number;
  errors:   string[];
}

const ACCEPTED_EXTENSIONS = [".csv", ".txt", ".xls", ".xlsx"];
const ACCEPTED_TYPES = [
  "text/csv", "text/plain",
  "application/vnd.ms-excel",
  "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
];
const PRIORITIES = ["low", "normal", "high"] as const;
const CURRENCIES = ["USD", "EUR", "GBP", "NGN"] as const;

function isValid(file: File) {
  const ext = "." + file.name.split(".").pop()?.toLowerCase();
  return ACCEPTED_TYPES.includes(file.type) || ACCEPTED_EXTENSIONS.includes(ext);
}

const inputCls  = "w-full rounded-xl border border-[#f0f0f5] bg-white text-[13px] font-medium outline-none focus:border-(--accent-purple) transition-colors";
const labelCls  = "text-[13px] font-bold text-(--text-primary)";
const selectCls = inputCls;

export function ImportLeadsModal({ drives, statuses, onClose }: ImportLeadsModalProps) {
  const inputRef = useRef<HTMLInputElement>(null);
  const [step, setStep]               = useState<"upload" | "result">("upload");
  const [isDragOver, setIsDragOver]   = useState(false);
  const [file, setFile]               = useState<File | null>(null);
  const [fileError, setFileError]     = useState<string | null>(null);
  const [errorsOpen, setErrorsOpen]   = useState(false);
  const [result] = useState<ImportResult>({ imported: 0, skipped: 0, errors: [] });

  const handleFile = useCallback((f: File) => {
    if (!isValid(f)) {
      setFileError(`"${f.name}" is not supported. Please upload a .csv, .txt, .xls, or .xlsx file.`);
      setFile(null);
      return;
    }
    setFileError(null);
    setFile(f);
  }, []);

  const onDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragOver(false);
    const f = e.dataTransfer.files[0];
    if (f) handleFile(f);
  };

  const simulateImport = () => {
    // Placeholder — will call POST /crm/leads/import when API integrated
    setStep("result");
  };

  /* ── Step 1: Upload ─────────────────────────────────────────── */
  if (step === "upload") return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-sm"
      style={{ padding: "16px" }}
      onClick={(e) => { if (e.target === e.currentTarget) onClose(); }}
    >
      <div className="bg-white rounded-2xl w-full max-w-lg flex flex-col shadow-2xl overflow-hidden">

        {/* Header */}
        <div className="flex items-center justify-between border-b border-[#f0f0f5] bg-[#f8f8fc]" style={{ padding: "20px 24px" }}>
          <div>
            <h2 className="text-lg font-bold text-(--text-primary)">Import Leads</h2>
            <p className="text-[12px] text-[#9ca3af]" style={{ marginTop: "2px" }}>Step 1 of 2 — Upload file</p>
          </div>
          <button onClick={onClose} className="text-[#9ca3af] hover:text-(--text-primary) transition-colors">
            <X size={20} />
          </button>
        </div>

        <div className="overflow-y-auto" style={{ padding: "24px", maxHeight: "72vh", display: "flex", flexDirection: "column", gap: "20px" }}>
          <input
            ref={inputRef}
            type="file"
            accept=".csv,.txt,.xls,.xlsx"
            className="hidden"
            onChange={(e) => { const f = e.target.files?.[0]; if (f) handleFile(f); e.target.value = ""; }}
          />

          {/* Drop zone */}
          <div
            role="button"
            tabIndex={0}
            onClick={() => inputRef.current?.click()}
            onKeyDown={(e) => e.key === "Enter" && inputRef.current?.click()}
            onDragOver={(e) => { e.preventDefault(); setIsDragOver(true); }}
            onDragLeave={(e) => { e.preventDefault(); setIsDragOver(false); }}
            onDrop={onDrop}
            className="border-2 border-dashed rounded-2xl flex flex-col items-center justify-center cursor-pointer select-none transition-colors"
            style={{
              padding: "40px 24px", gap: "12px",
              borderColor: isDragOver ? "#33084E" : file ? "#16a34a" : "#d1d5db",
              background: isDragOver ? "rgba(51,8,78,0.04)" : file ? "#f0fdf4" : "#f8fafc",
            }}
          >
            {file ? (
              <>
                <div className="w-12 h-12 rounded-full bg-green-100 text-green-600 flex items-center justify-center">
                  <CheckCircle2 size={24} />
                </div>
                <div className="text-center">
                  <p className="text-[14px] font-bold text-(--text-primary)">{file.name}</p>
                  <p className="text-[12px] text-[#9ca3af]" style={{ marginTop: "4px" }}>
                    {(file.size / 1024).toFixed(1)} KB &middot; click to replace
                  </p>
                </div>
              </>
            ) : (
              <>
                <div className="w-12 h-12 rounded-full flex items-center justify-center transition-transform"
                  style={{ background: "rgba(51,8,78,0.08)", color: "#33084E", transform: isDragOver ? "scale(1.1)" : "scale(1)" }}>
                  <FileUp size={24} />
                </div>
                <div className="text-center">
                  <p className="text-[14px] font-bold text-(--text-primary)">{isDragOver ? "Drop to upload" : "Click or drag file here"}</p>
                  <p className="text-[12px] text-[#9ca3af]" style={{ marginTop: "4px" }}>Supports .csv, .txt, .xls, .xlsx</p>
                </div>
              </>
            )}
          </div>

          {fileError && (
            <div className="flex items-start gap-2 rounded-xl border border-red-200 bg-red-50 text-red-700 text-[13px]" style={{ padding: "12px 16px" }}>
              <AlertCircle size={16} className="shrink-0 mt-0.5" />
              {fileError}
            </div>
          )}

          {file && (
            <button onClick={() => { setFile(null); setFileError(null); }}
              className="text-[12px] font-medium text-[#9ca3af] hover:text-red-500 transition-colors self-start">
              Remove file
            </button>
          )}

          {/* Divider */}
          <div className="flex items-center" style={{ gap: "12px" }}>
            <div className="flex-1 border-t border-[#f0f0f5]" />
            <span className="text-[11px] font-bold text-[#9ca3af] uppercase tracking-wider">Optional defaults</span>
            <div className="flex-1 border-t border-[#f0f0f5]" />
          </div>

          {/* Optional fields grid */}
          <div className="grid grid-cols-1 sm:grid-cols-2" style={{ gap: "16px" }}>
            <div className="flex flex-col" style={{ gap: "8px" }}>
              <label className={labelCls}>Pipeline</label>
              <select className={selectCls} style={{ padding: "10px 14px" }}>
                <option value="">Do not override</option>
                {drives.map(d => <option key={d.id} value={d.id}>{d.name}</option>)}
              </select>
            </div>
            <div className="flex flex-col" style={{ gap: "8px" }}>
              <label className={labelCls}>Status</label>
              <select className={selectCls} style={{ padding: "10px 14px" }}>
                <option value="">Do not override</option>
                {statuses.map(s => <option key={s.id} value={s.id}>{s.name}</option>)}
              </select>
            </div>
            <div className="flex flex-col" style={{ gap: "8px" }}>
              <label className={labelCls}>Priority</label>
              <select className={selectCls} style={{ padding: "10px 14px" }}>
                <option value="">Do not override</option>
                {PRIORITIES.map(p => <option key={p} value={p} style={{ textTransform: "capitalize" }}>{p.charAt(0).toUpperCase() + p.slice(1)}</option>)}
              </select>
            </div>
            <div className="flex flex-col" style={{ gap: "8px" }}>
              <label className={labelCls}>Currency</label>
              <select className={selectCls} style={{ padding: "10px 14px" }}>
                <option value="">Do not override</option>
                {CURRENCIES.map(c => <option key={c} value={c}>{c}</option>)}
              </select>
            </div>
            <div className="flex flex-col sm:col-span-2" style={{ gap: "8px" }}>
              <label className={labelCls}>Assign To</label>
              <select className={selectCls} style={{ padding: "10px 14px" }}>
                <option value="">Do not override</option>
                <option value="1">Me</option>
              </select>
            </div>
          </div>
        </div>

        {/* Footer */}
        <div className="border-t border-[#f0f0f5] flex items-center justify-end bg-[#f8f8fc]" style={{ padding: "20px 24px", gap: "12px" }}>
          <ModalButton variant="secondary" onClick={onClose}>Cancel</ModalButton>
          <ModalButton variant="primary" disabled={!file} onClick={simulateImport}>
            Import Data
          </ModalButton>
        </div>
      </div>
    </div>
  );

  /* ── Step 2: Result ─────────────────────────────────────────── */
  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-sm"
      style={{ padding: "16px" }}
    >
      <div className="bg-white rounded-2xl w-full max-w-md flex flex-col shadow-2xl overflow-hidden">

        {/* Header */}
        <div className="flex items-center justify-between border-b border-[#f0f0f5] bg-[#f8f8fc]" style={{ padding: "20px 24px" }}>
          <div>
            <h2 className="text-lg font-bold text-(--text-primary)">Import Complete</h2>
            <p className="text-[12px] text-[#9ca3af]" style={{ marginTop: "2px" }}>Step 2 of 2 — Results</p>
          </div>
        </div>

        <div className="flex flex-col" style={{ padding: "24px", gap: "20px" }}>
          {/* Stat cards */}
          <div className="grid grid-cols-3" style={{ gap: "12px" }}>
            <div className="rounded-2xl flex flex-col items-center" style={{ padding: "20px 12px", gap: "6px", background: "#f0fdf4", border: "1px solid #bbf7d0" }}>
              <span className="text-[28px] font-bold" style={{ color: "#074616" }}>{result.imported}</span>
              <span className="text-[11px] font-bold uppercase tracking-wider" style={{ color: "#16a34a" }}>Imported</span>
            </div>
            <div className="rounded-2xl flex flex-col items-center" style={{ padding: "20px 12px", gap: "6px", background: "#fffbeb", border: "1px solid #fde68a" }}>
              <span className="text-[28px] font-bold" style={{ color: "#AF580B" }}>{result.skipped}</span>
              <span className="text-[11px] font-bold uppercase tracking-wider" style={{ color: "#d97706" }}>Skipped</span>
            </div>
            <div className="rounded-2xl flex flex-col items-center" style={{ padding: "20px 12px", gap: "6px", background: "#fef2f2", border: "1px solid #fecaca" }}>
              <span className="text-[28px] font-bold" style={{ color: "#ef4444" }}>{result.errors.length}</span>
              <span className="text-[11px] font-bold uppercase tracking-wider" style={{ color: "#ef4444" }}>Errors</span>
            </div>
          </div>

          {/* Error list */}
          {result.errors.length > 0 && (
            <div className="rounded-xl border border-[#fecaca] overflow-hidden">
              <button
                onClick={() => setErrorsOpen(o => !o)}
                className="w-full flex items-center justify-between bg-red-50 text-red-700 text-[13px] font-bold transition-colors hover:bg-red-100"
                style={{ padding: "12px 16px" }}
              >
                <span>{result.errors.length} error{result.errors.length !== 1 ? "s" : ""} — click to view</span>
                <ChevronDown size={16} style={{ transform: errorsOpen ? "rotate(180deg)" : "none", transition: "transform 0.2s" }} />
              </button>
              {errorsOpen && (
                <ul className="bg-white" style={{ padding: "12px 16px", display: "flex", flexDirection: "column", gap: "6px" }}>
                  {result.errors.map((err, i) => (
                    <li key={i} className="text-[12px] text-red-600 flex items-start" style={{ gap: "8px" }}>
                      <span className="shrink-0 font-bold">{i + 1}.</span>
                      <span>{err}</span>
                    </li>
                  ))}
                </ul>
              )}
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="border-t border-[#f0f0f5] flex items-center justify-end bg-[#f8f8fc]" style={{ padding: "20px 24px" }}>
          <ModalButton variant="primary" onClick={onClose}>Done</ModalButton>
        </div>
      </div>
    </div>
  );
}
