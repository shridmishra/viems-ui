"use client";

import * as React from "react";
import {
  RiUserAddLine,
  RiCheckLine,
  RiArrowDownSLine,
  RiCloseCircleLine,
} from "@remixicon/react";
import { toast } from "sonner";
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
import {
  TaskAssignee,
  STANDARD_STAFF_MEMBERS,
} from "@/lib/task-assignment-storage";

interface TaskAssigneeSelectorProps {
  assignee?: TaskAssignee | null;
  onAssign: (assignee: TaskAssignee | null) => void;
  compact?: boolean;
  disabled?: boolean;
  className?: string;
}

export function TaskAssigneeSelector({
  assignee,
  onAssign,
  compact = false,
  disabled = false,
  className = "",
}: TaskAssigneeSelectorProps) {
  const [open, setOpen] = React.useState(false);

  const handleSelect = (staff: TaskAssignee | null) => {
    onAssign(staff);
    if (staff) {
      toast.success(`Task assigned to ${staff.name}`, {
        description: staff.role,
      });
    } else {
      toast.info("Task unassigned");
    }
    setOpen(false);
  };

  return (
    <DropdownMenu open={open} onOpenChange={setOpen}>
      <DropdownMenuTrigger
        disabled={disabled}
        render={
          assignee ? (
            <Button
              type="button"
              variant="outline"
              size="sm"
              className={`h-7 px-2 py-0.5 rounded-button border-border bg-card hover:bg-neutral-100/70 text-foreground transition-all flex items-center gap-1.5 cursor-pointer max-w-[170px] ${className}`}
            >
              {assignee.avatarUrl ? (
                <img
                  src={assignee.avatarUrl}
                  alt={assignee.name}
                  className="size-4.5 rounded-full object-cover shrink-0"
                />
              ) : (
                <div className="size-4.5 rounded-full bg-[#EBEBEB] text-[#171717] flex items-center justify-center font-medium text-[9px] leading-none shrink-0 select-none">
                  {assignee.avatarText}
                </div>
              )}
              <span className="text-[12px] font-medium truncate max-w-[95px] text-left">
                {compact ? assignee.name.split(" ")[0] : assignee.name}
              </span>
              <RiArrowDownSLine className="size-3 text-muted-foreground shrink-0" />
            </Button>
          ) : (
            <Button
              type="button"
              variant="outline"
              size="sm"
              className={`h-7 px-2 py-0.5 rounded-button border-dashed border-border bg-transparent hover:bg-neutral-100/50 text-muted-foreground hover:text-foreground transition-all flex items-center gap-1 cursor-pointer ${className}`}
            >
              <RiUserAddLine className="size-3.5 text-muted-foreground" />
              <span className="text-[12px] font-medium">Assign</span>
            </Button>
          )
        }
      />

      <DropdownMenuContent
        align="start"
        className="w-[260px] min-w-[260px] p-1.5 rounded-card bg-popover text-popover-foreground border-border shadow-card-large"
      >
        <DropdownMenuGroup>
          <DropdownMenuLabel className="text-label-xs font-medium text-muted-foreground px-2 py-1">
            Assign accountability
          </DropdownMenuLabel>

          {STANDARD_STAFF_MEMBERS.map((staff) => {
            const isSelected = assignee?.id === staff.id;
            return (
              <DropdownMenuItem
                key={staff.id}
                onClick={() => handleSelect(staff)}
                className="flex items-center justify-between px-2.5 py-1.5 rounded-button cursor-pointer hover:bg-neutral-100 transition-colors w-full gap-2"
              >
                <div className="flex items-center gap-2.5 min-w-0 flex-1">
                  {staff.avatarUrl ? (
                    <img
                      src={staff.avatarUrl}
                      alt={staff.name}
                      className="size-6 rounded-full object-cover shrink-0"
                    />
                  ) : (
                    <div className="size-6 rounded-full bg-[#EBEBEB] text-[#171717] flex items-center justify-center font-medium text-[10px] leading-none shrink-0 select-none">
                      {staff.avatarText}
                    </div>
                  )}
                  <div className="flex flex-col min-w-0 flex-1">
                    <span className="text-[13px] font-medium text-foreground whitespace-nowrap">
                      {staff.name}
                    </span>
                    <span className="text-[11px] text-muted-foreground whitespace-nowrap">
                      {staff.role}
                    </span>
                  </div>
                </div>

                {isSelected && (
                  <RiCheckLine className="size-4 text-primary shrink-0 ml-1.5" />
                )}
              </DropdownMenuItem>
            );
          })}
        </DropdownMenuGroup>

        {assignee && (
          <>
            <DropdownMenuSeparator className="my-1 border-t border-border" />
            <DropdownMenuItem
              onClick={() => handleSelect(null)}
              className="flex items-center gap-2 px-2 py-1.5 rounded-button cursor-pointer text-destructive hover:bg-destructive/10 transition-colors"
            >
              <RiCloseCircleLine className="size-4 shrink-0" />
              <span className="text-[12px] font-medium">Unassign owner</span>
            </DropdownMenuItem>
          </>
        )}
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
