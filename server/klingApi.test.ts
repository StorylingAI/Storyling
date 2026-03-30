import { describe, it, expect } from "vitest";
import { createVideoTask, queryVideoTask } from "./klingApi";

describe("Kling API Integration", () => {
  it("should successfully create a video task with valid credentials", async () => {
    // Test with a simple prompt
    const result = await createVideoTask("A beautiful sunset over the ocean");

    expect(result).toBeDefined();
    expect(result.taskId).toBeDefined();
    expect(typeof result.taskId).toBe("string");
    expect(result.taskId.length).toBeGreaterThan(0);

    console.log("✅ Kling API credentials are valid. Task ID:", result.taskId);
  }, 30000); // 30 second timeout

  it("should query the created task status", async () => {
    // First create a task
    const createResult = await createVideoTask("A serene mountain landscape");
    const taskId = createResult.taskId;

    // Then query it
    const queryResult = await queryVideoTask(taskId);

    expect(queryResult).toBeDefined();
    expect(queryResult.status).toBeDefined();
    expect(["submitted", "processing", "succeed", "failed"]).toContain(queryResult.status);

    console.log("✅ Task status query successful. Status:", queryResult.status);
  }, 30000);
});
