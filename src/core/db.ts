import Database from "better-sqlite3";
import path from "node:path";
import fs from "node:fs";

// DB lives alongside the JSON files: src/kb/kb.db (dev) → dist/kb/kb.db (prod).
// __dirname resolves to src/core (tsx/dev) or dist/core (built), so ../kb always points correctly.
const DB_PATH = path.join(__dirname, "..", "kb", "kb.db");

let _db: Database.Database | null = null;

export function getDb(): Database.Database {
  if (_db) return _db;

  if (!fs.existsSync(DB_PATH)) {
    throw new Error(
      `KB database not found at ${DB_PATH}.\nRun: npm run seed`
    );
  }

  _db = new Database(DB_PATH, { readonly: true });
  _db.pragma("journal_mode = WAL");

  return _db;
}

// ---------------------------------------------------------------------------
// Schema — called only by the seed script, not at runtime.
// ---------------------------------------------------------------------------

export function initSchema(db: Database.Database): void {
  db.exec(`
    -- Error entries (termcoach explain)
    CREATE TABLE IF NOT EXISTS errors (
      id          TEXT PRIMARY KEY,
      title       TEXT NOT NULL,
      patterns    TEXT NOT NULL DEFAULT '[]',   -- JSON: string[]
      summary     TEXT NOT NULL DEFAULT '',
      explain     TEXT NOT NULL DEFAULT '{}',   -- JSON: { what, why?, safe_options? }
      commands    TEXT DEFAULT '[]',            -- JSON: { os, cmd }[]
      warnings    TEXT DEFAULT '[]',            -- JSON: string[]
      priority    INTEGER DEFAULT 0,
      tags        TEXT DEFAULT '[]',            -- JSON: string[]
      safe        INTEGER DEFAULT 1,
      advanced    INTEGER DEFAULT 0
    );

    -- FTS5 on errors: title + summary + explain.what (extracted at seed time)
    CREATE VIRTUAL TABLE IF NOT EXISTS errors_fts USING fts5(
      id,
      title,
      summary,
      explain_what,
      tokenize = 'porter ascii'
    );

    -- Recipe entries (termcoach help) — stored in normalized KbRecipeEntry shape
    CREATE TABLE IF NOT EXISTS recipes (
      id       TEXT PRIMARY KEY,
      intent   TEXT NOT NULL,
      title    TEXT,
      aliases  TEXT DEFAULT '[]',   -- JSON: string[]
      steps    TEXT NOT NULL DEFAULT '[]',     -- JSON: string[]
      commands TEXT NOT NULL DEFAULT '[]',     -- JSON: { os, cmds[] }[]
      warnings TEXT DEFAULT '[]',             -- JSON: string[]
      priority INTEGER DEFAULT 0,
      tags     TEXT DEFAULT '[]',             -- JSON: string[]
      safe     INTEGER DEFAULT 1,
      advanced INTEGER DEFAULT 0
    );

    -- FTS5 on recipes: intent + title + aliases + tags
    CREATE VIRTUAL TABLE IF NOT EXISTS recipes_fts USING fts5(
      id,
      intent,
      title,
      aliases_text,
      tags_text,
      tokenize = 'porter ascii'
    );
  `);
}
