import { describe, expect, it } from "vitest";
import { SAMPLES } from "./samples";
import { detectLanguage, extractEvidence, extractTried, normalize, triage } from "./triage";

const sample = (id: string) => SAMPLES.find((item) => item.id === id)!.text;

describe("normalize", () => {
  it("lowercases and strips accents", () => {
    expect(normalize("  Impressora Fiscal NÃO imprime ")).toBe("impressora fiscal nao imprime");
  });
});

describe("detectLanguage", () => {
  it("detects Portuguese, Spanish and English", () => {
    expect(detectLanguage(sample("T-1042"))).toBe("pt");
    expect(detectLanguage(sample("T-1045"))).toBe("es");
    expect(detectLanguage(sample("T-1044"))).toBe("en");
  });
});

describe("extractEvidence", () => {
  it("finds error codes, versions and stores", () => {
    const evidence = extractEvidence(sample("T-1042"));
    expect(evidence).toContain("Error code: 0x4F");
    expect(evidence).toContain("Version: 8.2.1");
    expect(evidence).toContain("Store: 12");
  });

  it("returns nothing for text without evidence", () => {
    expect(extractEvidence("o sistema esta estranho")).toEqual([]);
  });
});

describe("extractTried", () => {
  it("keeps the sentences where the person says what they tried", () => {
    const tried = extractTried(sample("T-1042"));
    expect(tried).toHaveLength(1);
    expect(tried[0]).toContain("Reiniciei");
  });
});

describe("triage", () => {
  it("marks a store-wide printer outage as red P1", () => {
    const draft = triage(sample("T-1042"));
    expect(draft.category.id).toBe("printing");
    expect(draft.tag).toBe("red");
    expect(draft.priority).toBe("P1");
    expect(draft.scope).toBe("wide");
  });

  it("marks an occasional slowness question for one user as green P3", () => {
    const draft = triage(sample("T-1043"));
    expect(draft.tag).toBe("green");
    expect(draft.priority).toBe("P3");
    expect(draft.scope).toBe("single");
  });

  it("detects access problems and a single affected user", () => {
    const draft = triage(sample("T-1044"));
    expect(draft.category.id).toBe("access");
    expect(draft.scope).toBe("single");
    expect(draft.priority).not.toBe("P1");
  });

  it("detects payment problems across the store", () => {
    const draft = triage(sample("T-1045"));
    expect(draft.category.id).toBe("payment");
    expect(draft.tag).toBe("red");
  });

  it("asks for missing information", () => {
    const draft = triage("The system is acting weird since today.");
    expect(draft.missing.join(" ")).toMatch(/error message/i);
    expect(draft.missing.join(" ")).toMatch(/version/i);
  });

  it("does not ask for what the ticket already contains", () => {
    const draft = triage(sample("T-1042"));
    expect(draft.missing.join(" ")).not.toMatch(/error message/i);
    expect(draft.missing.join(" ")).not.toMatch(/version/i);
  });

  it("falls back to a general incident when nothing matches", () => {
    const draft = triage("Something is wrong.");
    expect(draft.category.id).toBe("other");
    expect(draft.confidence).toBeLessThan(50);
  });

  it("builds an escalation note with the main sections", () => {
    const { note } = triage(sample("T-1042"));
    for (const section of ["SUMMARY", "EVIDENCE", "ALREADY TRIED BY N1", "STILL MISSING", "N1 CHECKS"]) {
      expect(note).toContain(section);
    }
  });

  it("keeps confidence between 15 and 95", () => {
    for (const item of SAMPLES) {
      const { confidence } = triage(item.text);
      expect(confidence).toBeGreaterThanOrEqual(15);
      expect(confidence).toBeLessThanOrEqual(95);
    }
  });
});
