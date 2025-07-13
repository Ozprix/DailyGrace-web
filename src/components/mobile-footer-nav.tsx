
'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { Button } from '@/components/ui/button';
import { SheetTrigger } from '@/components/ui/sheet';
import { Home, Trophy, BookOpen, LayoutGrid } from 'lucide-react';
import { cn } from '@/lib/utils';

const navItems = [
    { href: '/', label: 'Home', icon: Home },
    { href: '/challenges', label: 'Challenges', icon: Trophy },
    { href: '/reading-plans', label: 'Reading', icon: BookOpen },
];

export function MobileFooterNav() {
    const pathname = usePathname();

    return (
        <footer className="fixed bottom-0 left-0 z-50 w-full border-t bg-background/95 backdrop-blur-sm md:hidden">
            <div className="grid h-16 grid-cols-4 items-center font-medium">
                {navItems.map((item) => {
                    const isActive = pathname.startsWith(item.href) && (item.href === '/' ? pathname === '/' : true);
                    return (
                        <Link key={item.label} href={item.href} className="flex h-full flex-col items-center justify-center gap-1 text-xs">
                            <item.icon className={cn("h-5 w-5", isActive ? "text-primary" : "text-muted-foreground")} />
                            <span className={cn("text-xs", isActive ? "text-primary" : "text-muted-foreground")}>
                                {item.label}
                            </span>
                        </Link>
                    );
                })}
                <SheetTrigger asChild>
                    <Button variant="ghost" className="flex h-full flex-col items-center justify-center gap-1 rounded-none text-xs">
                        <LayoutGrid className="h-5 w-5 text-muted-foreground" />
                        <span className="text-xs text-muted-foreground">More</span>
                    </Button>
                </SheetTrigger>
            </div>
        </footer>
    );
}
