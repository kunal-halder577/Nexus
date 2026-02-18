import React, { useEffect, useState } from 'react';
import { Search, Mic, SlidersHorizontal, Grid, Image as ImageIcon, FileText, Users, Loader2 } from 'lucide-react';
import { Input } from '@/components/ui/input'; // 1. Import Shadcn Input

// Importing your modular components
import PeopleSection from './People';
import PostsSection from './PostSection';
import MediaSection from './Media';
import { useLazySearchUsersQuery, useSearchUsersQuery } from '@/features/user/api/userApi';
import { useSearchParams } from 'react-router-dom';

const NexusSearch = () => {
  const [searchParams, setSearchParams] = useSearchParams();
  const initialQuery = searchParams.get('q') || "";

  const [activeTab, setActiveTab] = useState('All');
  const [searchTerm, setSearchTerm] = useState(initialQuery);

  // 2. Fetch Data (Assuming response structure is { data: User[] })
  const [triggerSearch, {data, isLoading, isFetching}] = useLazySearchUsersQuery();

  useEffect(() => {
    if(initialQuery && initialQuery.trim().length >= 3) {
      triggerSearch({
        username: initialQuery,
        email: initialQuery,
      });
    }
  }, [initialQuery, triggerSearch]);

  const handleSearch = () => {
    if (searchTerm.trim().length < 3) return;

    setSearchParams({ q: searchTerm });

    triggerSearch({
      username: searchTerm,
      email: searchTerm,
    });
  };

  const handleKeyDown = (e) => {
    if (e.key === 'Enter') {
      handleSearch();
    }
  };

  const rawData = data?.data;
  
  const users = Array.isArray(rawData)
    ? rawData :
    (rawData? [rawData] : []);
  
  const isSearching = isLoading || isFetching;

  const tabs = [
    { name: 'All', icon: Grid },
    { name: 'People', icon: Users },
    { name: 'Posts', icon: FileText },
    { name: 'Media', icon: ImageIcon }
  ];

  // Logic to render specific content based on the active tab
  const renderContent = () => {
    switch (activeTab) {
      case 'People':
        return (
          <div className="animate-in fade-in slide-in-from-bottom-4 duration-500">
            {/* 3. Pass Data & Loading State to Child */}
            <PeopleSection users={users} isLoading={isSearching} />
          </div>
        );
      case 'Posts':
        return (
          <div className="animate-in fade-in slide-in-from-bottom-4 duration-500">
            <PostsSection />
          </div>
        );
      case 'Media':
        return (
          <div className="animate-in fade-in slide-in-from-bottom-4 duration-500">
            <MediaSection />
          </div>
        );
      case 'All':
      default:
        return (
          <div className="space-y-10 animate-in fade-in slide-in-from-bottom-2 duration-700">
            {/* Pass Data here too for the "All" view */}
            <PeopleSection users={users} isLoading={isSearching} />
            
            <div className="w-full h-px bg-gradient-to-r from-transparent via-border/60 to-transparent" />
            <PostsSection />
            <div className="w-full h-px bg-gradient-to-r from-transparent via-border/60 to-transparent" />
            <MediaSection />
          </div>
        );
    }
  };

  return (
    <div className="min-h-screen bg-background text-foreground pb-20 font-sans selection:bg-indigo-500/30">
      <div className="container max-w-4xl mx-auto px-4">
        
        {/* Sticky Header & Search */}
        <header className="sticky top-0 z-50 bg-background/95 backdrop-blur-xl border-b border-border/40 pt-6 transition-all">
          <div className="relative flex items-center group mb-1">
            
            {/* Search Icon (or Loading Spinner) */}
            <button 
              onClick={handleSearch}
              className="absolute left-4 z-10 text-muted-foreground hover:text-indigo-600 transition-colors duration-300 outline-none focus:text-indigo-600 cursor-pointer"
              disabled={isSearching}
            >
              {isSearching ? (
                <Loader2 className="animate-spin" size={20} />
              ) : (
                <Search size={20} />
              )}
            </button>

            {/* 6. Update Input to listen for KeyDown */}
            <Input 
              type="text"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              onKeyDown={handleKeyDown}
              placeholder="Search users (Press Enter)..."
              className="w-full bg-muted/40 border-border/60 rounded-xl py-6 pl-12 pr-24 text-base shadow-sm focus-visible:ring-2 focus-visible:ring-indigo-500/20 focus-visible:border-indigo-500 focus-visible:bg-background transition-all"
            />

            <div className="absolute right-4 flex gap-3 text-muted-foreground z-10">
              <Mic size={18} className="hover:text-indigo-600 cursor-pointer transition-colors" />
              <div className="w-[1px] h-4 bg-border/60 self-center" />
              <SlidersHorizontal size={18} className="hover:text-indigo-600 cursor-pointer transition-colors" />
            </div>
          </div>

          {/* Scrollable Navigation Tabs */}
          <nav className="flex items-center gap-1 overflow-x-auto no-scrollbar -mx-4 px-4 sm:mx-0 sm:px-0">
            {tabs.map((tab) => (
              <button
                key={tab.name}
                onClick={() => setActiveTab(tab.name)}
                className={`flex items-center gap-2 px-4 py-4 text-sm font-medium transition-all relative whitespace-nowrap cursor-pointer select-none ${
                  activeTab === tab.name 
                    ? 'text-indigo-600' 
                    : 'text-muted-foreground hover:text-foreground/80'
                }`}
              >
                <tab.icon size={16} className={activeTab === tab.name ? "stroke-[2.5px]" : "stroke-2"} />
                {tab.name}
                
                {activeTab === tab.name && (
                  <span className="absolute bottom-0 left-0 w-full h-[2px] bg-indigo-600 shadow-[0_-2px_10px_rgba(79,70,229,0.4)] rounded-t-full animate-in fade-in zoom-in-x duration-300" />
                )}
              </button>
            ))}
          </nav>
        </header>

        {/* Dynamic Main Content */}
        <main className="mt-8 min-h-[500px]">
          {renderContent()}
        </main>
      </div>
    </div>
  );
};

export default NexusSearch;