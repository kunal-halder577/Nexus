import React from 'react';
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { MessageSquare, Heart, Share2, MoreHorizontal, PlayCircle, BarChart2 } from "lucide-react";
import { useUpdatePostMutation } from '../api/postApi';

const FeedPost = ({ post }) => {
  const [updatePost] = useUpdatePostMutation();

  const handleLike = () => {
    const isCurrentlyLiked = post.hasLiked; 
    const newLikesCount = isCurrentlyLiked ? post.stats.likeCount - 1 : post.stats.likeCount + 1;

    updatePost({
      id: post._id,
      hasLiked: !isCurrentlyLiked,
      stats: {
        ...post.stats,
        likeCount: newLikesCount
      }
    });
  };

  const formatTime = (dateString) => {
    const date = new Date(dateString);
    return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
  };

  return (
    <Card className="mb-6 group/card relative border border-border/40 bg-card/50 hover:bg-muted/30 hover:border-indigo-500/30 rounded-2xl overflow-hidden shadow-sm hover:shadow-md transition-all duration-300">
      
      {/* Hover Accent: Thin indigo line on the left */}
      <div className="absolute left-0 top-0 bottom-0 w-[3px] bg-indigo-500 opacity-0 group-hover/card:opacity-100 transition-opacity z-10" />

      {/* HEADER */}
      <div className="p-4 flex items-center justify-between border-b border-border/40 bg-muted/10">
        <div className="flex items-center gap-3">
          
          <div className="relative">
            <Avatar className="w-10 h-10 border border-border group-hover/card:border-indigo-500/30 transition-colors duration-300">
              <AvatarImage src={post.author?.avatarUrl} alt={post.author?.name} />
              <AvatarFallback className="bg-muted text-xs font-bold text-muted-foreground">
                {post.author?.name?.charAt(0) || 'U'}
              </AvatarFallback>
            </Avatar>
          </div>
          
          <div className="flex flex-col">
            <div className="flex items-center gap-2">
              <span className="font-semibold text-sm text-foreground group-hover/card:text-indigo-600 dark:group-hover/card:text-indigo-400 transition-colors cursor-pointer">
                {post.author?.name}
              </span>
              <span className="px-2 py-0.5 rounded-full bg-indigo-50 dark:bg-indigo-950/30 text-[10px] font-semibold text-indigo-700 dark:text-indigo-400 tracking-wide border border-transparent">
                Author
              </span>
            </div>
            <div className="flex items-center gap-1.5 text-xs text-muted-foreground">
              <span className="hover:text-foreground cursor-pointer transition-colors">@{post.author?.username}</span>
              <span className="w-1 h-1 rounded-full bg-border"></span>
              <span>{formatTime(post.createdAt)}</span>
            </div>
          </div>
        </div>

        <Button variant="ghost" size="icon" className="h-8 w-8 text-muted-foreground hover:text-foreground rounded-full transition-colors">
          <MoreHorizontal className="w-5 h-5" />
        </Button>
      </div>

      {/* CONTENT */}
      <div className="p-4 flex flex-col gap-4">
        {post.content?.caption && (
          <p className="text-foreground/90 text-[15px] leading-relaxed whitespace-pre-wrap pl-1">
            {post.content.caption}
          </p>
        )}

        {/* MEDIA GALLERY */}
        {post.media && post.media.length > 0 && (
          <div className={`grid gap-1.5 rounded-xl overflow-hidden ${
            post.media.length === 1 ? 'grid-cols-1' : 
            post.media.length === 2 ? 'grid-cols-2' : 
            post.media.length >= 3 ? 'grid-cols-2' : ''
          }`}>
            {post.media.slice(0, 4).map((item, index) => (
              <div 
                key={index} 
                className={`relative bg-muted/50 group/media ${
                  post.media.length === 3 && index === 0 ? 'col-span-2 aspect-video' : 'aspect-square sm:aspect-[4/3]'
                }`}
              >
                <img 
                  src={item.type === 'Video' ? item.thumbnailUrl : item.url} 
                  alt="Post media" 
                  className="w-full h-full object-cover"
                />
                
                {item.type === 'Video' && (
                  <div className="absolute inset-0 flex items-center justify-center bg-black/20 group-hover/media:bg-indigo-950/40 transition-colors">
                    <PlayCircle className="w-12 h-12 text-white drop-shadow-md" />
                  </div>
                )}

                {index === 3 && post.media.length > 4 && (
                  <div className="absolute inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center cursor-pointer hover:bg-indigo-950/70 transition-colors">
                    <span className="text-white font-semibold text-xl">
                      +{post.media.length - 4} more
                    </span>
                  </div>
                )}
              </div>
            ))}
          </div>
        )}
      </div>

      {/* FOOTER */}
        <div className="relative px-5 py-3.5 flex items-center justify-between border-t border-indigo-500/10 bg-gradient-to-r from-background via-indigo-950/5 to-background">
        
        {/* Action Bar */}
        <div className="flex items-center gap-2 sm:gap-3">
            
            {/* Like */}
            <Button 
            variant="ghost" 
            size="sm" 
            onClick={handleLike}
            className={`group h-8 px-3 rounded-full transition-all duration-300 ${
                post.hasLiked 
                ? 'text-rose-400 bg-rose-500/10 shadow-[0_0_12px_rgba(244,63,94,0.15)]' 
                : 'text-muted-foreground hover:bg-rose-500/10 hover:text-rose-400'
            }`}
            >
            <Heart className={`w-[16px] h-[16px] mr-2 transition-all duration-300 group-hover:scale-110 ${post.hasLiked ? 'fill-current drop-shadow-[0_0_8px_rgba(244,63,94,0.5)]' : ''}`} />
            <span className="text-[13px] font-semibold tracking-wide">{post.stats?.likeCount || 0}</span>
            </Button>

            {/* Comment */}
            <Button 
            variant="ghost" 
            size="sm" 
            className="group h-8 px-3 rounded-full bg-transparent hover:bg-indigo-500/10 text-muted-foreground hover:text-indigo-400 transition-all duration-300"
            >
            <MessageSquare className="w-[16px] h-[16px] mr-2 transition-all duration-300 group-hover:scale-110" />
            <span className="text-[13px] font-semibold tracking-wide">{post.stats?.commentCount || 0}</span>
            </Button>

            {/* Share */}
            <Button 
            variant="ghost" 
            size="icon" 
            className="group h-8 w-8 rounded-full bg-transparent hover:bg-indigo-500/10 text-muted-foreground hover:text-indigo-400 transition-all duration-300"
            >
            <Share2 className="w-[16px] h-[16px] transition-all duration-300 group-hover:scale-110" />
            </Button>
        </div>

        {/* Informational Metric - Data Readout */}
        <div className="flex items-center gap-2 px-3 py-1.5 rounded-md bg-muted/20 border border-muted/30 text-muted-foreground/70 cursor-default hover:text-indigo-400 hover:border-indigo-500/30 hover:bg-indigo-500/5 transition-all duration-300">
            {/* Pulsing Status Dot */}
            <div className="w-1.5 h-1.5 rounded-full bg-indigo-500/60 animate-pulse shadow-[0_0_6px_rgba(99,102,241,0.6)]" />
            <span className="text-[11px] font-mono font-medium tracking-widest uppercase">
            {post.stats?.viewCount || 0} Views
            </span>
        </div>
        
        </div>
    </Card>
  );
};

export default FeedPost;