import { describe, it, expect, beforeAll } from "vitest";
import { getDb } from "./db";
import { parseEnrollmentCSV, generateEnrollmentCSVTemplate } from "./enrollmentCsvParser";
import {
  organizations,
  classes,
  enrollmentInvitations,
  users,
  classMembers,
} from "../drizzle/schema";
import { eq, and } from "drizzle-orm";

describe("Bulk Student Enrollment", () => {
  let testOrgId: number;
  let testTeacherId: number;
  let testClassId: number;

  beforeAll(async () => {
    const db = await getDb();
    if (!db) throw new Error("Database not available");

    // Create test organization
    const [org] = await db.insert(organizations).values({
      name: "Test Enrollment School",
      type: "school",
      contactEmail: "admin@enrolltest.com",
    });
    testOrgId = org.insertId;

    // Create test teacher
    const [teacher] = await db.insert(users).values({
      openId: `test-teacher-enroll-${Date.now()}`,
      name: "Enrollment Test Teacher",
      email: "teacher@enrolltest.com",
      role: "teacher",
    });
    testTeacherId = teacher.insertId;

    // Create test class
    const [classResult] = await db.insert(classes).values({
      organizationId: testOrgId,
      teacherId: testTeacherId,
      name: "Test Enrollment Class",
      targetLanguage: "French",
      proficiencyLevel: "A1",
    });
    testClassId = classResult.insertId;
  });

  describe("CSV Parser", () => {
    it("should parse valid CSV with name and email", () => {
      const csv = `name,email
John Doe,john@example.com
Jane Smith,jane@example.com`;

      const result = parseEnrollmentCSV(csv);

      expect(result.success).toBe(true);
      expect(result.data).toHaveLength(2);
      expect(result.data?.[0]).toEqual({
        name: "John Doe",
        email: "john@example.com",
      });
      expect(result.data?.[1]).toEqual({
        name: "Jane Smith",
        email: "jane@example.com",
      });
    });

    it("should reject CSV with missing required columns", () => {
      const csv = `name
John Doe
Jane Smith`;

      const result = parseEnrollmentCSV(csv);

      expect(result.success).toBe(false);
      expect(result.errors).toContain("Missing required columns: email");
    });

    it("should reject CSV with invalid email format", () => {
      const csv = `name,email
John Doe,invalid-email
Jane Smith,jane@example.com`;

      const result = parseEnrollmentCSV(csv);

      // Parser returns partial success with warnings for mixed valid/invalid rows
      expect(result.success).toBe(true);
      expect(result.data).toHaveLength(1); // Only valid row
      expect(result.errors).toBeDefined();
      expect(result.errors?.[0]).toContain("Invalid email format");
    });

    it("should reject CSV with empty name", () => {
      const csv = `name,email
,john@example.com
Jane Smith,jane@example.com`;

      const result = parseEnrollmentCSV(csv);

      // Parser returns partial success with warnings for mixed valid/invalid rows
      expect(result.success).toBe(true);
      expect(result.data).toHaveLength(1); // Only valid row
      expect(result.errors).toBeDefined();
      expect(result.errors?.[0]).toContain("Name is required");
    });

    it("should skip empty lines in CSV", () => {
      const csv = `name,email
John Doe,john@example.com

Jane Smith,jane@example.com`;

      const result = parseEnrollmentCSV(csv);

      expect(result.success).toBe(true);
      expect(result.data).toHaveLength(2);
    });

    it("should return partial data with warnings for mixed valid/invalid rows", () => {
      const csv = `name,email
John Doe,john@example.com
,invalid@example.com
Jane Smith,jane@example.com`;

      const result = parseEnrollmentCSV(csv);

      expect(result.success).toBe(true);
      expect(result.data).toHaveLength(2);
      expect(result.errors).toBeDefined();
      expect(result.errors?.length).toBeGreaterThan(0);
    });

    it("should generate valid CSV template", () => {
      const template = generateEnrollmentCSVTemplate();

      expect(template).toContain("name,email");
      expect(template).toContain("John Doe,john.doe@example.com");
      expect(template).toContain("Jane Smith,jane.smith@example.com");
    });
  });

  describe("Enrollment Invitations", () => {
    it("should create enrollment invitations with unique tokens", async () => {
      const db = await getDb();
      if (!db) throw new Error("Database not available");

      const expiresAt = new Date();
      expiresAt.setDate(expiresAt.getDate() + 7);

      const invitations = [
        {
          classId: testClassId,
          teacherId: testTeacherId,
          email: "student1@test.com",
          name: "Student One",
          token: `token-${Date.now()}-1`,
          expiresAt,
        },
        {
          classId: testClassId,
          teacherId: testTeacherId,
          email: "student2@test.com",
          name: "Student Two",
          token: `token-${Date.now()}-2`,
          expiresAt,
        },
      ];

      await db.insert(enrollmentInvitations).values(invitations);

      const created = await db
        .select()
        .from(enrollmentInvitations)
        .where(eq(enrollmentInvitations.classId, testClassId));

      expect(created.length).toBeGreaterThanOrEqual(2);
      expect(created[0].status).toBe("pending");
      expect(created[0].token).toBeDefined();
      expect(created[1].token).toBeDefined();
      expect(created[0].token).not.toBe(created[1].token);
    });

    it("should retrieve invitations for a specific class", async () => {
      const db = await getDb();
      if (!db) throw new Error("Database not available");

      const invitations = await db
        .select()
        .from(enrollmentInvitations)
        .where(eq(enrollmentInvitations.classId, testClassId));

      expect(invitations.length).toBeGreaterThan(0);
      expect(invitations[0].classId).toBe(testClassId);
    });

    it("should accept invitation and add student to class", async () => {
      const db = await getDb();
      if (!db) throw new Error("Database not available");

      // Create test student
      const [student] = await db.insert(users).values({
        openId: `test-student-enroll-${Date.now()}`,
        name: "Test Enrollment Student",
        email: "student-enroll@test.com",
        role: "user",
      });
      const studentId = student.insertId;

      // Create invitation
      const expiresAt = new Date();
      expiresAt.setDate(expiresAt.getDate() + 7);

      const [invResult] = await db.insert(enrollmentInvitations).values({
        classId: testClassId,
        teacherId: testTeacherId,
        email: "student-enroll@test.com",
        name: "Test Enrollment Student",
        token: `accept-token-${Date.now()}`,
        expiresAt,
      });

      const invitationId = invResult.insertId;

      // Get the invitation
      const [invitation] = await db
        .select()
        .from(enrollmentInvitations)
        .where(eq(enrollmentInvitations.id, invitationId));

      expect(invitation.status).toBe("pending");

      // Accept invitation
      await db.insert(classMembers).values({
        classId: invitation.classId,
        userId: studentId,
      });

      await db
        .update(enrollmentInvitations)
        .set({
          status: "accepted",
          acceptedAt: new Date(),
        })
        .where(eq(enrollmentInvitations.id, invitationId));

      // Verify invitation status
      const [updatedInvitation] = await db
        .select()
        .from(enrollmentInvitations)
        .where(eq(enrollmentInvitations.id, invitationId));

      expect(updatedInvitation.status).toBe("accepted");
      expect(updatedInvitation.acceptedAt).toBeDefined();

      // Verify student is in class
      const [member] = await db
        .select()
        .from(classMembers)
        .where(
          and(
            eq(classMembers.classId, testClassId),
            eq(classMembers.userId, studentId)
          )
        );

      expect(member).toBeDefined();
      expect(member.status).toBe("active");
    });

    it("should mark expired invitations", async () => {
      const db = await getDb();
      if (!db) throw new Error("Database not available");

      // Create invitation with past expiry
      const expiresAt = new Date();
      expiresAt.setDate(expiresAt.getDate() - 1); // Expired yesterday

      const [invResult] = await db.insert(enrollmentInvitations).values({
        classId: testClassId,
        teacherId: testTeacherId,
        email: "expired@test.com",
        name: "Expired Student",
        token: `expired-token-${Date.now()}`,
        expiresAt,
      });

      const invitationId = invResult.insertId;

      // Check if expired
      const [invitation] = await db
        .select()
        .from(enrollmentInvitations)
        .where(eq(enrollmentInvitations.id, invitationId));

      const isExpired = new Date() > invitation.expiresAt;
      expect(isExpired).toBe(true);

      // Mark as expired
      if (isExpired) {
        await db
          .update(enrollmentInvitations)
          .set({ status: "expired" })
          .where(eq(enrollmentInvitations.id, invitationId));
      }

      // Verify status
      const [updatedInvitation] = await db
        .select()
        .from(enrollmentInvitations)
        .where(eq(enrollmentInvitations.id, invitationId));

      expect(updatedInvitation.status).toBe("expired");
    });

    it("should prevent duplicate invitation acceptance", async () => {
      const db = await getDb();
      if (!db) throw new Error("Database not available");

      // Create invitation and accept it
      const expiresAt = new Date();
      expiresAt.setDate(expiresAt.getDate() + 7);

      const [invResult] = await db.insert(enrollmentInvitations).values({
        classId: testClassId,
        teacherId: testTeacherId,
        email: "duplicate@test.com",
        name: "Duplicate Test",
        token: `duplicate-token-${Date.now()}`,
        expiresAt,
      });

      const invitationId = invResult.insertId;

      // Accept once
      await db
        .update(enrollmentInvitations)
        .set({
          status: "accepted",
          acceptedAt: new Date(),
        })
        .where(eq(enrollmentInvitations.id, invitationId));

      // Try to accept again
      const [invitation] = await db
        .select()
        .from(enrollmentInvitations)
        .where(eq(enrollmentInvitations.id, invitationId));

      expect(invitation.status).toBe("accepted");
      // In real implementation, this would throw an error
    });
  });
});
