import React from 'react';
import { Search, MoreHorizontal, TrendingUp, Flame, Sparkles } from 'lucide-react';
import { Input } from "@/components/ui/input.jsx";
import { Button } from "@/components/ui/button.jsx";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar.jsx";
import { ScrollArea, ScrollBar } from "@/components/ui/scroll-area.jsx";
import { useLocation, useNavigate } from 'react-router-dom';

const RightSidebar = () => {
  const location = useLocation();
  const navigate = useNavigate();
  const isSearchPage = location.pathname === '/explore';

  const handleSidebarSearch = (e) => {
    const query = e.target.value.trim();
    if (e.key === 'Enter' && query.length > 2) {
      navigate(`/explore?q=${encodeURIComponent(query)}`);
    }
  };

  return (
    <div className="flex flex-col h-full py-5 px-3 xl:px-5">

      {/* SEARCH BAR */}
      {!isSearchPage && (
        <div className="mb-5">
          <div className="relative group">
            <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground group-focus-within:text-indigo-400 transition-colors duration-200 z-10" />
            <Input
              type="text"
              placeholder="Search Nexus..."
              className="h-10 pl-10 pr-4 rounded-xl bg-white/5 border border-white/10 focus-visible:ring-1 focus-visible:ring-indigo-500 focus-visible:border-indigo-500/60 focus-visible:bg-white/8 transition-all duration-200 text-sm placeholder:text-muted-foreground/60"
              onKeyDown={handleSidebarSearch}
            />
          </div>
        </div>
      )}

      {/* SCROLLABLE CONTENT */}
      <ScrollArea 
        className="flex-1 min-h-0 w-full 
          [&>[data-radix-scroll-area-viewport]]:!pr-2
          [&_[data-radix-scroll-area-scrollbar][data-orientation=vertical]]:!bg-transparent
          [&_[data-radix-scroll-area-thumb]]:!bg-indigo-500
          [&_[data-radix-scroll-area-thumb]]:!rounded-full"
      >
        <div className="flex flex-col gap-4 pb-10 pr-1">

          {/* TRENDING CARD */}
          <div className="rounded-2xl overflow-hidden border border-white/8">
            <div className="bg-gradient-to-br from-indigo-600/20 via-indigo-500/10 to-transparent px-4 pt-4 pb-3 border-b border-white/6">
              <div className="flex items-center gap-2">
                <div className="p-1.5 rounded-lg bg-indigo-500/20 border border-indigo-500/30">
                  <TrendingUp className="h-3.5 w-3.5 text-indigo-400" />
                </div>
                <h2 className="font-semibold text-sm tracking-wide text-foreground/90">Trending now</h2>
              </div>
            </div>

            <div className="bg-white/[0.03] flex flex-col divide-y divide-white/[0.05]">
              <TrendItem category="Web Dev" topic="React 19" posts="45.2K" rank={1} hot />
              <TrendItem category="Technology" topic="Nexus Launch" posts="12.5K" rank={2} />
              <TrendItem category="Design" topic="Shadcn UI" posts="8,230" rank={3} />
              <TrendItem category="Gaming" topic="Ark Ascended" posts="22.1K" rank={4} />
            </div>

            <div className="bg-white/[0.03] px-4 py-2.5 border-t border-white/[0.05]">
              <button className="text-xs font-medium text-indigo-400 hover:text-indigo-300 transition-colors duration-150">
                Explore all trends →
              </button>
            </div>
          </div>

          {/* WHO TO FOLLOW CARD */}
          <div className="rounded-2xl overflow-hidden border border-white/8">
            <div className="bg-gradient-to-br from-violet-600/15 via-indigo-500/8 to-transparent px-4 pt-4 pb-3 border-b border-white/6">
              <div className="flex items-center gap-2">
                <div className="p-1.5 rounded-lg bg-violet-500/20 border border-violet-500/30">
                  <Sparkles className="h-3.5 w-3.5 text-violet-400" />
                </div>
                <h2 className="font-semibold text-sm tracking-wide text-foreground/90">Suggested for you</h2>
              </div>
            </div>

            <div className="bg-white/[0.03] flex flex-col divide-y divide-white/[0.05]">
              <SuggestedUser name="Lee Robinson" handle="leerob" avatarUrl="https://github.com/leerob.png" mutuals={3} />
              <SuggestedUser name="Guillermo Rauch" handle="rauchg" avatarUrl="https://github.com/rauchg.png" mutuals={7} />
              <SuggestedUser name="Shadcn" handle="shadcn" avatarUrl="https://github.com/shadcn.png" mutuals={12} />
            </div>

            <div className="bg-white/[0.03] px-4 py-2.5 border-t border-white/[0.05]">
              <button className="text-xs font-medium text-indigo-400 hover:text-indigo-300 transition-colors duration-150">
                View more suggestions →
              </button>
            </div>
          </div>

          {/* FOOTER LINKS */}
          <div className="px-1 flex flex-wrap gap-x-3 gap-y-1.5">
            {['Privacy', 'Terms', 'Cookies', 'About', 'Ads'].map(link => (
              <span key={link} className="text-[11px] text-muted-foreground/50 hover:text-muted-foreground cursor-pointer transition-colors">
                {link}
              </span>
            ))}
            <span className="text-[11px] text-muted-foreground/30 w-full mt-0.5">© 2026 Nexus</span>
          </div>

        </div>
        <ScrollBar orientation="vertical" />
      </ScrollArea>
    </div>
  );
};

// --- Sub-components ---

const TrendItem = ({ category, topic, posts, rank, hot }) => (
  <div className="flex justify-between items-center hover:bg-white/[0.04] transition-colors duration-150 cursor-pointer py-3 px-4 group">
    <div className="flex items-center gap-3 min-w-0">
      <span className="text-[11px] font-mono text-muted-foreground/40 w-4 shrink-0 text-center">{rank}</span>
      <div className="min-w-0">
        <div className="flex items-center gap-1.5">
          <p className="text-[11px] font-medium text-muted-foreground/60 uppercase tracking-wider">{category}</p>
          {hot && <Flame className="h-3 w-3 text-orange-400/80" />}
        </div>
        <p className="font-semibold text-sm text-foreground/90 mt-0.5 truncate">{topic}</p>
        <p className="text-[11px] text-muted-foreground/50 mt-0.5">{posts} posts</p>
      </div>
    </div>
    <Button
      variant="ghost"
      size="icon"
      className="h-7 w-7 text-muted-foreground/30 hover:text-muted-foreground hover:bg-white/5 opacity-0 group-hover:opacity-100 transition-all duration-150 shrink-0"
    >
      <MoreHorizontal className="h-3.5 w-3.5" />
    </Button>
  </div>
);

const SuggestedUser = ({ name, handle, avatarUrl, mutuals }) => (
  <div className="flex items-center justify-between py-3 px-4 hover:bg-white/[0.04] transition-colors duration-150 group">
    <div className="flex items-center gap-3 min-w-0">
      <div className="relative shrink-0">
        <Avatar className="h-9 w-9 ring-1 ring-white/10">
          <AvatarImage src={avatarUrl} />
          <AvatarFallback className="text-xs bg-indigo-500/20 text-indigo-300">{name.charAt(0)}</AvatarFallback>
        </Avatar>
        <span className="absolute bottom-0 right-0 h-2.5 w-2.5 rounded-full bg-emerald-400 ring-2 ring-background" />
      </div>
      <div className="flex flex-col min-w-0">
        <span className="font-semibold text-sm text-foreground/90 truncate group-hover:text-indigo-400 transition-colors duration-150 cursor-pointer">{name}</span>
        <span className="text-[11px] text-muted-foreground/50 truncate">@{handle}</span>
        {mutuals > 0 && (
          <span className="text-[10px] text-muted-foreground/40 mt-0.5">{mutuals} mutual connections</span>
        )}
      </div>
    </div>
    <button className="text-xs font-semibold px-3 py-1.5 rounded-lg bg-indigo-600/20 hover:bg-indigo-600/35 text-indigo-300 border border-indigo-500/25 hover:border-indigo-400/40 transition-all duration-150 shrink-0 ml-2">
      Follow
    </button>
  </div>
);

export default RightSidebar;
