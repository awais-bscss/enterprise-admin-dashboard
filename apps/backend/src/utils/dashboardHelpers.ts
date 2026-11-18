import type mongoose from "mongoose";
import { ROLES, type Permission, type Role } from "../config/rbac.js";
import { AuditLog } from "../models/AuditLog.js";
import { Client } from "../models/Client.js";
import { Department } from "../models/Department.js";
import { PROJECT_STATUSES, Project, type ProjectStatus } from "../models/Project.js";
import { RefreshToken } from "../models/RefreshToken.js";
import { User } from "../models/User.js";

const DAY_MS = 24 * 60 * 60 * 1000;
const DEADLINE_ALERT_HORIZON_DAYS = 14;

export type DeadlineUrgency = "critical" | "warning" | "upcoming";

export interface UserRoleStatusRow {
  _id: { status: string; role: Role };
  count: number;
}

export interface ProjectDeptStatusRow {
  _id: { status: ProjectStatus; departmentId: mongoose.Types.ObjectId | null };
  count: number;
  progressSum: number;
}

export interface DepartmentSummaryDoc {
  _id: unknown;
  name: string;
  code: string;
  status: string;
}

export interface ClientStatusRow {
  _id: string;
  count: number;
}

export interface DeadlineAlertRow {
  _id: unknown;
  name: string;
  status: string;
  priority: string;
  progress: number;
  dueDate: Date;
  ownerName: string;
  teamCount: number;
  departmentName: string;
  departmentCode: string | null;
}

export function resolveDeadlineAlertMeta(
  dueDate: Date,
  todayUtcMs: number,
): { daysRemaining: number; urgency: DeadlineUrgency } {
  const dueUtcMs = Date.UTC(dueDate.getUTCFullYear(), dueDate.getUTCMonth(), dueDate.getUTCDate());
  const daysRemaining = Math.round((dueUtcMs - todayUtcMs) / DAY_MS);
  const urgency: DeadlineUrgency =
    daysRemaining <= 3 ? "critical" : daysRemaining <= 7 ? "warning" : "upcoming";
  return { daysRemaining, urgency };
}

function buildRecentDayKeys(days: number): { key: string; label: string }[] {
  const result: { key: string; label: string }[] = [];
  const now = new Date();
  for (let offset = days - 1; offset >= 0; offset -= 1) {
    const day = new Date(Date.UTC(now.getUTCFullYear(), now.getUTCMonth(), now.getUTCDate() - offset));
    const key = day.toISOString().slice(0, 10);
    const label = day.toLocaleDateString("en-US", { weekday: "short", timeZone: "UTC" });
    result.push({ key, label });
  }
  return result;
}

export async function queryDeadlineAlertRows(todayUtcMs: number): Promise<DeadlineAlertRow[]> {
  const horizonEnd = new Date(todayUtcMs + (DEADLINE_ALERT_HORIZON_DAYS + 1) * DAY_MS);
  return Project.aggregate<DeadlineAlertRow>([
    {
      $match: {
        status: { $ne: "completed" },
        dueDate: { $ne: null, $lt: horizonEnd },
      },
    },
    { $sort: { dueDate: 1 } },
    { $limit: 6 },
    {
      $lookup: {
        from: User.collection.name,
        localField: "ownerId",
        foreignField: "_id",
        pipeline: [{ $project: { name: 1 } }],
        as: "ownerDoc",
      },
    },
    {
      $lookup: {
        from: Department.collection.name,
        localField: "departmentId",
        foreignField: "_id",
        pipeline: [{ $project: { name: 1, code: 1 } }],
        as: "departmentDoc",
      },
    },
    {
      $project: {
        name: 1,
        status: 1,
        priority: 1,
        progress: 1,
        dueDate: 1,
        ownerName: { $ifNull: [{ $arrayElemAt: ["$ownerDoc.name", 0] }, "Member"] },
        teamCount: { $add: [1, { $size: { $ifNull: ["$memberIds", []] } }] },
        departmentName: {
          $ifNull: [{ $arrayElemAt: ["$departmentDoc.name", 0] }, "General"],
        },
        departmentCode: { $ifNull: [{ $arrayElemAt: ["$departmentDoc.code", 0] }, null] },
      },
    },
  ]);
}

export function buildEmployeeStatusData(rows: readonly UserRoleStatusRow[]) {
  let activeEmployees = 0;
  let suspendedEmployees = 0;
  const roleCountMap = new Map<Role, number>();

  for (const row of rows) {
    if (row._id.status === "active") activeEmployees += row.count;
    else if (row._id.status === "suspended") suspendedEmployees += row.count;
    roleCountMap.set(row._id.role, (roleCountMap.get(row._id.role) ?? 0) + row.count);
  }

  return {
    totalEmployees: activeEmployees + suspendedEmployees,
    activeEmployees,
    suspendedEmployees,
    statusBreakdown: [
      { status: "active" as const, count: activeEmployees },
      { status: "suspended" as const, count: suspendedEmployees },
    ],
    roleBreakdown: ROLES.map((role) => ({
      role,
      count: roleCountMap.get(role) ?? 0,
    })),
  };
}

export function buildTrackProgressData(
  departments: readonly DepartmentSummaryDoc[],
  projectRows: readonly ProjectDeptStatusRow[],
) {
  const statsByDept = new Map<string, { count: number; progressSum: number }>();
  let totalProjects = 0;
  let totalProgressSum = 0;

  for (const row of projectRows) {
    totalProjects += row.count;
    totalProgressSum += row.progressSum;
    if (row._id.departmentId) {
      const deptId = String(row._id.departmentId);
      const prev = statsByDept.get(deptId) ?? { count: 0, progressSum: 0 };
      statsByDept.set(deptId, {
        count: prev.count + row.count,
        progressSum: prev.progressSum + row.progressSum,
      });
    }
  }

  const departmentProgress = departments
    .filter((dept) => dept.status === "active")
    .map((dept) => {
      const entry = statsByDept.get(String(dept._id));
      const count = entry?.count ?? 0;
      const sum = entry?.progressSum ?? 0;
      return {
        id: String(dept._id),
        code: dept.code,
        label: dept.name,
        avgProgress: count > 0 ? Math.round(sum / count) : 0,
        projectCount: count,
      };
    });

  return {
    averageProgress: totalProjects > 0 ? Math.round(totalProgressSum / totalProjects) : 0,
    totalProjects,
    departmentProgress,
  };
}

export function buildStatusBreakdownData(projectRows: readonly ProjectDeptStatusRow[]) {
  const statusMap = new Map<ProjectStatus, number>();
  let totalProjects = 0;

  for (const row of projectRows) {
    totalProjects += row.count;
    statusMap.set(row._id.status, (statusMap.get(row._id.status) ?? 0) + row.count);
  }

  return {
    totalProjects,
    projectStatusBreakdown: PROJECT_STATUSES.map((status) => ({
      status,
      count: statusMap.get(status) ?? 0,
    })),
  };
}

export function buildActivityTrendData(auditRecent: readonly { action: string; createdAt: Date }[]) {
  const dayBuckets = buildRecentDayKeys(5);
  const bucketCounts = new Map<string, { signIns: number; mutations: number }>();
  for (const bucket of dayBuckets) {
    bucketCounts.set(bucket.key, { signIns: 0, mutations: 0 });
  }

  for (const entry of auditRecent) {
    const key = entry.createdAt.toISOString().slice(0, 10);
    const target = bucketCounts.get(key);
    if (!target) continue;
    if (entry.action === "auth.login") {
      target.signIns += 1;
    } else {
      target.mutations += 1;
    }
  }

  return {
    activityTrend: dayBuckets.map((bucket) => {
      const counts = bucketCounts.get(bucket.key)!;
      return {
        period: bucket.label,
        signIns: counts.signIns,
        mutations: counts.mutations,
      };
    }),
  };
}

export function buildSummaryData(input: {
  userRows: readonly UserRoleStatusRow[];
  departments: readonly DepartmentSummaryDoc[];
  clientRows: readonly ClientStatusRow[];
  projectRows: readonly ProjectDeptStatusRow[];
  directoryPreview: readonly { _id: unknown; name: string; email: string; role: string; status: string }[];
  deadlineAlertRows: readonly DeadlineAlertRow[];
  activeSessions: number | null;
  todayUtcMs: number;
  role: Role;
  permissions: readonly Permission[];
}) {
  const employeeStats = buildEmployeeStatusData(input.userRows);
  const totalDepartments = input.departments.length;
  const activeDepartments = input.departments.filter((d) => d.status === "active").length;

  let totalClients = 0;
  let activeClients = 0;
  for (const row of input.clientRows) {
    totalClients += row.count;
    if (row._id === "active") activeClients += row.count;
  }

  let completedProjects = 0;
  let inProgressProjects = 0;
  let upcomingProjects = 0;
  let progressSum = 0;

  for (const row of input.projectRows) {
    progressSum += row.progressSum;
    if (row._id.status === "completed") completedProjects += row.count;
    else if (row._id.status === "in_progress") inProgressProjects += row.count;
    else if (row._id.status === "upcoming") upcomingProjects += row.count;
  }

  const totalProjects = completedProjects + inProgressProjects + upcomingProjects;
  const activeProjects = inProgressProjects + upcomingProjects;
  const averageProgress = totalProjects > 0 ? Math.round(progressSum / totalProjects) : 0;

  return {
    stats: {
      totalUsers: employeeStats.totalEmployees,
      activeUsers: employeeStats.activeEmployees,
      suspendedUsers: employeeStats.suspendedEmployees,
      activeSessions: input.activeSessions,
      totalDepartments,
      activeDepartments,
      totalClients,
      activeClients,
      totalProjects,
      activeProjects,
      inProgressProjects,
      completedProjects,
      upcomingProjects,
      averageProgress,
    },
    deadlineAlerts: input.deadlineAlertRows.map((project) => {
      const meta = resolveDeadlineAlertMeta(new Date(project.dueDate), input.todayUtcMs);
      return {
        id: String(project._id),
        name: project.name,
        departmentName: project.departmentName,
        departmentCode: project.departmentCode,
        status: project.status,
        priority: project.priority,
        progress: project.progress,
        dueDate: new Date(project.dueDate).toISOString(),
        daysRemaining: meta.daysRemaining,
        urgency: meta.urgency,
        ownerName: project.ownerName,
        teamCount: project.teamCount ?? 1,
      };
    }),
    directoryPreview: input.directoryPreview.map((item) => ({
      id: String(item._id),
      name: item.name,
      email: item.email,
      role: item.role as Role,
      status: item.status,
    })),
    role: input.role,
    permissions: [...input.permissions],
  };
}

export async function querySharedProjectStats() {
  return Project.aggregate<ProjectDeptStatusRow>([
    {
      $group: {
        _id: { status: "$status", departmentId: "$departmentId" },
        count: { $sum: 1 },
        progressSum: { $sum: "$progress" },
      },
    },
  ]);
}

export async function querySharedUserStats() {
  return User.aggregate<UserRoleStatusRow>([
    {
      $group: {
        _id: { status: "$status", role: "$role" },
        count: { $sum: 1 },
      },
    },
  ]);
}

export async function queryAllDashboardDatasets(input: {
  includeActiveSessions: boolean;
  role: Role;
  permissions: readonly Permission[];
}) {
  const now = new Date();
  const todayUtcMs = Date.UTC(now.getUTCFullYear(), now.getUTCMonth(), now.getUTCDate());
  const fiveDaysAgo = new Date(Date.now() - 6 * DAY_MS);

  const [
    userRows,
    departments,
    clientRows,
    directoryPreview,
    projectRows,
    deadlineAlertRows,
    activeSessions,
    auditRecent,
  ] = await Promise.all([
    querySharedUserStats(),
    Department.find().select("_id name code status").sort({ createdAt: 1, name: 1 }).lean(),
    Client.aggregate<ClientStatusRow>([{ $group: { _id: "$status", count: { $sum: 1 } } }]),
    User.find().select("name email role status").sort({ createdAt: 1 }).limit(4).lean(),
    querySharedProjectStats(),
    queryDeadlineAlertRows(todayUtcMs),
    input.includeActiveSessions
      ? RefreshToken.countDocuments({ revokedAt: null, expiresAt: { $gt: now } })
      : Promise.resolve(null),
    AuditLog.find({ createdAt: { $gte: fiveDaysAgo } })
      .select("action createdAt")
      .lean(),
  ]);

  return {
    summary: buildSummaryData({
      userRows,
      departments: departments as unknown as DepartmentSummaryDoc[],
      clientRows,
      projectRows,
      directoryPreview,
      deadlineAlertRows,
      activeSessions,
      todayUtcMs,
      role: input.role,
      permissions: input.permissions,
    }),
    trackProgress: buildTrackProgressData(
      departments as unknown as DepartmentSummaryDoc[],
      projectRows,
    ),
    statusBreakdown: buildStatusBreakdownData(projectRows),
    employeeStatus: buildEmployeeStatusData(userRows),
    activityTrend: buildActivityTrendData(auditRecent),
  };
}
