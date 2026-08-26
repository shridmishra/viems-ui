/**
 * 14-Day Tour Gap Compliance Engine (UKVI Creative Worker / Temporary Work Concession)
 * 
 * Under UK Home Office Appendix Creative Worker & Temporary Work rules:
 * - A single Certificate of Sponsorship (CoS) or continuous itinerary can only be granted
 *   if the gap between consecutive paid engagements, rehearsals, or performances does not exceed 14 days.
 * - Any gap greater than 14 days is flagged as a compliance breach requiring either:
 *   1. Intervening engagement / rehearsal dates to be added, or
 *   2. Splitting into separate CoS applications, or
 *   3. Departure & re-entry documentation.
 */

export interface ScheduleEvent {
  id: string;
  title: string;
  startDate: string; // YYYY-MM-DD
  endDate: string;   // YYYY-MM-DD
  venue?: string;
  city?: string;
  country?: string;
  engagementType?: "Performance" | "Rehearsal" | "Filming" | "Recording" | "Promotional" | "Other";
  fee?: string | number;
  notes?: string;
}

export interface TourGap {
  id: string;
  fromEvent: ScheduleEvent;
  toEvent: ScheduleEvent;
  gapDays: number;
  isBreach: boolean;
  isWarning: boolean; // 11-14 days: safe but near limit
  status: "COMPLIANT" | "WARNING" | "BREACH";
  message: string;
  recommendation?: string;
}

export interface TourGapAnalysisResult {
  isCompliant: boolean;
  totalEvents: number;
  totalGaps: number;
  compliantGapsCount: number;
  warningGapsCount: number;
  breachCount: number;
  maxGapDays: number;
  averageGapDays: number;
  overallStartDate: string;
  overallEndDate: string;
  totalTourDays: number;
  events: ScheduleEvent[];
  gaps: TourGap[];
  breaches: TourGap[];
  recommendations: string[];
}

export const MAX_ALLOWED_GAP_DAYS = 14;
export const WARNING_THRESHOLD_DAYS = 11;

/**
 * Calculates calendar days between two ISO date strings (endDate of first to startDate of second).
 * Returns the gap in full days (0 if consecutive or overlapping).
 */
export function calculateGapDays(firstEndDate: string, secondStartDate: string): number {
  if (!firstEndDate || !secondStartDate) return 0;
  const d1 = new Date(firstEndDate);
  const d2 = new Date(secondStartDate);
  
  if (isNaN(d1.getTime()) || isNaN(d2.getTime())) return 0;
  
  // Set to midnight UTC for pure date comparison
  const utc1 = Date.UTC(d1.getFullYear(), d1.getMonth(), d1.getDate());
  const utc2 = Date.UTC(d2.getFullYear(), d2.getMonth(), d2.getDate());
  
  const diffTime = utc2 - utc1;
  const diffDays = Math.floor(diffTime / (1000 * 60 * 60 * 24));
  
  // If next event starts the day after or same day, gap is 0
  return Math.max(0, diffDays - 1);
}

/**
 * Validates and analyzes a list of schedule engagements for UKVI 14-day tour gap limits.
 */
export function analyzeTourGaps(rawEvents: ScheduleEvent[]): TourGapAnalysisResult {
  if (!rawEvents || rawEvents.length === 0) {
    return {
      isCompliant: true,
      totalEvents: 0,
      totalGaps: 0,
      compliantGapsCount: 0,
      warningGapsCount: 0,
      breachCount: 0,
      maxGapDays: 0,
      averageGapDays: 0,
      overallStartDate: "",
      overallEndDate: "",
      totalTourDays: 0,
      events: [],
      gaps: [],
      breaches: [],
      recommendations: ["Upload or create a schedule of engagements to run 14-day tour gap analysis."],
    };
  }

  // Sort events chronologically by start date
  const sortedEvents = [...rawEvents].sort((a, b) => {
    const timeA = new Date(a.startDate).getTime() || 0;
    const timeB = new Date(b.startDate).getTime() || 0;
    return timeA - timeB;
  });

  const gaps: TourGap[] = [];
  const breaches: TourGap[] = [];
  let totalGapSum = 0;
  let maxGap = 0;
  let warningCount = 0;

  for (let i = 0; i < sortedEvents.length - 1; i++) {
    const current = sortedEvents[i];
    const next = sortedEvents[i + 1];

    const gap = calculateGapDays(current.endDate || current.startDate, next.startDate);
    totalGapSum += gap;
    if (gap > maxGap) maxGap = gap;

    const isBreach = gap > MAX_ALLOWED_GAP_DAYS;
    const isWarning = !isBreach && gap >= WARNING_THRESHOLD_DAYS;

    if (isWarning) warningCount++;

    const fromTitle = current.venue ? `${current.title} (${current.venue}, ${current.city || "UK"})` : current.title;
    const toTitle = next.venue ? `${next.title} (${next.venue}, ${next.city || "UK"})` : next.title;

    let message = `${gap} day${gap === 1 ? "" : "s"} break between "${fromTitle}" and "${toTitle}"`;
    let recommendation: string | undefined = undefined;

    if (isBreach) {
      message = `14-Day Limit Exceeded: ${gap} days gap between "${fromTitle}" and "${toTitle}"`;
      recommendation = `Add intermediate rehearsal/promotional dates between ${current.endDate} and ${next.startDate} or split into separate CoS applications.`;
    } else if (isWarning) {
      message = `Approaching Limit: ${gap} days gap between "${fromTitle}" and "${toTitle}" (Max 14)`;
      recommendation = `Ensure dates are finalized so gap does not expand past 14 days.`;
    }

    const gapObj: TourGap = {
      id: `gap-${current.id}-${next.id}`,
      fromEvent: current,
      toEvent: next,
      gapDays: gap,
      isBreach,
      isWarning,
      status: isBreach ? "BREACH" : isWarning ? "WARNING" : "COMPLIANT",
      message,
      recommendation,
    };

    gaps.push(gapObj);
    if (isBreach) {
      breaches.push(gapObj);
    }
  }

  const overallStartDate = sortedEvents[0]?.startDate || "";
  const overallEndDate = sortedEvents[sortedEvents.length - 1]?.endDate || sortedEvents[sortedEvents.length - 1]?.startDate || "";
  
  let totalTourDays = 0;
  if (overallStartDate && overallEndDate) {
    const startT = new Date(overallStartDate).getTime();
    const endT = new Date(overallEndDate).getTime();
    if (!isNaN(startT) && !isNaN(endT) && endT >= startT) {
      totalTourDays = Math.floor((endT - startT) / (1000 * 60 * 60 * 24)) + 1;
    }
  }

  const averageGapDays = gaps.length > 0 ? Math.round((totalGapSum / gaps.length) * 10) / 10 : 0;
  const isCompliant = breaches.length === 0;

  const recommendations: string[] = [];
  if (isCompliant) {
    recommendations.push("Schedule is 100% compliant with UKVI Appendix Creative Worker 14-day continuous tour rules.");
    if (warningCount > 0) {
      recommendations.push(`${warningCount} gap(s) are between 11 and 14 days. Ensure production dates do not slip.`);
    }
  } else {
    recommendations.push(
      `UKVI Compliance Action Required: ${breaches.length} tour gap(s) exceed the statutory 14-day limit.`
    );
    breaches.forEach((b) => {
      if (b.recommendation) recommendations.push(b.recommendation);
    });
  }

  return {
    isCompliant,
    totalEvents: sortedEvents.length,
    totalGaps: gaps.length,
    compliantGapsCount: gaps.filter((g) => g.status === "COMPLIANT").length,
    warningGapsCount: warningCount,
    breachCount: breaches.length,
    maxGapDays: maxGap,
    averageGapDays,
    overallStartDate,
    overallEndDate,
    totalTourDays,
    events: sortedEvents,
    gaps,
    breaches,
    recommendations,
  };
}

/**
 * Parses a simple CSV text representation of a schedule.
 * Expects headers like: Title / Event, Start Date, End Date, Venue, City, Type, Fee
 */
export function parseScheduleFromCsv(csvText: string): ScheduleEvent[] {
  if (!csvText || !csvText.trim()) return [];

  const lines = csvText.trim().split(/\r?\n/);
  if (lines.length < 2) return [];

  const header = lines[0].toLowerCase().split(",").map((h) => h.trim().replace(/^["']|["']$/g, ""));
  
  const titleIdx = header.findIndex((h) => h.includes("title") || h.includes("event") || h.includes("name") || h.includes("engagement"));
  const startIdx = header.findIndex((h) => h.includes("start") || h === "date" || h.includes("from"));
  const endIdx = header.findIndex((h) => h.includes("end") || h.includes("to"));
  const venueIdx = header.findIndex((h) => h.includes("venue") || h.includes("location") || h.includes("hall"));
  const cityIdx = header.findIndex((h) => h.includes("city") || h.includes("town"));
  const typeIdx = header.findIndex((h) => h.includes("type") || h.includes("category"));
  const feeIdx = header.findIndex((h) => h.includes("fee") || h.includes("rate") || h.includes("salary"));

  const events: ScheduleEvent[] = [];

  for (let i = 1; i < lines.length; i++) {
    const line = lines[i].trim();
    if (!line) continue;

    // Split CSV line respecting quotes
    const cols: string[] = [];
    let cur = "";
    let insideQuotes = false;
    for (let c = 0; c < line.length; c++) {
      const char = line[c];
      if (char === '"') {
        insideQuotes = !insideQuotes;
      } else if (char === "," && !insideQuotes) {
        cols.push(cur.trim().replace(/^["']|["']$/g, ""));
        cur = "";
      } else {
        cur += char;
      }
    }
    cols.push(cur.trim().replace(/^["']|["']$/g, ""));

    const title = titleIdx !== -1 && cols[titleIdx] ? cols[titleIdx] : `Engagement #${i}`;
    let startDate = startIdx !== -1 && cols[startIdx] ? cols[startIdx] : "";
    let endDate = endIdx !== -1 && cols[endIdx] ? cols[endIdx] : startDate;

    // Basic date standardisation (DD/MM/YYYY to YYYY-MM-DD)
    if (startDate.includes("/")) {
      const parts = startDate.split("/");
      if (parts.length === 3) {
        if (parts[2].length === 4) {
          startDate = `${parts[2]}-${parts[1].padStart(2, "0")}-${parts[0].padStart(2, "0")}`;
        }
      }
    }
    if (endDate.includes("/")) {
      const parts = endDate.split("/");
      if (parts.length === 3) {
        if (parts[2].length === 4) {
          endDate = `${parts[2]}-${parts[1].padStart(2, "0")}-${parts[0].padStart(2, "0")}`;
        }
      }
    }

    if (startDate) {
      events.push({
        id: `csv-row-${i}-${Date.now()}`,
        title,
        startDate,
        endDate: endDate || startDate,
        venue: venueIdx !== -1 ? cols[venueIdx] : undefined,
        city: cityIdx !== -1 ? cols[cityIdx] : "London",
        country: "United Kingdom",
        engagementType: (typeIdx !== -1 && cols[typeIdx] ? cols[typeIdx] : "Performance") as any,
        fee: feeIdx !== -1 ? cols[feeIdx] : undefined,
      });
    }
  }

  return events;
}

/**
 * Returns a realistic sample tour schedule for demonstration & testing
 */
export function getSampleTourSchedule(tourName = "UK National Tour 2026"): ScheduleEvent[] {
  return [
    {
      id: "ev-1",
      title: "Opening Production Rehearsals",
      startDate: "2026-09-01",
      endDate: "2026-09-04",
      venue: "Three Mills Studios",
      city: "London",
      country: "United Kingdom",
      engagementType: "Rehearsal",
      fee: "£1,250",
    },
    {
      id: "ev-2",
      title: "London Premiere Performance",
      startDate: "2026-09-07",
      endDate: "2026-09-09",
      venue: "The O2 Arena",
      city: "London",
      country: "United Kingdom",
      engagementType: "Performance",
      fee: "£2,500",
    },
    {
      id: "ev-3",
      title: "Midlands Festival Concert",
      startDate: "2026-09-15",
      endDate: "2026-09-16",
      venue: "Utilita Arena",
      city: "Birmingham",
      country: "United Kingdom",
      engagementType: "Performance",
      fee: "£2,000",
    },
    {
      id: "ev-4",
      title: "North West Filming & Live Session",
      startDate: "2026-09-24",
      endDate: "2026-09-26",
      venue: "AO Arena",
      city: "Manchester",
      country: "United Kingdom",
      engagementType: "Performance",
      fee: "£2,200",
    },
    {
      id: "ev-5",
      title: "Scottish Tour Finale",
      startDate: "2026-10-02",
      endDate: "2026-10-04",
      venue: "OVO Hydro",
      city: "Glasgow",
      country: "United Kingdom",
      engagementType: "Performance",
      fee: "£2,400",
    },
  ];
}
