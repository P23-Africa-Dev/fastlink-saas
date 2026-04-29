// Chrome icon
function ChromeIcon() {
  return (
    <svg width="24" height="24" viewBox="0 0 24 24" fill="none">
      <circle cx="12" cy="12" r="10" fill="#fff" />
      <circle cx="12" cy="12" r="4.5" fill="#4285f4" />
      <path d="M12 7.5h9.33A10 10 0 0112 2a10 10 0 00-8.66 5L7.2 13.5A4.5 4.5 0 0112 7.5z" fill="#ea4335" />
      <path d="M21.33 7.5H12a4.5 4.5 0 014.8 6l4.86 2.5A10 10 0 0022 12a10 10 0 00-.67-4.5z" fill="#fbbc05" />
      <path d="M7.2 13.5L2.34 5A10 10 0 002 12a10 10 0 006.54 9.38L12 16.5a4.5 4.5 0 01-4.8-3z" fill="#34a853" />
    </svg>
  );
}

// Windows icon
function WindowsIcon() {
  return (
    <svg width="24" height="24" viewBox="0 0 24 24" fill="none">
      <rect x="2"  y="2"  width="9.5" height="9.5" rx="1" fill="#f35325" />
      <rect x="12.5" y="2"  width="9.5" height="9.5" rx="1" fill="#81bc06" />
      <rect x="2"  y="12.5" width="9.5" height="9.5" rx="1" fill="#05a6f0" />
      <rect x="12.5" y="12.5" width="9.5" height="9.5" rx="1" fill="#ffba08" />
    </svg>
  );
}

// Stack Overflow icon
function StackOverflowIcon() {
  return (
    <svg width="24" height="24" viewBox="0 0 24 24" fill="none">
      <path d="M18 20v-5h2v7H4v-7h2v5h12z" fill="#bcbbbb" />
      <rect x="6" y="17" width="12" height="1.5" fill="#f48024" />
      <rect x="6.5" y="13.5" width="11" height="1.5" transform="rotate(-3 6.5 13.5)" fill="#f48024" />
      <rect x="8" y="10" width="10" height="1.5" transform="rotate(-7 8 10)" fill="#f48024" />
      <rect x="10" y="7" width="9" height="1.5" transform="rotate(-12 10 7)" fill="#f48024" />
    </svg>
  );
}

const SOURCES = [
  {
    name: "Chrome",
    type: "Top Browser",
    count: "2k+",
    icon: <ChromeIcon />,
    iconBg: "#111",
  },
  {
    name: "Windows",
    type: "Top Platform",
    count: "1.9k+",
    icon: <WindowsIcon />,
    iconBg: "#111",
  },
  {
    name: "Stack Overflow",
    type: "Top Sources",
    count: "1.6k+",
    icon: <StackOverflowIcon />,
    iconBg: "#111",
  },
];

export function LeadSourceCards() {
  return (
    <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-5">
      <div className="flex flex-col sm:flex-row sm:items-center gap-5">
        {/* Left description — matches screenshot text exactly */}
        <div className="sm:w-40 shrink-0">
          <h3 className="font-semibold text-gray-900 text-sm">Top Sessions</h3>
          <p className="text-xs text-gray-400 mt-1 leading-relaxed">
            Your website statistics for <span className="font-semibold text-gray-600">1 week</span> period.
          </p>
        </div>

        {/* 3 platform cards */}
        <div className="flex-1 grid grid-cols-3 gap-3">
          {SOURCES.map((src) => (
            <div
              key={src.name}
              className="rounded-xl p-4 flex flex-col items-center gap-3"
              style={{ background: "#111111" }}
            >
              {/* Icon */}
              <div className="w-11 h-11 rounded-full bg-white/10 flex items-center justify-center shrink-0">
                {src.icon}
              </div>

              {/* Info */}
              <div className="text-center">
                <p className="text-[10px] font-medium text-gray-500">{src.type}</p>
                <p className="text-sm font-bold text-white mt-0.5">{src.name}</p>
                <p className="text-xl font-bold text-white mt-1 leading-none">{src.count}</p>
                <p className="text-[10px] text-gray-500 mt-0.5">/ Sessions</p>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
