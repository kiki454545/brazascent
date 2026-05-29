/**
 * Converts a note display name to a URL-safe slug.
 * e.g. "Fève de tonka" → "feve-de-tonka"
 *      "Fleur d'oranger" → "fleur-d-oranger"
 */
export function noteToSlug(note: string): string {
  return note
    .toLowerCase()
    .normalize('NFD')
    .replace(/[̀-ͯ]/g, '') // strip diacritical marks
    .replace(/['']/g, '-') // apostrophes → hyphens
    .replace(/\s+/g, '-') // spaces → hyphens
    .replace(/[^a-z0-9-]/g, '') // remove remaining special chars
    .replace(/-+/g, '-') // collapse consecutive hyphens
    .replace(/^-|-$/g, '') // trim
}
