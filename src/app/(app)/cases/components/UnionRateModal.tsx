"use client";

import * as React from "react";
import {
  RiShieldCheckLine,
  RiAlertLine,
  RiCheckLine,
  RiSearchLine,
  RiCloseLine,
  RiFileTextLine,
  RiArrowRightSLine,
  RiMoneyPoundCircleLine,
  RiBuildingLine,
} from "@remixicon/react";
import {
  Dialog,
  DialogContent,
  DialogTitle,
  DialogHeader,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { toast } from "sonner";
import {
  RatePeriod,
  UnionRateCard,
  UnionRateValidationResult,
  validateRemuneration,
  formatCurrency,
  parseSalaryAmount,
  detectSalaryPeriod,
  OFFICIAL_UNION_RATES,
} from "@/lib/union-rates";

interface UnionRateModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  caseId?: string | number;
  migrantName?: string;
  initialSalary?: string | number;
  initialJobTitle?: string;
  initialUnion?: string;
  onSuccess?: (result: UnionRateValidationResult) => void;
}

function getInitialRateFormValues(
  caseId?: string | number,
  initialUnion?: string,
  initialJobTitle?: string,
  initialSalary?: string | number
) {
  let union = initialUnion || "EQUITY";
  let jobTitle = initialJobTitle || "";
  const num = parseSalaryAmount(initialSalary);
  let amount = num > 0 ? String(num) : "750";
  let period = detectSalaryPeriod(initialSalary);

  if (caseId && typeof window !== "undefined") {
    try {
      const stored = localStorage.getItem(`union_rate_${caseId}`);
      if (stored) {
        const parsed = JSON.parse(stored);
        if (parsed.union) union = parsed.union;
        if (parsed.jobTitle) jobTitle = parsed.jobTitle;
        if (parsed.amount) amount = String(parsed.amount);
        if (parsed.period) period = parsed.period;
      }
    } catch {
      // ignore parsing error
    }
  }

  return { union, jobTitle, amount, period };
}

interface UnionRateModalContentProps {
  caseId?: string | number;
  migrantName: string;
  initialSalary?: string | number;
  initialJobTitle?: string;
  initialUnion?: string;
  onSuccess?: (result: UnionRateValidationResult) => void;
  onClose: () => void;
}

function UnionRateModalContent({
  caseId,
  migrantName,
  initialSalary = "",
  initialJobTitle = "",
  initialUnion = "EQUITY",
  onSuccess,
  onClose,
}: UnionRateModalContentProps) {
  const [activeTab, setActiveTab] = React.useState<"validator" | "rates">("validator");

  const initial = React.useMemo(
    () => getInitialRateFormValues(caseId, initialUnion, initialJobTitle, initialSalary),
    [caseId, initialUnion, initialJobTitle, initialSalary]
  );

  // Form state
  const [selectedUnion, setSelectedUnion] = React.useState<string>(initial.union);
  const [jobTitle, setJobTitle] = React.useState<string>(initial.jobTitle);
  const [amount, setAmount] = React.useState<string>(initial.amount);
  const [period, setPeriod] = React.useState<RatePeriod>(initial.period);
  const hoursPerWeek = "37.5";

  // Rate browser state
  const [searchQuery, setSearchQuery] = React.useState<string>("");
  const [browserUnionFilter, setBrowserUnionFilter] = React.useState<string>("ALL");

  // Live validation computation
  const validation: UnionRateValidationResult = React.useMemo(() => {
    return validateRemuneration({
      union: selectedUnion,
      jobTitle,
      amount,
      period,
      currency: "GBP",
      hoursPerWeek,
    });
  }, [selectedUnion, jobTitle, amount, period, hoursPerWeek]);

  // Handle applying union minimum pay with 1 click
  const handleApplyMinimum = () => {
    if (validation.minimumRate > 0) {
      setAmount(String(validation.minimumRate));
      setPeriod(validation.period);
      toast.success(
        `Adjusted pay to ${validation.union} minimum: ${formatCurrency(validation.minimumRate, "GBP")}/${validation.period.toLowerCase()}`
      );
    }
  };

  // Handle saving compliance clearance
  const handleSaveClearance = () => {
    if (typeof window !== "undefined" && caseId) {
      try {
        localStorage.setItem(
          `union_rate_${caseId}`,
          JSON.stringify({
            union: selectedUnion,
            jobTitle,
            amount,
            period,
            clearedAt: new Date().toISOString(),
            isCompliant: validation.isCompliant,
            status: validation.status,
            minimumRate: validation.minimumRate,
            agreementName: validation.agreementName,
          })
        );
      } catch (err) {
        console.error("Failed to save union rate clearance:", err);
      }
    }

    if (onSuccess) {
      onSuccess(validation);
    }

    toast.success("Union rate and salary compliance recorded", {
      description: validation.isCompliant
        ? `Remuneration conforms with ${validation.agreementName}.`
        : `Flagged below ${validation.union} minimum rate.`,
    });

    onClose();
  };

  // Filtered rate cards for browser tab
  const filteredRateCards = React.useMemo(() => {
    return OFFICIAL_UNION_RATES.filter((rate) => {
      if (browserUnionFilter !== "ALL" && rate.union !== browserUnionFilter) {
        return false;
      }
      if (!searchQuery) return true;
      const q = searchQuery.toLowerCase();
      return (
        rate.jobTitle.toLowerCase().includes(q) ||
        rate.roleCategory.toLowerCase().includes(q) ||
        rate.agreementName.toLowerCase().includes(q) ||
        rate.union.toLowerCase().includes(q)
      );
    });
  }, [browserUnionFilter, searchQuery]);

  // Union counts for directory filter pills
  const unionCounts = React.useMemo(() => {
    const counts: Record<string, number> = { ALL: OFFICIAL_UNION_RATES.length };
    OFFICIAL_UNION_RATES.forEach((r) => {
      counts[r.union] = (counts[r.union] || 0) + 1;
    });
    return counts;
  }, []);

  // Handle selecting a rate card from the browser
  const handleSelectRateCard = (card: UnionRateCard) => {
    setSelectedUnion(card.union);
    setJobTitle(card.jobTitle);
    setPeriod(card.period);
    setAmount(String(card.minimumRate));
    setActiveTab("validator");
    toast.info(`Loaded ${card.union} scale for ${card.jobTitle}`);
  };

  return (
    <>
      {/* Header matching TourGapScheduleModal standard */}
      <DialogHeader className="px-6 py-4 border-b border-border bg-card flex flex-row items-center justify-between space-y-0 text-left shrink-0">
        <div className="flex items-center gap-3 min-w-0 flex-1">
          <div
            className={`size-9 rounded-full flex items-center justify-center shrink-0 ${
              validation.status === "EXEMPT"
                ? "bg-neutral-100 text-neutral-600"
                : validation.isCompliant
                ? "bg-success-light text-success-dark"
                : "bg-error-light text-error-dark"
            }`}
          >
            {validation.isCompliant ? (
              <RiCheckLine className="size-5" />
            ) : (
              <RiAlertLine className="size-5" />
            )}
          </div>
          <div className="flex flex-col min-w-0">
            <div className="flex items-center gap-2 flex-wrap">
              <DialogTitle className="font-aeonik-medium text-[17px] text-foreground leading-[22px]">
                Union Rate Integration &amp; Salary Clearance
              </DialogTitle>
              <Badge
                variant={
                  validation.status === "EXEMPT"
                    ? "neutral-lighter"
                    : validation.isCompliant
                    ? "success"
                    : "destructive"
                }
                withDot
              >
                {validation.status === "EXEMPT"
                  ? "EXEMPT / NON-UNION"
                  : validation.isCompliant
                  ? "COMPLIANT"
                  : "BELOW MINIMUM"}
              </Badge>
            </div>
            <p className="text-[12px] text-neutral-500 mt-0.5 truncate">
              {migrantName ? `UKVI wage compliance assessment for ${migrantName}` : "UKVI Appendix Creative Worker & Temporary Work wage compliance"}
            </p>
          </div>
        </div>
        <Button
          type="button"
          variant="ghost"
          size="icon"
          aria-label="Close union rate dialog"
          className="size-7 rounded-full text-neutral-400 hover:text-foreground hover:bg-neutral-100"
          onClick={onClose}
        >
          <RiCloseLine className="size-4" />
        </Button>
      </DialogHeader>

      {/* Tab Navigation Segmented Pill matching TourGapScheduleModal */}
      <div className="px-6 py-2.5 bg-card border-b border-border flex items-center justify-between shrink-0">
        <div className="flex p-1 bg-neutral-100 rounded-full text-[12px] font-medium">
          <Button
            type="button"
            variant="ghost"
            onClick={() => setActiveTab("validator")}
            className={`h-7 px-3.5 rounded-full text-xs font-medium transition-all flex items-center gap-1.5 ${
              activeTab === "validator"
                ? "bg-card text-foreground shadow-x-small hover:bg-card"
                : "text-neutral-500 hover:text-foreground hover:bg-transparent"
            }`}
          >
            <RiShieldCheckLine className="size-3.5" />
            <span>Salary Validator</span>
          </Button>
          <Button
            type="button"
            variant="ghost"
            onClick={() => setActiveTab("rates")}
            className={`h-7 px-3.5 rounded-full text-xs font-medium transition-all flex items-center gap-1.5 ${
              activeTab === "rates"
                ? "bg-card text-foreground shadow-x-small hover:bg-card"
                : "text-neutral-500 hover:text-foreground hover:bg-transparent"
            }`}
          >
            <RiFileTextLine className="size-3.5" />
            <span>Industry Rate Cards (2026)</span>
            <span className="px-1.5 py-0.2 bg-neutral-200 text-neutral-700 rounded-full text-[10px] font-semibold">
              18
            </span>
          </Button>
        </div>

        <span className="text-[11px] text-neutral-400 hidden sm:inline">
          Official 2026 Scale
        </span>
      </div>

      {activeTab === "validator" ? (
        <div className="p-6 flex flex-col gap-5 overflow-y-auto flex-1">
          {/* Top Form Controls Grid */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="flex flex-col gap-1.5">
              <Label className="text-[13px] font-medium text-foreground">Applicable Union / Guild</Label>
              <Select
                value={selectedUnion}
                onValueChange={(val) => setSelectedUnion(val || "EQUITY")}
              >
                <SelectTrigger className="w-full h-10 rounded-input border-border bg-card text-foreground shadow-x-small">
                  <SelectValue placeholder="Select union" />
                </SelectTrigger>
                <SelectContent className="rounded-input border-border bg-card">
                  <SelectItem value="EQUITY">Equity (Actors, Singers, Dancers, Stage)</SelectItem>
                  <SelectItem value="MU">{"Musicians' Union (MU - Instrumentalists, Orchestras)"}</SelectItem>
                  <SelectItem value="PACT">PACT (Film, TV, Screen Production)</SelectItem>
                  <SelectItem value="BECTU">BECTU (Broadcasting, Technical &amp; Crew)</SelectItem>
                  <SelectItem value="OTHER">Other / Non-Unionized</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="flex flex-col gap-1.5">
              <Label className="text-[13px] font-medium text-foreground">Proposed Role / Job Title</Label>
              <Input
                value={jobTitle}
                onChange={(e) => setJobTitle(e.target.value)}
                placeholder="e.g. West End Performer, Sound Recordist"
                className="h-10 rounded-input border-border bg-card text-foreground shadow-x-small"
              />
            </div>
          </div>

          {/* Salary and Frequency */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="flex flex-col gap-1.5 md:col-span-2">
              <Label className="text-[13px] font-medium text-foreground">Agreed Remuneration (£ GBP)</Label>
              <div className="relative w-full">
                <RiMoneyPoundCircleLine className="absolute left-3 top-1/2 -translate-y-1/2 size-4 text-neutral-400" />
                <Input
                  type="number"
                  step="any"
                  value={amount}
                  onChange={(e) => setAmount(e.target.value)}
                  placeholder="750"
                  className="pl-9 h-10 rounded-input border-border bg-card text-foreground shadow-x-small"
                />
              </div>
            </div>

            <div className="flex flex-col gap-1.5">
              <Label className="text-[13px] font-medium text-foreground">Pay Frequency</Label>
              <Select
                value={period}
                onValueChange={(val) => {
                  if (val) setPeriod(val as RatePeriod);
                }}
              >
                <SelectTrigger className="w-full h-10 rounded-input border-border bg-card text-foreground shadow-x-small">
                  <SelectValue placeholder="Select period" />
                </SelectTrigger>
                <SelectContent className="rounded-input border-border bg-card">
                  <SelectItem value="WEEKLY">Weekly</SelectItem>
                  <SelectItem value="DAILY">Daily</SelectItem>
                  <SelectItem value="HOURLY">Hourly</SelectItem>
                  <SelectItem value="PER_PERFORMANCE">Per Performance</SelectItem>
                  <SelectItem value="ANNUAL">Annual</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>

          {/* Real-time Wage Compliance Benchmark Card */}
          <div
            className={`border rounded-card p-4.5 flex flex-col gap-3.5 transition-colors shadow-x-small ${
              validation.status === "EXEMPT"
                ? "bg-neutral-50/70 border-neutral-200"
                : validation.isCompliant
                ? "bg-success-light/40 border-success-dark/30"
                : "bg-error-light/40 border-error-dark/30"
            }`}
          >
            <div className="flex items-start justify-between gap-4 flex-wrap sm:flex-nowrap">
              <div className="flex items-start gap-3 min-w-0">
                <div
                  className={`size-8 rounded-full flex items-center justify-center shrink-0 mt-0.5 ${
                    validation.status === "EXEMPT"
                      ? "bg-neutral-200 text-neutral-700"
                      : validation.isCompliant
                      ? "bg-success-light text-success-dark"
                      : "bg-error-light text-error-dark"
                  }`}
                >
                  {validation.status === "EXEMPT" ? (
                    <RiShieldCheckLine className="size-4" />
                  ) : validation.isCompliant ? (
                    <RiCheckLine className="size-4" />
                  ) : (
                    <RiAlertLine className="size-4" />
                  )}
                </div>
                <div className="min-w-0">
                  <div className="flex items-center gap-2 flex-wrap">
                    <span className="font-semibold text-[14px] text-foreground">
                      {(validation.status === "COMPLIANT" || validation.status === "EXCEEDS_MINIMUM") && "Union Rate Compliant"}
                      {validation.status === "BELOW_MINIMUM" && "Below Union Minimum Rate"}
                      {validation.status === "EXEMPT" && "Non-Unionized / Exempt Role"}
                    </span>
                    <Badge
                      variant={
                        validation.status === "EXEMPT"
                          ? "neutral-lighter"
                          : validation.isCompliant
                          ? "success"
                          : "destructive"
                      }
                      withDot
                    >
                      {validation.union}
                    </Badge>
                  </div>
                  <p className="text-[12px] text-neutral-600 mt-1 leading-relaxed">
                    {validation.recommendation}
                  </p>
                </div>
              </div>

              {/* One-click adjustment CTA when below minimum */}
              {!validation.isCompliant && validation.status === "BELOW_MINIMUM" && (
                <Button
                  size="sm"
                  variant="default"
                  className="rounded-button text-xs bg-error-dark hover:bg-error-dark/90 text-white shrink-0 shadow-sm"
                  onClick={handleApplyMinimum}
                >
                  Apply {formatCurrency(validation.minimumRate, "GBP")}/{validation.period.toLowerCase()}
                </Button>
              )}
            </div>

            {/* 4-Stat Comparison Tiles */}
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5 pt-2 border-t border-border/40">
              <div className="bg-card/70 border border-border/40 rounded-input p-2.5 flex flex-col justify-between">
                <span className="text-[10px] font-medium uppercase tracking-[0.02em] text-neutral-500">
                  Proposed Pay
                </span>
                <span className="font-aeonik-medium text-[15px] text-foreground font-medium">
                  {formatCurrency(validation.enteredAmount, "GBP")}
                  <span className="text-[10px] text-neutral-500 font-sans ml-0.5">
                    /{period.toLowerCase()}
                  </span>
                </span>
              </div>

              <div className="bg-card/70 border border-border/40 rounded-input p-2.5 flex flex-col justify-between">
                <span className="text-[10px] font-medium uppercase tracking-[0.02em] text-neutral-500">
                  Union Benchmark
                </span>
                <span className="font-aeonik-medium text-[15px] text-foreground font-medium">
                  {validation.minimumRate > 0 ? (
                    <>
                      {formatCurrency(validation.minimumRate, "GBP")}
                      <span className="text-[10px] text-neutral-500 font-sans ml-0.5">
                        /{validation.period.toLowerCase()}
                      </span>
                    </>
                  ) : (
                    "Exempt"
                  )}
                </span>
              </div>

              <div className="bg-card/70 border border-border/40 rounded-input p-2.5 flex flex-col justify-between">
                <span className="text-[10px] font-medium uppercase tracking-[0.02em] text-neutral-500">
                  {validation.deficit > 0 ? "Deficit" : "Difference"}
                </span>
                <span
                  className={`font-aeonik-medium text-[15px] font-medium ${
                    validation.deficit > 0 ? "text-error-dark" : "text-success-dark"
                  }`}
                >
                  {validation.deficit > 0
                    ? `-${formatCurrency(validation.deficit, "GBP")}`
                    : validation.minimumRate > 0
                    ? `+${validation.percentageVariance}%`
                    : "Compliant"}
                </span>
              </div>

              <div className="bg-card/70 border border-border/40 rounded-input p-2.5 flex flex-col justify-between">
                <span className="text-[10px] font-medium uppercase tracking-[0.02em] text-neutral-500">
                  Agreement
                </span>
                <span className="text-[12px] font-medium text-foreground truncate block" title={validation.agreementName}>
                  {validation.agreementName || "Standard Scale"}
                </span>
              </div>
            </div>
          </div>
        </div>
      ) : (
        /* Industry Rate Cards Directory Tab */
        <div className="p-6 flex flex-col gap-4 overflow-y-auto flex-1">
          {/* Search Bar & Union Filter Pills */}
          <div className="flex flex-col gap-3">
            <div className="relative w-full">
              <RiSearchLine className="absolute left-3 top-1/2 -translate-y-1/2 size-4 text-neutral-400" />
              <Input
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Search job title, role category or collective agreement..."
                className="pl-9 h-10 rounded-input border-border bg-card text-foreground shadow-x-small"
              />
            </div>
            <div className="flex items-center gap-1.5 flex-wrap">
              {["ALL", "EQUITY", "MU", "PACT", "BECTU"].map((u) => (
                <Button
                  key={u}
                  type="button"
                  size="sm"
                  variant={browserUnionFilter === u ? "default" : "outline"}
                  className={`h-7 px-3 rounded-full text-xs font-medium transition-all ${
                    browserUnionFilter === u
                      ? "bg-brand-medium text-white hover:bg-brand-dark shadow-x-small"
                      : "text-neutral-600 border-border hover:bg-neutral-100"
                  }`}
                  onClick={() => setBrowserUnionFilter(u)}
                >
                  <span>{u}</span>
                  <span className={`ml-1 text-[10px] px-1 rounded-full ${
                    browserUnionFilter === u ? "bg-white/20 text-white" : "bg-neutral-200 text-neutral-600"
                  }`}>
                    {unionCounts[u] || 0}
                  </span>
                </Button>
              ))}
            </div>
          </div>

          {/* Cards Directory List */}
          <div className="flex flex-col gap-2 max-h-[380px] overflow-y-auto pr-1">
            {filteredRateCards.map((card) => (
              <div
                key={card.id}
                className="border border-border rounded-input p-3.5 bg-card hover:border-neutral-300 hover:shadow-x-small transition-all flex items-center justify-between gap-4"
              >
                <div className="flex flex-col gap-0.5 min-w-0">
                  <div className="flex items-center gap-2">
                    <span className="font-medium text-sm text-foreground truncate">
                      {card.jobTitle}
                    </span>
                    <Badge variant="neutral-lighter" className="text-[10px] font-bold">
                      {card.union}
                    </Badge>
                  </div>
                  <span className="text-[12px] text-neutral-500 truncate">
                    {card.agreementName} · {card.roleCategory}
                  </span>
                </div>

                <div className="flex items-center gap-4 shrink-0">
                  <div className="text-right">
                    <span className="font-aeonik-medium text-[16px] font-medium text-foreground block">
                      {formatCurrency(card.minimumRate, "GBP")}
                    </span>
                    <span className="text-[11px] text-neutral-500">
                      per {card.period.toLowerCase()}
                    </span>
                  </div>
                  <Button
                    size="sm"
                    variant="outline"
                    className="h-8 rounded-button text-xs border-border hover:bg-brand-light hover:text-brand-dark hover:border-brand-medium transition-colors"
                    onClick={() => handleSelectRateCard(card)}
                  >
                    <span>Use Rate</span>
                    <RiArrowRightSLine className="size-3.5 ml-0.5" />
                  </Button>
                </div>
              </div>
            ))}

            {filteredRateCards.length === 0 && (
              <div className="p-10 text-center text-neutral-400 text-sm">
                No union rate cards matching your search query.
              </div>
            )}
          </div>
        </div>
      )}

      {/* Footer matching standard modal action bar */}
      <div className="border-t border-border px-6 py-3.5 bg-card flex items-center justify-between shrink-0">
        <span className="text-[11px] text-neutral-500 hidden sm:inline">
          UKVI Appendix Creative Worker &amp; Temporary Work Rate Concession
        </span>
        <div className="flex items-center gap-2.5 ml-auto">
          <Button
            variant="outline"
            className="rounded-button text-xs h-9 px-4 border-border text-foreground hover:bg-neutral-100"
            onClick={onClose}
          >
            Cancel
          </Button>
          <Button
            className="rounded-button text-xs h-9 px-4 bg-brand-medium hover:bg-brand-dark text-white shadow-primary-focus flex items-center gap-1.5"
            onClick={handleSaveClearance}
          >
            <RiShieldCheckLine className="size-4" />
            <span>Save Clearance &amp; Verify</span>
          </Button>
        </div>
      </div>
    </>
  );
}

export function UnionRateModal({
  open,
  onOpenChange,
  caseId,
  migrantName = "Migrant",
  initialSalary = "",
  initialJobTitle = "",
  initialUnion = "EQUITY",
  onSuccess,
}: UnionRateModalProps) {
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent
        showCloseButton={false}
        className="max-w-[720px] w-[95vw] !p-0 !gap-0 max-h-[90vh] h-[640px] bg-card border-border rounded-card flex flex-col shadow-2xl overflow-hidden font-sans"
      >
        {open && (
          <UnionRateModalContent
            key={open ? "open" : "closed"}
            caseId={caseId}
            migrantName={migrantName}
            initialSalary={initialSalary}
            initialJobTitle={initialJobTitle}
            initialUnion={initialUnion}
            onSuccess={onSuccess}
            onClose={() => onOpenChange(false)}
          />
        )}
      </DialogContent>
    </Dialog>
  );
}
