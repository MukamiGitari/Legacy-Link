import type { Album, CookbookAlbumStyle } from '../types';

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
  graduations: '/covers/cover-graduations.svg',
};

export function defaultCoverFor(category: Album['category']): string {
  return DEFAULT_ALBUM_COVERS[category];
}

/** Same idea as DEFAULT_ALBUM_COVERS, but for Cookbook albums (keyed by style, not category). */
export const DEFAULT_COOKBOOK_COVERS: Record<CookbookAlbumStyle, string> = {
  traditional: '/covers/cover-cookbook.svg',
};

export function defaultCookbookCoverFor(style: CookbookAlbumStyle): string {
  return DEFAULT_COOKBOOK_COVERS[style];
}
