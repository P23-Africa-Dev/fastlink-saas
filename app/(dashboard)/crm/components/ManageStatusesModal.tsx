"use client";

import React, { useState } from "react";
import { X, Pencil, Trash2, Plus, GripVertical, Check } from "lucide-react";
import { ModalButton } from "./ModalButton";

export interface StatusItem {
  id: number;
  name: string;
  slug: string;
  color: string;
  position: number;
  is_default: boolean;
  is_won: boolean;
  is_lost: boolean;
}

interface ManageStatusesModalProps {
  statuses: StatusItem[];
  onClose:  () => void;
  onCreate: (data: Omit<StatusItem, "id">) => void;
  onUpdate: (id: number, data: Partial<StatusItem>) => void;
  onDelete: (id: number) => void;
}

const PRESET_COLORS = ["#33084E", "#AF580B", "#074616", "#1d4ed8", "#be185d", "#0891b2", "#374151"];

const inputCls = "w-full rounded-xl border border-[#f0f0f5] bg-white text-[13px] outline-none focus:border-(--accent-purple) transition-colors";
const labelCls = "text-[11px] font-bold text-[#9ca3af] uppercase tracking-wider";

function slugify(name: string) {
  return name.toLowerCase().replace(/\s+/g, "-").replace(/[^a-z0-9-]/g, "");
}

interface RowFormState {
  name: string;
  slug: string;
  color: string;
  position: number;
  is_default: boolean;
  is_won: boolean;
  is_lost: boolean;
}

function StatusRowForm({
  initial,
  onSave,
  onCancel,
}: {
  initial: RowFormState;
  onSave: (data: RowFormState) => void;
  onCancel: () => void;
}) {
  const [form, setForm] = useState<RowFormState>(initial);

  const set = <K extends keyof RowFormState>(key: K, val: RowFormState[K]) =>
    setForm(f => ({ ...f, [key]: val }));

  const handleNameChange = (name: string) =>
    setForm(f => ({ ...f, name, slug: f.slug === slugify(f.name) ? slugify(name) : f.slug }));

  const Checkbox = ({ label, field }: { label: string; field: "is_default" | "is_won" | "is_lost" }) => (
    <label className="flex items-center cursor-pointer" style={{ gap: "6px" }}>
      <input
        type="checkbox"
        checked={form[field] as boolean}
        onChange={e => set(field, e.target.checked)}
        className="rounded"
      />
      <span className="text-[12px] font-bold text-(--text-primary)">{label}</span>
    </label>
  );

  return (
    <div className="rounded-2xl border border-(--accent-purple) bg-[#f8f8fc]" style={{ padding: "16px", display: "flex", flexDirection: "column", gap: "12px" }}>
      <div className="grid grid-cols-2" style={{ gap: "10px" }}>
        <div className="flex flex-col" style={{ gap: "4px" }}>
          <label className={labelCls}>Name *</label>
          <input value={form.name} onChange={e => handleNameChange(e.target.value)} placeholder="Qualified" className={inputCls} style={{ padding: "8px 12px" }} />
        </div>
        <div className="flex flex-col" style={{ gap: "4px" }}>
          <label className={labelCls}>Slug</label>
          <input value={form.slug} onChange={e => set("slug", e.target.value)} placeholder="qualified" className={inputCls} style={{ padding: "8px 12px" }} />
        </div>
      </div>

      <div className="flex items-center justify-between">
        <div className="flex flex-col" style={{ gap: "6px" }}>
          <label className={labelCls}>Color</label>
          <div className="flex items-center" style={{ gap: "6px" }}>
            {PRESET_COLORS.map(c => (
              <button key={c} type="button" onClick={() => set("color", c)} className="rounded-full transition-transform hover:scale-110"
                style={{ width: "22px", height: "22px", background: c, border: form.color === c ? "2.5px solid #1a1a2e" : "2px solid transparent", outline: form.color === c ? "2px solid white" : "none", outlineOffset: "-3px" }}
              />
            ))}
          </div>
        </div>
        <div className="flex flex-col" style={{ gap: "4px" }}>
          <label className={labelCls}>Position</label>
          <input
            type="number"
            value={form.position}
            min={1}
            onChange={e => set("position", parseInt(e.target.value) || 1)}
            className={inputCls}
            style={{ padding: "8px 12px", width: "70px" }}
          />
        </div>
      </div>

      <div className="flex items-center" style={{ gap: "20px" }}>
        <Checkbox label="Default"    field="is_default" />
        <Checkbox label="Won stage"  field="is_won"     />
        <Checkbox label="Lost stage" field="is_lost"    />
      </div>

      <div className="flex items-center justify-end" style={{ gap: "8px" }}>
        <ModalButton variant="secondary" onClick={onCancel} style={{ padding: "6px 14px" }}>Cancel</ModalButton>
        <ModalButton
          variant="primary"
          disabled={!form.name.trim()}
          onClick={() => { if (form.name.trim()) onSave(form); }}
          style={{ padding: "6px 14px" }}
        >
          Save Status
        </ModalButton>
      </div>
    </div>
  );
}

export function ManageStatusesModal({ statuses, onClose, onCreate, onUpdate, onDelete }: ManageStatusesModalProps) {
  const [editingId, setEditingId]       = useState<number | null>(null);
  const [addingNew, setAddingNew]       = useState(false);
  const [confirmDeleteId, setConfirmDeleteId] = useState<number | null>(null);

  const EMPTY_FORM: RowFormState = {
    name: "", slug: "", color: PRESET_COLORS[0], position: statuses.length + 1,
    is_default: false, is_won: false, is_lost: false,
  };

  const stageBadge = (s: StatusItem) => {
    if (s.is_won)  return <span className="rounded-full text-[10px] font-bold" style={{ padding: "1px 7px", background: "#07461615", color: "#074616" }}>Won</span>;
    if (s.is_lost) return <span className="rounded-full text-[10px] font-bold" style={{ padding: "1px 7px", background: "#fef2f2", color: "#ef4444" }}>Lost</span>;
    if (s.is_default) return <span className="rounded-full text-[10px] font-bold" style={{ padding: "1px 7px", background: "#33084E15", color: "#33084E" }}>Default</span>;
    return null;
  };

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
            <h2 className="text-lg font-bold text-(--text-primary)">Manage Statuses</h2>
            <p className="text-[12px] text-[#9ca3af]" style={{ marginTop: "2px" }}>Configure your kanban columns and stages.</p>
          </div>
          <button onClick={onClose} className="text-[#9ca3af] hover:text-(--text-primary) transition-colors">
            <X size={20} />
          </button>
        </div>

        {/* Body */}
        <div className="overflow-y-auto flex flex-col" style={{ padding: "20px 24px", maxHeight: "60vh", gap: "8px" }}>

          {statuses.map(status => (
            <div key={status.id}>
              {editingId === status.id ? (
                <StatusRowForm
                  initial={{ name: status.name, slug: status.slug, color: status.color, position: status.position, is_default: status.is_default, is_won: status.is_won, is_lost: status.is_lost }}
                  onSave={(data) => { onUpdate(status.id, data); setEditingId(null); }}
                  onCancel={() => setEditingId(null)}
                />
              ) : confirmDeleteId === status.id ? (
                <div className="rounded-2xl border border-red-200 bg-red-50 flex items-center justify-between" style={{ padding: "14px 16px" }}>
                  <p className="text-[13px] font-bold text-red-700">Delete <span className="italic">{status.name}</span>?</p>
                  <div className="flex items-center" style={{ gap: "8px" }}>
                    <button onClick={() => setConfirmDeleteId(null)} className="text-[12px] font-bold text-[#9ca3af] hover:text-(--text-primary) transition-colors">Cancel</button>
                    <ModalButton variant="danger" onClick={() => { onDelete(status.id); setConfirmDeleteId(null); }} style={{ padding: "5px 12px" }}>
                      Confirm Delete
                    </ModalButton>
                  </div>
                </div>
              ) : (
                <div className="flex items-center rounded-2xl border border-[#f0f0f5] bg-white hover:border-[#e5e7eb] transition-all group" style={{ padding: "12px 14px", gap: "10px" }}>
                  <GripVertical size={14} className="text-[#d1d5db] cursor-grab shrink-0" />
                  <div className="rounded-full shrink-0" style={{ width: "12px", height: "12px", background: status.color }} />
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center" style={{ gap: "6px" }}>
                      <span className="text-[13px] font-bold text-(--text-primary)">{status.name}</span>
                      {stageBadge(status)}
                      <span className="text-[11px] text-[#9ca3af]">#{status.position}</span>
                    </div>
                    <p className="text-[11px] text-[#9ca3af]" style={{ marginTop: "2px" }}>{status.slug}</p>
                  </div>
                  <div className="flex items-center opacity-0 group-hover:opacity-100 transition-opacity" style={{ gap: "4px" }}>
                    <button onClick={() => setEditingId(status.id)} className="w-7 h-7 flex items-center justify-center rounded-lg text-[#9ca3af] hover:text-(--accent-purple) hover:bg-[#f0f0f5] transition-all">
                      <Pencil size={13} />
                    </button>
                    <button onClick={() => setConfirmDeleteId(status.id)} className="w-7 h-7 flex items-center justify-center rounded-lg text-[#9ca3af] hover:text-red-500 hover:bg-red-50 transition-all">
                      <Trash2 size={13} />
                    </button>
                  </div>
                </div>
              )}
            </div>
          ))}

          {addingNew ? (
            <StatusRowForm
              initial={EMPTY_FORM}
              onSave={(data) => { onCreate(data); setAddingNew(false); }}
              onCancel={() => setAddingNew(false)}
            />
          ) : (
            <button
              onClick={() => { setAddingNew(true); setEditingId(null); }}
              className="flex items-center rounded-2xl border border-dashed border-[#d1d5db] text-[13px] font-bold text-[#9ca3af] hover:border-(--accent-purple) hover:text-(--accent-purple) hover:bg-[#f8f8fc] transition-all w-full"
              style={{ padding: "12px 14px", gap: "8px" }}
            >
              <Plus size={15} />
              Add Status
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
