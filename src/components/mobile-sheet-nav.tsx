
"use client";

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { useUserPreferences } from '@/hooks/use-user-preferences';
import {
    mainNavLinks,
    featuresNavLinks,
    communityNavLinks,
    bottomNavLinks,
    iconMap,
    type NavLink
} from '@/lib/nav-links';
import { Button } from '@/components/ui/button';
import { SheetClose } from '@/components/ui/sheet';

export function MobileSheetNav() {
    const pathname = usePathname();
    const { preferences } = useUserPreferences();

    const renderLink = (link: NavLink) => {
        const Icon = iconMap[link.icon];
        const isActive = pathname === link.href;
        
        if (!Icon) {
            console.error(`Icon '${link.icon}' not found in iconMap.`);
            return null;
        }

        // Hide "Upgrade" link for premium users
        if (link.premium && preferences?.subscriptionStatus === 'premium') {
            return null;
        }

        return (
            <SheetClose asChild key={link.label}>
                <Link href={link.href} passHref>
                     <Button
                        variant={isActive ? 'secondary' : 'ghost'}
                        className="w-full justify-start text-base"
                    >
                        <Icon className="mr-2 h-4 w-4" />
                        {link.label}
                    </Button>
                </Link>
            </SheetClose>
        );
    };

    return (
        <div className="flex flex-col h-full">
            <div className="flex h-14 items-center border-b px-4 lg:h-[60px] lg:px-6 mb-2">
                <Link href="/" className="flex items-center gap-2 font-semibold">
                    <span className="text-xl">Daily Grace</span>
                </Link>
            </div>
            <div className="flex-1 overflow-y-auto px-2">
                <nav className="grid items-start gap-1 text-sm font-medium">
                    <h3 className="px-3 py-2 text-xs text-muted-foreground uppercase tracking-wider">Main</h3>
                    {mainNavLinks.map(renderLink)}

                    <h3 className="px-3 py-2 mt-2 text-xs text-muted-foreground uppercase tracking-wider">Features</h3>
                    {featuresNavLinks.map(renderLink)}

                    <h3 className="px-3 py-2 mt-2 text-xs text-muted-foreground uppercase tracking-wider">Community</h3>
                    {communityNavLinks.map(renderLink)}
                </nav>
            </div>
            <div className="mt-auto p-2 border-t">
                 <nav className="grid items-start gap-1 text-sm font-medium">
                    {bottomNavLinks.map(renderLink)}
                 </nav>
            </div>
        </div>
    );
}
