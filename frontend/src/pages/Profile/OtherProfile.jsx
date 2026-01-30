import React from 'react';
import { 
  Bell, 
  MessageSquare, 
  UserPlus, 
  MoreHorizontal, 
  MapPin, 
  Link as LinkIcon, 
  Calendar 
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Card, CardContent } from "@/components/ui/card";
import { Separator } from "@/components/ui/separator";

const NexusUserProfile = () => {
    
  return (
    <div className="min-h-screen bg-background text-foreground">
      {/* Hero / Header Section */}
      <div className="relative h-48 md:h-64 bg-muted">
        <img 
          src="https://images.unsplash.com/photo-1618005182384-a83a8bd57fbe?auto=format&fit=crop&q=80&w=2000" 
          alt="Cover" 
          className="w-full h-full object-cover"
        />
        <div className="absolute -bottom-16 left-4 md:left-8">
          <Avatar className="h-32 w-32 md:h-40 md:w-40 border-4 border-background shadow-xl">
            <AvatarImage src="https://github.com/shadcn.png" />
            <AvatarFallback>JD</AvatarFallback>
          </Avatar>
        </div>
      </div>

      {/* Profile Actions & Info */}
      <div className="pt-20 px-4 md:px-8 max-w-6xl mx-auto">
        <div className="flex flex-col md:flex-row md:items-end justify-between gap-4">
          <div>
            <div className="flex items-center gap-2">
              <h1 className="text-3xl font-bold tracking-tight">Jordan Nexus</h1>
              <Badge variant="secondary" className="bg-primary/10 text-primary border-primary/20">Premium</Badge>
            </div>
            <p className="text-muted-foreground mt-1">@jordan_nexus</p>
          </div>
          
          <div className="flex gap-2 items-center">
            <Button size="icon" variant="outline" className="rounded-full">
              <Bell className="h-4 w-4" />
            </Button>
            <Button variant="outline" className="gap-2">
              <MessageSquare className="h-4 w-4" /> Message
            </Button>
            <Button className="gap-2 bg-primary text-primary-foreground">
              <UserPlus className="h-4 w-4" /> Follow
            </Button>
            <Button size="icon" variant="ghost">
              <MoreHorizontal className="h-4 w-4" />
            </Button>
          </div>
        </div>

        {/* Bio & Metadata */}
        <div className="mt-6 max-w-2xl">
          <p className="text-sm md:text-base leading-relaxed">
            Digital Architect and Creator. Exploring the intersection of design, AI, and social connectivity. Always building the next big thing at Nexus. 🚀
          </p>
          
          <div className="flex flex-wrap gap-4 mt-4 text-sm text-muted-foreground">
            <div className="flex items-center gap-1">
              <MapPin className="h-4 w-4" /> San Francisco, CA
            </div>
            <div className="flex items-center gap-1">
              <LinkIcon className="h-4 w-4" />
              <a href="#" className="text-primary hover:underline">nexus.app/jordan</a>
            </div>
            <div className="flex items-center gap-1">
              <Calendar className="h-4 w-4" /> Joined January 2024
            </div>
          </div>

          <div className="flex gap-6 mt-6">
            <div className="flex gap-1 items-center">
              <span className="font-bold text-foreground">1.2k</span>
              <span className="text-muted-foreground text-sm">Following</span>
            </div>
            <div className="flex gap-1 items-center">
              <span className="font-bold text-foreground">45.8k</span>
              <span className="text-muted-foreground text-sm">Followers</span>
            </div>
          </div>
        </div>

        <Separator className="my-8" />

        {/* Content Tabs */}
        <Tabs defaultValue="posts" className="w-full pb-12">
          <TabsList className="grid w-full max-w-md grid-cols-3 bg-muted/50">
            <TabsTrigger value="posts">Posts</TabsTrigger>
            <TabsTrigger value="media">Media</TabsTrigger>
            <TabsTrigger value="likes">Likes</TabsTrigger>
          </TabsList>
          
          <TabsContent value="posts" className="mt-6">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {[1, 2, 3, 4].map((i) => (
                <Card key={i} className="bg-card/50 backdrop-blur-sm border-muted">
                  <CardContent className="p-4">
                    <div className="h-32 rounded-md bg-muted animate-pulse mb-3" />
                    <div className="space-y-2">
                      <div className="h-4 w-3/4 bg-muted rounded" />
                      <div className="h-4 w-1/2 bg-muted rounded" />
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          </TabsContent>

          <TabsContent value="media" className="mt-6">
            <div className="grid grid-cols-3 gap-2">
              {[1, 2, 3, 4, 5, 6].map((i) => (
                <div key={i} className="aspect-square bg-muted rounded-lg overflow-hidden border border-border">
                  <div className="w-full h-full bg-gradient-to-br from-primary/10 to-muted flex items-center justify-center">
                    <span className="text-xs text-muted-foreground">Premium Content</span>
                  </div>
                </div>
              ))}
            </div>
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
};

export default NexusUserProfile;