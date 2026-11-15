import bcrypt from "bcryptjs";
import mongoose from "mongoose";
import { env } from "./config/env.js";
import { type Role } from "./config/rbac.js";
import { AuditLog } from "./models/AuditLog.js";
import { Project } from "./models/Project.js";
import { User } from "./models/User.js";
import { WorkspaceSetting } from "./models/WorkspaceSetting.js";

interface SeedAccount {
  name: string;
  email: string;
  password: string;
  role: Role;
}

const SEED_ACCOUNTS: SeedAccount[] = [
  {
    name: "Admin User",
    email: "admin@enterprise.dev",
    password: "Admin@12345",
    role: "admin",
  },
  {
    name: "Operations Manager",
    email: "manager@enterprise.dev",
    password: "Manager@12345",
    role: "manager",
  },
  {
    name: "Read-Only Viewer",
    email: "viewer@enterprise.dev",
    password: "Viewer@12345",
    role: "viewer",
  },
];

async function seed(): Promise<void> {
  await mongoose.connect(env.MONGODB_URI, { serverSelectionTimeoutMS: 8000 });

  const seededUsers = new Map<string, mongoose.Types.ObjectId>();

  for (const account of SEED_ACCOUNTS) {
    const passwordHash = await bcrypt.hash(account.password, 10);
    const userDoc = await User.findOneAndUpdate(
      { email: account.email },
      {
        name: account.name,
        email: account.email,
        passwordHash,
        role: account.role,
        status: "active",
      },
      { upsert: true, returnDocument: "after" },
    );
    seededUsers.set(account.role, userDoc._id);
  }

  await WorkspaceSetting.findOneAndUpdate(
    { key: "default" },
    { $setOnInsert: { key: "default", organizationName: "Veridian Enterprise" } },
    { upsert: true, returnDocument: "after" },
  );

  const existingProjects = await Project.countDocuments();
  if (existingProjects === 0) {
    const adminId = seededUsers.get("admin")!;
    const managerId = seededUsers.get("manager")!;

    await Project.insertMany([
      {
        name: "Zero-Trust Identity Gateway",
        description: "Deploy rotating refresh tokens and CSRF verification across workspace services.",
        category: "security",
        status: "completed",
        priority: "high",
        tasksTotal: 18,
        tasksCompleted: 18,
        progress: 100,
        dueDate: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000),
        ownerId: adminId,
      },
      {
        name: "Admin Console UI System",
        description: "Build accessible light-bento dashboard primitives and chart telemetry views.",
        category: "design",
        status: "in_progress",
        priority: "medium",
        tasksTotal: 14,
        tasksCompleted: 9,
        progress: 64,
        dueDate: new Date(Date.now() + 14 * 24 * 60 * 60 * 1000),
        ownerId: managerId,
      },
      {
        name: "Directory & Role API Sync",
        description: "End-to-end CRUD and Mongoose aggregation layer for user administration.",
        category: "development",
        status: "in_progress",
        priority: "high",
        tasksTotal: 20,
        tasksCompleted: 16,
        progress: 80,
        dueDate: new Date(Date.now() + 10 * 24 * 60 * 60 * 1000),
        ownerId: adminId,
      },
      {
        name: "Automated Auth QA Suite",
        description: "Integration coverage for RBAC routes, token reuse protection, and form guards.",
        category: "testing",
        status: "in_progress",
        priority: "medium",
        tasksTotal: 12,
        tasksCompleted: 9,
        progress: 75,
        dueDate: new Date(Date.now() + 21 * 24 * 60 * 60 * 1000),
        ownerId: managerId,
      },
      {
        name: "Compliance Archive Pipeline",
        description: "Scheduled export packs and audit retention checks for governance reviews.",
        category: "development",
        status: "upcoming",
        priority: "low",
        tasksTotal: 10,
        tasksCompleted: 2,
        progress: 20,
        dueDate: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000),
        ownerId: adminId,
      },
    ]);
  }

  const existingLogs = await AuditLog.countDocuments();
  if (existingLogs === 0) {
    const adminId = seededUsers.get("admin")!;
    const dayMs = 24 * 60 * 60 * 1000;
    const now = Date.now();
    await AuditLog.insertMany([
      {
        actorId: adminId,
        actorName: "Admin User",
        actorEmail: "admin@enterprise.dev",
        actorRole: "admin",
        action: "auth.login",
        resourceType: "auth",
        summary: "Workspace baseline verification sign-in",
        createdAt: new Date(now - 3 * dayMs),
        updatedAt: new Date(now - 3 * dayMs),
      },
      {
        actorId: adminId,
        actorName: "Admin User",
        actorEmail: "admin@enterprise.dev",
        actorRole: "admin",
        action: "project.created",
        resourceType: "project",
        summary: 'Initialized project "Zero-Trust Identity Gateway"',
        createdAt: new Date(now - 2 * dayMs),
        updatedAt: new Date(now - 2 * dayMs),
      },
      {
        actorId: adminId,
        actorName: "Admin User",
        actorEmail: "admin@enterprise.dev",
        actorRole: "admin",
        action: "settings.updated",
        resourceType: "settings",
        summary: "Configured baseline security policy",
        createdAt: new Date(now - 1 * dayMs),
        updatedAt: new Date(now - 1 * dayMs),
      },
    ]);
  }

  console.log(`Seeded ${SEED_ACCOUNTS.length} enterprise accounts and baseline projects.`);
  await mongoose.disconnect();
}

seed().catch((err) => {
  console.error("Seed failed:", err);
  process.exit(1);
});
