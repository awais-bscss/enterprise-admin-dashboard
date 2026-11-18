import assert from "node:assert/strict";
import test from "node:test";
import mongoose from "mongoose";
import {
  buildActivityTrendData,
  buildEmployeeStatusData,
  buildStatusBreakdownData,
  buildSummaryData,
  buildTrackProgressData,
  resolveDeadlineAlertMeta,
} from "../src/utils/dashboardHelpers.js";

test("resolveDeadlineAlertMeta classifies critical, warning, and upcoming UTC thresholds", () => {
  const todayUtcMs = Date.UTC(2026, 10, 18); // Nov 18, 2026
  assert.deepEqual(resolveDeadlineAlertMeta(new Date("2026-11-16T00:00:00.000Z"), todayUtcMs), {
    daysRemaining: -2,
    urgency: "critical",
  });
  assert.deepEqual(resolveDeadlineAlertMeta(new Date("2026-11-21T00:00:00.000Z"), todayUtcMs), {
    daysRemaining: 3,
    urgency: "critical",
  });
  assert.deepEqual(resolveDeadlineAlertMeta(new Date("2026-11-24T00:00:00.000Z"), todayUtcMs), {
    daysRemaining: 6,
    urgency: "warning",
  });
  assert.deepEqual(resolveDeadlineAlertMeta(new Date("2026-11-29T00:00:00.000Z"), todayUtcMs), {
    daysRemaining: 11,
    urgency: "upcoming",
  });
});

test("buildTrackProgressData includes active departments only and computes weighted avg", () => {
  const feId = new mongoose.Types.ObjectId();
  const beId = new mongoose.Types.ObjectId();
  const archivedId = new mongoose.Types.ObjectId();

  const result = buildTrackProgressData(
    [
      { _id: feId, name: "Frontend", code: "FE", status: "active" },
      { _id: beId, name: "Backend", code: "BE", status: "active" },
      { _id: archivedId, name: "Legacy", code: "OLD", status: "inactive" },
    ],
    [
      { _id: { status: "completed", departmentId: feId }, count: 1, progressSum: 100 },
      { _id: { status: "in_progress", departmentId: feId }, count: 1, progressSum: 50 },
      { _id: { status: "upcoming", departmentId: beId }, count: 0, progressSum: 0 },
    ],
  );

  assert.equal(result.totalProjects, 2);
  assert.equal(result.averageProgress, 75);
  assert.equal(result.departmentProgress.length, 2);
  assert.deepEqual(result.departmentProgress[0], {
    id: String(feId),
    code: "FE",
    label: "Frontend",
    avgProgress: 75,
    projectCount: 2,
  });
  assert.equal(result.departmentProgress[1]?.avgProgress, 0);
});

test("buildEmployeeStatusData and buildStatusBreakdownData aggregate all buckets", () => {
  const emp = buildEmployeeStatusData([
    { _id: { status: "active", role: "admin" }, count: 1 },
    { _id: { status: "active", role: "manager" }, count: 2 },
    { _id: { status: "suspended", role: "viewer" }, count: 1 },
  ]);

  assert.equal(emp.totalEmployees, 4);
  assert.equal(emp.activeEmployees, 3);
  assert.equal(emp.suspendedEmployees, 1);
  assert.deepEqual(emp.roleBreakdown, [
    { role: "admin", count: 1 },
    { role: "manager", count: 2 },
    { role: "viewer", count: 1 },
  ]);

  const statusBreakdown = buildStatusBreakdownData([
    { _id: { status: "completed", departmentId: null }, count: 2, progressSum: 200 },
    { _id: { status: "in_progress", departmentId: null }, count: 1, progressSum: 50 },
  ]);
  assert.equal(statusBreakdown.totalProjects, 3);
  assert.deepEqual(statusBreakdown.projectStatusBreakdown, [
    { status: "upcoming", count: 0 },
    { status: "in_progress", count: 1 },
    { status: "completed", count: 2 },
  ]);
});

test("buildSummaryData and buildActivityTrendData format dashboard overview payloads", () => {
  const summary = buildSummaryData({
    userRows: [{ _id: { status: "active", role: "admin" }, count: 2 }],
    departments: [
      { _id: new mongoose.Types.ObjectId(), name: "FE", code: "FE", status: "active" },
      { _id: new mongoose.Types.ObjectId(), name: "Old", code: "OLD", status: "inactive" },
    ],
    clientRows: [
      { _id: "active", count: 3 },
      { _id: "inactive", count: 1 },
    ],
    projectRows: [
      { _id: { status: "in_progress", departmentId: null }, count: 2, progressSum: 120 },
      { _id: { status: "completed", departmentId: null }, count: 1, progressSum: 100 },
    ],
    directoryPreview: [],
    deadlineAlertRows: [],
    activeSessions: null,
    todayUtcMs: Date.UTC(2026, 10, 18),
    role: "viewer",
    permissions: ["users:read", "projects:read"],
  });

  assert.equal(summary.stats.totalUsers, 2);
  assert.equal(summary.stats.totalDepartments, 2);
  assert.equal(summary.stats.activeDepartments, 1);
  assert.equal(summary.stats.totalClients, 4);
  assert.equal(summary.stats.activeClients, 3);
  assert.equal(summary.stats.averageProgress, 73);
  assert.equal(summary.stats.activeSessions, null);

  const now = new Date();
  const trend = buildActivityTrendData([
    { action: "auth.login", createdAt: now },
    { action: "project.created", createdAt: now },
    { action: "project.updated", createdAt: now },
  ]);
  assert.equal(trend.activityTrend.length, 5);
  const todayPoint = trend.activityTrend[4]!;
  assert.equal(todayPoint.signIns, 1);
  assert.equal(todayPoint.mutations, 2);
});
