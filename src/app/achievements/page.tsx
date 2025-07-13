
"use client";

import { useState, useEffect } from "react";
import { useAuth } from "@/contexts/auth-context";
import { collection, getDocs } from "firebase/firestore";
import { db } from "@/lib/firebase/config";
import { allAchievements } from "@/lib/achievements";
import type { Achievement, UserAchievement } from "@/types/achievements";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Loader2 } from "lucide-react";
import { format } from "date-fns";

export default function AchievementsPage() {
  const { user, loading: authLoading } = useAuth();
  const [unlockedAchievements, setUnlockedAchievements] = useState<
    UserAchievement[]
  >([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const fetchAchievements = async () => {
      if (!user) {
        setIsLoading(false);
        return;
      }

      setIsLoading(true);
      const achievementsRef = collection(
        db,
        "users",
        user.uid,
        "achievements"
      );
      const snapshot = await getDocs(achievementsRef);
      const unlocked = snapshot.docs.map(
        (doc) => doc.data() as UserAchievement
      );
      setUnlockedAchievements(unlocked);
      setIsLoading(false);
    };

    if (!authLoading) {
      fetchAchievements();
    }
  }, [user, authLoading]);

  const getAchievementDetails = (
    achievementId: string
  ): Achievement | undefined => {
    return allAchievements.find((a) => a.id === achievementId);
  };

  if (isLoading || authLoading) {
    return (
      <div className="flex justify-center items-center h-screen">
        <Loader2 className="h-8 w-8 animate-spin" />
      </div>
    );
  }

  return (
    <div className="container mx-auto py-8">
      <h1 className="text-3xl font-bold mb-6">My Achievements</h1>
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {allAchievements.map((achievement) => {
          const unlocked = unlockedAchievements.find(
            (ua) => ua.achievementId === achievement.id
          );
          const isUnlocked = !!unlocked;

          return (
            <Card
              key={achievement.id}
              className={`transition-all ${
                isUnlocked ? "border-green-500" : "opacity-50"
              }`}
            >
              <CardHeader>
                <div className="flex justify-between items-start">
                  <achievement.icon
                    className={`h-10 w-10 ${
                      isUnlocked ? "text-green-500" : "text-muted-foreground"
                    }`}
                  />
                  {isUnlocked && (
                    <Badge variant="secondary" className="bg-green-100 text-green-700">
                      Unlocked
                    </Badge>
                  )}
                </div>
                <CardTitle className="pt-4">{achievement.name}</CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-muted-foreground">
                  {achievement.description}
                </p>
                {unlocked && (
                  <p className="text-xs text-green-600 mt-2">
                    Unlocked on:{" "}
                    {format(unlocked.unlockedAt.toDate(), "MMMM d, yyyy")}
                  </p>
                )}
              </CardContent>
            </Card>
          );
        })}
      </div>
    </div>
  );
}
