import React from "npm:react@18.3.1";
import { Webhook } from "https://esm.sh/standardwebhooks@1.0.0";
import { Resend } from "npm:resend@4.0.0";
import { renderAsync } from "npm:@react-email/components@0.0.22";
import { ConfirmationEmail } from "./_templates/confirmation.tsx";
import { ResetPasswordEmail } from "./_templates/reset-password.tsx";

const resend = new Resend(Deno.env.get("RESEND_API_KEY") as string);
const hookSecret = (
  Deno.env.get("SEND_EMAIL_HOOK_SECRET") as string
).replace("v1,whsec_", "");

Deno.serve(async (req) => {
  if (req.method !== "POST") {
    return new Response("Method not allowed", { status: 400 });
  }

  const payload = await req.text();
  const headers = Object.fromEntries(req.headers);
  const wh = new Webhook(hookSecret);

  try {
    const {
      user,
      email_data: { token_hash, redirect_to, email_action_type, site_url },
    } = wh.verify(payload, headers) as {
      user: { email: string };
      email_data: {
        token: string;
        token_hash: string;
        redirect_to: string;
        email_action_type: string;
        site_url: string;
        token_new: string;
        token_hash_new: string;
      };
    };

    const baseUrl = site_url;
    let subject: string;
    let html: string;

    switch (email_action_type) {
      case "signup": {
        const confirmationUrl = `${baseUrl}/auth/confirm?token_hash=${token_hash}&type=signup`;
        subject = "Confirm your email";
        html = await renderAsync(
          React.createElement(ConfirmationEmail, { confirmationUrl })
        );
        break;
      }
      case "recovery": {
        const resetUrl = `${baseUrl}/auth/confirm?token_hash=${token_hash}&type=recovery&next=${redirect_to || "/"}`;
        subject = "Reset your password";
        html = await renderAsync(
          React.createElement(ResetPasswordEmail, { resetUrl })
        );
        break;
      }
default:
        throw new Error(`Unsupported email type: ${email_action_type}`);
    }

    const { error } = await resend.emails.send({
      from: "Kurvi <no-reply@mail.kurvi.io>",
      to: [user.email],
      subject,
      html,
    });

    if (error) throw error;
  } catch (error: unknown) {
    const err = error as Error;
    console.error("Hook error:", err.message, err.stack);
    return new Response(
      JSON.stringify({
        error: {
          http_code: error.code,
          message: error.message,
        },
      }),
      {
        status: 401,
        headers: { "Content-Type": "application/json" },
      }
    );
  }

  return new Response(JSON.stringify({}), {
    status: 200,
    headers: { "Content-Type": "application/json" },
  });
});
