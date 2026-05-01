"use client";

import React, { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import Sidebar from "@/components/Sidebar";
import Topbar from "@/components/Topbar";
import { useAuthStore } from "@/lib/stores/authStore";

const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      staleTime: 60_000,
      retry: 1,
    },
  },
});

export default function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const router = useRouter();
  const token = useAuthStore((s) => s.token);
  const [isExpanded, setIsExpanded] = useState(false);
  const [isMobileOpen, setIsMobileOpen] = useState(false);
  const [checked, setChecked] = useState(false);

  useEffect(() => {
    if (!token) {
      router.replace("/");
    } else {
      setChecked(true);
    }
  }, [token, router]);

  if (!checked) return null;

  return (
    <QueryClientProvider client={queryClient}>
      <div
        className="dashboard-layout"
        data-sidebar-expanded={isExpanded ? "true" : "false"}
      >
        <Sidebar
          isExpanded={isExpanded}
          onToggle={() => setIsExpanded((v) => !v)}
          isMobileOpen={isMobileOpen}
          onCloseMobile={() => setIsMobileOpen(false)}
        />

        <div className="main-content min-w-0">
          <Topbar
            isMobileOpen={isMobileOpen}
            onMenuToggle={() => setIsMobileOpen((v) => !v)}
          />
          {children}
        </div>
      </div>
    </QueryClientProvider>
  );
}
