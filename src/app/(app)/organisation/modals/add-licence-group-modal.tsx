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

export interface LicenceGroupItem {
  id: string;
  name: string;
  code: string;
  tier: string;
  cosAllocated: string;
  branch: string;
}

export type LicenceGroup = LicenceGroupItem;

interface AddLicenceGroupModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onAdd: (group: LicenceGroupItem) => void;
}

export function AddLicenceGroupModal({
  open,
  onOpenChange,
  onAdd,
}: AddLicenceGroupModalProps) {
  const [name, setName] = React.useState("");
  const [code, setCode] = React.useState("");
  const [tier, setTier] = React.useState("Skilled Worker");
  const [cosAllocated, setCosAllocated] = React.useState("10");
  const [branch, setBranch] = React.useState("Main Headquarters (London)");

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim()) {
      toast.error("Please enter a group name");
      return;
    }

    const newGroup: LicenceGroupItem = {
      id: String(Date.now()),
      name: name.trim(),
      code: code.trim() || `LG-${Math.floor(100 + Math.random() * 900)}`,
      tier,
      cosAllocated: cosAllocated || "0",
      branch,
    };

    onAdd(newGroup);
    toast.success(`Created licence group: ${newGroup.name}`);
    onOpenChange(false);
    setName("");
    setCode("");
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[480px] p-2xl rounded-card">
        <DialogHeader className="gap-xs">
          <DialogTitle className="font-aeonik-medium text-h5-title text-foreground">
            Add licence group
          </DialogTitle>
          <DialogDescription className="text-paragraph-sm text-muted-foreground">
            Group sponsor allocations by business department, legal entity, or regional branch.
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-xl py-md">
          <div className="space-y-xs">
            <Label htmlFor="lg-name" className="text-label-sm text-foreground">
              Group name
            </Label>
            <Input
              id="lg-name"
              placeholder="e.g. Engineering & IT Division"
              value={name}
              onChange={(e) => setName(e.target.value)}
              className="rounded-input h-10 shadow-x-small"
              required
            />
          </div>

          <div className="grid grid-cols-2 gap-lg">
            <div className="space-y-xs">
              <Label htmlFor="lg-code" className="text-label-sm text-foreground">
                Group code / prefix
              </Label>
              <Input
                id="lg-code"
                placeholder="e.g. ENG-UK"
                value={code}
                onChange={(e) => setCode(e.target.value)}
                className="rounded-input h-10 shadow-x-small"
              />
            </div>

            <div className="space-y-xs">
              <Label htmlFor="lg-cos" className="text-label-sm text-foreground">
                Initial CoS allocation
              </Label>
              <Input
                id="lg-cos"
                type="number"
                placeholder="10"
                value={cosAllocated}
                onChange={(e) => setCosAllocated(e.target.value)}
                className="rounded-input h-10 shadow-x-small"
              />
            </div>
          </div>

          <div className="space-y-xs">
            <Label htmlFor="lg-tier" className="text-label-sm text-foreground">
              Licence tier
            </Label>
            <Select value={tier} onValueChange={(val) => setTier(val || "Skilled Worker")}>
              <SelectTrigger id="lg-tier" className="rounded-input h-10 shadow-x-small w-full">
                <SelectValue placeholder="Select tier" />
              </SelectTrigger>
              <SelectContent className="rounded-card">
                <SelectItem value="Skilled Worker">Skilled Worker</SelectItem>
                <SelectItem value="Senior or Specialist Worker">Senior or Specialist Worker (Global Mobility)</SelectItem>
                <SelectItem value="Temporary Worker">Temporary Worker (Creative / Charity)</SelectItem>
                <SelectItem value="Scale-up Worker">Scale-up Worker</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-xs">
            <Label htmlFor="lg-branch" className="text-label-sm text-foreground">
              Assigned branch / entity
            </Label>
            <Select value={branch} onValueChange={(val) => setBranch(val || "Main Headquarters (London)")}>
              <SelectTrigger id="lg-branch" className="rounded-input h-10 shadow-x-small w-full">
                <SelectValue placeholder="Select branch" />
              </SelectTrigger>
              <SelectContent className="rounded-card">
                <SelectItem value="Main Headquarters (London)">Main Headquarters (London)</SelectItem>
                <SelectItem value="Manchester Operations Centre">Manchester Operations Centre</SelectItem>
                <SelectItem value="Edinburgh Regional Branch">Edinburgh Regional Branch</SelectItem>
                <SelectItem value="Birmingham Tech Hub">Birmingham Tech Hub</SelectItem>
              </SelectContent>
            </Select>
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
              Create group
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
