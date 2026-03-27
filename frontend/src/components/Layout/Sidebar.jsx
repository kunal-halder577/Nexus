import React from 'react';
import { Home, Compass, Bell, Mail, Bookmark, User, PenSquare } from 'lucide-react';
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
import { buttonVariants } from "@/components/ui/button";
import { ProfileDropdown } from './ProfileDropdown';
import { Link, NavLink } from 'react-router-dom';
import { useSelector } from 'react-redux';
import { selectCurrentUser } from '@/features/auth/authSlice';

const navItems = [
  { icon: Home,     label: "Home",          path: '/' },
  { icon: Compass,  label: "Explore",       path: '/explore' },
  { icon: Bell,     label: "Notifications", path: '/notifications' },
  { icon: Mail,     label: "Messages",      path: '/messages' },
  { icon: Bookmark, label: "Bookmarks",     path: '/bookmarks' },
  { icon: User,     label: "Profile",       path: '/profile/me' },
];

const LeftSidebar = () => {
  const { state } = useSidebar();
  const isExpanded = state === 'expanded';
  const user = useSelector(selectCurrentUser);

  return (
    <Sidebar
      collapsible="icon"
      className="border-r border-border/50 bg-background"
    >

      {/* ── LOGO ─────────────────────────────────────────── */}
      <SidebarHeader className="pt-5 pb-3 px-3">
        <SidebarMenu>
          <SidebarMenuItem>
            <SidebarMenuButton size="lg" className="hover:bg-transparent cursor-default select-none">
              {/* Logo mark — geometric indigo crystal */}
              <div className="relative shrink-0 size-9 flex items-center justify-center">
                {/* Outer ring */}
                <div className="absolute inset-0 rounded-xl border border-indigo-400/30 dark:border-indigo-500/25" />
                {/* Background fill */}
                <div className="absolute inset-0 rounded-xl bg-gradient-to-br from-indigo-500 via-indigo-500 to-indigo-700" />
                {/* Gloss layer */}
                <div className="absolute inset-0 rounded-xl bg-gradient-to-b from-white/18 via-transparent to-black/10 pointer-events-none" />
                {/* Letter */}
                <span className="relative font-extrabold text-white text-base tracking-tighter leading-none z-10"
                  style={{ fontVariantNumeric: 'tabular-nums', letterSpacing: '-0.04em' }}>
                  N
                </span>
              </div>
              {/* Wordmark */}
              <span className="font-semibold text-[1.2rem] tracking-[-0.04em] text-foreground ml-1.5 leading-none">
                Nexus
              </span>
            </SidebarMenuButton>
          </SidebarMenuItem>
        </SidebarMenu>
      </SidebarHeader>

      {/* ── NAV ITEMS ────────────────────────────────────── */}
      <SidebarContent className="px-2 py-1">
        <SidebarGroup className="p-0">
          <SidebarGroupContent>
            <SidebarMenu className="gap-0.5">
              {navItems.map((item) => (
                <SidebarMenuItem key={item.label}>
                  <SidebarMenuButton asChild tooltip={item.label} className="p-0 hover:bg-transparent active:bg-transparent focus-visible:ring-0 focus-visible:bg-transparent data-[active=true]:bg-transparent">
                    <NavLink
                      to={item.path}
                      className={({ isActive }) =>
                        [
                          'group relative flex items-center gap-3 px-3 h-11 rounded-xl w-full cursor-pointer transition-all duration-200',
                          'text-muted-foreground hover:text-foreground',
                          isActive
                            ? 'text-indigo-500 dark:text-indigo-400 font-semibold'
                            : 'hover:bg-accent/60',
                        ].join(' ')
                      }
                    >
                      {({ isActive }) => (
                        <>
                          {/* Active pill indicator */}
                          {isActive && (
                            <span className="absolute left-0 top-1/2 -translate-y-1/2 w-1 h-5 rounded-full bg-indigo-500 dark:bg-indigo-400" />
                          )}

                          {/* Icon container */}
                          <span className={[
                            'flex items-center justify-center size-8 rounded-lg shrink-0 transition-colors duration-200',
                            isActive
                              ? 'bg-indigo-500/10 dark:bg-indigo-400/10 text-indigo-500 dark:text-indigo-400'
                              : 'text-muted-foreground group-hover:text-foreground',
                          ].join(' ')}>
                            <item.icon className="size-[18px]" strokeWidth={isActive ? 2.2 : 1.8} />
                          </span>

                          {/* Label */}
                          <span className="text-[16.5px] font-medium tracking-[-0.01em]">
                            {item.label}
                          </span>
                        </>
                      )}
                    </NavLink>
                  </SidebarMenuButton>
                </SidebarMenuItem>
              ))}
            </SidebarMenu>
          </SidebarGroupContent>
        </SidebarGroup>

        {/* ── CREATE POST BUTTON ──────────────────────────── */}
        <div className="px-2 mt-4">
          <Link
            to="/post/create"
            className={buttonVariants({
              className: [
                'w-full h-11 rounded-xl font-bold text-sm cursor-pointer',
                'bg-indigo-500 hover:bg-indigo-600 active:bg-indigo-700',
                'text-white shadow-md shadow-indigo-500/25',
                'dark:bg-indigo-500 dark:hover:bg-indigo-600',
                'transition-colors duration-200',
                'border-0',
              ].join(' '),
            })}
          >
            {isExpanded ? (
              <span className="flex items-center gap-2">
                <PenSquare className="size-4" />
                Create Post
              </span>
            ) : (
              <PenSquare className="size-5" />
            )}
          </Link>
        </div>
      </SidebarContent>

      {/* ── PROFILE FOOTER ───────────────────────────────── */}
      <SidebarFooter className="p-3 border-t border-border/40">
        <SidebarMenu>
          <SidebarMenuItem>
            <div className={[
              'flex items-center gap-3 rounded-xl px-2.5 py-2.5',
              'hover:bg-accent/60 transition-colors duration-200 cursor-pointer',
              !isExpanded && 'justify-center px-0',
            ].join(' ')}>

              {/* Avatar */}
              <div className="shrink-0">
                <ProfileDropdown className="size-11 ring-2 ring-indigo-500/20 hover:ring-indigo-500/50 transition-all duration-200 cursor-pointer rounded-full" />
              </div>

              {/* Name + handle */}
              {isExpanded && (
                <div className="flex flex-col min-w-0 flex-1">
                  <span className="text-[15px] font-semibold text-foreground truncate leading-tight">
                    {user?.name || 'Your Name'}
                  </span>
                  <span className="text-[13px] text-muted-foreground/70 truncate leading-tight mt-0.5">
                    @{user?.username || 'username'}
                  </span>
                </div>
              )}

              {/* Online indicator */}
              {isExpanded && (
                <span className="size-2.5 rounded-full bg-emerald-400 shrink-0 shadow-sm shadow-emerald-400/50" />
              )}
            </div>
          </SidebarMenuItem>
        </SidebarMenu>
      </SidebarFooter>

    </Sidebar>
  );
};

export default LeftSidebar;
