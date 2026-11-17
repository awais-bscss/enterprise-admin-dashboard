import type { Request, Response } from "express";
import { ROLES, type Role } from "../config/rbac.js";
import { AuditLog } from "../models/AuditLog.js";
import {
  PROJECT_CATEGORIES,
  PROJECT_STATUSES,
  Project,
  type ProjectCategory,
  type ProjectStatus,
} from "../models/Project.js";
import { RefreshToken } from "../models/RefreshToken.js";
import { User } from "../models/User.js";

const CATEGORY_LABELS: Record<ProjectCategory, string> = {
  development: "Development",
  design: "Design",
  testing: "Testing",
  security: "Security",
};

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

export async function getOverview(req: Request, res: Response): Promise<void> {
  const auth = req.auth!;
  const fiveDaysAgo = new Date(Date.now() - 6 * 24 * 60 * 60 * 1000);
  const includeActiveSessions = auth.permissions.includes("audit:read");

  const [
    userStatsAgg,
    directoryPreview,
    projectMetrics,
    recentProjects,
    auditRecent,
    activeSessions,
  ] = await Promise.all([
    User.aggregate<{ _id: { role: Role; status: string }; count: number }>([
      { $group: { _id: { role: "$role", status: "$status" }, count: { $sum: 1 } } },
    ]),
    User.find().select("name email role status").sort({ createdAt: 1 }).limit(4).lean(),
    Project.find().select("status category progress tasksTotal tasksCompleted").lean(),
    Project.aggregate<{
      _id: unknown;
      name: string;
      category: string;
      status: string;
      priority: string;
      progress: number;
      tasksTotal: number;
      tasksCompleted: number;
      ownerName: string;
    }>([
      { $sort: { updatedAt: -1 } },
      { $limit: 4 },
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
        $project: {
          name: 1,
          category: 1,
          status: 1,
          priority: 1,
          progress: 1,
          tasksTotal: 1,
          tasksCompleted: 1,
          ownerName: { $ifNull: [{ $arrayElemAt: ["$ownerDoc.name", 0] }, "Member"] },
        },
      },
    ]),
    AuditLog.find({ createdAt: { $gte: fiveDaysAgo } })
      .select("action resourceType createdAt")
      .lean(),
    includeActiveSessions
      ? RefreshToken.countDocuments({ revokedAt: null, expiresAt: { $gt: new Date() } })
      : Promise.resolve(null),
  ]);

  let totalUsers = 0;
  let activeUsers = 0;
  const roleCountMap = new Map<Role, number>();
  for (const row of userStatsAgg) {
    totalUsers += row.count;
    if (row._id.status === "active") {
      activeUsers += row.count;
    }
    roleCountMap.set(row._id.role, (roleCountMap.get(row._id.role) ?? 0) + row.count);
  }
  const roleBreakdown = ROLES.map((role) => ({
    role,
    count: roleCountMap.get(role) ?? 0,
  }));

  const statusMap = new Map<ProjectStatus, number>();
  for (const status of PROJECT_STATUSES) {
    statusMap.set(status, 0);
  }

  let totalTasks = 0;
  let completedTasks = 0;
  let progressSum = 0;

  const categoryStats = new Map<
    ProjectCategory,
    { progressSum: number; count: number; tasksTotal: number }
  >();
  for (const cat of PROJECT_CATEGORIES) {
    categoryStats.set(cat, { progressSum: 0, count: 0, tasksTotal: 0 });
  }

  for (const project of projectMetrics) {
    const status = project.status as ProjectStatus;
    statusMap.set(status, (statusMap.get(status) ?? 0) + 1);

    totalTasks += project.tasksTotal;
    completedTasks += project.tasksCompleted;
    progressSum += project.progress;

    const cat = project.category as ProjectCategory;
    const entry = categoryStats.get(cat);
    if (entry) {
      entry.progressSum += project.progress;
      entry.count += 1;
      entry.tasksTotal += project.tasksTotal;
    }
  }

  const totalProjects = projectMetrics.length;
  const completedProjects = statusMap.get("completed") ?? 0;
  const inProgressProjects = statusMap.get("in_progress") ?? 0;
  const upcomingProjects = statusMap.get("upcoming") ?? 0;
  const activeProjects = inProgressProjects + upcomingProjects;
  const averageProgress = totalProjects > 0 ? Math.round(progressSum / totalProjects) : 0;

  const projectStatusBreakdown = PROJECT_STATUSES.map((status) => ({
    status,
    count: statusMap.get(status) ?? 0,
  }));

  const categoryProgress = PROJECT_CATEGORIES.map((category) => {
    const entry = categoryStats.get(category)!;
    return {
      category,
      label: CATEGORY_LABELS[category],
      avgProgress: entry.count > 0 ? Math.round(entry.progressSum / entry.count) : 0,
      projectCount: entry.count,
      tasksTotal: entry.tasksTotal,
    };
  });

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
      stats: {
        totalUsers,
        activeUsers,
        suspendedUsers: Math.max(0, totalUsers - activeUsers),
        activeSessions,
        totalProjects,
        activeProjects,
        inProgressProjects,
        completedProjects,
        upcomingProjects,
        totalTasks,
        completedTasks,
        averageProgress,
      },
      roleBreakdown,
      projectStatusBreakdown,
      categoryProgress,
      activityTrend,
      recentProjects: recentProjects.map((project) => ({
        id: String(project._id),
        name: project.name,
        category: project.category,
        status: project.status,
        priority: project.priority,
        progress: project.progress,
        tasksTotal: project.tasksTotal,
        tasksCompleted: project.tasksCompleted,
        ownerName: project.ownerName,
      })),
      directoryPreview: directoryPreview.map((item) => ({
        id: String(item._id),
        name: item.name,
        email: item.email,
        role: item.role,
        status: item.status,
      })),
      role: auth.role,
      permissions: auth.permissions,
    },
  });
}
