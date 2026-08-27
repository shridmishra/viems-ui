"use client";

import * as React from "react";
import { RiAlertLine, RiShieldCheckLine } from "@remixicon/react";
import { CaseRiskAssessment, evaluateCaseRisk } from "@/lib/case-risk-evaluator";
import { CaseRiskModal } from "./CaseRiskModal";

interface HighRiskBadgeProps {
  caseData: any;
  migrantName?: string;
  showLowRisk?: boolean;
  className?: string;
  onNavigateToSchedule?: () => void;
}

export function HighRiskBadge({
  caseData,
  migrantName,
  showLowRisk = false,
  className = "",
  onNavigateToSchedule,
}: HighRiskBadgeProps) {
  const [modalOpen, setModalOpen] = React.useState(false);

  const assessment: CaseRiskAssessment = React.useMemo(() => {
    return evaluateCaseRisk(caseData);
  }, [caseData]);

  if (!assessment.isHighRisk && !assessment.isMediumRisk && !showLowRisk) {
    return null;
  }

  const handleClick = (e: React.MouseEvent) => {
    e.stopPropagation();
    e.preventDefault();
    setModalOpen(true);
  };

  return (
    <>
      <button
        type="button"
        onClick={handleClick}
        title={assessment.primaryReason}
        className={`px-2 py-0.5 rounded-full text-[10px] font-medium uppercase tracking-wider inline-flex items-center gap-1 transition-all cursor-pointer border-0 ${
          assessment.isHighRisk
            ? "bg-[#FFEBEC] text-[#FB3748] hover:bg-[#FDD5D7] shadow-2xs"
            : assessment.isMediumRisk
            ? "bg-[#FFFAEB] text-[#B45309] hover:bg-[#FEEFC7] shadow-2xs"
            : "bg-[#E3F7EC] text-[#0B4627] hover:bg-[#D0F2DF]"
        } ${className}`}
      >
        {assessment.isHighRisk ? (
          <span>HIGH RISK</span>
        ) : assessment.isMediumRisk ? (
          <span>MED RISK</span>
        ) : (
          <span>LOW RISK</span>
        )}
      </button>

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
