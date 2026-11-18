import bcrypt from "bcryptjs";
import mongoose from "mongoose";
import { z } from "zod";
import { env } from "./config/env.js";
import { type Role } from "./config/rbac.js";
import { AuditLog } from "./models/AuditLog.js";
import { Client } from "./models/Client.js";
import { Department } from "./models/Department.js";
import { Project } from "./models/Project.js";
import { User } from "./models/User.js";

interface SeedAccount {
  name: string;
  email: string;
  password: string;
  role: Role;
  departmentCode: string;
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
      `Missing or invalid seed environment variables (${details}). Configure them in apps/backend/.env before running seed.`,
    );
  }

  const data = parsed.data;
  const accounts: SeedAccount[] = [
    {
      name: data.SEED_ADMIN_NAME ?? "Workspace Admin",
      email: data.SEED_ADMIN_EMAIL.toLowerCase(),
      password: data.SEED_ADMIN_PASSWORD,
      role: "admin",
      departmentCode: "SEC",
    },
  ];

  if (data.SEED_MANAGER_EMAIL && data.SEED_MANAGER_PASSWORD) {
    accounts.push({
      name: data.SEED_MANAGER_NAME ?? "Operations Manager",
      email: data.SEED_MANAGER_EMAIL.toLowerCase(),
      password: data.SEED_MANAGER_PASSWORD,
      role: "manager",
      departmentCode: "DEVOPS",
    });
  }

  if (data.SEED_VIEWER_EMAIL && data.SEED_VIEWER_PASSWORD) {
    accounts.push({
      name: data.SEED_VIEWER_NAME ?? "Workspace Viewer",
      email: data.SEED_VIEWER_EMAIL.toLowerCase(),
      password: data.SEED_VIEWER_PASSWORD,
      role: "viewer",
      departmentCode: "FE",
    });
  }

  return accounts;
}

const DEFAULT_DEPARTMENTS = [
  {
    name: "Frontend",
    code: "FE",
    headName: "Zainab Ali",
    description: "Client interfaces, component architecture, and web performance.",
    status: "active",
  },
  {
    name: "Backend",
    code: "BE",
    headName: "Hamza Raza",
    description: "REST APIs, data modeling, and distributed server reliability.",
    status: "active",
  },
  {
    name: "DevOps",
    code: "DEVOPS",
    headName: "Bilal Ahmed",
    description: "Cloud infrastructure, CI/CD automation, and deployment operations.",
    status: "active",
  },
  {
    name: "Security",
    code: "SEC",
    headName: "Omar Tariq",
    description: "Application security, RBAC governance, and compliance controls.",
    status: "active",
  },
  {
    name: "SEO",
    code: "SEO",
    headName: "Hira Siddiqui",
    description: "Technical search optimization, crawl health, and organic growth.",
    status: "active",
  },
  {
    name: "UI/UX",
    code: "UIUX",
    headName: "Sara Khan",
    description: "Design systems, user research, prototyping, and accessibility.",
    status: "active",
  },
  {
    name: "AI",
    code: "AI",
    headName: "Usman Farooq",
    description: "Machine learning pipelines, automation models, and data intelligence.",
    status: "active",
  },
  {
    name: "HR",
    code: "HR",
    headName: "Ayesha Malik",
    description: "Talent acquisition, employee onboarding, and people operations.",
    status: "active",
  },
] as const;

async function seed(): Promise<void> {
  const accounts = resolveSeedAccounts();
  await mongoose.connect(env.MONGODB_URI, { serverSelectionTimeoutMS: 8000 });

  await Department.bulkWrite(
    DEFAULT_DEPARTMENTS.map((dept) => ({
      updateOne: {
        filter: { code: dept.code },
        update: { $setOnInsert: dept },
        upsert: true,
      },
    })),
  );

  const departments = await Department.find().select("_id code").lean();
  const deptByCode = new Map(departments.map((d) => [d.code, d._id]));

  const existingClients = await Client.countDocuments();
  if (existingClients === 0) {
    await Client.insertMany([
      {
        name: "Elena Rostova",
        company: "Northstar Logistics",
        email: "elena@northstar-logistics.example",
        phone: "+1-555-0142",
        status: "active",
      },
      {
        name: "Daniel Chen",
        company: "Apex FinTech Group",
        email: "dchen@apexfintech.example",
        phone: "+1-555-0198",
        status: "active",
      },
      {
        name: "Nadia Malik",
        company: "Crescent Health Systems",
        email: "nmalik@crescenthealth.example",
        phone: "+1-555-0175",
        status: "inactive",
      },
    ]);
  }
  const clients = await Client.find().select("_id").sort({ createdAt: 1 }).lean();
  const primaryClientId = clients[0]?._id ?? null;
  const secondaryClientId = clients[1]?._id ?? primaryClientId;

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
        departmentId: deptByCode.get(account.departmentCode) ?? null,
      },
      { upsert: true, returnDocument: "after" },
    );
    seededUsers.set(account.role, userDoc._id);
  }

  const adminAccount = accounts[0]!;
  const adminId = seededUsers.get("admin")!;
  const managerId = seededUsers.get("manager") ?? adminId;

  const existingProjects = await Project.countDocuments();
  if (existingProjects === 0) {
    await Project.insertMany([
      {
        name: "Zero-Trust Identity Gateway",
        description: "Deploy rotating refresh tokens and CSRF verification across workspace services.",
        departmentId: deptByCode.get("SEC") ?? null,
        clientId: primaryClientId,
        status: "completed",
        priority: "high",
        progress: 100,
        dueDate: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000),
        ownerId: adminId,
      },
      {
        name: "Admin Console UI System",
        description: "Build accessible light-bento dashboard primitives and chart telemetry views.",
        departmentId: deptByCode.get("UIUX") ?? null,
        clientId: secondaryClientId,
        status: "in_progress",
        priority: "medium",
        progress: 64,
        dueDate: new Date(Date.now() + 14 * 24 * 60 * 60 * 1000),
        ownerId: managerId,
      },
      {
        name: "Directory & Role API Sync",
        description: "End-to-end CRUD and Mongoose aggregation layer for user administration.",
        departmentId: deptByCode.get("BE") ?? null,
        clientId: primaryClientId,
        status: "in_progress",
        priority: "high",
        progress: 80,
        dueDate: new Date(Date.now() + 10 * 24 * 60 * 60 * 1000),
        ownerId: adminId,
      },
      {
        name: "CI/CD Release Automation",
        description: "Automated deployment pipelines and edge health monitoring workflows.",
        departmentId: deptByCode.get("DEVOPS") ?? null,
        clientId: secondaryClientId,
        status: "in_progress",
        priority: "medium",
        progress: 75,
        dueDate: new Date(Date.now() + 21 * 24 * 60 * 60 * 1000),
        ownerId: managerId,
      },
      {
        name: "Client Portal Frontend v2",
        description: "Responsive client workspace views and performance optimization.",
        departmentId: deptByCode.get("FE") ?? null,
        clientId: primaryClientId,
        status: "upcoming",
        priority: "low",
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
        action: "department.created",
        resourceType: "department",
        summary: 'Created department "Frontend" (FE)',
        createdAt: new Date(now - 1 * dayMs),
        updatedAt: new Date(now - 1 * dayMs),
      },
    ]);
  }

  console.log(`Seeded ${accounts.length} enterprise accounts, projects, departments, and clients.`);
  await mongoose.disconnect();
}

seed().catch((err) => {
  console.error("Seed failed:", err);
  process.exit(1);
});
