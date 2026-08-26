"use client";

import * as React from "react";
import {
  RiCalendarEventLine,
  RiAlertLine,
  RiCheckLine,
  RiUpload2Line,
  RiAddLine,
  RiDeleteBinLine,
  RiMapPinLine,
  RiTimeLine,
  RiFileTextLine,
  RiArrowRightLine,
  RiCloseLine,
  RiFileLine,
  RiDownloadLine,
} from "@remixicon/react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { toast } from "sonner";
import {
  ScheduleEvent,
  TourGapAnalysisResult,
  analyzeTourGaps,
  parseScheduleFromCsv,
  getSampleTourSchedule,
  MAX_ALLOWED_GAP_DAYS,
} from "@/lib/tour-gap-checker";

interface TourGapScheduleModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  caseId?: string | number;
  migrantName?: string;
  initialEvents?: ScheduleEvent[];
  onSaveSchedule?: (events: ScheduleEvent[], analysis: TourGapAnalysisResult) => void;
}

export function TourGapScheduleModal({
  open,
  onOpenChange,
  caseId,
  migrantName,
  initialEvents,
  onSaveSchedule,
}: TourGapScheduleModalProps) {
  const [events, setEvents] = React.useState<ScheduleEvent[]>(() => {
    if (initialEvents && initialEvents.length > 0) return initialEvents;
    return getSampleTourSchedule();
  });

  const [activeTab, setActiveTab] = React.useState<"schedule" | "upload" | "add">("schedule");
  const [csvInput, setCsvInput] = React.useState("");
  const fileInputRef = React.useRef<HTMLInputElement>(null);

  // New Event Form State
  const [newTitle, setNewTitle] = React.useState("");
  const [newStartDate, setNewStartDate] = React.useState("");
  const [newEndDate, setNewEndDate] = React.useState("");
  const [newVenue, setNewVenue] = React.useState("");
  const [newCity, setNewCity] = React.useState("");
  const [newType, setNewType] = React.useState<ScheduleEvent["engagementType"]>("Performance");
  const [newFee, setNewFee] = React.useState("");

  // Re-sync initial events or local storage when modal opens
  React.useEffect(() => {
    if (open) {
      if (caseId && typeof window !== "undefined") {
        try {
          const stored = localStorage.getItem(`tour_schedule_${caseId}`);
          if (stored) {
            const parsed = JSON.parse(stored);
            if (Array.isArray(parsed) && parsed.length > 0) {
              setEvents(parsed);
              return;
            }
          }
        } catch (e) {}
      }
      if (initialEvents && initialEvents.length > 0) {
        setEvents(initialEvents);
      }
    }
  }, [open, caseId, initialEvents]);

  // Compute live analysis
  const analysis: TourGapAnalysisResult = React.useMemo(() => {
    return analyzeTourGaps(events);
  }, [events]);

  const handleAddEvent = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newTitle.trim() || !newStartDate) {
      toast.error("Please enter at least an engagement title and start date.");
      return;
    }

    const newEv: ScheduleEvent = {
      id: `ev-${Date.now()}`,
      title: newTitle.trim(),
      startDate: newStartDate,
      endDate: newEndDate || newStartDate,
      venue: newVenue.trim() || undefined,
      city: newCity.trim() || "London",
      country: "United Kingdom",
      engagementType: newType,
      fee: newFee.trim() || undefined,
    };

    const updated = [...events, newEv];
    setEvents(updated);
    
    // Reset form
    setNewTitle("");
    setNewStartDate("");
    setNewEndDate("");
    setNewVenue("");
    setNewCity("");
    setNewFee("");
    setActiveTab("schedule");
    toast.success("Engagement added to schedule");
  };

  const handleDeleteEvent = (id: string) => {
    setEvents((prev) => prev.filter((e) => e.id !== id));
    toast.success("Engagement removed from schedule");
  };

  const handleCsvImport = () => {
    if (!csvInput.trim()) {
      toast.error("Please paste CSV data or choose a schedule file.");
      return;
    }
    const parsed = parseScheduleFromCsv(csvInput);
    if (parsed.length === 0) {
      toast.error("Could not parse schedule. Ensure headers include Title, Start Date, End Date, Venue.");
      return;
    }
    setEvents(parsed);
    setActiveTab("schedule");
    toast.success(`Imported ${parsed.length} engagements successfully`);
  };

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (evt) => {
      const text = evt.target?.result as string;
      if (text) {
        const parsed = parseScheduleFromCsv(text);
        if (parsed.length > 0) {
          setEvents(parsed);
          setActiveTab("schedule");
          toast.success(`Parsed ${parsed.length} engagements from ${file.name}`);
        } else {
          toast.error("No valid engagement rows found in CSV file.");
        }
      }
    };
    reader.readAsText(file);
  };

  const handleSaveAndApply = () => {
    if (caseId && typeof window !== "undefined") {
      try {
        localStorage.setItem(`tour_schedule_${caseId}`, JSON.stringify(events));
        localStorage.setItem(`tour_schedule_analysis_${caseId}`, JSON.stringify(analysis));
      } catch (e) {}
    }

    if (onSaveSchedule) {
      onSaveSchedule(events, analysis);
    }

    if (analysis.isCompliant) {
      toast.success("Schedule verified: 100% compliant with 14-day UKVI tour gap limit.");
    } else {
      toast.warning(`Schedule saved with ${analysis.breachCount} tour gap violation(s).`);
    }

    onOpenChange(false);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-[760px] w-[95vw] !p-0 !gap-0 !overflow-hidden rounded-card bg-card border-border shadow-card-large font-sans flex flex-col h-[680px] max-h-[90vh]">
        {/* Header */}
        <DialogHeader className="px-xl py-lg border-b border-border bg-card flex flex-row items-center justify-between space-y-0 text-left shrink-0">
          <div className="flex items-center gap-md">
            <div
              className={`size-9 rounded-compact flex items-center justify-center shrink-0 ${
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
            <div>
              <DialogTitle className="font-aeonik-medium text-label-lg text-foreground tracking-[-0.006em]">
                14-Day Tour Gap Compliance Checker
              </DialogTitle>
              <p className="text-paragraph-xs text-muted-foreground mt-xxs">
                {migrantName ? `Itinerary validation for ${migrantName}` : "UKVI Appendix Creative Worker tour schedule rules"}
              </p>
            </div>
          </div>

          <div className="flex items-center gap-xs">
            <span
              className={`text-label-compact px-sm py-xxs rounded-compact font-medium ${
                analysis.isCompliant
                  ? "bg-success-light text-success-dark"
                  : "bg-error-light text-error-dark"
              }`}
            >
              {analysis.isCompliant
                ? "100% Compliant (All gaps ≤ 14 days)"
                : `${analysis.breachCount} Tour Gap Breach${analysis.breachCount === 1 ? "" : "es"}`}
            </span>
          </div>
        </DialogHeader>

        {/* Tab Navigation */}
        <div className="px-xl flex items-center gap-lg border-b border-border bg-neutral-50 h-[44px] shrink-0">
          <Button
            type="button"
            variant="ghost"
            onClick={() => setActiveTab("schedule")}
            className={`h-full text-label-sm font-medium border-b-2 rounded-none px-0 cursor-pointer ${
              activeTab === "schedule"
                ? "border-foreground text-foreground"
                : "border-transparent text-muted-foreground hover:text-foreground"
            }`}
          >
            <RiCalendarEventLine className="size-4 mr-1.5" />
            Schedule Timeline ({events.length})
          </Button>

          <Button
            type="button"
            variant="ghost"
            onClick={() => setActiveTab("add")}
            className={`h-full text-label-sm font-medium border-b-2 rounded-none px-0 cursor-pointer ${
              activeTab === "add"
                ? "border-foreground text-foreground"
                : "border-transparent text-muted-foreground hover:text-foreground"
            }`}
          >
            <RiAddLine className="size-4 mr-1.5" />
            Add Engagement
          </Button>

          <Button
            type="button"
            variant="ghost"
            onClick={() => setActiveTab("upload")}
            className={`h-full text-label-sm font-medium border-b-2 rounded-none px-0 cursor-pointer ${
              activeTab === "upload"
                ? "border-foreground text-foreground"
                : "border-transparent text-muted-foreground hover:text-foreground"
            }`}
          >
            <RiUpload2Line className="size-4 mr-1.5" />
            Upload CSV / Spreadsheet
          </Button>
        </div>

        {/* Content Body */}
        <div className="p-xl flex-1 overflow-y-auto flex flex-col gap-lg bg-card">
          {/* Top Metrics Cards */}
          <div className="grid grid-cols-4 gap-md shrink-0">
            <div className="p-md rounded-input bg-neutral-50 border border-border flex flex-col">
              <span className="text-subheading-2xs text-muted-foreground uppercase">Engagements</span>
              <span className="text-h6-title font-medium text-foreground mt-xxs">{analysis.totalEvents}</span>
            </div>
            <div className="p-md rounded-input bg-neutral-50 border border-border flex flex-col">
              <span className="text-subheading-2xs text-muted-foreground uppercase">Tour Duration</span>
              <span className="text-h6-title font-medium text-foreground mt-xxs">{analysis.totalTourDays} days</span>
            </div>
            <div className="p-md rounded-input bg-neutral-50 border border-border flex flex-col">
              <span className="text-subheading-2xs text-muted-foreground uppercase">Max Gap Found</span>
              <span
                className={`text-h6-title font-medium mt-xxs ${
                  analysis.maxGapDays > MAX_ALLOWED_GAP_DAYS ? "text-error-dark" : "text-foreground"
                }`}
              >
                {analysis.maxGapDays} days
              </span>
            </div>
            <div className="p-md rounded-input bg-neutral-50 border border-border flex flex-col">
              <span className="text-subheading-2xs text-muted-foreground uppercase">14-Day Status</span>
              <span
                className={`text-label-md font-medium mt-xxs ${
                  analysis.isCompliant ? "text-success-dark" : "text-error-dark"
                }`}
              >
                {analysis.isCompliant ? "Passed" : "Breach (Action Req)"}
              </span>
            </div>
          </div>

          {/* Compliance Warning Banner if Breach */}
          {!analysis.isCompliant && (
            <div className="p-md rounded-input bg-error-light border border-error-dark/30 flex items-start gap-md text-paragraph-xs">
              <RiAlertLine className="size-5 text-error-dark shrink-0 mt-0.5" />
              <div className="flex-1">
                <p className="font-semibold text-error-dark">
                  UKVI 14-Day Tour Gap Limit Breach Detected ({analysis.breachCount} break{analysis.breachCount === 1 ? "" : "s"} &gt; 14 days)
                </p>
                <p className="text-foreground/80 mt-xxs">
                  Under Home Office Appendix Creative Worker rules, gaps between engagements cannot exceed 14 consecutive calendar days. Please insert intermediate rehearsal/filming dates or split this itinerary into separate CoS applications.
                </p>
              </div>
            </div>
          )}

          {/* TAB 1: SCHEDULE TIMELINE */}
          {activeTab === "schedule" && (
            <div className="flex flex-col gap-sm">
              {events.length === 0 ? (
                <div className="py-12 flex flex-col items-center justify-center text-center gap-sm border border-dashed border-border rounded-card">
                  <RiCalendarEventLine className="size-8 text-neutral-400" />
                  <p className="text-label-md font-medium text-foreground">No engagements on schedule</p>
                  <p className="text-paragraph-xs text-muted-foreground">
                    Add engagements manually or upload an itinerary CSV/Spreadsheet.
                  </p>
                  <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    onClick={() => setActiveTab("add")}
                    className="mt-xs text-xs"
                  >
                    <RiAddLine className="size-4 mr-1" />
                    Add First Engagement
                  </Button>
                </div>
              ) : (
                <div className="flex flex-col gap-md">
                  {analysis.events.map((ev, idx) => {
                    const followingGap = analysis.gaps[idx];

                    return (
                      <React.Fragment key={ev.id}>
                        {/* Event Card */}
                        <div className="p-lg rounded-card bg-neutral-50 border border-border flex items-center justify-between gap-md">
                          <div className="flex items-start gap-md min-w-0 flex-1">
                            <div className="size-8 rounded-compact bg-brand-light text-brand-dark flex items-center justify-center shrink-0 mt-0.5 text-xs font-semibold">
                              #{idx + 1}
                            </div>
                            <div className="flex flex-col min-w-0 flex-1">
                              <div className="flex items-center gap-xs flex-wrap">
                                <span className="text-label-sm font-medium text-foreground truncate">
                                  {ev.title}
                                </span>
                                <span className="text-[11px] font-medium bg-neutral-200 text-neutral-700 px-xs py-0.5 rounded-compact">
                                  {ev.engagementType || "Performance"}
                                </span>
                              </div>
                              <div className="flex items-center gap-md text-paragraph-xs text-muted-foreground mt-xxs flex-wrap">
                                <span className="flex items-center gap-xs">
                                  <RiTimeLine className="size-3.5" />
                                  {ev.startDate} {ev.endDate && ev.endDate !== ev.startDate ? `to ${ev.endDate}` : ""}
                                </span>
                                {ev.venue && (
                                  <span className="flex items-center gap-xs truncate">
                                    <RiMapPinLine className="size-3.5" />
                                    {ev.venue}, {ev.city || "UK"}
                                  </span>
                                )}
                                {ev.fee && (
                                  <span className="text-foreground font-medium">
                                    Fee: {ev.fee}
                                  </span>
                                )}
                              </div>
                            </div>
                          </div>

                          <Button
                            type="button"
                            variant="ghost"
                            size="icon-xs"
                            aria-label={`Remove ${ev.title}`}
                            onClick={() => handleDeleteEvent(ev.id)}
                            className="size-7 text-neutral-400 hover:text-error-dark hover:bg-error-light rounded-compact transition-colors p-0 cursor-pointer"
                          >
                            <RiDeleteBinLine className="size-4" />
                          </Button>
                        </div>

                        {/* Connector / Gap Node */}
                        {followingGap && (
                          <div className="flex items-center justify-center my-xxs">
                            <div
                              className={`px-md py-xs rounded-full border text-[11px] font-medium flex items-center gap-xs transition-all ${
                                followingGap.isBreach
                                  ? "bg-error-light border-error-dark text-error-dark font-bold shadow-sm animate-pulse"
                                  : followingGap.isWarning
                                  ? "bg-warning-light border-warning-dark text-warning-dark"
                                  : "bg-success-light/60 border-success-dark/30 text-success-dark"
                              }`}
                            >
                              {followingGap.isBreach ? (
                                <RiAlertLine className="size-3.5" />
                              ) : (
                                <RiCheckLine className="size-3.5" />
                              )}
                              <span>
                                {followingGap.gapDays === 0
                                  ? "Continuous / Next Day (0 days gap)"
                                  : `${followingGap.gapDays} day${followingGap.gapDays === 1 ? "" : "s"} gap ${
                                      followingGap.isBreach
                                        ? `— BREACH (> ${MAX_ALLOWED_GAP_DAYS} days max)`
                                        : followingGap.isWarning
                                        ? "(Approaching 14-day limit)"
                                        : "(Compliant)"
                                    }`}
                              </span>
                            </div>
                          </div>
                        )}
                      </React.Fragment>
                    );
                  })}
                </div>
              )}
            </div>
          )}

          {/* TAB 2: ADD ENGAGEMENT FORM */}
          {activeTab === "add" && (
            <form onSubmit={handleAddEvent} className="flex flex-col gap-md">
              <div className="grid grid-cols-2 gap-md">
                <div className="space-y-xxs">
                  <Label htmlFor="ev-title" className="text-label-sm">Engagement Title *</Label>
                  <Input
                    id="ev-title"
                    value={newTitle}
                    onChange={(e) => setNewTitle(e.target.value)}
                    placeholder="e.g. Manchester Arena Concert"
                    required
                  />
                </div>
                <div className="space-y-xxs">
                  <Label htmlFor="ev-type" className="text-label-sm">Engagement Type</Label>
                  <Input
                    id="ev-type"
                    value={newType}
                    onChange={(e) => setNewType(e.target.value as any)}
                    placeholder="Performance / Rehearsal / Filming"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-md">
                <div className="space-y-xxs">
                  <Label htmlFor="ev-start" className="text-label-sm">Start Date *</Label>
                  <Input
                    id="ev-start"
                    type="date"
                    value={newStartDate}
                    onChange={(e) => setNewStartDate(e.target.value)}
                    required
                  />
                </div>
                <div className="space-y-xxs">
                  <Label htmlFor="ev-end" className="text-label-sm">End Date</Label>
                  <Input
                    id="ev-end"
                    type="date"
                    value={newEndDate}
                    onChange={(e) => setNewEndDate(e.target.value)}
                  />
                </div>
              </div>

              <div className="grid grid-cols-3 gap-md">
                <div className="space-y-xxs">
                  <Label htmlFor="ev-venue" className="text-label-sm">Venue / Studio</Label>
                  <Input
                    id="ev-venue"
                    value={newVenue}
                    onChange={(e) => setNewVenue(e.target.value)}
                    placeholder="e.g. AO Arena"
                  />
                </div>
                <div className="space-y-xxs">
                  <Label htmlFor="ev-city" className="text-label-sm">City</Label>
                  <Input
                    id="ev-city"
                    value={newCity}
                    onChange={(e) => setNewCity(e.target.value)}
                    placeholder="e.g. Manchester"
                  />
                </div>
                <div className="space-y-xxs">
                  <Label htmlFor="ev-fee" className="text-label-sm">Fee / Pay</Label>
                  <Input
                    id="ev-fee"
                    value={newFee}
                    onChange={(e) => setNewFee(e.target.value)}
                    placeholder="e.g. £2,500"
                  />
                </div>
              </div>

              <div className="flex justify-end gap-md mt-sm">
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  onClick={() => setActiveTab("schedule")}
                >
                  Cancel
                </Button>
                <Button
                  type="submit"
                  size="sm"
                  className="bg-brand-medium hover:bg-brand-dark text-white gap-xs"
                >
                  <RiAddLine className="size-4" />
                  Add &amp; Recalculate Gaps
                </Button>
              </div>
            </form>
          )}

          {/* TAB 3: UPLOAD CSV / SPREADSHEET */}
          {activeTab === "upload" && (
            <div className="flex flex-col gap-md">
              <div className="p-xl border-2 border-dashed border-neutral-300 rounded-card flex flex-col items-center justify-center text-center gap-sm bg-neutral-50/50 hover:bg-neutral-50 transition-colors">
                <RiUpload2Line className="size-8 text-brand-medium" />
                <div>
                  <p className="text-label-md font-medium text-foreground">
                    Upload Production Itinerary / Tour Schedule
                  </p>
                  <p className="text-paragraph-xs text-muted-foreground mt-xxs">
                    Upload an ENT IMM schedule, tour CSV, or Excel export to automatically detect tour gap limits.
                  </p>
                </div>
                <div className="flex flex-col items-center gap-sm">
                  <Input
                    type="file"
                    ref={fileInputRef}
                    accept=".csv,.txt"
                    onChange={handleFileUpload}
                    className="hidden"
                  />
                  <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    onClick={() => fileInputRef.current?.click()}
                    className="gap-xs bg-white cursor-pointer"
                  >
                    <RiFileLine className="size-4" />
                    Select Schedule File (.csv)
                  </Button>
                </div>
              </div>

              <div className="space-y-xs">
                <Label className="text-label-sm">Or Paste CSV Schedule Data</Label>
                <Textarea
                  value={csvInput}
                  onChange={(e) => setCsvInput(e.target.value)}
                  placeholder={`Title,Start Date,End Date,Venue,City,Type,Fee\nLondon Show,2026-09-01,2026-09-03,O2 Arena,London,Performance,£2500\nManchester Show,2026-09-12,2026-09-14,AO Arena,Manchester,Performance,£2200`}
                  className="w-full h-[120px] p-md rounded-input border border-border bg-card text-paragraph-xs font-mono resize-none focus:outline-none focus:border-brand-medium"
                />
                <Button
                  type="button"
                  size="sm"
                  onClick={handleCsvImport}
                  className="w-full bg-brand-medium hover:bg-brand-dark text-white gap-xs"
                >
                  <RiCheckLine className="size-4" />
                  Parse &amp; Validate Tour Gaps
                </Button>
              </div>
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="px-xl py-lg border-t border-border bg-neutral-50 flex flex-row items-center justify-between w-full shrink-0">
          <div className="text-paragraph-xs text-muted-foreground flex items-center gap-xs">
            <span>UKVI Appendix Creative Worker continuous tour limit:</span>
            <span className="font-semibold text-foreground">14 calendar days maximum</span>
          </div>

          <div className="flex items-center gap-md">
            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={() => onOpenChange(false)}
              className="h-9 px-lg rounded-button text-[13px] font-medium border-neutral-300"
            >
              Close
            </Button>
            <Button
              type="button"
              size="sm"
              onClick={handleSaveAndApply}
              className={`h-9 px-lg rounded-button text-[13px] font-medium gap-xs ${
                analysis.isCompliant
                  ? "bg-brand-medium hover:bg-brand-dark text-white"
                  : "bg-error-dark hover:bg-error-dark/90 text-white"
              }`}
            >
              <RiCheckLine className="size-4" />
              <span>Save &amp; Verify Schedule</span>
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
