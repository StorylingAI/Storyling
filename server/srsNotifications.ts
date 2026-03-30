import { getDb } from "./db";
import { srsReviews, reviewReminders, users } from "../drizzle/schema";
import { eq, and, lte, sql } from "drizzle-orm";
import { sendEmail } from "./_core/email";
import { sendPushToUser, isPushEnabled } from "./pushNotifications";

/**
 * Check and send review reminders to users who have words due for review
 * This should be called by a cron job or scheduled task
 */
export async function sendReviewReminders() {
  const db = await getDb();
  if (!db) {
    console.error("[SRS Notifications] Database unavailable");
    return;
  }

  const now = new Date();
  
  // Find users who have enabled reminders and haven't been reminded today
  const usersWithReminders = await db
    .select({
      user: users,
      reminder: reviewReminders,
    })
    .from(reviewReminders)
    .innerJoin(users, eq(reviewReminders.userId, users.id))
    .where(
      and(
        eq(reviewReminders.enabled, true),
        eq(reviewReminders.emailReminders, true)
      )
    );

  for (const { user, reminder } of usersWithReminders) {
    try {
      // Check if already sent reminder today
      if (reminder.lastReminderSentAt) {
        const lastReminder = new Date(reminder.lastReminderSentAt);
        const today = new Date();
        today.setHours(0, 0, 0, 0);
        
        if (lastReminder >= today) {
          console.log(`[SRS Notifications] Already sent reminder to user ${user.id} today`);
          continue;
        }
      }

      // Count words due for review
      const [dueCount] = await db
        .select({
          count: sql<number>`COUNT(*)`,
        })
        .from(srsReviews)
        .where(
          and(
            eq(srsReviews.userId, user.id),
            lte(srsReviews.nextReviewAt, now),
            eq(srsReviews.status, "learning")
          )
        );

      const wordsDue = Number(dueCount?.count || 0);

      if (wordsDue === 0) {
        console.log(`[SRS Notifications] No words due for user ${user.id}`);
        continue;
      }

      // Send email reminder
      await sendEmail({
        to: user.email || "",
        subject: `📚 You have ${wordsDue} word${wordsDue > 1 ? "s" : ""} to review today!`,
        html: `
          <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px;">
            <div style="text-align: center; margin-bottom: 30px;">
              <h1 style="color: #8b5cf6; margin: 0;">Storyling.ai</h1>
            </div>
            
            <div style="background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); border-radius: 12px; padding: 30px; color: white; text-align: center; margin-bottom: 30px;">
              <h2 style="margin: 0 0 10px 0; font-size: 32px;">📚 ${wordsDue}</h2>
              <p style="margin: 0; font-size: 18px;">word${wordsDue > 1 ? "s" : ""} ready for review</p>
            </div>

            <div style="background: #f7fafc; border-radius: 8px; padding: 20px; margin-bottom: 20px;">
              <p style="margin: 0 0 15px 0; color: #2d3748;">Hi ${user.name || "there"}! 👋</p>
              <p style="margin: 0 0 15px 0; color: #4a5568;">
                Your vocabulary words are ready for review! Consistent practice is the key to long-term retention.
              </p>
              <p style="margin: 0; color: #4a5568;">
                <strong>Why review now?</strong> Research shows that reviewing at the optimal time dramatically improves memory retention. Don't let these words slip away!
              </p>
            </div>

            <div style="text-align: center; margin: 30px 0;">
              <a href="${process.env.VITE_APP_URL || "https://storyling.ai"}/review" 
                 style="background-color: #8b5cf6; color: white; padding: 14px 32px; text-decoration: none; border-radius: 8px; display: inline-block; font-weight: bold; font-size: 16px;">
                Start Reviewing →
              </a>
            </div>

            <div style="border-top: 1px solid #e2e8f0; padding-top: 20px; margin-top: 30px; text-align: center; color: #718096; font-size: 14px;">
              <p style="margin: 0 0 10px 0;">Don't want these reminders?</p>
              <a href="${process.env.VITE_APP_URL || "https://storyling.ai"}/settings" style="color: #8b5cf6; text-decoration: none;">
                Update your notification preferences
              </a>
            </div>
          </div>
        `,
      });

      // Send push notification if enabled for this user
      if (isPushEnabled() && reminder.pushReminders) {
        const pushSent = await sendPushToUser(user.id, {
          title: `${wordsDue} word${wordsDue > 1 ? "s" : ""} to review!`,
          body: `Keep your learning streak alive. Tap to start reviewing.`,
          tag: "review-reminder",
          url: "/app/review",
        });
        if (pushSent) {
          console.log(`[SRS Notifications] Push sent to user ${user.id}`);
        }
      }

      // Update last reminder sent timestamp
      await db
        .update(reviewReminders)
        .set({ lastReminderSentAt: now })
        .where(eq(reviewReminders.userId, user.id));

      console.log(`[SRS Notifications] Sent reminder to user ${user.id} (${user.email}) - ${wordsDue} words due`);
    } catch (error) {
      console.error(`[SRS Notifications] Failed to send reminder to user ${user.id}:`, error);
    }
  }

  console.log(`[SRS Notifications] Finished sending reminders`);
}

/**
 * Get in-app notification count for user
 */
export async function getReviewNotificationCount(userId: number): Promise<number> {
  const db = await getDb();
  if (!db) return 0;

  const now = new Date();
  
  const [result] = await db
    .select({
      count: sql<number>`COUNT(*)`,
    })
    .from(srsReviews)
    .where(
      and(
        eq(srsReviews.userId, userId),
        lte(srsReviews.nextReviewAt, now),
        eq(srsReviews.status, "learning")
      )
    );

  return Number(result?.count || 0);
}
