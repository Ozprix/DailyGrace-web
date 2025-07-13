
// src/app/quiz/[categoryId]/[quizId]/page.tsx
"use client";

import { useEffect, useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { useAuth } from '@/contexts/auth-context';
import { useContent } from '@/contexts/content-context';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle, CardFooter } from '@/components/ui/card';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import { Label } from '@/components/ui/label';
import { Progress } from '@/components/ui/progress';
import { Skeleton } from '@/components/ui/skeleton';
import { ArrowLeft, ArrowRight, ChevronRight, HelpCircle, Loader2, ShieldCheck, XCircle, CheckCircle } from 'lucide-react';
import { ThemeToggle } from '@/components/theme-toggle';
import { analytics } from '@/lib/firebase/config';
import { logEvent } from 'firebase/analytics';
import type { Quiz, QuizQuestion as QuestionType } from '@/types';
import { Alert, AlertTitle, AlertDescription } from '@/components/ui/alert';
import { Terminal } from 'lucide-react';
import { useUserPreferences } from '@/hooks/use-user-preferences';
import { Badge } from '@/components/ui/badge';
import UserDropdownMenu from '@/components/user-dropdown-menu';

const FREE_QUIZ_IDS = ['nt_heroes_quiz1', 'ot_basics_quiz1'];

const QuizTakingSkeleton = () => (
    <Card className="w-full max-w-2xl mx-auto shadow-xl bg-card/80 backdrop-blur-sm border-border/50">
        <CardHeader>
            <Skeleton className="h-8 w-3/4 mb-2" />
            <Skeleton className="h-5 w-1/2" />
            <Skeleton className="h-4 w-1/4 mt-2" />
        </CardHeader>
        <CardContent className="space-y-6">
            <Skeleton className="h-6 w-full mb-4" />
            <div className="space-y-3">
                <Skeleton className="h-10 w-full rounded-md" />
                <Skeleton className="h-10 w-full rounded-md" />
                <Skeleton className="h-10 w-full rounded-md" />
            </div>
        </CardContent>
        <CardFooter className="flex justify-between items-center">
            <Skeleton className="h-10 w-32 rounded-md" />
            <Skeleton className="h-4 w-24 rounded-md" />
        </CardFooter>
    </Card>
);

export default function QuizTakingPage() {
  const { user, loading: authLoading } = useAuth();
  const { preferences, isLoaded: preferencesLoaded } = useUserPreferences();
  const { getQuizById, getQuizCategoryById, isLoadingContent } = useContent();
  const router = useRouter();
  const params = useParams();
  const categoryId = params.categoryId as string;
  const quizId = params.quizId as string;

  const [quiz, setQuiz] = useState<Quiz | null>(null);
  const [currentQuestionIndex, setCurrentQuestionIndex] = useState(0);
  const [selectedAnswers, setSelectedAnswers] = useState<Record<string, string>>({});
  
  useEffect(() => {
    if (quizId && !isLoadingContent) {
      const foundQuiz = getQuizById(quizId);
      setQuiz(foundQuiz || null);
      if (analytics && foundQuiz) {
        logEvent(analytics, 'start_quiz_attempt', { 
            quiz_id: quizId,
            quiz_title: foundQuiz.title,
            category_id: categoryId
        });
      } else if (analytics && !foundQuiz) {
         logEvent(analytics, 'quiz_not_found_on_taking_page', { 
            quiz_id: quizId,
            category_id: categoryId
        });
      }
    }
  }, [quizId, categoryId, isLoadingContent, getQuizById]);

  useEffect(() => {
    if (!authLoading && !user) {
      router.push('/login');
    }
  }, [user, authLoading, router]);

  const navigateTo = (path: string, pageName: string) => {
    if (analytics) {
      logEvent(analytics, 'navigate_to_page', { page_name: pageName, from_page: `quiz_taking_page_${quizId}` });
    }
    router.push(path);
  };

  const handleAnswerSelect = (questionId: string, answerId: string) => {
    setSelectedAnswers(prev => ({ ...prev, [questionId]: answerId }));
     if (analytics && quiz) {
        logEvent(analytics, 'quiz_answer_selected', { 
            quiz_id: quiz.id,
            question_id: questionId,
            selected_answer_id: answerId,
            question_index: currentQuestionIndex
        });
      }
  };

  const handleNextQuestion = () => {
    if (quiz && currentQuestionIndex < quiz.questions.length - 1) {
      setCurrentQuestionIndex(prev => prev + 1);
      if (analytics) {
        logEvent(analytics, 'quiz_next_question', { 
            quiz_id: quiz.id,
            previous_question_index: currentQuestionIndex,
            new_question_index: currentQuestionIndex + 1,
        });
      }
    }
  };

  const handleSubmitQuiz = () => {
    if (!quiz) return;

    let score = 0;
    quiz.questions.forEach(question => {
      if (selectedAnswers[question.id] === question.correctAnswer) {
        score++;
      }
    });

    if (analytics) {
        logEvent(analytics, 'quiz_submitted', { 
            quiz_id: quiz.id,
            quiz_title: quiz.title,
            category_id: categoryId,
            score: score,
            total_questions: quiz.questions.length,
            answers_provided_count: Object.keys(selectedAnswers).length
        });
    }
    
    const queryParams = new URLSearchParams({
      quizId: quiz.id,
      categoryId: categoryId,
      answers: JSON.stringify(selectedAnswers),
      score: String(score),
      total: String(quiz.questions.length),
      isNewSubmission: "true",
    }).toString();

    router.push(`/quiz/${categoryId}/${quiz.id}/results?${queryParams}`);
  };

  const isPremiumQuiz = quiz ? !FREE_QUIZ_IDS.includes(quiz.id) : false;
  const isFreeUserAccessingPremium = isPremiumQuiz && preferences?.subscriptionStatus === 'free';
  const category = getQuizCategoryById(categoryId);

  if (authLoading || !user || isLoadingContent || !preferencesLoaded) {
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
            <QuizTakingSkeleton />
        </main>
      </div>
    );
  }

  if (!quiz) {
    return (
       <div className="min-h-screen flex flex-col items-center text-foreground selection:bg-primary/20 selection:text-primary">
         <header className="w-full py-4 px-4 sm:px-6 flex items-center justify-between border-b border-border/60 shadow-sm sticky top-0 bg-background/80 backdrop-blur-md z-50">
            <div className="flex items-center gap-3">
                <Button variant="ghost" size="icon" onClick={() => navigateTo(`/quiz/${categoryId}`, 'quiz_category_detail_page')} className="mr-2">
                    <ArrowLeft className="h-5 w-5" />
                </Button>
                <div>
                    <h1 className="text-3xl sm:text-4xl font-bold text-primary tracking-tight">Quiz Not Found</h1>
                </div>
            </div>
            <div className="flex items-center gap-2"> <ThemeToggle /></div>
        </header>
        <main className="flex-grow w-full container mx-auto px-4 py-8 flex flex-col items-center justify-center">
            <Alert variant="destructive" className="max-w-lg">
                <Terminal className="h-4 w-4" />
                <AlertTitle>Oops! Quiz Error</AlertTitle>
                <AlertDescription>
                    The quiz (ID: {quizId}) you are looking for could not be found in this category (ID: {categoryId}).
                    <Button onClick={() => router.push(`/quiz/${categoryId}`)} variant="link" className="p-0 h-auto ml-1 text-destructive-foreground hover:underline">
                        Go back to category quizzes.
                    </Button>
                </AlertDescription>
            </Alert>
        </main>
       </div>
    );
  }

  if (isFreeUserAccessingPremium) {
    return (
      <div className="min-h-screen flex flex-col items-center text-foreground selection:bg-primary/20 selection:text-primary">
        <header className="w-full py-4 px-4 sm:px-6 flex items-center justify-between border-b border-border/60 shadow-sm sticky top-0 bg-background/80 backdrop-blur-md z-50">
            <div className="flex items-center gap-3">
                <Button variant="ghost" size="icon" onClick={() => navigateTo(`/quiz/${categoryId}`, 'quiz_category_detail')} className="mr-2">
                    <ArrowLeft className="h-5 w-5" />
                </Button>
                <div>
                    <h1 className="text-xl sm:text-2xl font-bold text-primary tracking-tight line-clamp-1" title={quiz.title}>{quiz.title}</h1>
                </div>
            </div>
            <div className="flex items-center gap-2"> <ThemeToggle /></div>
        </header>
        <main className="flex-grow w-full container mx-auto px-4 py-8 flex flex-col items-center justify-center">
            <Card className="w-full max-w-lg mx-auto shadow-xl bg-card/80 backdrop-blur-sm border-border/50">
                <CardHeader className="items-center text-center">
                    <ShieldCheck className="h-12 w-12 text-amber-500 mb-3" />
                    <CardTitle className="text-2xl text-primary">Premium Quiz</CardTitle>
                    <CardDescription className="text-muted-foreground">
                        This quiz, "{quiz.title}", is part of our Premium offering.
                    </CardDescription>
                </CardHeader>
                <CardContent className="text-center">
                    <p className="mb-4">
                        Upgrade your account to access this quiz and unlock all other premium features.
                    </p>
                    <Button onClick={() => navigateTo('/upgrade', 'upgrade_from_premium_quiz_gate')} variant="primaryGradient" size="lg">
                       Upgrade to Premium <ArrowRight className="ml-2 h-4 w-4" />
                    </Button>
                </CardContent>
                 <CardFooter>
                    <Button variant="outline" className="w-full" onClick={() => navigateTo(`/quiz/${categoryId}`, 'back_to_category_from_premium_quiz_gate')}>
                        Back to {category?.name || 'Category'} Quizzes
                    </Button>
                </CardFooter>
            </Card>
        </main>
      </div>
    );
  }


  const currentQuestion = quiz.questions[currentQuestionIndex];
  const progressPercentage = ((currentQuestionIndex + 1) / quiz.questions.length) * 100;
  const isLastQuestion = currentQuestionIndex === quiz.questions.length - 1;

  return (
    <div className="min-h-screen flex flex-col items-center text-foreground selection:bg-primary/20 selection:text-primary">
      <header className="w-full py-4 px-4 sm:px-6 flex items-center justify-between border-b border-border/60 shadow-sm sticky top-0 bg-background/80 backdrop-blur-md z-50">
        <div className="flex items-center gap-3">
          <Button variant="ghost" size="icon" onClick={() => navigateTo(`/quiz/${categoryId}`, 'quiz_category_detail')} className="mr-2">
            <ArrowLeft className="h-5 w-5" />
          </Button>
          <div>
            <h1 className="text-xl sm:text-2xl font-bold text-primary tracking-tight line-clamp-1" title={quiz.title}>{quiz.title}</h1>
          </div>
        </div>
        <div className="flex items-center gap-2">
          <ThemeToggle />
          <UserDropdownMenu />
        </div>
      </header>

      <main className="flex-grow w-full container mx-auto px-4 py-8 flex justify-center">
        <Card className="w-full max-w-2xl shadow-xl bg-card/80 backdrop-blur-sm border-border/50">
          <CardHeader>
            <div className="flex justify-between items-center mb-2">
                <CardTitle className="text-2xl text-primary flex items-center gap-2"><HelpCircle className="h-6 w-6"/> Question {currentQuestionIndex + 1}</CardTitle>
                <span className="text-sm text-muted-foreground">
                    Question {currentQuestionIndex + 1} of {quiz.questions.length}
                </span>
            </div>
            <Progress value={progressPercentage} className="w-full h-2" />
            <CardDescription className="text-lg text-foreground pt-4">{currentQuestion.text}</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            {currentQuestion.type === 'multiple-choice' && currentQuestion.options && (
              <RadioGroup
                value={selectedAnswers[currentQuestion.id] || ""}
                onValueChange={(value) => handleAnswerSelect(currentQuestion.id, value)}
                className="space-y-2"
              >
                {currentQuestion.options.map((option) => (
                  <Label
                    key={option.id}
                    htmlFor={`${currentQuestion.id}-${option.id}`}
                    className={`flex items-center space-x-3 p-3 rounded-md border hover:bg-accent/50 transition-colors cursor-pointer
                                ${selectedAnswers[currentQuestion.id] === option.id ? 'bg-primary/10 border-primary ring-2 ring-primary' : 'bg-background/70'}`}
                  >
                    <RadioGroupItem value={option.id} id={`${currentQuestion.id}-${option.id}`} />
                    <span>{option.text}</span>
                  </Label>
                ))}
              </RadioGroup>
            )}
            {currentQuestion.type === 'true-false' && (
              <div className="flex space-x-4">
                <Button
                  variant={selectedAnswers[currentQuestion.id] === 'true' ? 'primaryGradient' : 'outline'}
                  className="flex-1 py-3 text-base"
                  onClick={() => handleAnswerSelect(currentQuestion.id, 'true')}
                >
                  <CheckCircle className="mr-2 h-5 w-5" /> True
                </Button>
                <Button
                  variant={selectedAnswers[currentQuestion.id] === 'false' ? 'primaryGradient' : 'outline'}
                  className="flex-1 py-3 text-base"
                  onClick={() => handleAnswerSelect(currentQuestion.id, 'false')}
                >
                  <XCircle className="mr-2 h-5 w-5" /> False
                </Button>
              </div>
            )}
          </CardContent>
          <CardFooter className="flex justify-end">
            {isLastQuestion ? (
              <Button onClick={handleSubmitQuiz} disabled={!selectedAnswers[currentQuestion.id]} variant="primaryGradient" size="lg">
                Submit Quiz
              </Button>
            ) : (
              <Button onClick={handleNextQuestion} disabled={!selectedAnswers[currentQuestion.id]} size="lg">
                Next Question <ChevronRight className="ml-2 h-4 w-4" />
              </Button>
            )}
          </CardFooter>
        </Card>
      </main>
       <footer className="w-full text-center py-6 px-4 border-t border-border/60">
        <p className="text-sm text-muted-foreground">&copy; {new Date().getFullYear()} Daily Grace. Keep learning!</p>
      </footer>
    </div>
  );
}
