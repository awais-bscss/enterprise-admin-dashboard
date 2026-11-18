import assert from "node:assert/strict";
import test from "node:test";
import mongoose from "mongoose";
import {
  buildProjectFilter,
  buildProjectListPipeline,
  createProjectSchema,
  resolveProgress,
  serializeProject,
} from "../src/utils/projectHelpers.js";

test("resolveProgress forces 100 on completed status and clamps bounds", () => {
  assert.equal(resolveProgress("completed", 40), 100);
  assert.equal(resolveProgress("in_progress", -15), 0);
  assert.equal(resolveProgress("in_progress", 142), 100);
  assert.equal(resolveProgress("upcoming", 37.6), 38);
});

test("serializeProject deduplicates owner from working team and maps nested refs", () => {
  const ownerId = new mongoose.Types.ObjectId();
  const memberId = new mongoose.Types.ObjectId();
  const deptId = new mongoose.Types.ObjectId();
  const clientId = new mongoose.Types.ObjectId();
  const projectId = new mongoose.Types.ObjectId();
  const now = new Date("2026-11-18T10:00:00.000Z");

  const dto = serializeProject({
    _id: projectId,
    name: "Edge Gateway",
    description: "Strict policy routing",
    departmentId: { _id: deptId, name: "Security", code: "SEC" },
    clientId: { _id: clientId, name: "Elena", company: "Northstar" },
    status: "in_progress",
    progress: 70,
    priority: "high",
    dueDate: new Date("2026-11-25T00:00:00.000Z"),
    ownerId: { _id: ownerId, name: "Alex", email: "alex@corp.dev", role: "admin" },
    memberIds: [
      { _id: ownerId, name: "Alex", email: "alex@corp.dev", role: "admin" },
      { _id: memberId, name: "Samira", email: "samira@corp.dev", role: "manager" },
    ],
    createdAt: now,
    updatedAt: now,
  });

  assert.equal(dto.id, String(projectId));
  assert.equal(dto.department?.code, "SEC");
  assert.equal(dto.client?.company, "Northstar");
  assert.equal(dto.owner.id, String(ownerId));
  assert.equal(dto.members.length, 1);
  assert.equal(dto.members[0]?.id, String(memberId));
});

test("buildProjectFilter builds safe combined filters and ignores malformed ObjectIds", () => {
  const deptId = new mongoose.Types.ObjectId().toString();
  const clientId = new mongoose.Types.ObjectId().toString();
  const ownerId = new mongoose.Types.ObjectId().toString();

  const filter = buildProjectFilter({
    q: "zero.trust[v2]",
    departmentId: deptId,
    clientId,
    ownerId,
    status: "in_progress",
  }) as { $and: Record<string, unknown>[] };

  assert.equal(filter.$and.length, 5);
  assert.deepEqual(filter.$and[1], { departmentId: new mongoose.Types.ObjectId(deptId) });
  assert.deepEqual(filter.$and[2], { clientId: new mongoose.Types.ObjectId(clientId) });
  assert.deepEqual(filter.$and[3], {
    $or: [
      { ownerId: new mongoose.Types.ObjectId(ownerId) },
      { memberIds: new mongoose.Types.ObjectId(ownerId) },
    ],
  });

  const emptyInvalid = buildProjectFilter({
    departmentId: "not-an-id",
    clientId: "invalid",
    ownerId: "bad",
    status: "archived",
  });
  assert.deepEqual(emptyInvalid, {});
});

test("buildProjectListPipeline orders nearest deadlines with null dueDates last", () => {
  const deadlinePipeline = buildProjectListPipeline({}, "deadline", 0, 8);
  assert.equal(
    deadlinePipeline.some((stage) => "$addFields" in stage && "missingDueDate" in stage.$addFields),
    true,
  );

  const progressPipeline = buildProjectListPipeline({}, "progress", 8, 8);
  assert.equal(
    progressPipeline.some(
      (stage) => "$sort" in stage && (stage.$sort as Record<string, number>).progress === -1,
    ),
    true,
  );
});

test("createProjectSchema validates length and normalizes dueDate", () => {
  const parsed = createProjectSchema.parse({
    name: "Zero-Trust Portal",
    description: "Auth gateway",
    dueDate: "2026-12-01T00:00:00.000Z",
  });
  assert.equal(parsed.status, "in_progress");
  assert.equal(parsed.dueDate instanceof Date, true);

  const invalid = createProjectSchema.safeParse({ name: "A" });
  assert.equal(invalid.success, false);
});
