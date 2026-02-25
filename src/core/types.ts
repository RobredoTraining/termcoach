// Structured sections used by the explain command output.
export type ExplainSections = {
  what: string;
  why?: string[];
  safe_options?: string[];
};

// Shared metadata for optional filtering/ranking features.
// Kept optional so existing KB entries remain valid.
export type KbMetadata = {
  priority?: number;
  tags?: string[];
  safe?: boolean;
  advanced?: boolean;
};

// Single OS-specific command entry for explain KB items.
export type KbExplainCommand = {
  os: "mac" | "linux";
  cmd: string;
};

// Single OS-specific command group for help KB recipes.
export type KbRecipeCommandGroup = {
  os: "mac" | "linux";
  cmds: string[];
};

// Error entry used by `termcoach explain`.
export type KbErrorEntry = {
  id: string;
  title: string;
  patterns: string[];
  summary: string;
  explain: ExplainSections;
  commands?: KbExplainCommand[];
  warnings?: string[];

  // Optional metadata supports future ranking/filtering
  // without breaking the current KB schema.
  priority?: number;
  tags?: string[];
  safe?: boolean;
  advanced?: boolean;
};

// Recipe entry used by `termcoach help`.
export type KbRecipeEntry = {
  id: string;
  intent: string;
  title: string;
  aliases?: string[];
  steps: string[];
  commands: KbRecipeCommandGroup[];
  warnings?: string[];

  // Optional metadata supports future CLI flags such as
  // --safe / --advanced and better matching/ranking.
  priority?: number;
  tags?: string[];
  safe?: boolean;
  advanced?: boolean;
};

// Root KB container if both files are loaded together.
export type Kb = {
  errors: KbErrorEntry[];
  recipes: KbRecipeEntry[];
};