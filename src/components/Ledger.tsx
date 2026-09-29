import { useState } from 'react';
import { Account, JournalEntry } from '../types';
import { formatCurrency, formatDate } from '../store';

interface Props {
  accounts: Account[];
  journals: JournalEntry[];
}

export default function Ledger({ accounts, journals }: Props) {
  const [selectedAccount, setSelectedAccount] = useState<string>(accounts[0]?.id || '');

  const getLedgerEntries = (accountId: string) => {
    const entries: { date: string; description: string; reference: string; debit: number; credit: number; balance: number }[] = [];
    let runningBalance = 0;
    const account = accounts.find(a => a.id === accountId);
    if (!account) return entries;

    const isDebitNormal = account.normalBalance === 'debit';

    journals
      .filter(j => j.lines.some(l => l.accountId === accountId))
      .sort((a, b) => a.date.localeCompare(b.date))
      .forEach(journal => {
        const line = journal.lines.find(l => l.accountId === accountId);
        if (line) {
          if (isDebitNormal) {
            runningBalance += line.debit - line.credit;
          } else {
            runningBalance += line.credit - line.debit;
          }
          entries.push({
            date: journal.date,
            description: journal.description,
            reference: journal.reference,
            debit: line.debit,
            credit: line.credit,
            balance: runningBalance,
          });
        }
      });

    return entries;
  };

  const entries = getLedgerEntries(selectedAccount);
  const selectedAcc = accounts.find(a => a.id === selectedAccount);

  const totalDebit = entries.reduce((s, e) => s + e.debit, 0);
  const totalCredit = entries.reduce((s, e) => s + e.credit, 0);

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold text-gray-800">Buku Besar</h1>
        <p className="text-gray-500 mt-1">General Ledger - Detail transaksi per akun</p>
      </div>

      <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-4">
        <label className="block text-sm font-medium text-gray-600 mb-2">Pilih Akun:</label>
        <select
          value={selectedAccount}
          onChange={e => setSelectedAccount(e.target.value)}
          className="w-full md:w-96 border border-gray-300 rounded-lg px-3 py-2 focus:ring-2 focus:ring-blue-500 focus:border-transparent"
        >
          {accounts.map(a => (
            <option key={a.id} value={a.id}>{a.code} - {a.name}</option>
          ))}
        </select>
      </div>

      {selectedAcc && (
        <div className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden">
          <div className="bg-gradient-to-r from-blue-600 to-blue-700 px-6 py-4">
            <h3 className="text-white font-semibold text-lg">{selectedAcc.code} - {selectedAcc.name}</h3>
            <p className="text-blue-100 text-sm">Tipe: {selectedAcc.type === 'asset' ? 'Aset' : selectedAcc.type === 'liability' ? 'Liabilitas' : selectedAcc.type === 'equity' ? 'Ekuitas' : selectedAcc.type === 'revenue' ? 'Pendapatan' : 'Beban'} | Saldo Normal: {selectedAcc.normalBalance}</p>
          </div>
          
          {entries.length === 0 ? (
            <div className="p-8 text-center text-gray-400">
              <i className="fa-solid fa-inbox text-4xl mb-2"></i>
              <p>Belum ada transaksi untuk akun ini</p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead className="bg-gray-50">
                  <tr>
                    <th className="text-left px-6 py-3 text-xs font-semibold text-gray-500 uppercase">Tanggal</th>
                    <th className="text-left px-6 py-3 text-xs font-semibold text-gray-500 uppercase">Keterangan</th>
                    <th className="text-left px-6 py-3 text-xs font-semibold text-gray-500 uppercase">Ref</th>
                    <th className="text-right px-6 py-3 text-xs font-semibold text-gray-500 uppercase">Debit</th>
                    <th className="text-right px-6 py-3 text-xs font-semibold text-gray-500 uppercase">Kredit</th>
                    <th className="text-right px-6 py-3 text-xs font-semibold text-gray-500 uppercase">Saldo</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-50">
                  {entries.map((entry, idx) => (
                    <tr key={idx} className="hover:bg-gray-50 transition">
                      <td className="px-6 py-3 text-sm text-gray-600">{formatDate(entry.date)}</td>
                      <td className="px-6 py-3 text-sm text-gray-800">{entry.description}</td>
                      <td className="px-6 py-3 text-sm text-gray-500">{entry.reference}</td>
                      <td className="px-6 py-3 text-right text-sm font-medium text-gray-800">
                        {entry.debit > 0 ? formatCurrency(entry.debit) : '-'}
                      </td>
                      <td className="px-6 py-3 text-right text-sm font-medium text-gray-800">
                        {entry.credit > 0 ? formatCurrency(entry.credit) : '-'}
                      </td>
                      <td className="px-6 py-3 text-right text-sm font-bold text-blue-700">
                        {formatCurrency(entry.balance)}
                      </td>
                    </tr>
                  ))}
                </tbody>
                <tfoot className="bg-gray-50 font-semibold">
                  <tr>
                    <td colSpan={3} className="px-6 py-3 text-sm text-gray-700">Total</td>
                    <td className="px-6 py-3 text-right text-sm">{formatCurrency(totalDebit)}</td>
                    <td className="px-6 py-3 text-right text-sm">{formatCurrency(totalCredit)}</td>
                    <td className="px-6 py-3 text-right text-sm font-bold text-blue-700">
                      {entries.length > 0 ? formatCurrency(entries[entries.length - 1].balance) : '0'}
                    </td>
                  </tr>
                </tfoot>
              </table>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
