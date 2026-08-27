"use client";

import * as React from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  RiMore2Line,
  RiArrowUpDownLine,
  RiSearchLine,
  RiInformationFill,
  RiMailSendLine,
  RiDeleteBinLine,
  RiEditLine,
  RiTimeLine,
  RiCheckboxCircleLine,
  RiFileTextLine,
  RiFilter3Line,
} from "@remixicon/react";
import { toast } from "sonner";
import { InviteMemberModal } from "@/components/InviteMemberModal";
import { EditMemberModal, TeamMember } from "@/components/EditMemberModal";
import {
  ChangeUkviRoleModal,
  UkviRoleAssignment,
} from "./modals/change-ukvi-role-modal";
import { TimelineEntry } from "./history-tab";

export const TEAM_SUB_TABS = ["members", "ukvi-roles", "activity-log"] as const;
export type TeamSubTab = (typeof TEAM_SUB_TABS)[number];

interface TeamTabProps {
  activeSubTab: TeamSubTab;
  onSubTabChange: (subTab: TeamSubTab) => void;
}

const INITIAL_MEMBERS: TeamMember[] = [
  {
    id: "mem-1",
    name: "Alex Marin",
    firstName: "Alex",
    lastName: "Marin",
    email: "alex.marin@viems.io",
    avatarText: "AM",
    role: "ADMIN",
    smsRole: "—",
    status: "active",
  },
  {
    id: "mem-2",
    name: "Nathan Wood",
    firstName: "Nathan",
    lastName: "Wood",
    email: "nathan.wood@viems.io",
    avatarText: "NW",
    role: "AUTHORISING OFFICER",
    smsRole: "Level 1",
    status: "active",
  },
  {
    id: "mem-3",
    name: "Sarah Kim",
    firstName: "Sarah",
    lastName: "Kim",
    email: "sarah.kim@viems.io",
    avatarText: "GS",
    role: "COMPLIANCE OFFICER",
    smsRole: "Level 2",
    status: "active",
  },
  {
    id: "mem-4",
    name: "Elena Petrova",
    firstName: "Elena",
    lastName: "Petrova",
    email: "elena.petrova@viems.io",
    avatarText: "EP",
    role: "KEY CONTACT",
    smsRole: "Level 2",
    status: "active",
  },
  {
    id: "mem-5",
    name: "Ami Monarch",
    firstName: "Ami",
    lastName: "Monarch",
    email: "ami.monarch@viems.io",
    avatarText: "AM",
    role: "INVITED",
    smsRole: "View only",
    status: "invited",
  },
];

const INITIAL_UKVI_ROLES: UkviRoleAssignment[] = [
  {
    roleCode: "AO",
    roleTitle: "Authorising Officer",
    assignedMembers: ["Sarah Mitchell"],
  },
  {
    roleCode: "KC",
    roleTitle: "Key Contact",
    assignedMembers: ["Elena Petrova"],
  },
  {
    roleCode: "L1",
    roleTitle: "Level 1 User",
    assignedMembers: ["Sarah Mitchell", "James Whitfield"],
  },
  {
    roleCode: "L2",
    roleTitle: "Level 2 User",
    assignedMembers: ["Priya Nair", "David Chen"],
  },
];

interface ActivityLogItem {
  id: string;
  date: string;
  action: string;
  refCode: string;
  time: string;
  author: string;
  authorInitials: string;
  type: "cos" | "rtw" | "contract" | "general";
}

const INITIAL_ACTIVITY_LOG: ActivityLogItem[] = [
  {
    id: "act-1",
    date: "26 MAR 2026",
    action: "Sarah Kim assigned CoS for Taylor Johnson",
    refCode: "124/2026",
    time: "01:12 PM",
    author: "Sarah Kim",
    authorInitials: "SK",
    type: "cos",
  },
  {
    id: "act-2",
    date: "26 MAR 2026",
    action: "Elena Petrova updated RTW check dealing for Chindy Okafor",
    refCode: "184/2024",
    time: "01:12 PM",
    author: "Elena Petrova",
    authorInitials: "JW",
    type: "rtw",
  },
  {
    id: "act-3",
    date: "24 MAR 2026",
    action: "Priya Nair uploaded employment contract for Sofia Reyes",
    refCode: "231/2026",
    time: "01:12 PM",
    author: "Priya Nair",
    authorInitials: "PN",
    type: "contract",
  },
  {
    id: "act-4",
    date: "24 MAR 2026",
    action: "Alex Marin added Nathan Wood to Level 1 SMS Users",
    refCode: "SMS-4402",
    time: "10:30 AM",
    author: "Alex Marin",
    authorInitials: "AM",
    type: "general",
  },
];

export function TeamTab({ activeSubTab, onSubTabChange }: TeamTabProps) {
  // Members State
  const [members, setMembers] = React.useState<TeamMember[]>(INITIAL_MEMBERS);
  const [memberSearch, setMemberSearch] = React.useState("");
  const [sortField, setSortField] = React.useState<keyof TeamMember | null>(null);
  const [sortDirection, setSortDirection] = React.useState<"asc" | "desc">("asc");

  // UKVI Roles State
  const [ukviRoles, setUkviRoles] = React.useState<UkviRoleAssignment[]>(INITIAL_UKVI_ROLES);
  const [activeRoleModal, setActiveRoleModal] = React.useState<UkviRoleAssignment | null>(null);

  // Activity Log State
  const [activityLog] = React.useState<ActivityLogItem[]>(INITIAL_ACTIVITY_LOG);
  const [activitySearch, setActivitySearch] = React.useState("");
  const [selectedAuthor, setSelectedAuthor] = React.useState("Everyone");

  // Modals State
  const [isInviteOpen, setIsInviteOpen] = React.useState(false);
  const [editingMember, setEditingMember] = React.useState<TeamMember | null>(null);

  // Load from localStorage
  React.useEffect(() => {
    try {
      const savedMembers = localStorage.getItem("viems_org_team_members");
      if (savedMembers) {
        const parsed = JSON.parse(savedMembers);
        if (Array.isArray(parsed)) {
          setMembers(parsed);
        }
      }
      const savedRoles = localStorage.getItem("viems_org_ukvi_roles");
      if (savedRoles) {
        const parsed = JSON.parse(savedRoles);
        if (Array.isArray(parsed)) {
          setUkviRoles(parsed);
        }
      }
    } catch {
      // ignore
    }
  }, []);

  const saveMembersList = (updated: TeamMember[]) => {
    setMembers(updated);
    try {
      localStorage.setItem("viems_org_team_members", JSON.stringify(updated));
    } catch {
      // ignore
    }
  };

  const handleSort = (field: keyof TeamMember) => {
    if (sortField === field) {
      setSortDirection(sortDirection === "asc" ? "desc" : "asc");
    } else {
      setSortField(field);
      setSortDirection("asc");
    }
  };

  // Filtered and Sorted Members
  const sortedMembers = React.useMemo(() => {
    let result = members.filter(
      (m) =>
        m.name.toLowerCase().includes(memberSearch.toLowerCase()) ||
        m.email.toLowerCase().includes(memberSearch.toLowerCase()) ||
        m.role.toLowerCase().includes(memberSearch.toLowerCase())
    );

    if (!sortField) return result;

    return [...result].sort((a, b) => {
      const valA = String(a[sortField] || "").toLowerCase();
      const valB = String(b[sortField] || "").toLowerCase();
      if (valA < valB) return sortDirection === "asc" ? -1 : 1;
      if (valA > valB) return sortDirection === "asc" ? 1 : -1;
      return 0;
    });
  }, [members, memberSearch, sortField, sortDirection]);

  // Derived metrics
  const activeCount = members.filter((m) => m.status === "active").length;
  const pendingCount = members.filter((m) => m.status === "invited").length;
  const smsCount = members.filter((m) => m.smsRole && m.smsRole !== "—").length;

  const handleRoleSave = (
    roleCode: "AO" | "KC" | "L1" | "L2",
    updatedMembers: string[],
    _meta?: { effectiveDate: string; notes?: string }
  ) => {
    const updated = ukviRoles.map((r) =>
      r.roleCode === roleCode ? { ...r, assignedMembers: updatedMembers } : r
    );
    setUkviRoles(updated);
    try {
      localStorage.setItem("viems_org_ukvi_roles", JSON.stringify(updated));
    } catch {
      // ignore
    }
  };

  const handleMemberSave = (updatedMember: TeamMember) => {
    const updated = members.map((m) => (m.id === updatedMember.id ? updatedMember : m));
    saveMembersList(updated);
    toast.success(`Updated ${updatedMember.name}`);
    setEditingMember(null);
  };

  const handleMemberDelete = (id: string) => {
    const target = members.find((m) => m.id === id);
    const updated = members.filter((m) => m.id !== id);
    saveMembersList(updated);
    toast.success(`Removed ${target?.name || "member"}`);
  };

  const handleResendInvite = (member: TeamMember) => {
    toast.success(`Invitation email resent to ${member.email}`);
  };

  const getRoleBadge = (role: string) => {
    const normalized = role.toUpperCase();
    if (normalized.includes("ADMIN")) {
      return (
        <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-[11px] font-semibold uppercase tracking-wide bg-[#EFEBFF] text-[#7D52F4]">
          ADMIN
        </span>
      );
    }
    if (normalized.includes("AUTHORISING")) {
      return (
        <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-[11px] font-semibold uppercase tracking-wide bg-[#EBF1FF] text-[#335CFF]">
          AUTHORISING OFFICER
        </span>
      );
    }
    if (normalized.includes("COMPLIANCE")) {
      return (
        <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-[11px] font-semibold uppercase tracking-wide bg-[#EBF1FF] text-[#335CFF]">
          COMPLIANCE OFFICER
        </span>
      );
    }
    if (normalized.includes("KEY CONTACT")) {
      return (
        <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-[11px] font-semibold uppercase tracking-wide bg-[#EBF1FF] text-[#335CFF]">
          KEY CONTACT
        </span>
      );
    }
    if (normalized.includes("INVITED")) {
      return (
        <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-[11px] font-semibold uppercase tracking-wide bg-[#FFF3EB] text-[#F6B51E]">
          INVITED
        </span>
      );
    }
    return (
      <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-[11px] font-semibold uppercase tracking-wide bg-[#F5F5F5] text-[#737373]">
        {role}
      </span>
    );
  };

  // Filtered activity log
  const filteredActivity = activityLog.filter((item) => {
    const matchesSearch =
      item.action.toLowerCase().includes(activitySearch.toLowerCase()) ||
      item.refCode.toLowerCase().includes(activitySearch.toLowerCase()) ||
      item.author.toLowerCase().includes(activitySearch.toLowerCase());

    const matchesAuthor = selectedAuthor === "Everyone" || item.author === selectedAuthor;

    return matchesSearch && matchesAuthor;
  });

  const activityDates = React.useMemo(() => {
    return Array.from(new Set(filteredActivity.map((a) => a.date)));
  }, [filteredActivity]);

  const subNavItems: { id: TeamSubTab; label: string }[] = [
    { id: "members", label: "Members" },
    { id: "ukvi-roles", label: "UKVI Roles" },
    { id: "activity-log", label: "Activity log" },
  ];

  return (
    <div className="grid grid-cols-1 md:grid-cols-[220px_1fr] gap-[40px] items-start w-full">
      {/* Left Sub-Menu Column */}
      <nav
        className="sticky top-[152px] self-start flex flex-col gap-3 pt-1 shrink-0 w-full"
        aria-label="Team navigation"
      >
        <span className="text-[12px] font-semibold uppercase tracking-wider text-[#171717] px-0 mb-1">
          TEAM
        </span>

        <div role="tablist" aria-label="Team sub-navigation" className="flex flex-col gap-[14px]">
          {subNavItems.map((item) => {
            const isActive = activeSubTab === item.id;
            return (
              <button
                key={item.id}
                role="tab"
                id={`team-subtab-${item.id}`}
                aria-selected={isActive}
                aria-controls={`team-subtabpanel-${item.id}`}
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
        id={`team-subtabpanel-${activeSubTab}`}
        aria-labelledby={`team-subtab-${activeSubTab}`}
        className="flex-1 min-w-0 flex flex-col gap-4"
      >
        {/* Top 3 Stat Cards in Right Column (Only for Members & UKVI Roles matching Figma) */}
        {activeSubTab !== "activity-log" && (
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mb-3">
            <div className="bg-white rounded-[16px] p-6 shadow-x-small border border-[#EBEBEB] flex flex-col justify-between h-[104px]">
              <span className="text-[11px] font-medium uppercase tracking-wider text-[#737373]">
                ACTIVE MEMBERS
              </span>
              <p className="font-aeonik-medium text-[32px] leading-[40px] font-medium text-[#171717]">
                {activeCount}
              </p>
            </div>

            <div className="bg-white rounded-[16px] p-6 shadow-x-small border border-[#EBEBEB] flex flex-col justify-between h-[104px]">
              <span className="text-[11px] font-medium uppercase tracking-wider text-[#737373]">
                PENDING INVITES
              </span>
              <p className="font-aeonik-medium text-[32px] leading-[40px] font-medium text-[#171717]">
                {pendingCount}
              </p>
            </div>

            <div className="bg-white rounded-[16px] p-6 shadow-x-small border border-[#EBEBEB] flex flex-col justify-between h-[104px]">
              <span className="text-[11px] font-medium uppercase tracking-wider text-[#737373]">
                SMS ROLES ASSIGNED
              </span>
              <p className="font-aeonik-medium text-[32px] leading-[40px] font-medium text-[#171717]">
                {smsCount}
              </p>
            </div>
          </div>
        )}

        {/* 1. MEMBERS SUB-TAB */}
        {activeSubTab === "members" && (
          <div className="flex flex-col gap-4">
            {/* Title and Invite Button Row */}
            <div className="flex items-center justify-between">
              <h2 className="font-aeonik-medium text-[20px] leading-[28px] font-medium text-[#171717]">
                Team members
              </h2>

              <button
                type="button"
                onClick={() => setIsInviteOpen(true)}
                className="h-10 px-5 bg-[#171717] hover:bg-[#262626] text-white text-[13px] font-medium rounded-[10px] shadow-x-small transition-all cursor-pointer border-0"
              >
                Invite member
              </button>
            </div>

            {/* Search Input Bar */}
            <div className="relative max-w-[280px]">
              <RiSearchLine className="size-4 absolute left-3 top-3 text-[#8C8C8C] pointer-events-none" />
              <Input
                value={memberSearch}
                onChange={(e) => setMemberSearch(e.target.value)}
                placeholder="Search..."
                className="rounded-[10px] h-10 pl-9 pr-3 shadow-x-small bg-white border-[#EBEBEB] text-[13px]"
              />
            </div>

            {/* Column Header Row */}
            <div className="grid grid-cols-12 gap-4 px-4 py-2 text-[#8C8C8C] text-[11px] font-medium uppercase tracking-wider select-none">
              <button
                type="button"
                className="col-span-12 sm:col-span-6 flex items-center gap-1 cursor-pointer hover:text-[#171717] transition-colors border-0 bg-transparent p-0 text-left text-[#8C8C8C] text-[11px] font-medium uppercase tracking-wider outline-none"
                onClick={() => handleSort("name")}
                aria-sort={sortField === "name" ? (sortDirection === "asc" ? "ascending" : "descending") : "none"}
              >
                <span>MEMBER</span>
                <RiArrowUpDownLine className="size-3.5 text-[#8C8C8C]" />
              </button>
              <button
                type="button"
                className="hidden sm:flex sm:col-span-3 items-center gap-1 cursor-pointer hover:text-[#171717] transition-colors border-0 bg-transparent p-0 text-left text-[#8C8C8C] text-[11px] font-medium uppercase tracking-wider outline-none"
                onClick={() => handleSort("role")}
                aria-sort={sortField === "role" ? (sortDirection === "asc" ? "ascending" : "descending") : "none"}
              >
                <span>ROLE</span>
                <RiArrowUpDownLine className="size-3.5 text-[#8C8C8C]" />
              </button>
              <button
                type="button"
                className="hidden sm:flex sm:col-span-3 items-center justify-between cursor-pointer hover:text-[#171717] transition-colors border-0 bg-transparent p-0 text-left text-[#8C8C8C] text-[11px] font-medium uppercase tracking-wider outline-none"
                onClick={() => handleSort("smsRole")}
                aria-sort={sortField === "smsRole" ? (sortDirection === "asc" ? "ascending" : "descending") : "none"}
              >
                <div className="flex items-center gap-1">
                  <span>SMS ROLE</span>
                  <RiArrowUpDownLine className="size-3.5 text-[#8C8C8C]" />
                </div>
              </button>
            </div>

            {/* Members Cards List matching Figma EXACTLY */}
            <div className="flex flex-col gap-2.5">
              {sortedMembers.map((m) => (
                <div
                  key={m.id}
                  className="bg-white rounded-[16px] border border-[#EBEBEB] p-4 shadow-x-small hover:border-[#D4D4D4] transition-all grid grid-cols-12 gap-4 items-center"
                >
                  {/* Member Info */}
                  <div className="col-span-12 sm:col-span-6 flex items-center gap-3.5 min-w-0">
                    <Avatar className="size-10 rounded-full bg-[#EFEBFF] text-[#7D52F4] flex items-center justify-center text-[13px] font-medium">
                      {m.avatarImage && <AvatarImage src={m.avatarImage} alt={m.name} />}
                      <AvatarFallback className="bg-[#EFEBFF] text-[#7D52F4] font-medium">
                        {m.avatarText || "TM"}
                      </AvatarFallback>
                    </Avatar>
                    <div className="min-w-0">
                      <p className="text-[14px] font-medium text-[#171717] truncate">
                        {m.name}
                      </p>
                      <p className="text-[12px] text-[#737373] truncate mt-0.5">
                        {m.email}
                      </p>
                    </div>
                  </div>

                  {/* Role Badge */}
                  <div className="hidden sm:block sm:col-span-3">
                    {getRoleBadge(m.role)}
                  </div>

                  {/* SMS Role & Actions */}
                  <div className="col-span-12 sm:col-span-3 flex items-center justify-between">
                    <span className="text-[14px] text-[#171717]">
                      {m.smsRole}
                    </span>

                    <DropdownMenu>
                      <DropdownMenuTrigger className="size-8 rounded-[8px] hover:bg-neutral-200/50 flex items-center justify-center text-[#737373] transition-colors border-0 bg-transparent cursor-pointer">
                        <RiMore2Line className="size-4.5" />
                      </DropdownMenuTrigger>
                      <DropdownMenuContent align="end" className="w-44 rounded-card">
                        <DropdownMenuItem
                          onClick={() => setEditingMember(m)}
                          className="cursor-pointer gap-2 text-label-sm"
                        >
                          <RiEditLine className="size-4 text-muted-foreground" />
                          Edit details
                        </DropdownMenuItem>
                        {m.status === "invited" && (
                          <DropdownMenuItem
                            onClick={() => handleResendInvite(m)}
                            className="cursor-pointer gap-2 text-label-sm"
                          >
                            <RiMailSendLine className="size-4 text-muted-foreground" />
                            Resend invite
                          </DropdownMenuItem>
                        )}
                        <DropdownMenuSeparator />
                        <DropdownMenuItem
                          onClick={() => handleMemberDelete(m.id)}
                          className="cursor-pointer gap-2 text-label-sm text-destructive focus:text-destructive"
                        >
                          <RiDeleteBinLine className="size-4" />
                          Remove
                        </DropdownMenuItem>
                      </DropdownMenuContent>
                    </DropdownMenu>
                  </div>
                </div>
              ))}
            </div>

            {/* Footer Buttons */}
            <div className="flex items-center justify-end gap-3 pt-3">
              <button
                type="button"
                onClick={() => toast.info("Team members list refreshed")}
                className="h-10 px-5 text-[14px] font-medium text-[#5C5C5C] hover:text-[#171717] hover:bg-neutral-200/50 rounded-[10px] transition-colors border-0 bg-transparent cursor-pointer"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={() => toast.success("Team changes saved successfully")}
                className="h-10 px-5 bg-[#171717] hover:bg-[#262626] text-white text-[13px] font-medium rounded-[10px] shadow-x-small transition-all cursor-pointer border-0"
              >
                Save changes
              </button>
            </div>
          </div>
        )}

        {/* 2. UKVI ROLES SUB-TAB */}
        {activeSubTab === "ukvi-roles" && (
          <div className="flex flex-col gap-4">
            <h2 className="font-aeonik-medium text-[20px] leading-[28px] font-medium text-[#171717]">
              Key personnel
            </h2>

            {/* Blue Info Notice Card matching Figma */}
            <div className="bg-[#F5F8FF] border border-[#DCE7FF] rounded-[16px] p-5 flex items-start gap-3.5">
              <RiInformationFill className="size-5 text-[#335CFF] shrink-0 mt-0.5" />
              <p className="text-[13px] leading-[20px] text-[#335CFF]">
                UKVI requires sponsor licence holders to maintain appointed key personnel at all times. Any changes must be reported via SMS within 20 working days.
              </p>
            </div>

            {/* 4 UKVI Role Cards matching Figma EXACTLY */}
            <div className="space-y-3">
              {ukviRoles.map((role) => (
                <div
                  key={role.roleCode}
                  className="bg-white rounded-[16px] border border-[#EBEBEB] p-6 shadow-x-small flex flex-col sm:flex-row sm:items-center justify-between gap-4"
                >
                  <div className="space-y-1">
                    <span className="inline-flex items-center px-2 py-0.5 rounded-full text-[10px] font-semibold uppercase tracking-wide bg-[#EBF1FF] text-[#335CFF]">
                      {role.roleCode}
                    </span>
                    <h3 className="text-[15px] font-medium text-[#171717]">
                      {role.roleTitle}
                    </h3>
                    <p className="text-[13px] text-[#737373]">
                      Assigned to: {role.assignedMembers.join(", ") || "Unassigned"}
                    </p>
                  </div>

                  <button
                    type="button"
                    onClick={() => setActiveRoleModal(role)}
                    className="h-9 px-4 rounded-[10px] bg-[#F5F5F5] hover:bg-[#EBEBEB] text-[#171717] text-[13px] font-medium border border-[#EBEBEB] shadow-x-small transition-all cursor-pointer self-start sm:self-auto shrink-0"
                  >
                    Change
                  </button>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* 3. ACTIVITY LOG SUB-TAB */}
        {activeSubTab === "activity-log" && (
          <div className="flex flex-col gap-4">
            <h2 className="font-aeonik-medium text-[20px] leading-[28px] font-medium text-[#171717]">
              Activity log
            </h2>

            {/* Search & Filter Bar */}
            <div className="flex items-center gap-3">
              <div className="relative flex-1 max-w-[280px]">
                <RiSearchLine className="size-4 absolute left-3 top-3 text-[#8C8C8C] pointer-events-none" />
                <Input
                  value={activitySearch}
                  onChange={(e) => setActivitySearch(e.target.value)}
                  placeholder="Search..."
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

              <Select value={selectedAuthor} onValueChange={(val) => setSelectedAuthor(val || "Everyone")}>
                <SelectTrigger className="rounded-[10px] h-10 w-36 shadow-x-small bg-white border-[#EBEBEB] text-[13px] shrink-0">
                  <SelectValue placeholder="Everyone" />
                </SelectTrigger>
                <SelectContent className="rounded-[12px]">
                  <SelectItem value="Everyone">Everyone</SelectItem>
                  <SelectItem value="Sarah Kim">Sarah Kim</SelectItem>
                  <SelectItem value="Elena Petrova">Elena Petrova</SelectItem>
                  <SelectItem value="Priya Nair">Priya Nair</SelectItem>
                </SelectContent>
              </Select>
            </div>

            {/* Activity Timeline with Dynamic Date Grouping */}
            <div className="space-y-6 pt-2">
              {activityDates.length === 0 ? (
                <div className="py-12 text-center text-[14px] text-[#737373] bg-white rounded-[16px] border border-[#EBEBEB]">
                  No activity logs match your filter.
                </div>
              ) : (
                activityDates.map((dateStr) => {
                  const itemsOnDate = filteredActivity.filter((a) => a.date === dateStr);
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
                              item.type === "cos" ? (
                                <RiFileTextLine className="size-4" />
                              ) : item.type === "rtw" ? (
                                <RiCheckboxCircleLine className="size-4" />
                              ) : (
                                <RiTimeLine className="size-4" />
                              )
                            }
                            badgeLabel="ACTIVITY"
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
          </div>
        )}
      </div>

      {/* Invite Member Modal */}
      <InviteMemberModal
        isOpen={isInviteOpen}
        onClose={() => setIsInviteOpen(false)}
        onSendInvite={(memberData: TeamMember) => {
          saveMembersList([...members, memberData]);
        }}
      />

      {/* Edit Member Modal */}
      {editingMember && (
        <EditMemberModal
          isOpen={!!editingMember}
          member={editingMember}
          onClose={() => setEditingMember(null)}
          onUpdateMember={handleMemberSave}
        />
      )}

      {/* Change UKVI Role Modal */}
      <ChangeUkviRoleModal
        open={!!activeRoleModal}
        onOpenChange={(open) => !open && setActiveRoleModal(null)}
        roleData={activeRoleModal}
        onSave={handleRoleSave}
        availableMembers={members.map((m) => ({ name: m.name, email: m.email }))}
      />
    </div>
  );
}
