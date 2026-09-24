import React, { useState } from 'react';
import { useApp } from '../context/AppContext';
import { DocumentRecord, DocumentCategory } from '../types';
import { formatDate } from '../utils/translations';
import { 
  FileText, 
  Plus, 
  Search, 
  Download, 
  Eye, 
  Filter, 
  CheckCircle2, 
  Calendar,
  FileCheck,
  ShieldCheck,
  HardDrive
} from 'lucide-react';

export const DocumentManagementView: React.FC = () => {
  const { db, language, t, updateDb, logAudit, showToast, setActiveTab } = useApp();

  const [searchTerm, setSearchTerm] = useState('');
  const [sectorFilter, setSectorFilter] = useState('all');
  const [categoryFilter, setCategoryFilter] = useState('all');
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);

  // Form states
  const [title, setTitle] = useState('');
  const [category, setCategory] = useState<DocumentCategory>('investment_agreement');
  const [selectedSectorId, setSelectedSectorId] = useState(db.sectors[0]?.id || '');
  const [selectedInvestorId, setSelectedInvestorId] = useState(db.investors[0]?.id || '');
  const [fileType, setFileType] = useState('PDF');
  const [notes, setNotes] = useState('');

  const filteredDocs = db.documents.filter((doc) => {
    const fileTypeStr = doc.fileType || '';
    const matchesSearch =
      doc.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
      fileTypeStr.toLowerCase().includes(searchTerm.toLowerCase());

    const matchesSector = sectorFilter === 'all' || doc.sectorId === sectorFilter;
    const matchesCategory = categoryFilter === 'all' || doc.category === categoryFilter;

    return matchesSearch && matchesSector && matchesCategory;
  });

  const handleCreateDocument = (e: React.FormEvent) => {
    e.preventDefault();
    if (!title) {
      showToast('Please enter document title');
      return;
    }

    const newDoc: DocumentRecord = {
      id: `doc-${Date.now()}`,
      title,
      category,
      sectorId: selectedSectorId || undefined,
      investorId: selectedInvestorId || undefined,
      fileUrl: '#',
      fileType: fileType.toUpperCase(),
      fileSize: '1.8 MB',
      uploadedDate: new Date().toISOString().slice(0, 10),
      uploadedByUserId: db.users[0].id,
      uploadedByName: db.users[0].name,
      notes,
    };

    updateDb((prev) => ({
      ...prev,
      documents: [newDoc, ...prev.documents],
    }));

    logAudit('UPLOAD_DOCUMENT', `Uploaded new legal document: ${title} (${category})`, selectedSectorId);
    setIsAddModalOpen(false);
    setTitle('');
    setNotes('');
    showToast(`Document "${title}" uploaded to secure archive!`);
  };

  const handleDownload = (doc: DocumentRecord) => {
    showToast(`Downloading verified copy of "${doc.title}" (${doc.fileType})...`);
  };

  const categories: DocumentCategory[] = [
    'investment_agreement',
    'investor_nid',
    'financial_report',
    'land_deed',
    'license_cert',
    'lab_test_report',
    'invoice_receipt',
    'other',
  ];

  return (
    <div className="space-y-6">
      
      {/* Top Header Bar */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-2 border-b border-slate-200">
        <div>
          <h1 className="text-xl sm:text-2xl font-bold text-slate-900 tracking-tight">
            {t.documents}
          </h1>
          <p className="text-xs text-slate-500 mt-0.5">
            {language === 'bn' 
              ? 'আইনগত চুক্তিপত্র, নোটারি ডিড, ট্রেড লাইসেন্স, ল্যাব টেস্ট রিপোর্ট ও অডিট ভাউচার' 
              : 'Certified legal deeds, investment contracts, BARI lab test certificates & official licenses'}
          </p>
        </div>

        <div className="flex items-center gap-2">
          <button
            onClick={() => setActiveTab('drive')}
            className="px-3.5 py-2 text-xs font-semibold text-emerald-800 bg-emerald-50 hover:bg-emerald-100 border border-emerald-200 rounded-lg shadow-xs transition-colors flex items-center gap-1.5"
            title="Open Google Drive Cloud Storage"
          >
            <HardDrive className="w-4 h-4 text-emerald-700" />
            <span>Google Drive Cloud</span>
          </button>

          <button
            onClick={() => setIsAddModalOpen(true)}
            className="px-3.5 py-2 text-xs font-semibold text-white bg-emerald-700 hover:bg-emerald-800 rounded-lg shadow-xs transition-colors flex items-center gap-1.5"
          >
            <Plus className="w-4 h-4" />
            <span>Upload Document</span>
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
            placeholder="Search documents by title..."
            className="w-full pl-9 pr-3 py-1.5 text-xs border border-slate-300 rounded-lg focus:outline-none focus:border-emerald-600"
          />
        </div>

        <div className="flex flex-wrap items-center gap-2.5 w-full md:w-auto">
          <div className="flex items-center gap-1.5">
            <span className="text-xs text-slate-500">Sector:</span>
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

          <div className="flex items-center gap-1.5">
            <span className="text-xs text-slate-500">Category:</span>
            <select
              value={categoryFilter}
              onChange={(e) => setCategoryFilter(e.target.value)}
              className="px-2.5 py-1.5 text-xs border border-slate-300 rounded-lg focus:outline-none focus:border-emerald-600 bg-white"
            >
              <option value="all">All Categories</option>
              {categories.map((c) => (
                <option key={c} value={c}>
                  {c.replace('_', ' ').toUpperCase()}
                </option>
              ))}
            </select>
          </div>
        </div>
      </div>

      {/* Documents Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {filteredDocs.map((doc) => {
          const sector = db.sectors.find((s) => s.id === doc.sectorId);
          const investor = db.investors.find((i) => i.id === doc.investorId);

          return (
            <div
              key={doc.id}
              className="bg-white p-5 rounded-xl border border-slate-200 shadow-xs flex flex-col justify-between hover:border-slate-300 transition-colors"
            >
              <div>
                <div className="flex items-center justify-between mb-3">
                  <span className="text-[10px] font-bold uppercase tracking-wider bg-slate-100 text-slate-700 px-2 py-0.5 rounded">
                    {doc.category.replace('_', ' ')}
                  </span>
                  <span className="text-[11px] font-mono font-bold text-emerald-800 bg-emerald-50 px-2 py-0.5 rounded">
                    {doc.fileType} · {doc.fileSize}
                  </span>
                </div>

                <h3 className="text-sm font-bold text-slate-900 leading-snug line-clamp-2">
                  {doc.title}
                </h3>

                <div className="mt-3 space-y-1 text-xs text-slate-500">
                  {sector && (
                    <p>Sector: <strong className="text-slate-800">{sector.name}</strong></p>
                  )}
                  {investor && (
                    <p>Investor: <strong className="text-slate-800">{investor.name}</strong></p>
                  )}
                  <p>Archived: <span className="tabular-nums">{(doc.uploadedDate || doc.date) ? formatDate(doc.uploadedDate || doc.date || '', language) : 'Archived'}</span></p>
                  {doc.notes && <p className="text-[11px] text-slate-400 italic mt-1">{doc.notes}</p>}
                </div>
              </div>

              <div className="mt-5 pt-3 border-t border-slate-100 flex items-center justify-between">
                <span className="text-[11px] text-emerald-700 flex items-center gap-1 font-medium">
                  <ShieldCheck className="w-3.5 h-3.5" />
                  <span>Verified Hash</span>
                </span>

                <button
                  onClick={() => handleDownload(doc)}
                  className="px-3 py-1 text-xs font-semibold text-slate-700 bg-slate-100 hover:bg-slate-200 rounded-md transition-colors flex items-center gap-1"
                >
                  <Download className="w-3.5 h-3.5 text-slate-600" />
                  <span>Download</span>
                </button>
              </div>
            </div>
          );
        })}
      </div>

      {/* Add Document Modal */}
      {isAddModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4 backdrop-blur-xs">
          <div className="bg-white rounded-xl shadow-2xl max-w-lg w-full p-6 border border-slate-200">
            <div className="flex justify-between items-center pb-3 border-b border-slate-200 mb-4">
              <h3 className="text-base font-bold text-slate-900">Archive Legal / Operational Document</h3>
              <button onClick={() => setIsAddModalOpen(false)} className="text-slate-400 hover:text-slate-600">✕</button>
            </div>

            <form onSubmit={handleCreateDocument} className="space-y-4">
              <div>
                <label className="block text-xs font-medium text-slate-700 mb-1">Document Title *</label>
                <input
                  type="text"
                  required
                  value={title}
                  onChange={(e) => setTitle(e.target.value)}
                  placeholder="e.g. Partnership Agreement - Duck Farm Expansion"
                  className="w-full px-3 py-2 text-xs border border-slate-300 rounded-lg focus:outline-none focus:border-emerald-600"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-medium text-slate-700 mb-1">Document Category</label>
                  <select
                    value={category}
                    onChange={(e) => setCategory(e.target.value as any)}
                    className="w-full px-3 py-2 text-xs border border-slate-300 rounded-lg focus:outline-none focus:border-emerald-600 bg-white capitalize"
                  >
                    {categories.map((c) => (
                      <option key={c} value={c}>{c.replace('_', ' ')}</option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-medium text-slate-700 mb-1">Format Type</label>
                  <select
                    value={fileType}
                    onChange={(e) => setFileType(e.target.value)}
                    className="w-full px-3 py-2 text-xs border border-slate-300 rounded-lg focus:outline-none focus:border-emerald-600 bg-white"
                  >
                    <option value="PDF">PDF Document (.pdf)</option>
                    <option value="XLSX">Spreadsheet (.xlsx)</option>
                    <option value="JPG">Scanned Image (.jpg)</option>
                    <option value="DOCX">Word Document (.docx)</option>
                  </select>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-medium text-slate-700 mb-1">Sector (Optional)</label>
                  <select
                    value={selectedSectorId}
                    onChange={(e) => setSelectedSectorId(e.target.value)}
                    className="w-full px-3 py-2 text-xs border border-slate-300 rounded-lg focus:outline-none focus:border-emerald-600 bg-white"
                  >
                    <option value="">General Farm Wide</option>
                    {db.sectors.map((s) => (
                      <option key={s.id} value={s.id}>{s.name}</option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-medium text-slate-700 mb-1">Associated Investor (Optional)</label>
                  <select
                    value={selectedInvestorId}
                    onChange={(e) => setSelectedInvestorId(e.target.value)}
                    className="w-full px-3 py-2 text-xs border border-slate-300 rounded-lg focus:outline-none focus:border-emerald-600 bg-white"
                  >
                    <option value="">None / Corporate</option>
                    {db.investors.map((i) => (
                      <option key={i.id} value={i.id}>{i.name}</option>
                    ))}
                  </select>
                </div>
              </div>

              <div>
                <label className="block text-xs font-medium text-slate-700 mb-1">Notes / Legal Reference</label>
                <textarea
                  rows={2}
                  value={notes}
                  onChange={(e) => setNotes(e.target.value)}
                  placeholder="Notary details, registration numbers..."
                  className="w-full px-3 py-2 text-xs border border-slate-300 rounded-lg focus:outline-none focus:border-emerald-600"
                />
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
                  Archive Document
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

    </div>
  );
};
