import { Account, JournalEntry } from '../types';
import { formatCurrency } from '../store';

interface Props {
  accounts: Account[];
  journals: JournalEntry[];
}

export default function TrialBalance({ accounts, journals }: Props) {
  const getAccountBalance = (account: Account) => {
    const lines = journals.flatMap(j => j.lines.filter(l => l.accountId === account.id));
    if (account.normalBalance === 'debit') {
      return lines.reduce((sum, l) => sum + l.debit - l.credit, 0);
    }
    return lines.reduce((sum, l) => sum + l.credit - l.debit, 0);
  };

  const rows = accounts
    .map(account => {
      const balance = getAccountBalance(account);
      return {
        account,
        debit: account.normalBalance === 'debit' && balance > 0 ? balance : (account.normalBalance === 'credit' && balance < 0 ? -balance : 0),
        credit: account.normalBalance === 'credit' && balance > 0 ? balance : (account.normalBalance === 'debit' && balance < 0 ? -balance : 0),
      };
    })
    .filter(r => r.debit > 0 || r.credit > 0)
    .sort((a, b) => a.account.code.localeCompare(b.account.code));

  const totalDebit = rows.reduce((s, r) => s + r.debit, 0);
  const totalCredit = rows.reduce((s, r) => s + r.credit, 0);
  const isBalanced = Math.abs(totalDebit - totalCredit) < 1;

  const typeLabels: Record<string, string> = {
    asset: 'Aset',
    liability: 'Liabilitas',
    equity: 'Ekuitas',
    revenue: 'Pendapatan',
    expense: 'Beban',
  };

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold text-gray-800">Neraca Saldo</h1>
        <p className="text-gray-500 mt-1">Trial Balance - Ringkasan saldo semua akun</p>
      </div>

      <div className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden">
        <div className="bg-gradient-to-r from-indigo-600 to-purple-600 px-6 py-4">
          <h3 className="text-white font-bold text-xl text-center">NERACA SALDO</h3>
          <p className="text-indigo-100 text-sm text-center">Per 31 Desember 2026</p>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full">
            <thead className="bg-gray-50">
              <tr>
                <th className="text-left px-6 py-3 text-xs font-semibold text-gray-500 uppercase">Kode</th>
                <th className="text-left px-6 py-3 text-xs font-semibold text-gray-500 uppercase">Nama Akun</th>
                <th className="text-left px-6 py-3 text-xs font-semibold text-gray-500 uppercase">Tipe</th>
                <th className="text-right px-6 py-3 text-xs font-semibold text-gray-500 uppercase">Debit</th>
                <th className="text-right px-6 py-3 text-xs font-semibold text-gray-500 uppercase">Kredit</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-50">
              {rows.map((row, idx) => (
                <tr key={idx} className="hover:bg-gray-50 transition">
                  <td className="px-6 py-3 font-mono text-sm text-gray-700">{row.account.code}</td>
                  <td className="px-6 py-3 font-medium text-gray-800">{row.account.name}</td>
                  <td className="px-6 py-3 text-sm text-gray-500">{typeLabels[row.account.type]}</td>
                  <td className="px-6 py-3 text-right text-sm font-medium text-gray-800">
                    {row.debit > 0 ? formatCurrency(row.debit) : '-'}
                  </td>
                  <td className="px-6 py-3 text-right text-sm font-medium text-gray-800">
                    {row.credit > 0 ? formatCurrency(row.credit) : '-'}
                  </td>
                </tr>
              ))}
            </tbody>
            <tfoot>
              <tr className="bg-gray-100 font-bold border-t-2 border-gray-300">
                <td colSpan={3} className="px-6 py-4 text-gray-800">TOTAL</td>
                <td className="px-6 py-4 text-right text-gray-800">{formatCurrency(totalDebit)}</td>
                <td className="px-6 py-4 text-right text-gray-800">{formatCurrency(totalCredit)}</td>
              </tr>
            </tfoot>
          </table>
        </div>

        <div className="px-6 py-4 bg-gray-50 border-t">
          {isBalanced ? (
            <div className="flex items-center gap-2 text-green-600">
              <i className="fa-solid fa-circle-check"></i>
              <span className="font-medium">Neraca Saldo SEIMBANG (Debit = Kredit)</span>
            </div>
          ) : (
            <div className="flex items-center gap-2 text-red-600">
              <i className="fa-solid fa-circle-exclamation"></i>
              <span className="font-medium">
                TIDAK SEIMBANG! Selisih: {formatCurrency(Math.abs(totalDebit - totalCredit))}
              </span>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
