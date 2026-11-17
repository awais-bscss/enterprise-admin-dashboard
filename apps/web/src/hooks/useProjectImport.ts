import { useState, type ChangeEvent } from 'react';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { useToast } from '../components/toast/toastContext';
import { getErrorMessage } from '../lib/errors';
import { invalidateWorkspaceQueries } from '../lib/queryKeys';
import { projectsService, type ProjectInput } from '../services/apiService';
import type { ProjectCategory, ProjectPriority, ProjectStatus } from '../types/auth';

const MAX_UPLOAD_BYTES = 90 * 1024;
const MAX_BATCH_ITEMS = 25;
const CATEGORIES: readonly ProjectCategory[] = ['development', 'design', 'testing', 'security'];
const STATUSES: readonly ProjectStatus[] = ['upcoming', 'in_progress', 'completed'];
const PRIORITIES: readonly ProjectPriority[] = ['low', 'medium', 'high'];

const HEADER_ALIAS_MAP: Record<string, string> = {
  name: 'name',
  description: 'description',
  category: 'category',
  status: 'status',
  priority: 'priority',
  taskstotal: 'tasksTotal',
  tasks_total: 'tasksTotal',
  taskscompleted: 'tasksCompleted',
  tasks_completed: 'tasksCompleted',
  duedate: 'dueDate',
  due_date: 'dueDate',
};

function splitCsvLine(line: string): string[] {
  const cells: string[] = [];
  let current = '';
  let inQuotes = false;

  for (let i = 0; i < line.length; i += 1) {
    const ch = line[i];
    if (ch === '"') {
      if (inQuotes && line[i + 1] === '"') {
        current += '"';
        i += 1;
      } else {
        inQuotes = !inQuotes;
      }
      continue;
    }
    if (ch === ',' && !inQuotes) {
      cells.push(current.trim());
      current = '';
      continue;
    }
    current += ch;
  }

  cells.push(current.trim());
  return cells;
}

function normalizeProjectCandidate(raw: unknown): ProjectInput | null {
  if (!raw || typeof raw !== 'object' || Array.isArray(raw)) return null;
  const item = raw as Record<string, unknown>;
  const name = typeof item.name === 'string' ? item.name.trim() : '';
  if (name.length < 2) return null;

  const category = CATEGORIES.includes(item.category as ProjectCategory)
    ? (item.category as ProjectCategory)
    : 'development';
  const status = STATUSES.includes(item.status as ProjectStatus)
    ? (item.status as ProjectStatus)
    : 'in_progress';
  const priority = PRIORITIES.includes(item.priority as ProjectPriority)
    ? (item.priority as ProjectPriority)
    : 'medium';

  const parsedTotal = Math.min(1000, Math.max(1, Number(item.tasksTotal) || 10));
  const parsedDone =
    status === 'completed'
      ? parsedTotal
      : Math.min(parsedTotal, Math.max(0, Number(item.tasksCompleted) || 0));

  return {
    name: name.slice(0, 100),
    description: typeof item.description === 'string' ? item.description.trim().slice(0, 500) : '',
    category,
    status,
    priority,
    tasksTotal: parsedTotal,
    tasksCompleted: parsedDone,
    dueDate: typeof item.dueDate === 'string' && item.dueDate.trim() ? item.dueDate.trim() : null,
  };
}

export function parseProjectsUploadText(
  filename: string,
  text: string,
): { items: ProjectInput[]; skipped: number; error: string | null } {
  const trimmed = text.trim();
  if (!trimmed) {
    return { items: [], skipped: 0, error: 'Selected file is empty.' };
  }

  if (filename.toLowerCase().endsWith('.csv')) {
    const lines = trimmed.split(/\r?\n/).filter((line) => line.trim().length > 0);
    if (lines.length < 2) {
      return {
        items: [],
        skipped: 0,
        error: 'CSV file must include a header row and at least one project row.',
      };
    }

    const headers = splitCsvLine(lines[0]).map(
      (h) => HEADER_ALIAS_MAP[h.toLowerCase()] ?? h,
    );
    const items: ProjectInput[] = [];
    let skipped = 0;

    for (const line of lines.slice(1)) {
      const cells = splitCsvLine(line);
      const rowObject: Record<string, string> = {};
      headers.forEach((header, idx) => {
        rowObject[header] = cells[idx] ?? '';
      });
      const candidate = normalizeProjectCandidate(rowObject);
      if (candidate) {
        items.push(candidate);
      } else {
        skipped += 1;
      }
    }

    return {
      items: items.slice(0, MAX_BATCH_ITEMS),
      skipped: skipped + Math.max(0, items.length - MAX_BATCH_ITEMS),
      error: items.length === 0 ? 'No valid project rows found in CSV file.' : null,
    };
  }

  try {
    const parsed = JSON.parse(trimmed) as unknown;
    const rawList = Array.isArray(parsed)
      ? parsed
      : parsed && typeof parsed === 'object' && Array.isArray((parsed as { projects?: unknown }).projects)
        ? (parsed as { projects: unknown[] }).projects
        : null;

    if (!rawList) {
      return {
        items: [],
        skipped: 0,
        error: 'JSON upload must be an array of projects or { "projects": [...] }.',
      };
    }

    const items: ProjectInput[] = [];
    let skipped = 0;

    for (const entry of rawList) {
      const candidate = normalizeProjectCandidate(entry);
      if (candidate) {
        items.push(candidate);
      } else {
        skipped += 1;
      }
    }

    return {
      items: items.slice(0, MAX_BATCH_ITEMS),
      skipped: skipped + Math.max(0, items.length - MAX_BATCH_ITEMS),
      error: items.length === 0 ? 'No valid project records found in JSON file.' : null,
    };
  } catch {
    return {
      items: [],
      skipped: 0,
      error: 'Unable to parse file. Provide valid .json or .csv content.',
    };
  }
}

export function useProjectImport(onImported: () => void) {
  const queryClient = useQueryClient();
  const toast = useToast();
  const [fileName, setFileName] = useState<string | null>(null);
  const [items, setItems] = useState<ProjectInput[]>([]);
  const [skippedCount, setSkippedCount] = useState(0);
  const [parseError, setParseError] = useState<string | null>(null);

  const importMutation = useMutation({
    mutationFn: (batch: ProjectInput[]) => projectsService.importBatch(batch),
    onSuccess: async (data) => {
      await invalidateWorkspaceQueries(queryClient, ['projects', 'dashboard', 'users', 'audit']);
      toast.success(`Imported ${data.importedCount} project(s).`);
      onImported();
    },
    onError: (err: unknown) => {
      toast.error(getErrorMessage(err, 'Unable to upload project batch.'));
    },
  });

  async function handleFileChange(event: ChangeEvent<HTMLInputElement>) {
    const file = event.target.files?.[0];
    if (!file) return;

    setFileName(file.name);
    setParseError(null);
    setItems([]);
    setSkippedCount(0);

    if (file.size > MAX_UPLOAD_BYTES) {
      setParseError('File exceeds 90 KB limit aligned with API gateway payload limits.');
      return;
    }

    const content = await file.text();
    const parsed = parseProjectsUploadText(file.name, content);
    setItems(parsed.items);
    setSkippedCount(parsed.skipped);
    setParseError(parsed.error);
  }

  async function handleUpload() {
    if (items.length === 0 || parseError) return;
    await importMutation.mutateAsync(items).catch(() => undefined);
  }

  return {
    fileName,
    items,
    skippedCount,
    error:
      parseError ??
      (importMutation.error ? getErrorMessage(importMutation.error, 'Upload failed.') : null),
    uploading: importMutation.isPending,
    handleFileChange,
    handleUpload,
  };
}
