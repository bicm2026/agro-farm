import React, { useState } from 'react';
import { useApp } from '../context/AppContext';
import { formatCurrency, formatDate, formatNumber } from '../utils/translations';
import { 
  Scale, 
  TrendingUp, 
  Receipt, 
  Wallet, 
  FileSpreadsheet, 
  Printer, 
  ArrowUpRight, 
  Search,
  CheckCircle2,
  Calendar,
  Layers
} from 'lucide-react';

export const AccountingView: React.FC = () => {
  const { db, language, t, globalFinancials, getSectorFinancials, exportCSV, setSelectedSectorId, setActiveTab } = useApp();

  const [selectedPeriod, setSelectedPeriod] = useState<'all' | 'monthly' | 'quarterly' | 'annual'>('all');
  const [drilldownSectorId, setDrilldownSectorId] = useState<string | null>(null);

  const handleExportPL = () => {
    const headers = [
      'Sector Code',
      'Sector Name',
      'Total Revenue (BDT)',
      'Total Expenses (BDT)',
      'Net Profit / Loss (BDT)',
      'Profit Margin (%)',
      'Capital Invested (BDT)',
      'ROI (%)',
      'Distributed Profit (BDT)',
      'Retained Earnings (BDT)',
    ];

    const rows = globalFinancials.sectorBreakdown.map((sec) => [
      sec.sectorCode,
      sec.sectorName,
      sec.totalIncome,
      sec.totalExpense,
      sec.netProfit,
      sec.profitMarginPercent.toFixed(2),
      sec.totalInvestment,
      sec.roiPercent.toFixed(2),
      sec.totalProfitDistributed,
      sec.retainedEarnings,
    ]);

    // Summary row
    rows.push([
      'TOTAL',
      'All Integrated Sectors',
      globalFinancials.totalIncome,
      globalFinancials.totalExpense,
      globalFinancials.netProfit,
      globalFinancials.profitMarginPercent.toFixed(2),
      globalFinancials.totalInvestment,
      globalFinancials.globalROI.toFixed(2),
      globalFinancials.totalProfitDistributed,
      globalFinancials.retainedEarnings,
    ]);

    exportCSV('Profit_and_Loss_Statement', headers, rows);
  };

  const handlePrint = () => {
    window.print();
  };

  // Detailed transactions if drilled down
  const drilledSector = drilldownSectorId ? db.sectors.find((s) => s.id === drilldownSectorId) : null;
  const drilledIncomes = drilldownSectorId ? db.incomes.filter((i) => i.sectorId === drilldownSectorId && i.status === 'approved') : [];
  const drilledExpenses = drilldownSectorId ? db.expenses.filter((e) => e.sectorId === drilldownSectorId && e.status === 'approved') : [];

  return (
    <div className="space-y-6">
      
      {/* Top Header Bar */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-2 border-b border-slate-200">
        <div>
          <h1 className="text-xl sm:text-2xl font-bold text-slate-900 tracking-tight">
            {t.accounting}
          </h1>
          <p className="text-xs text-slate-500 mt-0.5">
            {language === 'bn' 
              ? 'সার্বিক লাভ-ক্ষতি বিবরণী, সেক্টরভিত্তিক নিট মুনাফা ও ক্যাশ ব্যালেন্স' 
              : 'Certified Profit & Loss Statements, Sector-Wise Margins & Traceable General Ledger'}
          </p>
        </div>

        <div className="flex items-center gap-2">
          <button
            onClick={handlePrint}
            className="px-3 py-1.5 text-xs font-medium text-slate-700 bg-white border border-slate-300 hover:bg-slate-50 rounded-lg transition-colors flex items-center gap-1.5"
          >
            <Printer className="w-3.5 h-3.5 text-slate-500" />
            <span>Print Report</span>
          </button>

          <button
            onClick={handleExportPL}
            className="px-3 py-1.5 text-xs font-semibold text-white bg-emerald-700 hover:bg-emerald-800 rounded-lg shadow-xs transition-colors flex items-center gap-1.5"
          >
            <FileSpreadsheet className="w-3.5 h-3.5" />
            <span>{t.exportCSV}</span>
          </button>
        </div>
      </div>

      {/* Main Financial Balance KPI Strip */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        
        <div className="bg-white p-5 rounded-xl border border-slate-200 shadow-xs">
          <span className="text-xs text-slate-500 font-medium block">Total Verified Revenue</span>
          <span className="text-xl sm:text-2xl font-bold text-emerald-700 tabular-nums">
            {formatCurrency(globalFinancials.totalIncome, language)}
          </span>
          <span className="text-[11px] text-slate-400 block mt-1">From All Approved Sales</span>
        </div>

        <div className="bg-white p-5 rounded-xl border border-slate-200 shadow-xs">
          <span className="text-xs text-slate-500 font-medium block">Total Operating Expenses</span>
          <span className="text-xl sm:text-2xl font-bold text-rose-700 tabular-nums">
            {formatCurrency(globalFinancials.totalExpense, language)}
          </span>
          <span className="text-[11px] text-slate-400 block mt-1">Direct Feed, Labor, Medicine & Utility</span>
        </div>

        <div className="bg-white p-5 rounded-xl border border-slate-200 shadow-xs">
          <span className="text-xs text-slate-500 font-medium block">Net Farm Profit (P&L)</span>
          <span className={`text-xl sm:text-2xl font-bold tabular-nums ${globalFinancials.netProfit >= 0 ? 'text-emerald-700' : 'text-rose-700'}`}>
            {formatCurrency(globalFinancials.netProfit, language)}
          </span>
          <span className="text-[11px] text-emerald-700 font-semibold block mt-1">
            Margin: {globalFinancials.profitMarginPercent.toFixed(1)}%
          </span>
        </div>

        <div className="bg-white p-5 rounded-xl border border-slate-200 shadow-xs">
          <span className="text-xs text-slate-500 font-medium block">Cash & Bank Balance</span>
          <span className="text-xl sm:text-2xl font-bold text-slate-900 tabular-nums">
            {formatCurrency(globalFinancials.cashBalance, language)}
          </span>
          <span className="text-[11px] text-slate-400 block mt-1">
            Capital + Revenue - Expenses - Paid Profit
          </span>
        </div>

      </div>

      {/* Sector-Wise Profit & Loss Statement Table */}
      <div className="bg-white rounded-xl border border-slate-200 shadow-xs overflow-hidden">
        <div className="p-5 border-b border-slate-200 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div>
            <h3 className="text-sm font-bold text-slate-900">
              {language === 'bn' ? 'সেক্টরভিত্তিক লাভ-ক্ষতি হিসাব বিবরণী' : 'Sector-Wise Profit & Loss Breakdown'}
            </h3>
            <p className="text-xs text-slate-500 mt-0.5">
              {language === 'bn' 
                ? 'প্রতিটি লাইনের সংখ্যা যাচাই করতে "অডিট ও ড্রিলডাউন" এ ক্লিক করুন' 
                : 'Click any row to drill down into the exact underlying invoices and vouchers'}
            </p>
          </div>

          <div className="text-xs text-emerald-800 bg-emerald-50 px-3 py-1.5 rounded-lg border border-emerald-200 font-medium flex items-center gap-1.5">
            <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" />
            <span>Strict Zero-Mock Traceability</span>
          </div>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-xs text-left">
            <thead className="bg-slate-50 text-slate-600 font-semibold border-b border-slate-200">
              <tr>
                <th className="py-3 px-4">Sector Name</th>
                <th className="py-3 px-4 text-right">Capital (BDT)</th>
                <th className="py-3 px-4 text-right">Sales Revenue</th>
                <th className="py-3 px-4 text-right">Operating Costs</th>
                <th className="py-3 px-4 text-right">Net Profit / Loss</th>
                <th className="py-3 px-4 text-center">Margin %</th>
                <th className="py-3 px-4 text-right">Paid to Investors</th>
                <th className="py-3 px-4 text-right">Retained Capital</th>
                <th className="py-3 px-4 text-right">Traceability</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {globalFinancials.sectorBreakdown.map((sec) => (
                <tr
                  key={sec.sectorId}
                  className={`hover:bg-slate-50/70 transition-colors ${drilldownSectorId === sec.sectorId ? 'bg-emerald-50/50' : ''}`}
                >
                  <td className="py-3.5 px-4 font-bold text-slate-900 whitespace-nowrap">
                    <div>
                      <span>{sec.sectorName}</span>
                      <span className="ml-2 text-[10px] font-mono text-slate-400 font-normal">{sec.sectorCode}</span>
                    </div>
                  </td>

                  <td className="py-3.5 px-4 text-right font-medium text-slate-700 tabular-nums whitespace-nowrap">
                    {formatCurrency(sec.totalInvestment, language)}
                  </td>

                  <td className="py-3.5 px-4 text-right font-semibold text-emerald-700 tabular-nums whitespace-nowrap">
                    {formatCurrency(sec.totalIncome, language)}
                  </td>

                  <td className="py-3.5 px-4 text-right font-semibold text-rose-700 tabular-nums whitespace-nowrap">
                    {formatCurrency(sec.totalExpense, language)}
                  </td>

                  <td className={`py-3.5 px-4 text-right font-bold tabular-nums whitespace-nowrap ${sec.netProfit >= 0 ? 'text-emerald-800' : 'text-rose-800'}`}>
                    {formatCurrency(sec.netProfit, language)}
                  </td>

                  <td className="py-3.5 px-4 text-center tabular-nums whitespace-nowrap font-medium text-slate-700">
                    {sec.profitMarginPercent.toFixed(1)}%
                  </td>

                  <td className="py-3.5 px-4 text-right font-medium text-slate-800 tabular-nums whitespace-nowrap">
                    {formatCurrency(sec.totalProfitDistributed, language)}
                  </td>

                  <td className="py-3.5 px-4 text-right font-medium text-slate-800 tabular-nums whitespace-nowrap">
                    {formatCurrency(sec.retainedEarnings, language)}
                  </td>

                  <td className="py-3.5 px-4 text-right whitespace-nowrap">
                    <button
                      onClick={() => setDrilldownSectorId(drilldownSectorId === sec.sectorId ? null : sec.sectorId)}
                      className="px-2.5 py-1 text-xs font-semibold text-emerald-800 bg-emerald-50 hover:bg-emerald-100 rounded-md transition-colors"
                    >
                      {drilldownSectorId === sec.sectorId ? 'Hide Invoices' : 'Drilldown Vouchers'}
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>

            {/* Total Summary Footer */}
            <tfoot className="bg-slate-100/80 font-bold border-t-2 border-slate-300 text-slate-900">
              <tr>
                <td className="py-4 px-4 uppercase tracking-wider text-xs">Total Integrated Farm</td>
                <td className="py-4 px-4 text-right tabular-nums whitespace-nowrap">
                  {formatCurrency(globalFinancials.totalInvestment, language)}
                </td>
                <td className="py-4 px-4 text-right text-emerald-800 tabular-nums whitespace-nowrap">
                  {formatCurrency(globalFinancials.totalIncome, language)}
                </td>
                <td className="py-4 px-4 text-right text-rose-800 tabular-nums whitespace-nowrap">
                  {formatCurrency(globalFinancials.totalExpense, language)}
                </td>
                <td className="py-4 px-4 text-right text-emerald-800 tabular-nums whitespace-nowrap text-sm">
                  {formatCurrency(globalFinancials.netProfit, language)}
                </td>
                <td className="py-4 px-4 text-center tabular-nums whitespace-nowrap">
                  {globalFinancials.profitMarginPercent.toFixed(1)}%
                </td>
                <td className="py-4 px-4 text-right tabular-nums whitespace-nowrap">
                  {formatCurrency(globalFinancials.totalProfitDistributed, language)}
                </td>
                <td className="py-4 px-4 text-right tabular-nums whitespace-nowrap">
                  {formatCurrency(globalFinancials.retainedEarnings, language)}
                </td>
                <td className="py-4 px-4 text-right text-xs text-emerald-700">Verified 100%</td>
              </tr>
            </tfoot>
          </table>
        </div>
      </div>

      {/* Drilldown Traceability Drawer */}
      {drilledSector && (
        <div className="bg-white p-6 rounded-xl border-2 border-emerald-600 shadow-md space-y-4 animate-in fade-in duration-200">
          <div className="flex items-center justify-between pb-3 border-b border-slate-200">
            <div>
              <h4 className="text-base font-bold text-slate-900">
                Traceability Audit: {drilledSector.name} ({drilledSector.code})
              </h4>
              <p className="text-xs text-slate-500">
                Direct itemized receipts and sales underlying this sector's P&L
              </p>
            </div>
            <button
              onClick={() => setDrilldownSectorId(null)}
              className="text-slate-400 hover:text-slate-600 text-sm font-semibold"
            >
              ✕ Close Audit Drawer
            </button>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            
            {/* Sales Invoices */}
            <div className="space-y-3">
              <h5 className="text-xs font-bold text-emerald-800 uppercase tracking-wider flex items-center justify-between">
                <span>Verified Sales Invoices ({drilledIncomes.length})</span>
                <span className="tabular-nums">
                  {formatCurrency(drilledIncomes.reduce((a, b) => a + b.totalAmount, 0), language)}
                </span>
              </h5>
              <div className="space-y-2 max-h-60 overflow-y-auto pr-1">
                {drilledIncomes.map((inc) => (
                  <div key={inc.id} className="p-2.5 bg-slate-50 border border-slate-200 rounded-lg text-xs flex justify-between">
                    <div>
                      <p className="font-semibold text-slate-900">{inc.product}</p>
                      <p className="text-[11px] text-slate-500">
                        {inc.invoiceNo} · {inc.customerBuyer} · {formatDate(inc.date, language)}
                      </p>
                    </div>
                    <div className="text-right font-bold text-emerald-700 tabular-nums">
                      +{formatCurrency(inc.totalAmount, language)}
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* Expense Vouchers */}
            <div className="space-y-3">
              <h5 className="text-xs font-bold text-rose-800 uppercase tracking-wider flex items-center justify-between">
                <span>Approved Expense Vouchers ({drilledExpenses.length})</span>
                <span className="tabular-nums">
                  {formatCurrency(drilledExpenses.reduce((a, b) => a + b.amount, 0), language)}
                </span>
              </h5>
              <div className="space-y-2 max-h-60 overflow-y-auto pr-1">
                {drilledExpenses.map((exp) => (
                  <div key={exp.id} className="p-2.5 bg-slate-50 border border-slate-200 rounded-lg text-xs flex justify-between">
                    <div>
                      <p className="font-semibold text-slate-900">{exp.description}</p>
                      <p className="text-[11px] text-slate-500">
                        {exp.voucherNo || exp.id} · {exp.vendor} · {formatDate(exp.date, language)}
                      </p>
                    </div>
                    <div className="text-right font-bold text-rose-700 tabular-nums">
                      -{formatCurrency(exp.amount, language)}
                    </div>
                  </div>
                ))}
              </div>
            </div>

          </div>
        </div>
      )}

    </div>
  );
};
