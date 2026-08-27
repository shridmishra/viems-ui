"use client";

import * as React from "react";
import {
  RiAlertLine,
  RiArrowDownSLine,
  RiCheckLine,
  RiCloseLine,
  RiFileTextLine,
  RiFolderShield2Line,
} from "@remixicon/react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { toast } from "sonner";
import {
  getReasonOptionsForStatus,
  StatusReasonOption,
} from "@/lib/case-status-rules";

interface CaseStatusReasonModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  targetStatus: string;
  targetStatusLabel?: string;
  caseInfo: {
    id?: string | number;
    caseId?: string;
    name?: string;
    avatarText?: string;
    avatarUrl?: string;
  } | null;
  onConfirm: (payload: {
    newStatus: string;
    reasonCode: string;
    reasonLabel: string;
    notes?: string;
  }) => void | Promise<void>;
}

export function CaseStatusReasonModal({
  open,
  onOpenChange,
  targetStatus,
  targetStatusLabel,
  caseInfo,
  onConfirm,
}: CaseStatusReasonModalProps) {
  const reasonOptions = React.useMemo(() => {
    return getReasonOptionsForStatus(targetStatus);
  }, [targetStatus]);

  const [selectedReason, setSelectedReason] = React.useState<StatusReasonOption | null>(() => reasonOptions[0] || null);
  const [customNotes, setCustomNotes] = React.useState("");
  const [submitting, setSubmitting] = React.useState(false);

  // Sync default selection if target status options change
  React.useEffect(() => {
    if (!selectedReason && reasonOptions.length > 0) {
      setSelectedReason(reasonOptions[0]);
    }
  }, [reasonOptions, selectedReason]);

  const handleOpenChange = (newOpen: boolean) => {
    if (!newOpen) {
      setSelectedReason(reasonOptions[0] || null);
      setCustomNotes("");
      setSubmitting(false);
    }
    onOpenChange(newOpen);
  };

  const norm = (targetStatus || "").toLowerCase();
  const isWithdrawal = norm.includes("withdrawn");
  const isClosed = norm.includes("closed");
  const isIneligible = norm.includes("ineligible");

  const title = isWithdrawal
    ? "Withdraw Application / CoS"
    : isClosed
    ? "Close Sponsorship Case"
    : isIneligible
    ? "Mark as Ineligible / High Risk"
    : `Change Status to ${targetStatusLabel || targetStatus}`;

  const requiresNotes = selectedReason?.requiresDescription || selectedReason?.value === "other";
  const isValid = selectedReason && (!requiresNotes || customNotes.trim().length > 0);

  const handleConfirm = async () => {
    if (!selectedReason || !isValid) return;
    try {
      setSubmitting(true);
      await onConfirm({
        newStatus: targetStatus,
        reasonCode: selectedReason.value,
        reasonLabel: selectedReason.label,
        notes: customNotes.trim() || undefined,
      });
      onOpenChange(false);
    } catch (e) {
      console.error("Failed to commit status reason:", e);
      toast.error("Failed to update status with reason.");
    } finally {
      setSubmitting(false);
    }
  };

  if (!caseInfo) return null;

  return (
    <Dialog open={open} onOpenChange={handleOpenChange}>
      <DialogContent className="max-w-[520px] w-[95vw] !p-0 !gap-0 !overflow-hidden rounded-[20px] bg-white border border-[#F5F5F5] shadow-2xl font-sans flex flex-col max-h-[85vh]">
        {/* Header */}
        <DialogHeader className="px-6 py-4.5 pr-14 border-b border-[#F5F5F5] bg-white flex flex-row items-center justify-between space-y-0 text-left shrink-0">
          <div className="flex items-center gap-3 min-w-0 flex-1">
            <div
              className={`size-9 rounded-full flex items-center justify-center shrink-0 shadow-2xs ${
                isWithdrawal || isIneligible
                  ? "bg-[#FFEBEC] text-[#FB3748]"
                  : isClosed
                  ? "bg-[#F5F5F5] text-[#5C5C5C]"
                  : "bg-[#FFFAEB] text-[#B45309]"
              }`}
            >
              {isWithdrawal || isIneligible ? (
                <RiAlertLine className="size-5" />
              ) : isClosed ? (
                <RiFolderShield2Line className="size-5" />
              ) : (
                <RiFileTextLine className="size-5" />
              )}
            </div>
            <div className="flex flex-col min-w-0">
              <DialogTitle className="font-aeonik-medium text-[16px] text-[#171717] leading-[22px]">
                {title}
              </DialogTitle>
              <p className="text-[12px] text-[#7B7B7B] mt-0.5 truncate">
                Case {String(caseInfo.caseId || caseInfo.id || "").replace(/^#+/, "#")} · {caseInfo.name || "Migrant"}
              </p>
            </div>
          </div>
        </DialogHeader>

        {/* Modal Body */}
        <div className="p-6 overflow-y-auto flex flex-col gap-4 bg-white flex-1">
          {/* Warning/Notice Banner */}
          <div
            className={`p-3.5 rounded-[12px] text-[12px] leading-[17px] flex items-start gap-2.5 ${
              isWithdrawal
                ? "bg-[#FFEBEC] text-[#681219] border border-[#FECDCA]"
                : isClosed
                ? "bg-[#F9F9F9] text-[#5C5C5C] border border-[#EBEBEB]"
                : "bg-[#FFFAEB] text-[#624C18] border border-[#FDE8D3]"
            }`}
          >
            <RiAlertLine className="size-4.5 shrink-0 mt-0.5 text-current" />
            <div>
              <span className="font-semibold block mb-0.5">
                {isWithdrawal
                  ? "CoS Revocation & Withdrawal Audit"
                  : isClosed
                  ? "Formal Case Closure"
                  : "Compliance Record Update"}
              </span>
              <span>
                {isWithdrawal
                  ? "Withdrawing this application revokes active CoS sponsorship. UKVI reporting rules require logging the specific reason for cancellation."
                  : isClosed
                  ? "Closing this case flags all ongoing sponsorship duties as concluded and creates an archival compliance record."
                  : "Please document the justification for transitioning this case into an inactive or restricted state."}
              </span>
            </div>
          </div>

          {/* Reason Selector Dropdown */}
          <div className="flex flex-col gap-1.5">
            <Label className="text-[13px] font-medium text-[#171717]">
              Reason for {isWithdrawal ? "Withdrawal" : isClosed ? "Closing" : "Status Change"}{" "}
              <span className="text-[#FB3748]">*</span>
            </Label>
            <DropdownMenu>
              <DropdownMenuTrigger
                render={
                  <Button
                    type="button"
                    variant="outline"
                    className="w-full h-10 px-3 justify-between bg-white text-[13px] font-normal text-[#171717] border border-neutral-200 hover:bg-neutral-50 rounded-[10px] shadow-x-small cursor-pointer"
                  >
                    <span className="truncate">
                      {selectedReason?.label || "Select a reason..."}
                    </span>
                    <RiArrowDownSLine className="size-4 text-[#7B7B7B] shrink-0 ml-2" />
                  </Button>
                }
              />
              <DropdownMenuContent className="w-[470px] max-w-[90vw] p-1 rounded-[12px] bg-white border border-neutral-200 shadow-card-large z-50">
                {reasonOptions.map((opt) => {
                  const isSelected = selectedReason?.value === opt.value;
                  return (
                    <DropdownMenuItem
                      key={opt.value}
                      onClick={() => setSelectedReason(opt)}
                      className={`flex items-center justify-between px-3 py-2 text-[13px] rounded-[8px] cursor-pointer ${
                        isSelected
                          ? "bg-brand-light text-brand-dark font-medium"
                          : "text-[#171717] hover:bg-neutral-100"
                      }`}
                    >
                      <span className="truncate">{opt.label}</span>
                      {isSelected && <RiCheckLine className="size-4 text-brand-dark shrink-0 ml-2" />}
                    </DropdownMenuItem>
                  );
                })}
              </DropdownMenuContent>
            </DropdownMenu>
          </div>

          {/* Additional Notes Textarea */}
          <div className="flex flex-col gap-1.5">
            <div className="flex items-center justify-between text-[13px]">
              <Label className="font-medium text-[#171717]">
                Additional Notes & Context{" "}
                {requiresNotes ? (
                  <span className="text-[#FB3748]">* (Required for &quot;Other&quot;)</span>
                ) : (
                  <span className="text-[#7B7B7B] font-normal">(Optional)</span>
                )}
              </Label>
            </div>
            <Textarea
              placeholder={
                requiresNotes
                  ? "Please explain the specific reason for withdrawal or closure..."
                  : "Add any internal compliance notes or Home Office reference numbers..."
              }
              value={customNotes}
              onChange={(e) => setCustomNotes(e.target.value)}
              className="min-h-[90px] text-[13px] rounded-[10px] border border-neutral-200 focus-visible:ring-1 focus-visible:ring-brand-medium resize-none bg-white placeholder-[#A4A4A4]"
            />
          </div>
        </div>

        {/* Footer */}
        <div className="px-6 py-3.5 border-t border-[#F5F5F5] bg-[#FAFAFA] flex items-center justify-between shrink-0">
          <Button
            type="button"
            variant="ghost"
            size="sm"
            onClick={() => onOpenChange(false)}
            className="h-8.5 px-4 rounded-full text-[13px] font-medium bg-[#F5F5F5] hover:bg-[#EBEBEB] text-[#171717] cursor-pointer"
          >
            Cancel
          </Button>

          <Button
            type="button"
            size="sm"
            disabled={!isValid || submitting}
            onClick={handleConfirm}
            className={`h-8.5 px-5 rounded-full text-[13px] font-medium shadow-2xs transition-all cursor-pointer ${
              isWithdrawal || isIneligible
                ? "bg-[#FB3748] hover:bg-[#E02D3D] text-white"
                : "bg-brand-medium hover:bg-brand-dark text-white"
            }`}
          >
            {submitting ? "Applying..." : isWithdrawal ? "Confirm Withdrawal" : isClosed ? "Confirm Closure" : "Apply Status"}
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}
