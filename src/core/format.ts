import type { KbErrorEntry, KbRecipeEntry } from "./types";

export function formatExplain(entry: KbErrorEntry): string {
  let output = `🤖 ${entry.title}\n\n`;

  output += `What happened\n${entry.explain.what}\n\n`;

  if (entry.explain.why?.length) {
    output += "Why it happens\n";
    entry.explain.why.forEach((reason) => {
      output += `- ${reason}\n`;
    });
    output += "\n";
  }

  if (entry.explain.safe_options?.length) {
    output += "Safe options\n";
    entry.explain.safe_options.forEach((opt, i) => {
      output += `${i + 1}. ${opt}\n`;
    });
    output += "\n";
  }

  if (entry.commands?.length) {
    output += "Common commands\n";
    entry.commands.forEach((c) => {
      output += `- (${c.os}) ${c.cmd}\n`;
    });
    output += "\n";
  }

  if (entry.warnings?.length) {
    output += "⚠️ Warnings\n";
    entry.warnings.forEach((w) => {
      output += `- ${w}\n`;
    });
  }

  return output;
}

export function formatRecipe(entry: KbRecipeEntry): string {
  const header = entry.title?.trim() ? entry.title : entry.intent;
  let output = `🧭 ${header}\n\n`;

  output += "Steps\n";
  entry.steps.forEach((step, i) => {
    output += `${i + 1}. ${step}\n`;
  });

  if (entry.commands?.length) {
    output += "\nCommands\n";
    entry.commands.forEach((group) => {
      output += `- (${group.os})\n`;
      group.cmds.forEach((cmd) => {
        output += `  - ${cmd}\n`;
      });
    });
  }

  if (entry.warnings?.length) {
    output += "\n⚠️ Warnings\n";
    entry.warnings.forEach((w) => {
      output += `- ${w}\n`;
    });
  }

  return output;
}