// src/hooks/use-missions.ts
"use client";

import { useState, useEffect, useCallback } from 'react';
import { useAuth } from '@/contexts/auth-context';
import { useContent } from '@/contexts/content-context';
import { useUserPreferences } from '@/hooks/use-user-preferences';
import { getOrCreateWeeklyMissions, completeMission } from '@/services/missions.service';
import type { UserWeeklyMissions, Mission } from '@/types';
import { useToast } from '@/hooks/use-toast';

export function useMissions() {
    const { user } = useAuth();
    const { allMissions, getMissionById, isLoadingContent } = useContent();
    const { awardPoints } = useUserPreferences();
    const { toast } = useToast();

    const [weeklyMissions, setWeeklyMissions] = useState<UserWeeklyMissions | null>(null);
    const [isLoadingMissions, setIsLoadingMissions] = useState(true);
    const [isCompletingMission, setIsCompletingMission] = useState<string | null>(null);

    const fetchMissions = useCallback(async () => {
        if (!user || isLoadingContent) {
            if (!user) setIsLoadingMissions(false);
            return;
        }
        setIsLoadingMissions(true);
        const missions = await getOrCreateWeeklyMissions(user.uid, allMissions);
        setWeeklyMissions(missions);
        setIsLoadingMissions(false);
    }, [user, allMissions, isLoadingContent]);

    useEffect(() => {
        if (user && !isLoadingContent) {
            fetchMissions();
        }
    }, [user, isLoadingContent, fetchMissions]);

    const handleCompleteMission = async (missionId: string) => {
        if (!user || !weeklyMissions) return;

        setIsCompletingMission(missionId);
        const success = await completeMission(user.uid, weeklyMissions.id, missionId);
        
        if (success) {
            const missionDetails = getMissionById(missionId);
            if(missionDetails) {
                await awardPoints(missionDetails.points);
                toast({
                    title: "Mission Complete!",
                    description: `You earned ${missionDetails.points} Grace Points for completing "${missionDetails.title}".`
                });
            }
            // Refetch to update UI state
            await fetchMissions();
        } else {
            toast({
                title: "Error",
                description: "Could not complete mission. Please try again.",
                variant: "destructive"
            });
        }
        setIsCompletingMission(null);
    };
    
    const missionsWithDetails = weeklyMissions?.missions.map(userMission => {
        const details = getMissionById(userMission.missionId);
        return {
            ...userMission,
            details
        }
    }).filter(m => m.details) || [];


    return {
        weeklyMissions: missionsWithDetails,
        isLoadingMissions,
        isCompletingMission,
        handleCompleteMission,
        refetchMissions: fetchMissions
    };
}
