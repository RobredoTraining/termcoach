export type ExplainSections = {
    what: string;
    why?: string[];
    safe_options?: string[];
  };
  
  export type KbErrorEntry = {
    id: string;
    title: string;
    patterns: string[];
    summary: string;
    explain: ExplainSections;
    commands?: Array<{ os: "mac" | "linux"; cmd: string }>;
    warnings?: string[];
  };
  
  export type KbRecipeEntry = {
    id: string;
    intent: string;
    aliases?: string[];
    steps: string[];
    commands: Array<{ os: "mac" | "linux"; cmds: string[] }>;
    warnings?: string[];
  };
  
  export type Kb = {
    errors: KbErrorEntry[];
    recipes: KbRecipeEntry[];
  };