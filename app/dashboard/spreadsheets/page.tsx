export default function SpreadsheetsPage() {
  return (
    <div className="flex flex-col items-center justify-center min-h-[60vh] text-center">
      <div className="w-16 h-16 rounded-2xl bg-teal-500/10 dark:bg-teal-500/15 flex items-center justify-center mb-4">
        <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="text-teal-500">
          <rect x="3" y="3" width="18" height="18" rx="2"/>
          <path d="M3 9h18M3 15h18M9 3v18"/>
        </svg>
      </div>
      <h1 className="text-2xl font-bold text-slate-900 dark:text-white mb-2">Spreadsheets</h1>
      <p className="text-slate-500 dark:text-slate-400 max-w-sm">
        Your spreadsheets workspace is coming soon. Screenshots incoming.
      </p>
    </div>
  );
}
