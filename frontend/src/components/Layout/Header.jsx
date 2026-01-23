import React, { useState, useEffect } from "react";
import { Bell } from "lucide-react";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Button } from "@/components/ui/button";
import { ProfileDropdown } from "./ProfileDropdown.jsx";

const Header = () => {
  // 1. STATE: Track scroll direction for "Smart Visibility"
  const [isVisible, setIsVisible] = useState(true);
  const [lastScrollY, setLastScrollY] = useState(0);

  useEffect(() => {
    const controlNavbar = () => {
      const currentScrollY = window.scrollY;

      if (currentScrollY > lastScrollY && currentScrollY > 100) {
        // Scrolling DOWN -> Hide Header
        setIsVisible(false);
      } else {
        // Scrolling UP -> Show Header
        setIsVisible(true);
      }
      setLastScrollY(currentScrollY);
    };

    window.addEventListener("scroll", controlNavbar);
    return () => window.removeEventListener("scroll", controlNavbar);
  }, [lastScrollY]);

  return (
    <header
      className={`
        sticky top-0 z-50 w-full transition-transform duration-300 ease-in-out
        ${isVisible ? "translate-y-0" : "-translate-y-full"}
      `}
    >
      <div className="flex h-16 items-center justify-between border-b border-border/40 bg-background/80 px-4 backdrop-blur-md sm:px-6">
        
        {/* --- LEFT: IDENTITY --- */}
        <div className="flex items-center">
          {/* Note: Ensure you have a Serif font configured in Tailwind as 'font-serif' */}
          <h1 className="
            cursor-pointer 
            font-['Outfit',sans-serif] 
            text-lg sm:text-xl 
            font-light 
            uppercase 
            tracking-[0.25em] 
            text-foreground 
            pl-[0.25em] 
            transition-opacity hover:opacity-70
          ">
            Nexus
          </h1>
        </div>

        {/* --- CENTER: NAVIGATION (Segmented Control) --- */}
        <div className="absolute left-1/2 top-1/2 hidden -translate-x-1/2 -translate-y-1/2 md:block">
          <Tabs defaultValue="foryou" className="w-auto">
            <TabsList className="h-9 bg-muted/50 p-1">
              <TabsTrigger
                value="foryou"
                className="rounded-sm px-4 text-xs font-medium transition-all data-[state=active]:bg-background cursor-pointer data-[state=active]:shadow-sm"
              >
                For You
              </TabsTrigger>
              <TabsTrigger
                value="following"
                className="rounded-sm px-4 text-xs font-medium transition-all data-[state=active]:bg-background data-[state=active]:shadow-sm cursor-pointer"
              >
                Following
              </TabsTrigger>
            </TabsList>
          </Tabs>
        </div>

        {/* --- RIGHT: UTILITY --- */}
        <div className="flex items-center gap-3">
          <Button variant="ghost" size="icon" className="h-9 w-9 cursor-pointer rounded-full">
            <Bell className="h-5 w-5 stroke-[1.5px] text-muted-foreground hover:text-foreground" />
            <span className="sr-only">Notifications</span>
          </Button>

          {/* Profile Avatar */}
          <ProfileDropdown />
        </div>
      </div>
    </header>
  );
};

export default Header;