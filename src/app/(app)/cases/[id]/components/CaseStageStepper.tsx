"use client";

import * as React from "react";
import {
  RiCheckLine,
  RiArrowRightLine,
  RiShieldCheckLine,
  RiFileTextLine,
  RiUserSearchLine,
  RiGovernmentLine,
  RiPassportLine,
  RiCompass3Line,
} from "@remixicon/react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";

export interface StageInfo {
  id: string;
  name: string;
  shortName: string;
  description: string;
  immediateAction: string;
  ctaText: string;
  ctaAction?: string;
  icon: React.ElementType;
}

export const STAGES: StageInfo[] = [
  {
    id: "role_assessment",
    name: "Role Assessment",
    shortName: "Role Assessment",
    description: "Map job duties to UKVI SOC classification and verify RQF 3+ skill level.",
    immediateAction: "Confirm job title, SOC classification, and route eligibility.",
    ctaText: "Assess Role",
    ctaAction: "employment",
    icon: RiUserSearchLine,
  },
  {
    id: "code_of_practice",
    name: "Code of Practice Verification",
    shortName: "Code of Practice",
    description: "Validate salary threshold (£38,700 or SOC going rate) and contracted hours.",
    immediateAction: "Verify salary against Appendix Skilled Occupations going rate.",
    ctaText: "Verify Salary",
    ctaAction: "employment",
    icon: RiGovernmentLine,
  },
  {
    id: "cos_drafted",
    name: "CoS Drafted",
    shortName: "CoS Drafted",
    description: "Review draft Certificate of Sponsorship payload and pre-assignment details.",
    immediateAction: "Complete draft CoS details and conduct pre-assignment check.",
    ctaText: "Review CoS",
    ctaAction: "status",
    icon: RiFileTextLine,
  },
  {
    id: "cos_assigned",
    name: "CoS Assigned",
    shortName: "CoS Assigned",
    description: "CoS assigned in SMS; track UKVI visa application and biometrics appointment.",
    immediateAction: "Dispatch CoS reference to migrant and monitor visa application.",
    ctaText: "Track Visa",
    ctaAction: "status",
    icon: RiPassportLine,
  },
  {
    id: "rtw_check",
    name: "RTW Check",
    shortName: "RTW Check",
    description: "Collect Home Office share code and secure statutory excuse prior to start date.",
    immediateAction: "Collect share code from migrant and complete online RTW check.",
    ctaText: "Run RTW Check",
    ctaAction: "rtw",
    icon: RiShieldCheckLine,
  },
  {
    id: "active_engagement",
    name: "Active Engagement",
    shortName: "Active Engagement",
    description: "Ongoing sponsorship compliance, reporting duties (10-day SMS rule), and renewals.",
    immediateAction: "Monitor active employment, track visa renewal, and SMS reporting.",
    ctaText: "View Compliance",
    ctaAction: "compliance",
    icon: RiCompass3Line,
  },
];

export interface CaseStageStepperProps {
  caseData?: {
    approvalStatus?: string;
    visaStatus?: string;
    cosStatus?: string;
    cosRef?: string;
    location?: string;
    socCode?: string;
    grossSalary?: string;
    decision?: string;
    openTasksCount?: number;
    missingDocsCount?: number;
    [key: string]: unknown;
  } | null;
  onActionClick?: (actionType: string) => void;
}

export function determineActiveStageIndex(caseData?: CaseStageStepperProps["caseData"]): number {
  if (!caseData) return 0;

  const approval = (caseData.approvalStatus || "").toUpperCase();
  const visaStatus = (caseData.visaStatus || "").toUpperCase();
  const cosStatus = (caseData.cosStatus || "").toUpperCase();
  const location = (caseData.location || "").toUpperCase();
  const hasCosRef = Boolean(caseData.cosRef && caseData.cosRef !== "—" && caseData.cosRef !== "");

  // Stage 5: Active Engagement (Migrant in UK, Visa active, Approved)
  if (
    (visaStatus === "VISA ACTIVE" || approval.includes("ACTIVE") || approval.includes("CLEARED")) &&
    location === "IN UK"
  ) {
    return 5;
  }

  // Stage 4: RTW Check (Visa approved or arrived, but RTW not completed)
  if (
    approval.includes("APPROVED") ||
    approval.includes("GRANTED") ||
    approval.includes("RTW") ||
    caseData.decision === "Granted"
  ) {
    return 4;
  }

  // Stage 3: CoS Assigned (CoS assigned, waiting for UKVI decision / biometrics)
  if (
    cosStatus === "ASSIGNED" ||
    hasCosRef ||
    approval.includes("ASSIGNED") ||
    approval.includes("AWAITING UKVI") ||
    approval.includes("BIOMETRICS") ||
    approval.includes("INTERVIEW")
  ) {
    return 3;
  }

  // Stage 2: CoS Drafted (Drafting CoS or ready for submission)
  if (
    cosStatus === "DRAFT" ||
    approval.includes("DRAFT") ||
    approval.includes("SUBMISSION")
  ) {
    return 2;
  }

  // Stage 1: Code of Practice Verification (Role & SOC assessed, verifying going rate / docs)
  if (
    caseData.socCode ||
    approval.includes("ELIGIBILITY") ||
    approval.includes("APPLICANT DOCS") ||
    approval.includes("INFO REQUESTED")
  ) {
    return 1;
  }

  // Stage 0: Role Assessment
  return 0;
}

export function CaseStageStepper({ caseData, onActionClick }: CaseStageStepperProps) {
  const activeStageIndex = React.useMemo(
    () => determineActiveStageIndex(caseData),
    [caseData]
  );

  const [selectedStageIndex, setSelectedStageIndex] = React.useState<number>(activeStageIndex);

  React.useEffect(() => {
    setSelectedStageIndex(activeStageIndex);
  }, [activeStageIndex]);

  const currentStage = STAGES[activeStageIndex];
  const displayedStage = STAGES[selectedStageIndex];
  const isRefused = (caseData?.approvalStatus || "").toUpperCase().includes("REFUSED");

  return (
    <div className="bg-white border border-[#EBEBEB] rounded-[16px] p-[16px_20px] shadow-[0px_1px_2px_rgba(10,13,20,0.03)] flex flex-col gap-[12px] w-full font-sans mb-[20px]">
      {/* ====== HEADER ROW: Title + Action Button ====== */}
      <div className="flex items-center justify-between gap-3">
        <div className="flex items-center gap-[8px] flex-wrap">
          <span className="font-aeonik-medium text-[15px] font-medium text-[#171717] tracking-[-0.01em]">
            Sponsorship Pipeline
          </span>
          {isRefused && (
            <Badge variant="destructive" withDot>
              Visa Refused
            </Badge>
          )}
        </div>

        {/* Action Button */}
        {displayedStage.ctaAction && onActionClick && (
          <Button
            type="button"
            size="sm"
            onClick={() => onActionClick(displayedStage.ctaAction || "")}
            className="h-[30px] px-3 bg-[#171717] hover:bg-neutral-800 text-white rounded-[8px] text-[12px] font-medium flex items-center gap-1.5 transition-colors cursor-pointer border-0 shrink-0"
          >
            <span>{displayedStage.ctaText}</span>
            <RiArrowRightLine className="size-3.5 shrink-0" />
          </Button>
        )}
      </div>

      {/* ====== 1 2 3 CIRCLE CONNECTOR PROGRESS TRACK ====== */}
      <div className="grid grid-cols-6 items-start w-full relative pt-1 pb-2">
        {STAGES.map((stage, idx) => {
          const isCompleted = idx < activeStageIndex;
          const isCurrent = idx === activeStageIndex;
          const isSelected = idx === selectedStageIndex;

          return (
            <button
              key={stage.id}
              type="button"
              onClick={() => setSelectedStageIndex(idx)}
              className="relative flex flex-col items-center text-center group cursor-pointer border-0 bg-transparent p-0 focus:outline-none"
              title={`Stage ${idx + 1}: ${stage.name}`}
            >
              {/* Connector Line behind circle (extends to the next circle) */}
              {idx < STAGES.length - 1 && (
                <div
                  className={`absolute top-[14px] left-[50%] w-full h-[2px] z-0 transition-colors ${
                    idx < activeStageIndex ? "bg-[#171717]" : "bg-[#EBEBEB]"
                  }`}
                />
              )}

              {/* Numbered Circle Node (1, 2, 3, 4, 5, 6) */}
              <div
                className={`size-[30px] rounded-full flex items-center justify-center text-[12px] font-semibold transition-all z-10 ${
                  isCompleted
                    ? "bg-[#171717] text-white shadow-x-small group-hover:bg-neutral-800"
                    : isCurrent
                    ? "bg-[#7D52F4] text-white ring-4 ring-[#7D52F4]/20 shadow-sm font-bold scale-105"
                    : isSelected
                    ? "bg-white border-2 border-[#171717] text-[#171717]"
                    : "bg-white border border-[#D1D1D1] text-[#7B7B7B] group-hover:border-[#7B7B7B] group-hover:text-[#171717]"
                }`}
              >
                {isCompleted ? (
                  <RiCheckLine className="size-4 text-white stroke-[2.5]" />
                ) : (
                  <span>{idx + 1}</span>
                )}
              </div>

              {/* Step Title & Status Badge */}
              <div className="mt-[8px] flex flex-col items-center gap-[4px] px-1 max-w-[130px]">
                <span
                  className={`text-[12px] leading-[15px] tracking-[-0.006em] transition-colors ${
                    isCurrent
                      ? "font-semibold text-[#171717]"
                      : isCompleted
                      ? "font-medium text-[#171717]"
                      : "font-normal text-[#7B7B7B] group-hover:text-[#171717]"
                  }`}
                >
                  {stage.shortName}
                </span>
                <Badge
                  variant={isCurrent ? "info" : isCompleted ? "success" : "neutral-lighter"}
                  withDot={isCurrent}
                >
                  {isCurrent ? "Current" : isCompleted ? "Completed" : `Stage ${idx + 1}`}
                </Badge>
              </div>
            </button>
          );
        })}
      </div>

      {/* ====== MINIMAL INLINE ACTION CALLOUT ====== */}
      <div className="bg-[#FAFAFA] border border-[#F0F0F0] rounded-[8px] px-3 py-2 flex items-center justify-between text-[13px] gap-2">
        <div className="flex items-center gap-2 min-w-0 flex-1">
          <Badge
            variant={selectedStageIndex === activeStageIndex ? "warning" : "neutral-lighter"}
            withDot={selectedStageIndex === activeStageIndex}
          >
            {selectedStageIndex === activeStageIndex
              ? "Immediate Action"
              : `Stage ${selectedStageIndex + 1}`}
          </Badge>
          <span className="font-medium text-[#171717] truncate text-[12px]">
            {displayedStage.immediateAction}
          </span>
          <span className="text-[#7B7B7B] hidden md:inline truncate text-[12px]">
            — {displayedStage.description}
          </span>
        </div>
      </div>
    </div>
  );
}
