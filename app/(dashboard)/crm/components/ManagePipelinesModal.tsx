"use client";

import React, { useState } from "react";
import { X, Pencil, Trash2, Check, Plus, GripVertical } from "lucide-react";
import { ModalButton } from "./ModalButton";

export interface DriveItem {
  id: number;
  name: string;
  slug: string;
  description?: string;
  color: string;
  position: number;
  is_default: boolean;
}

interface ManagePipelinesModalProps {
  drives:   DriveItem[];
  onClose:  () => void;
  onCreate: (data: Omit<DriveItem, "id">) => void;
  onUpdate: (id: number, data: Partial<DriveItem>) => void;
  onDelete: (id: number) => void;
}

const PRESET_COLORS = ["#33084E", "#AF580B", "#074616", "#1d4ed8", "#be185d", "#0891b2", "#374151"];

const inputCls  = "w-full rounded-xl border border-[#f0f0f5] bg-white text-[13px] outline-none focus:border-(--accent-purple) transition-colors";
const labelCls  = "text-[11px] font-bold text-[#9ca3af] uppercase tracking-wider";

function slugify(name: string) {
  return name.toLowerCase().replace(/\s+/g, "-").replace(/[^a-z0-9-]/g, "");
}

interface RowFormState {
  name: string;
  slug: string;
  description: string;
  color: string;
  is_default: boolean;
}

function PipelineRowForm({
  initial,
  onSave,
  onCancel,
}: {
  initial: RowFormState;
  onSave: (data: RowFormState) => void;
  onCancel: () => void;
}) {
  const [form, setForm] = useState<RowFormState>(initial);

  const set = (key: keyof RowFormState, val: string | boolean) =>
    setForm(f => ({ ...f, [key]: val }));

  const handleNameChange = (name: string) =>
    setForm(f => ({ ...f, name, slug: f.slug === slugify(f.name) ? slugify(name) : f.slug }));

  return (
    <div className="rounded-2xl border border-(--accent-purple) bg-[#f8f8fc]" style={{ padding: "16px", display: "flex", flexDirection: "column", gap: "12px" }}>
      <div className="grid grid-cols-2" style={{ gap: "10px" }}>
        <div className="flex flex-col" style={{ gap: "4px" }}>
          <label className={labelCls}>Name *</label>
          <input value={form.name} onChange={e => handleNameChange(e.target.value)} placeholder="Enterprise" className={inputCls} style={{ padding: "8px 12px" }} />
        </div>
        <div className="flex flex-col" style={{ gap: "4px" }}>
          <label className={labelCls}>Slug</label>
          <input value={form.slug} onChange={e => set("slug", e.target.value)} placeholder="enterprise" className={inputCls} style={{ padding: "8px 12px" }} />
        </div>
      </div>

      <div className="flex flex-col" style={{ gap: "4px" }}>
        <label className={labelCls}>Description</label>
        <input value={form.description} onChange={e => set("description", e.target.value)} placeholder="Optional description" className={inputCls} style={{ padding: "8px 12px" }} />
      </div>

      <div className="flex items-center justify-between">
        <div className="flex flex-col" style={{ gap: "6px" }}>
          <label className={labelCls}>Color</label>
          <div className="flex items-center" style={{ gap: "6px" }}>
            {PRESET_COLORS.map(c => (
              <button
                key={c}
                type="button"
                onClick={() => set("color", c)}
                className="rounded-full transition-transform hover:scale-110"
                style={{
                  width: "22px", height: "22px",
                  background: c,
                  border: form.color === c ? "2.5px solid #1a1a2e" : "2px solid transparent",
                  outline: form.color === c ? "2px solid white" : "none",
                  outlineOffset: "-3px",
                }}
              />
            ))}
          </div>
        </div>

        <label className="flex items-center cursor-pointer" style={{ gap: "8px" }}>
          <input
            type="checkbox"
            checked={form.is_default}
            onChange={e => set("is_default", e.target.checked)}
            className="rounded"
          />
          <span className="text-[12px] font-bold text-(--text-primary)">Set as default</span>
        </label>
      </div>

      <div className="flex items-center justify-end" style={{ gap: "8px" }}>
        <ModalButton variant="secondary" onClick={onCancel} style={{ padding: "6px 14px" }}>Cancel</ModalButton>
        <ModalButton
          variant="primary"
          disabled={!form.name.trim()}
          onClick={() => { if (form.name.trim()) onSave(form); }}
          style={{ padding: "6px 14px" }}
        >
          Save Pipeline
        </ModalButton>
      </div>
    </div>
  );
}

export function ManagePipelinesModal({ drives, onClose, onCreate, onUpdate, onDelete }: ManagePipelinesModalProps) {
  const [editingId, setEditingId] = useState<number | null>(null);
  const [addingNew, setAddingNew] = useState(false);
  const [confirmDeleteId, setConfirmDeleteId] = useState<number | null>(null);

  const EMPTY_FORM: RowFormState = { name: "", slug: "", description: "", color: PRESET_COLORS[0], is_default: false };

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-sm"
      style={{ padding: "16px" }}
      onClick={(e) => { if (e.target === e.currentTarget) onClose(); }}
    >
      <div className="bg-white rounded-2xl w-full max-w-lg flex flex-col shadow-2xl overflow-hidden">

        {/* Header */}
        <div className="flex items-center justify-between border-b border-[#f0f0f5] bg-[#f8f8fc]" style={{ padding: "20px 24px" }}>
          <div>
            <h2 className="text-lg font-bold text-(--text-primary)">Manage Pipelines</h2>
            <p className="text-[12px] text-[#9ca3af]" style={{ marginTop: "2px" }}>Create, edit, and organize your sales pipelines.</p>
          </div>
          <button onClick={onClose} className="text-[#9ca3af] hover:text-(--text-primary) transition-colors">
            <X size={20} />
          </button>
        </div>

        {/* Body */}
        <div className="overflow-y-auto flex flex-col" style={{ padding: "20px 24px", maxHeight: "60vh", gap: "8px" }}>

          {drives.map(drive => (
            <div key={drive.id}>
              {editingId === drive.id ? (
                <PipelineRowForm
                  initial={{ name: drive.name, slug: drive.slug, description: drive.description ?? "", color: drive.color, is_default: drive.is_default }}
                  onSave={(data) => { onUpdate(drive.id, data); setEditingId(null); }}
                  onCancel={() => setEditingId(null)}
                />
              ) : confirmDeleteId === drive.id ? (
                <div className="rounded-2xl border border-red-200 bg-red-50 flex items-center justify-between" style={{ padding: "14px 16px" }}>
                  <p className="text-[13px] font-bold text-red-700">Delete <span className="italic">{drive.name}</span>?</p>
                  <div className="flex items-center" style={{ gap: "8px" }}>
                    <button onClick={() => setConfirmDeleteId(null)} className="text-[12px] font-bold text-[#9ca3af] hover:text-(--text-primary) transition-colors">Cancel</button>
                    <ModalButton variant="danger" onClick={() => { onDelete(drive.id); setConfirmDeleteId(null); }} style={{ padding: "5px 12px", fontSize: "12px" }}>
                      Confirm Delete
                    </ModalButton>
                  </div>
                </div>
              ) : (
                <div className="flex items-center rounded-2xl border border-[#f0f0f5] bg-white hover:border-[#e5e7eb] transition-all group" style={{ padding: "12px 14px", gap: "10px" }}>
                  <GripVertical size={14} className="text-[#d1d5db] cursor-grab shrink-0" />
                  <div className="rounded-full shrink-0" style={{ width: "12px", height: "12px", background: drive.color }} />
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center" style={{ gap: "6px" }}>
                      <span className="text-[13px] font-bold text-(--text-primary) truncate">{drive.name}</span>
                      {drive.is_default && (
                        <span className="rounded-full text-[10px] font-bold" style={{ padding: "1px 7px", background: "#33084E15", color: "#33084E" }}>Default</span>
                      )}
                    </div>
                    {drive.description && (
                      <p className="text-[11px] text-[#9ca3af] truncate" style={{ marginTop: "2px" }}>{drive.description}</p>
                    )}
                  </div>
                  <div className="flex items-center opacity-0 group-hover:opacity-100 transition-opacity" style={{ gap: "4px" }}>
                    <button
                      onClick={() => setEditingId(drive.id)}
                      className="w-7 h-7 flex items-center justify-center rounded-lg text-[#9ca3af] hover:text-(--accent-purple) hover:bg-[#f0f0f5] transition-all"
                    >
                      <Pencil size={13} />
                    </button>
                    <button
                      onClick={() => setConfirmDeleteId(drive.id)}
                      className="w-7 h-7 flex items-center justify-center rounded-lg text-[#9ca3af] hover:text-red-500 hover:bg-red-50 transition-all"
                    >
                      <Trash2 size={13} />
                    </button>
                  </div>
                </div>
              )}
            </div>
          ))}

          {/* Add new */}
          {addingNew ? (
            <PipelineRowForm
              initial={EMPTY_FORM}
              onSave={(data) => { onCreate({ ...data, position: drives.length + 1 }); setAddingNew(false); }}
              onCancel={() => setAddingNew(false)}
            />
          ) : (
            <button
              onClick={() => { setAddingNew(true); setEditingId(null); }}
              className="flex items-center rounded-2xl border border-dashed border-[#d1d5db] text-[13px] font-bold text-[#9ca3af] hover:border-(--accent-purple) hover:text-(--accent-purple) hover:bg-[#f8f8fc] transition-all w-full"
              style={{ padding: "12px 14px", gap: "8px" }}
            >
              <Plus size={15} />
              Add Pipeline
            </button>
          )}
        </div>

        {/* Footer */}
        <div className="border-t border-[#f0f0f5] flex items-center justify-end bg-[#f8f8fc]" style={{ padding: "16px 24px" }}>
          <ModalButton variant="primary" onClick={onClose}>
            <Check size={14} /> Done
          </ModalButton>
        </div>
      </div>
    </div>
  );
}
