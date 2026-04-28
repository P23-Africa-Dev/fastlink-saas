export default function ProjectsPage() {
  return (
    <div className="flex flex-col items-center justify-center min-h-[60vh] text-center">
      <div className="w-16 h-16 rounded-2xl bg-violet-500/10 dark:bg-violet-500/15 flex items-center justify-center mb-4">
        <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="text-violet-500">
          <path d="M22 19a2 2 0 0 1-2 2H4a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h5l2 3h9a2 2 0 0 1 2 2z"/>
        </svg>
      </div>
      <h1 className="text-2xl font-bold text-slate-900 dark:text-white mb-2">Projects</h1>
      <p className="text-slate-500 dark:text-slate-400 max-w-sm">
        Your projects view is coming soon. Screenshots incoming.
      </p>
    </div>
  );
}
