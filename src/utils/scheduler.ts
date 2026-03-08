const scheduledJobs = new Map<string, NodeJS.Timeout>();

function toDate(value: Date | string): Date {
  if (value instanceof Date) {
    return value;
  }
  return new Date(value);
}

export function scheduleTask<T>(params: {
  id: string;
  runAt: Date | string;
  task: () => Promise<T>;
}): Promise<T> {
  const runAt = toDate(params.runAt).getTime();
  const delay = Math.max(0, runAt - Date.now());

  return new Promise((resolve, reject) => {
    const timeout = setTimeout(async () => {
      scheduledJobs.delete(params.id);
      try {
        resolve(await params.task());
      } catch (error) {
        reject(error);
      }
    }, delay);

    scheduledJobs.set(params.id, timeout);
  });
}

export function cancelScheduledTask(id: string): boolean {
  const timeout = scheduledJobs.get(id);
  if (!timeout) {
    return false;
  }
  clearTimeout(timeout);
  scheduledJobs.delete(id);
  return true;
}
