import {
  executeWorkerTask,
  type WorkerResponseMessage,
  type WorkerTask,
} from '../workers/reportSerializer';

interface PendingJob {
  resolve: (value: string) => void;
  reject: (reason: Error) => void;
}

let workerInstance: Worker | null = null;
let jobCounter = 0;
const pendingJobs = new Map<number, PendingJob>();

function getWorker(): Worker | null {
  if (typeof Worker === 'undefined') return null;
  if (workerInstance) return workerInstance;

  const instance = new Worker(new URL('../workers/workspace.worker.ts', import.meta.url), {
    type: 'module',
  });

  instance.onmessage = (event: MessageEvent<WorkerResponseMessage>) => {
    const payload = event.data;
    const job = pendingJobs.get(payload.id);
    if (!job) return;
    pendingJobs.delete(payload.id);

    if (payload.ok) {
      job.resolve(payload.text);
    } else {
      job.reject(new Error(payload.error));
    }
  };

  instance.onerror = (event) => {
    const error = new Error(event.message || 'Background worker failed.');
    for (const job of pendingJobs.values()) {
      job.reject(error);
    }
    pendingJobs.clear();
    workerInstance = null;
  };

  workerInstance = instance;
  return workerInstance;
}

function runWorkerTask(task: WorkerTask): Promise<string> {
  const worker = getWorker();
  if (!worker) {
    return Promise.resolve(executeWorkerTask(task));
  }

  return new Promise<string>((resolve, reject) => {
    const id = ++jobCounter;
    pendingJobs.set(id, { resolve, reject });
    worker.postMessage({ id, task });
  });
}

export async function formatJsonReportInWorker(
  payload: Record<string, unknown>,
): Promise<Blob> {
  const formatted = await runWorkerTask({ type: 'FORMAT_JSON_REPORT', payload });
  return new Blob([formatted], { type: 'application/json' });
}

export async function buildCsvInWorker(
  headers: readonly string[],
  rows: readonly (readonly (string | number | boolean | null | undefined)[])[],
): Promise<Blob> {
  const csvText = await runWorkerTask({ type: 'BUILD_CSV_REPORT', headers, rows });
  return new Blob([csvText], { type: 'text/csv;charset=utf-8' });
}
