import fs from "fs/promises";
import path from "path";
import type { Kb } from "./types";

export async function loadKb(): Promise<Kb> {
  const errorsRaw = await fs.readFile(path.join("kb", "errors.json"), "utf8");
  const recipesRaw = await fs.readFile(path.join("kb", "recipes.json"), "utf8");

  return {
    errors: JSON.parse(errorsRaw),
    recipes: JSON.parse(recipesRaw)
  };
}