export type Lang = "en" | "es" | "pt";

/** Cores da etiqueta de triagem, da mais urgente (red) à menos (green). */
export type Tag = "red" | "yellow" | "green";

export interface Category {
  id: string;
  label: string;
}

export interface Draft {
  lang: Lang;
  category: Category;
  tag: Tag;
  priority: "P1" | "P2" | "P3";
  scope: "wide" | "single" | "unknown";
  title: string;
  summary: string;
  evidence: string[];
  alreadyTried: string[];
  missing: string[];
  checks: string[];
  note: string;
  confidence: number; // 0 a 100
  signals: string[]; // o que o motor encontrou, para explicar o rascunho
}
