// Centralised debug utility.
// Activate with: TERMCOACH_DEBUG=1 termcoach explain -e "..."

const enabled = process.env.TERMCOACH_DEBUG === "1";

export function isDebug(): boolean {
  return enabled;
}

/** Print a labelled debug line to stderr (keeps stdout clean for normal output). */
export function dbg(label: string, value?: unknown): void {
  if (!enabled) return;

  const prefix = `\x1b[90m[debug]\x1b[0m`;

  if (value === undefined) {
    process.stderr.write(`${prefix} ${label}\n`);
    return;
  }

  const formatted =
    typeof value === "string"
      ? value
      : JSON.stringify(value, null, 2);

  process.stderr.write(`${prefix} ${label}: ${formatted}\n`);
}
