import { 
  IncomeRecord, 
  ExpenseRecord, 
  Investment, 
  ProfitDistribution, 
  FarmSector 
} from '../types';

export interface SectorFinancials {
  sectorId: string;
  sectorCode: string;
  sectorName: string;
  totalInvestment: number;
  totalIncome: number;
  totalExpense: number;
  netProfit: number;
  profitMarginPercent: number;
  incomeCount: number;
  expenseCount: number;
  pendingExpenseTotal: number;
  totalProfitDistributed: number;
  retainedEarnings: number;
  roiPercent: number;
}

export interface GlobalFinancials {
  totalInvestment: number;
  totalIncome: number;
  totalExpense: number;
  netProfit: number;
  cashBalance: number;
  profitMarginPercent: number;
  pendingExpenseAmount: number;
  totalPaidProfit: number;
  totalPendingProfit: number;
  totalProfitDistributed: number;
  retainedEarnings: number;
  globalROI: number;
  sectorBreakdown: SectorFinancials[];
}

export interface InvestorSectorHolding {
  sectorId: string;
  sectorName: string;
  investmentId: string;
  investmentDate: string;
  investedAmount: number;
  profitSharePercentage: number;
  totalPaidProfit: number;
  pendingProfit: number;
  status: string;
  amount: number;
  ownershipPercentage: number;
  calculationType: string;
  sectorRevenue: number;
  sectorExpense: number;
  sectorNetProfit: number;
  myShareCalculated: number;
  mySharePaid: number;
  mySharePending: number;
}

export interface InvestorFinancials {
  investorId: string;
  totalInvested: number;
  totalInvestedAmount: number;
  investments: Investment[];
  sectorsInvested: InvestorSectorHolding[];
  investedSectors: InvestorSectorHolding[];
  totalProfitShare: number;
  totalProfitEarned: number;
  totalProfitPaid: number;
  totalProfitPending: number;
  roiPercent: number;
}

/**
 * Automatically calculate financial metrics for a single sector from transactions
 */
export function calculateSectorFinancials(
  sector: FarmSector,
  incomes: IncomeRecord[],
  expenses: ExpenseRecord[],
  investments: Investment[],
  distributions: ProfitDistribution[]
): SectorFinancials {
  // Only include approved incomes (or all non-rejected)
  const sectorIncomes = incomes.filter(
    (inc) => inc.sectorId === sector.id && inc.status === 'approved'
  );
  const totalIncome = sectorIncomes.reduce((acc, curr) => acc + (curr.totalAmount || 0), 0);

  // Approved expenses
  const sectorExpenses = expenses.filter(
    (exp) => exp.sectorId === sector.id && exp.status === 'approved'
  );
  const totalExpense = sectorExpenses.reduce((acc, curr) => acc + (curr.amount || 0), 0);

  // Pending expenses
  const pendingExpenses = expenses.filter(
    (exp) => exp.sectorId === sector.id && exp.status === 'pending_approval'
  );
  const pendingExpenseTotal = pendingExpenses.reduce((acc, curr) => acc + (curr.amount || 0), 0);

  // Sector investments
  const sectorInvestments = investments.filter(
    (inv) => inv.sectorId === sector.id && (inv.status === 'active' || inv.status === 'completed')
  );
  const totalInvestment = sectorInvestments.reduce((acc, curr) => acc + (curr.amount || 0), 0);

  const netProfit = totalIncome - totalExpense;
  const profitMarginPercent = totalIncome > 0 ? (netProfit / totalIncome) * 100 : 0;

  // Total profit distributed in this sector
  const sectorDistributions = distributions.filter((d) => d.sectorId === sector.id);
  const totalProfitDistributed = sectorDistributions
    .filter((d) => d.status === 'paid' || d.status === 'partial')
    .reduce((sum, d) => sum + (d.paidAmount || 0), 0);

  const retainedEarnings = Math.max(0, netProfit - totalProfitDistributed);
  const roiPercent = totalInvestment > 0 ? (netProfit / totalInvestment) * 100 : 0;

  return {
    sectorId: sector.id,
    sectorCode: sector.code || sector.id,
    sectorName: sector.name,
    totalInvestment,
    totalIncome,
    totalExpense,
    netProfit,
    profitMarginPercent,
    incomeCount: sectorIncomes.length,
    expenseCount: sectorExpenses.length,
    pendingExpenseTotal,
    totalProfitDistributed,
    retainedEarnings,
    roiPercent,
  };
}

/**
 * Automatically calculate global farm financials
 */
export function calculateGlobalFinancials(
  sectors: FarmSector[],
  incomes: IncomeRecord[],
  expenses: ExpenseRecord[],
  investments: Investment[],
  distributions: ProfitDistribution[]
): GlobalFinancials {
  const sectorBreakdown: SectorFinancials[] = sectors.map((s) =>
    calculateSectorFinancials(s, incomes, expenses, investments, distributions)
  );

  const totalInvestment = sectorBreakdown.reduce((sum, s) => sum + s.totalInvestment, 0);
  const totalIncome = sectorBreakdown.reduce((sum, s) => sum + s.totalIncome, 0);
  const totalExpense = sectorBreakdown.reduce((sum, s) => sum + s.totalExpense, 0);
  const pendingExpenseAmount = sectorBreakdown.reduce((sum, s) => sum + s.pendingExpenseTotal, 0);
  const netProfit = totalIncome - totalExpense;
  const profitMarginPercent = totalIncome > 0 ? (netProfit / totalIncome) * 100 : 0;

  // Total paid profit payouts
  const totalPaidProfit = distributions
    .filter((d) => d.status === 'paid' || d.status === 'partial')
    .reduce((sum, d) => sum + (d.paidAmount || 0), 0);

  const totalPendingProfit = distributions
    .filter((d) => d.status === 'pending' || d.status === 'partial')
    .reduce((sum, d) => sum + (d.pendingAmount || 0), 0);

  const totalProfitDistributed = totalPaidProfit;
  const retainedEarnings = Math.max(0, netProfit - totalProfitDistributed);
  const globalROI = totalInvestment > 0 ? (netProfit / totalInvestment) * 100 : 0;

  // Cash balance = Total Investment Capital + Total Income - Total Expense - Total Paid Profit
  const cashBalance = totalInvestment + totalIncome - totalExpense - totalPaidProfit;

  return {
    totalInvestment,
    totalIncome,
    totalExpense,
    netProfit,
    cashBalance,
    profitMarginPercent,
    pendingExpenseAmount,
    totalPaidProfit,
    totalPendingProfit,
    totalProfitDistributed,
    retainedEarnings,
    globalROI,
    sectorBreakdown,
  };
}

/**
 * Transparent calculation of an individual investor's holdings and profit share
 */
export function calculateInvestorFinancials(
  investorId: string,
  investments: Investment[],
  sectors: FarmSector[],
  incomes: IncomeRecord[],
  expenses: ExpenseRecord[],
  distributions: ProfitDistribution[]
): InvestorFinancials {
  const investorInvestments = investments.filter(
    (inv) => inv.investorId === investorId && (inv.status === 'active' || inv.status === 'completed')
  );

  let totalInvested = 0;
  let totalProfitShare = 0;
  let totalProfitPaid = 0;
  let totalProfitPending = 0;

  const investedSectors: InvestorSectorHolding[] = investorInvestments.map((inv) => {
    totalInvested += inv.amount;
    const sector = sectors.find((s) => s.id === inv.sectorId);
    const sectorName = sector ? sector.name : 'Unknown Sector';

    // Sector verified financials
    const secFinancials = sector
      ? calculateSectorFinancials(sector, incomes, expenses, investments, distributions)
      : { totalIncome: 0, totalExpense: 0, netProfit: 0 };

    let myShareCalculated = 0;
    if (inv.calculationType === 'net_profit_percentage') {
      // e.g. 20% of net profit
      const profitBase = Math.max(0, secFinancials.netProfit);
      myShareCalculated = (profitBase * inv.ownershipPercentage) / 100;
    } else if (inv.calculationType === 'fixed_roi_percent') {
      // Fixed annual or period ROI
      const roiPercent = inv.fixedRoiPercent || 15;
      myShareCalculated = (inv.amount * roiPercent) / 100;
    } else {
      // Sector equity ratio
      const profitBase = Math.max(0, secFinancials.netProfit);
      myShareCalculated = (profitBase * inv.ownershipPercentage) / 100;
    }

    // Check distributions for this investment
    const invDistributions = distributions.filter(
      (d) => d.investmentId === inv.id || (d.investorId === investorId && d.sectorId === inv.sectorId)
    );

    const mySharePaid = invDistributions.reduce((sum, d) => sum + (d.paidAmount || 0), 0);
    const mySharePending = Math.max(0, myShareCalculated - mySharePaid);

    totalProfitShare += myShareCalculated;
    totalProfitPaid += mySharePaid;
    totalProfitPending += mySharePending;

    return {
      sectorId: inv.sectorId,
      sectorName,
      investmentId: inv.id,
      investmentDate: inv.date,
      investedAmount: inv.amount,
      profitSharePercentage: inv.ownershipPercentage,
      totalPaidProfit: mySharePaid,
      pendingProfit: mySharePending,
      status: inv.status,
      amount: inv.amount,
      ownershipPercentage: inv.ownershipPercentage,
      calculationType: inv.calculationType,
      sectorRevenue: secFinancials.totalIncome,
      sectorExpense: secFinancials.totalExpense,
      sectorNetProfit: secFinancials.netProfit,
      myShareCalculated,
      mySharePaid,
      mySharePending,
    };
  });

  const roiPercent = totalInvested > 0 ? (totalProfitPaid / totalInvested) * 100 : 0;

  return {
    investorId,
    totalInvested,
    totalInvestedAmount: totalInvested,
    investments: investorInvestments,
    sectorsInvested: investedSectors,
    investedSectors,
    totalProfitShare,
    totalProfitEarned: totalProfitShare,
    totalProfitPaid,
    totalProfitPending,
    roiPercent,
  };
}
