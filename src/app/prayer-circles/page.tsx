
"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { useAuth } from "@/contexts/auth-context";
import {
  getPublicPrayerCircles,
  joinPrayerCircle,
} from "@/services/prayer-circle.service";
import type { PrayerCircle } from "@/types/prayer-circle";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { useToast } from "@/hooks/use-toast";
import { Loader2, PlusCircle, Users } from "lucide-react";

export default function PrayerCirclesPage() {
  const { user, loading: authLoading } = useAuth();
  const router = useRouter();
  const { toast } = useToast();

  const [circles, setCircles] = useState<PrayerCircle[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isJoining, setIsJoining] = useState<string | null>(null);

  useEffect(() => {
    const fetchCircles = async () => {
      setIsLoading(true);
      try {
        const publicCircles = await getPublicPrayerCircles();
        setCircles(publicCircles);
      } catch (error) {
        console.error("Failed to fetch prayer circles:", error);
        toast({
          title: "Error",
          description: "Could not load prayer circles.",
          variant: "destructive",
        });
      }
      setIsLoading(false);
    };

    fetchCircles();
  }, [toast]);

  const handleJoinCircle = async (circleId: string) => {
    if (!user) {
      toast({
        title: "Authentication required",
        description: "You must be logged in to join a circle.",
        variant: "destructive",
      });
      return;
    }

    setIsJoining(circleId);
    try {
      await joinPrayerCircle(circleId, user.uid, user.displayName || "Anonymous");
      toast({
        title: "Successfully joined!",
        description: "You are now a member of the prayer circle.",
      });
      // Optionally, you could update the UI to reflect the new membership status
    } catch (error) {
      console.error("Failed to join prayer circle:", error);
      toast({
        title: "Error",
        description: "Could not join the prayer circle.",
        variant: "destructive",
      });
    } finally {
      setIsJoining(null);
    }
  };

  if (authLoading || isLoading) {
    return (
      <div className="flex justify-center items-center h-screen">
        <Loader2 className="h-8 w-8 animate-spin" />
      </div>
    );
  }

  return (
    <div className="container mx-auto py-8">
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-3xl font-bold">Public Prayer Circles</h1>
        <Button onClick={() => router.push("/prayer-circles/new")}>
          <PlusCircle className="mr-2 h-4 w-4" /> Create Circle
        </Button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {circles.map((circle) => (
          <Card key={circle.id}>
            <CardHeader>
              <CardTitle className="flex items-center">
                <Users className="mr-2" /> {circle.name}
              </CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-muted-foreground mb-4">{circle.description}</p>
              <Button
                onClick={() => handleJoinCircle(circle.id)}
                disabled={isJoining === circle.id}
                className="w-full"
              >
                {isJoining === circle.id ? (
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                ) : null}
                Join Circle
              </Button>
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  );
}
