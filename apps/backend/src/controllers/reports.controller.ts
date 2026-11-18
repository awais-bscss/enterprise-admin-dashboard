import type { Request, Response } from "express";
import { Client } from "../models/Client.js";
import { Department } from "../models/Department.js";
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

  const [projects, users, departments, clients] = await Promise.all([
    Project.find()
      .select("name departmentId clientId status priority progress ownerId memberIds")
      .sort({ createdAt: -1 })
      .lean(),
    User.find().select("name email role status createdAt").sort({ createdAt: -1 }).lean(),
    Department.find().select("_id name code").lean(),
    Client.find().select("_id name company").lean(),
  ]);

  await recordAuditEvent({
    actor: req.auth!,
    action: "report.exported",
    resourceType: "report",
    summary: `Exported governance report (${format.toUpperCase()}, ${projects.length} projects, ${users.length} users)`,
  });

  const deptNameById = new Map(departments.map((d) => [String(d._id), d.name]));
  const clientNameById = new Map(clients.map((c) => [String(c._id), c.company]));
  const assigneeNameById = new Map(users.map((user) => [String(user._id), user.name]));

  const resolveProjectTeam = (project: (typeof projects)[number]) => {
    const lead = assigneeNameById.get(String(project.ownerId)) ?? "Unassigned";
    const collaborators = (project.memberIds ?? [])
      .map((memberId) => assigneeNameById.get(String(memberId)))
      .filter((name): name is string => Boolean(name && name !== lead));
    return {
      lead,
      team: [lead, ...Array.from(new Set(collaborators))],
    };
  };

  if (format === "csv") {
    const header = [
      "Name",
      "Department",
      "Client",
      "Status",
      "Priority",
      "Progress%",
      "Project Lead",
      "Team Size",
      "Assigned Team",
    ].join(",");
    const rows = projects.map((project) => {
      const { lead, team } = resolveProjectTeam(project);
      const deptName = project.departmentId
        ? (deptNameById.get(String(project.departmentId)) ?? "Unassigned")
        : "Unassigned";
      const clientName = project.clientId
        ? (clientNameById.get(String(project.clientId)) ?? "--")
        : "--";
      return [
        csvCell(project.name),
        csvCell(deptName),
        csvCell(clientName),
        csvCell(project.status),
        csvCell(project.priority),
        csvCell(project.progress),
        csvCell(lead),
        csvCell(team.length),
        csvCell(team.join("; ")),
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
      projects: projects.map((p) => {
        const { lead, team } = resolveProjectTeam(p);
        return {
          id: String(p._id),
          name: p.name,
          department: p.departmentId ? (deptNameById.get(String(p.departmentId)) ?? null) : null,
          client: p.clientId ? (clientNameById.get(String(p.clientId)) ?? null) : null,
          assignedEmployee: lead,
          teamSize: team.length,
          assignedTeam: team,
          status: p.status,
          priority: p.priority,
          progress: p.progress,
        };
      }),
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
