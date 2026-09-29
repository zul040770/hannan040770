import { Account, JournalEntry } from '../types';
import { formatCurrency } from '../store';

interface Props {
  accounts: Account[];
  journals: JournalEntry[];
}

interface CashFlowItem {
  label: string;
  amount: number;
}

export default function CashFlowStatement({ accounts, journals }: Props) {
  const getAccountBalance = (account: Account) => {
    const lines = journals.flatMap(j => j.lines.filter(l => l.accountId === account.id));
    if (account.normalBalance === 'debit') {
      return lines.reduce((sum, l) => sum + l.debit - l.credit, 0);
    }
    return lines.reduce((sum, l) => sum + l.credit - l.debit, 0);
  };

  const getAccountChange = (account: Account) => {
    const lines = journals.flatMap(j => j.lines.filter(l => l.accountId === account.id));
    if (account.normalBalance === 'debit') {
      return lines.reduce((sum, l) => sum + l.debit - l.credit, 0);
    }
    return lines.reduce((sum, l) => sum + l.credit - l.debit, 0);
  };

  // Klasifikasi akun ke aktivitas arus kas
  const operatingAccountIds = ['3', '4', '5', '11', '13', '14']; // Piutang, Persediaan, Perlengkapan, Hutang Usaha, Hutang Gaji, Hutang Pajak
  const investingAccountIds = ['6', '7', '8', '9', '10']; // Peralatan, Akum Peny Peralatan, Tanah, Bangunan, Akum Peny Bangunan
  const financingAccountIds = ['12', '15', '16']; // Hutang Bank, Modal, Prive

  // ===== AKTIVITAS OPERASI (Metode Tidak Langsung) =====
  const netIncome = accounts
    .filter(a => a.type === 'revenue' || a.type === 'expense')
    .reduce((sum, a) => sum + getAccountBalance(a), 0);

  // Penyesuaian untuk perubahan modal kerja
  const piutangChange = accounts
    .filter(a => a.id === '3')
    .reduce((sum, a) => sum + getAccountChange(a), 0);

  const persediaanChange = accounts
    .filter(a => a.id === '4')
    .reduce((sum, a) => sum + getAccountChange(a), 0);

  const perlengkapanChange = accounts
    .filter(a => a.id === '5')
    .reduce((sum, a) => sum + getAccountChange(a), 0);

  const hutangUsahaChange = accounts
    .filter(a => a.id === '11')
    .reduce((sum, a) => sum + getAccountChange(a), 0);

  const hutangGajiChange = accounts
    .filter(a => a.id === '13')
    .reduce((sum, a) => sum + getAccountChange(a), 0);

  const hutangPajakChange = accounts
    .filter(a => a.id === '14')
    .reduce((sum, a) => sum + getAccountChange(a), 0);

  // Penyusutan (non-cash expense)
  const depreciation = accounts
    .filter(a => a.id === '25')
    .reduce((sum, a) => sum + getAccountBalance(a), 0);

  const operatingItems: CashFlowItem[] = [
    { label: 'Laba/Rugi Bersih', amount: netIncome },
    { label: 'Penyusutan (non-kas)', amount: depreciation },
    { label: 'Kenaikan Piutang Usaha', amount: -piutangChange },
    { label: 'Kenaikan Persediaan', amount: -persediaanChange },
    { label: 'Kenaikan Perlengkapan', amount: -perlengkapanChange },
    { label: 'Kenaikan Hutang Usaha', amount: hutangUsahaChange },
    { label: 'Kenaikan Hutang Gaji', amount: hutangGajiChange },
    { label: 'Kenaikan Hutang Pajak', amount: hutangPajakChange },
  ].filter(item => item.amount !== 0);

  const netOperatingCash = operatingItems.reduce((s, i) => s + i.amount, 0);

  // ===== AKTIVITAS INVESTASI =====
  const investingItems: CashFlowItem[] = [];

  // Perubahan aset tetap
  const equipmentChange = accounts
    .filter(a => a.id === '6')
    .reduce((sum, a) => sum + getAccountChange(a), 0);
  if (equipmentChange !== 0) {
    investingItems.push({ label: 'Pembelian/Penjualan Peralatan', amount: -equipmentChange });
  }

  const landChange = accounts
    .filter(a => a.id === '7')
    .reduce((sum, a) => sum + getAccountChange(a), 0);
  if (landChange !== 0) {
    investingItems.push({ label: 'Pembelian/Penjualan Tanah', amount: -landChange });
  }

  const buildingChange = accounts
    .filter(a => a.id === '8')
    .reduce((sum, a) => sum + getAccountChange(a), 0);
  if (buildingChange !== 0) {
    investingItems.push({ label: 'Pembelian/Penjualan Bangunan', amount: -buildingChange });
  }

  const netInvestingCash = investingItems.reduce((s, i) => s + i.amount, 0);

  // ===== AKTIVITAS PENDANAAN =====
  const financingItems: CashFlowItem[] = [];

  const bankLoanChange = accounts
    .filter(a => a.id === '12')
    .reduce((sum, a) => sum + getAccountChange(a), 0);
  if (bankLoanChange !== 0) {
    financingItems.push({ label: 'Penerimaan/Pembayaran Hutang Bank', amount: bankLoanChange });
  }

  const capitalChange = accounts
    .filter(a => a.id === '15')
    .reduce((sum, a) => sum + getAccountChange(a), 0);
  if (capitalChange !== 0) {
    financingItems.push({ label: 'Setoran Modal', amount: capitalChange });
  }

  const priveChange = accounts
    .filter(a => a.id === '16')
    .reduce((sum, a) => sum + getAccountChange(a), 0);
  if (priveChange !== 0) {
    financingItems.push({ label: 'Prive/Penarikan Pemilik', amount: -priveChange });
  }

  const netFinancingCash = financingItems.reduce((s, i) => s + i.amount, 0);

  // ===== TOTAL =====
  const netCashChange = netOperatingCash + netInvestingCash + netFinancingCash;

  // Saldo kas awal dan akhir
  const cashBalance = accounts
    .filter(a => a.id === '1' || a.id === '2')
    .reduce((sum, a) => sum + getAccountBalance(a), 0);
  const beginningCash = cashBalance - netCashChange;
  const endingCash = cashBalance;

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold text-gray-800">Laporan Arus Kas</h1>
        <p className="text-gray-500 mt-1">Cash Flow Statement - Arus kas masuk dan keluar perusahaan</p>
      </div>

      <div className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden max-w-4xl mx-auto">
        <div className="bg-gradient-to-r from-teal-600 to-cyan-600 px-6 py-4">
          <h3 className="text-white font-bold text-xl text-center">LAPORAN ARUS KAS</h3>
          <p className="text-teal-100 text-sm text-center">Untuk Periode yang Berakhir 31 Januari 2024</p>
        </div>

        <div className="p-6 space-y-8">
          {/* ARUS KAS DARI AKTIVITAS OPERASI */}
          <div>
            <h4 className="font-bold text-gray-800 text-lg border-b-2 border-teal-500 pb-2 mb-4 flex items-center gap-2">
              <i className="fa-solid fa-gear text-teal-600"></i>
              ARUS KAS DARI AKTIVITAS OPERASI
            </h4>
            <div className="space-y-2">
              {operatingItems.map((item, idx) => (
                <div key={idx} className="flex justify-between items-center py-1.5">
                  <span className="text-gray-700 text-sm">{item.label}</span>
                  <span className={`font-medium text-sm ${item.amount >= 0 ? 'text-gray-800' : 'text-red-600'}`}>
                    {formatCurrency(item.amount)}
                  </span>
                </div>
              ))}
              {operatingItems.length === 0 && (
                <p className="text-gray-400 text-sm italic">Tidak ada aktivitas operasi</p>
              )}
            </div>
            <div className="flex justify-between items-center py-3 border-t-2 border-teal-200 mt-3 bg-teal-50 rounded px-4">
              <span className="font-bold text-teal-800">Kas Bersih dari Aktivitas Operasi</span>
              <span className={`font-bold text-lg ${netOperatingCash >= 0 ? 'text-teal-700' : 'text-red-600'}`}>
                {formatCurrency(netOperatingCash)}
              </span>
            </div>
          </div>

          {/* ARUS KAS DARI AKTIVITAS INVESTASI */}
          <div>
            <h4 className="font-bold text-gray-800 text-lg border-b-2 border-blue-500 pb-2 mb-4 flex items-center gap-2">
              <i className="fa-solid fa-building text-blue-600"></i>
              ARUS KAS DARI AKTIVITAS INVESTASI
            </h4>
            <div className="space-y-2">
              {investingItems.map((item, idx) => (
                <div key={idx} className="flex justify-between items-center py-1.5">
                  <span className="text-gray-700 text-sm">{item.label}</span>
                  <span className={`font-medium text-sm ${item.amount >= 0 ? 'text-gray-800' : 'text-red-600'}`}>
                    {formatCurrency(item.amount)}
                  </span>
                </div>
              ))}
              {investingItems.length === 0 && (
                <p className="text-gray-400 text-sm italic">Tidak ada aktivitas investasi</p>
              )}
            </div>
            <div className="flex justify-between items-center py-3 border-t-2 border-blue-200 mt-3 bg-blue-50 rounded px-4">
              <span className="font-bold text-blue-800">Kas Bersih dari Aktivitas Investasi</span>
              <span className={`font-bold text-lg ${netInvestingCash >= 0 ? 'text-blue-700' : 'text-red-600'}`}>
                {formatCurrency(netInvestingCash)}
              </span>
            </div>
          </div>

          {/* ARUS KAS DARI AKTIVITAS PENDANAAN */}
          <div>
            <h4 className="font-bold text-gray-800 text-lg border-b-2 border-purple-500 pb-2 mb-4 flex items-center gap-2">
              <i className="fa-solid fa-hand-holding-dollar text-purple-600"></i>
              ARUS KAS DARI AKTIVITAS PENDANAAN
            </h4>
            <div className="space-y-2">
              {financingItems.map((item, idx) => (
                <div key={idx} className="flex justify-between items-center py-1.5">
                  <span className="text-gray-700 text-sm">{item.label}</span>
                  <span className={`font-medium text-sm ${item.amount >= 0 ? 'text-gray-800' : 'text-red-600'}`}>
                    {formatCurrency(item.amount)}
                  </span>
                </div>
              ))}
              {financingItems.length === 0 && (
                <p className="text-gray-400 text-sm italic">Tidak ada aktivitas pendanaan</p>
              )}
            </div>
            <div className="flex justify-between items-center py-3 border-t-2 border-purple-200 mt-3 bg-purple-50 rounded px-4">
              <span className="font-bold text-purple-800">Kas Bersih dari Aktivitas Pendanaan</span>
              <span className={`font-bold text-lg ${netFinancingCash >= 0 ? 'text-purple-700' : 'text-red-600'}`}>
                {formatCurrency(netFinancingCash)}
              </span>
            </div>
          </div>

          {/* KENAIKAN/PENURUNAN KAS BERSIH */}
          <div className="border-t-2 border-gray-800 pt-4">
            <div className="flex justify-between items-center py-3 bg-gray-100 rounded-lg px-4">
              <span className="font-bold text-gray-800 text-lg">Kenaikan (Penurunan) Kas Bersih</span>
              <span className={`font-bold text-xl ${netCashChange >= 0 ? 'text-green-700' : 'text-red-700'}`}>
                {formatCurrency(netCashChange)}
              </span>
            </div>
          </div>

          {/* SALDO KAS */}
          <div className="space-y-2">
            <div className="flex justify-between items-center py-2">
              <span className="text-gray-700">Saldo Kas Awal Periode</span>
              <span className="font-medium text-gray-800">{formatCurrency(beginningCash)}</span>
            </div>
            <div className="flex justify-between items-center py-2 border-t border-dashed">
              <span className="text-gray-700">Kenaikan (Penurunan) Kas</span>
              <span className={`font-medium ${netCashChange >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                {formatCurrency(netCashChange)}
              </span>
            </div>
            <div className="flex justify-between items-center py-3 border-t-2 border-gray-800 bg-gradient-to-r from-green-50 to-emerald-50 rounded-lg px-4">
              <span className="font-bold text-gray-800 text-lg">Saldo Kas Akhir Periode</span>
              <span className="font-bold text-xl text-green-700">{formatCurrency(endingCash)}</span>
            </div>
          </div>

          {/* Visualisasi */}
          <div className="pt-4 border-t border-gray-200">
            <h5 className="font-semibold text-gray-700 mb-3 text-sm">Komposisi Arus Kas</h5>
            <div className="space-y-3">
              <div>
                <div className="flex justify-between text-sm mb-1">
                  <span className="text-gray-600">Operasi</span>
                  <span className={`font-medium ${netOperatingCash >= 0 ? 'text-teal-600' : 'text-red-600'}`}>
                    {formatCurrency(netOperatingCash)}
                  </span>
                </div>
                <div className="w-full bg-gray-100 rounded-full h-3">
                  <div
                    className={`h-3 rounded-full ${netOperatingCash >= 0 ? 'bg-teal-500' : 'bg-red-500'}`}
                    style={{ width: `${Math.min(Math.abs(netOperatingCash) / (Math.abs(netOperatingCash) + Math.abs(netInvestingCash) + Math.abs(netFinancingCash) || 1) * 100, 100)}%` }}
                  ></div>
                </div>
              </div>
              <div>
                <div className="flex justify-between text-sm mb-1">
                  <span className="text-gray-600">Investasi</span>
                  <span className={`font-medium ${netInvestingCash >= 0 ? 'text-blue-600' : 'text-red-600'}`}>
                    {formatCurrency(netInvestingCash)}
                  </span>
                </div>
                <div className="w-full bg-gray-100 rounded-full h-3">
                  <div
                    className={`h-3 rounded-full ${netInvestingCash >= 0 ? 'bg-blue-500' : 'bg-red-500'}`}
                    style={{ width: `${Math.min(Math.abs(netInvestingCash) / (Math.abs(netOperatingCash) + Math.abs(netInvestingCash) + Math.abs(netFinancingCash) || 1) * 100, 100)}%` }}
                  ></div>
                </div>
              </div>
              <div>
                <div className="flex justify-between text-sm mb-1">
                  <span className="text-gray-600">Pendanaan</span>
                  <span className={`font-medium ${netFinancingCash >= 0 ? 'text-purple-600' : 'text-red-600'}`}>
                    {formatCurrency(netFinancingCash)}
                  </span>
                </div>
                <div className="w-full bg-gray-100 rounded-full h-3">
                  <div
                    className={`h-3 rounded-full ${netFinancingCash >= 0 ? 'bg-purple-500' : 'bg-red-500'}`}
                    style={{ width: `${Math.min(Math.abs(netFinancingCash) / (Math.abs(netOperatingCash) + Math.abs(netInvestingCash) + Math.abs(netFinancingCash) || 1) * 100, 100)}%` }}
                  ></div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
