import React from 'react';
import { Avatar, AvatarImage, AvatarFallback } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { useNavigate } from 'react-router-dom';

const PeopleSection = ({ users = [], isLoading = false }) => {
  const navigate = useNavigate();

  const handleClick = (id) => {
    if(id) {
      navigate(`/profile/users/${id}`);
    }
    return;
  }

  // 1. Loading State: Render Skeletons
  if (isLoading) {
    return (
      <section>
        {/* Header Skeleton */}
        <div className="flex items-center justify-between mb-2 px-1">
          <Skeleton className="h-4 w-40 bg-muted/50" />
          <Skeleton className="h-4 w-12 bg-muted/50" />
        </div>
        
        {/* Horizontal Scroll Skeletons */}
        <div className="flex gap-5 overflow-x-auto py-3 px-2 no-scrollbar">
          {[1, 2, 3, 4, 5, 6].map((i) => (
            <div key={i} className="flex flex-col items-center gap-3 min-w-[76px]">
              <div className="relative p-[3px]">
                <Skeleton className="h-14 w-14 rounded-full bg-muted/50" />
              </div>
              <div className="flex flex-col gap-1 items-center w-full">
                <Skeleton className="h-3 w-16 bg-muted/50" />
                <Skeleton className="h-2 w-10 bg-muted/50" />
              </div>
            </div>
          ))}
        </div>
      </section>
    );
  }

  // 2. Empty State: Hide section if no users found
  if (!isLoading && users.length === 0) {
    return null; 
  }

  // 3. Real Data State
  return (
    <section>
      <div className="flex items-center justify-between mb-2 px-1">
        <h3 className="text-xs font-bold uppercase tracking-wider text-muted-foreground">
          Suggested Connections
        </h3>
        <Button variant="link" className="text-indigo-600 h-auto p-0 text-xs font-semibold hover:no-underline">
          View all
        </Button>
      </div>

      <div className="flex gap-5 overflow-x-auto py-3 px-2 no-scrollbar">
        {users.map((user) => (
          <div key={user._id || user.id} className="flex flex-col items-center gap-3 min-w-[76px] group cursor-pointer">
            
            <div className="relative">
              {/* Active/Premium Gradient Ring */}
              <div 
                className={`absolute -inset-[1.5px] rounded-full bg-gradient-to-tr from-indigo-500 to-slate-400 
                ${user.isOnline ? 'opacity-100' : 'opacity-0 group-hover:opacity-100'} 
                transition-opacity duration-300`} 
              />
              
              {/* The "Gap" */}
              <div className="relative bg-background rounded-full p-[3px]">
                <Avatar 
                  className="h-14 w-14 transition-transform duration-300 group-hover:scale-95"
                  onClick={() => handleClick(user?._id || "")}
                >
                  <AvatarImage src={user.avatarUrl} alt={user.username} objectFit="cover" />
                  <AvatarFallback className="bg-muted text-foreground/80 text-xs font-medium border border-border/50 uppercase">
                    {user.username?.substring(0, 2) || "U"}
                  </AvatarFallback>
                </Avatar>
              </div>

              {/* Status Dot (Only if your API returns an 'isOnline' field) */}
              {user.isOnline && (
                <span className="absolute bottom-1 right-1 w-3 h-3 bg-emerald-500 border-2 border-background rounded-full z-10 shadow-sm" />
              )}
            </div>

            <div className="flex flex-col items-center gap-0.5">
              <span className="text-[11px] font-semibold truncate w-20 text-center text-foreground/80 group-hover:text-indigo-600 transition-colors">
                {user.fullName || user.username}
              </span>
              <span className="text-[9px] text-muted-foreground">
                {user.bio ? "Member" : "New"}
              </span>
            </div>
          </div>
        ))}
      </div>
    </section>
  );
};

export default PeopleSection;