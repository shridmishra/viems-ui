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
  const [events, setEvents] = React.useState<ScheduleEvent[]>(() => {
    return getSampleTourSchedule();
  });

  // Load from local storage if existing
  React.useEffect(() => {
    if (caseId && typeof window !== "undefined") {
      try {
        const stored = localStorage.getItem(`tour_schedule_${caseId}`);
        if (stored) {
          const parsed = JSON.parse(stored);
          if (Array.isArray(parsed) && parsed.length > 0) {
            setEvents(parsed);
          }
        }
      } catch (e) {}
    }
  }, [caseId]);

  const analysis: TourGapAnalysisResult = React.useMemo(() => {
    return analyzeTourGaps(events);
  }, [events]);

  const handleScheduleSaved = (newEvents: ScheduleEvent[]) => {
    setEvents(newEvents);
  };

  // Format date window cleanly
  const formattedDateWindow = React.useMemo(() => {
    if (!analysis.overallStartDate || !analysis.overallEndDate) {
      return "No dates filed";
    }
    const d1 = new Date(analysis.overallStartDate);
    const d2 = new Date(analysis.overallEndDate);
    if (isNaN(d1.getTime()) || isNaN(d2.getTime())) {
      return `${analysis.overallStartDate} – ${analysis.overallEndDate}`;
    }
    const s1 = d1.toLocaleDateString("en-GB", { day: "numeric", month: "short" });
    const s2 = d2.toLocaleDateString("en-GB", { day: "numeric", month: "short", year: "numeric" });
    return `${s1} – ${s2}`;
  }, [analysis.overallStartDate, analysis.overallEndDate]);

  return (
    <>
      <div
        className={`bg-white border border-[#F5F5F5] rounded-[16px] p-5 shadow-[0px_1px_2px_rgba(10,13,20,0.03)] flex flex-col gap-4 font-sans ${className}`}
      >
        {/* Top Header */}
        <div className="flex items-center justify-between gap-4">
          <div className="flex items-center gap-3 min-w-0">
            <div
              className={`size-9 rounded-full flex items-center justify-center shrink-0 ${
                analysis.isCompliant
                  ? "bg-[#E3F7EC] text-[#0B4627]"
                  : "bg-[#FFEBEC] text-[#FB3748]"
              }`}
            >
              {analysis.isCompliant ? (
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
                  className={`px-2 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-wider ${
                    analysis.isCompliant
                      ? "bg-[#E3F7EC] text-[#0B4627]"
                      : "bg-[#FFEBEC] text-[#FB3748]"
                  }`}
                >
                  {analysis.isCompliant ? "Compliant" : `${analysis.breachCount} Limit Breach`}
                </span>
              </div>
              <span className="text-[12px] text-[#7B7B7B] leading-[16px] mt-0.5">
                UKVI Appendix Creative Worker &bull; Maximum 14 days between continuous engagements
              </span>
            </div>
          </div>

          <Button
            type="button"
            variant="ghost"
            onClick={() => setIsModalOpen(true)}
            className="h-[32px] px-3.5 bg-[#F5F5F5] hover:bg-[#EBEBEB] text-[#171717] text-[13px] font-medium rounded-full flex items-center gap-1.5 transition-colors cursor-pointer border-0 shrink-0"
          >
            <span>Inspect Schedule</span>
            <RiArrowRightSLine className="size-4 text-[#7B7B7B]" />
          </Button>
        </div>

        {/* 4-Stat Metric Cards Grid with Top-Right Icons */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5">
          {/* Stat 1: Total Engagements */}
          <div className="bg-[#F9F9F9] rounded-[10px] p-3 flex flex-col justify-between h-[76px] relative">
            <span className="text-[11px] font-medium uppercase tracking-[0.02em] text-[#7B7B7B] leading-[12px]">
              Engagements
            </span>
            <RiCalendarEventLine className="size-4 text-[#A4A4A4] absolute top-3 right-3" />
            <div className="flex items-baseline gap-1">
              <span className="font-aeonik-medium text-[20px] font-medium text-[#171717] leading-[26px]">
                {analysis.totalEvents}
              </span>
              <span className="text-[12px] text-[#7B7B7B] font-normal">stops</span>
            </div>
          </div>

          {/* Stat 2: Longest Break */}
          <div className="bg-[#F9F9F9] rounded-[10px] p-3 flex flex-col justify-between h-[76px] relative">
            <span className="text-[11px] font-medium uppercase tracking-[0.02em] text-[#7B7B7B] leading-[12px]">
              Longest Break
            </span>
            <RiTimer2Line
              className={`size-4 absolute top-3 right-3 ${
                analysis.maxGapDays > MAX_ALLOWED_GAP_DAYS ? "text-[#FB3748]" : "text-[#A4A4A4]"
              }`}
            />
            <div className="flex items-baseline gap-1">
              <span
                className={`font-aeonik-medium text-[20px] font-medium leading-[26px] ${
                  analysis.maxGapDays > MAX_ALLOWED_GAP_DAYS ? "text-[#FB3748]" : "text-[#171717]"
                }`}
              >
                {analysis.maxGapDays}
              </span>
              <span className="text-[12px] text-[#7B7B7B] font-normal">days max</span>
            </div>
          </div>

          {/* Stat 3: Tour Window */}
          <div className="bg-[#F9F9F9] rounded-[10px] p-3 flex flex-col justify-between h-[76px] relative">
            <span className="text-[11px] font-medium uppercase tracking-[0.02em] text-[#7B7B7B] leading-[12px]">
              Tour Window
            </span>
            <RiRouteLine className="size-4 text-[#A4A4A4] absolute top-3 right-3" />
            <div className="flex flex-col pr-5">
              <span className="font-aeonik-medium text-[13px] font-medium text-[#171717] leading-[18px] truncate">
                {formattedDateWindow}
              </span>
              <span className="text-[11px] text-[#7B7B7B]">
                {analysis.totalTourDays > 0 ? `${analysis.totalTourDays} days duration` : "Not set"}
              </span>
            </div>
          </div>

          {/* Stat 4: Concession Status */}
          <div className="bg-[#F9F9F9] rounded-[10px] p-3 flex flex-col justify-between h-[76px] relative">
            <span className="text-[11px] font-medium uppercase tracking-[0.02em] text-[#7B7B7B] leading-[12px]">
              14-Day Limit Rule
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
                {analysis.isCompliant ? "Single CoS Valid" : "Action Required"}
              </span>
              <span className="text-[11px] text-[#7B7B7B]">
                {analysis.isCompliant ? "All breaks ≤ 14d" : "Gaps > 14 days"}
              </span>
            </div>
          </div>
        </div>

        {/* Polished Status Banner Pill */}
        {analysis.isCompliant ? (
          <div className="bg-[#E3F7EC]/70 rounded-[10px] px-3.5 py-2.5 flex items-center justify-between gap-3">
            <div className="flex items-center gap-2 text-[12px] text-[#0B4627] font-medium">
              <RiCheckboxCircleLine className="size-4 shrink-0 text-[#1FC16B]" />
              <span>All tour stops satisfy UKVI Creative Worker continuous engagement limits (no gaps &gt; 14 days).</span>
            </div>
            <span className="text-[10px] font-bold uppercase tracking-wider text-[#0B4627] bg-white px-2 py-0.5 rounded-full shadow-2xs shrink-0">
              Verified
            </span>
          </div>
        ) : (
          <div className="bg-[#FFEBEC] rounded-[10px] px-3.5 py-2.5 flex items-center justify-between gap-3">
            <div className="flex items-center gap-2 text-[12px] text-[#681219] font-medium">
              <RiAlertLine className="size-4 shrink-0 text-[#FB3748]" />
              <span>
                {analysis.breaches[0]?.message || `${analysis.breachCount} gaps exceed the statutory 14-day limit.`}
              </span>
            </div>
            <span className="text-[10px] font-bold uppercase tracking-wider text-[#FB3748] bg-white px-2 py-0.5 rounded-full shadow-2xs shrink-0">
              Breach
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
