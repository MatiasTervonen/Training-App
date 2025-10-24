import { NextResponse, NextRequest } from "next/server";
import { createAdminClient } from "@/utils/supabase/admin";
import webpush from "web-push";
import { handleError } from "@/app/(app)/utils/handleError";

export async function POST(request: NextRequest) {
  const authHeader = request.headers.get("authorization");
  if (authHeader !== `Bearer ${process.env.CRON_SECRET}`) {
    return new NextResponse("Unauthorized", {
      status: 401,
    });
  }

  const supabase = createAdminClient();

  webpush.setVapidDetails(
    "mailto:matias.tervonen@hotmail.com",
    process.env.NEXT_PUBLIC_VAPID_PUBLIC_KEY!,
    process.env.VAPID_PRIVATE_KEY!
  );

  const { data: items, error: itemsError } = await supabase
    .from("reminders")
    .select("*")
    .lte("notify_at", new Date().toISOString())
    .eq("delivered", false);

  if (itemsError) {
    handleError(itemsError, {
      message: "Error fetching reminders",
      route: "/api/reminder-cronjob",
      method: "POST",
    });
    return new NextResponse("Error", {
      status: 500,
    });
  }

  if (!items || items.length === 0) {
    return new NextResponse("No notifications due");
  }

  for (const item of items) {
    const { data: subscriptions, error: subError } = await supabase
      .from("user_push_subscriptions")
      .select("*")
      .eq("user_id", item.user_id);

    if (subError) {
      handleError(subError, {
        message: "Error fetching subscriptions",
        route: "/api/reminder-cronjob",
        method: "POST",
      });
      continue;
    }

    const { data: expoTokens, error: expoError } = await supabase
      .from("user_push_mobile_subscriptions")
      .select("*")
      .eq("user_id", item.user_id);

    if (expoError) {
      handleError(expoError, {
        message: "Error fetching mobile subscriptions",
        route: "/api/reminder-cronjob",
        method: "POST",
      });
      continue;
    }

    let allSent = true;

    for (const sub of subscriptions ?? []) {
      try {
        await webpush.sendNotification(
          {
            endpoint: sub.endpoint,
            keys: {
              p256dh: sub.p256dh ?? "",
              auth: sub.auth ?? "",
            },
          },
          JSON.stringify({
            notification: {
              title: item.title,
              body: item.notes,
              icon: "/android-chrome-192x192.png",
            },
          })
        );
      } catch (error: unknown) {
        const e = error as webpush.WebPushError;
        allSent = false;
        handleError(e, {
          message: "Error sending notification",
          route: "/api/reminder-cronjob",
          method: "POST",
        });

        if (e.statusCode === 410 || e.statusCode === 404) {
          const { error: deleteError } = await supabase
            .from("user_push_subscriptions")
            .delete()
            .eq("id", sub.id);

          if (deleteError) {
            handleError(deleteError, {
              message: "Error deleting subscription",
              route: "/api/reminder-cronjob",
              method: "POST",
            });
          }
        }
      }
    }

    // Send mobile push notifications via Expo
    for (const expoSub of expoTokens ?? []) {
      try {
        const response = await fetch("https://exp.host/--/api/v2/push/send", {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            to: expoSub.token,
            sound: "default",
            title: item.title,
            body: item.notes,
          }),
        });

        const result = await response.json();

        if (result.data && result.data.status === "error") {
          if (result.data.details?.error === "DeviceNotRegistered") {
            // Delete the invalid token from your database
            await supabase
              .from("user_push_mobile_subscriptions")
              .delete()
              .eq("id", expoSub.id);
          }
        }
      } catch (error) {
        allSent = false;
        handleError(error as Error, {
          message: "Error sending Expo notification",
          route: "/api/reminder-cronjob",
          method: "POST",
        });
      }
    }

    if (allSent) {
      const { error: updateError } = await supabase
        .from("reminders")
        .update({ delivered: true })
        .eq("id", item.id);

      if (updateError) {
        handleError(updateError, {
          message: "Error marking reminder as delivered",
          route: "/api/reminder-cronjob",
          method: "POST",
        });
      }
    }
  }

  return new NextResponse(JSON.stringify({ success: true }), {
    status: 200,
    headers: { "Content-Type": "application/json" },
  });
}
