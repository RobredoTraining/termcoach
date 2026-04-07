import { getDb } from "./db";
import { deserializeRecipe, type RawRecipeRow } from "./kbStore";
import { normalizeText } from "./normalize";
import type { KbRecipeEntry } from "./types";

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

/** Extract only alphanumeric/underscore tokens — bulletproof for FTS5. */
function sanitizeForFts(text: string): string {
  const tokens = normalizeText(text).match(/[a-z0-9_]+/g) ?? [];
  return tokens.join(" ");
}

// ---------------------------------------------------------------------------
// matchRecipeLocal — the original scoring matcher, kept as a fallback
// when FTS5 is unavailable or fails (bad tokens, DB error, etc.).
// ---------------------------------------------------------------------------

type ScoredRecipe = {
  entry: KbRecipeEntry;
  score: number;
  priority: number;
};

function matchRecipeLocal(recipes: KbRecipeEntry[], rawIntent: string): KbRecipeEntry | null {
  const input = normalizeText(rawIntent);
  if (!input) return null;

  const candidates: ScoredRecipe[] = [];

  for (const entry of recipes) {
    const intent = normalizeText(entry.intent);
    const aliases = (entry.aliases ?? []).map(normalizeText);
    const tags = (entry.tags ?? []).map(normalizeText);
    const priority = entry.priority ?? 0;

    let score = 0;

    if (intent === input) {
      score = 100;
    } else if (intent.includes(input) || input.includes(intent)) {
      score = 80;
    } else if (aliases.includes(input)) {
      score = 70;
    } else if (aliases.some((a) => a.includes(input) || input.includes(a))) {
      score = 60;
    } else if (tags.includes(input)) {
      score = 40;
    } else if (tags.some((t) => t.includes(input) || input.includes(t))) {
      score = 30;
    }

    if (score > 0) {
      candidates.push({ entry, score, priority });
    }
  }

  if (candidates.length === 0) return null;

  candidates.sort((a, b) => {
    if (b.score !== a.score) return b.score - a.score;
    return b.priority - a.priority;
  });

  return candidates[0].entry;
}

// ---------------------------------------------------------------------------
// matchRecipe — FTS5 BM25 primary, local scoring fallback
//
// FTS5 indexes intent + title + aliases + tags and ranks with BM25.
// If FTS5 fails (parse error, bad tokens) → fall back to the local scorer.
// ---------------------------------------------------------------------------

export function matchRecipe(recipes: KbRecipeEntry[], rawIntent: string): KbRecipeEntry | null {
  const sanitized = sanitizeForFts(rawIntent);
  if (!sanitized) return matchRecipeLocal(recipes, rawIntent);

  const db = getDb();

  try {
    const row = db
      .prepare(
        `SELECT r.*
         FROM recipes r
         JOIN (
           SELECT id
           FROM recipes_fts
           WHERE recipes_fts MATCH ?
           ORDER BY bm25(recipes_fts)
           LIMIT 1
         ) fts ON r.id = fts.id`
      )
      .get(sanitized) as RawRecipeRow | undefined;

    if (row) return deserializeRecipe(row);

    // FTS returned no rows — try local scoring as a last resort.
    return matchRecipeLocal(recipes, rawIntent);
  } catch {
    // FTS5 query failed — fall back to local scoring (never go blind).
    return matchRecipeLocal(recipes, rawIntent);
  }
}