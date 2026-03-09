import { describe, it, expect, beforeEach } from "vitest";
import { appRouter } from "./routers";
import { getDb } from "./db";
import { users, organizations, classes as classesTable, classMembers } from "../drizzle/schema";
import { eq } from "drizzle-orm";

describe("Teacher Dashboard", () => {
  let teacherId: number;
  let studentId: number;
  let orgId: number;
  let classId: number;

  beforeEach(async () => {
    const db = await getDb();
    if (!db) throw new Error("Database unavailable");

    // Clean up test data - delete in correct order due to foreign keys
    await db.delete(classMembers);
    await db.delete(classesTable);
    await db.delete(organizations);
    // Delete all test users
    await db.delete(users).where(eq(users.email, "teacher@test.com"));
    await db.delete(users).where(eq(users.email, "student@test.com"));
    await db.delete(users).where(eq(users.email, "newteacher@test.com"));
    await db.delete(users).where(eq(users.email, "other@test.com"));
    await db.delete(users).where(eq(users.email, "student2@test.com"));

    // Create test teacher
    const [teacher] = await db.insert(users).values({
      openId: "teacher-123",
      name: "Test Teacher",
      email: "teacher@test.com",
      role: "teacher",
    });
    teacherId = teacher.insertId;

    // Create test student
    const [student] = await db.insert(users).values({
      openId: "student-123",
      name: "Test Student",
      email: "student@test.com",
      role: "user",
    });
    studentId = student.insertId;

    // Create test organization
    const [org] = await db.insert(organizations).values({
      name: "Test School",
      type: "school",
      contactEmail: "school@test.com",
    });
    orgId = org.insertId;

    // Create test class
    const [cls] = await db.insert(classesTable).values({
      organizationId: orgId,
      teacherId,
      name: "French A1",
      targetLanguage: "French",
      proficiencyLevel: "A1",
    });
    classId = cls.insertId;
  });

  describe("Class Creation", () => {
    it("should create a class with organization", async () => {
      const caller = appRouter.createCaller({
        user: { id: teacherId, openId: "teacher-123", role: "teacher", name: "Test Teacher", email: "teacher@test.com" },
      });

      const result = await caller.class.create({
        organizationId: orgId,
        name: "Spanish B1",
        targetLanguage: "Spanish",
        proficiencyLevel: "B1",
      });

      expect(result.classId).toBeTypeOf("number");
      expect(result.classId).toBeGreaterThan(0);
    });

    it("should auto-create organization if not provided", async () => {
      const caller = appRouter.createCaller({
        user: { id: teacherId, openId: "teacher-123", role: "teacher", name: "Test Teacher", email: "teacher@test.com" },
      });

      const result = await caller.class.create({
        name: "German A2",
        targetLanguage: "German",
        proficiencyLevel: "A2",
      });

      expect(result.classId).toBeTypeOf("number");
      
      // Verify organization was created
      const db = await getDb();
      if (!db) throw new Error("Database unavailable");
      const [cls] = await db.select().from(classesTable).where(eq(classesTable.id, result.classId));
      expect(cls.organizationId).toBeGreaterThan(0);
    });

    it("should reject non-teacher users", async () => {
      const caller = appRouter.createCaller({
        user: { id: studentId, openId: "student-123", role: "user", name: "Test Student", email: "student@test.com" },
      });

      await expect(
        caller.class.create({
          name: "Italian A1",
          targetLanguage: "Italian",
          proficiencyLevel: "A1",
        })
      ).rejects.toThrow();
    });
  });

  describe("Get My Classes", () => {
    it("should return classes with student counts", async () => {
      // Add student to class
      const db = await getDb();
      if (!db) throw new Error("Database unavailable");
      await db.insert(classMembers).values({
        classId,
        userId: studentId,
        status: "active",
      });

      const caller = appRouter.createCaller({
        user: { id: teacherId, openId: "teacher-123", role: "teacher", name: "Test Teacher", email: "teacher@test.com" },
      });

      const classes = await caller.class.getMyClasses();

      expect(classes).toHaveLength(1);
      expect(classes[0].name).toBe("French A1");
      expect(classes[0].studentCount).toBe(1);
    });

    it("should return empty array for teacher with no classes", async () => {
      // Create another teacher
      const db = await getDb();
      if (!db) throw new Error("Database unavailable");
      const [newTeacher] = await db.insert(users).values({
        openId: "teacher-456",
        name: "New Teacher",
        email: "newteacher@test.com",
        role: "teacher",
      });

      const caller = appRouter.createCaller({
        user: { id: newTeacher.insertId, openId: "teacher-456", role: "teacher", name: "New Teacher", email: "newteacher@test.com" },
      });

      const classes = await caller.class.getMyClasses();
      expect(classes).toHaveLength(0);
    });

    it("should only return classes owned by the teacher", async () => {
      // Create another teacher and class
      const db = await getDb();
      if (!db) throw new Error("Database unavailable");
      const [otherTeacher] = await db.insert(users).values({
        openId: "teacher-789",
        name: "Other Teacher",
        email: "other@test.com",
        role: "teacher",
      });

      await db.insert(classesTable).values({
        organizationId: orgId,
        teacherId: otherTeacher.insertId,
        name: "Spanish A1",
        targetLanguage: "Spanish",
        proficiencyLevel: "A1",
      });

      const caller = appRouter.createCaller({
        user: { id: teacherId, openId: "teacher-123", role: "teacher", name: "Test Teacher", email: "teacher@test.com" },
      });

      const classes = await caller.class.getMyClasses();
      expect(classes).toHaveLength(1);
      expect(classes[0].name).toBe("French A1");
    });
  });

  describe("Get Class Details", () => {
    it("should return class with members", async () => {
      // Add student to class
      const db = await getDb();
      if (!db) throw new Error("Database unavailable");
      await db.insert(classMembers).values({
        classId,
        userId: studentId,
        status: "active",
      });

      const caller = appRouter.createCaller({
        user: { id: teacherId, openId: "teacher-123", role: "teacher", name: "Test Teacher", email: "teacher@test.com" },
      });

      const classData = await caller.class.getById({ classId });

      expect(classData.name).toBe("French A1");
      expect(classData.members).toHaveLength(1);
      expect(classData.members[0].userName).toBe("Test Student");
      expect(classData.members[0].userEmail).toBe("student@test.com");
    });

    it("should reject access to other teacher's class", async () => {
      // Create another teacher
      const db = await getDb();
      if (!db) throw new Error("Database unavailable");
      const [otherTeacher] = await db.insert(users).values({
        openId: "teacher-999",
        name: "Other Teacher",
        email: "other@test.com",
        role: "teacher",
      });

      const caller = appRouter.createCaller({
        user: { id: otherTeacher.insertId, openId: "teacher-999", role: "teacher", name: "Other Teacher", email: "other@test.com" },
      });

      await expect(caller.class.getById({ classId })).rejects.toThrow("FORBIDDEN");
    });

    it("should return class with empty members array if no students", async () => {
      const caller = appRouter.createCaller({
        user: { id: teacherId, openId: "teacher-123", role: "teacher", name: "Test Teacher", email: "teacher@test.com" },
      });

      const classData = await caller.class.getById({ classId });

      expect(classData.name).toBe("French A1");
      expect(classData.members).toHaveLength(0);
    });
  });

  describe("Class Statistics", () => {
    it("should calculate correct student counts across multiple classes", async () => {
      const db = await getDb();
      if (!db) throw new Error("Database unavailable");

      // Create second class
      const [cls2] = await db.insert(classesTable).values({
        organizationId: orgId,
        teacherId,
        name: "French A2",
        targetLanguage: "French",
        proficiencyLevel: "A2",
      });

      // Add students to first class
      await db.insert(classMembers).values({
        classId,
        userId: studentId,
        status: "active",
      });

      // Create another student and add to second class
      const [student2] = await db.insert(users).values({
        openId: "student-456",
        name: "Student Two",
        email: "student2@test.com",
        role: "user",
      });

      await db.insert(classMembers).values({
        classId: cls2.insertId,
        userId: student2.insertId,
        status: "active",
      });

      const caller = appRouter.createCaller({
        user: { id: teacherId, openId: "teacher-123", role: "teacher", name: "Test Teacher", email: "teacher@test.com" },
      });

      const classes = await caller.class.getMyClasses();

      expect(classes).toHaveLength(2);
      expect(classes.find((c) => c.name === "French A1")?.studentCount).toBe(1);
      expect(classes.find((c) => c.name === "French A2")?.studentCount).toBe(1);
    });
  });
});
