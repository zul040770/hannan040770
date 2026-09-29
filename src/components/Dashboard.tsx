import { Account, JournalEntry } from '../types';
import { formatCurrency } from '../store';

interface Props {
  accounts: Account[];
  journals: JournalEntry[];
  onNavigate: (page: string) => void;
}

export default function Dashboard({ accounts, journals, onNavigate }: Props) {
  const totalAssets = accounts
    .filter(a => a.type === 'asset')
    .reduce((sum, acc) => {
      const balance = journals
        .flatMap(j => j.lines.filter(l => l.accountId === acc.id))
        .reduce((b, l) => b + l.debit - l.credit, 0);
      return sum + (acc.normalBalance === 'debit' ? balance : -balance);
    }, 0);

  const totalLiabilities = accounts
    .filter(a => a.type === 'liability')
    .reduce((sum, acc) => {
      const balance = journals
        .flatMap(j => j.lines.filter(l => l.accountId === acc.id))
        .reduce((b, l) => b + l.credit - l.debit, 0);
      return sum + balance;
    }, 0);

  const totalRevenue = accounts
    .filter(a => a.type === 'revenue')
    .reduce((sum, acc) => {
      const balance = journals
        .flatMap(j => j.lines.filter(l => l.accountId === acc.id))
        .reduce((b, l) => b + l.credit - l.debit, 0);
      return sum + balance;
    }, 0);

  const totalExpenses = accounts
    .filter(a => a.type === 'expense')
    .reduce((sum, acc) => {
      const balance = journals
        .flatMap(j => j.lines.filter(l => l.accountId === acc.id))
        .reduce((b, l) => b + l.debit - l.credit, 0);
      return sum + balance;
    }, 0);

  const netIncome = totalRevenue - totalExpenses;

  const cards = [
    { label: 'Total Aset', value: totalAssets, color: 'bg-blue-500', icon: 'fa-building-columns', page: 'balance-sheet' },
    { label: 'Total Liabilitas', value: totalLiabilities, color: 'bg-red-500', icon: 'fa-file-invoice-dollar', page: 'balance-sheet' },
    { label: 'Total Pendapatan', value: totalRevenue, color: 'bg-green-500', icon: 'fa-arrow-trend-up', page: 'income-statement' },
    { label: 'Total Beban', value: totalExpenses, color: 'bg-orange-500', icon: 'fa-arrow-trend-down', page: 'income-statement' },
    { label: 'Laba/Rugi Bersih', value: netIncome, color: netIncome >= 0 ? 'bg-emerald-500' : 'bg-rose-600', icon: 'fa-scale-balanced', page: 'income-statement' },
    { label: 'Jumlah Akun', value: accounts.length, color: 'bg-purple-500', icon: 'fa-list', page: 'accounts', isCount: true },
  ];

  return (
    <div className="space-y-6">
      {/* Periode Banner */}
      <div className="bg-gradient-to-r from-blue-600 to-indigo-600 rounded-xl p-4 text-white flex items-center justify-between">
        <div className="flex items-center gap-3">
          <i className="fa-solid fa-calendar-days text-2xl"></i>
          <div>
            <p className="font-bold text-lg">Periode Pembukuan Aktif</p>
            <p className="text-blue-100 text-sm">1 Januari 2026 - 31 Desember 2026</p>
          </div>
        </div>
        <div className="text-right">
          <p className="text-xs text-blue-200">Tahun Buku</p>
          <p className="font-bold text-2xl">2026</p>
        </div>
      </div>

      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-gray-800">Dashboard</h1>
          <p className="text-gray-500 mt-1">Ringkasan keuangan perusahaan Anda</p>
        </div>
        <div className="text-sm text-gray-500">
          <i className="fa-regular fa-calendar mr-1"></i>
          Periode: 1 Jan - 31 Des 2026
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {cards.map((card, idx) => (
          <div
            key={idx}
            onClick={() => onNavigate(card.page)}
            className="bg-white rounded-xl shadow-sm border border-gray-100 p-5 hover:shadow-md transition-shadow cursor-pointer"
          >
            <div className="flex items-center gap-4">
              <div className={`${card.color} w-12 h-12 rounded-lg flex items-center justify-center`}>
                <i className={`fa-solid ${card.icon} text-white text-lg`}></i>
              </div>
              <div>
                <p className="text-sm text-gray-500">{card.label}</p>
                <p className="text-xl font-bold text-gray-800">
                  {card.isCount ? card.value : formatCurrency(card.value)}
                </p>
              </div>
            </div>
          </div>
        ))}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6">
          <h3 className="text-lg font-semibold text-gray-800 mb-4">
            <i className="fa-solid fa-clock-rotate-left mr-2 text-blue-500"></i>
            Transaksi Terakhir
          </h3>
          <div className="space-y-3">
            {journals.slice(-5).reverse().map(j => (
              <div key={j.id} className="flex items-center justify-between py-2 border-b border-gray-50 last:border-0">
                <div>
                  <p className="font-medium text-gray-700 text-sm">{j.description}</p>
                  <p className="text-xs text-gray-400">{j.reference} • {j.date}</p>
                </div>
                <span className="text-sm font-semibold text-blue-600">
                  {formatCurrency(j.lines.reduce((s, l) => s + l.debit, 0))}
                </span>
              </div>
            ))}
          </div>
        </div>

        <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6">
          <h3 className="text-lg font-semibold text-gray-800 mb-4">
            <i className="fa-solid fa-chart-pie mr-2 text-green-500"></i>
            Ringkasan Laba Rugi
          </h3>
          <div className="space-y-4">
            <div className="flex justify-between items-center">
              <span className="text-gray-600">Pendapatan</span>
              <span className="font-semibold text-green-600">{formatCurrency(totalRevenue)}</span>
            </div>
            <div className="flex justify-between items-center">
              <span className="text-gray-600">Beban</span>
              <span className="font-semibold text-red-600">{formatCurrency(totalExpenses)}</span>
            </div>
            <div className="border-t pt-3 flex justify-between items-center">
              <span className="font-semibold text-gray-800">Laba/Rugi Bersih</span>
              <span className={`font-bold text-lg ${netIncome >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                {formatCurrency(netIncome)}
              </span>
            </div>
          </div>
          <div className="mt-4 bg-gray-100 rounded-full h-4 overflow-hidden">
            <div
              className="h-full bg-gradient-to-r from-green-400 to-green-600 rounded-full transition-all"
              style={{ width: `${totalRevenue > 0 ? Math.min((netIncome / totalRevenue) * 100, 100) : 0}%` }}
            ></div>
          </div>
          <p className="text-xs text-gray-400 mt-1">Margin laba bersih: {totalRevenue > 0 ? ((netIncome / totalRevenue) * 100).toFixed(1) : 0}%</p>
        </div>
      </div>
    </div>
  );
}
