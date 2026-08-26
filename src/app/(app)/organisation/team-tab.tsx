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
];

export function TeamTab({ activeSubTab, onSubTabChange }: TeamTabProps) {
  const [members, setMembers] = React.useState<TeamMember[]>(INITIAL_MEMBERS);
  const [ukviRoles, setUkviRoles] = React.useState<UkviRoleAssignment[]>(INITIAL_UKVI_ROLES);
  const [activityLog] = React.useState<ActivityLogItem[]>(INITIAL_ACTIVITY_LOG);

  // Filter & Search states
  const [activitySearch, setActivitySearch] = React.useState("");
  const [selectedAuthor, setSelectedAuthor] = React.useState("Everyone");
  const [sortField, setSortField] = React.useState<"name" | "role" | "smsRole" | null>(null);
  const [sortDirection, setSortDirection] = React.useState<"asc" | "desc">("asc");

  // Modals state
  const [isInviteOpen, setIsInviteOpen] = React.useState(false);
  const [editingMember, setEditingMember] = React.useState<TeamMember | null>(null);
  const [editingUkviRole, setEditingUkviRole] = React.useState<UkviRoleAssignment | null>(null);

  // Load persistence
  React.useEffect(() => {
    try {
      const savedMembers = localStorage.getItem("viems_org_team_members");
      if (savedMembers) setMembers(JSON.parse(savedMembers));

      const savedUkvi = localStorage.getItem("viems_org_ukvi_roles");
      if (savedUkvi) setUkviRoles(JSON.parse(savedUkvi));
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

  const handleSort = (field: "name" | "role" | "smsRole") => {
    if (sortField === field) {
      setSortDirection(sortDirection === "asc" ? "desc" : "asc");
    } else {
      setSortField(field);
      setSortDirection("asc");
    }
  };

  const sortedMembers = React.useMemo(() => {
    if (!sortField) return members;
    return [...members].sort((a, b) => {
      const valA = String(a[sortField] || "").toLowerCase();
      const valB = String(b[sortField] || "").toLowerCase();
      if (valA < valB) return sortDirection === "asc" ? -1 : 1;
      if (valA > valB) return sortDirection === "asc" ? 1 : -1;
      return 0;
    });
  }, [members, sortField, sortDirection]);

  // Derived metrics
  const activeCount = members.filter((m) => m.status === "active").length;
  const pendingCount = members.filter((m) => m.status === "invited").length;
  const smsCount = members.filter((m) => m.smsRole && m.smsRole !== "—").length;

  const handleRoleSave = (roleCode: "AO" | "KC" | "L1" | "L2", updatedMembers: string[]) => {
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

  const subNavItems: { id: TeamSubTab; label: string }[] = [
    { id: "members", label: "Members" },
    { id: "ukvi-roles", label: "UKVI Roles" },
    { id: "activity-log", label: "Activity log" },
  ];

  return (
    <div className="grid grid-cols-1 md:grid-cols-[220px_1fr] gap-[40px] items-start w-full">
      {/* Left Sub-Menu Column (Sticky & styled matching Figma plain text navigation) */}
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
                SMS USERS
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
            <div className="flex items-center justify-between">
              <h2 className="font-aeonik-medium text-[20px] leading-[28px] font-medium text-[#171717]">
                Members
              </h2>

              <button
                type="button"
                onClick={() => setIsInviteOpen(true)}
                className="h-10 px-5 bg-[#171717] hover:bg-[#262626] text-white text-[13px] font-medium rounded-[10px] shadow-x-small transition-all cursor-pointer border-0"
              >
                Invite member
              </button>
            </div>

            {/* Column Header Row */}
            <div className="grid grid-cols-12 gap-4 px-4 py-2 text-[#8C8C8C] text-[11px] font-medium uppercase tracking-wider select-none">
              <div
                className="col-span-12 sm:col-span-6 flex items-center gap-1 cursor-pointer hover:text-[#171717] transition-colors"
                onClick={() => handleSort("name")}
              >
                <span>MEMBER</span>
              </div>
              <div
                className="hidden sm:flex sm:col-span-3 items-center gap-1 cursor-pointer hover:text-[#171717] transition-colors"
                onClick={() => handleSort("role")}
              >
                <span>ROLE</span>
                <RiArrowUpDownLine className="size-3.5 text-[#8C8C8C]" />
              </div>
              <div
                className="hidden sm:flex sm:col-span-3 items-center justify-between cursor-pointer hover:text-[#171717] transition-colors"
                onClick={() => handleSort("smsRole")}
              >
                <div className="flex items-center gap-1">
                  <span>SMS ROLE</span>
                  <RiArrowUpDownLine className="size-3.5 text-[#8C8C8C]" />
                </div>
              </div>
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
                  <div className="col-span-6 sm:col-span-3">
                    {getRoleBadge(m.role)}
                  </div>

                  {/* SMS Role & Menu */}
                  <div className="col-span-6 sm:col-span-3 flex items-center justify-between">
                    <span className="text-[13px] text-[#5C5C5C]">
                      {m.smsRole || "—"}
                    </span>

                    <DropdownMenu>
                      <DropdownMenuTrigger className="size-8 rounded-[8px] text-[#8C8C8C] hover:text-[#171717] hover:bg-neutral-100 flex items-center justify-center cursor-pointer border-0 bg-transparent transition-colors outline-none">
                        <RiMore2Line className="size-4.5" />
                      </DropdownMenuTrigger>
                      <DropdownMenuContent align="end" className="w-44 rounded-[12px] bg-white border border-[#EBEBEB] shadow-card-large p-1">
                        <DropdownMenuItem
                          onClick={() => setEditingMember(m)}
                          className="gap-2 cursor-pointer text-[13px] px-3 py-2 text-[#171717] hover:bg-neutral-50 rounded-[6px]"
                        >
                          <RiEditLine className="size-4 text-[#737373]" />
                          Edit details
                        </DropdownMenuItem>
                        {m.status === "invited" && (
                          <DropdownMenuItem
                            onClick={() => handleResendInvite(m)}
                            className="gap-2 cursor-pointer text-[13px] px-3 py-2 text-[#171717] hover:bg-neutral-50 rounded-[6px]"
                          >
                            <RiMailSendLine className="size-4 text-[#737373]" />
                            Resend invitation
                          </DropdownMenuItem>
                        )}
                        <DropdownMenuSeparator className="my-1 border-t border-[#EBEBEB]" />
                        <DropdownMenuItem
                          onClick={() => handleMemberDelete(m.id)}
                          className="gap-2 cursor-pointer text-[#FB3748] hover:bg-red-50 text-[13px] px-3 py-2 rounded-[6px]"
                        >
                          <RiDeleteBinLine className="size-4" />
                          Remove member
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
                onClick={() => toast.info("No unsaved changes")}
                className="h-10 px-5 text-[14px] font-medium text-[#5C5C5C] hover:text-[#171717] hover:bg-neutral-200/50 rounded-[10px] transition-colors border-0 bg-transparent cursor-pointer"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={() => {
                  saveMembersList(members);
                  toast.success("Team settings saved successfully");
                }}
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
            <div className="flex items-center justify-between">
              <h2 className="font-aeonik-medium text-[20px] leading-[28px] font-medium text-[#171717]">
                UKVI roles
              </h2>

              <button
                type="button"
                onClick={() => setIsInviteOpen(true)}
                className="h-10 px-5 bg-[#171717] hover:bg-[#262626] text-white text-[13px] font-medium rounded-[10px] shadow-x-small transition-all cursor-pointer border-0"
              >
                Invite member
              </button>
            </div>

            {/* Column Header Row */}
            <div className="grid grid-cols-12 gap-4 px-4 py-2 text-[#8C8C8C] text-[11px] font-medium uppercase tracking-wider select-none">
              <div className="col-span-6 sm:col-span-8 flex items-center gap-1">
                <span>MEMBER</span>
              </div>
              <div className="col-span-6 sm:col-span-4 flex items-center justify-end gap-1">
                <span>COUNT</span>
                <RiArrowUpDownLine className="size-3.5 text-[#8C8C8C]" />
              </div>
            </div>

            {/* Roles List Cards matching Figma EXACTLY */}
            <div className="flex flex-col gap-2.5">
              {ukviRoles.map((role) => (
                <div
                  key={role.roleCode}
                  className="bg-white rounded-[16px] border border-[#EBEBEB] p-4 shadow-x-small flex items-center justify-between hover:border-[#D4D4D4] transition-all"
                >
                  <div className="flex items-center gap-3.5 min-w-0">
                    <div className="size-10 rounded-[10px] bg-[#E8F8F0] text-[#12B76A] flex items-center justify-center font-semibold text-[13px] shrink-0">
                      {role.roleCode}
                    </div>
                    <div className="min-w-0">
                      <p className="text-[14px] font-medium text-[#171717]">
                        {role.roleTitle}
                      </p>
                      <p className="text-[12px] text-[#737373] mt-0.5">
                        {role.assignedMembers.join(", ") || "Unassigned"}
                      </p>
                    </div>
                  </div>

                  <button
                    type="button"
                    onClick={() => setEditingUkviRole(role)}
                    className="h-9 px-4 rounded-[10px] bg-[#F5F5F5] hover:bg-[#EBEBEB] text-[#171717] text-[13px] font-medium transition-colors border-0 cursor-pointer"
                  >
                    Change
                  </button>
                </div>
              ))}
            </div>

            {/* Info Notice Banner matching Figma EXACTLY (Purple background) */}
            <div className="p-4 rounded-[16px] bg-[#EFEBFF] flex items-start gap-3 mt-4 border-0">
              <RiInformationFill className="size-5 shrink-0 mt-0.5 text-[#7D52F4]" />
              <p className="text-[13px] leading-[20px] text-[#171717]">
                Every sponsor must maintain an Authorising Officer, Key Contact, and at least one
                Level 1 User. Changes must be reported via SMS within 20 working days.
              </p>
            </div>

            {/* Footer Buttons */}
            <div className="flex items-center justify-end gap-3 pt-3">
              <button
                type="button"
                onClick={() => toast.info("No unsaved changes")}
                className="h-10 px-5 text-[14px] font-medium text-[#5C5C5C] hover:text-[#171717] hover:bg-neutral-200/50 rounded-[10px] transition-colors border-0 bg-transparent cursor-pointer"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={() => {
                  try {
                    localStorage.setItem("viems_org_ukvi_roles", JSON.stringify(ukviRoles));
                    toast.success("UKVI roles saved successfully");
                  } catch {
                    // ignore
                  }
                }}
                className="h-10 px-5 bg-[#171717] hover:bg-[#262626] text-white text-[13px] font-medium rounded-[10px] shadow-x-small transition-all cursor-pointer border-0"
              >
                Save changes
              </button>
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

            {/* Activity Timeline matching Figma EXACTLY */}
            <div className="space-y-6 pt-2">
              {filteredActivity.length === 0 ? (
                <div className="py-12 text-center text-[14px] text-[#737373] bg-white rounded-[16px] border border-[#EBEBEB]">
                  No activity logs match your filter.
                </div>
              ) : (
                <div className="space-y-6">
                  {/* 26 MAR 2026 */}
                  <div className="space-y-3">
                    <div className="flex items-center gap-3">
                      <span className="size-2 rounded-full bg-[#D4D4D4]" />
                      <span className="text-[11px] font-semibold uppercase tracking-wider text-[#737373]">
                        26 MAR 2026
                      </span>
                    </div>

                    <div className="space-y-3 relative pl-6 border-l border-[#EBEBEB] ml-1">
                      {filteredActivity
                        .filter((a) => a.date === "26 MAR 2026")
                        .map((item) => (
                          <div key={item.id} className="relative flex items-center gap-3">
                            <div className="size-8 rounded-[8px] bg-white border border-[#EBEBEB] shadow-x-small flex items-center justify-center text-[#737373] shrink-0 -ml-[33px]">
                              {item.type === "cos" ? (
                                <RiFileTextLine className="size-4" />
                              ) : (
                                <RiCheckboxCircleLine className="size-4" />
                              )}
                            </div>

                            <div className="bg-white rounded-[16px] border border-[#EBEBEB] p-4 flex-1 shadow-x-small flex flex-col sm:flex-row sm:items-center justify-between gap-3 hover:border-[#D4D4D4] transition-all">
                              <div>
                                <span className="inline-flex items-center px-2 py-0.5 rounded-full text-[10px] font-semibold uppercase tracking-wide bg-[#EFEBFF] text-[#7D52F4]">
                                  ACTIVITY
                                </span>
                                <p className="text-[14px] font-medium text-[#171717] mt-1">
                                  {item.action}
                                </p>
                                <p className="text-[12px] text-[#737373] mt-0.5">
                                  {item.refCode}
                                </p>
                              </div>

                              <div className="flex items-center gap-4 self-end sm:self-center">
                                <span className="text-[12px] text-[#737373]">
                                  {item.time}
                                </span>
                                <div className="flex items-center gap-1.5">
                                  <span className="size-6 rounded-full bg-[#EFEBFF] text-[#7D52F4] flex items-center justify-center text-[10px] font-medium">
                                    {item.authorInitials}
                                  </span>
                                  <span className="text-[13px] font-medium text-[#171717]">
                                    {item.author}
                                  </span>
                                </div>
                              </div>
                            </div>
                          </div>
                        ))}
                    </div>
                  </div>

                  {/* 24 MAR 2026 */}
                  <div className="space-y-3">
                    <div className="flex items-center gap-3">
                      <span className="size-2 rounded-full bg-[#D4D4D4]" />
                      <span className="text-[11px] font-semibold uppercase tracking-wider text-[#737373]">
                        24 MAR 2026
                      </span>
                    </div>

                    <div className="space-y-3 relative pl-6 border-l border-[#EBEBEB] ml-1">
                      {filteredActivity
                        .filter((a) => a.date === "24 MAR 2026")
                        .map((item) => (
                          <div key={item.id} className="relative flex items-center gap-3">
                            <div className="size-8 rounded-[8px] bg-white border border-[#EBEBEB] shadow-x-small flex items-center justify-center text-[#737373] shrink-0 -ml-[33px]">
                              <RiTimeLine className="size-4" />
                            </div>

                            <div className="bg-white rounded-[16px] border border-[#EBEBEB] p-4 flex-1 shadow-x-small flex flex-col sm:flex-row sm:items-center justify-between gap-3 hover:border-[#D4D4D4] transition-all">
                              <div>
                                <span className="inline-flex items-center px-2 py-0.5 rounded-full text-[10px] font-semibold uppercase tracking-wide bg-[#EFEBFF] text-[#7D52F4]">
                                  ACTIVITY
                                </span>
                                <p className="text-[14px] font-medium text-[#171717] mt-1">
                                  {item.action}
                                </p>
                                <p className="text-[12px] text-[#737373] mt-0.5">
                                  {item.refCode}
                                </p>
                              </div>

                              <div className="flex items-center gap-4 self-end sm:self-center">
                                <span className="text-[12px] text-[#737373]">
                                  {item.time}
                                </span>
                                <div className="flex items-center gap-1.5">
                                  <span className="size-6 rounded-full bg-[#EFEBFF] text-[#7D52F4] flex items-center justify-center text-[10px] font-medium">
                                    {item.authorInitials}
                                  </span>
                                  <span className="text-[13px] font-medium text-[#171717]">
                                    {item.author}
                                  </span>
                                </div>
                              </div>
                            </div>
                          </div>
                        ))}
                    </div>
                  </div>
                </div>
              )}
            </div>

            {/* Footer Buttons */}
            <div className="flex items-center justify-end gap-3 pt-3">
              <button
                type="button"
                onClick={() => toast.info("Activity log refreshed")}
                className="h-10 px-5 text-[14px] font-medium text-[#5C5C5C] hover:text-[#171717] hover:bg-neutral-200/50 rounded-[10px] transition-colors border-0 bg-transparent cursor-pointer"
              >
                Refresh
              </button>
              <button
                type="button"
                onClick={() => toast.success("Activity log exported")}
                className="h-10 px-5 bg-[#171717] hover:bg-[#262626] text-white text-[13px] font-medium rounded-[10px] shadow-x-small transition-all cursor-pointer border-0"
              >
                Export log
              </button>
            </div>
          </div>
        )}
      </div>

      {/* Invite Member Modal */}
      <InviteMemberModal
        isOpen={isInviteOpen}
        onClose={() => setIsInviteOpen(false)}
        onSendInvite={(newMember) => {
          saveMembersList([...members, newMember]);
          setIsInviteOpen(false);
          toast.success(`Invitation sent to ${newMember.email}`);
        }}
      />

      {/* Edit Member Modal */}
      {editingMember && (
        <EditMemberModal
          isOpen={Boolean(editingMember)}
          onClose={() => setEditingMember(null)}
          member={editingMember}
          onUpdateMember={handleMemberSave}
        />
      )}

      {/* Change UKVI Role Modal */}
      <ChangeUkviRoleModal
        open={Boolean(editingUkviRole)}
        onOpenChange={(open) => !open && setEditingUkviRole(null)}
        roleData={editingUkviRole}
        onSave={handleRoleSave}
        availableMembers={members.map((m) => ({ name: m.name, email: m.email }))}
      />
    </div>
  );
}
