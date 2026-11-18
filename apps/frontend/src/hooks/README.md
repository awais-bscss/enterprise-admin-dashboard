# Custom Hooks (`src/hooks`)

Reusable hooks separate data fetching, form validation/submission, and URL filter state from UI components.

## Workspace & Data Hooks

- `useDashboardOverview.ts` — fetches combined metrics, deadline alerts, and chart data from `/api/dashboard`
- `useProjectsWorkspace.ts` — fetches project lists with filters, sorting, pagination, and delete mutations
- `useDepartmentsWorkspace.ts` — manages department listing and updates
- `useClientsWorkspace.ts` — manages client listing and updates
- `useUsersDirectory.ts` — manages employee directory queries and user updates
- `useEntityDirectory.ts` — shared helper pattern used by directory workspaces (pagination, filtering, search, summary counts)
- `useWorkspaceOptions.ts` — loads dropdown options (departments, clients, employees) for forms and filters
- `useAuditLogs.ts` — fetches paginated audit log entries
- `useReportsWorkspace.ts` — loads report data and triggers CSV/JSON formatting through the Web Worker

## Form Hooks

- `useLoginForm.ts` — handles email/password validation and login submission
- `useProfileForm.ts` — handles profile editing inside `ProfileModal`
- `useProjectForm.ts`, `useDepartmentForm.ts`, `useClientForm.ts`, `useUserForm.ts` — manage modal state, client validation, and create/edit mutations

## UI & State Utility Hooks

- `useUrlQueryState.ts` — syncs table filters, search, and page numbers with URL query parameters
- `useDebouncedSearch.ts` — delays search input updates so typing does not fire an API call on every keystroke
- `useModalScrollLock.ts` — prevents background page scrolling while a modal dialog is open
