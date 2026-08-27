"use client";

import * as React from "react";
import { X, Check } from "lucide-react";
import {
  Dialog,
  DialogContent,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { CASE_STATUSES, isMatchingStatus } from "../case-status-data";
import { DocumentCompletenessWarningModal } from "./DocumentCompletenessWarningModal";
import { CaseStatusReasonModal } from "./CaseStatusReasonModal";
import {
  checkAppendixDCompleteness,
  isCosAssignedStatus,
} from "@/lib/appendix-d-checker";
import {
  requiresReasonModal,
  getGroupedStatuses,
  getRecommendedNextStatuses,
} from "@/lib/case-status-rules";
import { apiClient } from "@/lib/api-client";
import { ENDPOINTS } from "@/lib/api-endpoints";
import { toast } from "sonner";

interface ChangeCaseStatusModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  currentStatus: string;
  onApply: (newStatus: string) => void;
  caseId?: string | number;
  migrantId?: string | number;
  migrantName?: string;
  caseFiles?: any[];
  migrant?: any;
  caseData?: any;
  onFilesChanged?: () => void | Promise<void>;
  onNavigateToDocuments?: () => void;
}

export function ChangeCaseStatusModal({
  open,
  onOpenChange,
  currentStatus,
  onApply,
  caseId,
  migrantId,
  migrantName,
  caseFiles,
  migrant,
  caseData,
  onFilesChanged,
  onNavigateToDocuments,
}: ChangeCaseStatusModalProps) {
  const [selected, setSelected] = React.useState(currentStatus);
  const [warningModalOpen, setWarningModalOpen] = React.useState(false);
  const [pendingStatusToApply, setPendingStatusToApply] = React.useState<string>("");

  // Reason Modal state for withdrawals / closures
  const [reasonModalOpen, setReasonModalOpen] = React.useState(false);
  const [pendingReasonStatus, setPendingReasonStatus] = React.useState<string>("");
  const [pendingReasonStatusLabel, setPendingReasonStatusLabel] = React.useState<string>("");

  const [isCheckingCompleteness, setIsCheckingCompleteness] = React.useState(false);

  const stageGroups = React.useMemo(() => getGroupedStatuses(), []);
  const recommendedStatuses = React.useMemo(
    () => getRecommendedNextStatuses(currentStatus),
    [currentStatus]
  );

  React.useEffect(() => {
    if (open) {
      const match = CASE_STATUSES.find((s) => isMatchingStatus(currentStatus, s));
      setSelected(match ? match.value : currentStatus);
    }
  }, [open, currentStatus]);

  const handleApply = async () => {
    const matching = CASE_STATUSES.find((s) => isMatchingStatus(selected, s));
    const statusLabel = matching ? matching.label : selected;

    // Check if target status requires mandatory reason (withdrawal / closure / ineligible)
    if (requiresReasonModal(selected) || requiresReasonModal(statusLabel)) {
      setPendingReasonStatus(selected);
      setPendingReasonStatusLabel(statusLabel);
      setReasonModalOpen(true);
      onOpenChange(false);
      return;
    }

    // Check Appendix D Completeness if assigning CoS
    if (isCosAssignedStatus(selected) || isCosAssignedStatus(statusLabel)) {
      setIsCheckingCompleteness(true);
      let filesToCheck: any[] = Array.isArray(caseFiles) ? [...caseFiles] : [];
      const effectiveCaseId = caseId || caseData?.id || caseData?.caseId || migrant?.caseId || migrant?.id;

      if (filesToCheck.length === 0 && effectiveCaseId) {
        try {
          const res = await apiClient.get<any[]>(ENDPOINTS.files.listByCase(effectiveCaseId));
          if (Array.isArray(res)) filesToCheck = res;
        } catch (e) {
          console.error("Failed to check case documents:", e);
        }
      }

      const completeness = checkAppendixDCompleteness(filesToCheck, migrant, caseData);
      setIsCheckingCompleteness(false);

      if (!completeness.isComplete) {
        setPendingStatusToApply(statusLabel);
        setWarningModalOpen(true);
        onOpenChange(false);
        return;
      }
    }

    onApply(selected);
    onOpenChange(false);
  };

  const handleReasonConfirm = async (payload: {
    newStatus: string;
    reasonCode: string;
    reasonLabel: string;
    notes?: string;
  }) => {
    try {
      await onApply(payload.newStatus);
      toast.success(
        `Status updated to "${payload.reasonLabel ? pendingReasonStatusLabel : payload.newStatus}" (Reason: ${payload.reasonLabel})`
      );
    } catch (e) {
      console.error("Failed to apply status with reason:", e);
    }
  };

  const effectiveCaseInfo = {
    id: caseId || caseData?.id || migrant?.caseId || migrant?.id,
    caseId: String(caseData?.caseId || caseId || migrant?.caseId || ""),
    name: migrantName || migrant?.name || caseData?.name || "Migrant",
    avatarText: migrant?.avatarText || caseData?.avatarText,
    avatarUrl: migrant?.avatarUrl || caseData?.avatarUrl,
  };

  return (
    <>
      <Dialog open={open} onOpenChange={onOpenChange}>
        <DialogContent
          showCloseButton={false}
          className="w-[360px] max-w-[360px] h-[620px] max-h-[90vh] p-0 gap-0 flex flex-col justify-between overflow-hidden rounded-separator bg-card border-border shadow-card-large font-sans grid-cols-none"
        >
          {/* Header — Fixed 52px Height */}
          <div className="w-full h-[52px] min-h-[52px] px-2xl py-xl flex items-center justify-between border-b border-border bg-card shrink-0">
            <div className="flex flex-col">
              <h3 className="text-paragraph-sm font-medium text-foreground tracking-[-0.006em]">
                Change case status
              </h3>
            </div>
            <Button
              type="button"
              variant="ghost"
              size="icon-xs"
              aria-label="Close"
              onClick={() => onOpenChange(false)}
              className="size-6 rounded-compact bg-neutral-100 hover:bg-neutral-200 text-neutral-600 hover:text-foreground transition-colors cursor-pointer border-0 flex items-center justify-center p-0"
            >
              <X size={16} strokeWidth={2} />
            </Button>
          </div>

          {/* Scrollable Middle Content grouped by Lifecycle Stage */}
          <div className="w-full flex-1 min-h-0 overflow-y-auto px-lg py-md flex flex-col gap-3 bg-card">
            {stageGroups.map((group) => {
              return (
                <div key={group.id} className="flex flex-col">
                  {/* Stage Header */}
                  <div className="px-sm py-1 text-[11px] font-semibold text-neutral-400 uppercase tracking-wider">
                    {group.title}
                  </div>

                  <div className="flex flex-col">
                    {group.statuses.map((status) => {
                      const isSelected = isMatchingStatus(selected, status);
                      const isRecommended = recommendedStatuses.includes(status.value);

                      return (
                        <div
                          key={status.value}
                          role="button"
                          tabIndex={0}
                          onClick={() => setSelected(status.value)}
                          onKeyDown={(e) => {
                            if (e.key === "Enter" || e.key === " ") {
                              if (e.key === " ") {
                                e.preventDefault();
                              }
                              setSelected(status.value);
                            }
                          }}
                          className={`group w-full h-[36px] min-h-[36px] flex items-center justify-between px-sm transition-colors rounded-compact cursor-pointer text-left border-0 bg-transparent shrink-0 focus-visible:outline-none focus-visible:bg-neutral-50 ${
                            isSelected ? "bg-brand-light/30" : "hover:bg-neutral-50"
                          }`}
                        >
                          {/* Left: Dot + Label + Recommended Chip */}
                          <div className="flex items-center gap-sm min-w-0 flex-1">
                            <span
                              className="size-2 rounded-full shrink-0"
                              style={{ backgroundColor: status.dotColor || "var(--color-neutral-400)" }}
                            />
                            <span
                              className={`text-paragraph-sm tracking-[-0.006em] text-foreground truncate group-hover:font-medium group-focus-visible:font-medium ${
                                isSelected ? "font-medium" : "font-normal"
                              }`}
                            >
                              {status.label}
                            </span>
                            {isRecommended && !isSelected && (
                              <span className="px-1.5 py-0.2 text-[9px] font-medium bg-brand-light text-brand-dark rounded-full shrink-0 uppercase tracking-wide">
                                Next
                              </span>
                            )}
                          </div>

                          {/* Right: Radio Circle */}
                          <div className="size-5 shrink-0 relative flex items-center justify-center ml-2">
                            <div
                              className={`size-5 rounded-full flex items-center justify-center transition-all ${
                                isSelected
                                  ? "bg-brand-medium border-2 border-brand-medium"
                                  : "bg-card border-2 border-neutral-200 hover:border-neutral-300"
                              }`}
                            >
                              {isSelected && <div className="size-2 rounded-full bg-white" />}
                            </div>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </div>
              );
            })}
          </div>

          {/* Footer — Fixed 68px Height */}
          <div className="w-full h-[68px] min-h-[68px] px-2xl py-xl flex items-center justify-end gap-lg border-t border-border bg-card shrink-0">
            <Button
              type="button"
              variant="outline"
              onClick={() => onOpenChange(false)}
              className="w-[86px] h-[36px] bg-neutral-100 hover:bg-neutral-200 border-0 text-paragraph-sm font-medium text-neutral-600 rounded-compact cursor-pointer"
            >
              Cancel
            </Button>
            <Button
              type="button"
              onClick={handleApply}
              disabled={isCheckingCompleteness}
              className="w-[86px] h-[36px] bg-brand-medium hover:bg-brand-dark text-white text-paragraph-sm font-medium rounded-compact cursor-pointer"
            >
              {isCheckingCompleteness ? "Checking…" : "Apply"}
            </Button>
          </div>
        </DialogContent>
      </Dialog>

      {/* Appendix D Warning Modal */}
      <DocumentCompletenessWarningModal
        open={warningModalOpen}
        onOpenChange={setWarningModalOpen}
        caseId={caseId || caseData?.id || caseData?.caseId || migrant?.caseId || migrant?.id}
        migrantId={migrantId || migrant?.migrantId || migrant?.id}
        migrantName={migrantName || migrant?.name || caseData?.name}
        caseFiles={caseFiles}
        migrant={migrant}
        caseData={caseData}
        pendingStatusLabel={pendingStatusToApply}
        onFilesChanged={onFilesChanged}
        onNavigateToDocuments={onNavigateToDocuments}
        onProceed={async () => {
          if (pendingStatusToApply) {
            await onApply(pendingStatusToApply);
            setWarningModalOpen(false);
          }
        }}
      />

      {/* Withdrawal / Closure / Ineligibility Reason Modal */}
      <CaseStatusReasonModal
        open={reasonModalOpen}
        onOpenChange={setReasonModalOpen}
        targetStatus={pendingReasonStatus}
        targetStatusLabel={pendingReasonStatusLabel}
        caseInfo={effectiveCaseInfo}
        onConfirm={handleReasonConfirm}
      />
    </>
  );
}
