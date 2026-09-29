import { Account, JournalEntry } from '../types';
import { formatCurrency } from '../store';

interface Props {
  accounts: Account[];
  journals: JournalEntry[];
}

export default function BalanceSheet({ accounts, journals }: Props) {
  const getAccountBalance = (account: Account) => {
    const lines = journals.flatMap(j => j.lines.filter(l => l.accountId === account.id));
    if (account.normalBalance === 'debit') {
      return lines.reduce((sum, l) => sum + l.debit - l.credit, 0);
    }
    return lines.reduce((sum, l) => sum + l.credit - l.debit, 0);
  };

  const assetAccounts = accounts
    .filter(a => a.type === 'asset')
    .map(a => ({ account: a, balance: getAccountBalance(a) }))
    .filter(r => r.balance !== 0)
    .sort((a, b) => a.account.code.localeCompare(b.account.code));

  const liabilityAccounts = accounts
    .filter(a => a.type === 'liability')
    .map(a => ({ account: a, balance: getAccountBalance(a) }))
    .filter(r => r.balance !== 0)
    .sort((a, b) => a.account.code.localeCompare(b.account.code));

  const equityAccounts = accounts
    .filter(a => a.type === 'equity')
    .map(a => ({ account: a, balance: getAccountBalance(a) }))
    .filter(r => r.balance !== 0)
    .sort((a, b) => a.account.code.localeCompare(b.account.code));

  // Calculate net income for retained earnings
  const totalRevenue = accounts
    .filter(a => a.type === 'revenue')
    .reduce((sum, a) => sum + getAccountBalance(a), 0);
  const totalExpenses = accounts
    .filter(a => a.type === 'expense')
    .reduce((sum, a) => sum + getAccountBalance(a), 0);
  const netIncome = totalRevenue - totalExpenses;

  const totalAssets = assetAccounts.reduce((s, r) => s + r.balance, 0);
  const totalLiabilities = liabilityAccounts.reduce((s, r) => s + r.balance, 0);
  const totalEquity = equityAccounts.reduce((s, r) => s + r.balance, 0) + netIncome;
  const totalLiabilitiesAndEquity = totalLiabilities + totalEquity;

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold text-gray-800">Neraca</h1>
        <p className="text-gray-500 mt-1">Balance Sheet / Laporan Posisi Keuangan</p>
      </div>

      <div className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden max-w-4xl mx-auto">
        <div className="bg-gradient-to-r from-blue-700 to-indigo-700 px-6 py-4">
          <h3 className="text-white font-bold text-xl text-center">NERACA</h3>
          <p className="text-blue-100 text-sm text-center">Per 31 Januari 2024</p>
        </div>

        <div className="p-6">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
            {/* Left Column - Assets */}
            <div>
              <h4 className="font-bold text-gray-800 text-lg border-b-2 border-blue-500 pb-2 mb-4">ASET</h4>
              
              {assetAccounts.length === 0 ? (
                <p className="text-gray-400 text-sm italic">Tidak ada aset</p>
              ) : (
                <div className="space-y-2">
                  {assetAccounts.map(r => (
                    <div key={r.account.id} className="flex justify-between items-center py-1.5">
                      <span className="text-gray-700 text-sm">{r.account.name}</span>
                      <span className="font-medium text-gray-800 text-sm">{formatCurrency(r.balance)}</span>
                    </div>
                  ))}
                </div>
              )}

              <div className="flex justify-between items-center py-3 border-t-2 border-blue-300 mt-4 bg-blue-50 rounded px-3">
                <span className="font-bold text-blue-800">TOTAL ASET</span>
                <span className="font-bold text-blue-800 text-lg">{formatCurrency(totalAssets)}</span>
              </div>
            </div>

            {/* Right Column - Liabilities & Equity */}
            <div>
              <h4 className="font-bold text-gray-800 text-lg border-b-2 border-red-500 pb-2 mb-4">LIABILITAS</h4>
              
              {liabilityAccounts.length === 0 ? (
                <p className="text-gray-400 text-sm italic mb-4">Tidak ada liabilitas</p>
              ) : (
                <div className="space-y-2 mb-4">
                  {liabilityAccounts.map(r => (
                    <div key={r.account.id} className="flex justify-between items-center py-1.5">
                      <span className="text-gray-700 text-sm">{r.account.name}</span>
                      <span className="font-medium text-gray-800 text-sm">{formatCurrency(r.balance)}</span>
                    </div>
                  ))}
                </div>
              )}

              <div className="flex justify-between items-center py-2 border-t border-dashed mb-4">
                <span className="font-semibold text-gray-700 text-sm">Total Liabilitas</span>
                <span className="font-bold text-red-600 text-sm">{formatCurrency(totalLiabilities)}</span>
              </div>

              <h4 className="font-bold text-gray-800 text-lg border-b-2 border-purple-500 pb-2 mb-4">EKUITAS</h4>
              
              {equityAccounts.length === 0 && netIncome === 0 ? (
                <p className="text-gray-400 text-sm italic mb-4">Tidak ada ekuitas</p>
              ) : (
                <div className="space-y-2 mb-4">
                  {equityAccounts.map(r => (
                    <div key={r.account.id} className="flex justify-between items-center py-1.5">
                      <span className="text-gray-700 text-sm">{r.account.name}</span>
                      <span className="font-medium text-gray-800 text-sm">{formatCurrency(r.balance)}</span>
                    </div>
                  ))}
                  {netIncome !== 0 && (
                    <div className="flex justify-between items-center py-1.5">
                      <span className="text-gray-700 text-sm italic">Laba Periode Berjalan</span>
                      <span className="font-medium text-gray-800 text-sm">{formatCurrency(netIncome)}</span>
                    </div>
                  )}
                </div>
              )}

              <div className="flex justify-between items-center py-2 border-t border-dashed mb-4">
                <span className="font-semibold text-gray-700 text-sm">Total Ekuitas</span>
                <span className="font-bold text-purple-600 text-sm">{formatCurrency(totalEquity)}</span>
              </div>

              <div className="flex justify-between items-center py-3 border-t-2 border-red-300 mt-2 bg-red-50 rounded px-3">
                <span className="font-bold text-red-800">TOTAL LIABILITAS & EKUITAS</span>
                <span className="font-bold text-red-800 text-lg">{formatCurrency(totalLiabilitiesAndEquity)}</span>
              </div>
            </div>
          </div>

          {/* Balance Check */}
          <div className="mt-6 p-4 rounded-lg border-t-2 border-gray-300">
            <div className="flex justify-between items-center">
              <span className="font-bold text-gray-800">Selisih (Aset - Liabilitas & Ekuitas)</span>
              <span className={`font-bold text-lg ${Math.abs(totalAssets - totalLiabilitiesAndEquity) < 1 ? 'text-green-600' : 'text-red-600'}`}>
                {formatCurrency(Math.abs(totalAssets - totalLiabilitiesAndEquity))}
              </span>
            </div>
            {Math.abs(totalAssets - totalLiabilitiesAndEquity) < 1 ? (
              <p className="text-green-600 text-sm mt-1 flex items-center gap-1">
                <i className="fa-solid fa-circle-check"></i> Neraca SEIMBANG (Balance)
              </p>
            ) : (
              <p className="text-red-600 text-sm mt-1 flex items-center gap-1">
                <i className="fa-solid fa-circle-exclamation"></i> Neraca TIDAK SEIMBANG
              </p>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
