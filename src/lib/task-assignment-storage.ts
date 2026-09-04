"use client";

import { apiClient } from "@/lib/api-client";
import { ENDPOINTS } from "@/lib/api-endpoints";

export interface TaskAssignee {
  id: string;
  name: string;
  email: string;
  avatarText: string;
  avatarUrl?: string;
  role: string;
  employeeId?: number;
}

export const STANDARD_STAFF_MEMBERS: TaskAssignee[] = [
  {
    id: "staff-nathan",
    name: "Nathan Cole",
    email: "nathan@viems.io",
    avatarText: "NC",
    role: "SMS & CoS Specialist",
    employeeId: 1,
  },
  {
    id: "staff-harman",
    name: "Harman Preet",
    email: "harman@viems.io",
    avatarText: "HP",
    role: "Itinerary & Compliance Lead",
    employeeId: 2,
  },
  {
    id: "staff-rakesh",
    name: "Rakesh Patel",
    email: "rakesh@viems.io",
    avatarText: "RP",
    role: "Right to Work Lead",
    employeeId: 3,
  },
  {
    id: "staff-priya",
    name: "Priya Sharma",
    email: "priya@viems.io",
    avatarText: "PS",
    role: "Senior Case Manager",
    employeeId: 4,
  },
  {
    id: "staff-alex",
    name: "Alex Morgan",
    email: "alex@viems.io",
    avatarText: "AM",
    role: "Immigration Officer",
    employeeId: 5,
  },
];

const STORAGE_KEY = "viems_task_assignments";
const UPDATE_EVENT_NAME = "viems-task-assignment-updated";

/**
 * Intelligent default assignment mapping based on accountability areas:
 * - Harman: Itinerary, travel history, 14-day gaps, tour stops
 * - Nathan: CoS draft, SMS assignment, salary thresholds, sponsor notes
 * - Rakesh: Right to work checks, ID/passport verification, biometrics
 * - Priya: Role assessment, contract review, compliance audit, closing letters
 * - Alex: General immigration evidence, document completeness
 */
export function getDefaultAssigneeForTask(title: string = "", category: string = ""): TaskAssignee {
  const t = `${title} ${category}`.toLowerCase();

  if (
    t.includes("rtw") ||
    t.includes("right to work") ||
    t.includes("biometric") ||
    t.includes("identity") ||
    t.includes("passport") ||
    t.includes("idv")
  ) {
    return STANDARD_STAFF_MEMBERS.find((s) => s.id === "staff-rakesh")!;
  }

  if (
    t.includes("cos") ||
    t.includes("sms") ||
    t.includes("sponsorship") ||
    t.includes("salary") ||
    t.includes("wage") ||
    t.includes("union")
  ) {
    return STANDARD_STAFF_MEMBERS.find((s) => s.id === "staff-nathan")!;
  }

  if (
    t.includes("itinerary") ||
    t.includes("schedule") ||
    t.includes("tour") ||
    t.includes("flight") ||
    t.includes("arrival") ||
    t.includes("departure") ||
    t.includes("gap") ||
    t.includes("travel")
  ) {
    return STANDARD_STAFF_MEMBERS.find((s) => s.id === "staff-harman")!;
  }

  if (
    t.includes("closing") ||
    t.includes("curtailment") ||
    t.includes("audit") ||
    t.includes("role") ||
    t.includes("reporting") ||
    t.includes("status")
  ) {
    return STANDARD_STAFF_MEMBERS.find((s) => s.id === "staff-priya")!;
  }

  return STANDARD_STAFF_MEMBERS.find((s) => s.id === "staff-alex")!;
}

/**
 * Generates sensible default due date based on status / priority in ISO format (YYYY-MM-DD).
 */
export function getDefaultDueDateForTask(
  statusOrPriority: string = "general",
  baseDate: Date = new Date()
): string {
  const norm = (statusOrPriority || "").toLowerCase();
  const d = new Date(baseDate);

  if (norm.includes("high") || norm.includes("crucial") || norm.includes("asap") || norm.includes("action")) {
    d.setDate(d.getDate() + 3);
  } else if (norm.includes("medium") || norm.includes("review") || norm.includes("under_review")) {
    d.setDate(d.getDate() + 7);
  } else {
    d.setDate(d.getDate() + 14);
  }

  const year = d.getFullYear();
  const month = String(d.getMonth() + 1).padStart(2, "0");
  const day = String(d.getDate()).padStart(2, "0");
  return `${year}-${month}-${day}`;
}

/**
 * Formats a Date object or date string to standard display: "18 Mar 2026"
 */
export function formatDateDisplay(dateInput: Date | string | null | undefined): string {
  if (!dateInput) return "No due date";
  const d = typeof dateInput === "string" ? new Date(dateInput) : dateInput;
  if (isNaN(d.getTime())) return String(dateInput);

  return d.toLocaleDateString("en-GB", {
    day: "numeric",
    month: "short",
    year: "numeric",
  });
}

/**
 * Computes urgency indicator:
 * - isOverdue: due in the past
 * - isDueSoon: due within 72 hours
 */
export function getDueDateUrgency(dueDateStr?: string): {
  isOverdue: boolean;
  isDueSoon: boolean;
  daysRemaining: number | null;
  label: string;
} {
  if (!dueDateStr || dueDateStr === "No due date" || dueDateStr === "—") {
    return { isOverdue: false, isDueSoon: false, daysRemaining: null, label: "None" };
  }

  const targetDate = new Date(dueDateStr);
  if (isNaN(targetDate.getTime())) {
    return { isOverdue: false, isDueSoon: false, daysRemaining: null, label: dueDateStr };
  }

  const now = new Date();
  now.setHours(0, 0, 0, 0);
  targetDate.setHours(0, 0, 0, 0);

  const diffMs = targetDate.getTime() - now.getTime();
  const diffDays = Math.round(diffMs / (1000 * 60 * 60 * 24));

  if (diffDays < 0) {
    return {
      isOverdue: true,
      isDueSoon: false,
      daysRemaining: diffDays,
      label: `${Math.abs(diffDays)}d overdue`,
    };
  }

  if (diffDays === 0) {
    return {
      isOverdue: false,
      isDueSoon: true,
      daysRemaining: 0,
      label: "Due today",
    };
  }

  if (diffDays <= 3) {
    return {
      isOverdue: false,
      isDueSoon: true,
      daysRemaining: diffDays,
      label: `Due in ${diffDays}d`,
    };
  }

  return {
    isOverdue: false,
    isDueSoon: false,
    daysRemaining: diffDays,
    label: formatDateDisplay(targetDate),
  };
}

/**
 * Client storage operations
 */
export interface StoredTaskRecord {
  assignee?: TaskAssignee | null;
  dueDate?: string;
  status?: string;
  isResolved?: boolean;
}

export function getAllStoredAssignments(): Record<string, StoredTaskRecord> {
  if (typeof window === "undefined") return {};
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    return raw ? JSON.parse(raw) : {};
  } catch {
    return {};
  }
}

export function getStoredTaskAssignment(
  taskId: string
): StoredTaskRecord | null {
  const all = getAllStoredAssignments();
  return all[taskId] || null;
}

export function saveStoredTaskAssignment(
  taskId: string,
  data: StoredTaskRecord
): void {
  if (typeof window === "undefined") return;
  try {
    const all = getAllStoredAssignments();
    all[taskId] = {
      ...all[taskId],
      ...data,
    };
    localStorage.setItem(STORAGE_KEY, JSON.stringify(all));

    // Dispatch update event for listeners in other components
    window.dispatchEvent(
      new CustomEvent(UPDATE_EVENT_NAME, {
        detail: { taskId, ...data },
      })
    );
  } catch (err) {
    console.warn("Failed to persist task assignment locally:", err);
  }
}

/**
 * Sync task changes to backend if task has numeric backend ID
 */
export async function syncTaskAssignmentToBackend(
  taskId: string | number,
  payload: { employeeId?: number | null; dueDate?: string; priority?: number }
): Promise<boolean> {
  const numericId =
    typeof taskId === "number"
      ? taskId
      : typeof taskId === "string" && /^\d+$/.test(taskId.trim())
      ? parseInt(taskId.trim(), 10)
      : NaN;
  if (isNaN(numericId) || numericId <= 0) return false;

  try {
    const formData = new FormData();
    if (payload.priority !== undefined) {
      formData.append("priority", String(payload.priority));
    }
    if (payload.employeeId !== undefined) {
      formData.append("employeeId", payload.employeeId ? String(payload.employeeId) : "0");
    }
    if (payload.dueDate !== undefined) {
      formData.append("dueDate", payload.dueDate || "");
    }

    await apiClient.patch(`${ENDPOINTS.tasks.base}/${numericId}`, { body: formData });
    return true;
  } catch (err) {
    // If backend endpoint is unavailable or errors, localStorage ensures smooth UI state
    console.debug("Backend task patch skipped or failed, fallback to client state:", err);
    return false;
  }
}
