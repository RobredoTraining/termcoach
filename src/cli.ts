import { Command } from "commander";
import { registerExplain } from "./commands/explain";
import { registerHelp } from "./commands/help";

export async function runCli(argv: string[]) {
  const program = new Command();

  program
    .name("termcoach")
    .description("Terminal copilot: explain errors and recall commands by intent.")
    .version("0.1.0");

  registerExplain(program);
  registerHelp(program);

  await program.parseAsync(argv);
}