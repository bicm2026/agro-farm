import React, { useState } from 'react';
import { useApp } from '../context/AppContext';
import { FarmOperationRecord } from '../types';
import { formatDate, formatNumber } from '../utils/translations';
import { 
  CalendarCheck, 
  Plus, 
  Search, 
  FileSpreadsheet, 
  CheckCircle2, 
  AlertCircle, 
  UserCheck, 
  CloudSun,
  Activity
} from 'lucide-react';

export const FarmOperationsView: React.FC = () => {
  const { db, currentUser, language, t, updateDb, logAudit, showToast, exportCSV } = useApp();

  const [searchTerm, setSearchTerm] = useState('');
  const [sectorFilter, setSectorFilter] = useState('all');
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);

  // Form states
  const [selectedSectorId, setSelectedSectorId] = useState(db.sectors[0]?.id || '');
  const [activities, setActivities] = useState('');
  const [productionDetails, setProductionDetails] = useState('');
  const [mortalityCount, setMortalityCount] = useState('0');
  const [mortalityReason, setMortalityReason] = useState('');
  const [feedConsumedKg, setFeedConsumedKg] = useState('150');
  const [medicineAdministered, setMedicineAdministered] = useState('');
  const [laborCount, setLaborCount] = useState('4');
  const [laborHours, setLaborHours] = useState('32');
  const [weatherNotes, setWeatherNotes] = useState('Sunny, 28°C, normal humidity');
  const [incidents, setIncidents] = useState('');
  const [actionTaken, setActionTaken] = useState('');

  const filteredOperations = db.operations.filter((op) => {
    const sector = db.sectors.find((s) => s.id === op.sectorId);

    const actStr = op.activities || op.incidentNotes || '';
    const prodStr = op.productionDetails || (op.productionQty ? `${op.productionQty} ${op.productionUnit || 'units'}` : '');
    const matchesSearch =
      actStr.toLowerCase().includes(searchTerm.toLowerCase()) ||
      prodStr.toLowerCase().includes(searchTerm.toLowerCase()) ||
      (op.incidents ? op.incidents.toLowerCase().includes(searchTerm.toLowerCase()) : false) ||
      (sector?.name ? sector.name.toLowerCase().includes(searchTerm.toLowerCase()) : false);

    const matchesSector = sectorFilter === 'all' || op.sectorId === sectorFilter;

    return matchesSearch && matchesSector;
  });

  const handleCreateOperation = (e: React.FormEvent) => {
    e.preventDefault();
    if (!activities) {
      showToast('Please specify the activities performed');
      return;
    }

    const sector = db.sectors.find((s) => s.id === selectedSectorId);
    const newId = `op-${Date.now()}`;

    const newRecord: FarmOperationRecord = {
      id: newId,
      date: new Date().toISOString().slice(0, 10),
      sectorId: selectedSectorId,
      activities,
      productionDetails: productionDetails || 'Routine maintenance and health check',
      mortalityCount: parseInt(mortalityCount) || 0,
      mortalityReason: mortalityReason || undefined,
      feedConsumedKg: parseFloat(feedConsumedKg) || 0,
      medicineAdministered: medicineAdministered || undefined,
      laborCount: parseInt(laborCount) || 1,
      laborHours: parseFloat(laborHours) || 8,
      weatherNotes: weatherNotes || 'Normal',
      incidents: incidents || undefined,
      actionTaken: actionTaken || undefined,
      loggedByUserId: currentUser.id,
      loggedByName: currentUser.name,
      verifiedByUserId: currentUser.role === 'sector_manager' || currentUser.role === 'super_admin' ? currentUser.id : undefined,
      verifiedByName: currentUser.role === 'sector_manager' || currentUser.role === 'super_admin' ? currentUser.name : undefined,
    };

    updateDb((prev) => ({
      ...prev,
      operations: [newRecord, ...prev.operations],
    }));

    logAudit(
      'RECORD_OPERATION',
      `Logged daily operations for ${sector?.name}: ${activities.slice(0, 40)}...`,
      selectedSectorId
    );

    setIsAddModalOpen(false);
    setActivities('');
    setProductionDetails('');
    setMortalityCount('0');
    setMortalityReason('');
    setMedicineAdministered('');
    setIncidents('');
    setActionTaken('');
    showToast('Daily field operation log saved successfully!');
  };

  const handleExportCSV = () => {
    const headers = [
      'Log ID',
      'Date',
      'Sector',
      'Activities',
      'Production Details',
      'Mortality',
      'Mortality Reason',
      'Feed Consumed (Kg)',
      'Medicine Administered',
      'Labor (Workers)',
      'Labor (Hours)',
      'Weather',
      'Logged By',
      'Verified By',
    ];

    const rows = filteredOperations.map((op) => {
      const sec = db.sectors.find((s) => s.id === op.sectorId);
      return [
        op.id,
        op.date,
        sec?.name || 'Sector',
        op.activities || '',
        op.productionDetails || '',
        op.mortalityCount || 0,
        op.mortalityReason || 'None',
        op.feedConsumedKg || 0,
        op.medicineAdministered || op.medicineUsed || 'None',
        op.laborCount || 0,
        op.laborHours || 0,
        op.weatherNotes || 'Normal',
        op.loggedByName || op.reportedByName || 'Manager',
        op.verifiedByName || 'Pending',
      ];
    });

    exportCSV('Farm_Daily_Operations_Ledger', headers, rows);
  };

  return (
    <div className="space-y-6">
      
      {/* Top Header Bar */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-2 border-b border-slate-200">
        <div>
          <h1 className="text-xl sm:text-2xl font-bold text-slate-900 tracking-tight">
            {t.operations}
          </h1>
          <p className="text-xs text-slate-500 mt-0.5">
            {language === 'bn' 
              ? 'দৈনন্দিন খামার পরিচালনা, ডিম সংগ্রহ, খাদ্য প্রয়োগ, শ্রমিক ও মৃত্যুর কারণ খতিয়ান' 
              : 'Field-level daily operational logs, egg yield, feed consumption, labor & mortality logs'}
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
            <span>Record Daily Log</span>
          </button>
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
            placeholder="Search activities, incidents, yield..."
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

      {/* Operational Logs Cards */}
      <div className="space-y-4">
        {filteredOperations.map((op) => {
          const sector = db.sectors.find((s) => s.id === op.sectorId);

          return (
            <div
              key={op.id}
              className="bg-white p-5 rounded-xl border border-slate-200 shadow-xs space-y-3 hover:border-slate-300 transition-colors"
            >
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 pb-3 border-b border-slate-100">
                <div className="flex items-center gap-2.5">
                  <span className="font-semibold text-emerald-800 bg-emerald-50 px-2 py-0.5 rounded text-xs">
                    {language === 'bn' ? sector?.nameBn || sector?.name : sector?.name}
                  </span>
                  <span className="text-xs font-bold text-slate-900 tabular-nums">
                    {formatDate(op.date, language)}
                  </span>
                  {op.weatherNotes && (
                    <span className="text-[11px] text-slate-500 flex items-center gap-1">
                      <CloudSun className="w-3.5 h-3.5 text-amber-500" />
                      <span>{op.weatherNotes}</span>
                    </span>
                  )}
                </div>

                <div className="flex items-center gap-2 text-[11px] text-slate-500">
                  <span>Logged by: <strong className="text-slate-700">{op.loggedByName}</strong></span>
                  {op.verifiedByName && (
                    <span className="flex items-center gap-1 text-emerald-700 font-semibold bg-emerald-50 px-2 py-0.5 rounded">
                      <CheckCircle2 className="w-3 h-3" />
                      <span>Verified</span>
                    </span>
                  )}
                </div>
              </div>

              {/* Main Activity and Yield description */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-xs">
                <div>
                  <h4 className="font-bold text-slate-900 mb-1">Field Activities Performed:</h4>
                  <p className="text-slate-600 leading-relaxed">{op.activities}</p>
                </div>
                <div>
                  <h4 className="font-bold text-slate-900 mb-1">Production & Yield Output:</h4>
                  <p className="text-emerald-800 font-semibold leading-relaxed">{op.productionDetails}</p>
                </div>
              </div>

              {/* Key Quantitative Indicators */}
              <div className="pt-2 grid grid-cols-2 sm:grid-cols-4 gap-2 text-xs">
                <div className="p-2 bg-slate-50 rounded-lg">
                  <span className="text-slate-400 text-[11px] block">Feed Consumed:</span>
                  <span className="font-bold text-slate-800 tabular-nums">{op.feedConsumedKg} Kg</span>
                </div>

                <div className="p-2 bg-slate-50 rounded-lg">
                  <span className="text-slate-400 text-[11px] block">Labor Deployed:</span>
                  <span className="font-bold text-slate-800 tabular-nums">
                    {op.laborCount} workers ({op.laborHours} hrs)
                  </span>
                </div>

                <div className="p-2 bg-slate-50 rounded-lg">
                  <span className="text-slate-400 text-[11px] block">Mortality / Loss:</span>
                  <span className={`font-bold tabular-nums ${op.mortalityCount > 0 ? 'text-rose-700' : 'text-slate-800'}`}>
                    {op.mortalityCount} heads {op.mortalityReason ? `(${op.mortalityReason})` : ''}
                  </span>
                </div>

                <div className="p-2 bg-slate-50 rounded-lg">
                  <span className="text-slate-400 text-[11px] block">Medicine / Vaccination:</span>
                  <span className="font-bold text-slate-800 truncate block">
                    {op.medicineAdministered || 'None'}
                  </span>
                </div>
              </div>

              {/* Incidents if any */}
              {op.incidents && (
                <div className="mt-2 p-2.5 bg-amber-50 rounded-lg border border-amber-200 text-xs text-amber-900">
                  <strong>Notice/Incident: </strong> {op.incidents}
                  {op.actionTaken && (
                    <span className="block text-amber-800 mt-0.5">
                      <strong>Remedial Action: </strong> {op.actionTaken}
                    </span>
                  )}
                </div>
              )}
            </div>
          );
        })}
      </div>

      {/* Add Operation Modal */}
      {isAddModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4 backdrop-blur-xs">
          <div className="bg-white rounded-xl shadow-2xl max-w-lg w-full p-6 border border-slate-200 max-h-[85vh] overflow-y-auto">
            <div className="flex justify-between items-center pb-3 border-b border-slate-200 mb-4">
              <h3 className="text-base font-bold text-slate-900">Log Daily Farm Operations</h3>
              <button onClick={() => setIsAddModalOpen(false)} className="text-slate-400 hover:text-slate-600">✕</button>
            </div>

            <form onSubmit={handleCreateOperation} className="space-y-4">
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

              <div>
                <label className="block text-xs font-medium text-slate-700 mb-1">Field Activities Performed *</label>
                <textarea
                  rows={2}
                  required
                  value={activities}
                  onChange={(e) => setActivities(e.target.value)}
                  placeholder="e.g. Morning duck pond release, shedding hygiene, layer feed distribution..."
                  className="w-full px-3 py-2 text-xs border border-slate-300 rounded-lg focus:outline-none focus:border-emerald-600"
                />
              </div>

              <div>
                <label className="block text-xs font-medium text-slate-700 mb-1">Production / Output Collected</label>
                <input
                  type="text"
                  value={productionDetails}
                  onChange={(e) => setProductionDetails(e.target.value)}
                  placeholder="e.g. 1,840 Fresh Duck Eggs collected; 100% sound shell quality"
                  className="w-full px-3 py-2 text-xs border border-slate-300 rounded-lg focus:outline-none focus:border-emerald-600"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-medium text-slate-700 mb-1">Feed Consumed (Kg)</label>
                  <input
                    type="number"
                    value={feedConsumedKg}
                    onChange={(e) => setFeedConsumedKg(e.target.value)}
                    className="w-full px-3 py-2 text-xs border border-slate-300 rounded-lg focus:outline-none focus:border-emerald-600 tabular-nums"
                  />
                </div>

                <div>
                  <label className="block text-xs font-medium text-slate-700 mb-1">Labor Deployed (Workers)</label>
                  <input
                    type="number"
                    value={laborCount}
                    onChange={(e) => setLaborCount(e.target.value)}
                    className="w-full px-3 py-2 text-xs border border-slate-300 rounded-lg focus:outline-none focus:border-emerald-600 tabular-nums"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-medium text-slate-700 mb-1">Mortality Count</label>
                  <input
                    type="number"
                    value={mortalityCount}
                    onChange={(e) => setMortalityCount(e.target.value)}
                    className="w-full px-3 py-2 text-xs border border-slate-300 rounded-lg focus:outline-none focus:border-emerald-600 tabular-nums"
                  />
                </div>

                <div>
                  <label className="block text-xs font-medium text-slate-700 mb-1">Mortality Reason (if any)</label>
                  <input
                    type="text"
                    value={mortalityReason}
                    onChange={(e) => setMortalityReason(e.target.value)}
                    placeholder="e.g. Natural / Heat stress"
                    className="w-full px-3 py-2 text-xs border border-slate-300 rounded-lg focus:outline-none focus:border-emerald-600"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-medium text-slate-700 mb-1">Medicine / Vaccine Administered</label>
                  <input
                    type="text"
                    value={medicineAdministered}
                    onChange={(e) => setMedicineAdministered(e.target.value)}
                    placeholder="e.g. Vitamin ADE & Electrolytes"
                    className="w-full px-3 py-2 text-xs border border-slate-300 rounded-lg focus:outline-none focus:border-emerald-600"
                  />
                </div>

                <div>
                  <label className="block text-xs font-medium text-slate-700 mb-1">Weather / Climate Conditions</label>
                  <input
                    type="text"
                    value={weatherNotes}
                    onChange={(e) => setWeatherNotes(e.target.value)}
                    placeholder="e.g. Sunny, 29°C"
                    className="w-full px-3 py-2 text-xs border border-slate-300 rounded-lg focus:outline-none focus:border-emerald-600"
                  />
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
                  Submit Log
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

    </div>
  );
};
