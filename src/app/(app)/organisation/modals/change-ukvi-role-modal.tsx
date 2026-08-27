"use client";

import * as React from "react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { toast } from "sonner";

export interface UkviRoleAssignment {
  roleCode: "AO" | "KC" | "L1" | "L2";
  roleTitle: string;
  assignedMembers: string[];
}

interface ChangeUkviRoleModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  roleData: UkviRoleAssignment | null;
  onSave: (roleCode: "AO" | "KC" | "L1" | "L2", updatedMembers: string[], meta?: { effectiveDate: string; notes?: string }) => void;
  availableMembers: { name: string; email: string }[];
}

export function ChangeUkviRoleModal({
  open,
  onOpenChange,
  roleData,
  onSave,
  availableMembers,
}: ChangeUkviRoleModalProps) {
  const [selectedMember, setSelectedMember] = React.useState("");
  const [effectiveDate, setEffectiveDate] = React.useState(() => new Date().toISOString().split("T")[0]);
  const [notes, setNotes] = React.useState("");

  React.useEffect(() => {
    if (open && roleData) {
      setSelectedMember(roleData.assignedMembers[0] || (availableMembers[0]?.name ?? ""));
      setEffectiveDate(new Date().toISOString().split("T")[0]);
      setNotes("");
    }
  }, [open, roleData]);

  if (!roleData) return null;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedMember) {
      toast.error("Please select a team member");
      return;
    }

    // For L1 and L2 multiple can be assigned, for AO and KC typically 1 primary
    let newMembers: string[];
    if (roleData.roleCode === "L1" || roleData.roleCode === "L2") {
      if (!roleData.assignedMembers.includes(selectedMember)) {
        newMembers = [...roleData.assignedMembers, selectedMember];
      } else {
        newMembers = roleData.assignedMembers;
      }
    } else {
      newMembers = [selectedMember];
    }

    onSave(roleData.roleCode, newMembers, { effectiveDate, notes: notes.trim() });
    toast.success(`Updated ${roleData.roleTitle} assignment`);
    onOpenChange(false);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[480px] p-2xl rounded-card">
        <DialogHeader className="gap-xs">
          <DialogTitle className="font-aeonik-medium text-h5-title text-foreground">
            Change {roleData.roleTitle}
          </DialogTitle>
          <DialogDescription className="text-paragraph-sm text-muted-foreground">
            Assign or update designated personnel for this official UKVI Sponsorship Management System (SMS) role.
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-xl py-md">
          <div className="space-y-xs">
            <Label htmlFor="ukvi-member" className="text-label-sm text-foreground">
              Select team member
            </Label>
            <Select value={selectedMember} onValueChange={(val) => setSelectedMember(val || "")}>
              <SelectTrigger id="ukvi-member" className="rounded-input h-10 shadow-x-small w-full">
                <SelectValue placeholder="Choose a member" />
              </SelectTrigger>
              <SelectContent className="rounded-card">
                {availableMembers.map((m) => (
                  <SelectItem key={m.name} value={m.name}>
                    {m.name} ({m.email})
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-xs">
            <Label htmlFor="effective-date" className="text-label-sm text-foreground">
              Effective date of change
            </Label>
            <Input
              id="effective-date"
              type="date"
              value={effectiveDate}
              onChange={(e) => setEffectiveDate(e.target.value)}
              className="rounded-input h-10 shadow-x-small"
            />
          </div>

          <div className="space-y-xs">
            <Label htmlFor="ukvi-notes" className="text-label-sm text-foreground">
              SMS reporting notes (Optional)
            </Label>
            <Input
              id="ukvi-notes"
              placeholder="e.g. Reported to UKVI via SMS on 25 Aug 2026"
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              className="rounded-input h-10 shadow-x-small"
            />
          </div>

          <div className="p-md rounded-input bg-info-light/30 border border-info-light text-paragraph-xs text-info-dark leading-relaxed">
            Note: Changes to Authorising Officer or Key Contact must be reported to the Home Office via SMS within 20 working days.
          </div>

          <DialogFooter className="gap-sm pt-md">
            <Button
              type="button"
              variant="outline"
              onClick={() => onOpenChange(false)}
              className="rounded-button h-9 px-xl"
            >
              Cancel
            </Button>
            <Button
              type="submit"
              className="rounded-button h-9 px-xl bg-neutral-900 text-white hover:bg-neutral-800"
            >
              Save role assignment
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
