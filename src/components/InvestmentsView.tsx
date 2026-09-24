import React, { useState } from 'react';
import { useApp } from '../context/AppContext';
import { Investment, InvestmentStatus, ProfitCalculationType, PaymentMethod } from '../types';
import { formatCurrency, formatDate } from '../utils/translations';
import { 
  BadgeDollarSign, 
  Plus, 
  Search, 
  Filter, 
  FileSpreadsheet, 
  CheckCircle2, 
  Clock, 
  XCircle, 
  ExternalLink,
  ShieldCheck
} from 'lucide-react';

export const InvestmentsView: React.FC = () => {
  const { db, language, t, updateDb, logAudit, showToast, exportCSV } = useApp();

  const [searchTerm, setSearchTerm] = useState('');
  const [sectorFilter, setSectorFilter] = useState('all');
  const [statusFilter, setStatusFilter] = useState('all');
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);

  // Form states
  const [selectedInvestorId, setSelectedInvestorId] = useState(db.investors[0]?.id || '');
  const [selectedSectorId, setSelectedSectorId] = useState(db.sectors[0]?.id || '');
  const [amount, setAmount] = useState('');
  const [ownershipPercent, setOwnershipPercent] = useState('5.0');
  const [calcType, setCalcType] = useState<ProfitCalculationType>('net_profit_percentage');
  const [paymentMethod, setPaymentMethod] = useState<PaymentMethod>('bank_transfer');
  const [txRef, setTxRef] = useState('');
  const [agreementRef, setAgreementRef] = useState('');
  const [notes, setNotes] = useState('');

  const filteredInvestments = db.investments.filter((inv) => {
    const investor = db.investors.find((i) => i.id === inv.investorId);
    const sector = db.sectors.find((s) => s.id === inv.sectorId);

    const matchesSearch =
      inv.id.toLowerCase().includes(searchTerm.toLowerCase()) ||
      investor?.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      sector?.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      inv.transactionRef.toLowerCase().includes(searchTerm.toLowerCase());

    const matchesSector = sectorFilter === 'all' || inv.sectorId === sectorFilter;
    const matchesStatus = statusFilter === 'all' || inv.status === statusFilter;

    return matchesSearch && matchesSector && matchesStatus;
  });

  const handleCreateInvestment = (e: React.FormEvent) => {
    e.preventDefault();
    const numAmount = parseFloat(amount);
    if (isNaN(numAmount) || numAmount <= 0) {
      showToast('Please enter a valid investment amount');
      return;
    }

    const investor = db.investors.find((i) => i.id === selectedInvestorId);
    const sector = db.sectors.find((s) => s.id === selectedSectorId);

    const newId = `inv-cnt-${Date.now()}`;
    const newInvestment: Investment = {
      id: newId,
      investorId: selectedInvestorId,
      investorName: investor?.name || 'Investor',
      sectorId: selectedSectorId,
      sectorName: sector?.name || 'Sector',
      amount: numAmount,
      date: new Date().toISOString().slice(0, 10),
      paymentMethod,
      transactionRef: txRef || `TXN-IBBL-${Math.floor(100000 + Math.random() * 900000)}`,
      agreementRef: agreementRef || `AGR-SBA-${new Date().getFullYear()}-${Math.floor(100 + Math.random() * 900)}`,
      ownershipPercentage: parseFloat(ownershipPercent) || 5.0,
      calculationType: calcType,
      profitCalculationType: calcType,
      status: 'active',
      notes: notes || 'Official investment registered.',
    };

    updateDb((prev) => ({
      ...prev,
      investments: [newInvestment, ...prev.investments],
    }));

    logAudit(
      'CREATE_INVESTMENT',
      `Registered investment of ${formatCurrency(numAmount, 'en')} by ${investor?.name} in ${sector?.name}`,
      selectedSectorId
    );

    setIsAddModalOpen(false);
    setAmount('');
    setTxRef('');
    setAgreementRef('');
    setNotes('');
    showToast(`Investment contract registered for ${investor?.name}!`);
  };

  const handleExportCSV = () => {
    const headers = [
      'Investment ID',
      'Investor Name',
      'Sector',
      'Amount (BDT)',
      'Date',
      'Payment Method',
      'Transaction Ref',
      'Agreement Ref',
      'Ownership %',
      'Profit Type',
      'Status',
    ];

    const rows = filteredInvestments.map((inv) => {
      const investor = db.investors.find((i) => i.id === inv.investorId);
      const sector = db.sectors.find((s) => s.id === inv.sectorId);
      return [
        inv.id,
        inv.investorName || investor?.name || 'Investor',
        inv.sectorName || sector?.name || 'Sector',
        inv.amount,
        inv.date,
        inv.paymentMethod,
        inv.transactionRef,
        inv.agreementRef || inv.agreementDocUrl || 'AGR-DOC',
        inv.ownershipPercentage,
        inv.calculationType || inv.profitCalculationType || 'net_profit_percentage',
        inv.status,
      ];
    });

    exportCSV('Investments_Ledger', headers, rows);
  };

  const totalCapitalInView = filteredInvestments.reduce((sum, inv) => sum + inv.amount, 0);

  return (
    <div className="space-y-6">
      
      {/* Top Header Bar */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-2 border-b border-slate-200">
        <div>
          <h1 className="text-xl sm:text-2xl font-bold text-slate-900 tracking-tight">
            {t.investments}
          </h1>
          <p className="text-xs text-slate-500 mt-0.5">
            {language === 'bn' 
              ? 'সেক্টরভিত্তিক বিনিয়োগ চুক্তি, মূলধন খতিয়ান ও মালিকানা শতকরা হার' 
              : 'Sector-wise capital contracts, legal deeds & equity share distributions'}
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
            <span>{t.addNewInvestment}</span>
          </button>
        </div>
      </div>

      {/* Summary KPI Strip */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <div className="p-4 bg-white rounded-xl border border-slate-200 shadow-xs">
          <span className="text-xs text-slate-500 block">Total Filtered Capital</span>
          <span className="text-xl font-bold text-slate-900 tabular-nums">
            {formatCurrency(totalCapitalInView, language)}
          </span>
          <span className="text-[11px] text-emerald-700 block mt-0.5">{filteredInvestments.length} Active Contracts</span>
        </div>

        <div className="p-4 bg-white rounded-xl border border-slate-200 shadow-xs">
          <span className="text-xs text-slate-500 block">Average Capital per Contract</span>
          <span className="text-xl font-bold text-blue-700 tabular-nums">
            {formatCurrency(filteredInvestments.length ? totalCapitalInView / filteredInvestments.length : 0, language)}
          </span>
          <span className="text-[11px] text-slate-400 block mt-0.5">Verified Bank / MFS Inflows</span>
        </div>

        <div className="p-4 bg-white rounded-xl border border-slate-200 shadow-xs">
          <span className="text-xs text-slate-500 block">Partner Investors</span>
          <span className="text-xl font-bold text-slate-900 tabular-nums">
            {new Set(filteredInvestments.map((i) => i.investorId)).size}
          </span>
          <span className="text-[11px] text-slate-400 block mt-0.5">Across {db.sectors.length} Farm Sectors</span>
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
            placeholder="Search by investor, sector, txn ref..."
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
            <span className="text-xs text-slate-500">Status:</span>
            <select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
              className="px-2.5 py-1.5 text-xs border border-slate-300 rounded-lg focus:outline-none focus:border-emerald-600 bg-white"
            >
              <option value="all">All Status</option>
              <option value="active">Active</option>
              <option value="completed">Completed</option>
              <option value="withdrawn">Withdrawn</option>
            </select>
          </div>
        </div>
      </div>

      {/* Investments Table */}
      <div className="bg-white rounded-xl border border-slate-200 shadow-xs overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-xs text-left">
            <thead className="bg-slate-50 text-slate-600 font-semibold border-b border-slate-200">
              <tr>
                <th className="py-3 px-4">{t.date}</th>
                <th className="py-3 px-4">{t.investors}</th>
                <th className="py-3 px-4">{t.sector}</th>
                <th className="py-3 px-4 text-right">Investment Amount</th>
                <th className="py-3 px-4 text-center">Equity / Share</th>
                <th className="py-3 px-4">Method & Ref</th>
                <th className="py-3 px-4">Agreement No</th>
                <th className="py-3 px-4 text-center">{t.status}</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {filteredInvestments.map((inv) => {
                const investor = db.investors.find((i) => i.id === inv.investorId);
                const sector = db.sectors.find((s) => s.id === inv.sectorId);

                return (
                  <tr key={inv.id} className="hover:bg-slate-50/70 transition-colors">
                    <td className="py-3 px-4 text-slate-500 whitespace-nowrap tabular-nums">
                      {formatDate(inv.date, language)}
                    </td>

                    <td className="py-3 px-4 whitespace-nowrap font-bold text-slate-900">
                      {language === 'bn' ? (investor?.nameBn || inv.investorName || investor?.name) : (inv.investorName || investor?.name)}
                    </td>

                    <td className="py-3 px-4 whitespace-nowrap">
                      <span className="font-semibold text-emerald-800 bg-emerald-50 px-2 py-0.5 rounded">
                        {language === 'bn' ? (sector?.nameBn || inv.sectorName || sector?.name) : (inv.sectorName || sector?.name)}
                      </span>
                    </td>

                    <td className="py-3 px-4 text-right font-bold text-slate-900 tabular-nums whitespace-nowrap">
                      {formatCurrency(inv.amount, language)}
                    </td>

                    <td className="py-3 px-4 text-center font-bold text-emerald-700 whitespace-nowrap">
                      {inv.ownershipPercentage}%
                    </td>

                    <td className="py-3 px-4 whitespace-nowrap">
                      <span className="text-slate-700 font-medium uppercase text-[11px] block">{inv.paymentMethod}</span>
                      <span className="text-[10px] text-slate-400 font-mono">{inv.transactionRef}</span>
                    </td>

                    <td className="py-3 px-4 whitespace-nowrap font-mono text-slate-600">
                      {inv.agreementRef || inv.agreementDocUrl || 'AGR-DOC'}
                    </td>

                    <td className="py-3 px-4 text-center whitespace-nowrap">
                      <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-emerald-100 text-emerald-800">
                        {inv.status.toUpperCase()}
                      </span>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>

      {/* Add Investment Modal */}
      {isAddModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4 backdrop-blur-xs">
          <div className="bg-white rounded-xl shadow-2xl max-w-lg w-full p-6 border border-slate-200 max-h-[85vh] overflow-y-auto">
            <div className="flex justify-between items-center pb-3 border-b border-slate-200 mb-4">
              <h3 className="text-base font-bold text-slate-900">{t.addNewInvestment}</h3>
              <button onClick={() => setIsAddModalOpen(false)} className="text-slate-400 hover:text-slate-600">✕</button>
            </div>

            <form onSubmit={handleCreateInvestment} className="space-y-4">
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-medium text-slate-700 mb-1">Select Investor *</label>
                  <select
                    value={selectedInvestorId}
                    onChange={(e) => setSelectedInvestorId(e.target.value)}
                    className="w-full px-3 py-2 text-xs border border-slate-300 rounded-lg focus:outline-none focus:border-emerald-600 bg-white"
                  >
                    {db.investors.map((inv) => (
                      <option key={inv.id} value={inv.id}>
                        {inv.name} ({inv.phone})
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-medium text-slate-700 mb-1">Target Sector *</label>
                  <select
                    value={selectedSectorId}
                    onChange={(e) => setSelectedSectorId(e.target.value)}
                    className="w-full px-3 py-2 text-xs border border-slate-300 rounded-lg focus:outline-none focus:border-emerald-600 bg-white"
                  >
                    {db.sectors.map((s) => (
                      <option key={s.id} value={s.id}>
                        {s.name} ({s.code})
                      </option>
                    ))}
                  </select>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-medium text-slate-700 mb-1">Investment Amount (৳ BDT) *</label>
                  <input
                    type="number"
                    required
                    value={amount}
                    onChange={(e) => setAmount(e.target.value)}
                    placeholder="e.g. 500000"
                    className="w-full px-3 py-2 text-xs border border-slate-300 rounded-lg focus:outline-none focus:border-emerald-600 tabular-nums"
                  />
                </div>

                <div>
                  <label className="block text-xs font-medium text-slate-700 mb-1">Allocated Equity Share (%) *</label>
                  <input
                    type="number"
                    step="0.1"
                    required
                    value={ownershipPercent}
                    onChange={(e) => setOwnershipPercent(e.target.value)}
                    placeholder="e.g. 5.0"
                    className="w-full px-3 py-2 text-xs border border-slate-300 rounded-lg focus:outline-none focus:border-emerald-600 tabular-nums"
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
                    <option value="bank_transfer">Bank Wire / Transfer</option>
                    <option value="cheque">Bank Cheque</option>
                    <option value="bkash">bKash (MFS)</option>
                    <option value="nagad">Nagad (MFS)</option>
                    <option value="cash">Cash In Office</option>
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-medium text-slate-700 mb-1">Profit Distribution Formula</label>
                  <select
                    value={calcType}
                    onChange={(e) => setCalcType(e.target.value as any)}
                    className="w-full px-3 py-2 text-xs border border-slate-300 rounded-lg focus:outline-none focus:border-emerald-600 bg-white"
                  >
                    <option value="net_profit_percentage">Share of Net Sector Profit (%)</option>
                    <option value="fixed_roi">Fixed Annual ROI (Sharia/Contract)</option>
                    <option value="custom">Custom Milestone Equity</option>
                  </select>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-medium text-slate-700 mb-1">Bank Slip / Txn Reference</label>
                  <input
                    type="text"
                    value={txRef}
                    onChange={(e) => setTxRef(e.target.value)}
                    placeholder="e.g. TXN-IBBL-49102"
                    className="w-full px-3 py-2 text-xs border border-slate-300 rounded-lg focus:outline-none focus:border-emerald-600 font-mono"
                  />
                </div>

                <div>
                  <label className="block text-xs font-medium text-slate-700 mb-1">Deed / Agreement Reference</label>
                  <input
                    type="text"
                    value={agreementRef}
                    onChange={(e) => setAgreementRef(e.target.value)}
                    placeholder="e.g. AGR-SBA-2026-08"
                    className="w-full px-3 py-2 text-xs border border-slate-300 rounded-lg focus:outline-none focus:border-emerald-600 font-mono"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-medium text-slate-700 mb-1">Contract Remarks & Terms</label>
                <textarea
                  rows={2}
                  value={notes}
                  onChange={(e) => setNotes(e.target.value)}
                  placeholder="Lock-in duration, profit disbursement frequency..."
                  className="w-full px-3 py-2 text-xs border border-slate-300 rounded-lg focus:outline-none focus:border-emerald-600"
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
                  Create Contract
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

    </div>
  );
};
