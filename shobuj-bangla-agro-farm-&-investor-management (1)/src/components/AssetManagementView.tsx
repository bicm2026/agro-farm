import React, { useState } from 'react';
import { useApp } from '../context/AppContext';
import { AssetItem, AssetCategory } from '../types';
import { formatCurrency, formatDate } from '../utils/translations';
import { 
  Landmark, 
  Plus, 
  Search, 
  FileSpreadsheet, 
  CheckCircle2, 
  Wrench, 
  Calendar,
  Layers
} from 'lucide-react';

export const AssetManagementView: React.FC = () => {
  const { db, language, t, updateDb, logAudit, showToast, exportCSV } = useApp();

  const [searchTerm, setSearchTerm] = useState('');
  const [sectorFilter, setSectorFilter] = useState('all');
  const [categoryFilter, setCategoryFilter] = useState('all');
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);

  // Form states
  const [assetName, setAssetName] = useState('');
  const [selectedSectorId, setSelectedSectorId] = useState(db.sectors[0]?.id || '');
  const [category, setCategory] = useState<AssetCategory>('machinery');
  const [purchaseCost, setPurchaseCost] = useState('');
  const [currentValuation, setCurrentValuation] = useState('');
  const [location, setLocation] = useState('Gazipur Farm Site');
  const [condition, setCondition] = useState<'excellent' | 'good' | 'fair' | 'needs_repair'>('excellent');
  const [notes, setNotes] = useState('');

  const filteredAssets = db.assets.filter((asset) => {
    const nameStr = asset.assetName || asset.name || '';
    const locStr = asset.location || '';
    const matchesSearch =
      nameStr.toLowerCase().includes(searchTerm.toLowerCase()) ||
      locStr.toLowerCase().includes(searchTerm.toLowerCase());

    const matchesSector = sectorFilter === 'all' || asset.sectorId === sectorFilter;
    const matchesCategory = categoryFilter === 'all' || asset.category === categoryFilter;

    return matchesSearch && matchesSector && matchesCategory;
  });

  const totalOriginalCost = db.assets.reduce((sum, a) => sum + (a.purchaseCost || a.purchaseValue || 0), 0);
  const totalCurrentValue = db.assets.reduce((sum, a) => sum + (a.currentValuation || a.currentValue || a.purchaseCost || 0), 0);

  const handleCreateAsset = (e: React.FormEvent) => {
    e.preventDefault();
    const numCost = parseFloat(purchaseCost);
    const numVal = parseFloat(currentValuation) || numCost;
    if (!assetName || isNaN(numCost)) {
      showToast('Please enter asset name and purchase cost');
      return;
    }

    const newAsset: AssetItem = {
      id: `asset-${Date.now()}`,
      assetName,
      sectorId: selectedSectorId,
      category,
      purchaseCost: numCost,
      currentValuation: numVal,
      purchaseDate: new Date().toISOString().slice(0, 10),
      depreciationRateAnnual: 5,
      location: location || 'Farm Area',
      condition,
      notes,
    };

    updateDb((prev) => ({
      ...prev,
      assets: [newAsset, ...prev.assets],
    }));

    logAudit('ADD_ASSET', `Registered fixed asset: ${assetName} (Valuation: ${formatCurrency(numVal, 'en')})`);
    setIsAddModalOpen(false);
    setAssetName('');
    setPurchaseCost('');
    setCurrentValuation('');
    setNotes('');
    showToast(`Asset "${assetName}" registered in farm balance sheet!`);
  };

  const handleExportCSV = () => {
    const headers = [
      'Asset Name',
      'Sector',
      'Category',
      'Purchase Cost (BDT)',
      'Current Valuation (BDT)',
      'Purchase Date',
      'Depreciation Rate (%)',
      'Location',
      'Condition',
    ];

    const rows = filteredAssets.map((a) => {
      const sec = db.sectors.find((s) => s.id === a.sectorId);
      return [
        a.assetName || a.name || 'Asset',
        sec?.name || 'General',
        a.category,
        a.purchaseCost || a.purchaseValue || 0,
        a.currentValuation || a.currentValue || a.purchaseCost || 0,
        a.purchaseDate,
        a.depreciationRateAnnual || 5,
        a.location || 'Farm Area',
        a.condition || 'good',
      ];
    });

    exportCSV('Fixed_Asset_Register', headers, rows);
  };

  return (
    <div className="space-y-6">
      
      {/* Top Header Bar */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-2 border-b border-slate-200">
        <div>
          <h1 className="text-xl sm:text-2xl font-bold text-slate-900 tracking-tight">
            {t.assets}
          </h1>
          <p className="text-xs text-slate-500 mt-0.5">
            {language === 'bn' 
              ? 'খামারের জমি, শেড, গভীর নলকূপ, সোলার সিস্টেম ও স্থায়ী সম্পদ মূল্যায়ন খতিয়ান' 
              : 'Fixed asset register, farm land deeds, livestock housing & solar infrastructure valuation'}
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
            <span>Register Asset</span>
          </button>
        </div>
      </div>

      {/* KPI strip */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <div className="p-4 bg-white rounded-xl border border-slate-200 shadow-xs">
          <span className="text-xs text-slate-500 block">Total Fixed Assets Valuation</span>
          <span className="text-xl font-bold text-slate-900 tabular-nums">
            {formatCurrency(totalCurrentValue, language)}
          </span>
          <span className="text-[11px] text-emerald-700 block mt-0.5">{db.assets.length} Registered Assets</span>
        </div>

        <div className="p-4 bg-white rounded-xl border border-slate-200 shadow-xs">
          <span className="text-xs text-slate-500 block">Original Acquisition Cost</span>
          <span className="text-xl font-bold text-slate-700 tabular-nums">
            {formatCurrency(totalOriginalCost, language)}
          </span>
          <span className="text-[11px] text-slate-400 block mt-0.5">Asset appreciation & depreciation accounted</span>
        </div>

        <div className="p-4 bg-white rounded-xl border border-slate-200 shadow-xs">
          <span className="text-xs text-slate-500 block">Operational Readiness</span>
          <span className="text-xl font-bold text-emerald-700">100% Operational</span>
          <span className="text-[11px] text-slate-400 block mt-0.5">Regular biosecurity & engineering audits</span>
        </div>
      </div>

      {/* Assets Table */}
      <div className="bg-white rounded-xl border border-slate-200 shadow-xs overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-xs text-left">
            <thead className="bg-slate-50 text-slate-600 font-semibold border-b border-slate-200">
              <tr>
                <th className="py-3 px-4">Asset Name</th>
                <th className="py-3 px-4">{t.sector}</th>
                <th className="py-3 px-4">{t.category}</th>
                <th className="py-3 px-4 text-right">Acquisition Cost</th>
                <th className="py-3 px-4 text-right">Current Valuation</th>
                <th className="py-3 px-4">Acquired Date</th>
                <th className="py-3 px-4 text-center">Condition</th>
                <th className="py-3 px-4">Location</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {filteredAssets.map((asset) => {
                const sector = db.sectors.find((s) => s.id === asset.sectorId);

                return (
                  <tr key={asset.id} className="hover:bg-slate-50/70 transition-colors">
                    <td className="py-3 px-4 font-bold text-slate-900 whitespace-nowrap">
                      {asset.assetName || asset.name}
                    </td>

                    <td className="py-3 px-4 whitespace-nowrap font-medium text-slate-700">
                      {language === 'bn' ? sector?.nameBn || sector?.name : sector?.name}
                    </td>

                    <td className="py-3 px-4 whitespace-nowrap capitalize">
                      <span className="bg-slate-100 text-slate-700 px-2 py-0.5 rounded text-[11px]">
                        {asset.category.replace('_', ' ')}
                      </span>
                    </td>

                    <td className="py-3 px-4 text-right tabular-nums text-slate-600 whitespace-nowrap">
                      {formatCurrency(asset.purchaseCost || asset.purchaseValue || 0, language)}
                    </td>

                    <td className="py-3 px-4 text-right font-bold text-emerald-800 tabular-nums whitespace-nowrap">
                      {formatCurrency(asset.currentValuation || asset.currentValue || asset.purchaseCost || 0, language)}
                    </td>

                    <td className="py-3 px-4 whitespace-nowrap text-slate-500 tabular-nums">
                      {formatDate(asset.purchaseDate, language)}
                    </td>

                    <td className="py-3 px-4 text-center whitespace-nowrap">
                      <span
                        className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${
                          (asset.condition || 'good') === 'excellent'
                            ? 'bg-emerald-100 text-emerald-800'
                            : (asset.condition || 'good') === 'good'
                            ? 'bg-blue-100 text-blue-800'
                            : 'bg-amber-100 text-amber-800'
                        }`}
                      >
                        {(asset.condition || 'good').toUpperCase()}
                      </span>
                    </td>

                    <td className="py-3 px-4 text-slate-600 whitespace-nowrap">{asset.location || 'Farm Area'}</td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>

      {/* Add Asset Modal */}
      {isAddModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4 backdrop-blur-xs">
          <div className="bg-white rounded-xl shadow-2xl max-w-lg w-full p-6 border border-slate-200">
            <div className="flex justify-between items-center pb-3 border-b border-slate-200 mb-4">
              <h3 className="text-base font-bold text-slate-900">Register Fixed Asset</h3>
              <button onClick={() => setIsAddModalOpen(false)} className="text-slate-400 hover:text-slate-600">✕</button>
            </div>

            <form onSubmit={handleCreateAsset} className="space-y-4">
              <div>
                <label className="block text-xs font-medium text-slate-700 mb-1">Asset Name *</label>
                <input
                  type="text"
                  required
                  value={assetName}
                  onChange={(e) => setAssetName(e.target.value)}
                  placeholder="e.g. Commercial 5000-Egg Automatic Incubator"
                  className="w-full px-3 py-2 text-xs border border-slate-300 rounded-lg focus:outline-none focus:border-emerald-600"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-medium text-slate-700 mb-1">Sector</label>
                  <select
                    value={selectedSectorId}
                    onChange={(e) => setSelectedSectorId(e.target.value)}
                    className="w-full px-3 py-2 text-xs border border-slate-300 rounded-lg focus:outline-none focus:border-emerald-600 bg-white"
                  >
                    {db.sectors.map((s) => (
                      <option key={s.id} value={s.id}>{s.name}</option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-medium text-slate-700 mb-1">Category</label>
                  <select
                    value={category}
                    onChange={(e) => setCategory(e.target.value as any)}
                    className="w-full px-3 py-2 text-xs border border-slate-300 rounded-lg focus:outline-none focus:border-emerald-600 bg-white capitalize"
                  >
                    <option value="land">Land Property</option>
                    <option value="building_shed">Building / Shed</option>
                    <option value="machinery">Machinery & Pumps</option>
                    <option value="solar_system">Solar System</option>
                    <option value="vehicle">Vehicle / Van</option>
                    <option value="water_system">Water & Pond System</option>
                    <option value="other">Other Asset</option>
                  </select>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-medium text-slate-700 mb-1">Purchase Cost (৳ BDT) *</label>
                  <input
                    type="number"
                    required
                    value={purchaseCost}
                    onChange={(e) => setPurchaseCost(e.target.value)}
                    placeholder="e.g. 150000"
                    className="w-full px-3 py-2 text-xs border border-slate-300 rounded-lg focus:outline-none focus:border-emerald-600 tabular-nums"
                  />
                </div>

                <div>
                  <label className="block text-xs font-medium text-slate-700 mb-1">Current Valuation (৳ BDT)</label>
                  <input
                    type="number"
                    value={currentValuation}
                    onChange={(e) => setCurrentValuation(e.target.value)}
                    placeholder="e.g. 140000"
                    className="w-full px-3 py-2 text-xs border border-slate-300 rounded-lg focus:outline-none focus:border-emerald-600 tabular-nums"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-medium text-slate-700 mb-1">Location</label>
                  <input
                    type="text"
                    value={location}
                    onChange={(e) => setLocation(e.target.value)}
                    placeholder="e.g. Sector 1 Hatchery"
                    className="w-full px-3 py-2 text-xs border border-slate-300 rounded-lg focus:outline-none focus:border-emerald-600"
                  />
                </div>

                <div>
                  <label className="block text-xs font-medium text-slate-700 mb-1">Condition Status</label>
                  <select
                    value={condition}
                    onChange={(e) => setCondition(e.target.value as any)}
                    className="w-full px-3 py-2 text-xs border border-slate-300 rounded-lg focus:outline-none focus:border-emerald-600 bg-white"
                  >
                    <option value="excellent">Excellent</option>
                    <option value="good">Good</option>
                    <option value="fair">Fair</option>
                    <option value="needs_repair">Needs Repair</option>
                  </select>
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
                  Register Asset
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

    </div>
  );
};
