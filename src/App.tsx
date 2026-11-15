import { useCallback, useEffect, useMemo, useState } from "react";
import { localProvider } from "./ai/provider";
import { SAMPLES } from "./engine/samples";
import type { Draft, Tag } from "./engine/types";
import Gauge from "./ui/Gauge";
import { loadHistory, saveHistory } from "./ui/history";
import type { Escalation } from "./ui/history";

const PRIORITY_TAG: Record<Draft["priority"], Tag> = { P1: "red", P2: "yellow", P3: "green" };
const TAG_NAME: Record<Tag, string> = { red: "IMMEDIATE", yellow: "URGENT", green: "ROUTINE" };

type Theme = "day" | "night";

function initialTheme(): Theme {
  // ?theme=night abre direto no turno da noite (útil para links e capturas de tela).
  const asked = new URLSearchParams(window.location.search).get("theme");
  if (asked === "day" || asked === "night") return asked;
  try {
    const saved = window.localStorage.getItem("triage-desk:theme");
    if (saved === "day" || saved === "night") return saved;
  } catch {
    /* sem armazenamento: segue a preferência do sistema */
  }
  return window.matchMedia?.("(prefers-color-scheme: dark)").matches ? "night" : "day";
}

export default function App() {
  const [theme, setTheme] = useState<Theme>(initialTheme);
  const [text, setText] = useState(SAMPLES[0].text);
  const [activeId, setActiveId] = useState<string | null>(SAMPLES[0].id);
  const [draft, setDraft] = useState<Draft | null>(null);
  const [priority, setPriority] = useState<Draft["priority"]>("P2");
  const [note, setNote] = useState("");
  const [checked, setChecked] = useState<Record<string, boolean>>({});
  const [approved, setApproved] = useState(false);
  const [copied, setCopied] = useState(false);
  const [history, setHistory] = useState<Escalation[]>(() => loadHistory());

  useEffect(() => {
    document.documentElement.dataset.theme = theme;
    try {
      window.localStorage.setItem("triage-desk:theme", theme);
    } catch {
      /* o tema vale só para esta visita */
    }
  }, [theme]);

  // Cada mudança no texto do ticket gera um rascunho novo. As edições da nota valem até o texto mudar.
  useEffect(() => {
    let cancelled = false;
    if (!text.trim()) {
      setDraft(null);
      return;
    }
    localProvider.draft(text).then((result) => {
      if (cancelled) return;
      setDraft(result);
      setPriority(result.priority);
      setChecked({});
      setApproved(false);
      setNote(result.note);
    });
    return () => {
      cancelled = true;
    };
  }, [text]);

  const tag: Tag = PRIORITY_TAG[priority];
  const pendingChecks = useMemo(() => (draft ? draft.checks.filter((item) => !checked[item]).length : 0), [draft, checked]);

  function pickSample(id: string, sampleText: string) {
    setActiveId(id);
    setText(sampleText);
  }

  function changeText(value: string) {
    setActiveId(null);
    setText(value);
  }

  function changePriority(next: Draft["priority"]) {
    setPriority(next);
    setApproved(false);
    setNote((current) => current.replace(/^\[P\d\]/, `[${next}]`));
  }

  function changeNote(value: string) {
    setNote(value);
    setApproved(false);
  }

  const approve = useCallback(async () => {
    if (!draft) return;
    try {
      await navigator.clipboard.writeText(note);
      setCopied(true);
      window.setTimeout(() => setCopied(false), 2200);
    } catch {
      /* sem permissão da área de transferência: a nota continua na tela */
    }
    setApproved(true);
    const entry: Escalation = {
      id: `${Date.now()}`,
      at: new Date().toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" }),
      title: draft.title,
      priority,
      tag,
      note,
    };
    setHistory((current) => {
      const next = [entry, ...current];
      saveHistory(next);
      return next;
    });
  }, [draft, note, priority, tag]);

  // Ctrl+Enter (ou Cmd+Enter) aprova de qualquer lugar da tela.
  useEffect(() => {
    function onKey(event: KeyboardEvent) {
      if ((event.ctrlKey || event.metaKey) && event.key === "Enter") {
        event.preventDefault();
        void approve();
      }
    }
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [approve]);

  function download() {
    const blob = new Blob([note], { type: "text/plain;charset=utf-8" });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.download = `escalation-${(activeId ?? "ticket").toLowerCase()}.txt`;
    link.click();
    URL.revokeObjectURL(url);
  }

  function newTicket() {
    setActiveId(null);
    setText("");
  }

  return (
    <div className="desk">
      <header className="masthead">
        <div>
          <p className="kicker">N1 → N2 escalation</p>
          <h1>Triage Desk</h1>
        </div>
        <div className="mast-side">
          <p className="oath">
            The assistant only <em>drafts</em>. Nothing is escalated until a person reads, edits and approves it.
          </p>
          <div className="tools">
            <button type="button" className="tool" onClick={newTicket}>
              New ticket
            </button>
            <button
              type="button"
              className="tool"
              aria-pressed={theme === "night"}
              onClick={() => setTheme(theme === "night" ? "day" : "night")}
            >
              {theme === "night" ? "Day shift" : "Night shift"}
            </button>
          </div>
        </div>
      </header>

      <main className="floor">
        <aside className="inbox" aria-label="Ticket inbox">
          <h2>Inbox</h2>
          <ul>
            {SAMPLES.map((sample, index) => (
              <li key={sample.id} style={{ ["--tilt" as string]: `${index % 2 === 0 ? -1.2 : 1}deg` }}>
                <button
                  type="button"
                  className={`hang ${activeId === sample.id ? "active" : ""}`}
                  onClick={() => pickSample(sample.id, sample.text)}
                >
                  <span className="hole" aria-hidden="true" />
                  <span className="hang-id">{sample.id}</span>
                  <span className="hang-label">{sample.label}</span>
                </button>
              </li>
            ))}
          </ul>
          <p className="fiction">All tickets are fictional. Paste your own text in the case file; nothing is sent anywhere.</p>
        </aside>

        <section className="casefile" aria-label="Ticket text">
          <h2>Case file</h2>
          <textarea
            value={text}
            onChange={(event) => changeText(event.target.value)}
            spellCheck={false}
            placeholder="Paste a ticket here (English, Spanish or Portuguese)..."
            aria-label="Ticket text"
          />
          {draft && (
            <div className="reading">
              <h3>What I noticed</h3>
              <p className="lang">
                Language <strong>{draft.lang.toUpperCase()}</strong> · Scope <strong>{draft.scope}</strong>
              </p>
              <ul className="signals">
                {draft.signals.length ? draft.signals.map((signal) => <li key={signal}>{signal}</li>) : <li>no strong signals found</li>}
              </ul>
              <Gauge value={draft.confidence} />
            </div>
          )}
        </section>

        <section className="verdict" aria-label="Escalation draft">
          {!draft ? (
            <p className="empty">Paste a ticket to get a draft.</p>
          ) : (
            <article className={`tagcard ${tag}`}>
              <span className="string" aria-hidden="true" />
              <span className="hole big" aria-hidden="true" />
              <div className="tag-top">
                <span className="tag-name">{TAG_NAME[tag]}</span>
                <label className="pri">
                  <span className="sr">Priority</span>
                  <select value={priority} onChange={(event) => changePriority(event.target.value as Draft["priority"])}>
                    <option value="P1">P1</option>
                    <option value="P2">P2</option>
                    <option value="P3">P3</option>
                  </select>
                </label>
              </div>
              <p className="cat">{draft.category.label}</p>
              <h3 className="title">{draft.title}</h3>

              {draft.missing.length > 0 && (
                <div className="ask">
                  <h4>Ask the customer</h4>
                  <ul>
                    {draft.missing.map((item) => (
                      <li key={item}>{item}</li>
                    ))}
                  </ul>
                </div>
              )}

              <div className="checks">
                <h4>
                  N1 checks <small>{pendingChecks === 0 ? "all done" : `${pendingChecks} open`}</small>
                </h4>
                {draft.checks.map((item) => (
                  <label key={item}>
                    <input
                      type="checkbox"
                      checked={!!checked[item]}
                      onChange={(event) => setChecked((current) => ({ ...current, [item]: event.target.checked }))}
                    />
                    <span>{item}</span>
                  </label>
                ))}
              </div>

              <label className="notebox">
                <span>Escalation note (editable)</span>
                <textarea value={note} onChange={(event) => changeNote(event.target.value)} spellCheck={false} rows={12} />
              </label>

              <div className="actions">
                <button type="button" className="approve" onClick={approve}>
                  {approved ? "Approved ✓" : "Approve & copy"}
                </button>
                <button type="button" className="ghost" onClick={download}>
                  Download .txt
                </button>
                {copied && <span className="copied">Copied to clipboard</span>}
              </div>
              <p className="hint">
                {pendingChecks > 0 ? `${pendingChecks} N1 check${pendingChecks > 1 ? "s" : ""} still open. ` : ""}
                Shortcut: Ctrl+Enter to approve.
              </p>

              <div className={`stamp ${approved ? "approved" : "draft"}`} aria-live="polite">
                {approved ? "APPROVED" : "DRAFT"}
              </div>
            </article>
          )}
        </section>
      </main>

      {history.length > 0 && (
        <footer className="ledger" aria-label="Escalated today">
          <h2>Escalated this session</h2>
          <ol>
            {history.slice(0, 6).map((entry) => (
              <li key={entry.id} className={entry.tag}>
                <span className="time">{entry.at}</span>
                <span className="pri-chip">{entry.priority}</span>
                <span className="entry-title">{entry.title}</span>
              </li>
            ))}
          </ol>
        </footer>
      )}
    </div>
  );
}
