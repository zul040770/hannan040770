import { Account, JournalEntry } from '../types';
import { formatCurrency } from '../store';

interface Props {
  accounts: Account[];
  journals: JournalEntry[];
}

export default function CashFlow({ accounts, journals }: Props) {
  const getAccountBalance = (account: Account) => {
    const lines = journals.flatMap(j => j.lines.filter(l => l.accountId === account.id));
    if (account.normalBalance === 'debit') {
      return lines.reduce((sum, l) => sum + l.debit - l.credit, 0);
    }
    return lines.reduce((sum, l) => sum + l.credit - l.debit, 0);
  };

  // Net income
  const totalRevenue = accounts
    .filter(a => a.type === 'revenue')
    .reduce((sum, a) => sum + getAccountBalance(a), 0);
  const totalExpenses = accounts
    .filter(a => a.type === 'expense')
    .reduce((sum, a) => sum + getAccountBalance(a), 0);
  const netIncome = totalRevenue - totalExpenses;

  // Depreciation (non-cash expense)
  const depreciationAccounts = accounts.filter(a => a.name.toLowerCase().includes('penyusutan') && a.type === 'expense');
  const depreciation = depreciationAccounts.reduce((sum, a) => sum + getAccountBalance(a), 0);

  // Changes in working capital (operating assets & liabilities)
  const piutangAccount = accounts.find(a => a.name.toLowerCase().includes('piutang'));
  const persediaanAccount = accounts.find(a => a.name.toLowerCase().includes('persediaan'));
  const perlengkapanAccount = accounts.find(a => a.name.toLowerCase().includes('perlengkapan') && a.type === 'asset');
  const hutangUsahaAccount = accounts.find(a => a.name.toLowerCase().includes('hutang usaha'));
  const hutangGajiAccount = accounts.find(a => a.name.toLowerCase().includes('hutang gaji'));
  const hutangPajakAccount = accounts.find(a => a.name.toLowerCase().includes('hutang pajak'));

  const piutangBalance = piutangAccount ? getAccountBalance(piutangAccount) : 0;
  const persediaanBalance = persediaanAccount ? getAccountBalance(persediaanAccount) : 0;
  const perlengkapanBalance = perlengkapanAccount ? getAccountBalance(perlengkapanAccount) : 0;
  const hutangUsahaBalance = hutangUsahaAccount ? getAccountBalance(hutangUsahaAccount) : 0;
  const hutangGajiBalance = hutangGajiAccount ? getAccountBalance(hutangGajiAccount) : 0;
  const hutangPajakBalance = hutangPajakAccount ? getAccountBalance(hutangPajakAccount) : 0;

  // Operating Activities (Indirect Method)
  const operatingActivities = [
    { label: 'Laba Bersih', amount: netIncome, isBold: false },
    { label: 'Penyesuaian untuk rekonsiliasi ke arus kas bersih:', amount: 0, isBold: true, isHeader: true },
    { label: '(+) Beban Penyusutan', amount: depreciation, isBold: false },
    { label: 'Perubahan aset dan liabilitas operasional:', amount: 0, isBold: true, isHeader: true },
    { label: piutangAccount ? `Penurunan (kenaikan) piutang usaha` : '', amount: -piutangBalance, isBold: false, hide: !piutangAccount },
    { label: persediaanAccount ? `Penurunan (kenaikan) persediaan` : '', amount: -persediaanBalance, isBold: false, hide: !persediaanAccount },
    { label: perlengkapanAccount ? `Penurunan (kenaikan) perlengkapan` : '', amount: -perlengkapanBalance, isBold: false, hide: !perlengkapanAccount },
    { label: hutangUsahaAccount ? `Kenaikan (penurunan) hutang usaha` : '', amount: hutangUsahaBalance, isBold: false, hide: !hutangUsahaAccount },
    { label: hutangGajiAccount ? `Kenaikan (penurunan) hutang gaji` : '', amount: hutangGajiBalance, isBold: false, hide: !hutangGajiAccount },
    { label: hutangPajakAccount ? `Kenaikan (penurunan) hutang pajak` : '', amount: hutangPajakBalance, isBold: false, hide: !hutangPajakAccount },
  ].filter(item => !item.hide);

  const netCashOperating = operatingActivities.reduce((s, item) => s + item.amount, 0);

  // Investing Activities
  const peralatanAccount = accounts.find(a => a.name === 'Peralatan');
  const tanahAccount = accounts.find(a => a.name === 'Tanah');
  const bangunanAccount = accounts.find(a => a.name === 'Bangunan');

  const peralatanBalance = peralatanAccount ? getAccountBalance(peralatanAccount) : 0;
  const tanahBalance = tanahAccount ? getAccountBalance(tanahAccount) : 0;
  const bangunanBalance = bangunanAccount ? getAccountBalance(bangunanAccount) : 0;

  const investingActivities = [
    { label: 'Perolehan peralatan', amount: -peralatanBalance, hide: !peralatanAccount || peralatanBalance === 0 },
    { label: 'Perolehan tanah', amount: -tanahBalance, hide: !tanahAccount || tanahBalance === 0 },
    { label: 'Perolehan bangunan', amount: -bangunanBalance, hide: !bangunanAccount || bangunanBalance === 0 },
  ].filter(item => !item.hide);

  const netCashInvesting = investingActivities.reduce((s, item) => s + item.amount, 0);

  // Financing Activities
  const modalAccount = accounts.find(a => a.name === 'Modal Pemilik');
  const priveAccount = accounts.find(a => a.name === 'Prive');
  const hutangBankAccount = accounts.find(a => a.name === 'Hutang Bank');

  const modalBalance = modalAccount ? getAccountBalance(modalAccount) : 0;
  const priveBalance = priveAccount ? getAccountBalance(priveAccount) : 0;
  const hutangBankBalance = hutangBankAccount ? getAccountBalance(hutangBankAccount) : 0;

  const financingActivities = [
    { label: 'Setoran modal pemilik', amount: modalBalance, hide: !modalAccount || modalBalance === 0 },
    { label: 'Prive pemilik', amount: -priveBalance, hide: !priveAccount || priveBalance === 0 },
    { label: 'Penerimaan pinjaman bank', amount: hutangBankBalance, hide: !hutangBankAccount || hutangBankBalance === 0 },
  ].filter(item => !item.hide);

  const netCashFinancing = financingActivities.reduce((s, item) => s + item.amount, 0);

  const netCashChange = netCashOperating + netCashInvesting + netCashFinancing;

  // Cash balance
  const kasAccount = accounts.find(a => a.name === 'Kas');
  const bankAccount = accounts.find(a => a.name === 'Bank');
  const kasBalance = kasAccount ? getAccountBalance(kasAccount) : 0;
  const bankBalance = bankAccount ? getAccountBalance(bankAccount) : 0;
  const endingCash = kasBalance + bankBalance;
  const beginningCash = endingCash - netCashChange;

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold text-gray-800">Laporan Arus Kas</h1>
        <p className="text-gray-500 mt-1">Cash Flow Statement - Metode Tidak Langsung</p>
      </div>

      <div className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden max-w-4xl mx-auto">
        <div className="bg-gradient-to-r from-teal-600 to-cyan-600 px-6 py-4">
          <h3 className="text-white font-bold text-xl text-center">LAPORAN ARUS KAS</h3>
          <p className="text-teal-100 text-sm text-center">Untuk Periode yang Berakhir 31 Desember 2026</p>
          <p className="text-teal-200 text-xs text-center mt-1">(Metode Tidak Langsung)</p>
        </div>

        <div className="p-6 space-y-6">
          {/* Operating Activities */}
          <div>
            <h4 className="font-bold text-gray-800 text-base border-b-2 border-teal-400 pb-2 mb-3">
              ARUS KAS DARI AKTIVITAS OPERASI
            </h4>
            <div className="space-y-1.5">
              {operatingActivities.map((item, idx) => (
                <div key={idx} className={`flex justify-between items-center py-1 ${item.isHeader ? 'mt-2' : ''} ${item.isBold ? 'font-semibold text-gray-700' : 'pl-4'}`}>
                  <span className={`text-sm ${item.isHeader ? 'text-gray-600 italic' : 'text-gray-700'}`}>{item.label}</span>
                  <span className={`text-sm font-medium ${item.amount >= 0 ? 'text-gray-800' : 'text-red-600'}`}>
                    {item.amount !== 0 ? formatCurrency(item.amount) : ''}
                  </span>
                </div>
              ))}
            </div>
            <div className="flex justify-between items-center py-2.5 border-t-2 border-teal-300 mt-3 bg-teal-50 rounded px-3">
              <span className="font-bold text-teal-800">Kas Bersih dari Aktivitas Operasi</span>
              <span className={`font-bold text-lg ${netCashOperating >= 0 ? 'text-teal-700' : 'text-red-700'}`}>
                {formatCurrency(netCashOperating)}
              </span>
            </div>
          </div>

          {/* Investing Activities */}
          <div>
            <h4 className="font-bold text-gray-800 text-base border-b-2 border-blue-400 pb-2 mb-3">
              ARUS KAS DARI AKTIVITAS INVESTASI
            </h4>
            <div className="space-y-1.5">
              {investingActivities.length === 0 ? (
                <p className="text-gray-400 text-sm italic pl-4">Tidak ada arus kas investasi</p>
              ) : (
                investingActivities.map((item, idx) => (
                  <div key={idx} className="flex justify-between items-center py-1 pl-4">
                    <span className="text-sm text-gray-700">{item.label}</span>
                    <span className={`text-sm font-medium ${item.amount >= 0 ? 'text-gray-800' : 'text-red-600'}`}>
                      {formatCurrency(item.amount)}
                    </span>
                  </div>
                ))
              )}
            </div>
            <div className="flex justify-between items-center py-2.5 border-t-2 border-blue-300 mt-3 bg-blue-50 rounded px-3">
              <span className="font-bold text-blue-800">Kas Bersih dari Aktivitas Investasi</span>
              <span className={`font-bold text-lg ${netCashInvesting >= 0 ? 'text-blue-700' : 'text-red-700'}`}>
                {formatCurrency(netCashInvesting)}
              </span>
            </div>
          </div>

          {/* Financing Activities */}
          <div>
            <h4 className="font-bold text-gray-800 text-base border-b-2 border-purple-400 pb-2 mb-3">
              ARUS KAS DARI AKTIVITAS PENDANAAN
            </h4>
            <div className="space-y-1.5">
              {financingActivities.length === 0 ? (
                <p className="text-gray-400 text-sm italic pl-4">Tidak ada arus kas pendanaan</p>
              ) : (
                financingActivities.map((item, idx) => (
                  <div key={idx} className="flex justify-between items-center py-1 pl-4">
                    <span className="text-sm text-gray-700">{item.label}</span>
                    <span className={`text-sm font-medium ${item.amount >= 0 ? 'text-gray-800' : 'text-red-600'}`}>
                      {formatCurrency(item.amount)}
                    </span>
                  </div>
                ))
              )}
            </div>
            <div className="flex justify-between items-center py-2.5 border-t-2 border-purple-300 mt-3 bg-purple-50 rounded px-3">
              <span className="font-bold text-purple-800">Kas Bersih dari Aktivitas Pendanaan</span>
              <span className={`font-bold text-lg ${netCashFinancing >= 0 ? 'text-purple-700' : 'text-red-700'}`}>
                {formatCurrency(netCashFinancing)}
              </span>
            </div>
          </div>

          {/* Summary */}
          <div className="border-t-2 border-gray-800 pt-4 space-y-2">
            <div className="flex justify-between items-center py-1.5">
              <span className="font-semibold text-gray-700">Kenaikan (Penurunan) Kas Bersih</span>
              <span className={`font-bold ${netCashChange >= 0 ? 'text-green-700' : 'text-red-700'}`}>
                {formatCurrency(netCashChange)}
              </span>
            </div>
            <div className="flex justify-between items-center py-1.5">
              <span className="text-gray-600">Saldo Kas Awal Periode</span>
              <span className="font-medium text-gray-800">{formatCurrency(beginningCash)}</span>
            </div>
            <div className="flex justify-between items-center py-3 bg-gray-800 text-white rounded-lg px-4 mt-2">
              <span className="font-bold text-lg">SALDO KAS AKHIR PERIODE</span>
              <span className="font-bold text-xl">{formatCurrency(endingCash)}</span>
            </div>
          </div>

          {/* Cash Composition */}
          <div className="grid grid-cols-2 gap-4 pt-4 border-t border-gray-200">
            <div className="bg-green-50 rounded-lg p-4 text-center">
              <p className="text-sm text-green-600">Kas</p>
              <p className="text-lg font-bold text-green-700">{formatCurrency(kasBalance)}</p>
            </div>
            <div className="bg-blue-50 rounded-lg p-4 text-center">
              <p className="text-sm text-blue-600">Bank</p>
              <p className="text-lg font-bold text-blue-700">{formatCurrency(bankBalance)}</p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
