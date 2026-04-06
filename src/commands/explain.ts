import type { Command } from "commander";
import { loadErrors } from "../core/kbStore";
import { matchByRegex } from "../core/matchRegex";
import { formatExplain } from "../core/format";

export function registerExplain(program: Command): void {
  program
    .command("explain")
    .description("Explain a terminal error message")
    .option("-e, --error <text>", "Error text to explain")
    .action((opts) => {
      const errorText = opts.error?.trim();

      if (!errorText) {
        console.error('Please provide the error text with --error "<message>"');
        process.exit(1);
      }

      const errors = loadErrors();
      const match = matchByRegex(errors, errorText);

      if (!match) {
        console.log("No match found for that error. Consider adding it to errors.json and re-seeding.");
        return;
      }

      console.log(formatExplain(match));
    });
}
