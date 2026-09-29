import { useState } from 'react';
import { Account, JournalEntry, JournalLine } from '../types';
import { formatCurrency, formatDate } from '../store';

interface Props {
  accounts: Account[];
  journals: JournalEntry[];
  onSave: (journals: JournalEntry[]) => void;
}

export default function Journal({ accounts, journals, onSave }: Props) {
  const [showForm, setShowForm] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [date, setDate] = useState(new Date().toISOString().split('T')[0]);
  const [description, setDescription] = useState('');
  const [reference, setReference] = useState('');
  const [lines, setLines] = useState<JournalLine[]>([
    { accountId: '', debit: 0, credit: 0 },
    { accountId: '', debit: 0, credit: 0 },
  ]);

  const totalDebit = lines.reduce((s, l) => s + l.debit, 0);
  const totalCredit = lines.reduce((s, l) => s + l.credit, 0);
  const isBalanced = totalDebit === totalCredit && totalDebit > 0;

  const addLine = () => {
    setLines([...lines, { accountId: '', debit: 0, credit: 0 }]);
  };

  const removeLine = (idx: number) => {
    if (lines.length > 2) {
      setLines(lines.filter((_, i) => i !== idx));
    }
  };

  const updateLine = (idx: number, field: keyof JournalLine, value: string | number) => {
    const updated = [...lines];
    if (field === 'accountId') {
      updated[idx] = { ...updated[idx], accountId: value as string };
    } else if (field === 'debit') {
      updated[idx] = { ...updated[idx], debit: Number(value), credit: 0 };
    } else {
      updated[idx] = { ...updated[idx], credit: Number(value), debit: 0 };
    }
    setLines(updated);
  };

  const resetForm = () => {
    setDate(new Date().toISOString().split('T')[0]);
    setDescription('');
    setReference('');
    setLines([
      { accountId: '', debit: 0, credit: 0 },
      { accountId: '', debit: 0, credit: 0 },
    ]);
    setShowForm(false);
    setEditingId(null);
  };

  const handleSubmit = () => {
    if (!description || !isBalanced) return;
    const validLines = lines.filter(l => l.accountId && (l.debit > 0 || l.credit > 0));
    if (validLines.length < 2) return;

    if (editingId) {
      const updated = journals.map(j =>
        j.id === editingId ? { ...j, date, description, reference, lines: validLines } : j
      );
      onSave(updated);
    } else {
      const newJournal: JournalEntry = {
        id: Date.now().toString(),
        date,
        description,
        reference: reference || `JU-${String(journals.length + 1).padStart(3, '0')}`,
        lines: validLines,
      };
      onSave([...journals, newJournal]);
    }
    resetForm();
  };

  const handleEdit = (journal: JournalEntry) => {
    setDate(journal.date);
    setDescription(journal.description);
    setReference(journal.reference);
    setLines(journal.lines.length >= 2 ? journal.lines : [...journal.lines, { accountId: '', debit: 0, credit: 0 }]);
    setEditingId(journal.id);
    setShowForm(true);
  };

  const handleDelete = (id: string) => {
    if (confirm('Yakin ingin menghapus jurnal ini?')) {
      onSave(journals.filter(j => j.id !== id));
    }
  };

  const getAccountName = (id: string) => accounts.find(a => a.id === id)?.name || '-';
  const getAccountCode = (id: string) => accounts.find(a => a.id === id)?.code || '-';

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between flex-wrap gap-4">
        <div>
          <h1 className="text-3xl font-bold text-gray-800">Jurnal Umum</h1>
          <p className="text-gray-500 mt-1">Catat transaksi keuangan perusahaan</p>
        </div>
        <button
          onClick={() => { setShowForm(!showForm); setEditingId(null); }}
          className="bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 transition flex items-center gap-2"
        >
          <i className="fa-solid fa-plus"></i>
          Buat Jurnal
        </button>
      </div>

      {showForm && (
        <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6">
          <h3 className="font-semibold text-gray-800 mb-4">{editingId ? 'Edit Jurnal' : 'Jurnal Baru'}</h3>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-4">
            <div>
              <label className="block text-sm font-medium text-gray-600 mb-1">Tanggal</label>
              <input
                type="date"
                value={date}
                onChange={e => setDate(e.target.value)}
                className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-600 mb-1">Referensi</label>
              <input
                type="text"
                value={reference}
                onChange={e => setReference(e.target.value)}
                placeholder="JU-001"
                className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-600 mb-1">Keterangan</label>
              <input
                type="text"
                value={description}
                onChange={e => setDescription(e.target.value)}
                placeholder="Deskripsi transaksi"
                className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              />
            </div>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-gray-50">
                <tr>
                  <th className="text-left px-4 py-2 text-xs font-semibold text-gray-500">Akun</th>
                  <th className="text-right px-4 py-2 text-xs font-semibold text-gray-500 w-40">Debit</th>
                  <th className="text-right px-4 py-2 text-xs font-semibold text-gray-500 w-40">Kredit</th>
                  <th className="w-10"></th>
                </tr>
              </thead>
              <tbody>
                {lines.map((line, idx) => (
                  <tr key={idx} className="border-b border-gray-50">
                    <td className="px-4 py-2">
                      <select
                        value={line.accountId}
                        onChange={e => updateLine(idx, 'accountId', e.target.value)}
                        className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                      >
                        <option value="">Pilih Akun</option>
                        {accounts.map(a => (
                          <option key={a.id} value={a.id}>{a.code} - {a.name}</option>
                        ))}
                      </select>
                    </td>
                    <td className="px-4 py-2">
                      <input
                        type="number"
                        value={line.debit || ''}
                        onChange={e => updateLine(idx, 'debit', e.target.value)}
                        placeholder="0"
                        className="w-full border border-gray-300 rounded-lg px-3 py-2 text-right text-sm focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                      />
                    </td>
                    <td className="px-4 py-2">
                      <input
                        type="number"
                        value={line.credit || ''}
                        onChange={e => updateLine(idx, 'credit', e.target.value)}
                        placeholder="0"
                        className="w-full border border-gray-300 rounded-lg px-3 py-2 text-right text-sm focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                      />
                    </td>
                    <td className="px-2 py-2">
                      <button onClick={() => removeLine(idx)} className="text-red-400 hover:text-red-600">
                        <i className="fa-solid fa-circle-minus"></i>
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
              <tfoot className="bg-gray-50 font-semibold">
                <tr>
                  <td className="px-4 py-2 text-sm text-gray-600">Total</td>
                  <td className="px-4 py-2 text-right text-sm">{formatCurrency(totalDebit)}</td>
                  <td className="px-4 py-2 text-right text-sm">{formatCurrency(totalCredit)}</td>
                  <td></td>
                </tr>
              </tfoot>
            </table>
          </div>

          <div className="flex items-center justify-between mt-4">
            <button onClick={addLine} className="text-blue-600 hover:text-blue-800 text-sm font-medium">
              <i className="fa-solid fa-plus mr-1"></i> Tambah Baris
            </button>
            <div className="flex items-center gap-3">
              {!isBalanced && (totalDebit > 0 || totalCredit > 0) && (
                <span className="text-red-500 text-sm">
                  <i className="fa-solid fa-triangle-exclamation mr-1"></i>
                  Tidak seimbang (Selisih: {formatCurrency(Math.abs(totalDebit - totalCredit))})
                </span>
              )}
              <button onClick={resetForm} className="bg-gray-200 text-gray-700 px-4 py-2 rounded-lg hover:bg-gray-300 transition">
                Batal
              </button>
              <button
                onClick={handleSubmit}
                disabled={!isBalanced}
                className="bg-green-600 text-white px-4 py-2 rounded-lg hover:bg-green-700 transition disabled:opacity-50 disabled:cursor-not-allowed"
              >
                <i className="fa-solid fa-check mr-1"></i> Simpan
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Journal List */}
      <div className="space-y-4">
        {journals.sort((a, b) => b.date.localeCompare(a.date)).map(journal => (
          <div key={journal.id} className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden">
            <div className="bg-gray-50 px-6 py-3 flex items-center justify-between">
              <div className="flex items-center gap-3">
                <span className="bg-blue-100 text-blue-700 px-2 py-1 rounded text-xs font-semibold">{journal.reference}</span>
                <span className="text-sm text-gray-500">{formatDate(journal.date)}</span>
              </div>
              <div className="flex gap-2">
                <button onClick={() => handleEdit(journal)} className="text-blue-600 hover:text-blue-800 text-sm">
                  <i className="fa-solid fa-pen-to-square"></i>
                </button>
                <button onClick={() => handleDelete(journal.id)} className="text-red-600 hover:text-red-800 text-sm">
                  <i className="fa-solid fa-trash"></i>
                </button>
              </div>
            </div>
            <div className="px-6 py-2">
              <p className="font-medium text-gray-800">{journal.description}</p>
            </div>
            <div className="px-6 pb-4">
              <table className="w-full">
                <tbody>
                  {journal.lines.map((line, idx) => (
                    <tr key={idx} className="border-b border-gray-50 last:border-0">
                      <td className="py-2 text-sm">
                        {line.credit > 0 ? (
                          <span className="text-gray-600 pl-6">&nbsp;&nbsp;&nbsp;&nbsp;{getAccountCode(line.accountId)} - {getAccountName(line.accountId)}</span>
                        ) : (
                          <span className="text-gray-800 font-medium">{getAccountCode(line.accountId)} - {getAccountName(line.accountId)}</span>
                        )}
                      </td>
                      <td className="py-2 text-right text-sm font-medium text-gray-800 w-36">
                        {line.debit > 0 ? formatCurrency(line.debit) : ''}
                      </td>
                      <td className="py-2 text-right text-sm font-medium text-gray-800 w-36">
                        {line.credit > 0 ? formatCurrency(line.credit) : ''}
                      </td>
                    </tr>
                  ))}
                </tbody>
                <tfoot>
                  <tr className="border-t border-gray-200">
                    <td className="py-2 text-sm font-semibold text-gray-600">Total</td>
                    <td className="py-2 text-right text-sm font-bold">{formatCurrency(journal.lines.reduce((s, l) => s + l.debit, 0))}</td>
                    <td className="py-2 text-right text-sm font-bold">{formatCurrency(journal.lines.reduce((s, l) => s + l.credit, 0))}</td>
                  </tr>
                </tfoot>
              </table>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
