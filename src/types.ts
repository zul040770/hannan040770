export type AccountType = 'asset' | 'liability' | 'equity' | 'revenue' | 'expense';

export interface Account {
  id: string;
  code: string;
  name: string;
  type: AccountType;
  normalBalance: 'debit' | 'credit';
}

export interface JournalEntry {
  id: string;
  date: string;
  description: string;
  reference: string;
  lines: JournalLine[];
}

export interface JournalLine {
  accountId: string;
  debit: number;
  credit: number;
}

export interface LedgerEntry {
  date: string;
  description: string;
  reference: string;
  debit: number;
  credit: number;
  balance: number;
}

export interface TrialBalanceRow {
  account: Account;
  debit: number;
  credit: number;
}

export type PageType = 'dashboard' | 'accounts' | 'journal' | 'ledger' | 'trial-balance' | 'income-statement' | 'balance-sheet' | 'cash-flow';
