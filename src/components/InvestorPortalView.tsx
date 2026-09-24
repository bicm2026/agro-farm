import React, { useState } from 'react';
import { useApp } from '../context/AppContext';
import { formatCurrency, formatDate, formatNumber } from '../utils/translations';
import { APP_IMAGES, resolveFarmImage } from '../utils/imageAssets';
import { 
  Building2, 
  Wallet, 
  TrendingUp, 
  Receipt, 
  Printer, 
  Download, 
  CheckCircle2, 
  FileText, 
  Sprout, 
  ArrowUpRight, 
  Layers, 
  Calendar,
  ShieldCheck,
  Camera
} from 'lucide-react';

export const InvestorPortalView: React.FC = () => {
  const { db, currentUser, language, t, getInvestorFinancials, getSectorFinancials, exportCSV, showToast } = useApp();

  // If currentUser is an investor, use their ID; otherwise default to first investor for preview/testing
  const defaultInvestorId =
    currentUser.role === 'investor' && currentUser.investorId
      ? currentUser.investorId
      : db.investors[0]?.id || '';

  const [activeInvestorId, setActiveInvestorId] = useState(defaultInvestorId);

  const activeInvestor = db.investors.find((i) => i.id === activeInvestorId) || db.investors[0];
  const investorData = getInvestorFinancials(activeInvestor?.id || '');

  // Active sector tab within investor's portfolio
  const [selectedSectorId, setSelectedSectorId] = useState<string>(
    investorData.sectorsInvested[0]?.sectorId || db.sectors[0]?.id || ''
  );

  const activeSector = db.sectors.find((s) => s.id === selectedSectorId);
  const activeSectorFinancials = activeSector ? getSectorFinancials(activeSector.id) : null;

  // Investor's contracts for this sector
  const investorContracts = db.investments.filter(
    (inv) => inv.investorId === activeInvestor?.id && (!selectedSectorId || inv.sectorId === selectedSectorId)
  );

  // Investor's payouts for this sector
  const investorPayouts = db.profitDistributions.filter(
    (p) => p.investorId === activeInvestor?.id && (!selectedSectorId || p.sectorId === selectedSectorId)
  );

  // Sector daily operations
  const sectorOperations = db.operations.filter((op) => op.sectorId === selectedSectorId);

  // Sector documents
  const sectorDocs = db.documents.filter(
    (d) => (d.sectorId === selectedSectorId || d.investorId === activeInvestor?.id)
  );

  const handlePrintStatement = () => {
    window.print();
  };

  const handleDownloadStatementCSV = () => {
    const headers = [
      'Statement for',
      'Sector',
      'Contract ID',
      'Investment Date',
      'Invested Capital (BDT)',
      'Profit Share (%)',
      'Cumulative Paid Profit (BDT)',
      'Pending Profit (BDT)',
      'Status',
    ];

    const rows = investorData.sectorsInvested.map((s) => [
      activeInvestor.name,
      s.sectorName,
      s.investmentId,
      s.investmentDate,
      s.investedAmount,
      s.profitSharePercentage,
      s.totalPaidProfit,
      s.pendingProfit,
      s.status,
    ]);

    exportCSV(`Investor_Statement_${activeInvestor.name.replace(/\s+/g, '_')}`, headers, rows);
  };

  return (
    <div className="space-y-6">
      
      {/* Top Header Bar & Investor Switcher (for Admin/Testing) */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-2 border-b border-slate-200">
        <div>
          <div className="flex items-center gap-2">
            <h1 className="text-xl sm:text-2xl font-bold text-slate-900 tracking-tight">
              {t.investorPortal}
            </h1>
            <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-emerald-100 text-emerald-800">
              Verified Investor
            </span>
          </div>
          <p className="text-xs text-slate-500 mt-0.5">
            {language === 'bn' 
              ? 'ব্যক্তিগত পোর্টফোলিও, সেক্টরভিত্তিক আর্থিক স্বচ্ছতা ও মুনাফা বিবরণী' 
              : 'Isolated personal investor portfolio, certified sector performance & quarterly return ledger'}
          </p>
        </div>

        <div className="flex items-center gap-2">
          {currentUser.role !== 'investor' && (
            <div className="flex items-center gap-1.5 mr-2">
              <span className="text-xs text-slate-500 font-medium">Viewing as:</span>
              <select
                value={activeInvestorId}
                onChange={(e) => {
                  setActiveInvestorId(e.target.value);
                  const newInvData = getInvestorFinancials(e.target.value);
                  if (newInvData.sectorsInvested[0]) {
                    setSelectedSectorId(newInvData.sectorsInvested[0].sectorId);
                  }
                }}
                className="px-2.5 py-1.5 text-xs font-semibold text-slate-800 bg-white border border-slate-300 rounded-lg shadow-xs"
              >
                {db.investors.map((inv) => (
                  <option key={inv.id} value={inv.id}>
                    {inv.name} ({inv.nidPassport})
                  </option>
                ))}
              </select>
            </div>
          )}

          <button
            onClick={handlePrintStatement}
            className="px-3 py-1.5 text-xs font-medium text-slate-700 bg-white border border-slate-300 hover:bg-slate-50 rounded-lg transition-colors flex items-center gap-1.5"
          >
            <Printer className="w-3.5 h-3.5 text-slate-500" />
            <span>Print Official Statement</span>
          </button>

          <button
            onClick={handleDownloadStatementCSV}
            className="px-3 py-1.5 text-xs font-semibold text-white bg-emerald-700 hover:bg-emerald-800 rounded-lg shadow-xs transition-colors flex items-center gap-1.5"
          >
            <Download className="w-3.5 h-3.5" />
            <span>Download CSV</span>
          </button>
        </div>
      </div>

      {/* Investor Profile Summary Card */}
      <div className="bg-white p-5 rounded-xl border border-slate-200 shadow-xs flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div className="flex items-center gap-3.5">
          <div className="w-12 h-12 rounded-xl bg-emerald-100 text-emerald-800 flex items-center justify-center font-bold text-lg shrink-0">
            {activeInvestor.name.slice(0, 2).toUpperCase()}
          </div>
          <div>
            <h2 className="text-base font-bold text-slate-900">{activeInvestor.name}</h2>
            <div className="flex flex-wrap items-center gap-3 text-xs text-slate-500 mt-0.5">
              <span>NID: <strong className="text-slate-700 font-mono">{activeInvestor.nidPassport}</strong></span>
              <span>Phone: <strong className="text-slate-700 font-mono">{activeInvestor.phone}</strong></span>
              <span>Bank: <strong className="text-slate-700">{activeInvestor.bankName}</strong></span>
            </div>
          </div>
        </div>

        <div className="flex items-center gap-2 self-start md:self-auto">
          <span className="text-xs text-emerald-800 bg-emerald-50 px-3 py-1.5 rounded-lg border border-emerald-200 font-medium flex items-center gap-1.5">
            <ShieldCheck className="w-4 h-4 text-emerald-600" />
            <span>Notarized Partnership Deed Verified</span>
          </span>
        </div>
      </div>

      {/* Personal Portfolio KPI Strip */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-xs">
          <span className="text-xs text-slate-500 block">Total Invested Capital</span>
          <span className="text-xl font-bold text-slate-900 tabular-nums">
            {formatCurrency(investorData.totalInvestedAmount, language)}
          </span>
          <span className="text-[11px] text-slate-400 block mt-0.5">
            Across {investorData.sectorsInvested.length} Agricultural Sector(s)
          </span>
        </div>

        <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-xs">
          <span className="text-xs text-slate-500 block">Total Disbursed Return (Paid)</span>
          <span className="text-xl font-bold text-emerald-700 tabular-nums">
            {formatCurrency(investorData.totalProfitPaid, language)}
          </span>
          <span className="text-[11px] text-emerald-700 block mt-0.5">
            Transferred to {(activeInvestor.bankName || activeInvestor.bankDetails?.bankName || 'Bank').split(' ')[0]}
          </span>
        </div>

        <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-xs">
          <span className="text-xs text-slate-500 block">Pending Return (Accrued)</span>
          <span className="text-xl font-bold text-amber-600 tabular-nums">
            {formatCurrency(investorData.totalProfitPending, language)}
          </span>
          <span className="text-[11px] text-slate-400 block mt-0.5">Scheduled Next Quarter</span>
        </div>

        <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-xs">
          <span className="text-xs text-slate-500 block">Cumulative ROI Realized</span>
          <span className="text-xl font-bold text-blue-700 tabular-nums">
            {investorData.roiPercent.toFixed(1)}%
          </span>
          <span className="text-[11px] text-slate-400 block mt-0.5">Net Realized Cash ROI</span>
        </div>
      </div>

      {/* Sector Transparency Tabs */}
      <div className="space-y-4">
        <div className="flex items-center gap-2 overflow-x-auto pb-1 border-b border-slate-200">
          <span className="text-xs font-bold text-slate-500 mr-2 whitespace-nowrap">Your Sectors:</span>
          {investorData.sectorsInvested.map((s) => (
            <button
              key={s.sectorId}
              onClick={() => setSelectedSectorId(s.sectorId)}
              className={`px-3.5 py-2 text-xs font-semibold rounded-lg transition-colors whitespace-nowrap flex items-center gap-2 ${
                selectedSectorId === s.sectorId
                  ? 'bg-emerald-700 text-white shadow-xs'
                  : 'bg-white text-slate-700 border border-slate-200 hover:bg-slate-50'
              }`}
            >
              <span>{s.sectorName}</span>
              <span className={`text-[10px] px-1.5 py-0.2 rounded font-mono ${selectedSectorId === s.sectorId ? 'bg-emerald-900 text-emerald-100' : 'bg-slate-100 text-slate-500'}`}>
                {s.profitSharePercentage}% Share
              </span>
            </button>
          ))}
        </div>

        {/* Selected Sector Deep-Dive Transparency Board */}
        {activeSector && activeSectorFinancials && (
          <div className="space-y-6">
            
            {/* Sector Live Financial Performance Card */}
            <div className="bg-white p-6 rounded-xl border border-slate-200 shadow-xs space-y-4">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 pb-3 border-b border-slate-100">
                <div>
                  <h3 className="text-base font-bold text-slate-900">
                    {language === 'bn' ? activeSector.nameBn : activeSector.name} ({activeSector.code})
                  </h3>
                  <p className="text-xs text-slate-500">
                    Live Sector Financial Ledger & Your Calculated Entitlements
                  </p>
                </div>

                <div className="text-xs text-slate-500">
                  Total Sector Capital: <strong className="text-slate-900 tabular-nums">{formatCurrency(activeSectorFinancials.totalInvestment, language)}</strong>
                </div>
              </div>

              {/* Sector P&L vs Investor Share Grid */}
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-xs">
                
                <div className="p-3 bg-slate-50 rounded-lg border border-slate-200">
                  <span className="text-slate-500 block">Entire Sector Sales Revenue</span>
                  <span className="text-base font-bold text-emerald-700 tabular-nums block mt-1">
                    {formatCurrency(activeSectorFinancials.totalIncome, language)}
                  </span>
                  <span className="text-[10px] text-slate-400">From verified wholesale buyers</span>
                </div>

                <div className="p-3 bg-slate-50 rounded-lg border border-slate-200">
                  <span className="text-slate-500 block">Sector Operating Costs</span>
                  <span className="text-base font-bold text-rose-700 tabular-nums block mt-1">
                    {formatCurrency(activeSectorFinancials.totalExpense, language)}
                  </span>
                  <span className="text-[10px] text-slate-400">Feed, labor, medicine & utility</span>
                </div>

                <div className="p-3 bg-slate-50 rounded-lg border border-slate-200">
                  <span className="text-slate-500 block">Net Sector Profit</span>
                  <span className="text-base font-bold text-slate-900 tabular-nums block mt-1">
                    {formatCurrency(activeSectorFinancials.netProfit, language)}
                  </span>
                  <span className="text-[10px] text-emerald-700 font-medium">Margin: {activeSectorFinancials.profitMarginPercent.toFixed(1)}%</span>
                </div>

                <div className="p-3 bg-emerald-50 rounded-lg border border-emerald-200">
                  <span className="text-emerald-800 font-semibold block">Your Profit Share Disbursed</span>
                  <span className="text-base font-bold text-emerald-800 tabular-nums block mt-1">
                    {formatCurrency(investorPayouts.reduce((sum, p) => sum + p.paidAmount, 0), language)}
                  </span>
                  <span className="text-[10px] text-emerald-600">Based on contract profit ratio</span>
                </div>

              </div>
            </div>

            {/* Payout & Returns History Table */}
            <div className="bg-white rounded-xl border border-slate-200 shadow-xs overflow-hidden">
              <div className="p-4 border-b border-slate-200">
                <h4 className="text-xs font-bold text-slate-900 uppercase tracking-wider">
                  Your Disbursed Payout Vouchers & Transaction IDs
                </h4>
              </div>

              <div className="overflow-x-auto">
                <table className="w-full text-xs text-left">
                  <thead className="bg-slate-50 text-slate-600 font-semibold border-b border-slate-200">
                    <tr>
                      <th className="py-2.5 px-4">Payout Date</th>
                      <th className="py-2.5 px-4">Cycle / Period</th>
                      <th className="py-2.5 px-4 text-right">Amount Received</th>
                      <th className="py-2.5 px-4">Disbursement Method</th>
                      <th className="py-2.5 px-4">Bank / MFS Reference</th>
                      <th className="py-2.5 px-4 text-center">Status</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100">
                    {investorPayouts.length === 0 ? (
                      <tr>
                        <td colSpan={6} className="py-4 text-center text-slate-400">
                          No profit payout records found for this sector yet.
                        </td>
                      </tr>
                    ) : (
                      investorPayouts.map((p) => (
                        <tr key={p.id} className="hover:bg-slate-50/70">
                          <td className="py-2.5 px-4 text-slate-500 tabular-nums">{p.paymentDate ? formatDate(p.paymentDate, language) : '—'}</td>
                          <td className="py-2.5 px-4 font-medium text-slate-800">{p.period}</td>
                          <td className="py-2.5 px-4 text-right font-bold text-emerald-700 tabular-nums">{formatCurrency(p.paidAmount, language)}</td>
                          <td className="py-2.5 px-4 uppercase text-slate-700">{p.paymentMethod || 'Bank'}</td>
                          <td className="py-2.5 px-4 font-mono text-slate-500">{p.transactionRef || p.paymentRef || '—'}</td>
                          <td className="py-2.5 px-4 text-center">
                            <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-emerald-100 text-emerald-800">
                              {p.status.toUpperCase()}
                            </span>
                          </td>
                        </tr>
                      ))
                    )}
                  </tbody>
                </table>
              </div>
            </div>

            {/* Field Operations Feed & Sector Gallery */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              
              {/* Daily Operations Feed */}
              <div className="bg-white p-5 rounded-xl border border-slate-200 shadow-xs space-y-3">
                <h4 className="text-xs font-bold text-slate-900 uppercase tracking-wider flex items-center justify-between">
                  <span>Field Operations & Daily Logs</span>
                  <span className="text-[11px] text-slate-400 font-normal">Real-time farm logs</span>
                </h4>

                <div className="space-y-3 max-h-80 overflow-y-auto pr-1">
                  {sectorOperations.map((op) => (
                    <div key={op.id} className="p-3 bg-slate-50 rounded-lg border border-slate-200 text-xs space-y-1">
                      <div className="flex items-center justify-between">
                        <span className="font-bold text-slate-900 tabular-nums">{formatDate(op.date, language)}</span>
                        <span className="text-[11px] text-slate-500">By {op.loggedByName || op.reportedByName || 'Farm Manager'}</span>
                      </div>
                      <p className="text-slate-700">{op.activities || op.incidentNotes || 'Routine morning feeding and inspection completed.'}</p>
                      <p className="text-emerald-800 font-semibold">{op.productionDetails || (op.productionQty ? `${op.productionQty} ${op.productionUnit || 'units'} produced` : 'Standard daily production cycle')}</p>
                      <div className="pt-1 flex items-center gap-3 text-[11px] text-slate-500">
                        <span>Feed: {op.feedConsumedKg} Kg</span>
                        <span>Mortality: {op.mortalityCount}</span>
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              {/* Attached Legal Agreements & Sector Documents */}
              <div className="bg-white p-5 rounded-xl border border-slate-200 shadow-xs space-y-3">
                <h4 className="text-xs font-bold text-slate-900 uppercase tracking-wider flex items-center justify-between">
                  <span>Your Deeds & Verified Certificates</span>
                  <span className="text-[11px] text-emerald-700 font-semibold">Digitally Signed</span>
                </h4>

                <div className="space-y-2.5">
                  {sectorDocs.map((doc) => (
                    <div key={doc.id} className="p-3 bg-slate-50 rounded-lg border border-slate-200 text-xs flex items-center justify-between">
                      <div className="flex items-center gap-2.5">
                        <FileText className="w-4 h-4 text-emerald-700 shrink-0" />
                        <div>
                          <p className="font-bold text-slate-900">{doc.title}</p>
                          <p className="text-[11px] text-slate-500">{doc.category.replace('_', ' ')} · {doc.fileSize}</p>
                        </div>
                      </div>

                      <button
                        onClick={() => showToast(`Downloading ${doc.title}...`)}
                        className="px-2.5 py-1 text-xs font-semibold text-slate-700 bg-white border border-slate-300 hover:bg-slate-100 rounded-md transition-colors flex items-center gap-1"
                      >
                        <Download className="w-3 h-3 text-slate-500" />
                        <span>Download</span>
                      </button>
                    </div>
                  ))}
                </div>

                {/* Sector Photo Banner */}
                {(activeSector.imageUrl || activeSector.image) && (
                  <div className="mt-4 pt-4 border-t border-slate-100">
                    <span className="text-[11px] font-bold text-slate-500 uppercase tracking-wider block mb-2">
                      Live Field Photo Inspection:
                    </span>
                    <div className="relative rounded-lg overflow-hidden border border-slate-200 h-36">
                      <img
                        src={resolveFarmImage(activeSector.imageUrl || activeSector.image)}
                        alt={activeSector.name}
                        className="w-full h-full object-cover"
                        onError={(e) => {
                          (e.currentTarget as HTMLImageElement).src = APP_IMAGES.heroFallback;
                        }}
                      />
                      <div className="absolute inset-0 bg-gradient-to-t from-black/60 to-transparent flex items-end p-2.5">
                        <span className="text-xs font-medium text-white flex items-center gap-1.5">
                          <Camera className="w-3.5 h-3.5 text-emerald-400" />
                          <span>Gazipur Farm Site Verification</span>
                        </span>
                      </div>
                    </div>
                  </div>
                )}
              </div>

            </div>

          </div>
        )}
      </div>

    </div>
  );
};
