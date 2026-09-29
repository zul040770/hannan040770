import { useState, useEffect } from 'react';
import { Account, JournalEntry, PageType } from './types';
import { loadAccounts, saveAccounts, loadJournals, saveJournals } from './store';
import Dashboard from './components/Dashboard';
import ChartOfAccounts from './components/ChartOfAccounts';
import Journal from './components/Journal';
import Ledger from './components/Ledger';
import TrialBalance from './components/TrialBalance';
import IncomeStatement from './components/IncomeStatement';
import BalanceSheet from './components/BalanceSheet';
import CashFlow from './components/CashFlow';
import Depreciation from './components/Depreciation';
import Payroll from './components/Payroll';

const menuItems: { id: PageType; label: string; icon: string; group: string }[] = [
  { id: 'dashboard', label: 'Dashboard', icon: 'fa-gauge-high', group: 'main' },
  { id: 'accounts', label: 'Daftar Akun', icon: 'fa-list', group: 'main' },
  { id: 'journal', label: 'Jurnal Umum', icon: 'fa-book', group: 'main' },
  { id: 'ledger', label: 'Buku Besar', icon: 'fa-book-open', group: 'main' },
  { id: 'trial-balance', label: 'Neraca Saldo', icon: 'fa-scale-balanced', group: 'report' },
  { id: 'income-statement', label: 'Laba Rugi', icon: 'fa-chart-line', group: 'report' },
  { id: 'balance-sheet', label: 'Neraca', icon: 'fa-file-invoice-dollar', group: 'report' },
  { id: 'cash-flow', label: 'Arus Kas', icon: 'fa-money-bill-transfer', group: 'report' },
  { id: 'depreciation', label: 'Penyusutan Aset', icon: 'fa-building-circle-arrow-right', group: 'report' },
  { id: 'payroll', label: 'Gaji Karyawan', icon: 'fa-user-tie', group: 'payroll' },
];

export default function App() {
  const [currentPage, setCurrentPage] = useState<PageType>('dashboard');
  const [accounts, setAccounts] = useState<Account[]>([]);
  const [journals, setJournals] = useState<JournalEntry[]>([]);
  const [sidebarOpen, setSidebarOpen] = useState(true);

  useEffect(() => {
    setAccounts(loadAccounts());
    setJournals(loadJournals());
  }, []);

  const handleSaveAccounts = (newAccounts: Account[]) => {
    setAccounts(newAccounts);
    saveAccounts(newAccounts);
  };

  const handleSaveJournals = (newJournals: JournalEntry[]) => {
    setJournals(newJournals);
    saveJournals(newJournals);
  };

  const renderPage = () => {
    switch (currentPage) {
      case 'dashboard':
        return <Dashboard accounts={accounts} journals={journals} onNavigate={(p) => setCurrentPage(p as PageType)} />;
      case 'accounts':
        return <ChartOfAccounts accounts={accounts} journals={journals} onSave={handleSaveAccounts} />;
      case 'journal':
        return <Journal accounts={accounts} journals={journals} onSave={handleSaveJournals} />;
      case 'ledger':
        return <Ledger accounts={accounts} journals={journals} />;
      case 'trial-balance':
        return <TrialBalance accounts={accounts} journals={journals} />;
      case 'income-statement':
        return <IncomeStatement accounts={accounts} journals={journals} />;
      case 'balance-sheet':
        return <BalanceSheet accounts={accounts} journals={journals} />;
      case 'cash-flow':
        return <CashFlow accounts={accounts} journals={journals} />;
      case 'depreciation':
        return <Depreciation />;
      case 'payroll':
        return <Payroll />;
      default:
        return <Dashboard accounts={accounts} journals={journals} onNavigate={(p) => setCurrentPage(p as PageType)} />;
    }
  };

  return (
    <div className="min-h-screen bg-gray-50 flex">
      {/* Sidebar */}
      <aside className={`${sidebarOpen ? 'w-64' : 'w-20'} bg-white border-r border-gray-200 flex flex-col transition-all duration-300 fixed h-full z-30`}>
        {/* Logo */}
        <div className="p-4 border-b border-gray-100">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-gradient-to-br from-blue-600 to-indigo-700 rounded-lg flex items-center justify-center flex-shrink-0">
              <i className="fa-solid fa-calculator text-white text-lg"></i>
            </div>
            {sidebarOpen && (
              <div>
                <h1 className="font-bold text-gray-800 text-lg leading-tight">SimAk</h1>
                <p className="text-xs text-gray-400">Sistem Akuntansi</p>
              </div>
            )}
          </div>
        </div>

        {/* Navigation */}
        <nav className="flex-1 p-3 overflow-y-auto">
          {sidebarOpen && <p className="text-xs font-semibold text-gray-400 uppercase px-3 mb-2">Menu Utama</p>}
          {menuItems.filter(m => m.group === 'main').map(item => (
            <button
              key={item.id}
              onClick={() => setCurrentPage(item.id)}
              className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-lg mb-1 transition text-left ${
                currentPage === item.id
                  ? 'bg-blue-50 text-blue-700'
                  : 'text-gray-600 hover:bg-gray-50 hover:text-gray-800'
              }`}
            >
              <i className={`fa-solid ${item.icon} w-5 text-center ${currentPage === item.id ? 'text-blue-600' : 'text-gray-400'}`}></i>
              {sidebarOpen && <span className="text-sm font-medium">{item.label}</span>}
            </button>
          ))}

          {sidebarOpen && <p className="text-xs font-semibold text-gray-400 uppercase px-3 mb-2 mt-6">Laporan Keuangan</p>}
          {!sidebarOpen && <div className="border-t border-gray-100 my-3"></div>}
          {menuItems.filter(m => m.group === 'report').map(item => (
            <button
              key={item.id}
              onClick={() => setCurrentPage(item.id)}
              className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-lg mb-1 transition text-left ${
                currentPage === item.id
                  ? 'bg-blue-50 text-blue-700'
                  : 'text-gray-600 hover:bg-gray-50 hover:text-gray-800'
              }`}
            >
              <i className={`fa-solid ${item.icon} w-5 text-center ${currentPage === item.id ? 'text-blue-600' : 'text-gray-400'}`}></i>
              {sidebarOpen && <span className="text-sm font-medium">{item.label}</span>}
            </button>
          ))}

          {sidebarOpen && <p className="text-xs font-semibold text-gray-400 uppercase px-3 mb-2 mt-6">Penggajian</p>}
          {!sidebarOpen && <div className="border-t border-gray-100 my-3"></div>}
          {menuItems.filter(m => m.group === 'payroll').map(item => (
            <button
              key={item.id}
              onClick={() => setCurrentPage(item.id)}
              className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-lg mb-1 transition text-left ${
                currentPage === item.id
                  ? 'bg-red-50 text-red-700'
                  : 'text-gray-600 hover:bg-gray-50 hover:text-gray-800'
              }`}
            >
              <i className={`fa-solid ${item.icon} w-5 text-center ${currentPage === item.id ? 'text-red-600' : 'text-gray-400'}`}></i>
              {sidebarOpen && <span className="text-sm font-medium">{item.label}</span>}
              {sidebarOpen && <i className="fa-solid fa-lock text-xs text-gray-400 ml-auto"></i>}
            </button>
          ))}
        </nav>

        {/* Toggle Button */}
        <div className="p-3 border-t border-gray-100">
          <button
            onClick={() => setSidebarOpen(!sidebarOpen)}
            className="w-full flex items-center justify-center gap-2 px-3 py-2 rounded-lg text-gray-500 hover:bg-gray-50 transition"
          >
            <i className={`fa-solid ${sidebarOpen ? 'fa-angles-left' : 'fa-angles-right'}`}></i>
            {sidebarOpen && <span className="text-sm">Tutup Menu</span>}
          </button>
        </div>
      </aside>

      {/* Main Content */}
      <main className={`flex-1 ${sidebarOpen ? 'ml-64' : 'ml-20'} transition-all duration-300`}>
        {/* Top Bar */}
        <header className="bg-white border-b border-gray-200 px-6 py-4 sticky top-0 z-20">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              <button
                onClick={() => setSidebarOpen(!sidebarOpen)}
                className="lg:hidden text-gray-500 hover:text-gray-700"
              >
                <i className="fa-solid fa-bars text-xl"></i>
              </button>
              <div>
                <h2 className="font-semibold text-gray-800">
                  {menuItems.find(m => m.id === currentPage)?.label || 'Dashboard'}
                </h2>
                <p className="text-xs text-gray-400">PT. Contoh Perusahaan</p>
              </div>
            </div>
            <div className="flex items-center gap-4">
              <div className="hidden md:flex items-center gap-2 bg-gray-100 rounded-lg px-3 py-2">
                <i className="fa-solid fa-magnifying-glass text-gray-400 text-sm"></i>
                <input
                  type="text"
                  placeholder="Cari..."
                  className="bg-transparent border-none outline-none text-sm text-gray-600 w-40"
                />
              </div>
              <div className="w-9 h-9 bg-gradient-to-br from-blue-500 to-purple-600 rounded-full flex items-center justify-center">
                <i className="fa-solid fa-user text-white text-sm"></i>
              </div>
            </div>
          </div>
        </header>

        {/* Page Content */}
        <div className="p-6">
          {renderPage()}
        </div>
      </main>
    </div>
  );
}
