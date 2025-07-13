
import {
    Home,
    Newspaper,
    Trophy,
    BookOpen,
    Award,
    Puzzle,
    MessageCircle,
    Bookmark,
    Heart,
    Gift,
    Settings,
    Sparkles,
    Star,
    LayoutGrid,
    BarChart3,
    Shield, // Added for themes
    HandHelping,
    UserPlus, // Added for referrals
} from 'lucide-react';

// Create a map of icon names to components
export const iconMap = {
    Home,
    Newspaper,
    Trophy,
    BookOpen,
    Award,
    Puzzle,
    MessageCircle,
    Bookmark,
    Heart,
    Gift,
    Settings,
    Sparkles,
    Star,
    LayoutGrid,
    BarChart3,
    Shield,
    HandHelping,
    UserPlus,
};

export type NavLink = {
    href: string;
    label: string;
    icon: keyof typeof iconMap;
    premium?: boolean;
};

export const mainNavLinks: NavLink[] = [
    { href: '/', label: 'Dashboard', icon: 'Home' },
    { href: '/daily-devotional', label: 'Daily Devotional', icon: 'Newspaper' },
    { href: '/my-content', label: 'My Content', icon: 'LayoutGrid' },
];

export const featuresNavLinks: NavLink[] = [
    { href: '/challenges', label: 'Challenges', icon: 'Trophy' },
    { href: '/reading-plans', label: 'Reading Plans', icon: 'BookOpen' },
    { href: '/achievements', label: 'Achievements', icon: 'Award' },
    { href: '/quiz', label: 'Quizzes', icon: 'Puzzle' },
    { href: '/year-in-review', label: 'Progress Dashboard', icon: 'BarChart3' },
];

export const communityNavLinks: NavLink[] = [
    { href: '/prayer-circles', label: 'Prayer Circles', icon: 'MessageCircle' },
    { href: '/prayer-wall', label: 'Prayer Wall', icon: 'HandHelping' },
];

export const bottomNavLinks: NavLink[] = [
    { href: '/store', label: 'Grace Store', icon: 'Gift' },
    { href: '/settings', label: 'Settings', icon: 'Settings' },
];
