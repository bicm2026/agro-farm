import React from 'react';
import { useApp } from '../context/AppContext';
import { ShieldCheck, UserCheck, Briefcase, Wallet, Users, Mail, Phone, LogOut, CheckCircle2 } from 'lucide-react';

interface Props {
  isOpen: boolean;
  onClose: () => void;
}

export const RoleSwitcherModal: React.FC<Props> = ({ isOpen, onClose }) => {
  const { db, currentUser, language, logout, setActiveTab, setSelectedInvestorId, setSelectedSectorId } = useApp();

  if (!isOpen) return null;

  const getRoleBadge = (role: string) => {
    switch (role) {
      case 'super_admin':
        return { 
          label: language === 'bn' ? 'সুপার অ্যাডমিন (ব্যবস্থাপনা পরিচালক)' : 'Super Admin / Managing Director', 
          icon: ShieldCheck, 
          color: 'text-amber-800 bg-amber-50 border-amber-300' 
        };
      case 'accountant':
        return { 
          label: language === 'bn' ? 'প্রধান হিসাবরক্ষক' : 'Chief Financial Officer / Accountant', 
          icon: Briefcase, 
          color: 'text-blue-800 bg-blue-50 border-blue-300' 
        };
      case 'sector_manager':
        return { 
          label: language === 'bn' ? 'ফার্ম সেক্টর ম্যানেজার' : 'Farm Sector Manager', 
          icon: UserCheck, 
          color: 'text-emerald-800 bg-emerald-50 border-emerald-300' 
        };
      case 'investor':
        return { 
          label: language === 'bn' ? 'নিবন্ধিত কৃষি বিনিয়োগকারী' : 'Verified Agro Investor', 
          icon: Wallet, 
          color: 'text-purple-800 bg-purple-50 border-purple-300' 
        };
      default:
        return { 
          label: role, 
          icon: Users, 
          color: 'text-slate-800 bg-slate-50 border-slate-300' 
        };
    }
  };

  const roleInfo = getRoleBadge(currentUser.role);
  const Icon = roleInfo.icon;
  const assignedSector = currentUser.assignedSectorId 
    ? db.sectors.find(s => s.id === currentUser.assignedSectorId) 
    : null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-xs p-4 animate-in fade-in duration-200">
      <div className="bg-white rounded-2xl shadow-2xl max-w-md w-full overflow-hidden border border-slate-200 animate-in zoom-in-95 duration-200">
        
        {/* Header */}
        <div className="px-6 py-4 border-b border-slate-200 bg-slate-50 flex items-center justify-between">
          <div>
            <h3 className="text-base font-bold text-slate-900">
              {language === 'bn' ? 'প্রোফাইল ও অ্যাকাউন্ট বিবরণ' : 'Account & Profile Details'}
            </h3>
            <p className="text-xs text-slate-500 mt-0.5">
              {language === 'bn' ? 'আহমাদুন এগ্রো ম্যানেজমেন্ট পোর্টাল' : 'Ahmadun Agro Management Portal'}
            </p>
          </div>
          <button
            onClick={onClose}
            className="text-slate-400 hover:text-slate-600 p-1.5 rounded-lg hover:bg-slate-200/60 transition-colors"
          >
            ✕
          </button>
        </div>

        {/* User Card */}
        <div className="p-6 space-y-5">
          <div className="flex items-center gap-4 p-4 rounded-xl bg-slate-50 border border-slate-200">
            <div className="w-14 h-14 rounded-2xl bg-emerald-100 border border-emerald-200 flex items-center justify-center shrink-0 overflow-hidden text-emerald-800 font-bold text-xl">
              {currentUser.avatar ? (
                <img src={currentUser.avatar} alt={currentUser.name} className="w-full h-full object-cover" />
              ) : (
                <Icon className="w-7 h-7 text-emerald-700" />
              )}
            </div>

            <div className="min-w-0 flex-1">
              <div className="flex items-center gap-2">
                <h4 className="text-base font-bold text-slate-900 truncate">
                  {currentUser.name}
                </h4>
                <span className="flex items-center gap-0.5 text-[10px] font-semibold text-emerald-700 bg-emerald-100/80 px-2 py-0.5 rounded-full">
                  <CheckCircle2 className="w-3 h-3" />
                  {language === 'bn' ? 'সক্রিয়' : 'Active'}
                </span>
              </div>
              {currentUser.nameBn && (
                <p className="text-xs text-slate-600 truncate">{currentUser.nameBn}</p>
              )}
              <div className="mt-1.5">
                <span className={`inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-md border text-xs font-semibold ${roleInfo.color}`}>
                  <Icon className="w-3.5 h-3.5" />
                  {roleInfo.label}
                </span>
              </div>
            </div>
          </div>

          {/* Contact Details */}
          <div className="space-y-2.5 text-xs">
            <div className="flex items-center justify-between p-3 bg-white rounded-lg border border-slate-200">
              <div className="flex items-center gap-2 text-slate-500">
                <Mail className="w-4 h-4 text-slate-400" />
                <span>{language === 'bn' ? 'ইমেইল' : 'Email Address'}</span>
              </div>
              <span className="font-semibold text-slate-800">{currentUser.email}</span>
            </div>

            <div className="flex items-center justify-between p-3 bg-white rounded-lg border border-slate-200">
              <div className="flex items-center gap-2 text-slate-500">
                <Phone className="w-4 h-4 text-slate-400" />
                <span>{language === 'bn' ? 'ফোন নম্বর' : 'Phone'}</span>
              </div>
              <span className="font-semibold text-slate-800 font-mono">{currentUser.phone}</span>
            </div>

            {assignedSector && (
              <div className="flex items-center justify-between p-3 bg-white rounded-lg border border-slate-200">
                <div className="flex items-center gap-2 text-slate-500">
                  <UserCheck className="w-4 h-4 text-slate-400" />
                  <span>{language === 'bn' ? 'নিয়োজিত সেক্টর' : 'Assigned Sector'}</span>
                </div>
                <button
                  onClick={() => {
                    setSelectedSectorId(assignedSector.id);
                    setActiveTab('sectors');
                    onClose();
                  }}
                  className="font-bold text-emerald-700 hover:underline"
                >
                  {language === 'bn' ? assignedSector.nameBn : assignedSector.name}
                </button>
              </div>
            )}

            {currentUser.role === 'investor' && currentUser.investorProfileId && (
              <div className="flex items-center justify-between p-3 bg-white rounded-lg border border-slate-200">
                <div className="flex items-center gap-2 text-slate-500">
                  <Wallet className="w-4 h-4 text-slate-400" />
                  <span>{language === 'bn' ? 'বিনিয়োগকারী পোর্টাল' : 'Investor Profile'}</span>
                </div>
                <button
                  onClick={() => {
                    setSelectedInvestorId(currentUser.investorProfileId!);
                    setActiveTab('investorPortal');
                    onClose();
                  }}
                  className="font-bold text-emerald-700 hover:underline"
                >
                  {language === 'bn' ? 'পোর্টাল দেখুন →' : 'View Portal →'}
                </button>
              </div>
            )}
          </div>

          {/* Action buttons */}
          <div className="pt-2 flex items-center justify-between gap-3">
            <button
              onClick={() => {
                onClose();
                logout();
              }}
              className="flex-1 py-2 px-3 bg-rose-50 hover:bg-rose-100 text-rose-700 font-semibold text-xs rounded-lg border border-rose-200 transition-colors flex items-center justify-center gap-1.5"
            >
              <LogOut className="w-4 h-4" />
              <span>{language === 'bn' ? 'লগআউট করুন' : 'Sign Out'}</span>
            </button>

            <button
              onClick={onClose}
              className="py-2 px-4 bg-slate-100 hover:bg-slate-200 text-slate-700 font-semibold text-xs rounded-lg border border-slate-300 transition-colors"
            >
              {language === 'bn' ? 'বন্ধ করুন' : 'Close'}
            </button>
          </div>
        </div>

      </div>
    </div>
  );
};
