
// src/components/user-dropdown-menu.tsx
"use client";

import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/contexts/auth-context';
import { Button } from '@/components/ui/button';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Home, Heart, LogOut, Settings, Sparkles, Bookmark, Puzzle, Edit3, Gift, User as UserIcon, Trophy, Newspaper } from 'lucide-react';
import { analytics } from '@/lib/firebase/config';
import { logEvent } from 'firebase/analytics';

const UserDropdownMenu = () => {
  const { user, loading: authLoading, logout } = useAuth();
  const router = useRouter();

  const handleLogout = async () => {
    await logout();
    router.push('/');
  };

  const getInitials = (email: string | null | undefined) => {
    if (!email) return "DG";
    const parts = email.split('@')[0].split(/[._-]/);
    if (parts.length > 1) {
      return (parts[0][0] + parts[1][0]).toUpperCase();
    }
    return email.substring(0, 2).toUpperCase();
  };

  const navigateTo = (path: string, pageName: string, eventName?: string) => {
    if (analytics) {
      logEvent(analytics, eventName || 'navigate_to_page_from_user_dropdown', {
        page_name: pageName,
        target_path: path,
        from_page: 'user_dropdown_menu'
      });
    }
    router.push(path);
  };

  const menuFeatures = [
    { name: "Home", icon: Home, path: "/", eventName: "navigate_to_home_dashboard_page" },
    { name: "Daily Devotional", icon: Newspaper, path: "/daily-devotional", eventName: "navigate_to_daily_devotional_page" },
    { name: "My Favorites", icon: Heart, path: "/favorites", eventName: "navigate_to_favorites" },
    { name: "My Journal", icon: Bookmark, path: "/journal", eventName: "navigate_to_my_journal" },
    { name: "Challenges", icon: Trophy, path: "/challenges", eventName: "navigate_to_challenges" },
    { name: "Quizzes", icon: Puzzle, path: "/quiz", eventName: "navigate_to_quiz_home" },
    { name: "Profile", icon: UserIcon, path: "/profile", eventName: "navigate_to_user_profile" },
    { name: "Settings", icon: Settings, path: "/settings", eventName: "navigate_to_settings" },
    { name: "Grace Store", icon: Gift, path: "/store", eventName: "navigate_to_grace_store_page" },
  ];

  if (authLoading) {
    return null; 
  }

  if (!user) {
    return null; 
  }

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button variant="ghost" className="relative h-10 w-10 rounded-full">
          <Avatar className="h-9 w-9">
            {user.photoURL ? (
              <AvatarImage src={user.photoURL} alt={user.displayName || "User Avatar"} />
            ) : null}
            <AvatarFallback>{getInitials(user.email)}</AvatarFallback>
          </Avatar>
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent className="w-56" align="end" forceMount>
        <DropdownMenuLabel className="font-normal">
          <div className="flex flex-col space-y-1">
            <p className="text-sm font-medium leading-none">
              {user.displayName || user.email?.split('@')[0]}
            </p>
            <p className="text-xs leading-none text-muted-foreground">
              {user.email}
            </p>
          </div>
        </DropdownMenuLabel>
        <DropdownMenuSeparator />
        {menuFeatures.map(feature => (
          <DropdownMenuItem key={feature.path} onClick={() => navigateTo(feature.path, feature.name.toLowerCase().replace(/\s+/g, '_'), feature.eventName)} className="cursor-pointer">
            <feature.icon className="mr-2 h-4 w-4" />
            <span>{feature.name}</span>
          </DropdownMenuItem>
        ))}
        <DropdownMenuSeparator />
        <DropdownMenuItem onClick={handleLogout} className="cursor-pointer">
          <LogOut className="mr-2 h-4 w-4" />
          <span>Log out</span>
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  );
};

export default UserDropdownMenu;
