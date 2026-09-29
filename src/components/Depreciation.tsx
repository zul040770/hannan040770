import { useState } from 'react';
import { DepreciationAsset, DepreciationMethod, TaxGroup } from '../types';
import { formatCurrency } from '../store';

// Tarif penyusutan fiskal sesuai PMK 96/PMK/2009 & UU PPh Pasal 11
const TAX_RATES: Record<string, { usefulLife: number; straightLine: number; decliningBalance: number; description: string }> = {
  '1': { usefulLife: 4, straightLine: 25, decliningBalance: 50, description: 'Kelompok 1 (non bangunan): meubelair, peralatan kantor, dll' },
  '2': { usefulLife: 8, straightLine: 12.5, decliningBalance: 25, description: 'Kelompok 2 (non bangunan): kendaraan, AC, mesin ringan' },
  '3': { usefulLife: 16, straightLine: 6.25, decliningBalance: 12.5, description: 'Kelompok 3 (non bangunan): mesin berat, peralatan industri' },
  '4': { usefulLife: 20, straightLine: 5, decliningBalance: 10, description: 'Kelompok 4 (non bangunan): konstruksi ringan, dll' },
  'building-permanent': { usefulLife: 50, straightLine: 2, decliningBalance: 0, description: 'Bangunan Permanen (beton/baja)' },
  'building-non-permanent': { usefulLife: 10, straightLine: 5, decliningBalance: 0, description: 'Bangunan Non-Permanen (kayu, semi-permanen)' },
};

const defaultAssets: DepreciationAsset[] = [
  { id: 'd1', name: 'Peralatan Kantor (Komputer)', acquisitionDate: '2024-01-05', cost: 15000000, residualValue: 0, usefulLifeYears: 4, method: 'straight-line', taxGroup: 1, category: 'both' },
  { id: 'd2', name: 'Kendaraan Operasional', acquisitionDate: '2024-03-01', cost: 250000000, residualValue: 0, usefulLifeYears: 8, method: 'straight-line', taxGroup: 2, category: 'both' },
  { id: 'd3', name: 'Furniture Kantor', acquisitionDate: '2024-01-10', cost: 8000000, residualValue: 0, usefulLifeYears: 4, method: 'straight-line', taxGroup: 1, category: 'both' },
];

export default function Depreciation() {
  const [assets, setAssets] = useState<DepreciationAsset[]>(() => {
    const stored = localStorage.getItem('depreciation_assets');
    if (stored) return JSON.parse(stored);
    localStorage.setItem('depreciation_assets', JSON.stringify(defaultAssets));
    return defaultAssets;
  });

  const [showForm, setShowForm] = useState(false);
  const [selectedAsset, setSelectedAsset] = useState<string | null>(null);
  const [form, setForm] = useState<Omit<DepreciationAsset, 'id'>>({
    name: '',
    acquisitionDate: '2024-01-01',
    cost: 0,
    residualValue: 0,
    usefulLifeYears: 4,
    method: 'straight-line',
    taxGroup: 1,
    category: 'both',
  });

  const saveAssets = (newAssets: DepreciationAsset[]) => {
    setAssets(newAssets);
    localStorage.setItem('depreciation_assets', JSON.stringify(newAssets));
  };

  const handleSubmit = () => {
    if (!form.name || form.cost <= 0) return;
    const newAsset: DepreciationAsset = {
      id: Date.now().toString(),
      ...form,
    };
    saveAssets([...assets, newAsset]);
    setForm({ name: '', acquisitionDate: '2024-01-01', cost: 0, residualValue: 0, usefulLifeYears: 4, method: 'straight-line', taxGroup: 1, category: 'both' });
    setShowForm(false);
  };

  const handleDelete = (id: string) => {
    if (confirm('Yakin ingin menghapus aset ini?')) {
      saveAssets(assets.filter(a => a.id !== id));
    }
  };

  // Calculate depreciation schedule
  const calculateSchedule = (asset: DepreciationAsset, method: DepreciationMethod) => {
    const schedule: { year: number; beginningValue: number; depreciation: number; accumulatedDep: number; endingValue: number }[] = [];
    let accumulatedDep = 0;
    let bookValue = asset.cost;
    const depreciableAmount = asset.cost - asset.residualValue;

    for (let year = 1; year <= asset.usefulLifeYears; year++) {
      let annualDep = 0;

      if (method === 'straight-line') {
        annualDep = depreciableAmount / asset.usefulLifeYears;
      } else {
        // Declining balance - double declining
        const rate = (2 / asset.usefulLifeYears) * 100;
        annualDep = bookValue * (rate / 100);
        // Switch to straight line if it gives higher depreciation
        const remainingYears = asset.usefulLifeYears - year + 1;
        const slDep = (bookValue - asset.residualValue) / remainingYears;
        if (slDep > annualDep) {
          annualDep = slDep;
        }
      }

      // Don't depreciate below residual value
      if (bookValue - annualDep < asset.residualValue) {
        annualDep = bookValue - asset.residualValue;
      }

      accumulatedDep += annualDep;
      const endingValue = bookValue - annualDep;

      schedule.push({
        year,
        beginningValue: bookValue,
        depreciation: annualDep,
        accumulatedDep,
        endingValue,
      });

      bookValue = endingValue;
    }

    return schedule;
  };

  // Calculate fiscal depreciation
  const calculateFiscalSchedule = (asset: DepreciationAsset) => {
    const taxRate = TAX_RATES[String(asset.taxGroup)];
    if (!taxRate) return [];

    const schedule: { year: number; beginningValue: number; depreciation: number; accumulatedDep: number; endingValue: number }[] = [];
    let accumulatedDep = 0;
    let bookValue = asset.cost;

    if (asset.taxGroup === 'building-permanent' || asset.taxGroup === 'building-non-permanent') {
      // Bangunan hanya metode garis lurus
      const annualDep = asset.cost * (taxRate.straightLine / 100);
      for (let year = 1; year <= taxRate.usefulLife; year++) {
        accumulatedDep += annualDep;
        schedule.push({
          year,
          beginningValue: bookValue,
          depreciation: annualDep,
          accumulatedDep,
          endingValue: bookValue - annualDep,
        });
        bookValue -= annualDep;
      }
    } else {
      const method = asset.method;
      for (let year = 1; year <= taxRate.usefulLife; year++) {
        let annualDep = 0;
        if (method === 'straight-line') {
          annualDep = asset.cost * (taxRate.straightLine / 100);
        } else {
          annualDep = bookValue * (taxRate.decliningBalance / 100);
          // Tahun terakhir disusutkan seluruhnya
          if (year === taxRate.usefulLife) {
            annualDep = bookValue;
          }
        }

        accumulatedDep += annualDep;
        schedule.push({
          year,
          beginningValue: bookValue,
          depreciation: annualDep,
          accumulatedDep,
          endingValue: bookValue - annualDep,
        });
        bookValue -= annualDep;
      }
    }

    return schedule;
  };

  const totalCost = assets.reduce((s, a) => s + a.cost, 0);
  const totalCurrentYearDep = assets.reduce((s, a) => {
    const schedule = calculateSchedule(a, a.method);
    return s + (schedule[0]?.depreciation || 0);
  }, 0);

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between flex-wrap gap-4">
        <div>
          <h1 className="text-3xl font-bold text-gray-800">Laporan Penyusutan Aset</h1>
          <p className="text-gray-500 mt-1">Sesuai PSAK 16 & Peraturan Pajak (PMK 96/2009)</p>
        </div>
        <button
          onClick={() => setShowForm(!showForm)}
          className="bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 transition flex items-center gap-2"
        >
          <i className="fa-solid fa-plus"></i>
          Tambah Aset
        </button>
      </div>

      {/* Info Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-4">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-blue-100 rounded-lg flex items-center justify-center">
              <i className="fa-solid fa-building text-blue-600"></i>
            </div>
            <div>
              <p className="text-xs text-gray-500">Total Aset Tetap</p>
              <p className="font-bold text-gray-800">{formatCurrency(totalCost)}</p>
            </div>
          </div>
        </div>
        <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-4">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-orange-100 rounded-lg flex items-center justify-center">
              <i className="fa-solid fa-chart-line text-orange-600"></i>
            </div>
            <div>
              <p className="text-xs text-gray-500">Beban Penyusutan Tahun Ini</p>
              <p className="font-bold text-gray-800">{formatCurrency(totalCurrentYearDep)}</p>
            </div>
          </div>
        </div>
        <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-4">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-green-100 rounded-lg flex items-center justify-center">
              <i className="fa-solid fa-cubes text-green-600"></i>
            </div>
            <div>
              <p className="text-xs text-gray-500">Jumlah Aset</p>
              <p className="font-bold text-gray-800">{assets.length} unit</p>
            </div>
          </div>
        </div>
      </div>

      {/* Form */}
      {showForm && (
        <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6">
          <h3 className="font-semibold text-gray-800 mb-4">Tambah Aset Tetap Baru</h3>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-600 mb-1">Nama Aset</label>
              <input
                type="text"
                value={form.name}
                onChange={e => setForm({ ...form, name: e.target.value })}
                placeholder="Nama aset"
                className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-600 mb-1">Tanggal Perolehan</label>
              <input
                type="date"
                value={form.acquisitionDate}
                onChange={e => setForm({ ...form, acquisitionDate: e.target.value })}
                className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-600 mb-1">Harga Perolehan</label>
              <input
                type="number"
                value={form.cost || ''}
                onChange={e => setForm({ ...form, cost: Number(e.target.value) })}
                placeholder="0"
                className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-600 mb-1">Nilai Residu</label>
              <input
                type="number"
                value={form.residualValue || ''}
                onChange={e => setForm({ ...form, residualValue: Number(e.target.value) })}
                placeholder="0"
                className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-600 mb-1">Masa Manfaat (Tahun)</label>
              <input
                type="number"
                value={form.usefulLifeYears}
                onChange={e => setForm({ ...form, usefulLifeYears: Number(e.target.value) })}
                className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-600 mb-1">Metode Penyusutan</label>
              <select
                value={form.method}
                onChange={e => setForm({ ...form, method: e.target.value as DepreciationMethod })}
                className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              >
                <option value="straight-line">Garis Lurus (Straight Line)</option>
                <option value="declining-balance">Saldo Menurun (Declining Balance)</option>
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-600 mb-1">Kelompok Pajak (Fiskal)</label>
              <select
                value={form.taxGroup}
                onChange={e => setForm({ ...form, taxGroup: e.target.value as TaxGroup | 'building-permanent' | 'building-non-permanent' })}
                className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              >
                <option value={1}>Kelompok 1 (4 thn - SL 25% / SM 50%)</option>
                <option value={2}>Kelompok 2 (8 thn - SL 12.5% / SM 25%)</option>
                <option value={3}>Kelompok 3 (16 thn - SL 6.25% / SM 12.5%)</option>
                <option value={4}>Kelompok 4 (20 thn - SL 5% / SM 10%)</option>
                <option value="building-permanent">Bangunan Permanen (50 thn - SL 2%)</option>
                <option value="building-non-permanent">Bangunan Non-Permanen (10 thn - SL 5%)</option>
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-600 mb-1">Kategori</label>
              <select
                value={form.category}
                onChange={e => setForm({ ...form, category: e.target.value as 'accounting' | 'fiscal' | 'both' })}
                className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              >
                <option value="both">Komersial & Fiskal</option>
                <option value="accounting">Komersial Saja</option>
                <option value="fiscal">Fiskal Saja</option>
              </select>
            </div>
            <div className="flex items-end gap-2">
              <button onClick={handleSubmit} className="bg-green-600 text-white px-4 py-2 rounded-lg hover:bg-green-700 transition">
                <i className="fa-solid fa-check mr-1"></i> Simpan
              </button>
              <button onClick={() => setShowForm(false)} className="bg-gray-200 text-gray-700 px-4 py-2 rounded-lg hover:bg-gray-300 transition">
                Batal
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Tax Reference */}
      <div className="bg-amber-50 border border-amber-200 rounded-xl p-4">
        <h4 className="font-semibold text-amber-800 text-sm flex items-center gap-2 mb-2">
          <i className="fa-solid fa-circle-info"></i>
          Referensi Tarif Penyusutan Fiskal (UU PPh Pasal 11 & PMK 96/2009)
        </h4>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-2 text-xs text-amber-700">
          <div><strong>Kel. 1:</strong> 4 thn (SL 25%, SM 50%)</div>
          <div><strong>Kel. 2:</strong> 8 thn (SL 12.5%, SM 25%)</div>
          <div><strong>Kel. 3:</strong> 16 thn (SL 6.25%, SM 12.5%)</div>
          <div><strong>Kel. 4:</strong> 20 thn (SL 5%, SM 10%)</div>
          <div><strong>Bgn Permanen:</strong> 50 thn (SL 2%)</div>
          <div><strong>Bgn Non-Permanen:</strong> 10 thn (SL 5%)</div>
        </div>
      </div>

      {/* Asset List */}
      <div className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden">
        <table className="w-full">
          <thead className="bg-gray-50">
            <tr>
              <th className="text-left px-6 py-3 text-xs font-semibold text-gray-500 uppercase">Nama Aset</th>
              <th className="text-left px-6 py-3 text-xs font-semibold text-gray-500 uppercase">Tgl Perolehan</th>
              <th className="text-right px-6 py-3 text-xs font-semibold text-gray-500 uppercase">Harga Perolehan</th>
              <th className="text-center px-6 py-3 text-xs font-semibold text-gray-500 uppercase">Masa Manfaat</th>
              <th className="text-center px-6 py-3 text-xs font-semibold text-gray-500 uppercase">Metode</th>
              <th className="text-right px-6 py-3 text-xs font-semibold text-gray-500 uppercase">Penyusutan/Thn</th>
              <th className="text-center px-6 py-3 text-xs font-semibold text-gray-500 uppercase">Aksi</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-50">
            {assets.map(asset => {
              const schedule = calculateSchedule(asset, asset.method);
              const annualDep = schedule[0]?.depreciation || 0;
              return (
                <tr key={asset.id} className="hover:bg-gray-50 transition cursor-pointer" onClick={() => setSelectedAsset(selectedAsset === asset.id ? null : asset.id)}>
                  <td className="px-6 py-3 font-medium text-gray-800">{asset.name}</td>
                  <td className="px-6 py-3 text-sm text-gray-600">{asset.acquisitionDate}</td>
                  <td className="px-6 py-3 text-right text-sm font-medium">{formatCurrency(asset.cost)}</td>
                  <td className="px-6 py-3 text-center text-sm text-gray-600">{asset.usefulLifeYears} tahun</td>
                  <td className="px-6 py-3 text-center">
                    <span className={`px-2 py-1 rounded-full text-xs font-medium ${asset.method === 'straight-line' ? 'bg-blue-100 text-blue-700' : 'bg-purple-100 text-purple-700'}`}>
                      {asset.method === 'straight-line' ? 'Garis Lurus' : 'Saldo Menurun'}
                    </span>
                  </td>
                  <td className="px-6 py-3 text-right text-sm font-semibold text-orange-600">{formatCurrency(annualDep)}</td>
                  <td className="px-6 py-3 text-center">
                    <button onClick={(e) => { e.stopPropagation(); handleDelete(asset.id); }} className="text-red-500 hover:text-red-700">
                      <i className="fa-solid fa-trash"></i>
                    </button>
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>

      {/* Detailed Schedule for Selected Asset */}
      {selectedAsset && (() => {
        const asset = assets.find(a => a.id === selectedAsset);
        if (!asset) return null;
        const accountingSchedule = calculateSchedule(asset, asset.method);
        const fiscalSchedule = calculateFiscalSchedule(asset);
        const taxRate = TAX_RATES[String(asset.taxGroup)];

        return (
          <div className="space-y-6">
            {/* Accounting Depreciation Schedule */}
            <div className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden">
              <div className="bg-gradient-to-r from-blue-600 to-indigo-600 px-6 py-4">
                <h3 className="text-white font-bold text-lg">Jadwal Penyusutan Komersial (PSAK 16)</h3>
                <p className="text-blue-100 text-sm">{asset.name} - Metode {asset.method === 'straight-line' ? 'Garis Lurus' : 'Saldo Menurun'}</p>
              </div>
              <div className="p-6">
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
                  <div className="bg-gray-50 rounded-lg p-3">
                    <p className="text-xs text-gray-500">Harga Perolehan</p>
                    <p className="font-bold text-gray-800">{formatCurrency(asset.cost)}</p>
                  </div>
                  <div className="bg-gray-50 rounded-lg p-3">
                    <p className="text-xs text-gray-500">Nilai Residu</p>
                    <p className="font-bold text-gray-800">{formatCurrency(asset.residualValue)}</p>
                  </div>
                  <div className="bg-gray-50 rounded-lg p-3">
                    <p className="text-xs text-gray-500">Dasar Penyusutan</p>
                    <p className="font-bold text-gray-800">{formatCurrency(asset.cost - asset.residualValue)}</p>
                  </div>
                  <div className="bg-gray-50 rounded-lg p-3">
                    <p className="text-xs text-gray-500">Tarif/Tahun</p>
                    <p className="font-bold text-gray-800">{(100 / asset.usefulLifeYears).toFixed(2)}%</p>
                  </div>
                </div>
                <div className="overflow-x-auto">
                  <table className="w-full text-sm">
                    <thead className="bg-blue-50">
                      <tr>
                        <th className="text-center px-4 py-2 font-semibold text-blue-800">Tahun</th>
                        <th className="text-right px-4 py-2 font-semibold text-blue-800">Nilai Awal</th>
                        <th className="text-right px-4 py-2 font-semibold text-blue-800">Beban Penyusutan</th>
                        <th className="text-right px-4 py-2 font-semibold text-blue-800">Akumulasi Penyusutan</th>
                        <th className="text-right px-4 py-2 font-semibold text-blue-800">Nilai Buku</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-gray-100">
                      {accountingSchedule.map((row, idx) => (
                        <tr key={idx} className="hover:bg-gray-50">
                          <td className="text-center px-4 py-2 font-medium">{row.year}</td>
                          <td className="text-right px-4 py-2">{formatCurrency(row.beginningValue)}</td>
                          <td className="text-right px-4 py-2 font-semibold text-red-600">{formatCurrency(row.depreciation)}</td>
                          <td className="text-right px-4 py-2 text-gray-600">{formatCurrency(row.accumulatedDep)}</td>
                          <td className="text-right px-4 py-2 font-bold text-blue-700">{formatCurrency(row.endingValue)}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            </div>

            {/* Fiscal Depreciation Schedule */}
            <div className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden">
              <div className="bg-gradient-to-r from-orange-500 to-red-500 px-6 py-4">
                <h3 className="text-white font-bold text-lg">Jadwal Penyusutan Fiskal (UU PPh Ps. 11)</h3>
                <p className="text-orange-100 text-sm">
                  {asset.name} - {taxRate?.description || 'Kelompok Pajak'} | Tarif: {taxRate?.straightLine}% (SL) {taxRate?.decliningBalance > 0 ? `/ ${taxRate?.decliningBalance}% (SM)` : ''}
                </p>
              </div>
              <div className="p-6">
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
                  <div className="bg-gray-50 rounded-lg p-3">
                    <p className="text-xs text-gray-500">Harga Perolehan</p>
                    <p className="font-bold text-gray-800">{formatCurrency(asset.cost)}</p>
                  </div>
                  <div className="bg-gray-50 rounded-lg p-3">
                    <p className="text-xs text-gray-500">Masa Manfaat Fiskal</p>
                    <p className="font-bold text-gray-800">{taxRate?.usefulLife || asset.usefulLifeYears} tahun</p>
                  </div>
                  <div className="bg-gray-50 rounded-lg p-3">
                    <p className="text-xs text-gray-500">Tarif Garis Lurus</p>
                    <p className="font-bold text-gray-800">{taxRate?.straightLine}%</p>
                  </div>
                  <div className="bg-gray-50 rounded-lg p-3">
                    <p className="text-xs text-gray-500">Tarif Saldo Menurun</p>
                    <p className="font-bold text-gray-800">{taxRate?.decliningBalance > 0 ? `${taxRate.decliningBalance}%` : 'N/A (Bangunan)'}</p>
                  </div>
                </div>
                <div className="overflow-x-auto">
                  <table className="w-full text-sm">
                    <thead className="bg-orange-50">
                      <tr>
                        <th className="text-center px-4 py-2 font-semibold text-orange-800">Tahun</th>
                        <th className="text-right px-4 py-2 font-semibold text-orange-800">Nilai Awal</th>
                        <th className="text-right px-4 py-2 font-semibold text-orange-800">Beban Penyusutan</th>
                        <th className="text-right px-4 py-2 font-semibold text-orange-800">Akumulasi Penyusutan</th>
                        <th className="text-right px-4 py-2 font-semibold text-orange-800">Nilai Sisa</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-gray-100">
                      {fiscalSchedule.map((row, idx) => (
                        <tr key={idx} className="hover:bg-gray-50">
                          <td className="text-center px-4 py-2 font-medium">{row.year}</td>
                          <td className="text-right px-4 py-2">{formatCurrency(row.beginningValue)}</td>
                          <td className="text-right px-4 py-2 font-semibold text-red-600">{formatCurrency(row.depreciation)}</td>
                          <td className="text-right px-4 py-2 text-gray-600">{formatCurrency(row.accumulatedDep)}</td>
                          <td className="text-right px-4 py-2 font-bold text-orange-700">{formatCurrency(row.endingValue)}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            </div>

            {/* Comparison */}
            {(asset.category === 'both' && fiscalSchedule.length > 0) && (
              <div className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden">
                <div className="bg-gradient-to-r from-gray-700 to-gray-900 px-6 py-4">
                  <h3 className="text-white font-bold text-lg">Koreksi Fiskal (Komersial vs Fiskal)</h3>
                  <p className="text-gray-300 text-sm">Perbedaan penyusutan komersial dan fiskal</p>
                </div>
                <div className="p-6 overflow-x-auto">
                  <table className="w-full text-sm">
                    <thead className="bg-gray-50">
                      <tr>
                        <th className="text-center px-4 py-2 font-semibold text-gray-700">Tahun</th>
                        <th className="text-right px-4 py-2 font-semibold text-gray-700">Penyusutan Komersial</th>
                        <th className="text-right px-4 py-2 font-semibold text-gray-700">Penyusutan Fiskal</th>
                        <th className="text-right px-4 py-2 font-semibold text-gray-700">Koreksi Fiskal</th>
                        <th className="text-center px-4 py-2 font-semibold text-gray-700">Keterangan</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-gray-100">
                      {accountingSchedule.map((accRow, idx) => {
                        const fiscalRow = fiscalSchedule[idx];
                        if (!fiscalRow) return null;
                        const difference = accRow.depreciation - fiscalRow.depreciation;
                        return (
                          <tr key={idx} className="hover:bg-gray-50">
                            <td className="text-center px-4 py-2 font-medium">Tahun {accRow.year}</td>
                            <td className="text-right px-4 py-2">{formatCurrency(accRow.depreciation)}</td>
                            <td className="text-right px-4 py-2">{formatCurrency(fiscalRow.depreciation)}</td>
                            <td className={`text-right px-4 py-2 font-bold ${difference > 0 ? 'text-red-600' : difference < 0 ? 'text-green-600' : 'text-gray-600'}`}>
                              {difference !== 0 ? formatCurrency(Math.abs(difference)) : '-'}
                            </td>
                            <td className="text-center px-4 py-2">
                              {difference > 0 ? (
                                <span className="bg-red-100 text-red-700 px-2 py-0.5 rounded text-xs font-medium">Koreksi Positif</span>
                              ) : difference < 0 ? (
                                <span className="bg-green-100 text-green-700 px-2 py-0.5 rounded text-xs font-medium">Koreksi Negatif</span>
                              ) : (
                                <span className="text-gray-400 text-xs">Tidak ada koreksi</span>
                              )}
                            </td>
                          </tr>
                        );
                      })}
                    </tbody>
                  </table>
                  <div className="mt-4 p-3 bg-gray-50 rounded-lg text-xs text-gray-600">
                    <p><strong>Keterangan:</strong></p>
                    <p>• <strong>Koreksi Positif:</strong> Penyusutan komersial &gt; fiskal → menambah laba fiskal (beda tetap/waktu)</p>
                    <p>• <strong>Koreksi Negatif:</strong> Penyusutan komersial &lt; fiskal → mengurangi laba fiskal</p>
                    <p>• Perbedaan masa manfaat komersial vs fiskal menghasilkan <strong>beda waktu (temporary difference)</strong></p>
                  </div>
                </div>
              </div>
            )}
          </div>
        );
      })()}
    </div>
  );
}
