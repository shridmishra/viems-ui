"use client";

import * as React from "react";
import {
  RiAlertLine,
  RiCheckboxCircleFill,
  RiCloseCircleLine,
  RiUpload2Line,
  RiFileTextLine,
  RiFolderLine,
  RiArrowRightLine,
  RiShieldLine,
  RiLoader4Line,
  RiPassportLine,
  RiArticleLine,
  RiCalendarEventLine,
} from "@remixicon/react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Alert, AlertTitle, AlertDescription } from "@/components/ui/alert";
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
  migrant?: any;
  caseData?: any;
  /** Called when all 4 essentials are attached and user confirms status change */
  onProceed?: () => void | Promise<void>;
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

export function DocumentCompletenessWarningModal({
  open,
  onOpenChange,
  caseId,
  migrantName,
  caseFiles = [],
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

  // Sync internal files when modal opens or caseId changes
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
  }, [open, caseId]);

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
    setUploadingKey(targetKey);
    const toastId = toast.loading(`Uploading ${file.name}…`);

    try {
      if (caseId) {
        const formData = new FormData();
        formData.append("files", file);
        formData.append("caseId", String(caseId));
        formData.append("module", "cases");
        formData.append("category", targetKey);

        const uploadUrl = `${ENDPOINTS.files.base}/upload/cases/${caseId}`;
        await apiClient.post(uploadUrl, { body: formData });
      }

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

      if (caseId && typeof window !== "undefined") {
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
                  Document Completeness Warning
                </DialogTitle>
                <Badge variant="warning" className="text-[10px] font-semibold uppercase tracking-wider py-0 px-xs h-4">
                  PRE COS ISSUANCE
                </Badge>
              </div>
              <DialogDescription className="text-paragraph-xs text-muted-foreground mt-xxs">
                {migrantName ? `Case: ${migrantName}` : "Pre-assignment compliance validation"}
              </DialogDescription>
            </div>
          </div>
        </DialogHeader>

        {/* Modal Body */}
        <div className="px-xl py-lg flex flex-col gap-md flex-1 min-h-0 overflow-y-auto bg-card text-left">
          {/* Warning Banner */}
          <Alert variant={checkResult.isComplete ? "success" : "warning"} className="p-md rounded-input">
            <RiAlertLine className="size-4 shrink-0 mt-0.5" />
            <div className="flex flex-col gap-xxs">
              <AlertTitle className="text-label-sm font-medium">
                {checkResult.isComplete
                  ? "All Appendix D essential documents attached"
                  : "Missing doc warnings before status changes"}
              </AlertTitle>
              <AlertDescription className="text-paragraph-xs">
                {checkResult.isComplete
                  ? "All mandatory Appendix D compliance records are verified. You can now proceed to assign or issue the Certificate of Sponsorship (CoS)."
                  : "Prevent CoS assigned/issued status until Appendix D essentials are attached: Passport, Union engagement letter/consultation, full production itinerary, and signed contract showing compliant fee/pay structure."}
              </AlertDescription>
            </div>
          </Alert>

          {/* Completeness Summary Pill */}
          <div className="flex items-center justify-between px-md py-sm bg-neutral-50 rounded-compact border border-border">
            <div className="flex items-center gap-sm">
              <span className="text-label-xs text-neutral-600 font-medium">Appendix D Essentials Status</span>
            </div>
            <div className="flex items-center gap-xs">
              <span className="text-label-xs font-semibold text-foreground">
                {checkResult.attachedCount} of {checkResult.totalCount} attached
              </span>
              <Badge
                variant={checkResult.isComplete ? "success" : "destructive"}
                className="text-[11px] font-medium h-5"
              >
                {checkResult.isComplete ? "Complete" : `${checkResult.missingCount} Missing`}
              </Badge>
            </div>
          </div>

          {/* Essentials Checklist */}
          <div className="flex flex-col gap-sm">
            <h4 className="text-label-xs uppercase tracking-wider text-muted-foreground font-semibold px-xxs">
              Mandatory Appendix D Records
            </h4>

            {checkResult.essentials.map((item, index) => {
              const Icon = ESSENTIAL_ICONS[item.key] || RiFileTextLine;
              const isItemUploading = uploadingKey === item.key;

              return (
                <div
                  key={item.key}
                  className={`p-md rounded-input border transition-all flex items-start justify-between gap-md ${
                    item.isAttached
                      ? "bg-neutral-50/50 border-neutral-200"
                      : "bg-error-light/10 border-error-dark/20"
                  }`}
                >
                  {/* Left: Icon + Text */}
                  <div className="flex items-start gap-md min-w-0 flex-1">
                    <div
                      className={`size-8 rounded-compact flex items-center justify-center shrink-0 mt-0.5 ${
                        item.isAttached
                          ? "bg-success-light text-success-dark"
                          : "bg-error-light text-error-dark"
                      }`}
                    >
                      {item.isAttached ? (
                        <RiCheckboxCircleFill className="size-4" />
                      ) : (
                        <RiCloseCircleLine className="size-4" />
                      )}
                    </div>

                    <div className="flex flex-col min-w-0 flex-1">
                      <div className="flex items-center gap-sm flex-wrap">
                        <span className="text-label-sm font-medium text-foreground">
                          {index + 1}. {item.shortName}
                        </span>
                        <Badge
                          variant={item.isAttached ? "success" : "destructive"}
                          className="text-[10px] font-semibold py-0 px-xs h-4.5"
                        >
                          {item.isAttached ? "Attached" : "Missing"}
                        </Badge>
                      </div>

                      <p className="text-paragraph-xs text-muted-foreground mt-xxs line-clamp-2">
                        {item.description}
                      </p>

                      {/* If attached, show file metadata */}
                      {item.isAttached && item.attachedFile && (
                        <div className="mt-xs flex items-center gap-xs text-[11px] text-neutral-600 bg-white/70 px-sm py-xxs rounded-[4px] border border-neutral-200 w-fit max-w-full truncate">
                          <Icon className="size-3.5 text-neutral-500 shrink-0" />
                          <span className="truncate font-medium">{item.attachedFile.name}</span>
                        </div>
                      )}
                    </div>
                  </div>

                  {/* Right: Upload action for missing documents */}
                  {!item.isAttached && (
                    <div className="shrink-0 pt-0.5">
                      <Button
                        type="button"
                        variant="outline"
                        size="sm"
                        disabled={isItemUploading}
                        onClick={() => handleUploadClick(item.key)}
                        className="h-7 text-[12px] font-medium gap-xs px-sm rounded-compact border-neutral-300 hover:bg-neutral-100 disabled:!bg-neutral-100 disabled:!text-neutral-500"
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
                  <span>Assigning CoS…</span>
                </>
              ) : (
                <>
                  <span>Proceed to CoS Assigned</span>
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
