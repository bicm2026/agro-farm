import React, { useState, useEffect } from 'react';
import { useApp } from '../context/AppContext';
import { Investor, PaymentMethod, ExpenseRecord } from '../types';
import { formatCurrency, formatDate } from '../utils/translations';
import { 
  Building, 
  CreditCard, 
  CheckCircle2, 
  AlertTriangle, 
  Trash2, 
  DollarSign, 
  Receipt, 
  X, 
  FileCheck2,
  Calendar,
  Wallet,
  ShieldAlert
} from 'lucide-react';

interface Props {
  isOpen: boolean;
  investor: Investor | null;
  onClose: () => void;
  onSuccess?: () => void;
}

export const InvestorSettlementModal: React.FC<Props> = ({
  isOpen,
  investor,
  onClose,
  onSuccess
}) => {
  const { 
    db, 
    updateDb, 
    currentUser, 
    language, 
    getInvestorFinancials, 
    logAudit, 
    showToast 
  } = useApp();

  const [activeTab, setActiveTab] = useState<'settle' | 'delete'>('settle');
  
  // Financial calculation inputs
  const [capitalRefund, setCapitalRefund] = useState<number>(0);
  const [pendingProfitPayment, setPendingProfitPayment] = useState<number>(0);
  const [deductionAmount, setDeductionAmount] = useState<number>(0);
  
  // Payment execution fields
  const [paymentMethod, setPaymentMethod] = useState<PaymentMethod>('Bank Transfer');
  const [recipientAccount, setRecipientAccount] = useState('');
  const [transactionRef, setTransactionRef] = useState('');
  const [voucherNo, setVoucherNo] = useState('');
  const [settlementDate, setSettlementDate] = useState(new Date().toISOString().slice(0, 10));
  const [notes, setNotes] = useState('');

  // Delete confirmation
  const [deleteConfirmText, setDeleteConfirmText] = useState('');

  const fin = investor ? getInvestorFinancials(investor.id) : null;

  // Initialize form when modal opens or investor changes
  useEffect(() => {
    if (investor && fin) {
      setCapitalRefund(fin.totalInvested);
      setPendingProfitPayment(fin.totalProfitPending);
      setDeductionAmount(0);

      // Preferred recipient account
      const bankAcc = investor.bankDetails?.accountNumber || investor.bankAccount;
      const bkashAcc = investor.bankDetails?.bkashNumber || investor.phone;
      setRecipientAccount(bankAcc || bkashAcc || '');

      setVoucherNo(`SETTLE-${Date.now().toString().slice(-6)}`);
      setTransactionRef(`TXN-STL-${Math.floor(100000 + Math.random() * 900000)}`);
      setSettlementDate(new Date().toISOString().slice(0, 10));
      setNotes(
        language === 'bn'
          ? 'উভয় পক্ষের সম্মতিক্রমে ফার্ম থেকে বিনিয়োগ প্রত্যাহার ও চূড়ান্ত হিসাব নিষ্পত্তি সম্পন্ন হলো।'
          : 'Official partner withdrawal and final settlement concluded by mutual agreement.'
      );
      setDeleteConfirmText('');
      setActiveTab('settle');
    }
  }, [investor, isOpen]);

  if (!isOpen || !investor || !fin) return null;

  const netSettledAmount = Math.max(0, capitalRefund + pendingProfitPayment - deductionAmount);

  const handleSettleAndClose = (e: React.FormEvent) => {
    e.preventDefault();

    const timestamp = new Date().toISOString();
    const settlementDetails = {
      settledAt: settlementDate,
      capitalRefunded: capitalRefund,
      pendingProfitPaid: pendingProfitPayment,
      deductionAmount: deductionAmount,
      netSettledAmount: netSettledAmount,
      paymentMethod: paymentMethod,
      transactionRef: transactionRef,
      voucherNo: voucherNo,
      notes: notes,
      processedByName: currentUser.name,
    };

    // 1. Create an official expense record in accounting to balance the books
    const primarySectorId = fin.investments[0]?.sectorId || db.sectors[0]?.id || 'sec-duck';
    const settlementExpense: ExpenseRecord = {
      id: `exp-settle-${Date.now()}`,
      date: settlementDate,
      sectorId: primarySectorId,
      category: 'other',
      categoryBn: 'বিনিয়োগকারী প্রস্থান ও মূলধন নিষ্পত্তি',
      description: `বিনিয়োগকারী চূড়ান্ত হিসাব নিষ্পত্তি ও মূলধন ফেরত: ${investor.name} (মূলধন: ৳${capitalRefund.toLocaleString('en-IN')}, লভ্যাংশ: ৳${pendingProfitPayment.toLocaleString('en-IN')})`,
      amount: netSettledAmount,
      vendor: investor.name,
      paymentMethod: paymentMethod,
      voucherNo: voucherNo,
      status: 'approved',
      notes: notes || 'Investor account closed and settled.',
      addedByName: currentUser.name,
      paidByName: currentUser.name,
      approvedByName: currentUser.name,
      approvedAt: timestamp,
    };

    updateDb((prev) => {
      // 2. Update investor status to 'closed'
      const updatedInvestors = prev.investors.map((inv) => {
        if (inv.id === investor.id) {
          return {
            ...inv,
            status: 'closed' as const,
            notes: `${inv.notes || ''} [Closed & Settled on ${settlementDate}. Ref: ${voucherNo}]`,
            settlement: settlementDetails,
          };
        }
        return inv;
      });

      // 3. Update all investments of this investor to 'withdrawn'
      const updatedInvestments = prev.investments.map((inv) => {
        if (inv.investorId === investor.id && (inv.status === 'active' || inv.status === 'pending')) {
          return {
            ...inv,
            status: 'withdrawn' as const,
            notes: `${inv.notes || ''} [Withdrawn on final settlement ${settlementDate}]`,
          };
        }
        return inv;
      });

      // 4. Mark all pending profit distributions for this investor as paid
      const updatedDistributions = prev.profitDistributions.map((dist) => {
        if (dist.investorId === investor.id && dist.status !== 'paid') {
          return {
            ...dist,
            status: 'paid' as const,
            paidAmount: (dist.paidAmount || 0) + (dist.pendingAmount || 0),
            pendingAmount: 0,
            paymentDate: settlementDate,
            paymentRef: voucherNo,
          };
        }
        return dist;
      });

      // 5. Deactivate or remove login user from users list
      const updatedUsers = prev.users.filter(
        (u) => u.investorProfileId !== investor.id && u.email.toLowerCase() !== investor.email.toLowerCase()
      );

      return {
        ...prev,
        investors: updatedInvestors,
        investments: updatedInvestments,
        profitDistributions: updatedDistributions,
        expenses: [settlementExpense, ...prev.expenses],
        users: updatedUsers,
      };
    });

    logAudit(
      'INVESTOR_SETTLED_AND_CLOSED',
      `Settled & closed investor account for ${investor.name} (${investor.phone}). Net payout: BDT ${netSettledAmount}. Voucher: ${voucherNo}`,
      primarySectorId
    );

    showToast(
      language === 'bn'
        ? `বিনিয়োগকারী "${investor.name}" এর হিসাব সফলভাবে নিষ্পত্তি ও অ্যাকাউন্ট ক্লোজ করা হয়েছে!`
        : `Investor "${investor.name}" account settled and closed successfully!`
    );

    if (onSuccess) onSuccess();
    onClose();
  };

  const handlePermanentDelete = () => {
    if (deleteConfirmText.trim().toLowerCase() !== investor.name.trim().toLowerCase()) {
      showToast(
        language === 'bn'
          ? 'নিশ্চিতকরণের জন্য বিনিয়োগকারীর সঠিক নামটি লিখুন।'
          : 'Please type the exact investor name to confirm deletion.'
      );
      return;
    }

    updateDb((prev) => {
      const updatedInvestors = prev.investors.filter((i) => i.id !== investor.id);
      const updatedUsers = prev.users.filter(
        (u) => u.investorProfileId !== investor.id && u.email.toLowerCase() !== investor.email.toLowerCase()
      );
      // Remove or mark investments
      const updatedInvestments = prev.investments.filter((i) => i.investorId !== investor.id);
      const updatedDistributions = prev.profitDistributions.filter((d) => d.investorId !== investor.id);

      return {
        ...prev,
        investors: updatedInvestors,
        users: updatedUsers,
        investments: updatedInvestments,
        profitDistributions: updatedDistributions,
      };
    });

    logAudit(
      'INVESTOR_PERMANENTLY_DELETED',
      `Permanently deleted investor profile and credentials: ${investor.name} (${investor.phone})`
    );

    showToast(
      language === 'bn'
        ? `বিনিয়োগকারী "${investor.name}" এর অ্যাকাউন্ট স্থায়ীভাবে মুছে ফেলা হয়েছে।`
        : `Investor "${investor.name}" permanently deleted.`
    );

    if (onSuccess) onSuccess();
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-xs p-3 sm:p-4 animate-in fade-in duration-200">
      <div className="bg-white rounded-2xl shadow-2xl max-w-2xl w-full overflow-hidden border border-slate-200 flex flex-col max-h-[92vh]">
        
        {/* Header */}
        <div className="bg-gradient-to-r from-slate-900 to-slate-800 text-white px-6 py-4 flex items-center justify-between shrink-0">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-emerald-600/30 border border-emerald-400/40 flex items-center justify-center text-emerald-300 font-bold text-lg">
              {investor.name.charAt(0)}
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h3 className="font-bold text-base sm:text-lg text-white">
                  {language === 'bn' ? 'বিনিয়োগকারী প্রস্থান ও চূড়ান্ত হিসাব নিষ্পত্তি' : 'Investor Exit & Account Settlement'}
                </h3>
                <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full uppercase ${
                  investor.status === 'closed'
                    ? 'bg-slate-700 text-slate-300 border border-slate-600'
                    : 'bg-emerald-500/20 text-emerald-300 border border-emerald-400/30'
                }`}>
                  {investor.status}
                </span>
              </div>
              <p className="text-xs text-slate-300">
                {investor.name} {investor.nameBn ? `(${investor.nameBn})` : ''} · NID: {investor.nidPassport || investor.nid || '—'}
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="text-slate-400 hover:text-white p-1 rounded-lg hover:bg-white/10 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Mode Selector Tabs */}
        <div className="flex border-b border-slate-200 bg-slate-50 px-6 shrink-0">
          <button
            type="button"
            onClick={() => setActiveTab('settle')}
            className={`py-3 px-4 text-xs font-bold border-b-2 flex items-center gap-1.5 transition-colors ${
              activeTab === 'settle'
                ? 'border-emerald-600 text-emerald-700 bg-white'
                : 'border-transparent text-slate-500 hover:text-slate-700'
            }`}
          >
            <FileCheck2 className="w-4 h-4 text-emerald-600" />
            <span>{language === 'bn' ? '১. হিসাব ক্লোজ ও নিষ্পত্তি (পরামর্শযোগ্য)' : '1. Settle & Close Account (Recommended)'}</span>
          </button>

          <button
            type="button"
            onClick={() => setActiveTab('delete')}
            className={`py-3 px-4 text-xs font-bold border-b-2 flex items-center gap-1.5 transition-colors ${
              activeTab === 'delete'
                ? 'border-rose-600 text-rose-700 bg-white'
                : 'border-transparent text-slate-500 hover:text-slate-700'
            }`}
          >
            <Trash2 className="w-4 h-4 text-rose-600" />
            <span>{language === 'bn' ? '২. স্থায়ীভাবে মুছে ফেলুন' : '2. Permanently Delete Account'}</span>
          </button>
        </div>

        {/* Modal Body */}
        <div className="p-6 overflow-y-auto space-y-5 flex-1">
          {activeTab === 'settle' ? (
            <form onSubmit={handleSettleAndClose} className="space-y-5">
              
              {/* Informational Guidance Alert */}
              <div className="p-3.5 bg-blue-50 border border-blue-200 rounded-xl flex items-start gap-3 text-xs text-blue-900">
                <FileCheck2 className="w-5 h-5 text-blue-600 shrink-0 mt-0.5" />
                <div>
                  <span className="font-bold block">
                    {language === 'bn' ? 'হিসাব ক্লোজ ও নিষ্পত্তির প্রক্রিয়া:' : 'Account Settlement Workflow:'}
                  </span>
                  <p className="text-blue-800 mt-0.5 leading-relaxed">
                    {language === 'bn'
                      ? 'বিনিয়োগকারী প্রস্থান করলে তার সক্রিয় মূলধন ফেরত ও বকেয়া লভ্যাংশ পরিশোধ করে হিসাব বন্ধ করা হয়। এতে খামারের হিসাব বহিতে খরচ সমন্বয় হবে, বিনিয়োগকারীর শেয়ার উন্মুক্ত হবে এবং ভবিষ্যৎ নিরীক্ষার জন্য সব ভাউচার সংরক্ষিত থাকবে।'
                      : 'When an investor leaves, their principal capital and pending profits are disbursed to close the contract. The farm cash book will balance via an official voucher, and legal records are preserved for audit compliance.'}
                  </p>
                </div>
              </div>

              {/* Current Ledger Balances */}
              <div>
                <h4 className="text-xs font-bold text-slate-700 uppercase tracking-wider mb-2">
                  {language === 'bn' ? 'বর্তমান লেজার ব্যালেন্স বিবরণী' : 'Current Ledger Status'}
                </h4>
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5">
                  <div className="p-3 bg-slate-50 border border-slate-200 rounded-xl">
                    <span className="text-[11px] text-slate-500 block">
                      {language === 'bn' ? 'সক্রিয় মূলধন' : 'Invested Capital'}
                    </span>
                    <span className="text-sm sm:text-base font-bold text-slate-900 tabular-nums">
                      {formatCurrency(fin.totalInvested, language)}
                    </span>
                  </div>

                  <div className="p-3 bg-slate-50 border border-slate-200 rounded-xl">
                    <span className="text-[11px] text-slate-500 block">
                      {language === 'bn' ? 'মোট অর্জিত লাভ' : 'Profit Earned'}
                    </span>
                    <span className="text-sm sm:text-base font-bold text-blue-700 tabular-nums">
                      {formatCurrency(fin.totalProfitEarned || fin.totalProfitShare, language)}
                    </span>
                  </div>

                  <div className="p-3 bg-slate-50 border border-slate-200 rounded-xl">
                    <span className="text-[11px] text-slate-500 block">
                      {language === 'bn' ? 'পরিশোধিত লভ্যাংশ' : 'Profit Paid'}
                    </span>
                    <span className="text-sm sm:text-base font-bold text-emerald-700 tabular-nums">
                      {formatCurrency(fin.totalProfitPaid, language)}
                    </span>
                  </div>

                  <div className="p-3 bg-amber-50 border border-amber-200 rounded-xl">
                    <span className="text-[11px] text-amber-800 font-semibold block">
                      {language === 'bn' ? 'বকেয়া লভ্যাংশ' : 'Pending Profit'}
                    </span>
                    <span className="text-sm sm:text-base font-bold text-amber-900 tabular-nums">
                      {formatCurrency(fin.totalProfitPending, language)}
                    </span>
                  </div>
                </div>
              </div>

              {/* Settlement Calculation Inputs */}
              <div className="p-4 bg-slate-50/80 rounded-xl border border-slate-200 space-y-3">
                <h4 className="text-xs font-bold text-slate-900 flex items-center gap-1.5">
                  <Receipt className="w-4 h-4 text-emerald-700" />
                  <span>{language === 'bn' ? 'চূড়ান্ত হিসাব সমন্বয় ও পরিশোধ নির্ধারণ' : 'Settlement Payout Calculation'}</span>
                </h4>

                <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                  <div>
                    <label className="block text-[11px] font-semibold text-slate-700 mb-1">
                      {language === 'bn' ? '১. মূলধন ফেরত (টাকা)' : '1. Capital Refund (BDT)'} *
                    </label>
                    <input
                      type="number"
                      required
                      min="0"
                      value={capitalRefund}
                      onChange={(e) => setCapitalRefund(parseFloat(e.target.value) || 0)}
                      className="w-full px-3 py-2 text-xs font-bold border border-slate-300 rounded-lg focus:ring-2 focus:ring-emerald-600 focus:outline-none bg-white"
                    />
                    <span className="text-[10px] text-slate-500 mt-0.5 block">
                      {language === 'bn' ? 'ফেরতযোগ্য বিনিয়োগকৃত মূলধন' : 'Principal invested amount'}
                    </span>
                  </div>

                  <div>
                    <label className="block text-[11px] font-semibold text-slate-700 mb-1">
                      {language === 'bn' ? '২. বকেয়া লভ্যাংশ নিষ্পত্তি (টাকা)' : '2. Pending Profit Payout (BDT)'} *
                    </label>
                    <input
                      type="number"
                      required
                      min="0"
                      value={pendingProfitPayment}
                      onChange={(e) => setPendingProfitPayment(parseFloat(e.target.value) || 0)}
                      className="w-full px-3 py-2 text-xs font-bold border border-slate-300 rounded-lg focus:ring-2 focus:ring-emerald-600 focus:outline-none bg-white"
                    />
                    <span className="text-[10px] text-slate-500 mt-0.5 block">
                      {language === 'bn' ? 'বকেয়া থাকা প্রদেয় লভ্যাংশ' : 'Remaining unpaid profit share'}
                    </span>
                  </div>

                  <div>
                    <label className="block text-[11px] font-semibold text-slate-700 mb-1">
                      {language === 'bn' ? '৩. কর্তন / ফি / সমন্বয় (টাকা)' : '3. Deductions / Exit Fee (BDT)'}
                    </label>
                    <input
                      type="number"
                      min="0"
                      value={deductionAmount}
                      onChange={(e) => setDeductionAmount(parseFloat(e.target.value) || 0)}
                      className="w-full px-3 py-2 text-xs font-bold border border-slate-300 rounded-lg focus:ring-2 focus:ring-emerald-600 focus:outline-none bg-white text-rose-700"
                    />
                    <span className="text-[10px] text-slate-500 mt-0.5 block">
                      {language === 'bn' ? 'প্রস্থান ফি বা সমন্বয় থাকলে' : 'Early fee or adjustments'}
                    </span>
                  </div>
                </div>

                {/* Net Final Settlement Banner */}
                <div className="mt-2 p-3 bg-emerald-800 text-white rounded-xl flex items-center justify-between shadow-xs">
                  <div>
                    <span className="text-xs text-emerald-200 block uppercase font-medium">
                      {language === 'bn' ? 'সর্বমোট চূড়ান্ত প্রদেয় অর্থ (Net Settlement Payable)' : 'Total Net Settlement Payable'}
                    </span>
                    <span className="text-xs text-emerald-100">
                      (মূলধন ফেরত + বকেয়া লভ্যাংশ - কর্তন)
                    </span>
                  </div>
                  <div className="text-right">
                    <span className="text-lg sm:text-2xl font-black tabular-nums tracking-tight">
                      {formatCurrency(netSettledAmount, language)}
                    </span>
                  </div>
                </div>
              </div>

              {/* Payment Details */}
              <div className="space-y-3">
                <h4 className="text-xs font-bold text-slate-700 uppercase tracking-wider">
                  {language === 'bn' ? 'পরিশোধ ও ভাউচার বিবরণ' : 'Payment & Voucher Records'}
                </h4>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div>
                    <label className="block text-[11px] font-semibold text-slate-700 mb-1">
                      {language === 'bn' ? 'পরিশোধের মাধ্যম' : 'Payment Method'} *
                    </label>
                    <select
                      value={paymentMethod}
                      onChange={(e) => setPaymentMethod(e.target.value as PaymentMethod)}
                      className="w-full px-3 py-2 text-xs border border-slate-300 rounded-lg focus:ring-2 focus:ring-emerald-600 focus:outline-none bg-white"
                    >
                      <option value="Bank Transfer">Bank Transfer (ব্যাংক ট্রান্সফার)</option>
                      <option value="Cheque">Bank Cheque (ব্যাংক চেক)</option>
                      <option value="bKash">bKash (বিকাশ)</option>
                      <option value="Nagad">Nagad (নগদ)</option>
                      <option value="Cash">Cash (নগদ টাকা)</option>
                    </select>
                  </div>

                  <div>
                    <label className="block text-[11px] font-semibold text-slate-700 mb-1">
                      {language === 'bn' ? 'প্রাপক অ্যাকাউন্ট / ওয়ালেট নম্বর' : 'Recipient Account / Mobile'}
                    </label>
                    <input
                      type="text"
                      value={recipientAccount}
                      onChange={(e) => setRecipientAccount(e.target.value)}
                      placeholder="Bank A/C or bKash number"
                      className="w-full px-3 py-2 text-xs border border-slate-300 rounded-lg focus:ring-2 focus:ring-emerald-600 focus:outline-none bg-white"
                    />
                  </div>

                  <div>
                    <label className="block text-[11px] font-semibold text-slate-700 mb-1">
                      {language === 'bn' ? 'ট্রানজেকশন আইডি / চেক নম্বর' : 'Transaction Ref / Cheque No.'} *
                    </label>
                    <input
                      type="text"
                      required
                      value={transactionRef}
                      onChange={(e) => setTransactionRef(e.target.value)}
                      placeholder="e.g. CHQ-981240 or TXN-IBBL-49102"
                      className="w-full px-3 py-2 text-xs border border-slate-300 rounded-lg focus:ring-2 focus:ring-emerald-600 focus:outline-none bg-white font-mono"
                    />
                  </div>

                  <div>
                    <label className="block text-[11px] font-semibold text-slate-700 mb-1">
                      {language === 'bn' ? 'নিষ্পত্তির তারিখ' : 'Settlement Date'} *
                    </label>
                    <input
                      type="date"
                      required
                      value={settlementDate}
                      onChange={(e) => setSettlementDate(e.target.value)}
                      className="w-full px-3 py-2 text-xs border border-slate-300 rounded-lg focus:ring-2 focus:ring-emerald-600 focus:outline-none bg-white"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-[11px] font-semibold text-slate-700 mb-1">
                    {language === 'bn' ? 'চুক্তি সমাপ্তি নোট / মন্তব্য' : 'Settlement Notes / Remarks'}
                  </label>
                  <textarea
                    rows={2}
                    value={notes}
                    onChange={(e) => setNotes(e.target.value)}
                    placeholder="Comments regarding exit agreement and settlement terms..."
                    className="w-full px-3 py-2 text-xs border border-slate-300 rounded-lg focus:ring-2 focus:ring-emerald-600 focus:outline-none bg-white"
                  />
                </div>
              </div>

              {/* Action Buttons */}
              <div className="pt-3 border-t border-slate-200 flex flex-col sm:flex-row items-center justify-between gap-3">
                <button
                  type="button"
                  onClick={onClose}
                  className="w-full sm:w-auto px-4 py-2 text-xs font-semibold text-slate-600 hover:bg-slate-100 rounded-lg border border-slate-300 transition-colors"
                >
                  {language === 'bn' ? 'বাতিল করুন' : 'Cancel'}
                </button>

                <button
                  type="submit"
                  className="w-full sm:w-auto px-5 py-2.5 text-xs font-bold text-white bg-emerald-700 hover:bg-emerald-800 rounded-lg shadow-sm transition-all flex items-center justify-center gap-2"
                >
                  <CheckCircle2 className="w-4 h-4 text-emerald-200" />
                  <span>
                    {language === 'bn' 
                      ? 'চূড়ান্ত নিষ্পত্তি ও অ্যাকাউন্ট ক্লোজ নিশ্চিত করুন' 
                      : 'Confirm Settlement & Close Account'}
                  </span>
                </button>
              </div>

            </form>
          ) : (
            /* Permanent Delete Tab */
            <div className="space-y-5">
              <div className="p-4 bg-rose-50 border border-rose-200 rounded-xl text-rose-900 space-y-2">
                <div className="flex items-center gap-2 font-bold text-sm text-rose-800">
                  <AlertTriangle className="w-5 h-5 text-rose-600 shrink-0" />
                  <span>
                    {language === 'bn' ? 'স্থায়ীভাবে অ্যাকাউন্ট মুছে ফেলার সতর্কতা' : 'Permanent Account Deletion Warning'}
                  </span>
                </div>
                <p className="text-xs text-rose-800 leading-relaxed">
                  {language === 'bn'
                    ? 'এই অপশনটি নির্বাচন করলে বিনিয়োগকারীর প্রোফাইল, পোর্টাল লগইন ও সমস্ত তথ্য সম্পূর্ণভাবে ডাটাবেজ থেকে মুছে যাবে। সাধারণত অডিট ও আইনি প্রমাণের স্বার্থে হিসাব ক্লোজড (Option 1) রাখাই উত্তম। আপনি যদি সত্যি মুছে ফেলতে চান তবে নিচে নিশ্চিত করুন।'
                    : 'This action permanently purges this investor profile, credentials, and records from the database. For official accounting and tax audits, closing the account (Option 1) is strongly advised. If you intend to delete entirely, please confirm below.'}
                </p>
              </div>

              <div className="p-4 bg-slate-50 rounded-xl border border-slate-200 space-y-3">
                <span className="text-xs font-semibold text-slate-700 block">
                  {language === 'bn' ? 'মুছে ফেলতে বিনিয়োগকারীর নাম হুবহু লিখুন:' : 'Type exact investor name to confirm:'}
                </span>
                <p className="text-xs font-mono font-bold text-slate-900 bg-white px-3 py-1.5 rounded border border-slate-300 inline-block">
                  {investor.name}
                </p>
                <input
                  type="text"
                  value={deleteConfirmText}
                  onChange={(e) => setDeleteConfirmText(e.target.value)}
                  placeholder={investor.name}
                  className="w-full px-3 py-2 text-xs border border-rose-300 rounded-lg focus:ring-2 focus:ring-rose-500 focus:outline-none bg-white font-medium"
                />
              </div>

              <div className="pt-3 border-t border-slate-200 flex flex-col sm:flex-row items-center justify-between gap-3">
                <button
                  type="button"
                  onClick={() => setActiveTab('settle')}
                  className="w-full sm:w-auto px-4 py-2 text-xs font-semibold text-slate-600 hover:bg-slate-100 rounded-lg border border-slate-300"
                >
                  {language === 'bn' ? 'ফিরে যান' : 'Back to Settlement'}
                </button>

                <button
                  type="button"
                  disabled={deleteConfirmText.trim().toLowerCase() !== investor.name.trim().toLowerCase()}
                  onClick={handlePermanentDelete}
                  className={`w-full sm:w-auto px-5 py-2.5 text-xs font-bold text-white rounded-lg shadow-sm transition-all flex items-center justify-center gap-2 ${
                    deleteConfirmText.trim().toLowerCase() === investor.name.trim().toLowerCase()
                      ? 'bg-rose-700 hover:bg-rose-800 cursor-pointer'
                      : 'bg-slate-300 text-slate-500 cursor-not-allowed'
                  }`}
                >
                  <Trash2 className="w-4 h-4" />
                  <span>
                    {language === 'bn' ? 'স্থায়ীভাবে অ্যাকাউন্ট মুছে ফেলুন' : 'Permanently Delete Account'}
                  </span>
                </button>
              </div>
            </div>
          )}
        </div>

      </div>
    </div>
  );
};
