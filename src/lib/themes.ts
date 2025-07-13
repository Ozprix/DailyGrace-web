import { Heart, Shield, BookOpen, HandHelping } from 'lucide-react';

export interface WeeklyTheme {
  name: string;
  description: string;
  icon: React.ElementType;
  keywords: string[];
}

export const weeklyThemes: WeeklyTheme[] = [
  {
    name: 'Gratitude',
    description: 'Focus on thankfulness and recognizing God’s blessings in your life.',
    icon: HandHelping,
    keywords: ['gratitude', 'thankful', 'blessings', 'praise', '7-day gratitude challenge'],
  },
  {
    name: 'Faith & Trust',
    description: 'Deepen your trust in God’s plan and His unwavering faithfulness.',
    icon: Shield,
    keywords: ['faith', 'trust', 'believe', 'strength', 'foundations of faith', '14-day faith builder'],
  },
  {
    name: 'Forgiveness',
    description: 'Explore the freedom that comes from both giving and receiving forgiveness.',
    icon: Heart,
    keywords: ['forgiveness', 'mercy', 'grace', 'reconciliation', '7-day forgiveness focus'],
  },
  {
    name: 'Foundations',
    description: 'Strengthen your understanding of the core principles of your faith journey.',
    icon: BookOpen,
    keywords: ['foundations', 'faith', 'basics', 'principles', 'journey through the gospels'],
  },
  // Add more themes here if needed
];

const getWeekNumber = (d: Date): number => {
  d = new Date(Date.UTC(d.getFullYear(), d.getMonth(), d.getDate()));
  d.setUTCDate(d.getUTCDate() + 4 - (d.getUTCDay() || 7));
  const yearStart = new Date(Date.UTC(d.getUTCFullYear(), 0, 1));
  const weekNo = Math.ceil((((d.getTime() - yearStart.getTime()) / 86400000) + 1) / 7);
  return weekNo;
};

export const getCurrentTheme = (): WeeklyTheme => {
  const weekNumber = getWeekNumber(new Date());
  const themeIndex = (weekNumber - 1) % weeklyThemes.length;
  return weeklyThemes[themeIndex];
};
