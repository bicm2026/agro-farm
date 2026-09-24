import React from 'react';
import { useApp } from '../context/AppContext';
import {
  LayoutDashboard,
  Sprout,
  Users,
  BadgeDollarSign,
  TrendingUp,
  Receipt,
  Scale,
  Percent,
  CalendarCheck,
  Boxes,
  Landmark,
  FileText,
  FileSpreadsheet,
  Boxes as CustomIcon,
  Sliders,
  History,
  Settings,
  ShieldAlert,
  WalletCards,
  HardDrive,
  Globe,
  X
} from 'lucide-react';

interface Props {
  isOpen?: boolean;
  onClose?: () => void;
  isDesktopVisible?: boolean;
}

export const Sidebar: React.FC<Props> = ({ 
  isOpen = false, 
  onClose = () => {},
  isDesktopVisible = true 
}) => {
  const { activeTab, setActiveTab, currentUser, db, t, language } = useApp();

  // Pending expenses count for accountant / admin
  const pendingExpensesCount = db.expenses.filter((e) => e.status === 'pending_approval').length;

  const isInvestor = currentUser.role === 'investor';
  const isSectorMgr = currentUser.role === 'sector_manager';
  const isAdmin = currentUser.role === 'super_admin' || currentUser.role === 'admin_manager';
  const isAccountant = currentUser.role === 'accountant';

  const navItems = isInvestor
    ? [
        { id: 'investorPortal', label: t.investorPortalTitle, icon: WalletCards },
        { id: 'documents', label: t.documents, icon: FileText },
        { id: 'drive', label: t.googleDrive, icon: HardDrive },
        { id: 'reports', label: t.reports, icon: FileSpreadsheet },
      ]
    : [
        { id: 'dashboard', label: t.dashboard, icon: LayoutDashboard },
        { id: 'sectors', label: t.sectors, icon: Sprout, count: db.sectors.length },
        { id: 'investors', label: t.investors, icon: Users, hide: isSectorMgr },
        { id: 'investments', label: t.investments, icon: BadgeDollarSign, hide: isSectorMgr },
        { id: 'income', label: t.income, icon: TrendingUp },
        { id: 'expense', label: t.expense, icon: Receipt, count: pendingExpensesCount, alert: pendingExpensesCount > 0 },
        { id: 'accounting', label: t.accounting, icon: Scale, hide: isSectorMgr },
        { id: 'profitSharing', label: t.profitSharing, icon: Percent, hide: isSectorMgr },
        { id: 'operations', label: t.operations, icon: CalendarCheck },
        { id: 'inventory', label: t.inventory, icon: Boxes },
        { id: 'assets', label: t.assets, icon: Landmark, hide: isSectorMgr },
        { id: 'documents', label: t.documents, icon: FileText },
        { id: 'drive', label: t.googleDrive, icon: HardDrive },
        { id: 'reports', label: t.reports, icon: FileSpreadsheet },
        { id: 'moduleBuilder', label: t.moduleBuilder, icon: CustomIcon, hide: !isAdmin },
        { id: 'dashboardBuilder', label: t.dashboardBuilder, icon: Sliders, hide: !isAdmin },
        { id: 'auditLogs', label: t.auditLogs, icon: History, hide: isSectorMgr },
        { id: 'settings', label: t.settings, icon: Settings, hide: !isAdmin },
      ];

  const handleNavClick = (id: string) => {
    setActiveTab(id);
    onClose();
  };

  return (
    <>
      {/* Mobile backdrop */}
      {isOpen && (
        <div
          onClick={onClose}
          className="fixed inset-0 z-40 bg-slate-950/60 lg:hidden backdrop-blur-xs transition-opacity"
        />
      )}

      <aside
        className={`
          /* Mobile drawer layout */
          fixed inset-y-0 left-0 z-50 w-72 bg-slate-900 text-slate-300 flex flex-col border-r border-slate-800 shadow-2xl transition-transform duration-200 ease-in-out
          ${isOpen ? 'translate-x-0' : '-translate-x-full'}

          /* Desktop in-flow docked layout (avoids overlapping dashboard content) */
          ${isDesktopVisible 
            ? 'lg:static lg:inset-auto lg:z-10 lg:w-64 lg:shrink-0 lg:translate-x-0 lg:flex lg:flex-col lg:rounded-2xl lg:shadow-xs lg:border lg:border-slate-800 lg:sticky lg:top-20 lg:h-[calc(100vh-6rem)] lg:overflow-hidden' 
            : 'lg:hidden'
          }
        `}
      >
        {/* User Card in Sidebar */}
        <div className="p-4 border-b border-slate-800 bg-slate-950/50">
          <div className="flex items-center justify-between gap-2">
            <div className="flex items-center gap-3 min-w-0">
              <div className="w-9 h-9 rounded-full bg-emerald-800/80 text-white flex items-center justify-center font-bold text-sm shrink-0 border border-emerald-600/40">
                {currentUser.name.charAt(0)}
              </div>
              <div className="min-w-0 flex-1">
                <p className="text-xs font-semibold text-white truncate">{currentUser.name}</p>
                <p className="text-[11px] text-slate-400 truncate">
                  {currentUser.role.replace('_', ' ').toUpperCase()}
                </p>
              </div>
            </div>

            {/* Mobile close button */}
            <button
              onClick={onClose}
              className="lg:hidden p-1.5 text-slate-400 hover:text-white rounded-lg hover:bg-slate-800 transition-colors shrink-0"
              title="Close navigation"
            >
              <X className="w-5 h-5" />
            </button>
          </div>

          {isSectorMgr && currentUser.assignedSectorId && (
            <div className="mt-2.5 px-2 py-1 bg-emerald-950/60 border border-emerald-800/50 rounded text-[11px] text-emerald-300 truncate">
              Assigned: {db.sectors.find((s) => s.id === currentUser.assignedSectorId)?.name}
            </div>
          )}
        </div>

        {/* Navigation list */}
        <div className="flex-1 overflow-y-auto px-3 py-3 space-y-1">
          {navItems
            .filter((item) => !item.hide)
            .map((item) => {
              const Icon = item.icon;
              const isActive = activeTab === item.id;

              return (
                <button
                  key={item.id}
                  onClick={() => handleNavClick(item.id)}
                  className={`w-full flex items-center justify-between px-3 py-2 text-xs font-medium rounded-lg transition-colors text-left ${
                    isActive
                      ? 'bg-emerald-700 text-white shadow-xs font-semibold'
                      : 'text-slate-300 hover:text-white hover:bg-slate-800/80'
                  }`}
                >
                  <div className="flex items-center gap-2.5 truncate">
                    <Icon className={`w-4 h-4 shrink-0 ${isActive ? 'text-white' : 'text-slate-400'}`} />
                    <span className="truncate">{item.label}</span>
                  </div>

                  {item.count !== undefined && item.count > 0 && (
                    <span
                      className={`text-[10px] font-bold px-1.5 py-0.5 rounded-full ${
                        item.alert
                          ? 'bg-amber-500 text-slate-950 font-bold'
                          : isActive
                          ? 'bg-emerald-900 text-emerald-100'
                          : 'bg-slate-800 text-slate-400'
                      }`}
                    >
                      {item.count}
                    </span>
                  )}
                </button>
              );
            })}
        </div>

        {/* Sidebar Footer info */}
        <div className="p-3 border-t border-slate-800 bg-slate-950/60 text-[11px] text-slate-500">
          <div className="flex justify-between items-center">
            <span>Audit Trail Verified</span>
            <span className="w-2 h-2 rounded-full bg-emerald-500"></span>
          </div>
          <div className="mt-1 text-[10px] text-slate-400">
            {language === 'bn' ? 'বাংলাদেশ এগ্রো স্ট্যান্ডার্ড ২০২৬' : 'Bangladesh Agro Standards 2026'}
          </div>
        </div>
      </aside>
    </>
  );
};
