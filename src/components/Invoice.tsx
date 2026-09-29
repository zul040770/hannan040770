import { useState, useEffect } from 'react';
import { Invoice, InvoiceItem, JournalEntry } from '../types';
import { formatCurrency, formatDate } from '../store';

interface Props {
  journals: JournalEntry[];
  onSaveJournal: (journals: JournalEntry[]) => void;
}

const PPN_RATE = 0.11; // 11% sesuai UU HPP

export default function InvoiceModule({ journals, onSaveJournal }: Props) {
  const [invoices, setInvoices] = useState<Invoice[]>(() => {
    const stored = localStorage.getItem('invoices');
    if (stored) return JSON.parse(stored);
    return [];
  });

  const [showForm, setShowForm] = useState(false);
  const [selectedInvoice, setSelectedInvoice] = useState<Invoice | null>(null);
  const [editingId, setEditingId] = useState<string | null>(null);

  // Form state
  const [customerName, setCustomerName] = useState('');
  const [customerAddress, setCustomerAddress] = useState('');
  const [customerPhone, setCustomerPhone] = useState('');
  const [invoiceDate, setInvoiceDate] = useState(new Date().toISOString().split('T')[0]);
  const [dueDate, setDueDate] = useState('');
  const [notes, setNotes] = useState('');
  const [items, setItems] = useState<InvoiceItem[]>([
    { id: '1', description: '', quantity: 1, unitPrice: 0, amount: 0 }
  ]);

  useEffect(() => {
    localStorage.setItem('invoices', JSON.stringify(invoices));
  }, [invoices]);

  const calculateTotals = () => {
    const subtotal = items.reduce((sum, item) => sum + item.amount, 0);
    const ppn = Math.round(subtotal * PPN_RATE);
    const total = subtotal + ppn;
    return { subtotal, ppn, total };
  };

  const addItem = () => {
    setItems([...items, { id: Date.now().toString(), description: '', quantity: 1, unitPrice: 0, amount: 0 }]);
  };

  const removeItem = (id: string) => {
    if (items.length > 1) {
      setItems(items.filter(item => item.id !== id));
    }
  };

  const updateItem = (id: string, field: keyof InvoiceItem, value: string | number) => {
    setItems(items.map(item => {
      if (item.id === id) {
        const updated = { ...item, [field]: value };
        if (field === 'quantity' || field === 'unitPrice') {
          updated.amount = updated.quantity * updated.unitPrice;
        }
        return updated;
      }
      return item;
    }));
  };

  const resetForm = () => {
    setCustomerName('');
    setCustomerAddress('');
    setCustomerPhone('');
    setInvoiceDate(new Date().toISOString().split('T')[0]);
    setDueDate('');
    setNotes('');
    setItems([{ id: '1', description: '', quantity: 1, unitPrice: 0, amount: 0 }]);
    setShowForm(false);
    setEditingId(null);
  };

  const generateInvoiceNumber = () => {
    const date = new Date();
    const year = date.getFullYear();
    const month = String(date.getMonth() + 1).padStart(2, '0');
    const count = invoices.length + 1;
    return `INV/${year}/${month}/${String(count).padStart(4, '0')}`;
  };

  const createJournalEntry = (invoice: Invoice): JournalEntry => {
    // Auto-journal: Debit Piutang Usaha, Credit Pendapatan (DPP) + Credit PPN
    return {
      id: `j-${invoice.id}`,
      date: invoice.date,
      description: `Invoice ${invoice.invoiceNumber} - ${invoice.customerName}`,
      reference: invoice.invoiceNumber,
      lines: [
        { accountId: '3', debit: invoice.total, credit: 0 }, // Piutang Usaha
        { accountId: '19', debit: 0, credit: invoice.subtotal }, // Pendapatan Penjualan
        { accountId: '14', debit: 0, credit: invoice.ppn }, // Hutang Pajak (PPN)
      ]
    };
  };

  const handleSubmit = () => {
    if (!customerName || items.some(item => !item.description || item.amount <= 0)) {
      alert('Lengkapi data customer dan item invoice');
      return;
    }

    const { subtotal, ppn, total } = calculateTotals();
    const invoiceNumber = editingId 
      ? invoices.find(inv => inv.id === editingId)?.invoiceNumber || generateInvoiceNumber()
      : generateInvoiceNumber();

    const invoice: Invoice = {
      id: editingId || Date.now().toString(),
      invoiceNumber,
      date: invoiceDate,
      dueDate: dueDate || invoiceDate,
      customerName,
      customerAddress,
      customerPhone,
      items,
      subtotal,
      ppn,
      total,
      status: 'issued',
      notes,
    };

    // Create journal entry
    const journalEntry = createJournalEntry(invoice);
    invoice.journalId = journalEntry.id;

    if (editingId) {
      // Update existing invoice and remove old journal
      const oldInvoice = invoices.find(inv => inv.id === editingId);
      if (oldInvoice?.journalId) {
        const updatedJournals = journals.filter(j => j.id !== oldInvoice.journalId);
        updatedJournals.push(journalEntry);
        onSaveJournal(updatedJournals);
      }
      setInvoices(invoices.map(inv => inv.id === editingId ? invoice : inv));
    } else {
      // Add new invoice and journal
      setInvoices([...invoices, invoice]);
      onSaveJournal([...journals, journalEntry]);
    }

    resetForm();
  };

  const handleDelete = (id: string) => {
    if (confirm('Yakin ingin menghapus invoice ini? Jurnal terkait juga akan dihapus.')) {
      const invoice = invoices.find(inv => inv.id === id);
      if (invoice?.journalId) {
        const updatedJournals = journals.filter(j => j.id !== invoice.journalId);
        onSaveJournal(updatedJournals);
      }
      setInvoices(invoices.filter(inv => inv.id !== id));
    }
  };

  const markAsPaid = (id: string) => {
    setInvoices(invoices.map(inv => 
      inv.id === id ? { ...inv, status: 'paid' as const } : inv
    ));
  };

  const { subtotal, ppn, total } = calculateTotals();

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'draft': return 'bg-gray-100 text-gray-700';
      case 'issued': return 'bg-blue-100 text-blue-700';
      case 'paid': return 'bg-green-100 text-green-700';
      case 'overdue': return 'bg-red-100 text-red-700';
      default: return 'bg-gray-100 text-gray-700';
    }
  };

  const getStatusLabel = (status: string) => {
    switch (status) {
      case 'draft': return 'Draft';
      case 'issued': return 'Terbit';
      case 'paid': return 'Lunas';
      case 'overdue': return 'Jatuh Tempo';
      default: return status;
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between flex-wrap gap-4">
        <div>
          <h1 className="text-3xl font-bold text-gray-800">Invoice</h1>
          <p className="text-gray-500 mt-1">Buat invoice dengan DPP dan PPN 11% - Auto jurnal ke Piutang</p>
        </div>
        <button
          onClick={() => setShowForm(!showForm)}
          className="bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 transition flex items-center gap-2"
        >
          <i className="fa-solid fa-plus"></i>
          Buat Invoice
        </button>
      </div>

      {/* Summary Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-4">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-blue-100 rounded-lg flex items-center justify-center">
              <i className="fa-solid fa-file-invoice text-blue-600"></i>
            </div>
            <div>
              <p className="text-xs text-gray-500">Total Invoice</p>
              <p className="font-bold text-gray-800">{invoices.length}</p>
            </div>
          </div>
        </div>
        <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-4">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-green-100 rounded-lg flex items-center justify-center">
              <i className="fa-solid fa-circle-check text-green-600"></i>
            </div>
            <div>
              <p className="text-xs text-gray-500">Lunas</p>
              <p className="font-bold text-gray-800">{invoices.filter(i => i.status === 'paid').length}</p>
            </div>
          </div>
        </div>
        <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-4">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-orange-100 rounded-lg flex items-center justify-center">
              <i className="fa-solid fa-clock text-orange-600"></i>
            </div>
            <div>
              <p className="text-xs text-gray-500">Belum Lunas</p>
              <p className="font-bold text-gray-800">{invoices.filter(i => i.status === 'issued').length}</p>
            </div>
          </div>
        </div>
        <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-4">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-purple-100 rounded-lg flex items-center justify-center">
              <i className="fa-solid fa-money-bill-trend-up text-purple-600"></i>
            </div>
            <div>
              <p className="text-xs text-gray-500">Total Piutang</p>
              <p className="font-bold text-gray-800">{formatCurrency(invoices.filter(i => i.status !== 'paid').reduce((s, i) => s + i.total, 0))}</p>
            </div>
          </div>
        </div>
      </div>

      {/* Invoice Form */}
      {showForm && (
        <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6">
          <h3 className="font-semibold text-gray-800 mb-4">{editingId ? 'Edit Invoice' : 'Buat Invoice Baru'}</h3>
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-6">
            <div>
              <label className="block text-sm font-medium text-gray-600 mb-1">Nama Customer *</label>
              <input
                type="text"
                value={customerName}
                onChange={e => setCustomerName(e.target.value)}
                placeholder="PT. Contoh Customer"
                className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-600 mb-1">No. Telepon</label>
              <input
                type="text"
                value={customerPhone}
                onChange={e => setCustomerPhone(e.target.value)}
                placeholder="021-1234567"
                className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              />
            </div>
            <div className="md:col-span-2">
              <label className="block text-sm font-medium text-gray-600 mb-1">Alamat Customer</label>
              <input
                type="text"
                value={customerAddress}
                onChange={e => setCustomerAddress(e.target.value)}
                placeholder="Jl. Sudirman No. 123, Jakarta"
                className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-600 mb-1">Tanggal Invoice *</label>
              <input
                type="date"
                value={invoiceDate}
                onChange={e => setInvoiceDate(e.target.value)}
                className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-600 mb-1">Jatuh Tempo</label>
              <input
                type="date"
                value={dueDate}
                onChange={e => setDueDate(e.target.value)}
                className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              />
            </div>
          </div>

          {/* Items */}
          <div className="mb-4">
            <label className="block text-sm font-medium text-gray-600 mb-2">Item Invoice *</label>
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead className="bg-gray-50">
                  <tr>
                    <th className="text-left px-3 py-2 text-xs font-semibold text-gray-500">Deskripsi</th>
                    <th className="text-center px-3 py-2 text-xs font-semibold text-gray-500 w-24">Qty</th>
                    <th className="text-right px-3 py-2 text-xs font-semibold text-gray-500 w-36">Harga Satuan</th>
                    <th className="text-right px-3 py-2 text-xs font-semibold text-gray-500 w-36">Jumlah</th>
                    <th className="w-10"></th>
                  </tr>
                </thead>
                <tbody>
                  {items.map(item => (
                    <tr key={item.id} className="border-b border-gray-50">
                      <td className="px-3 py-2">
                        <input
                          type="text"
                          value={item.description}
                          onChange={e => updateItem(item.id, 'description', e.target.value)}
                          placeholder="Deskripsi item/jasa"
                          className="w-full border border-gray-300 rounded px-2 py-1.5 text-sm focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                        />
                      </td>
                      <td className="px-3 py-2">
                        <input
                          type="number"
                          value={item.quantity}
                          onChange={e => updateItem(item.id, 'quantity', Number(e.target.value))}
                          min="1"
                          className="w-full border border-gray-300 rounded px-2 py-1.5 text-sm text-center focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                        />
                      </td>
                      <td className="px-3 py-2">
                        <input
                          type="number"
                          value={item.unitPrice}
                          onChange={e => updateItem(item.id, 'unitPrice', Number(e.target.value))}
                          placeholder="0"
                          className="w-full border border-gray-300 rounded px-2 py-1.5 text-sm text-right focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                        />
                      </td>
                      <td className="px-3 py-2 text-right text-sm font-medium">
                        {formatCurrency(item.amount)}
                      </td>
                      <td className="px-2 py-2">
                        <button onClick={() => removeItem(item.id)} className="text-red-400 hover:text-red-600">
                          <i className="fa-solid fa-circle-minus"></i>
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
            <button onClick={addItem} className="mt-2 text-blue-600 hover:text-blue-800 text-sm font-medium">
              <i className="fa-solid fa-plus mr-1"></i> Tambah Item
            </button>
          </div>

          {/* Totals */}
          <div className="bg-gray-50 rounded-lg p-4 mb-4">
            <div className="flex justify-between items-center py-1">
              <span className="text-gray-600">DPP (Dasar Pengenaan Pajak)</span>
              <span className="font-medium">{formatCurrency(subtotal)}</span>
            </div>
            <div className="flex justify-between items-center py-1">
              <span className="text-gray-600">PPN (11%)</span>
              <span className="font-medium">{formatCurrency(ppn)}</span>
            </div>
            <div className="flex justify-between items-center py-2 border-t-2 border-gray-300 mt-2">
              <span className="font-bold text-gray-800">Total</span>
              <span className="font-bold text-lg text-blue-700">{formatCurrency(total)}</span>
            </div>
          </div>

          {/* Notes */}
          <div className="mb-4">
            <label className="block text-sm font-medium text-gray-600 mb-1">Catatan</label>
            <textarea
              value={notes}
              onChange={e => setNotes(e.target.value)}
              placeholder="Catatan tambahan..."
              rows={2}
              className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            />
          </div>

          {/* Info Box */}
          <div className="bg-blue-50 border border-blue-200 rounded-lg p-3 mb-4">
            <p className="text-xs text-blue-700">
              <i className="fa-solid fa-circle-info mr-1"></i>
              <strong>Auto Jurnal:</strong> Invoice ini akan otomatis terjurnal sebagai:
            </p>
            <p className="text-xs text-blue-600 mt-1 ml-4">
              (D) Piutang Usaha: {formatCurrency(total)}<br/>
              (K) Pendapatan Penjualan: {formatCurrency(subtotal)}<br/>
              (K) Hutang Pajak (PPN): {formatCurrency(ppn)}
            </p>
          </div>

          <div className="flex justify-end gap-2">
            <button onClick={resetForm} className="bg-gray-200 text-gray-700 px-4 py-2 rounded-lg hover:bg-gray-300 transition">
              Batal
            </button>
            <button onClick={handleSubmit} className="bg-green-600 text-white px-4 py-2 rounded-lg hover:bg-green-700 transition">
              <i className="fa-solid fa-check mr-1"></i> Simpan & Jurnal
            </button>
          </div>
        </div>
      )}

      {/* Invoice List */}
      <div className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden">
        <div className="px-6 py-4 bg-gradient-to-r from-indigo-600 to-purple-600">
          <h3 className="text-white font-bold text-lg">Daftar Invoice</h3>
          <p className="text-indigo-100 text-sm">Semua invoice yang telah dibuat</p>
        </div>
        
        {invoices.length === 0 ? (
          <div className="p-12 text-center text-gray-400">
            <i className="fa-solid fa-file-invoice text-5xl mb-3"></i>
            <p>Belum ada invoice</p>
            <p className="text-sm">Klik "Buat Invoice" untuk memulai</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-gray-50">
                <tr>
                  <th className="text-left px-6 py-3 text-xs font-semibold text-gray-500 uppercase">No. Invoice</th>
                  <th className="text-left px-6 py-3 text-xs font-semibold text-gray-500 uppercase">Tanggal</th>
                  <th className="text-left px-6 py-3 text-xs font-semibold text-gray-500 uppercase">Customer</th>
                  <th className="text-right px-6 py-3 text-xs font-semibold text-gray-500 uppercase">DPP</th>
                  <th className="text-right px-6 py-3 text-xs font-semibold text-gray-500 uppercase">PPN</th>
                  <th className="text-right px-6 py-3 text-xs font-semibold text-gray-500 uppercase">Total</th>
                  <th className="text-center px-6 py-3 text-xs font-semibold text-gray-500 uppercase">Status</th>
                  <th className="text-center px-6 py-3 text-xs font-semibold text-gray-500 uppercase">Aksi</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-50">
                {invoices.map(invoice => (
                  <tr key={invoice.id} className="hover:bg-gray-50 transition">
                    <td className="px-6 py-3 font-mono text-sm text-blue-600 font-medium">{invoice.invoiceNumber}</td>
                    <td className="px-6 py-3 text-sm text-gray-600">{formatDate(invoice.date)}</td>
                    <td className="px-6 py-3">
                      <p className="font-medium text-gray-800 text-sm">{invoice.customerName}</p>
                    </td>
                    <td className="px-6 py-3 text-right text-sm">{formatCurrency(invoice.subtotal)}</td>
                    <td className="px-6 py-3 text-right text-sm text-orange-600">{formatCurrency(invoice.ppn)}</td>
                    <td className="px-6 py-3 text-right text-sm font-bold text-gray-800">{formatCurrency(invoice.total)}</td>
                    <td className="px-6 py-3 text-center">
                      <span className={`px-2 py-1 rounded-full text-xs font-medium ${getStatusColor(invoice.status)}`}>
                        {getStatusLabel(invoice.status)}
                      </span>
                    </td>
                    <td className="px-6 py-3 text-center">
                      <div className="flex items-center justify-center gap-2">
                        <button
                          onClick={() => setSelectedInvoice(invoice)}
                          className="text-blue-600 hover:text-blue-800"
                          title="Lihat Detail"
                        >
                          <i className="fa-solid fa-eye"></i>
                        </button>
                        {invoice.status === 'issued' && (
                          <button
                            onClick={() => markAsPaid(invoice.id)}
                            className="text-green-600 hover:text-green-800"
                            title="Tandai Lunas"
                          >
                            <i className="fa-solid fa-circle-check"></i>
                          </button>
                        )}
                        <button
                          onClick={() => handleDelete(invoice.id)}
                          className="text-red-600 hover:text-red-800"
                          title="Hapus"
                        >
                          <i className="fa-solid fa-trash"></i>
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Invoice Detail Modal */}
      {selectedInvoice && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-xl max-w-3xl w-full max-h-[90vh] overflow-y-auto">
            <div className="bg-gradient-to-r from-indigo-600 to-purple-600 px-6 py-4 flex items-center justify-between">
              <h3 className="text-white font-bold text-lg">Detail Invoice</h3>
              <button onClick={() => setSelectedInvoice(null)} className="text-white hover:text-gray-200">
                <i className="fa-solid fa-times text-xl"></i>
              </button>
            </div>
            <div className="p-6">
              {/* Invoice Header */}
              <div className="flex justify-between items-start mb-6 pb-4 border-b-2 border-gray-200">
                <div>
                  <h2 className="text-2xl font-bold text-gray-800">INVOICE</h2>
                  <p className="text-lg font-mono text-blue-600">{selectedInvoice.invoiceNumber}</p>
                </div>
                <div className="text-right">
                  <p className="text-sm text-gray-500">Tanggal: {formatDate(selectedInvoice.date)}</p>
                  <p className="text-sm text-gray-500">Jatuh Tempo: {formatDate(selectedInvoice.dueDate)}</p>
                  <span className={`inline-block mt-2 px-3 py-1 rounded-full text-xs font-medium ${getStatusColor(selectedInvoice.status)}`}>
                    {getStatusLabel(selectedInvoice.status)}
                  </span>
                </div>
              </div>

              {/* Customer Info */}
              <div className="mb-6">
                <h4 className="text-sm font-semibold text-gray-500 uppercase mb-2">Ditagihkan Kepada:</h4>
                <p className="font-bold text-gray-800">{selectedInvoice.customerName}</p>
                {selectedInvoice.customerAddress && <p className="text-sm text-gray-600">{selectedInvoice.customerAddress}</p>}
                {selectedInvoice.customerPhone && <p className="text-sm text-gray-600">Telp: {selectedInvoice.customerPhone}</p>}
              </div>

              {/* Items Table */}
              <div className="mb-6">
                <table className="w-full">
                  <thead className="bg-gray-100">
                    <tr>
                      <th className="text-left px-4 py-2 text-xs font-semibold text-gray-600">Deskripsi</th>
                      <th className="text-center px-4 py-2 text-xs font-semibold text-gray-600">Qty</th>
                      <th className="text-right px-4 py-2 text-xs font-semibold text-gray-600">Harga</th>
                      <th className="text-right px-4 py-2 text-xs font-semibold text-gray-600">Jumlah</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-100">
                    {selectedInvoice.items.map(item => (
                      <tr key={item.id}>
                        <td className="px-4 py-2 text-sm">{item.description}</td>
                        <td className="px-4 py-2 text-sm text-center">{item.quantity}</td>
                        <td className="px-4 py-2 text-sm text-right">{formatCurrency(item.unitPrice)}</td>
                        <td className="px-4 py-2 text-sm text-right font-medium">{formatCurrency(item.amount)}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>

              {/* Totals */}
              <div className="flex justify-end">
                <div className="w-64">
                  <div className="flex justify-between py-1">
                    <span className="text-gray-600">DPP:</span>
                    <span className="font-medium">{formatCurrency(selectedInvoice.subtotal)}</span>
                  </div>
                  <div className="flex justify-between py-1">
                    <span className="text-gray-600">PPN (11%):</span>
                    <span className="font-medium text-orange-600">{formatCurrency(selectedInvoice.ppn)}</span>
                  </div>
                  <div className="flex justify-between py-2 border-t-2 border-gray-800 mt-2">
                    <span className="font-bold text-gray-800">TOTAL:</span>
                    <span className="font-bold text-lg text-blue-700">{formatCurrency(selectedInvoice.total)}</span>
                  </div>
                </div>
              </div>

              {/* Notes */}
              {selectedInvoice.notes && (
                <div className="mt-6 p-3 bg-gray-50 rounded-lg">
                  <p className="text-xs text-gray-500 font-semibold mb-1">Catatan:</p>
                  <p className="text-sm text-gray-700">{selectedInvoice.notes}</p>
                </div>
              )}

              {/* Journal Info */}
              {selectedInvoice.journalId && (
                <div className="mt-4 p-3 bg-blue-50 border border-blue-200 rounded-lg">
                  <p className="text-xs text-blue-700 font-semibold">
                    <i className="fa-solid fa-book mr-1"></i>
                    Jurnal Terkait: {selectedInvoice.journalId}
                  </p>
                  <p className="text-xs text-blue-600 mt-1">
                    (D) Piutang Usaha | (K) Pendapatan | (K) PPN
                  </p>
                </div>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
