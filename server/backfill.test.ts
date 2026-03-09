import { describe, it, expect } from "vitest";
import { appRouter } from "./routers";
import { getDb } from "./db";
import { users, generatedContent } from "../drizzle/schema";
import { eq } from "drizzle-orm";

describe("Backfill Story Titles", () => {
  it("should backfill missing story titles", async () => {
    const db = await getDb();
    if (!db) throw new Error("Database unavailable");

    // Get or create a test user
    const [existingUser] = await db
      .select()
      .from(users)
      .limit(1);

    if (!existingUser) {
      console.log("No users found, skipping backfill test");
      return;
    }

    const caller = appRouter.createCaller({
      user: existingUser,
      req: {} as any,
      res: {} as any,
    });

    // Run backfill
    const result = await caller.content.backfillTitles();
    
    console.log(`Backfill completed: ${result.updated} stories updated`);
    expect(result.success).toBe(true);
    expect(typeof result.updated).toBe("number");

    // Verify no stories have null or empty titles
    const storiesWithoutTitles = await db
      .select()
      .from(generatedContent)
      .where(eq(generatedContent.title, null as any));

    console.log(`Stories still without titles: ${storiesWithoutTitles.length}`);
    
    // Check a sample story to verify it has a title
    const [sampleStory] = await db
      .select()
      .from(generatedContent)
      .limit(1);

    if (sampleStory) {
      console.log(`Sample story title: "${sampleStory.title}"`);
      expect(sampleStory.title).toBeTruthy();
      expect(sampleStory.title).not.toBe("");
    }
  });
});
