import type { KbErrorEntry } from "./types";

// Match an input error string against KB regex patterns.
// Returns the first matching KB entry or null if nothing matches.
export function matchByRegex(errors: KbErrorEntry[], text: string): KbErrorEntry | null {
  // Defensive fallback avoids runtime issues with nullish input.
  const input = text ?? "";

  for (const entry of errors) {
    for (const pattern of entry.patterns) {
      try {
        // Compile each pattern as case-insensitive regex.
        const regex = new RegExp(pattern, "i");

        // Return the first matching entry to keep behavior predictable.
        if (regex.test(input)) {
          return entry;
        }
      } catch {
        // Skip invalid regex patterns so one bad KB entry
        // does not crash the whole explain command.
        continue;
      }
    }
  }

  // No regex match found in the KB.
  return null;
}