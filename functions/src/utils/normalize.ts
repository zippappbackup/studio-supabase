
export function normalizeNameForLookup(name: string): string {
  if (!name) return '';
  return name
    .toLowerCase()
    .normalize('NFKD')                 // remove accents
    .replace(/[\u0300-\u036f]/g, '')   // remove diacritics
    .replace(/[^a-z0-9\s]/g, ' ')      // remove punctuation
    .replace(/\s+/g, ' ')              // collapse multiple spaces
    .trim();
}
