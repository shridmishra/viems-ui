"use client";

import * as React from "react";
import {
  RiShieldLine,
  RiCheckLine,
  RiUpload2Line,
  RiLoader4Line,
  RiArticleLine,
  RiCalendarEventLine,
  RiFileTextLine,
  RiPassportLine,
  RiArrowRightLine,
  RiFolderLine,
} from "@remixicon/react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { toast } from "sonner";
import { apiClient } from "@/lib/api-client";
import { ENDPOINTS } from "@/lib/api-endpoints";
import {
  checkAppendixDCompleteness,
  AppendixDEssentialKey,
  AppendixDCheckResult,
} from "@/lib/appendix-d-checker";

interface DocumentCompletenessWarningModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  caseId?: string | number;
  migrantId?: string | number;
  migrantName?: string;
  caseFiles?: any[];
  pendingStatusLabel?: string;
  migrant?: any;
  caseData?: any;
  /** Called when all 4 essentials are attached and user confirms status change */
  onProceed?: () => void | Promise<any>;
  /** Called when documents are uploaded so parent components can refresh */
  onFilesChanged?: () => void | Promise<void>;
  /** Optional navigation callback to jump to documents tab */
  onNavigateToDocuments?: () => void;
}

const ESSENTIAL_ICONS: Record<AppendixDEssentialKey, React.ElementType> = {
  passport: RiPassportLine,
  union_letter: RiArticleLine,
  itinerary: RiCalendarEventLine,
  signed_contract: RiFileTextLine,
};

const EMPTY_CASE_FILES: any[] = [];

export function DocumentCompletenessWarningModal({
  open,
  onOpenChange,
  caseId,
  migrantName,
  caseFiles = EMPTY_CASE_FILES,
  pendingStatusLabel,
  migrant,
  caseData,
  onProceed,
  onFilesChanged,
  onNavigateToDocuments,
}: DocumentCompletenessWarningModalProps) {
  const [internalFiles, setInternalFiles] = React.useState<any[]>(caseFiles);
  const [uploadingKey, setUploadingKey] = React.useState<AppendixDEssentialKey | null>(null);
  const [isProceeding, setIsProceeding] = React.useState(false);
  const fileInputRef = React.useRef<HTMLInputElement>(null);
  const pendingUploadKeyRef = React.useRef<AppendixDEssentialKey | null>(null);

  // Sync internal files when modal opens
  React.useEffect(() => {
    if (open) {
      const localAttached: any[] = [];
      if (caseId && typeof window !== "undefined") {
        try {
          const stored = localStorage.getItem(`appendix_d_attached_${caseId}`);
          if (stored) {
            const parsed = JSON.parse(stored);
            if (Array.isArray(parsed)) localAttached.push(...parsed);
          }
        } catch (e) {}
      }

      if (caseFiles && caseFiles.length > 0) {
        setInternalFiles([...localAttached, ...caseFiles]);
      } else if (localAttached.length > 0) {
        setInternalFiles((prev) => {
          const combined = [...localAttached];
          prev.forEach((p) => {
            if (!combined.some((c) => c.id === p.id)) combined.push(p);
          });
          return combined;
        });
      }

      // If caseId is available, refresh files from server
      if (caseId) {
        apiClient
          .get<any[]>(ENDPOINTS.files.listByCase(caseId))
          .then((res) => {
            if (Array.isArray(res)) {
              setInternalFiles((prev) => {
                const updated = [...localAttached, ...res];
                prev.forEach((pf) => {
                  if (pf.appendixDKey && !updated.some((u) => u.id === pf.id)) {
                    updated.unshift(pf);
                  }
                });
                return updated;
              });
            }
          })
          .catch((err) => {
            console.error("Failed to load files in warning modal:", err);
          });
      }
    }
  }, [open]);

  // Compute live completeness
  const checkResult: AppendixDCheckResult = React.useMemo(() => {
    return checkAppendixDCompleteness(internalFiles, migrant, caseData);
  }, [internalFiles, migrant, caseData]);

  const handleUploadClick = (key: AppendixDEssentialKey) => {
    pendingUploadKeyRef.current = key;
    if (fileInputRef.current) {
      fileInputRef.current.value = "";
      fileInputRef.current.click();
    }
  };

  const handleFileSelected = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    const targetKey = pendingUploadKeyRef.current;
    if (!files || files.length === 0 || !targetKey) return;

    const file = files[0];

    if (!caseId) {
      toast.error("Invalid case ID for upload");
      return;
    }

    setUploadingKey(targetKey);
    const toastId = toast.loading(`Uploading ${file.name}…`);

    try {
      const formData = new FormData();
      formData.append("files", file);
      formData.append("caseId", String(caseId));
      formData.append("module", "cases");
      formData.append("category", targetKey);

      const uploadUrl = ENDPOINTS.files.uploadByEntity("cases", caseId);
      await apiClient.post(uploadUrl, { body: formData });

      // Create new attached file descriptor
      const newFileObj = {
        id: `upload_${Date.now()}`,
        originalName: file.name,
        filename: file.name,
        name: file.name,
        category: targetKey,
        appendixDKey: targetKey,
        targetKey: targetKey,
        file_type: targetKey,
        filetype: { value: targetKey, title: file.name },
        folderName: "Appendix D",
        size: file.size,
        createdAt: new Date().toISOString(),
        uploadDate: new Date().toISOString(),
      };

      setInternalFiles((prev) => [newFileObj, ...prev.filter((p) => p.appendixDKey !== targetKey)]);

      if (typeof window !== "undefined") {
        try {
          const stored = localStorage.getItem(`appendix_d_attached_${caseId}`);
          const prevStored = stored ? JSON.parse(stored) : [];
          const filtered = Array.isArray(prevStored) ? prevStored.filter((p: any) => p.appendixDKey !== targetKey) : [];
          localStorage.setItem(
            `appendix_d_attached_${caseId}`,
            JSON.stringify([newFileObj, ...filtered])
          );
        } catch (e) {}
      }

      toast.success(`Attached ${file.name} successfully`, { id: toastId });

      if (onFilesChanged) {
        try {
          await onFilesChanged();
        } catch (err) {
          console.error("onFilesChanged error:", err);
        }
      }
    } catch (err) {
      console.error("Failed to upload document:", err);
      toast.error(`Failed to upload ${file.name}. Please try again.`, { id: toastId });
    } finally {
      setUploadingKey(null);
      pendingUploadKeyRef.current = null;
    }
  };

  const handleProceed = async () => {
    if (!checkResult.isComplete) return;
    setIsProceeding(true);
    try {
      if (onProceed) {
        await onProceed();
      }
      onOpenChange(false);
    } catch (err) {
      console.error("Failed to proceed with status update:", err);
      toast.error("Failed to apply status update");
    } finally {
      setIsProceeding(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-[580px] w-[92vw] !p-0 !gap-0 !overflow-hidden rounded-card bg-card border-border shadow-card-large font-sans flex flex-col h-[600px] max-h-[85vh]">
        {/* Hidden file input for inline uploads */}
        <Input
          type="file"
          ref={fileInputRef}
          onChange={handleFileSelected}
          className="hidden"
          accept=".pdf,.jpg,.jpeg,.png,.doc,.docx"
        />

        {/* Modal Header */}
        <DialogHeader className="px-xl py-lg border-b border-border bg-card flex flex-row items-center justify-between space-y-0 text-left shrink-0">
          <div className="flex items-center gap-md">
            <div className="size-9 rounded-compact bg-warning-light text-warning-dark flex items-center justify-center shrink-0">
              <RiShieldLine className="size-5" />
            </div>
            <div>
              <div className="flex items-center gap-sm">
                <DialogTitle className="font-aeonik-medium text-label-lg text-foreground tracking-[-0.006em]">
                  Appendix D Compliance Checklist
                </DialogTitle>
              </div>
              <p className="text-paragraph-xs text-muted-foreground mt-xxs">
                {migrantName ? `For ${migrantName}` : "Statutory sponsorship documentation"}
              </p>
            </div>
          </div>
          <div className="flex items-center gap-xs">
            <span
              className={`text-label-compact px-sm py-xxs rounded-compact font-medium ${
                checkResult.isComplete
                  ? "bg-success-light text-success-dark"
                  : "bg-warning-light text-warning-dark"
              }`}
            >
              {checkResult.attachedCount} of {checkResult.totalCount} Attached
            </span>
          </div>
        </DialogHeader>

        {/* Modal Body / Checklist */}
        <div className="p-xl flex-1 overflow-y-auto flex flex-col gap-lg bg-card">
          {/* Information banner if incomplete */}
          {!checkResult.isComplete && (
            <div className="bg-warning-light/50 border border-warning-dark/20 rounded-input p-md flex items-start gap-md text-paragraph-xs text-foreground">
              <RiShieldLine className="size-4 text-warning-dark shrink-0 mt-0.5" />
              <div>
                <p className="font-medium text-warning-dark">Mandatory Home Office Requirement</p>
                <p className="text-muted-foreground mt-xxs">
                  Under UKVI Appendix D rules, all 4 essential documents must be on file before issuing or assigning a Certificate of Sponsorship (CoS). Please attach the missing records below.
                </p>
              </div>
            </div>
          )}

          {/* Checklist Items */}
          <div className="flex flex-col gap-sm">
            {checkResult.essentials.map((item) => {
              const IconComp = ESSENTIAL_ICONS[item.key] || RiFileTextLine;
              const isItemUploading = uploadingKey === item.key;

              return (
                <div
                  key={item.key}
                  className={`p-lg rounded-card border transition-all flex items-center justify-between gap-md ${
                    item.isAttached
                      ? "bg-neutral-50/50 border-border"
                      : "bg-card border-dashed border-neutral-300 hover:border-brand-medium/50"
                  }`}
                >
                  {/* Left info */}
                  <div className="flex items-start gap-md min-w-0 flex-1">
                    <div
                      className={`size-8 rounded-compact flex items-center justify-center shrink-0 mt-0.5 ${
                        item.isAttached
                          ? "bg-success-light text-success-dark"
                          : "bg-neutral-100 text-neutral-500"
                      }`}
                    >
                      {item.isAttached ? (
                        <RiCheckLine className="size-4 stroke-[3]" />
                      ) : (
                        <IconComp className="size-4" />
                      )}
                    </div>
                    <div className="flex flex-col min-w-0 flex-1">
                      <div className="flex items-center gap-xs flex-wrap">
                        <span className="text-label-sm text-foreground font-medium truncate">
                          {item.name}
                        </span>
                        {item.isAttached && (
                          <span className="text-[11px] font-medium text-success-dark bg-success-light px-xs py-0.5 rounded-compact">
                            Attached
                          </span>
                        )}
                      </div>
                      <p className="text-paragraph-xs text-muted-foreground truncate mt-xxs">
                        {item.isAttached && item.attachedFile
                          ? item.attachedFile.name || item.attachedFile.filename
                          : item.description}
                      </p>
                    </div>
                  </div>

                  {/* Right: Upload / Replace Action */}
                  {item.isAttached ? (
                    <div className="shrink-0">
                      <Button
                        type="button"
                        variant="ghost"
                        size="sm"
                        disabled={isItemUploading}
                        onClick={() => handleUploadClick(item.key)}
                        className="text-xs text-muted-foreground hover:text-foreground h-7 px-xs"
                      >
                        {isItemUploading ? (
                          <RiLoader4Line className="size-3.5 animate-spin" />
                        ) : (
                          "Replace"
                        )}
                      </Button>
                    </div>
                  ) : (
                    <div className="shrink-0">
                      <Button
                        type="button"
                        variant="outline"
                        size="sm"
                        disabled={isItemUploading}
                        onClick={() => handleUploadClick(item.key)}
                        className="h-8 px-md text-xs font-medium border-brand-medium text-brand-dark bg-brand-light/30 hover:bg-brand-light gap-xs rounded-button"
                      >
                        {isItemUploading ? (
                          <>
                            <RiLoader4Line className="size-3.5 animate-spin" />
                            <span>Uploading…</span>
                          </>
                        ) : (
                          <>
                            <RiUpload2Line className="size-3.5" />
                            <span>Upload</span>
                          </>
                        )}
                      </Button>
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        </div>

        {/* Modal Footer */}
        <div className="px-xl py-lg border-t border-border bg-neutral-50 flex flex-row items-center justify-between w-full shrink-0 gap-sm m-0">
          <div>
            {onNavigateToDocuments && (
              <Button
                type="button"
                variant="ghost"
                size="sm"
                onClick={() => {
                  onOpenChange(false);
                  onNavigateToDocuments();
                }}
                className="text-[13px] text-muted-foreground hover:text-foreground gap-xs h-8 px-sm"
              >
                <RiFolderLine className="size-3.5" />
                <span>Go to Documents</span>
              </Button>
            )}
          </div>

          <div className="flex items-center gap-md">
            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={() => onOpenChange(false)}
              className="h-9 px-lg rounded-button text-[13px] font-medium border-neutral-300"
            >
              Cancel
            </Button>

            <Button
              type="button"
              disabled={!checkResult.isComplete || isProceeding}
              onClick={handleProceed}
              className={`h-9 px-lg rounded-button text-[13px] font-medium gap-xs border transition-colors ${
                checkResult.isComplete
                  ? "bg-brand-medium hover:bg-brand-dark text-white border-transparent cursor-pointer shadow-sm"
                  : "disabled:!bg-neutral-200 disabled:!text-neutral-600 disabled:!border-neutral-300 disabled:!opacity-100 disabled:!cursor-not-allowed"
              }`}
            >
              {isProceeding ? (
                <>
                  <RiLoader4Line className="size-4 animate-spin text-neutral-600" />
                  <span>Updating status…</span>
                </>
              ) : (
                <>
                  <span>Proceed to {pendingStatusLabel || "CoS Assigned"}</span>
                  <RiArrowRightLine className="size-3.5 text-neutral-500" />
                </>
              )}
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
