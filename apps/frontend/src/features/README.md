# Features (`src/features`)

Feature folders organize each page along with its page-specific modals, rows, charts, and tests.

## Folders

| Folder | Main Files | Purpose |
| --- | --- | --- |
| `auth/` | `AuthProvider.tsx`, `LoginPage.tsx`, `ProtectedRoute.tsx`, `PermissionGate.tsx`, `ProfileModal.tsx`, `UnauthorizedPage.tsx`, `routePermissions.ts` | Login state, route guards, button-level permission checks, and profile updates |
| `dashboard/` | `DashboardPage.tsx`, `components/*` (`StatBentoCard.tsx`, `DeadlineAlertsSection.tsx`, `DashboardChartsGrid.tsx`, `StatusDonutCard.tsx`, `AccessCoverageChartCard.tsx`, `AuthActivityTrendCard.tsx`, `EmployeeStatusChartCard.tsx`, `DirectoryStatusDonutCard.tsx`, `ChartCardFrame.tsx`) | Main overview page with KPI summary cards, deadline alerts, and custom SVG charts |
| `projects/` | `ProjectsPage.tsx`, `ProjectFormModal.tsx`, `ProjectTableRow.tsx` | Project list, status/department/client filters, sorting, and create/edit modal |
| `departments/` | `DepartmentsPage.tsx`, `DepartmentFormModal.tsx` | Department cards/directory with linked counts to employees and projects |
| `clients/` | `ClientsPage.tsx`, `ClientFormModal.tsx` | Client directory with create/edit form and linked project drill-down |
| `directory/` | `DirectoryPage.tsx`, `EmployeeTableRow.tsx`, `UserFormModal.tsx` | Employee directory, status/role filters, and admin user account modal |
| `workspace/` | `AuditLogsPage.tsx`, `ReportsPage.tsx` | Audit activity viewer and CSV/JSON report generator |

## Tests Inside `features/`

Integration and permission tests live beside the feature they test (`LoginPage.integration.test.tsx`, `ProtectedRoute.test.tsx`, `routePermissions.test.ts`, `DashboardPage.integration.test.tsx`, `WorkspaceDirectories.integration.test.tsx`, and `ProjectsPage.integration.test.tsx`).
