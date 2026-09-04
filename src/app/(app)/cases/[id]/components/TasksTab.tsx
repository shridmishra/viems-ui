"use client";

import * as React from "react";
import {
  RiFileTextLine,
  RiCheckboxCircleLine,
  RiAlertLine,
  RiTimer2Line,
  RiInformationLine,
  RiMore2Line,
  RiUpload2Line,
  RiArrowUpDownLine,
  RiFilter3Line,
  RiFocus2Line,
  RiShieldCheckLine,
  RiCalendarEventLine,
  RiRefreshLine,
} from "@remixicon/react";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { toast } from "sonner";
import { apiClient } from "@/lib/api-client";
import { ENDPOINTS } from "@/lib/api-endpoints";
import { CaseActionModal, CaseActionRow } from "../../components/CaseActionModal";
import { TourGapScheduleModal } from "../../components/TourGapScheduleModal";
import {
  TaskAssignee,
  getDefaultAssigneeForTask,
  getDefaultDueDateForTask,
  getStoredTaskAssignment,
  saveStoredTaskAssignment,
  syncTaskAssignmentToBackend,
} from "@/lib/task-assignment-storage";
import { TaskAssigneeSelector } from "@/components/tasks/TaskAssigneeSelector";
import { TaskDueDatePicker } from "@/components/tasks/TaskDueDatePicker";

export interface TaskItem {
  id: string;
  hasBackendId?: boolean;
  category: "General" | "Compliance" | "Reporting" | "Documents" | "Visa & Immigration";
  title: string;
  description: string;
  status: "crucial" | "completed" | "under_review" | "general";
  isCompleted: boolean;
  assignee?: TaskAssignee | null;
  dueDate?: string;
}

interface RawTaskPayload {
  id?: string | number;
  title?: string;
  name?: string;
  description?: string;
  category?: string;
  status?: string;
  isCompleted?: boolean;
  completed?: boolean;
  employee?: TaskAssignee | null;
  assignee?: TaskAssignee | null;
  dueDate?: string;
}

type TasksApiResponse =
  | RawTaskPayload[]
  | { data?: RawTaskPayload[]; tasks?: RawTaskPayload[]; count?: number };

const VALID_CATEGORIES: readonly TaskItem["category"][] = [
  "General",
  "Compliance",
  "Reporting",
  "Documents",
  "Visa & Immigration",
];

const VALID_STATUSES: readonly TaskItem["status"][] = [
  "crucial",
  "completed",
  "under_review",
  "general",
];

function isTaskCategory(cat: string): cat is TaskItem["category"] {
  return (VALID_CATEGORIES as readonly string[]).includes(cat);
}

function isTaskStatus(st: string): st is TaskItem["status"] {
  return (VALID_STATUSES as readonly string[]).includes(st);
}

export function getSafeString(val: unknown, fallback = ""): string {
  if (val === null || val === undefined) return fallback;
  if (typeof val === "string") return val;
  if (typeof val === "number") return String(val);
  if (Array.isArray(val)) {
    const validItems = val.map((v) => getSafeString(v)).filter(Boolean);
    return validItems.length > 0 ? validItems.join(", ") : fallback;
  }
  if (typeof val === "object") {
    const obj = val as Record<string, unknown>;
    const candidate = obj.name ?? obj.title ?? obj.value ?? obj.label;
    if (candidate !== undefined && candidate !== null) {
      const res = getSafeString(candidate, "");
      if (res) return res;
    }
    return fallback;
  }
  return fallback;
}

const DEFAULT_CASE_TASKS: Omit<TaskItem, "id" | "isCompleted">[] = [
  {
    category: "Compliance",
    title: "14-Day Tour Gap Schedule Validation",
    description: "Verify flight itinerary gaps and cross-border event dates do not exceed the 14-day concession rule.",
    status: "crucial",
  },
  {
    category: "Visa & Immigration",
    title: "SMS CoS Assignment & Pre-Submission Review",
    description: "Review Home Office sponsor management system reference and confirm salary threshold compliance.",
    status: "crucial",
  },
  {
    category: "Compliance",
    title: "Complete Right to Work (RTW) Online Verification",
    description: "Execute Home Office share code check and record statutory excuse audit evidence.",
    status: "crucial",
  },
  {
    category: "Documents",
    title: "Passport Biometrics & Entry Stamp Verification",
    description: "Inspect passport photo page validity and ensure UK entry arrival stamp is filed in case dossier.",
    status: "under_review",
  },
  {
    category: "General",
    title: "Union Minimum Rate & Salary Clearance Check",
    description: "Cross-reference agreed weekly performer fee against Equity / PACT / BECTU agreed minimum wage standards.",
    status: "under_review",
  },
  {
    category: "Reporting",
    title: "Home Office 10-Day Event Reporting Log",
    description: "Log start date confirmation and notify SMS within statutory 10 working days.",
    status: "general",
  },
];

interface TasksTabProps {
  caseId?: string;
  migrantName?: string;
  migrant?: Record<string, unknown> | null;
}

export function TasksTab({ caseId, migrantName, migrant }: TasksTabProps) {
  const [tasks, setTasks] = React.useState<TaskItem[]>([]);
  const [error, setError] = React.useState<string | null>(null);
  const [assigneeFilter, setAssigneeFilter] = React.useState<string>("ALL");
  const [sortByDueDate, setSortByDueDate] = React.useState<"asc" | "desc" | null>(null);

  // Modal states
  const [actionModalOpen, setActionModalOpen] = React.useState(false);
  const [actionModalRow, setActionModalRow] = React.useState<CaseActionRow | null>(null);
  const [activeTaskIdForModal, setActiveTaskIdForModal] = React.useState<string | null>(null);
  const [tourGapModalOpen, setTourGapModalOpen] = React.useState(false);
  const [tourGapTaskId, setTourGapTaskId] = React.useState<string | null>(null);

  const mapRawTask = React.useCallback((t: RawTaskPayload, i: number): TaskItem => {
    const rawCat = getSafeString(t.category, "General");
    const cat: TaskItem["category"] = isTaskCategory(rawCat) ? rawCat : "General";
    const rawStatus = getSafeString(t.status) || (t.isCompleted || t.completed ? "completed" : "general");
    const st: TaskItem["status"] = isTaskStatus(rawStatus) ? rawStatus : (t.isCompleted || t.completed ? "completed" : "general");
    const hasBackendId = t.id !== undefined && t.id !== null;
    const safeTitle = getSafeString(t.title) || getSafeString(t.name) || "Task";
    const safeDesc = getSafeString(t.description, "");
    const taskId = String(t.id ?? `task-${caseId || "0"}-${i}`);

    // Check local storage for persistent assignee & due date
    const stored = getStoredTaskAssignment(taskId);

    let assignee: TaskAssignee | null = stored?.assignee ?? null;
    if (!assignee && t.assignee) {
      assignee = t.assignee;
    }
    if (!assignee) {
      assignee = getDefaultAssigneeForTask(safeTitle, cat);
    }

    const dueDate = stored?.dueDate || t.dueDate || getDefaultDueDateForTask(st);

    return {
      id: taskId,
      hasBackendId,
      category: cat,
      title: safeTitle,
      description: safeDesc,
      status: st,
      isCompleted: Boolean(t.isCompleted || t.completed || st === "completed"),
      assignee,
      dueDate,
    };
  }, [caseId]);

  React.useEffect(() => {
    let isCancelled = false;

    async function fetchTasks() {
      if (!caseId) {
        if (!isCancelled) {
          setTasks([]);
          setError(null);
        }
        return;
      }
      try {
        setError(null);
        const res = await apiClient.get<TasksApiResponse>(`${ENDPOINTS.tasks.base}?caseId=${caseId}`);
        let rawTasks: RawTaskPayload[] = [];
        if (Array.isArray(res)) {
          rawTasks = res;
        } else if (res && typeof res === "object") {
          if (Array.isArray(res.data)) rawTasks = res.data;
          else if (Array.isArray(res.tasks)) rawTasks = res.tasks;
        }

        if (!isCancelled) {
          if (rawTasks.length > 0) {
            const mapped: TaskItem[] = rawTasks.map(mapRawTask);
            setTasks(mapped);
          } else {
            // Load standard case tasks with intelligent accountability
            const defaults: TaskItem[] = DEFAULT_CASE_TASKS.map((dt, idx) =>
              mapRawTask(
                {
                  id: `case-${caseId}-dt-${idx}`,
                  title: dt.title,
                  description: dt.description,
                  category: dt.category,
                  status: dt.status,
                  isCompleted: false,
                },
                idx
              )
            );
            setTasks(defaults);
          }
        }
      } catch {
        if (!isCancelled) {
          // Fallback to standard tasks to ensure UI remains functional
          const defaults: TaskItem[] = DEFAULT_CASE_TASKS.map((dt, idx) =>
            mapRawTask(
              {
                id: `case-${caseId}-dt-${idx}`,
                title: dt.title,
                description: dt.description,
                category: dt.category,
                status: dt.status,
                isCompleted: false,
              },
              idx
            )
          );
          setTasks(defaults);
        }
      }
    }

    fetchTasks();
    return () => {
      isCancelled = true;
    };
  }, [caseId, mapRawTask]);

  // Sync listener across windows / components
  React.useEffect(() => {
    const handleUpdate = (e: Event) => {
      const customEvt = e as CustomEvent;
      if (customEvt.detail?.taskId) {
        setTasks((prev) =>
          prev.map((t) => {
            if (t.id === customEvt.detail.taskId) {
              return {
                ...t,
                ...(customEvt.detail.assignee !== undefined
                  ? { assignee: customEvt.detail.assignee }
                  : {}),
                ...(customEvt.detail.dueDate !== undefined
                  ? { dueDate: customEvt.detail.dueDate }
                  : {}),
              };
            }
            return t;
          })
        );
      }
    };

    window.addEventListener("viems-task-assignment-updated", handleUpdate);
    return () => {
      window.removeEventListener("viems-task-assignment-updated", handleUpdate);
    };
  }, []);

  const stats = React.useMemo(() => {
    const total = tasks.length;
    const completed = tasks.filter((t) => t.isCompleted).length;
    const crucial = tasks.filter((t) => t.status === "crucial" && !t.isCompleted).length;
    const underReview = tasks.filter((t) => t.status === "under_review" && !t.isCompleted).length;
    return { total, completed, crucial, underReview };
  }, [tasks]);

  const categories: readonly TaskItem["category"][] = VALID_CATEGORIES;

  const handleToggleComplete = async (taskId: string) => {
    const targetTask = tasks.find((t) => t.id === taskId);
    if (!targetTask) return;
    const prevTask = { ...targetTask };
    const nextState = !targetTask.isCompleted;

    setTasks((prev) =>
      prev.map((t) =>
        t.id === taskId
          ? { ...t, isCompleted: nextState, status: nextState ? "completed" : "general" }
          : t
      )
    );

    if (targetTask.hasBackendId) {
      try {
        const formData = new FormData();
        formData.append("completed", String(nextState));
        formData.append("status", nextState ? "completed" : "pending");
        await apiClient.patch(`${ENDPOINTS.tasks.base}/${taskId}`, { body: formData });
        if (nextState) {
          toast.success(`"${targetTask.title}" marked as complete`);
        } else {
          toast.warning(`"${targetTask.title}" marked as unresolved`);
        }
      } catch (err) {
        console.warn("Failed to update task on backend:", err);
        setTasks((prev) =>
          prev.map((t) => (t.id === taskId ? prevTask : t))
        );
        toast.error(`Failed to update task "${targetTask.title}". Please try again.`);
      }
    } else {
      if (nextState) {
        toast.success(`"${targetTask.title}" marked as complete`);
      } else {
        toast.warning(`"${targetTask.title}" marked as unresolved`);
      }
    }
  };

  const handleAssigneeChange = async (taskId: string, newAssignee: TaskAssignee | null) => {
    setTasks((prev) =>
      prev.map((t) => (t.id === taskId ? { ...t, assignee: newAssignee } : t))
    );
    saveStoredTaskAssignment(taskId, { assignee: newAssignee });

    const target = tasks.find((t) => t.id === taskId);
    if (target?.hasBackendId) {
      const empId = newAssignee
        ? parseInt(newAssignee.id.replace("staff-", ""), 10) || null
        : null;
      await syncTaskAssignmentToBackend(taskId, { employeeId: empId });
    }
  };

  const handleDueDateChange = async (taskId: string, newDueDate: string | null) => {
    setTasks((prev) =>
      prev.map((t) => (t.id === taskId ? { ...t, dueDate: newDueDate || undefined } : t))
    );
    saveStoredTaskAssignment(taskId, { dueDate: newDueDate || undefined });

    const target = tasks.find((t) => t.id === taskId);
    if (target?.hasBackendId) {
      await syncTaskAssignmentToBackend(taskId, { dueDate: newDueDate || "" });
    }
  };

  const handleOpenTaskActionModal = (task: TaskItem, customAction?: string) => {
    const isTourGap =
      task.title.toLowerCase().includes("tour gap") ||
      task.title.toLowerCase().includes("schedule validation");

    if (isTourGap && (!customAction || customAction === "Resolve")) {
      setTourGapTaskId(task.id);
      setTourGapModalOpen(true);
      return;
    }

    const isRtw =
      (customAction || task.title).toLowerCase().includes("rtw") ||
      (customAction || task.title).toLowerCase().includes("right to work");

    const resolvedMigrantName: string =
      migrantName ||
      (typeof migrant?.name === "string" ? migrant.name : "") ||
      "Migrant Dossier";
    const resolvedCaseId = caseId || "001";

    let action = customAction;
    if (!action) {
      if (isRtw) action = "Complete RTW check";
      else action = "Upload documents";
    }

    const avatarText =
      (typeof migrant?.avatarText === "string" ? migrant.avatarText : "") ||
      (resolvedMigrantName
        ? resolvedMigrantName
            .split(" ")
            .filter(Boolean)
            .map((w: string) => w[0]?.toUpperCase() || "")
            .slice(0, 2)
            .join("")
        : "MD");

    const avatarUrl =
      typeof migrant?.avatarUrl === "string" ? migrant.avatarUrl : undefined;

    setActionModalRow({
      id: caseId,
      caseId: resolvedCaseId,
      name: resolvedMigrantName,
      avatarText,
      avatarUrl,
      action: action,
      actionColor: "blue",
    });
    setActiveTaskIdForModal(task.id);
    setActionModalOpen(true);
  };

  const handleResolveButtonClick = (task: TaskItem) => {
    const isTourGap =
      task.title.toLowerCase().includes("tour gap") ||
      task.title.toLowerCase().includes("schedule validation");

    if (isTourGap) {
      handleOpenTaskActionModal(task, "Resolve");
    } else {
      handleToggleComplete(task.id);
    }
  };

  // Filter and sort tasks
  const displayedTasks = React.useMemo(() => {
    let result = [...tasks];

    if (assigneeFilter !== "ALL") {
      if (assigneeFilter === "UNASSIGNED") {
        result = result.filter((t) => !t.assignee);
      } else {
        result = result.filter((t) => t.assignee?.id === assigneeFilter);
      }
    }

    if (sortByDueDate) {
      result.sort((a, b) => {
        const timeA = a.dueDate ? new Date(a.dueDate).getTime() : 0;
        const timeB = b.dueDate ? new Date(b.dueDate).getTime() : 0;
        return sortByDueDate === "asc" ? timeA - timeB : timeB - timeA;
      });
    }

    return result;
  }, [tasks, assigneeFilter, sortByDueDate]);

  return (
    <div className="w-full flex flex-col gap-6 font-sans animate-fade-in text-left">
      {error && (
        <div className="bg-[#FFEBEC] border border-[#FECDCA] rounded-button p-4 text-[14px] text-[#FB3748] flex items-center justify-between">
          <span>{error}</span>
        </div>
      )}

      {/* ─── Top 4 Stat Summary Cards (Exact Figma Spec Frame 107) ─────────── */}
      <div className="flex items-center gap-2 w-full">
        {/* Total tasks */}
        <div className="bg-[#EFEBFF] rounded-card p-lg flex justify-between items-start h-[70px] flex-1 relative">
          <div className="flex flex-col gap-xxs">
            <span className="text-label-xs font-medium text-foreground leading-none">
              Total tasks
            </span>
            <span className="font-aeonik-medium text-h5-title text-[#351A75]">
              {stats.total}
            </span>
          </div>
          <RiFileTextLine className="size-5 text-[#5C5C5C] shrink-0 absolute top-2 right-4" />
        </div>

        {/* Completed tasks */}
        <div className="bg-[#E3F7EC] rounded-card p-lg flex justify-between items-start h-[70px] flex-1 relative">
          <div className="flex flex-col gap-xxs">
            <span className="text-label-xs font-medium text-foreground leading-none">
              Completed tasks
            </span>
            <span className="font-aeonik-medium text-h5-title text-[#0B4627]">
              {stats.completed}
            </span>
          </div>
          <RiCheckboxCircleLine className="size-5 text-[#5C5C5C] shrink-0 absolute top-2 right-4" />
        </div>

        {/* Crucial (required) */}
        <div className="bg-[#FFEBEC] rounded-card p-lg flex justify-between items-start h-[70px] flex-1 relative">
          <div className="flex flex-col gap-xxs">
            <span className="text-label-xs font-medium text-foreground leading-none">
              Crucial (required)
            </span>
            <span className="font-aeonik-medium text-h5-title text-[#681219]">
              {stats.crucial}
            </span>
          </div>
          <RiAlertLine className="size-5 text-[#681219] shrink-0 absolute top-2 right-4" />
        </div>

        {/* Under review */}
        <div className="bg-[#FFFAEB] rounded-card p-lg flex justify-between items-start h-[70px] flex-1 relative">
          <div className="flex flex-col gap-xxs">
            <span className="text-label-xs font-medium text-foreground leading-none">
              Under review
            </span>
            <span className="font-aeonik-medium text-h5-title text-[#624C18]">
              {stats.underReview}
            </span>
          </div>
          <RiTimer2Line className="size-5 text-[#5C5C5C] shrink-0 absolute top-2 right-4" />
        </div>
      </div>

      {/* ─── Task Accountability & Filter Toolbar (Task 12) ────────────────── */}
      <div className="flex items-center justify-between gap-4 p-3 bg-white border border-border rounded-card shadow-2xs">
        {/* Left: Owner filter pills */}
        <div className="flex items-center gap-1.5 flex-wrap">
          <div className="flex items-center gap-1 text-label-xs font-medium text-muted-foreground mr-1">
            <RiFilter3Line className="size-3.5" />
            <span>Owner:</span>
          </div>

          <Button
            type="button"
            variant={assigneeFilter === "ALL" ? "primary-neutral" : "ghost"}
            size="sm"
            onClick={() => setAssigneeFilter("ALL")}
            className={`h-7 px-2.5 rounded-full text-[12px] font-medium transition-all ${
              assigneeFilter === "ALL"
                ? "bg-neutral-900 text-white hover:bg-neutral-800 hover:text-white"
                : "text-muted-foreground hover:text-foreground hover:bg-neutral-100"
            }`}
          >
            All staff ({tasks.length})
          </Button>

          <Button
            type="button"
            variant={assigneeFilter === "staff-nathan" ? "primary-neutral" : "ghost"}
            size="sm"
            onClick={() => setAssigneeFilter("staff-nathan")}
            className={`h-7 px-2.5 rounded-full text-[12px] font-medium transition-all ${
              assigneeFilter === "staff-nathan"
                ? "bg-neutral-900 text-white hover:bg-neutral-800 hover:text-white"
                : "text-muted-foreground hover:text-foreground hover:bg-neutral-100"
            }`}
          >
            Nathan (CoS)
          </Button>

          <Button
            type="button"
            variant={assigneeFilter === "staff-harman" ? "primary-neutral" : "ghost"}
            size="sm"
            onClick={() => setAssigneeFilter("staff-harman")}
            className={`h-7 px-2.5 rounded-full text-[12px] font-medium transition-all ${
              assigneeFilter === "staff-harman"
                ? "bg-neutral-900 text-white hover:bg-neutral-800 hover:text-white"
                : "text-muted-foreground hover:text-foreground hover:bg-neutral-100"
            }`}
          >
            Harman (Itinerary)
          </Button>

          <Button
            type="button"
            variant={assigneeFilter === "staff-rakesh" ? "primary-neutral" : "ghost"}
            size="sm"
            onClick={() => setAssigneeFilter("staff-rakesh")}
            className={`h-7 px-2.5 rounded-full text-[12px] font-medium transition-all ${
              assigneeFilter === "staff-rakesh"
                ? "bg-neutral-900 text-white hover:bg-neutral-800 hover:text-white"
                : "text-muted-foreground hover:text-foreground hover:bg-neutral-100"
            }`}
          >
            Rakesh (RTW)
          </Button>

          <Button
            type="button"
            variant={assigneeFilter === "staff-priya" ? "primary-neutral" : "ghost"}
            size="sm"
            onClick={() => setAssigneeFilter("staff-priya")}
            className={`h-7 px-2.5 rounded-full text-[12px] font-medium transition-all ${
              assigneeFilter === "staff-priya"
                ? "bg-neutral-900 text-white hover:bg-neutral-800 hover:text-white"
                : "text-muted-foreground hover:text-foreground hover:bg-neutral-100"
            }`}
          >
            Priya (Legal)
          </Button>

          <Button
            type="button"
            variant={assigneeFilter === "staff-alex" ? "primary-neutral" : "ghost"}
            size="sm"
            onClick={() => setAssigneeFilter("staff-alex")}
            className={`h-7 px-2.5 rounded-full text-[12px] font-medium transition-all ${
              assigneeFilter === "staff-alex"
                ? "bg-neutral-900 text-white hover:bg-neutral-800 hover:text-white"
                : "text-muted-foreground hover:text-foreground hover:bg-neutral-100"
            }`}
          >
            Alex (Officer)
          </Button>
        </div>

        {/* Right: Sort by Due Date */}
        <Button
          type="button"
          variant="outline"
          size="sm"
          onClick={() =>
            setSortByDueDate((prev) =>
              prev === null ? "asc" : prev === "asc" ? "desc" : null
            )
          }
          className={`h-7 px-2.5 rounded-button text-[12px] font-medium flex items-center gap-1.5 shrink-0 ${
            sortByDueDate ? "border-neutral-900 text-neutral-900 bg-neutral-50" : "border-border text-muted-foreground"
          }`}
        >
          <RiArrowUpDownLine className="size-3.5" />
          <span>
            {sortByDueDate === "asc"
              ? "Due Date (Earliest)"
              : sortByDueDate === "desc"
              ? "Due Date (Latest)"
              : "Sort by Deadline"}
          </span>
        </Button>
      </div>

      {/* ─── Categorized Task Sections ──────────────────────────────────────── */}
      <div className="flex flex-col gap-8 w-full">
        {categories.map((cat) => {
          const categoryTasks = displayedTasks.filter((t) => t.category === cat);
          const catCompleted = categoryTasks.filter((t) => t.isCompleted).length;
          const catTotal = categoryTasks.length;

          if (categoryTasks.length === 0) return null;

          return (
            <div key={cat} className="flex flex-col gap-3 w-full">
              {/* Category Header */}
              <div className="flex items-center justify-between w-full px-1">
                <div className="flex items-center gap-2">
                  <h3 className="font-aeonik-medium text-[20px] leading-[32px] text-[#171717]">
                    {cat}
                  </h3>
                  <RiInformationLine className="size-5 text-[#A4A4A4]" />
                </div>
                <span className="text-[12px] text-[#5C5C5C] font-normal">
                  {catCompleted} of {catTotal}
                </span>
              </div>

              {/* Task Rows Card Group */}
              <div className="bg-white border border-[#F5F5F5] rounded-card divide-y divide-neutral-100 overflow-hidden shadow-2xs">
                {categoryTasks.map((task) => {
                  return (
                    <div
                      key={task.id}
                      className="p-4 flex items-center justify-between gap-4 hover:bg-neutral-50/50 transition-colors"
                    >
                      {/* Left Side: Icon Badge & Content */}
                      <div className="flex items-start gap-3.5 min-w-0 flex-1">
                        {/* Status Icon Badges */}
                        {task.isCompleted ? (
                          <div className="size-7 rounded-full bg-[#E3F7EC] text-[#0B4627] flex items-center justify-center font-bold text-[13px] shrink-0 mt-0.5">
                            ✓
                          </div>
                        ) : task.status === "crucial" ? (
                          <div className="size-7 rounded-full bg-[#FFEBEC] text-[#FB3748] flex items-center justify-center font-bold text-[13px] shrink-0 mt-0.5">
                            !
                          </div>
                        ) : task.status === "under_review" ? (
                          <div className="size-7 rounded-full bg-[#FFFAEB] text-[#B45309] flex items-center justify-center font-bold text-[13px] shrink-0 mt-0.5">
                            !
                          </div>
                        ) : (
                          <div className="size-7 rounded-full bg-[#F3E8FF] text-[#7D52F4] flex items-center justify-center font-bold text-[13px] shrink-0 mt-0.5">
                            !
                          </div>
                        )}

                        <div className="flex flex-col min-w-0">
                          <span
                            className={`text-[14px] font-semibold transition-colors truncate ${
                              task.isCompleted ? "text-[#5C5C5C] line-through" : "text-[#171717]"
                            }`}
                          >
                            {task.title}
                          </span>
                          <p className="text-[13px] text-[#6B7280] font-normal leading-relaxed mt-0.5">
                            {task.description}
                          </p>
                        </div>
                      </div>

                      {/* Right Side: Assignee Selector + Due Date Picker + Resolve Button + Row Dropdown */}
                      <div className="flex items-center gap-2.5 shrink-0">
                        {/* Task 12: Assignee Selector */}
                        <TaskAssigneeSelector
                          assignee={task.assignee}
                          onAssign={(staff) => handleAssigneeChange(task.id, staff)}
                        />

                        {/* Task 12: Due Date Picker */}
                        <TaskDueDatePicker
                          dueDate={task.dueDate}
                          onChange={(date) => handleDueDateChange(task.id, date)}
                        />

                        {task.isCompleted ? (
                          <Button
                            type="button"
                            variant="outline"
                            size="sm"
                            onClick={() => handleToggleComplete(task.id)}
                            className="h-7 px-2.5 border-border hover:bg-neutral-100 text-muted-foreground hover:text-foreground text-label-xs font-medium rounded-button cursor-pointer"
                          >
                            Unresolve
                          </Button>
                        ) : (
                          <Button
                            type="button"
                            size="sm"
                            onClick={() => handleResolveButtonClick(task)}
                            className="h-7 px-3 bg-neutral-900 hover:bg-neutral-800 text-white text-label-xs font-medium rounded-button cursor-pointer"
                          >
                            Resolve
                          </Button>
                        )}

                        {/* Row Dropdown Menu */}
                        <DropdownMenu>
                          <DropdownMenuTrigger
                            render={
                              <Button
                                type="button"
                                variant="ghost"
                                size="icon-xs"
                                className="size-7 rounded-button text-muted-foreground hover:text-foreground hover:bg-neutral-100 cursor-pointer"
                              >
                                <RiMore2Line className="size-4 shrink-0" />
                              </Button>
                            }
                          />
                          <DropdownMenuContent
                            align="end"
                            className="w-[220px] p-1.5 rounded-card bg-popover text-popover-foreground border-border shadow-card-large flex flex-col gap-0.5 text-paragraph-sm"
                          >
                            {task.isCompleted ? (
                              <DropdownMenuItem
                                onClick={() => handleToggleComplete(task.id)}
                                className="flex items-center gap-2 px-2.5 py-1.5 rounded-button text-foreground hover:bg-neutral-100 cursor-pointer font-medium"
                              >
                                <RiRefreshLine className="size-4 text-muted-foreground shrink-0" />
                                <span>Unresolve</span>
                              </DropdownMenuItem>
                            ) : (
                              <DropdownMenuItem
                                onClick={() => handleResolveButtonClick(task)}
                                className="flex items-center gap-2 px-2.5 py-1.5 rounded-button text-foreground hover:bg-neutral-100 cursor-pointer font-medium"
                              >
                                <RiFocus2Line className="size-4 text-muted-foreground shrink-0" />
                                <span>Resolve</span>
                              </DropdownMenuItem>
                            )}

                            <DropdownMenuItem
                              onClick={() => handleOpenTaskActionModal(task, "Upload documents")}
                              className="flex items-center gap-2 px-2.5 py-1.5 rounded-button text-foreground hover:bg-neutral-100 cursor-pointer font-medium"
                            >
                              <RiUpload2Line className="size-4 text-muted-foreground shrink-0" />
                              <span>Upload documents</span>
                            </DropdownMenuItem>

                            <DropdownMenuItem
                              onClick={() => handleOpenTaskActionModal(task, "Complete RTW check")}
                              className="flex items-center gap-2 px-2.5 py-1.5 rounded-button text-foreground hover:bg-neutral-100 cursor-pointer font-medium"
                            >
                              <RiShieldCheckLine className="size-4 text-muted-foreground shrink-0" />
                              <span>Complete RTW check</span>
                            </DropdownMenuItem>

                            {(task.title.toLowerCase().includes("tour gap") ||
                              task.title.toLowerCase().includes("schedule")) && (
                              <DropdownMenuItem
                                onClick={() => {
                                  setTourGapTaskId(task.id);
                                  setTourGapModalOpen(true);
                                }}
                                className="flex items-center gap-2 px-2.5 py-1.5 rounded-button text-foreground hover:bg-neutral-100 cursor-pointer font-medium"
                              >
                                <RiCalendarEventLine className="size-4 text-muted-foreground shrink-0" />
                                <span>Tour gap schedule</span>
                              </DropdownMenuItem>
                            )}

                            <DropdownMenuSeparator className="my-1 border-t border-border" />

                            <DropdownMenuItem
                              onClick={() =>
                                toast.info("Task accountability", {
                                  description: `Assigned to ${task.assignee?.name || "Unassigned"}. Deadline: ${task.dueDate || "None"}.`,
                                })
                              }
                              className="flex items-center gap-2 px-2.5 py-1.5 rounded-button text-foreground hover:bg-neutral-100 cursor-pointer font-medium"
                            >
                              <RiInformationLine className="size-4 text-muted-foreground shrink-0" />
                              <span>Task details</span>
                            </DropdownMenuItem>
                          </DropdownMenuContent>
                        </DropdownMenu>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          );
        })}
      </div>

      {/* Case Action Modal */}
      <CaseActionModal
        open={actionModalOpen}
        onOpenChange={setActionModalOpen}
        row={actionModalRow}
        onSuccess={() => {
          if (activeTaskIdForModal) {
            handleToggleComplete(activeTaskIdForModal);
          }
        }}
      />

      {/* Tour Gap Schedule Modal */}
      <TourGapScheduleModal
        open={tourGapModalOpen}
        onOpenChange={setTourGapModalOpen}
        caseId={caseId}
        migrantName={migrantName || (typeof migrant?.name === "string" ? migrant.name : undefined)}
        onSaveSchedule={() => {
          if (tourGapTaskId) {
            handleToggleComplete(tourGapTaskId);
          }
        }}
      />
    </div>
  );
}
