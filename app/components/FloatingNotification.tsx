"use client";

import { useState } from "react";
import { BellIcon, XIcon } from "./icons";

interface FloatingNotificationProps {
  count?: number;
}

export function FloatingNotification({ count = 0 }: FloatingNotificationProps) {
  const [visible, setVisible] = useState(true);

  if (!visible) return null;

  return (
    <div className="fixed bottom-6 right-6 z-40 flex flex-col items-end gap-2">
      <button
        onClick={() => setVisible(false)}
        className="w-7 h-7 rounded-full bg-slate-200 dark:bg-slate-700 flex items-center justify-center text-slate-500 dark:text-slate-400 hover:bg-slate-300 dark:hover:bg-slate-600 transition-colors shadow-sm"
        aria-label="Dismiss notifications"
      >
        <XIcon size={12} />
      </button>

      <button
        className="relative flex items-center justify-center w-13 h-13 rounded-full bg-violet-600 text-white shadow-lg hover:bg-violet-700 hover:scale-105 active:scale-95 transition-all duration-200"
        style={{ width: 52, height: 52 }}
        aria-label={`${count} notifications`}
      >
        <BellIcon size={22} />
        {count > 0 && (
          <span className="absolute -top-1 -right-1 min-w-5 h-5 bg-orange-500 text-white text-[10px] font-bold rounded-full flex items-center justify-center px-1 ring-2 ring-white dark:ring-[#111827]">
            {count > 99 ? "99+" : count}
          </span>
        )}
      </button>
    </div>
  );
}
