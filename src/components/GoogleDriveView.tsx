import React, { useState, useEffect, useRef } from 'react';
import { useApp } from '../context/AppContext';
import { 
  initAuth, 
  googleSignIn, 
  logoutGoogle, 
  getAccessToken,
  getGoogleUser,
  SCOPES 
} from '../services/googleDriveAuth';
import { 
  listDriveFiles, 
  createDriveFolder, 
  uploadDriveFile, 
  uploadTextDocumentToDrive,
  deleteDriveFile, 
  getDriveAbout, 
  formatBytes,
  DriveItem,
  DriveUserInfo 
} from '../services/googleDriveApi';
import { GoogleSignInButton } from './GoogleSignInButton';
import { 
  Folder, 
  FileText, 
  FileSpreadsheet, 
  FileImage, 
  File, 
  UploadCloud, 
  FolderPlus, 
  Trash2, 
  ExternalLink, 
  Search, 
  RefreshCw, 
  CloudCheck, 
  AlertTriangle, 
  ShieldCheck, 
  HardDrive, 
  User as UserIcon, 
  LogOut, 
  ChevronRight, 
  Download,
  FileCheck2,
  Lock
} from 'lucide-react';

interface BreadcrumbItem {
  id: string;
  name: string;
}

export const GoogleDriveView: React.FC = () => {
  const { db, language, showToast, logAudit } = useApp();

  const [isAuthenticated, setIsAuthenticated] = useState<boolean>(false);
  const [isAuthenticating, setIsAuthenticating] = useState<boolean>(false);
  const [userInfo, setUserInfo] = useState<DriveUserInfo | null>(null);

  // Drive Navigation & Explorer
  const [files, setFiles] = useState<DriveItem[]>([]);
  const [breadcrumbs, setBreadcrumbs] = useState<BreadcrumbItem[]>([
    { id: 'root', name: 'My Drive' },
  ]);
  const currentFolderId = breadcrumbs[breadcrumbs.length - 1].id;
  const [searchQuery, setSearchQuery] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  // Modals
  const [isNewFolderOpen, setIsNewFolderOpen] = useState(false);
  const [newFolderName, setNewFolderName] = useState('');
  const [isUploadModalOpen, setIsUploadModalOpen] = useState(false);
  const [selectedUploadFile, setSelectedUploadFile] = useState<File | null>(null);
  const [uploadDescription, setUploadDescription] = useState('');
  const [isUploading, setIsUploading] = useState(false);

  // Mandatory Destructive Confirmation Modal
  const [itemToDelete, setItemToDelete] = useState<DriveItem | null>(null);
  const [isDeleting, setIsDeleting] = useState(false);

  // Farm Export to Drive Modal
  const [isExportModalOpen, setIsExportModalOpen] = useState(false);
  const [exportType, setExportType] = useState<'financials' | 'investor_ledger' | 'operations'>('financials');
  const [isExporting, setIsExporting] = useState(false);

  const fileInputRef = useRef<HTMLInputElement | null>(null);

  // Init Auth listener on mount
  useEffect(() => {
    const unsubscribe = initAuth(
      async (user, token) => {
        setIsAuthenticated(true);
        loadDriveInfo();
      },
      () => {
        setIsAuthenticated(false);
        setUserInfo(null);
        setFiles([]);
      }
    );
    return () => unsubscribe();
  }, []);

  // Fetch user quota and initial files when authenticated
  const loadDriveInfo = async () => {
    try {
      const about = await getDriveAbout();
      setUserInfo(about);
      fetchFiles('root');
    } catch (err: any) {
      console.warn('Failed to get Drive about details:', err);
      fetchFiles('root');
    }
  };

  const fetchFiles = async (folderId = currentFolderId, query = searchQuery) => {
    setIsLoading(true);
    setErrorMsg(null);
    try {
      const res = await listDriveFiles({
        folderId: folderId === 'root' ? undefined : folderId,
        query: query.trim() || undefined,
        pageSize: 40,
      });
      setFiles(res.files || []);
    } catch (err: any) {
      setErrorMsg(err.message || 'Failed to list Google Drive files');
    } finally {
      setIsLoading(false);
    }
  };

  // Re-fetch files when folder or search query changes
  useEffect(() => {
    if (isAuthenticated) {
      fetchFiles(currentFolderId, searchQuery);
    }
  }, [currentFolderId, isAuthenticated]);

  const handleSignIn = async () => {
    setIsAuthenticating(true);
    setErrorMsg(null);
    try {
      const res = await googleSignIn();
      if (res) {
        setIsAuthenticated(true);
        showToast('Successfully connected to Google Drive');
        logAudit('oauth_connect', `Connected Google Drive cloud storage account (${res.user.email || 'Google User'})`);
        await loadDriveInfo();
      }
    } catch (err: any) {
      console.error(err);
      setErrorMsg(err.message || 'Google Sign-in failed. Please try again.');
    } finally {
      setIsAuthenticating(false);
    }
  };

  const handleSignOut = async () => {
    try {
      await logoutGoogle();
      setIsAuthenticated(false);
      setUserInfo(null);
      setFiles([]);
      showToast('Disconnected from Google Drive');
      logAudit('oauth_disconnect', 'Disconnected Google Drive storage account');
    } catch (err: any) {
      showToast(err.message || 'Sign-out failed');
    }
  };

  const handleNavigateFolder = (folder: DriveItem) => {
    setSearchQuery('');
    setBreadcrumbs((prev) => [...prev, { id: folder.id, name: folder.name }]);
  };

  const handleBreadcrumbClick = (index: number) => {
    setSearchQuery('');
    setBreadcrumbs((prev) => prev.slice(0, index + 1));
  };

  const handleCreateFolder = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newFolderName.trim()) return;
    try {
      setIsLoading(true);
      const targetParent = currentFolderId === 'root' ? undefined : currentFolderId;
      const created = await createDriveFolder(newFolderName.trim(), targetParent);
      showToast(`Created folder "${created.name}" on Google Drive`);
      logAudit('drive_create_folder', `Created Google Drive folder: ${created.name}`);
      setNewFolderName('');
      setIsNewFolderOpen(false);
      fetchFiles(currentFolderId);
    } catch (err: any) {
      setErrorMsg(err.message || 'Could not create folder');
    } finally {
      setIsLoading(false);
    }
  };

  const handleUploadFile = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedUploadFile) return;
    try {
      setIsUploading(true);
      const targetParent = currentFolderId === 'root' ? undefined : currentFolderId;
      const uploaded = await uploadDriveFile(selectedUploadFile, targetParent, uploadDescription);
      showToast(`Uploaded "${uploaded.name}" to Google Drive`);
      logAudit('drive_upload_file', `Uploaded file to Google Drive: ${uploaded.name}`);
      setSelectedUploadFile(null);
      setUploadDescription('');
      setIsUploadModalOpen(false);
      fetchFiles(currentFolderId);
    } catch (err: any) {
      setErrorMsg(err.message || 'Upload failed');
    } finally {
      setIsUploading(false);
    }
  };

  // MANDATORY: Explicit confirmation required before deleting user files
  const confirmDeleteAction = async () => {
    if (!itemToDelete) return;
    try {
      setIsDeleting(true);
      await deleteDriveFile(itemToDelete.id);
      showToast(`Permanently deleted "${itemToDelete.name}" from Google Drive`);
      logAudit('drive_delete_file', `Deleted Google Drive item: ${itemToDelete.name}`);
      setItemToDelete(null);
      fetchFiles(currentFolderId);
    } catch (err: any) {
      setErrorMsg(err.message || 'Failed to delete item');
    } finally {
      setIsDeleting(false);
    }
  };

  // Export farm document to Google Drive
  const handleExportFarmReport = async () => {
    try {
      setIsExporting(true);
      const targetParent = currentFolderId === 'root' ? undefined : currentFolderId;
      const dateStr = new Date().toISOString().slice(0, 10);
      
      let fileName = '';
      let fileContent = '';
      let mimeType = 'text/plain';

      if (exportType === 'financials') {
        fileName = `Ahmadun_Agro_Financial_Report_${dateStr}.txt`;
        const totalInv = db.investments.filter(i => i.status === 'active' || i.status === 'completed').reduce((s, i) => s + i.amount, 0);
        const totalInc = db.incomes.filter(i => i.status === 'approved').reduce((s, i) => s + i.totalAmount, 0);
        const totalExp = db.expenses.filter(i => i.status === 'approved').reduce((s, i) => s + i.amount, 0);
        const netProfit = totalInc - totalExp;

        fileContent = [
          '==============================================================',
          'AHMADUN AGRO (আহমাদুন এগ্রো) - OFFICIAL FINANCIAL AUDIT',
          `Generated Date: ${new Date().toLocaleString()}`,
          '==============================================================',
          '',
          `Total Capital Raised: BDT ${totalInv.toLocaleString()}`,
          `Total Agricultural Revenue: BDT ${totalInc.toLocaleString()}`,
          `Total Operating Expenses: BDT ${totalExp.toLocaleString()}`,
          `Net Operating Profit: BDT ${netProfit.toLocaleString()}`,
          '',
          'SECTOR PERFORMANCE BREAKDOWN:',
          ...db.sectors.map(s => {
            const secInc = db.incomes.filter(i => i.sectorId === s.id && i.status === 'approved').reduce((acc, i) => acc + i.totalAmount, 0);
            const secExp = db.expenses.filter(e => e.sectorId === s.id && e.status === 'approved').reduce((acc, e) => acc + e.amount, 0);
            return `• ${s.name} (${s.code}): Revenue BDT ${secInc.toLocaleString()} | Expense BDT ${secExp.toLocaleString()} | Net BDT ${(secInc - secExp).toLocaleString()}`;
          }),
          '',
          'Certified by Ahmadun Agro Operations & Accounting System',
        ].join('\n');
      } else if (exportType === 'investor_ledger') {
        fileName = `Ahmadun_Agro_Investor_Ledger_${dateStr}.csv`;
        mimeType = 'text/csv';
        const rows = [
          ['Investor Name', 'Phone', 'NID/Passport', 'Total Invested (BDT)', 'Status'],
          ...db.investors.map(inv => {
            const totalInv = db.investments.filter(i => i.investorId === inv.id).reduce((s, i) => s + i.amount, 0);
            return [inv.name, inv.phone, inv.nidPassport || '', totalInv, inv.status];
          })
        ];
        fileContent = rows.map(r => r.map(c => `"${String(c).replace(/"/g, '""')}"`).join(',')).join('\n');
      } else {
        fileName = `Ahmadun_Agro_Farm_Operations_${dateStr}.csv`;
        mimeType = 'text/csv';
        const rows = [
          ['Date', 'Sector', 'Activities', 'Production Yield', 'Feed (Kg)', 'Labor'],
          ...db.operations.map(op => {
            const sec = db.sectors.find(s => s.id === op.sectorId);
            return [op.date, sec?.name || '', op.activities || '', op.productionDetails || '', op.feedConsumedKg, op.laborCount];
          })
        ];
        fileContent = rows.map(r => r.map(c => `"${String(c).replace(/"/g, '""')}"`).join(',')).join('\n');
      }

      const uploaded = await uploadTextDocumentToDrive(fileName, fileContent, mimeType, targetParent);
      showToast(`Successfully backed up "${uploaded.name}" to Google Drive`);
      logAudit('drive_backup_export', `Exported farm report to Google Drive: ${uploaded.name}`);
      setIsExportModalOpen(false);
      fetchFiles(currentFolderId);
    } catch (err: any) {
      setErrorMsg(err.message || 'Export to Drive failed');
    } finally {
      setIsExporting(false);
    }
  };

  const getFileIcon = (mimeType: string) => {
    if (mimeType === 'application/vnd.google-apps.folder') {
      return <Folder className="w-5 h-5 text-amber-500 fill-amber-100" />;
    }
    if (mimeType.includes('pdf')) {
      return <FileText className="w-5 h-5 text-rose-500" />;
    }
    if (mimeType.includes('spreadsheet') || mimeType.includes('csv') || mimeType.includes('excel')) {
      return <FileSpreadsheet className="w-5 h-5 text-emerald-600" />;
    }
    if (mimeType.includes('image/')) {
      return <FileImage className="w-5 h-5 text-blue-500" />;
    }
    return <File className="w-5 h-5 text-slate-500" />;
  };

  return (
    <div className="space-y-6">
      {/* Top Banner / Header */}
      <div className="bg-white p-6 rounded-2xl border border-slate-200/80 shadow-xs flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div className="flex items-start gap-4">
          <div className="w-12 h-12 rounded-xl bg-linear-to-tr from-emerald-600 to-teal-500 flex items-center justify-center text-white shadow-xs">
            <HardDrive className="w-6 h-6" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h1 className="text-xl font-bold text-slate-900">
                {language === 'bn' ? 'গুগল ড্রাইভ ক্লাউড স্টোরেজ' : 'Google Drive Cloud Storage'}
              </h1>
              <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-emerald-100 text-emerald-800 border border-emerald-200">
                Workspace 1P
              </span>
            </div>
            <p className="text-xs text-slate-500 mt-1">
              {language === 'bn'
                ? 'খামারের অডিট চুক্তিপত্র, আর্থিক রিপোর্ট ও ডকুমেন্টস সরাসরি গুগল ড্রাইভে ব্যাকআপ এবং ব্রাউজ করুন।'
                : 'Browse, sync, and safely archive farm agreements, audit statements & invoices in Google Drive with end-user permission.'}
            </p>
          </div>
        </div>

        {/* Authentication Controls */}
        <div className="flex items-center gap-3">
          {isAuthenticated ? (
            <div className="flex items-center gap-3 p-2 bg-slate-50 border border-slate-200 rounded-xl">
              {userInfo?.photoLink ? (
                <img 
                  src={userInfo.photoLink} 
                  alt={userInfo.displayName || 'Google User'} 
                  className="w-9 h-9 rounded-full border border-slate-200" 
                />
              ) : (
                <div className="w-9 h-9 rounded-full bg-emerald-700 text-white flex items-center justify-center font-bold text-xs">
                  <UserIcon className="w-4 h-4" />
                </div>
              )}
              <div className="text-left pr-2 hidden sm:block">
                <p className="text-xs font-bold text-slate-900 truncate max-w-[150px]">
                  {userInfo?.displayName || 'Connected Account'}
                </p>
                <p className="text-[11px] text-slate-500 truncate max-w-[150px]">
                  {userInfo?.emailAddress || 'Google Drive'}
                </p>
              </div>
              <button
                onClick={handleSignOut}
                title="Disconnect Google Account"
                className="p-2 text-slate-400 hover:text-rose-600 hover:bg-rose-50 rounded-lg transition-colors"
              >
                <LogOut className="w-4 h-4" />
              </button>
            </div>
          ) : (
            <GoogleSignInButton 
              onClick={handleSignIn} 
              disabled={isAuthenticating}
              label={isAuthenticating ? 'Connecting Google...' : 'Sign in with Google'}
            />
          )}
        </div>
      </div>

      {/* Quota & Storage Indicator (when connected) */}
      {isAuthenticated && userInfo?.storageQuota && (
        <div className="bg-emerald-50/50 border border-emerald-200 rounded-xl p-4 flex flex-col sm:flex-row sm:items-center justify-between gap-3 text-xs">
          <div className="flex items-center gap-2">
            <CloudCheck className="w-4 h-4 text-emerald-700" />
            <span className="font-semibold text-emerald-900">Google Drive Cloud Storage:</span>
            <span className="text-slate-700">
              {formatBytes(userInfo.storageQuota.usageInDrive || userInfo.storageQuota.usage)} used
              {userInfo.storageQuota.limit ? ` of ${formatBytes(userInfo.storageQuota.limit)}` : ''}
            </span>
          </div>
          <div className="flex items-center gap-2 text-slate-500">
            <ShieldCheck className="w-3.5 h-3.5 text-emerald-600" />
            <span>Authenticated with {SCOPES.length} Google Workspace Scopes</span>
          </div>
        </div>
      )}

      {/* Main Drive Interface */}
      {!isAuthenticated ? (
        <div className="bg-white rounded-2xl border border-slate-200 p-12 text-center max-w-2xl mx-auto space-y-6 shadow-xs">
          <div className="w-16 h-16 bg-emerald-50 border border-emerald-200 rounded-2xl flex items-center justify-center mx-auto text-emerald-700">
            <HardDrive className="w-8 h-8" />
          </div>
          <div>
            <h2 className="text-lg font-bold text-slate-900">
              {language === 'bn' ? 'গুগল ড্রাইভের সাথে যুক্ত হন' : 'Connect your Google Drive'}
            </h2>
            <p className="text-xs text-slate-500 mt-2 leading-relaxed">
              {language === 'bn'
                ? 'খামারের অফিসিয়াল কাগজপত্র, বিনিয়োগ চুক্তি এবং ক্যাশলেজার সরাসরি আপনার প্রাতিষ্ঠানিক গুগল ড্রাইভে সংরক্ষিত রাখতে গুগল অ্যাকাউন্টে সাইন ইন করুন।'
                : 'Authorize Google Drive to store farm investment contracts, audit balance sheets, and daily logs with your explicit permission. You can browse, upload, and safely sync anytime.'}
            </p>
          </div>

          <div className="flex justify-center pt-2">
            <GoogleSignInButton 
              onClick={handleSignIn} 
              disabled={isAuthenticating}
              label={isAuthenticating ? 'Connecting...' : 'Sign in with Google'}
            />
          </div>

          <div className="pt-4 border-t border-slate-100 flex flex-wrap items-center justify-center gap-6 text-[11px] text-slate-400">
            <span className="flex items-center gap-1.5">
              <ShieldCheck className="w-3.5 h-3.5 text-emerald-600" /> In-memory OAuth tokens
            </span>
            <span className="flex items-center gap-1.5">
              <Lock className="w-3.5 h-3.5 text-emerald-600" /> Direct Client-Side API
            </span>
            <span className="flex items-center gap-1.5">
              <FileCheck2 className="w-3.5 h-3.5 text-emerald-600" /> User Confirmation on Delete
            </span>
          </div>
        </div>
      ) : (
        <div className="bg-white rounded-2xl border border-slate-200 shadow-xs overflow-hidden space-y-4">
          
          {/* Action Toolbar */}
          <div className="p-4 border-b border-slate-100 flex flex-col md:flex-row md:items-center justify-between gap-3">
            {/* Breadcrumb Navigation */}
            <nav className="flex items-center flex-wrap gap-1 text-xs">
              {breadcrumbs.map((crumb, idx) => (
                <React.Fragment key={crumb.id}>
                  {idx > 0 && <ChevronRight className="w-3.5 h-3.5 text-slate-400" />}
                  <button
                    onClick={() => handleBreadcrumbClick(idx)}
                    className={`font-semibold hover:text-emerald-700 transition-colors ${
                      idx === breadcrumbs.length - 1
                        ? 'text-slate-900 bg-slate-100 px-2 py-1 rounded'
                        : 'text-slate-500 hover:underline'
                    }`}
                  >
                    {crumb.name}
                  </button>
                </React.Fragment>
              ))}
            </nav>

            {/* Quick Actions */}
            <div className="flex flex-wrap items-center gap-2">
              <div className="relative">
                <Search className="w-3.5 h-3.5 text-slate-400 absolute left-2.5 top-1/2 -translate-y-1/2" />
                <input
                  type="text"
                  placeholder="Search in Drive..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  onKeyDown={(e) => e.key === 'Enter' && fetchFiles(currentFolderId, searchQuery)}
                  className="pl-8 pr-3 py-1.5 text-xs bg-slate-50 border border-slate-200 rounded-lg w-44 focus:w-56 focus:outline-none focus:ring-1 focus:ring-emerald-500 transition-all"
                />
              </div>

              <button
                onClick={() => fetchFiles(currentFolderId)}
                title="Refresh Drive files"
                className="p-1.5 text-slate-600 hover:text-slate-900 hover:bg-slate-100 rounded-lg border border-slate-200 transition-colors"
              >
                <RefreshCw className={`w-3.5 h-3.5 ${isLoading ? 'animate-spin' : ''}`} />
              </button>

              <button
                onClick={() => setIsNewFolderOpen(true)}
                className="px-3 py-1.5 text-xs font-semibold text-slate-700 bg-white border border-slate-200 hover:bg-slate-50 rounded-lg transition-colors flex items-center gap-1.5"
              >
                <FolderPlus className="w-3.5 h-3.5 text-amber-600" />
                <span>New Folder</span>
              </button>

              <button
                onClick={() => setIsUploadModalOpen(true)}
                className="px-3 py-1.5 text-xs font-semibold text-slate-700 bg-white border border-slate-200 hover:bg-slate-50 rounded-lg transition-colors flex items-center gap-1.5"
              >
                <UploadCloud className="w-3.5 h-3.5 text-blue-600" />
                <span>Upload File</span>
              </button>

              <button
                onClick={() => setIsExportModalOpen(true)}
                className="px-3 py-1.5 text-xs font-semibold text-white bg-emerald-700 hover:bg-emerald-800 rounded-lg transition-colors flex items-center gap-1.5 shadow-xs"
              >
                <CloudCheck className="w-3.5 h-3.5" />
                <span>Backup Farm Records</span>
              </button>
            </div>
          </div>

          {/* Error Notice */}
          {errorMsg && (
            <div className="mx-4 p-3 bg-rose-50 border border-rose-200 rounded-xl text-xs text-rose-800 flex items-center justify-between">
              <span className="flex items-center gap-2">
                <AlertTriangle className="w-4 h-4 text-rose-600 shrink-0" />
                {errorMsg}
              </span>
              <button 
                onClick={() => setErrorMsg(null)}
                className="text-rose-500 hover:text-rose-700 font-bold ml-2"
              >
                Dismiss
              </button>
            </div>
          )}

          {/* File Table / Explorer */}
          <div className="overflow-x-auto min-h-[300px]">
            {isLoading ? (
              <div className="py-20 text-center space-y-2">
                <RefreshCw className="w-6 h-6 animate-spin text-emerald-700 mx-auto" />
                <p className="text-xs text-slate-500">Querying Google Drive files...</p>
              </div>
            ) : files.length === 0 ? (
              <div className="py-20 text-center space-y-3">
                <Folder className="w-10 h-10 text-slate-300 mx-auto" />
                <p className="text-xs font-medium text-slate-600">No files or folders found here.</p>
                <div className="flex justify-center gap-2">
                  <button
                    onClick={() => setIsUploadModalOpen(true)}
                    className="text-xs text-emerald-700 hover:underline font-semibold"
                  >
                    Upload a file
                  </button>
                  <span className="text-slate-300">·</span>
                  <button
                    onClick={() => setIsExportModalOpen(true)}
                    className="text-xs text-emerald-700 hover:underline font-semibold"
                  >
                    Sync farm audit ledger
                  </button>
                </div>
              </div>
            ) : (
              <table className="w-full text-xs text-left">
                <thead className="bg-slate-50 text-slate-600 font-semibold border-b border-slate-200">
                  <tr>
                    <th className="py-2.5 px-4">Name</th>
                    <th className="py-2.5 px-4">Type</th>
                    <th className="py-2.5 px-4 text-right">Size</th>
                    <th className="py-2.5 px-4">Last Modified</th>
                    <th className="py-2.5 px-4 text-right">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {files.map((file) => {
                    const isFolder = file.mimeType === 'application/vnd.google-apps.folder';

                    return (
                      <tr key={file.id} className="hover:bg-slate-50/80 group transition-colors">
                        <td className="py-3 px-4">
                          <div className="flex items-center gap-2.5">
                            {getFileIcon(file.mimeType)}
                            {isFolder ? (
                              <button
                                onClick={() => handleNavigateFolder(file)}
                                className="font-semibold text-slate-900 hover:text-emerald-700 hover:underline text-left truncate max-w-md"
                              >
                                {file.name}
                              </button>
                            ) : (
                              <a
                                href={file.webViewLink}
                                target="_blank"
                                rel="noreferrer"
                                className="font-medium text-slate-800 hover:text-blue-600 hover:underline text-left truncate max-w-md"
                              >
                                {file.name}
                              </a>
                            )}
                          </div>
                        </td>
                        <td className="py-3 px-4 text-slate-500 whitespace-nowrap">
                          {isFolder ? 'Folder' : file.mimeType.split('/').pop()?.toUpperCase()}
                        </td>
                        <td className="py-3 px-4 text-right text-slate-500 whitespace-nowrap tabular-nums">
                          {isFolder ? '—' : formatBytes(file.size)}
                        </td>
                        <td className="py-3 px-4 text-slate-500 whitespace-nowrap tabular-nums">
                          {file.modifiedTime ? new Date(file.modifiedTime).toLocaleDateString() : '—'}
                        </td>
                        <td className="py-3 px-4 text-right whitespace-nowrap">
                          <div className="flex items-center justify-end gap-1">
                            {file.webViewLink && (
                              <a
                                href={file.webViewLink}
                                target="_blank"
                                rel="noreferrer"
                                title="Open in Google Drive"
                                className="p-1.5 text-slate-400 hover:text-slate-800 hover:bg-slate-100 rounded-lg transition-colors"
                              >
                                <ExternalLink className="w-3.5 h-3.5" />
                              </a>
                            )}
                            {file.webContentLink && (
                              <a
                                href={file.webContentLink}
                                download
                                title="Download from Google Drive"
                                className="p-1.5 text-slate-400 hover:text-emerald-700 hover:bg-emerald-50 rounded-lg transition-colors"
                              >
                                <Download className="w-3.5 h-3.5" />
                              </a>
                            )}
                            <button
                              onClick={() => setItemToDelete(file)}
                              title="Delete from Google Drive"
                              className="p-1.5 text-slate-400 hover:text-rose-600 hover:bg-rose-50 rounded-lg transition-colors"
                            >
                              <Trash2 className="w-3.5 h-3.5" />
                            </button>
                          </div>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            )}
          </div>
        </div>
      )}

      {/* CREATE FOLDER MODAL */}
      {isNewFolderOpen && (
        <div className="fixed inset-0 z-50 overflow-y-auto bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl max-w-md w-full p-6 shadow-2xl border border-slate-200 space-y-4">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-amber-50 text-amber-600 flex items-center justify-center">
                <FolderPlus className="w-5 h-5" />
              </div>
              <div>
                <h3 className="text-sm font-bold text-slate-900">New Google Drive Folder</h3>
                <p className="text-xs text-slate-500">Create folder inside "{breadcrumbs[breadcrumbs.length - 1].name}"</p>
              </div>
            </div>

            <form onSubmit={handleCreateFolder} className="space-y-4 pt-2">
              <div>
                <label className="text-xs font-semibold text-slate-700 block mb-1">Folder Name</label>
                <input
                  type="text"
                  required
                  placeholder="e.g. Audit Reports 2026"
                  value={newFolderName}
                  onChange={(e) => setNewFolderName(e.target.value)}
                  className="w-full text-xs p-2.5 border border-slate-200 rounded-lg focus:outline-none focus:ring-1 focus:ring-emerald-500"
                  autoFocus
                />
              </div>

              <div className="flex justify-end gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => setIsNewFolderOpen(false)}
                  className="px-3.5 py-1.5 text-xs text-slate-600 hover:bg-slate-100 rounded-lg transition-colors"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={!newFolderName.trim()}
                  className="px-4 py-1.5 text-xs font-semibold text-white bg-emerald-700 hover:bg-emerald-800 disabled:opacity-50 rounded-lg transition-colors"
                >
                  Create Folder
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* UPLOAD FILE MODAL */}
      {isUploadModalOpen && (
        <div className="fixed inset-0 z-50 overflow-y-auto bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl max-w-md w-full p-6 shadow-2xl border border-slate-200 space-y-4">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-blue-50 text-blue-600 flex items-center justify-center">
                <UploadCloud className="w-5 h-5" />
              </div>
              <div>
                <h3 className="text-sm font-bold text-slate-900">Upload to Google Drive</h3>
                <p className="text-xs text-slate-500">Destination: "{breadcrumbs[breadcrumbs.length - 1].name}"</p>
              </div>
            </div>

            <form onSubmit={handleUploadFile} className="space-y-4 pt-2">
              <div>
                <label className="text-xs font-semibold text-slate-700 block mb-1">Choose File</label>
                <input
                  type="file"
                  required
                  ref={fileInputRef}
                  onChange={(e) => {
                    if (e.target.files && e.target.files[0]) {
                      setSelectedUploadFile(e.target.files[0]);
                    }
                  }}
                  className="w-full text-xs text-slate-600 border border-slate-200 rounded-lg p-2 file:mr-3 file:py-1 file:px-2.5 file:rounded-md file:border-0 file:text-xs file:font-semibold file:bg-emerald-50 file:text-emerald-700 hover:file:bg-emerald-100"
                />
              </div>

              <div>
                <label className="text-xs font-semibold text-slate-700 block mb-1">Description (Optional)</label>
                <input
                  type="text"
                  placeholder="e.g. Gazipur farm deed copy"
                  value={uploadDescription}
                  onChange={(e) => setUploadDescription(e.target.value)}
                  className="w-full text-xs p-2.5 border border-slate-200 rounded-lg focus:outline-none focus:ring-1 focus:ring-emerald-500"
                />
              </div>

              <div className="flex justify-end gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => {
                    setIsUploadModalOpen(false);
                    setSelectedUploadFile(null);
                  }}
                  className="px-3.5 py-1.5 text-xs text-slate-600 hover:bg-slate-100 rounded-lg transition-colors"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={!selectedUploadFile || isUploading}
                  className="px-4 py-1.5 text-xs font-semibold text-white bg-emerald-700 hover:bg-emerald-800 disabled:opacity-50 rounded-lg transition-colors flex items-center gap-1.5"
                >
                  {isUploading ? (
                    <>
                      <RefreshCw className="w-3.5 h-3.5 animate-spin" />
                      <span>Uploading...</span>
                    </>
                  ) : (
                    <span>Upload to Drive</span>
                  )}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* BACKUP FARM REPORT MODAL */}
      {isExportModalOpen && (
        <div className="fixed inset-0 z-50 overflow-y-auto bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl max-w-md w-full p-6 shadow-2xl border border-slate-200 space-y-4">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-emerald-50 text-emerald-700 flex items-center justify-center">
                <CloudCheck className="w-5 h-5" />
              </div>
              <div>
                <h3 className="text-sm font-bold text-slate-900">Backup Farm Records to Drive</h3>
                <p className="text-xs text-slate-500">Save structured statements directly to your cloud storage</p>
              </div>
            </div>

            <div className="space-y-3 pt-2">
              <label className="text-xs font-semibold text-slate-700 block">Select Record to Export</label>
              
              <div 
                onClick={() => setExportType('financials')}
                className={`p-3 rounded-xl border cursor-pointer transition-all ${
                  exportType === 'financials' 
                    ? 'border-emerald-600 bg-emerald-50/40 text-emerald-950 ring-1 ring-emerald-500' 
                    : 'border-slate-200 hover:border-slate-300'
                }`}
              >
                <div className="font-semibold text-xs text-slate-900">Comprehensive Farm Financial Audit (.txt)</div>
                <div className="text-[11px] text-slate-500">Total investments, sales revenue, operating expenses, and sector profits</div>
              </div>

              <div 
                onClick={() => setExportType('investor_ledger')}
                className={`p-3 rounded-xl border cursor-pointer transition-all ${
                  exportType === 'investor_ledger' 
                    ? 'border-emerald-600 bg-emerald-50/40 text-emerald-950 ring-1 ring-emerald-500' 
                    : 'border-slate-200 hover:border-slate-300'
                }`}
              >
                <div className="font-semibold text-xs text-slate-900">Investor Capital Ledger (.csv)</div>
                <div className="text-[11px] text-slate-500">All registered partner investors, contact info, and invested amounts</div>
              </div>

              <div 
                onClick={() => setExportType('operations')}
                className={`p-3 rounded-xl border cursor-pointer transition-all ${
                  exportType === 'operations' 
                    ? 'border-emerald-600 bg-emerald-50/40 text-emerald-950 ring-1 ring-emerald-500' 
                    : 'border-slate-200 hover:border-slate-300'
                }`}
              >
                <div className="font-semibold text-xs text-slate-900">Field Operations & Production Log (.csv)</div>
                <div className="text-[11px] text-slate-500">Sector activities, harvest details, feed consumption, and labor metrics</div>
              </div>
            </div>

            <div className="flex justify-end gap-2 pt-3">
              <button
                type="button"
                onClick={() => setIsExportModalOpen(false)}
                className="px-3.5 py-1.5 text-xs text-slate-600 hover:bg-slate-100 rounded-lg transition-colors"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={handleExportFarmReport}
                disabled={isExporting}
                className="px-4 py-1.5 text-xs font-semibold text-white bg-emerald-700 hover:bg-emerald-800 disabled:opacity-50 rounded-lg transition-colors flex items-center gap-1.5"
              >
                {isExporting ? (
                  <>
                    <RefreshCw className="w-3.5 h-3.5 animate-spin" />
                    <span>Syncing to Drive...</span>
                  </>
                ) : (
                  <span>Sync to Drive</span>
                )}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* MANDATORY USER CONFIRMATION DIALOG FOR DESTRUCTIVE ACTION (DELETE) */}
      {itemToDelete && (
        <div className="fixed inset-0 z-50 overflow-y-auto bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl max-w-md w-full p-6 shadow-2xl border border-slate-200 space-y-4">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-rose-50 text-rose-600 flex items-center justify-center">
                <AlertTriangle className="w-5 h-5" />
              </div>
              <div>
                <h3 className="text-sm font-bold text-slate-900">Confirm Deletion from Google Drive</h3>
                <p className="text-xs text-slate-500">Explicit user confirmation required</p>
              </div>
            </div>

            <div className="p-3 bg-rose-50/60 rounded-xl border border-rose-200 text-xs text-rose-900 space-y-1">
              <p>
                Are you sure you want to delete <strong className="font-semibold">"{itemToDelete.name}"</strong>?
              </p>
              <p className="text-[11px] text-rose-700">
                This will permanently delete this item from your Google Drive cloud account. This action cannot be undone.
              </p>
            </div>

            <div className="flex justify-end gap-2 pt-2">
              <button
                type="button"
                onClick={() => setItemToDelete(null)}
                disabled={isDeleting}
                className="px-4 py-2 text-xs font-medium text-slate-700 hover:bg-slate-100 rounded-lg transition-colors"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={confirmDeleteAction}
                disabled={isDeleting}
                className="px-4 py-2 text-xs font-semibold text-white bg-rose-600 hover:bg-rose-700 disabled:opacity-50 rounded-lg transition-colors flex items-center gap-1.5 shadow-xs"
              >
                {isDeleting ? (
                  <>
                    <RefreshCw className="w-3.5 h-3.5 animate-spin" />
                    <span>Deleting...</span>
                  </>
                ) : (
                  <>
                    <Trash2 className="w-3.5 h-3.5" />
                    <span>Delete from Google Drive</span>
                  </>
                )}
              </button>
            </div>
          </div>
        </div>
      )}

    </div>
  );
};
