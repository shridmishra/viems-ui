/**
 * Union Rate Integration Engine (Task 25)
 * Cross-references remuneration against official industry union rate cards:
 * - Equity (Performers, Actors, Dancers, Singers, Stage Management)
 * - PACT (Producers Alliance for Cinema & Television - Film/TV Crew)
 * - BECTU (Broadcasting, Entertainment, Communications and Theatre Union - Tech Crew, Grips, Camera, Sound)
 * - Musicians' Union (MU - Orchestral, Session, Live Band, Soloists)
 * 
 * Enforces Home Office Appendix Creative Worker & Temporary Work wage compliance.
 */

export type UnionType = "EQUITY" | "PACT" | "BECTU" | "MU" | "NONE";

export type RatePeriod = "HOURLY" | "DAILY" | "WEEKLY" | "PER_PERFORMANCE" | "ANNUAL";

export interface UnionRateCard {
  id: number | string;
  union: UnionType;
  unionName: string;
  roleCategory: string;
  jobTitle: string;
  period: RatePeriod;
  minimumRate: number;
  currency: string;
  agreementName: string;
  effectiveDate?: string;
  notes?: string;
}

export interface UnionRateValidationResult {
  isCompliant: boolean;
  status: "COMPLIANT" | "BELOW_MINIMUM" | "EXCEEDS_MINIMUM" | "EXEMPT";
  enteredAmount: number;
  minimumRate: number;
  deficit: number;
  percentageVariance: number;
  currency: string;
  union: string;
  unionName: string;
  roleMatched: string;
  period: RatePeriod;
  agreementName: string;
  effectiveDate?: string;
  message: string;
  recommendation?: string;
}

export interface ValidationParams {
  union: string;
  jobTitle?: string;
  amount: number | string;
  period?: RatePeriod | string;
  currency?: string;
  hoursPerWeek?: number | string;
}

export const OFFICIAL_UNION_RATES: UnionRateCard[] = [
  // ─── EQUITY ─────────────────────────────────────────────────────────────
  {
    id: "eq-1",
    union: "EQUITY",
    unionName: "Equity (Performers & Creative Practitioners)",
    roleCategory: "Acting & Performance",
    jobTitle: "Actor / Performer (West End & Commercial Theatre)",
    period: "WEEKLY",
    minimumRate: 750.00,
    currency: "GBP",
    agreementName: "Equity / SOLT West End Agreement 2026",
    effectiveDate: "2026-01-01",
    notes: "Tier 1 West End standard weekly minimum. Rehearsal rate applies at 100% of minimum.",
  },
  {
    id: "eq-2",
    union: "EQUITY",
    unionName: "Equity (Performers & Creative Practitioners)",
    roleCategory: "Acting & Performance",
    jobTitle: "Actor / Performer (Subsidised & Commercial Touring)",
    period: "WEEKLY",
    minimumRate: 625.00,
    currency: "GBP",
    agreementName: "Equity / UK Theatre Commercial Touring Agreement 2026",
    effectiveDate: "2026-01-01",
    notes: "Includes national touring minimum allowance. Touring subsistence paid additionally.",
  },
  {
    id: "eq-3",
    union: "EQUITY",
    unionName: "Equity (Performers & Creative Practitioners)",
    roleCategory: "Dance & Choreography",
    jobTitle: "Commercial Dancer / Ensemble Performer",
    period: "WEEKLY",
    minimumRate: 680.00,
    currency: "GBP",
    agreementName: "Equity Dance & Commercial Agreement 2026",
    effectiveDate: "2026-01-01",
    notes: "Covers live arena tours, commercial dance revues, and festival performances.",
  },
  {
    id: "eq-4",
    union: "EQUITY",
    unionName: "Equity (Performers & Creative Practitioners)",
    roleCategory: "Dance & Choreography",
    jobTitle: "Soloist Dancer / Featured Artist",
    period: "PER_PERFORMANCE",
    minimumRate: 215.00,
    currency: "GBP",
    agreementName: "Equity Featured Soloist Scale 2026",
    effectiveDate: "2026-01-01",
    notes: "Per-performance fee for featured soloists in concert or guest appearances.",
  },
  {
    id: "eq-5",
    union: "EQUITY",
    unionName: "Equity (Performers & Creative Practitioners)",
    roleCategory: "Stage & Production Management",
    jobTitle: "Company Stage Manager (CSM)",
    period: "WEEKLY",
    minimumRate: 850.00,
    currency: "GBP",
    agreementName: "Equity Stage Management Agreement 2026",
    effectiveDate: "2026-01-01",
    notes: "Higher tier responsibility rate for touring and West End production companies.",
  },
  {
    id: "eq-6",
    union: "EQUITY",
    unionName: "Equity (Performers & Creative Practitioners)",
    roleCategory: "Stage & Production Management",
    jobTitle: "Deputy / Assistant Stage Manager (DSM / ASM)",
    period: "WEEKLY",
    minimumRate: 640.00,
    currency: "GBP",
    agreementName: "Equity Stage Management Agreement 2026",
    effectiveDate: "2026-01-01",
    notes: "Includes production prep days and technical rehearsal coverage.",
  },

  // ─── PACT ───────────────────────────────────────────────────────────────
  {
    id: "pact-1",
    union: "PACT",
    unionName: "PACT (Producers Alliance for Cinema & Television)",
    roleCategory: "Camera & Lighting",
    jobTitle: "Director of Photography (DoP / Cinematographer)",
    period: "WEEKLY",
    minimumRate: 2600.00,
    currency: "GBP",
    agreementName: "PACT / BECTU Major Motion Picture Agreement 2026",
    effectiveDate: "2026-01-01",
    notes: "Feature film / High-End TV (HETV) tier 1 band based on 5-day week.",
  },
  {
    id: "pact-2",
    union: "PACT",
    unionName: "PACT (Producers Alliance for Cinema & Television)",
    roleCategory: "Camera & Lighting",
    jobTitle: "Camera Operator (Film & High-End TV)",
    period: "WEEKLY",
    minimumRate: 1850.00,
    currency: "GBP",
    agreementName: "PACT / BECTU Feature & HETV Agreement 2026",
    effectiveDate: "2026-01-01",
    notes: "Standard working day rate equivalent: £370/day (11hr camera day).",
  },
  {
    id: "pact-3",
    union: "PACT",
    unionName: "PACT (Producers Alliance for Cinema & Television)",
    roleCategory: "Sound & Audio",
    jobTitle: "Production Sound Mixer / Recordist",
    period: "WEEKLY",
    minimumRate: 1750.00,
    currency: "GBP",
    agreementName: "PACT / BECTU Sound Department Scale 2026",
    effectiveDate: "2026-01-01",
    notes: "Excludes equipment package rental; labor only rate.",
  },
  {
    id: "pact-4",
    union: "PACT",
    unionName: "PACT (Producers Alliance for Cinema & Television)",
    roleCategory: "Art & Costume",
    jobTitle: "Costume Designer / Art Director",
    period: "WEEKLY",
    minimumRate: 1900.00,
    currency: "GBP",
    agreementName: "PACT / BECTU Art Department Agreement 2026",
    effectiveDate: "2026-01-01",
    notes: "Pre-production prep and shooting week rates combined.",
  },

  // ─── BECTU ──────────────────────────────────────────────────────────────
  {
    id: "bectu-1",
    union: "BECTU",
    unionName: "BECTU (Broadcasting, Entertainment & Theatre Union)",
    roleCategory: "Grip & Rigging",
    jobTitle: "Key Grip",
    period: "DAILY",
    minimumRate: 360.00,
    currency: "GBP",
    agreementName: "BECTU Grip Branch Rate Card 2026",
    effectiveDate: "2026-01-01",
    notes: "Standard 10+1 hr shooting day. Overtime charged at 1.5x basic hourly.",
  },
  {
    id: "bectu-2",
    union: "BECTU",
    unionName: "BECTU (Broadcasting, Entertainment & Theatre Union)",
    roleCategory: "Grip & Rigging",
    jobTitle: "Grip / Dolly Grip",
    period: "DAILY",
    minimumRate: 310.00,
    currency: "GBP",
    agreementName: "BECTU Grip Branch Rate Card 2026",
    effectiveDate: "2026-01-01",
    notes: "Weekly rate equivalent based on 5 days: £1,550.00/week.",
  },
  {
    id: "bectu-3",
    union: "BECTU",
    unionName: "BECTU (Broadcasting, Entertainment & Theatre Union)",
    roleCategory: "Camera & Lighting",
    jobTitle: "Gaffer / Chief Lighting Technician",
    period: "DAILY",
    minimumRate: 375.00,
    currency: "GBP",
    agreementName: "BECTU Lighting Branch Scale 2026",
    effectiveDate: "2026-01-01",
    notes: "Standard 10+1 hr day on location or studio production.",
  },
  {
    id: "bectu-4",
    union: "BECTU",
    unionName: "BECTU (Broadcasting, Entertainment & Theatre Union)",
    roleCategory: "Hair & Makeup",
    jobTitle: "Hair & Makeup Artist (HMUA / Prosthetics)",
    period: "DAILY",
    minimumRate: 320.00,
    currency: "GBP",
    agreementName: "BECTU Hair & Makeup Branch Agreement 2026",
    effectiveDate: "2026-01-01",
    notes: "Includes early morning call time allowance where applicable.",
  },

  // ─── MUSICIANS' UNION (MU) ──────────────────────────────────────────────
  {
    id: "mu-1",
    union: "MU",
    unionName: "Musicians' Union (MU)",
    roleCategory: "Music & Orchestral",
    jobTitle: "Orchestral Musician (Section Player)",
    period: "PER_PERFORMANCE",
    minimumRate: 185.00,
    currency: "GBP",
    agreementName: "MU / Orchestral Standard Scale 2026",
    effectiveDate: "2026-01-01",
    notes: "Concert or theatrical service up to 3 hours. Rehearsals paid at £125/service.",
  },
  {
    id: "mu-2",
    union: "MU",
    unionName: "Musicians' Union (MU)",
    roleCategory: "Music & Orchestral",
    jobTitle: "Orchestral Musician (Section Principal / Leader)",
    period: "PER_PERFORMANCE",
    minimumRate: 235.00,
    currency: "GBP",
    agreementName: "MU / Orchestral Standard Scale 2026",
    effectiveDate: "2026-01-01",
    notes: "Principal chair premium included for symphony and pit orchestra services.",
  },
  {
    id: "mu-3",
    union: "MU",
    unionName: "Musicians' Union (MU)",
    roleCategory: "Music & Orchestral",
    jobTitle: "Session Musician (Commercial Sound Recording)",
    period: "DAILY",
    minimumRate: 340.00,
    currency: "GBP",
    agreementName: "MU Commercial Sound Recording Agreement 2026",
    effectiveDate: "2026-01-01",
    notes: "Includes up to two 3-hour recording sessions with master track buyout.",
  },
  {
    id: "mu-4",
    union: "MU",
    unionName: "Musicians' Union (MU)",
    roleCategory: "Music & Orchestral",
    jobTitle: "Touring Musician / Band Member",
    period: "WEEKLY",
    minimumRate: 980.00,
    currency: "GBP",
    agreementName: "MU Live Tour Engagements Scale 2026",
    effectiveDate: "2026-01-01",
    notes: "Minimum touring fee covering up to 5 performances per week.",
  },
];

export const UNION_METADATA: Record<UnionType, { name: string; short: string; badge: string; description: string }> = {
  EQUITY: {
    name: "Equity",
    short: "Equity",
    badge: "Performers & Stage",
    description: "Actors, Dancers, Singers, Choreographers, Variety Artists, Stage Management",
  },
  PACT: {
    name: "PACT",
    short: "PACT",
    badge: "Film & TV Production",
    description: "Producers Alliance for Cinema and Television standard crew scales",
  },
  BECTU: {
    name: "BECTU",
    short: "BECTU",
    badge: "Broadcasting & Technical",
    description: "Camera, Lighting, Grip, Sound, Art Dept, Hair/Makeup, Post-Production",
  },
  MU: {
    name: "Musicians' Union",
    short: "MU",
    badge: "Music & Orchestral",
    description: "Orchestral players, Session musicians, Touring band members, Soloists",
  },
  NONE: {
    name: "Standard / Non-Union",
    short: "None",
    badge: "Exempt / General",
    description: "Unrepresented or statutory UK National Living Wage / SOC Going Rate",
  },
};

/**
 * Format currency value with symbol.
 */
export function formatCurrency(val: number, curr = "GBP"): string {
  const sym = curr === "GBP" ? "£" : curr === "USD" ? "$" : curr === "EUR" ? "€" : `${curr} `;
  return `${sym}${Number(val).toLocaleString("en-GB", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
}

/**
 * Clean numeric value from a string (e.g. "£750/week" -> 750).
 */
export function parseSalaryAmount(val: string | number | undefined | null): number {
  if (val === undefined || val === null) return 0;
  if (typeof val === "number") return isNaN(val) ? 0 : val;
  const cleaned = String(val).replace(/[^0-9.]/g, "");
  const num = parseFloat(cleaned);
  return isNaN(num) ? 0 : num;
}

/**
 * Detect remuneration period from string (e.g. "£48,000/year" -> ANNUAL).
 */
export function detectSalaryPeriod(val: string | number | undefined | null): RatePeriod {
  if (!val) return "WEEKLY";
  const s = String(val).toLowerCase();
  if (s.includes("year") || s.includes("annum") || s.includes("/yr") || s.includes("annual")) return "ANNUAL";
  if (s.includes("day") || s.includes("daily") || s.includes("/d")) return "DAILY";
  if (s.includes("hour") || s.includes("hourly") || s.includes("/hr") || s.includes("p/h")) return "HOURLY";
  if (s.includes("gig") || s.includes("perf") || s.includes("show") || s.includes("session")) return "PER_PERFORMANCE";
  return "WEEKLY";
}

/**
 * Find best matching rate card based on union, role, and period.
 */
export function findMatchingRate(
  union: string,
  jobTitle?: string,
  preferredPeriod?: string
): UnionRateCard | undefined {
  const u = (union || "").toUpperCase().trim() as UnionType;
  const rates = OFFICIAL_UNION_RATES.filter((r) => r.union === u);
  if (rates.length === 0) return undefined;

  if (!jobTitle) return rates[0];

  const jLower = jobTitle.toLowerCase().trim();

  // 1. Exact match
  const exact = rates.find((r) => r.jobTitle.toLowerCase() === jLower);
  if (exact) return exact;

  // 2. Substring match
  const sub = rates.find((r) => jLower.includes(r.jobTitle.toLowerCase()) || r.jobTitle.toLowerCase().includes(jLower));
  if (sub) return sub;

  // 3. Word token match
  const words = jLower.split(/[\s/,-]+/).filter((w) => w.length > 3);
  for (const word of words) {
    const tokenMatch = rates.find((r) => r.jobTitle.toLowerCase().includes(word) || r.roleCategory.toLowerCase().includes(word));
    if (tokenMatch) return tokenMatch;
  }

  // 4. Period preference
  if (preferredPeriod) {
    const periodMatch = rates.find((r) => r.period === preferredPeriod.toUpperCase());
    if (periodMatch) return periodMatch;
  }

  return rates[0];
}

/**
 * Validates remuneration against official union minimum scales.
 */
export function validateRemuneration({
  union,
  jobTitle = "",
  amount,
  period,
  currency = "GBP",
  hoursPerWeek = 37.5,
}: ValidationParams): UnionRateValidationResult {
  const unionCode = (union || "NONE").toUpperCase().trim() as UnionType;
  const numAmount = parseSalaryAmount(amount);
  const numHours = Number(hoursPerWeek) || 37.5;
  const inputPeriod = ((period as string) || detectSalaryPeriod(amount) || "WEEKLY").toUpperCase() as RatePeriod;

  if (["NONE", "EXEMPT", "UNREPRESENTED"].includes(unionCode)) {
    return {
      isCompliant: true,
      status: "EXEMPT",
      enteredAmount: numAmount,
      minimumRate: 0,
      deficit: 0,
      percentageVariance: 0,
      currency,
      union: "NONE",
      unionName: UNION_METADATA.NONE.name,
      roleMatched: jobTitle || "Standard Role",
      period: inputPeriod,
      agreementName: "UKVI General Going Rate Standard",
      message: "Role is marked as non-unionized. Standard UK National Living Wage / SOC code rules apply.",
      recommendation: "Ensure remuneration meets general UKVI Appendix Skilled Occupations / Creative Worker thresholds.",
    };
  }

  const matched = findMatchingRate(unionCode, jobTitle, inputPeriod);

  if (!matched) {
    return {
      isCompliant: true,
      status: "EXEMPT",
      enteredAmount: numAmount,
      minimumRate: 0,
      deficit: 0,
      percentageVariance: 0,
      currency,
      union: unionCode,
      unionName: UNION_METADATA[unionCode]?.name || unionCode,
      roleMatched: jobTitle || "Unspecified",
      period: inputPeriod,
      agreementName: "Direct Employer / Union Consultation",
      message: `No specific union rate card published for "${jobTitle}" under ${unionCode}.`,
      recommendation: "Verify agreed pay directly against production union agreement prior to CoS assignment.",
    };
  }

  const standardPeriod = matched.period;
  const minimumRate = matched.minimumRate;

  // Convert entered amount to match the benchmark rate's comparison period
  let normalizedEntered = numAmount;

  if (inputPeriod !== standardPeriod) {
    let weeklyAmount = numAmount;
    if (inputPeriod === "WEEKLY") weeklyAmount = numAmount;
    else if (inputPeriod === "DAILY") weeklyAmount = numAmount * 5;
    else if (inputPeriod === "HOURLY") weeklyAmount = numAmount * numHours;
    else if (inputPeriod === "ANNUAL") weeklyAmount = numAmount / 52;
    else if (inputPeriod === "PER_PERFORMANCE") weeklyAmount = numAmount * 5;

    if (standardPeriod === "WEEKLY") normalizedEntered = weeklyAmount;
    else if (standardPeriod === "DAILY") normalizedEntered = weeklyAmount / 5;
    else if (standardPeriod === "HOURLY") normalizedEntered = weeklyAmount / numHours;
    else if (standardPeriod === "ANNUAL") normalizedEntered = weeklyAmount * 52;
    else if (standardPeriod === "PER_PERFORMANCE") normalizedEntered = weeklyAmount / 5;
  }

  const isCompliant = normalizedEntered >= minimumRate;
  const deficit = isCompliant ? 0 : Math.round((minimumRate - normalizedEntered) * 100) / 100;
  const percentageVariance = minimumRate > 0 ? Math.round(((normalizedEntered - minimumRate) / minimumRate) * 1000) / 10 : 0;
  const status = isCompliant ? (percentageVariance > 0 ? "EXCEEDS_MINIMUM" : "COMPLIANT") : "BELOW_MINIMUM";

  const periodLabel = standardPeriod.toLowerCase().replace("_", " ");
  const sym = currency === "GBP" ? "£" : currency;

  let message = "";
  let recommendation = "";

  if (isCompliant) {
    message = `Meets ${matched.unionName} agreed scale (${formatCurrency(minimumRate, currency)}/${periodLabel}).`;
    recommendation = percentageVariance > 0
      ? `Pay exceeds union minimum by ${formatCurrency(normalizedEntered - minimumRate, currency)} (${percentageVariance}% buffer).`
      : `Remuneration conforms exactly to union minimum threshold.`;
  } else {
    message = `COMPLIANCE BREACH: Proposed pay of ${sym}${normalizedEntered.toFixed(2)}/${periodLabel} is below ${matched.union} minimum (${formatCurrency(minimumRate, currency)}/${periodLabel}).`;
    recommendation = `Increase pay by at least ${formatCurrency(deficit, currency)}/${periodLabel} to protect against Home Office sponsorship refusal under Appendix Creative Worker.`;
  }

  return {
    isCompliant,
    status,
    enteredAmount: numAmount,
    minimumRate,
    deficit,
    percentageVariance,
    currency,
    union: matched.union,
    unionName: matched.unionName,
    roleMatched: matched.jobTitle,
    period: standardPeriod,
    agreementName: matched.agreementName,
    effectiveDate: matched.effectiveDate,
    message,
    recommendation,
  };
}

/**
 * Fetch union rate cards from backend API with local fallback.
 */
export async function fetchUnionRates(query?: { union?: string; search?: string }): Promise<UnionRateCard[]> {
  try {
    const params = new URLSearchParams();
    if (query?.union) params.set("union", query.union);
    if (query?.search) params.set("search", query.search);

    const res = await fetch(`/api/union-rates?${params.toString()}`, {
      headers: { Accept: "application/json" },
    });

    if (res.ok) {
      const data = await res.json();
      if (Array.isArray(data) && data.length > 0) {
        return data;
      }
    }
  } catch {
    // Fall back to embedded offline rates
  }

  let list = [...OFFICIAL_UNION_RATES];
  if (query?.union) {
    const u = query.union.toUpperCase();
    list = list.filter((r) => r.union === u);
  }
  if (query?.search) {
    const s = query.search.toLowerCase();
    list = list.filter(
      (r) =>
        r.jobTitle.toLowerCase().includes(s) ||
        r.roleCategory.toLowerCase().includes(s) ||
        r.agreementName?.toLowerCase().includes(s)
    );
  }
  return list;
}
