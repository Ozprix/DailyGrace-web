"use client";

import { useState } from "react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { useUserPreferences } from "@/hooks/use-user-preferences";
import { Newspaper, PenSquare, Trophy, HeartHandshake, Sparkles, MessageCircle } from "lucide-react";

const tourSteps = [
  {
    icon: Newspaper,
    title: "Welcome to Daily Grace!",
    content:
      "We're so glad you're here. Let's take a quick tour of the key features to help you get started on your spiritual journey.",
  },
  {
    icon: Newspaper,
    title: "Daily Devotionals",
    content:
      "Each day, get an inspiring devotional. You can now also read and share reflections with the community right on the page!",
  },
  {
    icon: PenSquare,
    title: "Personal Journal",
    content:
      "After each devotional, you can write down your thoughts, reflections, and prayers in your private journal.",
  },
  {
    icon: Trophy,
    title: "Challenges & Missions",
    content:
      "Tackle multi-day spiritual challenges or complete bite-sized weekly missions to earn points and grow in your faith.",
  },
  {
    icon: HeartHandshake,
    title: "Community Connection",
    content:
      "Join the community! Share requests on the Prayer Wall, join or create a private Prayer Circle, and find encouragement together.",
  },
  {
    icon: Sparkles,
    title: "You're All Set!",
    content:
      "Explore these features and more from the main dashboard to enrich your spiritual journey.",
  }
];

export const OnboardingTour = () => {
  const { preferences, updateOnboardingStatus } = useUserPreferences();
  const [currentStep, setCurrentStep] = useState(0);

  const isLastStep = currentStep === tourSteps.length - 1;

  const handleNext = () => {
    if (isLastStep) {
      handleFinish();
    } else {
      setCurrentStep((prev) => prev + 1);
    }
  };

  const handleFinish = async () => {
    await updateOnboardingStatus(true);
  };

  // The Dialog open state is controlled by checking the user's preferences
  const isOpen = preferences && !preferences.onboardingCompleted;
  
  const { icon: Icon, title, content } = tourSteps[currentStep];

  if (!isOpen) {
    return null;
  }

  return (
    <Dialog open={isOpen} onOpenChange={(open) => {
        if (!open) handleFinish();
    }}>
      <DialogContent className="sm:max-w-[425px]">
        <DialogHeader className="text-center items-center">
            <div className="bg-primary/10 p-3 rounded-full mb-2">
                <Icon className="h-8 w-8 text-primary"/>
            </div>
          <DialogTitle className="text-2xl">{title}</DialogTitle>
          <DialogDescription className="text-md pt-2">
            {content}
          </DialogDescription>
        </DialogHeader>
        <DialogFooter className="flex-col-reverse sm:flex-row sm:justify-between items-center pt-4">
            <Button variant="ghost" onClick={handleFinish}>
                Skip
            </Button>
            <div className="flex items-center gap-4 mb-4 sm:mb-0">
                <div className="flex justify-center space-x-2">
                {tourSteps.map((_, index) => (
                    <div
                    key={index}
                    className={`h-2 w-2 rounded-full transition-colors ${
                        currentStep === index ? "bg-primary" : "bg-muted"
                    }`}
                    />
                ))}
                </div>
                <Button onClick={handleNext} className="w-24">
                {isLastStep ? "Finish" : "Next"}
                </Button>
            </div>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};
