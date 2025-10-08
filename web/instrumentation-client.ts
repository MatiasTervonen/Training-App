import { initBotId } from "botid/client/core";
import * as Sentry from "@sentry/nextjs";

// Define the paths that need bot protection.
// These are paths that are routed to by your app.
// These can be:
// - API endpoints (e.g., '/api/checkout')
// - Server actions invoked from a page (e.g., '/dashboard')
// - Dynamic routes (e.g., '/api/create/*')

export const onRouterTransitionStart = Sentry.captureRouterTransitionStart;

initBotId({
  protect: [
    {
      path: "/login",
      method: "POST",
    },
    {
      path: "/signup",
      method: "POST",
    },
    {
      path: "/sendPasswordResetEmail",
      method: "POST",
    },
  ],
});

Sentry.init({
  dsn: "https://35bac4ff45d58f61e503897221f901c6@o4510142810619904.ingest.de.sentry.io/4510142826610768",
  environment: process.env.NODE_ENV,
  // Enable Sentry only in production
  enabled: process.env.NODE_ENV === "production",

  // Define how likely traces are sampled. Adjust this value in production, or use tracesSampler for greater control.
  tracesSampleRate: 1,

  // Enable logs to be sent to Sentry
  enableLogs: true,

  sendDefaultPii: true,

  // Setting this option to true will print useful information to the console while you're setting up Sentry.
  debug: false,

  beforeSend(event) {
    console.log("[Sentry] Sending event:", event); // 💡 for confirmation
    return event;
  },
});
