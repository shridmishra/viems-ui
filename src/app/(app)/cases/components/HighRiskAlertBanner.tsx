"use client";

import * as React from "react";
import { RiAlertLine, RiArrowRightSLine, RiShieldCheckLine } from "@remixicon/react";
import { Button } from "@/components/ui/button";
import { evaluateCaseRisk, CaseRiskAssessment } from "@/lib/case-risk-evaluator";
import { CaseRiskModal } from "./CaseRiskModal";

interface HighRiskAlertBannerProps {
  caseData: any;
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
        className={`w-full rounded-[14px] px-4 py-3 flex items-center justify-between shadow-2xs font-sans transition-all ${
          isHigh
            ? "bg-[#FFEBEC] border border-[#FECDCA] text-[#681219]"
            : "bg-[#FFFAEB] border border-[#FDE8D3] text-[#624C18]"
        } ${className}`}
      >
        <div className="flex items-center gap-2.5 min-w-0 flex-1">
          <RiAlertLine
            className={`size-4.5 shrink-0 ${isHigh ? "text-[#FB3748]" : "text-[#B45309]"}`}
          />
          <div className="flex items-center gap-2 flex-wrap text-[13px] leading-[18px]">
            <span
              className={`px-2 py-0.5 rounded-full text-[10px] font-medium uppercase tracking-wider ${
                isHigh ? "bg-white text-[#FB3748] shadow-2xs" : "bg-white text-[#B45309] shadow-2xs"
              }`}
            >
              {assessment.overallRisk} RISK
            </span>
            <span className="font-semibold text-[#171717]">
              {assessment.primaryReason}
            </span>
            {assessment.factors.length > 1 && (
              <span className="text-[12px] opacity-75">
                (+{assessment.factors.length - 1} other risk factor{assessment.factors.length > 2 ? "s" : ""})
              </span>
            )}
          </div>
        </div>

        <Button
          type="button"
          variant="ghost"
          size="sm"
          onClick={() => setModalOpen(true)}
          className={`h-7 px-3 text-[12px] font-medium rounded-full flex items-center gap-1 shrink-0 ${
            isHigh
              ? "bg-white hover:bg-neutral-100 text-[#FB3748] shadow-2xs"
              : "bg-white hover:bg-neutral-100 text-[#B45309] shadow-2xs"
          }`}
        >
          <span>View Risk Breakdown</span>
          <RiArrowRightSLine className="size-3.5" />
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
