import React from 'react';
import { Link } from 'react-router-dom';
import { MoreHorizontal } from 'lucide-react';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
  DropdownMenuSeparator,
} from '@/components/ui/dropdown-menu';

const formatRelativeTime = (dateString) => {
  if (!dateString) return null;
  const diff = Date.now() - new Date(dateString).getTime();
  const mins = Math.floor(diff / 60000);
  if (mins < 1) return 'just now';
  if (mins < 60) return `${mins}m ago`;
  const hrs = Math.floor(mins / 60);
  if (hrs < 24) return `${hrs}h ago`;
  const days = Math.floor(hrs / 24);
  if (days < 7) return `${days}d ago`;
  return new Date(dateString).toLocaleDateString(undefined, { month: 'short', day: 'numeric' });
};

const PostAuthorHeader = ({ post }) => {
  const author = post.author;
  const relativeTime = formatRelativeTime(post.createdAt);

  return (
    <div className="flex items-center justify-between">
      <Link
        to={`/profile/users/${author?._id}`}
        className="flex items-center gap-3 group"
      >
        <Avatar className="w-11 h-11 border border-border/60 group-hover:border-indigo-500/40 transition-colors duration-200">
          <AvatarImage src={author?.avatarUrl} alt={author?.name} />
          <AvatarFallback className="bg-muted font-bold text-sm">
            {author?.name?.charAt(0) ?? 'U'}
          </AvatarFallback>
        </Avatar>

        <div className="flex flex-col min-w-0">
          <div className="flex items-center gap-2">
            <span className="font-semibold text-[15px] text-foreground
              group-hover:text-indigo-500 dark:group-hover:text-indigo-400
              transition-colors leading-tight truncate">
              {author?.name}
            </span>
            <Badge
              variant="secondary"
              className="text-[9px] px-1.5 py-0 h-4 font-semibold
                bg-indigo-500/10 text-indigo-500 dark:text-indigo-400
                border-0 leading-none shrink-0"
            >
              Author
            </Badge>
          </div>
          <div className="flex items-center gap-1.5 text-[13px] text-muted-foreground leading-tight">
            <span>@{author?.username}</span>
            {relativeTime && (
              <>
                <span className="opacity-40">·</span>
                <time dateTime={post.createdAt} className="shrink-0">{relativeTime}</time>
              </>
            )}
          </div>
        </div>
      </Link>

      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          <Button
            variant="ghost"
            size="icon"
            className="h-8 w-8 rounded-full text-muted-foreground hover:text-foreground"
          >
            <MoreHorizontal className="w-4 h-4" />
          </Button>
        </DropdownMenuTrigger>
        <DropdownMenuContent align="end" className="w-44 rounded-xl">
          <DropdownMenuItem className="cursor-pointer text-sm">Copy link</DropdownMenuItem>
          <DropdownMenuItem className="cursor-pointer text-sm">Share post</DropdownMenuItem>
          <DropdownMenuSeparator />
          <DropdownMenuItem className="cursor-pointer text-sm text-destructive focus:text-destructive">
            Report post
          </DropdownMenuItem>
        </DropdownMenuContent>
      </DropdownMenu>
    </div>
  );
};

export default PostAuthorHeader;