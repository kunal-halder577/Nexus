import React from 'react';
import { Home, Compass, Bell, Mail, Bookmark, User, Settings, PenSquare, MoreHorizontal, LogOut } from 'lucide-react';
import { 
  Sidebar, 
  SidebarContent, 
  SidebarFooter, 
  SidebarGroup, 
  SidebarGroupContent, 
  SidebarHeader, 
  SidebarMenu, 
  SidebarMenuButton, 
  SidebarMenuItem,
  useSidebar
} from "@/components/ui/sidebar";
import { Button } from "@/components/ui/button";
import { ProfileDropdown } from './ProfileDropdown';
import { NavLink } from 'react-router-dom';
import { useSelector } from 'react-redux';
import { selectCurrentUser } from '@/features/auth/authSlice';

const LeftSidebar = () => {
  const { state } = useSidebar(); // Access sidebar state (expanded vs collapsed)
  const user = useSelector(selectCurrentUser);
  const navItems = [
    { icon: Home, label: "Home", path: '/' },
    { icon: Compass, label: "Explore", path: '/explore' },
    { icon: Bell, label: "Notifications", path: '/notifications' },
    { icon: Mail, label: "Messages", path: '/messages' },
    { icon: Bookmark, label: "Bookmarks", path: '/bookmarks' },
    { icon: User, label: "Profile", path: '/profile/me' },
  ];

  return (
    <Sidebar collapsible="icon" className="border-r border-border">
      
      {/* --- LOGO --- */}
      <SidebarHeader className="pt-4 pb-2 px-4">
        <SidebarMenu>
          <SidebarMenuItem>
            <SidebarMenuButton size="lg" className="hover:bg-transparent cursor-default">
              <div className="flex aspect-square size-10 items-center justify-center rounded-full bg-primary text-primary-foreground font-bold text-2xl">
                N
              </div>
              <span className="font-bold text-2xl tracking-tight ml-2">Nexus</span>
            </SidebarMenuButton>
          </SidebarMenuItem>
        </SidebarMenu>
      </SidebarHeader>

      {/* --- NAVIGATION --- */}
      <SidebarContent className="px-2">
        <SidebarGroup>
          <SidebarGroupContent>
            <SidebarMenu className="gap-2">
              {navItems.map((item) => (
                <SidebarMenuItem key={item.label}>
                  <SidebarMenuButton 
                    asChild 
                    tooltip={item.label}
                  >
                    <NavLink 
                      to={item.path}
                      className={`h-12 text-lg font-medium transition-all aria-[current=page]:font-extrabold`}
                    >
                      <item.icon className="!size-6" />
                      <span>{item.label}</span>
                    </NavLink>
                  </SidebarMenuButton>
                </SidebarMenuItem>
              ))}
            </SidebarMenu>
          </SidebarGroupContent>
        </SidebarGroup>

        {/* Create Post Button */}
        <div className="px-2 mt-2">
          <Button 
            size="lg" 
            className="w-full h-12 rounded-full font-bold shadow-md transition-transform cursor-pointer"
          >
            {state === "expanded" ? (
              <span className="text-lg">Create Post</span>
            ) : (
              <PenSquare className="h-6 w-6" />
            )}
          </Button>
        </div>
      </SidebarContent>

      {/* --- PROFILE DROPDOWN --- */}
      <SidebarFooter className="p-4 font-medium text-sm">
        <SidebarMenu>
          <SidebarMenuItem>
            <div className='flex items-center gap-3'>
              <ProfileDropdown className={'h-10 w-10'}/>
              <div className='flex flex-col'>
                <span>{user?.name || 'Name'}</span>
                <span>{`@${user?.username}` || '@username'}</span>
              </div>
            </div>
          </SidebarMenuItem>
        </SidebarMenu>
      </SidebarFooter>

    </Sidebar>
  );
};

export default LeftSidebar;