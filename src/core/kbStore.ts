import { getDb } from "./db";
import type { KbErrorEntry, KbRecipeEntry } from "./types";

// ---------------------------------------------------------------------------
// Raw DB row shapes — all JSON arrays/objects stored as serialized strings.
// ---------------------------------------------------------------------------

type RawErrorRow = {
  id: string;
  title: string;
  patterns: string;   // JSON: string[]
  summary: string;
  explain: string;    // JSON: { what, why?, safe_options? }
  commands: string;   // JSON: { os, cmd }[]
  warnings: string;   // JSON: string[]
  priority: number;
  tags: string;       // JSON: string[]
  safe: number;
  advanced: number;
};

type RawRecipeRow = {
  id: string;
  intent: string;
  title: string | null;
  aliases: string;    // JSON: string[]
  steps: string;      // JSON: string[]
  commands: string;   // JSON: { os, cmds[] }[]
  warnings: string;   // JSON: string[]
  priority: number;
  tags: string;       // JSON: string[]
  safe: number;
  advanced: number;
};

// ---------------------------------------------------------------------------
// Deserializers — convert raw DB rows back to typed app objects.
// ---------------------------------------------------------------------------

function deserializeError(row: RawErrorRow): KbErrorEntry {
  return {
    id: row.id,
    title: row.title,
    patterns: JSON.parse(row.patterns),
    summary: row.summary,
    explain: JSON.parse(row.explain),
    commands: JSON.parse(row.commands),
    warnings: JSON.parse(row.warnings),
    priority: row.priority,
    tags: JSON.parse(row.tags),
    safe: row.safe === 1,
    advanced: row.advanced === 1,
  };
}

function deserializeRecipe(row: RawRecipeRow): KbRecipeEntry {
  return {
    id: row.id,
    intent: row.intent,
    title: row.title ?? undefined,
    aliases: JSON.parse(row.aliases),
    steps: JSON.parse(row.steps),
    commands: JSON.parse(row.commands),
    warnings: JSON.parse(row.warnings),
    priority: row.priority,
    tags: JSON.parse(row.tags),
    safe: row.safe === 1,
    advanced: row.advanced === 1,
  };
}

// ---------------------------------------------------------------------------
// Public loaders — used by matchers and commands.
// ---------------------------------------------------------------------------

export function loadErrors(): KbErrorEntry[] {
  const db = getDb();
  const rows = db
    .prepare("SELECT * FROM errors ORDER BY priority DESC")
    .all() as RawErrorRow[];
  return rows.map(deserializeError);
}

export function loadRecipes(): KbRecipeEntry[] {
  const db = getDb();
  const rows = db
    .prepare("SELECT * FROM recipes ORDER BY priority DESC")
    .all() as RawRecipeRow[];
  return rows.map(deserializeRecipe);
}

// ---------------------------------------------------------------------------
// Internal helpers used by matchers (avoid re-exporting raw row types).
// ---------------------------------------------------------------------------

export { deserializeError, deserializeRecipe };
export type { RawErrorRow, RawRecipeRow };
