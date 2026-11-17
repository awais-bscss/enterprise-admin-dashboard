import bcrypt from "bcryptjs";
import mongoose from "mongoose";
import { z } from "zod";
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

const optionalSeedString = z
  .string()
  .trim()
  .optional()
  .transform((val) => (val && val.length > 0 ? val : undefined));

const seedEnvSchema = z
  .object({
    SEED_ADMIN_NAME: optionalSeedString,
    SEED_ADMIN_EMAIL: z.string().trim().email("SEED_ADMIN_EMAIL must be a valid email"),
    SEED_ADMIN_PASSWORD: z
      .string()
      .min(8, "SEED_ADMIN_PASSWORD must be at least 8 characters"),
    SEED_MANAGER_NAME: optionalSeedString,
    SEED_MANAGER_EMAIL: optionalSeedString,
    SEED_MANAGER_PASSWORD: z.string().optional(),
    SEED_VIEWER_NAME: optionalSeedString,
    SEED_VIEWER_EMAIL: optionalSeedString,
    SEED_VIEWER_PASSWORD: z.string().optional(),
  })
  .superRefine((data, ctx) => {
    const optionalRoles: Array<{
      prefix: string;
      email?: string;
      password?: string;
    }> = [
      {
        prefix: "SEED_MANAGER",
        email: data.SEED_MANAGER_EMAIL,
        password: data.SEED_MANAGER_PASSWORD,
      },
      {
        prefix: "SEED_VIEWER",
        email: data.SEED_VIEWER_EMAIL,
        password: data.SEED_VIEWER_PASSWORD,
      },
    ];

    for (const entry of optionalRoles) {
      const hasEmail = Boolean(entry.email);
      const hasPassword = Boolean(entry.password && entry.password.length > 0);
      if (hasEmail !== hasPassword) {
        ctx.addIssue({
          code: z.ZodIssueCode.custom,
          message: `Both ${entry.prefix}_EMAIL and ${entry.prefix}_PASSWORD are required together`,
        });
      }
      if (hasEmail && entry.email && !z.string().email().safeParse(entry.email).success) {
        ctx.addIssue({
          code: z.ZodIssueCode.custom,
          message: `${entry.prefix}_EMAIL must be a valid email`,
        });
      }
      if (hasPassword && entry.password && entry.password.length < 8) {
        ctx.addIssue({
          code: z.ZodIssueCode.custom,
          message: `${entry.prefix}_PASSWORD must be at least 8 characters`,
        });
      }
    }
  });

function resolveSeedAccounts(): SeedAccount[] {
  const parsed = seedEnvSchema.safeParse(process.env);
  if (!parsed.success) {
    const details = parsed.error.issues.map((issue) => issue.message).join("; ");
    throw new Error(
      `Missing or invalid seed environment variables (${details}). Configure them in apps/api/.env before running seed.`,
    );
  }

  const data = parsed.data;
  const accounts: SeedAccount[] = [
    {
      name: data.SEED_ADMIN_NAME ?? "Workspace Admin",
      email: data.SEED_ADMIN_EMAIL.toLowerCase(),
      password: data.SEED_ADMIN_PASSWORD,
      role: "admin",
    },
  ];

  if (data.SEED_MANAGER_EMAIL && data.SEED_MANAGER_PASSWORD) {
    accounts.push({
      name: data.SEED_MANAGER_NAME ?? "Operations Manager",
      email: data.SEED_MANAGER_EMAIL.toLowerCase(),
      password: data.SEED_MANAGER_PASSWORD,
      role: "manager",
    });
  }

  if (data.SEED_VIEWER_EMAIL && data.SEED_VIEWER_PASSWORD) {
    accounts.push({
      name: data.SEED_VIEWER_NAME ?? "Workspace Viewer",
      email: data.SEED_VIEWER_EMAIL.toLowerCase(),
      password: data.SEED_VIEWER_PASSWORD,
      role: "viewer",
    });
  }

  return accounts;
}

async function seed(): Promise<void> {
  const accounts = resolveSeedAccounts();
  await mongoose.connect(env.MONGODB_URI, { serverSelectionTimeoutMS: 8000 });

  const seededUsers = new Map<Role, mongoose.Types.ObjectId>();

  for (const account of accounts) {
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

  const adminAccount = accounts[0]!;
  const adminId = seededUsers.get("admin")!;
  const managerId = seededUsers.get("manager") ?? adminId;

  await WorkspaceSetting.findOneAndUpdate(
    { key: "default" },
    { $setOnInsert: { key: "default", organizationName: "Veridian Enterprise" } },
    { upsert: true, returnDocument: "after" },
  );

  const existingProjects = await Project.countDocuments();
  if (existingProjects === 0) {

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
    const dayMs = 24 * 60 * 60 * 1000;
    const now = Date.now();
    await AuditLog.insertMany([
      {
        actorId: adminId,
        actorName: adminAccount.name,
        actorEmail: adminAccount.email,
        actorRole: "admin",
        action: "auth.login",
        resourceType: "auth",
        summary: "Workspace baseline verification sign-in",
        createdAt: new Date(now - 3 * dayMs),
        updatedAt: new Date(now - 3 * dayMs),
      },
      {
        actorId: adminId,
        actorName: adminAccount.name,
        actorEmail: adminAccount.email,
        actorRole: "admin",
        action: "project.created",
        resourceType: "project",
        summary: 'Initialized project "Zero-Trust Identity Gateway"',
        createdAt: new Date(now - 2 * dayMs),
        updatedAt: new Date(now - 2 * dayMs),
      },
      {
        actorId: adminId,
        actorName: adminAccount.name,
        actorEmail: adminAccount.email,
        actorRole: "admin",
        action: "settings.updated",
        resourceType: "settings",
        summary: "Configured baseline security policy",
        createdAt: new Date(now - 1 * dayMs),
        updatedAt: new Date(now - 1 * dayMs),
      },
    ]);
  }

  console.log(`Seeded ${accounts.length} enterprise accounts and baseline projects.`);
  await mongoose.disconnect();
}

seed().catch((err) => {
  console.error("Seed failed:", err);
  process.exit(1);
});
