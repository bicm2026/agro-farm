import React, { useState } from 'react';
import { useApp } from '../context/AppContext';
import { IncomeRecord, PaymentMethod } from '../types';
import { formatCurrency, formatDate, formatNumber } from '../utils/translations';
import { 
  TrendingUp, 
  Plus, 
  Search, 
  FileSpreadsheet, 
  Filter, 
  CheckCircle2, 
  Calendar,
  Receipt
} from 'lucide-react';

export const IncomeView: React.FC = () => {
  const { db, currentUser, language, t, updateDb, logAudit, showToast, exportCSV } = useApp();

  const [searchTerm, setSearchTerm] = useState('');
  const [sectorFilter, setSectorFilter] = useState('all');
  const [categoryFilter, setCategoryFilter] = useState('all');
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);

  // Form states
  const [selectedSectorId, setSelectedSectorId] = useState(db.sectors[0]?.id || '');
  const [category, setCategory] = useState('Egg Sales');
  const [product, setProduct] = useState('');
  const [quantity, setQuantity] = useState('1000');
  const [unit, setUnit] = useState('Pieces');
  const [unitPrice, setUnitPrice] = useState('12.5');
  const [customer, setCustomer] = useState('');
  const [paymentMethod, setPaymentMethod] = useState<PaymentMethod>('bank_transfer');
  const [invoiceNo, setInvoiceNo] = useState('');
  const [notes, setNotes] = useState('');

  // Derived total amount
  const computedTotal = (parseFloat(quantity) || 0) * (parseFloat(unitPrice) || 0);

  const filteredIncomes = db.incomes.filter((inc) => {
    const matchesSearch =
      inc.product.toLowerCase().includes(searchTerm.toLowerCase()) ||
      inc.customerBuyer.toLowerCase().includes(searchTerm.toLowerCase()) ||
      inc.invoiceNo.toLowerCase().includes(searchTerm.toLowerCase()) ||
      inc.category.toLowerCase().includes(searchTerm.toLowerCase());

    const matchesSector = sectorFilter === 'all' || inc.sectorId === sectorFilter;
    const matchesCategory = categoryFilter === 'all' || inc.category === categoryFilter;

    return matchesSearch && matchesSector && matchesCategory;
  });

  const totalIncomeInView = filteredIncomes.reduce((sum, inc) => sum + inc.totalAmount, 0);

  const handleCreateIncome = (e: React.FormEvent) => {
    e.preventDefault();
    const numQty = parseFloat(quantity);
    const numPrice = parseFloat(unitPrice);
    if (!product || isNaN(numQty) || isNaN(numPrice)) {
      showToast('Please fill all required product and pricing fields');
      return;
    }

    const sector = db.sectors.find((s) => s.id === selectedSectorId);
    const newId = `inc-${Date.now()}`;
    const calculatedTotal = numQty * numPrice;

    const newIncome: IncomeRecord = {
      id: newId,
      date: new Date().toISOString().slice(0, 10),
      sectorId: selectedSectorId,
      category,
      product,
      quantity: numQty,
      unit,
      unitPrice: numPrice,
      totalAmount: calculatedTotal,
      customerBuyer: customer || 'Wholesale Market Buyer',
      paymentMethod,
      invoiceNo: invoiceNo || `INV-SBA-${new Date().getFullYear()}-${Math.floor(1000 + Math.random() * 9000)}`,
      receivedByUserId: currentUser.id,
      receivedByName: currentUser.name,
      status: 'approved',
      notes,
    };

    updateDb((prev) => ({
      ...prev,
      incomes: [newIncome, ...prev.incomes],
    }));

    logAudit(
      'RECORD_INCOME',
      `Recorded revenue of ${formatCurrency(calculatedTotal, 'en')} for ${product} in ${sector?.name}`,
      selectedSectorId
    );

    setIsAddModalOpen(false);
    setProduct('');
    setCustomer('');
    setInvoiceNo('');
    setNotes('');
    showToast('Sales revenue recorded and added to farm ledger!');
  };

  const handleExportCSV = () => {
    const headers = [
      'Invoice No',
      'Date',
      'Sector',
      'Category',
      'Product',
      'Quantity',
      'Unit',
      'Unit Price (BDT)',
      'Total Amount (BDT)',
      'Customer / Buyer',
      'Payment Method',
      'Status',
    ];

    const rows = filteredIncomes.map((inc) => {
      const sec = db.sectors.find((s) => s.id === inc.sectorId);
      return [
        inc.invoiceNo,
        inc.date,
        sec?.name || 'Sector',
        inc.category,
        inc.product,
        inc.quantity,
        inc.unit,
        inc.unitPrice,
        inc.totalAmount,
        inc.customerBuyer,
        inc.paymentMethod,
        inc.status,
      ];
    });

    exportCSV('Sales_Revenue_Ledger', headers, rows);
  };

  const categories = Array.from(new Set(db.incomes.map((i) => i.category)));

  return (
    <div className="space-y-6">
      
      {/* Top Header Bar */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-2 border-b border-slate-200">
        <div>
          <h1 className="text-xl sm:text-2xl font-bold text-slate-900 tracking-tight">
            {t.income}
          </h1>
          <p className="text-xs text-slate-500 mt-0.5">
            {language === 'bn' 
              ? 'খামারের সকল বিক্রয়, ডিম, মাংস ও সবজি রাজস্ব ভাউচার খতিয়ান' 
              : 'Official farm sales revenue ledger, egg/meat production sales & wholesale receipts'}
          </p>
        </div>

        <div className="flex items-center gap-2">
          <button
            onClick={handleExportCSV}
            className="px-3 py-1.5 text-xs font-medium text-slate-700 bg-white border border-slate-300 hover:bg-slate-50 rounded-lg transition-colors flex items-center gap-1.5"
          >
            <FileSpreadsheet className="w-3.5 h-3.5 text-emerald-700" />
            <span>{t.exportCSV}</span>
          </button>

          <button
            onClick={() => setIsAddModalOpen(true)}
            className="px-3.5 py-2 text-xs font-semibold text-white bg-emerald-700 hover:bg-emerald-800 rounded-lg shadow-xs transition-colors flex items-center gap-1.5"
          >
            <Plus className="w-4 h-4" />
            <span>{t.addNewIncome}</span>
          </button>
        </div>
      </div>

      {/* KPI strip */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <div className="p-4 bg-white rounded-xl border border-slate-200 shadow-xs">
          <span className="text-xs text-slate-500 block">Total Filtered Revenue</span>
          <span className="text-xl font-bold text-slate-900 tabular-nums">
            {formatCurrency(totalIncomeInView, language)}
          </span>
          <span className="text-[11px] text-emerald-700 block mt-0.5">{filteredIncomes.length} Sales Transactions</span>
        </div>

        <div className="p-4 bg-white rounded-xl border border-slate-200 shadow-xs">
          <span className="text-xs text-slate-500 block">Average Ticket Size</span>
          <span className="text-xl font-bold text-blue-700 tabular-nums">
            {formatCurrency(filteredIncomes.length ? totalIncomeInView / filteredIncomes.length : 0, language)}
          </span>
          <span className="text-[11px] text-slate-400 block mt-0.5">Commercial & Retail Inflow</span>
        </div>

        <div className="p-4 bg-white rounded-xl border border-slate-200 shadow-xs">
          <span className="text-xs text-slate-500 block">Verification Status</span>
          <span className="text-xl font-bold text-emerald-700 tabular-nums">100% Verified</span>
          <span className="text-[11px] text-slate-400 block mt-0.5">Official Invoices Attached</span>
        </div>
      </div>

      {/* Filter and Search Bar */}
      <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-xs flex flex-col md:flex-row gap-3 items-center justify-between">
        <div className="relative w-full md:w-80">
          <Search className="w-4 h-4 text-slate-400 absolute left-3 top-2.5" />
          <input
            type="text"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            placeholder="Search product, customer, invoice no..."
            className="w-full pl-9 pr-3 py-1.5 text-xs border border-slate-300 rounded-lg focus:outline-none focus:border-emerald-600"
          />
        </div>

        <div className="flex flex-wrap items-center gap-3 w-full md:w-auto">
          <div className="flex items-center gap-1.5">
            <span className="text-xs text-slate-500">Sector:</span>
            <select
              value={sectorFilter}
              onChange={(e) => setSectorFilter(e.target.value)}
              className="px-2.5 py-1.5 text-xs border border-slate-300 rounded-lg focus:outline-none focus:border-emerald-600 bg-white"
            >
              <option value="all">All Sectors</option>
              {db.sectors.map((s) => (
                <option key={s.id} value={s.id}>
                  {language === 'bn' ? s.nameBn : s.name}
                </option>
              ))}
            </select>
          </div>

          <div className="flex items-center gap-1.5">
            <span className="text-xs text-slate-500">Category:</span>
            <select
              value={categoryFilter}
              onChange={(e) => setCategoryFilter(e.target.value)}
              className="px-2.5 py-1.5 text-xs border border-slate-300 rounded-lg focus:outline-none focus:border-emerald-600 bg-white"
            >
              <option value="all">All Categories</option>
              {categories.map((c, idx) => (
                <option key={idx} value={c}>{c}</option>
              ))}
            </select>
          </div>
        </div>
      </div>

      {/* Incomes Table */}
      <div className="bg-white rounded-xl border border-slate-200 shadow-xs overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-xs text-left">
            <thead className="bg-slate-50 text-slate-600 font-semibold border-b border-slate-200">
              <tr>
                <th className="py-3 px-4">{t.date}</th>
                <th className="py-3 px-4">Invoice #</th>
                <th className="py-3 px-4">{t.sector}</th>
                <th className="py-3 px-4">{t.category}</th>
                <th className="py-3 px-4">Product Description</th>
                <th className="py-3 px-4 text-right">Quantity & Unit</th>
                <th className="py-3 px-4 text-right">Unit Price</th>
                <th className="py-3 px-4 text-right">Total Amount</th>
                <th className="py-3 px-4">Customer / Buyer</th>
                <th className="py-3 px-4 text-center">{t.status}</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {filteredIncomes.map((inc) => {
                const sector = db.sectors.find((s) => s.id === inc.sectorId);

                return (
                  <tr key={inc.id} className="hover:bg-slate-50/70 transition-colors">
                    <td className="py-3 px-4 text-slate-500 whitespace-nowrap tabular-nums">
                      {formatDate(inc.date, language)}
                    </td>

                    <td className="py-3 px-4 whitespace-nowrap font-mono text-emerald-800 font-semibold">
                      {inc.invoiceNo}
                    </td>

                    <td className="py-3 px-4 whitespace-nowrap font-medium text-slate-800">
                      {language === 'bn' ? sector?.nameBn || sector?.name : sector?.name}
                    </td>

                    <td className="py-3 px-4 whitespace-nowrap">
                      <span className="text-[11px] font-medium bg-slate-100 text-slate-700 px-2 py-0.5 rounded">
                        {inc.category}
                      </span>
                    </td>

                    <td className="py-3 px-4 font-semibold text-slate-900 max-w-xs truncate" title={inc.product}>
                      {inc.product}
                    </td>

                    <td className="py-3 px-4 text-right tabular-nums text-slate-700 whitespace-nowrap">
                      {formatNumber(inc.quantity, language)} {inc.unit}
                    </td>

                    <td className="py-3 px-4 text-right tabular-nums text-slate-600 whitespace-nowrap">
                      {formatCurrency(inc.unitPrice, language)}
                    </td>

                    <td className="py-3 px-4 text-right font-bold text-emerald-700 tabular-nums whitespace-nowrap">
                      {formatCurrency(inc.totalAmount, language)}
                    </td>

                    <td className="py-3 px-4 text-slate-700 whitespace-nowrap">
                      {inc.customerBuyer}
                    </td>

                    <td className="py-3 px-4 text-center whitespace-nowrap">
                      <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-emerald-100 text-emerald-800">
                        {inc.status.toUpperCase()}
                      </span>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>

      {/* Add Income Modal with Automatic Qty × Unit Price Calculation */}
      {isAddModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4 backdrop-blur-xs">
          <div className="bg-white rounded-xl shadow-2xl max-w-lg w-full p-6 border border-slate-200 max-h-[85vh] overflow-y-auto">
            <div className="flex justify-between items-center pb-3 border-b border-slate-200 mb-4">
              <h3 className="text-base font-bold text-slate-900">{t.addNewIncome}</h3>
              <button onClick={() => setIsAddModalOpen(false)} className="text-slate-400 hover:text-slate-600">✕</button>
            </div>

            <form onSubmit={handleCreateIncome} className="space-y-4">
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-medium text-slate-700 mb-1">Sector *</label>
                  <select
                    value={selectedSectorId}
                    onChange={(e) => setSelectedSectorId(e.target.value)}
                    className="w-full px-3 py-2 text-xs border border-slate-300 rounded-lg focus:outline-none focus:border-emerald-600 bg-white"
                  >
                    {db.sectors.map((s) => (
                      <option key={s.id} value={s.id}>
                        {s.name}
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-medium text-slate-700 mb-1">Income Category</label>
                  <select
                    value={category}
                    onChange={(e) => setCategory(e.target.value)}
                    className="w-full px-3 py-2 text-xs border border-slate-300 rounded-lg focus:outline-none focus:border-emerald-600 bg-white"
                  >
                    <option value="Egg Sales">Egg Sales</option>
                    <option value="Live Bird Sales">Live Bird / Duck Sales</option>
                    <option value="Goat Meat Sales">Live Goat / Meat Sales</option>
                    <option value="Breeding Stock">Breeding Pairs / Stock</option>
                    <option value="Fresh Vegetables">Fresh Organic Vegetables</option>
                    <option value="Manure / Organic Fertilizer">Bio-Manure / Fertilizer</option>
                    <option value="Feather & Byproducts">Byproducts & Other</option>
                  </select>
                </div>
              </div>

              <div>
                <label className="block text-xs font-medium text-slate-700 mb-1">Product / Produce Description *</label>
                <input
                  type="text"
                  required
                  value={product}
                  onChange={(e) => setProduct(e.target.value)}
                  placeholder="e.g. 5,000 Pcs Fresh Duck Eggs (Large Grade)"
                  className="w-full px-3 py-2 text-xs border border-slate-300 rounded-lg focus:outline-none focus:border-emerald-600"
                />
              </div>

              <div className="grid grid-cols-3 gap-3">
                <div>
                  <label className="block text-xs font-medium text-slate-700 mb-1">Quantity *</label>
                  <input
                    type="number"
                    step="any"
                    required
                    value={quantity}
                    onChange={(e) => setQuantity(e.target.value)}
                    className="w-full px-3 py-2 text-xs border border-slate-300 rounded-lg focus:outline-none focus:border-emerald-600 tabular-nums"
                  />
                </div>

                <div>
                  <label className="block text-xs font-medium text-slate-700 mb-1">Unit</label>
                  <input
                    type="text"
                    required
                    value={unit}
                    onChange={(e) => setUnit(e.target.value)}
                    placeholder="Pcs / Kg / Heads"
                    className="w-full px-3 py-2 text-xs border border-slate-300 rounded-lg focus:outline-none focus:border-emerald-600"
                  />
                </div>

                <div>
                  <label className="block text-xs font-medium text-slate-700 mb-1">Unit Price (৳ BDT) *</label>
                  <input
                    type="number"
                    step="any"
                    required
                    value={unitPrice}
                    onChange={(e) => setUnitPrice(e.target.value)}
                    className="w-full px-3 py-2 text-xs border border-slate-300 rounded-lg focus:outline-none focus:border-emerald-600 tabular-nums"
                  />
                </div>
              </div>

              {/* Live Computed Total Box */}
              <div className="p-3 bg-emerald-50 rounded-lg border border-emerald-200 flex items-center justify-between">
                <div>
                  <span className="text-xs text-emerald-800 font-medium block">
                    Auto-Calculated Total (Qty × Unit Price):
                  </span>
                  <span className="text-[11px] text-emerald-600">
                    {quantity || 0} {unit} × ৳{unitPrice || 0}
                  </span>
                </div>
                <div className="text-lg font-bold text-emerald-800 tabular-nums">
                  {formatCurrency(computedTotal, language)}
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-medium text-slate-700 mb-1">Customer / Wholesale Buyer</label>
                  <input
                    type="text"
                    value={customer}
                    onChange={(e) => setCustomer(e.target.value)}
                    placeholder="e.g. Karwan Bazar Egg Traders"
                    className="w-full px-3 py-2 text-xs border border-slate-300 rounded-lg focus:outline-none focus:border-emerald-600"
                  />
                </div>

                <div>
                  <label className="block text-xs font-medium text-slate-700 mb-1">Payment Method</label>
                  <select
                    value={paymentMethod}
                    onChange={(e) => setPaymentMethod(e.target.value as any)}
                    className="w-full px-3 py-2 text-xs border border-slate-300 rounded-lg focus:outline-none focus:border-emerald-600 bg-white"
                  >
                    <option value="bank_transfer">Bank Transfer</option>
                    <option value="bkash">bKash (MFS)</option>
                    <option value="nagad">Nagad (MFS)</option>
                    <option value="cash">Cash In Hand</option>
                    <option value="cheque">Bank Cheque</option>
                  </select>
                </div>
              </div>

              <div>
                <label className="block text-xs font-medium text-slate-700 mb-1">Invoice / Receipt Number</label>
                <input
                  type="text"
                  value={invoiceNo}
                  onChange={(e) => setInvoiceNo(e.target.value)}
                  placeholder="Auto-generated if left blank"
                  className="w-full px-3 py-2 text-xs border border-slate-300 rounded-lg focus:outline-none focus:border-emerald-600 font-mono"
                />
              </div>

              <div className="pt-3 border-t border-slate-200 flex justify-end gap-2">
                <button
                  type="button"
                  onClick={() => setIsAddModalOpen(false)}
                  className="px-4 py-2 text-xs text-slate-600 hover:bg-slate-100 rounded-lg"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 text-xs font-semibold text-white bg-emerald-700 hover:bg-emerald-800 rounded-lg shadow-xs"
                >
                  Post Revenue
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

    </div>
  );
};
