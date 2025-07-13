
// src/app/quiz/[categoryId]/page.tsx
"use client";

import { useEffect, useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import Link from 'next/link';
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
import type { Quiz, QuizCategoryPublic } from '@/types';
import { Alert, AlertTitle, AlertDescription } from '@/components/ui/alert';
import { Terminal } from 'lucide-react';
import { useUserPreferences } from '@/hooks/use-user-preferences';
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


const QuizItemSkeleton = () => (
  <Card className="shadow-lg rounded-xl">
    <CardHeader>
      <Skeleton className="h-7 w-3/4 rounded-md mb-1" />
      <Skeleton className="h-4 w-1/2 rounded-md" />
    </CardHeader>
    <CardContent>
      <Skeleton className="h-4 w-full rounded-md mb-1.5" />
      <Skeleton className="h-4 w-5/6 rounded-md" />
    </CardContent>
    <CardFooter>
      <Skeleton className="h-10 w-full rounded-md" />
    </CardFooter>
  </Card>
);


export default function QuizCategoryPage() {
  const { user, loading: authLoading } = useAuth();
  const { preferences, isLoaded: preferencesLoaded } = useUserPreferences();
  const { getQuizCategoryById, getQuizzesByCategoryId, isLoadingContent } = useContent();
  const router = useRouter();
  const params = useParams();
  const categoryId = params.categoryId as string;

  const [category, setCategory] = useState<QuizCategoryPublic | null>(null);
  const [quizzesInCategory, setQuizzesInCategory] = useState<Quiz[]>([]);

  useEffect(() => {
    if (categoryId && !isLoadingContent) {
      const foundCategory = getQuizCategoryById(categoryId);
      setCategory(foundCategory || null);

      const allQuizzesForCategory = getQuizzesByCategoryId(categoryId);
      setQuizzesInCategory(allQuizzesForCategory);

      if (analytics && foundCategory) {
        logEvent(analytics, 'view_page', { 
            page_name: 'quiz_category_detail_page', 
            quiz_category_id: categoryId,
            quiz_category_name: foundCategory.name
        });
      } else if (analytics && !foundCategory) {
         logEvent(analytics, 'quiz_category_not_found_on_detail_page', { 
            quiz_category_id: categoryId
        });
      }
    }
  }, [categoryId, isLoadingContent, getQuizCategoryById, getQuizzesByCategoryId]);

  useEffect(() => {
    if (!authLoading && !user) {
      router.push('/login');
    }
  }, [user, authLoading, router]);

  const navigateTo = (path: string, pageName: string) => {
    if (analytics) {
      logEvent(analytics, 'navigate_to_page', { page_name: pageName, from_page: `quiz_category_page_${categoryId}` });
    }
    router.push(path);
  };
  
  const handleQuizClick = (quizId: string, quizTitle: string) => {
    if (analytics) {
      logEvent(analytics, 'quiz_selected_from_category', { 
        quiz_id: quizId, 
        quiz_title: quizTitle,
        category_id: categoryId,
        category_name: category?.name
      });
    }
    router.push(`/quiz/${categoryId}/${quizId}`);
  };

  if (authLoading || !user || isLoadingContent || !preferencesLoaded) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center text-foreground p-4">
        <Loader2 className="h-12 w-12 animate-spin text-primary mb-4" />
        <p className="text-muted-foreground">Loading quizzes for category...</p>
      </div>
    );
  }
  
  if (!category) {
    return (
       <div className="min-h-screen flex flex-col items-center text-foreground selection:bg-primary/20 selection:text-primary">
         <header className="w-full py-4 px-4 sm:px-6 flex items-center justify-between border-b border-border/60 shadow-sm sticky top-0 bg-background/80 backdrop-blur-md z-50">
            <div className="flex items-center gap-3">
                <Button variant="ghost" size="icon" onClick={() => navigateTo('/quiz', 'quiz_home_via_back_arrow')} className="mr-2">
                    <ArrowLeft className="h-5 w-5" />
                </Button>
                <div>
                    <h1 className="text-3xl sm:text-4xl font-bold text-primary tracking-tight">Category Not Found</h1>
                </div>
            </div>
            <div className="flex items-center gap-2"> <ThemeToggle /></div>
        </header>
        <main className="flex-grow w-full container mx-auto px-4 py-8 flex flex-col items-center justify-center">
            <Alert variant="destructive" className="max-w-lg">
                <Terminal className="h-4 w-4" />
                <AlertTitle>Oops!</AlertTitle>
                <AlertDescription>
                    The quiz category you are looking for (ID: {categoryId}) could not be found.
                    <Button onClick={() => router.push('/quiz')} variant="link" className="p-0 h-auto ml-1 text-destructive-foreground hover:underline">
                        Go back to quiz categories.
                    </Button>
                </AlertDescription>
            </Alert>
        </main>
       </div>
    );
  }

  const displayQuizzes = quizzesInCategory;

  return (
    <div className="min-h-screen flex flex-col items-center text-foreground selection:bg-primary/20 selection:text-primary">
      <header className="w-full py-4 px-4 sm:px-6 flex items-center justify-between border-b border-border/60 shadow-sm sticky top-0 bg-background/80 backdrop-blur-md z-50">
        <div className="flex items-center gap-3">
          <Button variant="ghost" size="icon" onClick={() => navigateTo('/quiz', 'quiz_home_via_back_arrow')} className="mr-2">
            <ArrowLeft className="h-5 w-5" />
          </Button>
          <div>
            <h1 className="text-2xl sm:text-3xl font-bold text-primary tracking-tight line-clamp-1" title={category.name}>{category.name} Quizzes</h1>
            <p className="text-xs sm:text-sm text-muted-foreground mt-0.5 sm:mt-1">{category.description}</p>
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
                <CardTitle className="text-xl text-primary flex items-center gap-2">
                    <ClipboardList className="h-6 w-6"/>
                    Available Quizzes in {category.name}
                </CardTitle>
                <CardDescription>
                    Select a quiz to start.
                </CardDescription>
            </CardHeader>
            <CardContent>
                {isLoadingContent ? (
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                        <QuizItemSkeleton />
                        <QuizItemSkeleton />
                    </div>
                ) : displayQuizzes.length > 0 ? (
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    {displayQuizzes.map((quiz) => (
                      <Card 
                        key={quiz.id} 
                        className="shadow-md hover:shadow-lg transition-shadow duration-300 bg-card/70 backdrop-blur-sm border-border/40 cursor-pointer flex flex-col"
                        onClick={() => handleQuizClick(quiz.id, quiz.title)}
                      >
                        <CardHeader>
                          <CardTitle className="text-lg text-primary">{quiz.title}</CardTitle>
                        </CardHeader>
                        <CardContent className="flex-grow">
                          <p className="text-sm text-muted-foreground line-clamp-2">{quiz.description}</p>
                        </CardContent>
                        <CardFooter>
                          <Button variant="outline" className="w-full">
                            Start Quiz <ArrowRight className="ml-2 h-4 w-4" />
                          </Button>
                        </CardFooter>
                      </Card>
                    ))}
                  </div>
                ) : (
                  <p className="text-muted-foreground text-center py-10">
                    No quizzes available in this category yet. Please check back soon!
                  </p>
                )}
            </CardContent>
        </Card>
      </main>

      <footer className="w-full text-center py-6 px-4 border-t border-border/60">
        <div className="mb-2">
            <p className="text-sm text-muted-foreground">&copy; {new Date().getFullYear()} Daily Grace. Happy quizzing!</p>
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
