import { z } from "zod";
import { publicProcedure, router } from "./_core/trpc";
import { notifyOwner } from "./_core/notification";
import { sendEmail, formatContactFormEmail } from "./emailService";

export const contactRouter = router({
  /**
   * Submit contact form and send email notification to owner
   */
  submitContactForm: publicProcedure
    .input(
      z.object({
        name: z.string().min(1, "Name is required"),
        email: z.string().email("Valid email is required"),
        organization: z.string().optional(),
        phone: z.string().optional(),
        inquiryType: z.enum(["school", "enterprise", "partnership", "demo", "other"]),
        message: z.string().min(10, "Message must be at least 10 characters"),
      })
    )
    .mutation(async ({ input }) => {
      // Format the notification message
      const title = `New Contact Form Submission - ${input.inquiryType.toUpperCase()}`;
      
      const content = `
**New Contact Form Submission**

**Name:** ${input.name}
**Email:** ${input.email}
${input.organization ? `**Organization:** ${input.organization}` : ""}
${input.phone ? `**Phone:** ${input.phone}` : ""}
**Inquiry Type:** ${input.inquiryType}

**Message:**
${input.message}

---
*Submitted at: ${new Date().toISOString()}*
      `.trim();

      // Send email to team@storyling.ai
      const emailHtml = formatContactFormEmail(input);
      const emailSent = await sendEmail({
        to: "team@storyling.ai",
        subject: title,
        html: emailHtml,
        replyTo: input.email,
      });

      // Also send notification to owner
      const notificationSent = await notifyOwner({
        title,
        content,
      });

      if (!emailSent && !notificationSent) {
        throw new Error("Failed to send notification. Please try again later.");
      }

      return { success: true };
    }),
});
