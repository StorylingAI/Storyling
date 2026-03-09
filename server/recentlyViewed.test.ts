import { describe, it, expect, beforeEach } from "vitest";
import { getDb } from "./db";
import { recentlyViewed, users } from "../drizzle/schema";
import { eq } from "drizzle-orm";

describe("Recently Viewed Tracking", () => {
  let testUserId: number;

  beforeEach(async () => {
    const db = await getDb();
    if (!db) throw new Error("Database unavailable");

    // Create a test user
    const [user] = await db
      .insert(users)
      .values({
        openId: `test-user-${Date.now()}`,
        name: "Test User",
        email: "test@example.com",
      })
      .$returningId();

    testUserId = user.id;
  });

  it("should track a viewed item", async () => {
    const db = await getDb();
    if (!db) throw new Error("Database unavailable");

    // Insert a recently viewed item
    await db.insert(recentlyViewed).values({
      userId: testUserId,
      itemType: "story",
      itemId: 123,
      itemTitle: "Test Story",
      itemThumbnail: "https://example.com/thumb.jpg",
      viewedAt: new Date(),
    });

    // Verify it was inserted
    const items = await db
      .select()
      .from(recentlyViewed)
      .where(eq(recentlyViewed.userId, testUserId));

    expect(items).toHaveLength(1);
    expect(items[0].itemType).toBe("story");
    expect(items[0].itemId).toBe(123);
    expect(items[0].itemTitle).toBe("Test Story");
  });

  it("should update viewedAt timestamp for existing items", async () => {
    const db = await getDb();
    if (!db) throw new Error("Database unavailable");

    const firstViewTime = new Date("2024-01-01T00:00:00Z");
    
    // Insert initial view
    const [inserted] = await db.insert(recentlyViewed).values({
      userId: testUserId,
      itemType: "collection",
      itemId: 456,
      itemTitle: "Test Collection",
      viewedAt: firstViewTime,
    }).$returningId();

    // Wait a bit and update
    await new Promise(resolve => setTimeout(resolve, 100));
    
    const newViewTime = new Date();
    await db
      .update(recentlyViewed)
      .set({ viewedAt: newViewTime })
      .where(eq(recentlyViewed.id, inserted.id));

    // Verify timestamp was updated
    const [updated] = await db
      .select()
      .from(recentlyViewed)
      .where(eq(recentlyViewed.id, inserted.id));

    expect(updated.viewedAt.getTime()).toBeGreaterThan(firstViewTime.getTime());
  });

  it("should support multiple item types", async () => {
    const db = await getDb();
    if (!db) throw new Error("Database unavailable");

    // Insert different item types
    await db.insert(recentlyViewed).values([
      {
        userId: testUserId,
        itemType: "story",
        itemId: 1,
        itemTitle: "Story 1",
        viewedAt: new Date(),
      },
      {
        userId: testUserId,
        itemType: "collection",
        itemId: 2,
        itemTitle: "Collection 1",
        viewedAt: new Date(),
      },
      {
        userId: testUserId,
        itemType: "wordbank",
        itemId: 3,
        itemTitle: "Wordbank",
        viewedAt: new Date(),
      },
    ]);

    // Verify all types were inserted
    const items = await db
      .select()
      .from(recentlyViewed)
      .where(eq(recentlyViewed.userId, testUserId));

    expect(items).toHaveLength(3);
    expect(items.map(i => i.itemType).sort()).toEqual(["collection", "story", "wordbank"]);
  });

  it("should retrieve items ordered by viewedAt descending", async () => {
    const db = await getDb();
    if (!db) throw new Error("Database unavailable");

    const now = Date.now();
    
    // Insert items with different timestamps
    await db.insert(recentlyViewed).values([
      {
        userId: testUserId,
        itemType: "story",
        itemId: 1,
        itemTitle: "Oldest",
        viewedAt: new Date(now - 3000),
      },
      {
        userId: testUserId,
        itemType: "story",
        itemId: 2,
        itemTitle: "Middle",
        viewedAt: new Date(now - 2000),
      },
      {
        userId: testUserId,
        itemType: "story",
        itemId: 3,
        itemTitle: "Newest",
        viewedAt: new Date(now - 1000),
      },
    ]);

    // Retrieve ordered by viewedAt descending
    const items = await db
      .select()
      .from(recentlyViewed)
      .where(eq(recentlyViewed.userId, testUserId))
      .orderBy(recentlyViewed.viewedAt);

    expect(items[0].itemTitle).toBe("Oldest");
    expect(items[2].itemTitle).toBe("Newest");
  });
});
