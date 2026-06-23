/**
 * rentalAnalysisService
 * ---------------------
 * Buy-and-hold / BRRRR underwriting. Pure, testable math for the investor who
 * wants to keep a property and rent it instead of (or after) flipping it.
 */

export interface RentalInputs {
  purchasePrice: number;
  estimatedRepairs: number;
  closingCosts: number;
  monthlyRent: number;
  // Operating expenses
  monthlyTaxes: number;
  monthlyInsurance: number;
  monthlyHoa: number;
  // Percentages of rent set aside
  vacancyPct: number;
  managementPct: number;
  maintenancePct: number;
  capexPct: number;
  // Financing
  downPaymentPct: number;
  loanRatePct: number;
  loanTermYears: number;
}

export interface RentalResult {
  /** Net operating income (annual), before debt service. */
  noi: number;
  /** NOI / total project cost. */
  capRatePct: number;
  /** Monthly principal + interest. */
  monthlyDebtService: number;
  /** Rent minus all expenses and debt service. */
  monthlyCashFlow: number;
  annualCashFlow: number;
  /** Annual cash flow / total cash invested. */
  cashOnCashPct: number;
  /** NOI / annual debt service. */
  dscr: number;
  /** Monthly rent / total project cost — the "1% rule". */
  rentToPricePct: number;
  onePercentRuleMet: boolean;
  totalCashInvested: number;
}

/** Remaining loan balance after a number of monthly payments. */
export function remainingBalance(
  principal: number,
  annualRatePct: number,
  termYears: number,
  monthsPaid: number
): number {
  if (principal <= 0) return 0;
  const r = annualRatePct / 100 / 12;
  const n = termYears * 12;
  const k = Math.min(monthsPaid, n);
  if (r === 0) return Math.max(0, principal * (1 - k / n));
  const balance =
    (principal * (Math.pow(1 + r, n) - Math.pow(1 + r, k))) /
    (Math.pow(1 + r, n) - 1);
  return Math.max(0, balance);
}

/** Standard amortized monthly payment. */
export function monthlyMortgagePayment(
  principal: number,
  annualRatePct: number,
  termYears: number
): number {
  if (principal <= 0) return 0;
  const r = annualRatePct / 100 / 12;
  const n = termYears * 12;
  if (r === 0) return n > 0 ? principal / n : 0;
  return (principal * (r * Math.pow(1 + r, n))) / (Math.pow(1 + r, n) - 1);
}

export interface ProjectionAssumptions {
  years: number;
  /** Annual property appreciation (%). */
  appreciationPct: number;
  /** Annual rent growth (%). */
  rentGrowthPct: number;
}

export interface ProjectionYear {
  year: number;
  propertyValue: number;
  loanBalance: number;
  equity: number;
  annualCashFlow: number;
  cumulativeCashFlow: number;
  /** Equity gain + cumulative cash flow vs. the initial cash invested. */
  totalReturn: number;
}

/**
 * Multi-year wealth projection: appreciation + loan paydown build equity, and
 * cash flow (growing with rent) compounds on top.
 */
export function projectRental(
  inputs: RentalInputs,
  assumptions: ProjectionAssumptions = {
    years: 5,
    appreciationPct: 3,
    rentGrowthPct: 2,
  }
): ProjectionYear[] {
  const startingValue =
    (inputs.purchasePrice || 0) + (inputs.estimatedRepairs || 0);
  const downPayment =
    (inputs.purchasePrice || 0) * ((inputs.downPaymentPct || 0) / 100);
  const loanAmount = (inputs.purchasePrice || 0) - downPayment;
  const cashInvested =
    downPayment + (inputs.estimatedRepairs || 0) + (inputs.closingCosts || 0);

  const fixedMonthly =
    (inputs.monthlyTaxes || 0) +
    (inputs.monthlyInsurance || 0) +
    (inputs.monthlyHoa || 0);
  const variablePct =
    ((inputs.vacancyPct || 0) +
      (inputs.managementPct || 0) +
      (inputs.maintenancePct || 0) +
      (inputs.capexPct || 0)) /
    100;
  const monthlyDebt = monthlyMortgagePayment(
    loanAmount,
    inputs.loanRatePct || 0,
    inputs.loanTermYears || 0
  );

  const out: ProjectionYear[] = [];
  let cumulative = 0;

  for (let y = 1; y <= assumptions.years; y++) {
    const value =
      startingValue * Math.pow(1 + assumptions.appreciationPct / 100, y);
    const balance = remainingBalance(
      loanAmount,
      inputs.loanRatePct || 0,
      inputs.loanTermYears || 0,
      y * 12
    );
    const equity = value - balance;

    const rent =
      (inputs.monthlyRent || 0) *
      Math.pow(1 + assumptions.rentGrowthPct / 100, y - 1);
    const monthlyCashFlow =
      rent - rent * variablePct - fixedMonthly - monthlyDebt;
    const annualCashFlow = monthlyCashFlow * 12;
    cumulative += annualCashFlow;

    out.push({
      year: y,
      propertyValue: Math.round(value),
      loanBalance: Math.round(balance),
      equity: Math.round(equity),
      annualCashFlow: Math.round(annualCashFlow),
      cumulativeCashFlow: Math.round(cumulative),
      totalReturn: Math.round(equity - cashInvested + cumulative),
    });
  }

  return out;
}

export function analyzeRental(inputs: RentalInputs): RentalResult {
  const totalProjectCost =
    (inputs.purchasePrice || 0) +
    (inputs.estimatedRepairs || 0) +
    (inputs.closingCosts || 0);

  const rent = inputs.monthlyRent || 0;

  // Variable operating expenses driven by rent.
  const variableMonthly =
    rent *
    (((inputs.vacancyPct || 0) +
      (inputs.managementPct || 0) +
      (inputs.maintenancePct || 0) +
      (inputs.capexPct || 0)) /
      100);

  const fixedMonthly =
    (inputs.monthlyTaxes || 0) +
    (inputs.monthlyInsurance || 0) +
    (inputs.monthlyHoa || 0);

  const monthlyOperatingExpenses = variableMonthly + fixedMonthly;
  const noi = (rent - monthlyOperatingExpenses) * 12;

  // Financing
  const downPayment = (inputs.purchasePrice || 0) * ((inputs.downPaymentPct || 0) / 100);
  const loanAmount = (inputs.purchasePrice || 0) - downPayment;
  const monthlyDebtService = monthlyMortgagePayment(
    loanAmount,
    inputs.loanRatePct || 0,
    inputs.loanTermYears || 0
  );
  const annualDebtService = monthlyDebtService * 12;

  const monthlyCashFlow = rent - monthlyOperatingExpenses - monthlyDebtService;
  const annualCashFlow = monthlyCashFlow * 12;

  // Cash invested = down payment + repairs + closing.
  const totalCashInvested =
    downPayment + (inputs.estimatedRepairs || 0) + (inputs.closingCosts || 0);

  const round2 = (n: number) => Math.round(n * 100) / 100;

  return {
    noi: Math.round(noi),
    capRatePct: totalProjectCost > 0 ? round2((noi / totalProjectCost) * 100) : 0,
    monthlyDebtService: Math.round(monthlyDebtService),
    monthlyCashFlow: Math.round(monthlyCashFlow),
    annualCashFlow: Math.round(annualCashFlow),
    cashOnCashPct:
      totalCashInvested > 0
        ? round2((annualCashFlow / totalCashInvested) * 100)
        : 0,
    dscr: annualDebtService > 0 ? round2(noi / annualDebtService) : 0,
    rentToPricePct:
      totalProjectCost > 0 ? round2((rent / totalProjectCost) * 100) : 0,
    onePercentRuleMet: totalProjectCost > 0 && rent >= totalProjectCost * 0.01,
    totalCashInvested: Math.round(totalCashInvested),
  };
}

// ---------------------------------------------------------------------------
// BRRRR refinance — the "Refinance" in Buy, Rehab, Rent, Refinance, Repeat.
// After rehab, you refinance against the new (ARV) value to pull cash back out.
// ---------------------------------------------------------------------------

export interface RefinanceInputs {
  /** After-repair value the appraiser is expected to hit. */
  arv: number;
  /** All-in cost: purchase + repairs + closing + holding. */
  totalInvested: number;
  /** Balance of any existing acquisition loan to pay off at refi. */
  existingLoanPayoff: number;
  /** Lender loan-to-value on the refinance (typically 70–75%). */
  refinanceLtvPct: number;
  /** Refinance closing costs. */
  refinanceClosingCosts: number;
}

export interface RefinanceResult {
  /** New loan amount = ARV × LTV. */
  newLoanAmount: number;
  /** Cash returned to you at closing after payoff + costs. */
  cashOut: number;
  /** Capital still tied up after the refi (0 = full BRRRR). */
  capitalLeftInDeal: number;
  /** True when you pulled all (or more than all) your cash back out. */
  infiniteReturn: boolean;
  /** Equity remaining after the new loan (ARV − new loan). */
  equityRemaining: number;
}

export function analyzeRefinance(inputs: RefinanceInputs): RefinanceResult {
  const newLoanAmount = (inputs.arv || 0) * ((inputs.refinanceLtvPct || 0) / 100);
  const cashOut =
    newLoanAmount -
    (inputs.existingLoanPayoff || 0) -
    (inputs.refinanceClosingCosts || 0);
  const capitalLeftInDeal = Math.max(0, (inputs.totalInvested || 0) - cashOut);
  return {
    newLoanAmount: Math.round(newLoanAmount),
    cashOut: Math.round(cashOut),
    capitalLeftInDeal: Math.round(capitalLeftInDeal),
    infiniteReturn: cashOut >= (inputs.totalInvested || 0),
    equityRemaining: Math.round((inputs.arv || 0) - newLoanAmount),
  };
}
