import React, { useState } from 'react';
import { useApp } from '../context/AppContext';
import { FarmSector } from '../types';
import { formatCurrency, formatNumber, formatDate } from '../utils/translations';
import { 
  Sprout, 
  Plus, 
  Edit3, 
  Trash2, 
  Calendar, 
  TrendingUp, 
  Receipt, 
  Scale, 
  Wallet, 
  Check, 
  X, 
  Activity,
  Layers,
  Sparkles,
  ExternalLink
} from 'lucide-react';

export const SectorsView: React.FC = () => {
  const { 
    db, 
    currentUser, 
    language, 
    t, 
    selectedSectorId, 
    setSelectedSectorId, 
    getSectorFinancials, 
    updateDb, 
    logAudit, 
    showToast,
    setActiveTab 
  } = useApp();

  const isSectorManager = currentUser.role === 'sector_manager';
  const assignedSectorId = currentUser.assignedSectorId;

  // Filter sectors if logged in as a specific Sector Manager
  const availableSectors = isSectorManager && assignedSectorId
    ? db.sectors.filter((s) => s.id === assignedSectorId)
    : db.sectors;

  // Currently selected sector for detail dashboard
  const currentSector = availableSectors.find((s) => s.id === selectedSectorId) || availableSectors[0];

  // Modals
  const [isAddSectorOpen, setIsAddSectorOpen] = useState(false);
  const [isEditSectorOpen, setIsEditSectorOpen] = useState(false);
  const [isAddMetricOpen, setIsAddMetricOpen] = useState(false);

  // Form states
  const [sectorName, setSectorName] = useState('');
  const [sectorNameBn, setSectorNameBn] = useState('');
  const [sectorCode, setSectorCode] = useState('');
  const [sectorDesc, setSectorDesc] = useState('');
  const [sectorDescBn, setSectorDescBn] = useState('');
  const [sectorImage, setSectorImage] = useState('/src/assets/images/hero_agro_farm_1790145662591.jpg');
  const [sectorArea, setSectorArea] = useState('5 Bighas');
  const [metricLabel, setMetricLabel] = useState('');
  const [metricLabelBn, setMetricLabelBn] = useState('');
  const [metricValue, setMetricValue] = useState('');
  const [metricUnit, setMetricUnit] = useState('Units');

  const isAdmin = currentUser.role === 'super_admin' || currentUser.role === 'admin_manager';

  const handleCreateSector = (e: React.FormEvent) => {
    e.preventDefault();
    if (!sectorName) return;

    const newId = `sec-custom-${Date.now()}`;
    const newSector: FarmSector = {
      id: newId,
      code: sectorCode.toUpperCase() || `SEC-${db.sectors.length + 1}`,
      name: sectorName,
      nameBn: sectorNameBn || sectorName,
      description: sectorDesc || 'Modern agricultural division with transparent accounting.',
      descriptionBn: sectorDescBn || 'আধুনিক কৃষি প্রকল্প ও স্বচ্ছ আর্থিক হিসাব।',
      image: sectorImage,
      managerUserId: currentUser.id,
      managerName: currentUser.name,
      status: 'active',
      establishedDate: new Date().toISOString().slice(0, 10),
      totalArea: sectorArea,
      customMetrics: [
        { label: 'Active Livestock/Stock', labelBn: 'বর্তমান স্টক / প্রাণী', value: 500, unit: 'Heads' },
        { label: 'Mortality Rate', labelBn: 'মৃত্যুহার', value: 0.5, unit: '%' },
      ],
    };

    updateDb((prev) => ({
      ...prev,
      sectors: [...prev.sectors, newSector],
    }));

    logAudit('CREATE_SECTOR', `Created new farm sector: ${sectorName} (${sectorCode})`);
    setSelectedSectorId(newId);
    setIsAddSectorOpen(false);
    setSectorName('');
    setSectorNameBn('');
    setSectorCode('');
    setSectorDesc('');
    setSectorDescBn('');
    showToast(`New farm sector "${sectorName}" created successfully!`);
  };

  const handleUpdateSector = (e: React.FormEvent) => {
    e.preventDefault();
    if (!currentSector) return;

    updateDb((prev) => ({
      ...prev,
      sectors: prev.sectors.map((s) =>
        s.id === currentSector.id
          ? {
              ...s,
              name: sectorName || s.name,
              nameBn: sectorNameBn || s.nameBn,
              code: sectorCode || s.code,
              description: sectorDesc || s.description,
              descriptionBn: sectorDescBn || s.descriptionBn,
              image: sectorImage || s.image,
              totalArea: sectorArea || s.totalArea,
            }
          : s
      ),
    }));

    logAudit('UPDATE_SECTOR', `Updated details for sector ${currentSector.name}`);
    setIsEditSectorOpen(false);
    showToast(`Sector details updated!`);
  };

  const handleAddMetric = (e: React.FormEvent) => {
    e.preventDefault();
    if (!currentSector || !metricLabel) return;

    const newMetric = {
      label: metricLabel,
      labelBn: metricLabelBn || metricLabel,
      value: isNaN(Number(metricValue)) ? metricValue : Number(metricValue),
      unit: metricUnit,
    };

    updateDb((prev) => ({
      ...prev,
      sectors: prev.sectors.map((s) =>
        s.id === currentSector.id
          ? {
              ...s,
              customMetrics: [...s.customMetrics, newMetric],
            }
          : s
      ),
    }));

    logAudit('ADD_SECTOR_METRIC', `Added custom metric "${metricLabel}" to ${currentSector.name}`);
    setIsAddMetricOpen(false);
    setMetricLabel('');
    setMetricLabelBn('');
    setMetricValue('');
    showToast('Custom metric added to sector dashboard!');
  };

  const handleDeleteSector = (sectorId: string) => {
    if (!window.confirm('Are you sure you want to deactivate or remove this farm sector?')) return;

    updateDb((prev) => ({
      ...prev,
      sectors: prev.sectors.filter((s) => s.id !== sectorId),
    }));

    logAudit('DELETE_SECTOR', `Deleted farm sector ID #${sectorId}`);
    setSelectedSectorId(null);
    showToast('Farm sector removed.');
  };

  if (!currentSector) {
    return <div className="p-8 text-center text-slate-500">No active sectors found.</div>;
  }

  // Calculate live financials for current sector
  const financials = getSectorFinancials(currentSector);

  // Filter transactions and logs for this sector
  const sectorIncomes = db.incomes.filter((inc) => inc.sectorId === currentSector.id && inc.status === 'approved');
  const sectorExpenses = db.expenses.filter((exp) => exp.sectorId === currentSector.id && exp.status === 'approved');
  const sectorInvestments = db.investments.filter(
    (inv) => inv.sectorId === currentSector.id && (inv.status === 'active' || inv.status === 'completed')
  );
  const sectorOperations = db.operations.filter((op) => op.sectorId === currentSector.id);

  return (
    <div className="space-y-6">
      
      {/* Sector Navigation & Creation Bar */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-2 border-b border-slate-200">
        <div>
          <h1 className="text-xl sm:text-2xl font-bold text-slate-900 tracking-tight">
            {t.sectors}
          </h1>
          <p className="text-xs text-slate-500 mt-0.5">
            {language === 'bn' 
              ? 'প্রতিটি কৃষি সেক্টরের স্বাধীন ড্যাশবোর্ড, পশুপাখি সংখ্যা ও আর্থিক পারফরম্যান্স' 
              : 'Independent farm divisions with live operational counts & isolated financials'}
          </p>
        </div>

        {isAdmin && (
          <button
            onClick={() => setIsAddSectorOpen(true)}
            className="px-3.5 py-2 text-xs font-semibold text-white bg-emerald-700 hover:bg-emerald-800 rounded-lg shadow-xs transition-colors flex items-center gap-1.5 self-start sm:self-auto"
          >
            <Plus className="w-4 h-4" />
            <span>{t.addNewSector}</span>
          </button>
        )}
      </div>

      {/* Sector Selection Tabs */}
      <div className="flex items-center gap-2 overflow-x-auto pb-2 scrollbar-none border-b border-slate-200">
        {availableSectors.map((s) => {
          const isSelected = s.id === currentSector.id;
          return (
            <button
              key={s.id}
              onClick={() => setSelectedSectorId(s.id)}
              className={`flex items-center gap-2 px-3.5 py-2 text-xs font-semibold rounded-lg transition-all shrink-0 ${
                isSelected
                  ? 'bg-emerald-700 text-white shadow-xs'
                  : 'bg-white text-slate-700 border border-slate-200 hover:bg-slate-50 hover:border-slate-300'
              }`}
            >
              <span>{language === 'bn' ? s.nameBn : s.name}</span>
              <span
                className={`text-[10px] px-1.5 py-0.2 rounded font-mono ${
                  isSelected ? 'bg-emerald-900 text-emerald-100' : 'bg-slate-100 text-slate-500'
                }`}
              >
                {s.code}
              </span>
            </button>
          );
        })}
      </div>

      {/* Current Sector Hero Card */}
      <div className="bg-white rounded-xl border border-slate-200 shadow-xs overflow-hidden">
        <div className="relative aspect-21/9 sm:aspect-3/1 w-full bg-slate-900 overflow-hidden">
          <img
            src={currentSector.image}
            alt={currentSector.name}
            className="w-full h-full object-cover opacity-80"
          />
          <div className="absolute inset-0 bg-gradient-to-t from-slate-950 via-slate-950/40 to-transparent" />
          
          <div className="absolute bottom-4 left-4 right-4 sm:bottom-6 sm:left-6 sm:right-6 text-white flex flex-col sm:flex-row sm:items-end justify-between gap-4">
            <div>
              <div className="flex items-center gap-2 text-xs font-semibold text-emerald-400 mb-1">
                <span>Sector Code: {currentSector.code}</span>
                <span aria-hidden="true">·</span>
                <span>Area: {currentSector.totalArea}</span>
                <span aria-hidden="true">·</span>
                <span>Established: {currentSector.establishedDate}</span>
              </div>
              <h2 className="text-xl sm:text-3xl font-bold tracking-tight">
                {language === 'bn' ? currentSector.nameBn : currentSector.name}
              </h2>
              <p className="text-xs text-slate-300 max-w-2xl mt-1 line-clamp-2">
                {language === 'bn' ? currentSector.descriptionBn : currentSector.description}
              </p>
            </div>

            {isAdmin && (
              <div className="flex items-center gap-2 shrink-0">
                <button
                  onClick={() => {
                    setSectorName(currentSector.name);
                    setSectorNameBn(currentSector.nameBn);
                    setSectorCode(currentSector.code);
                    setSectorDesc(currentSector.description);
                    setSectorDescBn(currentSector.descriptionBn);
                    setSectorImage(currentSector.image || currentSector.imageUrl || '');
                    setSectorArea(currentSector.totalArea);
                    setIsEditSectorOpen(true);
                  }}
                  className="px-3 py-1.5 text-xs font-medium text-slate-900 bg-white hover:bg-slate-100 rounded-md transition-colors flex items-center gap-1.5"
                >
                  <Edit3 className="w-3.5 h-3.5" />
                  <span>{t.edit}</span>
                </button>

                <button
                  onClick={() => handleDeleteSector(currentSector.id)}
                  className="p-1.5 text-slate-300 hover:text-rose-400 bg-slate-900/60 hover:bg-slate-800 rounded-md transition-colors"
                  title="Remove Sector"
                >
                  <Trash2 className="w-4 h-4" />
                </button>
              </div>
            )}
          </div>
        </div>

        {/* Financial KPIs for this Sector */}
        <div className="grid grid-cols-2 md:grid-cols-4 divide-y md:divide-y-0 md:divide-x divide-slate-100 border-t border-slate-100 p-4 sm:p-6 bg-slate-50/50">
          <div className="px-4 py-2">
            <span className="text-xs text-slate-500 font-medium block">Sector Capital</span>
            <span className="text-lg sm:text-xl font-bold text-slate-900 tabular-nums">
              {formatCurrency(financials.totalInvestment, language)}
            </span>
            <span className="text-[11px] text-slate-400 block mt-0.5">{sectorInvestments.length} Investor Partners</span>
          </div>

          <div className="px-4 py-2">
            <span className="text-xs text-slate-500 font-medium block">Total Sector Sales</span>
            <span className="text-lg sm:text-xl font-bold text-blue-700 tabular-nums">
              {formatCurrency(financials.totalIncome, language)}
            </span>
            <span className="text-[11px] text-blue-600 block mt-0.5">{financials.incomeCount} Approved Invoices</span>
          </div>

          <div className="px-4 py-2">
            <span className="text-xs text-slate-500 font-medium block">Operating Expenses</span>
            <span className="text-lg sm:text-xl font-bold text-rose-700 tabular-nums">
              {formatCurrency(financials.totalExpense, language)}
            </span>
            <span className="text-[11px] text-rose-600 block mt-0.5">{financials.expenseCount} Approved Vouchers</span>
          </div>

          <div className="px-4 py-2">
            <span className="text-xs text-slate-500 font-medium block">Net Profit / Loss</span>
            <span className={`text-lg sm:text-xl font-bold tabular-nums ${financials.netProfit >= 0 ? 'text-emerald-700' : 'text-rose-700'}`}>
              {formatCurrency(financials.netProfit, language)}
            </span>
            <span className="text-[11px] text-emerald-700 font-medium block mt-0.5">
              Margin: {financials.profitMarginPercent.toFixed(1)}%
            </span>
          </div>
        </div>
      </div>

      {/* Sector Operational Metrics & Inventory Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        
        {/* Live Operational Metrics */}
        <div className="lg:col-span-7 bg-white p-6 rounded-xl border border-slate-200 shadow-xs">
          <div className="flex items-center justify-between mb-4">
            <div>
              <h3 className="text-sm font-bold text-slate-900">
                {language === 'bn' ? 'দৈনন্দিন উৎপাদন ও পশুপাখি সূচক' : 'Live Operational & Production Metrics'}
              </h3>
              <p className="text-xs text-slate-500 mt-0.5">
                {language === 'bn' ? 'খামার ব্যবস্থাপক দ্বারা প্রত্যক্ষভাবে যাচাইকৃত' : 'Reported directly by on-ground sector managers'}
              </p>
            </div>

            {isAdmin && (
              <button
                onClick={() => setIsAddMetricOpen(true)}
                className="px-2.5 py-1 text-xs font-medium text-emerald-800 bg-emerald-50 hover:bg-emerald-100 rounded-md transition-colors flex items-center gap-1"
              >
                <Plus className="w-3.5 h-3.5" />
                <span>Add Metric</span>
              </button>
            )}
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            {currentSector.customMetrics.map((metric, idx) => (
              <div key={idx} className="p-4 rounded-lg bg-slate-50 border border-slate-200/80">
                <span className="text-xs text-slate-500 block">
                  {language === 'bn' ? metric.labelBn : metric.label}
                </span>
                <div className="mt-1 flex items-baseline gap-2">
                  <span className="text-xl font-bold text-slate-900 tabular-nums">
                    {typeof metric.value === 'number' ? formatNumber(metric.value, language) : metric.value}
                  </span>
                  <span className="text-xs font-semibold text-emerald-700">{metric.unit}</span>
                </div>
              </div>
            ))}
          </div>

          {/* Quick link to record operations */}
          <div className="mt-6 pt-4 border-t border-slate-100 flex items-center justify-between">
            <span className="text-xs text-slate-500">
              Responsible Manager: <strong className="text-slate-800">{currentSector.managerName || 'Farm Authority'}</strong>
            </span>
            <button
              onClick={() => setActiveTab('operations')}
              className="px-3 py-1.5 text-xs font-semibold text-emerald-700 hover:text-emerald-800 flex items-center gap-1"
            >
              <span>{language === 'bn' ? 'দৈনিক কার্যক্রম লগ দেখুন' : 'View Operations Log'}</span>
              <span>→</span>
            </button>
          </div>
        </div>

        {/* Sector Investors & Equity Share */}
        <div className="lg:col-span-5 bg-white p-6 rounded-xl border border-slate-200 shadow-xs flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-sm font-bold text-slate-900">
                {language === 'bn' ? 'সেক্টরের বিনিয়োগকারী অংশীদারগণ' : 'Partner Investors in this Sector'}
              </h3>
              <span className="text-xs font-semibold text-emerald-800 bg-emerald-50 px-2 py-0.5 rounded">
                {sectorInvestments.length} Active
              </span>
            </div>

            {sectorInvestments.length === 0 ? (
              <div className="p-6 text-center text-xs text-slate-400 bg-slate-50 rounded-lg">
                No active investors for this sector yet.
              </div>
            ) : (
              <div className="space-y-3">
                {sectorInvestments.map((inv) => {
                  const investor = db.investors.find((i) => i.id === inv.investorId);

                  return (
                    <div
                      key={inv.id}
                      className="p-3 rounded-lg border border-slate-200 bg-slate-50 flex items-center justify-between"
                    >
                      <div>
                        <p className="text-xs font-bold text-slate-900">
                          {language === 'bn' ? investor?.nameBn || investor?.name : investor?.name}
                        </p>
                        <p className="text-[11px] text-slate-500 mt-0.5">
                          Date: {formatDate(inv.date, language)} · Ownership: <strong className="text-emerald-700">{inv.ownershipPercentage}%</strong>
                        </p>
                      </div>

                      <div className="text-right">
                        <span className="text-xs font-bold text-slate-900 tabular-nums">
                          {formatCurrency(inv.amount, language)}
                        </span>
                        <span className="block text-[10px] text-slate-400 uppercase font-mono">{inv.paymentMethod}</span>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>

          <div className="mt-4 pt-4 border-t border-slate-100 flex items-center justify-between">
            <span className="text-xs text-slate-500">
              Total Equity Allocated: <strong className="text-slate-800">
                {sectorInvestments.reduce((acc, i) => acc + i.ownershipPercentage, 0)}%
              </strong>
            </span>
            <button
              onClick={() => setActiveTab('investments')}
              className="text-xs font-semibold text-emerald-700 hover:text-emerald-800"
            >
              {language === 'bn' ? '+ নতুন বিনিয়োগ যোগ' : '+ Add Investment'}
            </button>
          </div>
        </div>

      </div>

      {/* Add Sector Modal */}
      {isAddSectorOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4 backdrop-blur-xs">
          <div className="bg-white rounded-xl shadow-2xl max-w-lg w-full p-6 border border-slate-200">
            <div className="flex justify-between items-center pb-3 border-b border-slate-200 mb-4">
              <h3 className="text-base font-bold text-slate-900">{t.addNewSector}</h3>
              <button onClick={() => setIsAddSectorOpen(false)} className="text-slate-400 hover:text-slate-600">✕</button>
            </div>

            <form onSubmit={handleCreateSector} className="space-y-4">
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-medium text-slate-700 mb-1">Sector Name (English) *</label>
                  <input
                    type="text"
                    required
                    value={sectorName}
                    onChange={(e) => setSectorName(e.target.value)}
                    placeholder="e.g. Fish Farming"
                    className="w-full px-3 py-2 text-xs border border-slate-300 rounded-lg focus:outline-none focus:border-emerald-600"
                  />
                </div>
                <div>
                  <label className="block text-xs font-medium text-slate-700 mb-1">Sector Name (বাংলা)</label>
                  <input
                    type="text"
                    value={sectorNameBn}
                    onChange={(e) => setSectorNameBn(e.target.value)}
                    placeholder="যেমন: বাণিজ্যিক মাছ চাষ"
                    className="w-full px-3 py-2 text-xs border border-slate-300 rounded-lg focus:outline-none focus:border-emerald-600"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-medium text-slate-700 mb-1">Sector Code</label>
                  <input
                    type="text"
                    value={sectorCode}
                    onChange={(e) => setSectorCode(e.target.value)}
                    placeholder="e.g. FISH-06"
                    className="w-full px-3 py-2 text-xs border border-slate-300 rounded-lg focus:outline-none focus:border-emerald-600 font-mono"
                  />
                </div>
                <div>
                  <label className="block text-xs font-medium text-slate-700 mb-1">Total Land Area</label>
                  <input
                    type="text"
                    value={sectorArea}
                    onChange={(e) => setSectorArea(e.target.value)}
                    placeholder="e.g. 10 Bighas"
                    className="w-full px-3 py-2 text-xs border border-slate-300 rounded-lg focus:outline-none focus:border-emerald-600"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-medium text-slate-700 mb-1">Sector Image URL or Generated Asset</label>
                <input
                  type="text"
                  value={sectorImage}
                  onChange={(e) => setSectorImage(e.target.value)}
                  className="w-full px-3 py-2 text-xs border border-slate-300 rounded-lg focus:outline-none focus:border-emerald-600 font-mono text-[11px]"
                />
              </div>

              <div>
                <label className="block text-xs font-medium text-slate-700 mb-1">Description (English)</label>
                <textarea
                  rows={2}
                  value={sectorDesc}
                  onChange={(e) => setSectorDesc(e.target.value)}
                  placeholder="Operational scope, species or crops, location..."
                  className="w-full px-3 py-2 text-xs border border-slate-300 rounded-lg focus:outline-none focus:border-emerald-600"
                />
              </div>

              <div>
                <label className="block text-xs font-medium text-slate-700 mb-1">বিবরণ (বাংলা)</label>
                <textarea
                  rows={2}
                  value={sectorDescBn}
                  onChange={(e) => setSectorDescBn(e.target.value)}
                  placeholder="খামারের লক্ষ্য ও কার্যপদ্ধতির বিবরণ..."
                  className="w-full px-3 py-2 text-xs border border-slate-300 rounded-lg focus:outline-none focus:border-emerald-600"
                />
              </div>

              <div className="pt-3 border-t border-slate-200 flex justify-end gap-2">
                <button
                  type="button"
                  onClick={() => setIsAddSectorOpen(false)}
                  className="px-4 py-2 text-xs text-slate-600 hover:bg-slate-100 rounded-lg"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 text-xs font-semibold text-white bg-emerald-700 hover:bg-emerald-800 rounded-lg shadow-xs"
                >
                  Create Sector
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Edit Sector Modal */}
      {isEditSectorOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4 backdrop-blur-xs">
          <div className="bg-white rounded-xl shadow-2xl max-w-lg w-full p-6 border border-slate-200">
            <div className="flex justify-between items-center pb-3 border-b border-slate-200 mb-4">
              <h3 className="text-base font-bold text-slate-900">Edit Sector: {currentSector.name}</h3>
              <button onClick={() => setIsEditSectorOpen(false)} className="text-slate-400 hover:text-slate-600">✕</button>
            </div>

            <form onSubmit={handleUpdateSector} className="space-y-4">
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-medium text-slate-700 mb-1">Sector Name (English)</label>
                  <input
                    type="text"
                    required
                    value={sectorName}
                    onChange={(e) => setSectorName(e.target.value)}
                    className="w-full px-3 py-2 text-xs border border-slate-300 rounded-lg focus:outline-none focus:border-emerald-600"
                  />
                </div>
                <div>
                  <label className="block text-xs font-medium text-slate-700 mb-1">Sector Name (বাংলা)</label>
                  <input
                    type="text"
                    value={sectorNameBn}
                    onChange={(e) => setSectorNameBn(e.target.value)}
                    className="w-full px-3 py-2 text-xs border border-slate-300 rounded-lg focus:outline-none focus:border-emerald-600"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-medium text-slate-700 mb-1">Sector Code</label>
                  <input
                    type="text"
                    value={sectorCode}
                    onChange={(e) => setSectorCode(e.target.value)}
                    className="w-full px-3 py-2 text-xs border border-slate-300 rounded-lg focus:outline-none focus:border-emerald-600 font-mono"
                  />
                </div>
                <div>
                  <label className="block text-xs font-medium text-slate-700 mb-1">Total Land Area</label>
                  <input
                    type="text"
                    value={sectorArea}
                    onChange={(e) => setSectorArea(e.target.value)}
                    className="w-full px-3 py-2 text-xs border border-slate-300 rounded-lg focus:outline-none focus:border-emerald-600"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-medium text-slate-700 mb-1">Sector Image URL</label>
                <input
                  type="text"
                  value={sectorImage}
                  onChange={(e) => setSectorImage(e.target.value)}
                  className="w-full px-3 py-2 text-xs border border-slate-300 rounded-lg focus:outline-none focus:border-emerald-600 font-mono text-[11px]"
                />
              </div>

              <div>
                <label className="block text-xs font-medium text-slate-700 mb-1">Description (English)</label>
                <textarea
                  rows={2}
                  value={sectorDesc}
                  onChange={(e) => setSectorDesc(e.target.value)}
                  className="w-full px-3 py-2 text-xs border border-slate-300 rounded-lg focus:outline-none focus:border-emerald-600"
                />
              </div>

              <div className="pt-3 border-t border-slate-200 flex justify-end gap-2">
                <button
                  type="button"
                  onClick={() => setIsEditSectorOpen(false)}
                  className="px-4 py-2 text-xs text-slate-600 hover:bg-slate-100 rounded-lg"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 text-xs font-semibold text-white bg-emerald-700 hover:bg-emerald-800 rounded-lg shadow-xs"
                >
                  Save Changes
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Add Custom Metric Modal */}
      {isAddMetricOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4 backdrop-blur-xs">
          <div className="bg-white rounded-xl shadow-2xl max-w-sm w-full p-6 border border-slate-200">
            <div className="flex justify-between items-center pb-3 border-b border-slate-200 mb-4">
              <h3 className="text-sm font-bold text-slate-900">Add Metric to {currentSector.name}</h3>
              <button onClick={() => setIsAddMetricOpen(false)} className="text-slate-400 hover:text-slate-600">✕</button>
            </div>

            <form onSubmit={handleAddMetric} className="space-y-3">
              <div>
                <label className="block text-xs font-medium text-slate-700 mb-1">Metric Label (English) *</label>
                <input
                  type="text"
                  required
                  value={metricLabel}
                  onChange={(e) => setMetricLabel(e.target.value)}
                  placeholder="e.g. Daily Feed Consumption"
                  className="w-full px-3 py-2 text-xs border border-slate-300 rounded-lg focus:outline-none focus:border-emerald-600"
                />
              </div>

              <div>
                <label className="block text-xs font-medium text-slate-700 mb-1">লেবেল (বাংলা)</label>
                <input
                  type="text"
                  value={metricLabelBn}
                  onChange={(e) => setMetricLabelBn(e.target.value)}
                  placeholder="যেমন: দৈনিক খাদ্য প্রয়োগ"
                  className="w-full px-3 py-2 text-xs border border-slate-300 rounded-lg focus:outline-none focus:border-emerald-600"
                />
              </div>

              <div className="grid grid-cols-2 gap-2">
                <div>
                  <label className="block text-xs font-medium text-slate-700 mb-1">Current Value</label>
                  <input
                    type="text"
                    required
                    value={metricValue}
                    onChange={(e) => setMetricValue(e.target.value)}
                    placeholder="450"
                    className="w-full px-3 py-2 text-xs border border-slate-300 rounded-lg focus:outline-none focus:border-emerald-600"
                  />
                </div>
                <div>
                  <label className="block text-xs font-medium text-slate-700 mb-1">Unit</label>
                  <input
                    type="text"
                    required
                    value={metricUnit}
                    onChange={(e) => setMetricUnit(e.target.value)}
                    placeholder="Kg / Bags / Heads"
                    className="w-full px-3 py-2 text-xs border border-slate-300 rounded-lg focus:outline-none focus:border-emerald-600"
                  />
                </div>
              </div>

              <div className="pt-3 border-t border-slate-200 flex justify-end gap-2">
                <button
                  type="button"
                  onClick={() => setIsAddMetricOpen(false)}
                  className="px-3 py-1.5 text-xs text-slate-600 hover:bg-slate-100 rounded-lg"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-3 py-1.5 text-xs font-semibold text-white bg-emerald-700 hover:bg-emerald-800 rounded-lg shadow-xs"
                >
                  Save Metric
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

    </div>
  );
};
