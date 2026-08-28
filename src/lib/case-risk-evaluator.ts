/**
 * Real-Time Case Risk Evaluator (UKVI Sponsorship & Pre-Production Compliance)
 *
 * Implements Home Office Risk Criteria (Task 8):
 * 1. Passport expiring within 6 months of travel/engagement.
 * 2. CoS start date approaching (≤ 14-21 days) without confirmed visa submission/approval.
 * 3. 14-Day Tour Gap Limit breaches in schedule.
 * 4. Missing mandatory Appendix D pre-CoS records.
 * 5. Visa expiry prior to engagement end date.
 */

export interface RiskFactor {
  id: string;
  code: "PASSPORT_EXPIRY" | "IMMINENT_COS_START" | "TOUR_GAP_BREACH" | "MISSING_DOCUMENTS" | "VISA_EXPIRING_SOON";
  severity: "HIGH" | "MEDIUM" | "LOW";
  title: string;
  description: string;
  recommendation: string;
  daysRemaining?: number;
  triggerDate?: string;
}

export interface CaseRiskAssessment {
  overallRisk: "HIGH" | "MEDIUM" | "LOW";
  riskScore: number; // 0 (safest) to 100 (critical risk)
  isHighRisk: boolean;
  isMediumRisk: boolean;
  factors: RiskFactor[];
  highCount: number;
  mediumCount: number;
  lowCount: number;
  primaryReason: string;
  actionRequired: boolean;
}

const SIX_MONTHS_DAYS = 183;
const IMMINENT_START_HIGH_DAYS = 14;
const IMMINENT_START_MED_DAYS = 30;

export interface CaseRiskInput {
  id?: string | number | null;
  caseId?: string | number | null;
  name?: string | null;
  status?: string | null;
  case_status?: string | null;
  caseStatus?: string | null;
  cosStatusValue?: string | null;
  action?: string | null;
  passportExpiryDate?: string | null;
  passport_expiry_date?: string | null;
  cosStartDate?: string | null;
  cos_start_date?: string | null;
  cosEndDate?: string | null;
  cos_end_date?: string | null;
  workStartDate?: string | null;
  workEndDate?: string | null;
  startDate?: string | null;
  endDate?: string | null;
  visaExpiryDate?: string | null;
  visa_end_date?: string | null;
  missingDocsCount?: number | null;
  hasPassport?: boolean | null;
  passport?: {
    expiryDate?: string;
    number?: string;
    [key: string]: any;
  } | null;
  employment?: {
    startDate?: string;
    endDate?: string;
    [key: string]: any;
  } | null;
  visa?: number | string | {
    endDate?: string;
    totalDays?: number;
    daysLeft?: number;
    [key: string]: any;
  } | null;
  personal?: {
    passportExpiry?: string;
    [key: string]: any;
  } | null;
  [key: string]: any;
}

export function evaluateCaseRisk(caseOrMigrantData?: CaseRiskInput | null): CaseRiskAssessment {
  if (!caseOrMigrantData) {
    return {
      overallRisk: "LOW",
      riskScore: 0,
      isHighRisk: false,
      isMediumRisk: false,
      factors: [],
      highCount: 0,
      mediumCount: 0,
      lowCount: 0,
      primaryReason: "No case data loaded",
      actionRequired: false,
    };
  }

  const factors: RiskFactor[] = [];
  const now = new Date();

  // Normalize data fields from either RawCaseRecord, CaseRow, or Migrant detail object
  const status = String(
    caseOrMigrantData?.status ||
    caseOrMigrantData?.case_status ||
    caseOrMigrantData?.caseStatus ||
    caseOrMigrantData?.cosStatusValue ||
    ""
  ).toLowerCase();

  const passportExpiryStr =
    caseOrMigrantData?.passportExpiryDate ||
    caseOrMigrantData?.passport_expiry_date ||
    caseOrMigrantData?.passport?.expiryDate ||
    caseOrMigrantData?.personal?.passportExpiry ||
    caseOrMigrantData?.expiry_date ||
    caseOrMigrantData?.expiryDate;

  const cosStartDateStr =
    caseOrMigrantData?.cosStartDate ||
    caseOrMigrantData?.cos_start_date ||
    caseOrMigrantData?.workStartDate ||
    caseOrMigrantData?.start_date ||
    caseOrMigrantData?.employment?.startDate ||
    caseOrMigrantData?.startDate;

  const cosEndDateStr =
    caseOrMigrantData?.cosEndDate ||
    caseOrMigrantData?.cos_end_date ||
    caseOrMigrantData?.workEndDate ||
    caseOrMigrantData?.end_date ||
    caseOrMigrantData?.employment?.endDate ||
    caseOrMigrantData?.endDate;

  const visaEndDateStr =
    caseOrMigrantData?.visaExpiryDate ||
    caseOrMigrantData?.visa_end_date ||
    (caseOrMigrantData?.visa && typeof caseOrMigrantData.visa === "object" ? caseOrMigrantData.visa.endDate : undefined) ||
    caseOrMigrantData?.decision?.granted?.visaEndDate;

  const isVisaGranted =
    status.includes("approved") ||
    status.includes("granted") ||
    status.includes("active") ||
    status === "visa approved";

  const isClosedOrRefused =
    status.includes("refused") ||
    status.includes("closed") ||
    status.includes("withdrawn") ||
    status.includes("cancelled");

  // ─── RULE 1: Passport Expiry within 6 Months (< 183 days) ────────────────
  if (passportExpiryStr && !isClosedOrRefused) {
    const passportExp = new Date(passportExpiryStr);
    if (!isNaN(passportExp.getTime())) {
      const diffMs = passportExp.getTime() - now.getTime();
      const diffDays = Math.floor(diffMs / (1000 * 60 * 60 * 24));

      if (diffDays < 0) {
        factors.push({
          id: "rf-passport-expired",
          code: "PASSPORT_EXPIRY",
          severity: "HIGH",
          title: "Passport Expired",
          description: `Migrant's passport expired on ${passportExp.toLocaleDateString("en-GB")}.`,
          recommendation: "Emergency passport renewal required prior to visa application or travel.",
          daysRemaining: diffDays,
          triggerDate: passportExpiryStr,
        });
      } else if (diffDays <= SIX_MONTHS_DAYS) {
        const monthsLeft = Math.max(1, Math.round(diffDays / 30));
        factors.push({
          id: "rf-passport-expiring",
          code: "PASSPORT_EXPIRY",
          severity: "HIGH",
          title: `Passport Expires in ${monthsLeft} Month${monthsLeft === 1 ? "" : "s"}`,
          description: `Passport expires on ${passportExp.toLocaleDateString("en-GB")} (${diffDays} days). UKVI and airlines require at least 6 months validity.`,
          recommendation: "Urgent: Prompt migrant to renew passport immediately before biometric VFS appointment.",
          daysRemaining: diffDays,
          triggerDate: passportExpiryStr,
        });
      }
    }
  }

  // ─── RULE 2: CoS Start Date Approaching without Confirmed Visa Approval ──
  if (cosStartDateStr && !isVisaGranted && !isClosedOrRefused) {
    const startDate = new Date(cosStartDateStr);
    if (!isNaN(startDate.getTime())) {
      const diffMs = startDate.getTime() - now.getTime();
      const diffDays = Math.floor(diffMs / (1000 * 60 * 60 * 24));

      if (diffDays <= IMMINENT_START_HIGH_DAYS && diffDays >= -7) {
        factors.push({
          id: "rf-imminent-start-high",
          code: "IMMINENT_COS_START",
          severity: "HIGH",
          title: `CoS Start Date in ${Math.max(0, diffDays)} Day${diffDays === 1 ? "" : "s"} (No Visa Grant)`,
          description: `Engagement commences on ${startDate.toLocaleDateString("en-GB")}, but visa is not confirmed granted. High risk of missing production start date.`,
          recommendation: "Escalate with VFS/UKVI Super Priority processing or request date postponement.",
          daysRemaining: diffDays,
          triggerDate: cosStartDateStr,
        });
      } else if (diffDays <= IMMINENT_START_MED_DAYS && diffDays > IMMINENT_START_HIGH_DAYS) {
        factors.push({
          id: "rf-imminent-start-med",
          code: "IMMINENT_COS_START",
          severity: "MEDIUM",
          title: `CoS Start Date in ${diffDays} Days`,
          description: `Production scheduled to start on ${startDate.toLocaleDateString("en-GB")}. Visa application submission must be expedited.`,
          recommendation: "Ensure biometrics and VFS appointment are booked within the next 48 hours.",
          daysRemaining: diffDays,
          triggerDate: cosStartDateStr,
        });
      }
    }
  }

  // ─── RULE 3: Visa Expiry Precedes Engagement / CoS End Date ───────────────
  if (visaEndDateStr && cosEndDateStr && !isClosedOrRefused) {
    const visaEnd = new Date(visaEndDateStr);
    const cosEnd = new Date(cosEndDateStr);
    if (!isNaN(visaEnd.getTime()) && !isNaN(cosEnd.getTime()) && visaEnd < cosEnd) {
      factors.push({
        id: "rf-visa-expiry-short",
        code: "VISA_EXPIRING_SOON",
        severity: "HIGH",
        title: "Visa Expires Before Engagement End Date",
        description: `Current visa expires on ${visaEnd.toLocaleDateString("en-GB")} while engagement runs until ${cosEnd.toLocaleDateString("en-GB")}.`,
        recommendation: "File extension or sponsorship variation before current permission expires.",
        triggerDate: visaEndDateStr,
      });
    }
  }

  // ─── RULE 4: Check Local Tour Gap Breaches if Saved in Session/Local ─────
  const caseId = caseOrMigrantData?.id || caseOrMigrantData?.caseId;
  if (caseId && typeof window !== "undefined") {
    try {
      const analysisRaw = localStorage.getItem(`tour_schedule_analysis_${caseId}`);
      if (analysisRaw) {
        const analysis = JSON.parse(analysisRaw);
        if (analysis?.breachCount > 0) {
          factors.push({
            id: "rf-tour-gap-breach",
            code: "TOUR_GAP_BREACH",
            severity: "HIGH",
            title: `14-Day Tour Gap Breach (${analysis.breachCount} break${analysis.breachCount === 1 ? "" : "s"} > 14d)`,
            description: `Schedule contains ${analysis.breachCount} break(s) exceeding 14 calendar days (Max gap: ${analysis.maxGapDays}d). Single CoS concession invalid.`,
            recommendation: "Add intermediate rehearsal/filming dates or split into separate CoS applications.",
          });
        }
      }
    } catch (e) {
      console.error("Failed to parse tour_schedule_analysis from localStorage:", e);
    }
  }

  // ─── RULE 5: Missing Mandatory Passport Record ───────────────────────────
  if (caseOrMigrantData?.action === "Upload passport" && !isClosedOrRefused) {
    factors.push({
      id: "rf-missing-passport",
      code: "MISSING_DOCUMENTS",
      severity: "HIGH",
      title: "Passport Record Missing",
      description: "Passport scan has not been verified in VIEMS. Mandatory pre-CoS record requirement unfulfilled.",
      recommendation: "Request migrant to upload photo/scan of passport biodata page immediately.",
    });
  }

  // ─── Compute Overall Risk Score & Classification ──────────────────────────
  const highCount = factors.filter((f) => f.severity === "HIGH").length;
  const mediumCount = factors.filter((f) => f.severity === "MEDIUM").length;
  const lowCount = factors.filter((f) => f.severity === "LOW").length;

  let overallRisk: "HIGH" | "MEDIUM" | "LOW" = "LOW";
  let riskScore = 10; // baseline

  if (highCount > 0) {
    overallRisk = "HIGH";
    riskScore = Math.min(100, 75 + highCount * 10);
  } else if (mediumCount > 0) {
    overallRisk = "MEDIUM";
    riskScore = Math.min(70, 45 + mediumCount * 10);
  }

  const primaryReason =
    factors[0]?.title ||
    (overallRisk === "LOW" ? "No immediate compliance risks detected" : "Compliance attention recommended");

  return {
    overallRisk,
    riskScore,
    isHighRisk: overallRisk === "HIGH",
    isMediumRisk: overallRisk === "MEDIUM",
    factors,
    highCount,
    mediumCount,
    lowCount,
    primaryReason,
    actionRequired: highCount > 0 || mediumCount > 0,
  };
}
