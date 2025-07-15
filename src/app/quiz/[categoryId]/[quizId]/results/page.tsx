
// src/app/quiz/[categoryId]/[quizId]/results/page.tsx
"use client";

import { useEffect, useState, Suspense } from 'react';
import { useParams, useRouter, useSearchParams } from 'next/navigation';
import Link from 'next/link';
import { useAuth } from '@/contexts/auth-context';
import { useContent } from '@/contexts/content-context';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle, CardFooter } from '@/components/ui/card';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Skeleton } from '@/components/ui/skeleton';
import { ArrowLeft, LogOut, Puzzle, Loader2, CheckCircle, XCircle, Info, RefreshCcw, ClipboardList, Award } from 'lucide-react';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { ThemeToggle } from '@/components/theme-toggle';
import { analytics } from '@/lib/firebase/config';
import { logEvent } from 'firebase/analytics';
import type { Quiz, QuizQuestion as QuestionType } from '@/types';
import { Alert, AlertTitle, AlertDescription } from '@/components/ui/alert';
import { Terminal, Sparkles } from 'lucide-react';
import { useUserPreferences } from '@/hooks/use-user-preferences';

const QUIZ_COMPLETION_POINTS = 25;
const QUIZ_SUCCESS_THRESHOLD = 0.7;

const QuizResultsSkeleton = () => (
    <Card className="w-full max-w-3xl mx-auto shadow-xl bg-card/80 backdrop-blur-sm border-border/50">
        <CardHeader className="text-center items-center">
            <Skeleton className="h-10 w-40 mb-2" />
            <Skeleton className="h-7 w-52 mb-3" />
            <Skeleton className="h-5 w-32" />
        </CardHeader>
        <CardContent className="space-y-6">
            {Array.from({ length: 3 }).map((_, i) => (
                <div key={i} className="p-4 border rounded-lg bg-muted/30 space-y-2">
                    <Skeleton className="h-5 w-3/4" />
                    <Skeleton className="h-4 w-1/2" />
                    <Skeleton className="h-4 w-1/2" />
                    <Skeleton className="h-4 w-2/3 mt-1" />
                </div>
            ))}
        </CardContent>
        <CardFooter className="flex flex-col sm:flex-row justify-center gap-4 pt-6">
            <Skeleton className="h-10 w-32 rounded-md" />
            <Skeleton className="h-10 w-40 rounded-md" />
        </CardFooter>
    </Card>
);


function QuizResultsContent() {
  const { user, loading: authLoading, logout } = useAuth();
  const { preferences, awardPoints, isLoaded: preferencesLoaded } = useUserPreferences();
  const { getQuizById } = useContent();
  const router = useRouter();
  const params = useParams();
  const searchParams = useSearchParams();

  const categoryId = params.categoryId as string;
  const quizId = params.quizId as string;
  
  const [quiz, setQuiz] = useState<Quiz | null>(null);
  const [userAnswers, setUserAnswers] = useState<Record<string, string>>({});
  const [score, setScore] = useState(0);
  const [totalQuestions, setTotalQuestions] = useState(0);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [pointsAwardedThisSession, setPointsAwardedThisSession] = useState(false);


  useEffect(() => {
    if (analytics) {
      logEvent(analytics, 'view_page', {
        page_name: 'quiz_results_page',
        quiz_id: quizId,
        category_id: categoryId
      });
    }
  }, [quizId, categoryId]);

  useEffect(() => {
    if (!authLoading && !user) {
      router.push('/login');
    }
  }, [user, authLoading, router]);

  useEffect(() => {
    setIsLoading(true);
    setError(null);

    const answersParam = searchParams.get('answers');
    const scoreParam = searchParams.get('score');
    const totalParam = searchParams.get('total');
    const isNewSubmissionParam = searchParams.get('isNewSubmission');

    if (!quizId || !categoryId || !answersParam || !scoreParam || !totalParam) {
      setError("Quiz results data is missing. Please try taking the quiz again.");
      setIsLoading(false);
      if(analytics){
        logEvent(analytics, 'quiz_results_page_load_error', {
            error_type: 'missing_query_params',
            quiz_id: quizId,
            category_id: categoryId,
        });
      }
      return;
    }

    try {
      const parsedAnswers = JSON.parse(answersParam);
      const currentScore = parseInt(scoreParam, 10);
      const currentTotal = parseInt(totalParam, 10);

      setUserAnswers(parsedAnswers);
      setScore(currentScore);
      setTotalQuestions(currentTotal);

      if (isNewSubmissionParam === "true" && preferencesLoaded && !pointsAwardedThisSession) {
        if ((currentScore / currentTotal) >= QUIZ_SUCCESS_THRESHOLD) {
          awardPoints(QUIZ_COMPLETION_POINTS).then(success => {
            if (success) {
              setPointsAwardedThisSession(true);
              if(analytics) {
                logEvent(analytics, 'points_awarded_for_quiz', {
                  quiz_id: quizId,
                  score: currentScore,
                  total_questions: currentTotal,
                  points: QUIZ_COMPLETION_POINTS
                });
              }
            }
          });
        } else if (analytics) {
            logEvent(analytics, 'quiz_completed_below_threshold_for_points', {
                quiz_id: quizId,
                score: currentScore,
                total_questions: currentTotal,
                threshold: QUIZ_SUCCESS_THRESHOLD,
            });
        }
      }

    } catch (e) {
      setError("Failed to parse quiz results. Please try again.");
      setIsLoading(false);
      if(analytics){
        logEvent(analytics, 'quiz_results_page_load_error', {
            error_type: 'parsing_query_params_failed',
            quiz_id: quizId,
            category_id: categoryId,
            error_message: (e as Error).message,
        });
      }
      return;
    }

    const foundQuiz = getQuizById(quizId);
    if (foundQuiz) {
      setQuiz(foundQuiz);
    } else {
      setError("Quiz details not found. Cannot display results.");
      if(analytics){
        logEvent(analytics, 'quiz_results_page_load_error', {
            error_type: 'quiz_not_found_for_results',
            quiz_id: quizId,
            category_id: categoryId,
        });
      }
    }
    setIsLoading(false);
  }, [searchParams, quizId, categoryId, preferencesLoaded, awardPoints, pointsAwardedThisSession, getQuizById]);


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

  const navigateTo = (path: string, pageName: string) => {
    if (analytics && quiz) {
      logEvent(analytics, 'navigate_to_page', { page_name: pageName, from_page: `quiz_results_page_${quiz.id}` });
    }
    router.push(path);
  };

  const getOptionText = (question: QuestionType, optionId: string): string => {
    if (question.type === 'true-false') {
        return optionId === 'true' ? 'True' : 'False';
    }
    return question.options?.find(opt => opt.id === optionId)?.text || 'N/A';
  };


  if (authLoading || !user || isLoading || !preferencesLoaded) {
    return (
      <div className="min-h-screen flex flex-col items-center text-foreground selection:bg-primary/20 selection:text-primary">
         <header className="w-full py-4 px-4 sm:px-6 flex items-center justify-between border-b border-border/60 shadow-sm sticky top-0 bg-background/80 backdrop-blur-md z-50">
            <div className="flex items-center gap-3">
                <Button variant="ghost" size="icon" onClick={() => router.back()} className="mr-2">
                    <ArrowLeft className="h-5 w-5" />
                </Button>
                <div> <Skeleton className="h-8 w-48" /></div>
            </div>
             <div className="flex items-center gap-2"> <ThemeToggle /> <Skeleton className="h-10 w-10 rounded-full" /></div>
        </header>
        <main className="flex-grow w-full container mx-auto px-4 py-8 flex justify-center">
            <QuizResultsSkeleton />
        </main>
      </div>
    );
  }

  if (error) {
    return (
       <div className="min-h-screen flex flex-col items-center text-foreground selection:bg-primary/20 selection:text-primary">
         <header className="w-full py-4 px-4 sm:px-6 flex items-center justify-between border-b border-border/60 shadow-sm sticky top-0 bg-background/80 backdrop-blur-md z-50">
            <div className="flex items-center gap-3">
                <Button variant="ghost" size="icon" onClick={() => navigateTo(`/quiz/${categoryId}`, 'quiz_category_detail_page')} className="mr-2">
                    <ArrowLeft className="h-5 w-5" />
                </Button>
                <div>
                    <h1 className="text-3xl sm:text-4xl font-bold text-primary tracking-tight">Quiz Results Error</h1>
                </div>
            </div>
            <div className="flex items-center gap-2"> <ThemeToggle /></div>
        </header>
        <main className="flex-grow w-full container mx-auto px-4 py-8 flex flex-col items-center justify-center">
            <Alert variant="destructive" className="max-w-lg">
                <Terminal className="h-4 w-4" />
                <AlertTitle>Error Displaying Results</AlertTitle>
                <AlertDescription>
                    {error}
                    <Button onClick={() => router.push(`/quiz/${categoryId}`)} variant="link" className="p-0 h-auto ml-1 text-destructive-foreground hover:underline">
                        Go back to category quizzes.
                    </Button>
                </AlertDescription>
            </Alert>
        </main>
       </div>
    );
  }
  
  if (!quiz) {
    return (
         <div className="min-h-screen flex items-center justify-center text-foreground">
            <Loader2 className="h-12 w-12 animate-spin text-primary" />
            <p className="ml-4">Preparing your results...</p>
        </div>
    );
  }
  
  const isPerfectScore = score === totalQuestions;

  return (
    <div className="min-h-screen flex flex-col items-center text-foreground selection:bg-primary/20 selection:text-primary">
      <header className="w-full py-4 px-4 sm:px-6 flex items-center justify-between border-b border-border/60 shadow-sm sticky top-0 bg-background/80 backdrop-blur-md z-50">
        <div className="flex items-center gap-3">
          <Button variant="ghost" size="icon" onClick={() => navigateTo(`/quiz/${categoryId}`, 'quiz_category_detail')} className="mr-2">
            <ArrowLeft className="h-5 w-5" />
          </Button>
          <div>
            <h1 className="text-xl sm:text-2xl font-bold text-primary tracking-tight line-clamp-1" title={quiz.title}>{quiz.title} - Results</h1>
          </div>
        </div>
        <div className="flex items-center gap-2">
          <ThemeToggle />
          {user ? (
             <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="ghost" className="relative h-10 w-10 rounded-full">
                  <Avatar className="h-9 w-9">
                    <AvatarFallback>{getInitials(user.email)}</AvatarFallback>
                  </Avatar>
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent className="w-56" align="end" forceMount>
                <DropdownMenuLabel className="font-normal">
                  <div className="flex flex-col space-y-1">
                    <p className="text-sm font-medium leading-none">{user.displayName || user.email?.split('@')[0]}</p>
                    <p className="text-xs leading-none text-muted-foreground">{user.email}</p>
                  </div>
                </DropdownMenuLabel>
                <DropdownMenuSeparator />
                <DropdownMenuItem onClick={() => navigateTo('/', 'home')} className="cursor-pointer">Home</DropdownMenuItem>
                <DropdownMenuItem onClick={() => navigateTo('/quiz', 'quiz_home')} className="cursor-pointer"><Puzzle className="mr-2 h-4 w-4" /><span>All Quizzes</span></DropdownMenuItem>
                <DropdownMenuSeparator />
                <DropdownMenuItem onClick={handleLogout} className="cursor-pointer"><LogOut className="mr-2 h-4 w-4" /><span>Log out</span></DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          ) : null}
        </div>
      </header>

      <main className="flex-grow w-full container mx-auto px-4 py-8 flex justify-center">
        <Card className="w-full max-w-3xl shadow-xl bg-card/80 backdrop-blur-sm border-border/50">
          <CardHeader className="text-center items-center">
            {isPerfectScore && (
              <div className="mb-3 text-center p-4 rounded-lg bg-amber-400/10 dark:bg-amber-500/10 border border-amber-500/30">
                <Sparkles className="h-12 w-12 text-amber-500 dark:text-amber-400 mx-auto animate-pulse" />
                <p className="text-2xl font-bold text-amber-600 dark:text-amber-400 mt-2">PERFECT SCORE!</p>
                <p className="text-lg text-muted-foreground">Outstanding work!</p>
              </div>
            )}
            <CardTitle className={`text-3xl font-bold ${isPerfectScore ? 'text-amber-600 dark:text-amber-400' : 'text-primary'}`}>
              Quiz Results
            </CardTitle>
            <CardDescription className="text-lg text-muted-foreground mt-1">{quiz.title}</CardDescription>
            <p className={`text-5xl font-bold mt-4 ${isPerfectScore ? 'text-amber-500 dark:text-amber-300' : 'text-accent'}`}>
                {score} / {totalQuestions}
            </p>
            <p className="text-md text-muted-foreground">
                ({((score / totalQuestions) * 100).toFixed(0)}%)
            </p>
          </CardHeader>
          <CardContent className="space-y-6">
            {pointsAwardedThisSession && (
              <Alert variant="default" className="bg-green-50 dark:bg-green-900/30 border-green-500/50 text-green-700 dark:text-green-400">
                <Award className="h-5 w-5 text-green-600 dark:text-green-400" />
                <AlertTitle className="font-semibold">Points Awarded!</AlertTitle>
                <AlertDescription>
                  You've earned {QUIZ_COMPLETION_POINTS} Grace Points for completing this quiz!
                </AlertDescription>
              </Alert>
            )}
            <h3 className="text-xl font-semibold text-primary mt-4 mb-3">Review Your Answers:</h3>
            <ScrollArea className="h-auto max-h-[400px] pr-3">
                <div className="space-y-4">
                {quiz.questions.map((question, index) => {
                    const userAnswerId = userAnswers[question.id];
                    const isCorrect = userAnswerId === question.correctAnswer;
                    const userAnswerText = getOptionText(question, userAnswerId);
                    const correctAnswerText = getOptionText(question, question.correctAnswer);

                    return (
                    <div key={question.id} className={`p-4 rounded-lg border ${isCorrect ? 'border-green-500/50 bg-green-500/10' : 'border-red-500/50 bg-red-500/10'}`}>
                        <p className="font-semibold text-md text-foreground">Question {index + 1}: {question.text}</p>
                        <div className="mt-2 text-sm">
                            <p className={`flex items-center gap-2 ${isCorrect ? 'text-green-700 dark:text-green-400' : 'text-red-700 dark:text-red-400'}`}>
                                {isCorrect ? <CheckCircle className="h-4 w-4" /> : <XCircle className="h-4 w-4" />}
                                Your answer: <span className="font-medium">{userAnswerText || "Not answered"}</span>
                            </p>
                            {!isCorrect && (
                                <p className="text-green-700 dark:text-green-400 flex items-center gap-2">
                                    <Info className="h-4 w-4"/> Correct answer: <span className="font-medium">{correctAnswerText}</span>
                                </p>
                            )}
                        </div>
                        {question.explanation && (
                            <p className="mt-2 text-xs text-muted-foreground italic bg-muted/50 p-2 rounded-md">
                                Explanation: {question.explanation}
                            </p>
                        )}
                    </div>
                    );
                })}
                </div>
            </ScrollArea>
          </CardContent>
          <CardFooter className="flex flex-col sm:flex-row justify-center gap-4 pt-6">
            <Button onClick={() => navigateTo(`/quiz/${categoryId}/${quiz.id}`, 'quiz_try_again')} variant="outline" size="lg">
                <RefreshCcw className="mr-2 h-4 w-4"/> Try Again
            </Button>
            <Button onClick={() => navigateTo(`/quiz/${categoryId}`, 'quiz_category_from_results')} variant="primaryGradient" size="lg">
                <ClipboardList className="mr-2 h-4 w-4"/> Back to Category Quizzes
            </Button>
          </CardFooter>
        </Card>
      </main>
       <footer className="w-full text-center py-6 px-4 border-t border-border/60">
        <div className="mb-2">
            <p className="text-sm text-muted-foreground">&copy; {new Date().getFullYear()} Daily Grace. Review and grow!</p>
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

export default function QuizResultsPage() {
    return (
        <Suspense fallback={
            <div className="min-h-screen flex flex-col items-center text-foreground">
                <header className="w-full py-4 px-4 sm:px-6 flex items-center justify-between border-b border-border/60 shadow-sm sticky top-0 bg-background/80 backdrop-blur-md z-50">
                    <div className="flex items-center gap-3">
                        <Skeleton className="h-10 w-10 rounded-md" />
                        <Skeleton className="h-8 w-32" />
                        <div><Skeleton className="h-8 w-48" /></div>
                    </div>
                    <div className="flex items-center gap-2"> <Skeleton className="h-10 w-10 rounded-md" /> <Skeleton className="h-10 w-10 rounded-full" /></div>
                </header>
                <main className="flex-grow w-full container mx-auto px-4 py-8 flex justify-center">
                     <QuizResultsSkeleton />
                </main>
            </div>
        }>
            <QuizResultsContent />
        </Suspense>
    );
}
