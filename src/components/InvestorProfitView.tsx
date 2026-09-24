import React, { useState } from 'react';
import { useApp } from '../context/AppContext';
import { ProfitDistribution, PaymentMethod } from '../types';
import { formatCurrency, formatDate, formatNumber } from '../utils/translations';
import { 
  Percent, 
  Plus, 
  Search, 
  FileSpreadsheet, 
  CheckCircle2, 
  Clock, 
  CreditCard, 
  Wallet, 
  Building,
  ArrowUpRight
} from 'lucide-react';

export const InvestorProfitView: React.FC = () => {
  const { db, language, t, updateDb, logAudit, showToast, exportCSV, getInvestorFinancials } = useApp();

  const [searchTerm, setSearchTerm] = useState('');
  const [sectorFilter, setSectorFilter] = useState('all');
  const [isPayoutModalOpen, setIsPayoutModalOpen] = useState(false);

  // Form states for Payout
  const [selectedInvestorId, setSelectedInvestorId] = useState(db.investors[0]?.id || '');
  const [selectedSectorId, setSelectedSectorId] = useState(db.sectors[0]?.id || '');
  const [payoutAmount, setPayoutAmount] = useState('35000');
  const [period, setPeriod] = useState('Q1 2026 (Jan - Mar)');
  const [paymentMethod, setPaymentMethod] = useState<PaymentMethod>('bank_transfer');
  const [txnRef, setTxnRef] = useState('');
  const [notes, setNotes] = useState('');

  const filteredDistributions = db.profitDistributions.filter((dist) => {
    const investor = db.investors.find((i) => i.id === dist.investorId);
    const sector = db.sectors.find((s) => s.id === dist.sectorId);
    const ref = dist.transactionRef || dist.paymentRef || '';

    const matchesSearch =
      dist.id.toLowerCase().includes(searchTerm.toLowerCase()) ||
      (investor?.name || '').toLowerCase().includes(searchTerm.toLowerCase()) ||
      (sector?.name || '').toLowerCase().includes(searchTerm.toLowerCase()) ||
      ref.toLowerCase().includes(searchTerm.toLowerCase());

    const matchesSector = sectorFilter === 'all' || dist.sectorId === sectorFilter;

    return matchesSearch && matchesSector;
  });

  const totalPaidOut = db.profitDistributions
    .filter((d) => d.status === 'paid')
    .reduce((sum, d) => sum + d.paidAmount, 0);

  const totalPendingProfit = db.profitDistributions
    .reduce((sum, d) => sum + d.pendingAmount, 0);

  const handleDisburseProfit = (e: React.FormEvent) => {
    e.preventDefault();
    const numAmount = parseFloat(payoutAmount);
    if (isNaN(numAmount) || numAmount <= 0) {
      showToast('Please enter a valid payout amount');
      return;
    }

    const investor = db.investors.find((i) => i.id === selectedInvestorId);
    const sector = db.sectors.find((s) => s.id === selectedSectorId);

    const newId = `payout-${Date.now()}`;
    const newRecord: ProfitDistribution = {
      id: newId,
      investorId: selectedInvestorId,
      investorName: investor?.name || 'Investor',
      sectorId: selectedSectorId,
      sectorName: sector?.name || 'Sector',
      period,
      calculatedProfit: numAmount,
      paidAmount: numAmount,
      pendingAmount: 0,
      paymentDate: new Date().toISOString().slice(0, 10),
      paymentMethod,
      transactionRef: txnRef || `TXN-IBBL-PAY-${Math.floor(100000 + Math.random() * 900000)}`,
      status: 'paid',
      notes: notes || 'Quarterly profit share disbursement.',
    };

    updateDb((prev) => ({
      ...prev,
      profitDistributions: [newRecord, ...prev.profitDistributions],
    }));

    logAudit(
      'DISBURSE_PROFIT',
      `Disbursed profit payout of ${formatCurrency(numAmount, 'en')} to ${investor?.name} for sector ${sector?.name}`,
      selectedSectorId
    );

    setIsPayoutModalOpen(false);
    setPayoutAmount('');
    setTxnRef('');
    setNotes('');
    showToast(`Profit disbursement of ৳${numAmount} recorded for ${investor?.name}!`);
  };

  const handleExportCSV = () => {
    const headers = [
      'Payout ID',
      'Investor',
      'Sector',
      'Period',
      'Calculated Profit (BDT)',
      'Paid Amount (BDT)',
      'Pending Amount (BDT)',
      'Payment Date',
      'Payment Method',
      'Transaction Ref',
      'Status',
    ];

    const rows = filteredDistributions.map((d) => {
      const inv = db.investors.find((i) => i.id === d.investorId);
      const sec = db.sectors.find((s) => s.id === d.sectorId);
      return [
        d.id,
        d.investorName || inv?.name || 'Investor',
        d.sectorName || sec?.name || 'Sector',
        d.period,
        d.calculatedProfit || d.paidAmount,
        d.paidAmount,
        d.pendingAmount,
        d.paymentDate || '',
        d.paymentMethod || 'Bank Transfer',
        d.transactionRef || d.paymentRef || '—',
        d.status,
      ];
    });

    exportCSV('Profit_Distributions_Ledger', headers, rows);
  };

  return (
    <div className="space-y-6">
      
      {/* Top Header Bar */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-2 border-b border-slate-200">
        <div>
          <h1 className="text-xl sm:text-2xl font-bold text-slate-900 tracking-tight">
            {t.profitSharing}
          </h1>
          <p className="text-xs text-slate-500 mt-0.5">
            {language === 'bn' 
              ? 'সেক্টরভিত্তিক বিনিয়োগকারী মুনাফা বণ্টন, ত্রৈমাসিক রিটার্ন ও ব্যাংক পে-আউট খতিয়ান' 
              : 'Transparent sector-wise profit distribution ledger, quarterly ROI & disbursements'}
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
            onClick={() => setIsPayoutModalOpen(true)}
            className="px-3.5 py-2 text-xs font-semibold text-white bg-emerald-700 hover:bg-emerald-800 rounded-lg shadow-xs transition-colors flex items-center gap-1.5"
          >
            <Plus className="w-4 h-4" />
            <span>Record Profit Disbursement</span>
          </button>
        </div>
      </div>

      {/* KPI strip */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <div className="p-4 bg-white rounded-xl border border-slate-200 shadow-xs">
          <span className="text-xs text-slate-500 block">Total Profit Disbursed to Investors</span>
          <span className="text-xl font-bold text-emerald-700 tabular-nums">
            {formatCurrency(totalPaidOut, language)}
          </span>
          <span className="text-[11px] text-slate-400 block mt-0.5">
            Via Bank Wire, bKash & Nagad
          </span>
        </div>

        <div className="p-4 bg-white rounded-xl border border-slate-200 shadow-xs">
          <span className="text-xs text-slate-500 block">Pending Scheduled Return</span>
          <span className="text-xl font-bold text-amber-600 tabular-nums">
            {formatCurrency(totalPendingProfit, language)}
          </span>
          <span className="text-[11px] text-slate-400 block mt-0.5">Accrued from Current Cycle</span>
        </div>

        <div className="p-4 bg-white rounded-xl border border-slate-200 shadow-xs">
          <span className="text-xs text-slate-500 block">Profit Distribution Model</span>
          <span className="text-xl font-bold text-slate-900">Mudaraba & Equity</span>
          <span className="text-[11px] text-slate-400 block mt-0.5">Direct Net P&L Share</span>
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
            placeholder="Search investor, sector, txn ref..."
            className="w-full pl-9 pr-3 py-1.5 text-xs border border-slate-300 rounded-lg focus:outline-none focus:border-emerald-600"
          />
        </div>

        <div className="flex items-center gap-2 w-full md:w-auto">
          <span className="text-xs text-slate-500">Filter Sector:</span>
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
      </div>

      {/* Profit Distributions Table */}
      <div className="bg-white rounded-xl border border-slate-200 shadow-xs overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-xs text-left">
            <thead className="bg-slate-50 text-slate-600 font-semibold border-b border-slate-200">
              <tr>
                <th className="py-3 px-4">{t.date}</th>
                <th className="py-3 px-4">{t.investors}</th>
                <th className="py-3 px-4">{t.sector}</th>
                <th className="py-3 px-4">Accounting Cycle</th>
                <th className="py-3 px-4 text-right">Calculated Profit</th>
                <th className="py-3 px-4 text-right">Disbursed (Paid)</th>
                <th className="py-3 px-4">Payment Method & Ref</th>
                <th className="py-3 px-4 text-center">{t.status}</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {filteredDistributions.map((dist) => {
                const investor = db.investors.find((i) => i.id === dist.investorId);
                const sector = db.sectors.find((s) => s.id === dist.sectorId);

                return (
                  <tr key={dist.id} className="hover:bg-slate-50/70 transition-colors">
                    <td className="py-3 px-4 text-slate-500 whitespace-nowrap tabular-nums">
                      {dist.paymentDate ? formatDate(dist.paymentDate, language) : '—'}
                    </td>

                    <td className="py-3 px-4 whitespace-nowrap font-bold text-slate-900">
                      {language === 'bn' ? (investor?.nameBn || dist.investorName || investor?.name) : (dist.investorName || investor?.name)}
                    </td>

                    <td className="py-3 px-4 whitespace-nowrap font-medium text-slate-800">
                      {language === 'bn' ? (sector?.nameBn || dist.sectorName || sector?.name) : (dist.sectorName || sector?.name)}
                    </td>

                    <td className="py-3 px-4 whitespace-nowrap text-slate-600">
                      {dist.period}
                    </td>

                    <td className="py-3 px-4 text-right font-medium text-slate-700 tabular-nums whitespace-nowrap">
                      {formatCurrency(dist.calculatedProfit || dist.paidAmount, language)}
                    </td>

                    <td className="py-3 px-4 text-right font-bold text-emerald-700 tabular-nums whitespace-nowrap">
                      {formatCurrency(dist.paidAmount, language)}
                    </td>

                    <td className="py-3 px-4 whitespace-nowrap">
                      <span className="text-[11px] font-semibold text-slate-800 uppercase block">{dist.paymentMethod || 'Bank'}</span>
                      <span className="text-[10px] text-slate-400 font-mono">{dist.transactionRef || dist.paymentRef || '—'}</span>
                    </td>

                    <td className="py-3 px-4 text-center whitespace-nowrap">
                      <span
                        className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${
                          dist.status === 'paid'
                            ? 'bg-emerald-100 text-emerald-800'
                            : 'bg-amber-100 text-amber-800'
                        }`}
                      >
                        {dist.status.toUpperCase()}
                      </span>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>

      {/* Disburse Profit Modal */}
      {isPayoutModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4 backdrop-blur-xs">
          <div className="bg-white rounded-xl shadow-2xl max-w-lg w-full p-6 border border-slate-200 max-h-[85vh] overflow-y-auto">
            <div className="flex justify-between items-center pb-3 border-b border-slate-200 mb-4">
              <h3 className="text-base font-bold text-slate-900">Record Profit Disbursement</h3>
              <button onClick={() => setIsPayoutModalOpen(false)} className="text-slate-400 hover:text-slate-600">✕</button>
            </div>

            <form onSubmit={handleDisburseProfit} className="space-y-4">
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-medium text-slate-700 mb-1">Investor *</label>
                  <select
                    value={selectedInvestorId}
                    onChange={(e) => setSelectedInvestorId(e.target.value)}
                    className="w-full px-3 py-2 text-xs border border-slate-300 rounded-lg focus:outline-none focus:border-emerald-600 bg-white"
                  >
                    {db.investors.map((inv) => (
                      <option key={inv.id} value={inv.id}>
                        {inv.name}
                      </option>
                    ))}
                  </select>
                </div>

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
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-medium text-slate-700 mb-1">Disbursed Amount (৳ BDT) *</label>
                  <input
                    type="number"
                    required
                    value={payoutAmount}
                    onChange={(e) => setPayoutAmount(e.target.value)}
                    placeholder="e.g. 35000"
                    className="w-full px-3 py-2 text-xs border border-slate-300 rounded-lg focus:outline-none focus:border-emerald-600 tabular-nums"
                  />
                </div>

                <div>
                  <label className="block text-xs font-medium text-slate-700 mb-1">Accounting Cycle / Period</label>
                  <input
                    type="text"
                    required
                    value={period}
                    onChange={(e) => setPeriod(e.target.value)}
                    placeholder="e.g. Q1 2026 (Jan - Mar)"
                    className="w-full px-3 py-2 text-xs border border-slate-300 rounded-lg focus:outline-none focus:border-emerald-600"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-medium text-slate-700 mb-1">Disbursement Channel</label>
                  <select
                    value={paymentMethod}
                    onChange={(e) => setPaymentMethod(e.target.value as any)}
                    className="w-full px-3 py-2 text-xs border border-slate-300 rounded-lg focus:outline-none focus:border-emerald-600 bg-white"
                  >
                    <option value="bank_transfer">Direct Bank Transfer</option>
                    <option value="bkash">bKash Disburse</option>
                    <option value="nagad">Nagad Disburse</option>
                    <option value="cheque">Bank Cheque</option>
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-medium text-slate-700 mb-1">Bank / MFS Transaction ID</label>
                  <input
                    type="text"
                    value={txnRef}
                    onChange={(e) => setTxnRef(e.target.value)}
                    placeholder="e.g. TXN-IBBL-PAY-88219"
                    className="w-full px-3 py-2 text-xs border border-slate-300 rounded-lg focus:outline-none focus:border-emerald-600 font-mono"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-medium text-slate-700 mb-1">Notes / Disbursal Slip Reference</label>
                <textarea
                  rows={2}
                  value={notes}
                  onChange={(e) => setNotes(e.target.value)}
                  placeholder="Official receipt notes..."
                  className="w-full px-3 py-2 text-xs border border-slate-300 rounded-lg focus:outline-none focus:border-emerald-600"
                />
              </div>

              <div className="pt-3 border-t border-slate-200 flex justify-end gap-2">
                <button
                  type="button"
                  onClick={() => setIsPayoutModalOpen(false)}
                  className="px-4 py-2 text-xs text-slate-600 hover:bg-slate-100 rounded-lg"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 text-xs font-semibold text-white bg-emerald-700 hover:bg-emerald-800 rounded-lg shadow-xs"
                >
                  Disburse & Update Investor Ledger
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

    </div>
  );
};
