const KEY = "triage-desk:history";

export interface Escalation {
  id: string;
  at: string;
  title: string;
  priority: string;
  tag: "red" | "yellow" | "green";
  note: string;
}

// localStorage pode lançar erro (modo privado, dados bloqueados): a aplicação funciona sem ele.
export function loadHistory(): Escalation[] {
  try {
    const raw = window.localStorage.getItem(KEY);
    return raw ? (JSON.parse(raw) as Escalation[]) : [];
  } catch {
    return [];
  }
}

export function saveHistory(items: Escalation[]): void {
  try {
    window.localStorage.setItem(KEY, JSON.stringify(items.slice(0, 30)));
  } catch {
    /* sem armazenamento: o histórico vale só para esta sessão */
  }
}
