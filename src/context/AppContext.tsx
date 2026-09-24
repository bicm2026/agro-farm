import React, { createContext, useContext, useState, useEffect } from 'react';
import { User, Language, FarmSector, IncomeRecord, ExpenseRecord, Investment, ProfitDistribution } from '../types';
import { AppDatabase, loadDatabase, saveDatabase, resetDatabaseToDefault, createAuditLog } from '../services/storage';
import { translations } from '../utils/translations';
import { 
  calculateGlobalFinancials, 
  calculateSectorFinancials, 
  calculateInvestorFinancials,
  GlobalFinancials,
  SectorFinancials,
  InvestorFinancials
} from '../utils/accounting';

interface AppContextType {
  db: AppDatabase;
  currentUser: User;
  setCurrentUser: (user: User) => void;
  isLoggedIn: boolean;
  login: (user: User) => void;
  logout: () => void;
  isLoginModalOpen: boolean;
  setIsLoginModalOpen: (open: boolean) => void;
  language: Language;
  setLanguage: (lang: Language) => void;
  activeTab: string;
  setActiveTab: (tab: string) => void;
  selectedSectorId: string | null;
  setSelectedSectorId: (id: string | null) => void;
  selectedInvestorId: string | null;
  setSelectedInvestorId: (id: string | null) => void;
  t: typeof translations['bn'];
  updateDb: (updater: (prev: AppDatabase) => AppDatabase) => void;
  resetDb: () => void;
  logAudit: (action: string, details: string, sectorId?: string, prevValue?: string, newValue?: string) => void;
  exportCSV: (filename: string, headers: string[], rows: (string | number)[][]) => void;
  exportDatabaseJSON: () => void;
  importDatabaseJSON: (jsonStr: string) => boolean;
  globalFinancials: GlobalFinancials;
  getSectorFinancials: (sector: FarmSector | string) => SectorFinancials;
  getInvestorFinancials: (investorId: string) => InvestorFinancials;
  notificationMessage: string | null;
  showToast: (msg: string) => void;
}

const AppContext = createContext<AppContextType | undefined>(undefined);

export const AppProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [db, setDb] = useState<AppDatabase>(() => loadDatabase());
  const [isLoggedIn, setIsLoggedIn] = useState<boolean>(() => {
    return localStorage.getItem('ahmadun_auth_status') === 'true' || localStorage.getItem('shobuj_auth_status') === 'true';
  });
  const [currentUser, setCurrentUser] = useState<User>(() => {
    const savedUserId = localStorage.getItem('ahmadun_auth_user_id') || localStorage.getItem('shobuj_auth_user_id');
    if (savedUserId) {
      const found = db.users.find(u => u.id === savedUserId);
      if (found) return found;
    }
    return db.users[0];
  });
  const [isLoginModalOpen, setIsLoginModalOpen] = useState(false);
  const [language, setLanguage] = useState<Language>(() => db.settings.defaultLanguage || 'bn');
  const [activeTab, setActiveTab] = useState<string>('public'); // Start with public website
  const [selectedSectorId, setSelectedSectorId] = useState<string | null>(null);
  const [selectedInvestorId, setSelectedInvestorId] = useState<string | null>(null);
  const [notificationMessage, setNotificationMessage] = useState<string | null>(null);

  const t = translations[language];

  const login = (user: User) => {
    setCurrentUser(user);
    setIsLoggedIn(true);
    localStorage.setItem('ahmadun_auth_status', 'true');
    localStorage.setItem('ahmadun_auth_user_id', user.id);
    if (user.role === 'investor' && user.investorProfileId) {
      setSelectedInvestorId(user.investorProfileId);
      setActiveTab('investorPortal');
    } else if (user.role === 'sector_manager' && user.assignedSectorId) {
      setSelectedSectorId(user.assignedSectorId);
      setActiveTab('sectors');
    } else {
      setActiveTab('dashboard');
    }
    showToast(language === 'bn' ? `স্বাগতম, ${user.name}!` : `Welcome back, ${user.name}!`);
  };

  const logout = () => {
    setIsLoggedIn(false);
    localStorage.removeItem('ahmadun_auth_status');
    localStorage.removeItem('ahmadun_auth_user_id');
    localStorage.removeItem('shobuj_auth_status');
    localStorage.removeItem('shobuj_auth_user_id');
    setActiveTab('public');
    showToast(language === 'bn' ? 'সফলভাবে লগআউট করা হয়েছে।' : 'Logged out successfully.');
  };

  // Keep db synced to localStorage whenever db changes
  useEffect(() => {
    saveDatabase(db);
  }, [db]);

  const showToast = (msg: string) => {
    setNotificationMessage(msg);
    setTimeout(() => {
      setNotificationMessage(null);
    }, 3500);
  };

  const updateDb = (updater: (prev: AppDatabase) => AppDatabase) => {
    setDb((prev) => {
      const next = updater(prev);
      saveDatabase(next);
      return next;
    });
  };

  const resetDb = () => {
    const fresh = resetDatabaseToDefault();
    setDb(fresh);
    setCurrentUser(fresh.users[0]);
    showToast('Database reset to initial standard state!');
  };

  const logAudit = (
    action: string,
    details: string,
    sectorId?: string,
    prevValue?: string,
    newValue?: string
  ) => {
    const updated = createAuditLog(
      db,
      currentUser.id,
      currentUser.name,
      currentUser.role,
      action,
      details,
      sectorId,
      prevValue,
      newValue
    );
    setDb(updated);
  };

  const exportCSV = (filename: string, headers: string[], rows: (string | number)[][]) => {
    const sanitize = (val: string | number) => {
      const str = String(val ?? '').replace(/"/g, '""');
      return `"${str}"`;
    };

    const csvContent =
      '\uFEFF' + // UTF-8 BOM for Excel Bengali character compatibility
      [headers.map(sanitize).join(','), ...rows.map((row) => row.map(sanitize).join(','))].join(
        '\r\n'
      );

    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `${filename}_${new Date().toISOString().slice(0, 10)}.csv`;
    link.click();
    URL.revokeObjectURL(url);
    showToast('Excel/CSV export completed!');
  };

  const exportDatabaseJSON = () => {
    const dataStr = JSON.stringify(db, null, 2);
    const blob = new Blob([dataStr], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `ahmadun_agro_backup_${new Date().toISOString().slice(0, 10)}.json`;
    link.click();
    URL.revokeObjectURL(url);
    showToast('Full database JSON backup downloaded!');
  };

  const importDatabaseJSON = (jsonStr: string): boolean => {
    try {
      const parsed = JSON.parse(jsonStr);
      if (parsed.sectors && parsed.incomes && parsed.expenses && parsed.investors) {
        setDb(parsed);
        saveDatabase(parsed);
        showToast('Database successfully restored from backup!');
        return true;
      }
      throw new Error('Invalid schema format');
    } catch (err) {
      console.error('Import error:', err);
      showToast('Error restoring database: Invalid file format.');
      return false;
    }
  };

  // Financial calculations derived automatically
  const globalFinancials = calculateGlobalFinancials(
    db.sectors,
    db.incomes,
    db.expenses,
    db.investments,
    db.profitDistributions
  );

  const getSectorFinancials = (sectorOrId: FarmSector | string) => {
    const sector: FarmSector = typeof sectorOrId === 'string'
      ? (db.sectors.find((s) => s.id === sectorOrId) || {
          id: sectorOrId,
          code: sectorOrId,
          name: sectorOrId,
          nameBn: sectorOrId,
          description: '',
          descriptionBn: '',
          establishedDate: '',
          totalArea: '',
          customMetrics: [],
          status: 'active' as const,
        })
      : sectorOrId;

    return calculateSectorFinancials(
      sector,
      db.incomes,
      db.expenses,
      db.investments,
      db.profitDistributions
    );
  };

  const getInvestorFinancials = (investorId: string) =>
    calculateInvestorFinancials(
      investorId,
      db.investments,
      db.sectors,
      db.incomes,
      db.expenses,
      db.profitDistributions
    );

  return (
    <AppContext.Provider
      value={{
        db,
        currentUser,
        setCurrentUser,
        isLoggedIn,
        login,
        logout,
        isLoginModalOpen,
        setIsLoginModalOpen,
        language,
        setLanguage,
        activeTab,
        setActiveTab,
        selectedSectorId,
        setSelectedSectorId,
        selectedInvestorId,
        setSelectedInvestorId,
        t,
        updateDb,
        resetDb,
        logAudit,
        exportCSV,
        exportDatabaseJSON,
        importDatabaseJSON,
        globalFinancials,
        getSectorFinancials,
        getInvestorFinancials,
        notificationMessage,
        showToast,
      }}
    >
      {children}
    </AppContext.Provider>
  );
};

export const useApp = () => {
  const context = useContext(AppContext);
  if (!context) {
    throw new Error('useApp must be used within an AppProvider');
  }
  return context;
};
