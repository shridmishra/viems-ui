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
  RiFileLine,
  RiCheckboxCircleLine,
  RiCloseLine,
  RiTimer2Line,
  RiRouteLine,
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
      <DialogContent className="max-w-[760px] w-[95vw] !p-0 !gap-0 !overflow-hidden rounded-[20px] bg-white border border-[#F5F5F5] shadow-2xl font-sans flex flex-col h-[680px] max-h-[90vh]">
        {/* Header */}
        <DialogHeader className="px-6 py-4.5 pr-14 border-b border-[#F5F5F5] bg-white flex flex-row items-center justify-between space-y-0 text-left shrink-0">
          <div className="flex items-center gap-3 min-w-0 flex-1">
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
                <DialogTitle className="font-aeonik-medium text-[17px] text-[#171717] leading-[22px]">
                  14-Day Tour Gap Compliance Checker
                </DialogTitle>
                <span
                  className={`px-2 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-wider ${
                    analysis.isCompliant
                      ? "bg-[#E3F7EC] text-[#0B4627]"
                      : "bg-[#FFEBEC] text-[#FB3748]"
                  }`}
                >
                  {analysis.isCompliant ? "COMPLIANT" : "AT RISK"}
                </span>
              </div>
              <p className="text-[12px] text-[#7B7B7B] mt-0.5">
                {migrantName ? `Itinerary validation for ${migrantName}` : "Creative Worker concession · Max 14-day gap"}
              </p>
            </div>
          </div>
        </DialogHeader>

        {/* Tab Navigation Segmented Pill */}
        <div className="px-6 py-2.5 bg-white border-b border-[#F5F5F5] flex items-center justify-between shrink-0">
          <div className="flex p-1 bg-[#F5F5F5] rounded-full text-[12px] font-medium">
            <button
              type="button"
              onClick={() => setActiveTab("schedule")}
              className={`px-3.5 py-1 rounded-full transition-all cursor-pointer border-0 flex items-center gap-1.5 ${
                activeTab === "schedule"
                  ? "bg-white text-[#171717] shadow-2xs font-semibold"
                  : "text-[#7B7B7B] hover:text-[#171717]"
              }`}
            >
              <RiCalendarEventLine className="size-3.5" />
              <span>Timeline ({events.length})</span>
            </button>

            <button
              type="button"
              onClick={() => setActiveTab("add")}
              className={`px-3.5 py-1 rounded-full transition-all cursor-pointer border-0 flex items-center gap-1.5 ${
                activeTab === "add"
                  ? "bg-white text-[#171717] shadow-2xs font-semibold"
                  : "text-[#7B7B7B] hover:text-[#171717]"
              }`}
            >
              <RiAddLine className="size-3.5" />
              <span>Add Engagement</span>
            </button>

            <button
              type="button"
              onClick={() => setActiveTab("upload")}
              className={`px-3.5 py-1 rounded-full transition-all cursor-pointer border-0 flex items-center gap-1.5 ${
                activeTab === "upload"
                  ? "bg-white text-[#171717] shadow-2xs font-semibold"
                  : "text-[#7B7B7B] hover:text-[#171717]"
              }`}
            >
              <RiUpload2Line className="size-3.5" />
              <span>Upload CSV / Sheet</span>
            </button>
          </div>
        </div>

        {/* Content Body */}
        <div className="p-6 flex-1 overflow-y-auto flex flex-col gap-4 bg-white">
          {/* Top Metrics Cards (Sleek borderless background cards) */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5 shrink-0">
            <div className="p-3 rounded-[12px] bg-[#F9F9F9] flex flex-col justify-between h-[74px] relative">
              <span className="text-[11px] font-medium uppercase tracking-[0.02em] text-[#7B7B7B]">Engagements</span>
              <RiCalendarEventLine className="size-4 text-[#A4A4A4] absolute top-3 right-3" />
              <div className="flex items-baseline gap-1">
                <span className="font-aeonik-medium text-[20px] font-medium text-[#171717]">{analysis.totalEvents}</span>
                <span className="text-[12px] text-[#7B7B7B]">stops</span>
              </div>
            </div>

            <div className="p-3 rounded-[12px] bg-[#F9F9F9] flex flex-col justify-between h-[74px] relative">
              <span className="text-[11px] font-medium uppercase tracking-[0.02em] text-[#7B7B7B]">Tour Duration</span>
              <RiRouteLine className="size-4 text-[#A4A4A4] absolute top-3 right-3" />
              <div className="flex items-baseline gap-1">
                <span className="font-aeonik-medium text-[20px] font-medium text-[#171717]">{analysis.totalTourDays}</span>
                <span className="text-[12px] text-[#7B7B7B]">days</span>
              </div>
            </div>

            <div className="p-3 rounded-[12px] bg-[#F9F9F9] flex flex-col justify-between h-[74px] relative">
              <span className="text-[11px] font-medium uppercase tracking-[0.02em] text-[#7B7B7B]">Max Gap Found</span>
              <RiTimer2Line
                className={`size-4 absolute top-3 right-3 ${
                  analysis.maxGapDays > MAX_ALLOWED_GAP_DAYS ? "text-[#FB3748]" : "text-[#A4A4A4]"
                }`}
              />
              <div className="flex items-baseline gap-1">
                <span
                  className={`font-aeonik-medium text-[20px] font-medium ${
                    analysis.maxGapDays > MAX_ALLOWED_GAP_DAYS ? "text-[#FB3748]" : "text-[#171717]"
                  }`}
                >
                  {analysis.maxGapDays}
                </span>
                <span className="text-[12px] text-[#7B7B7B]">days</span>
              </div>
            </div>

            <div className="p-3 rounded-[12px] bg-[#F9F9F9] flex flex-col justify-between h-[74px] relative">
              <span className="text-[11px] font-medium uppercase tracking-[0.02em] text-[#7B7B7B]">14-Day Limit</span>
              <RiShieldCheckLine
                className={`size-4 absolute top-3 right-3 ${
                  analysis.isCompliant ? "text-[#1FC16B]" : "text-[#FB3748]"
                }`}
              />
              <span
                className={`font-aeonik-medium text-[14px] font-semibold mt-auto ${
                  analysis.isCompliant ? "text-[#0B4627]" : "text-[#FB3748]"
                }`}
              >
                {analysis.isCompliant ? "Passed (≤ 14d)" : "Breach (Action Req)"}
              </span>
            </div>
          </div>

          {/* Compliance Warning Banner if Breach */}
          {!analysis.isCompliant && (
            <div className="p-3.5 rounded-[12px] bg-[#FFEBEC] flex items-start gap-3 text-[12px]">
              <RiAlertLine className="size-4.5 text-[#FB3748] shrink-0 mt-0.5" />
              <div className="flex-1">
                <p className="font-semibold text-[#681219]">
                  UKVI 14-Day Tour Gap Limit Breach ({analysis.breachCount} gap{analysis.breachCount === 1 ? "" : "s"} &gt; 14 days)
                </p>
                <p className="text-[#681219]/80 mt-0.5 leading-[16px]">
                  Under Home Office Appendix Creative Worker rules, gaps between engagements cannot exceed 14 consecutive calendar days. Please insert intermediate rehearsal/filming dates or split this itinerary into separate CoS applications.
                </p>
              </div>
            </div>
          )}

          {/* TAB 1: SCHEDULE TIMELINE */}
          {activeTab === "schedule" && (
            <div className="flex flex-col gap-2">
              {events.length === 0 ? (
                <div className="py-12 flex flex-col items-center justify-center text-center gap-2 bg-[#F9F9F9] rounded-[16px] p-6">
                  <RiCalendarEventLine className="size-8 text-[#A4A4A4]" />
                  <p className="text-[15px] font-aeonik-medium text-[#171717]">No engagements on schedule</p>
                  <p className="text-[12px] text-[#7B7B7B]">
                    Add engagements manually or upload an itinerary CSV/Spreadsheet.
                  </p>
                  <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    onClick={() => setActiveTab("add")}
                    className="mt-2 text-xs h-8 rounded-full"
                  >
                    <RiAddLine className="size-4 mr-1" />
                    Add First Engagement
                  </Button>
                </div>
              ) : (
                <div className="flex flex-col gap-2.5">
                  {analysis.events.map((ev, idx) => {
                    const followingGap = analysis.gaps[idx];

                    return (
                      <React.Fragment key={ev.id}>
                        {/* Event Card */}
                        <div className="p-3.5 rounded-[12px] bg-[#F9F9F9] hover:bg-[#F5F5F5] transition-colors flex items-center justify-between gap-3">
                          <div className="flex items-center gap-3 min-w-0 flex-1">
                            <div className="size-7 rounded-full bg-white shadow-2xs text-[#171717] flex items-center justify-center shrink-0 text-[11px] font-semibold">
                              {idx + 1}
                            </div>
                            <div className="flex flex-col min-w-0 flex-1">
                              <div className="flex items-center gap-2 flex-wrap">
                                <span className="font-aeonik-medium text-[14px] text-[#171717] truncate">
                                  {ev.title}
                                </span>
                                <span className="text-[10px] font-bold uppercase tracking-wider bg-neutral-200/70 text-neutral-700 px-2 py-0.5 rounded-full">
                                  {ev.engagementType || "Performance"}
                                </span>
                              </div>
                              <div className="flex items-center gap-3 text-[12px] text-[#7B7B7B] mt-0.5 flex-wrap">
                                <span className="flex items-center gap-1">
                                  <RiTimeLine className="size-3.5 text-[#A4A4A4]" />
                                  {ev.startDate} {ev.endDate && ev.endDate !== ev.startDate ? `to ${ev.endDate}` : ""}
                                </span>
                                {ev.venue && (
                                  <span className="flex items-center gap-1 truncate">
                                    <RiMapPinLine className="size-3.5 text-[#A4A4A4]" />
                                    {ev.venue}, {ev.city || "UK"}
                                  </span>
                                )}
                                {ev.fee && (
                                  <span className="text-[#171717] font-medium">
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
                            className="size-7 text-[#A4A4A4] hover:text-[#FB3748] hover:bg-[#FFEBEC] rounded-full transition-colors p-0 cursor-pointer"
                          >
                            <RiDeleteBinLine className="size-4" />
                          </Button>
                        </div>

                        {/* Connector / Gap Node */}
                        {followingGap && (
                          <div className="flex items-center justify-center my-0.5">
                            <div
                              className={`px-3 py-1 rounded-full text-[11px] font-semibold flex items-center gap-1.5 transition-all ${
                                followingGap.isBreach
                                  ? "bg-[#FFEBEC] text-[#FB3748] shadow-2xs font-bold animate-pulse"
                                  : followingGap.isWarning
                                  ? "bg-[#FFFAEB] text-[#B45309]"
                                  : "bg-[#E3F7EC] text-[#0B4627]"
                              }`}
                            >
                              {followingGap.isBreach ? (
                                <RiAlertLine className="size-3.5" />
                              ) : (
                                <RiCheckLine className="size-3.5" />
                              )}
                              <span>
                                {followingGap.gapDays === 0
                                  ? "Continuous / Next Day (0d gap)"
                                  : `${followingGap.gapDays} day${followingGap.gapDays === 1 ? "" : "s"} break ${
                                      followingGap.isBreach
                                        ? `— BREACH (> ${MAX_ALLOWED_GAP_DAYS}d max)`
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
            <form onSubmit={handleAddEvent} className="flex flex-col gap-3.5 bg-[#F9F9F9] rounded-[16px] p-5">
              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-1">
                  <Label htmlFor="ev-title" className="text-[12px] font-medium text-[#171717]">Engagement Title *</Label>
                  <Input
                    id="ev-title"
                    value={newTitle}
                    onChange={(e) => setNewTitle(e.target.value)}
                    placeholder="e.g. Manchester Arena Concert"
                    required
                    className="bg-white border-0 shadow-2xs rounded-[10px] h-9 text-[13px]"
                  />
                </div>
                <div className="space-y-1">
                  <Label htmlFor="ev-type" className="text-[12px] font-medium text-[#171717]">Engagement Type</Label>
                  <Input
                    id="ev-type"
                    value={newType}
                    onChange={(e) => setNewType(e.target.value as any)}
                    placeholder="Performance / Rehearsal / Filming"
                    className="bg-white border-0 shadow-2xs rounded-[10px] h-9 text-[13px]"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-1">
                  <Label htmlFor="ev-start" className="text-[12px] font-medium text-[#171717]">Start Date *</Label>
                  <Input
                    id="ev-start"
                    type="date"
                    value={newStartDate}
                    onChange={(e) => setNewStartDate(e.target.value)}
                    required
                    className="bg-white border-0 shadow-2xs rounded-[10px] h-9 text-[13px]"
                  />
                </div>
                <div className="space-y-1">
                  <Label htmlFor="ev-end" className="text-[12px] font-medium text-[#171717]">End Date</Label>
                  <Input
                    id="ev-end"
                    type="date"
                    value={newEndDate}
                    onChange={(e) => setNewEndDate(e.target.value)}
                    className="bg-white border-0 shadow-2xs rounded-[10px] h-9 text-[13px]"
                  />
                </div>
              </div>

              <div className="grid grid-cols-3 gap-3">
                <div className="space-y-1">
                  <Label htmlFor="ev-venue" className="text-[12px] font-medium text-[#171717]">Venue / Studio</Label>
                  <Input
                    id="ev-venue"
                    value={newVenue}
                    onChange={(e) => setNewVenue(e.target.value)}
                    placeholder="e.g. AO Arena"
                    className="bg-white border-0 shadow-2xs rounded-[10px] h-9 text-[13px]"
                  />
                </div>
                <div className="space-y-1">
                  <Label htmlFor="ev-city" className="text-[12px] font-medium text-[#171717]">City</Label>
                  <Input
                    id="ev-city"
                    value={newCity}
                    onChange={(e) => setNewCity(e.target.value)}
                    placeholder="e.g. Manchester"
                    className="bg-white border-0 shadow-2xs rounded-[10px] h-9 text-[13px]"
                  />
                </div>
                <div className="space-y-1">
                  <Label htmlFor="ev-fee" className="text-[12px] font-medium text-[#171717]">Fee / Pay</Label>
                  <Input
                    id="ev-fee"
                    value={newFee}
                    onChange={(e) => setNewFee(e.target.value)}
                    placeholder="e.g. £2,500"
                    className="bg-white border-0 shadow-2xs rounded-[10px] h-9 text-[13px]"
                  />
                </div>
              </div>

              <div className="flex justify-end gap-2.5 mt-2">
                <Button
                  type="button"
                  variant="ghost"
                  size="sm"
                  onClick={() => setActiveTab("schedule")}
                  className="rounded-full text-[13px]"
                >
                  Cancel
                </Button>
                <Button
                  type="submit"
                  size="sm"
                  className="bg-brand-medium hover:bg-brand-dark text-white gap-1.5 rounded-full text-[13px]"
                >
                  <RiAddLine className="size-4" />
                  Add &amp; Recalculate Gaps
                </Button>
              </div>
            </form>
          )}

          {/* TAB 3: UPLOAD CSV / SPREADSHEET */}
          {activeTab === "upload" && (
            <div className="flex flex-col gap-4">
              <div className="p-8 bg-[#F9F9F9] rounded-[16px] flex flex-col items-center justify-center text-center gap-2">
                <RiUpload2Line className="size-8 text-brand-medium" />
                <div>
                  <p className="font-aeonik-medium text-[15px] text-[#171717]">
                    Upload Production Itinerary / Tour Schedule
                  </p>
                  <p className="text-[12px] text-[#7B7B7B] mt-0.5">
                    Upload an ENT IMM schedule, tour CSV, or spreadsheet export to automatically detect tour gaps.
                  </p>
                </div>
                <div className="flex flex-col items-center gap-2 mt-2">
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
                    className="gap-1.5 bg-white cursor-pointer rounded-full h-8 text-[12px] shadow-2xs"
                  >
                    <RiFileLine className="size-3.5" />
                    Select Schedule File (.csv)
                  </Button>
                </div>
              </div>

              <div className="space-y-1.5 bg-[#F9F9F9] rounded-[16px] p-4">
                <Label className="text-[12px] font-medium text-[#171717]">Or Paste CSV Schedule Data</Label>
                <Textarea
                  value={csvInput}
                  onChange={(e) => setCsvInput(e.target.value)}
                  placeholder={`Title,Start Date,End Date,Venue,City,Type,Fee\nLondon Show,2026-09-01,2026-09-03,O2 Arena,London,Performance,£2500\nManchester Show,2026-09-12,2026-09-14,AO Arena,Manchester,Performance,£2200`}
                  className="w-full h-[100px] p-3 rounded-[10px] bg-white border-0 shadow-2xs text-[12px] font-mono resize-none focus:outline-none"
                />
                <Button
                  type="button"
                  size="sm"
                  onClick={handleCsvImport}
                  className="w-full bg-brand-medium hover:bg-brand-dark text-white gap-1.5 rounded-full text-[13px] h-8.5 mt-1"
                >
                  <RiCheckLine className="size-4" />
                  Parse &amp; Validate Tour Gaps
                </Button>
              </div>
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="px-6 py-3.5 border-t border-[#F5F5F5] bg-[#FAFAFA] flex flex-row items-center justify-between w-full shrink-0">
          <div className="text-[12px] text-[#7B7B7B] flex items-center gap-1.5">
            <span>UKVI Appendix Creative Worker tour limit:</span>
            <span className="font-semibold text-[#171717]">14 calendar days maximum</span>
          </div>

          <div className="flex items-center gap-2.5">
            <Button
              type="button"
              variant="ghost"
              size="sm"
              onClick={() => onOpenChange(false)}
              className="h-8.5 px-4 rounded-full text-[13px] font-medium text-[#5C5C5C] hover:text-[#171717]"
            >
              Close
            </Button>
            <Button
              type="button"
              size="sm"
              onClick={handleSaveAndApply}
              className={`h-8.5 px-4.5 rounded-full text-[13px] font-medium gap-1.5 ${
                analysis.isCompliant
                  ? "bg-brand-medium hover:bg-brand-dark text-white"
                  : "bg-[#FB3748] hover:bg-[#FB3748]/90 text-white"
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
