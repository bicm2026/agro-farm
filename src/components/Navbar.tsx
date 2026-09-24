import React, { useState } from 'react';
import { useApp } from '../context/AppContext';
import { RoleSwitcherModal } from './RoleSwitcherModal';
import { LoginModal } from './LoginModal';
import { 
  ShieldCheck, 
  UserCheck, 
  Briefcase, 
  Wallet, 
  Globe, 
  Menu, 
  X, 
  HardDrive, 
  Lock, 
  LogOut,
  ChevronDown
} from 'lucide-react';

interface Props {
  onToggleSidebar?: () => void;
  isSidebarOpen?: boolean;
}

export const Navbar: React.FC<Props> = ({ onToggleSidebar, isSidebarOpen }) => {
  const { 
    currentUser, 
    language, 
    setLanguage, 
    activeTab, 
    setActiveTab, 
    t, 
    db, 
    isLoggedIn, 
    logout, 
    isLoginModalOpen, 
    setIsLoginModalOpen 
  } = useApp();
  
  const [isRoleModalOpen, setIsRoleModalOpen] = useState(false);

  const getRoleShortLabel = (role: string) => {
    switch (role) {
      case 'super_admin':
        return language === 'bn' ? 'সুপার অ্যাডমিন' : 'Super Admin';
      case 'accountant':
        return language === 'bn' ? 'হিসাবরক্ষক' : 'Accountant';
      case 'sector_manager':
        return language === 'bn' ? 'খামার ম্যানেজার' : 'Sector Manager';
      case 'investor':
        return language === 'bn' ? 'বিনিয়োগকারী' : 'Investor';
      default:
        return role;
    }
  };

  const getRoleIcon = (role: string) => {
    switch (role) {
      case 'super_admin':
        return ShieldCheck;
      case 'accountant':
        return Briefcase;
      case 'sector_manager':
        return UserCheck;
      case 'investor':
        return Wallet;
      default:
        return UserCheck;
    }
  };

  const RoleIcon = getRoleIcon(currentUser.role);

  return (
    <>
      <header className="sticky top-0 z-40 bg-white border-b border-slate-200 shadow-xs">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-16 gap-4">
            
            {/* Zone 1: Brand title & logo */}
            <div className="flex items-center gap-3 shrink-0">
              {isLoggedIn && activeTab !== 'public' && activeTab !== 'website' && onToggleSidebar && (
                <button
                  onClick={onToggleSidebar}
                  className="p-2 text-slate-600 hover:text-slate-900 rounded-lg hover:bg-slate-100 transition-colors flex items-center justify-center"
                  aria-label="Toggle Navigation"
                  title={isSidebarOpen ? (language === 'bn' ? 'সাইডবার লুকান' : 'Hide Sidebar') : (language === 'bn' ? 'সাইডবার দেখান' : 'Show Sidebar')}
                >
                  {isSidebarOpen ? <X className="w-5 h-5 text-slate-700" /> : <Menu className="w-5 h-5 text-slate-700" />}
                </button>
              )}

              <button
                onClick={() => setActiveTab('public')}
                className="text-left group flex items-center gap-3 focus:outline-none"
              >
                <div className="w-10 h-10 rounded-xl overflow-hidden bg-white shadow-xs border border-emerald-100 flex items-center justify-center shrink-0 group-hover:border-emerald-300 transition-colors">
                  <img
                    src="/logo.png"
                    alt="Ahmadun Agro Logo"
                    referrerPolicy="no-referrer"
                    className="w-full h-full object-contain"
                    onError={(e) => {
                      (e.currentTarget as HTMLImageElement).src = '/logo.svg';
                    }}
                  />
                </div>
                <div>
                  <div className="flex items-center gap-1.5">
                    <span className="text-base sm:text-lg font-black tracking-tight text-slate-900 group-hover:text-emerald-700 transition-colors">
                      Ahmadun Agro
                    </span>
                    <span className="text-[11px] font-bold text-emerald-800 bg-emerald-50 px-1.5 py-0.5 rounded border border-emerald-200">
                      আহমাদুন এগ্রো
                    </span>
                  </div>
                  <span className="hidden sm:block text-[11px] text-slate-500 font-medium leading-none mt-0.5">
                    {language === 'bn' ? 'স্বচ্ছ আধুনিক বহুমুখী কৃষি ও বিনিয়োগ' : 'Smart Integrated Agro & Investment'}
                  </span>
                </div>
              </button>
            </div>

            {/* Zone 2: Navigation Links */}
            <nav className="hidden md:flex items-center gap-6 text-sm font-medium text-slate-600">
              <button
                onClick={() => setActiveTab('public')}
                className={`hover:text-slate-900 transition-colors whitespace-nowrap ${
                  activeTab === 'public' || activeTab === 'website' ? 'text-emerald-700 font-semibold border-b-2 border-emerald-700 py-5' : ''
                }`}
              >
                {t.publicSite}
              </button>

              {/* Show internal links ONLY if logged in */}
              {isLoggedIn && (
                currentUser.role === 'investor' ? (
                  <>
                    <button
                      onClick={() => setActiveTab('investorPortal')}
                      className={`hover:text-slate-900 transition-colors whitespace-nowrap ${
                        activeTab === 'investorPortal' ? 'text-emerald-700 font-semibold border-b-2 border-emerald-700 py-5' : ''
                      }`}
                    >
                      {t.investorPortalTitle}
                    </button>
                    <button
                      onClick={() => setActiveTab('sectors')}
                      className={`hover:text-slate-900 transition-colors whitespace-nowrap ${
                        activeTab === 'sectors' ? 'text-emerald-700 font-semibold border-b-2 border-emerald-700 py-5' : ''
                      }`}
                    >
                      {t.sectors}
                    </button>
                    <button
                      onClick={() => setActiveTab('reports')}
                      className={`hover:text-slate-900 transition-colors whitespace-nowrap ${
                        activeTab === 'reports' ? 'text-emerald-700 font-semibold border-b-2 border-emerald-700 py-5' : ''
                      }`}
                    >
                      {t.reports}
                    </button>
                  </>
                ) : (
                  <>
                    <button
                      onClick={() => setActiveTab('dashboard')}
                      className={`hover:text-slate-900 transition-colors whitespace-nowrap ${
                        activeTab === 'dashboard' ? 'text-emerald-700 font-semibold border-b-2 border-emerald-700 py-5' : ''
                      }`}
                    >
                      {t.dashboard}
                    </button>
                    <button
                      onClick={() => setActiveTab('sectors')}
                      className={`hover:text-slate-900 transition-colors whitespace-nowrap ${
                        activeTab === 'sectors' ? 'text-emerald-700 font-semibold border-b-2 border-emerald-700 py-5' : ''
                      }`}
                    >
                      {t.sectors}
                    </button>
                    <button
                      onClick={() => setActiveTab('accounting')}
                      className={`hover:text-slate-900 transition-colors whitespace-nowrap ${
                        activeTab === 'accounting' ? 'text-emerald-700 font-semibold border-b-2 border-emerald-700 py-5' : ''
                      }`}
                    >
                      {t.accounting}
                    </button>
                    <button
                      onClick={() => setActiveTab('reports')}
                      className={`hover:text-slate-900 transition-colors whitespace-nowrap ${
                        activeTab === 'reports' ? 'text-emerald-700 font-semibold border-b-2 border-emerald-700 py-5' : ''
                      }`}
                    >
                      {t.reports}
                    </button>
                  </>
                )
              )}
            </nav>

            {/* Zone 3: Actions & Controls */}
            <div className="flex items-center gap-2 sm:gap-3 shrink-0">
              
              {/* Google Drive Shortcut for logged in admins */}
              {isLoggedIn && currentUser.role !== 'investor' && (
                <button
                  onClick={() => setActiveTab('drive')}
                  className={`hidden sm:flex items-center gap-1.5 px-2.5 py-1.5 text-xs font-semibold rounded-lg border transition-colors ${
                    activeTab === 'drive'
                      ? 'bg-emerald-50 text-emerald-800 border-emerald-300'
                      : 'bg-white text-slate-700 border-slate-200 hover:bg-slate-50'
                  }`}
                  title="Google Drive Cloud Storage"
                >
                  <HardDrive className="w-3.5 h-3.5 text-emerald-700" />
                  <span>Drive</span>
                </button>
              )}

              {/* Language Switcher */}
              <div className="flex items-center bg-slate-100 p-0.5 rounded-lg border border-slate-200">
                <button
                  onClick={() => setLanguage('bn')}
                  className={`px-2.5 py-1 text-xs font-semibold rounded-md transition-colors ${
                    language === 'bn'
                      ? 'bg-white text-emerald-800 shadow-xs'
                      : 'text-slate-600 hover:text-slate-900'
                  }`}
                  title="বাংলা ভাষায় দেখুন"
                >
                  বাংলা
                </button>
                <button
                  onClick={() => setLanguage('en')}
                  className={`px-2.5 py-1 text-xs font-semibold rounded-md transition-colors ${
                    language === 'en'
                      ? 'bg-white text-emerald-800 shadow-xs'
                      : 'text-slate-600 hover:text-slate-900'
                  }`}
                  title="Switch to English"
                >
                  EN
                </button>
              </div>

              {/* Conditional: Logged In vs Public Visitor */}
              {isLoggedIn ? (
                <>
                  {/* Active User Badge */}
                  <button
                    onClick={() => setIsRoleModalOpen(true)}
                    className="flex items-center gap-1.5 px-2.5 py-1.5 text-xs font-medium text-slate-800 bg-slate-50 border border-slate-300 rounded-lg hover:bg-slate-100 transition-colors"
                    title={language === 'bn' ? 'আমার প্রোফাইল ও অ্যাকাউন্ট' : 'My Profile & Account'}
                  >
                    <RoleIcon className="w-3.5 h-3.5 text-emerald-700" />
                    <span className="hidden sm:inline-block max-w-[120px] truncate font-medium">
                      {currentUser.name.split(' ')[0]}
                    </span>
                    <span className="text-[10px] px-1.5 py-0.5 bg-emerald-100 text-emerald-800 rounded font-semibold whitespace-nowrap">
                      {getRoleShortLabel(currentUser.role)}
                    </span>
                    <ChevronDown className="w-3 h-3 text-slate-400" />
                  </button>

                  {/* Dashboard / Portal Direct Link */}
                  {activeTab === 'public' || activeTab === 'website' ? (
                    <button
                      onClick={() => {
                        if (currentUser.role === 'investor') {
                          setActiveTab('investorPortal');
                        } else {
                          setActiveTab('dashboard');
                        }
                      }}
                      className="px-3 py-1.5 text-xs font-semibold text-white bg-emerald-700 hover:bg-emerald-800 rounded-lg shadow-xs transition-colors whitespace-nowrap flex items-center gap-1"
                    >
                      <span>{currentUser.role === 'investor' ? (language === 'bn' ? 'পোর্টাল' : 'Portal') : (language === 'bn' ? 'ম্যানেজমেন্ট' : 'Dashboard')}</span>
                      <span>→</span>
                    </button>
                  ) : null}

                  {/* Sign Out Button */}
                  <button
                    onClick={logout}
                    className="p-1.5 sm:px-2.5 sm:py-1.5 text-xs font-medium text-rose-700 bg-rose-50 hover:bg-rose-100 border border-rose-200 rounded-lg transition-colors flex items-center gap-1.5"
                    title={language === 'bn' ? 'লগআউট করুন' : 'Sign Out'}
                  >
                    <LogOut className="w-3.5 h-3.5" />
                    <span className="hidden sm:inline">{language === 'bn' ? 'লগআউট' : 'Logout'}</span>
                  </button>
                </>
              ) : (
                /* Pure Public Visitor State: Single Professional Login Button */
                <button
                  onClick={() => setIsLoginModalOpen(true)}
                  className="flex items-center gap-1.5 px-4 py-2 text-xs sm:text-sm font-semibold text-white bg-emerald-700 hover:bg-emerald-800 rounded-lg shadow-sm transition-all hover:shadow"
                >
                  <Lock className="w-3.5 h-3.5 sm:w-4 sm:h-4 text-emerald-200" />
                  <span>{language === 'bn' ? 'লগইন করুন' : 'Sign In'}</span>
                </button>
              )}

            </div>
          </div>
        </div>
      </header>

      {/* Role Switcher Modal (accessible when logged in) */}
      <RoleSwitcherModal
        isOpen={isRoleModalOpen}
        onClose={() => setIsRoleModalOpen(false)}
      />

      {/* Login Modal */}
      <LoginModal
        isOpen={isLoginModalOpen}
        onClose={() => setIsLoginModalOpen(false)}
      />
    </>
  );
};
