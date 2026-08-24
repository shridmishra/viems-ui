/**
 * Appendix D Document Completeness Checker
 * 
 * Enforces Home Office UKVI Appendix D record-keeping essentials prior to
 * Certificate of Sponsorship (CoS) issuance/assignment.
 * 
 * Required essentials:
 * 1. Passport (Migrant passport / travel document identity copy)
 * 2. Union engagement letter/consultation (Union consultation letter / engagement letter)
 * 3. Full production itinerary (Complete itinerary of events / filming schedule)
 * 4. Signed contract showing compliant fee/pay structure (Executed contract / fee structure)
 */

export type AppendixDEssentialKey =
  | "passport"
  | "union_letter"
  | "itinerary"
  | "signed_contract";

export interface AppendixDEssentialDefinition {
  key: AppendixDEssentialKey;
  name: string;
  shortName: string;
  description: string;
  complianceRule: string;
  defaultFolder: string;
  categoryTag: string;
}

export const APPENDIX_D_DEFINITIONS: AppendixDEssentialDefinition[] = [
  {
    key: "passport",
    name: "Passport (Identity Page Scan)",
    shortName: "Passport",
    description: "Valid copy of migrant's current passport or travel document identity pages.",
    complianceRule: "Appendix D, Part 1: Mandatory identification & nationality proof",
    defaultFolder: "Appendix D",
    categoryTag: "passport",
  },
  {
    key: "union_letter",
    name: "Union Engagement Letter / Consultation",
    shortName: "Union Consultation Letter",
    description: "Union consultation/engagement letter (Equity, Musicians' Union, BECTU, or promoter consultation).",
    complianceRule: "Appendix D, Creative Worker / Code of Practice union endorsement",
    defaultFolder: "Appendix D",
    categoryTag: "union_consultation",
  },
  {
    key: "itinerary",
    name: "Full Production Itinerary",
    shortName: "Production Itinerary",
    description: "Comprehensive schedule of performances, filming, venues, dates, and locations in the UK.",
    complianceRule: "Appendix D, Section 3: Timeframe, venue engagement & itinerary evidence",
    defaultFolder: "Appendix D",
    categoryTag: "itinerary",
  },
  {
    key: "signed_contract",
    name: "Signed Contract (Compliant Fee / Pay Structure)",
    shortName: "Signed Contract",
    description: "Fully executed contract or deal memo showing compliant fee/salary structure meeting UKVI going rate.",
    complianceRule: "Appendix D, Section 2: Statutory minimum remuneration & contract compliance",
    defaultFolder: "Appendix D",
    categoryTag: "contract",
  },
];

export interface AttachedFileInfo {
  id?: string | number;
  name: string;
  filename?: string;
  size?: string | number;
  date?: string;
  fileUrl?: string;
  category?: string;
}

export interface AppendixDEssentialItem extends AppendixDEssentialDefinition {
  isAttached: boolean;
  attachedFile?: AttachedFileInfo;
}

export interface AppendixDCheckResult {
  isComplete: boolean;
  totalCount: number;
  attachedCount: number;
  missingCount: number;
  essentials: AppendixDEssentialItem[];
  missingEssentials: AppendixDEssentialItem[];
  attachedEssentials: AppendixDEssentialItem[];
}

/**
 * Checks if a status string represents "CoS Assigned" / "CoS Issued"
 */
export function isCosAssignedStatus(status: string | null | undefined): boolean {
  if (!status) return false;
  const norm = status.toLowerCase().replace(/[-_]/g, " ").trim();
  return (
    norm === "cos assigned" ||
    norm === "cos assigned status" ||
    norm === "assigned" ||
    norm === "cos issued" ||
    norm === "issued" ||
    norm.startsWith("cos assigned") ||
    norm.startsWith("cos_assigned")
  );
}

/**
 * Evaluates whether a generic file matches a specific Appendix D essential
 */
function fileMatchesEssential(file: any, key: AppendixDEssentialKey): boolean {
  if (!file) return false;

  const rawType = (
    file.filetype?.value ||
    file.filetype?.title ||
    file.file_type ||
    file.category ||
    file.folderName ||
    ""
  ).toLowerCase();

  const rawName = (
    file.originalName ||
    file.filename ||
    file.name ||
    file.title ||
    ""
  ).toLowerCase();

  switch (key) {
    case "passport": {
      return (
        rawType.includes("passport") ||
        rawType === "migrantpassport" ||
        rawName.includes("passport")
      );
    }
    case "union_letter": {
      return (
        rawType.includes("union") ||
        rawType === "letterfrompromoter" ||
        rawType === "letterfromleadapplicant" ||
        rawType === "letterfromproductionhouse" ||
        rawType.includes("consultation") ||
        rawName.includes("union") ||
        rawName.includes("consultation") ||
        rawName.includes("equity") ||
        rawName.includes("bectu") ||
        rawName.includes("musicians") ||
        rawName.includes("promoter letter") ||
        rawName.includes("production letter") ||
        rawName.includes("letter from promoter") ||
        rawName.includes("letter from production")
      );
    }
    case "itinerary": {
      return (
        rawType === "itineraryofevents" ||
        rawType === "filmingschedule" ||
        rawType === "posterfortheevent" ||
        rawType.includes("itinerary") ||
        rawType.includes("schedule") ||
        rawName.includes("itinerary") ||
        rawName.includes("filming schedule") ||
        rawName.includes("production schedule") ||
        rawName.includes("schedule of event") ||
        rawName.includes("tour schedule")
      );
    }
    case "signed_contract": {
      return (
        rawType === "agreementbetweeneventimmpromoter" ||
        rawType === "agreementbetweeneventimmproduction" ||
        rawType === "employee_contract" ||
        rawType === "fixed_term_contract" ||
        rawType.includes("contract") ||
        rawType.includes("agreement") ||
        rawType.includes("fee_structure") ||
        rawName.includes("contract") ||
        rawName.includes("agreement") ||
        rawName.includes("fee structure") ||
        rawName.includes("pay structure") ||
        rawName.includes("deal memo") ||
        rawName.includes("signed contract") ||
        rawName.includes("employment contract")
      );
    }
    default:
      return false;
  }
}

/**
 * Checks Appendix D document completeness for a case or migrant
 */
export function checkAppendixDCompleteness(
  files: any[] = [],
  migrant?: any,
  caseData?: any
): AppendixDCheckResult {
  const safeFiles = Array.isArray(files) ? files : [];

  const essentials: AppendixDEssentialItem[] = APPENDIX_D_DEFINITIONS.map((def) => {
    // Look for matching file in files list
    const matchingFile = safeFiles.find((f) => fileMatchesEssential(f, def.key));

    if (matchingFile) {
      return {
        ...def,
        isAttached: true,
        attachedFile: {
          id: matchingFile.id,
          name: matchingFile.originalName || matchingFile.filename || matchingFile.name || def.name,
          filename: matchingFile.filename || matchingFile.originalName || matchingFile.name,
          size: matchingFile.size,
          date: matchingFile.uploadDate || matchingFile.createdAt || matchingFile.date,
          fileUrl: matchingFile.fileUrl || matchingFile.url,
          category: matchingFile.category || def.categoryTag,
        },
      };
    }

    // Special check for passport in migrant details
    if (def.key === "passport") {
      const hasPassportNumber = Boolean(
        (migrant?.passport?.number && migrant.passport.number !== "—" && migrant.passport.number !== "") ||
        (caseData?.passport?.number && caseData.passport.number !== "—" && caseData.passport.number !== "") ||
        (caseData?.passportNumber && caseData.passportNumber !== "—" && caseData.passportNumber !== "")
      );

      const hasPassportAttachment = Boolean(
        migrant?.passport?.file ||
        migrant?.passportFile ||
        caseData?.passportFile ||
        caseData?.files?.some((f: any) => fileMatchesEssential(f, "passport"))
      );

      if (hasPassportAttachment || (hasPassportNumber && safeFiles.some((f) => fileMatchesEssential(f, "passport")))) {
        return {
          ...def,
          isAttached: true,
          attachedFile: {
            name: `${migrant?.personalInfo?.lastName || "Migrant"}_Passport.pdf`,
            category: "passport",
          },
        };
      }
    }

    return {
      ...def,
      isAttached: false,
      attachedFile: undefined,
    };
  });

  const missingEssentials = essentials.filter((e) => !e.isAttached);
  const attachedEssentials = essentials.filter((e) => e.isAttached);

  return {
    isComplete: missingEssentials.length === 0,
    totalCount: essentials.length,
    attachedCount: attachedEssentials.length,
    missingCount: missingEssentials.length,
    essentials,
    missingEssentials,
    attachedEssentials,
  };
}
