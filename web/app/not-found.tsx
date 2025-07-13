import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Search } from 'lucide-react';

export default function NotFound() {
  return (
    <div className="min-h-screen flex items-center justify-center p-4">
      <Card className="w-full max-w-lg text-center shadow-lg">
        <CardHeader>
            <div className="mx-auto bg-yellow-100 dark:bg-yellow-900/30 p-3 rounded-full">
                <Search className="h-8 w-8 text-yellow-500 dark:text-yellow-400" />
            </div>
          <CardTitle className="mt-4 text-2xl">Page Not Found</CardTitle>
          <CardDescription className="text-md">
            We're sorry, but the page you are looking for does not exist or has been moved.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <Button asChild>
            <Link href="/">Return to Homepage</Link>
          </Button>
        </CardContent>
      </Card>
    </div>
  );
}
