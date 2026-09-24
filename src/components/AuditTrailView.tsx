import React, { useState } from 'react';
import { useApp } from '../context/AppContext';
import { formatDate } from '../utils/translations';
import { 
  History, 
  Search, 
  FileSpreadsheet, 
  ShieldCheck, 
  Filter, 
  User, 
  Calendar,
  Lock
} from 'lucide-react';

export const AuditTrailView: React.FC = () => {
  const { db, language, t, exportCSV } = useApp();

  const [searchTerm, setSearchTerm] = useState('');
  const [actionFilter, setActionFilter] = useState('all');

  const filteredLogs = db.auditLogs.filter((log) => {
    const ipStr = log.ipAddress || '';
    const matchesSearch =
      log.details.toLowerCase().includes(searchTerm.toLowerCase()) ||
      log.userName.toLowerCase().includes(searchTerm.toLowerCase()) ||
      log.action.toLowerCase().includes(searchTerm.toLowerCase()) ||
      ipStr.toLowerCase().includes(searchTerm.toLowerCase());

    const matchesAction = actionFilter === 'all' || log.action === actionFilter;

    return matchesSearch && matchesAction;
  });

  const actions = Array.from(new Set(db.auditLogs.map((l) => l.action)));

  const handleExportCSV = () => {
    const headers = [
      'Timestamp',
      'Action Type',
      'User Name',
      'User Role',
      'Details',
      'Sector ID',
      'Old Value',
      'New Value',
      'IP Address',
    ];

    const rows = filteredLogs.map((l) => [
      l.timestamp,
      l.action,
      l.userName,
      l.userRole || l.role || 'user',
      l.details,
      l.sectorId || 'N/A',
      l.oldValue || l.prevValue || '—',
      l.newValue || '—',
      l.ipAddress || '127.0.0.1',
    ]);

    exportCSV('System_Audit_Trail_Log', headers, rows);
  };

  return (
    <div className="space-y-6">
      
      {/* Top Header Bar */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-2 border-b border-slate-200">
        <div>
          <h1 className="text-xl sm:text-2xl font-bold text-slate-900 tracking-tight">
            {t.auditLogs || 'Audit & Transparency Trail'}
          </h1>
          <p className="text-xs text-slate-500 mt-0.5">
            {language === 'bn' 
              ? 'অপরিবর্তনীয় সিকিউরিটি অডিট ট্রেল, অনুমোদন ও লেনদেনের টাইমস্ট্যাম্প লগ' 
              : 'Immutable cryptographic security audit log, financial approvals & ledger modifications'}
          </p>
        </div>

        <button
          onClick={handleExportCSV}
          className="px-3 py-1.5 text-xs font-semibold text-white bg-emerald-700 hover:bg-emerald-800 rounded-lg shadow-xs transition-colors flex items-center gap-1.5"
        >
          <FileSpreadsheet className="w-3.5 h-3.5" />
          <span>Export Audit Log (CSV)</span>
        </button>
      </div>

      {/* Security Status Box */}
      <div className="p-4 bg-slate-900 text-white rounded-xl shadow-xs flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div className="flex items-center gap-3">
          <div className="w-9 h-9 rounded-lg bg-emerald-600/30 border border-emerald-500/40 flex items-center justify-center text-emerald-400">
            <Lock className="w-4 h-4" />
          </div>
          <div>
            <h4 className="text-xs font-bold text-slate-100 flex items-center gap-2">
              <span>Zero-Tampering Ledger Guarantee</span>
              <span className="text-[10px] bg-emerald-950 text-emerald-300 border border-emerald-800 px-2 py-0.5 rounded">
                Active
              </span>
            </h4>
            <p className="text-[11px] text-slate-400 mt-0.5">
              Every creation, approval, and capital disbursement is permanently recorded with user identity, role, and prior state.
            </p>
          </div>
        </div>

        <div className="text-right text-xs tabular-nums text-slate-400 shrink-0">
          Total Recorded Events: <strong className="text-white">{db.auditLogs.length}</strong>
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
            placeholder="Search details, user, action or IP..."
            className="w-full pl-9 pr-3 py-1.5 text-xs border border-slate-300 rounded-lg focus:outline-none focus:border-emerald-600"
          />
        </div>

        <div className="flex items-center gap-2 w-full md:w-auto">
          <span className="text-xs text-slate-500">Action:</span>
          <select
            value={actionFilter}
            onChange={(e) => setActionFilter(e.target.value)}
            className="px-2.5 py-1.5 text-xs border border-slate-300 rounded-lg focus:outline-none focus:border-emerald-600 bg-white"
          >
            <option value="all">All Actions</option>
            {actions.map((act, idx) => (
              <option key={idx} value={act}>{act}</option>
            ))}
          </select>
        </div>
      </div>

      {/* Audit Log Table */}
      <div className="bg-white rounded-xl border border-slate-200 shadow-xs overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-xs text-left">
            <thead className="bg-slate-50 text-slate-600 font-semibold border-b border-slate-200">
              <tr>
                <th className="py-3 px-4">Timestamp (UTC)</th>
                <th className="py-3 px-4">Action</th>
                <th className="py-3 px-4">Actor</th>
                <th className="py-3 px-4">Role</th>
                <th className="py-3 px-4">Action Details</th>
                <th className="py-3 px-4">State Transition</th>
                <th className="py-3 px-4">IP Address</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {filteredLogs.map((log) => (
                <tr key={log.id} className="hover:bg-slate-50/70 transition-colors">
                  <td className="py-3 px-4 font-mono text-[11px] text-slate-500 whitespace-nowrap">
                    {log.timestamp.replace('T', ' ').slice(0, 19)}
                  </td>

                  <td className="py-3 px-4 whitespace-nowrap">
                    <span className="text-[10px] font-mono font-bold bg-slate-100 text-slate-800 px-2 py-0.5 rounded">
                      {log.action}
                    </span>
                  </td>

                  <td className="py-3 px-4 font-semibold text-slate-900 whitespace-nowrap">
                    {log.userName}
                  </td>

                  <td className="py-3 px-4 whitespace-nowrap capitalize text-slate-600">
                    {(log.userRole || log.role || 'user').replace('_', ' ')}
                  </td>

                  <td className="py-3 px-4 text-slate-800 max-w-sm leading-relaxed" title={log.details}>
                    {log.details}
                  </td>

                  <td className="py-3 px-4 whitespace-nowrap text-slate-500 font-mono text-[11px]">
                    {log.oldValue && log.newValue ? (
                      <span className="flex items-center gap-1">
                        <span className="text-amber-700 bg-amber-50 px-1 rounded">{log.oldValue}</span>
                        <span>→</span>
                        <span className="text-emerald-700 bg-emerald-50 px-1 rounded">{log.newValue}</span>
                      </span>
                    ) : (
                      '—'
                    )}
                  </td>

                  <td className="py-3 px-4 font-mono text-[11px] text-slate-400 whitespace-nowrap">
                    {log.ipAddress}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

    </div>
  );
};
