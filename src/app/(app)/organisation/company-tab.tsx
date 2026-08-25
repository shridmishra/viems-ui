"use client";

import * as React from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Checkbox } from "@/components/ui/checkbox";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  RiCalendarLine,
  RiAddLine,
  RiDeleteBinLine,
  RiBuildingLine,
} from "@remixicon/react";
import { toast } from "sonner";
import { getTokenPayload } from "@/lib/auth";
import {
  AddSubsidiaryModal,
  SubsidiaryCompany,
} from "./modals/add-subsidiary-modal";
import {
  AddLicenceGroupModal,
  LicenceGroup,
} from "./modals/add-licence-group-modal";

export const COMPANY_SUB_TABS = [
  "details",
  "address",
  "size",
  "licence-details",
  "structure",
  "subsidiary",
  "licence-groups",
] as const;

export type CompanySubTab = (typeof COMPANY_SUB_TABS)[number];

export type SectionId =
  | "details"
  | "address"
  | "size"
  | "licence"
  | "structure"
  | "subsidiaries"
  | "licence-groups";

function getStorageKey(key: string): string {
  const payload = getTokenPayload();
  const userId = payload?.email || (payload as any)?.id || (payload as any)?.sub;
  return userId ? `viems_org_${userId}_${key}` : `viems_org_${key}`;
}

interface CompanyTabProps {
  activeSubTab: CompanySubTab;
  onSubTabChange: (subTab: CompanySubTab) => void;
}

// ─── Default Form States matching Figma ──────────────────────────────────────
const DEFAULT_DETAILS = {
  companyName: "",
  tradingName: "",
  companyRegistrationNumber: "",
  dateOfIncorporation: "",
  companyType: "",
  sicCode: "",
  payeReferenceNumber: "",
  regulatoryBody: "",
  regulatoryRegistrationNumber: "",
  directorNames: "",
  companyEmail: "",
  companyPhone: "",
  companyWebsite: "",
  vatNumber: "",
};

const DEFAULT_ADDRESS = {
  addressLine1: "",
  addressLine2: "",
  city: "",
  county: "",
  postcode: "",
  country: "",
  vatNumber: "",
  tradingAddressSameAsRegistered: false,
};

const DEFAULT_SIZE = {
  numberOfEmployees: "",
  sponsoredWorkers: "",
  annualTurnover: "",
  organisationCategory: "",
};

const DEFAULT_LICENCE = {
  sponsorLicenceNumber: "",
  licenceStatus: "",
  licenceGrantedDate: "",
  licenceTier: "",
  cosAllocation: "",
  lastComplianceVisit: "",
  complianceVisitOutcome: "",
};

const DEFAULT_STRUCTURE = {
  parentCompany: "",
  parentCompanyName: "",
  groupStructure: "",
  ultimateHoldingCompany: "",
};

export function CompanyTab({ activeSubTab, onSubTabChange }: CompanyTabProps) {
  // Form data state with localStorage fallback
  const [companyDetails, setCompanyDetails] = React.useState(DEFAULT_DETAILS);
  const [addressData, setAddressData] = React.useState(DEFAULT_ADDRESS);
  const [sizeData, setSizeData] = React.useState(DEFAULT_SIZE);
  const [licenceData, setLicenceData] = React.useState(DEFAULT_LICENCE);
  const [structureData, setStructureData] = React.useState(DEFAULT_STRUCTURE);

  // Subsidiary and Licence Groups dynamic state
  const [subsidiaries, setSubsidiaries] = React.useState<SubsidiaryCompany[]>([]);
  const [licenceGroups, setLicenceGroups] = React.useState<LicenceGroup[]>([]);

  // Modals state
  const [isAddSubOpen, setIsAddSubOpen] = React.useState(false);
  const [isAddGroupOpen, setIsAddGroupOpen] = React.useState(false);

  // Load from localStorage on mount
  React.useEffect(() => {
    try {
      const savedDetails = localStorage.getItem(getStorageKey("details"));
      if (savedDetails) {
        const parsed = JSON.parse(savedDetails);
        if (parsed && typeof parsed === "object") {
          setCompanyDetails({ ...DEFAULT_DETAILS, ...parsed });
        }
      }

      const savedAddress = localStorage.getItem(getStorageKey("address"));
      if (savedAddress) {
        const parsed = JSON.parse(savedAddress);
        if (parsed && typeof parsed === "object") {
          setAddressData({ ...DEFAULT_ADDRESS, ...parsed });
        }
      }

      const savedSize = localStorage.getItem(getStorageKey("size"));
      if (savedSize) {
        const parsed = JSON.parse(savedSize);
        if (parsed && typeof parsed === "object") {
          setSizeData({ ...DEFAULT_SIZE, ...parsed });
        }
      }

      const savedLicence = localStorage.getItem(getStorageKey("licence"));
      if (savedLicence) {
        const parsed = JSON.parse(savedLicence);
        if (parsed && typeof parsed === "object") {
          setLicenceData({ ...DEFAULT_LICENCE, ...parsed });
        }
      }

      const savedStructure = localStorage.getItem(getStorageKey("structure"));
      if (savedStructure) {
        const parsed = JSON.parse(savedStructure);
        if (parsed && typeof parsed === "object") {
          setStructureData({ ...DEFAULT_STRUCTURE, ...parsed });
        }
      }

      const savedSubs = localStorage.getItem(getStorageKey("subsidiaries"));
      if (savedSubs) {
        const parsed = JSON.parse(savedSubs);
        if (Array.isArray(parsed)) {
          setSubsidiaries(parsed);
        }
      }

      const savedGroups = localStorage.getItem(getStorageKey("licence_groups"));
      if (savedGroups) {
        const parsed = JSON.parse(savedGroups);
        if (Array.isArray(parsed)) {
          setLicenceGroups(parsed);
        }
      }
    } catch {
      // ignore
    }
  }, []);

  const handleSave = (section: SectionId, label: string) => {
    try {
      switch (section) {
        case "details":
          localStorage.setItem(getStorageKey("details"), JSON.stringify(companyDetails));
          break;
        case "address":
          localStorage.setItem(getStorageKey("address"), JSON.stringify(addressData));
          break;
        case "size":
          localStorage.setItem(getStorageKey("size"), JSON.stringify(sizeData));
          break;
        case "licence":
          localStorage.setItem(getStorageKey("licence"), JSON.stringify(licenceData));
          break;
        case "structure":
          localStorage.setItem(getStorageKey("structure"), JSON.stringify(structureData));
          break;
        case "subsidiaries":
          localStorage.setItem(getStorageKey("subsidiaries"), JSON.stringify(subsidiaries));
          break;
        case "licence-groups":
          localStorage.setItem(getStorageKey("licence_groups"), JSON.stringify(licenceGroups));
          break;
      }
      toast.success(`${label} changes saved successfully`);
    } catch {
      toast.error("Failed to save changes");
    }
  };

  const handleCancel = (section: SectionId) => {
    try {
      switch (section) {
        case "details": {
          const saved = localStorage.getItem(getStorageKey("details"));
          setCompanyDetails(saved ? { ...DEFAULT_DETAILS, ...JSON.parse(saved) } : DEFAULT_DETAILS);
          break;
        }
        case "address": {
          const saved = localStorage.getItem(getStorageKey("address"));
          setAddressData(saved ? { ...DEFAULT_ADDRESS, ...JSON.parse(saved) } : DEFAULT_ADDRESS);
          break;
        }
        case "size": {
          const saved = localStorage.getItem(getStorageKey("size"));
          setSizeData(saved ? { ...DEFAULT_SIZE, ...JSON.parse(saved) } : DEFAULT_SIZE);
          break;
        }
        case "licence": {
          const saved = localStorage.getItem(getStorageKey("licence"));
          setLicenceData(saved ? { ...DEFAULT_LICENCE, ...JSON.parse(saved) } : DEFAULT_LICENCE);
          break;
        }
        case "structure": {
          const saved = localStorage.getItem(getStorageKey("structure"));
          setStructureData(saved ? { ...DEFAULT_STRUCTURE, ...JSON.parse(saved) } : DEFAULT_STRUCTURE);
          break;
        }
        case "subsidiaries": {
          const saved = localStorage.getItem(getStorageKey("subsidiaries"));
          const parsed = saved ? JSON.parse(saved) : null;
          setSubsidiaries(Array.isArray(parsed) ? parsed : []);
          break;
        }
        case "licence-groups": {
          const saved = localStorage.getItem(getStorageKey("licence_groups"));
          const parsed = saved ? JSON.parse(saved) : null;
          setLicenceGroups(Array.isArray(parsed) ? parsed : []);
          break;
        }
      }
    } catch {
      // ignore
    }
    toast.info("Changes reverted to saved values");
  };

  const handleAddSubsidiary = (sub: SubsidiaryCompany) => {
    const updated = [...subsidiaries, sub];
    setSubsidiaries(updated);
    try {
      localStorage.setItem(getStorageKey("subsidiaries"), JSON.stringify(updated));
    } catch {
      // ignore
    }
  };

  const handleDeleteSubsidiary = (id: string) => {
    const updated = subsidiaries.filter((s) => s.id !== id);
    setSubsidiaries(updated);
    try {
      localStorage.setItem(getStorageKey("subsidiaries"), JSON.stringify(updated));
    } catch {
      // ignore
    }
    toast.success("Subsidiary company removed");
  };

  const handleAddLicenceGroup = (grp: LicenceGroup) => {
    const updated = [...licenceGroups, grp];
    setLicenceGroups(updated);
    try {
      localStorage.setItem(getStorageKey("licence_groups"), JSON.stringify(updated));
    } catch {
      // ignore
    }
  };

  const handleDeleteLicenceGroup = (id: string) => {
    const updated = licenceGroups.filter((g) => g.id !== id);
    setLicenceGroups(updated);
    try {
      localStorage.setItem(getStorageKey("licence_groups"), JSON.stringify(updated));
    } catch {
      // ignore
    }
    toast.success("Licence group removed");
  };

  const subNavItems: { id: CompanySubTab; label: string }[] = [
    { id: "details", label: "Details" },
    { id: "address", label: "Address" },
    { id: "size", label: "Size" },
    { id: "licence-details", label: "Licence details" },
    { id: "structure", label: "Structure" },
    { id: "subsidiary", label: "Subsidiary" },
    { id: "licence-groups", label: "Licence groups" },
  ];

  function SectionFooter({
    section,
    label,
    onSave,
    onCancel,
  }: {
    section: SectionId;
    label: string;
    onSave?: () => void;
    onCancel?: () => void;
  }) {
    return (
      <div className="flex items-center justify-end gap-3 pt-3">
        <button
          type="button"
          onClick={() => (onCancel ? onCancel() : handleCancel(section))}
          className="h-10 px-5 text-[14px] font-medium text-[#5C5C5C] hover:text-[#171717] hover:bg-neutral-200/50 rounded-[10px] transition-colors border-0 bg-transparent cursor-pointer"
        >
          Cancel
        </button>
        <button
          type="button"
          onClick={() => (onSave ? onSave() : handleSave(section, label))}
          className="h-10 px-5 bg-[#171717] hover:bg-[#262626] text-white text-[13px] font-medium rounded-[10px] shadow-x-small transition-all cursor-pointer border-0"
        >
          Save changes
        </button>
      </div>
    );
  }

  return (
    <div className="grid grid-cols-1 md:grid-cols-[220px_1fr] gap-[40px] items-start w-full">
      {/* Left Sub-Menu Column (Sticky & styled matching Figma plain text navigation) */}
      <nav
        className="sticky top-[152px] self-start flex flex-col gap-3 pt-1 shrink-0 w-full"
        aria-label="Company navigation"
      >
        <span className="text-[12px] font-semibold uppercase tracking-wider text-[#171717] px-0 mb-1">
          COMPANY
        </span>

        <div role="tablist" aria-label="Company sub-navigation" className="flex flex-col gap-[14px]">
          {subNavItems.map((item) => {
            const isActive = activeSubTab === item.id;
            return (
              <button
                key={item.id}
                role="tab"
                id={`subtab-${item.id}`}
                aria-selected={isActive}
                aria-controls={`subtabpanel-${item.id}`}
                type="button"
                onClick={() => onSubTabChange(item.id)}
                className={`text-left text-[14px] leading-[20px] transition-colors border-0 bg-transparent p-0 cursor-pointer outline-none ${
                  isActive
                    ? "font-medium text-[#171717]"
                    : "font-normal text-[#8C8C8C] hover:text-[#171717]"
                }`}
              >
                {item.label}
              </button>
            );
          })}
        </div>
      </nav>

      {/* Right Content Area */}
      <div
        role="tabpanel"
        id={`subtabpanel-${activeSubTab}`}
        aria-labelledby={`subtab-${activeSubTab}`}
        className="flex-1 min-w-0 flex flex-col gap-4"
      >
        {/* 1. DETAILS */}
        {activeSubTab === "details" && (
          <div className="flex flex-col gap-4">
            <h2 className="font-aeonik-medium text-[20px] leading-[28px] font-medium text-[#171717]">
              Organisation details
            </h2>

            <div className="bg-white rounded-[16px] p-6 md:p-8 space-y-6 shadow-x-small border border-[#EBEBEB]">
              {/* Row 1: Company Name & Trading Name */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="space-y-1.5">
                  <Label htmlFor="companyName" className="text-[14px] font-medium text-[#171717]">
                    Company Name
                  </Label>
                  <Input
                    id="companyName"
                    value={companyDetails.companyName}
                    onChange={(e) =>
                      setCompanyDetails({ ...companyDetails, companyName: e.target.value })
                    }
                    placeholder="Enter registered company name"
                    className="rounded-[10px] h-11 shadow-x-small border-[#EBEBEB] bg-white text-[14px]"
                  />
                </div>

                <div className="space-y-1.5">
                  <Label htmlFor="tradingName" className="text-[14px] font-medium text-[#171717]">
                    Trading Name <span className="text-[#737373] font-normal text-[13px]">(if different)</span>
                  </Label>
                  <Input
                    id="tradingName"
                    value={companyDetails.tradingName}
                    onChange={(e) =>
                      setCompanyDetails({ ...companyDetails, tradingName: e.target.value })
                    }
                    placeholder="Enter trading name"
                    className="rounded-[10px] h-11 shadow-x-small border-[#EBEBEB] bg-white text-[14px]"
                  />
                </div>
              </div>

              {/* Row 2: Registration Number & Date of Incorporation */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="space-y-1.5">
                  <Label htmlFor="regNumber" className="text-[14px] font-medium text-[#171717]">
                    Company Registration Number
                  </Label>
                  <Input
                    id="regNumber"
                    value={companyDetails.companyRegistrationNumber}
                    onChange={(e) =>
                      setCompanyDetails({
                        ...companyDetails,
                        companyRegistrationNumber: e.target.value,
                      })
                    }
                    placeholder="e.g. 11849203"
                    className="rounded-[10px] h-11 shadow-x-small border-[#EBEBEB] bg-white text-[14px]"
                  />
                </div>

                <div className="space-y-1.5">
                  <Label htmlFor="incorpDate" className="text-[14px] font-medium text-[#171717]">
                    Date of Incorporation
                  </Label>
                  <div className="relative">
                    <RiCalendarLine className="size-5 absolute left-3 top-3 text-[#8C8C8C] pointer-events-none" />
                    <Input
                      id="incorpDate"
                      value={companyDetails.dateOfIncorporation}
                      onChange={(e) =>
                        setCompanyDetails({
                          ...companyDetails,
                          dateOfIncorporation: e.target.value,
                        })
                      }
                      placeholder="DD / MM / YYYY"
                      className="rounded-[10px] h-11 pl-10 shadow-x-small border-[#EBEBEB] bg-white text-[14px]"
                    />
                  </div>
                </div>
              </div>

              {/* Row 3: Company Type & Nature of Business */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="space-y-1.5">
                  <Label htmlFor="companyType" className="text-[14px] font-medium text-[#171717]">
                    Company Type
                  </Label>
                  <Select
                    value={companyDetails.companyType}
                    onValueChange={(val) =>
                      setCompanyDetails({ ...companyDetails, companyType: val || "" })
                    }
                  >
                    <SelectTrigger id="companyType" className="rounded-[10px] h-11 shadow-x-small w-full border-[#EBEBEB] bg-white text-[14px]">
                      <SelectValue placeholder="Select type" />
                    </SelectTrigger>
                    <SelectContent className="rounded-[12px]">
                      <SelectItem value="Private Limited Company">Private Limited Company</SelectItem>
                      <SelectItem value="Public Limited Company (PLC)">Public Limited Company (PLC)</SelectItem>
                      <SelectItem value="Limited Liability Partnership (LLP)">Limited Liability Partnership (LLP)</SelectItem>
                      <SelectItem value="Sole Trader / Partnership">Sole Trader / Partnership</SelectItem>
                      <SelectItem value="Charity / Non-Profit">Charity / Non-Profit</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <div className="space-y-1.5">
                  <Label htmlFor="sicCode" className="text-[14px] font-medium text-[#171717]">
                    Nature of Business (SIC)
                  </Label>
                  <Input
                    id="sicCode"
                    value={companyDetails.sicCode}
                    onChange={(e) =>
                      setCompanyDetails({ ...companyDetails, sicCode: e.target.value })
                    }
                    placeholder="e.g. 62012 - Software development"
                    className="rounded-[10px] h-11 shadow-x-small border-[#EBEBEB] bg-white text-[14px]"
                  />
                </div>
              </div>

              {/* Row 4: PAYE Reference Number */}
              <div className="space-y-1.5">
                <Label htmlFor="payeRef" className="text-[14px] font-medium text-[#171717]">
                  PAYE Reference Number
                </Label>
                <Input
                  id="payeRef"
                  value={companyDetails.payeReferenceNumber}
                  onChange={(e) =>
                    setCompanyDetails({
                      ...companyDetails,
                      payeReferenceNumber: e.target.value,
                    })
                  }
                  placeholder="e.g. 123/AB45678"
                  className="rounded-[10px] h-11 shadow-x-small border-[#EBEBEB] bg-white text-[14px] w-full"
                />
              </div>

              {/* Row 5: Regulatory Body & Regulatory Number */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="space-y-1.5">
                  <Label htmlFor="regBody" className="text-[14px] font-medium text-[#171717]">
                    Regulatory Body <span className="text-[#737373] font-normal text-[13px]">(if applicable)</span>
                  </Label>
                  <Input
                    id="regBody"
                    value={companyDetails.regulatoryBody}
                    onChange={(e) =>
                      setCompanyDetails({
                        ...companyDetails,
                        regulatoryBody: e.target.value,
                      })
                    }
                    placeholder="e.g. FCA, SRA, CQC"
                    className="rounded-[10px] h-11 shadow-x-small border-[#EBEBEB] bg-white text-[14px]"
                  />
                </div>

                <div className="space-y-1.5">
                  <Label htmlFor="regBodyNumber" className="text-[14px] font-medium text-[#171717]">
                    Regulatory Registration Number <span className="text-[#737373] font-normal text-[13px]">(if applicable)</span>
                  </Label>
                  <Input
                    id="regBodyNumber"
                    value={companyDetails.regulatoryRegistrationNumber}
                    onChange={(e) =>
                      setCompanyDetails({
                        ...companyDetails,
                        regulatoryRegistrationNumber: e.target.value,
                      })
                    }
                    placeholder="e.g. 984021"
                    className="rounded-[10px] h-11 shadow-x-small border-[#EBEBEB] bg-white text-[14px]"
                  />
                </div>
              </div>

              {/* Row 6: Director Name(s) */}
              <div className="space-y-1.5">
                <Label htmlFor="directorNames" className="text-[14px] font-medium text-[#171717]">
                  Director Name(s)
                </Label>
                <Input
                  id="directorNames"
                  value={companyDetails.directorNames}
                  onChange={(e) =>
                    setCompanyDetails({
                      ...companyDetails,
                      directorNames: e.target.value,
                    })
                  }
                  placeholder="e.g. Alex Marin, Sarah Mitchell"
                  className="rounded-[10px] h-11 shadow-x-small border-[#EBEBEB] bg-white text-[14px] w-full"
                />
              </div>

              {/* Row 7: Company Email & Phone */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="space-y-1.5">
                  <Label htmlFor="compEmail" className="text-[14px] font-medium text-[#171717]">
                    Company Email
                  </Label>
                  <Input
                    id="compEmail"
                    type="email"
                    value={companyDetails.companyEmail}
                    onChange={(e) =>
                      setCompanyDetails({
                        ...companyDetails,
                        companyEmail: e.target.value,
                      })
                    }
                    placeholder="contact@viems.io"
                    className="rounded-[10px] h-11 shadow-x-small border-[#EBEBEB] bg-white text-[14px]"
                  />
                </div>

                <div className="space-y-1.5">
                  <Label htmlFor="compPhone" className="text-[14px] font-medium text-[#171717]">
                    Company Phone Number
                  </Label>
                  <Input
                    id="compPhone"
                    value={companyDetails.companyPhone}
                    onChange={(e) =>
                      setCompanyDetails({
                        ...companyDetails,
                        companyPhone: e.target.value,
                      })
                    }
                    placeholder="+44 20 7946 0912"
                    className="rounded-[10px] h-11 shadow-x-small border-[#EBEBEB] bg-white text-[14px]"
                  />
                </div>
              </div>

              {/* Row 8: Company Website */}
              <div className="space-y-1.5">
                <Label htmlFor="compWebsite" className="text-[14px] font-medium text-[#171717]">
                  Company Website
                </Label>
                <Input
                  id="compWebsite"
                  value={companyDetails.companyWebsite}
                  onChange={(e) =>
                    setCompanyDetails({
                      ...companyDetails,
                      companyWebsite: e.target.value,
                    })
                  }
                  placeholder="https://viems.io"
                  className="rounded-[10px] h-11 shadow-x-small border-[#EBEBEB] bg-white text-[14px] w-full"
                />
              </div>

              {/* Row 9: VAT Number */}
              <div className="space-y-1.5">
                <Label htmlFor="vatNumber" className="text-[14px] font-medium text-[#171717]">
                  VAT Number <span className="text-[#737373] font-normal text-[13px]">(if registered)</span>
                </Label>
                <Input
                  id="vatNumber"
                  value={companyDetails.vatNumber}
                  onChange={(e) =>
                    setCompanyDetails({
                      ...companyDetails,
                      vatNumber: e.target.value,
                    })
                  }
                  placeholder="GB 319 8201 44"
                  className="rounded-[10px] h-11 shadow-x-small border-[#EBEBEB] bg-white text-[14px] w-full"
                />
              </div>
            </div>

            {/* Footer Buttons matching Figma bottom right placement */}
            <SectionFooter section="details" label="Details" />
          </div>
        )}

        {/* 2. ADDRESS */}
        {activeSubTab === "address" && (
          <div className="flex flex-col gap-4">
            <h2 className="font-aeonik-medium text-[20px] leading-[28px] font-medium text-[#171717]">
              Organisation address
            </h2>

            <div className="bg-white rounded-[16px] p-6 md:p-8 space-y-6 shadow-x-small border border-[#EBEBEB]">
              {/* Address Line 1 */}
              <div className="space-y-1.5">
                <Label htmlFor="addr1" className="text-[14px] font-medium text-[#171717]">
                  Address Line 1
                </Label>
                <Input
                  id="addr1"
                  value={addressData.addressLine1}
                  onChange={(e) =>
                    setAddressData({ ...addressData, addressLine1: e.target.value })
                  }
                  placeholder="e.g. 100 City Road"
                  className="rounded-[10px] h-11 shadow-x-small border-[#EBEBEB] bg-white text-[14px] w-full"
                />
              </div>

              {/* Address Line 2 */}
              <div className="space-y-1.5">
                <Label htmlFor="addr2" className="text-[14px] font-medium text-[#171717]">
                  Address Line 2 <span className="text-[#737373] font-normal text-[13px]">(Optional)</span>
                </Label>
                <Input
                  id="addr2"
                  value={addressData.addressLine2}
                  onChange={(e) =>
                    setAddressData({ ...addressData, addressLine2: e.target.value })
                  }
                  placeholder="e.g. 4th Floor, Suite B"
                  className="rounded-[10px] h-11 shadow-x-small border-[#EBEBEB] bg-white text-[14px] w-full"
                />
              </div>

              {/* City & County */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="space-y-1.5">
                  <Label htmlFor="city" className="text-[14px] font-medium text-[#171717]">
                    City
                  </Label>
                  <Input
                    id="city"
                    value={addressData.city}
                    onChange={(e) =>
                      setAddressData({ ...addressData, city: e.target.value })
                    }
                    placeholder="London"
                    className="rounded-[10px] h-11 shadow-x-small border-[#EBEBEB] bg-white text-[14px]"
                  />
                </div>

                <div className="space-y-1.5">
                  <Label htmlFor="county" className="text-[14px] font-medium text-[#171717]">
                    County
                  </Label>
                  <Input
                    id="county"
                    value={addressData.county}
                    onChange={(e) =>
                      setAddressData({ ...addressData, county: e.target.value })
                    }
                    placeholder="Greater London"
                    className="rounded-[10px] h-11 shadow-x-small border-[#EBEBEB] bg-white text-[14px]"
                  />
                </div>
              </div>

              {/* Postcode & Country */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="space-y-1.5">
                  <Label htmlFor="postcode" className="text-[14px] font-medium text-[#171717]">
                    Postcode
                  </Label>
                  <Input
                    id="postcode"
                    value={addressData.postcode}
                    onChange={(e) =>
                      setAddressData({ ...addressData, postcode: e.target.value })
                    }
                    placeholder="EC1V 2NX"
                    className="rounded-[10px] h-11 shadow-x-small border-[#EBEBEB] bg-white text-[14px]"
                  />
                </div>

                <div className="space-y-1.5">
                  <Label htmlFor="country" className="text-[14px] font-medium text-[#171717]">
                    Country
                  </Label>
                  <Select
                    value={addressData.country}
                    onValueChange={(val) =>
                      setAddressData({ ...addressData, country: val || "" })
                    }
                  >
                    <SelectTrigger id="country" className="rounded-[10px] h-11 shadow-x-small w-full border-[#EBEBEB] bg-white text-[14px]">
                      <SelectValue placeholder="Select country" />
                    </SelectTrigger>
                    <SelectContent className="rounded-[12px]">
                      <SelectItem value="United Kingdom">United Kingdom</SelectItem>
                      <SelectItem value="United States">United States</SelectItem>
                      <SelectItem value="Canada">Canada</SelectItem>
                      <SelectItem value="Australia">Australia</SelectItem>
                      <SelectItem value="Ireland">Ireland</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>

              {/* VAT Number */}
              <div className="space-y-1.5">
                <Label htmlFor="addrVat" className="text-[14px] font-medium text-[#171717]">
                  VAT Number <span className="text-[#737373] font-normal text-[13px]">(if registered)</span>
                </Label>
                <Input
                  id="addrVat"
                  value={addressData.vatNumber}
                  onChange={(e) =>
                    setAddressData({ ...addressData, vatNumber: e.target.value })
                  }
                  placeholder="GB 319 8201 44"
                  className="rounded-[10px] h-11 shadow-x-small border-[#EBEBEB] bg-white text-[14px] w-full"
                />
              </div>

              {/* Trading Address Checkbox Section */}
              <div className="pt-2 space-y-3">
                <h3 className="text-[15px] font-medium text-[#171717]">
                  Trading address
                </h3>
                <div className="flex items-center space-x-2">
                  <Checkbox
                    id="sameAddress"
                    checked={addressData.tradingAddressSameAsRegistered}
                    onCheckedChange={(checked) =>
                      setAddressData({
                        ...addressData,
                        tradingAddressSameAsRegistered: Boolean(checked),
                      })
                    }
                    className="rounded-[4px] border-[#8C8C8C]"
                  />
                  <label
                    htmlFor="sameAddress"
                    className="text-[14px] text-[#171717] font-normal cursor-pointer select-none"
                  >
                    Same as registered address
                  </label>
                </div>
              </div>
            </div>

            {/* Footer Buttons */}
            <SectionFooter section="address" label="Address" />
          </div>
        )}

        {/* 3. SIZE */}
        {activeSubTab === "size" && (
          <div className="flex flex-col gap-4">
            <h2 className="font-aeonik-medium text-[20px] leading-[28px] font-medium text-[#171717]">
              Company size
            </h2>

            <div className="bg-white rounded-[16px] p-6 md:p-8 space-y-6 shadow-x-small border border-[#EBEBEB]">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="space-y-1.5">
                  <Label htmlFor="numEmployees" className="text-[14px] font-medium text-[#171717]">
                    Number of Employees
                  </Label>
                  <Select
                    value={sizeData.numberOfEmployees}
                    onValueChange={(val) =>
                      setSizeData({ ...sizeData, numberOfEmployees: val || "" })
                    }
                  >
                    <SelectTrigger id="numEmployees" className="rounded-[10px] h-11 shadow-x-small w-full border-[#EBEBEB] bg-white text-[14px]">
                      <SelectValue placeholder="Select employees range" />
                    </SelectTrigger>
                    <SelectContent className="rounded-[12px]">
                      <SelectItem value="1-10">1 - 10 employees (Micro)</SelectItem>
                      <SelectItem value="11-50">11 - 50 employees (Small)</SelectItem>
                      <SelectItem value="51-250">51 - 250 employees (Medium)</SelectItem>
                      <SelectItem value="251-1000">251 - 1,000 employees (Large)</SelectItem>
                      <SelectItem value="1000+">1,000+ employees (Enterprise)</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <div className="space-y-1.5">
                  <Label htmlFor="sponsWorkers" className="text-[14px] font-medium text-[#171717]">
                    Number of Sponsored Workers
                  </Label>
                  <Input
                    id="sponsWorkers"
                    type="number"
                    value={sizeData.sponsoredWorkers}
                    onChange={(e) =>
                      setSizeData({ ...sizeData, sponsoredWorkers: e.target.value })
                    }
                    placeholder="14"
                    className="rounded-[10px] h-11 shadow-x-small border-[#EBEBEB] bg-white text-[14px]"
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="space-y-1.5">
                  <Label htmlFor="annualTurnover" className="text-[14px] font-medium text-[#171717]">
                    Annual Turnover
                  </Label>
                  <Select
                    value={sizeData.annualTurnover}
                    onValueChange={(val) =>
                      setSizeData({ ...sizeData, annualTurnover: val || "" })
                    }
                  >
                    <SelectTrigger id="annualTurnover" className="rounded-[10px] h-11 shadow-x-small w-full border-[#EBEBEB] bg-white text-[14px]">
                      <SelectValue placeholder="Select turnover" />
                    </SelectTrigger>
                    <SelectContent className="rounded-[12px]">
                      <SelectItem value="Under £500k">Under £500,000</SelectItem>
                      <SelectItem value="£500k - £1M">£500,000 - £1,000,000</SelectItem>
                      <SelectItem value="£1M - £5M">£1,000,000 - £5,000,000</SelectItem>
                      <SelectItem value="£5M - £25M">£5,000,000 - £25,000,000</SelectItem>
                      <SelectItem value="£25M+">£25,000,000+</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <div className="space-y-1.5">
                  <Label htmlFor="orgCategory" className="text-[14px] font-medium text-[#171717]">
                    Organisation Category
                  </Label>
                  <Select
                    value={sizeData.organisationCategory}
                    onValueChange={(val) =>
                      setSizeData({ ...sizeData, organisationCategory: val || "" })
                    }
                  >
                    <SelectTrigger id="orgCategory" className="rounded-[10px] h-11 shadow-x-small w-full border-[#EBEBEB] bg-white text-[14px]">
                      <SelectValue placeholder="Select category" />
                    </SelectTrigger>
                    <SelectContent className="rounded-[12px]">
                      <SelectItem value="Small/Medium Business">Small / Medium Business (SME)</SelectItem>
                      <SelectItem value="Large Business">Large Business / Multi-National</SelectItem>
                      <SelectItem value="Charitable Organisation">Charitable Organisation</SelectItem>
                      <SelectItem value="Higher Education Institution">Higher Education Institution</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>
            </div>

            {/* Footer Buttons */}
            <SectionFooter section="size" label="Size" />
          </div>
        )}

        {/* 4. LICENCE DETAILS */}
        {activeSubTab === "licence-details" && (
          <div className="flex flex-col gap-4">
            <h2 className="font-aeonik-medium text-[20px] leading-[28px] font-medium text-[#171717]">
              Licence details
            </h2>

            <div className="bg-white rounded-[16px] p-6 md:p-8 space-y-6 shadow-x-small border border-[#EBEBEB]">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="space-y-1.5">
                  <Label htmlFor="sponsorLicenceNumber" className="text-[14px] font-medium text-[#171717]">
                    Sponsor Licence Number
                  </Label>
                  <Input
                    id="sponsorLicenceNumber"
                    value={licenceData.sponsorLicenceNumber}
                    onChange={(e) =>
                      setLicenceData({
                        ...licenceData,
                        sponsorLicenceNumber: e.target.value,
                      })
                    }
                    placeholder="e.g. 1ABC23DEF"
                    className="rounded-[10px] h-11 shadow-x-small border-[#EBEBEB] bg-white text-[14px]"
                  />
                </div>

                <div className="space-y-1.5">
                  <Label htmlFor="licenceStatus" className="text-[14px] font-medium text-[#171717]">
                    Licence Status
                  </Label>
                  <Select
                    value={licenceData.licenceStatus}
                    onValueChange={(val) =>
                      setLicenceData({ ...licenceData, licenceStatus: val || "" })
                    }
                  >
                    <SelectTrigger id="licenceStatus" className="rounded-[10px] h-11 shadow-x-small w-full border-[#EBEBEB] bg-white text-[14px]">
                      <SelectValue placeholder="Select status" />
                    </SelectTrigger>
                    <SelectContent className="rounded-[12px]">
                      <SelectItem value="A-Rating">A-Rating (Premium Sponsor)</SelectItem>
                      <SelectItem value="B-Rating">B-Rating (Under Action Plan)</SelectItem>
                      <SelectItem value="Suspended">Suspended</SelectItem>
                      <SelectItem value="Under Review">Under Review</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="space-y-1.5">
                  <Label htmlFor="licenceGrantedDate" className="text-[14px] font-medium text-[#171717]">
                    Licence Granted Date
                  </Label>
                  <div className="relative">
                    <RiCalendarLine className="size-5 absolute left-3 top-3 text-[#8C8C8C] pointer-events-none" />
                    <Input
                      id="licenceGrantedDate"
                      value={licenceData.licenceGrantedDate}
                      onChange={(e) =>
                        setLicenceData({
                          ...licenceData,
                          licenceGrantedDate: e.target.value,
                        })
                      }
                      placeholder="DD / MM / YYYY"
                      className="rounded-[10px] h-11 pl-10 shadow-x-small border-[#EBEBEB] bg-white text-[14px]"
                    />
                  </div>
                </div>

                <div className="space-y-1.5">
                  <Label htmlFor="licenceTier" className="text-[14px] font-medium text-[#171717]">
                    Licence Tier
                  </Label>
                  <Select
                    value={licenceData.licenceTier}
                    onValueChange={(val) =>
                      setLicenceData({ ...licenceData, licenceTier: val || "" })
                    }
                  >
                    <SelectTrigger id="licenceTier" className="rounded-[10px] h-11 shadow-x-small w-full border-[#EBEBEB] bg-white text-[14px]">
                      <SelectValue placeholder="Select tier" />
                    </SelectTrigger>
                    <SelectContent className="rounded-[12px]">
                      <SelectItem value="Skilled Worker">Skilled Worker</SelectItem>
                      <SelectItem value="Senior or Specialist Worker">Senior or Specialist Worker</SelectItem>
                      <SelectItem value="Temporary Worker">Temporary Worker</SelectItem>
                      <SelectItem value="Scale-up Worker">Scale-up Worker</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>

              {/* CoS Allocation */}
              <div className="space-y-1.5">
                <Label htmlFor="cosAllocation" className="text-[14px] font-medium text-[#171717]">
                  CoS Allocation
                </Label>
                <Input
                  id="cosAllocation"
                  value={licenceData.cosAllocation}
                  onChange={(e) =>
                    setLicenceData({ ...licenceData, cosAllocation: e.target.value })
                  }
                  placeholder="e.g. 25"
                  className="rounded-[10px] h-11 shadow-x-small border-[#EBEBEB] bg-white text-[14px] max-w-[200px]"
                />
              </div>

              {/* Last Compliance Visit & Outcome */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="space-y-1.5">
                  <Label htmlFor="lastVisit" className="text-[14px] font-medium text-[#171717]">
                    Last Compliance Visit
                  </Label>
                  <div className="relative">
                    <RiCalendarLine className="size-5 absolute left-3 top-3 text-[#8C8C8C] pointer-events-none" />
                    <Input
                      id="lastVisit"
                      value={licenceData.lastComplianceVisit}
                      onChange={(e) =>
                        setLicenceData({
                          ...licenceData,
                          lastComplianceVisit: e.target.value,
                        })
                      }
                      placeholder="DD / MM / YYYY"
                      className="rounded-[10px] h-11 pl-10 shadow-x-small border-[#EBEBEB] bg-white text-[14px]"
                    />
                  </div>
                </div>

                <div className="space-y-1.5">
                  <Label htmlFor="visitOutcome" className="text-[14px] font-medium text-[#171717]">
                    Compliance Visit Outcome
                  </Label>
                  <Select
                    value={licenceData.complianceVisitOutcome}
                    onValueChange={(val) =>
                      setLicenceData({ ...licenceData, complianceVisitOutcome: val || "" })
                    }
                  >
                    <SelectTrigger id="visitOutcome" className="rounded-[10px] h-11 shadow-x-small w-full border-[#EBEBEB] bg-white text-[14px]">
                      <SelectValue placeholder="Select outcome" />
                    </SelectTrigger>
                    <SelectContent className="rounded-[12px]">
                      <SelectItem value="Satisfactory (Met all sponsor duties)">Satisfactory (Met all sponsor duties)</SelectItem>
                      <SelectItem value="Action Plan Required">Action Plan Required</SelectItem>
                      <SelectItem value="Fully Compliant">Fully Compliant</SelectItem>
                      <SelectItem value="Pending Audit">Pending Audit</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>
            </div>

            {/* Footer Buttons */}
            <SectionFooter section="licence" label="Licence details" />
          </div>
        )}

        {/* 5. STRUCTURE */}
        {activeSubTab === "structure" && (
          <div className="flex flex-col gap-4">
            <h2 className="font-aeonik-medium text-[20px] leading-[28px] font-medium text-[#171717]">
              Organisational structure
            </h2>

            <div className="bg-white rounded-[16px] p-6 md:p-8 space-y-6 shadow-x-small border border-[#EBEBEB]">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="space-y-1.5">
                  <Label htmlFor="parentCompany" className="text-[14px] font-medium text-[#171717]">
                    Parent Company
                  </Label>
                  <Select
                    value={structureData.parentCompany}
                    onValueChange={(val) =>
                      setStructureData({ ...structureData, parentCompany: val || "" })
                    }
                  >
                    <SelectTrigger id="parentCompany" className="rounded-[10px] h-11 shadow-x-small w-full border-[#EBEBEB] bg-white text-[14px]">
                      <SelectValue placeholder="Select parent status" />
                    </SelectTrigger>
                    <SelectContent className="rounded-[12px]">
                      <SelectItem value="Yes">Yes (Has Parent Company)</SelectItem>
                      <SelectItem value="No">No (Independent Entity)</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <div className="space-y-1.5">
                  <Label htmlFor="parentCompName" className="text-[14px] font-medium text-[#171717]">
                    Parent Company Name <span className="text-[#737373] font-normal text-[13px]">(if applicable)</span>
                  </Label>
                  <Input
                    id="parentCompName"
                    value={structureData.parentCompanyName}
                    onChange={(e) =>
                      setStructureData({ ...structureData, parentCompanyName: e.target.value })
                    }
                    placeholder="e.g. AX Global Holdings Inc."
                    className="rounded-[10px] h-11 shadow-x-small border-[#EBEBEB] bg-white text-[14px]"
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="space-y-1.5">
                  <Label htmlFor="groupStructure" className="text-[14px] font-medium text-[#171717]">
                    Group Structure
                  </Label>
                  <Select
                    value={structureData.groupStructure}
                    onValueChange={(val) =>
                      setStructureData({ ...structureData, groupStructure: val || "" })
                    }
                  >
                    <SelectTrigger id="groupStructure" className="rounded-[10px] h-11 shadow-x-small w-full border-[#EBEBEB] bg-white text-[14px]">
                      <SelectValue placeholder="Select group structure" />
                    </SelectTrigger>
                    <SelectContent className="rounded-[12px]">
                      <SelectItem value="Single Entity">Single Entity</SelectItem>
                      <SelectItem value="Multi-Entity Corporate Group">Multi-Entity Corporate Group</SelectItem>
                      <SelectItem value="Franchise">Franchise</SelectItem>
                      <SelectItem value="Joint Venture">Joint Venture</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <div className="space-y-1.5">
                  <Label htmlFor="ultimateHolding" className="text-[14px] font-medium text-[#171717]">
                    Ultimate Holding Company
                  </Label>
                  <Input
                    id="ultimateHolding"
                    value={structureData.ultimateHoldingCompany}
                    onChange={(e) =>
                      setStructureData({
                        ...structureData,
                        ultimateHoldingCompany: e.target.value,
                      })
                    }
                    placeholder="e.g. AX Worldwide Holdings LLC"
                    className="rounded-[10px] h-11 shadow-x-small border-[#EBEBEB] bg-white text-[14px]"
                  />
                </div>
              </div>
            </div>

            {/* Footer Buttons */}
            <SectionFooter section="structure" label="Structure" />
          </div>
        )}

        {/* 6. SUBSIDIARY */}
        {activeSubTab === "subsidiary" && (
          <div className="flex flex-col gap-4">
            <h2 className="font-aeonik-medium text-[20px] leading-[28px] font-medium text-[#171717]">
              Subsidiary companies
            </h2>

            {subsidiaries.length === 0 ? (
              /* Empty State matching Figma EXACTLY */
              <div className="bg-white rounded-[16px] border border-[#EBEBEB] p-12 text-center flex flex-col items-center justify-center min-h-[220px] shadow-x-small">
                <p className="text-[14px] text-[#737373] font-normal mb-5">
                  No subsidiary companies added
                </p>
                <button
                  type="button"
                  onClick={() => setIsAddSubOpen(true)}
                  className="h-10 px-5 bg-[#171717] hover:bg-[#262626] text-white text-[13px] font-medium rounded-[10px] shadow-x-small transition-all cursor-pointer border-0 flex items-center gap-1.5"
                >
                  <RiAddLine className="size-4 text-white" />
                  <span>Add subsidiary</span>
                </button>
              </div>
            ) : (
              <div className="space-y-3">
                <div className="flex justify-end">
                  <button
                    type="button"
                    onClick={() => setIsAddSubOpen(true)}
                    className="h-9 px-4 bg-[#171717] hover:bg-[#262626] text-white text-[13px] font-medium rounded-[8px] shadow-x-small transition-all cursor-pointer border-0 flex items-center gap-1.5"
                  >
                    <RiAddLine className="size-4 text-white" />
                    <span>Add subsidiary</span>
                  </button>
                </div>

                <div className="grid grid-cols-1 gap-3">
                  {subsidiaries.map((sub) => (
                    <div
                      key={sub.id}
                      className="bg-white rounded-[16px] border border-[#EBEBEB] p-5 shadow-x-small flex items-center justify-between hover:border-[#D4D4D4] transition-all"
                    >
                      <div className="flex items-center gap-4">
                        <div className="size-10 rounded-[10px] bg-[#F5F5F5] flex items-center justify-center text-[#737373] shrink-0">
                          <RiBuildingLine className="size-5" />
                        </div>
                        <div>
                          <p className="text-[14px] font-medium text-[#171717]">
                            {sub.name}
                          </p>
                          <p className="text-[12px] text-[#737373]">
                            Reg: {sub.registrationNumber || "N/A"} · {sub.country} · {sub.relationship} ({sub.shareholding})
                          </p>
                        </div>
                      </div>

                      <Button
                        type="button"
                        variant="ghost"
                        size="icon"
                        onClick={() => handleDeleteSubsidiary(sub.id)}
                        className="size-8 rounded-[8px] text-[#FB3748] hover:bg-red-50"
                      >
                        <RiDeleteBinLine className="size-4" />
                      </Button>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Footer Buttons */}
            <SectionFooter section="subsidiaries" label="Subsidiaries" />
          </div>
        )}

        {/* 7. LICENCE GROUPS */}
        {activeSubTab === "licence-groups" && (
          <div className="flex flex-col gap-4">
            <h2 className="font-aeonik-medium text-[20px] leading-[28px] font-medium text-[#171717]">
              Licence groups
            </h2>

            {licenceGroups.length === 0 ? (
              /* Empty State matching Figma EXACTLY */
              <div className="bg-white rounded-[16px] border border-[#EBEBEB] p-12 text-center flex flex-col items-center justify-center min-h-[220px] shadow-x-small">
                <p className="text-[14px] text-[#737373] font-normal mb-5">
                  No licence groups configured
                </p>
                <button
                  type="button"
                  onClick={() => setIsAddGroupOpen(true)}
                  className="h-10 px-5 bg-[#171717] hover:bg-[#262626] text-white text-[13px] font-medium rounded-[10px] shadow-x-small transition-all cursor-pointer border-0 flex items-center gap-1.5"
                >
                  <RiAddLine className="size-4 text-white" />
                  <span>Add licence group</span>
                </button>
              </div>
            ) : (
              <div className="space-y-3">
                <div className="flex justify-end">
                  <button
                    type="button"
                    onClick={() => setIsAddGroupOpen(true)}
                    className="h-9 px-4 bg-[#171717] hover:bg-[#262626] text-white text-[13px] font-medium rounded-[8px] shadow-x-small transition-all cursor-pointer border-0 flex items-center gap-1.5"
                  >
                    <RiAddLine className="size-4 text-white" />
                    <span>Add licence group</span>
                  </button>
                </div>

                <div className="grid grid-cols-1 gap-3">
                  {licenceGroups.map((grp) => (
                    <div
                      key={grp.id}
                      className="bg-white rounded-[16px] border border-[#EBEBEB] p-5 shadow-x-small flex items-center justify-between hover:border-[#D4D4D4] transition-all"
                    >
                      <div>
                        <p className="text-[14px] font-medium text-[#171717]">
                          {grp.name} ({grp.code})
                        </p>
                        <p className="text-[12px] text-[#737373]">
                          Tier: {grp.tier} · Allocation: {grp.cosAllocated} CoS · Branch: {grp.branch}
                        </p>
                      </div>

                      <Button
                        type="button"
                        variant="ghost"
                        size="icon"
                        onClick={() => handleDeleteLicenceGroup(grp.id)}
                        className="size-8 rounded-[8px] text-[#FB3748] hover:bg-red-50"
                      >
                        <RiDeleteBinLine className="size-4" />
                      </Button>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Footer Buttons */}
            <SectionFooter section="licence-groups" label="Licence groups" />
          </div>
        )}
      </div>

      {/* Modals */}
      <AddSubsidiaryModal
        open={isAddSubOpen}
        onOpenChange={setIsAddSubOpen}
        onAdd={handleAddSubsidiary}
      />

      <AddLicenceGroupModal
        open={isAddGroupOpen}
        onOpenChange={setIsAddGroupOpen}
        onAdd={handleAddLicenceGroup}
        existingGroups={licenceGroups}
      />
    </div>
  );
}
