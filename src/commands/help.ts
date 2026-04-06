import type { Command } from "commander";
import { loadRecipes } from "../core/kbStore";
import { formatRecipe } from "../core/format";
import { matchRecipe } from "../core/matchRecipe";

export function registerHelp(program: Command): void {
  program
    .command("help")
    .argument("<intent...>")
    .description("Get commands by intention")
    .action((intentParts: string[]) => {
      const intent = intentParts.join(" ");
      const recipes = loadRecipes();
      const recipe = matchRecipe(recipes, intent);

      if (!recipe) {
        console.log("No recipe found. Consider adding it to recipes.json and re-seeding.");
        return;
      }

      console.log(formatRecipe(recipe));
    });
}
