import React from 'react';
import { useApp } from '../context/AppContext';
import { User } from '../types';
import { ShieldCheck, UserCheck, Briefcase, Wallet, Users } from 'lucide-react';

interface Props {
  isOpen: boolean;
  onClose: () => void;
}

export const RoleSwitcherModal: React.FC<Props> = ({ isOpen, onClose }) => {
  const { db, currentUser, setCurrentUser, setActiveTab, setSelectedInvestorId, setSelectedSectorId, t } = useApp();

  if (!isOpen) return null;

  const handleSelectUser = (user: User) => {
    setCurrentUser(user);
    if (user.role === 'investor' && user.investorProfileId) {
      setSelectedInvestorId(user.investorProfileId);
      setActiveTab('investorPortal');
    } else if (user.role === 'sector_manager' && user.assignedSectorId) {
      setSelectedSectorId(user.assignedSectorId);
      setActiveTab('sectors');
    } else {
      setActiveTab('dashboard');
    }
    onClose();
  };

  const getRoleBadge = (role: string) => {
    switch (role) {
      case 'super_admin':
        return { label: 'Super Admin / Managing Director', icon: ShieldCheck, color: 'text-amber-700 bg-amber-50 border-amber-200' };
      case 'accountant':
        return { label: 'Accountant / Financial Officer', icon: Briefcase, color: 'text-blue-700 bg-blue-50 border-blue-200' };
      case 'sector_manager':
        return { label: 'Farm Sector Manager', icon: UserCheck, color: 'text-emerald-700 bg-emerald-50 border-emerald-200' };
      case 'investor':
        return { label: 'Verified Agro Investor', icon: Wallet, color: 'text-purple-700 bg-purple-50 border-purple-200' };
      default:
        return { label: role, icon: Users, color: 'text-slate-700 bg-slate-50 border-slate-200' };
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-xs p-4">
      <div className="bg-white rounded-xl shadow-2xl max-w-lg w-full overflow-hidden border border-slate-200 animate-in fade-in zoom-in-95 duration-200">
        <div className="px-6 py-4 border-b border-slate-200 bg-slate-50 flex items-center justify-between">
          <div>
            <h3 className="text-base font-semibold text-slate-900">{t.switchRole}</h3>
            <p className="text-xs text-slate-500 mt-0.5">
              Select an account to test permissions, security isolation & personal dashboards
            </p>
          </div>
          <button
            onClick={onClose}
            className="text-slate-400 hover:text-slate-600 p-1 rounded-md hover:bg-slate-200/60 transition-colors"
          >
            ✕
          </button>
        </div>

        <div className="p-6 space-y-3 max-h-[70vh] overflow-y-auto">
          {db.users.map((u) => {
            const roleInfo = getRoleBadge(u.role);
            const Icon = roleInfo.icon;
            const isCurrent = u.id === currentUser.id;

            return (
              <button
                key={u.id}
                onClick={() => handleSelectUser(u)}
                className={`w-full text-left p-3.5 rounded-lg border transition-all flex items-start gap-3.5 ${
                  isCurrent
                    ? 'border-emerald-600 bg-emerald-50/40 ring-1 ring-emerald-600'
                    : 'border-slate-200 hover:border-slate-300 hover:bg-slate-50'
                }`}
              >
                <div className="w-10 h-10 rounded-full bg-slate-100 border border-slate-200 flex items-center justify-center shrink-0 overflow-hidden">
                  {u.avatar ? (
                    <img src={u.avatar} alt={u.name} className="w-full h-full object-cover" />
                  ) : (
                    <Icon className="w-5 h-5 text-slate-600" />
                  )}
                </div>

                <div className="flex-1 min-w-0">
                  <div className="flex items-center justify-between gap-2">
                    <span className="text-sm font-semibold text-slate-900 truncate">
                      {u.name}
                    </span>
                    {isCurrent && (
                      <span className="text-[11px] font-medium text-emerald-700 bg-emerald-100/80 px-2 py-0.5 rounded-sm">
                        Active Now
                      </span>
                    )}
                  </div>
                  <p className="text-xs text-slate-500 truncate mt-0.5">{u.email}</p>
                  <div className="mt-2 flex items-center gap-2 text-xs text-slate-600">
                    <span className={`inline-flex items-center gap-1 px-2 py-0.5 rounded border text-[11px] font-medium ${roleInfo.color}`}>
                      <Icon className="w-3 h-3" />
                      {roleInfo.label}
                    </span>
                    {u.assignedSectorId && (
                      <span className="text-slate-400 text-[11px]">
                        Sector: {db.sectors.find((s) => s.id === u.assignedSectorId)?.name}
                      </span>
                    )}
                  </div>
                </div>
              </button>
            );
          })}
        </div>

        <div className="px-6 py-3 bg-slate-50 border-t border-slate-200 text-xs text-slate-500 flex justify-between items-center">
          <span>Tip: Switch to Investors to verify data privacy isolation.</span>
          <button
            onClick={onClose}
            className="px-3 py-1.5 text-xs font-medium text-slate-700 bg-white border border-slate-300 rounded hover:bg-slate-100"
          >
            Close
          </button>
        </div>
      </div>
    </div>
  );
};
