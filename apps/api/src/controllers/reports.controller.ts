import type { Request, Response } from "express";
import { Project } from "../models/Project.js";
import { User } from "../models/User.js";
import { recordAuditEvent } from "../utils/audit.js";

function csvCell(value: unknown): string {
  const raw = String(value ?? "");
  const safe = /^[=+\-@\t\r]/.test(raw) ? `'${raw}` : raw;
  return `"${safe.replace(/"/g, '""')}"`;
}

export async function exportComplianceReport(req: Request, res: Response): Promise<void> {
  const format = req.query.format === "csv" ? "csv" : "json";

  const [projects, users] = await Promise.all([
    Project.find().populate("ownerId", "name email").sort({ createdAt: -1 }).lean(),
    User.find().select("name email role status createdAt").sort({ createdAt: -1 }).lean(),
  ]);

  await recordAuditEvent({
    actor: req.auth!,
    action: "report.exported",
    resourceType: "report",
    summary: `Exported governance report (${format.toUpperCase()}, ${projects.length} projects, ${users.length} users)`,
  });

  if (format === "csv") {
    const header = ["Name", "Category", "Status", "Priority", "Progress%", "CompletedTasks", "TotalTasks", "Owner"].join(",");
    const rows = projects.map((project) => {
      const ownerName =
        project.ownerId && typeof project.ownerId === "object" && "name" in project.ownerId
          ? String(project.ownerId.name)
          : "Member";
      return [
        csvCell(project.name),
        csvCell(project.category),
        csvCell(project.status),
        csvCell(project.priority),
        csvCell(project.progress),
        csvCell(project.tasksCompleted),
        csvCell(project.tasksTotal),
        csvCell(ownerName),
      ].join(",");
    });

    res.setHeader("Content-Type", "text/csv; charset=utf-8");
    res.setHeader("Content-Disposition", 'attachment; filename="enterprise-compliance-report.csv"');
    res.status(200).send([header, ...rows].join("\n"));
    return;
  }

  res.status(200).json({
    ok: true,
    data: {
      generatedAt: new Date().toISOString(),
      summary: {
        totalProjects: projects.length,
        completedProjects: projects.filter((p) => p.status === "completed").length,
        totalUsers: users.length,
        activeUsers: users.filter((u) => u.status === "active").length,
      },
      projects: projects.map((p) => ({
        id: String(p._id),
        name: p.name,
        category: p.category,
        status: p.status,
        priority: p.priority,
        progress: p.progress,
        tasksCompleted: p.tasksCompleted,
        tasksTotal: p.tasksTotal,
      })),
      users: users.map((u) => ({
        id: String(u._id),
        name: u.name,
        email: u.email,
        role: u.role,
        status: u.status,
      })),
    },
  });
}
