import { notifyOwner } from "./_core/notification";

/**
 * Email notification templates and helpers for affiliate program events
 */

interface AffiliateUser {
  name: string;
  email: string;
}

/**
 * Send email when affiliate earns a new commission
 */
export async function notifyCommissionEarned(params: {
  affiliate: AffiliateUser;
  commissionAmount: number;
  referredUserEmail: string;
  conversionType: "signup" | "premium_monthly" | "premium_annual";
}): Promise<boolean> {
  const { affiliate, commissionAmount, referredUserEmail, conversionType } = params;
  
  const conversionTypeText = {
    signup: "signed up",
    premium_monthly: "subscribed to Premium (Monthly)",
    premium_annual: "subscribed to Premium (Annual)",
  }[conversionType];

  return await notifyOwner({
    title: `💰 You Earned $${commissionAmount.toFixed(2)}!`,
    content: `Great news, ${affiliate.name}!

${referredUserEmail} just ${conversionTypeText} using your referral link.

Commission Earned: $${commissionAmount.toFixed(2)}
Status: Pending (will be paid out at month end)

Keep sharing your link to earn more! Your current month's earnings are adding up.

View your full earnings dashboard: ${process.env.VITE_APP_URL || 'https://storyling.ai'}/referrals

Happy earning! 🎉`,
  });
}

/**
 * Send email when affiliate reaches payout threshold
 */
export async function notifyPayoutThresholdReached(params: {
  affiliate: AffiliateUser;
  totalPending: number;
  threshold: number;
}): Promise<boolean> {
  const { affiliate, totalPending, threshold } = params;

  return await notifyOwner({
    title: `🎯 You've Reached the $${threshold} Payout Threshold!`,
    content: `Congratulations, ${affiliate.name}!

Your pending commissions have reached $${totalPending.toFixed(2)}, which exceeds our $${threshold} minimum payout threshold.

Your earnings will be automatically processed at the end of this month and paid out within 7 business days.

Payment Details:
• Total Pending: $${totalPending.toFixed(2)}
• Expected Payout Date: End of current month
• Payment Method: As configured in your settings

Want to update your payment method? Visit: ${process.env.VITE_APP_URL || 'https://storyling.ai'}/payout-management

Keep up the great work! 💪`,
  });
}

/**
 * Send email when payout is being processed
 */
export async function notifyPayoutProcessing(params: {
  affiliate: AffiliateUser;
  payoutAmount: number;
  paymentMethod: string;
  transactionId?: string;
}): Promise<boolean> {
  const { affiliate, payoutAmount, paymentMethod, transactionId } = params;

  return await notifyOwner({
    title: `⏳ Your $${payoutAmount.toFixed(2)} Payout is Being Processed`,
    content: `Hi ${affiliate.name},

Your affiliate payout is now being processed!

Payout Details:
• Amount: $${payoutAmount.toFixed(2)}
• Payment Method: ${paymentMethod}
${transactionId ? `• Transaction ID: ${transactionId}` : ''}

You should receive your payment within 3-5 business days depending on your payment method.

We'll send you another email once the payment is completed.

Track your earnings: ${process.env.VITE_APP_URL || 'https://storyling.ai'}/referrals`,
  });
}

/**
 * Send email when payout is completed
 */
export async function notifyPayoutCompleted(params: {
  affiliate: AffiliateUser;
  payoutAmount: number;
  paymentMethod: string;
  transactionId?: string;
}): Promise<boolean> {
  const { affiliate, payoutAmount, paymentMethod, transactionId } = params;

  return await notifyOwner({
    title: `✅ Payment Sent: $${payoutAmount.toFixed(2)}`,
    content: `Great news, ${affiliate.name}!

Your affiliate payout has been successfully processed and sent.

Payment Details:
• Amount: $${payoutAmount.toFixed(2)}
• Payment Method: ${paymentMethod}
${transactionId ? `• Transaction ID: ${transactionId}` : ''}
• Status: Completed ✓

The funds should appear in your account within 1-3 business days depending on your payment provider.

Thank you for being a valued affiliate partner! Keep sharing to earn more.

View your earnings history: ${process.env.VITE_APP_URL || 'https://storyling.ai'}/referrals`,
  });
}

/**
 * Send monthly earnings summary email
 */
export async function notifyMonthlySummary(params: {
  affiliate: AffiliateUser;
  monthName: string;
  totalEarned: number;
  totalReferrals: number;
  pendingPayout: number;
  topReferralSource?: string;
}): Promise<boolean> {
  const { affiliate, monthName, totalEarned, totalReferrals, pendingPayout, topReferralSource } = params;

  return await notifyOwner({
    title: `📊 Your ${monthName} Affiliate Summary`,
    content: `Hi ${affiliate.name},

Here's your affiliate performance summary for ${monthName}:

💰 Earnings This Month: $${totalEarned.toFixed(2)}
👥 New Referrals: ${totalReferrals}
⏳ Pending Payout: $${pendingPayout.toFixed(2)}
${topReferralSource ? `🔥 Top Source: ${topReferralSource}` : ''}

${pendingPayout >= 50 
  ? `Your pending balance exceeds the $50 threshold and will be paid out within the next 7 days!` 
  : `You need $${(50 - pendingPayout).toFixed(2)} more to reach the $50 payout threshold.`}

Tips to Boost Your Earnings:
• Share your link on social media regularly
• Create content showcasing Storyling AI features
• Engage with language learning communities
• Use our pre-made marketing materials

View detailed analytics: ${process.env.VITE_APP_URL || 'https://storyling.ai'}/referrals

Keep up the amazing work! 🚀`,
  });
}

/**
 * Send welcome email to new affiliates
 */
export async function notifyAffiliateWelcome(params: {
  affiliate: AffiliateUser;
  referralCode: string;
}): Promise<boolean> {
  const { affiliate, referralCode } = params;

  return await notifyOwner({
    title: `🎉 Welcome to the Storyling AI Affiliate Program!`,
    content: `Welcome aboard, ${affiliate.name}!

Your affiliate application has been approved. You're now part of our affiliate community!

Your Unique Referral Code: ${referralCode}
Your Referral Link: ${process.env.VITE_APP_URL || 'https://storyling.ai'}/pricing?ref=${referralCode}

How to Get Started:
1. Share your referral link with your audience
2. Earn 30% commission on every Premium subscription
3. Get paid monthly (minimum $50 threshold)

Commission Structure:
• Monthly Premium: $3/month recurring
• Annual Premium: $18/year recurring
• Average lifetime value: $24-48 per referral

Resources Available:
• Marketing materials: ${process.env.VITE_APP_URL || 'https://storyling.ai'}/affiliate-resources
• Tracking dashboard: ${process.env.VITE_APP_URL || 'https://storyling.ai'}/referrals
• Onboarding guide: ${process.env.VITE_APP_URL || 'https://storyling.ai'}/affiliate-onboarding

Need help? Reply to this email or visit our affiliate resources page.

Let's make this partnership successful! 💪`,
  });
}
