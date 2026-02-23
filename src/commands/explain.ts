import type { Command } from "commander";
import { loadKb } from "../core/kbStore";
import { matchByRegex } from "../core/matchRegex";
import { formatExplain } from "../core/format";

export function registerExplain(program: Command) {
  program
    .command("explain")
    .description("Explain an error message")
    .option("-e, --error <text>", "Provide error text")
    .action(async (opts) => {
      if (!opts.error) {
        console.error("Provide error with --error");
        process.exit(1);
      }

      const kb = await loadKb();
      const match = matchByRegex(kb.errors, opts.error);

      if (!match) {
        console.log("No match found.");
        return;
      }

      console.log(formatExplain(match));
    });
}