"use client";

interface DashboardShellProps {
  children: React.ReactNode;
}

export function DashboardShell({ children }: DashboardShellProps) {

  return (
    <div className="flex h-full">

      <div className="flex flex-1 flex-col min-w-0 overflow-hidden">

        <main className="flex-1 overflow-y-auto p-4 md:p-6 lg:p-8">
          {children}
        </main>
      </div>
    </div>
  );
}
