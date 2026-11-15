import bcrypt from "bcryptjs";
import mongoose from "mongoose";
import { env } from "./config/env.js";
import { type Role } from "./config/rbac.js";
import { User } from "./models/User.js";

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

  for (const account of SEED_ACCOUNTS) {
    const passwordHash = await bcrypt.hash(account.password, 10);
    await User.findOneAndUpdate(
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
  }

  console.log(`Seeded ${SEED_ACCOUNTS.length} enterprise user accounts.`);
  await mongoose.disconnect();
}

seed().catch((err) => {
  console.error("Seed failed:", err);
  process.exit(1);
});
