"use client";

import * as React from "react";
import {
  RiFileTextLine,
  RiArrowDownSLine,
  RiCheckLine,
  RiDownload2Line,
  RiShieldCheckLine,
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
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { toast } from "sonner";
import {
  generateCurtailmentLetter,
  downloadPdf,
  CurtailmentLetterData,
} from "@/lib/pdf-report-generator";
import { formatFullName } from "@/lib/utils";

export interface CurtailmentCaseSource {
  id?: number | string;
  caseId?: string;
  caseIdDisplay?: string;
  caseNumber?: string;
  case_number?: string;
  name?: string;
  first_name?: string;
  last_name?: string;
  role?: string;
  job_title?: string;
  cosNumber?: string;
  cos_number?: string;
  cosRef?: string;
  cosReference?: string;
  passport_number?: string;
  passportNumber?: string;
  dob?: string;
  date_of_birth?: string;
  country?: string;
  nationality?: string;
  nationality_value?: string;
  sponsor_name?: string;
  employer?: string;
  sponsor_licence_number?: string;
  sponsorLicenceNumber?: string;
  smsReportReference?: string;
  sms_reference?: string;
  personal?: {
    firstName?: string;
    lastName?: string;
    dob?: string;
    country?: string;
    jobTitle?: string;
    passportNumber?: string;
  };
  employment?: {
    jobTitle?: string;
    employer?: string;
    cosReference?: string;
  };
  passport?: {
    passport_number?: string;
  };
  migrant?: CurtailmentCaseSource;
}

export interface CurtailmentLetterModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  caseData?: CurtailmentCaseSource | null;
  migrant?: CurtailmentCaseSource | null;
  initialReason?: string;
  initialNotes?: string;
  initialCessationType?: "curtailment" | "closure" | "withdrawal";
}

const PRESET_REASONS = [
  { value: "curtailment_issued", label: "Home Office curtailment letter issued", type: "curtailment" },
  { value: "engagement_completed", label: "Engagement / production successfully completed", type: "closure" },
  { value: "migrant_departed_uk", label: "Migrant departed UK upon visa expiry", type: "closure" },
  { value: "production_canceled", label: "Production / filming canceled or postponed", type: "withdrawal" },
  { value: "migrant_withdrew", label: "Migrant withdrew participation / resigned early", type: "curtailment" },
  { value: "cos_revoked", label: "CoS revoked prior to visa submission / entry", type: "withdrawal" },
  { value: "transferred_sponsor", label: "Migrant transferred to another licensed sponsor", type: "closure" },
  { value: "failed_rtw_eligibility", label: "Failed Right-to-Work or compliance verification", type: "withdrawal" },
  { value: "other", label: "Other statutory cessation grounds (custom)", type: "curtailment" },
];

export function CurtailmentLetterModal({
  open,
  onOpenChange,
  caseData,
  migrant,
  initialReason,
  initialNotes,
  initialCessationType = "curtailment",
}: CurtailmentLetterModalProps) {
  const [cessationType, setCessationType] = React.useState<"curtailment" | "closure" | "withdrawal">(
    initialCessationType
  );

  const getDefaultReasonCode = (type: "curtailment" | "closure" | "withdrawal") => {
    if (type === "closure") return "engagement_completed";
    if (type === "withdrawal") return "production_canceled";
    return "curtailment_issued";
  };

  const [selectedReason, setSelectedReason] = React.useState<string>(() => {
    if (initialReason) {
      const found = PRESET_REASONS.find((r) => r.value === initialReason || r.label === initialReason);
      return found ? found.value : "other";
    }
    return getDefaultReasonCode(initialCessationType);
  });

  const [customReasonText, setCustomReasonText] = React.useState<string>(() => {
    if (initialReason && !PRESET_REASONS.some((r) => r.value === initialReason || r.label === initialReason)) {
      return initialReason;
    }
    return "";
  });

  const [effectiveDate, setEffectiveDate] = React.useState<string>(() => new Date().toISOString().slice(0, 10));
  const [lastDayOfWork, setLastDayOfWork] = React.useState<string>(() => new Date().toISOString().slice(0, 10));
  const [smsReference, setSmsReference] = React.useState<string>("");
  const [authorisingOfficer, setAuthorisingOfficer] = React.useState<string>("Nathan Wood");
  const [officerRole, setOfficerRole] = React.useState<string>("Compliance Officer & Level 1 User");
  const [notes, setNotes] = React.useState<string>(initialNotes || "");
  const [downloading, setDownloading] = React.useState<boolean>(false);

  // Case identity tracking for fresh reset
  const caseKey = `${caseData?.id || ""}_${caseData?.caseId || ""}_${migrant?.id || ""}`;

  React.useEffect(() => {
    if (open) {
      const type = initialCessationType || "curtailment";
      setCessationType(type);

      if (initialReason) {
        const found = PRESET_REASONS.find((r) => r.value === initialReason || r.label === initialReason);
        if (found) {
          setSelectedReason(found.value);
          setCustomReasonText("");
        } else {
          setSelectedReason("other");
          setCustomReasonText(initialReason);
        }
      } else {
        setSelectedReason(getDefaultReasonCode(type));
        setCustomReasonText("");
      }

      setNotes(initialNotes || "");
      setEffectiveDate(new Date().toISOString().slice(0, 10));
      setLastDayOfWork(new Date().toISOString().slice(0, 10));

      const existingSms =
        caseData?.smsReportReference ||
        caseData?.sms_reference ||
        migrant?.smsReportReference ||
        migrant?.sms_reference ||
        "";
      setSmsReference(existingSms);
      setAuthorisingOfficer("Nathan Wood");
      setOfficerRole("Compliance Officer & Level 1 User");
    }
  }, [open, caseKey, initialCessationType, initialReason, initialNotes, caseData, migrant]);

  // Derive migrant & case info
  const m = migrant || caseData?.migrant || caseData || {};
  const rawMigrantName =
    caseData?.name ||
    m.name ||
    formatFullName(
      m.first_name || caseData?.first_name || m.personal?.firstName,
      m.last_name || caseData?.last_name || m.personal?.lastName
    );
  const migrantName = rawMigrantName?.trim() || "";

  const rawCaseNumber =
    caseData?.caseIdDisplay ||
    caseData?.caseNumber ||
    caseData?.case_number ||
    caseData?.caseId ||
    caseData?.id ||
    m.id ||
    "";
  const caseNumber = String(rawCaseNumber).trim();

  const rawCosRef =
    caseData?.cosNumber ||
    caseData?.cos_number ||
    caseData?.cosRef ||
    caseData?.cosReference ||
    caseData?.employment?.cosReference ||
    m.cosNumber ||
    m.cosReference ||
    m.employment?.cosReference ||
    "";
  const cosReference = rawCosRef.trim();

  const rawPassportNumber =
    caseData?.passport_number ||
    caseData?.passportNumber ||
    caseData?.personal?.passportNumber ||
    m.passport_number ||
    m.passportNumber ||
    m.passport?.passport_number ||
    m.personal?.passportNumber ||
    "";
  const passportNumber = rawPassportNumber.trim();

  const dateOfBirth =
    caseData?.dob ||
    caseData?.date_of_birth ||
    caseData?.personal?.dob ||
    m.dob ||
    m.date_of_birth ||
    m.personal?.dob ||
    "";

  const nationality =
    caseData?.nationality_value ||
    caseData?.country ||
    caseData?.nationality ||
    caseData?.personal?.country ||
    m.nationality_value ||
    m.country ||
    m.nationality ||
    m.personal?.country ||
    "";

  const rawJobTitle =
    caseData?.role ||
    caseData?.job_title ||
    caseData?.employment?.jobTitle ||
    caseData?.personal?.jobTitle ||
    m.role ||
    m.job_title ||
    m.employment?.jobTitle ||
    m.personal?.jobTitle ||
    "";
  const jobTitle = rawJobTitle.trim();

  const rawSponsorName =
    caseData?.sponsor_name ||
    caseData?.employer ||
    caseData?.employment?.employer ||
    m.sponsor_name ||
    m.employer ||
    m.employment?.employer ||
    "";
  const sponsorName = rawSponsorName.trim();

  const rawSponsorLicence =
    caseData?.sponsor_licence_number ||
    caseData?.sponsorLicenceNumber ||
    m.sponsor_licence_number ||
    m.sponsorLicenceNumber ||
    "";
  const sponsorLicence = rawSponsorLicence.trim();

  // Validate required notice metadata
  const missingFields: string[] = [];
  if (!migrantName) missingFields.push("Migrant Name");
  if (!caseNumber) missingFields.push("Case Number");
  if (!cosReference) missingFields.push("CoS Reference");
  if (!jobTitle) missingFields.push("Job Title / Role");
  if (!sponsorName) missingFields.push("Sponsor Name");
  if (!sponsorLicence) missingFields.push("Sponsor Licence Number");

  const isCustomReason = selectedReason === "other";
  const isReasonValid = isCustomReason ? customReasonText.trim().length > 0 : selectedReason.length > 0;
  const isFormValid = missingFields.length === 0 && isReasonValid && effectiveDate.length > 0;

  const selectedPresetObj = PRESET_REASONS.find((r) => r.value === selectedReason);
  const selectedLabel = selectedPresetObj?.label || selectedReason;

  const handleDownload = async () => {
    if (!isFormValid) {
      if (missingFields.length > 0) {
        toast.error(`Cannot generate letter: missing verified ${missingFields.join(", ")}.`);
      } else if (!isReasonValid) {
        toast.error("Please enter a custom reason for cessation.");
      }
      return;
    }

    try {
      setDownloading(true);
      await new Promise((resolve) => setTimeout(resolve, 50));

      const finalReason = isCustomReason ? customReasonText.trim() : selectedLabel;

      const initials =
        migrantName
          .split(" ")
          .filter(Boolean)
          .map((w: string) => w[0]?.toUpperCase() || "")
          .join("") || "CRT";

      const payload: CurtailmentLetterData = {
        migrantName,
        caseNumber,
        cosReference,
        passportNumber: passportNumber || undefined,
        dateOfBirth: dateOfBirth || undefined,
        nationality: nationality || undefined,
        jobTitle,
        sponsorName,
        sponsorLicenceNumber: sponsorLicence,
        authorisingOfficer: authorisingOfficer.trim() || "Nathan Wood",
        authorisingOfficerRole: officerRole.trim() || "Compliance Officer",
        cessationType,
        cessationReason: finalReason,
        lastDayOfWork: lastDayOfWork || undefined,
        sponsorshipEndDate: effectiveDate,
        smsReportReference: smsReference.trim() || undefined,
        notes: notes.trim() || undefined,
        refNumber: `UKVI-CRT-${new Date().toISOString().slice(0, 10).replace(/-/g, "")}-${initials}`,
        generatedDate: new Date().toLocaleDateString("en-GB", {
          day: "numeric",
          month: "long",
          year: "numeric",
        }),
      };

      const doc = generateCurtailmentLetter(payload);
      const safeName = migrantName.replace(/[^\w\s-]/g, "").trim().replace(/\s+/g, "_") || "Worker";
      const docTypePrefix =
        cessationType === "withdrawal"
          ? "Withdrawal_Notice"
          : cessationType === "closure"
          ? "Case_Closure_Certificate"
          : "Curtailment_Letter";

      downloadPdf(doc, `Viems_${docTypePrefix}_${safeName}.pdf`);
      toast.success(`Official Curtailment / Case Closing Letter for ${migrantName} downloaded.`);
      onOpenChange(false);
    } catch (err) {
      console.error("Failed to generate curtailment letter:", err);
      toast.error(err instanceof Error ? err.message : "Failed to generate PDF letter.");
    } finally {
      setDownloading(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-[620px] w-[95vw] !p-0 !gap-0 !overflow-hidden rounded-[20px] bg-white border border-neutral-200 shadow-2xl font-sans flex flex-col max-h-[90vh]">
        {/* Header */}
        <DialogHeader className="px-6 py-4.5 pr-14 border-b border-neutral-200 bg-white flex flex-row items-center justify-between space-y-0 text-left shrink-0">
          <div className="flex items-center gap-3 min-w-0 flex-1">
            <div className="size-9 rounded-full bg-brand-light text-brand-dark flex items-center justify-center shrink-0 shadow-2xs">
              <RiFileTextLine className="size-5" />
            </div>
            <div className="flex flex-col min-w-0">
              <DialogTitle className="font-aeonik-medium text-[16px] text-[#171717] leading-[22px]">
                Generate Curtailment / Case Closing Letter
              </DialogTitle>
              <p className="text-[12px] text-[#7B7B7B] mt-0.5 truncate">
                Case {caseNumber.replace(/^#+/, "#") || "—"} · {migrantName || "—"} · {cosReference || "—"}
              </p>
            </div>
          </div>
        </DialogHeader>

        {/* Scrollable Body */}
        <div className="p-6 overflow-y-auto flex flex-col gap-4.5 bg-white flex-1 text-[13px]">
          {/* Missing Fields Warning Banner */}
          {missingFields.length > 0 && (
            <div className="p-3 bg-red-50 border border-red-200 rounded-[12px] text-[12px] text-red-800">
              <span className="font-semibold block">Missing Required Verification Data</span>
              The following verified fields are required before this statutory notice can be exported:{" "}
              <span className="font-medium">{missingFields.join(", ")}</span>.
            </div>
          )}

          {/* Notice Type Selector Tabs */}
          <div className="flex flex-col gap-1.5">
            <Label className="text-[12px] font-medium text-[#171717]">Document Notice Type</Label>
            <div className="grid grid-cols-3 gap-2 p-1 bg-neutral-100 rounded-[10px]">
              <button
                type="button"
                onClick={() => {
                  setCessationType("curtailment");
                  setSelectedReason("curtailment_issued");
                  setCustomReasonText("");
                }}
                className={`py-1.5 px-2 rounded-[8px] text-[12px] font-medium transition-all cursor-pointer ${
                  cessationType === "curtailment"
                    ? "bg-white text-[#171717] shadow-2xs"
                    : "text-[#5C5C5C] hover:text-[#171717]"
                }`}
              >
                Curtailment Letter
              </button>
              <button
                type="button"
                onClick={() => {
                  setCessationType("closure");
                  setSelectedReason("engagement_completed");
                  setCustomReasonText("");
                }}
                className={`py-1.5 px-2 rounded-[8px] text-[12px] font-medium transition-all cursor-pointer ${
                  cessationType === "closure"
                    ? "bg-white text-[#171717] shadow-2xs"
                    : "text-[#5C5C5C] hover:text-[#171717]"
                }`}
              >
                Case Closing Notice
              </button>
              <button
                type="button"
                onClick={() => {
                  setCessationType("withdrawal");
                  setSelectedReason("production_canceled");
                  setCustomReasonText("");
                }}
                className={`py-1.5 px-2 rounded-[8px] text-[12px] font-medium transition-all cursor-pointer ${
                  cessationType === "withdrawal"
                    ? "bg-white text-[#171717] shadow-2xs"
                    : "text-[#5C5C5C] hover:text-[#171717]"
                }`}
              >
                Withdrawal Notice
              </button>
            </div>
          </div>

          {/* Quick Summary Pill Card */}
          <div className="p-3 bg-neutral-50 border border-neutral-200 rounded-[12px] flex items-start gap-2.5">
            <RiShieldCheckLine className="size-4.5 text-brand-dark shrink-0 mt-0.5" />
            <div className="text-[12px] leading-[17px] text-[#5C5C5C]">
              <span className="font-semibold text-[#171717] block">
                Official UKVI Compliance Notification Letter
              </span>
              This creates a formal 1-page A4 PDF on verified sponsor letterhead confirming statutory sponsorship
              cessation, SMS reference {smsReference ? `(${smsReference})` : "(pending)"}, and applicable immigration
              notice instructions.
            </div>
          </div>

          {/* Reason Selector Dropdown */}
          <div className="flex flex-col gap-1.5">
            <Label className="text-[12px] font-medium text-[#171717]">
              Grounds / Reason for Cessation <span className="text-[#FB3748]">*</span>
            </Label>
            <DropdownMenu>
              <DropdownMenuTrigger
                render={
                  <Button
                    type="button"
                    variant="outline"
                    className="w-full h-9 px-3 justify-between bg-white text-[13px] font-normal text-[#171717] border border-neutral-200 hover:bg-neutral-50 rounded-[10px] shadow-x-small cursor-pointer"
                  >
                    <span className="truncate">{selectedLabel}</span>
                    <RiArrowDownSLine className="size-4 text-[#7B7B7B] shrink-0 ml-2" />
                  </Button>
                }
              />
              <DropdownMenuContent className="w-[560px] max-w-[90vw] p-1 rounded-[12px] bg-white border border-neutral-200 shadow-card-large z-50">
                {PRESET_REASONS.map((r) => {
                  const isSelected = selectedReason === r.value;
                  return (
                    <DropdownMenuItem
                      key={r.value}
                      onClick={() => {
                        setSelectedReason(r.value);
                        if (r.value !== "other") {
                          setCustomReasonText("");
                        }
                      }}
                      className={`flex items-center justify-between px-3 py-2 text-[13px] rounded-[8px] cursor-pointer ${
                        isSelected
                          ? "bg-brand-light text-brand-dark font-medium"
                          : "text-[#171717] hover:bg-neutral-100"
                      }`}
                    >
                      <span className="truncate">{r.label}</span>
                      {isSelected && <RiCheckLine className="size-4 text-brand-dark shrink-0 ml-2" />}
                    </DropdownMenuItem>
                  );
                })}
              </DropdownMenuContent>
            </DropdownMenu>
          </div>

          {/* Conditional Custom Reason Text Input */}
          {isCustomReason && (
            <div className="flex flex-col gap-1.5">
              <Label className="text-[12px] font-medium text-[#171717]">
                Custom Statutory Cessation Reason <span className="text-[#FB3748]">*</span>
              </Label>
              <Input
                type="text"
                placeholder="Enter specific statutory grounds for curtailment or case closure..."
                value={customReasonText}
                onChange={(e) => setCustomReasonText(e.target.value)}
                className="h-9 text-[13px] rounded-[10px] border border-neutral-200 bg-white placeholder-[#A4A4A4]"
              />
            </div>
          )}

          {/* Two-Column: Dates & References */}
          <div className="grid grid-cols-2 gap-3">
            <div className="flex flex-col gap-1.5">
              <Label className="text-[12px] font-medium text-[#171717]">Effective Cessation Date</Label>
              <Input
                type="date"
                value={effectiveDate}
                onChange={(e) => setEffectiveDate(e.target.value)}
                className="h-9 text-[13px] rounded-[10px] border border-neutral-200 bg-white"
              />
            </div>
            <div className="flex flex-col gap-1.5">
              <Label className="text-[12px] font-medium text-[#171717]">Last Day of Work / Engagement</Label>
              <Input
                type="date"
                value={lastDayOfWork}
                onChange={(e) => setLastDayOfWork(e.target.value)}
                className="h-9 text-[13px] rounded-[10px] border border-neutral-200 bg-white"
              />
            </div>
          </div>

          {/* Two-Column: SMS Reference & Authorising Officer */}
          <div className="grid grid-cols-2 gap-3">
            <div className="flex flex-col gap-1.5">
              <Label className="text-[12px] font-medium text-[#171717]">UKVI SMS Report Reference</Label>
              <Input
                type="text"
                placeholder="e.g. SMS-REP-894210 (leave empty if pending)"
                value={smsReference}
                onChange={(e) => setSmsReference(e.target.value)}
                className="h-9 text-[13px] rounded-[10px] border border-neutral-200 bg-white"
              />
            </div>
            <div className="flex flex-col gap-1.5">
              <Label className="text-[12px] font-medium text-[#171717]">Authorising Officer / Signatory</Label>
              <Input
                type="text"
                placeholder="e.g. Nathan Wood"
                value={authorisingOfficer}
                onChange={(e) => setAuthorisingOfficer(e.target.value)}
                className="h-9 text-[13px] rounded-[10px] border border-neutral-200 bg-white"
              />
            </div>
          </div>

          {/* Signatory Role */}
          <div className="flex flex-col gap-1.5">
            <Label className="text-[12px] font-medium text-[#171717]">Signatory Title & Role</Label>
            <Input
              type="text"
              placeholder="e.g. Compliance Manager & Level 1 User"
              value={officerRole}
              onChange={(e) => setOfficerRole(e.target.value)}
              className="h-9 text-[13px] rounded-[10px] border border-neutral-200 bg-white"
            />
          </div>

          {/* Additional Notes Textarea */}
          <div className="flex flex-col gap-1.5">
            <Label className="text-[12px] font-medium text-[#171717]">
              Additional Circumstances / Compliance Notes <span className="text-[#7B7B7B] font-normal">(Optional)</span>
            </Label>
            <Textarea
              placeholder="Add specific notes, e.g. Early production wrap on set, flight booking confirmed for departure..."
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              className="min-h-[72px] text-[13px] rounded-[10px] border border-neutral-200 resize-none bg-white placeholder-[#A4A4A4]"
            />
          </div>
        </div>

        {/* Footer */}
        <div className="px-6 py-3.5 border-t border-neutral-200 bg-[#FAFAFA] flex items-center justify-between shrink-0">
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
            disabled={downloading || !isFormValid}
            onClick={handleDownload}
            className="h-8.5 px-5 rounded-full text-[13px] font-medium bg-brand-medium hover:bg-brand-dark text-white shadow-2xs flex items-center gap-1.5 transition-all cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed"
          >
            <RiDownload2Line className="size-4" />
            <span>{downloading ? "Generating PDF..." : "Download Letter (PDF)"}</span>
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}

