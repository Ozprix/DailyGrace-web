
"use client";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import type { Mood } from "@/hooks/use-journal";
import { Leaf, Hand, Brain, Sun, CloudRain } from "lucide-react";
import { cn } from "@/lib/utils";

const moodOptions: { mood: Mood; label: string; icon: React.ElementType, color: string }[] = [
  { mood: "inspired", label: "Inspired", icon: Sun, color: "text-yellow-500" },
  { mood: "grateful", label: "Grateful", icon: Hand, color: "text-green-500" },
  { mood: "reflective", label: "Reflective", icon: Brain, color: "text-blue-500" },
  { mood: "peaceful", label: "Peaceful", icon: Leaf, color: "text-teal-500" },
  { mood: "troubled", label: "Troubled", icon: CloudRain, color: "text-gray-500" },
];

interface MoodSelectorProps {
  selectedMood: Mood | undefined;
  onSelectMood: (mood: Mood) => void;
}

export const MoodSelector = ({ selectedMood, onSelectMood }: MoodSelectorProps) => {
  return (
    <div className="flex flex-wrap items-center gap-2">
        <span className="text-sm font-medium text-muted-foreground mr-2">How are you feeling?</span>
      {moodOptions.map(({ mood, label, icon: Icon, color }) => (
        <Button
          key={mood}
          variant={selectedMood === mood ? "secondary" : "ghost"}
          size="sm"
          onClick={() => onSelectMood(mood)}
          className={cn("transition-transform transform hover:scale-105", {
            "border-2 border-primary": selectedMood === mood,
          })}
        >
          <Icon className={cn("h-4 w-4 mr-2", color)} />
          {label}
        </Button>
      ))}
    </div>
  );
};
