"use client";

import * as React from "react";
import {
  RiCalendarEventLine,
  RiAlertLine,
  RiCheckLine,
  RiTimeLine,
  RiArrowRightLine,
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

  return (
    <>
      <div
        className={`p-xl rounded-card bg-card border transition-all font-sans flex flex-col justify-between gap-md ${
          analysis.isCompliant
            ? "border-border shadow-x-small"
            : "border-error-dark/40 bg-error-light/10 shadow-sm"
        } ${className}`}
      >
        {/* Header */}
        <div className="flex items-start justify-between gap-md">
          <div className="flex items-center gap-md min-w-0">
            <div
              className={`size-10 rounded-compact flex items-center justify-center shrink-0 ${
                analysis.isCompliant
                  ? "bg-success-light text-success-dark"
                  : "bg-error-light text-error-dark"
              }`}
            >
              {analysis.isCompliant ? (
                <RiCheckLine className="size-5" />
              ) : (
                <RiAlertLine className="size-5" />
              )}
            </div>
            <div className="min-w-0">
              <div className="flex items-center gap-xs flex-wrap">
                <h4 className="font-aeonik-medium text-label-md text-foreground tracking-[-0.006em]">
                  14-Day Tour Gap Compliance
                </h4>
                <span
                  className={`text-[11px] font-medium px-xs py-0.5 rounded-compact ${
                    analysis.isCompliant
                      ? "bg-success-light text-success-dark"
                      : "bg-error-light text-error-dark"
                  }`}
                >
                  {analysis.isCompliant ? "Compliant" : `${analysis.breachCount} Limit Breach`}
                </span>
              </div>
              <p className="text-paragraph-xs text-muted-foreground mt-xxs">
                UKVI Appendix Creative Worker &bull; Maximum 14 days between continuous tour engagements
              </p>
            </div>
          </div>

          <Button
            type="button"
            variant="outline"
            size="sm"
            onClick={() => setIsModalOpen(true)}
            className="h-8 px-md text-xs font-medium gap-xs rounded-button shrink-0"
          >
            <span>Inspect Schedule</span>
            <RiArrowRightLine className="size-3.5" />
          </Button>
        </div>

        {/* Breakdown summary */}
        <div className="grid grid-cols-3 gap-sm py-xs border-t border-b border-border text-paragraph-xs">
          <div>
            <span className="text-muted-foreground block">Engagements:</span>
            <span className="font-medium text-foreground">{analysis.totalEvents} tour stops</span>
          </div>
          <div>
            <span className="text-muted-foreground block">Max Break:</span>
            <span
              className={`font-medium ${
                analysis.maxGapDays > MAX_ALLOWED_GAP_DAYS ? "text-error-dark" : "text-foreground"
              }`}
            >
              {analysis.maxGapDays} calendar days
            </span>
          </div>
          <div>
            <span className="text-muted-foreground block">Schedule Dates:</span>
            <span className="font-medium text-foreground truncate block">
              {analysis.overallStartDate && analysis.overallEndDate
                ? `${analysis.overallStartDate} to ${analysis.overallEndDate}`
                : "No dates registered"}
            </span>
          </div>
        </div>

        {/* Warning or Success Message */}
        <div>
          {analysis.isCompliant ? (
            <p className="text-paragraph-xs text-success-dark flex items-center gap-xs">
              <RiCheckLine className="size-4 shrink-0" />
              <span>All engagements meet Home Office continuous itinerary requirements (gaps &le; 14 days).</span>
            </p>
          ) : (
            <p className="text-paragraph-xs text-error-dark flex items-center gap-xs font-medium">
              <RiAlertLine className="size-4 shrink-0" />
              <span>
                Compliance action required: {analysis.breaches[0]?.message || `${analysis.breachCount} gaps exceed 14 days`}.
              </span>
            </p>
          )}
        </div>
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
