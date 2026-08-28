"use client";

import * as React from "react";
import {
  RiCalendarEventLine,
  RiAlertLine,
  RiCheckLine,
  RiArrowRightSLine,
  RiCheckboxCircleLine,
  RiTimer2Line,
  RiRouteLine,
  RiShieldCheckLine,
} from "@remixicon/react";
import { Button } from "@/components/ui/button";
import {
  ScheduleEvent,
  TourGapAnalysisResult,
  analyzeTourGaps,
  getSampleTourSchedule,
  MAX_ALLOWED_GAP_DAYS,
} from "@/lib/tour-gap-checker";
import { TourGapScheduleModal } from "./TourGapScheduleModal";

interface TourGapCheckerCardProps {
  caseId?: string | number;
  migrantName?: string;
  className?: string;
}

export function TourGapCheckerCard({
  caseId,
  migrantName,
  className = "",
}: TourGapCheckerCardProps) {
  const [isModalOpen, setIsModalOpen] = React.useState(false);
  const [events, setEvents] = React.useState<ScheduleEvent[]>([]);

  // Load from local storage if existing and validate shape
  React.useEffect(() => {
    if (caseId && typeof window !== "undefined") {
      try {
        const stored = localStorage.getItem(`tour_schedule_${caseId}`);
        if (stored) {
          const parsed = JSON.parse(stored);
          if (Array.isArray(parsed)) {
            const valid = parsed.filter(
              (item: any): item is ScheduleEvent =>
                Boolean(item && typeof item.id === "string" && typeof item.title === "string" && typeof item.startDate === "string")
            );
            if (valid.length > 0) {
              setEvents(valid);
            }
          }
        }
      } catch (e) {
        console.error("Failed to parse tour schedule from localStorage:", e);
      }
    }
  }, [caseId]);

  const hasEvents = events.length > 0;

  const analysis: TourGapAnalysisResult = React.useMemo(() => {
    return analyzeTourGaps(events);
  }, [events]);

  const handleScheduleSaved = (newEvents: ScheduleEvent[]) => {
    setEvents(newEvents);
  };

  // Format date window cleanly with explicit UTC timezone
  const formattedDateWindow = React.useMemo(() => {
    if (!analysis.overallStartDate || !analysis.overallEndDate) {
      return "No dates";
    }
    const d1 = new Date(analysis.overallStartDate);
    const d2 = new Date(analysis.overallEndDate);
    if (isNaN(d1.getTime()) || isNaN(d2.getTime())) {
      return `${analysis.overallStartDate} – ${analysis.overallEndDate}`;
    }
    const s1 = d1.toLocaleDateString("en-GB", { day: "numeric", month: "short", timeZone: "UTC" });
    const s2 = d2.toLocaleDateString("en-GB", { day: "numeric", month: "short", year: "numeric", timeZone: "UTC" });
    return `${s1} – ${s2}`;
  }, [analysis.overallStartDate, analysis.overallEndDate]);

  return (
    <>
      <div
        className={`bg-white border border-[#F5F5F5] rounded-[16px] p-5 shadow-[0px_1px_2px_rgba(10,13,20,0.03)] flex flex-col gap-3.5 font-sans ${className}`}
      >
        {/* Top Header */}
        <div className="flex items-center justify-between gap-4">
          <div className="flex items-center gap-3 min-w-0">
            <div
              className={`size-9 rounded-full flex items-center justify-center shrink-0 ${
                !hasEvents
                  ? "bg-[#F5F5F5] text-[#5C5C5C]"
                  : analysis.isCompliant
                  ? "bg-[#E3F7EC] text-[#0B4627]"
                  : "bg-[#FFEBEC] text-[#FB3748]"
              }`}
            >
              {!hasEvents ? (
                <RiCalendarEventLine className="size-5" />
              ) : analysis.isCompliant ? (
                <RiCheckLine className="size-5" />
              ) : (
                <RiAlertLine className="size-5" />
              )}
            </div>

            <div className="flex flex-col min-w-0">
              <div className="flex items-center gap-2 flex-wrap">
                <h4 className="font-aeonik-medium text-[16px] leading-[22px] text-[#171717]">
                  14-Day Tour Gap Compliance
                </h4>
                <span
                  className={`px-2 py-0.5 rounded-full text-[10px] font-medium uppercase tracking-wider ${
                    !hasEvents
                      ? "bg-[#F5F5F5] text-[#5C5C5C]"
                      : analysis.isCompliant
                      ? "bg-[#E3F7EC] text-[#0B4627]"
                      : "bg-[#FFEBEC] text-[#FB3748]"
                  }`}
                >
                  {!hasEvents ? "NOT CONFIGURED" : analysis.isCompliant ? "COMPLIANT" : "AT RISK"}
                </span>
              </div>
              <span className="text-[12px] text-[#7B7B7B] leading-[16px] mt-0.5">
                Creative Worker concession · Max 14-day gap
              </span>
            </div>
          </div>

          <Button
            type="button"
            variant="ghost"
            onClick={() => setIsModalOpen(true)}
            className="h-[32px] px-3.5 bg-[#F5F5F5] hover:bg-[#EBEBEB] text-[#171717] text-[13px] font-medium rounded-full flex items-center gap-1.5 transition-colors cursor-pointer border-0 shrink-0"
          >
            <span>{hasEvents ? "Inspect Schedule" : "Add Schedule"}</span>
            <RiArrowRightSLine className="size-4 text-[#7B7B7B]" />
          </Button>
        </div>

        {/* 4-Stat Metric Cards Grid with Top-Right Icons */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5">
          {/* Stat 1: Total Engagements */}
          <div className="bg-[#F9F9F9] rounded-[10px] p-3 flex flex-col justify-between h-[72px] relative">
            <span className="text-[10px] font-medium uppercase tracking-[0.02em] text-[#7B7B7B] leading-[12px]">
              Engagements
            </span>
            <RiCalendarEventLine className="size-4 text-[#A4A4A4] absolute top-3 right-3" />
            <div className="flex items-baseline gap-1">
              <span className="font-aeonik-medium text-[18px] font-medium text-[#171717] leading-[24px]">
                {analysis.totalEvents}
              </span>
              <span className="text-[11px] text-[#7B7B7B]">stops</span>
            </div>
          </div>

          {/* Stat 2: Longest Break */}
          <div className="bg-[#F9F9F9] rounded-[10px] p-3 flex flex-col justify-between h-[72px] relative">
            <span className="text-[10px] font-medium uppercase tracking-[0.02em] text-[#7B7B7B] leading-[12px]">
              Longest Break
            </span>
            <RiTimer2Line
              className={`size-4 absolute top-3 right-3 ${
                analysis.maxGapDays > MAX_ALLOWED_GAP_DAYS ? "text-[#FB3748]" : "text-[#A4A4A4]"
              }`}
            />
            <div className="flex items-baseline gap-1">
              <span
                className={`font-aeonik-medium text-[18px] font-medium leading-[24px] ${
                  analysis.maxGapDays > MAX_ALLOWED_GAP_DAYS ? "text-[#FB3748]" : "text-[#171717]"
                }`}
              >
                {analysis.maxGapDays}
              </span>
              <span className="text-[11px] text-[#7B7B7B]">days</span>
            </div>
          </div>

          {/* Stat 3: Tour Window */}
          <div className="bg-[#F9F9F9] rounded-[10px] p-3 flex flex-col justify-between h-[72px] relative">
            <span className="text-[10px] font-medium uppercase tracking-[0.02em] text-[#7B7B7B] leading-[12px]">
              Tour Window
            </span>
            <RiRouteLine className="size-4 text-[#A4A4A4] absolute top-3 right-3" />
            <div className="flex flex-col pr-5">
              <span className="font-aeonik-medium text-[13px] font-medium text-[#171717] leading-[18px] truncate">
                {formattedDateWindow}
              </span>
              <span className="text-[11px] text-[#7B7B7B]">
                {analysis.totalTourDays > 0 ? `${analysis.totalTourDays}d total` : "No dates"}
              </span>
            </div>
          </div>

          {/* Stat 4: Concession Status */}
          <div className="bg-[#F9F9F9] rounded-[10px] p-3 flex flex-col justify-between h-[72px] relative">
            <span className="text-[10px] font-medium uppercase tracking-[0.02em] text-[#7B7B7B] leading-[12px]">
              14-Day Rule
            </span>
            <RiShieldCheckLine
              className={`size-4 absolute top-3 right-3 ${
                analysis.isCompliant ? "text-[#1FC16B]" : "text-[#FB3748]"
              }`}
            />
            <div className="flex flex-col pr-5">
              <span
                className={`font-aeonik-medium text-[13px] font-semibold leading-[18px] ${
                  analysis.isCompliant ? "text-[#0B4627]" : "text-[#FB3748]"
                }`}
              >
                {analysis.isCompliant ? "Compliant" : "Breach"}
              </span>
              <span className="text-[11px] text-[#7B7B7B]">
                {analysis.isCompliant ? "Single CoS" : "Split required"}
              </span>
            </div>
          </div>
        </div>

        {/* Polished Status Banner Pill */}
        {!hasEvents ? (
          <div className="bg-[#F5F5F5] rounded-[10px] px-3.5 py-2 flex items-center justify-between gap-3">
            <div className="flex items-center gap-2 text-[12px] text-[#5C5C5C] font-medium">
              <RiCalendarEventLine className="size-4 shrink-0 text-[#A4A4A4]" />
              <span>No tour schedule attached. Add engagement dates to run 14-day gap validation.</span>
            </div>
            <span className="text-[10px] font-medium uppercase tracking-wider text-[#5C5C5C] bg-white px-2 py-0.5 rounded-full shadow-2xs shrink-0">
              PENDING
            </span>
          </div>
        ) : analysis.isCompliant ? (
          <div className="bg-[#E3F7EC]/70 rounded-[10px] px-3.5 py-2 flex items-center justify-between gap-3">
            <div className="flex items-center gap-2 text-[12px] text-[#0B4627] font-medium">
              <RiCheckboxCircleLine className="size-4 shrink-0 text-[#1FC16B]" />
              <span>All engagements comply with 14-day continuous tour limits.</span>
            </div>
            <span className="text-[10px] font-medium uppercase tracking-wider text-[#0B4627] bg-white px-2 py-0.5 rounded-full shadow-2xs shrink-0">
              PASSED
            </span>
          </div>
        ) : (
          <div className="bg-[#FFEBEC] rounded-[10px] px-3.5 py-2 flex items-center justify-between gap-3">
            <div className="flex items-center gap-2 text-[12px] text-[#681219] font-medium">
              <RiAlertLine className="size-4 shrink-0 text-[#FB3748]" />
              <span>Tour gap exceeds 14-day limit. Review schedule.</span>
            </div>
            <span className="text-[10px] font-medium uppercase tracking-wider text-[#FB3748] bg-white px-2 py-0.5 rounded-full shadow-2xs shrink-0">
              AT RISK
            </span>
          </div>
        )}
      </div>

      <TourGapScheduleModal
        open={isModalOpen}
        onOpenChange={setIsModalOpen}
        caseId={caseId}
        migrantName={migrantName}
        initialEvents={events}
        onSaveSchedule={handleScheduleSaved}
      />
    </>
  );
}
