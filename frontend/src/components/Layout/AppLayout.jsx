import { SidebarProvider, SidebarTrigger } from "@/components/ui/sidebar"
import LeftSidebar from "./Sidebar"
import Feed from "./Feed"
import RightSidebar from "./Discovery"
import { Outlet } from "react-router-dom"
// Import your existing components here:




export default function AppLayout() {
  return (
    <SidebarProvider>
      {/* 1. LEFT SIDEBAR (Shadcn) */}
      <LeftSidebar />

      {/* Main Wrapper for the rest of the layout */}
      <main className="flex w-full min-h-screen">
        
        {/* 2. MIDDLE FEED (Responsive, expands to fill space) */}
        <section className="flex-1 min-w-0 border-r border-border">
          {/* Mobile Sidebar Trigger (Visible only on mobile/tablet) */}
          {/* <div className="md:hidden p-4 border-b border-border sticky top-0 bg-background z-10">
            <SidebarTrigger />
          </div> */}

          <div className="max-w-2xl mx-auto w-full">
            <Outlet />
          </div>
        </section>

        {/* 3. RIGHT SIDEBAR (Fixed width, sticky, hidden on mobile/tablet) */}
        <aside className="hidden lg:block w-[350px] sticky top-0 h-screen overflow-y-auto">
          <RightSidebar />
        </aside>

      </main>
    </SidebarProvider>
  )
}