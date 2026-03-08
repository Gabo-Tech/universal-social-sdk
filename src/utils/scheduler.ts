import { getQueueAdapter } from "../queue/index.js";

export function scheduleTask<T>(params: {
  id: string;
  runAt: Date | string;
  task: () => Promise<T>;
}): Promise<T> {
  return getQueueAdapter()
    .schedule(
      {
        id: params.id,
        task: params.task
      },
      params.runAt
    )
    .then((handle) => handle.result);
}

export function cancelScheduledTask(id: string): boolean {
  return getQueueAdapter().cancel(id);
}
