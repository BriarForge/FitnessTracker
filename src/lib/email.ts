import { Resend } from "resend";

import { getEnv } from "@/lib/env";

type MagicLinkEmailInput = {
  email: string;
  url: string;
};

let resend: Resend | null = null;

function getResendClient() {
  const env = getEnv();

  if (!env.RESEND_API_KEY) {
    return null;
  }

  if (!resend) {
    resend = new Resend(env.RESEND_API_KEY);
  }

  return resend;
}

export async function sendMagicLinkEmail({
  email,
  url,
}: MagicLinkEmailInput) {
  const env = getEnv();
  const client = getResendClient();

  if (!client || !env.AUTH_FROM_EMAIL) {
    if (process.env.NODE_ENV !== "production") {
      console.info(`Magic link for ${email}: ${url}`);
      return;
    }

    throw new Error(
      "Email delivery is not configured. Set RESEND_API_KEY and AUTH_FROM_EMAIL.",
    );
  }

  await client.emails.send({
    from: env.AUTH_FROM_EMAIL,
    to: email,
    subject: "Your sign-in link for Fitness Tracker",
    text: `Use this link to sign in:\n\n${url}\n\nThis link expires in 15 minutes.`,
    html: `
      <div style="font-family: Arial, sans-serif; line-height: 1.5; color: #111827;">
        <h1 style="font-size: 20px; margin-bottom: 12px;">Sign in to Fitness Tracker</h1>
        <p style="margin-bottom: 16px;">Use the button below to finish signing in.</p>
        <p style="margin-bottom: 24px;">
          <a
            href="${url}"
            style="display: inline-block; background: #111827; color: #ffffff; padding: 12px 18px; border-radius: 999px; text-decoration: none;"
          >
            Sign in
          </a>
        </p>
        <p style="margin-bottom: 8px;">If the button does not work, paste this URL into your browser:</p>
        <p style="word-break: break-all; color: #4b5563;">${url}</p>
        <p style="margin-top: 24px; color: #6b7280;">This link expires in 15 minutes.</p>
      </div>
    `,
  });
}
