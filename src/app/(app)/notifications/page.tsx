"use client";

import * as React from "react";
import { useRouter } from "next/navigation";
import {
  RiSearch2Line,
  RiArrowDownSLine,
  RiArrowLeftSLine,
  RiArrowRightSLine,
  RiArrowLeftDoubleLine,
  RiArrowRightDoubleLine,
  RiCloseLine,
  RiCheckLine,
  RiExternalLinkLine,
  RiMoreFill,
  RiAlertLine,
  RiCalendarLine,
  RiTimer2Line,
  RiArrowRightLine,
  RiShieldCheckLine,
} from "@remixicon/react";
import {
  DropdownMenu,
  DropdownMenuTrigger,
  DropdownMenuContent,
  DropdownMenuItem,
} from "@/components/ui/dropdown-menu";
import { apiClient } from "@/lib/api-client";
import { ENDPOINTS } from "@/lib/api-endpoints";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { UpdateStartDateModal } from "../cases/components/UpdateStartDateModal";
import {
  getReadIds,
  persistReadId,
  persistAllRead,
  removeReadId,
  formatTimeAgo,
  getGroupLabel,
  getIconForEntity,
  getCategoryForLog,
  getTargetUrl,
  type LogEntry,
  type LogsResponse,
} from "@/lib/notifications";

interface PageNotificationItem {
  id: string;
  icon: React.ComponentType<{ className?: string }>;
  title: string;
  description: string;
  time: string;
  caseRef: string;
  group: string;
  targetUrl: string;
  isUnread?: boolean;
  category: "mentions" | "tasks" | "cases" | "messages" | "documents";
}

export default function NotificationsPage() {
  const router = useRouter();
  const [items, setItems] = React.useState<PageNotificationItem[]>([]);
  const [searchQuery, setSearchQuery] = React.useState("");
  const [filterCategory, setFilterCategory] = React.useState<string>("all");
  const [unreadOnly, setUnreadOnly] = React.useState(false);
  const [currentPage, setCurrentPage] = React.useState(1);
  const [itemsPerPage, setItemsPerPage] = React.useState(10);
  const [loading, setLoading] = React.useState(true);

  // Work Start Date Delay states
  const [delayedData, setDelayedData] = React.useState<{
    totalDelayed: number;
    smsThresholdExceededCount: number;
    cases: any[];
  }>({ totalDelayed: 0, smsThresholdExceededCount: 0, cases: [] });
  const [selectedDelayCase, setSelectedDelayCase] = React.useState<any>(null);
  const [isDelayModalOpen, setIsDelayModalOpen] = React.useState(false);
  const [delayBannerDismissed, setDelayBannerDismissed] = React.useState(false);
  const [isDelaysExpanded, setIsDelaysExpanded] = React.useState(true);

  const fetchWorkStartDelays = React.useCallback(async () => {
    try {
      const res = await apiClient.get<any>(ENDPOINTS.notifications.workStartDelays);
      if (res && Array.isArray(res.cases)) {
        setDelayedData({
          totalDelayed: typeof res.totalDelayed === "number" ? res.totalDelayed : res.cases.length,
          smsThresholdExceededCount: typeof res.smsThresholdExceededCount === "number" ? res.smsThresholdExceededCount : 0,
          cases: res.cases,
        });
      }
    } catch (err) {
      console.error("Failed to fetch work start delays:", err);
    }
  }, []);

  const fetchPageNotifications = React.useCallback(async () => {
    try {
      setLoading(true);
      const res = await apiClient.get<LogsResponse>(ENDPOINTS.logs.base, {
        params: { take: "100", sort_by: "date.desc" },
      });
      const rawLogs: LogEntry[] = Array.isArray(res) ? res : res?.logs ?? res?.data ?? [];
      const readIds = getReadIds();

      if (rawLogs.length > 0) {
        const mapped: PageNotificationItem[] = rawLogs.map((log, i) => {
          const userName = log.userName ?? "System";
          const entityName = log.entityName ?? "Case";
          const idStr = log.entityIdentifier ? `#${log.entityIdentifier}` : "";
          const actionText = log.action ? log.action.charAt(0).toUpperCase() + log.action.slice(1) : "Updated";
          const title = `${userName} ${log.action ?? "updated"} ${entityName} ${idStr}`.trim();
          const description = log.newValue
            ? `Updated value to: ${log.newValue}`
            : `${actionText} ${entityName} in system.`;
          const timeAgo = formatTimeAgo(log.creationDate);
          const group = getGroupLabel(log.creationDate);
          const icon = getIconForEntity(entityName, log.action);
          const category = getCategoryForLog(entityName, log.action);
          const logId = String(log.id ?? `log-${i}`);
          const isReadInStorage = readIds.includes(logId);
          const targetUrl = getTargetUrl(entityName, log.entityIdentifier, log.action);

          return {
            id: logId,
            group,
            icon,
            title,
            description,
            time: timeAgo,
            caseRef: idStr || `#${log.id ?? "430/2026"}`,
            targetUrl,
            isUnread: !isReadInStorage,
            category,
          };
        });
        setItems(mapped);
      } else {
        setItems([]);
      }
    } catch (err) {
      console.error("Failed to fetch page notification logs:", err);
      setItems([]);
    } finally {
      setLoading(false);
    }
  }, []);

  React.useEffect(() => {
    fetchPageNotifications();
    fetchWorkStartDelays();

    const handleUpdate = () => {
      const readIds = getReadIds();
      setItems((prev) =>
        prev.map((item) => ({
          ...item,
          isUnread: !readIds.includes(item.id),
        }))
      );
      fetchWorkStartDelays();
    };

    window.addEventListener("viems_notifications_updated", handleUpdate);
    return () => {
      window.removeEventListener("viems_notifications_updated", handleUpdate);
    };
  }, [fetchPageNotifications, fetchWorkStartDelays]);

  const handleMarkAllRead = () => {
    const allIds = items.map((i) => i.id);
    persistAllRead(allIds);
    setItems((prev) => prev.map((item) => ({ ...item, isUnread: false })));
  };

  const handleItemClick = (item: PageNotificationItem) => {
    persistReadId(item.id);
    setItems((prev) =>
      prev.map((i) => (i.id === item.id ? { ...i, isUnread: false } : i))
    );
    router.push(item.targetUrl);
  };

  const handleToggleItemRead = (item: PageNotificationItem, e: React.MouseEvent) => {
    e.stopPropagation();
    if (item.isUnread) {
      persistReadId(item.id);
    } else {
      removeReadId(item.id);
    }
    setItems((prev) =>
      prev.map((i) => (i.id === item.id ? { ...i, isUnread: !i.isUnread } : i))
    );
  };

  const filteredItems = React.useMemo(() => {
    return items.filter((item) => {
      if (unreadOnly && !item.isUnread) return false;
      if (filterCategory !== "all" && item.category !== filterCategory) return false;
      if (searchQuery.trim()) {
        const q = searchQuery.toLowerCase();
        return (
          item.title.toLowerCase().includes(q) ||
          item.description.toLowerCase().includes(q) ||
          item.caseRef.toLowerCase().includes(q)
        );
      }
      return true;
    });
  }, [items, unreadOnly, filterCategory, searchQuery]);

  const totalPages = Math.max(1, Math.ceil(filteredItems.length / itemsPerPage));
  const safeCurrentPage = Math.min(currentPage, totalPages);

  const groups = React.useMemo(() => {
    const startIndex = (safeCurrentPage - 1) * itemsPerPage;
    const paginatedItems = filteredItems.slice(startIndex, startIndex + itemsPerPage);
    
    if (unreadOnly) {
      return [["UNREAD ONLY", paginatedItems] as [string, PageNotificationItem[]]];
    }

    const map = new Map<string, PageNotificationItem[]>();
    paginatedItems.forEach((item) => {
      const existing = map.get(item.group) || [];
      existing.push(item);
      map.set(item.group, existing);
    });
    return Array.from(map.entries());
  }, [filteredItems, safeCurrentPage, itemsPerPage, unreadOnly]);

  const filterCategoryLabels: Record<string, string> = {
    all: "All notifications",
    mentions: "Mentions",
    tasks: "Task updates",
    cases: "Case updates",
    messages: "Messages",
    documents: "Documents",
  };

  const hasUnread = items.some((i) => i.isUnread);

  return (
    <div className="px-[40px] py-[32px] pb-[80px] flex flex-col gap-xl font-sans bg-[#F5F5F5] min-h-screen">
      {/* Top Header */}
      <div className="flex items-center justify-between border-b border-[#EBEBEB] pb-xl shrink-0">
        <div>
          <h1 className="text-[24px] text-[#171717] tracking-[-0.01em] leading-[32px] font-aeonik-medium">
            Notifications
          </h1>
          <p className="text-[14px] text-[#5C5C5C] tracking-[-0.006em] mt-1 leading-[20px] font-sans">
            Track and manage activity across your cases, migrants, documents, and tasks.
          </p>
        </div>
        {items.length > 0 && hasUnread && (
          <Button
            type="button"
            variant="secondary"
            onClick={handleMarkAllRead}
            className="h-10 px-4 text-paragraph-sm font-medium rounded-button"
          >
            Mark all as read
          </Button>
        )}
      </div>

      {/* Work Start Date Delay Compliance Alert Banner */}
      {delayedData.totalDelayed > 0 && !delayBannerDismissed && (
        <div
          className={`p-xl rounded-card border shadow-x-small transition-all flex flex-col gap-md ${
            delayedData.smsThresholdExceededCount > 0
              ? "bg-red-50/70 border-red-200/90 text-neutral-900"
              : "bg-amber-50/70 border-amber-200/90 text-neutral-900"
          }`}
        >
          {/* Banner Header Row */}
          <div className="flex items-start justify-between gap-md">
            <div className="flex items-start gap-md min-w-0 flex-1">
              <div
                className={`size-9 rounded-full flex items-center justify-center shrink-0 border ${
                  delayedData.smsThresholdExceededCount > 0
                    ? "bg-red-100 text-red-700 border-red-200/70"
                    : "bg-amber-100 text-amber-700 border-amber-200/70"
                }`}
              >
                {delayedData.smsThresholdExceededCount > 0 ? (
                  <RiAlertLine className="size-5" />
                ) : (
                  <RiTimer2Line className="size-5" />
                )}
              </div>
              <div className="flex flex-col min-w-0">
                <div className="flex items-center gap-2 flex-wrap">
                  <h3 className="text-[15px] font-semibold font-aeonik-medium text-neutral-900">
                    Work Start Date Delay Alerts
                  </h3>
                  <Badge
                    variant="outline"
                    className="text-label-compact font-medium bg-white/90 border-neutral-300 text-neutral-700 shadow-2xs"
                  >
                    {delayedData.totalDelayed} Case{delayedData.totalDelayed > 1 ? "s" : ""} Overdue
                  </Badge>
                  {delayedData.smsThresholdExceededCount > 0 && (
                    <Badge variant="destructive" withDot className="text-label-compact font-semibold shadow-2xs">
                      {delayedData.smsThresholdExceededCount} Exceeding 28d Statutory SMS Limit
                    </Badge>
                  )}
                </div>
                <p className="text-paragraph-xs text-neutral-600 mt-1 leading-relaxed">
                  Under UKVI Appendix D sponsor duties, when a sponsored worker's start date has passed without recorded arrival, dates must be updated or reported to SMS within 10 working days if delayed by &gt;28 days.
                </p>
              </div>
            </div>

            <div className="flex items-center gap-1.5 shrink-0 mt-0.5">
              <Button
                variant="outline"
                size="xs"
                onClick={() => setIsDelaysExpanded((v) => !v)}
                className="text-label-xs font-medium bg-white/90 border-neutral-200 text-neutral-700 hover:bg-white shadow-2xs cursor-pointer"
              >
                {isDelaysExpanded ? "Collapse" : "Expand cases"}
              </Button>
              <Button
                variant="ghost"
                size="icon-xs"
                onClick={() => setDelayBannerDismissed(true)}
                title="Dismiss banner"
                className="text-neutral-500 hover:text-neutral-900 hover:bg-black/5 cursor-pointer"
              >
                <RiCloseLine className="size-4" />
              </Button>
            </div>
          </div>

          {/* Collapsible List of Delayed Cases */}
          {isDelaysExpanded && (
            <div
              className={`flex flex-col gap-sm pt-xs border-t ${
                delayedData.smsThresholdExceededCount > 0
                  ? "border-red-200/80"
                  : "border-amber-200/80"
              }`}
            >
              {delayedData.cases.map((delayedCase) => {
                const isCritical = delayedCase.isSmsThresholdExceeded;
                return (
                  <div
                    key={delayedCase.caseId}
                    className="p-3.5 rounded-input bg-white border border-neutral-200 hover:border-neutral-300 transition-all flex items-center justify-between gap-md flex-wrap text-card-foreground shadow-2xs"
                  >
                    <div className="flex items-center gap-md min-w-0">
                      <div
                        className={`size-8 rounded-full flex items-center justify-center shrink-0 border ${
                          isCritical
                            ? "bg-red-100/70 text-red-600 border-red-200/50"
                            : "bg-amber-100/70 text-amber-600 border-amber-200/50"
                        }`}
                      >
                        <RiCalendarLine className="size-4" />
                      </div>
                      <div className="flex flex-col min-w-0">
                        <div className="flex items-center gap-sm flex-wrap">
                          <span className="text-label-sm font-semibold text-neutral-900">
                            {delayedCase.migrantName}
                          </span>
                          <span className="text-paragraph-xs font-mono text-neutral-500">
                            {delayedCase.caseNumber}
                          </span>
                          <Badge
                            variant={isCritical ? "destructive" : "warning"}
                            withDot
                            className="text-label-compact font-medium"
                          >
                            {isCritical
                              ? `${delayedCase.delayDays}d overdue (SMS Required)`
                              : `${delayedCase.delayDays}d delayed`}
                          </Badge>
                        </div>
                        <div className="flex items-center gap-xs text-paragraph-xs text-neutral-500">
                          <span>{delayedCase.jobTitle}</span>
                          <span>•</span>
                          <span>
                            Original Start:{" "}
                            <strong className="text-neutral-800 font-medium">
                              {delayedCase.originalStartDate}
                            </strong>
                          </span>
                          {isCritical && (
                            <>
                              <span>•</span>
                              <span className="text-red-600 font-semibold">
                                SMS Deadline: {delayedCase.smsDeadlineDate}
                              </span>
                            </>
                          )}
                        </div>
                      </div>
                    </div>

                    <div className="flex items-center gap-sm shrink-0">
                      <Button
                        type="button"
                        variant={isCritical ? "destructive" : "default"}
                        size="sm"
                        onClick={() => {
                          setSelectedDelayCase(delayedCase);
                          setIsDelayModalOpen(true);
                        }}
                        className={`h-8 text-[12px] font-medium flex items-center gap-1.5 shadow-2xs cursor-pointer ${
                          !isCritical ? "bg-brand-medium text-white hover:bg-brand-dark" : ""
                        }`}
                      >
                        <RiCalendarLine className="size-3.5" />
                        <span>{isCritical ? "Report SMS & Update" : "Update Start Date"}</span>
                      </Button>
                      <Button
                        type="button"
                        variant="outline"
                        size="sm"
                        onClick={() => router.push(`/cases/${delayedCase.caseId}`)}
                        className="h-8 text-[12px] font-medium flex items-center gap-1 border-neutral-200 bg-white hover:bg-neutral-50 text-neutral-700 shadow-2xs cursor-pointer"
                      >
                        <span>View Case</span>
                        <RiArrowRightLine className="size-3.5 text-neutral-400" />
                      </Button>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      )}

      {/* Toolbar / Filters Row */}
      <div className="flex items-center gap-[12px] w-full">
        {/* Search Bar */}
        <div className="w-[348px] h-[32px] bg-white border border-[#EBEBEB] rounded-[8px] px-[8px] py-[6px] flex items-center gap-[6px] shadow-[0px_1px_2px_rgba(10,13,20,0.03)]">
          <RiSearch2Line className="size-5 text-[#A4A4A4] shrink-0" />
          <Input
            variant="unstyled"
            size="none"
            type="text"
            aria-label="Search notifications"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Search..."
            className="w-full bg-transparent text-[14px] font-normal text-[#171717] placeholder:text-[#A4A4A4] border-0 outline-none leading-[20px] tracking-[-0.006em]"
          />
        </div>

        {/* Filter Dropdown */}
        <DropdownMenu>
          <DropdownMenuTrigger
            className="h-[32px] px-[12px] bg-white border border-[#EBEBEB] rounded-[8px] flex items-center gap-[6px] text-[14px] font-medium text-[#5C5C5C] hover:text-[#171717] hover:bg-[#FAFAFA] cursor-pointer shadow-[0px_1px_2px_rgba(10,13,20,0.03)] outline-none transition-colors"
          >
            <span>{filterCategoryLabels[filterCategory] ?? "All notifications"}</span>
            <RiArrowDownSLine className="size-5 text-[#5C5C5C]" />
          </DropdownMenuTrigger>
          <DropdownMenuContent align="start" className="w-[180px] bg-white border border-[#EBEBEB] rounded-[12px] shadow-card-large p-1">
            {[
              { id: "all", label: "All notifications" },
              { id: "mentions", label: "Mentions" },
              { id: "tasks", label: "Task updates" },
              { id: "cases", label: "Case updates" },
              { id: "messages", label: "Messages" },
              { id: "documents", label: "Documents" },
            ].map((cat) => (
              <DropdownMenuItem
                key={cat.id}
                onClick={() => setFilterCategory(cat.id)}
                onSelect={() => setFilterCategory(cat.id)}
                className={`text-[14px] cursor-pointer rounded-[6px] px-3 py-2 transition-colors ${
                  filterCategory === cat.id
                    ? "bg-[#F5F5F5] font-semibold text-[#171717]"
                    : "text-[#5C5C5C] hover:bg-[#F5F5F5] hover:text-[#171717]"
                }`}
              >
                {cat.label}
              </DropdownMenuItem>
            ))}
          </DropdownMenuContent>
        </DropdownMenu>

        {/* Unread Only Toggle Badge */}
        {unreadOnly ? (
          <button
            type="button"
            onClick={() => setUnreadOnly(false)}
            className="h-[32px] px-[12px] bg-[#171717] hover:bg-[#262626] active:bg-[#0A0A0A] text-white rounded-[8px] text-[14px] font-medium transition-all cursor-pointer border border-[#171717] flex items-center gap-[6px] shadow-[0px_1px_2px_rgba(10,13,20,0.03)]"
          >
            <span>Unread only</span>
            <RiCloseLine className="size-4 text-white" />
          </button>
        ) : (
          <button
            type="button"
            onClick={() => setUnreadOnly(true)}
            className="h-[32px] px-[12px] bg-white hover:bg-neutral-50 active:bg-neutral-100 text-[#5C5C5C] hover:text-[#171717] rounded-[8px] text-[14px] font-medium transition-all cursor-pointer border border-[#EBEBEB] flex items-center gap-[6px] shadow-[0px_1px_2px_rgba(10,13,20,0.03)]"
          >
            <span>Unread only</span>
          </button>
        )}
      </div>

      {/* Grouped Notifications List */}
      <div className="flex flex-col gap-[32px] w-full">
        {loading ? (
          <div className="py-[80px] flex flex-col items-center justify-center gap-3 bg-white border border-[#EBEBEB] rounded-[16px] text-neutral-500">
            <div className="size-6 border-2 border-[#7D52F4] border-t-transparent rounded-full animate-spin" />
            <span className="text-[14px]">Loading notifications from system...</span>
          </div>
        ) : groups.length === 0 || (groups.length === 1 && groups[0][1].length === 0) ? (
          <div className="py-[60px] text-center bg-white border border-[#EBEBEB] rounded-[16px] text-neutral-400 text-[14px]">
            {searchQuery || filterCategory !== "all" || unreadOnly
              ? "No notifications match your current filters."
              : "No notifications found."}
          </div>
        ) : (
          groups.map(([groupTitle, groupItems]) => (
            <div key={groupTitle} className="flex flex-col gap-[8px] w-full">
              {/* Group Section Header */}
              <div className="flex items-center gap-[8px] h-[16px]">
                <span className="text-[12px] font-medium text-[#171717] tracking-[0.04em] uppercase leading-[16px]">
                  {groupTitle}
                </span>
              </div>

              {/* Items Card List */}
              <div className="flex flex-col gap-[8px] w-full">
                {groupItems.map((item) => {
                  const IconComp = item.icon;
                  const isStatusChange = item.title.toLowerCase().includes("status");
                  return (
                    <div
                      key={item.id}
                      role="button"
                      tabIndex={0}
                      onClick={() => handleItemClick(item)}
                      onKeyDown={(e) => {
                        if (e.key === "Enter" || e.key === " ") {
                          e.preventDefault();
                          handleItemClick(item);
                        }
                      }}
                      className="w-full text-left h-auto min-h-[104px] bg-white border border-[#EBEBEB] hover:border-neutral-300 rounded-[12px] p-[16px] flex items-start gap-[16px] transition-all cursor-pointer shadow-[0px_1px_2px_rgba(10,13,20,0.03)] relative group focus:outline-none focus:ring-1 focus:ring-[#7D52F4]/30"
                    >
                      {/* Left Icon */}
                      <div className="size-[36px] rounded-full bg-white border border-[#EBEBEB] shadow-[0px_1px_2px_rgba(10,13,20,0.03)] flex items-center justify-center shrink-0">
                        {isStatusChange ? (
                          <div className="size-[10px] rounded-full bg-[#FB3748] border-2 border-white shadow-[0px_2px_4px_rgba(27,28,29,0.04)]" />
                        ) : (
                          <IconComp className="size-5 text-[#7D52F4]" />
                        )}
                      </div>

                      {/* Text Content */}
                      <div className="flex-1 flex flex-col gap-[8px] min-w-0 pr-8">
                        <div className="flex flex-col gap-[4px]">
                          <div className="flex items-center gap-[8px]">
                            <span className="text-[14px] font-medium text-[#171717] leading-[20px] tracking-[-0.006em]">
                              {item.title}
                            </span>
                            {item.isUnread && (
                              <div className="size-[6px] rounded-full bg-[#FB3748] shrink-0" />
                            )}
                          </div>
                          <p className="text-[13px] font-normal text-[#5C5C5C] leading-[20px] tracking-[-0.006em]">
                            {item.description}
                          </p>
                        </div>

                        {/* Metadata Footer */}
                        <div className="flex items-center gap-[8px]">
                          <span className="text-[12px] font-medium text-[#A4A4A4] leading-[16px]">
                            {item.time}
                          </span>
                          <span className="text-[12px] text-[#D1D1D1]">•</span>
                          <span className="text-[12px] font-mono text-[#5C5C5C] leading-[20px]">
                            {item.caseRef}
                          </span>
                        </div>
                      </div>

                      {/* Action dropdown button */}
                      <div className="absolute right-3 top-3" onClick={(e) => e.stopPropagation()}>
                        <DropdownMenu>
                          <DropdownMenuTrigger
                            aria-label="Notification actions"
                            className="size-7 rounded-[6px] hover:bg-neutral-100 flex items-center justify-center text-neutral-400 hover:text-neutral-800 transition-colors border-0 bg-transparent outline-none cursor-pointer"
                          >
                            <RiMoreFill className="size-4" />
                          </DropdownMenuTrigger>
                          <DropdownMenuContent align="end" className="w-[150px] bg-white border border-[#EBEBEB] rounded-[10px] p-1 shadow-card-large">
                            <DropdownMenuItem
                              onClick={(e) => handleToggleItemRead(item, e)}
                              className="text-[13px] text-[#171717] flex items-center gap-2 cursor-pointer py-1.5"
                            >
                              <RiCheckLine className="size-4 text-[#5C5C5C]" />
                              <span>{item.isUnread ? "Mark as read" : "Mark as unread"}</span>
                            </DropdownMenuItem>
                            <DropdownMenuItem
                              onClick={() => handleItemClick(item)}
                              className="text-[13px] text-[#171717] flex items-center gap-2 cursor-pointer py-1.5"
                            >
                              <RiExternalLinkLine className="size-4 text-[#5C5C5C]" />
                              <span>View details</span>
                            </DropdownMenuItem>
                          </DropdownMenuContent>
                        </DropdownMenu>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          ))
        )}
      </div>

      {/* Pagination Footer Group */}
      <div className="flex items-center justify-between w-full h-[32px] mt-2 border-t border-[#EBEBEB] pt-[24px]">
        {/* Left: Page summary */}
        <span className="text-[14px] font-normal text-[#5C5C5C] leading-[20px] tracking-[-0.006em]">
          Page {safeCurrentPage} of {totalPages}
        </span>

        {/* Center: Page Controls */}
        <div className="flex items-center gap-[8px]">
          {/* First page */}
          <button
            type="button"
            onClick={() => setCurrentPage(1)}
            disabled={safeCurrentPage === 1}
            className="size-8 rounded-[8px] flex items-center justify-center text-[#5C5C5C] hover:bg-neutral-200 disabled:opacity-40 transition-colors border-0 cursor-pointer"
            title="First page"
          >
            <RiArrowLeftDoubleLine className="size-5 text-[#5C5C5C]" />
          </button>

          {/* Prev page */}
          <button
            type="button"
            onClick={() => setCurrentPage((p) => Math.max(1, safeCurrentPage - 1))}
            disabled={safeCurrentPage === 1}
            className="size-8 rounded-[8px] flex items-center justify-center text-[#5C5C5C] hover:bg-neutral-200 disabled:opacity-40 transition-colors border-0 cursor-pointer"
            title="Previous page"
          >
            <RiArrowLeftSLine className="size-5 text-[#5C5C5C]" />
          </button>

          {/* Page numbers */}
          {Array.from({ length: totalPages }).slice(0, 5).map((_, i) => {
            const pageNum = i + 1;
            const isActive = safeCurrentPage === pageNum;
            const isSecond = pageNum === 2 && !isActive;
            return (
              <button
                key={pageNum}
                type="button"
                onClick={() => setCurrentPage(pageNum)}
                className={`size-8 rounded-[8px] flex items-center justify-center text-[14px] font-medium transition-colors border-0 cursor-pointer ${
                  isActive
                    ? "bg-[#171717] text-white"
                    : isSecond
                    ? "bg-white border border-[#EBEBEB] text-[#171717] hover:bg-neutral-50"
                    : "bg-white text-[#5C5C5C] hover:bg-neutral-50"
                }`}
              >
                {pageNum}
              </button>
            );
          })}

          {totalPages > 5 && <span className="text-[14px] text-[#A4A4A4] px-1">...</span>}

          {totalPages > 5 && (
            <button
              type="button"
              onClick={() => setCurrentPage(totalPages)}
              className={`size-8 rounded-[8px] flex items-center justify-center text-[14px] font-medium transition-colors border-0 cursor-pointer ${
                safeCurrentPage === totalPages
                  ? "bg-[#171717] text-white"
                  : "bg-white text-[#5C5C5C] hover:bg-neutral-50"
              }`}
            >
              {totalPages}
            </button>
          )}

          {/* Next page */}
          <button
            type="button"
            onClick={() => setCurrentPage((p) => Math.min(totalPages, safeCurrentPage + 1))}
            disabled={safeCurrentPage === totalPages}
            className="size-8 rounded-[8px] flex items-center justify-center text-[#5C5C5C] hover:bg-neutral-200 disabled:opacity-40 transition-colors border-0 cursor-pointer"
            title="Next page"
          >
            <RiArrowRightSLine className="size-5 text-[#5C5C5C]" />
          </button>

          {/* Last page */}
          <button
            type="button"
            onClick={() => setCurrentPage(totalPages)}
            disabled={safeCurrentPage === totalPages}
            className="size-8 rounded-[8px] flex items-center justify-center text-[#5C5C5C] hover:bg-neutral-200 disabled:opacity-40 transition-colors border-0 cursor-pointer"
            title="Last page"
          >
            <RiArrowRightDoubleLine className="size-5 text-[#5C5C5C]" />
          </button>
        </div>

        {/* Right: Items per page selector */}
        <DropdownMenu>
          <DropdownMenuTrigger
            className="min-w-[100px] h-[32px] px-[10px] py-[6px] bg-white border border-[#EBEBEB] rounded-[8px] flex items-center justify-between gap-[6px] text-[14px] font-normal text-[#5C5C5C] hover:text-[#171717] shadow-[0px_1px_2px_rgba(10,13,20,0.03)] cursor-pointer outline-none shrink-0 transition-colors whitespace-nowrap"
          >
            <span className="whitespace-nowrap">{itemsPerPage} / page</span>
            <RiArrowDownSLine className="size-4 text-[#A4A4A4] shrink-0" />
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end" className="w-[110px] bg-white border border-[#EBEBEB] rounded-[12px] shadow-card-large p-1">
            {[10, 20, 50, 100].map((num) => (
              <DropdownMenuItem
                key={num}
                onClick={() => {
                  setItemsPerPage(num);
                  setCurrentPage(1);
                }}
                className="text-[14px] text-[#171717] cursor-pointer rounded-[6px] px-3 py-1.5 hover:bg-[#F5F5F5]"
              >
                {num} / page
              </DropdownMenuItem>
            ))}
          </DropdownMenuContent>
        </DropdownMenu>
      </div>

      {/* 1-Click Update Start Date Modal */}
      {selectedDelayCase && (
        <UpdateStartDateModal
          open={isDelayModalOpen}
          onOpenChange={setIsDelayModalOpen}
          caseData={selectedDelayCase}
          initialStartDate={selectedDelayCase?.originalStartDate}
          initialDelayDays={selectedDelayCase?.delayDays}
          onSuccess={() => {
            fetchWorkStartDelays();
            fetchPageNotifications();
          }}
        />
      )}
    </div>
  );
}
