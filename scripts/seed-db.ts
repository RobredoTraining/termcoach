/**
 * seed-db.ts
 * Reads src/kb/errors.json and src/kb/recipes.json,
 * normalizes them (same logic as kbStore.ts), and writes src/kb/kb.db.
 *
 * Run via: npm run seed
 */

import Database from "better-sqlite3";
import fs from "node:fs";
import path from "node:path";
import { initSchema } from "../src/core/db";
import type { KbErrorEntry, KbRecipeEntry } from "../src/core/types";

const KB_DIR = path.join(__dirname, "..", "src", "kb");
const DB_PATH = path.join(KB_DIR, "kb.db");

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

function j(value: unknown): string {
  return JSON.stringify(value ?? []);
}

// ---------------------------------------------------------------------------
// Normalization (mirrors kbStore.ts so JSON source of truth stays unchanged)
// ---------------------------------------------------------------------------

type SupportedOs = "mac" | "linux";

type RawErrorEntry = {
  id: string;
  title: string;
  patterns?: string[] | string;
  pattern?: string;               // legacy single-pattern field
  summary?: string;
  explain?: KbErrorEntry["explain"];
  commands?: KbErrorEntry["commands"];
  warnings?: string[];
  priority?: number;
  tags?: string[];
  safe?: boolean;
  advanced?: boolean;
};

function normalizeError(raw: RawErrorEntry): KbErrorEntry {
  const patterns = Array.isArray(raw.patterns)
    ? raw.patterns
    : typeof raw.patterns === "string"
      ? [raw.patterns]
      : typeof raw.pattern === "string"
        ? [raw.pattern]
        : [];

  return {
    id: raw.id,
    title: raw.title,
    patterns,
    summary: raw.summary ?? "",
    explain: raw.explain ?? { what: "" },
    commands: raw.commands,
    warnings: raw.warnings,
    priority: raw.priority,
    tags: raw.tags,
    safe: raw.safe,
    advanced: raw.advanced,
  };
}

type RawRecipeEntry = {
  id?: string;
  intent: string;
  title?: string;
  aliases?: string[];
  steps: string[];
  commands: string[];
  os?: SupportedOs[];
  warnings?: string[];
  priority?: number;
  tags?: string[];
  safe?: boolean;
  advanced?: boolean;
};

function normalizeRecipe(raw: RawRecipeEntry): KbRecipeEntry {
  const targetOs: SupportedOs[] = raw.os?.length ? raw.os : ["mac", "linux"];

  return {
    id: raw.id ?? raw.intent.trim().toLowerCase().replace(/\s+/g, "-"),
    intent: raw.intent,
    title: raw.title,
    aliases: raw.aliases,
    steps: raw.steps,
    commands: targetOs.map((os) => ({ os, cmds: raw.commands })),
    warnings: raw.warnings,
    priority: raw.priority,
    tags: raw.tags,
    safe: raw.safe,
    advanced: raw.advanced,
  };
}

// ---------------------------------------------------------------------------
// Main
// ---------------------------------------------------------------------------

console.log("🌱 Seeding KB database...");

if (fs.existsSync(DB_PATH)) {
  fs.unlinkSync(DB_PATH);
  console.log("  ↳ Removed existing kb.db");
}

const db = new Database(DB_PATH);
db.pragma("journal_mode = WAL");
initSchema(db);
console.log("  ↳ Schema created");

// ---------------------------------------------------------------------------
// Seed errors
// ---------------------------------------------------------------------------

const rawErrors: RawErrorEntry[] = JSON.parse(
  fs.readFileSync(path.join(KB_DIR, "errors.json"), "utf8")
);
const errors = rawErrors.map(normalizeError);

const insertError = db.prepare(`
  INSERT INTO errors (id, title, patterns, summary, explain, commands, warnings, priority, tags, safe, advanced)
  VALUES (@id, @title, @patterns, @summary, @explain, @commands, @warnings, @priority, @tags, @safe, @advanced)
`);

const insertErrorFts = db.prepare(`
  INSERT INTO errors_fts (id, title, summary, explain_what)
  VALUES (@id, @title, @summary, @explain_what)
`);

const seedErrors = db.transaction((entries: KbErrorEntry[]) => {
  for (const e of entries) {
    insertError.run({
      id: e.id,
      title: e.title,
      patterns: j(e.patterns),
      summary: e.summary,
      explain: JSON.stringify(e.explain),
      commands: j(e.commands),
      warnings: j(e.warnings),
      priority: e.priority ?? 0,
      tags: j(e.tags),
      safe: e.safe !== false ? 1 : 0,
      advanced: e.advanced ? 1 : 0,
    });

    insertErrorFts.run({
      id: e.id,
      title: e.title,
      summary: e.summary,
      explain_what: e.explain?.what ?? "",
    });
  }
});

seedErrors(errors);
console.log(`  ↳ Seeded ${errors.length} error entries`);

// ---------------------------------------------------------------------------
// Seed recipes
// ---------------------------------------------------------------------------

const rawRecipes: RawRecipeEntry[] = JSON.parse(
  fs.readFileSync(path.join(KB_DIR, "recipes.json"), "utf8")
);
const recipes = rawRecipes.map(normalizeRecipe);

const insertRecipe = db.prepare(`
  INSERT INTO recipes (id, intent, title, aliases, steps, commands, warnings, priority, tags, safe, advanced)
  VALUES (@id, @intent, @title, @aliases, @steps, @commands, @warnings, @priority, @tags, @safe, @advanced)
`);

const insertRecipeFts = db.prepare(`
  INSERT INTO recipes_fts (id, intent, title, aliases_text, tags_text)
  VALUES (@id, @intent, @title, @aliases_text, @tags_text)
`);

const seedRecipes = db.transaction((entries: KbRecipeEntry[]) => {
  for (const r of entries) {
    insertRecipe.run({
      id: r.id,
      intent: r.intent,
      title: r.title ?? null,
      aliases: j(r.aliases),
      steps: j(r.steps),
      commands: j(r.commands),
      warnings: j(r.warnings),
      priority: r.priority ?? 0,
      tags: j(r.tags),
      safe: r.safe !== false ? 1 : 0,
      advanced: r.advanced ? 1 : 0,
    });

    insertRecipeFts.run({
      id: r.id,
      intent: r.intent,
      title: r.title ?? "",
      aliases_text: (r.aliases ?? []).join(" "),
      tags_text: (r.tags ?? []).join(" "),
    });
  }
});

seedRecipes(recipes);
console.log(`  ↳ Seeded ${recipes.length} recipe entries`);

db.close();
console.log(`✅ Done — kb.db written to ${DB_PATH}`);
