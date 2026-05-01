"use client";

import React, { useState, useRef, useEffect } from "react";
import { createPortal } from "react-dom";
import { ChevronDown, Search, Check } from "lucide-react";

export interface SelectOption {
  value: string;
  label: string;
  color?: string;
}

interface CustomSelectProps {
  value: string;
  onChange: (v: string) => void;
  options: SelectOption[];
  placeholder?: string;
  searchPlaceholder?: string;
  fullWidth?: boolean;
}

export function CustomSelect({
  value,
  onChange,
  options,
  placeholder = "Select…",
  searchPlaceholder = "Search…",
  fullWidth = false,
}: CustomSelectProps) {
  const [open, setOpen] = useState(false);
  const [search, setSearch] = useState("");
  const [dropdownStyle, setDropdownStyle] = useState<React.CSSProperties>({});
  const triggerRef = useRef<HTMLButtonElement>(null);
  const dropdownRef = useRef<HTMLDivElement>(null);

  const computePosition = () => {
    if (!triggerRef.current) return;
    const rect = triggerRef.current.getBoundingClientRect();
    const viewportWidth = window.innerWidth;
    const dropdownMaxWidth = 280;
    const margin = 16;
    
    const style: React.CSSProperties = {
      position: "fixed",
      top: rect.bottom + 8,
      minWidth: Math.max(rect.width, 200),
      maxWidth: dropdownMaxWidth,
    };

    // Check if there's enough space to the right of the trigger's left edge
    const spaceOnRight = viewportWidth - rect.left;
    
    if (spaceOnRight >= dropdownMaxWidth + margin) {
      // Align left edge of dropdown with left edge of trigger
      style.left = Math.max(margin, rect.left);
      style.right = "auto";
    } else {
      // Align right edge of dropdown with right edge of trigger
      style.right = Math.max(margin, viewportWidth - rect.right);
      style.left = "auto";
    }

    setDropdownStyle(style);
  };

  useEffect(() => {
    if (!open) return;
    const onPointer = (e: MouseEvent) => {
      const t = e.target as Node;
      if (triggerRef.current?.contains(t) || dropdownRef.current?.contains(t)) return;
      setOpen(false);
      setSearch("");
    };
    document.addEventListener("mousedown", onPointer);
    window.addEventListener("scroll", computePosition, true);
    window.addEventListener("resize", computePosition);
    return () => {
      document.removeEventListener("mousedown", onPointer);
      window.removeEventListener("scroll", computePosition, true);
      window.removeEventListener("resize", computePosition);
    };
  }, [open]);

  const q = search.toLowerCase();
  const filtered = options.filter(o => o.label.toLowerCase().includes(q));
  const selected = options.find(o => o.value === value);
  const displayLabel = selected?.label ?? placeholder;

  const handleTrigger = () => {
    if (!open) computePosition();
    setOpen(v => !v);
    if (open) setSearch("");
  };

  const dropdown = (
    <div
      ref={dropdownRef}
      className="crm-select-dropdown"
      style={dropdownStyle}
    >
      <div className="crm-select-search">
        <Search size={13} />
        <input
          autoFocus
          placeholder={searchPlaceholder}
          value={search}
          onChange={e => setSearch(e.target.value)}
        />
      </div>
      <div className="crm-select-list">
        {filtered.length === 0 ? (
          <div className="crm-select-empty">No options found</div>
        ) : (
          filtered.map(option => (
            <button
              key={option.value}
              className={`crm-select-option ${option.value === value ? "crm-select-option--active" : ""}`}
              onClick={() => {
                onChange(option.value);
                setOpen(false);
                setSearch("");
              }}
            >
              {option.color && (
                <span className="crm-select-option-dot" style={{ background: option.color }} />
              )}
              {option.label}
              {option.value === value && <Check size={13} className="crm-select-check" />}
            </button>
          ))
        )}
      </div>
    </div>
  );

  return (
    <>
      <div className="crm-select-wrap" style={fullWidth ? { width: "100%" } : undefined}>
        <button
          ref={triggerRef}
          className="crm-select-trigger"
          style={fullWidth ? { width: "100%", justifyContent: "space-between" } : undefined}
          onClick={handleTrigger}
        >
          {selected?.color && (
            <span className="crm-select-option-dot" style={{ background: selected.color }} />
          )}
          <span className="crm-select-value">{displayLabel}</span>
          <ChevronDown
            size={14}
            className="crm-select-chevron"
            style={{ transform: open ? "rotate(180deg)" : "rotate(0deg)", transition: "transform 0.2s ease" }}
          />
        </button>
      </div>
      {open && typeof document !== "undefined" && createPortal(dropdown, document.body)}
    </>
  );
}
