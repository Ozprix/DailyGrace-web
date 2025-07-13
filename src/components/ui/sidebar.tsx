
"use client";

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { Button } from '@/components/ui/button';
import { useUserPreferences } from '@/hooks/use-user-preferences';
import {
    mainNavLinks,
    featuresNavLinks,
    communityNavLinks,
    bottomNavLinks,
    iconMap,
    type NavLink
} from '@/lib/nav-links';

export function Sidebar() {
    const pathname = usePathname();
    const { preferences } = useUserPreferences();

    const renderLink = (link: NavLink) => {
        const Icon = iconMap[link.icon];
        const isActive = pathname === link.href;
        
        if (!Icon) {
            // This is a safeguard, should not happen with type safety
            console.error(`Icon '${link.icon}' not found in iconMap.`);
            return null;
        }

        if (link.premium && preferences?.subscriptionStatus === 'premium') {
            return null;
        }

        return (
            <Link key={link.label} href={link.href}>
                <Button
                    variant={isActive ? 'secondary' : 'ghost'}
                    className="w-full justify-start"
                >
                    <Icon className="mr-2 h-4 w-4" />
                    {link.label}
                </Button>
            </Link>
        );
    };
    
    return (
        <div className="hidden border-r bg-muted/40 md:block">
            <div className="flex h-full max-h-screen flex-col gap-2">
                <div className="flex h-14 items-center border-b px-4 lg:h-[60px] lg:px-6">
                    <Link href="/" className="flex items-center gap-2 font-semibold">
                        <span className="text-xl">Daily Grace</span>
                    </Link>
                </div>
                <div className="flex-1 overflow-y-auto">
                    <nav className="grid items-start px-2 text-sm font-medium lg:px-4">
                        <h3 className="px-2 py-2 text-xs text-muted-foreground uppercase tracking-wider">Main</h3>
                        {mainNavLinks.map(renderLink)}

                        <h3 className="px-2 py-2 mt-4 text-xs text-muted-foreground uppercase tracking-wider">Features</h3>
                        {featuresNavLinks.map(renderLink)}

                        <h3 className="px-2 py-2 mt-4 text-xs text-muted-foreground uppercase tracking-wider">Community</h3>
                        {communityNavLinks.map(renderLink)}
                    </nav>
                </div>
                <div className="mt-auto p-4">
                     <nav className="grid items-start text-sm font-medium">
                        {bottomNavLinks.map(renderLink)}
                     </nav>
                </div>
            </div>
        </div>
    );
}
