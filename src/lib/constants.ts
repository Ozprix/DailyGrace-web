
import type { BibleVerse, Challenge } from '@/types';

// ALL_BIBLE_VERSES will now be fetched from Firestore via ContentContext
// export const ALL_BIBLE_VERSES: BibleVerse[] = [
//   {
//     id: "john316",
//     reference: "John 3:16",
//     text: "For God so loved the world, that he gave his only Son, that whoever believes in him should not perish but have eternal life.",
//   },
//   // ... other verses were here
// ];

// DEFAULT_VERSE is problematic if ALL_BIBLE_VERSES is async.
// The logic for selecting a default or daily verse will need to adapt to the async loading from ContentContext.
// For now, direct usage of DEFAULT_VERSE will likely be removed or refactored in components.
// export const DEFAULT_VERSE: BibleVerse = ALL_BIBLE_VERSES[0];


// ALL_CHALLENGES will now be fetched from Firestore via ContentContext
// export const ALL_CHALLENGES: Challenge[] = [
//   {
//     id: '20dayprayer',
//     name: '20-Day Prayer Journey',
//     description: 'Deepen your connection with God through 20 days of focused prayer and reflection.',
//     durationDays: 20,
//     days: Array.from({ length: 20 }, (_, i) => ({
//       day: i + 1,
//       title: `Day ${i + 1}: Focus on Gratitude`,
//       prompt: `Today, spend time reflecting on three things you are grateful for. Offer a prayer of thanks for each.`,
//       verseReference: (i % 2 === 0) ? 'philippians413' : 'proverbs356',
//       prayerFocus: `Pray for a heart full of gratitude, recognizing God's blessings in your life.`
//     }))
//   },
//   // ... other challenges were here
// ];

// You can keep other constants here if they are truly static and not fetched.
// For example, if you had app version or other configuration details.
