
import type {Metadata} from 'next';
import { Inter, Fira_Code } from 'next/font/google';
import './globals.css';
import { Toaster } from "@/components/ui/toaster";
import { AuthProvider } from '@/contexts/auth-context';
import { ThemeProvider } from '@/contexts/theme-context';
import { ContentProvider } from '@/contexts/content-context';
import { Sidebar } from '@/components/ui/sidebar';
import { Sheet, SheetContent, SheetTrigger } from '@/components/ui/sheet';
import { Button } from '@/components/ui/button';
import { Menu } from 'lucide-react';
import { MobileSheetNav } from '@/components/mobile-sheet-nav';
import UserDropdownMenu from '@/components/user-dropdown-menu';
import { MobileFooterNav } from '@/components/mobile-footer-nav';

const inter = Inter({
  variable: '--font-sans',
  subsets: ['latin'],
});

const firaCode = Fira_Code({
  variable: '--font-mono',
  subsets: ['latin'],
  weight: "400",
});

export const metadata: Metadata = {
  title: 'Daily Grace',
  description: 'Your daily dose of inspiration and spiritual upliftment.',
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" suppressHydrationWarning>
      <head>
        {/* The head tag is intentionally left empty. Next.js will populate it with the metadata object. */}
      </head>
      <body className={`${inter.variable} ${firaCode.variable} antialiased`}>
        <AuthProvider>
          <ContentProvider>
            <ThemeProvider>
                <div className="grid min-h-screen w-full md:grid-cols-[220px_1fr] lg:grid-cols-[280px_1fr]">
                    <Sidebar />
                    <Sheet>
                        <div className="flex flex-col">
                            <header className="flex h-14 items-center justify-between gap-4 border-b bg-muted/40 px-4 md:hidden">
                                <SheetTrigger asChild>
                                    <Button
                                        variant="outline"
                                        size="icon"
                                        className="shrink-0"
                                    >
                                        <Menu className="h-5 w-5" />
                                        <span className="sr-only">Toggle navigation menu</span>
                                    </Button>
                                </SheetTrigger>
                                <UserDropdownMenu />
                            </header>
                            <main className="flex flex-1 flex-col gap-4 p-4 lg:gap-6 lg:p-6 pb-20 md:pb-6">
                                {children}
                            </main>
                            <MobileFooterNav />
                        </div>
                        <SheetContent side="left" className="flex flex-col p-0">
                            <MobileSheetNav />
                        </SheetContent>
                    </Sheet>
                </div>
              <Toaster />
            </ThemeProvider>
          </ContentProvider>
        </AuthProvider>
      </body>
    </html>
  );
}
