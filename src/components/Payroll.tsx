import { useState } from 'react';
import { Employee, PayrollRecord } from '../types';
import { formatCurrency, formatDate } from '../store';
import PasswordGate from './PasswordGate';

// Default employees data
const defaultEmployees: Employee[] = [
  {
    id: 'e1',
    employeeId: 'EMP001',
    name: 'Budi Santoso',
    position: 'Manager IT',
    department: 'IT',
    joinDate: '2020-03-15',
    basicSalary: 15000000,
    allowances: { transport: 1500000, meal: 1000000, health: 500000, position: 2000000 },
    bankAccount: '1234567890',
    bankName: 'BCA',
    npwp: '01.234.567.8-901.000',
    status: 'active',
  },
  {
    id: 'e2',
    employeeId: 'EMP002',
    name: 'Siti Nurhaliza',
    position: 'Staff Accounting',
    department: 'Finance',
    joinDate: '2021-06-01',
    basicSalary: 8000000,
    allowances: { transport: 750000, meal: 600000, health: 300000, position: 500000 },
    bankAccount: '2345678901',
    bankName: 'Mandiri',
    npwp: '02.345.678.9-012.000',
    status: 'active',
  },
  {
    id: 'e3',
    employeeId: 'EMP003',
    name: 'Ahmad Wijaya',
    position: 'Senior Developer',
    department: 'IT',
    joinDate: '2019-11-20',
    basicSalary: 18000000,
    allowances: { transport: 1500000, meal: 1000000, health: 500000, position: 3000000 },
    bankAccount: '3456789012',
    bankName: 'BNI',
    npwp: '03.456.789.0-123.000',
    status: 'active',
  },
  {
    id: 'e4',
    employeeId: 'EMP004',
    name: 'Dewi Lestari',
    position: 'HR Manager',
    department: 'HRD',
    joinDate: '2018-05-10',
    basicSalary: 16000000,
    allowances: { transport: 1500000, meal: 1000000, health: 500000, position: 2500000 },
    bankAccount: '4567890123',
    bankName: 'BRI',
    npwp: '04.567.890.1-234.000',
    status: 'active',
  },
  {
    id: 'e5',
    employeeId: 'EMP005',
    name: 'Rudi Hermawan',
    position: 'Staff Marketing',
    department: 'Marketing',
    joinDate: '2022-01-15',
    basicSalary: 7000000,
    allowances: { transport: 750000, meal: 600000, health: 300000, position: 0 },
    bankAccount: '5678901234',
    bankName: 'BCA',
    npwp: '05.678.901.2-345.000',
    status: 'active',
  },
  {
    id: 'e6',
    employeeId: 'EMP006',
    name: 'Maya Sari',
    position: 'Admin',
    department: 'General Affairs',
    joinDate: '2023-02-01',
    basicSalary: 5500000,
    allowances: { transport: 500000, meal: 500000, health: 200000, position: 0 },
    bankAccount: '6789012345',
    bankName: 'Mandiri',
    npwp: '06.789.012.3-456.000',
    status: 'active',
  },
];

const defaultPayrolls: PayrollRecord[] = [
  {
    id: 'p1',
    employeeId: 'EMP001',
    period: '2024-01',
    basicSalary: 15000000,
    allowances: { transport: 1500000, meal: 1000000, health: 500000, position: 2000000 },
    overtime: 0,
    grossIncome: 20000000,
    deductions: { bpjsHealth: 200000, bpjsEmployment: 175000, pph21: 583333, other: 0 },
    netSalary: 19041667,
    paymentDate: '2024-01-28',
    status: 'paid',
  },
  {
    id: 'p2',
    employeeId: 'EMP002',
    period: '2024-01',
    basicSalary: 8000000,
    allowances: { transport: 750000, meal: 600000, health: 300000, position: 500000 },
    overtime: 500000,
    grossIncome: 10650000,
    deductions: { bpjsHealth: 106500, bpjsEmployment: 100000, pph21: 108333, other: 0 },
    netSalary: 10335167,
    paymentDate: '2024-01-28',
    status: 'paid',
  },
];

// PPh 21 calculation based on UU HPP (Harmonisasi Peraturan Perpajakan)
// Progressive rates: 5% up to 60M, 15% 60M-250M, 25% 250M-500M, 30% 500M-5B, 35% above 5B
function calculatePPh21(annualTaxableIncome: number): number {
  let tax = 0;
  const brackets = [
    { limit: 60000000, rate: 0.05 },
    { limit: 250000000, rate: 0.15 },
    { limit: 500000000, rate: 0.25 },
    { limit: 5000000000, rate: 0.30 },
    { limit: Infinity, rate: 0.35 },
  ];

  let remaining = annualTaxableIncome;
  let prevLimit = 0;

  for (const bracket of brackets) {
    if (remaining <= 0) break;
    const taxableInBracket = Math.min(remaining, bracket.limit - prevLimit);
    tax += taxableInBracket * bracket.rate;
    remaining -= taxableInBracket;
    prevLimit = bracket.limit;
  }

  return Math.round(tax / 12); // Monthly PPh 21
}

function calculateBPJS(grossSalary: number) {
  // BPJS Kesehatan: Employee 1%, max salary cap 12M
  const healthCap = Math.min(grossSalary, 12000000);
  const bpjsHealth = Math.round(healthCap * 0.01);

  // BPJS Ketenagakerjaan (JHT 2%, JP 1%, JKK 0.24%, JKM 0.3%)
  const salaryCap = Math.min(grossSalary, 10042300); // Max 2024
  const bpjsEmployment = Math.round(salaryCap * 0.02); // JHT employee portion

  return { bpjsHealth, bpjsEmployment };
}

export default function Payroll() {
  const [employees] = useState<Employee[]>(() => {
    const stored = localStorage.getItem('employees');
    if (stored) return JSON.parse(stored);
    localStorage.setItem('employees', JSON.stringify(defaultEmployees));
    return defaultEmployees;
  });

  const [payrolls] = useState<PayrollRecord[]>(() => {
    const stored = localStorage.getItem('payrolls');
    if (stored) return JSON.parse(stored);
    localStorage.setItem('payrolls', JSON.stringify(defaultPayrolls));
    return defaultPayrolls;
  });

  const [activeTab, setActiveTab] = useState<'employees' | 'payroll' | 'slip'>('employees');
  const [selectedEmployee, setSelectedEmployee] = useState<Employee | null>(null);
  const [selectedPayroll, setSelectedPayroll] = useState<PayrollRecord | null>(null);

  const getEmployee = (empId: string) => employees.find(e => e.employeeId === empId);

  const totalMonthlyPayroll = payrolls
    .filter(p => p.period === '2024-01')
    .reduce((s, p) => s + p.netSalary, 0);

  const totalGrossPayroll = payrolls
    .filter(p => p.period === '2024-01')
    .reduce((s, p) => s + p.grossIncome, 0);

  const totalDeductions = payrolls
    .filter(p => p.period === '2024-01')
    .reduce((s, p) => s + p.deductions.bpjsHealth + p.deductions.bpjsEmployment + p.deductions.pph21 + p.deductions.other, 0);

  return (
    <PasswordGate pageTitle="Data Gaji Karyawan">
      <div className="space-y-6">
        <div className="flex items-center justify-between flex-wrap gap-4">
          <div>
            <h1 className="text-3xl font-bold text-gray-800">Data Gaji Karyawan</h1>
            <p className="text-gray-500 mt-1">Payroll Management - Perhitungan gaji, tunjangan & PPh 21</p>
          </div>
          <div className="flex items-center gap-2 bg-green-100 text-green-700 px-3 py-1.5 rounded-full text-sm font-medium">
            <i className="fa-solid fa-shield-halved"></i>
            Akses Terproteksi
          </div>
        </div>

        {/* Summary Cards */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-4">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 bg-blue-100 rounded-lg flex items-center justify-center">
                <i className="fa-solid fa-users text-blue-600"></i>
              </div>
              <div>
                <p className="text-xs text-gray-500">Total Karyawan</p>
                <p className="font-bold text-gray-800">{employees.filter(e => e.status === 'active').length} orang</p>
              </div>
            </div>
          </div>
          <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-4">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 bg-green-100 rounded-lg flex items-center justify-center">
                <i className="fa-solid fa-money-bill-wave text-green-600"></i>
              </div>
              <div>
                <p className="text-xs text-gray-500">Total Gaji Bersih</p>
                <p className="font-bold text-gray-800">{formatCurrency(totalMonthlyPayroll)}</p>
              </div>
            </div>
          </div>
          <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-4">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 bg-orange-100 rounded-lg flex items-center justify-center">
                <i className="fa-solid fa-file-invoice-dollar text-orange-600"></i>
              </div>
              <div>
                <p className="text-xs text-gray-500">Total Gaji Kotor</p>
                <p className="font-bold text-gray-800">{formatCurrency(totalGrossPayroll)}</p>
              </div>
            </div>
          </div>
          <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-4">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 bg-red-100 rounded-lg flex items-center justify-center">
                <i className="fa-solid fa-scissors text-red-600"></i>
              </div>
              <div>
                <p className="text-xs text-gray-500">Total Potongan</p>
                <p className="font-bold text-gray-800">{formatCurrency(totalDeductions)}</p>
              </div>
            </div>
          </div>
        </div>

        {/* Tabs */}
        <div className="flex gap-2 border-b border-gray-200">
          <button
            onClick={() => setActiveTab('employees')}
            className={`px-4 py-2.5 font-medium text-sm border-b-2 transition ${
              activeTab === 'employees' ? 'border-blue-600 text-blue-600' : 'border-transparent text-gray-500 hover:text-gray-700'
            }`}
          >
            <i className="fa-solid fa-users mr-2"></i>Data Karyawan
          </button>
          <button
            onClick={() => setActiveTab('payroll')}
            className={`px-4 py-2.5 font-medium text-sm border-b-2 transition ${
              activeTab === 'payroll' ? 'border-blue-600 text-blue-600' : 'border-transparent text-gray-500 hover:text-gray-700'
            }`}
          >
            <i className="fa-solid fa-money-check-dollar mr-2"></i>Daftar Gaji
          </button>
          <button
            onClick={() => setActiveTab('slip')}
            className={`px-4 py-2.5 font-medium text-sm border-b-2 transition ${
              activeTab === 'slip' ? 'border-blue-600 text-blue-600' : 'border-transparent text-gray-500 hover:text-gray-700'
            }`}
          >
            <i className="fa-solid fa-receipt mr-2"></i>Slip Gaji
          </button>
        </div>

        {/* Employees Tab */}
        {activeTab === 'employees' && (
          <div className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden">
            <div className="px-6 py-4 bg-gradient-to-r from-blue-600 to-indigo-600">
              <h3 className="text-white font-bold text-lg">Data Karyawan</h3>
              <p className="text-blue-100 text-sm">Informasi lengkap karyawan perusahaan</p>
            </div>
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead className="bg-gray-50">
                  <tr>
                    <th className="text-left px-6 py-3 text-xs font-semibold text-gray-500 uppercase">ID</th>
                    <th className="text-left px-6 py-3 text-xs font-semibold text-gray-500 uppercase">Nama</th>
                    <th className="text-left px-6 py-3 text-xs font-semibold text-gray-500 uppercase">Jabatan</th>
                    <th className="text-left px-6 py-3 text-xs font-semibold text-gray-500 uppercase">Departemen</th>
                    <th className="text-right px-6 py-3 text-xs font-semibold text-gray-500 uppercase">Gaji Pokok</th>
                    <th className="text-right px-6 py-3 text-xs font-semibold text-gray-500 uppercase">Total Tunjangan</th>
                    <th className="text-center px-6 py-3 text-xs font-semibold text-gray-500 uppercase">Status</th>
                    <th className="text-center px-6 py-3 text-xs font-semibold text-gray-500 uppercase">Detail</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-50">
                  {employees.map(emp => {
                    const totalAllowance = emp.allowances.transport + emp.allowances.meal + emp.allowances.health + emp.allowances.position;
                    return (
                      <tr key={emp.id} className="hover:bg-gray-50 transition">
                        <td className="px-6 py-3 font-mono text-sm text-gray-700">{emp.employeeId}</td>
                        <td className="px-6 py-3">
                          <div>
                            <p className="font-medium text-gray-800">{emp.name}</p>
                            <p className="text-xs text-gray-400">NPWP: {emp.npwp}</p>
                          </div>
                        </td>
                        <td className="px-6 py-3 text-sm text-gray-600">{emp.position}</td>
                        <td className="px-6 py-3">
                          <span className="px-2 py-1 bg-blue-50 text-blue-700 rounded text-xs font-medium">{emp.department}</span>
                        </td>
                        <td className="px-6 py-3 text-right font-medium text-gray-800">{formatCurrency(emp.basicSalary)}</td>
                        <td className="px-6 py-3 text-right font-medium text-green-600">{formatCurrency(totalAllowance)}</td>
                        <td className="px-6 py-3 text-center">
                          <span className={`px-2 py-1 rounded-full text-xs font-medium ${emp.status === 'active' ? 'bg-green-100 text-green-700' : 'bg-red-100 text-red-700'}`}>
                            {emp.status === 'active' ? 'Aktif' : 'Nonaktif'}
                          </span>
                        </td>
                        <td className="px-6 py-3 text-center">
                          <button
                            onClick={() => { setSelectedEmployee(emp); setActiveTab('slip'); }}
                            className="text-blue-600 hover:text-blue-800"
                          >
                            <i className="fa-solid fa-eye"></i>
                          </button>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {/* Payroll Tab */}
        {activeTab === 'payroll' && (
          <div className="space-y-4">
            <div className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden">
              <div className="px-6 py-4 bg-gradient-to-r from-green-600 to-emerald-600">
                <h3 className="text-white font-bold text-lg">Daftar Gaji - Januari 2024</h3>
                <p className="text-green-100 text-sm">Rekapitulasi gaji karyawan periode berjalan</p>
              </div>
              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead className="bg-gray-50">
                    <tr>
                      <th className="text-left px-4 py-3 text-xs font-semibold text-gray-500 uppercase">Karyawan</th>
                      <th className="text-right px-4 py-3 text-xs font-semibold text-gray-500 uppercase">Gaji Pokok</th>
                      <th className="text-right px-4 py-3 text-xs font-semibold text-gray-500 uppercase">Tunjangan</th>
                      <th className="text-right px-4 py-3 text-xs font-semibold text-gray-500 uppercase">Lembur</th>
                      <th className="text-right px-4 py-3 text-xs font-semibold text-gray-500 uppercase">BPJS</th>
                      <th className="text-right px-4 py-3 text-xs font-semibold text-gray-500 uppercase">PPh 21</th>
                      <th className="text-right px-4 py-3 text-xs font-semibold text-gray-500 uppercase">Gaji Bersih</th>
                      <th className="text-center px-4 py-3 text-xs font-semibold text-gray-500 uppercase">Status</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-50">
                    {payrolls.map(payroll => {
                      const emp = getEmployee(payroll.employeeId);
                      const totalAllowance = payroll.allowances.transport + payroll.allowances.meal + payroll.allowances.health + payroll.allowances.position;
                      const totalBPJS = payroll.deductions.bpjsHealth + payroll.deductions.bpjsEmployment;
                      return (
                        <tr key={payroll.id} className="hover:bg-gray-50 transition">
                          <td className="px-4 py-3">
                            <p className="font-medium text-gray-800 text-sm">{emp?.name || '-'}</p>
                            <p className="text-xs text-gray-400">{emp?.position}</p>
                          </td>
                          <td className="px-4 py-3 text-right text-sm">{formatCurrency(payroll.basicSalary)}</td>
                          <td className="px-4 py-3 text-right text-sm text-green-600">{formatCurrency(totalAllowance)}</td>
                          <td className="px-4 py-3 text-right text-sm">{formatCurrency(payroll.overtime)}</td>
                          <td className="px-4 py-3 text-right text-sm text-orange-600">{formatCurrency(totalBPJS)}</td>
                          <td className="px-4 py-3 text-right text-sm text-red-600">{formatCurrency(payroll.deductions.pph21)}</td>
                          <td className="px-4 py-3 text-right text-sm font-bold text-blue-700">{formatCurrency(payroll.netSalary)}</td>
                          <td className="px-4 py-3 text-center">
                            <span className={`px-2 py-1 rounded-full text-xs font-medium ${payroll.status === 'paid' ? 'bg-green-100 text-green-700' : 'bg-yellow-100 text-yellow-700'}`}>
                              {payroll.status === 'paid' ? 'Dibayar' : 'Pending'}
                            </span>
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                  <tfoot className="bg-gray-100 font-bold">
                    <tr>
                      <td className="px-4 py-3 text-sm">TOTAL</td>
                      <td className="px-4 py-3 text-right text-sm">{formatCurrency(payrolls.reduce((s, p) => s + p.basicSalary, 0))}</td>
                      <td className="px-4 py-3 text-right text-sm text-green-600">
                        {formatCurrency(payrolls.reduce((s, p) => s + p.allowances.transport + p.allowances.meal + p.allowances.health + p.allowances.position, 0))}
                      </td>
                      <td className="px-4 py-3 text-right text-sm">{formatCurrency(payrolls.reduce((s, p) => s + p.overtime, 0))}</td>
                      <td className="px-4 py-3 text-right text-sm text-orange-600">
                        {formatCurrency(payrolls.reduce((s, p) => s + p.deductions.bpjsHealth + p.deductions.bpjsEmployment, 0))}
                      </td>
                      <td className="px-4 py-3 text-right text-sm text-red-600">{formatCurrency(payrolls.reduce((s, p) => s + p.deductions.pph21, 0))}</td>
                      <td className="px-4 py-3 text-right text-sm text-blue-700">{formatCurrency(payrolls.reduce((s, p) => s + p.netSalary, 0))}</td>
                      <td></td>
                    </tr>
                  </tfoot>
                </table>
              </div>
            </div>

            {/* PPh 21 Info */}
            <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6">
              <h4 className="font-bold text-gray-800 mb-3 flex items-center gap-2">
                <i className="fa-solid fa-circle-info text-blue-500"></i>
                Tarif PPh 21 (UU HPP - Harmonisasi Peraturan Perpajakan)
              </h4>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <p className="text-sm font-semibold text-gray-700 mb-2">Tarif Progresif (Pasal 17):</p>
                  <div className="space-y-1 text-sm text-gray-600">
                    <p>• 5% untuk PKP s.d Rp 60.000.000</p>
                    <p>• 15% untuk PKP &gt; Rp 60.000.000 s.d Rp 250.000.000</p>
                    <p>• 25% untuk PKP &gt; Rp 250.000.000 s.d Rp 500.000.000</p>
                    <p>• 30% untuk PKP &gt; Rp 500.000.000 s.d Rp 5.000.000.000</p>
                    <p>• 35% untuk PKP &gt; Rp 5.000.000.000</p>
                  </div>
                </div>
                <div>
                  <p className="text-sm font-semibold text-gray-700 mb-2">PTKP (Penghasilan Tidak Kena Pajak):</p>
                  <div className="space-y-1 text-sm text-gray-600">
                    <p>• TK/0: Rp 54.000.000/tahun</p>
                    <p>• K/0: Rp 58.500.000/tahun</p>
                    <p>• K/1: Rp 63.000.000/tahun</p>
                    <p>• K/2: Rp 67.500.000/tahun</p>
                    <p>• K/3: Rp 72.000.000/tahun</p>
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Slip Gaji Tab */}
        {activeTab === 'slip' && (
          <div className="space-y-4">
            <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6">
              <div className="flex items-center justify-between mb-4">
                <h3 className="font-bold text-gray-800">Pilih Slip Gaji:</h3>
                <select
                  onChange={e => setSelectedPayroll(payrolls.find(p => p.id === e.target.value) || null)}
                  className="border border-gray-300 rounded-lg px-3 py-2 text-sm"
                >
                  <option value="">-- Pilih Karyawan --</option>
                  {payrolls.map(p => {
                    const emp = getEmployee(p.employeeId);
                    return <option key={p.id} value={p.id}>{emp?.name} - {p.period}</option>;
                  })}
                </select>
              </div>

              {selectedPayroll ? (() => {
                const emp = getEmployee(selectedPayroll.employeeId);
                if (!emp) return null;
                const totalAllowance = selectedPayroll.allowances.transport + selectedPayroll.allowances.meal + selectedPayroll.allowances.health + selectedPayroll.allowances.position;
                const totalBPJS = selectedPayroll.deductions.bpjsHealth + selectedPayroll.deductions.bpjsEmployment;

                return (
                  <div className="border-2 border-gray-300 rounded-lg p-6 max-w-2xl mx-auto">
                    <div className="text-center border-b-2 border-gray-800 pb-4 mb-4">
                      <h2 className="text-xl font-bold text-gray-800">PT. CONTOH PERUSAHAAN</h2>
                      <p className="text-sm text-gray-600">Jl. Sudirman No. 123, Jakarta Pusat</p>
                      <h3 className="text-lg font-bold mt-3 text-gray-800">SLIP GAJI KARYAWAN</h3>
                      <p className="text-sm text-gray-600">Periode: {selectedPayroll.period}</p>
                    </div>

                    <div className="grid grid-cols-2 gap-4 mb-4 text-sm">
                      <div>
                        <p><span className="text-gray-500">Nama:</span> <strong>{emp.name}</strong></p>
                        <p><span className="text-gray-500">ID Karyawan:</span> {emp.employeeId}</p>
                        <p><span className="text-gray-500">Jabatan:</span> {emp.position}</p>
                      </div>
                      <div>
                        <p><span className="text-gray-500">Departemen:</span> {emp.department}</p>
                        <p><span className="text-gray-500">NPWP:</span> {emp.npwp}</p>
                        <p><span className="text-gray-500">Tgl Bergabung:</span> {formatDate(emp.joinDate)}</p>
                      </div>
                    </div>

                    <div className="mb-4">
                      <h4 className="font-bold text-green-700 bg-green-50 px-3 py-1.5 rounded mb-2">PENDAPATAN</h4>
                      <table className="w-full text-sm">
                        <tbody>
                          <tr className="border-b border-gray-100">
                            <td className="py-1.5">Gaji Pokok</td>
                            <td className="py-1.5 text-right">{formatCurrency(selectedPayroll.basicSalary)}</td>
                          </tr>
                          <tr className="border-b border-gray-100">
                            <td className="py-1.5">Tunjangan Transport</td>
                            <td className="py-1.5 text-right">{formatCurrency(selectedPayroll.allowances.transport)}</td>
                          </tr>
                          <tr className="border-b border-gray-100">
                            <td className="py-1.5">Tunjangan Makan</td>
                            <td className="py-1.5 text-right">{formatCurrency(selectedPayroll.allowances.meal)}</td>
                          </tr>
                          <tr className="border-b border-gray-100">
                            <td className="py-1.5">Tunjangan Kesehatan</td>
                            <td className="py-1.5 text-right">{formatCurrency(selectedPayroll.allowances.health)}</td>
                          </tr>
                          {selectedPayroll.allowances.position > 0 && (
                            <tr className="border-b border-gray-100">
                              <td className="py-1.5">Tunjangan Jabatan</td>
                              <td className="py-1.5 text-right">{formatCurrency(selectedPayroll.allowances.position)}</td>
                            </tr>
                          )}
                          <tr className="border-b border-gray-100">
                            <td className="py-1.5">Upah Lembur</td>
                            <td className="py-1.5 text-right">{formatCurrency(selectedPayroll.overtime)}</td>
                          </tr>
                          <tr className="font-bold border-t-2 border-green-300">
                            <td className="py-2">Total Pendapatan</td>
                            <td className="py-2 text-right text-green-700">{formatCurrency(selectedPayroll.grossIncome)}</td>
                          </tr>
                        </tbody>
                      </table>
                    </div>

                    <div className="mb-4">
                      <h4 className="font-bold text-red-700 bg-red-50 px-3 py-1.5 rounded mb-2">POTONGAN</h4>
                      <table className="w-full text-sm">
                        <tbody>
                          <tr className="border-b border-gray-100">
                            <td className="py-1.5">BPJS Kesehatan (1%)</td>
                            <td className="py-1.5 text-right">{formatCurrency(selectedPayroll.deductions.bpjsHealth)}</td>
                          </tr>
                          <tr className="border-b border-gray-100">
                            <td className="py-1.5">BPJS Ketenagakerjaan - JHT (2%)</td>
                            <td className="py-1.5 text-right">{formatCurrency(selectedPayroll.deductions.bpjsEmployment)}</td>
                          </tr>
                          <tr className="border-b border-gray-100">
                            <td className="py-1.5">PPh Pasal 21</td>
                            <td className="py-1.5 text-right">{formatCurrency(selectedPayroll.deductions.pph21)}</td>
                          </tr>
                          {selectedPayroll.deductions.other > 0 && (
                            <tr className="border-b border-gray-100">
                              <td className="py-1.5">Potongan Lain-lain</td>
                              <td className="py-1.5 text-right">{formatCurrency(selectedPayroll.deductions.other)}</td>
                            </tr>
                          )}
                          <tr className="font-bold border-t-2 border-red-300">
                            <td className="py-2">Total Potongan</td>
                            <td className="py-2 text-right text-red-700">{formatCurrency(totalBPJS + selectedPayroll.deductions.pph21 + selectedPayroll.deductions.other)}</td>
                          </tr>
                        </tbody>
                      </table>
                    </div>

                    <div className="bg-blue-700 text-white rounded-lg p-4 text-center">
                      <p className="text-sm">GAJI BERSIH (Take Home Pay)</p>
                      <p className="text-2xl font-bold">{formatCurrency(selectedPayroll.netSalary)}</p>
                    </div>

                    <div className="mt-4 grid grid-cols-2 gap-4 text-xs text-gray-500">
                      <div>
                        <p>Tanggal Bayar: {formatDate(selectedPayroll.paymentDate)}</p>
                        <p>Bank: {emp.bankName} ({emp.bankAccount})</p>
                      </div>
                      <div className="text-right">
                        <p>Hormat kami,</p>
                        <p className="mt-6 border-t border-gray-300 pt-1">HRD Manager</p>
                      </div>
                    </div>
                  </div>
                );
              })() : (
                <div className="text-center py-12 text-gray-400">
                  <i className="fa-solid fa-receipt text-5xl mb-3"></i>
                  <p>Pilih karyawan untuk melihat slip gaji</p>
                </div>
              )}
            </div>
          </div>
        )}

        {/* Employee Detail Modal */}
        {selectedEmployee && activeTab === 'employees' && (
          <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
            <div className="bg-white rounded-xl max-w-2xl w-full max-h-[90vh] overflow-y-auto">
              <div className="bg-gradient-to-r from-blue-600 to-indigo-600 px-6 py-4 flex items-center justify-between">
                <h3 className="text-white font-bold text-lg">Detail Karyawan</h3>
                <button onClick={() => setSelectedEmployee(null)} className="text-white hover:text-gray-200">
                  <i className="fa-solid fa-times text-xl"></i>
                </button>
              </div>
              <div className="p-6 space-y-4">
                <div className="grid grid-cols-2 gap-4 text-sm">
                  <div><span className="text-gray-500">ID:</span> <strong>{selectedEmployee.employeeId}</strong></div>
                  <div><span className="text-gray-500">Nama:</span> <strong>{selectedEmployee.name}</strong></div>
                  <div><span className="text-gray-500">Jabatan:</span> {selectedEmployee.position}</div>
                  <div><span className="text-gray-500">Departemen:</span> {selectedEmployee.department}</div>
                  <div><span className="text-gray-500">Tgl Bergabung:</span> {formatDate(selectedEmployee.joinDate)}</div>
                  <div><span className="text-gray-500">NPWP:</span> {selectedEmployee.npwp}</div>
                  <div><span className="text-gray-500">Bank:</span> {selectedEmployee.bankName}</div>
                  <div><span className="text-gray-500">No. Rekening:</span> {selectedEmployee.bankAccount}</div>
                </div>
                <div className="border-t pt-4">
                  <h4 className="font-semibold text-gray-800 mb-2">Komponen Gaji:</h4>
                  <div className="space-y-1 text-sm">
                    <div className="flex justify-between"><span>Gaji Pokok</span><span className="font-medium">{formatCurrency(selectedEmployee.basicSalary)}</span></div>
                    <div className="flex justify-between"><span>Tunjangan Transport</span><span>{formatCurrency(selectedEmployee.allowances.transport)}</span></div>
                    <div className="flex justify-between"><span>Tunjangan Makan</span><span>{formatCurrency(selectedEmployee.allowances.meal)}</span></div>
                    <div className="flex justify-between"><span>Tunjangan Kesehatan</span><span>{formatCurrency(selectedEmployee.allowances.health)}</span></div>
                    <div className="flex justify-between"><span>Tunjangan Jabatan</span><span>{formatCurrency(selectedEmployee.allowances.position)}</span></div>
                    <div className="flex justify-between font-bold border-t pt-1 mt-2">
                      <span>Total</span>
                      <span className="text-green-600">{formatCurrency(selectedEmployee.basicSalary + selectedEmployee.allowances.transport + selectedEmployee.allowances.meal + selectedEmployee.allowances.health + selectedEmployee.allowances.position)}</span>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}
      </div>
    </PasswordGate>
  );
}
