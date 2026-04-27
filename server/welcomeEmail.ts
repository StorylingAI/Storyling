import { sendEmail } from "./_core/email";
import { welcomeEmail } from "./emailTemplates";

function defaultBaseUrl(): string {
  return process.env.VITE_APP_URL || process.env.BASE_URL || "https://storyling.ai";
}

export function buildWelcomeAppUrl(baseUrl?: string | null): string {
  const normalized = (baseUrl || defaultBaseUrl()).replace(/\/+$/, "");
  return normalized.endsWith("/app") ? normalized : `${normalized}/app`;
}

export async function sendWelcomeEmail(params: {
  to?: string | null;
  name?: string | null;
  baseUrl?: string | null;
  context?: string;
}): Promise<boolean> {
  if (!params.to) return false;

  try {
    const sent = await sendEmail({
      to: params.to,
      subject: "Welcome to Storyling AI",
      html: welcomeEmail({
        name: params.name,
        appUrl: buildWelcomeAppUrl(params.baseUrl),
      }),
    });

    if (!sent) {
      console.error(
        `[Welcome Email] Failed to send welcome email to ${params.to}${params.context ? ` (${params.context})` : ""}`
      );
    }

    return sent;
  } catch (error) {
    console.error(
      `[Welcome Email] Failed to send welcome email to ${params.to}${params.context ? ` (${params.context})` : ""}:`,
      error
    );
    return false;
  }
}
