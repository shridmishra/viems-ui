"use client";

import * as React from "react";
import { RiArrowDownSLine, RiCheckLine } from "@remixicon/react";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuGroup,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Button } from "@/components/ui/button";

export type TaskStatusValue = "REQUIRED ASAP" | "UNDER REVIEW" | "RESOLVED";

export interface TaskStatusOption {
  value: TaskStatusValue;
  label: string;
  dotClass: string;
  bgClass: string;
  textClass: string;
  description: string;
}

export const TASK_STATUS_OPTIONS: TaskStatusOption[] = [
  {
    value: "UNDER REVIEW",
    label: "Under review",
    dotClass: "bg-warning-dark",
    bgClass: "bg-warning-light",
    textClass: "text-warning-dark",
    description: "In review / pending verification",
  },
  {
    value: "REQUIRED ASAP",
    label: "Required ASAP",
    dotClass: "bg-error-dark",
    bgClass: "bg-error-light",
    textClass: "text-error-dark",
    description: "High priority action needed",
  },
  {
    value: "RESOLVED",
    label: "Resolved",
    dotClass: "bg-success-dark",
    bgClass: "bg-success-light",
    textClass: "text-success-dark",
    description: "Completed / requirement met",
  },
];

interface TaskStatusSelectorProps {
  status: string;
  statusBg?: string;
  statusColor?: string;
  onChangeStatus: (newStatus: TaskStatusValue) => void;
  disabled?: boolean;
  className?: string;
}

function normalizeStatus(s: string): TaskStatusValue {
  const norm = s.toUpperCase().trim();
  if (norm === "RESOLVED" || norm === "COMPLETED" || norm === "DONE") {
    return "RESOLVED";
  }
  if (norm === "REQUIRED ASAP" || norm === "CRUCIAL" || norm === "HIGH" || norm === "ACTION NEEDED") {
    return "REQUIRED ASAP";
  }
  return "UNDER REVIEW";
}

function formatStatusLabel(s: string): string {
  const norm = normalizeStatus(s);
  const found = TASK_STATUS_OPTIONS.find((opt) => opt.value === norm);
  return found ? found.label : s;
}

export function TaskStatusSelector({
  status,
  statusBg,
  statusColor,
  onChangeStatus,
  disabled = false,
  className = "",
}: TaskStatusSelectorProps) {
  const [open, setOpen] = React.useState(false);
  const currentNormalized = normalizeStatus(status);
  const currentOption = TASK_STATUS_OPTIONS.find(
    (opt) => opt.value === currentNormalized
  );

  const bgClass = statusBg || currentOption?.bgClass || "bg-warning-light";
  const textClass = statusColor || currentOption?.textClass || "text-warning-dark";

  const handleSelect = (newStatus: TaskStatusValue) => {
    onChangeStatus(newStatus);
    setOpen(false);
  };

  return (
    <DropdownMenu open={open} onOpenChange={setOpen}>
      <DropdownMenuTrigger
        disabled={disabled}
        render={
          <Button
            type="button"
            variant="ghost"
            size="xs"
            onClick={(e) => e.stopPropagation()}
            className={`h-5 rounded-full px-2 py-0.5 inline-flex items-center gap-1 text-label-xs font-medium leading-[12px] whitespace-nowrap shrink-0 cursor-pointer transition-all hover:opacity-85 border-0 shadow-none ${bgClass} ${textClass} ${className}`}
          >
            <span>{formatStatusLabel(status)}</span>
            <RiArrowDownSLine className="size-3 opacity-60 shrink-0 ml-0.5" />
          </Button>
        }
      />

      <DropdownMenuContent
        align="start"
        className="w-[240px] min-w-[240px] p-1.5 rounded-card bg-popover text-popover-foreground border-border shadow-card-large flex flex-col gap-0.5"
        onClick={(e) => e.stopPropagation()}
      >
        <DropdownMenuGroup>
          <DropdownMenuLabel className="text-label-xs font-medium text-muted-foreground px-2 py-1">
            Change task status
          </DropdownMenuLabel>
          <DropdownMenuSeparator className="my-1 border-t border-border" />
          {TASK_STATUS_OPTIONS.map((opt) => {
            const isSelected = opt.value === currentNormalized;
            return (
              <DropdownMenuItem
                key={opt.value}
                onClick={() => handleSelect(opt.value)}
                className={`flex items-start justify-between gap-2 px-2.5 py-1.5 rounded-button cursor-pointer transition-colors ${
                  isSelected
                    ? "bg-neutral-100 font-medium"
                    : "hover:bg-neutral-100/70"
                }`}
              >
                <div className="flex items-start gap-2 min-w-0">
                  <span
                    className={`size-2 rounded-full shrink-0 mt-1 ${opt.dotClass}`}
                  />
                  <div className="flex flex-col">
                    <span className="text-label-sm font-medium text-foreground">
                      {opt.label}
                    </span>
                    <span className="text-paragraph-xs text-muted-foreground">
                      {opt.description}
                    </span>
                  </div>
                </div>
                {isSelected && (
                  <RiCheckLine className="size-4 text-foreground shrink-0 mt-0.5" />
                )}
              </DropdownMenuItem>
            );
          })}
        </DropdownMenuGroup>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
