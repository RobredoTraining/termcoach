import { getDb } from "./db";
import { deserializeRecipe, type RawRecipeRow } from "./kbStore";
import { normalizeText } from "./normalize";
import type { KbRecipeEntry } from "./types";

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

/** Strip FTS5 operator chars so natural-language intent strings query safely. */
function sanitizeForFts(text: string): string {
  return normalizeText(text)
    .replace(/["\-+*^():<>]/g, " ")
    .replace(/\s+/g, " ")
    .trim();
}

// ---------------------------------------------------------------------------
// matchRecipe — FTS5 BM25 search
//
// Replaces the old hand-crafted scoring loop.
// FTS5 indexes intent + title + aliases + tags and ranks results with BM25
// automatically — stemming, partial matches, and synonym-like tokens work
// out of the box via the porter tokenizer.
//
// The `recipes` param is kept for API compatibility with the old signature
// but the actual search hits SQLite.
// ---------------------------------------------------------------------------

export function matchRecipe(_recipes: KbRecipeEntry[], rawIntent: string): KbRecipeEntry | null {
  const sanitized = sanitizeForFts(rawIntent);
  if (!sanitized) return null;

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

    return row ? deserializeRecipe(row) : null;
  } catch {
    // FTS5 query failed — bad tokens or empty result.
    return null;
  }
}