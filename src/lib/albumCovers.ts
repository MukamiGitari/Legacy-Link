import type { Album } from '../types';

/**
 * Default cartoon-style cover art shown for an album when no custom cover
 * photo has been uploaded yet. One illustration per category, matching the
 * app's heritage green / gold / cream palette.
 */
export const DEFAULT_ALBUM_COVERS: Record<Album['category'], string> = {
  weddings: '/covers/cover-weddings.svg',
  reunions: '/covers/cover-reunions.svg',
  childhood: '/covers/cover-childhood.svg',
  birthdays: '/covers/cover-birthdays.svg',
  historical: '/covers/cover-historical.svg',
  memorials: '/covers/cover-memorials.svg',
  holidays: '/covers/cover-holidays.svg',
};

export function defaultCoverFor(category: Album['category']): string {
  return DEFAULT_ALBUM_COVERS[category];
}
