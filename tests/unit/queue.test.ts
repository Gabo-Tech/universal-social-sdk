import { describe, expect, it } from "vitest";
import {
  InMemoryQueueAdapter,
  getQueueAdapter,
  resetQueueAdapter,
  setQueueAdapter
} from "../../src/queue/index.js";
import { cancelScheduledTask, scheduleTask } from "../../src/utils/scheduler.js";

describe("queue adapter registry", () => {
  it("uses and resets adapter instances", () => {
    const custom = new InMemoryQueueAdapter();
    setQueueAdapter(custom);
    expect(getQueueAdapter()).toBe(custom);
    resetQueueAdapter();
    expect(getQueueAdapter()).not.toBe(custom);
  });
});

describe("scheduler integration", () => {
  it("schedules and executes tasks through queue adapter", async () => {
    resetQueueAdapter();
    const result = await scheduleTask({
      id: "job-1",
      runAt: new Date(Date.now() + 5),
      task: async () => "done"
    });
    expect(result).toBe("done");
  });

  it("cancels queued job before execution", async () => {
    resetQueueAdapter();
    let executed = false;
    const pending = scheduleTask({
      id: "job-2",
      runAt: new Date(Date.now() + 100),
      task: async () => {
        executed = true;
        return "should-not-run";
      }
    }).catch(() => undefined);

    const cancelled = cancelScheduledTask("job-2");
    expect(cancelled).toBe(true);

    await new Promise((resolve) => setTimeout(resolve, 120));
    expect(executed).toBe(false);

    await pending;
  });
});
