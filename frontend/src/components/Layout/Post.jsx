import { Heart, MessageCircle, Repeat2, Share } from "lucide-react";
import { Avatar, AvatarFallback } from "../ui/avatar.jsx";

const PostItem = ({ name, username, time, content, likes, comments, reposts }) => (
  <article className="p-4 border-b border-border hover:bg-accent/50 transition-colors cursor-pointer">
    <div className="flex gap-4">
      <Avatar className="w-10 h-10">
        <AvatarFallback>{name.charAt(0)}</AvatarFallback>
      </Avatar>
      
      <div className="flex-1 min-w-0">
        <div className="flex items-center gap-2 mb-1">
          <span className="font-bold truncate">{name}</span>
          <span className="text-muted-foreground truncate">{username}</span>
          <span className="text-muted-foreground">·</span>
          <span className="text-muted-foreground">{time}</span>
        </div>
        
        <p className="text-foreground text-[15px] leading-relaxed mb-3">
          {content}
        </p>

        {/* Action Buttons */}
        <div className="flex justify-between text-muted-foreground max-w-md">
          <button className="flex items-center gap-2 hover:text-blue-500 transition-colors group">
            <div className="p-2 rounded-full group-hover:bg-blue-500/10">
              <MessageCircle className="h-[18px] w-[18px]" />
            </div>
            <span className="text-sm">{comments}</span>
          </button>
          
          <button className="flex items-center gap-2 hover:text-green-500 transition-colors group">
            <div className="p-2 rounded-full group-hover:bg-green-500/10">
              <Repeat2 className="h-[18px] w-[18px]" />
            </div>
            <span className="text-sm">{reposts}</span>
          </button>
          
          <button className="flex items-center gap-2 hover:text-red-500 transition-colors group">
            <div className="p-2 rounded-full group-hover:bg-red-500/10">
              <Heart className="h-[18px] w-[18px]" />
            </div>
            <span className="text-sm">{likes}</span>
          </button>

          <button className="flex items-center gap-2 hover:text-blue-500 transition-colors group">
            <div className="p-2 rounded-full group-hover:bg-blue-500/10">
              <Share className="h-[18px] w-[18px]" />
            </div>
          </button>
        </div>
      </div>
    </div>
  </article>
);

export default PostItem;