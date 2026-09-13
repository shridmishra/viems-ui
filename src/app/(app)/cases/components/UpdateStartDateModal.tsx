"use client";

import * as React from "react";
import {
  RiCalendarLine,
  RiAlertLine,
  RiCheckLine,
  RiFileCopyLine,
  RiShieldCheckLine,
  RiInformationLine,
  RiTimer2Line,
} from "@remixicon/react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { toast } from "sonner";
import { apiClient } from "@/lib/api-client";
import { ENDPOINTS } from "@/lib/api-endpoints";

export interface UpdateStartDateModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  caseData?: any;
  initialStartDate?: string;
  initialDelayDays?: number;
  initialReason?: string;
  onSuccess?: (updatedData: any) => void;
}

const PRESET_DELAY_REASONS = [
  { value: "visa_pending", label: "Visa processing delay / decision pending with UKVI" },
  { value: "notice_period", label: "Notice period with current employer extended" },
  { value: "travel_rescheduled", label: "Travel / flight booking rescheduled" },
  { value: "production_postponed", label: "Production / filming schedule postponed" },
  { value: "compassionate_grounds", label: "Compassionate / personal leave grounds" },
  { value: "other", label: "Other verified operational delay reason" },
];

function safeExtract(val: any): string {
  if (val === null || val === undefined) return "";
  if (typeof val === "string") return val.trim();
  if (typeof val === "number") return String(val).trim();
  if (typeof val === "object") {
    if (typeof val.name === "string") return val.name.trim();
    if (typeof val.title === "string") return val.title.trim();
  }
  return "";
}

export function UpdateStartDateModal({
  open,
  onOpenChange,
  caseData,
  initialStartDate,
  initialDelayDays,
  initialReason,
  onSuccess,
}: UpdateStartDateModalProps) {
  // Extract case metadata safely
  const caseId =
    caseData?.id ??
    caseData?.caseId ??
    caseData?.case_id;

  const caseNumber =
    safeExtract(caseData?.caseNumber) ||
    safeExtract(caseData?.caseIdDisplay) ||
    safeExtract(caseData?.caseId) ||
    (caseId ? `#${caseId}` : "—");

  const migrantName =
    safeExtract(caseData?.name) ||
    safeExtract(caseData?.migrant?.name) ||
    safeExtract(caseData?.migrantName) ||
    safeExtract(
      `${caseData?.first_name || caseData?.personal?.firstName || ""} ${caseData?.last_name || caseData?.personal?.lastName || ""}`
    ) ||
    "Sponsored Worker";

  const originalStartDate =
    initialStartDate ||
    caseData?.personal?.workStartDate ||
    caseData?.workStartDate ||
    caseData?.cos?.assignedDate ||
    caseData?.cosStartDate ||
    "";

  const detectedSponsorLicence =
    safeExtract(caseData?.sponsor_licence_number) ||
    safeExtract(caseData?.sponsorLicenceNumber) ||
    "";

  const sponsorName =
    safeExtract(caseData?.sponsor_name) ||
    safeExtract(caseData?.employer) ||
    "ENT Immigration Ltd";

  const detectedCosNumber =
    safeExtract(caseData?.cosNumber) ||
    safeExtract(caseData?.cos_number) ||
    safeExtract(caseData?.cos?.cosNumber) ||
    "";

  // Calculate elapsed delay
  const computedDelayDays = React.useMemo(() => {
    if (typeof initialDelayDays === "number") return initialDelayDays;
    if (!originalStartDate) return 0;
    const start = new Date(originalStartDate);
    if (isNaN(start.getTime())) return 0;
    const now = new Date();
    const diff = Math.floor((now.getTime() - start.getTime()) / (1000 * 60 * 60 * 24));
    return Math.max(0, diff);
  }, [initialDelayDays, originalStartDate]);

  const isSmsThresholdExceeded = computedDelayDays > 28;

  // Form states
  const [newStartDate, setNewStartDate] = React.useState<string>(() => {
    const d = new Date();
    d.setDate(d.getDate() + 14);
    return d.toISOString().slice(0, 10);
  });

  const [selectedReason, setSelectedReason] = React.useState<string>(() => {
    return initialReason || PRESET_DELAY_REASONS[0].value;
  });

  const [customReasonText, setCustomReasonText] = React.useState<string>("");
  const [smsReference, setSmsReference] = React.useState<string>("");
  const [notes, setNotes] = React.useState<string>("");
  const [notifyHomeOffice, setNotifyHomeOffice] = React.useState<boolean>(isSmsThresholdExceeded);
  const [isSubmitting, setIsSubmitting] = React.useState<boolean>(false);
  const [copiedSms, setCopiedSms] = React.useState<boolean>(false);
  const [overrideSponsorLicence, setOverrideSponsorLicence] = React.useState<string>("");
  const [overrideCosNumber, setOverrideCosNumber] = React.useState<string>("");

  // Sync state on open
  React.useEffect(() => {
    if (open) {
      const d = new Date();
      d.setDate(d.getDate() + 14);
      setNewStartDate(d.toISOString().slice(0, 10));
      setSelectedReason(initialReason || PRESET_DELAY_REASONS[0].value);
      setCustomReasonText("");
      setNotes("");
      setCopiedSms(false);
      setNotifyHomeOffice(computedDelayDays > 28);
      const generatedSms = `SMS-DLY-${new Date().toISOString().slice(0, 10).replace(/-/g, "")}-${caseNumber.replace(/[^\w]/g, "")}`;
      setSmsReference(generatedSms);
      setOverrideSponsorLicence(detectedSponsorLicence);
      setOverrideCosNumber(detectedCosNumber);
    }
  }, [open, caseNumber, initialReason, computedDelayDays, detectedSponsorLicence, detectedCosNumber]);

  const sponsorLicence = overrideSponsorLicence.trim() || detectedSponsorLicence;
  const cosNumber = overrideCosNumber.trim() || detectedCosNumber;

  const activeReasonLabel =
    selectedReason === "other"
      ? customReasonText.trim() || "Operational delay grounds"
      : PRESET_DELAY_REASONS.find((r) => r.value === selectedReason)?.label || selectedReason;

  // UKVI Pre-formatted Home Office SMS Notification Text
  const generatedSmsText = React.useMemo(() => {
    return `SPONSOR COMPLIANCE NOTICE: MIGRANT WORK START DATE DELAY
Sponsor: ${sponsorName} (Licence: ${sponsorLicence})
Worker: ${migrantName}
CoS Number: ${cosNumber} | Case Reference: ${caseNumber}
Original Start Date: ${originalStartDate || "N/A"}
Revised Agreed Start Date: ${newStartDate}
Delay Duration: ${computedDelayDays} calendar days
Reason for Delay: ${activeReasonLabel}
Compliance Status: Sponsor confirms continued intention to employ the worker. Revised start date agreed within permitted UKVI statutory window.
Reference: ${smsReference || "N/A"}`;
  }, [
    sponsorName,
    sponsorLicence,
    migrantName,
    cosNumber,
    caseNumber,
    originalStartDate,
    newStartDate,
    computedDelayDays,
    activeReasonLabel,
    smsReference,
  ]);

  const handleCopySmsText = async () => {
    try {
      await navigator.clipboard.writeText(generatedSmsText);
      setCopiedSms(true);
      toast.success("Home Office SMS delay notice text copied to clipboard.");
      setTimeout(() => setCopiedSms(false), 3000);
    } catch {
      toast.error("Could not access clipboard.");
    }
  };

  const handleUpdate = async () => {
    if (!newStartDate) {
      toast.error("Please select a revised start date.");
      return;
    }
    if (selectedReason === "other" && !customReasonText.trim()) {
      toast.error("Please enter a custom delay reason.");
      return;
    }
    if (!sponsorLicence.trim()) {
      toast.error("Sponsor licence number is required before recording start date delay.");
      return;
    }
    if (!cosNumber.trim()) {
      toast.error("Certificate of Sponsorship (CoS) number is required before recording start date delay.");
      return;
    }

    const validCaseId =
      typeof caseId === "number"
        ? caseId
        : typeof caseId === "string" && caseId.trim().length > 0
        ? caseId.trim()
        : null;

    if (!validCaseId) {
      toast.error("Invalid case ID for update.");
      return;
    }

    try {
      setIsSubmitting(true);
      const payload = {
        newStartDate,
        delayReason: activeReasonLabel,
        smsReference: smsReference.trim() || undefined,
        notes: notes.trim() || undefined,
        notifyHomeOffice,
        authorisingOfficer: "Nathan Wood",
      };

      const res = await apiClient.post<any>(
        ENDPOINTS.notifications.updateStartDate(validCaseId),
        payload
      );

      toast.success(
        `Work start date for ${migrantName} updated to ${new Date(newStartDate).toLocaleDateString("en-GB")}.`
      );

      if (notifyHomeOffice && smsReference) {
        toast.info(`Home Office SMS filing recorded (Ref: ${smsReference}).`);
      }

      if (onSuccess) {
        onSuccess({
          ...res,
          newStartDate,
          delayReason: activeReasonLabel,
          smsReference,
        });
      }

      onOpenChange(false);
    } catch (err: any) {
      console.error("Failed to update work start date:", err);
      const errorMessage =
        err?.response?.data?.message ||
        err?.message ||
        "Failed to update work start date on server. Please try again.";
      toast.error(errorMessage);
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-[640px] w-[95vw] !p-0 !gap-0 !overflow-hidden rounded-[20px] bg-white border border-neutral-200 shadow-2xl font-sans flex flex-col max-h-[88vh]">
        {/* Fixed Header */}
        <DialogHeader className="px-6 py-4.5 pr-14 border-b border-neutral-200 bg-white flex flex-row items-center justify-between space-y-0 text-left shrink-0">
          <div className="flex items-center gap-3 min-w-0 flex-1">
            <div className="size-9 rounded-full bg-brand-light text-brand-dark flex items-center justify-center shrink-0 shadow-2xs">
              <RiCalendarLine className="size-5" />
            </div>
            <div className="flex flex-col min-w-0">
              <DialogTitle className="font-aeonik-medium text-[16px] text-[#171717] leading-[22px]">
                Update Work Start Date & SMS Delay Report
              </DialogTitle>
              <p className="text-[12px] text-[#7B7B7B] mt-0.5 truncate">
                UKVI Appendix D statutory delay management for sponsored workers
              </p>
            </div>
          </div>
        </DialogHeader>

        {/* Scrollable Body */}
        <div className="p-6 overflow-y-auto flex flex-col gap-4 bg-white flex-1 text-[13px]">
          {/* Case Summary Card */}
          <div className="p-3.5 bg-neutral-50 border border-neutral-200 rounded-[12px] flex flex-col gap-2.5">
            <div className="flex items-center justify-between gap-3 text-[12px]">
              <span className="font-semibold text-[#171717] truncate max-w-[280px]">{migrantName}</span>
              <span className="font-mono text-[#7B7B7B] text-[11px] shrink-0">
                {caseNumber}{cosNumber ? ` · ${cosNumber}` : ""}
              </span>
            </div>
            <div className="flex items-center justify-between text-[12px] pt-2 border-t border-neutral-200/70">
              <div className="flex items-center gap-1.5 text-[#5C5C5C]">
                <RiTimer2Line className="size-3.5 text-neutral-500" />
                <span>Original Start: <strong className="text-[#171717]">{originalStartDate || "Not recorded"}</strong></span>
              </div>
              <Badge
                variant={isSmsThresholdExceeded ? "destructive" : "warning"}
                withDot
                className="text-[10px] uppercase font-semibold"
              >
                {computedDelayDays} DAYS DELAYED
              </Badge>
            </div>
          </div>

          {/* UKVI Statutory Warning Banner */}
          {isSmsThresholdExceeded ? (
            <div className="p-3 bg-red-50 border border-red-200 rounded-[12px] flex items-start gap-2.5 text-red-800 text-[12px]">
              <RiAlertLine className="size-4 shrink-0 mt-0.5 text-red-600" />
              <div className="flex flex-col gap-0.5">
                <span className="font-semibold text-red-900">
                  Statutory 28-Day Threshold Exceeded ({computedDelayDays} Days)
                </span>
                <span className="text-red-700 leading-normal">
                  Under UKVI Sponsor Guidance, delays over 28 days must be reported via SMS within 10 working days. You must agree a revised start date or curtail sponsorship.
                </span>
              </div>
            </div>
          ) : (
            <div className="p-3 bg-amber-50 border border-amber-200 rounded-[12px] flex items-start gap-2.5 text-amber-900 text-[12px]">
              <RiInformationLine className="size-4 shrink-0 mt-0.5 text-amber-600" />
              <div className="flex flex-col gap-0.5">
                <span className="font-semibold text-amber-950">
                  Start Date Elapsed ({computedDelayDays}d Ago) — Arrival Pending
                </span>
                <span className="text-amber-800 leading-normal">
                  The scheduled work start date has passed without recorded UK arrival. Updating the date prevents non-compliance.
                </span>
              </div>
            </div>
          )}

          {/* Revised Date Input */}
          <div className="flex flex-col gap-1.5">
            <Label htmlFor="new-start-date" className="text-[12px] font-medium text-[#171717]">
              Revised Work Start Date <span className="text-red-500">*</span>
            </Label>
            <Input
              id="new-start-date"
              type="date"
              value={newStartDate}
              onChange={(e) => setNewStartDate(e.target.value)}
              className="h-9 text-[13px] rounded-[10px] border border-neutral-200 bg-white"
            />
          </div>

          {/* Reason Selector */}
          <div className="flex flex-col gap-1.5">
            <Label className="text-[12px] font-medium text-[#171717]">
              Verified Reason for Delay <span className="text-red-500">*</span>
            </Label>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
              {PRESET_DELAY_REASONS.map((reason) => {
                const isSelected = selectedReason === reason.value;
                return (
                  <button
                    key={reason.value}
                    type="button"
                    onClick={() => setSelectedReason(reason.value)}
                    className={`min-h-[42px] py-2 px-3 text-left rounded-[10px] text-[12px] leading-snug border transition-all cursor-pointer flex items-center justify-between ${
                      isSelected
                        ? "bg-brand-light text-brand-dark border-brand-medium/50 font-medium shadow-2xs"
                        : "bg-white text-neutral-700 border-neutral-200 hover:bg-neutral-50 hover:border-neutral-300"
                    }`}
                  >
                    <span className="pr-1">{reason.label}</span>
                    {isSelected && <RiCheckLine className="size-4 text-brand-dark shrink-0 ml-1" />}
                  </button>
                );
              })}
            </div>
          </div>

          {selectedReason === "other" && (
            <div className="flex flex-col gap-1.5 animate-fade-in">
              <Label htmlFor="custom-reason" className="text-[12px] font-medium text-[#171717]">
                Specify Custom Reason <span className="text-red-500">*</span>
              </Label>
              <Input
                id="custom-reason"
                placeholder="Enter detailed reason for delay..."
                value={customReasonText}
                onChange={(e) => setCustomReasonText(e.target.value)}
                className="h-9 text-[13px] rounded-[10px] border border-neutral-200 bg-white"
              />
            </div>
          )}

          {/* Statutory Identifiers: CoS Number & Sponsor Licence */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div className="flex flex-col gap-1.5">
              <Label htmlFor="cos-number" className="text-[12px] font-medium text-[#171717]">
                CoS Number <span className="text-red-500">*</span>
              </Label>
              <Input
                id="cos-number"
                placeholder="e.g. C5C3I-ASSIGNED"
                value={overrideCosNumber}
                onChange={(e) => setOverrideCosNumber(e.target.value)}
                className="h-9 text-[12px] font-mono rounded-[10px] border border-neutral-200 bg-white"
              />
            </div>
            <div className="flex flex-col gap-1.5">
              <Label htmlFor="sponsor-licence" className="text-[12px] font-medium text-[#171717]">
                Sponsor Licence Number <span className="text-red-500">*</span>
              </Label>
              <Input
                id="sponsor-licence"
                placeholder="e.g. ENT1234567"
                value={overrideSponsorLicence}
                onChange={(e) => setOverrideSponsorLicence(e.target.value)}
                className="h-9 text-[12px] font-mono rounded-[10px] border border-neutral-200 bg-white"
              />
            </div>
          </div>

          {/* SMS Reference & Notes */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div className="flex flex-col gap-1.5">
              <Label htmlFor="sms-ref" className="text-[12px] font-medium text-[#171717]">
                Home Office SMS Reference
              </Label>
              <Input
                id="sms-ref"
                placeholder="e.g. SMS-DLY-2026-001"
                value={smsReference}
                onChange={(e) => setSmsReference(e.target.value)}
                className="h-9 text-[12px] font-mono rounded-[10px] border border-neutral-200 bg-white"
              />
            </div>
            <div className="flex flex-col gap-1.5">
              <Label htmlFor="notes" className="text-[12px] font-medium text-[#171717]">
                Internal Compliance Note
              </Label>
              <Input
                id="notes"
                placeholder="Optional notes for file..."
                value={notes}
                onChange={(e) => setNotes(e.target.value)}
                className="h-9 text-[13px] rounded-[10px] border border-neutral-200 bg-white"
              />
            </div>
          </div>

          {/* Pre-formatted SMS Preview Box */}
          <div className="p-3.5 bg-neutral-900 text-neutral-100 rounded-[12px] flex flex-col gap-2 shadow-inner">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-1.5 text-[11px] font-medium text-neutral-300">
                <RiShieldCheckLine className="size-4 text-brand-light" />
                <span>Home Office SMS Delay Report Preview</span>
              </div>
              <button
                type="button"
                onClick={handleCopySmsText}
                className="h-6 px-2 text-[11px] text-white bg-neutral-800 hover:bg-neutral-700 flex items-center gap-1 rounded-[6px] transition-colors cursor-pointer"
              >
                {copiedSms ? (
                  <>
                    <RiCheckLine className="size-3 text-emerald-400" />
                    <span className="text-emerald-400 font-medium">Copied</span>
                  </>
                ) : (
                  <>
                    <RiFileCopyLine className="size-3 text-neutral-400" />
                    <span>Copy Text</span>
                  </>
                )}
              </button>
            </div>
            <pre className="font-mono text-[11px] leading-relaxed text-neutral-300 bg-neutral-950/80 p-2.5 rounded-[8px] max-h-[110px] overflow-y-auto whitespace-pre-wrap select-all border border-neutral-800">
              {generatedSmsText}
            </pre>
          </div>
        </div>

        {/* Pinned / Sticky Footer */}
        <div className="px-6 py-3.5 border-t border-neutral-200 bg-neutral-50/80 flex items-center justify-between shrink-0">
          <Button
            type="button"
            variant="outline"
            onClick={() => onOpenChange(false)}
            disabled={isSubmitting}
            className="rounded-[10px] text-[13px] h-9 px-4 cursor-pointer"
          >
            Cancel
          </Button>

          <div className="flex items-center gap-2">
            <Button
              type="button"
              variant="outline"
              onClick={handleCopySmsText}
              className="rounded-[10px] text-[13px] h-9 px-3.5 border-neutral-200 cursor-pointer flex items-center gap-1.5"
            >
              <RiFileCopyLine className="size-4 text-neutral-500" />
              <span>Copy SMS Notice</span>
            </Button>
            <Button
              type="button"
              variant="default"
              onClick={handleUpdate}
              disabled={isSubmitting || !sponsorLicence.trim() || !cosNumber.trim()}
              className="rounded-[10px] text-[13px] h-9 px-4 bg-brand-medium text-white hover:bg-brand-dark font-medium shadow-sm cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {isSubmitting ? "Updating..." : "1-Click Update Start Date"}
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
