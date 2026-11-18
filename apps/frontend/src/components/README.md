# Shared UI Components (`src/components`)

Reusable layout, feedback, filter, and modal components shared across all feature pages.

## Layout & App Chrome

- `layout/DashboardLayout.tsx` — responsive sidebar/drawer, header navigation, theme toggle, user menu, and main content wrapper
- `ErrorBoundary.tsx` — catches unexpected React rendering errors and offers a clean recovery screen
- `toast/ToastProvider.tsx` & `toast/toastContext.ts` — global toast notifications for success and error actions

## Tables, Filters & Navigation Controls

- `AppDropdown.tsx` & `dropdown/` (`DropdownPortal.tsx`, `useDropdownMenuState.ts`) — accessible single/multi-select portal dropdowns with built-in search filtering and dark-mode styling
- `SearchInput.tsx` — shared search field with clear button
- `PaginationControls.tsx` — accessible page navigation buttons and count label
- `StatusSummaryCards.tsx` — reusable summary strip above directories
- `LinkedCountPill.tsx` — clickable count badge for drilling down into filtered employees or projects

## Loading, Errors & Dialogs

- `WorkspaceLoader.tsx` & `WorkspaceSkeletons.tsx` — initial route loader and table/card skeleton placeholders
- `ErrorAlertBanner.tsx` — API error banner with a retry button
- `ConfirmDeleteModal.tsx` — confirmation dialog before deleting records
