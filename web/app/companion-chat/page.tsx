
// src/app/companion-chat/page.tsx
"use client";

import { useEffect } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/contexts/auth-context';
import { AppLogo } from '@/components/icons/app-logo';
import { Button } from '@/components/ui/button';
import { Skeleton } from '@/components/ui/skeleton';
import { ArrowLeft, Loader2 } from 'lucide-react';
import { ThemeToggle } from '@/components/theme-toggle';
import { analytics } from '@/lib/firebase/config';
import { logEvent } from 'firebase/analytics';
import { GraceCompanionChat } from '@/components/grace-companion-chat'; // New chat component
import UserDropdownMenu from '@/components/user-dropdown-menu';

export default function CompanionChatPage() {
  const { user, loading: authLoading } = useAuth();
  const router = useRouter();

  useEffect(() => {
    if (analytics) {
      logEvent(analytics, 'view_page', { page_name: 'companion_chat_page' });
    }
  }, []);

  useEffect(() => {
    if (!authLoading && !user) {
      router.push('/login');
    }
  }, [user, authLoading, router]);

  const navigateTo = (path: string, pageName: string) => {
    if (analytics) {
      logEvent(analytics, 'navigate_to_page', { page_name: pageName, from_page: 'companion_chat_page_interaction' });
    }
    router.push(path);
  };
  
  const handleBackNavigation = () => {
    if (analytics) {
      logEvent(analytics, 'navigate_to_page', { page_name: 'previous_page_from_companion_chat', from_page: 'companion_chat_page_header_back_arrow' });
    }
    router.back(); 
  };


  if (authLoading) {
    return (
      <div className="min-h-screen flex flex-col items-center text-foreground selection:bg-primary/20 selection:text-primary">
         <header className="w-full py-4 px-4 sm:px-6 flex items-center justify-between border-b border-border/60 shadow-sm sticky top-0 bg-background/80 backdrop-blur-md z-50">
            <div className="flex items-center gap-3">
                <Skeleton className="h-10 w-10 rounded-md" />
                <Skeleton className="h-8 w-32" />
                <div> <Skeleton className="h-8 w-48" /> <Skeleton className="h-4 w-32 mt-1" /></div>
            </div>
             <div className="flex items-center gap-2"> <ThemeToggle /> <Skeleton className="h-10 w-10 rounded-full" /></div>
        </header>
        <main className="flex-grow w-full container mx-auto px-4 py-8 flex justify-center">
            <Loader2 className="h-12 w-12 animate-spin text-primary" />
        </main>
      </div>
    );
  }
  if (!user) {
     return <div className="min-h-screen flex items-center justify-center"><p>Redirecting to login...</p></div>;
  }

  return (
    <div className="min-h-screen flex flex-col text-foreground selection:bg-primary/20 selection:text-primary">
      <header className="w-full py-4 px-4 sm:px-6 flex items-center justify-between border-b border-border/60 shadow-sm sticky top-0 bg-background/80 backdrop-blur-md z-50">
        <div className="flex items-center gap-3">
          <Button variant="ghost" size="icon" onClick={handleBackNavigation} className="mr-2">
            <ArrowLeft className="h-5 w-5" />
          </Button>
          <AppLogo size={36} className="text-primary hidden sm:block" />
          <div>
            <h1 className="text-2xl sm:text-3xl font-bold text-primary tracking-tight">Grace Companion AI</h1>
            <p className="text-xs sm:text-sm text-muted-foreground mt-0.5 sm:mt-1">Your personal spiritual assistant.</p>
          </div>
        </div>

        <div className="flex items-center gap-2">
          <ThemeToggle />
          <UserDropdownMenu />
        </div>
      </header>

      <main className="flex-grow w-full flex flex-col items-center justify-center p-0 sm:p-4">
        <GraceCompanionChat />
      </main>
    </div>
  );
}
