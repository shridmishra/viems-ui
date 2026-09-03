import { jsPDF } from "jspdf";

// ==========================================
// CONSTANTS & PALETTE (Matching VIEMS Theme)
// ==========================================
const COLOR = {
  textDark: "#171717",
  textMuted: "#5C5C5C",
  textLight: "#7B7B7B",
  border: "#EBEBEB",
  cardBg: "#FAFAFA",
  white: "#FFFFFF",
  brandPurple: "#335CFF",
  successBg: "#E3F7EC",
  successText: "#0B4627",
  warningBg: "#FFFAEB",
  warningText: "#B45309",
  errorBg: "#FFEBEC",
  errorText: "#FB3748",
  infoBg: "#F0F4FF",
  infoText: "#1E40AF",
  tableHeaderBg: "#F5F5F5",
};

// ==========================================
// HELPER DRAWING PRIMITIVES (A4: 210 x 297 mm)
// ==========================================

let cachedLogoDataUrl: string | null = null;

/**
 * Generates a crisp, high-resolution raster data URL of the official Viems brand logo
 * (converging purple wings icon from Group 636 + "viems" Aeonik brand typography).
 */
function getViemsLogoDataUrl(): string {
  if (cachedLogoDataUrl) return cachedLogoDataUrl;
  if (typeof document === "undefined") return "";

  try {
    const scale = 4; // 4x for retina print resolution
    const width = 140 * scale;
    const height = 36 * scale;
    const canvas = document.createElement("canvas");
    canvas.width = width;
    canvas.height = height;
    const ctx = canvas.getContext("2d");
    if (!ctx) return "";

    ctx.scale(scale, scale);

    // 1. Draw Brand Purple Converging Wings Logo Icon (#7D52F4)
    ctx.fillStyle = "#7D52F4";
    ctx.save();
    // Native SVG size is 41 x 33. We scale to height 24px (ratio: 24/33 = 0.7272, width = ~30px)
    const iconScale = 24 / 33;
    ctx.translate(0, 6);
    ctx.scale(iconScale, iconScale);

    const leftWing = new Path2D(
      "M0.0674336 0.715702L18.51 32.3517C18.7538 32.7698 19.3936 32.5969 19.3936 32.113V17.7509C19.3936 13.7628 17.3053 10.066 13.8896 8.00732L0.721635 0.0709877C0.301304 -0.182343 -0.179734 0.291718 0.0674336 0.715702Z"
    );
    const rightWing = new Path2D(
      "M40.9326 0.715702L22.49 32.3517C22.2462 32.7698 21.6064 32.5969 21.6064 32.113V17.7509C21.6064 13.7628 23.6947 10.066 27.1104 8.00732L40.2784 0.0709877C40.6987 -0.182343 41.1797 0.291718 40.9326 0.715702Z"
    );
    ctx.fill(leftWing);
    ctx.fill(rightWing);
    ctx.restore();

    // 2. Draw "viems" Brand Typography (Aeonik / Helvetica)
    ctx.fillStyle = "#171717";
    ctx.font = "bold 24px Aeonik, -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif";
    ctx.textBaseline = "middle";
    ctx.fillText("viems", 36, 18);

    cachedLogoDataUrl = canvas.toDataURL("image/png");
    return cachedLogoDataUrl;
  } catch (err) {
    console.error("Failed to generate Viems logo data URL:", err);
    return "";
  }
}

function drawViemsLogo(doc: jsPDF, x: number, y: number, w: number = 28, h: number = 7.2) {
  try {
    const logoDataUrl = getViemsLogoDataUrl();
    if (logoDataUrl) {
      doc.addImage(logoDataUrl, "PNG", x, y, w, h);
      return;
    }
  } catch (e) {
    console.error("Failed to render logo image:", e);
  }

  // Fallback vector drawing if canvas is unavailable
  doc.setFillColor(125, 82, 244); // #7D52F4
  doc.triangle(x, y + 1, x + 3.5, y + 6.5, x - 3.5, y + 6.5, "F");
  doc.triangle(x + 3.5, y + 1, x + 7, y + 6.5, x, y + 6.5, "F");

  doc.setFont("helvetica", "bold");
  doc.setFontSize(14);
  doc.setTextColor(23, 23, 23);
  doc.text("viems", x + 9, y + 6);
}

function drawHeader(doc: jsPDF, pageNum: number, totalPages: number) {
  drawViemsLogo(doc, 15, 12, 28, 7.2);

  // Page Indicator (e.g. "02 / 07")
  doc.setFont("helvetica", "normal");
  doc.setFontSize(9);
  doc.setTextColor(92, 92, 92);
  const pageStr = `${String(pageNum).padStart(2, "0")} / ${String(totalPages).padStart(2, "0")}`;
  doc.text(pageStr, 195, 18, { align: "right" });

  doc.setDrawColor(235, 235, 235);
  doc.setLineWidth(0.3);
  doc.line(15, 24, 195, 24);
}

function drawFooter(doc: jsPDF, refCode: string, pageNum: number, totalPages: number) {
  doc.setDrawColor(235, 235, 235);
  doc.setLineWidth(0.3);
  doc.line(15, 282, 195, 282);

  doc.setFont("helvetica", "normal");
  doc.setFontSize(7.5);
  doc.setTextColor(123, 123, 123);
  doc.text("CONFIDENTIAL • Viems compliance workspace", 15, 287);
  doc.text(
    `${refCode} • Page ${pageNum} of ${totalPages}`,
    195,
    287,
    { align: "right" }
  );
}

function drawBadge(
  doc: jsPDF,
  x: number,
  y: number,
  label: string,
  variant: "success" | "warning" | "error" | "info" | "purple" = "success"
) {
  let bg = [227, 247, 236]; // #E3F7EC
  let text = [11, 70, 39]; // #0B4627

  if (variant === "warning") {
    bg = [255, 250, 235];
    text = [180, 83, 9];
  } else if (variant === "error") {
    bg = [255, 235, 236];
    text = [251, 55, 72];
  } else if (variant === "info") {
    bg = [240, 244, 255];
    text = [30, 64, 175];
  } else if (variant === "purple") {
    bg = [243, 232, 255];
    text = [107, 33, 168];
  }

  doc.setFont("helvetica", "bold");
  doc.setFontSize(7.5);
  const textWidth = doc.getTextWidth(label);
  const pillW = textWidth + 8;
  const pillH = 5.5;

  doc.setFillColor(bg[0], bg[1], bg[2]);
  doc.roundedRect(x, y, pillW, pillH, 2.5, 2.5, "F");

  doc.setTextColor(text[0], text[1], text[2]);
  doc.text(label, x + 4, y + 4);
  return pillW;
}

function drawCard(
  doc: jsPDF,
  x: number,
  y: number,
  w: number,
  h: number,
  fillColor = [255, 255, 255]
) {
  doc.setFillColor(fillColor[0], fillColor[1], fillColor[2]);
  doc.setDrawColor(235, 235, 235);
  doc.setLineWidth(0.4);
  doc.roundedRect(x, y, w, h, 3, 3, "FD");
}

function drawMetricTile(
  doc: jsPDF,
  x: number,
  y: number,
  w: number,
  h: number,
  title: string,
  value: string | number,
  subtitle: string,
  bgTint: [number, number, number] = [255, 255, 255]
) {
  drawCard(doc, x, y, w, h, bgTint);

  doc.setFont("helvetica", "bold");
  doc.setFontSize(7);
  doc.setTextColor(92, 92, 92);
  doc.text(title.toUpperCase(), x + 4, y + 6);

  doc.setFont("helvetica", "bold");
  doc.setFontSize(16);
  doc.setTextColor(23, 23, 23);
  doc.text(String(value), x + 4, y + 15);

  doc.setFont("helvetica", "normal");
  doc.setFontSize(7);
  doc.setTextColor(123, 123, 123);
  doc.text(subtitle, x + 4, y + 20);
}

function drawTable(
  doc: jsPDF,
  x: number,
  y: number,
  w: number,
  cols: { header: string; width: number; align?: "left" | "right" | "center" }[],
  rows: (string | { text: string; badge?: "success" | "warning" | "error" | "info" | "purple" })[][],
  options?: { pageNum?: number; totalPages?: number; refCode?: string }
): number {
  const rowH = 7;
  const pageBottomLimit = 275;

  const renderTableHeader = (headerY: number) => {
    doc.setFillColor(245, 245, 245);
    doc.rect(x, headerY, w, rowH, "F");

    doc.setFont("helvetica", "bold");
    doc.setFontSize(7);
    doc.setTextColor(92, 92, 92);

    let curX = x + 3;
    cols.forEach((c) => {
      doc.text(c.header.toUpperCase(), curX, headerY + 4.5);
      curX += c.width;
    });
  };

  renderTableHeader(y);

  let curY = y + rowH;
  rows.forEach((row, rIdx) => {
    if (curY + rowH > pageBottomLimit) {
      doc.addPage();
      if (options?.pageNum && options?.totalPages) {
        drawHeader(doc, options.pageNum, options.totalPages);
        if (options.refCode) {
          drawFooter(doc, options.refCode, options.pageNum, options.totalPages);
        }
      }
      curY = 35;
      renderTableHeader(curY);
      curY += rowH;
    }

    if (rIdx % 2 === 1) {
      doc.setFillColor(250, 250, 250);
      doc.rect(x, curY, w, rowH, "F");
    }
    doc.setDrawColor(240, 240, 240);
    doc.line(x, curY + rowH, x + w, curY + rowH);

    let curX = x + 3;
    row.forEach((cell, cIdx) => {
      const colWidth = cols[cIdx]?.width || 30;
      if (typeof cell === "object" && cell.badge) {
        drawBadge(doc, curX, curY + 1.5, cell.text, cell.badge);
      } else {
        doc.setFont("helvetica", "normal");
        doc.setFontSize(7.5);
        doc.setTextColor(23, 23, 23);
        const cellText = typeof cell === "object" ? cell.text : String(cell ?? "—");
        doc.text(cellText, curX, curY + 4.8);
      }
      curX += colWidth;
    });
    curY += rowH;
  });

  return curY;
}

function drawEvidenceCard(
  doc: jsPDF,
  x: number,
  y: number,
  w: number,
  h: number,
  evidenceTitle: string,
  isAttached: boolean,
  fields: { label: string; value: string }[],
  notes: string,
  fileName: string,
  reviewedBy: string
) {
  drawCard(doc, x, y, w, h, [255, 255, 255]);

  // Card Header: Title + Attached Badge
  doc.setFont("helvetica", "bold");
  doc.setFontSize(11);
  doc.setTextColor(23, 23, 23);
  doc.text(evidenceTitle, x + 6, y + 8);

  drawBadge(
    doc,
    x + w - 30,
    y + 4.5,
    isAttached ? "ATTACHED" : "MISSING",
    isAttached ? "success" : "error"
  );

  // Key-Value Grid (2 columns)
  const fX1 = x + 6;
  const fX2 = x + w / 2 + 2;
  let fY = y + 16;

  for (let i = 0; i < fields.length; i += 2) {
    const f1 = fields[i];
    const f2 = fields[i + 1];

    if (f1) {
      doc.setFont("helvetica", "bold");
      doc.setFontSize(6.5);
      doc.setTextColor(123, 123, 123);
      doc.text(f1.label.toUpperCase(), fX1, fY);

      doc.setFont("helvetica", "bold");
      doc.setFontSize(8);
      doc.setTextColor(23, 23, 23);
      doc.text(f1.value || "—", fX1, fY + 4);
    }

    if (f2) {
      doc.setFont("helvetica", "bold");
      doc.setFontSize(6.5);
      doc.setTextColor(123, 123, 123);
      doc.text(f2.label.toUpperCase(), fX2, fY);

      doc.setFont("helvetica", "bold");
      doc.setFontSize(8);
      doc.setTextColor(23, 23, 23);
      doc.text(f2.value || "—", fX2, fY + 4);
    }

    fY += 10;
  }

  // Thumbnail / Sample box + Notes
  const thumbY = Math.max(fY + 2, y + 42);
  const thumbW = 44;
  const thumbH = 24;

  // Thumbnail box
  doc.setFillColor(245, 245, 245);
  doc.setDrawColor(220, 220, 220);
  doc.roundedRect(x + 6, thumbY, thumbW, thumbH, 2, 2, "FD");

  doc.setFont("helvetica", "bold");
  doc.setFontSize(6);
  doc.setTextColor(92, 92, 92);
  doc.text(evidenceTitle.toUpperCase(), x + 8, thumbY + 5);

  doc.setFont("helvetica", "bold");
  doc.setFontSize(7);
  doc.setTextColor(180, 180, 180);
  doc.text("SAMPLE - NOT VALID", x + 8, thumbY + 14);

  // Notes on the right of the thumbnail
  const notesX = x + 6 + thumbW + 6;
  doc.setFont("helvetica", "bold");
  doc.setFontSize(6.5);
  doc.setTextColor(123, 123, 123);
  doc.text("EVIDENCE NOTES", notesX, thumbY + 4);

  doc.setFont("helvetica", "normal");
  doc.setFontSize(7.5);
  doc.setTextColor(92, 92, 92);
  const splitNotes = doc.splitTextToSize(notes, w - (thumbW + 20));
  doc.text(splitNotes, notesX, thumbY + 9);

  // File metadata footer in card
  doc.setFont("helvetica", "bold");
  doc.setFontSize(7);
  doc.setTextColor(23, 23, 23);
  doc.text(`File: ${fileName}`, notesX, thumbY + 19);

  doc.setFont("helvetica", "normal");
  doc.setFontSize(7);
  doc.setTextColor(123, 123, 123);
  doc.text(`Reviewed: ${reviewedBy}`, notesX, thumbY + 23);
}

// ==========================================
// 1. ORGANISATION COMPLIANCE REPORT (7 PAGES)
// ==========================================

export interface OrganisationReportData {
  companyName?: string;
  sponsorLicence?: string;
  businessSector?: string;
  registeredAddress?: string;
  authorisingOfficer?: string;
  lastAuditDate?: string;
  statusComplete?: boolean;
  refNumber?: string;
  generatedDate?: string;
  cosAllocation?: {
    requested: number;
    allocated: number;
    assigned: number;
    used: number;
    withdrawn: number;
    cancelled: number;
    justification?: string;
    exampleCoS?: {
      reference: string;
      worker: string;
      route: string;
      status: string;
      startDate: string;
    }[];
  };
  smsUsers?: {
    person: string;
    access: string;
    responsibility: string;
    status: string;
  }[];
  evidenceRecords?: {
    title: string;
    isAttached: boolean;
    fields: { label: string; value: string }[];
    notes: string;
    fileName: string;
    reviewed: string;
  }[];
}

export function generateOrganisationComplianceReport(
  data?: Partial<OrganisationReportData>
): jsPDF {
  const doc = new jsPDF({
    orientation: "portrait",
    unit: "mm",
    format: "a4",
  });

  const company = data?.companyName || "ENT Imm";
  const licence = data?.sponsorLicence || "ENT1234567";
  const sector = data?.businessSector || "Creative sector / live events";
  const address = data?.registeredAddress || "18 Soho Square, London W1D 3QL";
  const ao = data?.authorisingOfficer || "Alex Marin - Authorising Officer";
  const auditDate = data?.lastAuditDate || "14 May 2026";
  const refCode = data?.refNumber || "OCR-20260803-ENTIMM-FULL";
  const genDate = data?.generatedDate || "3 Aug 2026 - 13:31";
  const isComplete = data?.statusComplete ?? true;

  const defaultOrgEvidence = [
    // Page 5: Sponsor Licence & CoS Allocation Letter
    {
      title: "Sponsor licence",
      isAttached: true,
      fields: [
        { label: "Organisation", value: company },
        { label: "Licence Number", value: licence },
        { label: "Routes", value: "Worker / Temporary Worker" },
        { label: "Status", value: "Active" },
        { label: "Authorising Officer", value: "Alex Marin" },
        { label: "Expiry / Review", value: "30 Jun 2027" },
      ],
      notes: "Sponsor licence record and authorised organisation details.",
      fileName: "sponsor_licence.pdf",
      reviewed: "3 Aug 2026 by Alex Marin",
    },
    {
      title: "CoS allocation letter",
      isAttached: true,
      fields: [
        { label: "Allocation Year", value: "2026/27" },
        { label: "Route", value: "Creative Worker" },
        { label: "Requested", value: "12" },
        { label: "Allocated", value: "10" },
        { label: "Decision Date", value: "1 Jul 2026" },
        { label: "Reference", value: "ALLOC-ENT-260701" },
      ],
      notes: "Allocation decision reconciled to the internal CoS ledger.",
      fileName: "cos_allocation_letter.pdf",
      reviewed: "3 Aug 2026 by Alex Marin",
    },
    // Page 6: CoS Ledger Extract & SOP Manual
    {
      title: "CoS ledger extract",
      isAttached: true,
      fields: [
        { label: "Ledger Period", value: "Jul-Aug 2026" },
        { label: "Allocated", value: "10" },
        { label: "Assigned", value: "6" },
        { label: "Used", value: "5" },
        { label: "Withdrawn", value: "1" },
        { label: "Cancelled", value: "0" },
      ],
      notes: "Detailed ledger includes worker, project, assignment and status references.",
      fileName: "cos_ledger_extract.pdf",
      reviewed: "3 Aug 2026 by Alex Marin",
    },
    {
      title: "SOP manual",
      isAttached: true,
      fields: [
        { label: "Document", value: "Sponsor compliance SOP" },
        { label: "Version", value: "2.1" },
        { label: "Owner", value: "Alex Marin" },
        { label: "Approved", value: "1 Jul 2026" },
        { label: "Next Review", value: "1 Jan 2027" },
        { label: "Controls", value: "RTW, records, reporting" },
      ],
      notes: "Policy covers identity checks, record retention, attendance and the 10-day reporting window.",
      fileName: "ENT_Imm_Sponsor_Compliance_SOP.pdf",
      reviewed: "3 Aug 2026 by Alex Marin",
    },
    // Page 7: SMS Access Register & UKVI Audit Correspondence
    {
      title: "SMS access register",
      isAttached: true,
      fields: [
        { label: "System", value: "Sponsor Management System" },
        { label: "Level 1 Users", value: "2" },
        { label: "Primary User", value: "Alex Marin" },
        { label: "Secondary User", value: "Priya Shah" },
        { label: "Last Review", value: "3 Aug 2026" },
        { label: "Next Review", value: "3 Nov 2026" },
      ],
      notes: "Access reviewed against current responsibilities; leaver and privilege checks recorded.",
      fileName: "ENT_Imm_SMS_access_register.pdf",
      reviewed: "3 Aug 2026 by Alex Marin",
    },
    {
      title: "UKVI audit correspondence",
      isAttached: true,
      fields: [
        { label: "Audit Date", value: "14 May 2026" },
        { label: "Reference", value: "UKVI-AUD-ENT-140526" },
        { label: "Reviewer", value: "UKVI Compliance Team" },
        { label: "Outcome", value: "No action required" },
        { label: "Actions Raised", value: "0" },
        { label: "Closed", value: "14 May 2026" },
      ],
      notes: "Audit correspondence retained with findings and action closure evidence.",
      fileName: "ukvi_audit_correspondence.pdf",
      reviewed: "3 Aug 2026 by Alex Marin",
    },
  ];

  const evidenceList = data?.evidenceRecords && data.evidenceRecords.length > 0 ? data.evidenceRecords : defaultOrgEvidence;
  const evidencePagesCount = Math.max(1, Math.ceil(evidenceList.length / 2));
  const totalPages = 4 + evidencePagesCount;

  // ----------------------------------------------------
  // PAGE 1: COVER
  // ----------------------------------------------------
  drawHeader(doc, 1, totalPages);

  drawBadge(doc, 15, 34, "FULL DETAILS", "purple");

  doc.setFont("helvetica", "bold");
  doc.setFontSize(26);
  doc.setTextColor(23, 23, 23);
  doc.text("Organisation Compliance Report", 15, 48);

  doc.setFont("helvetica", "normal");
  doc.setFontSize(11);
  doc.setTextColor(92, 92, 92);
  doc.text("Clear, audit-ready evidence from your Viems compliance workspace.", 15, 56);

  // Big Subject Box
  drawCard(doc, 15, 110, 180, 75, [255, 255, 255]);

  doc.setFont("helvetica", "bold");
  doc.setFontSize(7.5);
  doc.setTextColor(123, 123, 123);
  doc.text("REPORT SUBJECT", 23, 122);

  doc.setFont("helvetica", "bold");
  doc.setFontSize(22);
  doc.setTextColor(23, 23, 23);
  doc.text(company, 23, 134);

  doc.setFont("helvetica", "normal");
  doc.setFontSize(10);
  doc.setTextColor(92, 92, 92);
  doc.text(`Sponsor Licence: ${licence}`, 23, 142);
  doc.text("Organisation compliance file", 23, 149);

  drawBadge(
    doc,
    23,
    155,
    isComplete ? "EVIDENCE COMPLETE" : "EVIDENCE INCOMPLETE",
    isComplete ? "success" : "warning"
  );

  doc.setFont("helvetica", "bold");
  doc.setFontSize(7);
  doc.setTextColor(123, 123, 123);
  doc.text("REPORT REFERENCE", 23, 172);
  doc.text("GENERATED", 150, 172);

  doc.setFont("helvetica", "bold");
  doc.setFontSize(8.5);
  doc.setTextColor(23, 23, 23);
  doc.text(refCode, 23, 177);
  doc.text(genDate, 150, 177);

  // Disclaimer at bottom
  doc.setFont("helvetica", "bold");
  doc.setFontSize(7.5);
  doc.setTextColor(92, 92, 92);
  doc.text("CONFIDENTIAL", 15, 260);

  doc.setFont("helvetica", "normal");
  doc.setFontSize(7);
  doc.setTextColor(123, 123, 123);
  doc.text(
    "Contains personal and employment data. Share only with authorised recipients for legitimate HR, compliance and audit purposes.",
    15,
    265
  );

  drawFooter(doc, refCode, 1, totalPages);

  // ----------------------------------------------------
  // PAGE 2: SPONSOR & AUDIT PROFILE
  // ----------------------------------------------------
  doc.addPage();
  drawHeader(doc, 2, totalPages);

  doc.setFont("helvetica", "bold");
  doc.setFontSize(18);
  doc.setTextColor(23, 23, 23);
  doc.text("Sponsor and audit profile", 15, 34);

  doc.setFont("helvetica", "normal");
  doc.setFontSize(9);
  doc.setTextColor(92, 92, 92);
  doc.text(`Master record for ${company}'s sponsor compliance position.`, 15, 40);

  doc.setFont("helvetica", "bold");
  doc.setFontSize(8);
  doc.text(refCode, 195, 34, { align: "right" });
  drawBadge(doc, 160, 38, "EVIDENCE COMPLETE", "success");

  // Callout banner
  drawCard(doc, 15, 48, 180, 12, [240, 253, 244]);
  doc.setFont("helvetica", "bold");
  doc.setFontSize(8);
  doc.setTextColor(11, 70, 39);
  doc.text("•  Full Details", 20, 55);
  doc.setFont("helvetica", "normal");
  doc.setFontSize(7.5);
  doc.setTextColor(92, 92, 92);
  doc.text(
    "Illustrative information is paired with sample evidence visuals. None of the thumbnails are valid official documents.",
    40,
    55
  );

  // Sponsor Profile Box
  doc.setFont("helvetica", "bold");
  doc.setFontSize(12);
  doc.setTextColor(23, 23, 23);
  doc.text("Sponsor profile", 15, 70);

  drawCard(doc, 15, 74, 180, 68, [255, 255, 255]);
  doc.setFont("helvetica", "bold");
  doc.setFontSize(7);
  doc.setTextColor(123, 123, 123);
  doc.text("ORGANISATION", 22, 82);

  const profileRows = [
    { label: "Company name", value: company },
    { label: "Sponsor licence number", value: licence },
    { label: "Business sector", value: sector },
    { label: "Registered address", value: address },
    { label: "Authorising officer / key contact", value: ao },
    { label: "Last UKVI audit date", value: auditDate },
  ];

  let pY = 90;
  profileRows.forEach((r) => {
    doc.setFont("helvetica", "normal");
    doc.setFontSize(8);
    doc.setTextColor(92, 92, 92);
    doc.text(r.label, 22, pY);

    doc.setFont("helvetica", "bold");
    doc.setTextColor(23, 23, 23);
    doc.text(r.value, 188, pY, { align: "right" });
    pY += 8;
  });

  // Evidence Inventory
  doc.setFont("helvetica", "bold");
  doc.setFontSize(12);
  doc.setTextColor(23, 23, 23);
  doc.text("Evidence inventory", 15, 154);

  drawMetricTile(doc, 15, 160, 56, 24, "Documents Attached", "6", "Organisation evidence", [240, 253, 244]);
  drawMetricTile(doc, 77, 160, 56, 24, "Documents Missing", "0", "Requires follow-up", [255, 255, 255]);
  drawMetricTile(doc, 139, 160, 56, 24, "SMS Register", "Recorded", "Access review evidence", [240, 253, 244]);

  drawFooter(doc, refCode, 2, totalPages);

  // ----------------------------------------------------
  // PAGE 3: CERTIFICATE OF SPONSORSHIP LEDGER
  // ----------------------------------------------------
  doc.addPage();
  drawHeader(doc, 3, totalPages);

  doc.setFont("helvetica", "bold");
  doc.setFontSize(18);
  doc.setTextColor(23, 23, 23);
  doc.text("Certificate of Sponsorship ledger", 15, 34);

  doc.setFont("helvetica", "normal");
  doc.setFontSize(9);
  doc.setTextColor(92, 92, 92);
  doc.text("Allocation, usage and business justification.", 15, 40);

  doc.setFont("helvetica", "bold");
  doc.setFontSize(8);
  doc.text(refCode, 195, 34, { align: "right" });
  drawBadge(doc, 160, 38, "EVIDENCE COMPLETE", "success");

  // CoS Allocation metrics (2 rows of 3)
  doc.setFont("helvetica", "bold");
  doc.setFontSize(12);
  doc.setTextColor(23, 23, 23);
  doc.text("CoS allocation and usage", 15, 52);

  const cos = data?.cosAllocation || {
    requested: 12,
    allocated: 10,
    assigned: 6,
    used: 5,
    withdrawn: 1,
    cancelled: 0,
  };

  drawMetricTile(doc, 15, 57, 56, 22, "Requested", cos.requested, "Certificates", [255, 250, 255]);
  drawMetricTile(doc, 77, 57, 56, 22, "Allocated", cos.allocated, "Certificates", [240, 245, 255]);
  drawMetricTile(doc, 139, 57, 56, 22, "Assigned", cos.assigned, "Certificates", [243, 232, 255]);

  drawMetricTile(doc, 15, 83, 56, 22, "Used", cos.used, "Certificates", [240, 253, 244]);
  drawMetricTile(doc, 77, 83, 56, 22, "Withdrawn", cos.withdrawn, "Certificates", [255, 250, 235]);
  drawMetricTile(doc, 139, 83, 56, 22, "Cancelled", cos.cancelled, "Certificates", [255, 235, 236]);

  // Business Justification
  doc.setFont("helvetica", "bold");
  doc.setFontSize(12);
  doc.setTextColor(23, 23, 23);
  doc.text("Business justification", 15, 116);

  drawCard(doc, 15, 121, 180, 36, [255, 255, 255]);
  doc.setFont("helvetica", "normal");
  doc.setFontSize(8);
  doc.setTextColor(92, 92, 92);
  const justText =
    cos.justification ||
    "The allocation supports confirmed international artists and specialist crew for destination events, touring productions and audiovisual shoots scheduled between September 2026 and March 2027. Roles require established creative profiles and production-specific experience not available in the existing UK project team.";
  const splitJust = doc.splitTextToSize(justText, 168);
  doc.text(splitJust, 21, 131);

  // Example assigned CoS Table
  doc.setFont("helvetica", "bold");
  doc.setFontSize(12);
  doc.setTextColor(23, 23, 23);
  doc.text("Example assigned CoS", 15, 168);

  const cosTableCols = [
    { header: "Reference", width: 34 },
    { header: "Worker", width: 38 },
    { header: "Route", width: 44 },
    { header: "Status", width: 34 },
    { header: "Start", width: 30 },
  ];

  const cosTableRows = [
    [
      "C5K8M2P7Q",
      "Alex Marin",
      "Creative Worker",
      { text: "ASSIGNED", badge: "success" as const },
      "16 Jul 2026",
    ],
  ];

  drawTable(doc, 15, 173, 180, cosTableCols, cosTableRows);

  drawFooter(doc, refCode, 3, totalPages);

  // ----------------------------------------------------
  // PAGE 4: SOP DECLARATIONS & SMS ACCESS
  // ----------------------------------------------------
  doc.addPage();
  drawHeader(doc, 4, totalPages);

  doc.setFont("helvetica", "bold");
  doc.setFontSize(18);
  doc.setTextColor(23, 23, 23);
  doc.text("SOP declarations and SMS access", 15, 34);

  doc.setFont("helvetica", "normal");
  doc.setFontSize(9);
  doc.setTextColor(92, 92, 92);
  doc.text("Policy controls and named system users.", 15, 40);

  doc.setFont("helvetica", "bold");
  doc.setFontSize(8);
  doc.text(refCode, 195, 34, { align: "right" });
  drawBadge(doc, 160, 38, "EVIDENCE COMPLETE", "success");

  // Standard Operating Procedures
  doc.setFont("helvetica", "bold");
  doc.setFontSize(12);
  doc.setTextColor(23, 23, 23);
  doc.text("Standard operating procedures", 15, 52);

  const sops = [
    {
      title: "Immigration checks",
      desc: "Digital sharecodes verified; passport and BRP copies retained.",
    },
    {
      title: "Record keeping",
      desc: "Emails, contracts, CVs and promotional evidence retained.",
    },
    {
      title: "Tracking policy",
      desc: "Work, absence, sickness and the 10-day reporting window monitored.",
    },
  ];

  let sopY = 57;
  sops.forEach((s) => {
    drawCard(doc, 15, sopY, 180, 19, [255, 255, 255]);
    drawBadge(doc, 20, sopY + 6.5, "CONFIRMED", "success");

    doc.setFont("helvetica", "bold");
    doc.setFontSize(9);
    doc.setTextColor(23, 23, 23);
    doc.text(s.title, 50, sopY + 7);

    doc.setFont("helvetica", "normal");
    doc.setFontSize(7.5);
    doc.setTextColor(92, 92, 92);
    doc.text(s.desc, 50, sopY + 13);

    sopY += 23;
  });

  // Level 1 SMS Access Log
  doc.setFont("helvetica", "bold");
  doc.setFontSize(12);
  doc.setTextColor(23, 23, 23);
  doc.text("Level 1 SMS access log", 15, 135);

  const smsCols = [
    { header: "Person", width: 45 },
    { header: "Access", width: 35 },
    { header: "Responsibility", width: 65 },
    { header: "Status", width: 35 },
  ];

  const smsRows = (
    data?.smsUsers || [
      {
        person: "Alex Marin",
        access: "Level 1",
        responsibility: "Authorising Officer",
        status: "ACTIVE",
      },
      {
        person: "Priya Shah",
        access: "Level 1",
        responsibility: "HR & Compliance",
        status: "ACTIVE",
      },
    ]
  ).map((u) => [
    u.person,
    u.access,
    u.responsibility,
    { text: u.status, badge: "success" as const },
  ]);

  drawTable(doc, 15, 140, 180, smsCols, smsRows);

  drawFooter(doc, refCode, 4, totalPages);

  // ----------------------------------------------------
  // PAGES 5+: ORGANISATION EVIDENCE REGISTER
  // ----------------------------------------------------
  for (let pageIdx = 0; pageIdx < evidencePagesCount; pageIdx++) {
    const pageNum = 5 + pageIdx;
    doc.addPage();
    drawHeader(doc, pageNum, totalPages);

    doc.setFont("helvetica", "bold");
    doc.setFontSize(18);
    doc.setTextColor(23, 23, 23);
    doc.text("Organisation evidence register", 15, 34);

    doc.setFont("helvetica", "normal");
    doc.setFontSize(9);
    doc.setTextColor(92, 92, 92);
    doc.text("Attached document visuals and extracted key information.", 15, 40);

    doc.setFont("helvetica", "bold");
    doc.setFontSize(8);
    doc.text(refCode, 195, 34, { align: "right" });
    drawBadge(doc, 160, 38, "EVIDENCE COMPLETE", "success");

    const startIdx = pageIdx * 2;
    const endIdx = startIdx + 2;
    const pageEvidence = evidenceList.slice(startIdx, endIdx);

    doc.setFont("helvetica", "bold");
    doc.setFontSize(11);
    doc.setTextColor(23, 23, 23);
    doc.text("Extracted document information", 15, 52);

    doc.setFont("helvetica", "normal");
    doc.setFontSize(8);
    doc.setTextColor(123, 123, 123);
    doc.text(`Evidence ${startIdx + 1}-${Math.min(endIdx, evidenceList.length)} of ${evidenceList.length}`, 195, 52, { align: "right" });

    let cardY = 57;
    pageEvidence.forEach((ev) => {
      drawEvidenceCard(
        doc,
        15,
        cardY,
        180,
        96,
        ev.title,
        ev.isAttached,
        ev.fields,
        ev.notes,
        ev.fileName,
        ev.reviewed
      );
      cardY += 104;
    });

    drawFooter(doc, refCode, pageNum, totalPages);
  }

  return doc;
}

// ==========================================
// 2. COMPREHENSIVE CASE DOSSIER (8 PAGES)
// ==========================================

export interface CaseDossierReportData {
  migrantName?: string;
  jobTitle?: string;
  sponsorName?: string;
  caseNumber?: string;
  cosReference?: string;
  refNumber?: string;
  generatedDate?: string;
  statusComplete?: boolean;
  personalDetails?: {
    fullName: string;
    dob: string;
    nationality: string;
    jobTitle: string;
    projectAssignment: string;
    sponsor: string;
  };
  immigrationDetails?: {
    passportNumber: string;
    sharecode: string;
    visaValidFrom: string;
    visaValidTo: string;
    rtwCompletedDate: string;
    cosReference: string;
  };
  ukContact?: {
    arrivalDate: string;
    ukAddress: string;
    previousAddress: string;
    mobile: string;
    email: string;
    projectAssignment: string;
  };
  flightItinerary?: {
    inbound: string;
    outbound: string;
  };
  workSchedule?: {
    date: string;
    activity: string;
    status: string;
  }[];
  paymentLog?: {
    date: string;
    method: string;
    reference: string;
    status: string;
  }[];
  workerEvidence?: {
    title: string;
    isAttached: boolean;
    fields: { label: string; value: string }[];
    notes: string;
    fileName: string;
    reviewed: string;
  }[];
}

export function generateCaseDossierReport(
  data?: Partial<CaseDossierReportData>
): jsPDF {
  const doc = new jsPDF({
    orientation: "portrait",
    unit: "mm",
    format: "a4",
  });

  const name = data?.migrantName || "—";
  const role = data?.jobTitle || "—";
  const sponsor = data?.sponsorName || "ENT Imm";
  const caseNo = data?.caseNumber || "—";
  const cosRef = data?.cosReference || "—";
  const refCode = data?.refNumber || "CMD-20260803-AM-FULL";
  const genDate = data?.generatedDate || "3 Aug 2026 - 13:36";
  const isComplete = data?.statusComplete ?? true;

  const defaultWorkerEvidence = [
    // Page 5: Pre-employment screening & Signed contract
    {
      title: "Pre-employment screening",
      isAttached: true,
      fields: [
        { label: "DBS Reference", value: "DBS-02673155" },
        { label: "Authority", value: "Disclosure and Barring Service" },
        { label: "Issue Date", value: "3 Aug 2026" },
        { label: "Level", value: "Basic" },
        { label: "Result", value: "Clear" },
        { label: "Identity Matched", value: "Yes" },
      ],
      notes: "Screening result matched to the worker's verified identity.",
      fileName: `dbs_screening_${(name || "worker").replace(/\s+/g, "_")}.pdf`,
      reviewed: `3 Aug 2026 by ${sponsor}`,
    },
    {
      title: "Signed contract / agreement",
      isAttached: true,
      fields: [
        { label: "Employer", value: sponsor },
        { label: "Worker", value: name },
        { label: "Role", value: role },
        { label: "Start Date", value: "16 Jul 2026" },
        { label: "Annual Salary", value: "GBP 48,000" },
        { label: "Signed", value: "12 Jul 2026" },
      ],
      notes: "Employment terms, signatures and remuneration evidence.",
      fileName: "signed_contract_agreement.pdf",
      reviewed: `3 Aug 2026 by ${sponsor}`,
    },
    // Page 6: Professional evidence & International creative status
    {
      title: "Professional evidence",
      isAttached: true,
      fields: [
        { label: "Evidence Type", value: "CV and portfolio" },
        { label: "Discipline", value: "Creative direction" },
        { label: "Experience", value: "12 years" },
        { label: "Portfolio", value: "portfolio.example/alex" },
        { label: "Last Project", value: "Northstar Campaign" },
        { label: "Verified", value: "3 Aug 2026" },
      ],
      notes: "CV, credits and portfolio extracts supporting the sponsored role.",
      fileName: "professional_evidence.pdf",
      reviewed: `3 Aug 2026 by ${sponsor}`,
    },
    {
      title: "International / creative status",
      isAttached: true,
      fields: [
        { label: "Evidence Pack", value: "Touring group dossier" },
        { label: "Project", value: "Northstar Festival" },
        { label: "Issuer", value: "Northstar Productions" },
        { label: "Role", value: role },
        { label: "Valid From", value: "15 Jul 2026" },
        { label: "Valid To", value: "31 Mar 2027" },
      ],
      notes: "Evidence that the worker has an established international or specialist creative profile.",
      fileName: "international_creative_status.pdf",
      reviewed: `3 Aug 2026 by ${sponsor}`,
    },
    // Page 7: Certificate of Sponsorship & Passport scan
    {
      title: "Certificate of Sponsorship",
      isAttached: true,
      fields: [
        { label: "CoS Reference", value: cosRef },
        { label: "Sponsor", value: sponsor },
        { label: "Route", value: "Creative Worker" },
        { label: "SOC Code", value: "3416" },
        { label: "Work Start", value: "16 Jul 2026" },
        { label: "Work End", value: "31 Mar 2027" },
      ],
      notes: "Assigned CoS record aligned to the role, project and work dates.",
      fileName: "certificate_of_sponsorship.pdf",
      reviewed: `3 Aug 2026 by ${sponsor}`,
    },
    {
      title: "Passport scan",
      isAttached: true,
      fields: [
        { label: "Passport Number", value: "P1234567" },
        { label: "Issuing Authority", value: "Republic of India" },
        { label: "Nationality", value: "Indian" },
        { label: "Date of Birth", value: "18 Feb 1988" },
        { label: "Issue Date", value: "18 Feb 2024" },
        { label: "Expiry Date", value: "17 Feb 2034" },
      ],
      notes: "Biographical page reviewed; name and date of birth match the worker record.",
      fileName: "passport_P1234567_sample.pdf",
      reviewed: `3 Aug 2026 by ${sponsor}`,
    },
    // Page 8: Arrival stamp & Departure stamp
    {
      title: "Arrival stamp",
      isAttached: true,
      fields: [
        { label: "Arrival Date", value: "15 Jul 2026" },
        { label: "Port", value: "London Heathrow" },
        { label: "Flight", value: "BA138" },
        { label: "Origin", value: "Mumbai" },
        { label: "Entry Route", value: "Creative Worker" },
        { label: "Page", value: "Passport page 12" },
      ],
      notes: "Entry evidence linked to the recorded inbound itinerary.",
      fileName: "arrival_stamp.pdf",
      reviewed: `3 Aug 2026 by ${sponsor}`,
    },
    {
      title: "Departure stamp",
      isAttached: true,
      fields: [
        { label: "Departure Date", value: "2 Apr 2027" },
        { label: "Port", value: "London Heathrow" },
        { label: "Flight", value: "BA139" },
        { label: "Destination", value: "Mumbai" },
        { label: "Journey Status", value: "Scheduled" },
        { label: "Page", value: "Travel evidence pack" },
      ],
      notes: "Placeholder evidence for the planned departure; update after travel.",
      fileName: "departure_stamp.pdf",
      reviewed: `3 Aug 2026 by ${sponsor}`,
    },
  ];

  const evidenceList = data?.workerEvidence && data.workerEvidence.length > 0 ? data.workerEvidence : defaultWorkerEvidence;
  const evidencePagesCount = Math.max(1, Math.ceil(evidenceList.length / 2));
  const totalPages = 4 + evidencePagesCount;

  // ----------------------------------------------------
  // PAGE 1: COVER
  // ----------------------------------------------------
  drawHeader(doc, 1, totalPages);

  drawBadge(doc, 15, 34, "FULL DETAILS", "purple");

  doc.setFont("helvetica", "bold");
  doc.setFontSize(26);
  doc.setTextColor(23, 23, 23);
  doc.text("Comprehensive Case Dossier", 15, 48);

  doc.setFont("helvetica", "normal");
  doc.setFontSize(11);
  doc.setTextColor(92, 92, 92);
  doc.text("Clear, audit-ready evidence from your Viems compliance workspace.", 15, 56);

  // Big Subject Box
  drawCard(doc, 15, 110, 180, 75, [255, 255, 255]);

  doc.setFont("helvetica", "bold");
  doc.setFontSize(7.5);
  doc.setTextColor(123, 123, 123);
  doc.text("REPORT SUBJECT", 23, 122);

  doc.setFont("helvetica", "bold");
  doc.setFontSize(22);
  doc.setTextColor(23, 23, 23);
  doc.text(name, 23, 134);

  doc.setFont("helvetica", "normal");
  doc.setFontSize(10);
  doc.setTextColor(92, 92, 92);
  doc.text(role, 23, 142);
  doc.text(sponsor, 23, 149);

  drawBadge(
    doc,
    23,
    155,
    isComplete ? "EVIDENCE COMPLETE" : "EVIDENCE INCOMPLETE",
    isComplete ? "success" : "warning"
  );

  doc.setFont("helvetica", "bold");
  doc.setFontSize(7);
  doc.setTextColor(123, 123, 123);
  doc.text("CASE NUMBER", 23, 168);
  doc.text("COS REFERENCE", 70, 168);

  doc.setFont("helvetica", "bold");
  doc.setFontSize(8.5);
  doc.setTextColor(23, 23, 23);
  doc.text(caseNo, 23, 173);
  doc.text(cosRef, 70, 173);

  doc.setFont("helvetica", "bold");
  doc.setFontSize(7);
  doc.setTextColor(123, 123, 123);
  doc.text("REPORT REFERENCE", 23, 181);
  doc.text("GENERATED", 150, 181);

  doc.setFont("helvetica", "bold");
  doc.setFontSize(8.5);
  doc.setTextColor(23, 23, 23);
  doc.text(refCode, 23, 186);
  doc.text(genDate, 150, 186);

  // Disclaimer
  doc.setFont("helvetica", "bold");
  doc.setFontSize(7.5);
  doc.setTextColor(92, 92, 92);
  doc.text("CONFIDENTIAL", 15, 260);

  doc.setFont("helvetica", "normal");
  doc.setFontSize(7);
  doc.setTextColor(123, 123, 123);
  doc.text(
    "Contains personal and employment data. Share only with authorised recipients for legitimate HR, compliance and audit purposes.",
    15,
    265
  );

  drawFooter(doc, refCode, 1, totalPages);

  // ----------------------------------------------------
  // PAGE 2: PERSONAL & IMMIGRATION DATA
  // ----------------------------------------------------
  doc.addPage();
  drawHeader(doc, 2, totalPages);

  doc.setFont("helvetica", "bold");
  doc.setFontSize(18);
  doc.setTextColor(23, 23, 23);
  doc.text("Personal and immigration data", 15, 34);

  doc.setFont("helvetica", "normal");
  doc.setFontSize(9);
  doc.setTextColor(92, 92, 92);
  doc.text("Identity, sponsorship and right-to-work evidence.", 15, 40);

  doc.setFont("helvetica", "bold");
  doc.setFontSize(8);
  doc.text(refCode, 195, 34, { align: "right" });
  drawBadge(doc, 160, 38, "EVIDENCE COMPLETE", "success");

  // Callout banner
  drawCard(doc, 15, 48, 180, 12, [240, 253, 244]);
  doc.setFont("helvetica", "bold");
  doc.setFontSize(8);
  doc.setTextColor(11, 70, 39);
  doc.text("•  Full Details", 20, 55);
  doc.setFont("helvetica", "normal");
  doc.setFontSize(7.5);
  doc.setTextColor(92, 92, 92);
  doc.text(
    "Illustrative information is paired with sample evidence visuals. None of the thumbnails are valid identity or official documents.",
    40,
    55
  );

  // Migrant Profile (2 Cards Side-by-Side: Personal Details & Immigration Details)
  doc.setFont("helvetica", "bold");
  doc.setFontSize(12);
  doc.setTextColor(23, 23, 23);
  doc.text("Migrant profile", 15, 70);

  const pers = {
    fullName: data?.personalDetails?.fullName || name || "—",
    dob: data?.personalDetails?.dob || "—",
    nationality: data?.personalDetails?.nationality || "—",
    jobTitle: data?.personalDetails?.jobTitle || role || "—",
    projectAssignment: data?.personalDetails?.projectAssignment || "—",
    sponsor: data?.personalDetails?.sponsor || sponsor || "—",
  };

  const imm = {
    passportNumber: data?.immigrationDetails?.passportNumber || "—",
    sharecode: data?.immigrationDetails?.sharecode || "—",
    visaValidFrom: data?.immigrationDetails?.visaValidFrom || "—",
    visaValidTo: data?.immigrationDetails?.visaValidTo || "—",
    rtwCompletedDate: data?.immigrationDetails?.rtwCompletedDate || "—",
    cosReference: data?.immigrationDetails?.cosReference || cosRef || "—",
  };

  // Card 1: Personal Details
  drawCard(doc, 15, 74, 88, 70, [255, 255, 255]);
  doc.setFont("helvetica", "bold");
  doc.setFontSize(7);
  doc.setTextColor(123, 123, 123);
  doc.text("PERSONAL DETAILS", 20, 82);

  const persRows = [
    { label: "Full name", value: pers.fullName },
    { label: "Date of birth", value: pers.dob },
    { label: "Nationality", value: pers.nationality },
    { label: "Job title / role", value: pers.jobTitle },
    { label: "Project assignment", value: pers.projectAssignment },
    { label: "Sponsor", value: pers.sponsor },
  ];

  let persY = 90;
  persRows.forEach((r) => {
    doc.setFont("helvetica", "normal");
    doc.setFontSize(7.5);
    doc.setTextColor(92, 92, 92);
    doc.text(r.label, 20, persY);

    doc.setFont("helvetica", "bold");
    doc.setTextColor(23, 23, 23);
    doc.text(r.value, 98, persY, { align: "right" });
    persY += 8;
  });

  // Card 2: Immigration Details
  drawCard(doc, 107, 74, 88, 70, [255, 255, 255]);
  doc.setFont("helvetica", "bold");
  doc.setFontSize(7);
  doc.setTextColor(123, 123, 123);
  doc.text("IMMIGRATION DETAILS", 112, 82);

  const immRows = [
    { label: "Passport number", value: imm.passportNumber },
    { label: "Digital sharecode", value: imm.sharecode },
    { label: "Visa valid from", value: imm.visaValidFrom },
    { label: "Visa valid to", value: imm.visaValidTo },
    { label: "RTW check completed", value: imm.rtwCompletedDate },
    { label: "CoS reference", value: imm.cosReference },
  ];

  let immY = 90;
  immRows.forEach((r) => {
    doc.setFont("helvetica", "normal");
    doc.setFontSize(7.5);
    doc.setTextColor(92, 92, 92);
    doc.text(r.label, 112, immY);

    doc.setFont("helvetica", "bold");
    doc.setTextColor(23, 23, 23);
    doc.text(r.value, 190, immY, { align: "right" });
    immY += 8;
  });

  // Evidence Inventory
  doc.setFont("helvetica", "bold");
  doc.setFontSize(12);
  doc.setTextColor(23, 23, 23);
  doc.text("Evidence inventory", 15, 156);

  drawMetricTile(doc, 15, 162, 56, 24, "Documents Attached", "8", "Evidence records", [240, 253, 244]);
  drawMetricTile(doc, 77, 162, 56, 24, "Documents Missing", "0", "Requires follow-up", [255, 255, 255]);
  drawMetricTile(doc, 139, 162, 56, 24, "Passport Authority", "Republic of India", "Extracted from sample", [255, 255, 255]);

  drawFooter(doc, refCode, 2, totalPages);

  // ----------------------------------------------------
  // PAGE 3: UK CONTACT & TRAVEL LOG
  // ----------------------------------------------------
  doc.addPage();
  drawHeader(doc, 3, totalPages);

  doc.setFont("helvetica", "bold");
  doc.setFontSize(18);
  doc.setTextColor(23, 23, 23);
  doc.text("UK contact and travel log", 15, 34);

  doc.setFont("helvetica", "normal");
  doc.setFontSize(9);
  doc.setTextColor(92, 92, 92);
  doc.text("Arrival, accommodation, contact and itinerary details.", 15, 40);

  doc.setFont("helvetica", "bold");
  doc.setFontSize(8);
  doc.text(refCode, 195, 34, { align: "right" });
  drawBadge(doc, 160, 38, "EVIDENCE COMPLETE", "success");

  // UK Contact Record
  doc.setFont("helvetica", "bold");
  doc.setFontSize(12);
  doc.setTextColor(23, 23, 23);
  doc.text("UK contact record", 15, 52);

  const contact = data?.ukContact || {
    arrivalDate: "15 Jul 2026",
    ukAddress: "The Hoxton, 199-206 High Holborn, London WC1V 7BD",
    previousAddress: "42 Marine Drive, Mumbai 400020, India",
    mobile: "+44 7700 900 246",
    email: "alex.marin@example.com",
    projectAssignment: "Northstar Festival & Film Campaign",
  };

  drawCard(doc, 15, 57, 180, 68, [255, 255, 255]);
  doc.setFont("helvetica", "bold");
  doc.setFontSize(7);
  doc.setTextColor(123, 123, 123);
  doc.text("CONTACT AND ACCOMMODATION", 22, 65);

  const contactRows = [
    { label: "Date of arrival", value: contact.arrivalDate },
    { label: "Current UK address", value: contact.ukAddress },
    { label: "Previous address", value: contact.previousAddress },
    { label: "Mobile number", value: contact.mobile },
    { label: "Email", value: contact.email },
    { label: "Project assignment", value: contact.projectAssignment },
  ];

  let cY = 73;
  contactRows.forEach((r) => {
    doc.setFont("helvetica", "normal");
    doc.setFontSize(7.5);
    doc.setTextColor(92, 92, 92);
    doc.text(r.label, 22, cY);

    doc.setFont("helvetica", "bold");
    doc.setTextColor(23, 23, 23);
    doc.text(r.value, 188, cY, { align: "right" });
    cY += 8;
  });

  // Flight Itinerary
  doc.setFont("helvetica", "bold");
  doc.setFontSize(12);
  doc.setTextColor(23, 23, 23);
  doc.text("Flight itinerary", 15, 137);

  const flight = data?.flightItinerary || {
    inbound: "BA138 - Mumbai to London - 15 Jul 2026",
    outbound: "BA139 - London to Mumbai - 2 Apr 2027",
  };

  drawCard(doc, 15, 142, 180, 32, [255, 255, 255]);
  doc.setFont("helvetica", "bold");
  doc.setFontSize(7);
  doc.setTextColor(123, 123, 123);
  doc.text("TRAVEL", 22, 150);

  doc.setFont("helvetica", "normal");
  doc.setFontSize(7.5);
  doc.setTextColor(92, 92, 92);
  doc.text("Inbound flight", 22, 158);
  doc.setFont("helvetica", "bold");
  doc.setTextColor(23, 23, 23);
  doc.text(flight.inbound, 188, 158, { align: "right" });

  doc.setFont("helvetica", "normal");
  doc.setFontSize(7.5);
  doc.setTextColor(92, 92, 92);
  doc.text("Outbound flight", 22, 166);
  doc.setFont("helvetica", "bold");
  doc.setTextColor(23, 23, 23);
  doc.text(flight.outbound, 188, 166, { align: "right" });

  // Travel Evidence Summary Table
  doc.setFont("helvetica", "bold");
  doc.setFontSize(12);
  doc.setTextColor(23, 23, 23);
  doc.text("Travel evidence summary", 15, 186);

  const travelCols = [
    { header: "Evidence", width: 65 },
    { header: "Status", width: 45 },
    { header: "Key Date", width: 70 },
  ];

  const travelRows = [
    ["Passport scan", { text: "ATTACHED", badge: "success" as const }, "-"],
    ["Arrival stamp", { text: "ATTACHED", badge: "success" as const }, "15 Jul 2026"],
    ["Departure stamp", { text: "ATTACHED", badge: "success" as const }, "2 Apr 2027"],
  ];

  drawTable(doc, 15, 191, 180, travelCols, travelRows);

  drawFooter(doc, refCode, 3, totalPages);

  // ----------------------------------------------------
  // PAGE 4: EMPLOYMENT & MONITORING RECORD
  // ----------------------------------------------------
  doc.addPage();
  drawHeader(doc, 4, totalPages);

  doc.setFont("helvetica", "bold");
  doc.setFontSize(18);
  doc.setTextColor(23, 23, 23);
  doc.text("Employment and monitoring record", 15, 34);

  doc.setFont("helvetica", "normal");
  doc.setFontSize(9);
  doc.setTextColor(92, 92, 92);
  doc.text("Work, payment, absence and sponsor reporting history.", 15, 40);

  doc.setFont("helvetica", "bold");
  doc.setFontSize(8);
  doc.text(refCode, 195, 34, { align: "right" });
  drawBadge(doc, 160, 38, "EVIDENCE COMPLETE", "success");

  // Work Schedule Table
  doc.setFont("helvetica", "bold");
  doc.setFontSize(12);
  doc.setTextColor(23, 23, 23);
  doc.text("Work schedule", 15, 52);

  const scheduleCols = [
    { header: "Date", width: 45 },
    { header: "Activity", width: 95 },
    { header: "Status", width: 40 },
  ];

  const scheduleRows = (
    data?.workSchedule || [
      { date: "16 Jul 2026", activity: "Induction and production briefing", status: "WORKED" },
      { date: "18-20 Jul 2026", activity: "Rehearsals", status: "WORKED" },
      { date: "21 Jul 2026", activity: "Scheduled rest day", status: "REST" },
      { date: "22-24 Jul 2026", activity: "Location filming", status: "WORKED" },
    ]
  ).map((s) => [
    s.date,
    s.activity,
    { text: s.status, badge: (s.status === "WORKED" ? "success" : "purple") as "success" | "purple" },
  ]);

  const scheduleEndY = drawTable(doc, 15, 57, 180, scheduleCols, scheduleRows);

  // Payment Log Table
  const payY = scheduleEndY + 8;
  doc.setFont("helvetica", "bold");
  doc.setFontSize(12);
  doc.setTextColor(23, 23, 23);
  doc.text("Payment log", 15, payY);

  const payCols = [
    { header: "Date", width: 40 },
    { header: "Method", width: 40 },
    { header: "Reference", width: 60 },
    { header: "Status", width: 40 },
  ];

  const payRows = (
    data?.paymentLog || [
      { date: "31 Jul 2026", method: "Payroll", reference: "PAY-260731-AM", status: "PAID" },
      { date: "31 Aug 2026", method: "Payroll", reference: "PAY-260831-AM", status: "PAID" },
    ]
  ).map((p) => [
    p.date,
    p.method,
    p.reference,
    { text: p.status, badge: "success" as const },
  ]);

  const payEndY = drawTable(doc, 15, payY + 5, 180, payCols, payRows);

  // Absence & SMS Reporting
  const absY = payEndY + 8;
  doc.setFont("helvetica", "bold");
  doc.setFontSize(12);
  doc.setTextColor(23, 23, 23);
  doc.text("Absence and SMS reporting", 15, absY);

  const absCols = [
    { header: "Area", width: 45 },
    { header: "Entry", width: 65 },
    { header: "Outcome", width: 70 },
  ];

  const absRows = [
    ["Absence", "No absences reported", "No action required"],
    ["SMS reporting", "No reportable event", "No UKVI submission required"],
  ];

  drawTable(doc, 15, absY + 5, 180, absCols, absRows);

  drawFooter(doc, refCode, 4, totalPages);

  // ----------------------------------------------------
  // PAGES 5+: WORKER EVIDENCE FILE
  // ----------------------------------------------------
  for (let pageIdx = 0; pageIdx < evidencePagesCount; pageIdx++) {
    const pageNum = 5 + pageIdx;
    doc.addPage();
    drawHeader(doc, pageNum, totalPages);

    doc.setFont("helvetica", "bold");
    doc.setFontSize(18);
    doc.setTextColor(23, 23, 23);
    doc.text("Worker evidence file", 15, 34);

    doc.setFont("helvetica", "normal");
    doc.setFontSize(9);
    doc.setTextColor(92, 92, 92);
    doc.text("Attached document visuals and extracted key information.", 15, 40);

    doc.setFont("helvetica", "bold");
    doc.setFontSize(8);
    doc.text(refCode, 195, 34, { align: "right" });
    drawBadge(doc, 160, 38, "EVIDENCE COMPLETE", "success");

    const startIdx = pageIdx * 2;
    const endIdx = startIdx + 2;
    const pageEvidence = evidenceList.slice(startIdx, endIdx);

    doc.setFont("helvetica", "bold");
    doc.setFontSize(11);
    doc.setTextColor(23, 23, 23);
    doc.text("Extracted document information", 15, 52);

    doc.setFont("helvetica", "normal");
    doc.setFontSize(8);
    doc.setTextColor(123, 123, 123);
    doc.text(`Evidence ${startIdx + 1}-${Math.min(endIdx, evidenceList.length)} of ${evidenceList.length}`, 195, 52, { align: "right" });

    let cardY = 57;
    pageEvidence.forEach((ev) => {
      drawEvidenceCard(
        doc,
        15,
        cardY,
        180,
        96,
        ev.title,
        ev.isAttached,
        ev.fields,
        ev.notes,
        ev.fileName,
        ev.reviewed
      );
      cardY += 104;
    });

    drawFooter(doc, refCode, pageNum, totalPages);
  }

  return doc;
}

// ==========================================
// 3. CURTAILMENT / CASE CLOSING LETTER GENERATOR (1-PAGE A4)
// ==========================================

export interface CurtailmentLetterData {
  migrantName: string;
  caseNumber: string;
  cosReference?: string;
  passportNumber?: string;
  dateOfBirth?: string;
  nationality?: string;
  currentAddress?: string;
  jobTitle?: string;
  sponsorName?: string;
  sponsorLicenceNumber?: string;
  sponsorAddress?: string;
  authorisingOfficer?: string;
  authorisingOfficerRole?: string;
  cessationType?: "curtailment" | "closure" | "withdrawal";
  cessationReason: string;
  lastDayOfWork?: string;
  sponsorshipEndDate: string;
  smsReportReference?: string;
  smsReportDate?: string;
  notes?: string;
  refNumber?: string;
  generatedDate?: string;
}

export function generateCurtailmentLetter(data: CurtailmentLetterData): jsPDF {
  if (
    !data.migrantName ||
    !data.caseNumber ||
    !data.sponsorName ||
    !data.sponsorLicenceNumber ||
    !data.sponsorshipEndDate ||
    !data.cessationReason
  ) {
    throw new Error(
      "Missing required curtailment letter data: migrantName, caseNumber, sponsorName, sponsorLicenceNumber, sponsorshipEndDate, and cessationReason must be provided."
    );
  }

  const doc = new jsPDF({
    orientation: "portrait",
    unit: "mm",
    format: "a4",
  });

  const migrantName = data.migrantName;
  const sponsorName = data.sponsorName;
  const sponsorLicence = data.sponsorLicenceNumber;
  const sponsorAddress = data.sponsorAddress || "14 Berkeley Square, Mayfair, London W1J 6BL, United Kingdom";
  const authorisingOfficer = data.authorisingOfficer || "Nathan Wood";
  const authorisingOfficerRole = data.authorisingOfficerRole || "Compliance Officer & Level 1 User";
  const cessationType = data.cessationType || "curtailment";

  const initials = migrantName
    .split(" ")
    .filter(Boolean)
    .map((w) => w[0]?.toUpperCase() || "")
    .join("") || "CRT";

  const dateStr = data.generatedDate || new Date().toLocaleDateString("en-GB", {
    day: "numeric",
    month: "long",
    year: "numeric",
  });

  const refCode = data.refNumber || `UKVI-CRT-${new Date().toISOString().slice(0, 10).replace(/-/g, "")}-${initials}`;
  const smsReportRef = data.smsReportReference?.trim() || null;

  // Page 1: Single Page Layout
  // 1. Top Header
  drawViemsLogo(doc, 15, 14, 28, 7.2);

  // Sponsor Info on Right Header
  doc.setFont("helvetica", "bold");
  doc.setFontSize(9);
  doc.setTextColor(23, 23, 23);
  doc.text(sponsorName, 195, 15, { align: "right" });

  doc.setFont("helvetica", "normal");
  doc.setFontSize(7.5);
  doc.setTextColor(92, 92, 92);
  doc.text(`Sponsor Licence: ${sponsorLicence}`, 195, 19.5, { align: "right" });
  doc.text(sponsorAddress, 195, 23.5, { align: "right" });

  // Divider Line
  doc.setDrawColor(235, 235, 235);
  doc.setLineWidth(0.3);
  doc.line(15, 28, 195, 28);

  // 2. Reference & Date Bar
  doc.setFillColor(250, 250, 250);
  doc.rect(15, 31, 180, 8, "F");
  doc.setDrawColor(235, 235, 235);
  doc.rect(15, 31, 180, 8, "S");

  doc.setFont("helvetica", "bold");
  doc.setFontSize(7.5);
  doc.setTextColor(92, 92, 92);
  doc.text("DATE:", 19, 36);

  doc.setFont("helvetica", "normal");
  doc.setFontSize(7.5);
  doc.setTextColor(23, 23, 23);
  doc.text(dateStr, 31, 36);

  doc.setFont("helvetica", "bold");
  doc.setTextColor(92, 92, 92);
  doc.text("NOTICE REF:", 82, 36);

  doc.setFont("helvetica", "normal");
  doc.setTextColor(23, 23, 23);
  doc.text(refCode, 102, 36);

  doc.setFont("helvetica", "bold");
  doc.setTextColor(92, 92, 92);
  doc.text("UKVI SMS REF:", 142, 36);

  doc.setFont("helvetica", "normal");
  doc.setTextColor(23, 23, 23);
  doc.text(smsReportRef || "Pending / Not Registered", 164, 36);

  let curY = 44;

  // 3. Recipient & Migrant Details Block
  doc.setFont("helvetica", "bold");
  doc.setFontSize(8);
  doc.setTextColor(92, 92, 92);
  doc.text("SPONSORED MIGRANT DETAILS:", 15, curY);

  curY += 4.5;
  doc.setFont("helvetica", "bold");
  doc.setFontSize(10);
  doc.setTextColor(23, 23, 23);
  doc.text(migrantName, 15, curY);

  curY += 4.5;
  doc.setFont("helvetica", "normal");
  doc.setFontSize(8);
  doc.setTextColor(92, 92, 92);
  const migrantIdLine = [
    data.dateOfBirth ? `DOB: ${data.dateOfBirth}` : null,
    data.nationality ? `Nationality: ${data.nationality}` : null,
    data.passportNumber ? `Passport: ${data.passportNumber}` : null,
  ]
    .filter(Boolean)
    .join("  |  ");
  doc.text(migrantIdLine || `Case: ${data.caseNumber}`, 15, curY);

  if (data.currentAddress) {
    curY += 4;
    doc.text(`Residential Address: ${data.currentAddress}`, 15, curY);
  }

  curY += 7;

  // 4. Formal Notice Banner
  const bannerTitles = {
    curtailment: "OFFICIAL NOTICE: CESSATION OF UKVI IMMIGRATION SPONSORSHIP",
    closure: "OFFICIAL NOTICE: SPONSORSHIP CASE CLOSURE & CONCLUSION OF ENGAGEMENT",
    withdrawal: "OFFICIAL NOTICE: WITHDRAWAL OF CERTIFICATE OF SPONSORSHIP",
  };

  doc.setFillColor(245, 243, 255);
  doc.roundedRect(15, curY, 180, 10, 2, 2, "F");
  doc.setDrawColor(221, 214, 254);
  doc.roundedRect(15, curY, 180, 10, 2, 2, "S");

  doc.setFont("helvetica", "bold");
  doc.setFontSize(8.5);
  doc.setTextColor(109, 40, 217);
  doc.text(bannerTitles[cessationType], 105, curY + 6.5, { align: "center" });

  curY += 14;

  // 5. Statutory Cessation Statement
  doc.setFont("helvetica", "normal");
  doc.setFontSize(8);
  doc.setTextColor(50, 50, 50);

  const statementText =
    cessationType === "withdrawal"
      ? `This letter provides formal written notice that ${sponsorName} has withdrawn Certificate of Sponsorship (CoS: ${data.cosReference || "—"}) assigned to ${migrantName} (Case ID: ${data.caseNumber}). Consequently, UKVI sponsorship duties under this assignment have been formally cancelled.`
      : cessationType === "closure"
      ? `This certificate provides formal confirmation that the sponsored employment engagement for ${migrantName} under Certificate of Sponsorship ${data.cosReference || "—"} has reached conclusion. All associated sponsorship duties for Case ID ${data.caseNumber} have been completed in accordance with Home Office regulations.`
      : `This letter provides formal written notification that ${sponsorName} has ceased immigration sponsorship for ${migrantName} under Certificate of Sponsorship (CoS: ${data.cosReference || "—"}). All active sponsorship obligations for Case ID ${data.caseNumber} have terminated with effect from ${data.sponsorshipEndDate}.`;

  const splitStatement = doc.splitTextToSize(statementText, 180);
  doc.text(splitStatement, 15, curY);
  curY += splitStatement.length * 4 + 3;

  // 6. Sponsorship & Cessation Summary Card
  drawCard(doc, 15, curY, 180, 36, [255, 255, 255]);

  const col1X = 19;
  const col1ValX = 64;
  const col2X = 108;
  const col2ValX = 154;
  let rowY = curY + 6;

  const drawRow = (label: string, val: string, lx: number, vx: number, y: number) => {
    doc.setFont("helvetica", "bold");
    doc.setFontSize(7.5);
    doc.setTextColor(92, 92, 92);
    doc.text(label.toUpperCase(), lx, y);

    doc.setFont("helvetica", "normal");
    doc.setFontSize(8);
    doc.setTextColor(23, 23, 23);
    doc.text(val, vx, y);
  };

  drawRow("Job Title / Role:", data.jobTitle || "—", col1X, col1ValX, rowY);
  drawRow("Effective Cessation Date:", data.sponsorshipEndDate || dateStr, col2X, col2ValX, rowY);

  rowY += 6;
  drawRow("CoS Reference:", data.cosReference || "—", col1X, col1ValX, rowY);
  drawRow("Last Day of Work:", data.lastDayOfWork || data.sponsorshipEndDate || "—", col2X, col2ValX, rowY);

  rowY += 6;
  drawRow("Sponsor Licence:", sponsorLicence, col1X, col1ValX, rowY);
  drawRow("Case ID:", String(data.caseNumber || "—").replace(/^#+/, "#"), col2X, col2ValX, rowY);

  rowY += 6;
  doc.setFont("helvetica", "bold");
  doc.setFontSize(7.5);
  doc.setTextColor(92, 92, 92);
  doc.text("REASON / GROUNDS:", col1X, rowY);

  doc.setFont("helvetica", "bold");
  doc.setFontSize(8);
  doc.setTextColor(180, 83, 9);
  doc.text(data.cessationReason || "Sponsorship Concluded", col1ValX, rowY);

  rowY += 6;
  if (data.notes) {
    doc.setFont("helvetica", "bold");
    doc.setFontSize(7.5);
    doc.setTextColor(92, 92, 92);
    doc.text("COMPLIANCE NOTES:", col1X, rowY);

    doc.setFont("helvetica", "normal");
    doc.setFontSize(7.5);
    doc.setTextColor(50, 50, 50);
    const splitNotes = doc.splitTextToSize(data.notes, 120);
    const maxLines = 3;
    const renderedNotes = splitNotes.slice(0, maxLines);
    doc.text(renderedNotes, col1ValX, rowY);
  }

  curY += 40;

  // 7. Statutory UKVI SMS Reporting Confirmation
  doc.setFillColor(240, 244, 255);
  doc.roundedRect(15, curY, 180, 16, 2, 2, "F");
  doc.setDrawColor(210, 225, 250);
  doc.roundedRect(15, curY, 180, 16, 2, 2, "S");

  doc.setFont("helvetica", "bold");
  doc.setFontSize(7.5);
  doc.setTextColor(30, 64, 175);
  doc.text("STATUTORY UKVI SMS REPORTING COMPLIANCE", 19, curY + 4.5);

  doc.setFont("helvetica", "normal");
  doc.setFontSize(7);
  doc.setTextColor(30, 50, 100);
  const smsStatement = smsReportRef
    ? `In accordance with UK Home Office Sponsor Guidance Part 3 and Appendix D duties, ${sponsorName} has formally notified UK Visas and Immigration (UKVI) via the Sponsor Management System (SMS Ref: ${smsReportRef}) within the statutory 10-working-day reporting window.`
    : `In accordance with UK Home Office Sponsor Guidance Part 3, ${sponsorName} records statutory cessation for audit compliance. Sponsor Management System (SMS) reporting will be submitted within the statutory 10-working-day reporting window as required under Appendix D.`;
  const splitSms = doc.splitTextToSize(smsStatement, 172);
  doc.text(splitSms, 19, curY + 8.5);

  curY += 20;

  // 8. Crucial Immigration Guidance to Migrant (Contextualized per notice type)
  doc.setFillColor(255, 250, 235);
  doc.roundedRect(15, curY, 180, 36, 2, 2, "F");
  doc.setDrawColor(254, 232, 211);
  doc.roundedRect(15, curY, 180, 36, 2, 2, "S");

  doc.setFillColor(246, 181, 30);
  doc.rect(15, curY, 2, 36, "F");

  doc.setFont("helvetica", "bold");
  doc.setFontSize(8);
  doc.setTextColor(180, 83, 9);

  const guidanceTitle =
    cessationType === "withdrawal"
      ? "IMPORTANT NOTICE REGARDING WITHDRAWAL & IMMIGRATION STATUS:"
      : cessationType === "closure"
      ? "IMPORTANT NOTICE REGARDING ENGAGEMENT CONCLUSION & STATUS:"
      : "IMPORTANT NOTICE REGARDING YOUR UK IMMIGRATION STATUS (60-DAY RULE):";

  doc.text(guidanceTitle, 20, curY + 5);

  doc.setFont("helvetica", "normal");
  doc.setFontSize(7);
  doc.setTextColor(98, 76, 24);

  const adviseBullets =
    cessationType === "withdrawal"
      ? [
          "• CoS Assignment Withdrawn: Certificate of Sponsorship assignment has been cancelled prior to entry or visa activation.",
          "• No Active Sponsorship: No ongoing UKVI sponsorship duties or active employment rights exist under this withdrawn assignment.",
          "• New Application Requirement: If you intend to take up future employment in the UK, a new Certificate of Sponsorship and visa application will be required.",
          "• Audit Archive: This withdrawal record is retained in the sponsor's statutory compliance register in accordance with UKVI Appendix D rules.",
        ]
      : cessationType === "closure"
      ? [
          "• Normal Sponsorship Conclusion: The sponsored employment engagement has concluded on the agreed effective date in accordance with Sponsor Guidance Part 3.",
          "• Status Expiry: Permission to work under this sponsor ceases on the effective date. Remaining leave is governed by your original visa expiration date or wrap-up period.",
          "• Departure / Extension: If leaving the UK upon engagement completion, departure confirmation should be provided. For continued stay, ensure valid permission is maintained.",
          "• Statutory Retention: Copies of this closure record and right-to-work history are retained for the statutory period required under Appendix D.",
        ]
      : [
          "• UKVI Curtailment Notice: UK Visas and Immigration will write to you to curtail your remaining permission to stay in the UK to 60 calendar days (or until your original visa expiry date, whichever is shorter).",
          "• Switch Sponsor or New Visa: If you wish to remain in the UK, you must make a valid immigration application under a new licensed sponsor or alternative visa category before the curtailment date.",
          "• Departure Requirement: If you do not submit a new application, you must depart the United Kingdom before the curtailment expiry date to prevent unlawful overstaying.",
          "• Proof of Exit: You must email a copy of your flight departure confirmation / exit boarding pass to the sponsor compliance team for statutory audit verification.",
        ];

  let bulletY = curY + 10;
  adviseBullets.forEach((bullet) => {
    const splitB = doc.splitTextToSize(bullet, 170);
    doc.text(splitB, 20, bulletY);
    bulletY += splitB.length * 3.6 + 1.2;
  });

  curY += 40;

  // 9. Authorising Officer Signatory Block
  drawCard(doc, 15, curY, 180, 34, [255, 255, 255]);

  doc.setFont("helvetica", "bold");
  doc.setFontSize(7.5);
  doc.setTextColor(92, 92, 92);
  doc.text("ISSUED ON BEHALF OF LICENSED SPONSOR:", 19, curY + 5.5);

  doc.setFont("helvetica", "bold");
  doc.setFontSize(9);
  doc.setTextColor(23, 23, 23);
  doc.text(authorisingOfficer, 19, curY + 11);

  doc.setFont("helvetica", "normal");
  doc.setFontSize(7.5);
  doc.setTextColor(92, 92, 92);
  doc.text(authorisingOfficerRole, 19, curY + 15.5);
  doc.text(`${sponsorName} • Sponsor Licence: ${sponsorLicence}`, 19, curY + 19.5);
  doc.text(`Contact: compliance@${sponsorName.toLowerCase().replace(/[^\w]/g, "") || "sponsor"}.co.uk`, 19, curY + 23.5);

  // Official Signature Box on Right
  doc.setFillColor(250, 250, 250);
  doc.roundedRect(125, curY + 4, 65, 26, 2, 2, "F");
  doc.setDrawColor(220, 220, 220);
  doc.roundedRect(125, curY + 4, 65, 26, 2, 2, "S");

  doc.setFont("helvetica", "bold");
  doc.setFontSize(6.5);
  doc.setTextColor(150, 150, 150);
  doc.text("DIGITAL VERIFICATION & COMPLIANCE SEAL", 157.5, curY + 8, { align: "center" });

  doc.setFont("courier", "bold");
  doc.setFontSize(8);
  doc.setTextColor(107, 33, 168);
  doc.text("[ VERIFIED SPONSOR SIGNATURE ]", 157.5, curY + 15, { align: "center" });

  doc.setFont("helvetica", "normal");
  doc.setFontSize(6.5);
  doc.setTextColor(92, 92, 92);
  doc.text(`Auth Code: ${refCode}`, 157.5, curY + 20, { align: "center" });
  doc.text(`Timestamp: ${dateStr}`, 157.5, curY + 24, { align: "center" });

  // 10. Footer
  drawFooter(doc, refCode, 1, 1);

  return doc;
}

// ==========================================
// 4. EXPORT / DOWNLOAD HELPER
// ==========================================

export function downloadPdf(doc: jsPDF, fileName: string) {
  doc.save(fileName.endsWith(".pdf") ? fileName : `${fileName}.pdf`);
}

