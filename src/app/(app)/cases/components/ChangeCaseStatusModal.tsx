"use client";

import * as React from "react";
import { X } from "lucide-react";
import {
  Dialog,
  DialogContent,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { CASE_STATUSES, isMatchingStatus } from "../case-status-data";
import { isCosAssignedStatus, checkAppendixDCompleteness } from "@/lib/appendix-d-checker";
import { DocumentCompletenessWarningModal } from "./DocumentCompletenessWarningModal";
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
  const [currentFiles, setCurrentFiles] = React.useState<any[]>(caseFiles || []);

  React.useEffect(() => {
    if (open) {
      const match = CASE_STATUSES.find((s) => isMatchingStatus(currentStatus, s));
      setSelected(match ? match.value : currentStatus);
      if (caseFiles) {
        setCurrentFiles(caseFiles);
      } else if (caseId) {
        apiClient
          .get<any[]>(ENDPOINTS.files.listByCase(caseId))
          .then((res) => {
            if (Array.isArray(res)) setCurrentFiles(res);
          })
          .catch((err) => {
            console.error("Failed to fetch files for case status modal:", err);
          });
      }
    }
  }, [open, currentStatus, caseFiles, caseId]);

  const handleApply = async () => {
    // Check if target status is CoS Assigned / Issued
    if (isCosAssignedStatus(selected)) {
      let filesToCheck = currentFiles;
      if ((!filesToCheck || filesToCheck.length === 0) && caseId) {
        try {
          const fetched = await apiClient.get<any[]>(ENDPOINTS.files.listByCase(caseId));
          if (Array.isArray(fetched)) {
            filesToCheck = fetched;
            setCurrentFiles(fetched);
          }
        } catch (e) {
          console.error("Error checking case files:", e);
        }
      }

      const completeness = checkAppendixDCompleteness(filesToCheck, migrant, caseData);

      if (!completeness.isComplete) {
        // Intercept and show Document Completeness Warning modal
        onOpenChange(false);
        setWarningModalOpen(true);
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
              className="w-[86px] h-[36px] bg-brand-medium hover:bg-brand-dark text-white text-paragraph-sm font-medium rounded-compact"
            >
              Apply
            </Button>
          </div>
        </DialogContent>
      </Dialog>

      {/* Pre-CoS Issuance Document Completeness Warning Modal */}
      <DocumentCompletenessWarningModal
        open={warningModalOpen}
        onOpenChange={setWarningModalOpen}
        caseId={caseId}
        migrantId={migrantId}
        migrantName={migrantName}
        caseFiles={currentFiles}
        migrant={migrant}
        caseData={caseData}
        onProceed={() => {
          onApply(selected);
        }}
        onFilesChanged={async () => {
          if (caseId) {
            try {
              const res = await apiClient.get<any[]>(ENDPOINTS.files.listByCase(caseId));
              if (Array.isArray(res)) setCurrentFiles(res);
            } catch (e) {}
          }
          if (onFilesChanged) {
            await onFilesChanged();
          }
        }}
        onNavigateToDocuments={onNavigateToDocuments}
      />
    </>
  );
}
