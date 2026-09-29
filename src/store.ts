import { Account, JournalEntry } from './types';

export const defaultAccounts: Account[] = [
  { id: '1', code: '1-1000', name: 'Kas', type: 'asset', normalBalance: 'debit' },
  { id: '2', code: '1-1010', name: 'Bank', type: 'asset', normalBalance: 'debit' },
  { id: '3', code: '1-1020', name: 'Piutang Usaha', type: 'asset', normalBalance: 'debit' },
  { id: '4', code: '1-1030', name: 'Persediaan', type: 'asset', normalBalance: 'debit' },
  { id: '5', code: '1-1040', name: 'Perlengkapan', type: 'asset', normalBalance: 'debit' },
  { id: '6', code: '1-1050', name: 'Peralatan', type: 'asset', normalBalance: 'debit' },
  { id: '7', code: '1-1060', name: 'Akumulasi Penyusutan Peralatan', type: 'asset', normalBalance: 'credit' },
  { id: '8', code: '1-1070', name: 'Tanah', type: 'asset', normalBalance: 'debit' },
  { id: '9', code: '1-1080', name: 'Bangunan', type: 'asset', normalBalance: 'debit' },
  { id: '10', code: '1-1090', name: 'Akumulasi Penyusutan Bangunan', type: 'asset', normalBalance: 'credit' },
  { id: '11', code: '2-2000', name: 'Hutang Usaha', type: 'liability', normalBalance: 'credit' },
  { id: '12', code: '2-2010', name: 'Hutang Bank', type: 'liability', normalBalance: 'credit' },
  { id: '13', code: '2-2020', name: 'Hutang Gaji', type: 'liability', normalBalance: 'credit' },
  { id: '14', code: '2-2030', name: 'Hutang Pajak', type: 'liability', normalBalance: 'credit' },
  { id: '15', code: '3-3000', name: 'Modal Pemilik', type: 'equity', normalBalance: 'credit' },
  { id: '16', code: '3-3010', name: 'Prive', type: 'equity', normalBalance: 'debit' },
  { id: '17', code: '3-3020', name: 'Laba Ditahan', type: 'equity', normalBalance: 'credit' },
  { id: '18', code: '4-4000', name: 'Pendapatan Jasa', type: 'revenue', normalBalance: 'credit' },
  { id: '19', code: '4-4010', name: 'Pendapatan Penjualan', type: 'revenue', normalBalance: 'credit' },
  { id: '20', code: '4-4020', name: 'Pendapatan Bunga', type: 'revenue', normalBalance: 'credit' },
  { id: '21', code: '5-5000', name: 'Beban Gaji', type: 'expense', normalBalance: 'debit' },
  { id: '22', code: '5-5010', name: 'Beban Sewa', type: 'expense', normalBalance: 'debit' },
  { id: '23', code: '5-5020', name: 'Beban Listrik & Air', type: 'expense', normalBalance: 'debit' },
  { id: '24', code: '5-5030', name: 'Beban Perlengkapan', type: 'expense', normalBalance: 'debit' },
  { id: '25', code: '5-5040', name: 'Beban Penyusutan', type: 'expense', normalBalance: 'debit' },
  { id: '26', code: '5-5050', name: 'Beban Transportasi', type: 'expense', normalBalance: 'debit' },
  { id: '27', code: '5-5060', name: 'Beban Iklan', type: 'expense', normalBalance: 'debit' },
  { id: '28', code: '5-5070', name: 'Beban Administrasi', type: 'expense', normalBalance: 'debit' },
];

export const sampleJournals: JournalEntry[] = [
  {
    id: 'j1',
    date: '2024-01-02',
    description: 'Setoran modal awal pemilik',
    reference: 'JU-001',
    lines: [
      { accountId: '1', debit: 50000000, credit: 0 },
      { accountId: '15', debit: 0, credit: 50000000 },
    ],
  },
  {
    id: 'j2',
    date: '2024-01-05',
    description: 'Pembelian peralatan kantor',
    reference: 'JU-002',
    lines: [
      { accountId: '6', debit: 15000000, credit: 0 },
      { accountId: '1', debit: 0, credit: 15000000 },
    ],
  },
  {
    id: 'j3',
    date: '2024-01-10',
    description: 'Pendapatan jasa konsultasi',
    reference: 'JU-003',
    lines: [
      { accountId: '1', debit: 8000000, credit: 0 },
      { accountId: '18', debit: 0, credit: 8000000 },
    ],
  },
  {
    id: 'j4',
    date: '2024-01-15',
    description: 'Pembayaran gaji karyawan',
    reference: 'JU-004',
    lines: [
      { accountId: '21', debit: 5000000, credit: 0 },
      { accountId: '1', debit: 0, credit: 5000000 },
    ],
  },
  {
    id: 'j5',
    date: '2024-01-20',
    description: 'Pembayaran sewa kantor 1 tahun',
    reference: 'JU-005',
    lines: [
      { accountId: '22', debit: 12000000, credit: 0 },
      { accountId: '1', debit: 0, credit: 12000000 },
    ],
  },
  {
    id: 'j6',
    date: '2024-01-25',
    description: 'Pendapatan jasa desain',
    reference: 'JU-006',
    lines: [
      { accountId: '3', debit: 10000000, credit: 0 },
      { accountId: '18', debit: 0, credit: 10000000 },
    ],
  },
  {
    id: 'j7',
    date: '2024-01-28',
    description: 'Pembayaran beban listrik dan air',
    reference: 'JU-007',
    lines: [
      { accountId: '23', debit: 1500000, credit: 0 },
      { accountId: '1', debit: 0, credit: 1500000 },
    ],
  },
];

export function loadAccounts(): Account[] {
  const stored = localStorage.getItem('accounts');
  if (stored) return JSON.parse(stored);
  localStorage.setItem('accounts', JSON.stringify(defaultAccounts));
  return defaultAccounts;
}

export function saveAccounts(accounts: Account[]) {
  localStorage.setItem('accounts', JSON.stringify(accounts));
}

export function loadJournals(): JournalEntry[] {
  const stored = localStorage.getItem('journals');
  if (stored) return JSON.parse(stored);
  localStorage.setItem('journals', JSON.stringify(sampleJournals));
  return sampleJournals;
}

export function saveJournals(journals: JournalEntry[]) {
  localStorage.setItem('journals', JSON.stringify(journals));
}

export function formatCurrency(amount: number): string {
  return new Intl.NumberFormat('id-ID', {
    style: 'currency',
    currency: 'IDR',
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  }).format(amount);
}

export function formatDate(dateStr: string): string {
  const date = new Date(dateStr);
  return new Intl.DateTimeFormat('id-ID', {
    day: '2-digit',
    month: 'short',
    year: 'numeric',
  }).format(date);
}
