import { InMemoryQueueAdapter } from "./adapters/inMemory.js";
import type { QueueAdapter } from "./types.js";

let queueAdapter: QueueAdapter = new InMemoryQueueAdapter();

export function setQueueAdapter(adapter: QueueAdapter): void {
  queueAdapter = adapter;
}

export function getQueueAdapter(): QueueAdapter {
  return queueAdapter;
}

export function resetQueueAdapter(): void {
  queueAdapter = new InMemoryQueueAdapter();
}
