export type UserRole = 
  | 'super_admin' 
  | 'admin_manager' 
  | 'accountant' 
  | 'sector_manager' 
  | 'investor';

export type Language = 'bn' | 'en';

export type PaymentMethod = 
  | 'bKash' 
  | 'Nagad' 
  | 'Bank Transfer' 
  | 'Cash' 
  | 'Cheque' 
  | 'bank_transfer' 
  | 'bkash' 
  | 'nagad' 
  | 'cash' 
  | 'cheque';

export type ExpenseCategory = 
  | 'feed' 
  | 'seeds' 
  | 'fertilizer' 
  | 'medicine' 
  | 'vaccination' 
  | 'labor' 
  | 'electricity' 
  | 'water_irrigation' 
  | 'transportation' 
  | 'equipment' 
  | 'land_preparation' 
  | 'shed_maintenance' 
  | 'marketing' 
  | 'administrative' 
  | 'other';

export type InventoryCategory = 
  | 'feed' 
  | 'seeds' 
  | 'fertilizer' 
  | 'medicine' 
  | 'vaccine' 
  | 'produce' 
  | 'equipment' 
  | 'packaging';

export type AssetCategory = 
  | 'land' 
  | 'shed' 
  | 'building_shed' 
  | 'equipment' 
  | 'machinery' 
  | 'solar' 
  | 'solar_system' 
  | 'vehicle' 
  | 'water_system' 
  | 'other';

export type DocumentCategory = 
  | 'investment_agreement' 
  | 'investor_nid' 
  | 'financial_report' 
  | 'land_deed' 
  | 'license_cert' 
  | 'lab_test_report' 
  | 'invoice_receipt' 
  | 'agreement' 
  | 'invoice' 
  | 'bill' 
  | 'license' 
  | 'report' 
  | 'tax' 
  | 'other';

export interface User {
  id: string;
  name: string;
  nameBn?: string;
  email: string;
  phone: string;
  role: UserRole;
  assignedSectorId?: string; // For sector managers
  investorProfileId?: string; // For investors
  investorId?: string; // Alias for investorProfileId
  avatar?: string;
}

export interface BankDetails {
  bankName: string;
  branchName?: string;
  accountName?: string;
  accountNumber: string;
  routingNumber?: string;
  bkashNumber?: string;
  nagadNumber?: string;
}

export interface InvestorSettlement {
  settledAt: string;
  capitalRefunded: number;
  pendingProfitPaid: number;
  deductionAmount?: number;
  netSettledAmount: number;
  paymentMethod: PaymentMethod | string;
  transactionRef?: string;
  voucherNo?: string;
  notes?: string;
  processedByName?: string;
}

export interface Investor {
  id: string;
  userId?: string;
  name: string;
  nameBn?: string;
  nid?: string;
  nidPassport?: string;
  phone: string;
  email: string;
  address: string;
  nationality?: string;
  joiningDate?: string;
  bankName?: string;
  bankAccount?: string;
  bankDetails?: BankDetails;
  mobileBankingDetails?: any;
  nomineeName?: string;
  nomineeRelation?: string;
  status: 'active' | 'inactive' | 'suspended' | 'closed';
  avatar?: string;
  notes?: string;
  settlement?: InvestorSettlement;
}

export type ProfitCalculationType = 
  | 'net_profit_percentage' 
  | 'fixed_roi_percent' 
  | 'sector_equity_ratio' 
  | 'custom_agreement';

export type InvestmentStatus = 'pending' | 'active' | 'completed' | 'withdrawn' | 'suspended' | 'closed';

export interface Investment {
  id: string;
  investorId: string;
  investorName?: string;
  sectorId: string;
  sectorName?: string;
  amount: number;
  date: string;
  paymentMethod: PaymentMethod;
  transactionRef: string;
  agreementRef?: string;
  agreementDocUrl?: string;
  ownershipPercentage: number; // e.g. 20%
  calculationType: ProfitCalculationType;
  profitCalculationType?: ProfitCalculationType;
  fixedRoiPercent?: number; // e.g. 18% annual if fixed
  status: InvestmentStatus;
  notes?: string;
}

export interface SectorCustomField {
  id: string;
  label: string;
  labelBn: string;
  type: 'text' | 'number' | 'currency' | 'date';
  value: string | number;
}

export interface FarmSector {
  id: string;
  code: string;
  name: string;
  nameBn: string;
  description: string;
  descriptionBn: string;
  image?: string;
  imageUrl?: string;
  managerUserId?: string;
  managerName?: string;
  status: 'active' | 'inactive';
  establishedDate: string;
  totalArea: string; // e.g. "5 Acres" or "১৫ বিঘা"
  customMetrics: {
    label: string;
    labelBn: string;
    value: string | number;
    unit: string;
    icon?: string;
  }[];
  customFields?: SectorCustomField[];
}

export interface IncomeRecord {
  id: string;
  date: string;
  sectorId: string;
  category: string;
  categoryBn?: string;
  product: string;
  quantity: number;
  unit: string;
  unitPrice: number;
  totalAmount: number; // auto-calculated
  customerBuyer: string;
  paymentMethod: PaymentMethod;
  invoiceNo: string;
  notes?: string;
  addedByUserId?: string;
  addedByName?: string;
  receivedByUserId?: string;
  receivedByName?: string;
  status: 'approved' | 'pending';
}

export interface ExpenseRecord {
  id: string;
  date: string;
  sectorId: string;
  category: ExpenseCategory | string;
  categoryBn?: string;
  description: string;
  amount: number;
  vendor: string;
  paymentMethod: PaymentMethod;
  voucherNo?: string;
  receiptUrl?: string;
  receiptAttachment?: string;
  notes?: string;
  addedByUserId?: string;
  addedByName?: string;
  paidByUserId?: string;
  paidByName?: string;
  status: 'approved' | 'pending_approval' | 'rejected';
  approvedByUserId?: string;
  approvedByName?: string;
  approvedAt?: string;
}

export interface FarmOperationRecord {
  id: string;
  date: string;
  sectorId: string;
  activities?: string;
  productionDetails?: string;
  animalCount?: number;
  mortalityCount: number;
  mortalityReason?: string;
  feedConsumedKg: number;
  medicineUsed?: string;
  medicineAdministered?: string;
  laborCount: number;
  laborHours?: number;
  productionQty?: number;
  productionUnit?: string;
  weatherNotes?: string;
  incidents?: string;
  actionTaken?: string;
  salesQty?: number;
  incidentNotes?: string;
  reportedByUserId?: string;
  reportedByName?: string;
  loggedByUserId?: string;
  loggedByName?: string;
  verifiedByUserId?: string;
  verifiedByName?: string;
}

export interface InventoryItem {
  id: string;
  sectorId: string;
  itemName?: string;
  name?: string;
  nameBn?: string;
  category: InventoryCategory;
  quantity?: number;
  currentStock?: number;
  unit: string;
  unitCost: number;
  minReorderLevel: number;
  supplier?: string;
  location?: string;
  lastRestockedDate?: string;
  lastRestocked?: string;
}

export interface AssetItem {
  id: string;
  sectorId: string;
  assetName?: string;
  name?: string;
  nameBn?: string;
  category: AssetCategory;
  purchaseDate: string;
  purchaseCost?: number;
  purchaseValue?: number;
  currentValuation?: number;
  currentValue?: number;
  depreciationRateAnnual?: number;
  location: string;
  responsiblePerson?: string;
  condition?: 'excellent' | 'good' | 'fair' | 'needs_repair';
  status?: 'operational' | 'maintenance' | 'deprecated';
  maintenanceHistory?: string;
  notes?: string;
}

export interface DocumentRecord {
  id: string;
  title: string;
  titleBn?: string;
  category: DocumentCategory | string;
  investorId?: string;
  sectorId?: string;
  date?: string;
  uploadedDate?: string;
  fileSize: string;
  fileType?: string;
  fileUrl?: string;
  uploadedByUserId?: string;
  uploadedByName?: string;
  notes?: string;
}

export interface ProfitDistribution {
  id: string;
  investmentId?: string;
  investorId: string;
  investorName?: string;
  sectorId: string;
  sectorName?: string;
  period: string; // e.g. "Q1 2026" or "September 2026"
  sectorRevenue?: number;
  sectorExpense?: number;
  sectorNetProfit?: number;
  investorOwnershipPercent?: number;
  investorShare?: number;
  calculatedProfit?: number;
  paidAmount: number;
  pendingAmount: number;
  paymentDate?: string;
  paymentMethod?: PaymentMethod | string;
  transactionRef?: string;
  paymentRef?: string;
  status: 'paid' | 'pending' | 'partial';
  notes?: string;
}

export interface AuditLog {
  id: string;
  timestamp: string;
  userId?: string;
  userName: string;
  role?: string;
  userRole?: string;
  action: string;
  sectorId?: string;
  details: string;
  oldValue?: string;
  prevValue?: string;
  newValue?: string;
  ipAddress?: string;
}

export interface CustomFieldDefinition {
  id: string;
  name?: string;
  nameBn?: string;
  label?: string;
  labelBn?: string;
  type: 'text' | 'number' | 'currency' | 'date' | 'dropdown' | 'checkbox' | 'long_text';
  options?: string[]; // for dropdown
  required: boolean;
}

export interface CustomRecord {
  id: string;
  moduleId?: string;
  values?: Record<string, any>;
  createdAt?: string;
  createdByUserId?: string;
  createdByName?: string;
  [key: string]: any;
}

export interface CustomModule {
  id: string;
  name: string;
  nameBn: string;
  slug?: string;
  description: string;
  iconName?: string;
  sectorId?: string;
  fields: CustomFieldDefinition[];
  records: CustomRecord[];
  createdAt: string;
  createdByUserId?: string;
}

export interface DashboardWidgetConfig {
  id: string;
  key?: string;
  title: string;
  titleBn: string;
  widgetType?: string;
  visible?: boolean;
  isVisible?: boolean;
  order: number;
  width?: 'quarter' | 'half' | 'full';
  colSpan?: 'full' | 'half' | 'third';
  roleVisibility?: UserRole[];
}

export interface Announcement {
  id: string;
  title: string;
  titleBn: string;
  content: string;
  contentBn: string;
  sectorId?: string;
  priority: 'normal' | 'important' | 'urgent';
  targetAudience: 'all' | 'investors_only' | 'managers_only';
  date: string;
}

export interface GalleryItem {
  id: string;
  sectorId: string;
  title: string;
  titleBn: string;
  description: string;
  mediaType: 'photo' | 'video';
  url: string;
  date: string;
}

export interface FarmSettings {
  farmName: string;
  farmNameBn: string;
  tagline?: string;
  taglineBn?: string;
  logoText?: string;
  phone?: string;
  email?: string;
  address?: string;
  contactPhone?: string;
  contactEmail?: string;
  farmAddress?: string;
  farmAddressBn?: string;
  officeAddress?: string;
  officeAddressBn?: string;
  bkashMerchant?: string;
  nagadMerchant?: string;
  bankName?: string;
  bankAccount?: string;
  bankRouting?: string;
  currency?: string;
  currencySymbol?: string;
  bnNumberFormat?: boolean;
  defaultLanguage?: Language;
  themeColor?: string;
  approvalRequiredForExpenses?: boolean;
  minExpenseApprovalLimit?: number;
}
