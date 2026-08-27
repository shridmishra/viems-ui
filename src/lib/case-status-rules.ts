import { CASE_STATUSES, CaseStatusOption, isMatchingStatus } from "@/app/(app)/cases/case-status-data";

export interface StatusReasonOption {
  value: string;
  label: string;
  requiresDescription?: boolean;
}

export const WITHDRAWAL_REASONS: StatusReasonOption[] = [
  { value: "production_canceled", label: "Production / filming canceled or postponed" },
  { value: "migrant_withdrew", label: "Migrant withdrew participation / resigned" },
  { value: "cos_revoked", label: "CoS revoked prior to visa submission" },
  { value: "duplicate_application", label: "Duplicate CoS application issued in error" },
  { value: "failed_rtw_eligibility", label: "Failed eligibility or Right-to-Work verification" },
  { value: "other", label: "Other (specify below)", requiresDescription: true },
];

export const CLOSURE_REASONS: StatusReasonOption[] = [
  { value: "engagement_completed", label: "Engagement / production successfully completed" },
  { value: "migrant_departed_uk", label: "Migrant departed UK upon visa expiry" },
  { value: "curtailment_issued", label: "Home Office curtailment letter issued" },
  { value: "transferred_sponsor", label: "Migrant transferred to another licensed sponsor" },
  { value: "other", label: "Other (specify below)", requiresDescription: true },
];

export const INELIGIBLE_REASONS: StatusReasonOption[] = [
  { value: "passport_validity", label: "Passport expired or < 6 months validity without renewal" },
  { value: "salary_below_threshold", label: "Proposed pay below Home Office / Union minimum rate" },
  { value: "gap_exceeds_14_days", label: "Tour schedule gap exceeds 14 continuous days" },
  { value: "immigration_breach", label: "Previous UK immigration overstay or refusal history" },
  { value: "other", label: "Other (specify below)", requiresDescription: true },
];

export const REFUSAL_REASONS_EXTENDED: StatusReasonOption[] = [
  { value: "cos_revoked", label: "CoS revoked prior to entry" },
  { value: "incomplete_application", label: "Incomplete application package" },
  { value: "previous_overstay", label: "Previous visa overstay on record" },
  { value: "financial_requirements", label: "Financial maintenance requirements not met" },
  { value: "insufficient_evidence", label: "Insufficient evidence of genuine engagement" },
  { value: "interview_not_cleared", label: "UKVI interview not cleared" },
  { value: "other", label: "Other (specify below)", requiresDescription: true },
];

/**
 * Checks if transitioning to a given target status requires a mandatory reason modal.
 */
export function requiresReasonModal(targetStatus: string): boolean {
  if (!targetStatus) return false;
  const s = targetStatus.toLowerCase().replace(/_/g, " ").trim();
  return (
    s === "application withdrawn" ||
    s.includes("withdrawn") ||
    s === "case closed" ||
    s === "closed" ||
    s.includes("closed") ||
    s === "ineligible / high risk" ||
    s.includes("ineligible") ||
    s === "visa refused" ||
    s.includes("refused")
  );
}

/**
 * Returns the relevant reason list based on target status.
 */
export function getReasonOptionsForStatus(targetStatus: string): StatusReasonOption[] {
  const s = targetStatus.toLowerCase().replace(/_/g, " ").trim();
  if (s.includes("withdrawn")) return WITHDRAWAL_REASONS;
  if (s.includes("closed")) return CLOSURE_REASONS;
  if (s.includes("ineligible")) return INELIGIBLE_REASONS;
  if (s.includes("refused")) return REFUSAL_REASONS_EXTENDED;
  return WITHDRAWAL_REASONS;
}

export type LifecycleStage =
  | "ASSESSMENT"
  | "DRAFTING"
  | "SPONSORSHIP"
  | "ACTIVE_COMPLIANCE"
  | "TERMINAL";

export interface StatusStageGroup {
  id: LifecycleStage;
  title: string;
  statuses: CaseStatusOption[];
}

/**
 * Maps a status string to its lifecycle stage.
 */
export function getStatusStage(status: string): LifecycleStage {
  const s = status.toLowerCase().replace(/_/g, " ").trim();

  if (s.includes("withdrawn") || s.includes("closed") || s.includes("refused") || s.includes("ineligible")) {
    return "TERMINAL";
  }
  if (s.includes("approved") || s.includes("active compliance") || s.includes("in uk")) {
    return "ACTIVE_COMPLIANCE";
  }
  if (s.includes("cos assigned") || s.includes("awaiting ukvi") || s.includes("awaiting biometrics") || s.includes("awaiting interview")) {
    return "SPONSORSHIP";
  }
  if (s.includes("drafting") || s.includes("cleared") || s.includes("ready for submission") || s.includes("info requested") || s.includes("docs requested")) {
    return "DRAFTING";
  }
  return "ASSESSMENT";
}

/**
 * Returns recommended forward progression statuses for a given current status.
 */
export function getRecommendedNextStatuses(currentStatus: string): string[] {
  const s = currentStatus.toLowerCase().replace(/_/g, " ").trim();

  switch (s) {
    case "draft":
    case "eligibility assessment":
    case "awaiting applicant docs":
      return ["cleared_for_sponsorship", "drafting_cos", "ineligible_high_risk"];
    case "cleared for sponsorship":
    case "drafting cos":
    case "info requested":
    case "additional docs requested":
      return ["ready_for_submission", "cos_assigned", "application_withdrawn"];
    case "ready for submission":
      return ["cos_assigned", "application_withdrawn"];
    case "cos assigned":
      return ["awaiting_ukvi_decision", "awaiting_biometrics", "visa_approved", "application_withdrawn"];
    case "awaiting ukvi decision":
    case "awaiting biometrics":
    case "awaiting interview":
      return ["visa_approved", "visa_refused", "application_withdrawn"];
    case "visa approved":
      return ["case_closed"];
    default:
      return [];
  }
}

/**
 * Groups all case statuses by their logical progression stages.
 */
export function getGroupedStatuses(): StatusStageGroup[] {
  const assessmentStatuses = CASE_STATUSES.filter((s) =>
    ["draft", "eligibility_assessment", "awaiting_applicant_docs"].includes(s.value)
  );

  const draftingStatuses = CASE_STATUSES.filter((s) =>
    ["cleared_for_sponsorship", "drafting_cos", "ready_for_submission", "info_requested", "additional_docs_requested"].includes(s.value)
  );

  const sponsorshipStatuses = CASE_STATUSES.filter((s) =>
    ["cos_assigned", "awaiting_ukvi_decision", "awaiting_biometrics", "awaiting_interview"].includes(s.value)
  );

  const complianceStatuses = CASE_STATUSES.filter((s) =>
    ["visa_approved"].includes(s.value)
  );

  const terminalStatuses = CASE_STATUSES.filter((s) =>
    ["visa_refused", "ineligible_high_risk", "application_withdrawn", "case_closed"].includes(s.value)
  );

  return [
    { id: "ASSESSMENT", title: "1. Assessment & Intake", statuses: assessmentStatuses },
    { id: "DRAFTING", title: "2. CoS Preparation & Review", statuses: draftingStatuses },
    { id: "SPONSORSHIP", title: "3. Sponsorship & UKVI Submission", statuses: sponsorshipStatuses },
    { id: "ACTIVE_COMPLIANCE", title: "4. Decision & RTW", statuses: complianceStatuses },
    { id: "TERMINAL", title: "Withdrawal & Terminal States", statuses: terminalStatuses },
  ];
}
