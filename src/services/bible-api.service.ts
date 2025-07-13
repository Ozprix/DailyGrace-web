// src/services/bible-api.service.ts
import type { BibleVerse } from '@/types';

const API_BASE_URL = 'https://bible-api.com/';

/**
 * Normalizes a Bible reference string (e.g., "John 3:16") into a standardized ID format (e.g., "john316").
 * @param reference The Bible reference string.
 * @returns A standardized ID string.
 */
function normalizeReferenceToId(reference: string): string {
  if (!reference) return 'unknown';
  return reference
    .toLowerCase()
    .replace(/\s+/g, '') // Remove all spaces
    .replace(/:/g, '');  // Remove colons
}

interface BibleApiVerse {
  book_id: string;
  book_name: string;
  chapter: number;
  verse: number;
  text: string;
}

interface BibleApiResponse {
  reference: string;
  verses: BibleApiVerse[];
  text: string; // Combined text of all verses in the query
  translation_id: string;
  translation_name: string;
  translation_note: string;
  error?: string; // API returns an error field for "not found" etc.
}

/**
 * Fetches a Bible verse from the external bible-api.com.
 * @param reference The Bible reference string (e.g., "John 3:16").
 * @returns A Promise that resolves to a BibleVerse object or null if not found or an error occurs.
 */
export async function fetchVerseFromExternalAPI(reference: string): Promise<BibleVerse | null> {
  if (!reference || typeof reference !== 'string' || reference.trim() === '') {
    console.warn('fetchVerseFromExternalAPI: Invalid reference provided.');
    return null;
  }

  const encodedReference = encodeURIComponent(reference.trim());
  const url = `${API_BASE_URL}${encodedReference}`;

  try {
    const response = await fetch(url);
    if (!response.ok) {
      // Try to parse error from API if possible
      let errorData;
      try {
        errorData = await response.json();
      } catch (e) {
        // Ignore if response is not JSON
      }
      console.error(`External Bible API request failed for "${reference}": ${response.status} ${response.statusText}`, errorData || '');
      return null;
    }

    const data: BibleApiResponse = await response.json();

    if (data.error) {
      console.warn(`External Bible API returned error for "${reference}": ${data.error}`);
      return null;
    }

    if (data.text && data.reference) {
      return {
        id: normalizeReferenceToId(data.reference), // Use the reference returned by API for ID generation
        reference: data.reference,
        text: data.text.trim().replace(/\n/g, ' '), // API text often includes newlines that we want to remove
      };
    }

    console.warn(`External Bible API response for "${reference}" was missing text or reference.`, data);
    return null;
  } catch (error) {
    console.error(`Error fetching verse from external API for "${reference}":`, error);
    return null;
  }
}
