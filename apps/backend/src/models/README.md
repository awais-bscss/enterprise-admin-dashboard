# Models (`src/models`)

Mongoose schemas and indexes for the MongoDB collections used across the API.

## Files

| File | Main Fields & Purpose |
| --- | --- |
| `User.ts` | Employee/user accounts (`name`, unique `email`, hidden `passwordHash`, `role`, `status`, optional `departmentId`) |
| `Project.ts` | Workspace projects (`name`, `description`, `departmentId`, `clientId`, `status`, `progress`, `priority`, `dueDate`, `ownerId`, `memberIds`) |
| `Department.ts` | Organization departments (`name`, unique uppercase `code`, `headName`, `description`, `status`) |
| `Client.ts` | External client accounts (`name`, `company`, unique `email`, `phone`, `status`) |
| `RefreshToken.ts` | Hashed refresh sessions (`userId`, `tokenHash`, `familyId`, `expiresAt` with TTL index, `revokedAt`, `replacedByHash`) |
| `AuditLog.ts` | Security and activity trail (`actorId`, actor snapshot fields, `action`, `resourceType`, `resourceId`, `summary`) |
