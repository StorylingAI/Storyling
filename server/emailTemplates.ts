/**
 * Centralized email templates for Storyling AI
 * All templates use inline styles for maximum email client compatibility.
 * Design: clean, modern, Storyling branding (violet #8b5cf6 / teal #14b8a6)
 */

// ─── Base Layout ──────────────────────────────────────────────

function baseLayout(content: string, options?: { preheader?: string }): string {
  return `
<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <meta http-equiv="X-UA-Compatible" content="IE=edge">
  <title>Storyling AI</title>
  <!--[if mso]>
  <noscript>
    <xml>
      <o:OfficeDocumentSettings>
        <o:PixelsPerInch>96</o:PixelsPerInch>
      </o:OfficeDocumentSettings>
    </xml>
  </noscript>
  <![endif]-->
</head>
<body style="margin: 0; padding: 0; background-color: #f3f4f6; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif; -webkit-font-smoothing: antialiased;">
  ${options?.preheader ? `<div style="display: none; max-height: 0; overflow: hidden;">${options.preheader}</div>` : ''}

  <!-- Outer wrapper -->
  <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="background-color: #f3f4f6;">
    <tr>
      <td align="center" style="padding: 40px 16px;">

        <!-- Main card -->
        <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="max-width: 560px; background-color: #ffffff; border-radius: 12px; overflow: hidden; box-shadow: 0 1px 3px rgba(0,0,0,0.08);">

          <!-- Header -->
          <tr>
            <td style="background: linear-gradient(135deg, #8b5cf6 0%, #7c3aed 50%, #6d28d9 100%); padding: 32px 40px; text-align: center;">
              <table role="presentation" width="100%" cellpadding="0" cellspacing="0">
                <tr>
                  <td align="center">
                    <span style="font-size: 28px; font-weight: 700; color: #ffffff; letter-spacing: -0.5px;">Storyling</span>
                    <span style="font-size: 28px; font-weight: 700; color: #f87171; letter-spacing: -0.5px;"> AI</span>
                  </td>
                </tr>
              </table>
            </td>
          </tr>

          <!-- Content -->
          <tr>
            <td style="padding: 40px;">
              ${content}
            </td>
          </tr>

          <!-- Footer -->
          <tr>
            <td style="padding: 0 40px 32px 40px;">
              <table role="presentation" width="100%" cellpadding="0" cellspacing="0">
                <tr>
                  <td style="border-top: 1px solid #e5e7eb; padding-top: 24px; text-align: center;">
                    <p style="margin: 0 0 8px 0; font-size: 13px; color: #9ca3af;">
                      Storyling AI, your language learning companion
                    </p>
                    <p style="margin: 0; font-size: 12px; color: #d1d5db;">
                      &copy; ${new Date().getFullYear()} Storyling AI. All rights reserved.
                    </p>
                  </td>
                </tr>
              </table>
            </td>
          </tr>

        </table>

      </td>
    </tr>
  </table>
</body>
</html>`.trim();
}

// ─── CTA Button ───────────────────────────────────────────────

function ctaButton(text: string, url: string): string {
  return `
<table role="presentation" width="100%" cellpadding="0" cellspacing="0">
  <tr>
    <td align="center" style="padding: 8px 0;">
      <!--[if mso]>
      <v:roundrect xmlns:v="urn:schemas-microsoft-com:vml" href="${url}" style="height:48px;v-text-anchor:middle;width:220px;" arcsize="12%" strokecolor="#7c3aed" fillcolor="#8b5cf6">
        <w:anchorlock/>
        <center style="color:#ffffff;font-family:sans-serif;font-size:16px;font-weight:bold;">${text}</center>
      </v:roundrect>
      <![endif]-->
      <!--[if !mso]><!-->
      <a href="${url}" target="_blank" style="display: inline-block; background-color: #8b5cf6; color: #ffffff; font-size: 16px; font-weight: 600; text-decoration: none; padding: 14px 32px; border-radius: 8px; line-height: 1;">
        ${text}
      </a>
      <!--<![endif]-->
    </td>
  </tr>
</table>`;
}

// ─── Verification Email (signup + resend) ─────────────────────

export function verificationEmail(params: {
  name: string;
  verificationUrl: string;
  isResend?: boolean;
}): string {
  const { name, verificationUrl, isResend } = params;
  const greeting = name ? `Hi ${name},` : 'Hi there,';

  const content = `
<h1 style="margin: 0 0 8px 0; font-size: 22px; font-weight: 700; color: #111827;">
  ${isResend ? 'Verify Your Email' : 'Welcome to Storyling AI!'}
</h1>
<p style="margin: 0 0 24px 0; font-size: 15px; color: #6b7280; line-height: 1.6;">
  ${greeting}
</p>
<p style="margin: 0 0 28px 0; font-size: 15px; color: #374151; line-height: 1.6;">
  ${isResend
    ? 'You requested a new verification link. Click the button below to verify your email address:'
    : 'Thanks for signing up! Please verify your email address to get started with your language learning journey:'}
</p>

${ctaButton('Verify Email Address', verificationUrl)}

<p style="margin: 24px 0 0 0; font-size: 13px; color: #9ca3af; line-height: 1.6;">
  Or copy and paste this link into your browser:
</p>
<p style="margin: 4px 0 24px 0; font-size: 13px; color: #8b5cf6; word-break: break-all; line-height: 1.5;">
  ${verificationUrl}
</p>

<table role="presentation" width="100%" cellpadding="0" cellspacing="0">
  <tr>
    <td style="background-color: #f9fafb; border-radius: 8px; padding: 16px;">
      <p style="margin: 0; font-size: 13px; color: #6b7280; line-height: 1.5;">
        This link expires in <strong style="color: #374151;">24 hours</strong>. If you didn't create this account, you can safely ignore this email.
      </p>
    </td>
  </tr>
</table>`;

  return baseLayout(content, {
    preheader: isResend
      ? 'Here is your new verification link for Storyling AI'
      : 'Verify your email to start learning languages with Storyling AI',
  });
}

// --- Welcome Email ---

export function welcomeEmail(params: {
  name?: string | null;
  appUrl: string;
}): string {
  const greeting = params.name ? `Hi ${params.name},` : "Hi there,";

  const content = `
<h1 style="margin: 0 0 8px 0; font-size: 22px; font-weight: 700; color: #111827;">
  Welcome to Storyling AI
</h1>
<p style="margin: 0 0 20px 0; font-size: 15px; color: #6b7280; line-height: 1.6;">
  ${greeting}
</p>
<p style="margin: 0 0 20px 0; font-size: 15px; color: #374151; line-height: 1.6;">
  Your account is ready. You can now create personalized stories, practice vocabulary, and build a learning library around the languages you care about.
</p>
<p style="margin: 0 0 28px 0; font-size: 15px; color: #374151; line-height: 1.6;">
  Start with a story topic you like, choose your target language, and let Storyling turn it into reading and listening practice.
</p>

${ctaButton("Start Learning", params.appUrl)}

<table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="margin-top: 24px;">
  <tr>
    <td style="background-color: #f9fafb; border-radius: 8px; padding: 16px;">
      <p style="margin: 0; font-size: 13px; color: #6b7280; line-height: 1.5;">
        Tip: Save useful words as you read so you can review them later from your vocabulary bank.
      </p>
    </td>
  </tr>
</table>`;

  return baseLayout(content, {
    preheader: "Your Storyling AI account is ready",
  });
}

// --- Premium Welcome Email ---

export function premiumWelcomeEmail(params: {
  name?: string | null;
  appUrl: string;
}): string {
  const greeting = params.name ? `Hi ${params.name},` : "Hi there,";

  const content = `
<h1 style="margin: 0 0 8px 0; font-size: 22px; font-weight: 700; color: #111827;">
  Your Premium upgrade is active
</h1>
<p style="margin: 0 0 20px 0; font-size: 15px; color: #6b7280; line-height: 1.6;">
  ${greeting}
</p>
<p style="margin: 0 0 24px 0; font-size: 15px; color: #374151; line-height: 1.6;">
  Thanks for upgrading. You can now create unlimited stories, generate films, use priority generation, and access premium learning tools.
</p>

${ctaButton("Open Premium Walkthrough", params.appUrl)}

<table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="margin-top: 24px;">
  <tr>
    <td style="background-color: #f9fafb; border-radius: 8px; padding: 16px;">
      <p style="margin: 0; font-size: 13px; color: #6b7280; line-height: 1.5;">
        The walkthrough will appear in your dashboard after checkout so you can review your new features.
      </p>
    </td>
  </tr>
</table>`;

  return baseLayout(content, {
    preheader: "Your Storyling AI Premium upgrade is active",
  });
}

// --- Contact Form Notification ---

export function contactFormEmail(data: {
  name: string;
  email: string;
  organization?: string;
  phone?: string;
  inquiryType: string;
  message: string;
}): string {
  const inquiryColors: Record<string, string> = {
    school: '#14b8a6',
    enterprise: '#8b5cf6',
    partnership: '#f59e0b',
    demo: '#3b82f6',
    other: '#6b7280',
  };
  const badgeColor = inquiryColors[data.inquiryType] || '#8b5cf6';

  const fieldRow = (label: string, value: string, isLink?: boolean) => `
<tr>
  <td style="padding: 12px 0; border-bottom: 1px solid #f3f4f6;">
    <p style="margin: 0 0 2px 0; font-size: 11px; font-weight: 600; color: #9ca3af; text-transform: uppercase; letter-spacing: 0.5px;">${label}</p>
    ${isLink
      ? `<a href="mailto:${value}" style="font-size: 15px; color: #8b5cf6; text-decoration: none;">${value}</a>`
      : `<p style="margin: 0; font-size: 15px; color: #111827;">${value}</p>`
    }
  </td>
</tr>`;

  const content = `
<table role="presentation" width="100%" cellpadding="0" cellspacing="0">
  <tr>
    <td>
      <h1 style="margin: 0 0 4px 0; font-size: 20px; font-weight: 700; color: #111827;">
        New Contact Form Submission
      </h1>
      <p style="margin: 0 0 24px 0;">
        <span style="display: inline-block; padding: 4px 12px; background-color: ${badgeColor}; color: #ffffff; border-radius: 20px; font-size: 12px; font-weight: 600; text-transform: uppercase; letter-spacing: 0.3px;">
          ${data.inquiryType}
        </span>
      </p>
    </td>
  </tr>
</table>

<table role="presentation" width="100%" cellpadding="0" cellspacing="0">
  ${fieldRow('Name', data.name)}
  ${fieldRow('Email', data.email, true)}
  ${data.organization ? fieldRow('Organization', data.organization) : ''}
  ${data.phone ? fieldRow('Phone', data.phone) : ''}
</table>

<table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="margin-top: 24px;">
  <tr>
    <td>
      <p style="margin: 0 0 8px 0; font-size: 11px; font-weight: 600; color: #9ca3af; text-transform: uppercase; letter-spacing: 0.5px;">Message</p>
      <table role="presentation" width="100%" cellpadding="0" cellspacing="0">
        <tr>
          <td style="background-color: #f9fafb; border-left: 3px solid #8b5cf6; border-radius: 0 8px 8px 0; padding: 16px 20px;">
            <p style="margin: 0; font-size: 15px; color: #374151; line-height: 1.6; white-space: pre-wrap;">${data.message}</p>
          </td>
        </tr>
      </table>
    </td>
  </tr>
</table>

<p style="margin: 24px 0 0 0; font-size: 12px; color: #d1d5db;">
  Submitted on ${new Date().toLocaleString('en-US', { dateStyle: 'full', timeStyle: 'short' })}
</p>`;

  return baseLayout(content, {
    preheader: `New ${data.inquiryType} inquiry from ${data.name}`,
  });
}
