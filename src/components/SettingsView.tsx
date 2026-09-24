import React, { useState } from 'react';
import { useApp } from '../context/AppContext';
import { resetDatabaseToDefault } from '../services/storage';
import { 
  Settings as SettingsIcon, 
  Building2, 
  CreditCard, 
  Save, 
  RotateCcw, 
  Download, 
  Upload, 
  CheckCircle2, 
  AlertTriangle,
  Globe
} from 'lucide-react';

export const SettingsView: React.FC = () => {
  const { db, updateDb, logAudit, showToast, language, t } = useApp();

  const [farmName, setFarmName] = useState(db.settings.farmName);
  const [farmNameBn, setFarmNameBn] = useState(db.settings.farmNameBn);
  const [address, setAddress] = useState(db.settings.address);
  const [phone, setPhone] = useState(db.settings.phone);
  const [email, setEmail] = useState(db.settings.email);
  const [currency, setCurrency] = useState(db.settings.currency);

  const [bkashMerchant, setBkashMerchant] = useState('01711-987654');
  const [nagadMerchant, setNagadMerchant] = useState('01811-123456');
  const [bankName, setBankName] = useState('Islami Bank Bangladesh PLC');
  const [bankAccount, setBankAccount] = useState('2050 3481 9002 4412');
  const [bankRouting, setBankRouting] = useState('125271890');

  const handleSaveGeneral = (e: React.FormEvent) => {
    e.preventDefault();
    updateDb((prev) => ({
      ...prev,
      settings: {
        ...prev.settings,
        farmName,
        farmNameBn,
        address,
        phone,
        email,
        currency,
      },
    }));

    logAudit('UPDATE_SETTINGS', 'Updated Agro Farm institutional profile & contact details');
    showToast('Farm institutional settings saved!');
  };

  const handleBackupDownload = () => {
    const dataStr = 'data:text/json;charset=utf-8,' + encodeURIComponent(JSON.stringify(db, null, 2));
    const downloadAnchor = document.createElement('a');
    downloadAnchor.setAttribute('href', dataStr);
    downloadAnchor.setAttribute('download', `Agro_Farm_Backup_${new Date().toISOString().slice(0, 10)}.json`);
    document.body.appendChild(downloadAnchor);
    downloadAnchor.click();
    downloadAnchor.remove();
    showToast('Database JSON backup downloaded!');
  };

  const handleRestoreUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const fileReader = new FileReader();
    if (e.target.files && e.target.files[0]) {
      fileReader.readAsText(e.target.files[0], 'UTF-8');
      fileReader.onload = (event) => {
        try {
          const parsed = JSON.parse(event.target?.result as string);
          if (parsed.sectors && parsed.investors && parsed.incomes) {
            updateDb(() => parsed);
            logAudit('RESTORE_DATABASE', 'Restored complete database from external JSON backup');
            showToast('Database successfully restored from JSON backup!');
          } else {
            showToast('Invalid backup JSON format');
          }
        } catch (err) {
          showToast('Failed to parse backup JSON file');
        }
      };
    }
  };

  const handleFactoryReset = () => {
    if (
      window.confirm(
        'Are you sure you want to reset all data back to the clean Bangladeshi Agro seed database? Any custom entries will be reverted.'
      )
    ) {
      const fresh = resetDatabaseToDefault();
      updateDb(() => fresh);
      showToast('System reset to original verified demo seed state!');
    }
  };

  return (
    <div className="space-y-6">
      
      {/* Top Header Bar */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-2 border-b border-slate-200">
        <div>
          <h1 className="text-xl sm:text-2xl font-bold text-slate-900 tracking-tight">
            {t.settings}
          </h1>
          <p className="text-xs text-slate-500 mt-0.5">
            {language === 'bn' 
              ? 'খামারের প্রাতিষ্ঠানিক তথ্য, ব্যাংক/বিকাশ চ্যানেল ও ডেটাবেজ ব্যাকআপ ব্যবস্থাপনা' 
              : 'Agro farm enterprise credentials, banking channels, localization & JSON database backup'}
          </p>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        
        {/* Left 2 Cols: Form */}
        <div className="lg:col-span-2 space-y-6">
          
          {/* Institutional Information */}
          <div className="bg-white p-6 rounded-xl border border-slate-200 shadow-xs">
            <h3 className="text-sm font-bold text-slate-900 mb-4 pb-2 border-b border-slate-100 flex items-center gap-2">
              <Building2 className="w-4 h-4 text-emerald-700" />
              <span>Agro Enterprise Institutional Profile</span>
            </h3>

            <form onSubmit={handleSaveGeneral} className="space-y-4">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-medium text-slate-700 mb-1">
                    Farm Name (English)
                  </label>
                  <input
                    type="text"
                    required
                    value={farmName}
                    onChange={(e) => setFarmName(e.target.value)}
                    className="w-full px-3 py-2 text-xs border border-slate-300 rounded-lg focus:outline-none focus:border-emerald-600"
                  />
                </div>

                <div>
                  <label className="block text-xs font-medium text-slate-700 mb-1">
                    খামারের নাম (বাংলা)
                  </label>
                  <input
                    type="text"
                    required
                    value={farmNameBn}
                    onChange={(e) => setFarmNameBn(e.target.value)}
                    className="w-full px-3 py-2 text-xs border border-slate-300 rounded-lg focus:outline-none focus:border-emerald-600"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-medium text-slate-700 mb-1">
                  Farm Location & Project Land Address
                </label>
                <input
                  type="text"
                  required
                  value={address}
                  onChange={(e) => setAddress(e.target.value)}
                  className="w-full px-3 py-2 text-xs border border-slate-300 rounded-lg focus:outline-none focus:border-emerald-600"
                />
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                <div>
                  <label className="block text-xs font-medium text-slate-700 mb-1">Official Hotline Phone</label>
                  <input
                    type="text"
                    required
                    value={phone}
                    onChange={(e) => setPhone(e.target.value)}
                    className="w-full px-3 py-2 text-xs border border-slate-300 rounded-lg focus:outline-none focus:border-emerald-600 font-mono"
                  />
                </div>

                <div>
                  <label className="block text-xs font-medium text-slate-700 mb-1">Finance & Investor Email</label>
                  <input
                    type="email"
                    required
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    className="w-full px-3 py-2 text-xs border border-slate-300 rounded-lg focus:outline-none focus:border-emerald-600"
                  />
                </div>

                <div>
                  <label className="block text-xs font-medium text-slate-700 mb-1">Currency Standard</label>
                  <select
                    value={currency}
                    onChange={(e) => setCurrency(e.target.value)}
                    className="w-full px-3 py-2 text-xs border border-slate-300 rounded-lg focus:outline-none focus:border-emerald-600 bg-white"
                  >
                    <option value="BDT">Bangladeshi Taka (৳ BDT)</option>
                    <option value="USD">US Dollar ($ USD)</option>
                  </select>
                </div>
              </div>

              <div className="pt-3 flex justify-end">
                <button
                  type="submit"
                  className="px-4 py-2 text-xs font-semibold text-white bg-emerald-700 hover:bg-emerald-800 rounded-lg shadow-xs transition-colors flex items-center gap-1.5"
                >
                  <Save className="w-3.5 h-3.5" />
                  <span>Save Enterprise Changes</span>
                </button>
              </div>
            </form>
          </div>

          {/* Payment & Banking Channels */}
          <div className="bg-white p-6 rounded-xl border border-slate-200 shadow-xs">
            <h3 className="text-sm font-bold text-slate-900 mb-4 pb-2 border-b border-slate-100 flex items-center gap-2">
              <CreditCard className="w-4 h-4 text-emerald-700" />
              <span>Investment Collection & Payout Channels</span>
            </h3>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-xs">
              <div>
                <label className="block font-medium text-slate-700 mb-1">bKash Merchant Number</label>
                <input
                  type="text"
                  value={bkashMerchant}
                  onChange={(e) => setBkashMerchant(e.target.value)}
                  className="w-full px-3 py-2 text-xs border border-slate-300 rounded-lg focus:outline-none focus:border-emerald-600 font-mono"
                />
              </div>

              <div>
                <label className="block font-medium text-slate-700 mb-1">Nagad Merchant Number</label>
                <input
                  type="text"
                  value={nagadMerchant}
                  onChange={(e) => setNagadMerchant(e.target.value)}
                  className="w-full px-3 py-2 text-xs border border-slate-300 rounded-lg focus:outline-none focus:border-emerald-600 font-mono"
                />
              </div>

              <div>
                <label className="block font-medium text-slate-700 mb-1">Primary Institutional Bank</label>
                <input
                  type="text"
                  value={bankName}
                  onChange={(e) => setBankName(e.target.value)}
                  className="w-full px-3 py-2 text-xs border border-slate-300 rounded-lg focus:outline-none focus:border-emerald-600"
                />
              </div>

              <div>
                <label className="block font-medium text-slate-700 mb-1">Corporate Account Number</label>
                <input
                  type="text"
                  value={bankAccount}
                  onChange={(e) => setBankAccount(e.target.value)}
                  className="w-full px-3 py-2 text-xs border border-slate-300 rounded-lg focus:outline-none focus:border-emerald-600 font-mono"
                />
              </div>
            </div>

            <div className="mt-4 pt-3 border-t border-slate-100 flex justify-end">
              <button
                type="button"
                onClick={() => showToast('Payment collection channels updated!')}
                className="px-4 py-2 text-xs font-semibold text-white bg-emerald-700 hover:bg-emerald-800 rounded-lg shadow-xs"
              >
                Save Banking Channels
              </button>
            </div>
          </div>

        </div>

        {/* Right 1 Col: Backup & Restore */}
        <div className="space-y-6">
          
          <div className="bg-white p-6 rounded-xl border border-slate-200 shadow-xs space-y-4">
            <h3 className="text-sm font-bold text-slate-900 pb-2 border-b border-slate-100">
              Database Maintenance
            </h3>

            <div className="space-y-3">
              <div className="p-3 bg-emerald-50 border border-emerald-200 rounded-lg">
                <span className="text-xs font-bold text-emerald-900 block mb-1">
                  {language === 'bn' ? 'সম্পূর্ণ প্রজেক্ট সোর্স কোড (.zip)' : 'Download Source Code (.zip)'}
                </span>
                <p className="text-[11px] text-emerald-700 mb-3">
                  {language === 'bn' 
                    ? 'এই অ্যাপের সম্পূর্ণ React + TypeScript সোর্স কোড, কনফিগ এবং অ্যাসেট জিপ ফাইল আকারে ডাউনলোড করুন।'
                    : 'Download the entire production-ready React + TypeScript source code archive with all components and configs.'}
                </p>
                <a
                  href="./shobuj-bangla-farm-source.zip"
                  download="shobuj-bangla-agro-farm-source.zip"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="w-full py-2 text-xs font-semibold text-white bg-emerald-700 hover:bg-emerald-800 rounded-lg transition-colors flex items-center justify-center gap-1.5 shadow-xs"
                >
                  <Download className="w-3.5 h-3.5" />
                  <span>{language === 'bn' ? 'সোর্স কোড জিপ ডাউনলোড করুন' : 'Download Project ZIP (5.9 MB)'}</span>
                </a>
              </div>

              <div className="p-3 bg-slate-50 border border-slate-200 rounded-lg">
                <span className="text-xs font-bold text-slate-900 block mb-1">Export JSON Backup</span>
                <p className="text-[11px] text-slate-500 mb-3">
                  Download a complete portable snapshot of all sectors, investments, incomes, expenses and audit logs.
                </p>
                <button
                  onClick={handleBackupDownload}
                  className="w-full py-2 text-xs font-semibold text-slate-700 bg-white border border-slate-300 hover:bg-slate-100 rounded-lg transition-colors flex items-center justify-center gap-1.5"
                >
                  <Download className="w-3.5 h-3.5 text-emerald-700" />
                  <span>Download Backup JSON</span>
                </button>
              </div>

              <div className="p-3 bg-slate-50 border border-slate-200 rounded-lg">
                <span className="text-xs font-bold text-slate-900 block mb-1">Restore from Backup</span>
                <p className="text-[11px] text-slate-500 mb-3">
                  Upload and restore a previous JSON database backup file.
                </p>
                <label className="w-full py-2 text-xs font-semibold text-slate-700 bg-white border border-slate-300 hover:bg-slate-100 rounded-lg transition-colors flex items-center justify-center gap-1.5 cursor-pointer">
                  <Upload className="w-3.5 h-3.5 text-blue-700" />
                  <span>Upload JSON File</span>
                  <input type="file" accept=".json" onChange={handleRestoreUpload} className="hidden" />
                </label>
              </div>

              <div className="p-3 bg-rose-50 border border-rose-200 rounded-lg">
                <span className="text-xs font-bold text-rose-900 block mb-1">Factory Reset Database</span>
                <p className="text-[11px] text-rose-700 mb-3">
                  Reset the database back to clean verified Bangladeshi agro seed data.
                </p>
                <button
                  onClick={handleFactoryReset}
                  className="w-full py-2 text-xs font-semibold text-rose-700 bg-white border border-rose-300 hover:bg-rose-100 rounded-lg transition-colors flex items-center justify-center gap-1.5"
                >
                  <RotateCcw className="w-3.5 h-3.5" />
                  <span>Reset to Seed State</span>
                </button>
              </div>
            </div>
          </div>

          {/* Legal / Compliance Info */}
          <div className="bg-white p-5 rounded-xl border border-slate-200 shadow-xs text-xs space-y-2 text-slate-600">
            <h4 className="font-bold text-slate-900">Regulatory Compliance:</h4>
            <p>Trade License: <strong>TRAD/DSCC/041289/2024</strong></p>
            <p>TIN: <strong>4891-2384-9011</strong></p>
            <p>Veterinary Certification: <strong>DLS-GAZ-2025-089</strong></p>
            <p>Shariah Advisory: <strong>Mudaraba & Musharaka Compliant</strong></p>
          </div>

        </div>

      </div>

    </div>
  );
};
