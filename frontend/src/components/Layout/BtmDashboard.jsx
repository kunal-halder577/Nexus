import { Bell, Home, Menu, Plus, Search } from "lucide-react";
import { NavLink, useLocation } from "react-router-dom";
import { useEffect, useRef, useState } from "react";

const NAV_ITEMS = [
  { icon: Menu,   label: "Menu",         action: "sidebar"      },
  { icon: Home,   href: "/",             label: "Home"          },
  { icon: Plus,   href: "/post/create",  label: "Create"        },
  { icon: Search, href: "/explore",      label: "Explore"       },
  { icon: Bell,   href: "/notification", label: "Alerts"        },
];

export default function BtmDashboard({ onOpenSidebar }) {
  const location = useLocation();
  const navRef   = useRef(null);

  const [pillPos, setPillPos]         = useState({ left: 0, width: 0 });
  const [pillVisible, setPillVisible] = useState(false);

  const activeIdx = NAV_ITEMS.findIndex(({ href }) =>
    href && (href === "/" ? location.pathname === "/" : location.pathname.startsWith(href))
  );

  useEffect(() => {
    if (!navRef.current || activeIdx === -1) {
      setPillVisible(false);
      return;
    }
    const buttons = navRef.current.querySelectorAll("[data-nav-btn]");
    const btn     = buttons[activeIdx];
    if (!btn) { setPillVisible(false); return; }

    setPillPos({ left: btn.offsetLeft, width: btn.offsetWidth });
    setPillVisible(true);
  }, [activeIdx, location.pathname]);

  return (
    <nav
      aria-label="Main navigation"
      ref={navRef}
      className="
        relative flex items-center justify-around
        h-16 px-1 z-40
        border-t border-border bg-background/80
        backdrop-blur-md safe-area-inset-bottom
      "
    >
      {/* Pill — z-index 0, pointer-events none, never blocks buttons */}
      <span
        aria-hidden
        style={{
          position:      "absolute",
          bottom:        8,
          left:          pillPos.left,
          width:         pillPos.width,
          height:        48,
          borderRadius:  12,
          background:    "rgb(99 102 241 / 0.10)",
          opacity:       pillVisible ? 1 : 0,
          pointerEvents: "none",
          zIndex:        0,
          transition:    "opacity 200ms ease, left 300ms cubic-bezier(.4,0,.2,1)",
        }}
      />

      {NAV_ITEMS.map((item, i) =>
        item.action === "sidebar" ? (
          <SidebarButton key="sidebar" item={item} onOpenSidebar={onOpenSidebar} />
        ) : (
          <NavItem key={item.href} item={item} isActive={i === activeIdx} />
        )
      )}
    </nav>
  );
}

function SidebarButton({ item, onOpenSidebar }) {
  const { icon: Icon, label } = item;
  const [pressed, setPressed] = useState(false);

  return (
    <button
      data-nav-btn
      aria-label={label}
      onClick={onOpenSidebar}
      onPointerDown={() => setPressed(true)}
      onPointerUp={()   => setPressed(false)}
      onPointerLeave={() => setPressed(false)}
      className="
        relative flex flex-col items-center justify-center
        w-full h-12 select-none rounded-xl
        text-muted-foreground
        focus-visible:outline-none focus-visible:ring-2
        focus-visible:ring-indigo-500 focus-visible:ring-offset-1
      "
      style={{
        zIndex:     1,
        transform:  pressed ? "scale(0.88)" : "scale(1)",
        transition: "transform 120ms ease",
      }}
    >
      <Icon size={20} strokeWidth={1.75} />
    </button>
  );
}

function NavItem({ item, isActive }) {
  const { icon: Icon, href, label } = item;
  const [pressed, setPressed] = useState(false);

  return (
    <NavLink
      to={href}
      end={href === "/"}
      data-nav-btn
      aria-label={label}
      aria-current={isActive ? "page" : undefined}
      onPointerDown={() => setPressed(true)}
      onPointerUp={()   => setPressed(false)}
      onPointerLeave={() => setPressed(false)}
      className="
        relative flex flex-col items-center justify-center
        w-full h-12 gap-0.5 select-none rounded-xl
        focus-visible:outline-none focus-visible:ring-2
        focus-visible:ring-indigo-500 focus-visible:ring-offset-1
      "
      style={{
        zIndex:     1,
        transform:  pressed ? "scale(0.88)" : "scale(1)",
        transition: "transform 120ms ease",
      }}
    >
      <Icon
        size={20}
        strokeWidth={isActive ? 2.25 : 1.75}
        className={`transition-colors duration-200 ${isActive ? "text-indigo-500" : "text-muted-foreground"}`}
      />
      <span className={`
        text-[10px] font-medium leading-none tracking-wide transition-all duration-200
        ${isActive ? "text-indigo-500 opacity-100 translate-y-0" : "opacity-0 -translate-y-1 pointer-events-none"}
      `}>
        {label}
      </span>
    </NavLink>
  );
}