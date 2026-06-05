import { useState } from "react";
import { Outlet, useLocation } from "react-router-dom";
import { SidebarProvider } from "@/components/ui/sidebar.jsx";
import LeftSidebar from "./Sidebar.jsx";
import MobileSidebar from "./MobileSidebar.jsx";
import RightSidebar from "./Discovery.jsx";
import BtmDashboard from "./BtmDashboard.jsx";

export default function AppLayout() {
  const [mobileSidebarOpen, setMobileSidebarOpen] = useState(false);
  const location = useLocation();

  // Hide the bottom navigation bar on all post-related pages 
  // (e.g., /post/create, /post/:id) and the admin dashboard for a more immersive experience.
  const showBtmNav = !location.pathname.startsWith("/post/") && !location.pathname.startsWith("/admin");

  return (
    <SidebarProvider>
      {/* Desktop sidebar — hidden on mobile */}
      <div className="hidden md:block">
        <LeftSidebar />
      </div>

      {/* Mobile sidebar overlay */}
      <MobileSidebar
        open={mobileSidebarOpen}
        onClose={() => setMobileSidebarOpen(false)}
      />

      {/* ── Main content area ── */}
      <main className="flex w-full h-dvh overflow-hidden">

        {/* Feed column — scrolls internally, nav always at bottom */}
        <section className="flex flex-col flex-1 min-w-0 border-r border-border overflow-hidden">

          {/* Scrollable content — pb-28 reserves space so content isn't hidden under the fixed nav */}
          <div id="feed-scroll" className="flex-1 overflow-y-auto" style={{ scrollbarGutter: 'stable' }}>
            <div className={`max-w-2xl mx-auto w-full relative ${showBtmNav ? "pb-28 md:pb-0" : ""}`}>
              <Outlet />
            </div>
          </div>
        </section>

        {/* Right sidebar — large screens only */}
        <aside className="hidden lg:block w-[350px] shrink-0 h-full overflow-hidden">
          <RightSidebar />
        </aside>

      </main>

      {/* Bottom nav — Floating pill design */}
      {showBtmNav && !mobileSidebarOpen && (
        <div 
          className="md:hidden fixed z-50 pointer-events-none flex justify-center w-full"
          style={{ bottom: 'calc(1.25rem + env(safe-area-inset-bottom))' }}
        >
          <div className="w-[calc(100%-2rem)] max-w-md pointer-events-auto">
            <BtmDashboard onOpenSidebar={() => setMobileSidebarOpen(true)} />
          </div>
        </div>
      )}
    </SidebarProvider>
  );
}