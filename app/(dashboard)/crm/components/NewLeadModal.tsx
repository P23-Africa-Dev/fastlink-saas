"use client";

import React, { useState } from "react";
import { X } from "lucide-react";
import { ModalButton } from "./ModalButton";
import { CustomSelect } from "@/components/ui/CustomSelect";
import { useCountries, useLgas, useStates } from "../hooks/useCrm";

interface Status { id: number; name: string; }
interface Drive { id: number; name: string; }

interface NewLeadModalProps {
  statuses: Status[];
  drives: Drive[];
  onClose: () => void;
  onSave: (payload: {
    first_name: string;
    last_name?: string;
    email?: string;
    phone?: string;
    company?: string;
    drive_id?: number;
    status_id?: number;
    assigned_to?: number;
    estimated_value?: number;
    currency?: string;
    priority: "low" | "medium" | "high";
    notes?: string;
    country_id?: number;
    state_id?: number;
    lga_id?: number;
  }) => void;
}

const PRIORITIES = ["low", "normal", "high"] as const;
type Priority = typeof PRIORITIES[number];
const CURRENCIES = ["USD", "EUR", "GBP", "NGN"] as const;

const PRIORITY_STYLES: Record<Priority, { activeBg: string; activeColor: string; activeBorder: string }> = {
  low: { activeBg: "#f0f0f5", activeColor: "#9ca3af", activeBorder: "#9ca3af" },
  normal: { activeBg: "#33084E15", activeColor: "#33084E", activeBorder: "#33084E" },
  high: { activeBg: "#AF580B15", activeColor: "#AF580B", activeBorder: "#AF580B" },
};

const inputCls = "w-full rounded-xl border border-[#f0f0f5] bg-white text-[13px] outline-none focus:border-(--accent-purple) transition-colors";
const labelCls = "text-[13px] font-bold text-(--text-primary)";

export function NewLeadModal({ statuses, drives, onClose, onSave }: NewLeadModalProps) {
  const [firstName, setFirstName] = useState("");
  const [lastName, setLastName] = useState("");
  const [email, setEmail] = useState("");
  const [phone, setPhone] = useState("");
  const [company, setCompany] = useState("");
  const [value, setValue] = useState("");
  const [notes, setNotes] = useState("");
  const [priority, setPriority] = useState<Priority>("normal");
  const [driveId, setDriveId] = useState(() => drives[0]?.id.toString() ?? "");
  const [statusId, setStatusId] = useState(() => statuses[0]?.id.toString() ?? "");
  const [assignedTo, setAssignedTo] = useState("");
  const [currency, setCurrency] = useState("USD");
  const [countryId, setCountryId] = useState("");
  const [stateId, setStateId] = useState("");
  const [lgaId, setLgaId] = useState("");

  const { data: countries = [] } = useCountries();
  const { data: states = [] } = useStates(countryId ? Number(countryId) : undefined);
  const { data: lgas = [] } = useLgas(stateId ? Number(stateId) : undefined);

  React.useEffect(() => {
    if (countryId || countries.length === 0) return;
    const defaultCountry = countries.find((country) => country.is_default) ?? countries[0];
    if (defaultCountry) {
      setCountryId(defaultCountry.id.toString());
    }
  }, [countries, countryId]);

  const driveOptions = drives.map(d => ({ value: d.id.toString(), label: d.name }));
  const statusOptions = statuses.map(s => ({ value: s.id.toString(), label: s.name }));
  const assigneeOptions = [{ value: "", label: "Unassigned" }, { value: "1", label: "Me" }];
  const currencyOptions = CURRENCIES.map(c => ({ value: c, label: c }));
  const countryOptions = countries.map((country) => ({
    value: country.id.toString(),
    label: country.name,
  }));
  const stateOptions = states.map((state) => ({
    value: state.id.toString(),
    label: state.name,
  }));
  const lgaOptions = lgas.map((lga) => ({
    value: lga.id.toString(),
    label: lga.name,
  }));

  const handleSave = () => {
    if (!firstName.trim()) return;

    onSave({
      first_name: firstName.trim(),
      last_name: lastName.trim() || undefined,
      email: email.trim() || undefined,
      phone: phone.trim() || undefined,
      company: company.trim() || undefined,
      drive_id: driveId ? Number(driveId) : undefined,
      status_id: statusId ? Number(statusId) : undefined,
      assigned_to: assignedTo ? Number(assignedTo) : undefined,
      estimated_value: value ? Number(value) : undefined,
      currency,
      priority: priority === "normal" ? "medium" : priority,
      notes: notes.trim() || undefined,
      country_id: countryId ? Number(countryId) : undefined,
      state_id: stateId ? Number(stateId) : undefined,
      lga_id: lgaId ? Number(lgaId) : undefined,
    });
    onClose();
  };

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
              <input type="text" value={firstName} onChange={e => setFirstName(e.target.value)} placeholder="e.g. Alice" className={inputCls} style={{ padding: "12px 16px" }} />
            </div>
            <div className="flex flex-col" style={{ gap: "8px" }}>
              <label className={labelCls}>Last Name</label>
              <input type="text" value={lastName} onChange={e => setLastName(e.target.value)} placeholder="e.g. Smith" className={inputCls} style={{ padding: "12px 16px" }} />
            </div>
          </div>

          {/* Row 2 */}
          <div className="grid grid-cols-1 sm:grid-cols-2" style={{ gap: "20px" }}>
            <div className="flex flex-col" style={{ gap: "8px" }}>
              <label className={labelCls}>Email</label>
              <input type="email" value={email} onChange={e => setEmail(e.target.value)} placeholder="alice@example.com" className={inputCls} style={{ padding: "12px 16px" }} />
            </div>
            <div className="flex flex-col" style={{ gap: "8px" }}>
              <label className={labelCls}>Phone</label>
              <input type="tel" value={phone} onChange={e => setPhone(e.target.value)} placeholder="+1 234 567 8900" className={inputCls} style={{ padding: "12px 16px" }} />
            </div>
          </div>

          {/* Row 3 */}
          <div className="grid grid-cols-1 sm:grid-cols-2" style={{ gap: "20px" }}>
            <div className="flex flex-col" style={{ gap: "8px" }}>
              <label className={labelCls}>Company</label>
              <input type="text" value={company} onChange={e => setCompany(e.target.value)} placeholder="Globex Corp" className={inputCls} style={{ padding: "12px 16px" }} />
            </div>
            <div className="flex flex-col" style={{ gap: "8px" }}>
              <label className={labelCls}>Pipeline</label>
              <CustomSelect fullWidth value={driveId} onChange={setDriveId} options={driveOptions} searchPlaceholder="Search pipelines…" />
            </div>
          </div>

          {/* Row 4 */}
          <div className="grid grid-cols-1 sm:grid-cols-2" style={{ gap: "20px" }}>
            <div className="flex flex-col" style={{ gap: "8px" }}>
              <label className={labelCls}>Status</label>
              <CustomSelect fullWidth value={statusId} onChange={setStatusId} options={statusOptions} searchPlaceholder="Search statuses…" />
            </div>
            <div className="flex flex-col" style={{ gap: "8px" }}>
              <label className={labelCls}>Assigned To</label>
              <CustomSelect fullWidth value={assignedTo} onChange={setAssignedTo} options={assigneeOptions} searchPlaceholder="Search…" />
            </div>
          </div>

          {/* Row 5 */}
          <div className="grid grid-cols-1 sm:grid-cols-2" style={{ gap: "20px" }}>
            <div className="flex flex-col" style={{ gap: "8px" }}>
              <label className={labelCls}>Estimated Value</label>
              <input type="number" value={value} onChange={e => setValue(e.target.value)} placeholder="15000" className={inputCls} style={{ padding: "12px 16px" }} />
            </div>
            <div className="flex flex-col" style={{ gap: "8px" }}>
              <label className={labelCls}>Currency</label>
              <CustomSelect fullWidth value={currency} onChange={setCurrency} options={currencyOptions} searchPlaceholder="Search currency…" />
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

          {/* Location */}
          <div className="grid grid-cols-1 sm:grid-cols-3" style={{ gap: "20px" }}>
            <div className="flex flex-col" style={{ gap: "8px" }}>
              <label className={labelCls}>Country</label>
              <CustomSelect
                fullWidth
                value={countryId}
                onChange={(value) => {
                  setCountryId(value);
                  setStateId("");
                  setLgaId("");
                }}
                options={countryOptions}
                searchPlaceholder="Search countries…"
              />
            </div>
            <div className="flex flex-col" style={{ gap: "8px" }}>
              <label className={labelCls}>State</label>
              <CustomSelect
                fullWidth
                value={stateId}
                onChange={(value) => {
                  setStateId(value);
                  setLgaId("");
                }}
                options={stateOptions.length > 0 ? stateOptions : [{ value: "", label: "Select country first" }]}
                searchPlaceholder="Search states…"
              />
            </div>
            <div className="flex flex-col" style={{ gap: "8px" }}>
              <label className={labelCls}>LGA</label>
              <CustomSelect
                fullWidth
                value={lgaId}
                onChange={setLgaId}
                options={lgaOptions.length > 0 ? lgaOptions : [{ value: "", label: "Select state first" }]}
                searchPlaceholder="Search LGAs…"
              />
            </div>
          </div>

          {/* Notes */}
          <div className="flex flex-col" style={{ gap: "8px" }}>
            <label className={labelCls}>Notes</label>
            <textarea
              rows={3}
              placeholder="Add any background context..."
              value={notes}
              onChange={e => setNotes(e.target.value)}
              className="w-full rounded-xl border border-[#f0f0f5] bg-white text-[13px] outline-none focus:border-(--accent-purple) transition-colors resize-none"
              style={{ padding: "12px 16px" }}
            />
          </div>
        </div>

        {/* Footer */}
        <div className="border-t border-[#f0f0f5] flex items-center justify-end bg-[#f8f8fc]" style={{ padding: "20px 24px", gap: "12px" }}>
          <ModalButton variant="secondary" onClick={onClose}>Cancel</ModalButton>
          <ModalButton variant="primary" onClick={handleSave} disabled={!firstName.trim()}>Save Lead</ModalButton>
        </div>
      </div>
    </div>
  );
}
