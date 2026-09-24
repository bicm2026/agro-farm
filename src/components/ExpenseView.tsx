import React, { useState } from 'react';
import { useApp } from '../context/AppContext';
import { ExpenseRecord, ExpenseCategory, PaymentMethod } from '../types';
import { formatCurrency, formatDate } from '../utils/translations';
import { APP_IMAGES } from '../utils/imageAssets';
import { 
  Receipt, 
  Plus, 
  Search, 
  FileSpreadsheet, 
  CheckCircle2, 
  Clock, 
  XCircle, 
  Check, 
  X, 
  AlertTriangle,
  Upload,
  Eye
} from 'lucide-react';

export const ExpenseView: React.FC = () => {
  const { db, currentUser, language, t, updateDb, logAudit, showToast, exportCSV } = useApp();

  const [searchTerm, setSearchTerm] = useState('');
  const [sectorFilter, setSectorFilter] = useState('all');
  const [categoryFilter, setCategoryFilter] = useState('all');
  const [statusFilter, setStatusFilter] = useState('all');
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);

  // Form states
  const [selectedSectorId, setSelectedSectorId] = useState(db.sectors[0]?.id || '');
  const [category, setCategory] = useState<ExpenseCategory>('feed');
  const [description, setDescription] = useState('');
  const [amount, setAmount] = useState('');
  const [vendor, setVendor] = useState('');
  const [paymentMethod, setPaymentMethod] = useState<PaymentMethod>('bank_transfer');
  const [voucherNo, setVoucherNo] = useState('');
  const [notes, setNotes] = useState('');

  const isFinanceAuthority =
    currentUser.role === 'super_admin' ||
    currentUser.role === 'admin_manager' ||
    currentUser.role === 'accountant';

  const filteredExpenses = db.expenses.filter((exp) => {
    const matchesSearch =
      exp.description.toLowerCase().includes(searchTerm.toLowerCase()) ||
      exp.vendor.toLowerCase().includes(searchTerm.toLowerCase()) ||
      (exp.voucherNo && exp.voucherNo.toLowerCase().includes(searchTerm.toLowerCase()));

    const matchesSector = sectorFilter === 'all' || exp.sectorId === sectorFilter;
    const matchesCategory = categoryFilter === 'all' || exp.category === categoryFilter;
    const matchesStatus = statusFilter === 'all' || exp.status === statusFilter;

    return matchesSearch && matchesSector && matchesCategory && matchesStatus;
  });

  const totalApprovedExpenses = filteredExpenses
    .filter((e) => e.status === 'approved')
    .reduce((sum, exp) => sum + exp.amount, 0);

  const pendingCount = filteredExpenses.filter((e) => e.status === 'pending_approval').length;

  const handleApprove = (exp: ExpenseRecord) => {
    updateDb((prev) => ({
      ...prev,
      expenses: prev.expenses.map((e) =>
        e.id === exp.id
          ? {
              ...e,
              status: 'approved',
              approvedByUserId: currentUser.id,
              approvedByName: currentUser.name,
              approvedAt: new Date().toISOString().slice(0, 10),
            }
          : e
      ),
    }));

    logAudit(
      'APPROVE_EXPENSE',
      `Approved expense voucher #${exp.voucherNo || exp.id} of ${formatCurrency(exp.amount, 'en')} for ${exp.description}`,
      exp.sectorId,
      'pending_approval',
      'approved'
    );
    showToast('Expense voucher approved and posted to official ledger!');
  };

  const handleReject = (exp: ExpenseRecord) => {
    if (!window.confirm('Reject and cancel this expense voucher?')) return;

    updateDb((prev) => ({
      ...prev,
      expenses: prev.expenses.map((e) =>
        e.id === exp.id
          ? {
              ...e,
              status: 'rejected',
            }
          : e
      ),
    }));

    logAudit('REJECT_EXPENSE', `Rejected expense voucher #${exp.voucherNo || exp.id} for ${exp.description}`, exp.sectorId);
    showToast('Expense voucher rejected.');
  };

  const handleCreateExpense = (e: React.FormEvent) => {
    e.preventDefault();
    const numAmount = parseFloat(amount);
    if (!description || isNaN(numAmount) || numAmount <= 0) {
      showToast('Please enter a valid expense description and amount');
      return;
    }

    const sector = db.sectors.find((s) => s.id === selectedSectorId);
    const newId = `exp-${Date.now()}`;
    const initialStatus = isFinanceAuthority ? 'approved' : 'pending_approval';

    const newExpense: ExpenseRecord = {
      id: newId,
      date: new Date().toISOString().slice(0, 10),
      sectorId: selectedSectorId,
      category,
      description,
      amount: numAmount,
      vendor: vendor || 'Local Agricultural Supplier',
      paidByUserId: currentUser.id,
      paidByName: currentUser.name,
      paymentMethod,
      voucherNo: voucherNo || `VOUCH-SBA-${new Date().getFullYear()}-${Math.floor(1000 + Math.random() * 9000)}`,
      receiptAttachment: APP_IMAGES.hero,
      status: initialStatus,
      approvedByUserId: isFinanceAuthority ? currentUser.id : undefined,
      approvedByName: isFinanceAuthority ? currentUser.name : undefined,
      approvedAt: isFinanceAuthority ? new Date().toISOString().slice(0, 10) : undefined,
      notes,
    };

    updateDb((prev) => ({
      ...prev,
      expenses: [newExpense, ...prev.expenses],
    }));

    logAudit(
      'RECORD_EXPENSE',
      `Created expense voucher for ${formatCurrency(numAmount, 'en')} (${category}) in ${sector?.name}`,
      selectedSectorId,
      undefined,
      initialStatus
    );

    setIsAddModalOpen(false);
    setDescription('');
    setAmount('');
    setVendor('');
    setVoucherNo('');
    setNotes('');
    showToast(
      isFinanceAuthority
        ? 'Expense voucher approved and posted!'
        : 'Expense voucher submitted and queued for accountant approval.'
    );
  };

  const handleExportCSV = () => {
    const headers = [
      'Voucher No',
      'Date',
      'Sector',
      'Category',
      'Description',
      'Amount (BDT)',
      'Vendor / Supplier',
      'Payment Method',
      'Status',
      'Approved By',
    ];

    const rows = filteredExpenses.map((exp) => {
      const sec = db.sectors.find((s) => s.id === exp.sectorId);
      return [
        exp.voucherNo || exp.id,
        exp.date,
        sec?.name || 'Sector',
        exp.category,
        exp.description,
        exp.amount,
        exp.vendor,
        exp.paymentMethod,
        exp.status,
        exp.approvedByName || 'N/A',
      ];
    });

    exportCSV('Expense_Vouchers_Ledger', headers, rows);
  };

  const categories: ExpenseCategory[] = [
    'feed',
    'seeds',
    'fertilizer',
    'medicine',
    'vaccination',
    'labor',
    'electricity',
    'water_irrigation',
    'transportation',
    'equipment',
    'land_preparation',
    'shed_maintenance',
    'marketing',
    'administrative',
    'other',
  ];

  return (
    <div className="space-y-6">
      
      {/* Top Header Bar */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-2 border-b border-slate-200">
        <div>
          <h1 className="text-xl sm:text-2xl font-bold text-slate-900 tracking-tight">
            {t.expense}
          </h1>
          <p className="text-xs text-slate-500 mt-0.5">
            {language === 'bn' 
              ? 'খামারের সকল ব্যয় ভাউচার, খাদ্য, বীজ, ওষুধ, শ্রমিক মজুরি ও বিল অনুমোদন' 
              : 'Complete farm expense vouchers, feed, seeds, labor wages & verification workflows'}
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
            <span>{t.addNewExpense}</span>
          </button>
        </div>
      </div>

      {/* KPI strip */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <div className="p-4 bg-white rounded-xl border border-slate-200 shadow-xs">
          <span className="text-xs text-slate-500 block">Total Approved Expenses</span>
          <span className="text-xl font-bold text-slate-900 tabular-nums">
            {formatCurrency(totalApprovedExpenses, language)}
          </span>
          <span className="text-[11px] text-rose-700 block mt-0.5">
            {filteredExpenses.filter((e) => e.status === 'approved').length} Verified Vouchers
          </span>
        </div>

        <div className="p-4 bg-white rounded-xl border border-slate-200 shadow-xs">
          <span className="text-xs text-slate-500 block">Pending Review Vouchers</span>
          <span className={`text-xl font-bold tabular-nums ${pendingCount > 0 ? 'text-amber-600' : 'text-slate-900'}`}>
            {pendingCount}
          </span>
          <span className="text-[11px] text-slate-400 block mt-0.5">Requires Accountant / Admin Sign-off</span>
        </div>

        <div className="p-4 bg-white rounded-xl border border-slate-200 shadow-xs">
          <span className="text-xs text-slate-500 block">Primary Expense Category</span>
          <span className="text-xl font-bold text-slate-900 capitalize">Feed & Nutrition</span>
          <span className="text-[11px] text-slate-400 block mt-0.5">Largest cost center across sectors</span>
        </div>
      </div>

      {/* Filter and Search Bar */}
      <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-xs flex flex-col lg:flex-row gap-3 items-center justify-between">
        <div className="relative w-full lg:w-80">
          <Search className="w-4 h-4 text-slate-400 absolute left-3 top-2.5" />
          <input
            type="text"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            placeholder="Search description, vendor, voucher..."
            className="w-full pl-9 pr-3 py-1.5 text-xs border border-slate-300 rounded-lg focus:outline-none focus:border-emerald-600"
          />
        </div>

        <div className="flex flex-wrap items-center gap-2.5 w-full lg:w-auto">
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
              {categories.map((c) => (
                <option key={c} value={c}>
                  {c.replace('_', ' ').toUpperCase()}
                </option>
              ))}
            </select>
          </div>

          <div className="flex items-center gap-1.5">
            <span className="text-xs text-slate-500">Status:</span>
            <select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
              className="px-2.5 py-1.5 text-xs border border-slate-300 rounded-lg focus:outline-none focus:border-emerald-600 bg-white"
            >
              <option value="all">All Status</option>
              <option value="approved">Approved</option>
              <option value="pending_approval">Pending Approval</option>
              <option value="rejected">Rejected</option>
            </select>
          </div>
        </div>
      </div>

      {/* Expenses Table */}
      <div className="bg-white rounded-xl border border-slate-200 shadow-xs overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-xs text-left">
            <thead className="bg-slate-50 text-slate-600 font-semibold border-b border-slate-200">
              <tr>
                <th className="py-3 px-4">{t.date}</th>
                <th className="py-3 px-4">Voucher #</th>
                <th className="py-3 px-4">{t.sector}</th>
                <th className="py-3 px-4">{t.category}</th>
                <th className="py-3 px-4">{t.description}</th>
                <th className="py-3 px-4">Vendor / Supplier</th>
                <th className="py-3 px-4 text-right">{t.amount}</th>
                <th className="py-3 px-4 text-center">{t.status}</th>
                <th className="py-3 px-4 text-right">Approval Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {filteredExpenses.map((exp) => {
                const sector = db.sectors.find((s) => s.id === exp.sectorId);

                return (
                  <tr key={exp.id} className="hover:bg-slate-50/70 transition-colors">
                    <td className="py-3 px-4 text-slate-500 whitespace-nowrap tabular-nums">
                      {formatDate(exp.date, language)}
                    </td>

                    <td className="py-3 px-4 whitespace-nowrap font-mono text-slate-700 font-semibold">
                      {exp.voucherNo || exp.id}
                    </td>

                    <td className="py-3 px-4 whitespace-nowrap font-medium text-slate-800">
                      {language === 'bn' ? sector?.nameBn || sector?.name : sector?.name}
                    </td>

                    <td className="py-3 px-4 whitespace-nowrap">
                      <span className="text-[11px] font-medium bg-slate-100 text-slate-700 px-2 py-0.5 rounded capitalize">
                        {exp.category.replace('_', ' ')}
                      </span>
                    </td>

                    <td className="py-3 px-4 text-slate-900 max-w-xs truncate" title={exp.description}>
                      {exp.description}
                    </td>

                    <td className="py-3 px-4 text-slate-700 whitespace-nowrap">{exp.vendor}</td>

                    <td className="py-3 px-4 text-right font-bold text-rose-700 tabular-nums whitespace-nowrap">
                      {formatCurrency(exp.amount, language)}
                    </td>

                    <td className="py-3 px-4 text-center whitespace-nowrap">
                      <span
                        className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${
                          exp.status === 'approved'
                            ? 'bg-emerald-100 text-emerald-800'
                            : exp.status === 'pending_approval'
                            ? 'bg-amber-100 text-amber-800'
                            : 'bg-rose-100 text-rose-800'
                        }`}
                      >
                        {exp.status.replace('_', ' ').toUpperCase()}
                      </span>
                    </td>

                    <td className="py-3 px-4 text-right whitespace-nowrap">
                      {exp.status === 'pending_approval' && isFinanceAuthority ? (
                        <div className="flex items-center justify-end gap-1.5">
                          <button
                            onClick={() => handleApprove(exp)}
                            className="px-2 py-1 text-xs font-semibold text-emerald-800 bg-emerald-50 hover:bg-emerald-100 rounded transition-colors flex items-center gap-1"
                            title="Approve Voucher"
                          >
                            <Check className="w-3.5 h-3.5" />
                            <span>Approve</span>
                          </button>
                          <button
                            onClick={() => handleReject(exp)}
                            className="px-2 py-1 text-xs font-semibold text-rose-800 bg-rose-50 hover:bg-rose-100 rounded transition-colors flex items-center gap-1"
                            title="Reject Voucher"
                          >
                            <X className="w-3.5 h-3.5" />
                            <span>Reject</span>
                          </button>
                        </div>
                      ) : (
                        <span className="text-[11px] text-slate-400">
                          {exp.approvedByName ? `By ${exp.approvedByName.split(' ')[0]}` : '—'}
                        </span>
                      )}
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>

      {/* Add Expense Modal */}
      {isAddModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4 backdrop-blur-xs">
          <div className="bg-white rounded-xl shadow-2xl max-w-lg w-full p-6 border border-slate-200 max-h-[85vh] overflow-y-auto">
            <div className="flex justify-between items-center pb-3 border-b border-slate-200 mb-4">
              <h3 className="text-base font-bold text-slate-900">{t.addNewExpense}</h3>
              <button onClick={() => setIsAddModalOpen(false)} className="text-slate-400 hover:text-slate-600">✕</button>
            </div>

            <form onSubmit={handleCreateExpense} className="space-y-4">
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
                  <label className="block text-xs font-medium text-slate-700 mb-1">Expense Category *</label>
                  <select
                    value={category}
                    onChange={(e) => setCategory(e.target.value as any)}
                    className="w-full px-3 py-2 text-xs border border-slate-300 rounded-lg focus:outline-none focus:border-emerald-600 bg-white capitalize"
                  >
                    {categories.map((c) => (
                      <option key={c} value={c}>
                        {c.replace('_', ' ')}
                      </option>
                    ))}
                  </select>
                </div>
              </div>

              <div>
                <label className="block text-xs font-medium text-slate-700 mb-1">Description / Purpose *</label>
                <input
                  type="text"
                  required
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  placeholder="e.g. 20 Bags Balanced Layer Duck Mash Feed"
                  className="w-full px-3 py-2 text-xs border border-slate-300 rounded-lg focus:outline-none focus:border-emerald-600"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-medium text-slate-700 mb-1">Amount (৳ BDT) *</label>
                  <input
                    type="number"
                    step="any"
                    required
                    value={amount}
                    onChange={(e) => setAmount(e.target.value)}
                    placeholder="e.g. 35000"
                    className="w-full px-3 py-2 text-xs border border-slate-300 rounded-lg focus:outline-none focus:border-emerald-600 tabular-nums"
                  />
                </div>

                <div>
                  <label className="block text-xs font-medium text-slate-700 mb-1">Vendor / Supplier Name</label>
                  <input
                    type="text"
                    value={vendor}
                    onChange={(e) => setVendor(e.target.value)}
                    placeholder="e.g. Aftab Feed Mills Dealer"
                    className="w-full px-3 py-2 text-xs border border-slate-300 rounded-lg focus:outline-none focus:border-emerald-600"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
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

                <div>
                  <label className="block text-xs font-medium text-slate-700 mb-1">Voucher / Bill Number</label>
                  <input
                    type="text"
                    value={voucherNo}
                    onChange={(e) => setVoucherNo(e.target.value)}
                    placeholder="Auto-generated if left blank"
                    className="w-full px-3 py-2 text-xs border border-slate-300 rounded-lg focus:outline-none focus:border-emerald-600 font-mono"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-medium text-slate-700 mb-1">Additional Notes</label>
                <textarea
                  rows={2}
                  value={notes}
                  onChange={(e) => setNotes(e.target.value)}
                  placeholder="Payment receipt details or delivery terms..."
                  className="w-full px-3 py-2 text-xs border border-slate-300 rounded-lg focus:outline-none focus:border-emerald-600"
                />
              </div>

              <div className="p-3 bg-amber-50 rounded-lg border border-amber-200 text-xs text-amber-800">
                {isFinanceAuthority ? (
                  <span>You are authorized as Accountant/Super Admin. This expense will be <strong>Approved Immediately</strong>.</span>
                ) : (
                  <span>As Sector Manager, your voucher will be set to <strong>Pending Approval</strong> until verified by Accountant.</span>
                )}
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
                  Submit Expense Voucher
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

    </div>
  );
};
