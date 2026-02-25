// Normalize text for more reliable matching.
// - trims spaces
// - lowercases
// - removes accents/diacritics
// - collapses repeated whitespace
export function normalizeText(value: string): string {
    return (value ?? "")
      .trim()
      .toLowerCase()
      .normalize("NFD")
      .replace(/[\u0300-\u036f]/g, "")
      .replace(/\s+/g, " ");
  }