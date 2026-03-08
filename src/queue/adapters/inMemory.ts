import type { QueueAdapter, QueueJob, QueueJobHandle } from "../types.js";

function toEpochMs(value: Date | string): number {
  return value instanceof Date ? value.getTime() : new Date(value).getTime();
}

export class InMemoryQueueAdapter implements QueueAdapter {
  private readonly jobs = new Map<
    string,
    { timeout: NodeJS.Timeout; reject: (error: unknown) => void }
  >();

  async enqueue<T>(job: QueueJob<T>): Promise<QueueJobHandle<T>> {
    return this.schedule(job, new Date());
  }

  async schedule<T>(
    job: QueueJob<T>,
    runAt: Date | string
  ): Promise<QueueJobHandle<T>> {
    const targetTime = toEpochMs(runAt);
    const delay = Math.max(0, targetTime - Date.now());

    const result = new Promise<T>((resolve, reject) => {
      const timeout = setTimeout(async () => {
        this.jobs.delete(job.id);
        try {
          resolve(await job.task());
        } catch (error) {
          reject(error);
        }
      }, delay);

      this.jobs.set(job.id, { timeout, reject });
    });

    return {
      id: job.id,
      result
    };
  }

  cancel(jobId: string): boolean {
    const scheduled = this.jobs.get(jobId);
    if (!scheduled) {
      return false;
    }
    clearTimeout(scheduled.timeout);
    this.jobs.delete(jobId);
    scheduled.reject(new Error(`Queue job cancelled: ${jobId}`));
    return true;
  }
}
