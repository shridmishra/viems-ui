"use client";

import * as React from "react";
import { X } from "lucide-react";
import {
  Dialog,
  DialogContent,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { CASE_STATUSES, isMatchingStatus } from "../case-status-data";
import { DocumentCompletenessWarningModal } from "./DocumentCompletenessWarningModal";
import {
  checkAppendixDCompleteness,
  isCosAssignedStatus,
} from "@/lib/appendix-d-checker";
import { apiClient } from "@/lib/api-client";
import { ENDPOINTS } from "@/lib/api-endpoints";

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

  const [isCheckingCompleteness, setIsCheckingCompleteness] = React.useState(false);

  React.useEffect(() => {
    if (open) {
      const match = CASE_STATUSES.find((s) => isMatchingStatus(currentStatus, s));
      setSelected(match ? match.value : currentStatus);
    }
  }, [open, currentStatus]);

  const handleApply = async () => {
    const matching = CASE_STATUSES.find((s) => isMatchingStatus(selected, s));
    const statusLabel = matching ? matching.label : selected;

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

  return (
    <>
      <Dialog open={open} onOpenChange={onOpenChange}>
        <DialogContent
          showCloseButton={false}
          className="w-[340px] max-w-[340px] h-[588px] max-h-[90vh] p-0 gap-0 flex flex-col justify-between overflow-hidden rounded-separator bg-card border-border shadow-card-large font-sans grid-cols-none"
        >
          {/* Header — Fixed 52px Height */}
          <div className="w-full h-[52px] min-h-[52px] px-2xl py-xl flex items-center justify-between border-b border-border bg-card shrink-0">
            <h3 className="text-paragraph-sm font-medium text-foreground tracking-[-0.006em]">
              Change case status
            </h3>
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

          {/* Scrollable Middle Content — flex-1 min-h-0 */}
          <div className="w-full flex-1 min-h-0 overflow-y-auto px-lg py-lg flex flex-col bg-card">
            {CASE_STATUSES.map((status, index) => {
              const isSelected = isMatchingStatus(selected, status);
              return (
                <React.Fragment key={status.value}>
                  <div
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
                    {/* Left: Dot + Label */}
                    <div className="flex items-center gap-sm min-w-0">
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
                    </div>

                    {/* Right: Radio Circle */}
                    <div className="size-5 shrink-0 relative flex items-center justify-center">
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

                  {index < CASE_STATUSES.length - 1 && (
                    <div className="mx-sm h-px bg-border shrink-0 my-xxs" />
                  )}
                </React.Fragment>
              );
            })}
          </div>

          {/* Footer — Fixed 68px Height */}
          <div className="w-full h-[68px] min-h-[68px] px-2xl py-xl flex items-center justify-end gap-lg border-t border-border bg-card shrink-0">
            <Button
              type="button"
              variant="outline"
              onClick={() => onOpenChange(false)}
              className="w-[86px] h-[36px] bg-neutral-100 hover:bg-neutral-200 border-0 text-paragraph-sm font-medium text-neutral-600 rounded-compact"
            >
              Cancel
            </Button>
            <Button
              type="button"
              onClick={handleApply}
              disabled={isCheckingCompleteness}
              className="w-[86px] h-[36px] bg-brand-medium hover:bg-brand-dark text-white text-paragraph-sm font-medium rounded-compact"
            >
              {isCheckingCompleteness ? "Checking…" : "Apply"}
            </Button>
          </div>
        </DialogContent>
      </Dialog>

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
    </>
  );
}
