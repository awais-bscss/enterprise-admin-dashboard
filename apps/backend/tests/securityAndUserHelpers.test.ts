import assert from "node:assert/strict";
import test from "node:test";
import mongoose from "mongoose";
import { getPermissionsForRole } from "../src/config/rbac.js";
import { isStrongPassword, validateWorkspacePassword } from "../src/utils/passwordPolicy.js";
import { escapeRegex } from "../src/utils/query.js";
import {
  buildUserFilter,
  serializeDirectoryUser,
  summarizeUserDirectoryStats,
} from "../src/utils/userHelpers.js";

test("getPermissionsForRole returns scoped immutable copies per role", () => {
  const viewerPerms = getPermissionsForRole("viewer");
  assert.equal(viewerPerms.includes("projects:read"), true);
  assert.equal(viewerPerms.includes("departments:read"), true);
  assert.equal(viewerPerms.includes("clients:read"), true);
  assert.equal(viewerPerms.includes("projects:write"), false);
  assert.equal(viewerPerms.includes("audit:read"), false);

  viewerPerms.push("users:write");
  assert.equal(getPermissionsForRole("viewer").includes("users:write"), false);

  assert.equal(getPermissionsForRole("admin").includes("users:write"), true);
  assert.equal(getPermissionsForRole("manager").includes("users:write"), false);
});

test("passwordPolicy enforces 8+ chars with upper, lower, and digit", async () => {
  assert.equal(isStrongPassword("weak"), false);
  assert.equal(isStrongPassword("alllowercase1"), false);
  assert.equal(isStrongPassword("ALLUPPERCASE1"), false);
  assert.equal(isStrongPassword("NoNumbersHere"), false);
  assert.equal(isStrongPassword("ValidPass99"), true);

  assert.notEqual(await validateWorkspacePassword("short1A"), null);
  assert.equal(await validateWorkspacePassword("ValidPass99"), null);
});

test("escapeRegex escapes special regex operators", () => {
  assert.equal(escapeRegex("a+b*(c)?[0]"), "a\\+b\\*\\(c\\)\\?\\[0\\]");
});

test("userHelpers serialize, filter, and summarize employee directory stats", () => {
  const deptId = new mongoose.Types.ObjectId();
  const userId = new mongoose.Types.ObjectId();

  const serialized = serializeDirectoryUser(
    {
      _id: userId,
      name: "Samira Patel",
      email: "samira@corp.dev",
      role: "manager",
      status: "active",
      departmentId: { _id: deptId, name: "Backend", code: "BE" },
      createdAt: new Date("2026-11-01T00:00:00.000Z"),
    },
    3,
  );

  assert.equal(serialized.id, String(userId));
  assert.equal(serialized.department?.code, "BE");
  assert.equal(serialized.projectCount, 3);

  const filter = buildUserFilter({
    role: "manager",
    status: "active",
    departmentId: String(deptId),
    q: "samira",
  });
  assert.equal(filter.role, "manager");
  assert.equal(filter.status, "active");
  assert.deepEqual(filter.departmentId, deptId);

  const stats = summarizeUserDirectoryStats([
    { _id: { role: "admin", status: "active" }, count: 1 },
    { _id: { role: "manager", status: "suspended" }, count: 2 },
    { _id: { role: "viewer", status: "active" }, count: 1 },
  ]);
  assert.deepEqual(stats, {
    total: 4,
    active: 2,
    suspended: 2,
    admins: 1,
    managers: 2,
    viewers: 1,
  });
});
