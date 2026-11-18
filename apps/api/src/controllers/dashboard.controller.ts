import type { Request, Response } from "express";
import type mongoose from "mongoose";
import { ROLES, type Role } from "../config/rbac.js";
import { AuditLog } from "../models/AuditLog.js";
import { Client } from "../models/Client.js";
import { Department } from "../models/Department.js";
import { PROJECT_STATUSES, Project, type ProjectStatus } from "../models/Project.js";
import { RefreshToken } from "../models/RefreshToken.js";
import { User } from "../models/User.js";

const DAY_MS = 24 * 60 * 60 * 1000;
const DEADLINE_ALERT_HORIZON_DAYS = 14;

type DeadlineUrgency = "critical" | "warning" | "upcoming";

function resolveDeadlineAlertMeta(
  dueDate: Date,
  todayUtcMs: number,
): { daysRemaining: number; urgency: DeadlineUrgency } {
  const dueUtcMs = Date.UTC(dueDate.getUTCFullYear(), dueDate.getUTCMonth(), dueDate.getUTCDate());
  const daysRemaining = Math.round((dueUtcMs - todayUtcMs) / DAY_MS);
  const urgency: DeadlineUrgency =
    daysRemaining <= 3 ? "critical" : daysRemaining <= 7 ? "warning" : "upcoming";
  return { daysRemaining, urgency };
}

function summarizeStatusCounts(
  rows: Array<{ _id: string | { status?: string } | null; count: number }>,
): { total: number; active: number } {
  let total = 0;
  let active = 0;
  for (const row of rows) {
    total += row.count;
    const status = typeof row._id === "string" ? row._id : row._id?.status;
    if (status === "active") active += row.count;
  }
  return { total, active };
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

export async function getSummary(req: Request, res: Response): Promise<void> {
  const auth = req.auth!;
  const includeActiveSessions = auth.permissions.includes("audit:read");
  const now = new Date();
  const todayUtcMs = Date.UTC(now.getUTCFullYear(), now.getUTCMonth(), now.getUTCDate());
  const horizonEnd = new Date(todayUtcMs + (DEADLINE_ALERT_HORIZON_DAYS + 1) * DAY_MS);

  const [
    userStatsAgg,
    departmentStatsAgg,
    clientStatsAgg,
    directoryPreview,
    projectStatsAgg,
    deadlineAlertRows,
    activeSessions,
  ] = await Promise.all([
    User.aggregate<{ _id: { status: string }; count: number }>([
      { $group: { _id: { status: "$status" }, count: { $sum: 1 } } },
    ]),
    Department.aggregate<{ _id: string; count: number }>([
      { $group: { _id: "$status", count: { $sum: 1 } } },
    ]),
    Client.aggregate<{ _id: string; count: number }>([
      { $group: { _id: "$status", count: { $sum: 1 } } },
    ]),
    User.find().select("name email role status").sort({ createdAt: 1 }).limit(4).lean(),
    Project.aggregate<{ _id: ProjectStatus; count: number; progressSum: number }>([
      {
        $group: {
          _id: "$status",
          count: { $sum: 1 },
          progressSum: { $sum: "$progress" },
        },
      },
    ]),
    Project.aggregate<{
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
    }>([
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
    ]),
    includeActiveSessions
      ? RefreshToken.countDocuments({ revokedAt: null, expiresAt: { $gt: new Date() } })
      : Promise.resolve(null),
  ]);

  const { total: totalUsers, active: activeUsers } = summarizeStatusCounts(userStatsAgg);
  const { total: totalDepartments, active: activeDepartments } =
    summarizeStatusCounts(departmentStatsAgg);
  const { total: totalClients, active: activeClients } = summarizeStatusCounts(clientStatsAgg);

  let completedProjects = 0;
  let inProgressProjects = 0;
  let upcomingProjects = 0;
  let progressSum = 0;

  for (const row of projectStatsAgg) {
    progressSum += row.progressSum;
    if (row._id === "completed") completedProjects += row.count;
    else if (row._id === "in_progress") inProgressProjects += row.count;
    else if (row._id === "upcoming") upcomingProjects += row.count;
  }

  const totalProjects = completedProjects + inProgressProjects + upcomingProjects;
  const activeProjects = inProgressProjects + upcomingProjects;
  const averageProgress = totalProjects > 0 ? Math.round(progressSum / totalProjects) : 0;

  res.status(200).json({
    ok: true,
    data: {
      stats: {
        totalUsers,
        activeUsers,
        suspendedUsers: Math.max(0, totalUsers - activeUsers),
        activeSessions,
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
      deadlineAlerts: deadlineAlertRows.map((project) => {
        const meta = resolveDeadlineAlertMeta(new Date(project.dueDate), todayUtcMs);
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
      directoryPreview: directoryPreview.map((item) => ({
        id: String(item._id),
        name: item.name,
        email: item.email,
        role: item.role as Role,
        status: item.status,
      })),
      role: auth.role,
      permissions: auth.permissions,
    },
  });
}

export async function getTrackProgress(_req: Request, res: Response): Promise<void> {
  const [departments, projectRows] = await Promise.all([
    Department.find({ status: "active" })
      .select("_id name code")
      .sort({ createdAt: 1, name: 1 })
      .lean(),
    Project.aggregate<{
      _id: mongoose.Types.ObjectId | null;
      count: number;
      progressSum: number;
    }>([
      {
        $group: {
          _id: "$departmentId",
          count: { $sum: 1 },
          progressSum: { $sum: "$progress" },
        },
      },
    ]),
  ]);

  const statsByDept = new Map<string, { count: number; progressSum: number }>();
  let totalProjects = 0;
  let totalProgressSum = 0;

  for (const row of projectRows) {
    totalProjects += row.count;
    totalProgressSum += row.progressSum;
    if (row._id) {
      statsByDept.set(String(row._id), { count: row.count, progressSum: row.progressSum });
    }
  }

  const departmentProgress = departments.map((dept) => {
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

  const averageProgress = totalProjects > 0 ? Math.round(totalProgressSum / totalProjects) : 0;

  res.status(200).json({
    ok: true,
    data: {
      averageProgress,
      totalProjects,
      departmentProgress,
    },
  });
}

export async function getStatusBreakdown(_req: Request, res: Response): Promise<void> {
  const rows = await Project.aggregate<{ _id: ProjectStatus; count: number }>([
    { $group: { _id: "$status", count: { $sum: 1 } } },
  ]);

  const statusMap = new Map(rows.map((row) => [row._id, row.count]));
  let totalProjects = 0;
  const projectStatusBreakdown = PROJECT_STATUSES.map((status) => {
    const count = statusMap.get(status) ?? 0;
    totalProjects += count;
    return { status, count };
  });

  res.status(200).json({
    ok: true,
    data: {
      totalProjects,
      projectStatusBreakdown,
    },
  });
}

export async function getActivityTrend(_req: Request, res: Response): Promise<void> {
  const fiveDaysAgo = new Date(Date.now() - 6 * 24 * 60 * 60 * 1000);
  const auditRecent = await AuditLog.find({ createdAt: { $gte: fiveDaysAgo } })
    .select("action createdAt")
    .lean();

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

  const activityTrend = dayBuckets.map((bucket) => {
    const counts = bucketCounts.get(bucket.key)!;
    return {
      period: bucket.label,
      signIns: counts.signIns,
      mutations: counts.mutations,
    };
  });

  res.status(200).json({
    ok: true,
    data: {
      activityTrend,
    },
  });
}

export async function getEmployeeStatus(_req: Request, res: Response): Promise<void> {
  const rows = await User.aggregate<{
    _id: { status: string; role: Role };
    count: number;
  }>([
    {
      $group: {
        _id: { status: "$status", role: "$role" },
        count: { $sum: 1 },
      },
    },
  ]);

  let activeEmployees = 0;
  let suspendedEmployees = 0;
  const roleCountMap = new Map<Role, number>();

  for (const row of rows) {
    if (row._id.status === "active") activeEmployees += row.count;
    else if (row._id.status === "suspended") suspendedEmployees += row.count;
    roleCountMap.set(row._id.role, (roleCountMap.get(row._id.role) ?? 0) + row.count);
  }

  res.status(200).json({
    ok: true,
    data: {
      totalEmployees: activeEmployees + suspendedEmployees,
      activeEmployees,
      suspendedEmployees,
      statusBreakdown: [
        { status: "active", count: activeEmployees },
        { status: "suspended", count: suspendedEmployees },
      ],
      roleBreakdown: ROLES.map((role) => ({
        role,
        count: roleCountMap.get(role) ?? 0,
      })),
    },
  });
}
