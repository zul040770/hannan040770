import { useState } from 'react';
import { Account, AccountType, JournalEntry } from '../types';
import { formatCurrency } from '../store';

interface Props {
  accounts: Account[];
  journals: JournalEntry[];
  onSave: (accounts: Account[]) => void;
}

const typeLabels: Record<AccountType, string> = {
  asset: 'Aset',
  liability: 'Liabilitas',
  equity: 'Ekuitas',
  revenue: 'Pendapatan',
  expense: 'Beban',
};

const typeColors: Record<AccountType, string> = {
  asset: 'bg-blue-100 text-blue-700',
  liability: 'bg-red-100 text-red-700',
  equity: 'bg-purple-100 text-purple-700',
  revenue: 'bg-green-100 text-green-700',
  expense: 'bg-orange-100 text-orange-700',
};

export default function ChartOfAccounts({ accounts, journals, onSave }: Props) {
  const [showForm, setShowForm] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [filter, setFilter] = useState<AccountType | 'all'>('all');
  const [form, setForm] = useState({ code: '', name: '', type: 'asset' as AccountType });

  const getBalance = (account: Account) => {
    const lines = journals.flatMap(j => j.lines.filter(l => l.accountId === account.id));
    if (account.normalBalance === 'debit') {
      return lines.reduce((sum, l) => sum + l.debit - l.credit, 0);
    }
    return lines.reduce((sum, l) => sum + l.credit - l.debit, 0);
  };

  const filtered = filter === 'all' ? accounts : accounts.filter(a => a.type === filter);

  const handleSubmit = () => {
    if (!form.code || !form.name) return;
    if (editingId) {
      const updated = accounts.map(a =>
        a.id === editingId ? { ...a, code: form.code, name: form.name, type: form.type, normalBalance: (['asset', 'expense'].includes(form.type) ? 'debit' : 'credit') as 'debit' | 'credit' } : a
      );
      onSave(updated);
    } else {
      const newAccount: Account = {
        id: Date.now().toString(),
        code: form.code,
        name: form.name,
        type: form.type,
        normalBalance: ['asset', 'expense'].includes(form.type) ? 'debit' : 'credit',
      };
      onSave([...accounts, newAccount].sort((a, b) => a.code.localeCompare(b.code)));
    }
    setForm({ code: '', name: '', type: 'asset' });
    setShowForm(false);
    setEditingId(null);
  };

  const handleEdit = (account: Account) => {
    setForm({ code: account.code, name: account.name, type: account.type });
    setEditingId(account.id);
    setShowForm(true);
  };

  const handleDelete = (id: string) => {
    if (confirm('Yakin ingin menghapus akun ini?')) {
      onSave(accounts.filter(a => a.id !== id));
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between flex-wrap gap-4">
        <div>
          <h1 className="text-3xl font-bold text-gray-800">Daftar Akun</h1>
          <p className="text-gray-500 mt-1">Chart of Accounts - Kelola akun-akun perusahaan</p>
        </div>
        <button
          onClick={() => { setShowForm(!showForm); setEditingId(null); setForm({ code: '', name: '', type: 'asset' }); }}
          className="bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 transition flex items-center gap-2"
        >
          <i className="fa-solid fa-plus"></i>
          Tambah Akun
        </button>
      </div>

      {showForm && (
        <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6">
          <h3 className="font-semibold text-gray-800 mb-4">{editingId ? 'Edit Akun' : 'Tambah Akun Baru'}</h3>
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-600 mb-1">Kode Akun</label>
              <input
                type="text"
                value={form.code}
                onChange={e => setForm({ ...form, code: e.target.value })}
                placeholder="1-1000"
                className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-600 mb-1">Nama Akun</label>
              <input
                type="text"
                value={form.name}
                onChange={e => setForm({ ...form, name: e.target.value })}
                placeholder="Nama akun"
                className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-600 mb-1">Tipe</label>
              <select
                value={form.type}
                onChange={e => setForm({ ...form, type: e.target.value as AccountType })}
                className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              >
                <option value="asset">Aset</option>
                <option value="liability">Liabilitas</option>
                <option value="equity">Ekuitas</option>
                <option value="revenue">Pendapatan</option>
                <option value="expense">Beban</option>
              </select>
            </div>
            <div className="flex items-end gap-2">
              <button onClick={handleSubmit} className="bg-green-600 text-white px-4 py-2 rounded-lg hover:bg-green-700 transition">
                <i className="fa-solid fa-check mr-1"></i> Simpan
              </button>
              <button onClick={() => { setShowForm(false); setEditingId(null); }} className="bg-gray-200 text-gray-700 px-4 py-2 rounded-lg hover:bg-gray-300 transition">
                Batal
              </button>
            </div>
          </div>
        </div>
      )}

      <div className="flex gap-2 flex-wrap">
        <button
          onClick={() => setFilter('all')}
          className={`px-3 py-1.5 rounded-full text-sm font-medium transition ${filter === 'all' ? 'bg-gray-800 text-white' : 'bg-gray-100 text-gray-600 hover:bg-gray-200'}`}
        >
          Semua ({accounts.length})
        </button>
        {(Object.keys(typeLabels) as AccountType[]).map(type => (
          <button
            key={type}
            onClick={() => setFilter(type)}
            className={`px-3 py-1.5 rounded-full text-sm font-medium transition ${filter === type ? 'bg-gray-800 text-white' : 'bg-gray-100 text-gray-600 hover:bg-gray-200'}`}
          >
            {typeLabels[type]} ({accounts.filter(a => a.type === type).length})
          </button>
        ))}
      </div>

      <div className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden">
        <table className="w-full">
          <thead className="bg-gray-50">
            <tr>
              <th className="text-left px-6 py-3 text-xs font-semibold text-gray-500 uppercase">Kode</th>
              <th className="text-left px-6 py-3 text-xs font-semibold text-gray-500 uppercase">Nama Akun</th>
              <th className="text-left px-6 py-3 text-xs font-semibold text-gray-500 uppercase">Tipe</th>
              <th className="text-left px-6 py-3 text-xs font-semibold text-gray-500 uppercase">Saldo Normal</th>
              <th className="text-right px-6 py-3 text-xs font-semibold text-gray-500 uppercase">Saldo</th>
              <th className="text-center px-6 py-3 text-xs font-semibold text-gray-500 uppercase">Aksi</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-50">
            {filtered.map(account => (
              <tr key={account.id} className="hover:bg-gray-50 transition">
                <td className="px-6 py-3 font-mono text-sm text-gray-700">{account.code}</td>
                <td className="px-6 py-3 font-medium text-gray-800">{account.name}</td>
                <td className="px-6 py-3">
                  <span className={`px-2 py-1 rounded-full text-xs font-medium ${typeColors[account.type]}`}>
                    {typeLabels[account.type]}
                  </span>
                </td>
                <td className="px-6 py-3 text-sm text-gray-600 capitalize">{account.normalBalance}</td>
                <td className="px-6 py-3 text-right font-semibold text-gray-800">{formatCurrency(getBalance(account))}</td>
                <td className="px-6 py-3 text-center">
                  <button onClick={() => handleEdit(account)} className="text-blue-600 hover:text-blue-800 mx-1">
                    <i className="fa-solid fa-pen-to-square"></i>
                  </button>
                  <button onClick={() => handleDelete(account.id)} className="text-red-600 hover:text-red-800 mx-1">
                    <i className="fa-solid fa-trash"></i>
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
