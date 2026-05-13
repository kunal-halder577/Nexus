import { useState } from "react";
import { Outlet, useLocation } from "react-router-dom";
import { SidebarProvider } from "@/components/ui/sidebar.jsx";
import LeftSidebar from "./Sidebar.jsx";
import MobileSidebar from "./MobileSidebar.jsx";
import RightSidebar from "./Discovery.jsx";
import BtmDashboard from "./BtmDashboard.jsx";

const HIDE_BTM_NAV_ON = ["/post/create"];

export default function AppLayout() {
  const [mobileSidebarOpen, setMobileSidebarOpen] = useState(false);
  const location = useLocation();

  const showBtmNav = !HIDE_BTM_NAV_ON.includes(location.pathname);

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

          {/* Scrollable content — pb-16 reserves space so content isn't hidden under the fixed nav */}
          <div id="feed-scroll" className="flex-1 overflow-y-auto" style={{ scrollbarGutter: 'stable' }}>
            <div className={`max-w-2xl mx-auto w-full relative ${showBtmNav ? "pb-16 md:pb-0" : ""}`}>
              <Outlet />
            </div>
          </div>
        </section>

        {/* Right sidebar — large screens only */}
        <aside className="hidden lg:block w-[350px] shrink-0 h-full overflow-hidden">
          <RightSidebar />
        </aside>

      </main>

      {/* Bottom nav — fixed to viewport bottom, backdrop-blur works because page content scrolls behind it */}
      {showBtmNav && !mobileSidebarOpen && (
        <div className="md:hidden fixed bottom-0 left-0 right-0 z-30">
          <BtmDashboard onOpenSidebar={() => setMobileSidebarOpen(true)} />
        </div>
      )}
    </SidebarProvider>
  );
}