import webpush from "web-push";
import { getDb } from "./db";
import { pushSubscriptions } from "../drizzle/schema";
import { eq } from "drizzle-orm";

let pushEnabled = false;

/**
 * Initialize web-push with VAPID credentials from environment.
 * If keys are missing, push is silently disabled (no crash).
 */
export function initWebPush() {
  const publicKey = process.env.VAPID_PUBLIC_KEY;
  const privateKey = process.env.VAPID_PRIVATE_KEY;
  const email = process.env.VAPID_EMAIL || "mailto:hello@storyling.ai";

  if (!publicKey || !privateKey) {
    console.warn(
      "[Push] VAPID_PUBLIC_KEY or VAPID_PRIVATE_KEY not set — push notifications disabled"
    );
    pushEnabled = false;
    return;
  }

  try {
    webpush.setVapidDetails(email, publicKey, privateKey);
    pushEnabled = true;
    console.log("[Push] Web push configured successfully");
  } catch (error) {
    console.error("[Push] Failed to configure web-push:", error);
    pushEnabled = false;
  }
}

/**
 * Check if push notifications are enabled (VAPID keys configured).
 */
export function isPushEnabled(): boolean {
  return pushEnabled;
}

interface PushPayload {
  title: string;
  body: string;
  tag?: string;
  url?: string;
}

/**
 * Send a push notification to a specific user.
 * Handles expired/invalid subscriptions gracefully by removing them from DB.
 *
 * @returns true if sent successfully, false otherwise
 */
export async function sendPushToUser(
  userId: number,
  payload: PushPayload
): Promise<boolean> {
  if (!pushEnabled) {
    return false;
  }

  const db = await getDb();
  if (!db) {
    return false;
  }

  try {
    const [sub] = await db
      .select()
      .from(pushSubscriptions)
      .where(eq(pushSubscriptions.userId, userId))
      .limit(1);

    if (!sub) {
      return false;
    }

    const subscription = JSON.parse(sub.subscription);

    await webpush.sendNotification(subscription, JSON.stringify(payload));
    return true;
  } catch (error: any) {
    // 404 or 410 means the subscription is expired/invalid — clean it up
    if (error.statusCode === 404 || error.statusCode === 410) {
      console.log(
        `[Push] Subscription expired for user ${userId}, removing from DB`
      );
      const db2 = await getDb();
      if (db2) {
        await db2
          .delete(pushSubscriptions)
          .where(eq(pushSubscriptions.userId, userId));
      }
    } else {
      console.error(
        `[Push] Failed to send notification to user ${userId}:`,
        error.message || error
      );
    }
    return false;
  }
}

/**
 * Send a push notification to multiple users.
 * Failures for individual users don't affect others.
 *
 * @returns number of successfully sent notifications
 */
export async function sendPushToUsers(
  userIds: number[],
  payload: PushPayload
): Promise<number> {
  if (!pushEnabled || userIds.length === 0) {
    return 0;
  }

  const results = await Promise.allSettled(
    userIds.map((userId) => sendPushToUser(userId, payload))
  );

  return results.filter(
    (r) => r.status === "fulfilled" && r.value === true
  ).length;
}
