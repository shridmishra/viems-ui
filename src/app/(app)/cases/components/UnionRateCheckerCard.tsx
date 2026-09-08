"use client";

import * as React from "react";
import {
  RiAlertLine,
  RiCheckLine,
  RiArrowRightSLine,
  RiShieldCheckLine,
  RiMoneyPoundCircleLine,
  RiBuildingLine,
} from "@remixicon/react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  RatePeriod,
  UnionRateValidationResult,
  validateRemuneration,
  formatCurrency,
  detectSalaryPeriod,
} from "@/lib/union-rates";
import { UnionRateModal } from "./UnionRateModal";

interface UnionRateCheckerCardProps {
  caseId?: string | number;
  migrantName?: string;
  agreedSalary?: string | number;
  jobTitle?: string;
  union?: string;
  className?: string;
  onClearanceUpdated?: (result: UnionRateValidationResult) => void;
}

export function UnionRateCheckerCard({
  caseId,
  migrantName,
  agreedSalary,
  jobTitle,
  union = "EQUITY",
  className = "",
  onClearanceUpdated,
}: UnionRateCheckerCardProps) {
  const [isModalOpen, setIsModalOpen] = React.useState(false);
  const [localOverrides, setLocalOverrides] = React.useState<{
    salary?: string | number;
    jobTitle?: string;
    union?: string;
    period?: RatePeriod;
    cleared?: boolean;
  } | null>(() => {
    if (caseId && typeof window !== "undefined") {
      try {
        const stored = localStorage.getItem(`union_rate_${caseId}`);
        if (stored) {
          const parsed = JSON.parse(stored);
          return {
            salary: parsed.amount,
            jobTitle: parsed.jobTitle,
            union: parsed.union,
            period: parsed.period,
            cleared: Boolean(parsed.clearedAt),
          };
        }
      } catch {
        // ignore error
      }
    }
    return null;
  });

  // Listen for storage changes across tabs
  React.useEffect(() => {
    if (!caseId || typeof window === "undefined") return;
    const handler = (e: StorageEvent) => {
      if (e.key === `union_rate_${caseId}` && e.newValue) {
        try {
          const parsed = JSON.parse(e.newValue);
          setLocalOverrides({
            salary: parsed.amount,
            jobTitle: parsed.jobTitle,
            union: parsed.union,
            period: parsed.period,
            cleared: Boolean(parsed.clearedAt),
          });
        } catch {
          // ignore error
        }
      }
    };
    window.addEventListener("storage", handler);
    return () => window.removeEventListener("storage", handler);
  }, [caseId]);

  const currentSalary = localOverrides?.salary ?? agreedSalary ?? "750";
  const currentJobTitle = localOverrides?.jobTitle ?? jobTitle ?? "Actor / Performer";
  const currentUnion = localOverrides?.union ?? union ?? "EQUITY";
  const currentPeriod = localOverrides?.period ?? detectSalaryPeriod(currentSalary);
  const isCleared = localOverrides?.cleared ?? false;

  const validation: UnionRateValidationResult = React.useMemo(() => {
    return validateRemuneration({
      union: currentUnion,
      jobTitle: currentJobTitle,
      amount: currentSalary,
      period: currentPeriod,
      currency: "GBP",
    });
  }, [currentUnion, currentJobTitle, currentSalary, currentPeriod]);

  const handleModalSuccess = (result: UnionRateValidationResult) => {
    setLocalOverrides({
      salary: result.enteredAmount,
      jobTitle: result.roleMatched,
      union: result.union,
      period: result.period as RatePeriod,
      cleared: true,
    });
    if (onClearanceUpdated) {
      onClearanceUpdated(result);
    }
  };

  return (
    <>
      <div
        className={`bg-card border border-border rounded-card p-xl shadow-x-small flex flex-col gap-4 font-sans ${className}`}
      >
        {/* Top Header */}
        <div className="flex items-center justify-between gap-4 flex-wrap sm:flex-nowrap">
          <div className="flex items-center gap-3 min-w-0">
            <div
              className={`size-9 rounded-full flex items-center justify-center shrink-0 ${
                validation.status === "EXEMPT"
                  ? "bg-neutral-100 text-neutral-600"
                  : validation.isCompliant
                  ? "bg-success-light text-success-dark"
                  : "bg-error-light text-error-dark"
              }`}
            >
              {validation.isCompliant ? (
                <RiCheckLine className="size-5" />
              ) : (
                <RiAlertLine className="size-5" />
              )}
            </div>

            <div className="flex flex-col min-w-0">
              <div className="flex items-center gap-2 flex-wrap">
                <h4 className="font-aeonik-medium text-[16px] leading-[22px] text-foreground">
                  Union Rate Integration &amp; Salary Clearance
                </h4>
                <Badge
                  variant={
                    validation.status === "EXEMPT"
                      ? "neutral-lighter"
                      : validation.isCompliant
                      ? "success"
                      : "destructive"
                  }
                  withDot
                >
                  {validation.status === "EXEMPT"
                    ? "EXEMPT / NON-UNION"
                    : validation.isCompliant
                    ? "COMPLIANT"
                    : "BELOW MINIMUM RATE"}
                </Badge>
                {isCleared && validation.isCompliant && (
                  <Badge variant="neutral-lighter" className="border border-border">
                    ✓ AUDIT CLEARED
                  </Badge>
                )}
              </div>
              <span className="text-[12px] text-neutral-500 leading-[16px] mt-0.5 truncate">
                {validation.agreementName} · Appendix Creative Worker Wage Standard
              </span>
            </div>
          </div>

          <Button
            type="button"
            variant="ghost"
            onClick={() => setIsModalOpen(true)}
            className="h-[32px] px-3.5 bg-neutral-100 hover:bg-neutral-200 text-foreground text-[13px] font-medium rounded-full flex items-center gap-1.5 transition-colors cursor-pointer border-0 shrink-0"
          >
            <span>{validation.isCompliant ? "Inspect Union Scale" : "Review Salary Breach"}</span>
            <RiArrowRightSLine className="size-4 text-neutral-500" />
          </Button>
        </div>

        {/* 4-Stat Metric Cards Grid with Top-Right Icons (matching TourGapCheckerCard) */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5">
          {/* Stat 1: Agreed Pay */}
          <div className="bg-neutral-50/70 border border-border/50 rounded-input p-3 flex flex-col justify-between h-[72px] relative">
            <span className="text-[10px] font-medium uppercase tracking-[0.02em] text-neutral-500 leading-[12px]">
              Agreed Pay
            </span>
            <RiMoneyPoundCircleLine className="size-4 text-neutral-400 absolute top-3 right-3" />
            <div className="flex items-baseline gap-1">
              <span className="font-aeonik-medium text-[18px] font-medium text-foreground leading-[24px]">
                {formatCurrency(validation.enteredAmount, "GBP")}
              </span>
              <span className="text-[11px] text-neutral-500">/{validation.period.toLowerCase()}</span>
            </div>
          </div>

          {/* Stat 2: Union Minimum Scale */}
          <div className="bg-neutral-50/70 border border-border/50 rounded-input p-3 flex flex-col justify-between h-[72px] relative">
            <span className="text-[10px] font-medium uppercase tracking-[0.02em] text-neutral-500 leading-[12px]">
              Union Minimum
            </span>
            <RiShieldCheckLine className="size-4 text-neutral-400 absolute top-3 right-3" />
            <div className="flex items-baseline gap-1">
              <span className="font-aeonik-medium text-[18px] font-medium text-foreground leading-[24px]">
                {validation.minimumRate > 0 ? formatCurrency(validation.minimumRate, "GBP") : "N/A"}
              </span>
              {validation.minimumRate > 0 && (
                <span className="text-[11px] text-neutral-500">/{validation.period.toLowerCase()}</span>
              )}
            </div>
          </div>

          {/* Stat 3: Buffer Headroom / Deficit */}
          <div className="bg-neutral-50/70 border border-border/50 rounded-input p-3 flex flex-col justify-between h-[72px] relative">
            <span className="text-[10px] font-medium uppercase tracking-[0.02em] text-neutral-500 leading-[12px]">
              {validation.isCompliant ? "Buffer Headroom" : "Salary Deficit"}
            </span>
            {validation.isCompliant ? (
              <RiCheckLine className="size-4 text-success-dark absolute top-3 right-3" />
            ) : (
              <RiAlertLine className="size-4 text-error-dark absolute top-3 right-3" />
            )}
            <div className="flex items-baseline gap-1">
              <span
                className={`font-aeonik-medium text-[18px] font-medium leading-[24px] ${
                  validation.status === "EXEMPT"
                    ? "text-neutral-500"
                    : validation.isCompliant
                    ? "text-success-dark"
                    : "text-error-dark"
                }`}
              >
                {validation.deficit > 0
                  ? `-${formatCurrency(validation.deficit, "GBP")}`
                  : validation.minimumRate > 0
                  ? `+${validation.percentageVariance}%`
                  : "N/A"}
              </span>
              <span className="text-[11px] text-neutral-500">
                {validation.deficit > 0
                  ? "deficit"
                  : validation.minimumRate > 0
                  ? "surplus"
                  : "no benchmark"}
              </span>
            </div>
          </div>

          {/* Stat 4: Governing Body */}
          <div className="bg-neutral-50/70 border border-border/50 rounded-input p-3 flex flex-col justify-between h-[72px] relative">
            <span className="text-[10px] font-medium uppercase tracking-[0.02em] text-neutral-500 leading-[12px]">
              Governing Union
            </span>
            <RiBuildingLine className="size-4 text-neutral-400 absolute top-3 right-3" />
            <div className="flex items-baseline gap-1">
              <span className="font-aeonik-medium text-[16px] font-medium text-foreground leading-[24px] truncate" title={validation.unionName}>
                {validation.union}
              </span>
              <span className="text-[11px] text-neutral-500 truncate">
                {validation.status === "EXEMPT" ? "Exempt" : "2026 Scale"}
              </span>
            </div>
          </div>
        </div>

        {/* Sub-threshold breach alert bar if non-compliant */}
        {!validation.isCompliant && (
          <div className="bg-error-light/50 border border-error-dark/20 rounded-input p-md flex items-center justify-between gap-md">
            <div className="flex items-center gap-sm text-error-dark text-paragraph-xs min-w-0">
              <RiAlertLine className="size-4 shrink-0" />
              <span className="truncate">
                Remuneration is {formatCurrency(validation.deficit, "GBP")} below the required union minimum scale. CoS assignment will be flagged.
              </span>
            </div>
            <Button
              size="sm"
              variant="outline"
              className="rounded-button text-xs shrink-0 border-error-dark/30 text-error-dark hover:bg-error-light"
              onClick={() => setIsModalOpen(true)}
            >
              Adjust Rate
            </Button>
          </div>
        )}
      </div>

      {/* Interactive Modal */}
      <UnionRateModal
        open={isModalOpen}
        onOpenChange={setIsModalOpen}
        caseId={caseId}
        migrantName={migrantName}
        initialSalary={currentSalary}
        initialJobTitle={currentJobTitle}
        initialUnion={currentUnion}
        onSuccess={handleModalSuccess}
      />
    </>
  );
}
