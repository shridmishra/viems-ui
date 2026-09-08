"use client";

import * as React from "react";
import {
  RiCalendarLine,
  RiCalendarEventLine,
  RiTimeLine,
  RiCloseLine,
} from "@remixicon/react";
import { toast } from "sonner";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { Calendar } from "@/components/ui/calendar";
import { Button } from "@/components/ui/button";
import {
  formatDateDisplay,
  getDueDateUrgency,
} from "@/lib/task-assignment-storage";

interface TaskDueDatePickerProps {
  dueDate?: string;
  onChange: (dueDate: string | null) => void;
  compact?: boolean;
  disabled?: boolean;
  className?: string;
}

export function TaskDueDatePicker({
  dueDate,
  onChange,
  disabled = false,
  className = "",
}: TaskDueDatePickerProps) {
  const [isOpen, setIsOpen] = React.useState(false);

  const urgency = React.useMemo(() => {
    return getDueDateUrgency(dueDate);
  }, [dueDate]);

  const selectedDate = React.useMemo(() => {
    if (!dueDate || dueDate === "No due date" || dueDate === "—") return undefined;
    const d = new Date(dueDate);
    return isNaN(d.getTime()) ? undefined : d;
  }, [dueDate]);

  const handleSelectDate = (date: Date | undefined) => {
    if (date) {
      const year = date.getFullYear();
      const month = String(date.getMonth() + 1).padStart(2, "0");
      const day = String(date.getDate()).padStart(2, "0");
      const isoStr = `${year}-${month}-${day}`;
      onChange(isoStr);
      toast.success(`Due date updated to ${formatDateDisplay(date)}`);
    } else {
      onChange(null);
      toast.info("Due date removed");
    }
    setIsOpen(false);
  };

  const handleQuickPreset = (daysFromNow: number, label: string) => {
    const target = new Date();
    target.setDate(target.getDate() + daysFromNow);
    const year = target.getFullYear();
    const month = String(target.getMonth() + 1).padStart(2, "0");
    const day = String(target.getDate()).padStart(2, "0");
    const isoStr = `${year}-${month}-${day}`;
    onChange(isoStr);
    toast.success(`Due date set to ${label} (${formatDateDisplay(target)})`);
    setIsOpen(false);
  };

  const badgeStyle = urgency.isOverdue
    ? "bg-error-light text-error-dark border-error-light"
    : urgency.isDueSoon
    ? "bg-warning-light text-warning-dark border-warning-light"
    : "bg-neutral-50 text-neutral-600 border-border";

  return (
    <Popover open={isOpen} onOpenChange={setIsOpen}>
      <PopoverTrigger
        disabled={disabled}
        render={
          <Button
            type="button"
            variant="outline"
            size="sm"
            className={`h-7 px-2 py-0.5 rounded-button border text-[12px] font-medium transition-all flex items-center gap-1.5 cursor-pointer ${badgeStyle} ${className}`}
          >
            {urgency.isOverdue ? (
              <RiTimeLine className="size-3.5 shrink-0 text-error-dark" />
            ) : (
              <RiCalendarLine className="size-3.5 shrink-0 opacity-80" />
            )}

            <span className="truncate max-w-[100px]">
              {dueDate ? formatDateDisplay(dueDate) : "Set date"}
            </span>
          </Button>
        }
      />

      <PopoverContent
        align="start"
        className="w-auto p-3 rounded-card bg-popover text-popover-foreground border-border shadow-card-large flex flex-col gap-2.5 z-50"
      >
        <div className="flex items-center justify-between px-1 pb-1 border-b border-border">
          <div className="flex items-center gap-1.5">
            <RiCalendarEventLine className="size-4 text-muted-foreground" />
            <span className="text-label-sm font-medium text-foreground">
              Set due date
            </span>
          </div>
          {dueDate && (
            <Button
              type="button"
              variant="ghost"
              size="sm"
              onClick={() => handleSelectDate(undefined)}
              className="h-6 px-1.5 text-label-xs text-destructive hover:bg-destructive/10 rounded-compact flex items-center gap-1 cursor-pointer"
            >
              <RiCloseLine className="size-3" />
              <span>Clear</span>
            </Button>
          )}
        </div>

        {/* Quick Presets */}
        <div className="grid grid-cols-3 gap-1 px-1">
          <Button
            type="button"
            variant="outline"
            size="sm"
            onClick={() => handleQuickPreset(0, "Today")}
            className="h-7 text-label-xs font-medium rounded-button border-border hover:bg-neutral-100"
          >
            Today
          </Button>
          <Button
            type="button"
            variant="outline"
            size="sm"
            onClick={() => handleQuickPreset(1, "Tomorrow")}
            className="h-7 text-label-xs font-medium rounded-button border-border hover:bg-neutral-100"
          >
            Tomorrow
          </Button>
          <Button
            type="button"
            variant="outline"
            size="sm"
            onClick={() => handleQuickPreset(3, "In 3 Days")}
            className="h-7 text-label-xs font-medium rounded-button border-border hover:bg-neutral-100"
          >
            In 3 Days
          </Button>
          <Button
            type="button"
            variant="outline"
            size="sm"
            onClick={() => handleQuickPreset(7, "Next Week")}
            className="h-7 text-label-xs font-medium rounded-button border-border hover:bg-neutral-100"
          >
            1 Week
          </Button>
          <Button
            type="button"
            variant="outline"
            size="sm"
            onClick={() => handleQuickPreset(14, "In 2 Weeks")}
            className="h-7 text-label-xs font-medium rounded-button border-border hover:bg-neutral-100 col-span-2"
          >
            2 Weeks (14 Days)
          </Button>
        </div>

        {/* Interactive Calendar Component */}
        <div className="pt-1 border-t border-border">
          <Calendar
            mode="single"
            selected={selectedDate}
            onSelect={handleSelectDate}
            className="rounded-button border-0 p-0"
          />
        </div>
      </PopoverContent>
    </Popover>
  );
}
