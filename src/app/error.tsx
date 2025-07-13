"use client"; // Error components must be Client Components

import { useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Terminal } from "lucide-react";
import { analytics } from "@/lib/firebase/config";
import { logEvent } from "firebase/analytics";

export default function Error({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    // Log the error to an error reporting service
    console.error(error);
    if (analytics) {
        logEvent(analytics, 'exception', {
            description: error.message,
            fatal: true,
            digest: error.digest,
        });
    }
  }, [error]);

  return (
    <div className="min-h-screen flex items-center justify-center p-4">
      <Card className="w-full max-w-lg text-center shadow-lg">
        <CardHeader>
            <div className="mx-auto bg-red-100 dark:bg-red-900/30 p-3 rounded-full">
                <Terminal className="h-8 w-8 text-red-500 dark:text-red-400" />
            </div>
          <CardTitle className="mt-4 text-2xl">Something went wrong!</CardTitle>
          <CardDescription className="text-md">
            We're sorry, but an unexpected error has occurred. Our team has been notified.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
            <div className="bg-muted text-muted-foreground p-3 rounded-md text-sm">
                <p className="font-mono">{error.message}</p>
            </div>
          <Button
            onClick={
              // Attempt to recover by trying to re-render the segment
              () => reset()
            }
          >
            Try again
          </Button>
        </CardContent>
      </Card>
    </div>
  );
}
