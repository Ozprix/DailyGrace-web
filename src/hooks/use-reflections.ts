// src/hooks/use-reflections.ts
"use client";

import { useState, useEffect, useCallback } from 'react';
import { useAuth } from '@/contexts/auth-context';
import { getReflectionsForVerse, addReflection, upvoteReflection } from '@/services/reflections.service';
import type { VerseReflection } from '@/types';
import { useToast } from './use-toast';

export function useReflections(verseId: string) {
  const { user } = useAuth();
  const { toast } = useToast();
  const [reflections, setReflections] = useState<VerseReflection[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const fetchReflections = useCallback(async () => {
    if (!verseId) return;
    setIsLoading(true);
    setError(null);
    try {
      const verseReflections = await getReflectionsForVerse(verseId);
      setReflections(verseReflections);
    } catch (e) {
      console.error("Failed to fetch reflections:", e);
      setError("Could not load community reflections.");
      toast({ title: "Error", description: "Could not load community reflections.", variant: "destructive" });
    } finally {
      setIsLoading(false);
    }
  }, [verseId, toast]);

  useEffect(() => {
    fetchReflections();
  }, [fetchReflections]);

  const submitReflection = async (text: string): Promise<boolean> => {
    if (!user) {
      toast({ title: "Login Required", description: "You must be logged in to post a reflection.", variant: "default" });
      return false;
    }
    if (!text.trim()) return false;

    setIsSubmitting(true);
    try {
      const newReflection = await addReflection(verseId, user.uid, user.displayName || "Anonymous", text);
      setReflections(prev => [newReflection, ...prev]);
      toast({ title: "Success!", description: "Your reflection has been posted." });
      return true;
    } catch (e) {
      console.error("Failed to submit reflection:", e);
      toast({ title: "Error", description: "Could not post your reflection.", variant: "destructive" });
      return false;
    } finally {
      setIsSubmitting(false);
    }
  };

  const toggleUpvote = async (reflectionId: string) => {
    if (!user) {
      toast({ title: "Login Required", description: "You must be logged in to vote.", variant: "default" });
      return;
    }

    const originalReflections = [...reflections];
    const reflectionIndex = reflections.findIndex(r => r.id === reflectionId);
    if (reflectionIndex === -1) return;

    const reflectionToUpdate = { ...reflections[reflectionIndex] };
    const alreadyUpvoted = reflectionToUpdate.upvotedBy.includes(user.uid);

    // Optimistic update
    if (alreadyUpvoted) {
      reflectionToUpdate.upvotes -= 1;
      reflectionToUpdate.upvotedBy = reflectionToUpdate.upvotedBy.filter(uid => uid !== user.uid);
    } else {
      reflectionToUpdate.upvotes += 1;
      reflectionToUpdate.upvotedBy.push(user.uid);
    }
    
    const newReflections = [...reflections];
    newReflections[reflectionIndex] = reflectionToUpdate;
    setReflections(newReflections);

    // Backend call
    const success = await upvoteReflection(verseId, reflectionId, user.uid);
    if (!success) {
      // Revert on failure
      setReflections(originalReflections);
      toast({ title: "Error", description: "Your vote could not be saved.", variant: "destructive" });
    }
  };

  return {
    reflections,
    isLoading,
    isSubmitting,
    error,
    submitReflection,
    toggleUpvote,
    currentUserId: user?.uid,
  };
}
