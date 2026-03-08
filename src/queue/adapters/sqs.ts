import type { QueueAdapter, QueueJob, QueueJobHandle } from "../types.js";

export class SQSAdapter implements QueueAdapter {
  async enqueue<T>(job: QueueJob<T>): Promise<QueueJobHandle<T>> {
    throw new Error(
      `SQSAdapter.enqueue is a skeleton. Implement integration for job ${job.id}.`
    );
  }

  async schedule<T>(
    job: QueueJob<T>,
    _runAt: Date | string
  ): Promise<QueueJobHandle<T>> {
    throw new Error(
      `SQSAdapter.schedule is a skeleton. Implement integration for job ${job.id}.`
    );
  }

  cancel(_jobId: string): boolean {
    throw new Error(
      "SQSAdapter.cancel is a skeleton. Implement cancellation strategy for queued messages."
    );
  }
}
