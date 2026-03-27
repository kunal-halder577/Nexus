import { useEffect } from "react"
import { SidebarProvider } from "@/components/ui/sidebar"
import LeftSidebar from "./Sidebar"
import RightSidebar from "./Discovery"
import { Outlet } from "react-router-dom"

export default function AppLayout() {
  useEffect(() => {
    const styleId = 'nexus-feed-scrollbar';
    if (document.getElementById(styleId)) return;

    const style = document.createElement('style');
    style.id = styleId;
    style.textContent = `
      html::-webkit-scrollbar { width: 6px; }
      html::-webkit-scrollbar-track { background: transparent; }
      html::-webkit-scrollbar-thumb { background: #6366f1; border-radius: 9999px; }
      html::-webkit-scrollbar-thumb:hover { background: #818cf8; }
    `;
    document.head.appendChild(style);
    return () => { document.getElementById(styleId)?.remove(); };
  }, []);

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
