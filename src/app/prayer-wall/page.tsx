
"use client";

import { useState, useEffect, useCallback } from "react";
import { useAuth } from "@/contexts/auth-context"; // Import useAuth
import {
  addPrayerToWall,
  getRecentPrayers,
  incrementPrayedForCount,
} from "@/services/anonymous-prayer.service";
import type { PrayerWallItem } from "@/types/anonymous-prayer";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Textarea } from "@/components/ui/textarea";
import { Switch } from "@/components/ui/switch";
import { Label } from "@/components/ui/label";
import { useToast } from "@/hooks/use-toast";
import { Loader2, Send, HeartHandshake, UserCircle } from "lucide-react";
import { formatDistanceToNow } from "date-fns";

export default function AnonymousPrayerWallPage() {
  const { user } = useAuth(); // Get authenticated user
  const { toast } = useToast();

  const [prayers, setPrayers] = useState<PrayerWallItem[]>([]);
  const [newPrayerText, setNewPrayerText] = useState("");
  const [postAnonymously, setPostAnonymously] = useState(true);
  const [isLoading, setIsLoading] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [prayedForIds, setPrayedForIds] = useState<Set<string>>(new Set());

  const fetchPrayers = useCallback(async () => {
    setIsLoading(true);
    try {
      const recentPrayers = await getRecentPrayers();
      setPrayers(recentPrayers);
    } catch (error) {
      console.error("Failed to fetch prayers:", error);
      toast({
        title: "Error",
        description: "Could not load the prayer wall.",
        variant: "destructive",
      });
    }
    setIsLoading(false);
  }, [toast]);

  useEffect(() => {
    fetchPrayers();
  }, [fetchPrayers]);

  const handleSubmitPrayer = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newPrayerText.trim()) return;

    setIsSubmitting(true);
    try {
      // If user is not logged in, it's always anonymous
      const isAnonymous = !user || postAnonymously;
      await addPrayerToWall(newPrayerText, isAnonymous, user);

      setNewPrayerText("");
      toast({
        title: "Prayer Submitted",
        description: "Your prayer has been added to the wall.",
      });
      fetchPrayers(); // Refresh the list
    } catch (error) {
      console.error("Failed to submit prayer:", error);
      toast({
        title: "Submission Failed",
        description: "Could not submit your prayer. Please try again.",
        variant: "destructive",
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  const handlePrayFor = async (prayerId: string) => {
    if (prayedForIds.has(prayerId)) {
        toast({ title: "Already Prayed", description: "You've already marked this prayer." });
        return;
    }

    try {
      await incrementPrayedForCount(prayerId);
      setPrayers((prev) =>
        prev.map((p) =>
          p.id === prayerId ? { ...p, prayedForCount: p.prayedForCount + 1 } : p
        )
      );
      
      const newPrayedForIds = new Set(prayedForIds);
      newPrayedForIds.add(prayerId);
      setPrayedForIds(newPrayedForIds)
      
    } catch (error) {
      console.error("Failed to pray:", error);
      toast({ title: "Error", description: "Could not update the prayer.", variant: "destructive" });
    }
  };

  return (
    <div className="container mx-auto py-8 max-w-3xl">
      <Card className="mb-8">
        <CardHeader>
          <CardTitle className="text-3xl">Prayer Wall</CardTitle>
          <CardDescription>
            Share your heart and pray for others. You can post with your name or anonymously.
          </CardDescription>
        </CardHeader>
        <form onSubmit={handleSubmitPrayer}>
          <CardContent className="space-y-4">
            <Textarea
              value={newPrayerText}
              onChange={(e) => setNewPrayerText(e.target.value)}
              placeholder="Write your prayer request or testimony here..."
              required
              rows={4}
            />
            {user && (
              <div className="flex items-center space-x-2">
                <Switch
                  id="anonymous-switch"
                  checked={postAnonymously}
                  onCheckedChange={setPostAnonymously}
                />
                <Label htmlFor="anonymous-switch">Post anonymously</Label>
              </div>
            )}
          </CardContent>
          <CardFooter>
            <Button type="submit" disabled={isSubmitting}>
              {isSubmitting && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              <Send className="mr-2 h-4 w-4" /> Submit Prayer
            </Button>
          </CardFooter>
        </form>
      </Card>

      <div className="space-y-4">
        <h2 className="text-2xl font-bold">Recent Prayers</h2>
        {isLoading ? (
          <div className="flex justify-center py-8">
            <Loader2 className="h-8 w-8 animate-spin" />
          </div>
        ) : (
          prayers.map((prayer) => (
            <Card key={prayer.id}>
              <CardContent className="pt-6">
                <p className="mb-4 text-lg">{prayer.text}</p>
                <div className="flex justify-between items-center text-sm text-muted-foreground">
                  <div className="flex items-center gap-2">
                    <UserCircle className="h-4 w-4"/>
                    <span>
                      by {prayer.isAnonymous ? "Anonymous" : prayer.authorName || "User"} -{" "}
                      {formatDistanceToNow(prayer.createdAt.toDate(), { addSuffix: true })}
                    </span>
                  </div>
                  <span>{prayer.prayedForCount} people have prayed</span>
                </div>
              </CardContent>
              <CardFooter>
                <Button
                  variant="outline"
                  onClick={() => handlePrayFor(prayer.id)}
                  disabled={prayedForIds.has(prayer.id)}
                  className="w-full"
                >
                  <HeartHandshake className="mr-2 h-4 w-4" />
                  {prayedForIds.has(prayer.id) ? "You've Prayed" : "I Prayed for This"}
                </Button>
              </CardFooter>
            </Card>
          ))
        )}
      </div>
    </div>
  );
}
