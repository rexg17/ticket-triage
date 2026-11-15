/**
 * Motor de triagem: lê o texto de um ticket e devolve um RASCUNHO de escalonamento ao N2.
 *
 * É determinístico e roda no navegador, sem chave de API e sem custo. A interface `Provider`
 * (em ../ai) permite trocar este motor por um modelo de linguagem real, mantendo o mesmo formato
 * de saída e o mesmo passo de aprovação humana.
 */
import { CATEGORIES, FALLBACK, LANG_WORDS, LOW, SINGLE, TRIED, URGENT, WIDE } from "./rules";
import type { CategoryRule } from "./rules";
import type { Draft, Lang, Tag } from "./types";

export function normalize(text: string): string {
  return text
    .toLowerCase()
    .normalize("NFD")
    .replace(/[̀-ͯ]/g, "")
    .replace(/\s+/g, " ")
    .trim();
}

function found(text: string, words: string[]): string[] {
  return words.filter((word) => text.includes(word));
}

export function detectLanguage(text: string): Lang {
  const tokens = new Set(normalize(text).split(/[^a-z]+/));
  const score = (lang: Lang) => LANG_WORDS[lang].filter((word) => tokens.has(word)).length;
  const ranked = (["pt", "es", "en"] as Lang[]).sort((a, b) => score(b) - score(a));
  return score(ranked[0]) === 0 ? "en" : ranked[0];
}

export function pickCategory(text: string): { rule: CategoryRule; hits: string[] } {
  let best: { rule: CategoryRule; hits: string[] } = { rule: FALLBACK, hits: [] };
  for (const rule of CATEGORIES) {
    const hits = found(text, rule.words);
    if (hits.length > best.hits.length) best = { rule, hits };
  }
  return best;
}

/** Códigos de erro, versões e identificadores de loja mencionados no texto. */
export function extractEvidence(raw: string): string[] {
  const evidence = new Set<string>();
  for (const match of raw.matchAll(/\b(?:erro|error|err)\s*[#:]?\s*([A-Za-z0-9-]{2,12})/gi)) {
    evidence.add(`Error code: ${match[1]}`);
  }
  for (const match of raw.matchAll(/\b(4\d\d|5\d\d)\b(?=\s*(?:error|erro|http)|\s*[-:]\s*\w)/gi)) {
    evidence.add(`HTTP status: ${match[1]}`);
  }
  for (const match of raw.matchAll(/\bv(?:ersao|ersion|ersión)?\s*\.?\s*(\d+(?:\.\d+){1,3})\b/gi)) {
    evidence.add(`Version: ${match[1]}`);
  }
  // Aceita singular e plural, e listas como "stores 3 and 8" ou "lojas 3, 5 e 9".
  for (const match of raw.matchAll(/\b(?:lojas?|tiendas?|stores?|filiais|filial|sucursal(?:es)?)\s*#?\s*(\d{1,5}(?:\s*(?:,|e|y|and|&)\s*\d{1,5})*)/gi)) {
    for (const id of match[1].match(/\d{1,5}/g) ?? []) evidence.add(`Store: ${id}`);
  }
  for (const match of raw.matchAll(/\b(\d{1,2}[:h]\d{2})\b/g)) {
    evidence.add(`Time mentioned: ${match[1]}`);
  }
  return [...evidence];
}

/** Frases em que a pessoa diz o que já tentou. */
export function extractTried(raw: string): string[] {
  const sentences = raw.split(/(?<=[.!?\n])\s+/);
  return sentences
    .map((sentence) => sentence.trim())
    .filter((sentence) => sentence && found(normalize(sentence), TRIED).length > 0)
    .slice(0, 4);
}

function decideTag(wide: boolean, hasUrgent: boolean, hasLow: boolean): { tag: Tag; priority: Draft["priority"] } {
  if (hasUrgent || (wide && !hasLow)) return { tag: "red", priority: "P1" };
  if (hasLow) return { tag: "green", priority: "P3" };
  return { tag: "yellow", priority: "P2" };
}

export function missingInfo(raw: string, evidence: string[]): string[] {
  const text = normalize(raw);
  const missing: string[] = [];
  if (!evidence.some((item) => item.startsWith("Error code") || item.startsWith("HTTP"))) {
    missing.push("Exact error message or code (a screenshot helps)");
  }
  if (!evidence.some((item) => item.startsWith("Version"))) {
    missing.push("Application and operating system version");
  }
  if (!/(desde|since|apos|depois|despues|after|hoje|today|ontem|ayer|yesterday|comecou|empezo|started|\d{1,2}[:h]\d{2})/.test(text)) {
    missing.push("When it started and whether anything changed before that");
  }
  if (!/(passo|paso|step|quando eu|cuando|when i|ao clicar|al hacer|when clicking|reproduz|reproduc)/.test(text)) {
    missing.push("Steps to reproduce the problem");
  }
  if (found(text, [...WIDE, ...SINGLE]).length === 0) {
    missing.push("How many users or machines are affected");
  }
  return missing;
}

function buildNote(draft: Omit<Draft, "note">): string {
  const lines = [
    `[${draft.priority}] ${draft.title}`,
    `Category: ${draft.category.label} | Language of ticket: ${draft.lang.toUpperCase()} | Scope: ${draft.scope}`,
    "",
    "SUMMARY",
    draft.summary,
    "",
    "EVIDENCE",
    ...(draft.evidence.length ? draft.evidence.map((item) => `- ${item}`) : ["- (none provided)"]),
    "",
    "ALREADY TRIED BY N1",
    ...(draft.alreadyTried.length ? draft.alreadyTried.map((item) => `- ${item}`) : ["- (not reported)"]),
    "",
    "STILL MISSING (ask the customer)",
    ...(draft.missing.length ? draft.missing.map((item) => `- ${item}`) : ["- Nothing critical"]),
    "",
    "N1 CHECKS BEFORE ESCALATING",
    ...draft.checks.map((item) => `- [ ] ${item}`),
  ];
  return lines.join("\n");
}

/** Resumo curto: as duas primeiras frases com conteúdo, limitado a ~220 caracteres. */
export function summarize(raw: string): string {
  const sentences = raw
    .replace(/\s+/g, " ")
    .split(/(?<=[.!?])\s+/)
    .filter((sentence) => sentence.length > 12);
  const text = (sentences.slice(0, 2).join(" ") || raw.trim()).trim();
  return text.length > 220 ? `${text.slice(0, 217).trimEnd()}...` : text;
}

export function triage(raw: string): Draft {
  const text = normalize(raw);
  const lang = detectLanguage(raw);
  const { rule, hits } = pickCategory(text);

  const urgent = found(text, URGENT);
  const wide = found(text, WIDE);
  const single = found(text, SINGLE);
  const low = found(text, LOW);

  const scope: Draft["scope"] = wide.length > 0 && single.length === 0 ? "wide" : single.length > 0 ? "single" : "unknown";
  const { tag, priority } = decideTag(scope === "wide", urgent.length > 0, low.length > 0 && urgent.length === 0);

  const evidence = extractEvidence(raw);
  const alreadyTried = extractTried(raw);
  const missing = missingInfo(raw, evidence);

  const signals = [
    ...hits.slice(0, 4).map((word) => `category word: "${word.trim()}"`),
    ...urgent.slice(0, 2).map((word) => `urgency: "${word}"`),
    ...wide.slice(0, 1).map((word) => `wide impact: "${word}"`),
    ...low.slice(0, 1).map((word) => `low urgency: "${word}"`),
  ];

  // Confiança: sobe com sinais de categoria e evidências concretas; cai com informação faltando.
  const confidence = Math.max(
    15,
    Math.min(95, 30 + hits.length * 12 + evidence.length * 8 - missing.length * 4 + (urgent.length > 0 ? 6 : 0)),
  );

  const base: Omit<Draft, "note"> = {
    lang,
    category: rule.category,
    tag,
    priority,
    scope,
    title: `${rule.category.label}: ${summarize(raw).split(/[.!?]/)[0].slice(0, 80).trim() || "incident"}`,
    summary: summarize(raw),
    evidence,
    alreadyTried,
    missing,
    checks: rule.checks,
    confidence,
    signals,
  };
  return { ...base, note: buildNote(base) };
}
