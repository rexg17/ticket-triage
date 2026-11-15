import { triage } from "../engine/triage";
import type { Draft } from "../engine/types";

/**
 * Qualquer fonte de rascunhos (motor local ou modelo de linguagem) implementa esta interface.
 * A aplicação nunca envia um rascunho adiante sem a aprovação de uma pessoa, não importa o provedor.
 */
export interface Provider {
  readonly name: string;
  draft(ticketText: string): Promise<Draft>;
}

/** Provedor padrão: roda no navegador, sem chave de API e sem custo. */
export const localProvider: Provider = {
  name: "Local rules engine",
  async draft(ticketText) {
    return triage(ticketText);
  },
};
