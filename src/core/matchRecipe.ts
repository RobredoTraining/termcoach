import type { KbRecipeEntry } from "./types";
import { normalizeText } from "./normalize";

type ScoredRecipe = {
  entry: KbRecipeEntry;
  score: number;
  priority: number;
};

// Match user intent against recipes using a simple scoring strategy.
// Returns the best KB recipe or null when no match is found.
export function matchRecipe(recipes: KbRecipeEntry[], rawIntent: string): KbRecipeEntry | null {
  const input = normalizeText(rawIntent);

  if (!input) {
    return null;
  }

  const candidates: ScoredRecipe[] = [];

  for (const entry of recipes) {
    const intent = normalizeText(entry.intent);
    const aliases = (entry.aliases ?? []).map(normalizeText);
    const tags = (entry.tags ?? []).map(normalizeText);
    const priority = entry.priority ?? 0;

    let score = 0;

    // Strongest match: exact intent.
    if (intent === input) {
      score = 100;
    }
    // Strong match: intent contains input or input contains intent.
    else if (intent.includes(input) || input.includes(intent)) {
      score = 80;
    }
    // Alias exact match.
    else if (aliases.includes(input)) {
      score = 70;
    }
    // Alias partial match.
    else if (aliases.some((alias) => alias.includes(input) || input.includes(alias))) {
      score = 60;
    }
    // Tag exact match.
    else if (tags.includes(input)) {
      score = 40;
    }
    // Tag partial match.
    else if (tags.some((tag) => tag.includes(input) || input.includes(tag))) {
      score = 30;
    }

    // Keep only matched entries.
    if (score > 0) {
      candidates.push({ entry, score, priority });
    }
  }

  if (candidates.length === 0) {
    return null;
  }

  // Sort by score first, then by priority.
  candidates.sort((a, b) => {
    if (b.score !== a.score) return b.score - a.score;
    return b.priority - a.priority;
  });

  return candidates[0].entry;
}