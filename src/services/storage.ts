import {
  User,
  Investor,
  FarmSector,
  Investment,
  IncomeRecord,
  ExpenseRecord,
  FarmOperationRecord,
  InventoryItem,
  AssetItem,
  DocumentRecord,
  ProfitDistribution,
  AuditLog,
  CustomModule,
  DashboardWidgetConfig,
  Announcement,
  GalleryItem,
  FarmSettings
} from '../types';

import {
  initialUsers,
  initialInvestors,
  initialSectors,
  initialInvestments,
  initialIncomes,
  initialExpenses,
  initialOperations,
  initialInventory,
  initialAssets,
  initialDocuments,
  initialProfitDistributions,
  initialAuditLogs,
  initialAnnouncements,
  initialGallery,
  initialCustomModules,
  initialWidgets,
  initialSettings
} from './mockData';
import { resolveFarmImage } from '../utils/imageAssets';

const STORAGE_KEY = 'ahmadun_agro_db_v2';

export interface AppDatabase {
  users: User[];
  investors: Investor[];
  sectors: FarmSector[];
  investments: Investment[];
  incomes: IncomeRecord[];
  expenses: ExpenseRecord[];
  operations: FarmOperationRecord[];
  inventory: InventoryItem[];
  assets: AssetItem[];
  documents: DocumentRecord[];
  profitDistributions: ProfitDistribution[];
  auditLogs: AuditLog[];
  announcements: Announcement[];
  gallery: GalleryItem[];
  customModules: CustomModule[];
  widgets: DashboardWidgetConfig[];
  dashboardWidgets: DashboardWidgetConfig[];
  settings: FarmSettings;
}

function normalizeImagePath(url: string | undefined): string {
  return resolveFarmImage(url);
}

export function loadDatabase(): AppDatabase {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (raw) {
      const parsed = JSON.parse(raw);
      const widgetList = parsed.dashboardWidgets || parsed.widgets || initialWidgets;
      const rawSectors = parsed.sectors || initialSectors;
      const rawGallery = parsed.gallery || initialGallery;

      // Ensure all critical arrays exist and paths are normalized
      return {
        users: parsed.users || initialUsers,
        investors: parsed.investors || initialInvestors,
        sectors: rawSectors.map((s: FarmSector) => ({
          ...s,
          image: normalizeImagePath(s.image)
        })),
        investments: parsed.investments || initialInvestments,
        incomes: parsed.incomes || initialIncomes,
        expenses: parsed.expenses || initialExpenses,
        operations: parsed.operations || initialOperations,
        inventory: parsed.inventory || initialInventory,
        assets: parsed.assets || initialAssets,
        documents: parsed.documents || initialDocuments,
        profitDistributions: parsed.profitDistributions || initialProfitDistributions,
        auditLogs: parsed.auditLogs || initialAuditLogs,
        announcements: parsed.announcements || initialAnnouncements,
        gallery: rawGallery.map((g: GalleryItem) => ({
          ...g,
          url: normalizeImagePath(g.url)
        })),
        customModules: parsed.customModules || initialCustomModules,
        widgets: widgetList,
        dashboardWidgets: widgetList,
        settings: parsed.settings 
          ? { 
              ...parsed.settings, 
              farmName: parsed.settings.farmName === 'Shobuj Bangla Integrated Agro Farm Ltd.' ? 'Ahmadun Agro' : parsed.settings.farmName || 'Ahmadun Agro',
              farmNameBn: parsed.settings.farmNameBn === 'সবুজ বাংলা সমন্বিত এগ্রো ফার্ম লিমিটেড' ? 'আহমাদুন এগ্রো' : parsed.settings.farmNameBn || 'আহমাদুন এগ্রো',
              logoText: 'AHMADUN AGRO'
            } 
          : initialSettings,
      };
    }
  } catch (err) {
    console.error('Failed to read database from localStorage, initializing fresh:', err);
  }

  const defaultDb: AppDatabase = {
    users: initialUsers,
    investors: initialInvestors,
    sectors: initialSectors,
    investments: initialInvestments,
    incomes: initialIncomes,
    expenses: initialExpenses,
    operations: initialOperations,
    inventory: initialInventory,
    assets: initialAssets,
    documents: initialDocuments,
    profitDistributions: initialProfitDistributions,
    auditLogs: initialAuditLogs,
    announcements: initialAnnouncements,
    gallery: initialGallery,
    customModules: initialCustomModules,
    widgets: initialWidgets,
    dashboardWidgets: initialWidgets,
    settings: initialSettings,
  };
  saveDatabase(defaultDb);
  return defaultDb;
}

export function saveDatabase(db: AppDatabase): void {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(db));
  } catch (err) {
    console.error('Error saving database to localStorage:', err);
  }
}

export function resetDatabaseToDefault(): AppDatabase {
  const defaultDb: AppDatabase = {
    users: initialUsers,
    investors: initialInvestors,
    sectors: initialSectors,
    investments: initialInvestments,
    incomes: initialIncomes,
    expenses: initialExpenses,
    operations: initialOperations,
    inventory: initialInventory,
    assets: initialAssets,
    documents: initialDocuments,
    profitDistributions: initialProfitDistributions,
    auditLogs: initialAuditLogs,
    announcements: initialAnnouncements,
    gallery: initialGallery,
    customModules: initialCustomModules,
    widgets: initialWidgets,
    dashboardWidgets: initialWidgets,
    settings: initialSettings,
  };
  saveDatabase(defaultDb);
  return defaultDb;
}

export function createAuditLog(
  db: AppDatabase,
  userId: string,
  userName: string,
  role: string,
  action: string,
  details: string,
  sectorId?: string,
  prevValue?: string,
  newValue?: string
): AppDatabase {
  const now = new Date();
  const timeFormatted = now.toLocaleDateString('en-GB') + ' ' + now.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });

  const newLog: AuditLog = {
    id: `audit-${Date.now()}-${Math.random().toString(36).substring(2, 6)}`,
    timestamp: timeFormatted,
    userId,
    userName,
    role,
    action,
    sectorId,
    details,
    prevValue,
    newValue,
  };

  const updatedLogs = [newLog, ...db.auditLogs].slice(0, 500); // Keep last 500
  const updatedDb = { ...db, auditLogs: updatedLogs };
  saveDatabase(updatedDb);
  return updatedDb;
}
