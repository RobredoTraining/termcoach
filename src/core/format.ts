import type { KbErrorEntry, KbRecipeEntry } from "./types";

export function formatExplain(entry: KbErrorEntry): string {
  let output = `🤖 ${entry.title}\n\n`;

  output += `Qué ha pasado\n${entry.explain.what}\n\n`;

  if (entry.explain.why) {
    output += "Por qué suele pasar\n";
    entry.explain.why.forEach(w => {
      output += `- ${w}\n`;
    });
    output += "\n";
  }

  if (entry.explain.safe_options) {
    output += "Opciones seguras\n";
    entry.explain.safe_options.forEach((opt, i) => {
      output += `${i + 1}. ${opt}\n`;
    });
    output += "\n";
  }

  if (entry.commands) {
    output += "Comandos típicos\n";
    entry.commands.forEach(c => {
      output += `- (${c.os}) ${c.cmd}\n`;
    });
    output += "\n";
  }

  if (entry.warnings) {
    output += "⚠️ Advertencias\n";
    entry.warnings.forEach(w => {
      output += `- ${w}\n`;
    });
  }

  return output;
}

export function formatRecipe(entry: KbRecipeEntry): string {
  let output = `🧭 ${entry.intent}\n\n`;

  output += "Pasos\n";
  entry.steps.forEach((step, i) => {
    output += `${i + 1}. ${step}\n`;
  });

  output += "\nComandos\n";
  entry.commands[0].cmds.forEach(cmd => {
    output += `- ${cmd}\n`;
  });

  if (entry.warnings) {
    output += "\n⚠️ Advertencias\n";
    entry.warnings.forEach(w => {
      output += `- ${w}\n`;
    });
  }

  return output;
}