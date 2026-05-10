import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Heart, MessageCircle, MoreHorizontal } from 'lucide-react';

const PostsSection = () => {
  const posts = [
    {
      id: 1,
      author: "Alex Rivera",
      handle: "@arivera",
      time: "2h",
      content: "Building the next generation of modular interfaces. Focusing on accessibility and speed. The new Slate theme is looking 🔥",
      tags: ["#DesignSystem", "#Nexus"],
      likes: 24,
      comments: 5
    },
    {
      id: 2,
      author: "Sarah Chen",
      handle: "@schen_dev",
      time: "5h",
      content: "Does anyone have the docs for the V2 API? I'm hitting a 403 on the user endpoints.",
      tags: ["#Help", "#Engineering"],
      likes: 12,
      comments: 8
    }
  ];

  return (
    <section>
      <div className="flex items-center justify-between mb-4">
        <h3 className="text-xs font-bold uppercase tracking-wider text-muted-foreground">
          Top Discussions
        </h3>
        {/* Added a subtle filter option for posts specifically */}
        <select className="bg-transparent text-xs text-indigo-600 font-semibold border-none outline-none cursor-pointer text-right">
          <option>Latest</option>
          <option>Top Rated</option>
        </select>
      </div>

      <div className="space-y-4">
        {posts.map((post) => (
          <Card
            key={post.id} 
            className="group relative p-5 border-border/40 bg-card/50 hover:bg-muted/30 hover:border-indigo-500/30 transition-all duration-300 cursor-pointer shadow-sm hover:shadow-md overflow-hidden"
          >
            {/* Hover Accent: A thin indigo line appears on the left on hover */}
            <div className="absolute left-0 top-0 bottom-0 w-[3px] bg-indigo-500 opacity-0 group-hover:opacity-100 transition-opacity" />

            <div className="flex justify-between items-start mb-3">
              <div className="flex gap-3">
                {/* Avatar with subtle ring to match PeopleSection */}
                <div className="relative">
                  <Avatar className="h-9 w-9 border border-border">
                    <AvatarFallback className="bg-muted text-xs font-bold text-muted-foreground">
                      {post.author.charAt(0)}
                    </AvatarFallback>
                  </Avatar>
                </div>
                
                <div>
                  <div className="flex items-center gap-2">
                    <p className="text-sm font-semibold text-foreground group-hover:text-indigo-600 transition-colors">
                      {post.author}
                    </p>
                    <span className="text-[10px] text-muted-foreground">• {post.time}</span>
                  </div>
                  <p className="text-xs text-muted-foreground">{post.handle}</p>
                </div>
              </div>

              {/* More Actions Menu */}
              <Button variant="ghost" size="icon" className="h-6 w-6 -mr-2 text-muted-foreground hover:text-foreground">
                <MoreHorizontal size={14} />
              </Button>
            </div>

            {/* Content */}
            <p className="text-sm text-foreground/90 leading-relaxed mb-4 pl-1">
              {post.content}
            </p>

            {/* Tags & Metrics Footer */}
            <div className="flex items-center justify-between mt-4 pl-1">
              <div className="flex gap-2">
                {post.tags.map(tag => (
                  <Badge
                    key={tag} 
                    variant="secondary" 
                    className="text-[10px] font-medium px-2 py-0.5 h-5 bg-indigo-50 text-indigo-700 dark:bg-indigo-950/30 dark:text-indigo-400 border border-transparent hover:border-indigo-200"
                  >
                    {tag}
                  </Badge>
                ))}
              </div>

              {/* Engagement Stats - Only visible/highlighted on hover to reduce clutter */}
              <div className="flex items-center gap-4 text-muted-foreground/60 text-xs">
                <div className="flex items-center gap-1 hover:text-rose-500 transition-colors">
                  <Heart size={14} className="group-hover:stroke-rose-500 transition-colors" />
                  <span>{post.likes}</span>
                </div>
                <div className="flex items-center gap-1 hover:text-indigo-500 transition-colors">
                  <MessageCircle size={14} className="group-hover:stroke-indigo-500 transition-colors" />
                  <span>{post.comments}</span>
                </div>
              </div>
            </div>
          </Card>
        ))}
      </div>
    </section>
  );
};

export default PostsSection;