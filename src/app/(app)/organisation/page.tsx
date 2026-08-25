"use client";

import * as React from "react";
import { useSearchParams, useRouter } from "next/navigation";
import {
  RiBuildingFill,
  RiBuildingLine,
  RiFileCopy2Fill,
  RiFileCopy2Line,
  RiHistoryFill,
  RiHistoryLine,
  RiTeamFill,
  RiTeamLine,
  RiDownload2Line,
} from "@remixicon/react";
import { toast } from "sonner";
import { CompanyTab, CompanySubTab } from "./company-tab";

type MainTab = "company" | "documents" | "history" | "team";

function TabPlaceholder({
  title,
  description,
  icon: Icon,
}: {
  title: string;
  description: string;
  icon: React.ComponentType<{ className?: string }>;
}) {
  return (
    <div className="bg-white rounded-[16px] border border-[#EBEBEB] p-12 text-center shadow-card-large max-w-xl mx-auto my-8">
      <div className="size-12 rounded-full bg-[#F5F5F5] flex items-center justify-center mx-auto mb-4 text-[#5C5C5C]">
        <Icon className="size-6" />
      </div>
      <h3 className="font-aeonik-medium text-[18px] text-[#171717] mb-2">{title}</h3>
      <p className="text-[14px] text-[#5C5C5C] leading-[20px]">{description}</p>
    </div>
  );
}

function OrganisationPageContent() {
  const router = useRouter();
  const searchParams = useSearchParams();

  const tabParam = (searchParams.get("tab")?.toLowerCase() as MainTab) || "company";
  const subParam = searchParams.get("sub") || "details";

  const [activeTab, setActiveTab] = React.useState<MainTab>(
    ["company", "documents", "history", "team"].includes(tabParam) ? tabParam : "company"
  );
  const [companySubTab, setCompanySubTab] = React.useState<CompanySubTab>(
    [
      "details",
      "address",
      "size",
      "licence-details",
      "structure",
      "subsidiary",
      "licence-groups",
    ].includes(subParam as any)
      ? (subParam as CompanySubTab)
      : "details"
  );

  React.useEffect(() => {
    const currentTab = searchParams.get("tab")?.toLowerCase() as MainTab;
    const currentSub = searchParams.get("sub");
    if (currentTab && ["company", "documents", "history", "team"].includes(currentTab)) {
      setActiveTab(currentTab);
    }
    if (
      currentSub &&
      [
        "details",
        "address",
        "size",
        "licence-details",
        "structure",
        "subsidiary",
        "licence-groups",
      ].includes(currentSub as any)
    ) {
      setCompanySubTab(currentSub as CompanySubTab);
    }
  }, [searchParams]);

  const handleTabSelect = (tab: MainTab) => {
    setActiveTab(tab);
    let newSub = "";
    if (tab === "company") newSub = companySubTab;
    const url = newSub ? `/organisation?tab=${tab}&sub=${newSub}` : `/organisation?tab=${tab}`;
    router.replace(url, { scroll: false });
  };

  const handleCompanySubTabSelect = (sub: CompanySubTab) => {
    setCompanySubTab(sub);
    router.replace(`/organisation?tab=company&sub=${sub}`, { scroll: false });
  };

  const handleDownloadReport = () => {
    toast.success("Organisation Compliance & Sponsorship Report downloaded.");
  };

  const mainTabs = [
    {
      id: "company" as MainTab,
      label: "Company",
      iconActive: RiBuildingFill,
      iconInactive: RiBuildingLine,
    },
    {
      id: "documents" as MainTab,
      label: "Documents",
      iconActive: RiFileCopy2Fill,
      iconInactive: RiFileCopy2Line,
    },
    {
      id: "history" as MainTab,
      label: "History",
      iconActive: RiHistoryFill,
      iconInactive: RiHistoryLine,
    },
    {
      id: "team" as MainTab,
      label: "Team",
      iconActive: RiTeamFill,
      iconInactive: RiTeamLine,
    },
  ];

  return (
    <div className="w-full min-h-full bg-[#F5F5F5] text-[#171717] font-sans pb-[80px]">
      {/* ─── Fixed / Sticky White Page Header matching Settings page exactly ─── */}
      <div className="sticky top-0 z-20 bg-white border-b border-[#EBEBEB] rounded-t-[16px] px-6 md:px-[64px] pt-[28px] pb-0 shrink-0">
        <div className="max-w-[1232px] mx-auto flex flex-col gap-5">
          {/* Top Row: Title, Subtitle, Action Button */}
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <div className="flex flex-col gap-1">
              <h1 className="font-aeonik-medium text-[24px] leading-[32px] font-medium text-[#171717] tracking-[-0.01em]">
                Organisation
              </h1>
              <p className="text-[14px] leading-[20px] font-normal text-[#5C5C5C] tracking-[-0.006em]">
                Create, track, and manage visa cases for individual or grouped applicants.
              </p>
            </div>

            <button
              type="button"
              onClick={handleDownloadReport}
              className="h-10 px-4 rounded-[10px] bg-[#F5F5F5] hover:bg-[#EBEBEB] text-[#171717] text-[13px] font-medium flex items-center gap-2 border border-[#EBEBEB] shadow-x-small transition-all cursor-pointer self-start sm:self-auto shrink-0"
            >
              <RiDownload2Line className="size-4 text-[#5C5C5C]" />
              <span>Download report</span>
            </button>
          </div>

          {/* ─── 4 Top-Level Horizontal Tabs: Company, Documents, History, Team — ALWAYS VISIBLE ─── */}
          <div className="flex items-center gap-8 overflow-x-auto border-b border-transparent -mb-[1px]">
            {mainTabs.map((tab) => {
              const isActive = activeTab === tab.id;
              const Icon = isActive ? tab.iconActive : tab.iconInactive;

              return (
                <button
                  key={tab.id}
                  type="button"
                  onClick={() => handleTabSelect(tab.id)}
                  className={`relative flex items-center gap-2 pb-3.5 text-[14px] leading-[20px] font-medium transition-colors border-0 bg-transparent cursor-pointer whitespace-nowrap outline-none ${
                    isActive
                      ? "text-[#171717]"
                      : "text-[#5C5C5C] hover:text-[#171717]"
                  }`}
                >
                  <Icon className={`size-4.5 ${isActive ? "text-[#171717]" : "text-[#5C5C5C]"}`} />
                  <span>{tab.label}</span>

                  {/* Active Indicator Underline */}
                  {isActive && (
                    <span className="absolute left-0 right-0 bottom-0 h-[2px] bg-[#171717] rounded-t-full" />
                  )}
                </button>
              );
            })}
          </div>
        </div>
      </div>

      {/* ─── Main Content Canvas ─── */}
      <div className="max-w-[1232px] mx-auto px-6 md:px-[64px] pt-[32px]">
        {activeTab === "company" && (
          <CompanyTab
            activeSubTab={companySubTab}
            onSubTabChange={handleCompanySubTabSelect}
          />
        )}
        {activeTab === "documents" && (
          <TabPlaceholder
            title="Documents Management"
            description="View, filter, and manage sponsor compliance documents and proof files."
            icon={RiFileCopy2Line}
          />
        )}
        {activeTab === "history" && (
          <TabPlaceholder
            title="Organisation Audit & History"
            description="Track organisation events, changes, and UKVI compliance history."
            icon={RiHistoryLine}
          />
        )}
        {activeTab === "team" && (
          <TabPlaceholder
            title="Team & UKVI Key Personnel"
            description="Manage organisation staff, Key Contact, Authorising Officer, and Level 1/2 SMS users."
            icon={RiTeamLine}
          />
        )}
      </div>
    </div>
  );
}

export default function OrganisationPage() {
  return (
    <React.Suspense
      fallback={
        <div className="w-full min-h-full bg-[#F5F5F5] p-[64px] text-[14px] text-[#5C5C5C]">
          Loading organisation details...
        </div>
      }
    >
      <OrganisationPageContent />
    </React.Suspense>
  );
}
