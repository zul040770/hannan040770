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

export type PageType = 'dashboard' | 'accounts' | 'journal' | 'ledger' | 'trial-balance' | 'income-statement' | 'balance-sheet' | 'cash-flow' | 'depreciation' | 'payroll';

export interface Employee {
  id: string;
  employeeId: string;
  name: string;
  position: string;
  department: string;
  joinDate: string;
  basicSalary: number;
  allowances: {
    transport: number;
    meal: number;
    health: number;
    position: number;
  };
  bankAccount: string;
  bankName: string;
  npwp: string;
  status: 'active' | 'inactive';
}

export interface PayrollRecord {
  id: string;
  employeeId: string;
  period: string; // YYYY-MM
  basicSalary: number;
  allowances: {
    transport: number;
    meal: number;
    health: number;
    position: number;
  };
  overtime: number;
  grossIncome: number;
  deductions: {
    bpjsHealth: number;
    bpjsEmployment: number;
    pph21: number;
    other: number;
  };
  netSalary: number;
  paymentDate: string;
  status: 'paid' | 'pending';
}

export type DepreciationMethod = 'straight-line' | 'declining-balance';
export type TaxGroup = 1 | 2 | 3 | 4;

export interface DepreciationAsset {
  id: string;
  name: string;
  acquisitionDate: string;
  cost: number;
  residualValue: number;
  usefulLifeYears: number;
  method: DepreciationMethod;
  taxGroup: TaxGroup | 'building-permanent' | 'building-non-permanent';
  category: 'accounting' | 'fiscal' | 'both';
}
