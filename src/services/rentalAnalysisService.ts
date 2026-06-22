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
