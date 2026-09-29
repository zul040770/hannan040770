import { Account, JournalEntry } from '../types';
import { formatCurrency } from '../store';

interface Props {
  accounts: Account[];
  journals: JournalEntry[];
}

export default function IncomeStatement({ accounts, journals }: Props) {
  const getAccountBalance = (account: Account) => {
    const lines = journals.flatMap(j => j.lines.filter(l => l.accountId === account.id));
    if (account.normalBalance === 'debit') {
      return lines.reduce((sum, l) => sum + l.debit - l.credit, 0);
    }
    return lines.reduce((sum, l) => sum + l.credit - l.debit, 0);
  };

  const revenueAccounts = accounts
    .filter(a => a.type === 'revenue')
    .map(a => ({ account: a, balance: getAccountBalance(a) }))
    .filter(r => r.balance !== 0)
    .sort((a, b) => a.account.code.localeCompare(b.account.code));

  const expenseAccounts = accounts
    .filter(a => a.type === 'expense')
    .map(a => ({ account: a, balance: getAccountBalance(a) }))
    .filter(r => r.balance !== 0)
    .sort((a, b) => a.account.code.localeCompare(b.account.code));

  const totalRevenue = revenueAccounts.reduce((s, r) => s + r.balance, 0);
  const totalExpenses = expenseAccounts.reduce((s, r) => s + r.balance, 0);
  const netIncome = totalRevenue - totalExpenses;

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold text-gray-800">Laporan Laba Rugi</h1>
        <p className="text-gray-500 mt-1">Income Statement - Pendapatan dan beban perusahaan</p>
      </div>

      <div className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden max-w-3xl mx-auto">
        <div className="bg-gradient-to-r from-green-600 to-emerald-600 px-6 py-4">
          <h3 className="text-white font-bold text-xl text-center">LAPORAN LABA RUGI</h3>
          <p className="text-green-100 text-sm text-center">Untuk Periode yang Berakhir 31 Desember 2026</p>
        </div>

        <div className="p-6 space-y-6">
          {/* Revenue Section */}
          <div>
            <h4 className="font-bold text-gray-800 text-lg border-b pb-2 mb-3">PENDAPATAN</h4>
            {revenueAccounts.length === 0 ? (
              <p className="text-gray-400 text-sm italic">Tidak ada pendapatan</p>
            ) : (
              <div className="space-y-2">
                {revenueAccounts.map(r => (
                  <div key={r.account.id} className="flex justify-between items-center py-1">
                    <span className="text-gray-700">{r.account.name}</span>
                    <span className="font-medium text-gray-800">{formatCurrency(r.balance)}</span>
                  </div>
                ))}
                <div className="flex justify-between items-center py-2 border-t border-dashed mt-2">
                  <span className="font-semibold text-gray-800">Total Pendapatan</span>
                  <span className="font-bold text-green-600">{formatCurrency(totalRevenue)}</span>
                </div>
              </div>
            )}
          </div>

          {/* Expense Section */}
          <div>
            <h4 className="font-bold text-gray-800 text-lg border-b pb-2 mb-3">BEBAN-BEBAN</h4>
            {expenseAccounts.length === 0 ? (
              <p className="text-gray-400 text-sm italic">Tidak ada beban</p>
            ) : (
              <div className="space-y-2">
                {expenseAccounts.map(r => (
                  <div key={r.account.id} className="flex justify-between items-center py-1">
                    <span className="text-gray-700">{r.account.name}</span>
                    <span className="font-medium text-gray-800">{formatCurrency(r.balance)}</span>
                  </div>
                ))}
                <div className="flex justify-between items-center py-2 border-t border-dashed mt-2">
                  <span className="font-semibold text-gray-800">Total Beban</span>
                  <span className="font-bold text-red-600">{formatCurrency(totalExpenses)}</span>
                </div>
              </div>
            )}
          </div>

          {/* Net Income */}
          <div className="border-t-2 border-gray-800 pt-4">
            <div className="flex justify-between items-center py-2 bg-gray-50 rounded-lg px-4">
              <span className={`font-bold text-lg ${netIncome >= 0 ? 'text-green-700' : 'text-red-700'}`}>
                {netIncome >= 0 ? 'LABA BERSIH' : 'RUGI BERSIH'}
              </span>
              <span className={`font-bold text-xl ${netIncome >= 0 ? 'text-green-700' : 'text-red-700'}`}>
                {formatCurrency(Math.abs(netIncome))}
              </span>
            </div>
          </div>

          {/* Summary Stats */}
          <div className="grid grid-cols-2 gap-4 pt-4">
            <div className="bg-green-50 rounded-lg p-4 text-center">
              <p className="text-sm text-green-600">Margin Laba</p>
              <p className="text-xl font-bold text-green-700">
                {totalRevenue > 0 ? ((netIncome / totalRevenue) * 100).toFixed(1) : '0'}%
              </p>
            </div>
            <div className="bg-blue-50 rounded-lg p-4 text-center">
              <p className="text-sm text-blue-600">Rasio Beban</p>
              <p className="text-xl font-bold text-blue-700">
                {totalRevenue > 0 ? ((totalExpenses / totalRevenue) * 100).toFixed(1) : '0'}%
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
