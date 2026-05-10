import { Badge } from '@/components/ui/badge';
import {Heart, Image, Maximize2, Play } from 'lucide-react';

const MediaSection = () => {
  const mediaItems = [
    { id: 1, type: 'video', duration: '0:45', title: 'Nexus Release V2', likes: '1.2k', color: 'bg-indigo-500' },
    { id: 2, type: 'image', title: 'Dashboard Concepts', likes: '856', color: 'bg-slate-500' },
    { id: 3, type: 'video', duration: '2:30', title: 'Animation Guide', likes: '2.4k', color: 'bg-emerald-500' },
  ];

  return (
    <section>
      <div className="flex items-center justify-between mb-4">
        <h3 className="text-xs font-bold uppercase tracking-wider text-muted-foreground">Media Gallery</h3>
        <select className="bg-transparent text-xs text-indigo-600 font-semibold border-none outline-none cursor-pointer text-right">
          <option>Recent</option>
          <option>Popular</option>
        </select>
      </div>

      <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
        {mediaItems.map((item) => (
          <div 
            key={item.id} 
            className="group relative rounded-xl bg-muted overflow-hidden cursor-pointer aspect-square shadow-sm hover:shadow-lg transition-all duration-500"
          >
            {/* 1. Background Placeholder (Simulating an Image) */}
            {/* Note: In production, replace this div with an <img /> tag and object-cover */}
            <div className={`w-full h-full ${item.color}/10 group-hover:scale-110 transition-transform duration-700 ease-out`} >
               <div className="w-full h-full bg-slate-200 dark:bg-slate-800" /> 
            </div>

            {/* 2. Gradient Overlay: Only visible on hover to reveal text clearly */}
            <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/20 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300" />

            {/* 3. Center Action Button (Play or Expand) */}
            <div className="absolute inset-0 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity duration-300 z-20">
               <div className="bg-white/10 backdrop-blur-md border border-white/20 rounded-full p-3 shadow-2xl transform scale-90 group-hover:scale-100 transition-transform duration-300 hover:bg-white/20">
                 {item.type === 'video' ? (
                   <Play className="text-white fill-white ml-0.5" size={20} />
                 ) : (
                   <Maximize2 className="text-white" size={20} />
                 )}
               </div>
            </div>

            {/* 4. Top Right: File Type Badge */}
            <div className="absolute top-2 right-2 z-20 opacity-0 group-hover:opacity-100 transition-opacity duration-300">
               <Badge className="bg-black/50 backdrop-blur-sm border-white/10 hover:bg-black/60 h-6 w-6 p-0 flex items-center justify-center rounded-full">
                  {item.type === 'video' ? <Play size={10} className="fill-white" /> : <Image size={10} />}
               </Badge>
            </div>

            {/* 5. Bottom Info Bar */}
            <div className="absolute bottom-0 left-0 right-0 p-3 translate-y-2 group-hover:translate-y-0 transition-transform duration-300 z-20">
              
              {/* Title (Reveals on Hover) */}
              <p className="text-white text-sm font-semibold truncate opacity-0 group-hover:opacity-100 transition-opacity duration-300 delay-75 mb-1">
                {item.title}
              </p>

              <div className="flex items-center justify-between">
                {/* Duration / Type */}
                {item.type === 'video' ? (
                  <Badge className="bg-black/40 backdrop-blur-md text-[10px] text-white/90 border-white/10 px-2 h-5 font-normal">
                    {item.duration}
                  </Badge>
                ) : (
                  <Badge className="bg-black/40 backdrop-blur-md text-[10px] text-white/90 border-white/10 px-2 h-5 font-normal">
                    JPG
                  </Badge>
                )}

                {/* Like Count */}
                <div className="flex items-center gap-1 text-white/80 text-[10px] font-medium opacity-0 group-hover:opacity-100 transition-opacity duration-300">
                  <Heart size={10} className="fill-white/50" /> {item.likes}
                </div>
              </div>
            </div>
          </div>
        ))}
      </div>
    </section>
  );
};

export default MediaSection;