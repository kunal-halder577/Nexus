import { useEffect } from "react"
import { SidebarProvider } from "@/components/ui/sidebar.jsx"
import LeftSidebar from "./Sidebar.jsx"
import RightSidebar from "./Discovery.jsx"
import { Outlet } from "react-router-dom"

export default function AppLayout() {

  return (
    <SidebarProvider>
      
      <LeftSidebar />

      <main className="flex w-full min-h-screen">
        <section className="flex-1 min-w-0 border-r border-border">
          <div className="max-w-2xl mx-auto w-full">
            <Outlet />
          </div>
        </section>

        <aside className="hidden lg:block w-[350px] sticky top-0 h-screen overflow-hidden">
          <RightSidebar />
        </aside>
      </main>
    </SidebarProvider>
  )
}
