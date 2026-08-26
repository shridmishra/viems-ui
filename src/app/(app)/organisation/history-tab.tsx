"use client";

import * as React from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  RiSearchLine,
  RiFilter3Line,
  RiTimeLine,
  RiCheckboxCircleLine,
  RiFileTextLine,
  RiBuildingLine,
} from "@remixicon/react";
import { toast } from "sonner";

export interface HistoryLogItem {
  id: string;
  date: string;
  action: string;
  refCode: string;
  category: string;
  time: string;
  author: string;
  authorInitials: string;
  type: "document" | "organisation" | "licence" | "team";
}

export interface TimelineEntryProps {
  icon: React.ReactNode;
  badgeLabel: string;
  badgeClassName?: string;
  action: string;
  refCode: string;
  time: string;
  author: string;
  authorInitials: string;
}

export function TimelineEntry({
  icon,
  badgeLabel,
  badgeClassName = "bg-[#EFEBFF] text-[#7D52F4]",
  action,
  refCode,
  time,
  author,
  authorInitials,
}: TimelineEntryProps) {
  return (
    <div className="relative flex items-center gap-3">
      <div className="size-8 rounded-[8px] bg-white border border-[#EBEBEB] shadow-x-small flex items-center justify-center text-[#737373] shrink-0 -ml-[33px]">
        {icon}
      </div>

      <div className="bg-white rounded-[16px] border border-[#EBEBEB] p-4 flex-1 shadow-x-small flex flex-col sm:flex-row sm:items-center justify-between gap-3 hover:border-[#D4D4D4] transition-all">
        <div>
          <span className={`inline-flex items-center px-2 py-0.5 rounded-full text-[10px] font-semibold uppercase tracking-wide ${badgeClassName}`}>
            {badgeLabel}
          </span>
          <p className="text-[14px] font-medium text-[#171717] mt-1">
            {action}
          </p>
          <p className="text-[12px] text-[#737373] mt-0.5">
            {refCode}
          </p>
        </div>

        <div className="flex items-center gap-4 self-end sm:self-center">
          <span className="text-[12px] text-[#737373]">
            {time}
          </span>
          <div className="flex items-center gap-1.5">
            <span className="size-6 rounded-full bg-[#EFEBFF] text-[#7D52F4] flex items-center justify-center text-[10px] font-medium">
              {authorInitials}
            </span>
            <span className="text-[13px] font-medium text-[#171717]">
              {author}
            </span>
          </div>
        </div>
      </div>
    </div>
  );
}

const INITIAL_HISTORY: HistoryLogItem[] = [
  {
    id: "hist-1",
    date: "26 MAR 2026",
    action: "Sarah Kim assigned CoS for Taylor Johnson",
    refCode: "124/2026",
    category: "Licence",
    time: "01:12 PM",
    author: "Sarah Kim",
    authorInitials: "SK",
    type: "organisation",
  },
  {
    id: "hist-2",
    date: "26 MAR 2026",
    action: "Elena Petrova updated RTW check dealing for Chindy Okafor",
    refCode: "184/2024",
    category: "Compliance",
    time: "01:12 PM",
    author: "Elena Petrova",
    authorInitials: "JW",
    type: "document",
  },
  {
    id: "hist-3",
    date: "24 MAR 2026",
    action: "Priya Nair uploaded employment contract for Sofia Reyes",
    refCode: "231/2026",
    category: "Documents",
    time: "01:12 PM",
    author: "Priya Nair",
    authorInitials: "PN",
    type: "document",
  },
  {
    id: "hist-4",
    date: "24 MAR 2026",
    action: "Alex Marin updated company trading address in organisation settings",
    refCode: "ORG-8821",
    category: "Company",
    time: "10:45 AM",
    author: "Alex Marin",
    authorInitials: "AM",
    type: "organisation",
  },
];

export function HistoryTab() {
  const [historyLogs] = React.useState<HistoryLogItem[]>(INITIAL_HISTORY);
  const [search, setSearch] = React.useState("");
  const [selectedCategory, setSelectedCategory] = React.useState("All Categories");

  const filteredHistory = historyLogs.filter((log) => {
    const matchesSearch =
      log.action.toLowerCase().includes(search.toLowerCase()) ||
      log.refCode.toLowerCase().includes(search.toLowerCase()) ||
      log.author.toLowerCase().includes(search.toLowerCase());

    const matchesCategory =
      selectedCategory === "All Categories" || log.category === selectedCategory;

    return matchesSearch && matchesCategory;
  });

  const dates = Array.from(new Set(filteredHistory.map((h) => h.date)));

  return (
    <div className="grid grid-cols-1 md:grid-cols-[220px_1fr] gap-[40px] items-start w-full">
      {/* Left Sub-Menu Column */}
      <nav
        className="sticky top-[152px] self-start flex flex-col gap-3 pt-1 shrink-0 w-full"
        aria-label="History navigation"
      >
        <span className="text-[12px] font-semibold uppercase tracking-wider text-[#171717] px-0 mb-1">
          HISTORY
        </span>

        <div className="flex flex-col gap-[14px]">
          <button
            type="button"
            className="text-left text-[14px] leading-[20px] font-medium text-[#171717] border-0 bg-transparent p-0 cursor-pointer outline-none"
          >
            Audit trail
          </button>
        </div>
      </nav>

      {/* Right Content Area */}
      <div className="flex-1 min-w-0 flex flex-col gap-4">
        <h2 className="font-aeonik-medium text-[20px] leading-[28px] font-medium text-[#171717]">
          Organisation history
        </h2>

        {/* Search & Filter Bar */}
        <div className="flex items-center gap-3">
          <div className="relative flex-1 max-w-[280px]">
            <RiSearchLine className="size-4 absolute left-3 top-3 text-[#8C8C8C] pointer-events-none" />
            <Input
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Search history..."
              className="rounded-[10px] h-10 pl-9 pr-3 shadow-x-small bg-white border-[#EBEBEB] text-[13px]"
            />
          </div>

          <button
            type="button"
            aria-label="Filter"
            className="size-10 rounded-[10px] border border-[#EBEBEB] bg-white flex items-center justify-center text-[#5C5C5C] hover:text-[#171717] shadow-x-small shrink-0 transition-colors cursor-pointer"
          >
            <RiFilter3Line className="size-4" />
          </button>

          <Select
            value={selectedCategory}
            onValueChange={(val) => setSelectedCategory(val || "All Categories")}
          >
            <SelectTrigger className="rounded-[10px] h-10 w-40 shadow-x-small bg-white border-[#EBEBEB] text-[13px] shrink-0">
              <SelectValue placeholder="All Categories" />
            </SelectTrigger>
            <SelectContent className="rounded-[12px]">
              <SelectItem value="All Categories">All Categories</SelectItem>
              <SelectItem value="Company">Company</SelectItem>
              <SelectItem value="Licence">Licence</SelectItem>
              <SelectItem value="Compliance">Compliance</SelectItem>
              <SelectItem value="Documents">Documents</SelectItem>
              <SelectItem value="Team">Team</SelectItem>
            </SelectContent>
          </Select>
        </div>

        {/* History Timeline matching Figma EXACTLY */}
        <div className="space-y-6 pt-2">
          {dates.length === 0 ? (
            <div className="py-12 text-center text-[14px] text-[#737373] bg-white rounded-[16px] border border-[#EBEBEB]">
              No history logs match your search.
            </div>
          ) : (
            dates.map((dateStr) => {
              const itemsOnDate = filteredHistory.filter((h) => h.date === dateStr);
              return (
                <div key={dateStr} className="space-y-3">
                  <div className="flex items-center gap-3">
                    <span className="size-2 rounded-full bg-[#D4D4D4]" />
                    <span className="text-[11px] font-semibold uppercase tracking-wider text-[#737373]">
                      {dateStr}
                    </span>
                  </div>

                  <div className="space-y-3 relative pl-6 border-l border-[#EBEBEB] ml-1">
                    {itemsOnDate.map((item) => (
                      <TimelineEntry
                        key={item.id}
                        icon={
                          item.type === "document" ? (
                            <RiFileTextLine className="size-4" />
                          ) : item.type === "organisation" ? (
                            <RiBuildingLine className="size-4" />
                          ) : (
                            <RiCheckboxCircleLine className="size-4" />
                          )
                        }
                        badgeLabel={item.category.toUpperCase()}
                        action={item.action}
                        refCode={item.refCode}
                        time={item.time}
                        author={item.author}
                        authorInitials={item.authorInitials}
                      />
                    ))}
                  </div>
                </div>
              );
            })
          )}
        </div>

        {/* Footer Buttons */}
        <div className="flex items-center justify-end gap-3 pt-3">
          <button
            type="button"
            onClick={() => toast.info("History log refreshed")}
            className="h-10 px-5 text-[14px] font-medium text-[#5C5C5C] hover:text-[#171717] hover:bg-neutral-200/50 rounded-[10px] transition-colors border-0 bg-transparent cursor-pointer"
          >
            Refresh
          </button>
          <button
            type="button"
            onClick={() => toast.success("Audit trail report downloaded")}
            className="h-10 px-5 bg-[#171717] hover:bg-[#262626] text-white text-[13px] font-medium rounded-[10px] shadow-x-small transition-all cursor-pointer border-0"
          >
            Download audit trail
          </button>
        </div>
      </div>
    </div>
  );
}
