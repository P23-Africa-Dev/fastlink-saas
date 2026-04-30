"use client";

import React, { useState } from "react";
import Sidebar from "@/components/Sidebar";
import Topbar from "@/components/Topbar";

export default function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const [isExpanded, setIsExpanded] = useState(false);

  return (
    <div
      className="dashboard-layout"
      data-sidebar-expanded={isExpanded ? "true" : "false"}
    >
      <Sidebar isExpanded={isExpanded} onToggle={() => setIsExpanded((v) => !v)} />

      <div className="main-content min-w-0">
        <Topbar />
        {children}
      </div>
    </div>
  );
}
