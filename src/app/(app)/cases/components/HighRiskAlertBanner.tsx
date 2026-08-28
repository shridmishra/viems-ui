"use client";

import * as React from "react";
import { RiAlertLine, RiArrowRightSLine, RiShieldCheckLine } from "@remixicon/react";
import { Button } from "@/components/ui/button";
import { evaluateCaseRisk, CaseRiskAssessment, CaseRiskInput } from "@/lib/case-risk-evaluator";
import { CaseRiskModal } from "./CaseRiskModal";

interface HighRiskAlertBannerProps {
  caseData?: CaseRiskInput | null;
  migrantName?: string;
  className?: string;
  onNavigateToSchedule?: () => void;
}

export function HighRiskAlertBanner({
  caseData,
  migrantName,
  className = "",
  onNavigateToSchedule,
}: HighRiskAlertBannerProps) {
  const [modalOpen, setModalOpen] = React.useState(false);

  const assessment: CaseRiskAssessment = React.useMemo(() => {
    return evaluateCaseRisk(caseData);
  }, [caseData]);

  if (!assessment.isHighRisk && !assessment.isMediumRisk) {
    return null;
  }

  const isHigh = assessment.isHighRisk;

  return (
    <>
      <div
        className={`w-full rounded-[16px] p-4 flex items-center justify-between gap-4 font-sans transition-all shadow-[0px_1px_2px_rgba(10,13,20,0.03)] ${
          isHigh
            ? "bg-[#FFEBEC]/90 border border-[#FECDCA] text-[#681219]"
            : "bg-[#FFFAEB]/90 border border-[#FDE8D3] text-[#624C18]"
        } ${className}`}
      >
        <div className="flex items-center gap-3 min-w-0 flex-1">
          <div
            className={`size-9 rounded-full flex items-center justify-center shrink-0 shadow-2xs ${
              isHigh ? "bg-white text-[#FB3748]" : "bg-white text-[#B45309]"
            }`}
          >
            <RiAlertLine className="size-5" />
          </div>

          <div className="flex flex-col min-w-0 flex-1">
            <div className="flex items-center gap-2 flex-wrap">
              <h4 className="font-aeonik-medium text-[15px] leading-[20px] text-[#171717]">
                {isHigh ? "High-Risk Case Detected" : "Moderate Risk Detected"}
              </h4>
              <span
                className={`px-2 py-0.5 rounded-full text-[10px] font-medium uppercase tracking-wider bg-white shadow-2xs ${
                  isHigh ? "text-[#FB3748]" : "text-[#B45309]"
                }`}
              >
                {assessment.overallRisk} RISK
              </span>
            </div>

            <p className="text-[12px] text-[#5C5C5C] leading-[16px] mt-0.5 truncate">
              <span className="font-medium text-[#171717]">{assessment.primaryReason}</span>
              <span className="mx-1.5 opacity-60">&bull;</span>
              <span>Immediate compliance action recommended prior to production commencement</span>
            </p>
          </div>
        </div>

        <Button
          type="button"
          variant="ghost"
          onClick={() => setModalOpen(true)}
          className="h-8.5 px-4 bg-white hover:bg-neutral-50 text-[#171717] rounded-full border border-neutral-200/70 shadow-2xs text-[13px] font-medium flex items-center gap-1.5 shrink-0 transition-colors cursor-pointer"
        >
          <span>View Risk Breakdown</span>
          <RiArrowRightSLine className="size-4 text-[#7B7B7B]" />
        </Button>
      </div>

      <CaseRiskModal
        open={modalOpen}
        onOpenChange={setModalOpen}
        caseData={caseData}
        migrantName={migrantName}
        onNavigateToSchedule={onNavigateToSchedule}
      />
    </>
  );
}
