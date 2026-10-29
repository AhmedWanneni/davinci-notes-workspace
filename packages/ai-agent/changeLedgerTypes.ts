export type FileActionKind = "create" | "modify" | "delete" | "move";

export interface FileChangeRecord {
  action: FileActionKind;
  path: string;
  fromPath?: string;
  beforeContent: string | null;
  afterContent: string | null;
}

export interface AgentTransaction {
  transactionId: string;
  timestamp: number;
  prompt: string;
  changes: FileChangeRecord[];
  undone?: boolean;
}

export interface ChangeLedgerData {
  version: number;
  transactions: AgentTransaction[];
}

export const AGENT_HISTORY_PATH = ".davinci/agent/history.json";
export const CURRENT_LEDGER_VERSION = 1;
export const MAX_LEDGER_TRANSACTIONS = 100;
