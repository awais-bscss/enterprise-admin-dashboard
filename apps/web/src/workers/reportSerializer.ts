export type WorkerTask =
  | {
      type: 'FORMAT_JSON_REPORT';
      payload: Record<string, unknown>;
    }
  | {
      type: 'BUILD_CSV_REPORT';
      headers: readonly string[];
      rows: readonly (readonly (string | number | boolean | null | undefined)[])[];
    };

export interface WorkerRequestMessage {
  id: number;
  task: WorkerTask;
}

export type WorkerResponseMessage =
  | {
      id: number;
      ok: true;
      text: string;
    }
  | {
      id: number;
      ok: false;
      error: string;
    };

function escapeCsvCell(value: unknown): string {
  const raw = String(value ?? '');
  const safe = /^[=+\-@\t\r]/.test(raw) ? `'${raw}` : raw;
  return `"${safe.replace(/"/g, '""')}"`;
}

export function executeWorkerTask(task: WorkerTask): string {
  if (task.type === 'FORMAT_JSON_REPORT') {
    return JSON.stringify(task.payload, null, 2);
  }

  const headerLine = task.headers.map(escapeCsvCell).join(',');
  const rowLines = task.rows.map((row) => row.map(escapeCsvCell).join(','));
  return [headerLine, ...rowLines].join('\n');
}
