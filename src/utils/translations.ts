import { Language } from '../types';

export const toBnNumber = (num: number | string): string => {
  const bnDigits = ['০', '১', '২', '৩', '৪', '৫', '৬', '৭', '৮', '৯'];
  const str = typeof num === 'number' ? num.toLocaleString('en-US') : String(num);
  return str.replace(/[0-9]/g, (d) => bnDigits[parseInt(d, 10)]);
};

export const formatCurrency = (
  amount: number,
  lang: Language = 'bn',
  currencySymbol = '৳'
): string => {
  const rounded = Math.round(amount);
  const formattedEn = rounded.toLocaleString('en-IN'); // South Asian numbering (Lakhs, Crores)

  if (lang === 'bn') {
    return `${currencySymbol} ${toBnNumber(formattedEn)}`;
  }
  return `${currencySymbol} ${formattedEn}`;
};

export const formatNumber = (num: number, lang: Language = 'bn'): string => {
  const formattedEn = num.toLocaleString('en-IN');
  return lang === 'bn' ? toBnNumber(formattedEn) : formattedEn;
};

export const formatDate = (dateStr: string, lang: Language = 'bn'): string => {
  if (!dateStr) return '';
  try {
    const d = new Date(dateStr);
    if (isNaN(d.getTime())) return dateStr;
    const options: Intl.DateTimeFormatOptions = { day: 'numeric', month: 'short', year: 'numeric' };
    const formatted = d.toLocaleDateString(lang === 'bn' ? 'bn-BD' : 'en-GB', options);
    return formatted;
  } catch {
    return dateStr;
  }
};

export const translations = {
  bn: {
    // Navigation & Common
    appName: 'সবুজ বাংলা এগ্রো ফার্ম',
    tagline: 'স্বচ্ছ বিনিয়োগ ও আধুনিক সমন্বিত কৃষি ব্যবস্থাপনা',
    dashboard: 'ড্যাশবোর্ড',
    sectors: 'ফার্ম সেক্টরসমূহ',
    investors: 'বিনিয়োগকারীগণ',
    investments: 'বিনিয়োগ খতিয়ান',
    income: 'আয় ও বিক্রয়',
    expense: 'ব্যয় ও খরচ',
    accounting: 'হিসাব ও লাভ-ক্ষতি',
    profitSharing: 'লভ্যাংশ বণ্টন',
    operations: 'দৈনিক ফার্ম কার্যক্রম',
    inventory: 'মজুদ ও ইনভেন্টরি',
    assets: 'সম্পদ ব্যবস্থাপনা',
    documents: 'নথিপত্র ও চুক্তি',
    googleDrive: 'গুগল ড্রাইভ ক্লাউড',
    reports: 'প্রতিবেদন ও রিপোর্ট',
    moduleBuilder: 'কাস্টম মডিউল বিল্ডার',
    dashboardBuilder: 'ড্যাশবোর্ড কাস্টমাইজার',
    auditLogs: 'অডিট ও স্বচ্ছতা লগ',
    settings: 'ফার্ম সেটিংস',
    publicSite: 'পাবলিক ওয়েবসাইট',
    logout: 'লগআউট',
    switchRole: 'রোল পরিবর্তন করুন',
    profile: 'প্রোফাইল',
    notifications: 'নোটিফিকেশন',
    search: 'অনুসন্ধান করুন...',
    actions: 'অ্যাকশন',
    add: 'নতুন যোগ করুন',
    edit: 'সম্পাদনা',
    delete: 'মুছুন',
    save: 'সংরক্ষণ করুন',
    cancel: 'বাতিল',
    viewDetails: 'বিস্তারিত দেখুন',
    status: 'অবস্থা',
    active: 'সক্রিয়',
    inactive: 'নিষ্ক্রিয়',
    pending: 'অপেক্ষমাণ',
    approved: 'অনুমোদিত',
    rejected: 'প্রত্যাখ্যাত',
    completed: 'সম্পন্ন',
    exportCSV: 'এক্সেল / CSV এক্সপোর্ট',
    printReport: 'প্রিন্ট / PDF',
    total: 'মোট',
    date: 'তারিখ',
    sector: 'সেক্টর',
    amount: 'পরিমাণ',
    category: 'ক্যাটাগরি',
    description: 'বিবরণ',
    all: 'সকল',
    filter: 'ফিল্টার',
    demoDataNotice: 'ডেমো ডেটা — পরীক্ষামূলক ব্যবহারের জন্য লোড করা হয়েছে',

    // Financial Overview
    totalInvestment: 'মোট মূলধন বিনিয়োগ',
    totalRevenue: 'সর্বমোট রাজস্ব / আয়',
    totalExpenses: 'সর্বমোট পরিচালনা ব্যয়',
    netProfit: 'নিট লাভ (লাভ/ক্ষতি)',
    cashBalance: 'বর্তমান ক্যাশ ব্যালেন্স',
    activeInvestorsCount: 'সক্রিয় বিনিয়োগকারী',
    activeSectorsCount: 'সক্রিয় প্রকল্প সেক্টর',
    profitMargin: 'লাভের হার (মার্জিন)',

    // Sectors
    duckFarming: 'হাঁস খামার',
    poultryFarming: 'পোল্ট্রি ও মুরগি খামার',
    goatFarming: 'ব্ল্যাক বেঙ্গল ছাগল খামার',
    pigeonFarming: 'উন্নত জাতের কবুতর খামার',
    vegetableFarming: 'জৈব শাকসবজি চাষ',
    addNewSector: 'নতুন ফার্ম সেক্টর খুলুন',
    sectorManager: 'সেক্টর ম্যানেজার',
    totalAnimals: 'মোট পশুপাখি / স্টক',
    dailyProduction: 'দৈনিক উৎপাদন',
    mortality: 'মৃত্যুহার / ক্ষতি',
    feedCost: 'খাদ্য খরচ',

    // Investor Portal
    welcomeInvestor: 'স্বাগতম বিনিয়োগকারী',
    myInvestments: 'আমার মোট বিনিয়োগ',
    investedSectors: 'বিনিয়োগকৃত সেক্টর',
    myProfitShare: 'আমার লভ্যাংশ প্রাপ্য',
    paidProfit: 'প্রাপ্ত লভ্যাংশ',
    pendingProfit: 'বকেয়া লভ্যাংশ',
    investorPortalTitle: 'স্বচ্ছ বিনিয়োগকারী পোর্টাল',
    investorSubtitle: 'আপনার বিনিয়োগকৃত খামারের লাইভ কার্যক্রম, আর্থিক লেনদেন ও লভ্যাংশ খতিয়ান',
    statementTitle: 'বিনিয়োগ ও লভ্যাংশ বিবরণী',
    ownershipShare: 'মালিকানা শেয়ার',
    investmentDate: 'বিনিয়োগের তারিখ',
    payoutHistory: 'লভ্যাংশ প্রদানের ইতিহাস',
    farmUpdates: 'ফার্মের সাম্প্রতিক আপডেট',

    // Accounting
    grossProfit: 'মোট মুনাফা',
    pnlStatement: 'আর্থিক লাভ-ক্ষতি বিবরণী (P&L)',
    traceableRecords: 'প্রত্যেকটি হিসাব মূল লেনদেন ভাউচারের সাথে সংযুক্ত',
    approveExpense: 'ব্যয় অনুমোদন করুন',
    pendingApprovalNotice: 'টি লেনদেন অ্যাকাউন্টে যোগের জন্য অনুমোদনের অপেক্ষায় রয়েছে',

    // Custom Module & Settings
    createModule: 'নতুন কাস্টম মডিউল তৈরি করুন',
    moduleNamePlaceholder: 'যেমন: মাছ চাষ (Pisciculture) বা ডেইরি',
    addField: 'নতুন ফিল্ড যোগ করুন',
    backupDatabase: 'ডাটাবেজ ব্যাকআপ (JSON ডাউনলোড)',
    restoreDatabase: 'ডাটাবেজ রিস্টোর (JSON আপলোড)',
    resetDemo: 'ডিফল্ট ডেমো ডাটায় ফিরে যান',
    bangladeshOffice: 'প্রধান কার্যালয়: বাড়ি #১২, রোড #৪, গুলশান-১, ঢাকা',
    bangladeshFarm: 'খামার প্রকল্প: চন্দ্রা, কালিয়াকৈর, গাজীপুর ও কিশোরগঞ্জ হাওর',
    name: 'নাম',
    investor: 'বিনিয়োগকারী',
    addNewIncome: 'নতুন আয় / বিক্রয় যোগ করুন',
    addNewExpense: 'নতুন খরচ / ব্যয় লিপিবদ্ধ করুন',
    addNewInvestment: 'নতুন বিনিয়োগ যোগ করুন',
    addNewInvestor: 'নতুন বিনিয়োগকারী যুক্ত করুন',
    investorPortal: 'বিনিয়োগকারী পোর্টাল',
  },
  en: {
    // Navigation & Common
    appName: 'Shobuj Bangla Agro Farm',
    tagline: 'Transparent Investment & Integrated Agro Farm Management',
    dashboard: 'Dashboard',
    sectors: 'Farm Sectors',
    investors: 'Investors',
    investments: 'Investments',
    income: 'Income & Sales',
    expense: 'Expenses',
    accounting: 'Accounting & P&L',
    profitSharing: 'Profit Distribution',
    operations: 'Daily Operations',
    inventory: 'Inventory & Stock',
    assets: 'Asset Management',
    documents: 'Documents & Deeds',
    googleDrive: 'Google Drive',
    reports: 'Reports & Analytics',
    moduleBuilder: 'Custom Module Builder',
    dashboardBuilder: 'Dashboard Customizer',
    auditLogs: 'Audit & Transparency Log',
    settings: 'Farm Settings',
    publicSite: 'Public Website',
    logout: 'Logout',
    switchRole: 'Switch Role / User',
    profile: 'Profile',
    notifications: 'Notifications',
    search: 'Search...',
    actions: 'Actions',
    add: 'Add New',
    edit: 'Edit',
    delete: 'Delete',
    save: 'Save',
    cancel: 'Cancel',
    viewDetails: 'View Details',
    status: 'Status',
    active: 'Active',
    inactive: 'Inactive',
    pending: 'Pending',
    approved: 'Approved',
    rejected: 'Rejected',
    completed: 'Completed',
    exportCSV: 'Export Excel / CSV',
    printReport: 'Print / PDF',
    total: 'Total',
    date: 'Date',
    sector: 'Sector',
    amount: 'Amount',
    category: 'Category',
    description: 'Description',
    all: 'All',
    filter: 'Filter',
    demoDataNotice: 'DEMO DATA — Preloaded for evaluation & immediate testing',

    // Financial Overview
    totalInvestment: 'Total Capital Investment',
    totalRevenue: 'Total Revenue / Income',
    totalExpenses: 'Total Operational Expenses',
    netProfit: 'Net Profit / Loss',
    cashBalance: 'Current Cash Balance',
    activeInvestorsCount: 'Active Investors',
    activeSectorsCount: 'Active Farm Sectors',
    profitMargin: 'Profit Margin',

    // Sectors
    duckFarming: 'Duck Farming',
    poultryFarming: 'Poultry & Chicken Farming',
    goatFarming: 'Black Bengal Goat Farming',
    pigeonFarming: 'Pigeon Farming',
    vegetableFarming: 'Organic Vegetable Cultivation',
    addNewSector: 'Add New Farm Sector',
    sectorManager: 'Sector Manager',
    totalAnimals: 'Total Livestock / Stock',
    dailyProduction: 'Daily Production',
    mortality: 'Mortality / Loss',
    feedCost: 'Feed Expenses',

    // Investor Portal
    welcomeInvestor: 'Welcome Investor',
    myInvestments: 'My Total Investment',
    investedSectors: 'Invested Sectors',
    myProfitShare: 'My Net Profit Share',
    paidProfit: 'Profit Paid Out',
    pendingProfit: 'Pending Payout',
    investorPortalTitle: 'Transparent Investor Portal',
    investorSubtitle: 'Real-time monitoring of your sector operations, financials & profit ledger',
    statementTitle: 'Investment & Profit Statement',
    ownershipShare: 'Ownership Share',
    investmentDate: 'Investment Date',
    payoutHistory: 'Profit Payout History',
    farmUpdates: 'Latest Farm Activities',

    // Accounting
    grossProfit: 'Gross Profit',
    pnlStatement: 'Financial Profit & Loss Statement (P&L)',
    traceableRecords: 'Every figure is computed directly from verified transaction vouchers',
    approveExpense: 'Approve Expense',
    pendingApprovalNotice: 'transactions are awaiting verification before posting to ledger',

    // Custom Module & Settings
    createModule: 'Create Custom Module',
    moduleNamePlaceholder: 'e.g. Fish Farming (Pisciculture) or Dairy',
    addField: 'Add Field',
    backupDatabase: 'Backup Database (Download JSON)',
    restoreDatabase: 'Restore Database (Upload JSON)',
    resetDemo: 'Reset to Default Demo Data',
    bangladeshOffice: 'Corporate Office: House #12, Road #4, Gulshan-1, Dhaka',
    bangladeshFarm: 'Agro Facility: Chandra, Kaliakair, Gazipur & Kishoreganj Haor',
    name: 'Name',
    investor: 'Investor',
    addNewIncome: 'Record Income / Sale',
    addNewExpense: 'Record Farm Expense',
    addNewInvestment: 'Record Capital Investment',
    addNewInvestor: 'Add New Investor',
    investorPortal: 'Investor Portal',
  }
};
