// src/components/reflection-card.tsx
"use client";

import { Card, CardContent, CardFooter } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { ThumbsUp } from "lucide-react";
import type { VerseReflection } from "@/types";
import { formatDistanceToNow } from "date-fns";
import { cn } from "@/lib/utils";

interface ReflectionCardProps {
  reflection: VerseReflection;
  currentUserId: string | undefined;
  onUpvote: (reflectionId: string) => void;
}

export function ReflectionCard({ reflection, currentUserId, onUpvote }: ReflectionCardProps) {
  const hasUpvoted = currentUserId ? reflection.upvotedBy.includes(currentUserId) : false;
  
  const getInitials = (name: string) => {
    const parts = name.split(' ');
    if (parts.length > 1) {
      return (parts[0][0] + parts[parts.length - 1][0]).toUpperCase();
    }
    return name.substring(0, 2).toUpperCase();
  };

  return (
    <Card className="bg-muted/30">
      <CardContent className="p-4">
        <div className="flex items-start gap-3">
          <Avatar className="h-8 w-8">
            <AvatarFallback>{getInitials(reflection.authorName)}</AvatarFallback>
          </Avatar>
          <div className="flex-1">
            <div className="flex items-center justify-between">
              <p className="font-semibold text-sm">{reflection.authorName}</p>
              <p className="text-xs text-muted-foreground">
                {reflection.createdAt ? formatDistanceToNow(reflection.createdAt.toDate(), { addSuffix: true }) : ''}
              </p>
            </div>
            <p className="text-sm text-foreground/80 mt-1 whitespace-pre-line">{reflection.text}</p>
          </div>
        </div>
      </CardContent>
      <CardFooter className="p-4 pt-0">
        <Button 
          variant={hasUpvoted ? "secondary" : "ghost"} 
          size="sm"
          className="flex items-center gap-1.5"
          onClick={() => onUpvote(reflection.id)}
          disabled={!currentUserId}
        >
          <ThumbsUp className={cn("h-4 w-4", hasUpvoted && "text-primary")} />
          <span>Amen ({reflection.upvotes})</span>
        </Button>
      </CardFooter>
    </Card>
  );
}
