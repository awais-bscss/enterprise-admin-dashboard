import {
  executeWorkerTask,
  type WorkerRequestMessage,
  type WorkerResponseMessage,
} from './reportSerializer';

const workerScope = self as unknown as {
  onmessage: ((event: MessageEvent<WorkerRequestMessage>) => void) | null;
  postMessage: (message: WorkerResponseMessage) => void;
};

workerScope.onmessage = (event) => {
  const { id, task } = event.data;
  try {
    const text = executeWorkerTask(task);
    workerScope.postMessage({ id, ok: true, text });
  } catch (err) {
    const message = err instanceof Error ? err.message : 'Worker processing failed';
    workerScope.postMessage({ id, ok: false, error: message });
  }
};
