import { z } from "zod";
import { router, protectedProcedure } from "./_core/trpc";
import { TRPCError } from "@trpc/server";
import { getDb } from "./db";
import { users, organizations, generatedContent, classMembers, classes, collections, collectionItems } from "../drizzle/schema";
import { sql, gte, lte, and, eq, desc, count } from "drizzle-orm";

/**
 * Admin-only procedure - requires admin role
 */
const adminProcedure = protectedProcedure.use(({ ctx, next }) => {
  if (ctx.user.role !== "admin") {
    throw new TRPCError({ code: "FORBIDDEN", message: "Admin access required" });
  }
  return next({ ctx });
});

export const adminAnalyticsRouter = router({
  /**
   * Get user growth metrics (sign-ups over time)
   */
  getUserGrowth: adminProcedure
    .input(
      z.object({
        period: z.enum(["daily", "weekly", "monthly"]).default("monthly"),
        startDate: z.date().optional(),
        endDate: z.date().optional(),
      })
    )
    .query(async ({ input }) => {
      const db = await getDb();
      if (!db) throw new TRPCError({ code: "INTERNAL_SERVER_ERROR", message: "Database unavailable" });

      const startDate = input.startDate || new Date(Date.now() - 90 * 24 * 60 * 60 * 1000); // Default: 90 days ago
      const endDate = input.endDate || new Date();

      let dateFormat: string;
      switch (input.period) {
        case "daily":
          dateFormat = "%Y-%m-%d";
          break;
        case "weekly":
          dateFormat = "%Y-%U"; // Year-Week
          break;
        case "monthly":
          dateFormat = "%Y-%m";
          break;
      }

      const result = await db
        .select({
          date: sql<string>`DATE_FORMAT(${users.createdAt}, ${dateFormat})`,
          count: count(),
        })
        .from(users)
        .where(and(gte(users.createdAt, startDate), lte(users.createdAt, endDate)))
        .groupBy(sql`DATE_FORMAT(${users.createdAt}, ${dateFormat})`)
        .orderBy(sql`DATE_FORMAT(${users.createdAt}, ${dateFormat})`);

      return { data: result };
    }),

  /**
   * Get revenue metrics (MRR, total revenue)
   */
  getRevenueMetrics: adminProcedure.query(async () => {
    const db = await getDb();
    if (!db) throw new TRPCError({ code: "INTERNAL_SERVER_ERROR", message: "Database unavailable" });

    // Get all active organizations with subscriptions
    const orgs = await db
      .select({
        id: organizations.id,
        name: organizations.name,
        subscriptionTier: organizations.subscriptionTier,
        maxStudents: organizations.maxStudents,
        isActive: organizations.isActive,
        stripeSubscriptionId: organizations.stripeSubscriptionId,
      })
      .from(organizations)
      .where(and(eq(organizations.isActive, true), sql`${organizations.stripeSubscriptionId} IS NOT NULL`));

    let totalMRR = 0;
    const revenueByTier: Record<string, number> = {
      trial: 0,
      basic: 0,
      premium: 0,
      enterprise: 0,
    };

    for (const org of orgs) {
      let monthlyRevenue = 0;

      if (org.subscriptionTier === "basic") {
        monthlyRevenue = org.maxStudents * 5; // $5 per student
      } else if (org.subscriptionTier === "premium") {
        monthlyRevenue = org.maxStudents * 4; // $4 per student
      }

      totalMRR += monthlyRevenue;
      revenueByTier[org.subscriptionTier] += monthlyRevenue;
    }

    return {
      totalMRR,
      annualRunRate: totalMRR * 12,
      revenueByTier,
      activeSubscriptions: orgs.length,
    };
  }),

  /**
   * Get active users metrics
   */
  getActiveUsersMetrics: adminProcedure
    .input(
      z.object({
        period: z.enum(["day", "week", "month"]).default("month"),
      })
    )
    .query(async ({ input }) => {
      const db = await getDb();
      if (!db) throw new TRPCError({ code: "INTERNAL_SERVER_ERROR", message: "Database unavailable" });

      let daysAgo: number;
      switch (input.period) {
        case "day":
          daysAgo = 1;
          break;
        case "week":
          daysAgo = 7;
          break;
        case "month":
          daysAgo = 30;
          break;
      }

      const cutoffDate = new Date(Date.now() - daysAgo * 24 * 60 * 60 * 1000);

      const [result] = await db
        .select({
          activeUsers: count(),
        })
        .from(users)
        .where(gte(users.lastSignedIn, cutoffDate));

      const [totalUsers] = await db.select({ total: count() }).from(users);

      return {
        activeUsers: result.activeUsers,
        totalUsers: totalUsers.total,
        period: input.period,
      };
    }),

  /**
   * Get organization usage reports
   */
  getOrganizationUsage: adminProcedure.query(async () => {
    const db = await getDb();
    if (!db) throw new TRPCError({ code: "INTERNAL_SERVER_ERROR", message: "Database unavailable" });

    const orgs = await db
      .select({
        id: organizations.id,
        name: organizations.name,
        subscriptionTier: organizations.subscriptionTier,
        maxStudents: organizations.maxStudents,
        maxTeachers: organizations.maxTeachers,
        isActive: organizations.isActive,
        createdAt: organizations.createdAt,
      })
      .from(organizations)
      .orderBy(desc(organizations.createdAt));

    // Get actual student/teacher counts for each org
    const usage = await Promise.all(
      orgs.map(async (org) => {
        const [studentCount] = await db
          .select({ count: count() })
          .from(classMembers)
          .innerJoin(classes, eq(classMembers.classId, classes.id))
          .where(eq(classes.organizationId, org.id));

        const [teacherCount] = await db
          .select({ count: count() })
          .from(classes)
          .where(eq(classes.organizationId, org.id));

        return {
          ...org,
          currentStudents: studentCount.count,
          currentTeachers: teacherCount.count,
          studentUtilization: org.maxStudents > 0 ? (studentCount.count / org.maxStudents) * 100 : 0,
          teacherUtilization: org.maxTeachers > 0 ? (teacherCount.count / org.maxTeachers) * 100 : 0,
        };
      })
    );

    return { organizations: usage };
  }),

  /**
   * Get engagement metrics (content creation, usage)
   */
  getEngagementMetrics: adminProcedure.query(async () => {
    const db = await getDb();
    if (!db) throw new TRPCError({ code: "INTERNAL_SERVER_ERROR", message: "Database unavailable" });

    const [totalContent] = await db.select({ count: count() }).from(generatedContent);

    const [completedContent] = await db
      .select({ count: count() })
      .from(generatedContent)
      .where(eq(generatedContent.status, "completed"));

    const [failedContent] = await db
      .select({ count: count() })
      .from(generatedContent)
      .where(eq(generatedContent.status, "failed"));

    // Get content by mode
    const contentByMode = await db
      .select({
        mode: generatedContent.mode,
        count: count(),
      })
      .from(generatedContent)
      .groupBy(generatedContent.mode);

    // Get most active users (top 10 by content created)
    const topCreators = await db
      .select({
        userId: generatedContent.userId,
        userName: users.name,
        contentCount: count(),
      })
      .from(generatedContent)
      .innerJoin(users, eq(generatedContent.userId, users.id))
      .groupBy(generatedContent.userId, users.name)
      .orderBy(desc(count()))
      .limit(10);

    return {
      totalContent: totalContent.count,
      completedContent: completedContent.count,
      failedContent: failedContent.count,
      successRate: totalContent.count > 0 ? (completedContent.count / totalContent.count) * 100 : 0,
      contentByMode: contentByMode.map((item) => ({
        mode: item.mode,
        count: item.count,
      })),
      topCreators,
    };
  }),

  /**
   * Get churn analysis
   */
  getChurnAnalysis: adminProcedure.query(async () => {
    const db = await getDb();
    if (!db) throw new TRPCError({ code: "INTERNAL_SERVER_ERROR", message: "Database unavailable" });

    const thirtyDaysAgo = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000);

    // Inactive users (haven't signed in for 30+ days)
    const [inactiveUsers] = await db
      .select({ count: count() })
      .from(users)
      .where(lte(users.lastSignedIn, thirtyDaysAgo));

    const [totalUsers] = await db.select({ count: count() }).from(users);

    // Inactive organizations
    const [inactiveOrgs] = await db
      .select({ count: count() })
      .from(organizations)
      .where(eq(organizations.isActive, false));

    const [totalOrgs] = await db.select({ count: count() }).from(organizations);

    return {
      inactiveUsers: inactiveUsers.count,
      totalUsers: totalUsers.count,
      userChurnRate: totalUsers.count > 0 ? (inactiveUsers.count / totalUsers.count) * 100 : 0,
      inactiveOrganizations: inactiveOrgs.count,
      totalOrganizations: totalOrgs.count,
      orgChurnRate: totalOrgs.count > 0 ? (inactiveOrgs.count / totalOrgs.count) * 100 : 0,
    };
  }),

  /**
   * Get collection analytics
   */
  getCollectionAnalytics: adminProcedure
    .input(z.object({ limit: z.number().default(20).optional() }).optional())
    .query(async ({ input }) => {
      const db = await getDb();
      if (!db) throw new TRPCError({ code: "INTERNAL_SERVER_ERROR", message: "Database unavailable" });

      const limit = input?.limit || 20;

      // Get public collections with analytics
      const publicCollections = await db
        .select({
          id: collections.id,
          name: collections.name,
          description: collections.description,
          userId: collections.userId,
          viewCount: collections.viewCount,
          cloneCount: collections.cloneCount,
          isPublic: collections.isPublic,
          isFeatured: collections.isFeatured,
          createdAt: collections.createdAt,
        })
        .from(collections)
        .where(eq(collections.isPublic, true))
        .orderBy(desc(collections.viewCount))
        .limit(limit);

      // Get user names and item counts
      const collectionsWithDetails = await Promise.all(
        publicCollections.map(async (collection) => {
          const [user] = await db
            .select({ name: users.name, email: users.email })
            .from(users)
            .where(eq(users.id, collection.userId))
            .limit(1);

          const items = await db
            .select()
            .from(collectionItems)
            .where(eq(collectionItems.collectionId, collection.id));

          return {
            ...collection,
            userName: user?.name || "Unknown",
            userEmail: user?.email || "N/A",
            itemCount: items.length,
          };
        })
      );

      // Calculate totals
      const totalViews = collectionsWithDetails.reduce((sum, c) => sum + c.viewCount, 0);
      const totalClones = collectionsWithDetails.reduce((sum, c) => sum + c.cloneCount, 0);

      return {
        collections: collectionsWithDetails,
        summary: {
          totalCollections: collectionsWithDetails.length,
          totalViews,
          totalClones,
          avgViewsPerCollection: collectionsWithDetails.length > 0 ? Math.round(totalViews / collectionsWithDetails.length) : 0,
          avgClonesPerCollection: collectionsWithDetails.length > 0 ? Math.round(totalClones / collectionsWithDetails.length) : 0,
        },
      };
    }),

  /**
   * Get overview dashboard stats
   */
  getOverviewStats: adminProcedure.query(async () => {
    const db = await getDb();
    if (!db) throw new TRPCError({ code: "INTERNAL_SERVER_ERROR", message: "Database unavailable" });

    const [totalUsers] = await db.select({ count: count() }).from(users);
    const [totalOrgs] = await db.select({ count: count() }).from(organizations);
    const [activeOrgs] = await db
      .select({ count: count() })
      .from(organizations)
      .where(eq(organizations.isActive, true));
    const [totalContent] = await db.select({ count: count() }).from(generatedContent);

    // Users signed up in last 7 days
    const sevenDaysAgo = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000);
    const [newUsers] = await db
      .select({ count: count() })
      .from(users)
      .where(gte(users.createdAt, sevenDaysAgo));

    return {
      totalUsers: totalUsers.count,
      newUsersThisWeek: newUsers.count,
      totalOrganizations: totalOrgs.count,
      activeOrganizations: activeOrgs.count,
      totalContentCreated: totalContent.count,
    };
  }),
});
