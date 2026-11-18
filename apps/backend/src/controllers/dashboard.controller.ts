import type { Request, Response } from "express";
import { AuditLog } from "../models/AuditLog.js";
import { Client } from "../models/Client.js";
import { Department } from "../models/Department.js";
import { RefreshToken } from "../models/RefreshToken.js";
import { User } from "../models/User.js";
import {
  buildActivityTrendData,
  buildEmployeeStatusData,
  buildStatusBreakdownData,
  buildSummaryData,
  buildTrackProgressData,
  queryAllDashboardDatasets,
  queryDeadlineAlertRows,
  querySharedProjectStats,
  querySharedUserStats,
  type ClientStatusRow,
  type DepartmentSummaryDoc,
} from "../utils/dashboardHelpers.js";

export async function getOverview(req: Request, res: Response): Promise<void> {
  const auth = req.auth!;
  const data = await queryAllDashboardDatasets({
    includeActiveSessions: auth.permissions.includes("audit:read"),
    role: auth.role,
    permissions: auth.permissions,
  });

  res.status(200).json({ ok: true, data });
}

export async function getSummary(req: Request, res: Response): Promise<void> {
  const auth = req.auth!;
  const now = new Date();
  const todayUtcMs = Date.UTC(now.getUTCFullYear(), now.getUTCMonth(), now.getUTCDate());

  const [
    userRows,
    departments,
    clientRows,
    directoryPreview,
    projectRows,
    deadlineAlertRows,
    activeSessions,
  ] = await Promise.all([
    querySharedUserStats(),
    Department.find().select("_id name code status").lean(),
    Client.aggregate<ClientStatusRow>([{ $group: { _id: "$status", count: { $sum: 1 } } }]),
    User.find().select("name email role status").sort({ createdAt: 1 }).limit(4).lean(),
    querySharedProjectStats(),
    queryDeadlineAlertRows(todayUtcMs),
    auth.permissions.includes("audit:read")
      ? RefreshToken.countDocuments({ revokedAt: null, expiresAt: { $gt: now } })
      : Promise.resolve(null),
  ]);

  res.status(200).json({
    ok: true,
    data: buildSummaryData({
      userRows,
      departments: departments as unknown as DepartmentSummaryDoc[],
      clientRows,
      projectRows,
      directoryPreview,
      deadlineAlertRows,
      activeSessions,
      todayUtcMs,
      role: auth.role,
      permissions: auth.permissions,
    }),
  });
}

export async function getTrackProgress(_req: Request, res: Response): Promise<void> {
  const [departments, projectRows] = await Promise.all([
    Department.find({ status: "active" })
      .select("_id name code status")
      .sort({ createdAt: 1, name: 1 })
      .lean(),
    querySharedProjectStats(),
  ]);

  res.status(200).json({
    ok: true,
    data: buildTrackProgressData(departments as unknown as DepartmentSummaryDoc[], projectRows),
  });
}

export async function getStatusBreakdown(_req: Request, res: Response): Promise<void> {
  const projectRows = await querySharedProjectStats();

  res.status(200).json({
    ok: true,
    data: buildStatusBreakdownData(projectRows),
  });
}

export async function getActivityTrend(_req: Request, res: Response): Promise<void> {
  const fiveDaysAgo = new Date(Date.now() - 6 * 24 * 60 * 60 * 1000);
  const auditRecent = await AuditLog.find({ createdAt: { $gte: fiveDaysAgo } })
    .select("action createdAt")
    .lean();

  res.status(200).json({
    ok: true,
    data: buildActivityTrendData(auditRecent),
  });
}

export async function getEmployeeStatus(_req: Request, res: Response): Promise<void> {
  const rows = await querySharedUserStats();

  res.status(200).json({
    ok: true,
    data: buildEmployeeStatusData(rows),
  });
}
