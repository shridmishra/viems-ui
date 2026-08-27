"use client";

import * as React from "react";
import {
  RiAlertLine,
  RiCheckLine,
  RiTimeLine,
  RiCalendarEventLine,
  RiPassportLine,
  RiArrowRightLine,
  RiCloseLine,
  RiShieldCheckLine,
  RiInformationLine,
  RiMailSendLine,
} from "@remixicon/react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { toast } from "sonner";
import {
  RiskFactor,
  CaseRiskAssessment,
  evaluateCaseRisk,
} from "@/lib/case-risk-evaluator";

interface CaseRiskModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  caseData?: any;
  migrantName?: string;
  onNavigateToSchedule?: () => void;
}

export function CaseRiskModal({
  open,
  onOpenChange,
  caseData,
  migrantName,
  onNavigateToSchedule,
}: CaseRiskModalProps) {
  const assessment: CaseRiskAssessment = React.useMemo(() => {
    return evaluateCaseRisk(caseData);
  }, [caseData]);

  const name = migrantName || caseData?.name || "Migrant";

  const handleSendReminder = (factor: RiskFactor) => {
    toast.success(`Sent passport renewal & compliance alert for ${name}`);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-[640px] w-[95vw] !p-0 !gap-0 !overflow-hidden rounded-[20px] bg-white border border-[#F5F5F5] shadow-2xl font-sans flex flex-col max-h-[85vh]">
        {/* Header */}
        <DialogHeader className="px-6 py-4.5 pr-14 border-b border-[#F5F5F5] bg-white flex flex-row items-center justify-between space-y-0 text-left shrink-0">
          <div className="flex items-center gap-3 min-w-0 flex-1">
            <div
              className={`size-9 rounded-full flex items-center justify-center shrink-0 ${
                assessment.isHighRisk
                  ? "bg-[#FFEBEC] text-[#FB3748]"
                  : assessment.isMediumRisk
                  ? "bg-[#FFFAEB] text-[#B45309]"
                  : "bg-[#E3F7EC] text-[#0B4627]"
              }`}
            >
              {assessment.isHighRisk ? (
                <RiAlertLine className="size-5" />
              ) : assessment.isMediumRisk ? (
                <RiAlertLine className="size-5" />
              ) : (
                <RiShieldCheckLine className="size-5" />
              )}
            </div>
            <div className="flex flex-col min-w-0">
              <div className="flex items-center gap-2 flex-wrap">
                <DialogTitle className="font-aeonik-medium text-[17px] text-[#171717] leading-[22px]">
                  Pre-Tour Risk Assessment
                </DialogTitle>
                <span
                  className={`px-2 py-0.5 rounded-full text-[10px] font-medium uppercase tracking-wider ${
                    assessment.isHighRisk
                      ? "bg-[#FFEBEC] text-[#FB3748]"
                      : assessment.isMediumRisk
                      ? "bg-[#FFFAEB] text-[#B45309]"
                      : "bg-[#E3F7EC] text-[#0B4627]"
                  }`}
                >
                  {assessment.overallRisk} RISK
                </span>
              </div>
              <p className="text-[12px] text-[#7B7B7B] mt-0.5">
                Evaluation for {name} · UKVI Home Office compliance rules
              </p>
            </div>
          </div>
        </DialogHeader>

        {/* Modal Body */}
        <div className="p-6 overflow-y-auto flex flex-col gap-4 bg-white flex-1">
          {/* Top Summary Banner */}
          <div
            className={`p-4 rounded-[14px] flex items-start gap-3 text-[12px] ${
              assessment.isHighRisk
                ? "bg-[#FFEBEC] text-[#681219]"
                : assessment.isMediumRisk
                ? "bg-[#FFFAEB] text-[#624C18]"
                : "bg-[#E3F7EC] text-[#0B4627]"
            }`}
          >
            <RiInformationLine className="size-5 shrink-0 mt-0.5" />
            <div className="flex-1">
              <p className="font-semibold text-[13px]">
                {assessment.isHighRisk
                  ? "High-Risk Case Detected: Immediate Action Required Prior to Production"
                  : assessment.isMediumRisk
                  ? "Moderate Compliance Risk Detected"
                  : "All Pre-Tour Compliance Checks Satisfied"}
              </p>
              <p className="mt-1 leading-[17px] opacity-90">
                {assessment.isHighRisk
                  ? "This case has factors that may jeopardize visa approval or travel entry under UKVI Creative Worker & Temporary Work rules."
                  : assessment.isMediumRisk
                  ? "Monitor upcoming submission milestones to ensure timely production commencement."
                  : "Passport validity, CoS timeframes, and schedule continuous engagement criteria are fully verified."}
              </p>
            </div>
          </div>

          {/* Risk Factors List */}
          <div className="flex flex-col gap-2.5">
            <h4 className="font-aeonik-medium text-[14px] text-[#171717]">
              Detected Risk Factors ({assessment.factors.length})
            </h4>

            {assessment.factors.length === 0 ? (
              <div className="py-8 rounded-[12px] bg-[#F9F9F9] flex flex-col items-center justify-center text-center gap-1.5 text-[13px] text-[#7B7B7B]">
                <RiCheckLine className="size-6 text-[#1FC16B]" />
                <span className="font-medium text-[#171717]">No active risk triggers</span>
                <span className="text-[11px]">Passport &gt; 6 months validity &bull; No tour gaps &gt; 14d</span>
              </div>
            ) : (
              <div className="flex flex-col gap-2.5">
                {assessment.factors.map((factor) => {
                  const isHigh = factor.severity === "HIGH";

                  return (
                    <div
                      key={factor.id}
                      className="p-4 rounded-[14px] bg-[#F9F9F9] border border-neutral-200/50 flex flex-col gap-2.5 transition-all hover:bg-[#F5F5F5]"
                    >
                      {/* Factor Header */}
                      <div className="flex items-center justify-between gap-2">
                        <div className="flex items-center gap-2 min-w-0">
                          <div className="size-7 rounded-full bg-white text-[#FB3748] shadow-2xs flex items-center justify-center shrink-0">
                            {factor.code === "PASSPORT_EXPIRY" ? (
                              <RiPassportLine className="size-4" />
                            ) : factor.code === "IMMINENT_COS_START" ? (
                              <RiCalendarEventLine className="size-4" />
                            ) : (
                              <RiAlertLine className="size-4" />
                            )}
                          </div>
                          <span className="font-aeonik-medium text-[14px] text-[#171717] truncate">
                            {factor.title}
                          </span>
                        </div>

                        <span
                          className={`px-2 py-0.5 rounded-full text-[10px] font-medium uppercase tracking-wider shrink-0 ${
                            isHigh
                              ? "bg-[#FFEBEC] text-[#FB3748]"
                              : "bg-[#FFFAEB] text-[#B45309]"
                          }`}
                        >
                          {factor.severity} RISK
                        </span>
                      </div>

                      {/* Factor Description */}
                      <p className="text-[12px] text-[#5C5C5C] leading-[17px]">
                        {factor.description}
                      </p>

                      {/* Recommended Remediation Action Box */}
                      <div className="bg-white rounded-[10px] p-3 text-[12px] text-[#171717] border border-neutral-200/50 flex items-center justify-between gap-3 shadow-2xs">
                        <div className="flex items-start gap-1.5 flex-1 min-w-0">
                          <span className="font-semibold text-brand-dark shrink-0">Action:</span>
                          <span className="text-[#171717]">{factor.recommendation}</span>
                        </div>
                        {factor.code === "PASSPORT_EXPIRY" && (
                          <Button
                            type="button"
                            size="sm"
                            onClick={() => handleSendReminder(factor)}
                            className="h-7 px-3 text-[12px] font-medium bg-brand-medium hover:bg-brand-dark text-white rounded-full shrink-0 gap-1 shadow-2xs cursor-pointer"
                          >
                            <RiMailSendLine className="size-3.5" />
                            <span>Remind Migrant</span>
                          </Button>
                        )}
                        {factor.code === "TOUR_GAP_BREACH" && onNavigateToSchedule && (
                          <Button
                            type="button"
                            size="sm"
                            onClick={() => {
                              onOpenChange(false);
                              onNavigateToSchedule();
                            }}
                            className="h-7 px-3 text-[12px] font-medium bg-brand-medium hover:bg-brand-dark text-white rounded-full shrink-0 gap-1 shadow-2xs cursor-pointer"
                          >
                            <span>Inspect Schedule</span>
                            <RiArrowRightLine className="size-3.5" />
                          </Button>
                        )}
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        </div>

        {/* Footer */}
        <div className="px-6 py-3.5 border-t border-[#F5F5F5] bg-[#FAFAFA] flex items-center justify-between shrink-0">
          <span className="text-[12px] text-[#7B7B7B]">
            Automated UKVI compliance heuristic check
          </span>
          <Button
            type="button"
            variant="ghost"
            size="sm"
            onClick={() => onOpenChange(false)}
            className="h-8.5 px-4 rounded-full text-[13px] font-medium bg-[#F5F5F5] hover:bg-[#EBEBEB] text-[#171717]"
          >
            Close
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}
