import type { QueueAdapter, QueueJob, QueueJobHandle } from "../types.js";

export class BullMQAdapter implements QueueAdapter {
  async enqueue<T>(job: QueueJob<T>): Promise<QueueJobHandle<T>> {
    throw new Error(
      `BullMQAdapter.enqueue is a skeleton. Implement integration for job ${job.id}.`
    );
  }

  async schedule<T>(
    job: QueueJob<T>,
    _runAt: Date | string
  ): Promise<QueueJobHandle<T>> {
    throw new Error(
      `BullMQAdapter.schedule is a skeleton. Implement integration for job ${job.id}.`
    );
  }

  cancel(_jobId: string): boolean {
    throw new Error(
      "BullMQAdapter.cancel is a skeleton. Implement cancellation mapping to BullMQ job IDs."
    );
  }
}
