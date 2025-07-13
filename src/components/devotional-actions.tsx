
"use client";

import { ShareButton } from "@/components/sharing/share-button";
import { Button } from "@/components/ui/button";
import { useToast } from "@/hooks/use-toast";
import type { DevotionalContent } from "@/types";
import { Bookmark, Heart, Loader2 } from "lucide-react";
import { useFavorites } from "@/hooks/use-favorites";
import { useRouter } from "next/navigation";

interface DevotionalActionsProps {
  devotional: DevotionalContent;
}

export const DevotionalActions = ({ devotional }: DevotionalActionsProps) => {
  const { toast } = useToast();
  const router = useRouter();
  const { isFavorite, toggleFavorite, isLoaded: favoritesLoaded } = useFavorites();
  
  const devotionalUrl = typeof window !== 'undefined' ? `${window.location.origin}/daily-devotional?verse=${devotional.verse.id}` : '';
  const isCurrentlyFavorite = isFavorite(devotional.verse.id);

  const handleFavoriteClick = async () => {
    if (!favoritesLoaded) return;
    await toggleFavorite(devotional.verse.id, 'devotional');
    toast({
      title: isCurrentlyFavorite ? "Removed from Favorites" : "Added to Favorites!",
      description: `"${devotional.verse.reference}" has been ${isCurrentlyFavorite ? 'removed from' : 'added to'} your favorites.`,
    });
  };

  const handleAddToJournal = () => {
    // This assumes the journal component is on the same page, or navigates the user there
    // If it's on a different page, router.push is better.
    // For now, let's assume it's on the same page and the user just needs to scroll.
    const journalSection = document.getElementById('daily-journal-card');
    if (journalSection) {
        journalSection.scrollIntoView({ behavior: 'smooth' });
        toast({
            title: "Journal Ready",
            description: "Scroll down to write your thoughts for this devotional.",
        });
    } else {
        // Fallback if the element isn't found (e.g., on a different page)
        router.push('/daily-devotional');
        toast({
            title: "Journal Ready",
            description: "Find the journal section on the Daily Devotional page to write your thoughts.",
        });
    }
  };

  return (
    <div className="flex justify-end items-center space-x-2">
      <Button variant="ghost" size="icon" onClick={handleAddToJournal} title="Add to Journal">
        <Bookmark className="h-5 w-5" />
        <span className="sr-only">Add to Journal</span>
      </Button>
      <Button variant="ghost" size="icon" onClick={handleFavoriteClick} title={isCurrentlyFavorite ? "Remove from Favorites" : "Add to Favorites"} disabled={!favoritesLoaded}>
        {!favoritesLoaded ? (
          <Loader2 className="h-5 w-5 animate-spin"/>
        ) : (
          <Heart className={`h-5 w-5 transition-colors ${isCurrentlyFavorite ? 'text-red-500 fill-current' : 'text-foreground'}`} />
        )}
        <span className="sr-only">Favorite</span>
      </Button>
      <ShareButton
        url={devotionalUrl}
        title={`Daily Devotional: ${devotional.verse.reference}`}
        text={devotional.message}
        hashtag="DailyGraceApp"
      />
    </div>
  );
};
