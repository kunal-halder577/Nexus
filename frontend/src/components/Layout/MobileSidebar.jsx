import { useEffect } from "react";
import { Mail, Bookmark, Settings, HelpCircle, PenSquare, X, FileText, ChevronRight } from "lucide-react";
import { Link, useLocation } from "react-router-dom";
import { useSelector } from "react-redux";
import { selectCurrentUser } from "@/features/auth/authSlice.js";

const SECTIONS = [
  {
    label: "Your space",
    items: [
      { icon: Mail,     label: "Messages",  path: "/messages",  badge: 3,     accent: "#6366f1", bg: "rgba(99,102,241,0.08)"  },
      { icon: Bookmark, label: "Bookmarks", path: "/bookmarks", badge: null,  accent: "#f59e0b", bg: "rgba(245,158,11,0.08)"   },
      { icon: FileText, label: "Drafts",    path: "/drafts",    badge: null,  accent: "#14b8a6", bg: "rgba(20,184,166,0.08)"   },
    ],
  },
  {
    label: "Account",
    items: [
      { icon: Settings,   label: "Settings",      path: "/settings", badge: null, accent: "#94a3b8", bg: "rgba(148,163,184,0.08)" },
      { icon: HelpCircle, label: "Help & support", path: "/help",    badge: null, accent: "#94a3b8", bg: "rgba(148,163,184,0.08)" },
    ],
  },
];

export default function MobileSidebar({ open, onClose }) {
  const user     = useSelector(selectCurrentUser);
  const location = useLocation();

  useEffect(() => { onClose(); }, [location.pathname]);

  // No scroll lock needed — the backdrop (pointer-events-auto + touchAction:none)
  // already blocks all interaction with the feed behind it. Explicitly locking
  // overflow would hide the 6px custom scrollbar and cause a layout shift.

  useEffect(() => {
    const handler = (e) => { if (e.key === "Escape") onClose(); };
    window.addEventListener("keydown", handler);
    return () => window.removeEventListener("keydown", handler);
  }, [onClose]);

  return (
    <>
      {/* Backdrop */}
      <div
        aria-hidden
        onClick={onClose}
        className={`
          fixed inset-0 z-40 bg-black/60
          transition-opacity duration-300
          ${open ? "opacity-100 pointer-events-auto" : "opacity-0 pointer-events-none"}
        `}
        style={{ touchAction: "none" }}
      />

      {/* Panel */}
      <aside
        role="dialog"
        aria-modal="true"
        aria-label="Account menu"
        className={`
          fixed inset-y-0 left-0 z-50 flex flex-col
          w-[78%] max-w-[288px]
          bg-background border-r border-border/40
          shadow-2xl shadow-black/20
          transition-transform duration-300 ease-[cubic-bezier(.4,0,.2,1)]
          ${open ? "translate-x-0" : "-translate-x-full"}
        `}
      >

        {/* ── Header ── */}
        <div className="px-4 pt-5 pb-4 shrink-0">

          {/* Close button row */}
          <div className="flex justify-end mb-3">
            <button
              onClick={onClose}
              aria-label="Close menu"
              className="
                size-7 flex items-center justify-center rounded-full
                text-muted-foreground/40 hover:text-foreground hover:bg-accent/60
                transition-colors duration-150
                focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-indigo-500
              "
            >
              <X className="size-[13px]" strokeWidth={2.5} />
            </button>
          </div>

          {/* Profile card — navigates to /profile */}
          <Link
            to="/profile/me"
            className="
              group flex items-center gap-3 p-3 -mx-1 rounded-2xl
              hover:bg-accent/40 active:scale-[.98] active:bg-accent/60
              transition-all duration-150
              focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-indigo-500
            "
          >
            {/* Avatar with online dot */}
            <div className="relative shrink-0">
              {user?.avatarUrl ? (
                <img
                  src={user.avatarUrl}
                  alt={user?.name || "Avatar"}
                  className="size-11 rounded-full object-cover ring-2 ring-indigo-500/30 ring-offset-2 ring-offset-background"
                />
              ) : (
                <div className="
                  size-11 rounded-full ring-2 ring-indigo-500/30 ring-offset-2 ring-offset-background
                  bg-gradient-to-br from-indigo-400 to-indigo-600
                  flex items-center justify-center
                  text-white text-[15px] font-bold tracking-tight select-none
                ">
                  {(user?.name || "U")[0].toUpperCase()}
                </div>
              )}
              {/* Online dot */}
              <span className="
                absolute bottom-0 right-0
                size-[11px] rounded-full bg-emerald-500
                ring-2 ring-background
              " />
            </div>

            {/* Name + username */}
            <div className="flex-1 min-w-0">
              <p className="text-[14px] font-semibold text-foreground tracking-[-0.02em] leading-snug truncate">
                {user?.name || "Your Name"}
              </p>
              <p className="text-[12px] text-muted-foreground/45 mt-0.5 tracking-[-0.01em] truncate">
                @{user?.username || "username"}
              </p>
            </div>

            {/* Chevron */}
            <ChevronRight
              className="size-4 text-muted-foreground/30 group-hover:text-muted-foreground/60 transition-colors duration-150 shrink-0"
              strokeWidth={2}
            />
          </Link>
        </div>

        {/* Subtle divider */}
        <div className="mx-5 border-t border-border/20" />

        {/* ── Nav sections ── */}
        <nav className="flex-1 overflow-y-auto px-3 py-4 space-y-5">
          {SECTIONS.map((section) => (
            <div key={section.label}>
              <p className="
                text-[10px] font-bold tracking-[0.1em] uppercase
                text-muted-foreground/30 px-2.5 mb-2
              ">
                {section.label}
              </p>

              <div className="space-y-0.5">
                {section.items.map((item) => (
                  <Link
                    key={item.path}
                    to={item.path}
                    className="
                      group flex items-center gap-3 px-2.5 h-[42px] rounded-xl w-full
                      hover:bg-accent/40 active:scale-[.98] active:bg-accent/60
                      transition-all duration-150
                      focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-indigo-500
                    "
                  >
                    {/* Icon bubble */}
                    <span
                      className="size-[30px] rounded-lg flex items-center justify-center shrink-0 transition-transform duration-150 group-hover:scale-110"
                      style={{ background: item.bg, color: item.accent }}
                    >
                      <item.icon className="size-[13px]" strokeWidth={2} />
                    </span>

                    {/* Label */}
                    <span className="flex-1 text-[13.5px] font-medium text-foreground/90 tracking-[-0.01em]">
                      {item.label}
                    </span>

                    {/* Badge */}
                    {item.badge && (
                      <span className="
                        min-w-[18px] h-[18px] px-1 rounded-full
                        bg-indigo-500 text-white
                        text-[10px] font-bold flex items-center justify-center shrink-0
                        shadow-sm shadow-indigo-500/30
                      ">
                        {item.badge}
                      </span>
                    )}
                  </Link>
                ))}
              </div>
            </div>
          ))}
        </nav>

        {/* ── Bottom: Create Post CTA ── */}
        <div className="px-4 pt-3 pb-8 shrink-0">
          <Link
            to="/post/create"
            className="
              flex items-center justify-center gap-2
              w-full h-[42px] rounded-xl
              bg-indigo-500 hover:bg-indigo-600 active:bg-indigo-700 active:scale-[.98]
              text-white text-[13px] font-semibold tracking-[-0.01em]
              shadow-lg shadow-indigo-500/25
              transition-all duration-150
              focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-indigo-400
            "
          >
            <PenSquare className="size-[13px]" strokeWidth={2.3} />
            Create Post
          </Link>
        </div>

      </aside>
    </>
  );
}