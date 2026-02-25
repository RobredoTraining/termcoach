import fs from "node:fs/promises";
import path from "node:path";
import type { Kb } from "./types";

/**
 * In dev: this file runs from src/core (via tsx),
 * but __dirname still points to compiled location when built (dist/core).
 * We want KB to live next to dist/ as dist/kb.
 */
const KB_DIR = path.join(__dirname, "..", "kb"); // dist/kb

export async function loadKb(): Promise<Kb> {
  const errorsPath = path.join(KB_DIR, "errors.json");
  const recipesPath = path.join(KB_DIR, "recipes.json");

  const errorsRaw = await fs.readFile(errorsPath, "utf8");
  const recipesRaw = await fs.readFile(recipesPath, "utf8");

  return {
    errors: JSON.parse(errorsRaw),
    recipes: JSON.parse(recipesRaw)                                                            
  };
}