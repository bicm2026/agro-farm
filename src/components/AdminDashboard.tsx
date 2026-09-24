import React, { useState } from 'react';
import { useApp } from '../context/AppContext';
import { formatCurrency, formatNumber, formatDate } from '../utils/translations';
import { 
  TrendingUp, 
  Receipt, 
  Scale, 
  Wallet, 
  Users, 
  Sprout, 
  ShieldAlert, 
  Plus, 
  Check, 
  X, 
  ArrowUpRight, 
  Eye,
  Calendar,
  AlertTriangle
} from 'lucide-react';

export const AdminDashboard: React.FC = () => {
  const { 
    db, 
    currentUser, 
    language, 
    t, 
    setActiveTab, 
    setSelectedSectorId, 
    globalFinancials, 
    updateDb, 
    logAudit, 
    showToast 
  } = useApp();

  const [dateFilter, setDateFilter] = useState<'all' | 'month' | 'year'>('all');

  const pendingExpenses = db.expenses.filter((e) => e.status === 'pending_approval');

  const handleApproveExpense = (expenseId: string) => {
    const exp = db.expenses.find((e) => e.id === expenseId);
    if (!exp) return;

    updateDb((prev) => ({
      ...prev,
      expenses: prev.expenses.map((e) =>
        e.id === expenseId
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
      `Approved expense of ${formatCurrency(exp.amount, 'en')} for ${exp.description}`,
      exp.sectorId,
      'pending_approval',
      'approved'
    );
    showToast('Expense voucher approved and posted to official ledger!');
  };

  const handleRejectExpense = (expenseId: string) => {
    updateDb((prev) => ({
      ...prev,
      expenses: prev.expenses.filter((e) => e.id !== expenseId),
    }));
    logAudit('REJECT_EXPENSE', `Rejected and removed pending expense voucher #${expenseId}`);
    showToast('Expense voucher rejected.');
  };

  // Recent transactions (merged incomes & expenses)
  const recentTransactions = [
    ...db.incomes.map((inc) => ({
      id: inc.id,
      type: 'income' as const,
      date: inc.date,
      title: inc.product,
      sectorId: inc.sectorId,
      amount: inc.totalAmount,
      party: inc.customerBuyer,
      voucher: inc.invoiceNo,
      status: inc.status,
    })),
    ...db.expenses.map((exp) => ({
      id: exp.id,
      type: 'expense' as const,
      date: exp.date,
      title: exp.description,
      sectorId: exp.sectorId,
      amount: exp.amount,
      party: exp.vendor,
      voucher: exp.voucherNo || 'VOUCHER',
      status: exp.status,
    })),
  ]
    .sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime())
    .slice(0, 7);

  // Sector revenue comparison data for visual bar/pie
  const sectorData = globalFinancials.sectorBreakdown.map((sec) => {
    const s = db.sectors.find((item) => item.id === sec.sectorId);
    return {
      name: language === 'bn' ? s?.nameBn || sec.sectorName : sec.sectorName,
      revenue: sec.totalIncome,
      expense: sec.totalExpense,
      profit: sec.netProfit,
    };
  });

  const maxSectorRev = Math.max(...sectorData.map((d) => d.revenue), 1);

  return (
    <div className="space-y-6">
      
      {/* Top Header Bar */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-2 border-b border-slate-200">
        <div>
          <h1 className="text-xl sm:text-2xl font-bold text-slate-900 tracking-tight">
            {t.dashboard}
          </h1>
          <p className="text-xs text-slate-500 mt-0.5">
            {language === 'bn' 
              ? 'সমন্বিত খামারের সার্বিক আর্থিক ও পরিচালনা সূচক (স্বয়ংক্রিয় হিসাব)' 
              : 'Integrated Agro Operations & Real-Time Financial Ledger'}
          </p>
        </div>

        {/* Action Shortcuts */}
        <div className="flex flex-wrap items-center gap-2">
          <button
            onClick={() => setActiveTab('income')}
            className="px-3 py-1.5 text-xs font-semibold text-white bg-emerald-700 hover:bg-emerald-800 rounded-lg shadow-xs transition-colors flex items-center gap-1.5"
          >
            <Plus className="w-3.5 h-3.5" />
            <span>{language === 'bn' ? 'আয় লিপিবদ্ধ করুন' : 'Add Income'}</span>
          </button>

          <button
            onClick={() => setActiveTab('expense')}
            className="px-3 py-1.5 text-xs font-semibold text-slate-700 bg-white border border-slate-300 hover:bg-slate-50 rounded-lg transition-colors flex items-center gap-1.5"
          >
            <Plus className="w-3.5 h-3.5" />
            <span>{language === 'bn' ? 'ব্যয় ভাউচার' : 'Add Expense'}</span>
          </button>

          <button
            onClick={() => setActiveTab('operations')}
            className="px-3 py-1.5 text-xs font-semibold text-slate-700 bg-white border border-slate-300 hover:bg-slate-50 rounded-lg transition-colors flex items-center gap-1.5"
          >
            <Calendar className="w-3.5 h-3.5" />
            <span>{language === 'bn' ? 'দৈনিক লগ' : 'Daily Log'}</span>
          </button>
        </div>
      </div>

      {/* Pending Approval Banner (Approval Workflow) */}
      {pendingExpenses.length > 0 && (
        <div className="p-4 rounded-xl bg-amber-50 border border-amber-200 flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div className="flex items-start gap-3">
            <AlertTriangle className="w-5 h-5 text-amber-600 shrink-0 mt-0.5" />
            <div>
              <h4 className="text-xs font-bold text-amber-900">
                {language === 'bn'
                  ? `${pendingExpenses.length} টি ব্যয় ভাউচার অনুমোদনের অপেক্ষায় রয়েছে`
                  : `${pendingExpenses.length} Expense Voucher(s) Pending Review & Approval`}
              </h4>
              <p className="text-xs text-amber-700 mt-0.5">
                {language === 'bn'
                  ? 'অনুমোদন না হওয়া পর্যন্ত এগুলো আর্থিক লাভ-ক্ষতি হিসেবে গণ্য হবে না।'
                  : 'Pending vouchers do not reflect on verified investor P&L until officially approved.'}
              </p>
            </div>
          </div>

          <button
            onClick={() => setActiveTab('expense')}
            className="px-3 py-1.5 text-xs font-semibold text-amber-900 bg-amber-200/80 hover:bg-amber-200 rounded-md transition-colors shrink-0"
          >
            {language === 'bn' ? 'ভাউচারসমূহ যাচাই করুন' : 'Review Vouchers'}
          </button>
        </div>
      )}

      {/* Primary KPI Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        
        {/* Total Investment */}
        <div className="bg-white p-5 rounded-xl border border-slate-200 shadow-xs">
          <div className="flex items-center justify-between text-xs text-slate-500 mb-2">
            <span>{t.totalInvestment}</span>
            <Wallet className="w-4 h-4 text-emerald-700" />
          </div>
          <div className="text-xl sm:text-2xl font-bold text-slate-900 tabular-nums">
            {formatCurrency(globalFinancials.totalInvestment, language)}
          </div>
          <div className="mt-2 text-[11px] text-slate-500 flex items-center justify-between">
            <span>{db.investments.length} Active Contracts</span>
            <span className="text-emerald-700 font-semibold">{db.investors.length} Investors</span>
          </div>
        </div>

        {/* Total Revenue */}
        <div className="bg-white p-5 rounded-xl border border-slate-200 shadow-xs">
          <div className="flex items-center justify-between text-xs text-slate-500 mb-2">
            <span>{t.totalRevenue}</span>
            <TrendingUp className="w-4 h-4 text-blue-600" />
          </div>
          <div className="text-xl sm:text-2xl font-bold text-slate-900 tabular-nums">
            {formatCurrency(globalFinancials.totalIncome, language)}
          </div>
          <div className="mt-2 text-[11px] text-slate-500 flex items-center justify-between">
            <span>{db.incomes.length} Sales Invoices</span>
            <span className="text-blue-600 font-semibold">100% Verified</span>
          </div>
        </div>

        {/* Total Operational Expenses */}
        <div className="bg-white p-5 rounded-xl border border-slate-200 shadow-xs">
          <div className="flex items-center justify-between text-xs text-slate-500 mb-2">
            <span>{t.totalExpenses}</span>
            <Receipt className="w-4 h-4 text-rose-600" />
          </div>
          <div className="text-xl sm:text-2xl font-bold text-slate-900 tabular-nums">
            {formatCurrency(globalFinancials.totalExpense, language)}
          </div>
          <div className="mt-2 text-[11px] text-slate-500 flex items-center justify-between">
            <span>{db.expenses.filter((e) => e.status === 'approved').length} Approved Bills</span>
            <span className="text-rose-600 font-semibold">{pendingExpenses.length} Pending</span>
          </div>
        </div>

        {/* Net Profit & Margin */}
        <div className="bg-white p-5 rounded-xl border border-slate-200 shadow-xs">
          <div className="flex items-center justify-between text-xs text-slate-500 mb-2">
            <span>{t.netProfit}</span>
            <Scale className="w-4 h-4 text-amber-600" />
          </div>
          <div className={`text-xl sm:text-2xl font-bold tabular-nums ${globalFinancials.netProfit >= 0 ? 'text-emerald-700' : 'text-rose-700'}`}>
            {formatCurrency(globalFinancials.netProfit, language)}
          </div>
          <div className="mt-2 text-[11px] text-slate-500 flex items-center justify-between">
            <span>Margin: {globalFinancials.profitMarginPercent.toFixed(1)}%</span>
            <span className="text-slate-800 font-semibold">Cash: {formatCurrency(globalFinancials.cashBalance, language)}</span>
          </div>
        </div>

      </div>

      {/* Sector Financial Performance Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        
        {/* Sector Comparison Bar Chart */}
        <div className="lg:col-span-8 bg-white p-6 rounded-xl border border-slate-200 shadow-xs">
          <div className="flex items-center justify-between mb-6">
            <div>
              <h3 className="text-sm font-bold text-slate-900">
                {language === 'bn' ? 'সেক্টরভিত্তিক রাজস্ব ও পরিচালনা ব্যয় তুলনা' : 'Sector-Wise Revenue & Operational Expenses'}
              </h3>
              <p className="text-xs text-slate-500 mt-0.5">
                {language === 'bn' ? 'প্রতিটি সেক্টরের বাস্তব বিক্রয় ও ব্যয়ের অনুপাত' : 'Verified financial performance across each agricultural division'}
              </p>
            </div>
            <button
              onClick={() => setActiveTab('accounting')}
              className="text-xs font-semibold text-emerald-700 hover:text-emerald-800"
            >
              {language === 'bn' ? 'পূর্ণাঙ্গ P&L বিবরণী →' : 'Full P&L Sheet →'}
            </button>
          </div>

          <div className="space-y-4">
            {sectorData.map((sec, idx) => {
              const revPercent = Math.min(100, Math.round((sec.revenue / maxSectorRev) * 100));
              const expPercent = Math.min(100, Math.round((sec.expense / maxSectorRev) * 100));

              return (
                <div key={idx} className="space-y-1.5">
                  <div className="flex justify-between items-center text-xs">
                    <span className="font-semibold text-slate-800">{sec.name}</span>
                    <div className="flex items-center gap-3 tabular-nums">
                      <span className="text-emerald-700 font-medium">Rev: {formatCurrency(sec.revenue, language)}</span>
                      <span className="text-slate-400">|</span>
                      <span className="text-rose-700 font-medium">Exp: {formatCurrency(sec.expense, language)}</span>
                      <span className="text-slate-400">|</span>
                      <span className={`font-bold ${sec.profit >= 0 ? 'text-emerald-800' : 'text-rose-800'}`}>
                        Net: {formatCurrency(sec.profit, language)}
                      </span>
                    </div>
                  </div>

                  {/* Dual bar graph */}
                  <div className="space-y-1">
                    <div className="w-full bg-slate-100 h-2 rounded-full overflow-hidden">
                      <div
                        className="bg-emerald-600 h-full rounded-full transition-all duration-500"
                        style={{ width: `${revPercent}%` }}
                        title={`Revenue: ${formatCurrency(sec.revenue, language)}`}
                      />
                    </div>
                    <div className="w-full bg-slate-100 h-1.5 rounded-full overflow-hidden">
                      <div
                        className="bg-rose-500/80 h-full rounded-full transition-all duration-500"
                        style={{ width: `${expPercent}%` }}
                        title={`Expense: ${formatCurrency(sec.expense, language)}`}
                      />
                    </div>
                  </div>
                </div>
              );
            })}
          </div>

          <div className="mt-6 pt-4 border-t border-slate-100 flex items-center justify-between text-[11px] text-slate-500">
            <div className="flex items-center gap-4">
              <div className="flex items-center gap-1.5">
                <span className="w-2.5 h-2.5 rounded-xs bg-emerald-600"></span>
                <span>{language === 'bn' ? 'রাজস্ব (Revenue)' : 'Revenue'}</span>
              </div>
              <div className="flex items-center gap-1.5">
                <span className="w-2.5 h-2.5 rounded-xs bg-rose-500"></span>
                <span>{language === 'bn' ? 'ব্যয় (Expense)' : 'Expense'}</span>
              </div>
            </div>
            <span>Auto-calculated from official ledger</span>
          </div>
        </div>

        {/* Sector Quick Switcher Cards */}
        <div className="lg:col-span-4 bg-white p-6 rounded-xl border border-slate-200 shadow-xs flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-sm font-bold text-slate-900">
                {language === 'bn' ? 'সক্রিয় ফার্ম সেক্টর' : 'Active Divisions'}
              </h3>
              <span className="text-xs font-semibold text-emerald-800 bg-emerald-50 px-2 py-0.5 rounded">
                {db.sectors.length} Sectors
              </span>
            </div>

            <div className="space-y-2.5">
              {db.sectors.map((s) => (
                <button
                  key={s.id}
                  onClick={() => {
                    setSelectedSectorId(s.id);
                    setActiveTab('sectors');
                  }}
                  className="w-full p-2.5 rounded-lg border border-slate-200 hover:border-emerald-600 hover:bg-emerald-50/30 text-left transition-colors flex items-center justify-between group"
                >
                  <div className="flex items-center gap-2.5 min-w-0">
                    <img
                      src={s.image}
                      alt={s.name}
                      className="w-8 h-8 rounded-md object-cover shrink-0"
                    />
                    <div className="truncate">
                      <p className="text-xs font-semibold text-slate-900 group-hover:text-emerald-800 truncate">
                        {language === 'bn' ? s.nameBn : s.name}
                      </p>
                      <p className="text-[11px] text-slate-400 truncate">
                        {s.code} · {s.totalArea}
                      </p>
                    </div>
                  </div>
                  <ArrowUpRight className="w-4 h-4 text-slate-400 group-hover:text-emerald-700 shrink-0" />
                </button>
              ))}
            </div>
          </div>

          <div className="mt-4 pt-4 border-t border-slate-100">
            <button
              onClick={() => setActiveTab('sectors')}
              className="w-full py-2 text-xs font-semibold text-emerald-800 bg-emerald-50 hover:bg-emerald-100 rounded-lg transition-colors text-center"
            >
              {language === 'bn' ? '+ নতুন সেক্টর বা মডিউল যোগ করুন' : '+ Add New Sector / Metric'}
            </button>
          </div>
        </div>

      </div>

      {/* Recent Transactions Table */}
      <div className="bg-white rounded-xl border border-slate-200 shadow-xs overflow-hidden">
        <div className="p-5 border-b border-slate-200 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div>
            <h3 className="text-sm font-bold text-slate-900">
              {language === 'bn' ? 'সাম্প্রতিক আয় ও ব্যয় খতিয়ান' : 'Recent Verified Ledger Transactions'}
            </h3>
            <p className="text-xs text-slate-500 mt-0.5">
              {language === 'bn' ? 'সকল লেনদেনের মূল ভাউচার ও ক্রেতা/বিক্রেতা খতিয়ান' : 'Full traceability back to original bills and sales vouchers'}
            </p>
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={() => setActiveTab('income')}
              className="text-xs font-semibold text-emerald-700 hover:text-emerald-800"
            >
              {language === 'bn' ? 'সকল আয় →' : 'All Income →'}
            </button>
            <span className="text-slate-300">·</span>
            <button
              onClick={() => setActiveTab('expense')}
              className="text-xs font-semibold text-rose-700 hover:text-rose-800"
            >
              {language === 'bn' ? 'সকল ব্যয় →' : 'All Expenses →'}
            </button>
          </div>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-xs text-left">
            <thead className="bg-slate-50 text-slate-600 font-semibold border-b border-slate-200">
              <tr>
                <th className="py-3 px-4">{t.date}</th>
                <th className="py-3 px-4">Type</th>
                <th className="py-3 px-4">{t.sector}</th>
                <th className="py-3 px-4">{t.description}</th>
                <th className="py-3 px-4">Party / Buyer</th>
                <th className="py-3 px-4">Voucher #</th>
                <th className="py-3 px-4 text-right">{t.amount}</th>
                <th className="py-3 px-4 text-center">{t.status}</th>
                <th className="py-3 px-4 text-right">{t.actions}</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {recentTransactions.map((tx) => {
                const sector = db.sectors.find((s) => s.id === tx.sectorId);
                const isInc = tx.type === 'income';

                return (
                  <tr key={tx.id} className="hover:bg-slate-50/70 transition-colors">
                    <td className="py-3 px-4 text-slate-500 whitespace-nowrap tabular-nums">
                      {formatDate(tx.date, language)}
                    </td>
                    <td className="py-3 px-4">
                      <span
                        className={`text-[11px] font-semibold px-2 py-0.5 rounded ${
                          isInc
                            ? 'bg-emerald-50 text-emerald-800 border border-emerald-200'
                            : 'bg-rose-50 text-rose-800 border border-rose-200'
                        }`}
                      >
                        {isInc ? 'INCOME' : 'EXPENSE'}
                      </span>
                    </td>
                    <td className="py-3 px-4 font-medium text-slate-800 whitespace-nowrap">
                      {language === 'bn' ? sector?.nameBn || sector?.name : sector?.name}
                    </td>
                    <td className="py-3 px-4 text-slate-700 max-w-xs truncate" title={tx.title}>
                      {tx.title}
                    </td>
                    <td className="py-3 px-4 text-slate-600 whitespace-nowrap">{tx.party}</td>
                    <td className="py-3 px-4 text-slate-400 font-mono text-[11px]">{tx.voucher}</td>
                    <td className={`py-3 px-4 text-right font-bold tabular-nums whitespace-nowrap ${isInc ? 'text-emerald-700' : 'text-rose-700'}`}>
                      {isInc ? '+' : '-'} {formatCurrency(tx.amount, language)}
                    </td>
                    <td className="py-3 px-4 text-center whitespace-nowrap">
                      <span
                        className={`text-[10px] font-bold px-2 py-0.5 rounded ${
                          tx.status === 'approved'
                            ? 'bg-emerald-100 text-emerald-800'
                            : 'bg-amber-100 text-amber-800'
                        }`}
                      >
                        {tx.status.toUpperCase()}
                      </span>
                    </td>
                    <td className="py-3 px-4 text-right whitespace-nowrap">
                      {tx.status === 'pending_approval' && (
                        <div className="flex items-center justify-end gap-1">
                          <button
                            onClick={() => handleApproveExpense(tx.id)}
                            className="p-1 text-emerald-700 hover:bg-emerald-100 rounded"
                            title="Approve"
                          >
                            <Check className="w-4 h-4" />
                          </button>
                          <button
                            onClick={() => handleRejectExpense(tx.id)}
                            className="p-1 text-rose-700 hover:bg-rose-100 rounded"
                            title="Reject"
                          >
                            <X className="w-4 h-4" />
                          </button>
                        </div>
                      )}
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>

    </div>
  );
};
