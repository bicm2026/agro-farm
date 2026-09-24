import React, { useState } from 'react';
import { AppProvider, useApp } from './context/AppContext';
import { Navbar } from './components/Navbar';
import { Sidebar } from './components/Sidebar';
import { PublicWebsite } from './components/PublicWebsite';
import { AdminDashboard } from './components/AdminDashboard';
import { SectorsView } from './components/SectorsView';
import { InvestorsView } from './components/InvestorsView';
import { InvestmentsView } from './components/InvestmentsView';
import { FarmOperationsView } from './components/FarmOperationsView';
import { IncomeView } from './components/IncomeView';
import { ExpenseView } from './components/ExpenseView';
import { AccountingView } from './components/AccountingView';
import { InvestorProfitView } from './components/InvestorProfitView';
import { InventoryView } from './components/InventoryView';
import { AssetManagementView } from './components/AssetManagementView';
import { DocumentManagementView } from './components/DocumentManagementView';
import { GoogleDriveView } from './components/GoogleDriveView';
import { ReportsView } from './components/ReportsView';
import { CustomModuleBuilderView } from './components/CustomModuleBuilderView';
import { CustomDashboardBuilderView } from './components/CustomDashboardBuilderView';
import { AuditTrailView } from './components/AuditTrailView';
import { SettingsView } from './components/SettingsView';
import { InvestorPortalView } from './components/InvestorPortalView';
import { ShieldAlert, CheckCircle2, ArrowRight } from 'lucide-react';

const AppContent: React.FC = () => {
  const { 
    activeTab, 
    setActiveTab, 
    currentUser, 
    setCurrentUser,
    db,
    notificationMessage, 
    language,
    isLoggedIn,
    logout
  } = useApp();
  const [isMobileSidebarOpen, setIsMobileSidebarOpen] = useState(false);
  const [isDesktopSidebarOpen, setIsDesktopSidebarOpen] = useState(true);

  const toggleSidebar = () => {
    if (typeof window !== 'undefined' && window.innerWidth >= 1024) {
      setIsDesktopSidebarOpen((prev) => !prev);
    } else {
      setIsMobileSidebarOpen((prev) => !prev);
    }
  };

  const isPublicSite = !isLoggedIn || activeTab === 'public' || activeTab === 'website';

  // Role Permissions Check
  const isInvestorOnly = currentUser.role === 'investor';
  const adminOnlyTabs = ['investors', 'investments', 'accounting', 'moduleBuilder', 'dashboardBuilder', 'auditTrail', 'auditLogs', 'settings'];
  const isRestrictedForCurrent = isLoggedIn && isInvestorOnly && adminOnlyTabs.includes(activeTab);

  // Render view component
  const renderActiveView = () => {
    if (!isLoggedIn) {
      return <PublicWebsite />;
    }

    if (isRestrictedForCurrent) {
      return (
        <div className="max-w-2xl mx-auto my-12 p-8 bg-white rounded-2xl border border-slate-200 shadow-sm text-center space-y-4">
          <div className="w-12 h-12 rounded-full bg-amber-100 text-amber-800 flex items-center justify-center mx-auto">
            <ShieldAlert className="w-6 h-6" />
          </div>
          <h2 className="text-lg font-bold text-slate-900">
            {language === 'bn' ? 'সংরক্ষিত ব্যবস্থাপনা এলাকা' : 'Restricted Management Area'}
          </h2>
          <p className="text-xs text-slate-600 max-w-md mx-auto">
            {language === 'bn'
              ? `আপনি বর্তমানে বিনিয়োগকারী হিসেবে লগইন আছেন (${currentUser.name})। আপনার শুধুমাত্র ব্যক্তিগত ইনভেস্টর পোর্টাল, ফার্ম সেক্টর এবং প্রজেক্ট তথ্যে অ্যাক্সেস রয়েছে।`
              : `You are signed in as an Investor (${currentUser.name}). You have access to your personal Investor Portal, Farm Sectors, and Legal Documents.`}
          </p>
          <div className="pt-3 flex flex-wrap justify-center gap-3">
            <button
              onClick={() => setActiveTab('investorPortal')}
              className="px-4 py-2 text-xs font-semibold text-white bg-emerald-700 hover:bg-emerald-800 rounded-lg shadow-xs transition-colors flex items-center gap-1.5"
            >
              <span>{language === 'bn' ? 'আমার ইনভেস্টর পোর্টালে যান' : 'Go to My Investor Portal'}</span>
              <ArrowRight className="w-3.5 h-3.5" />
            </button>
            <button
              onClick={logout}
              className="px-4 py-2 text-xs font-semibold text-slate-700 bg-slate-100 hover:bg-slate-200 rounded-lg transition-colors"
            >
              {language === 'bn' ? 'লগআউট করুন' : 'Sign Out'}
            </button>
          </div>
        </div>
      );
    }

    switch (activeTab) {
      case 'public':
      case 'website':
        return <PublicWebsite />;
      case 'dashboard':
        return <AdminDashboard />;
      case 'sectors':
        return <SectorsView />;
      case 'investors':
        return <InvestorsView />;
      case 'investments':
        return <InvestmentsView />;
      case 'operations':
        return <FarmOperationsView />;
      case 'income':
        return <IncomeView />;
      case 'expense':
        return <ExpenseView />;
      case 'accounting':
        return <AccountingView />;
      case 'profitSharing':
        return <InvestorProfitView />;
      case 'inventory':
        return <InventoryView />;
      case 'assets':
        return <AssetManagementView />;
      case 'documents':
        return <DocumentManagementView />;
      case 'drive':
        return <GoogleDriveView />;
      case 'reports':
        return <ReportsView />;
      case 'moduleBuilder':
        return <CustomModuleBuilderView />;
      case 'dashboardBuilder':
        return <CustomDashboardBuilderView />;
      case 'auditTrail':
      case 'auditLogs':
        return <AuditTrailView />;
      case 'settings':
        return <SettingsView />;
      case 'investorPortal':
        return <InvestorPortalView />;
      default:
        return <AdminDashboard />;
    }
  };

  return (
    <div className="min-h-screen bg-slate-50 text-slate-900 flex flex-col font-sans selection:bg-emerald-100 selection:text-emerald-900">
      
      {/* Top Navbar */}
      <Navbar 
        onToggleSidebar={toggleSidebar} 
        isSidebarOpen={typeof window !== 'undefined' && window.innerWidth >= 1024 ? isDesktopSidebarOpen : isMobileSidebarOpen} 
      />

      {/* Main Layout Area */}
      {isPublicSite ? (
        <main className="flex-1">
          <PublicWebsite />
        </main>
      ) : (
        <div className="flex-1 flex max-w-7xl w-full mx-auto px-4 sm:px-6 py-6 gap-6">
          {/* Responsive Sidebar (Docked in-flow on desktop, slide drawer on mobile) */}
          <Sidebar 
            isOpen={isMobileSidebarOpen} 
            onClose={() => setIsMobileSidebarOpen(false)}
            isDesktopVisible={isDesktopSidebarOpen}
          />

          {/* Primary View Container (takes remaining width beside sidebar, never overlapped) */}
          <main className="flex-1 min-w-0">
            {renderActiveView()}
          </main>
        </div>
      )}

      {/* Floating System Notification Toast */}
      {notificationMessage && (
        <div className="fixed bottom-6 right-6 z-50 animate-in fade-in slide-in-from-bottom-4 duration-200">
          <div className="px-4 py-3 bg-slate-900 text-white rounded-xl shadow-2xl border border-slate-700 text-xs font-medium flex items-center gap-2.5">
            <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
            <span>{notificationMessage}</span>
          </div>
        </div>
      )}

      {/* Footer bar */}
      <footer className="bg-white border-t border-slate-200 py-3 text-center text-[11px] text-slate-500">
        <span>© {new Date().getFullYear()} Ahmadun Agro (আহমাদুন এগ্রো). All Rights Reserved. Reg: TRAD/DSCC/041289/2024 · Gazipur, Bangladesh</span>
      </footer>

    </div>
  );
};

export default function App() {
  return (
    <AppProvider>
      <AppContent />
    </AppProvider>
  );
}
