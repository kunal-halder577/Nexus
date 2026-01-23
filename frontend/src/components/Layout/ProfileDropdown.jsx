import React from "react";
import { Moon, Sun, Monitor, Group, User, Settings, Settings2 } from "lucide-react";
import { useNavigate } from "react-router-dom";
import { useDispatch, useSelector } from "react-redux";

// API & Store Imports
import { useLogoutMutation } from "@/features/auth/api/authApi.js";
import { baseApi } from "@/lib/api/baseApi.js"; // Ensure this path is correct
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

export const ProfileDropdown = () => {
  const navigate = useNavigate();
  const dispatch = useDispatch();
  const user = useSelector(selectCurrentUser);

  // Zustand & Redux Hooks
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

  if(!user) return null;

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Avatar className="h-8 w-8 cursor-pointer border border-border/50 transition-all hover:ring-2 hover:ring-ring hover:ring-offset-1">
          <AvatarImage src={user?.avatarUrl} alt="@user" />
          <AvatarFallback>{user?.name?.charAt(0) ||'U'}</AvatarFallback>
        </Avatar>
      </DropdownMenuTrigger>
      
      <DropdownMenuContent align="end" className="w-56">
        <DropdownMenuLabel>
          <div className="flex flex-col">
            <span>{user?.name || 'Name'}</span>
            <span>{'@'+user?.username || '@username'}</span>
          </div>
        </DropdownMenuLabel>
        <DropdownMenuSeparator />
        <DropdownMenuItem>
          <User />
          <span>Profile</span>
        </DropdownMenuItem>
        <DropdownMenuItem>
          <Settings />
          <span>Settings</span>
        </DropdownMenuItem>
        
        <DropdownMenuSeparator />
        
        {/* Theme Sub-Menu */}
        <DropdownMenuSub>
          <DropdownMenuSubTrigger>
            <Sun className="mr-2 h-4 w-4 rotate-0 scale-100 transition-all dark:-rotate-90 dark:scale-0" />
            <Moon className="absolute mr-2 h-4 w-4 rotate-90 scale-0 transition-all dark:rotate-0 dark:scale-100" />
            <span>Theme</span>
          </DropdownMenuSubTrigger>
          <DropdownMenuPortal>
            <DropdownMenuSubContent>
              <DropdownMenuItem onClick={() => setTheme("light")}>
                <Sun className="mr-2 h-4 w-4" />
                <span>Light</span>
              </DropdownMenuItem>
              <DropdownMenuItem onClick={() => setTheme("dark")}>
                <Moon className="mr-2 h-4 w-4" />
                <span>Dark</span>
              </DropdownMenuItem>
              <DropdownMenuItem onClick={() => setTheme("system")}>
                <Monitor className="mr-2 h-4 w-4" />
                <span>System</span>
              </DropdownMenuItem>
            </DropdownMenuSubContent>
          </DropdownMenuPortal>
        </DropdownMenuSub>

        <DropdownMenuSeparator />
        
        <DropdownMenuItem 
          className="text-red-600 focus:text-red-600 focus:bg-red-100 dark:focus:bg-red-900/20"
          onClick={handleLogout} 
        >
          Log out
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  );
};