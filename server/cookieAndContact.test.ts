import { describe, it, expect, beforeEach } from "vitest";
import { appRouter } from "./routers";
import { getDb } from "./db";
import { cookiePreferences } from "../drizzle/schema";
import { eq } from "drizzle-orm";

describe("Cookie Preferences and Contact Form", () => {
  const mockUser = {
    id: 999999,
    openId: "test-cookie-user",
    name: "Test User",
    email: "test@example.com",
    role: "user" as const,
  };

  const createCaller = (user: typeof mockUser | null = null) => {
    return appRouter.createCaller({
      user,
      req: {} as any,
      res: {} as any,
    });
  };

  beforeEach(async () => {
    // Clean up test data
    const db = await getDb();
    if (db) {
      await db.delete(cookiePreferences).where(eq(cookiePreferences.userId, mockUser.id));
    }
  });

  describe("Cookie Preferences", () => {
    it("should return null when no preferences exist", async () => {
      const caller = createCaller(mockUser);
      const result = await caller.cookies.getPreferences();
      expect(result).toBeNull();
    });

    it("should save new cookie preferences", async () => {
      const caller = createCaller(mockUser);
      
      const result = await caller.cookies.savePreferences({
        necessary: true,
        analytics: true,
        marketing: false,
        preferences: true,
      });

      expect(result.success).toBe(true);

      // Verify preferences were saved
      const saved = await caller.cookies.getPreferences();
      expect(saved).not.toBeNull();
      expect(saved?.necessary).toBe(true);
      expect(saved?.analytics).toBe(true);
      expect(saved?.marketing).toBe(false);
      expect(saved?.preferences).toBe(true);
    });

    it("should update existing cookie preferences", async () => {
      const caller = createCaller(mockUser);
      
      // Save initial preferences
      await caller.cookies.savePreferences({
        necessary: true,
        analytics: false,
        marketing: false,
        preferences: false,
      });

      // Update preferences
      await caller.cookies.savePreferences({
        necessary: true,
        analytics: true,
        marketing: true,
        preferences: true,
      });

      // Verify updated preferences
      const updated = await caller.cookies.getPreferences();
      expect(updated?.analytics).toBe(true);
      expect(updated?.marketing).toBe(true);
      expect(updated?.preferences).toBe(true);
    });

    it("should require authentication to save preferences", async () => {
      const caller = createCaller(null);
      
      await expect(
        caller.cookies.savePreferences({
          necessary: true,
          analytics: true,
          marketing: false,
          preferences: true,
        })
      ).rejects.toThrow();
    });
  });

  describe("Contact Form", () => {
    it("should submit contact form successfully", async () => {
      const caller = createCaller(null); // Public procedure, no auth required
      
      const result = await caller.contact.submitContactForm({
        name: "John Doe",
        email: "john@example.com",
        organization: "Test Corp",
        phone: "+1234567890",
        inquiryType: "enterprise",
        message: "I would like to learn more about your enterprise plan.",
      });

      expect(result.success).toBe(true);
    });

    it("should submit contact form without optional fields", async () => {
      const caller = createCaller(null);
      
      const result = await caller.contact.submitContactForm({
        name: "Jane Smith",
        email: "jane@example.com",
        inquiryType: "demo",
        message: "Please schedule a demo for our team.",
      });

      expect(result.success).toBe(true);
    });

    it("should validate required fields", async () => {
      const caller = createCaller(null);
      
      await expect(
        caller.contact.submitContactForm({
          name: "",
          email: "invalid-email",
          inquiryType: "school",
          message: "Short",
        })
      ).rejects.toThrow();
    });

    it("should validate email format", async () => {
      const caller = createCaller(null);
      
      await expect(
        caller.contact.submitContactForm({
          name: "Test User",
          email: "not-an-email",
          inquiryType: "partnership",
          message: "This is a test message that is long enough.",
        })
      ).rejects.toThrow();
    });

    it("should validate message length", async () => {
      const caller = createCaller(null);
      
      await expect(
        caller.contact.submitContactForm({
          name: "Test User",
          email: "test@example.com",
          inquiryType: "other",
          message: "Short",
        })
      ).rejects.toThrow();
    });

    it("should accept all inquiry types", async () => {
      const caller = createCaller(null);
      const inquiryTypes = ["school", "enterprise", "partnership", "demo", "other"] as const;

      for (const type of inquiryTypes) {
        const result = await caller.contact.submitContactForm({
          name: "Test User",
          email: "test@example.com",
          inquiryType: type,
          message: "This is a test message for inquiry type validation.",
        });

        expect(result.success).toBe(true);
      }
    });
  });
});
