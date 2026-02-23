import type { KbErrorEntry } from "./types";

export function matchByRegex(errors: KbErrorEntry[], text: string): KbErrorEntry | null {
  const lower = text.toLowerCase();

  for (const entry of errors) {
    for (const pattern of entry.patterns) {
      const regex = new RegExp(pattern, "i");
      if (regex.test(lower)) {
        return entry;
      }
    }
  }

  return null;
}