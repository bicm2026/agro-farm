import React, { useState } from 'react';
import { useApp } from '../context/AppContext';
import { Investor } from '../types';
import { formatCurrency, formatNumber, formatDate } from '../utils/translations';
import { InvestorSettlementModal } from './InvestorSettlementModal';
import { 
  Users, 
  Plus, 
  Search, 
  Eye, 
  Phone, 
  Mail, 
  CreditCard, 
  ShieldCheck, 
  FileText, 
  Building,
  Edit3,
  Calendar,
  Wallet,
  Receipt,
  CheckCircle2,
  Trash2,
  HelpCircle,
  AlertCircle
} from 'lucide-react';

export const InvestorsView: React.FC = () => {
  const { db, language, t, updateDb, logAudit, showToast, getInvestorFinancials, setSelectedInvestorId, setActiveTab } = useApp();

  const [searchTerm, setSearchTerm] = useState('');
  const [filterSector, setFilterSector] = useState('all');
  const [selectedInvestor, setSelectedInvestor] = useState<Investor | null>(null);
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  
  // Investor settlement & account closing state
  const [settlementInvestor, setSettlementInvestor] = useState<Investor | null>(null);
  const [isSettlementModalOpen, setIsSettlementModalOpen] = useState(false);
  const [showGuide, setShowGuide] = useState(true);

  // Form states
  const [name, setName] = useState('');
  const [nameBn, setNameBn] = useState('');
  const [phone, setPhone] = useState('');
  const [email, setEmail] = useState('');
  const [nid, setNid] = useState('');
  const [address, setAddress] = useState('');
  const [nominee, setNominee] = useState('');
  const [nomineeRelation, setNomineeRelation] = useState('');
  const [bankName, setBankName] = useState('Islami Bank Bangladesh PLC');
  const [bankAcc, setBankAcc] = useState('');
  const [branch, setBranch] = useState('');
  const [mobileBanking, setMobileBanking] = useState('bKash');
  const [mobileNumber, setMobileNumber] = useState('');

  const filteredInvestors = db.investors.filter((inv) => {
    const nidVal = inv.nidPassport || inv.nid || '';
    const matchesSearch =
      inv.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      inv.email.toLowerCase().includes(searchTerm.toLowerCase()) ||
      inv.phone.includes(searchTerm) ||
      nidVal.includes(searchTerm);

    if (filterSector === 'all') return matchesSearch;
    // Check if investor has investment in this sector
    const hasSector = db.investments.some((i) => i.investorId === inv.id && i.sectorId === filterSector);
    return matchesSearch && hasSector;
  });

  const handleCreateInvestor = (e: React.FormEvent) => {
    e.preventDefault();
    if (!name || !phone) return;

    const newId = `inv-usr-${Date.now()}`;
    const newInvestor: Investor = {
      id: newId,
      name,
      nameBn: nameBn || name,
      phone,
      email: email || `${name.toLowerCase().replace(/\s+/g, '')}@gmail.com`,
      nid: nid || '19900000000000000',
      nidPassport: nid || '19900000000000000',
      address: address || 'Dhaka, Bangladesh',
      nationality: 'Bangladeshi',
      nomineeName: nominee || 'Family Nominee',
      nomineeRelation: nomineeRelation || 'Spouse',
      bankDetails: {
        bankName,
        accountName: name,
        accountNumber: bankAcc || '205011000000',
        branchName: branch || 'Gulshan Branch',
        routingNumber: '125272641',
      },
      mobileBankingDetails: {
        provider: (mobileBanking as any) || 'bKash',
        walletNumber: mobileNumber || phone,
        accountType: 'personal',
      },
      status: 'active',
      joiningDate: new Date().toISOString().slice(0, 10),
      notes: 'Verified partner investor onboarded.',
    };

    updateDb((prev) => ({
      ...prev,
      investors: [newInvestor, ...prev.investors],
    }));

    logAudit('CREATE_INVESTOR', `Onboarded new investor: ${name} (${phone})`);
    setIsAddModalOpen(false);
    resetForm();
    showToast(`Investor "${name}" successfully registered!`);
  };

  const resetForm = () => {
    setName('');
    setNameBn('');
    setPhone('');
    setEmail('');
    setNid('');
    setAddress('');
    setNominee('');
    setNomineeRelation('');
    setBankAcc('');
    setBranch('');
    setMobileNumber('');
  };

  return (
    <div className="space-y-6">
      
      {/* Top Header Bar */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-2 border-b border-slate-200">
        <div>
          <h1 className="text-xl sm:text-2xl font-bold text-slate-900 tracking-tight">
            {t.investors}
          </h1>
          <p className="text-xs text-slate-500 mt-0.5">
            {language === 'bn' 
              ? 'নিবন্ধিত কৃষি অংশীদার, এনআইডি ও ব্যাংক তথ্য বিবরণী' 
              : 'Verified equity & ROI investor partners, NID profiles & banking records'}
          </p>
        </div>

        <button
          onClick={() => setIsAddModalOpen(true)}
          className="px-3.5 py-2 text-xs font-semibold text-white bg-emerald-700 hover:bg-emerald-800 rounded-lg shadow-xs transition-colors flex items-center gap-1.5 self-start sm:self-auto"
        >
          <Plus className="w-4 h-4" />
          <span>{language === 'bn' ? 'নতুন বিনিয়োগকারী যুক্ত করুন' : 'Add New Investor'}</span>
        </button>
      </div>

      {/* Investor Settlement & Exit Guide Banner */}
      <div className="bg-gradient-to-r from-emerald-50 via-teal-50 to-blue-50 border border-emerald-200/90 rounded-2xl p-4 sm:p-5 shadow-xs">
        <div className="flex items-start justify-between gap-3">
          <div className="flex items-start gap-3">
            <div className="w-9 h-9 rounded-xl bg-emerald-700 text-white flex items-center justify-center shrink-0 shadow-xs">
              <Receipt className="w-5 h-5" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h3 className="text-sm font-bold text-slate-900">
                  {language === 'bn' ? '💡 বিনিয়োগকারী প্রস্থান ও চূড়ান্ত হিসাব নিষ্পত্তির নির্দেশিকা' : '💡 Investor Exit & Final Settlement Guide'}
                </h3>
                <span className="text-[10px] font-bold bg-emerald-100 text-emerald-800 px-2 py-0.5 rounded-full">
                  {language === 'bn' ? 'অডিট ও আইনি সহায়ক' : 'Audit Compliant'}
                </span>
              </div>
              <p className="text-xs text-slate-600 mt-1 leading-relaxed">
                {language === 'bn' 
                  ? 'কোনো বিনিয়োগকারী ফার্ম থেকে চলে যেতে চাইলে তার সাথে হিসাব নিষ্পত্তি করে অ্যাকাউন্ট বন্ধ বা রিমুভ করার ৩টি সহজ ধাপ:'
                  : 'If an investor decides to leave the farm, settling their accounts and closing/removing their account follows a 3-step verified accounting standard:'}
              </p>
            </div>
          </div>
          <button
            type="button"
            onClick={() => setShowGuide(!showGuide)}
            className="text-xs text-slate-500 hover:text-slate-800 font-medium px-2 py-1 rounded-lg hover:bg-white/60 transition-colors shrink-0"
          >
            {showGuide ? (language === 'bn' ? 'লুকান ▲' : 'Hide ▲') : (language === 'bn' ? 'নির্দেশনা দেখুন ▼' : 'Show Guide ▼')}
          </button>
        </div>

        {showGuide && (
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 mt-4 pt-3 border-t border-emerald-200/60">
            <div className="p-3 bg-white/80 rounded-xl border border-emerald-100 text-xs">
              <div className="flex items-center gap-1.5 font-bold text-emerald-800 mb-1">
                <span className="w-5 h-5 rounded-full bg-emerald-100 text-emerald-800 flex items-center justify-center text-[11px]">১</span>
                <span>{language === 'bn' ? 'হিসাব ক্লোজ ক্লিক করুন' : '1. Click Settle & Exit'}</span>
              </div>
              <p className="text-slate-600 text-[11px] leading-relaxed">
                {language === 'bn'
                  ? 'তালিকায় বিনিয়োগকারীর নামের পাশে "হিসাব ক্লোজ" বাটনে চাপুন।'
                  : 'Click the "Settle & Exit" button beside the investor in the directory table.'}
              </p>
            </div>

            <div className="p-3 bg-white/80 rounded-xl border border-emerald-100 text-xs">
              <div className="flex items-center gap-1.5 font-bold text-emerald-800 mb-1">
                <span className="w-5 h-5 rounded-full bg-emerald-100 text-emerald-800 flex items-center justify-center text-[11px]">২</span>
                <span>{language === 'bn' ? 'মূলধন ও লভ্যাংশ নিশ্চিত করুন' : '2. Verify Capital & Returns'}</span>
              </div>
              <p className="text-slate-600 text-[11px] leading-relaxed">
                {language === 'bn'
                  ? 'সক্রিয় মূলধন ফেরত ও বকেয়া লভ্যাংশ স্বয়ংক্রিয়ভাবে ক্যালকুলেট হবে; ব্যাংক/বিকাশ পরিশোধের তথ্য দিন।'
                  : 'Principal capital refund and pending profit are calculated automatically. Input payment method and cheque/Txn ID.'}
              </p>
            </div>

            <div className="p-3 bg-white/80 rounded-xl border border-emerald-100 text-xs">
              <div className="flex items-center gap-1.5 font-bold text-emerald-800 mb-1">
                <span className="w-5 h-5 rounded-full bg-emerald-100 text-emerald-800 flex items-center justify-center text-[11px]">৩</span>
                <span>{language === 'bn' ? 'অটো ভাউচার ও ক্লোজিং' : '3. Auto Voucher & Ledger Close'}</span>
              </div>
              <p className="text-slate-600 text-[11px] leading-relaxed">
                {language === 'bn'
                  ? 'নিষ্পত্তি নিশ্চিত করলে ফার্মের হিসাব বহিতে স্বয়ংক্রিয় ব্যয় সমন্বয় ভাউচার যুক্ত হবে এবং শেয়ার মুক্ত হবে। আপনি চাইলে স্থায়ীভাবে অ্যাকাউন্ট মুছেও দিতে পারেন।'
                  : 'On confirmation, an approved accounting expense voucher is logged, and shares are released. You can also permanently delete if needed.'}
              </p>
            </div>
          </div>
        )}
      </div>

      {/* Filter and Search Bar */}
      <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-xs flex flex-col sm:flex-row gap-3 items-center justify-between">
        <div className="relative w-full sm:w-80">
          <Search className="w-4 h-4 text-slate-400 absolute left-3 top-2.5" />
          <input
            type="text"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            placeholder="Search by name, phone, email, NID..."
            className="w-full pl-9 pr-3 py-1.5 text-xs border border-slate-300 rounded-lg focus:outline-none focus:border-emerald-600"
          />
        </div>

        <div className="flex items-center gap-2 w-full sm:w-auto">
          <span className="text-xs text-slate-500 whitespace-nowrap">Filter Sector:</span>
          <select
            value={filterSector}
            onChange={(e) => setFilterSector(e.target.value)}
            className="w-full sm:w-auto px-2.5 py-1.5 text-xs border border-slate-300 rounded-lg focus:outline-none focus:border-emerald-600 bg-white"
          >
            <option value="all">All Sectors ({db.investors.length})</option>
            {db.sectors.map((s) => (
              <option key={s.id} value={s.id}>
                {language === 'bn' ? s.nameBn : s.name}
              </option>
            ))}
          </select>
        </div>
      </div>

      {/* Investors Directory Table */}
      <div className="bg-white rounded-xl border border-slate-200 shadow-xs overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-xs text-left">
            <thead className="bg-slate-50 text-slate-600 font-semibold border-b border-slate-200">
              <tr>
                <th className="py-3 px-4">{language === 'bn' ? 'নাম' : 'Investor Name'}</th>
                <th className="py-3 px-4">Contact Info</th>
                <th className="py-3 px-4">NID / Document</th>
                <th className="py-3 px-4">Invested Sectors</th>
                <th className="py-3 px-4 text-right">Total Invested</th>
                <th className="py-3 px-4 text-right">Paid Returns</th>
                <th className="py-3 px-4 text-center">{t.status}</th>
                <th className="py-3 px-4 text-right">{t.actions}</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {filteredInvestors.map((inv) => {
                const fin = getInvestorFinancials(inv.id);
                const invSectors = (fin.investments || []).map((i: any) => db.sectors.find((s) => s.id === i.sectorId));

                return (
                  <tr key={inv.id} className="hover:bg-slate-50/70 transition-colors">
                    <td className="py-3 px-4 whitespace-nowrap">
                      <div className="flex items-center gap-2.5">
                        <div className="w-8 h-8 rounded-full bg-emerald-800/10 text-emerald-800 font-bold flex items-center justify-center shrink-0 border border-emerald-200">
                          {inv.name.charAt(0)}
                        </div>
                        <div>
                          <p className="font-bold text-slate-900">
                            {language === 'bn' ? inv.nameBn : inv.name}
                          </p>
                          <p className="text-[11px] text-slate-400 font-mono">ID: {inv.id.substring(0, 10)}</p>
                        </div>
                      </div>
                    </td>

                    <td className="py-3 px-4 whitespace-nowrap">
                      <p className="text-slate-800 font-medium">{inv.phone}</p>
                      <p className="text-[11px] text-slate-400">{inv.email}</p>
                    </td>

                    <td className="py-3 px-4 whitespace-nowrap font-mono text-slate-600">
                      {inv.nidPassport || inv.nid || '—'}
                    </td>

                    <td className="py-3 px-4">
                      <div className="flex flex-wrap gap-1 max-w-xs">
                        {invSectors.map((s: any, idx: number) => (
                          <span
                            key={idx}
                            className="text-[10px] font-medium bg-emerald-50 text-emerald-800 border border-emerald-200/80 px-1.5 py-0.5 rounded whitespace-nowrap"
                          >
                            {language === 'bn' ? s?.nameBn.split(' ')[0] : s?.name.split(' ')[0]}
                          </span>
                        ))}
                      </div>
                    </td>

                    <td className="py-3 px-4 text-right font-bold text-slate-900 tabular-nums whitespace-nowrap">
                      {formatCurrency(fin.totalInvested, language)}
                    </td>

                    <td className="py-3 px-4 text-right font-bold text-emerald-700 tabular-nums whitespace-nowrap">
                      {formatCurrency(fin.totalProfitPaid, language)}
                    </td>

                    <td className="py-3 px-4 text-center whitespace-nowrap">
                      <span className={`text-[10px] font-bold px-2.5 py-0.5 rounded-full border ${
                        inv.status === 'closed'
                          ? 'bg-slate-100 text-slate-700 border-slate-300'
                          : inv.status === 'suspended'
                          ? 'bg-amber-100 text-amber-800 border-amber-300'
                          : 'bg-emerald-100 text-emerald-800 border-emerald-300'
                      }`}>
                        {inv.status === 'closed'
                          ? (language === 'bn' ? 'নিষ্পত্তিকৃত (CLOSED)' : 'CLOSED / SETTLED')
                          : inv.status === 'suspended'
                          ? (language === 'bn' ? 'স্থগিত' : 'SUSPENDED')
                          : (language === 'bn' ? 'সক্রিয়' : 'ACTIVE')}
                      </span>
                    </td>

                    <td className="py-3 px-4 text-right whitespace-nowrap">
                      <div className="flex items-center justify-end gap-1.5">
                        <button
                          onClick={() => setSelectedInvestor(inv)}
                          className="px-2.5 py-1 text-xs font-semibold text-emerald-800 bg-emerald-50 hover:bg-emerald-100 rounded-md transition-colors"
                          title={language === 'bn' ? 'প্রোফাইল ও বিস্তারিত খতিয়ান' : 'Profile & Ledger'}
                        >
                          {language === 'bn' ? 'প্রোফাইল' : 'Profile'}
                        </button>

                        <button
                          onClick={() => {
                            setSettlementInvestor(inv);
                            setIsSettlementModalOpen(true);
                          }}
                          className={`px-2.5 py-1 text-xs font-semibold rounded-md transition-colors flex items-center gap-1 border ${
                            inv.status === 'closed'
                              ? 'text-slate-700 bg-slate-100 hover:bg-slate-200 border-slate-300'
                              : 'text-blue-800 bg-blue-50 hover:bg-blue-100 border-blue-300 shadow-2xs'
                          }`}
                          title={inv.status === 'closed'
                            ? (language === 'bn' ? 'নিষ্পত্তির রশিদ ও রিমুভ অপশন' : 'Settlement Receipt & Removal')
                            : (language === 'bn' ? 'হিসাব ক্লোজ ও চূড়ান্ত নিষ্পত্তি' : 'Settle & Close Account')}
                        >
                          <Receipt className="w-3.5 h-3.5 text-blue-700" />
                          <span>
                            {inv.status === 'closed'
                              ? (language === 'bn' ? 'নিষ্পত্তি রশিদ' : 'Settled')
                              : (language === 'bn' ? 'হিসাব ক্লোজ' : 'Settle & Exit')}
                          </span>
                        </button>
                      </div>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>

      {/* Investor Profile Modal */}
      {selectedInvestor && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4 backdrop-blur-xs">
          <div className="bg-white rounded-xl shadow-2xl max-w-2xl w-full p-6 border border-slate-200 max-h-[85vh] overflow-y-auto">
            <div className="flex justify-between items-start pb-4 border-b border-slate-200 mb-6">
              <div>
                <div className="flex items-center gap-2">
                  <h3 className="text-lg font-bold text-slate-900">
                    {language === 'bn' ? selectedInvestor.nameBn : selectedInvestor.name}
                  </h3>
                  <span className="text-[10px] font-bold bg-emerald-100 text-emerald-800 px-2 py-0.5 rounded-full">
                    {selectedInvestor.status.toUpperCase()}
                  </span>
                </div>
                <p className="text-xs text-slate-500 mt-0.5">
                  Joined {selectedInvestor.joiningDate ? formatDate(selectedInvestor.joiningDate, language) : 'Recently'} · NID: {selectedInvestor.nidPassport || selectedInvestor.nid || '—'}
                </p>
              </div>

              <button
                onClick={() => setSelectedInvestor(null)}
                className="text-slate-400 hover:text-slate-600 p-1"
              >
                ✕
              </button>
            </div>

            {/* Financial Overview for this Investor */}
            {(() => {
              const fin = getInvestorFinancials(selectedInvestor.id);
              return (
                <div className="space-y-6">
                  <div className="grid grid-cols-3 gap-3 p-4 bg-slate-50 rounded-xl border border-slate-200">
                    <div>
                      <span className="text-[11px] text-slate-500 block">Total Invested Capital</span>
                      <span className="text-base sm:text-lg font-bold text-slate-900 tabular-nums">
                        {formatCurrency(fin.totalInvested, language)}
                      </span>
                    </div>
                    <div>
                      <span className="text-[11px] text-slate-500 block">Total Profit Earned</span>
                      <span className="text-base sm:text-lg font-bold text-blue-700 tabular-nums">
                        {formatCurrency(fin.totalProfitEarned || fin.totalProfitShare, language)}
                      </span>
                    </div>
                    <div>
                      <span className="text-[11px] text-slate-500 block">Disbursed Returns</span>
                      <span className="text-base sm:text-lg font-bold text-emerald-700 tabular-nums">
                        {formatCurrency(fin.totalProfitPaid, language)}
                      </span>
                    </div>
                  </div>

                  {/* Sectors Invested */}
                  <div>
                    <h4 className="text-xs font-bold text-slate-900 mb-3">Portfolio Contracts by Sector</h4>
                    <div className="space-y-2">
                      {(fin.investments || []).map((inv: any) => {
                        const sec = db.sectors.find((s) => s.id === inv.sectorId);
                        return (
                          <div
                            key={inv.id}
                            className="p-3 bg-white border border-slate-200 rounded-lg flex items-center justify-between text-xs"
                          >
                            <div>
                              <p className="font-bold text-slate-900">
                                {language === 'bn' ? sec?.nameBn : sec?.name} ({sec?.code})
                              </p>
                              <p className="text-[11px] text-slate-500">
                                Ref: <span className="font-mono">{inv.transactionRef || inv.id}</span> · Equity:{' '}
                                <strong className="text-emerald-700">{inv.ownershipPercentage}%</strong>
                              </p>
                            </div>
                            <div className="text-right">
                              <p className="font-bold text-slate-900 tabular-nums">
                                {formatCurrency(inv.amount, language)}
                              </p>
                              <p className="text-[10px] text-slate-400">{formatDate(inv.date, language)}</p>
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  </div>

                  {/* Banking & Mobile Banking Details */}
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-xs">
                    <div className="p-3 bg-slate-50 border border-slate-200 rounded-lg">
                      <div className="flex items-center gap-1.5 font-bold text-slate-900 mb-2">
                        <Building className="w-3.5 h-3.5 text-blue-600" />
                        <span>Bank Account</span>
                      </div>
                      <p className="text-slate-700">Bank: {selectedInvestor.bankDetails?.bankName || selectedInvestor.bankName || 'Islami Bank Bangladesh PLC'}</p>
                      <p className="text-slate-700">A/C: <span className="font-mono">{selectedInvestor.bankDetails?.accountNumber || selectedInvestor.bankAccount || '2050123456789'}</span></p>
                      <p className="text-slate-500 text-[11px]">Branch: {selectedInvestor.bankDetails?.branchName || 'Principal Branch'}</p>
                    </div>

                    <div className="p-3 bg-slate-50 border border-slate-200 rounded-lg">
                      <div className="flex items-center gap-1.5 font-bold text-slate-900 mb-2">
                        <CreditCard className="w-3.5 h-3.5 text-emerald-600" />
                        <span>Mobile Financial Service</span>
                      </div>
                      <p className="text-slate-700">Provider: <strong className="uppercase">{selectedInvestor.bankDetails?.bkashNumber ? 'bKash' : selectedInvestor.bankDetails?.nagadNumber ? 'Nagad' : 'bKash'}</strong></p>
                      <p className="text-slate-700">Number: <span className="font-mono">{selectedInvestor.bankDetails?.bkashNumber || selectedInvestor.bankDetails?.nagadNumber || selectedInvestor.phone}</span></p>
                      <p className="text-slate-500 text-[11px]">Type: Verified Personal</p>
                    </div>
                  </div>

                  {/* Settlement Record (if account is closed) */}
                  {selectedInvestor.status === 'closed' && selectedInvestor.settlement && (
                    <div className="p-4 bg-emerald-50/70 border border-emerald-300 rounded-xl space-y-2 text-xs">
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-1.5 font-bold text-emerald-900">
                          <CheckCircle2 className="w-4 h-4 text-emerald-700" />
                          <span>{language === 'bn' ? 'চূড়ান্ত হিসাব নিষ্পত্তি ও প্রস্থান সম্পন্ন' : 'Official Settlement & Exit Concluded'}</span>
                        </div>
                        <span className="font-mono text-[11px] text-emerald-800 bg-emerald-100 px-2 py-0.5 rounded font-bold">
                          Voucher: {selectedInvestor.settlement.voucherNo || 'SETTLE'}
                        </span>
                      </div>
                      <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 pt-1 text-[11px]">
                        <div>
                          <span className="text-slate-500 block">{language === 'bn' ? 'নিষ্পত্তির তারিখ:' : 'Settled Date:'}</span>
                          <strong className="text-slate-900">{formatDate(selectedInvestor.settlement.settledAt, language)}</strong>
                        </div>
                        <div>
                          <span className="text-slate-500 block">{language === 'bn' ? 'মোট প্রদেয় অর্থ:' : 'Net Settled:'}</span>
                          <strong className="text-emerald-800">{formatCurrency(selectedInvestor.settlement.netSettledAmount, language)}</strong>
                        </div>
                        <div>
                          <span className="text-slate-500 block">{language === 'bn' ? 'মূলধন ফেরত:' : 'Capital Refund:'}</span>
                          <strong className="text-slate-800">{formatCurrency(selectedInvestor.settlement.capitalRefunded, language)}</strong>
                        </div>
                        <div>
                          <span className="text-slate-500 block">{language === 'bn' ? 'পরিশোধ মাধ্যম:' : 'Payment Method:'}</span>
                          <strong className="text-slate-800">{selectedInvestor.settlement.paymentMethod}</strong>
                        </div>
                      </div>
                      {selectedInvestor.settlement.notes && (
                        <p className="text-[11px] text-slate-600 italic pt-1 border-t border-emerald-200">
                          "{selectedInvestor.settlement.notes}"
                        </p>
                      )}
                    </div>
                  )}

                  {/* Nominee details */}
                  <div className="p-3 bg-slate-50 border border-slate-200 rounded-lg text-xs">
                    <span className="font-bold text-slate-900">Legal Nominee: </span>
                    <span className="text-slate-700">{selectedInvestor.nomineeName || 'Nominee on file'} ({selectedInvestor.nomineeRelation || 'Beneficiary'})</span>
                    <span className="block text-slate-500 mt-1">Contact Address: {selectedInvestor.address}</span>
                  </div>

                  <div className="pt-4 border-t border-slate-200 flex flex-wrap justify-between items-center gap-2">
                    <div className="flex items-center gap-2">
                      <button
                        onClick={() => {
                          setSelectedInvestorId(selectedInvestor.id);
                          setActiveTab('investorPortal');
                        }}
                        className="px-3.5 py-1.5 text-xs font-semibold text-white bg-emerald-700 hover:bg-emerald-800 rounded-lg"
                      >
                        {language === 'bn' ? 'পোর্টাল ভিউ →' : 'View Live Investor Portal View →'}
                      </button>

                      <button
                        onClick={() => {
                          const target = selectedInvestor;
                          setSelectedInvestor(null);
                          setSettlementInvestor(target);
                          setIsSettlementModalOpen(true);
                        }}
                        className={`px-3 py-1.5 text-xs font-semibold rounded-lg border flex items-center gap-1.5 ${
                          selectedInvestor.status === 'closed'
                            ? 'text-slate-700 bg-slate-100 hover:bg-slate-200 border-slate-300'
                            : 'text-blue-800 bg-blue-50 hover:bg-blue-100 border-blue-300'
                        }`}
                      >
                        <Receipt className="w-3.5 h-3.5 text-blue-700" />
                        <span>
                          {selectedInvestor.status === 'closed'
                            ? (language === 'bn' ? 'নিষ্পত্তির রশিদ ও রিমুভ অপশন' : 'Settlement & Removal')
                            : (language === 'bn' ? 'হিসাব ক্লোজ ও নিষ্পত্তি' : 'Settle & Close Account')}
                        </span>
                      </button>
                    </div>

                    <button
                      onClick={() => setSelectedInvestor(null)}
                      className="px-3.5 py-1.5 text-xs text-slate-600 hover:bg-slate-100 rounded-lg border border-slate-200"
                    >
                      {language === 'bn' ? 'বন্ধ করুন' : 'Close'}
                    </button>
                  </div>
                </div>
              );
            })()}
          </div>
        </div>
      )}

      {/* Add Investor Modal */}
      {isAddModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4 backdrop-blur-xs">
          <div className="bg-white rounded-xl shadow-2xl max-w-xl w-full p-6 border border-slate-200 max-h-[85vh] overflow-y-auto">
            <div className="flex justify-between items-center pb-3 border-b border-slate-200 mb-4">
              <h3 className="text-base font-bold text-slate-900">{language === 'bn' ? 'নতুন বিনিয়োগকারী যুক্ত করুন' : 'Add New Investor'}</h3>
              <button onClick={() => setIsAddModalOpen(false)} className="text-slate-400 hover:text-slate-600">✕</button>
            </div>

            <form onSubmit={handleCreateInvestor} className="space-y-4">
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-medium text-slate-700 mb-1">Full Name (English) *</label>
                  <input
                    type="text"
                    required
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    placeholder="e.g. Kazi Tariqul Islam"
                    className="w-full px-3 py-2 text-xs border border-slate-300 rounded-lg focus:outline-none focus:border-emerald-600"
                  />
                </div>
                <div>
                  <label className="block text-xs font-medium text-slate-700 mb-1">পূর্ণ নাম (বাংলা)</label>
                  <input
                    type="text"
                    value={nameBn}
                    onChange={(e) => setNameBn(e.target.value)}
                    placeholder="যেমন: কাজী তারিকুল ইসলাম"
                    className="w-full px-3 py-2 text-xs border border-slate-300 rounded-lg focus:outline-none focus:border-emerald-600"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-medium text-slate-700 mb-1">Phone Number *</label>
                  <input
                    type="tel"
                    required
                    value={phone}
                    onChange={(e) => setPhone(e.target.value)}
                    placeholder="+880 17XXXXXXXX"
                    className="w-full px-3 py-2 text-xs border border-slate-300 rounded-lg focus:outline-none focus:border-emerald-600"
                  />
                </div>
                <div>
                  <label className="block text-xs font-medium text-slate-700 mb-1">Email Address</label>
                  <input
                    type="email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    placeholder="investor@example.com"
                    className="w-full px-3 py-2 text-xs border border-slate-300 rounded-lg focus:outline-none focus:border-emerald-600"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-medium text-slate-700 mb-1">National ID / Passport No *</label>
                  <input
                    type="text"
                    required
                    value={nid}
                    onChange={(e) => setNid(e.target.value)}
                    placeholder="e.g. 19852692510000045"
                    className="w-full px-3 py-2 text-xs border border-slate-300 rounded-lg focus:outline-none focus:border-emerald-600 font-mono"
                  />
                </div>
                <div>
                  <label className="block text-xs font-medium text-slate-700 mb-1">Present Address</label>
                  <input
                    type="text"
                    value={address}
                    onChange={(e) => setAddress(e.target.value)}
                    placeholder="House, Road, Dhaka"
                    className="w-full px-3 py-2 text-xs border border-slate-300 rounded-lg focus:outline-none focus:border-emerald-600"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-medium text-slate-700 mb-1">Nominee Name</label>
                  <input
                    type="text"
                    value={nominee}
                    onChange={(e) => setNominee(e.target.value)}
                    placeholder="Nominee Full Name"
                    className="w-full px-3 py-2 text-xs border border-slate-300 rounded-lg focus:outline-none focus:border-emerald-600"
                  />
                </div>
                <div>
                  <label className="block text-xs font-medium text-slate-700 mb-1">Nominee Relation</label>
                  <input
                    type="text"
                    value={nomineeRelation}
                    onChange={(e) => setNomineeRelation(e.target.value)}
                    placeholder="Spouse / Son / Mother"
                    className="w-full px-3 py-2 text-xs border border-slate-300 rounded-lg focus:outline-none focus:border-emerald-600"
                  />
                </div>
              </div>

              {/* Bank & MFS Info */}
              <div className="p-3 bg-slate-50 rounded-lg border border-slate-200 space-y-3">
                <span className="text-xs font-bold text-slate-900 block">Disbursement Accounts (Bank / bKash / Nagad)</span>
                <div className="grid grid-cols-3 gap-2">
                  <div>
                    <label className="block text-[11px] text-slate-600 mb-0.5">Bank Name</label>
                    <input
                      type="text"
                      value={bankName}
                      onChange={(e) => setBankName(e.target.value)}
                      className="w-full px-2 py-1 text-xs border rounded"
                    />
                  </div>
                  <div>
                    <label className="block text-[11px] text-slate-600 mb-0.5">Account Number</label>
                    <input
                      type="text"
                      value={bankAcc}
                      onChange={(e) => setBankAcc(e.target.value)}
                      placeholder="20501100..."
                      className="w-full px-2 py-1 text-xs border rounded font-mono"
                    />
                  </div>
                  <div>
                    <label className="block text-[11px] text-slate-600 mb-0.5">Branch</label>
                    <input
                      type="text"
                      value={branch}
                      onChange={(e) => setBranch(e.target.value)}
                      placeholder="Gulshan"
                      className="w-full px-2 py-1 text-xs border rounded"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-2">
                  <div>
                    <label className="block text-[11px] text-slate-600 mb-0.5">Mobile Banking Provider</label>
                    <select
                      value={mobileBanking}
                      onChange={(e) => setMobileBanking(e.target.value)}
                      className="w-full px-2 py-1 text-xs border rounded bg-white"
                    >
                      <option value="bKash">bKash</option>
                      <option value="Nagad">Nagad</option>
                      <option value="Rocket">Rocket</option>
                      <option value="Upay">Upay</option>
                    </select>
                  </div>
                  <div>
                    <label className="block text-[11px] text-slate-600 mb-0.5">Wallet Number</label>
                    <input
                      type="tel"
                      value={mobileNumber}
                      onChange={(e) => setMobileNumber(e.target.value)}
                      placeholder="017XXXXXXXX"
                      className="w-full px-2 py-1 text-xs border rounded font-mono"
                    />
                  </div>
                </div>
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
                  Register Investor
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Investor Exit & Settlement Modal */}
      <InvestorSettlementModal
        isOpen={isSettlementModalOpen}
        investor={settlementInvestor}
        onClose={() => {
          setIsSettlementModalOpen(false);
          setSettlementInvestor(null);
        }}
      />

    </div>
  );
};
