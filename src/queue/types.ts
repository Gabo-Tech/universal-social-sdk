export interface QueueJob<T = unknown> {
  id: string;
  task: () => Promise<T>;
}

export interface QueueJobHandle<T = unknown> {
  id: string;
  result: Promise<T>;
}

export interface QueueAdapter {
  enqueue<T>(job: QueueJob<T>): Promise<QueueJobHandle<T>>;
  schedule<T>(
    job: QueueJob<T>,
    runAt: Date | string
  ): Promise<QueueJobHandle<T>>;
  cancel(jobId: string): boolean;
}
