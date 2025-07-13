
// src/app/quiz/page.tsx
"use client";

import { useEffect } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/contexts/auth-context';
import { useContent } from '@/contexts/content-context';
import { Button } from '@/components/ui/button';
import { Skeleton } from '@/components/ui/skeleton';
import { Badge } from '@/components/ui/badge';
import { ArrowLeft, BookOpen, ChevronRight, ListMusic, Loader2, Puzzle, Smile, Target, User as UserIconLucide } from 'lucide-react';
import { ThemeToggle } from '@/components/theme-toggle';
import { analytics } from '@/lib/firebase/config';
import { logEvent } from 'firebase/analytics';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import type { QuizCategoryPublic } from '@/types';
import UserDropdownMenu from '@/components/user-dropdown-menu';

// Map icon names to Lucide components
const iconComponents: { [key: string]: React.ElementType } = {
  BookOpen,
  Target,
  Smile,
  User: UserIconLucide,
  ListMusic,
  Puzzle,
};


const QuizPageSkeleton = () => (
  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
    {Array.from({ length: 3 }).map((_, index) => (
      <Card key={`quiz-cat-skeleton-${index}`} className="shadow-lg rounded-xl">
        <CardHeader>
          <div className="flex items-center gap-3 mb-2">
            <Skeleton className="h-8 w-8 rounded-full" />
            <Skeleton className="h-7 w-3/4 rounded-md" />
          </div>
          <Skeleton className="h-4 w-full rounded-md" />
          <Skeleton className="h-4 w-5/6 rounded-md mt-1" />
        </CardHeader>
        <CardFooter>
          <Skeleton className="h-10 w-full rounded-md" />
        </CardFooter>
      </Card>
    ))}
  </div>
);

export default function QuizPage() {
  const { user, loading: authLoading } = useAuth();
  const { allQuizCategories, isLoadingContent } = useContent();
  const router = useRouter();

  useEffect(() => {
    if (analytics) {
      logEvent(analytics, 'view_page', { page_name: 'quiz_home_page_with_categories' });
    }
  }, []);

  useEffect(() => {
    if (!authLoading && !user) {
      router.push('/login');
    }
  }, [user, authLoading, router]);

  const handleCategoryClick = (categoryId: string, categoryName: string) => {
    if (analytics) {
      logEvent(analytics, 'quiz_category_selected', { category_id: categoryId, category_name: categoryName });
    }
    router.push(`/quiz/${categoryId}`);
  };

  if (authLoading || !user) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center text-foreground p-4">
        <Loader2 className="h-12 w-12 animate-spin text-primary mb-4" />
        <p className="text-muted-foreground">Loading quizzes...</p>
      </div>
    );
  }

  return (
    <div className="min-h-screen flex flex-col items-center text-foreground selection:bg-primary/20 selection:text-primary">
      <header className="w-full py-4 px-4 sm:px-6 flex items-center justify-between border-b border-border/60 shadow-sm sticky top-0 bg-background/80 backdrop-blur-md z-50">
        <div className="flex items-center gap-3">
          <Button variant="ghost" size="icon" onClick={() => router.push('/')} className="mr-2">
            <ArrowLeft className="h-5 w-5" />
          </Button>
          <div>
            <h1 className="text-3xl sm:text-4xl font-bold text-primary tracking-tight">Spiritual Quizzes</h1>
            <p className="text-xs sm:text-sm text-muted-foreground mt-0.5 sm:mt-1">Test your knowledge & reflect.</p>
          </div>
        </div>

        <div className="flex items-center gap-2">
          <ThemeToggle />
          <UserDropdownMenu />
        </div>
      </header>

      <main className="flex-grow w-full container mx-auto px-4 py-8">
        <Card className="w-full max-w-4xl mx-auto shadow-lg bg-card/80 backdrop-blur-sm border-border/50">
            <CardHeader>
                <CardTitle className="text-2xl text-primary flex items-center gap-2">
                    <Puzzle className="h-6 w-6"/>
                    Quiz Categories
                </CardTitle>
                <CardDescription>
                    Choose a category to explore quizzes. More categories and quizzes coming soon!
                </CardDescription>
            </CardHeader>
            <CardContent>
                {isLoadingContent ? (
                  <QuizPageSkeleton />
                ) : allQuizCategories.length > 0 ? (
                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                    {allQuizCategories.map((category) => {
                      const IconComponent = iconComponents[category.iconName] || Puzzle;
                      return (
                        <Card 
                          key={category.id} 
                          className="shadow-md hover:shadow-lg transition-shadow duration-300 bg-card/70 backdrop-blur-sm border-border/40 cursor-pointer flex flex-col"
                          onClick={() => handleCategoryClick(category.id, category.name)}
                        >
                          <CardHeader>
                            <div className="flex items-center gap-3 mb-1">
                              <IconComponent className="h-7 w-7 text-primary" />
                              <CardTitle className="text-xl text-primary">{category.name}</CardTitle>
                            </div>
                             <Badge variant="outline" className="text-xs w-fit">{category.type}</Badge>
                          </CardHeader>
                          <CardContent className="flex-grow">
                            <p className="text-sm text-muted-foreground line-clamp-3">{category.description}</p>
                          </CardContent>
                          <CardFooter>
                            <Button variant="secondary" className="w-full">
                              View Quizzes <ChevronRight className="ml-2 h-4 w-4" />
                            </Button>
                          </CardFooter>
                        </Card>
                      );
                    })}
                  </div>
                ) : (
                  <p className="text-muted-foreground text-center py-10">
                    No quiz categories available at the moment. Check back soon!
                  </p>
                )}
            </CardContent>
        </Card>
      </main>

      <footer className="w-full text-center py-6 px-4 border-t border-border/60">
        <div className="mb-2">
          <p className="text-sm text-muted-foreground">
            &copy; {new Date().getFullYear()} Daily Grace. Engaging quizzes for your growth.
          </p>
        </div>
        <div className="flex justify-center space-x-4">
          <Link href="/privacy" className="text-xs text-muted-foreground hover:text-primary transition-colors">
            Privacy Policy
          </Link>
          <span className="text-xs text-muted-foreground">|</span>
          <Link href="/terms" className="text-xs text-muted-foreground hover:text-primary transition-colors">
            Terms of Service
          </Link>
        </div>
      </footer>
    </div>
  );
}
