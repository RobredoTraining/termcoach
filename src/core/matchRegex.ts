import { getDb } from "./db";
import { deserializeError, type RawErrorRow } from "./kbStore";
import { normalizeText } from "./normalize";
import type { KbErrorEntry } from "./types";

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

/**
 * Extract only alphanumeric/underscore tokens — bulletproof for FTS5.
 * CLI error strings are full of symbols, colons, slashes, IPs, etc. that
 * trip FTS5 query parsing. Extracting tokens avoids all of that.
 */
function sanitizeForFts(text: string): string {
  const tokens = normalizeText(text).match(/[a-z0-9_]+/g) ?? [];
  return tokens.join(" ");
}

/** Test a single regex pattern against input, swallowing compile/runtime errors. */
function safeRegexTest(pattern: string, input: string): boolean {
  try {
    return new RegExp(pattern, "i").test(input);
  } catch {
    return false;
  }
}

/** Max candidates to rerank via FTS5 before hitting SQLite param limits. */
const MAX_RERANK_CANDIDATES = 200;

// ---------------------------------------------------------------------------
// matchByRegex — hybrid regex + FTS5 matcher
//
// Step 1: Collect ALL regex matches (not just the first).
// Step 2: If exactly one → return it.
// Step 3: If multiple  → rerank with FTS5 BM25 over candidate IDs only.
//         Guard: skip rerank if candidate set exceeds MAX_RERANK_CANDIDATES.
// Step 4: If none       → open FTS5 search as a fuzzy fallback.
// Step 5: If FTS fails  → fall back to priority winner / null.
// ---------------------------------------------------------------------------

export function matchByRegex(errors: KbErrorEntry[], text: string): KbErrorEntry | null {
  const inputRaw = text ?? "";
  const sanitized = sanitizeForFts(inputRaw);

  // Step 1 — collect every entry whose regex patterns match the input.
  const candidates = errors.filter(
    (entry) =>
      Array.isArray(entry.patterns) &&
      entry.patterns.some((p) => safeRegexTest(p, inputRaw))
  );

  // Step 2 — single match: return immediately, no ranking needed.
  if (candidates.length === 1) return candidates[0];

  // Pre-sort by priority DESC for consistent fallback behaviour.
  const byPriority = [...candidates].sort(
    (a, b) => (b.priority ?? 0) - (a.priority ?? 0)
  );
  const priorityWinner = byPriority[0] ?? null;

  const db = getDb();

  // Step 3 — multiple regex matches: rerank with FTS5 BM25 over just those IDs.
  // Guard: if the candidate set is too large, skip FTS reranking to avoid
  // hitting SQLite's default parameter limit (~999) and return priority winner.
  if (candidates.length > 1 && sanitized) {
    if (candidates.length > MAX_RERANK_CANDIDATES) {
      return priorityWinner;
    }

    try {
      const placeholders = candidates.map(() => "?").join(", ");
      const sql = `
        SELECT e.*
        FROM errors e
        JOIN (
          SELECT id
          FROM errors_fts
          WHERE errors_fts MATCH ?
            AND id IN (${placeholders})
          ORDER BY bm25(errors_fts)
          LIMIT 1
        ) fts ON e.id = fts.id
      `;
      const params = [sanitized, ...candidates.map((c) => c.id)];
      const row = db.prepare(sql).get(...params) as RawErrorRow | undefined;

      return row ? deserializeError(row) : priorityWinner;
    } catch {
      // FTS5 query failed — fall through to priority winner.
      return priorityWinner;
    }
  }

  // Step 4 — no regex match: open FTS5 search across the full errors table.
  if (!sanitized) return null;

  try {
    const row = db
      .prepare(
        `SELECT e.*
         FROM errors e
         JOIN (
           SELECT id
           FROM errors_fts
           WHERE errors_fts MATCH ?
           ORDER BY bm25(errors_fts)
           LIMIT 1
         ) fts ON e.id = fts.id`
      )
      .get(sanitized) as RawErrorRow | undefined;

    return row ? deserializeError(row) : null;
  } catch {
    // FTS5 query failed — nothing we can do.
    return null;
  }
}