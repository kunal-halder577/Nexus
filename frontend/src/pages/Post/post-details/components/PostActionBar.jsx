import React, { useCallback } from 'react';
import { Heart, MessageSquare, Share2, Bookmark } from 'lucide-react';
import { Button } from '@/components/ui/button';
import {
  TooltipProvider,
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from '@/components/ui/tooltip';
import { useDislikePostMutation, useLikePostMutation } from '@/features/Like/api/likeApi';
import { toast } from 'sonner';

const ActionButton = ({ icon: Icon, label, onClick, active, activeClass, hoverClass, filled }) => (
  <Tooltip>
    <TooltipTrigger asChild>
      <Button
        variant="ghost"
        size="sm"
        onClick={onClick}
        className={`group h-9 px-3 rounded-full gap-2 transition-all duration-200
          ${active ? activeClass : `text-muted-foreground ${hoverClass}`}`}
      >
        <Icon
          className={`w-[18px] h-[18px] transition-transform duration-200
            group-hover:scale-110 ${active && filled ? 'fill-current' : ''}`}
        />
      </Button>
    </TooltipTrigger>
    <TooltipContent side="bottom" className="text-xs rounded-lg">{label}</TooltipContent>
  </Tooltip>
);

const PostActionBar = ({ post, onShareCopied }) => {
  const [likePost]    = useLikePostMutation();
  const [dislikePost] = useDislikePostMutation();

  const handleLike = useCallback(async () => {
    try {
      await likePost(post._id).unwrap();
    } catch (error) {
      toast.error(error?.data?.message ?? "Something went wrong.");
    }
  }, [likePost, post._id]);

  const handleDislike = useCallback(async () => {
    try {
      await dislikePost(post._id).unwrap();
    } catch (error) {
      toast.error(error?.data?.message ?? "Something went wrong.");
    }
  }, [dislikePost, post._id]);

  const handleLikeToggler = useCallback(
    (...args) => (post.isLiked ? handleDislike : handleLike)(...args),
    [post.isLiked, handleLike, handleDislike]
  );

  const handleSave = useCallback(() => {
    const saved = post.hasSaved;
    // updatePost({
    //   id: post._id,
    //   hasSaved: !saved,
    // });
  }, [post]);

  const handleShare = useCallback(async () => {
    const url = window.location.href;
    if (navigator.share) {
      try { 
        await navigator.share({ url }); 
      } catch { 
        /* user cancelled */ 
      }
    } else {
      try {
        await navigator.clipboard.writeText(url);
        onShareCopied?.();
      } catch (error) {
        console.error("Failed to copy link:", error);
      }
    }
  }, [onShareCopied]);

  return (
    <TooltipProvider delayDuration={300}>
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-1">
          <ActionButton
            icon={Heart}
            label={post.isLiked ? 'Unlike' : 'Like'}
            onClick={handleLikeToggler}
            active={post.isLiked}
            activeClass="text-rose-400 bg-rose-500/10 hover:bg-rose-500/20"
            hoverClass="hover:bg-rose-500/10 hover:text-rose-400"
            filled
          />
          <ActionButton
            icon={MessageSquare}
            label="Comment"
            onClick={() => document.getElementById('comment-input')?.focus()}
            active={false}
            hoverClass="hover:bg-indigo-500/10 hover:text-indigo-400"
          />
          <ActionButton
            icon={Share2}
            label="Share"
            onClick={handleShare}
            active={false}
            hoverClass="hover:bg-indigo-500/10 hover:text-indigo-400"
          />
        </div>
        <ActionButton
          icon={Bookmark}
          label={post.hasSaved? "Unsave" : "Save"}
          onClick={handleSave}
          active={post.hasSaved}
          activeClass="text-indigo-400 bg-indigo-500/10 hover:bg-indigo-500/20"
          hoverClass="hover:bg-indigo-500/10 hover:text-indigo-400"
          filled
        />
      </div>
    </TooltipProvider>
  );
};

export default PostActionBar;