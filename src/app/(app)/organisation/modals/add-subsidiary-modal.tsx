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

export interface SubsidiaryItem {
  id: string;
  name: string;
  registrationNumber: string;
  country: string;
  shareholding: string;
  relationship: string;
}

export type SubsidiaryCompany = SubsidiaryItem;

interface AddSubsidiaryModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onAdd: (subsidiary: SubsidiaryItem) => void;
}

export function AddSubsidiaryModal({
  open,
  onOpenChange,
  onAdd,
}: AddSubsidiaryModalProps) {
  const [name, setName] = React.useState("");
  const [registrationNumber, setRegistrationNumber] = React.useState("");
  const [country, setCountry] = React.useState("United Kingdom");
  const [shareholding, setShareholding] = React.useState("100%");
  const [relationship, setRelationship] = React.useState("Wholly Owned Subsidiary");

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim()) {
      toast.error("Please enter a company name");
      return;
    }

    const newSub: SubsidiaryItem = {
      id: String(Date.now()),
      name: name.trim(),
      registrationNumber: registrationNumber.trim() || "N/A",
      country,
      shareholding,
      relationship,
    };

    onAdd(newSub);
    toast.success(`Added ${newSub.name} as a subsidiary`);
    onOpenChange(false);
    setName("");
    setRegistrationNumber("");
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[480px] p-2xl rounded-card">
        <DialogHeader className="gap-xs">
          <DialogTitle className="font-aeonik-medium text-h5-title text-foreground">
            Add subsidiary company
          </DialogTitle>
          <DialogDescription className="text-paragraph-sm text-muted-foreground">
            Add a subsidiary or branch organisation connected to this sponsor licence.
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-xl py-md">
          <div className="space-y-xs">
            <Label htmlFor="sub-name" className="text-label-sm text-foreground">
              Company name
            </Label>
            <Input
              id="sub-name"
              placeholder="e.g. AX Global Technologies Ltd"
              value={name}
              onChange={(e) => setName(e.target.value)}
              className="rounded-input h-10 shadow-x-small"
              required
            />
          </div>

          <div className="space-y-xs">
            <Label htmlFor="sub-reg" className="text-label-sm text-foreground">
              Registration number
            </Label>
            <Input
              id="sub-reg"
              placeholder="e.g. 10928374"
              value={registrationNumber}
              onChange={(e) => setRegistrationNumber(e.target.value)}
              className="rounded-input h-10 shadow-x-small"
            />
          </div>

          <div className="grid grid-cols-2 gap-lg">
            <div className="space-y-xs">
              <Label htmlFor="sub-country" className="text-label-sm text-foreground">
                Country
              </Label>
              <Select value={country} onValueChange={(val) => setCountry(val || "United Kingdom")}>
                <SelectTrigger id="sub-country" className="rounded-input h-10 shadow-x-small w-full">
                  <SelectValue placeholder="Select country" />
                </SelectTrigger>
                <SelectContent className="rounded-card">
                  <SelectItem value="United Kingdom">United Kingdom</SelectItem>
                  <SelectItem value="United States">United States</SelectItem>
                  <SelectItem value="Canada">Canada</SelectItem>
                  <SelectItem value="Australia">Australia</SelectItem>
                  <SelectItem value="India">India</SelectItem>
                  <SelectItem value="Germany">Germany</SelectItem>
                  <SelectItem value="Ireland">Ireland</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-xs">
              <Label htmlFor="sub-share" className="text-label-sm text-foreground">
                Ownership %
              </Label>
              <Input
                id="sub-share"
                placeholder="e.g. 100%"
                value={shareholding}
                onChange={(e) => setShareholding(e.target.value)}
                className="rounded-input h-10 shadow-x-small"
              />
            </div>
          </div>

          <div className="space-y-xs">
            <Label htmlFor="sub-rel" className="text-label-sm text-foreground">
              Relationship type
            </Label>
            <Select value={relationship} onValueChange={(val) => setRelationship(val || "Wholly Owned Subsidiary")}>
              <SelectTrigger id="sub-rel" className="rounded-input h-10 shadow-x-small w-full">
                <SelectValue placeholder="Select relationship" />
              </SelectTrigger>
              <SelectContent className="rounded-card">
                <SelectItem value="Wholly Owned Subsidiary">Wholly Owned Subsidiary (100%)</SelectItem>
                <SelectItem value="Majority Owned Subsidiary">Majority Owned Subsidiary (&gt;50%)</SelectItem>
                <SelectItem value="Joint Venture">Joint Venture</SelectItem>
                <SelectItem value="Branch Office">Branch Office</SelectItem>
                <SelectItem value="Affiliate Company">Affiliate Company</SelectItem>
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
              Add subsidiary
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
