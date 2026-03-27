import type { Command } from "commander";
import { loadKb } from "../core/kbStore";
import { formatRecipe } from "../core/format";
import { matchRecipe } from "../core/matchRecipe";

export function registerHelp(program: Command) {
  program
    .command("help")
    .argument("<intent...>")
    .description("Get commands by intention")
    .action(async (intentParts: string[]) => {
      const intent = intentParts.join(" ");
      const kb = await loadKb();

      const recipe = matchRecipe(kb.recipes, intent);

      if (!recipe) {
        console.log("No recipe found.");
        return;
      }

      console.log(formatRecipe(recipe));
    });
}