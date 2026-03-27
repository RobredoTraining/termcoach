import fs from "node:fs/promises";
import path from "node:path";
import type { Kb, KbErrorEntry, KbRecipeEntry } from "./types";

/**
 * In dev: this file runs from src/core (via tsx),
 * but __dirname still points to compiled location when built (dist/core).
 * KB files are expected next to dist/core, inside dist/kb.
 */
const KB_DIR = path.join(__dirname, "..", "kb");

type SupportedOs = "mac" | "linux";


// Raw errors can come in multiple shapes while iterating on the KB.
type RawErrorEntry =
  | (KbErrorEntry & { pattern?: never })
  | (Omit<KbErrorEntry, "patterns"> & { pattern: string; patterns?: never })
  | (Omit<KbErrorEntry, "patterns"> & { patterns: string });

function normalizeError(raw: RawErrorEntry): KbErrorEntry {
  // Support legacy "pattern" (string) and also tolerate "patterns" as a string.
  const patterns =
    Array.isArray((raw as any).patterns)
      ? (raw as any).patterns
      : typeof (raw as any).patterns === "string"
        ? [(raw as any).patterns]
        : typeof (raw as any).pattern === "string"
          ? [(raw as any).pattern]
          : [];

  return {
    id: raw.id,
    title: raw.title,
    patterns,
    summary: raw.summary,
    explain: raw.explain,
    commands: raw.commands,
    warnings: raw.warnings,
    priority: raw.priority,
    tags: raw.tags,
    safe: raw.safe,
    advanced: raw.advanced,
  };
}

// Raw recipe shape from recipes.json before normalization.
// This reflects the current file format (flat commands + os list).
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

// Convert the flat recipe JSON shape into the app's typed recipe shape.
function normalizeRecipe(raw: RawRecipeEntry): KbRecipeEntry {
  const targetOs: SupportedOs[] = raw.os?.length ? raw.os : ["mac", "linux"];

  return {
    id: raw.id ?? raw.intent.trim().toLowerCase().replace(/\s+/g, "-"),
    intent: raw.intent,
    title: raw.title,
    aliases: raw.aliases,
    steps: raw.steps,
    commands: targetOs.map((os) => ({
      os,
      cmds: raw.commands,
    })),
    warnings: raw.warnings,
    priority: raw.priority,
    tags: raw.tags,
    safe: raw.safe,
    advanced: raw.advanced,
  };
}

export async function loadKb(): Promise<Kb> {
  const errorsPath = path.join(KB_DIR, "errors.json");
  const recipesPath = path.join(KB_DIR, "recipes.json");

  const errorsRaw = await fs.readFile(errorsPath, "utf8");
  const recipesRaw = await fs.readFile(recipesPath, "utf8");

  // Parse raw JSON arrays from disk.
  const parsedErrors = JSON.parse(errorsRaw) as KbErrorEntry[];
  const parsedRecipes = JSON.parse(recipesRaw) as RawRecipeEntry[];

  // Normalize recipes to the internal app shape expected by formatters/commands.
  const normalizedRecipes = parsedRecipes.map(normalizeRecipe);

  return {
    errors: parsedErrors,
    recipes: normalizedRecipes,
  };
}