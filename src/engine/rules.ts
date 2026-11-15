/**
 * Dicionários do motor de triagem (inglês, espanhol e português).
 * Todas as palavras ficam sem acento e em minúsculas, porque o texto é normalizado antes.
 */
import type { Category } from "./types";

export interface CategoryRule {
  category: Category;
  words: string[];
  checks: string[]; // o que o N1 deve conferir antes de escalar
}

export const CATEGORIES: CategoryRule[] = [
  {
    category: { id: "printing", label: "Printing / fiscal device" },
    words: ["impressora", "impresora", "printer", "fiscal", "nfc-e", "nfce", "sat ", "recibo", "receipt", "cupom", "ticket de venta", "spooler"],
    checks: [
      "Check the device is on, has paper and shows no error light",
      "Restart the print spooler and the fiscal service",
      "Print a test page outside the application",
      "Confirm the driver and port in the device manager",
    ],
  },
  {
    category: { id: "database", label: "Database / data integrity" },
    words: ["banco de dados", "base de datos", "database", "sql", "deadlock", "corrupt", "backup", "tabela", "tabla", "query", "postgres", "mysql"],
    checks: [
      "Check the database service is running and has free disk space",
      "Look for locks or long-running queries",
      "Confirm the last successful backup before any change",
      "Collect the exact error text from the database log",
    ],
  },
  {
    category: { id: "performance", label: "Performance / freezing" },
    words: ["lento", "lenta", "lentidao", "lentitud", "slow", "demora", "tarda", "travou", "trava", "colgado", "congelado", "freeze", "frozen", "timeout", "tempo esgotado", "latencia", "latency"],
    checks: [
      "Check CPU, memory and disk usage on the machine and the server",
      "Check if it happens for one user or for everyone",
      "Look at what changed recently (update, new data, new device)",
      "Test the same action on another machine",
    ],
  },
  {
    category: { id: "network", label: "Network / connectivity" },
    words: ["rede", "network", "conexion", "conexao", "connection", "vpn", "dns", "offline", "sem internet", "sin internet", "no internet", "wifi", "wi-fi", "ping", "firewall", "servidor nao responde", "server not responding"],
    checks: [
      "Ping the server and the gateway from the affected machine",
      "Check the cable or Wi-Fi and the switch lights",
      "Check DNS resolution and the VPN status",
      "Confirm if other machines on the same network are affected",
    ],
  },
  {
    category: { id: "access", label: "Login / access / permissions" },
    words: ["login", "senha", "contrasena", "password", "acesso", "acceso", "access denied", "permissao", "permiso", "permission", "bloqueado", "bloqueada", "locked", "usuario", "user account", "sesion", "sessao"],
    checks: [
      "Confirm the username and that the account is active and not locked",
      "Reset the password following the security procedure",
      "Check the profile and permissions of the user",
      "Check if the password has expired",
    ],
  },
  {
    category: { id: "payment", label: "Payment / POS checkout" },
    words: ["pagamento", "pago ", "payment", "tef", "cartao", "tarjeta", "card", "pinpad", "pos ", "caixa", "caja", "checkout", "register", "nao consigo vender", "no puedo vender", "cannot sell", "venda", "ventas", "sales"],
    checks: [
      "Check the card terminal (pinpad) is connected and shows ready",
      "Check the payment service and its connection to the acquirer",
      "Try a cash sale to separate payment problems from system problems",
      "Note the exact decline or error message",
    ],
  },
  {
    category: { id: "integration", label: "Integration / API / sync" },
    words: ["integracao", "integracion", "integration", "api", "webhook", "endpoint", "conector", "connector", "marketplace", "sincronizacao", "sincronizacion", "sync", "http 5", "pedidos nao chegam", "orders are not arriving", "no llegan los pedidos"],
    checks: [
      "Check the connector or service is running and its last successful run",
      "Look for the HTTP status and the response body in the integration log",
      "Check the credentials, token expiry and the endpoint address",
      "Confirm what changed on either side (deploy, certificate, firewall)",
    ],
  },
  {
    category: { id: "reports", label: "Reports / inventory / data export" },
    words: ["relatorio", "informe", "report", "export", "inventario", "inventory", "estoque", "stock", "planilha", "excel", "dashboard", "total errado", "wrong total", "saldo"],
    checks: [
      "Confirm the date range and filters used in the report",
      "Compare with the same report on a previous date",
      "Check if the data was imported or edited recently",
      "Export a sample of the wrong rows for N2",
    ],
  },
  {
    category: { id: "update", label: "Installation / update / version" },
    words: ["atualizacao", "actualizacion", "update", "upgrade", "versao", "version", "instalacao", "instalacion", "install", "patch", "migracao", "migration"],
    checks: [
      "Confirm the installed version and the version expected",
      "Check the update log for errors",
      "Confirm if the problem started right after the update",
      "Check if a rollback point or backup exists",
    ],
  },
];

export const FALLBACK: CategoryRule = {
  category: { id: "other", label: "General incident" },
  words: [],
  checks: [
    "Reproduce the problem and note every step",
    "Collect screenshots and the exact error text",
    "Check if it happens to one user or to everyone",
    "Check what changed recently",
  ],
};

/** Sinais de urgência (peso alto) em ordem do mais grave ao menos grave. */
export const URGENT = [
  "producao", "production", "parado", "parada", "down", "fora do ar", "caido", "caida",
  "nao consigo vender", "no puedo vender", "cannot sell", "todos os caixas", "todas as lojas",
  "todas las tiendas", "all registers", "all stores", "perdendo vendas", "losing sales", "urgente", "urgent", "critico", "critical",
  "perda de dados", "data loss", "no arranca", "nao inicia", "will not start", "won't start",
];

export const WIDE = [
  "todos", "todas", "todo el", "toda a", "everyone", "all users", "all registers", "all stores",
  "varios", "several", "multiple", "toda la tienda", "toda a loja", "equipe inteira", "whole team",
];

export const SINGLE = [
  "um usuario", "un usuario", "one user", "so eu", "solo yo", "only me", "apenas um", "solo uno",
  "meu computador", "mi equipo", "my computer", "uma maquina", "una maquina", "one machine",
];

export const LOW = [
  "as vezes", "a veces", "sometimes", "intermitente", "intermittent", "de vez em quando",
  "ocasional", "occasionally", "duvida", "pregunta", "question", "como faco", "como hago", "how do i",
];

export const TRIED = [
  "reiniciei", "reinicie", "restarted", "rebooted", "reiniciado", "reinstalei", "reinstale", "reinstalled",
  "tentei", "intente", "i tried", "ja fiz", "ya hice", "already", "troquei", "cambie", "replaced", "limpei", "cleared",
];

export const LANG_WORDS: Record<"en" | "es" | "pt", string[]> = {
  en: ["the", "and", "is", "not", "with", "when", "after", "cannot", "since", "from", "have", "all"],
  es: ["el", "la", "los", "y", "no", "con", "cuando", "despues", "desde", "tiene", "todos", "que", "una", "por"],
  pt: ["o", "a", "os", "e", "nao", "com", "quando", "depois", "desde", "tem", "todos", "que", "uma", "pelo", "esta"],
};
