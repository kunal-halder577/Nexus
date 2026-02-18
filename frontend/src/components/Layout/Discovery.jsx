import React from 'react';
import { Search, MoreHorizontal } from 'lucide-react';
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { ScrollArea, ScrollBar } from "@/components/ui/scroll-area";
import { useLocation, useNavigate } from 'react-router-dom';

const RightSidebar = () => {
  const location = useLocation();
  const navigate = useNavigate();
  const isSearchPage = location.pathname === '/explore';

  const handleSidebarSearch = (e) => {
    const query = e.target.value.trim();
    if(e.key === 'Enter' && query.length > 2) {
      navigate(`/explore?q=${encodeURIComponent(query)}`);
    }
    return;
  }

  return (
    // 2. We keep the outer div for layout, but let ScrollArea handle the overflow
    <div className="flex flex-col h-full py-4 px-4 xl:px-6">
      
      {/* SEARCH BAR (Stayed outside ScrollArea so it remains truly sticky) */}
      {!isSearchPage && (
        <div className="mb-4">
          <div className="relative group">
            <Search className="absolute left-4 top-3 h-5 w-5 text-muted-foreground group-focus-within:text-primary transition-colors" />
            <Input 
              type="text" 
              placeholder="Search Nexus" 
              className="h-12 pl-12 pr-4 rounded-full bg-secondary/50 border-transparent focus-visible:ring-1 focus-visible:ring-primary focus-visible:bg-background focus-visible:border-primary transition-all text-base"
              onKeyDown={handleSidebarSearch}
            />
          </div>
        </div>
      )}

      {/* 3. Wrap everything else in ScrollArea */}
      <ScrollArea className="flex-1 w-full rounded-md">
        <div className="flex flex-col gap-6 pb-10">
          
          {/* TRENDING CARD */}
          <div className="bg-secondary/40 rounded-2xl p-4">
            <h2 className="font-extrabold text-xl mb-4 px-1">What's happening</h2>
            <div className="flex flex-col">
              <TrendItem category="Web Development" topic="React 19" posts="45.2K" />
              <TrendItem category="Technology · Trending" topic="Nexus Launch" posts="12.5K" />
              <TrendItem category="Design" topic="Shadcn UI" posts="8,230" />
              <TrendItem category="Gaming" topic="Ark Ascended" posts="22.1K" />
            </div>
            <Button variant="ghost" className="w-full justify-start text-primary hover:bg-secondary/60 mt-2">
              Show more
            </Button>
          </div>

          {/* WHO TO FOLLOW CARD */}
          <div className="bg-secondary/40 rounded-2xl p-4">
            <h2 className="font-extrabold text-xl mb-4 px-1">Who to follow</h2>
            <div className="flex flex-col gap-4">
              <SuggestedUser name="Lee Robinson" handle="@leerob" avatarUrl="https://github.com/leerob.png" />
              <SuggestedUser name="Guillermo Rauch" handle="@rauchg" avatarUrl="https://github.com/rauchg.png" />
              <SuggestedUser name="Shadcn" handle="@shadcn" avatarUrl="https://github.com/shadcn.png" />
            </div>
            <Button variant="ghost" className="w-full justify-start text-primary hover:bg-secondary/60 mt-4">
              Show more
            </Button>
          </div>

        </div>
        <ScrollBar orientation='vertical'/>
      </ScrollArea>
    </div>
  );
};
// --- Sub-components ---

const TrendItem = ({ category, topic, posts }) => (
  <div className="flex justify-between items-start hover:bg-secondary/60 transition-colors cursor-pointer py-3 px-1 -mx-1 rounded-md">
    <div>
      <p className="text-xs font-medium text-muted-foreground">{category}</p>
      <p className="font-bold text-base mt-0.5">{topic}</p>
      <p className="text-xs text-muted-foreground mt-0.5">{posts} posts</p>
    </div>
    <Button variant="ghost" size="icon" className="h-8 w-8 text-muted-foreground">
      <MoreHorizontal className="h-4 w-4" />
    </Button>
  </div>
);

const SuggestedUser = ({ name, handle, avatarUrl }) => (
  <div className="flex items-center justify-between">
    <div className="flex items-center gap-3 min-w-0">
      <Avatar className="h-10 w-10">
        <AvatarImage src={avatarUrl} />
        <AvatarFallback>{name.charAt(0)}</AvatarFallback>
      </Avatar>
      <div className="flex flex-col min-w-0">
        <span className="font-bold text-sm truncate hover:underline cursor-pointer">{name}</span>
        <span className="text-muted-foreground text-sm truncate">{handle}</span>
      </div>
    </div>
    <Button variant="secondary" className="rounded-full font-bold h-8 px-4 bg-foreground text-background hover:bg-foreground/90">
      Follow
    </Button>
  </div>
);

export default RightSidebar;