import type { Command } from "commander";
import { loadKb } from "../core/kbStore";
import { formatRecipe } from "../core/format";

export function registerHelp(program: Command) {
  program
    .command("help")
    .argument("<intent...>")
    .description("Get commands by intention")
    .action(async (intentParts: string[]) => {
      const intent = intentParts.join(" ").toLowerCase();
      const kb = await loadKb();

      const recipe = kb.recipes.find(r =>
        r.intent.toLowerCase() === intent ||
        r.aliases?.some(a => a.toLowerCase() === intent)
      );

      if (!recipe) {
        console.log("No recipe found.");
        return;
      }

      console.log(formatRecipe(recipe));
    });
}