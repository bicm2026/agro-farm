import React, { useState } from 'react';
import { useApp } from '../context/AppContext';
import { CustomModule, CustomFieldDefinition, CustomRecord } from '../types';
import { formatDate } from '../utils/translations';
import { 
  Boxes, 
  Plus, 
  Trash2, 
  Eye, 
  FileSpreadsheet, 
  CheckCircle2, 
  Layers, 
  Code,
  Sparkles
} from 'lucide-react';

export const CustomModuleBuilderView: React.FC = () => {
  const { db, language, t, updateDb, logAudit, showToast, exportCSV } = useApp();

  const [selectedModuleId, setSelectedModuleId] = useState<string>(db.customModules[0]?.id || '');
  const [isCreateModuleOpen, setIsCreateModuleOpen] = useState(false);
  const [isAddRecordOpen, setIsAddRecordOpen] = useState(false);

  // New module states
  const [modName, setModName] = useState('');
  const [modNameBn, setModNameBn] = useState('');
  const [modDesc, setModDesc] = useState('');
  const [modSectorId, setModSectorId] = useState(db.sectors[0]?.id || '');
  const [fields, setFields] = useState<CustomFieldDefinition[]>([
    { id: 'f-1', name: 'title', label: 'Item / Batch Title', labelBn: 'ব্যাচ / আইটেম শিরোনাম', type: 'text', required: true },
    { id: 'f-2', name: 'quantity', label: 'Quantity', labelBn: 'পরিমাণ', type: 'number', required: true },
    { id: 'f-3', name: 'unit_cost', label: 'Unit Cost (BDT)', labelBn: 'একক মূল্য (টাকা)', type: 'currency', required: false },
  ]);

  // New record form state (dynamic key-values)
  const [recordValues, setRecordValues] = useState<Record<string, any>>({});

  const activeModule = db.customModules.find((m) => m.id === selectedModuleId) || db.customModules[0];

  const handleAddField = () => {
    const newField: CustomFieldDefinition = {
      id: `f-${Date.now()}`,
      name: `field_${fields.length + 1}`,
      label: `Custom Field ${fields.length + 1}`,
      labelBn: `কাস্টম ফিল্ড ${fields.length + 1}`,
      type: 'text',
      required: false,
    };
    setFields([...fields, newField]);
  };

  const handleRemoveField = (id: string) => {
    setFields(fields.filter((f) => f.id !== id));
  };

  const handleSaveModule = (e: React.FormEvent) => {
    e.preventDefault();
    if (!modName) return;

    const newModuleId = `mod-${Date.now()}`;
    const newModule: CustomModule = {
      id: newModuleId,
      name: modName,
      nameBn: modNameBn || modName,
      description: modDesc || 'Custom farm module.',
      sectorId: modSectorId,
      fields,
      records: [],
      createdAt: new Date().toISOString().slice(0, 10),
      createdByUserId: db.users[0].id,
    };

    updateDb((prev) => ({
      ...prev,
      customModules: [...prev.customModules, newModule],
    }));

    logAudit('CREATE_CUSTOM_MODULE', `Created new custom module: ${modName} with ${fields.length} dynamic fields`);
    setSelectedModuleId(newModuleId);
    setIsCreateModuleOpen(false);
    setModName('');
    setModNameBn('');
    setModDesc('');
    showToast(`Custom module "${modName}" successfully published!`);
  };

  const handleSaveRecord = (e: React.FormEvent) => {
    e.preventDefault();
    if (!activeModule) return;

    const newRecordId = `rec-${Date.now()}`;
    const newRecord: CustomRecord = {
      id: newRecordId,
      moduleId: activeModule.id,
      values: recordValues,
      createdAt: new Date().toISOString().slice(0, 10),
      createdByUserId: db.users[0].id,
      createdByName: db.users[0].name,
    };

    updateDb((prev) => ({
      ...prev,
      customModules: prev.customModules.map((m) =>
        m.id === activeModule.id
          ? {
              ...m,
              records: [newRecord, ...m.records],
            }
          : m
      ),
    }));

    logAudit('ADD_CUSTOM_RECORD', `Added record to custom module: ${activeModule.name}`);
    setIsAddRecordOpen(false);
    setRecordValues({});
    showToast('Record saved to custom module ledger!');
  };

  const handleExportModuleCSV = () => {
    if (!activeModule) return;
    const headers = ['Record ID', 'Created Date', 'Logged By', ...activeModule.fields.map((f) => f.label || f.name || f.id)];
    const rows = activeModule.records.map((r) => [
      r.id,
      r.createdAt || '',
      r.createdByName || 'Admin',
      ...activeModule.fields.map((f) => {
        const key = f.name || f.id;
        const val = (r.values && r.values[key]) ?? r[key] ?? r[f.id] ?? '';
        return String(val);
      }),
    ]);
    exportCSV(`${activeModule.name}_Module_Data`, headers, rows);
  };

  return (
    <div className="space-y-6">
      
      {/* Top Header Bar */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-2 border-b border-slate-200">
        <div>
          <h1 className="text-xl sm:text-2xl font-bold text-slate-900 tracking-tight">
            {t.moduleBuilder}
          </h1>
          <p className="text-xs text-slate-500 mt-0.5">
            {language === 'bn' 
              ? 'কোডিং ছাড়া সম্পূর্ণ নতুন এগ্রো মডিউল, কাস্টম ফিল্ড ও স্বাধীন টেবিল তৈরি করুন' 
              : 'Zero-code custom agricultural module generator, dynamic fields & isolated datatables'}
          </p>
        </div>

        <div className="flex items-center gap-2">
          {activeModule && (
            <button
              onClick={handleExportModuleCSV}
              className="px-3 py-1.5 text-xs font-medium text-slate-700 bg-white border border-slate-300 hover:bg-slate-50 rounded-lg transition-colors flex items-center gap-1.5"
            >
              <FileSpreadsheet className="w-3.5 h-3.5 text-emerald-700" />
              <span>Export Module Data</span>
            </button>
          )}

          <button
            onClick={() => setIsCreateModuleOpen(true)}
            className="px-3.5 py-2 text-xs font-semibold text-white bg-emerald-700 hover:bg-emerald-800 rounded-lg shadow-xs transition-colors flex items-center gap-1.5"
          >
            <Plus className="w-4 h-4" />
            <span>Create New Module</span>
          </button>
        </div>
      </div>

      {/* Module Selector Tabs */}
      <div className="flex items-center gap-2 overflow-x-auto pb-1 border-b border-slate-200">
        {db.customModules.map((mod) => (
          <button
            key={mod.id}
            onClick={() => setSelectedModuleId(mod.id)}
            className={`px-3.5 py-2 text-xs font-semibold rounded-lg transition-colors whitespace-nowrap flex items-center gap-2 ${
              activeModule?.id === mod.id
                ? 'bg-emerald-700 text-white shadow-xs'
                : 'bg-white text-slate-700 border border-slate-200 hover:bg-slate-50'
            }`}
          >
            <span>{language === 'bn' ? mod.nameBn : mod.name}</span>
            <span
              className={`text-[10px] px-1.5 py-0.2 rounded font-mono ${
                activeModule?.id === mod.id ? 'bg-emerald-900 text-emerald-100' : 'bg-slate-100 text-slate-500'
              }`}
            >
              {mod.records.length} records
            </span>
          </button>
        ))}
      </div>

      {/* Current Module View */}
      {activeModule && (
        <div className="bg-white rounded-xl border border-slate-200 shadow-xs overflow-hidden">
          <div className="p-5 border-b border-slate-200 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
            <div>
              <div className="flex items-center gap-2">
                <h3 className="text-base font-bold text-slate-900">
                  {language === 'bn' ? activeModule.nameBn : activeModule.name}
                </h3>
                <span className="text-[10px] font-semibold text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded border border-emerald-200">
                  Custom Architecture
                </span>
              </div>
              <p className="text-xs text-slate-500 mt-0.5">{activeModule.description}</p>
            </div>

            <button
              onClick={() => {
                setRecordValues({});
                setIsAddRecordOpen(true);
              }}
              className="px-3.5 py-1.5 text-xs font-semibold text-white bg-emerald-700 hover:bg-emerald-800 rounded-lg shadow-xs transition-colors flex items-center gap-1.5 self-start sm:self-auto"
            >
              <Plus className="w-3.5 h-3.5" />
              <span>Add Record to {activeModule.name}</span>
            </button>
          </div>

          {/* Dynamic Table of Records */}
          <div className="overflow-x-auto">
            <table className="w-full text-xs text-left">
              <thead className="bg-slate-50 text-slate-600 font-semibold border-b border-slate-200">
                <tr>
                  <th className="py-3 px-4">Date</th>
                  {activeModule.fields.map((field) => (
                    <th key={field.id} className="py-3 px-4">
                      {language === 'bn' ? field.labelBn : field.label}
                    </th>
                  ))}
                  <th className="py-3 px-4">Recorded By</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {activeModule.records.length === 0 ? (
                  <tr>
                    <td colSpan={activeModule.fields.length + 2} className="py-8 text-center text-slate-400">
                      No records logged in this custom module yet. Click "Add Record" to start.
                    </td>
                  </tr>
                ) : (
                  activeModule.records.map((rec) => (
                    <tr key={rec.id} className="hover:bg-slate-50/70 transition-colors">
                      <td className="py-3 px-4 text-slate-500 whitespace-nowrap tabular-nums">{rec.createdAt || '—'}</td>
                      {activeModule.fields.map((field) => {
                        const key = field.name || field.id;
                        const val = (rec.values && rec.values[key]) ?? rec[key] ?? rec[field.id] ?? '—';
                        return (
                          <td key={field.id} className="py-3 px-4 font-medium text-slate-900 whitespace-nowrap">
                            {field.type === 'currency' && '৳ '}
                            {String(val)}
                          </td>
                        );
                      })}
                      <td className="py-3 px-4 text-slate-600 whitespace-nowrap">{rec.createdByName || 'Admin'}</td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Create Module Modal */}
      {isCreateModuleOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4 backdrop-blur-xs">
          <div className="bg-white rounded-xl shadow-2xl max-w-xl w-full p-6 border border-slate-200 max-h-[85vh] overflow-y-auto">
            <div className="flex justify-between items-center pb-3 border-b border-slate-200 mb-4">
              <h3 className="text-base font-bold text-slate-900">Define New Farm Module</h3>
              <button onClick={() => setIsCreateModuleOpen(false)} className="text-slate-400 hover:text-slate-600">✕</button>
            </div>

            <form onSubmit={handleSaveModule} className="space-y-4">
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-medium text-slate-700 mb-1">Module Name (English) *</label>
                  <input
                    type="text"
                    required
                    value={modName}
                    onChange={(e) => setModName(e.target.value)}
                    placeholder="e.g. Mushroom Cultivation"
                    className="w-full px-3 py-2 text-xs border border-slate-300 rounded-lg focus:outline-none focus:border-emerald-600"
                  />
                </div>
                <div>
                  <label className="block text-xs font-medium text-slate-700 mb-1">মডিউল নাম (বাংলা)</label>
                  <input
                    type="text"
                    value={modNameBn}
                    onChange={(e) => setModNameBn(e.target.value)}
                    placeholder="যেমন: মাশরুম চাষ প্রকল্প"
                    className="w-full px-3 py-2 text-xs border border-slate-300 rounded-lg focus:outline-none focus:border-emerald-600"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-medium text-slate-700 mb-1">Description</label>
                <textarea
                  rows={2}
                  value={modDesc}
                  onChange={(e) => setModDesc(e.target.value)}
                  placeholder="Operational scope, target yields..."
                  className="w-full px-3 py-2 text-xs border border-slate-300 rounded-lg focus:outline-none focus:border-emerald-600"
                />
              </div>

              {/* Dynamic Field Builder */}
              <div className="pt-2 border-t border-slate-200">
                <div className="flex items-center justify-between mb-3">
                  <label className="text-xs font-bold text-slate-900">Custom Dynamic Fields ({fields.length})</label>
                  <button
                    type="button"
                    onClick={handleAddField}
                    className="text-xs font-semibold text-emerald-700 hover:text-emerald-800 flex items-center gap-1"
                  >
                    <Plus className="w-3.5 h-3.5" />
                    <span>Add Field</span>
                  </button>
                </div>

                <div className="space-y-2">
                  {fields.map((f, idx) => (
                    <div key={f.id} className="p-3 bg-slate-50 border border-slate-200 rounded-lg flex items-center gap-2">
                      <input
                        type="text"
                        required
                        value={f.label}
                        onChange={(e) => {
                          const val = e.target.value;
                          setFields(
                            fields.map((item) =>
                              item.id === f.id
                                ? { ...item, label: val, name: val.toLowerCase().replace(/[^a-z0-9]/g, '_') }
                                : item
                            )
                          );
                        }}
                        placeholder="Field Label"
                        className="flex-1 px-2.5 py-1.5 text-xs border rounded bg-white"
                      />

                      <select
                        value={f.type}
                        onChange={(e) => {
                          const val = e.target.value as any;
                          setFields(fields.map((item) => (item.id === f.id ? { ...item, type: val } : item)));
                        }}
                        className="px-2 py-1.5 text-xs border rounded bg-white text-slate-700"
                      >
                        <option value="text">Text</option>
                        <option value="number">Number</option>
                        <option value="currency">Currency (৳)</option>
                        <option value="date">Date</option>
                        <option value="dropdown">Dropdown</option>
                        <option value="checkbox">Checkbox</option>
                      </select>

                      {fields.length > 1 && (
                        <button
                          type="button"
                          onClick={() => handleRemoveField(f.id)}
                          className="p-1.5 text-slate-400 hover:text-rose-600 rounded"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      )}
                    </div>
                  ))}
                </div>
              </div>

              <div className="pt-3 border-t border-slate-200 flex justify-end gap-2">
                <button
                  type="button"
                  onClick={() => setIsCreateModuleOpen(false)}
                  className="px-4 py-2 text-xs text-slate-600 hover:bg-slate-100 rounded-lg"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 text-xs font-semibold text-white bg-emerald-700 hover:bg-emerald-800 rounded-lg shadow-xs"
                >
                  Deploy Module
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Add Record Modal (Form Rendered Dynamically from activeModule.fields) */}
      {isAddRecordOpen && activeModule && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4 backdrop-blur-xs">
          <div className="bg-white rounded-xl shadow-2xl max-w-md w-full p-6 border border-slate-200 max-h-[85vh] overflow-y-auto">
            <div className="flex justify-between items-center pb-3 border-b border-slate-200 mb-4">
              <h3 className="text-base font-bold text-slate-900">Add Record: {activeModule.name}</h3>
              <button onClick={() => setIsAddRecordOpen(false)} className="text-slate-400 hover:text-slate-600">✕</button>
            </div>

            <form onSubmit={handleSaveRecord} className="space-y-3">
              {activeModule.fields.map((field) => {
                const fKey = field.name || field.id;
                const fieldLabel = language === 'bn' ? (field.labelBn || field.nameBn || field.label || field.name) : (field.label || field.name || field.id);
                return (
                  <div key={field.id}>
                    <label className="block text-xs font-medium text-slate-700 mb-1">
                      {fieldLabel} {field.required && '*'}
                    </label>

                    {field.type === 'number' || field.type === 'currency' ? (
                      <input
                        type="number"
                        step="any"
                        required={field.required}
                        value={recordValues[fKey] ?? ''}
                        onChange={(e) => setRecordValues({ ...recordValues, [fKey]: e.target.value })}
                        className="w-full px-3 py-2 text-xs border border-slate-300 rounded-lg focus:outline-none focus:border-emerald-600 tabular-nums"
                      />
                    ) : field.type === 'date' ? (
                      <input
                        type="date"
                        required={field.required}
                        value={recordValues[fKey] ?? ''}
                        onChange={(e) => setRecordValues({ ...recordValues, [fKey]: e.target.value })}
                        className="w-full px-3 py-2 text-xs border border-slate-300 rounded-lg focus:outline-none focus:border-emerald-600"
                      />
                    ) : (
                      <input
                        type="text"
                        required={field.required}
                        value={recordValues[fKey] ?? ''}
                        onChange={(e) => setRecordValues({ ...recordValues, [fKey]: e.target.value })}
                        className="w-full px-3 py-2 text-xs border border-slate-300 rounded-lg focus:outline-none focus:border-emerald-600"
                      />
                    )}
                  </div>
                );
              })}

              <div className="pt-3 border-t border-slate-200 flex justify-end gap-2">
                <button
                  type="button"
                  onClick={() => setIsAddRecordOpen(false)}
                  className="px-4 py-2 text-xs text-slate-600 hover:bg-slate-100 rounded-lg"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 text-xs font-semibold text-white bg-emerald-700 hover:bg-emerald-800 rounded-lg shadow-xs"
                >
                  Save Record
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

    </div>
  );
};
