import React, { useState } from 'react';
import { useApp } from '../context/AppContext';
import { formatCurrency, formatDate, formatNumber } from '../utils/translations';
import { APP_IMAGES } from '../utils/imageAssets';
import { 
  FileSpreadsheet, 
  Printer, 
  TrendingUp, 
  Receipt, 
  Scale, 
  Calendar, 
  Filter, 
  CheckCircle2, 
  Users, 
  Sprout,
  Download,
  FileText,
  ShieldCheck,
  Building2,
  CalendarDays,
  X
} from 'lucide-react';

export const ReportsView: React.FC = () => {
  const { db, language, t, globalFinancials, getSectorFinancials, exportCSV } = useApp();

  const [activeReportTab, setActiveReportTab] = useState<'financial' | 'sectors' | 'investors' | 'operations'>('financial');
  const [selectedSectorFilter, setSelectedSectorFilter] = useState('all');
  const [isOfficialPrintModalOpen, setIsOfficialPrintModalOpen] = useState(false);

  const handlePrint = () => {
    window.print();
  };

  const exportExcel = (filename: string, sheetTitle: string, headers: string[], rows: (string | number)[][]) => {
    const tableHtml = `
      <html xmlns:o="urn:schemas-microsoft-com:office:office" xmlns:x="urn:schemas-microsoft-com:office:excel" xmlns="http://www.w3.org/TR/REC-html40">
      <head>
        <!--[if gte mso 9]><xml><x:ExcelWorkbook><x:ExcelWorksheets><x:ExcelWorksheet><x:Name>${sheetTitle}</x:Name><x:WorksheetOptions><x:DisplayGridlines/></x:WorksheetOptions></x:ExcelWorksheet></x:ExcelWorksheets></x:ExcelWorkbook></xml><![endif]-->
        <meta http-equiv="content-type" content="text/plain; charset=UTF-8"/>
        <style>
          th { background-color: #065f46; color: #ffffff; font-weight: bold; border: 1px solid #047857; text-align: left; padding: 8px 12px; font-family: Segoe UI, Arial, sans-serif; font-size: 11pt; }
          td { border: 1px solid #cbd5e1; padding: 6px 12px; font-family: Segoe UI, Arial, sans-serif; font-size: 10pt; }
          .title { font-size: 14pt; font-weight: bold; color: #064e3b; margin-bottom: 8px; }
        </style>
      </head>
      <body>
        <div class="title">Ahmadun Agro (আহমাদুন এগ্রো) - ${sheetTitle}</div>
        <div>Generated Date: ${new Date().toISOString().slice(0, 10)} | Currency: BDT (৳)</div>
        <br/>
        <table>
          <thead>
            <tr>${headers.map(h => `<th>${h}</th>`).join('')}</tr>
          </thead>
          <tbody>
            ${rows.map(r => `<tr>${r.map(c => `<td>${c ?? ''}</td>`).join('')}</tr>`).join('')}
          </tbody>
        </table>
      </body>
      </html>
    `;
    const blob = new Blob([tableHtml], { type: 'application/vnd.ms-excel;charset=utf-8' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.setAttribute('download', `${filename}.xls`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
  };

  const handleExportExcel = () => {
    if (activeReportTab === 'financial') {
      const headers = ['Financial Metric', 'Amount (BDT / ৳)'];
      const rows = [
        ['Total Capital Investment', globalFinancials.totalInvestment],
        ['Total Verified Sales Revenue', globalFinancials.totalIncome],
        ['Total Operating Expenses', globalFinancials.totalExpense],
        ['Net Operating Profit / (Loss)', globalFinancials.netProfit],
        ['Profit Margin (%)', globalFinancials.profitMarginPercent.toFixed(2)],
        ['Total Disbursed Investor Returns', globalFinancials.totalProfitDistributed],
        ['Available Bank / Cash Liquidity', globalFinancials.cashBalance],
      ];
      exportExcel('Ahmadun_Agro_Financial_Statement', 'Executive Financials', headers, rows);
    } else if (activeReportTab === 'sectors') {
      const headers = ['Sector Name', 'Sector Code', 'Land Area', 'Raised Capital (BDT)', 'Gross Sales (BDT)', 'Operating Cost (BDT)', 'Net Profit (BDT)', 'Profit Margin (%)'];
      const rows = globalFinancials.sectorBreakdown.map((s) => [
        s.sectorName,
        s.sectorCode,
        db.sectors.find((sec) => sec.id === s.sectorId)?.totalArea || 'N/A',
        s.totalInvestment,
        s.totalIncome,
        s.totalExpense,
        s.netProfit,
        s.profitMarginPercent.toFixed(2),
      ]);
      exportExcel('Ahmadun_Agro_Sector_Performance', 'Sector Breakdown', headers, rows);
    } else if (activeReportTab === 'investors') {
      const headers = ['Investor Name', 'Phone Number', 'NID / Passport', 'Total Invested (BDT)', 'Disbursed Profit (BDT)', 'Account Status'];
      const rows = db.investors.map((inv) => {
        const invInvestments = db.investments.filter((i) => i.investorId === inv.id);
        const totalInv = invInvestments.reduce((sum, i) => sum + i.amount, 0);
        const invPayouts = db.profitDistributions.filter((d) => d.investorId === inv.id && d.status === 'paid');
        const totalPaid = invPayouts.reduce((sum, p) => sum + p.paidAmount, 0);
        return [inv.name, inv.phone, inv.nidPassport || inv.nid || '—', totalInv, totalPaid, inv.status];
      });
      exportExcel('Ahmadun_Agro_Investor_Ledger', 'Investor Ledger', headers, rows);
    } else {
      const headers = ['Date', 'Sector', 'Operations Conducted', 'Yield / Harvest Volume', 'Feed Consumed (Kg)', 'Labor Workers', 'Mortality Incidents'];
      const rows = db.operations.map((op) => {
        const sec = db.sectors.find((s) => s.id === op.sectorId);
        const activity = op.activities || op.incidentNotes || 'Routine operations';
        const production = op.productionDetails || (op.productionQty ? `${op.productionQty} ${op.productionUnit || 'units'}` : 'Normal');
        return [op.date, sec?.name || 'Sector', activity, production, op.feedConsumedKg, op.laborCount, op.mortalityCount];
      });
      exportExcel('Ahmadun_Agro_Farm_Operations_Log', 'Operations Log', headers, rows);
    }
  };

  const handleExportCSV = () => {
    if (activeReportTab === 'financial') {
      const headers = ['Metric', 'Amount (BDT)'];
      const rows = [
        ['Total Capital Investment', globalFinancials.totalInvestment],
        ['Total Verified Sales Revenue', globalFinancials.totalIncome],
        ['Total Operating Expenses', globalFinancials.totalExpense],
        ['Net Profit (Loss)', globalFinancials.netProfit],
        ['Profit Margin (%)', globalFinancials.profitMarginPercent.toFixed(2)],
        ['Total Disbursed Returns', globalFinancials.totalProfitDistributed],
        ['Cash & Bank Balance', globalFinancials.cashBalance],
      ];
      exportCSV('Financial_Executive_Summary', headers, rows);
    } else if (activeReportTab === 'sectors') {
      const headers = ['Sector', 'Code', 'Area', 'Capital (BDT)', 'Revenue (BDT)', 'Expenses (BDT)', 'Net Profit (BDT)', 'Margin (%)'];
      const rows = globalFinancials.sectorBreakdown.map((s) => [
        s.sectorName,
        s.sectorCode,
        db.sectors.find((sec) => sec.id === s.sectorId)?.totalArea || 'N/A',
        s.totalInvestment,
        s.totalIncome,
        s.totalExpense,
        s.netProfit,
        s.profitMarginPercent.toFixed(2),
      ]);
      exportCSV('Sector_Comparative_Report', headers, rows);
    } else if (activeReportTab === 'investors') {
      const headers = ['Investor Name', 'Phone', 'NID', 'Total Invested (BDT)', 'Paid Profit (BDT)', 'Status'];
      const rows = db.investors.map((inv) => {
        const invInvestments = db.investments.filter((i) => i.investorId === inv.id);
        const totalInv = invInvestments.reduce((sum, i) => sum + i.amount, 0);
        const invPayouts = db.profitDistributions.filter((d) => d.investorId === inv.id && d.status === 'paid');
        const totalPaid = invPayouts.reduce((sum, p) => sum + p.paidAmount, 0);
        return [inv.name, inv.phone, inv.nidPassport || inv.nid || '—', totalInv, totalPaid, inv.status];
      });
      exportCSV('Investor_Capital_and_Returns_Report', headers, rows);
    } else {
      const headers = ['Date', 'Sector', 'Activities', 'Yield / Production', 'Feed (Kg)', 'Labor Workers', 'Mortality'];
      const rows = db.operations.map((op) => {
        const sec = db.sectors.find((s) => s.id === op.sectorId);
        const activity = op.activities || op.incidentNotes || 'Routine operations';
        const production = op.productionDetails || (op.productionQty ? `${op.productionQty} ${op.productionUnit || 'units'}` : 'Normal');
        return [op.date, sec?.name || 'Sector', activity, production, op.feedConsumedKg, op.laborCount, op.mortalityCount];
      });
      exportCSV('Farm_Operations_Field_Report', headers, rows);
    }
  };

  return (
    <div className="space-y-6">
      
      {/* Top Header Bar */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-2 border-b border-slate-200">
        <div>
          <h1 className="text-xl sm:text-2xl font-bold text-slate-900 tracking-tight">
            {t.reports}
          </h1>
          <p className="text-xs text-slate-500 mt-0.5">
            {language === 'bn' 
              ? 'প্রাতিষ্ঠানিক আর্থিক বিবরণী, সেক্টর পারফরম্যান্স ও অডিট প্রিন্টআউট' 
              : 'Institutional financial audit statements, investor performance reports & certified exports'}
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-2">
          <button
            onClick={() => setIsOfficialPrintModalOpen(true)}
            className="px-3.5 py-1.5 text-xs font-semibold text-emerald-900 bg-emerald-50 border border-emerald-300 hover:bg-emerald-100 rounded-lg transition-colors flex items-center gap-1.5 shadow-2xs"
          >
            <FileText className="w-3.5 h-3.5 text-emerald-700" />
            <span>Official Statement / PDF</span>
          </button>

          <button
            onClick={handleExportExcel}
            className="px-3 py-1.5 text-xs font-medium text-slate-700 bg-white border border-slate-300 hover:bg-slate-50 rounded-lg transition-colors flex items-center gap-1.5 shadow-2xs"
          >
            <FileSpreadsheet className="w-3.5 h-3.5 text-emerald-700" />
            <span>Export Excel (.xls)</span>
          </button>

          <button
            onClick={handleExportCSV}
            className="px-3 py-1.5 text-xs font-medium text-slate-700 bg-white border border-slate-300 hover:bg-slate-50 rounded-lg transition-colors flex items-center gap-1.5 shadow-2xs"
          >
            <Download className="w-3.5 h-3.5 text-slate-600" />
            <span>Export CSV</span>
          </button>
        </div>
      </div>

      {/* Report Category Switcher Tabs */}
      <div className="flex items-center gap-2 overflow-x-auto pb-1 border-b border-slate-200">
        <button
          onClick={() => setActiveReportTab('financial')}
          className={`px-3.5 py-2 text-xs font-semibold rounded-lg transition-colors whitespace-nowrap ${
            activeReportTab === 'financial'
              ? 'bg-emerald-700 text-white shadow-xs'
              : 'bg-white text-slate-700 border border-slate-200 hover:bg-slate-50'
          }`}
        >
          Executive Financial Statement
        </button>

        <button
          onClick={() => setActiveReportTab('sectors')}
          className={`px-3.5 py-2 text-xs font-semibold rounded-lg transition-colors whitespace-nowrap ${
            activeReportTab === 'sectors'
              ? 'bg-emerald-700 text-white shadow-xs'
              : 'bg-white text-slate-700 border border-slate-200 hover:bg-slate-50'
          }`}
        >
          Sector Comparative Performance
        </button>

        <button
          onClick={() => setActiveReportTab('investors')}
          className={`px-3.5 py-2 text-xs font-semibold rounded-lg transition-colors whitespace-nowrap ${
            activeReportTab === 'investors'
              ? 'bg-emerald-700 text-white shadow-xs'
              : 'bg-white text-slate-700 border border-slate-200 hover:bg-slate-50'
          }`}
        >
          Investor Capital & Returns Ledger
        </button>

        <button
          onClick={() => setActiveReportTab('operations')}
          className={`px-3.5 py-2 text-xs font-semibold rounded-lg transition-colors whitespace-nowrap ${
            activeReportTab === 'operations'
              ? 'bg-emerald-700 text-white shadow-xs'
              : 'bg-white text-slate-700 border border-slate-200 hover:bg-slate-50'
          }`}
        >
          Production & Operational Yield
        </button>
      </div>

      {/* REPORT CONTENT VIEW */}
      {activeReportTab === 'financial' && (
        <div className="bg-white p-6 rounded-xl border border-slate-200 shadow-xs space-y-6">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between pb-4 border-b border-slate-100 gap-2">
            <div>
              <h2 className="text-base font-bold text-slate-900">Farm Comprehensive Profit & Loss Statement</h2>
              <p className="text-xs text-slate-500">Consolidated accounting ledger derived from verified transactions</p>
            </div>
            <div className="text-right">
              <span className="text-xs text-slate-400 block">Currency</span>
              <span className="text-xs font-bold text-slate-700">Bangladeshi Taka (BDT ৳)</span>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
            <div className="p-4 bg-slate-50 rounded-xl border border-slate-200">
              <span className="text-xs text-slate-500 block">Total Investment Raised</span>
              <span className="text-xl font-bold text-slate-900 tabular-nums">
                {formatCurrency(globalFinancials.totalInvestment, language)}
              </span>
              <span className="text-[11px] text-slate-400 block mt-1">Across 5 Active Sectors</span>
            </div>

            <div className="p-4 bg-emerald-50/50 rounded-xl border border-emerald-200">
              <span className="text-xs text-emerald-800 block">Gross Sales Revenue</span>
              <span className="text-xl font-bold text-emerald-700 tabular-nums">
                {formatCurrency(globalFinancials.totalIncome, language)}
              </span>
              <span className="text-[11px] text-emerald-600 block mt-1">From Verified Sales Invoices</span>
            </div>

            <div className="p-4 bg-rose-50/50 rounded-xl border border-rose-200">
              <span className="text-xs text-rose-800 block">Total Operating Expenses</span>
              <span className="text-xl font-bold text-rose-700 tabular-nums">
                {formatCurrency(globalFinancials.totalExpense, language)}
              </span>
              <span className="text-[11px] text-rose-600 block mt-1">Feed, Labor, Medication & Capex</span>
            </div>

            <div className="p-4 bg-blue-50/50 rounded-xl border border-blue-200">
              <span className="text-xs text-blue-800 block">Net Operating Profit</span>
              <span className="text-xl font-bold text-blue-700 tabular-nums">
                {formatCurrency(globalFinancials.netProfit, language)}
              </span>
              <span className="text-[11px] text-blue-600 block mt-1">
                Margin: {globalFinancials.profitMarginPercent.toFixed(1)}%
              </span>
            </div>
          </div>

          <div className="pt-2">
            <h3 className="text-xs font-bold text-slate-800 uppercase tracking-wider mb-3">Institutional Ledger Summary</h3>
            <div className="border border-slate-200 rounded-lg overflow-hidden">
              <table className="w-full text-xs text-left">
                <thead className="bg-slate-50 text-slate-600 font-semibold border-b border-slate-200">
                  <tr>
                    <th className="py-2.5 px-4">Financial Ledger Component</th>
                    <th className="py-2.5 px-4 text-right">Amount (BDT)</th>
                    <th className="py-2.5 px-4 text-slate-500">Accounting Treatment</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  <tr>
                    <td className="py-2.5 px-4 font-semibold text-slate-800">Gross Agricultural Sales</td>
                    <td className="py-2.5 px-4 text-right font-bold text-emerald-700 tabular-nums">{formatCurrency(globalFinancials.totalIncome, language)}</td>
                    <td className="py-2.5 px-4 text-slate-500">Credited to Operating Revenue</td>
                  </tr>
                  <tr>
                    <td className="py-2.5 px-4 font-semibold text-slate-800">Direct Cost of Goods & Operations</td>
                    <td className="py-2.5 px-4 text-right font-bold text-rose-700 tabular-nums">({formatCurrency(globalFinancials.totalExpense, language)})</td>
                    <td className="py-2.5 px-4 text-slate-500">Debited from Operating Accounts</td>
                  </tr>
                  <tr className="bg-slate-50/50">
                    <td className="py-2.5 px-4 font-bold text-slate-900">Net Farm Earnings Before Distribution</td>
                    <td className="py-2.5 px-4 text-right font-bold text-slate-900 tabular-nums">{formatCurrency(globalFinancials.netProfit, language)}</td>
                    <td className="py-2.5 px-4 text-slate-500">P&L Balance</td>
                  </tr>
                  <tr>
                    <td className="py-2.5 px-4 font-semibold text-slate-800">Disbursed Investor Profits</td>
                    <td className="py-2.5 px-4 text-right font-bold text-amber-700 tabular-nums">({formatCurrency(globalFinancials.totalProfitDistributed, language)})</td>
                    <td className="py-2.5 px-4 text-slate-500">Paid to Partner Investors</td>
                  </tr>
                  <tr className="bg-emerald-50/40">
                    <td className="py-2.5 px-4 font-bold text-emerald-950">Retained Farm Capital & Growth Reserve</td>
                    <td className="py-2.5 px-4 text-right font-bold text-emerald-800 tabular-nums">{formatCurrency(globalFinancials.retainedEarnings, language)}</td>
                    <td className="py-2.5 px-4 text-emerald-700 font-medium">Reinvested in Expansion</td>
                  </tr>
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      {activeReportTab === 'sectors' && (
        <div className="bg-white rounded-xl border border-slate-200 shadow-xs overflow-hidden">
          <div className="p-5 border-b border-slate-200">
            <h3 className="text-sm font-bold text-slate-900">Sector Comparative Ledger</h3>
            <p className="text-xs text-slate-500">Direct comparison across duck, poultry, goat, pigeon & vegetable units</p>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-xs text-left">
              <thead className="bg-slate-50 text-slate-600 font-semibold border-b border-slate-200">
                <tr>
                  <th className="py-3 px-4">Sector Name</th>
                  <th className="py-3 px-4">Code</th>
                  <th className="py-3 px-4 text-right">Raised Capital</th>
                  <th className="py-3 px-4 text-right">Sales Revenue</th>
                  <th className="py-3 px-4 text-right">Operating Cost</th>
                  <th className="py-3 px-4 text-right">Net Profit</th>
                  <th className="py-3 px-4 text-center">Profit Margin</th>
                  <th className="py-3 px-4 text-right">ROI (%)</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {globalFinancials.sectorBreakdown.map((sec) => (
                  <tr key={sec.sectorId} className="hover:bg-slate-50/70">
                    <td className="py-3 px-4 font-bold text-slate-900 whitespace-nowrap">{sec.sectorName}</td>
                    <td className="py-3 px-4 font-mono text-slate-500">{sec.sectorCode}</td>
                    <td className="py-3 px-4 text-right font-medium text-slate-800 tabular-nums">{formatCurrency(sec.totalInvestment, language)}</td>
                    <td className="py-3 px-4 text-right font-bold text-emerald-700 tabular-nums">{formatCurrency(sec.totalIncome, language)}</td>
                    <td className="py-3 px-4 text-right font-medium text-rose-700 tabular-nums">{formatCurrency(sec.totalExpense, language)}</td>
                    <td className="py-3 px-4 text-right font-bold text-slate-900 tabular-nums">{formatCurrency(sec.netProfit, language)}</td>
                    <td className="py-3 px-4 text-center font-bold">
                      <span className={`px-2 py-0.5 rounded text-[11px] ${sec.profitMarginPercent >= 0 ? 'bg-emerald-100 text-emerald-800' : 'bg-rose-100 text-rose-800'}`}>
                        {sec.profitMarginPercent.toFixed(1)}%
                      </span>
                    </td>
                    <td className="py-3 px-4 text-right font-semibold text-slate-800 tabular-nums">
                      {sec.roiPercent.toFixed(1)}%
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {activeReportTab === 'investors' && (
        <div className="bg-white rounded-xl border border-slate-200 shadow-xs overflow-hidden">
          <div className="p-5 border-b border-slate-200">
            <h3 className="text-sm font-bold text-slate-900">Investor Capital & Distribution Schedule</h3>
            <p className="text-xs text-slate-500">Comprehensive list of verified investors, committed capital, and paid yields</p>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-xs text-left">
              <thead className="bg-slate-50 text-slate-600 font-semibold border-b border-slate-200">
                <tr>
                  <th className="py-3 px-4">Investor Name</th>
                  <th className="py-3 px-4">Contact Phone</th>
                  <th className="py-3 px-4">NID / Passport</th>
                  <th className="py-3 px-4 text-right">Total Invested</th>
                  <th className="py-3 px-4 text-right">Paid Returns</th>
                  <th className="py-3 px-4 text-center">Status</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {db.investors.map((inv) => {
                  const invInvestments = db.investments.filter((i) => i.investorId === inv.id);
                  const totalInv = invInvestments.reduce((sum, i) => sum + i.amount, 0);
                  const invPayouts = db.profitDistributions.filter((d) => d.investorId === inv.id && d.status === 'paid');
                  const totalPaid = invPayouts.reduce((sum, p) => sum + p.paidAmount, 0);

                  return (
                    <tr key={inv.id} className="hover:bg-slate-50/70">
                      <td className="py-3 px-4 font-bold text-slate-900">{inv.name}</td>
                      <td className="py-3 px-4 text-slate-600">{inv.phone}</td>
                      <td className="py-3 px-4 font-mono text-slate-500">{inv.nidPassport || inv.nid || '—'}</td>
                      <td className="py-3 px-4 text-right font-bold text-slate-900 tabular-nums">{formatCurrency(totalInv, language)}</td>
                      <td className="py-3 px-4 text-right font-bold text-emerald-700 tabular-nums">{formatCurrency(totalPaid, language)}</td>
                      <td className="py-3 px-4 text-center">
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
      )}

      {activeReportTab === 'operations' && (
        <div className="bg-white rounded-xl border border-slate-200 shadow-xs overflow-hidden">
          <div className="p-5 border-b border-slate-200">
            <h3 className="text-sm font-bold text-slate-900">Daily Operations & Production Logs</h3>
            <p className="text-xs text-slate-500">Field-level logs, feed consumption, and mortality traceability</p>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-xs text-left">
              <thead className="bg-slate-50 text-slate-600 font-semibold border-b border-slate-200">
                <tr>
                  <th className="py-3 px-4">Date</th>
                  <th className="py-3 px-4">Sector</th>
                  <th className="py-3 px-4">Activities</th>
                  <th className="py-3 px-4">Output / Harvest</th>
                  <th className="py-3 px-4 text-right">Feed (Kg)</th>
                  <th className="py-3 px-4 text-center">Labor</th>
                  <th className="py-3 px-4 text-center">Mortality</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {db.operations.map((op) => {
                  const sec = db.sectors.find((s) => s.id === op.sectorId);

                  return (
                    <tr key={op.id} className="hover:bg-slate-50/70">
                      <td className="py-3 px-4 text-slate-500 tabular-nums whitespace-nowrap">{formatDate(op.date, language)}</td>
                      <td className="py-3 px-4 font-semibold text-slate-900 whitespace-nowrap">{sec?.name}</td>
                      <td className="py-3 px-4 text-slate-700 max-w-xs truncate">{op.activities || op.incidentNotes || 'Routine operations'}</td>
                      <td className="py-3 px-4 font-medium text-emerald-800 max-w-xs truncate">{op.productionDetails || (op.productionQty ? `${op.productionQty} ${op.productionUnit || 'units'}` : 'Normal')}</td>
                      <td className="py-3 px-4 text-right tabular-nums text-slate-800">{op.feedConsumedKg}</td>
                      <td className="py-3 px-4 text-center text-slate-600">{op.laborCount}</td>
                      <td className={`py-3 px-4 text-center tabular-nums font-bold ${op.mortalityCount > 0 ? 'text-rose-700' : 'text-slate-600'}`}>
                        {op.mortalityCount}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* OFFICIAL AUDIT STATEMENT MODAL FOR PRINT / PDF */}
      {isOfficialPrintModalOpen && (
        <div className="fixed inset-0 z-50 overflow-y-auto bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl max-w-4xl w-full p-8 shadow-2xl border border-slate-200 space-y-6">
            <div className="flex justify-between items-start border-b border-slate-200 pb-4">
              <div className="flex items-center gap-3">
                <div className="w-12 h-12 bg-white rounded-xl flex items-center justify-center p-1 shadow-xs border border-emerald-200">
                  <img
                    src={APP_IMAGES.logo}
                    alt="Ahmadun Agro Logo"
                    referrerPolicy="no-referrer"
                    className="w-full h-full object-contain"
                    onError={(e) => {
                      (e.currentTarget as HTMLImageElement).src = APP_IMAGES.logoSvg;
                    }}
                  />
                </div>
                <div>
                  <h2 className="text-xl font-bold text-slate-900">Ahmadun Agro · আহমাদুন এগ্রো</h2>
                  <p className="text-xs text-slate-500">Govt. Reg # AGRO-BD-2024-8891 | Gazipur & Kishoreganj Haor Belt, Bangladesh</p>
                </div>
              </div>

              <div className="flex items-center gap-2">
                <button
                  onClick={handlePrint}
                  className="px-3.5 py-1.5 text-xs font-semibold text-white bg-emerald-700 hover:bg-emerald-800 rounded-lg flex items-center gap-1.5"
                >
                  <Printer className="w-3.5 h-3.5" />
                  <span>Print / Save as PDF</span>
                </button>
                <button
                  onClick={() => setIsOfficialPrintModalOpen(false)}
                  className="text-slate-400 hover:text-slate-600 p-1"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>
            </div>

            <div className="text-center py-2">
              <h3 className="text-lg font-bold text-slate-900 uppercase tracking-wide">
                Consolidated Agricultural Audit & Financial Statement
              </h3>
              <p className="text-xs text-slate-500 mt-1">
                Statement Date: {new Date().toLocaleDateString('en-GB')} · Certified Audited Accounts
              </p>
            </div>

            <div className="grid grid-cols-3 gap-4 border border-slate-200 rounded-xl p-4 bg-slate-50/70 text-xs">
              <div>
                <span className="text-slate-500 block">Total Capital Raised:</span>
                <strong className="text-sm text-slate-900">{formatCurrency(globalFinancials.totalInvestment, language)}</strong>
              </div>
              <div>
                <span className="text-slate-500 block">Net Operating Profit:</span>
                <strong className="text-sm text-emerald-800">{formatCurrency(globalFinancials.netProfit, language)}</strong>
              </div>
              <div>
                <span className="text-slate-500 block">Disbursed Investor Returns:</span>
                <strong className="text-sm text-blue-800">{formatCurrency(globalFinancials.totalProfitDistributed, language)}</strong>
              </div>
            </div>

            <div>
              <h4 className="text-xs font-bold text-slate-800 uppercase mb-2">Sector-Wise Financial Breakdown</h4>
              <table className="w-full text-xs text-left border border-slate-200">
                <thead className="bg-slate-100 text-slate-700">
                  <tr>
                    <th className="p-2 border">Sector</th>
                    <th className="p-2 border text-right">Capital (BDT)</th>
                    <th className="p-2 border text-right">Revenue (BDT)</th>
                    <th className="p-2 border text-right">Expenses (BDT)</th>
                    <th className="p-2 border text-right">Net Profit (BDT)</th>
                    <th className="p-2 border text-center">Margin</th>
                  </tr>
                </thead>
                <tbody>
                  {globalFinancials.sectorBreakdown.map((s) => (
                    <tr key={s.sectorId}>
                      <td className="p-2 border font-medium text-slate-900">{s.sectorName}</td>
                      <td className="p-2 border text-right">{formatCurrency(s.totalInvestment, language)}</td>
                      <td className="p-2 border text-right text-emerald-700 font-semibold">{formatCurrency(s.totalIncome, language)}</td>
                      <td className="p-2 border text-right text-rose-700">{formatCurrency(s.totalExpense, language)}</td>
                      <td className="p-2 border text-right font-bold">{formatCurrency(s.netProfit, language)}</td>
                      <td className="p-2 border text-center font-bold">{s.profitMarginPercent.toFixed(1)}%</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            <div className="pt-8 grid grid-cols-3 gap-6 text-center text-xs">
              <div className="border-t border-slate-400 pt-2">
                <span className="font-bold text-slate-800 block">Dr. Anisur Rahman</span>
                <span className="text-[11px] text-slate-500">Managing Director & CEO</span>
              </div>
              <div className="border-t border-slate-400 pt-2">
                <span className="font-bold text-slate-800 block">Fatema Tuz Johra, FCA</span>
                <span className="text-[11px] text-slate-500">Chief Financial Officer</span>
              </div>
              <div className="border-t border-slate-400 pt-2">
                <span className="font-bold text-slate-800 block">Engr. Kamrul Hasan</span>
                <span className="text-[11px] text-slate-500">Internal Audit & Transparency Lead</span>
              </div>
            </div>
          </div>
        </div>
      )}

    </div>
  );
};
