import React from "react";
import { Moon, Sun, Monitor, User, Settings, LogOut, ChevronRight, Check } from "lucide-react";
import { useNavigate } from "react-router-dom";
import { useDispatch, useSelector } from "react-redux";

// API & Store Imports
import { useLogoutMutation } from "@/features/auth/api/authApi.js";
import { baseApi } from "@/lib/api/baseApi.js";
import { selectCurrentUser } from "@/features/auth/authSlice.js";
import { logout as clientLogout } from "@/features/auth/authAction.js";
import { useUiStore } from "@/stores/ui.store";

// UI Imports
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
  DropdownMenuSub,
  DropdownMenuSubTrigger,
  DropdownMenuSubContent,
  DropdownMenuPortal,
} from "@/components/ui/dropdown-menu";

const themes = [
  { value: "light",  label: "Light",  icon: Sun },
  { value: "dark",   label: "Dark",   icon: Moon },
  { value: "system", label: "System", icon: Monitor },
];

export const ProfileDropdown = ({ className }) => {
  const navigate = useNavigate();
  const dispatch = useDispatch();
  const user = useSelector(selectCurrentUser);

  const theme    = useUiStore((s) => s.theme);
  const setTheme = useUiStore((s) => s.setTheme);
  const [logout] = useLogoutMutation();

  const handleLogout = async () => {
    try {
      await logout().unwrap();
    } catch (error) {
      console.warn("Logout failed", error);
    } finally {
      dispatch(clientLogout());
      dispatch(baseApi.util.resetApiState());
      navigate('/login');
    }
  };

  if (!user) return null;

  const initials = user?.name?.charAt(0)?.toUpperCase() || 'U';

  return (
    <DropdownMenu>
      {/* ── TRIGGER ── */}
      <DropdownMenuTrigger asChild>
        <Avatar className={`cursor-pointer ring-2 ring-transparent hover:ring-indigo-500/40 transition-all duration-200 ${className}`}>
          <AvatarImage src={user?.avatarUrl} alt={user?.name} />
          <AvatarFallback className="bg-indigo-500/15 text-indigo-500 dark:text-indigo-400 font-semibold text-sm">
            {initials}
          </AvatarFallback>
        </Avatar>
      </DropdownMenuTrigger>

      {/* ── CONTENT ── */}
      <DropdownMenuContent
        align="end"
        sideOffset={8}
        className="w-64 rounded-2xl p-1.5 shadow-xl shadow-black/10 dark:shadow-black/30 border border-border/60"
      >

        {/* Profile header */}
        <DropdownMenuLabel className="px-2 py-2 mb-0.5">
          <div className="flex items-center gap-3">
            <Avatar className="size-10 ring-2 ring-indigo-500/20 shrink-0">
              <AvatarImage src={user?.avatarUrl} alt={user?.name} />
              <AvatarFallback className="bg-indigo-500/15 text-indigo-500 dark:text-indigo-400 font-semibold">
                {initials}
              </AvatarFallback>
            </Avatar>
            <div className="flex flex-col min-w-0">
              <span className="text-[14px] font-semibold text-foreground truncate leading-tight">
                {user?.name || 'Your Name'}
              </span>
              <span className="text-[12px] text-muted-foreground/70 truncate mt-0.5">
                @{user?.username || 'username'}
              </span>
            </div>
            {/* Online dot */}
            <span className="ml-auto size-2 rounded-full bg-emerald-400 shadow-sm shadow-emerald-400/60 shrink-0" />
          </div>
        </DropdownMenuLabel>

        <DropdownMenuSeparator className="mx-1 my-1 bg-border/50" />

        {/* Nav items */}
        <DropdownMenuItem
          className="flex items-center gap-2.5 px-2.5 py-2 rounded-lg cursor-pointer text-[13.5px] text-foreground/80 hover:text-foreground hover:bg-accent/70 focus:bg-accent/70 transition-colors"
          onClick={() => navigate('/profile/me')}
        >
          <span className="flex items-center justify-center size-7 rounded-md bg-accent shrink-0">
            <User className="size-3.5 text-muted-foreground" />
          </span>
          Profile
        </DropdownMenuItem>

        <DropdownMenuItem
          className="flex items-center gap-2.5 px-2.5 py-2 rounded-lg cursor-pointer text-[13.5px] text-foreground/80 hover:text-foreground hover:bg-accent/70 focus:bg-accent/70 transition-colors"
          onClick={() => navigate('/settings')}
        >
          <span className="flex items-center justify-center size-7 rounded-md bg-accent shrink-0">
            <Settings className="size-3.5 text-muted-foreground" />
          </span>
          Settings
        </DropdownMenuItem>

        <DropdownMenuSeparator className="mx-1 my-1 bg-border/50" />

        {/* Theme sub-menu */}
        <DropdownMenuSub>
          <DropdownMenuSubTrigger className="flex items-center gap-2.5 px-2.5 py-2 rounded-lg cursor-pointer text-[13.5px] text-foreground/80 hover:text-foreground hover:bg-accent/70 focus:bg-accent/70 transition-colors [&>svg:last-child]:ml-auto [&>svg:last-child]:hidden">
            <span className="flex items-center justify-center size-7 rounded-md bg-accent shrink-0">
              {/* Sun/Moon toggle icon */}
              <Sun className="size-3.5 text-muted-foreground rotate-0 scale-100 transition-all dark:-rotate-90 dark:scale-0" />
              <Moon className="absolute size-3.5 text-muted-foreground rotate-90 scale-0 transition-all dark:rotate-0 dark:scale-100" />
            </span>
            <span>Appearance</span>
            <ChevronRight className="ml-auto size-3.5 text-muted-foreground/50" />
          </DropdownMenuSubTrigger>

          <DropdownMenuPortal>
            <DropdownMenuSubContent
              sideOffset={6}
              className="w-44 rounded-xl p-1.5 shadow-xl shadow-black/10 dark:shadow-black/30 border border-border/60"
            >
              {themes.map(({ value, label, icon: Icon }) => (
                <DropdownMenuItem
                  key={value}
                  onClick={() => setTheme(value)}
                  className="flex items-center gap-2.5 px-2.5 py-2 rounded-lg cursor-pointer text-[13px] hover:bg-accent/70 focus:bg-accent/70 transition-colors"
                >
                  <Icon className="size-3.5 text-muted-foreground" />
                  <span>{label}</span>
                  {theme === value && (
                    <Check className="ml-auto size-3.5 text-indigo-500 dark:text-indigo-400" />
                  )}
                </DropdownMenuItem>
              ))}
            </DropdownMenuSubContent>
          </DropdownMenuPortal>
        </DropdownMenuSub>

        <DropdownMenuSeparator className="mx-1 my-1 bg-border/50" />

        {/* Logout */}
        <DropdownMenuItem
          onClick={handleLogout}
          className="flex items-center gap-2.5 px-2.5 py-2 rounded-lg cursor-pointer text-[13.5px] text-red-500 hover:text-red-500 hover:bg-red-500/8 focus:bg-red-500/8 focus:text-red-500 dark:hover:bg-red-500/10 transition-colors"
        >
          <span className="flex items-center justify-center size-7 rounded-md bg-red-500/10 shrink-0">
            <LogOut className="size-3.5 text-red-500" />
          </span>
          Log out
        </DropdownMenuItem>

      </DropdownMenuContent>
    </DropdownMenu>
  );
};
