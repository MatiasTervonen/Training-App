import { NextResponse, NextRequest } from "next/server";
import { createAdminClient } from "@/utils/supabase/admin";
import webpush from "web-push";

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
    .from("notes")
    .select("*")
    .lte("notify_at", new Date().toISOString())
    .eq("delivered", false);

  if (itemsError) {
    console.error(itemsError);
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
      console.error("Error fetching subscriptions", subError);
      continue;
    }

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
            title: "Test Notification",
            body: item.title,
            icon: "/android-chrome-192x192.png",
          })
        );
      } catch (error: unknown) {
        const e = error as webpush.WebPushError;

        console.error("Error sending notification:", error);

        if (e.statusCode === 410 || e.statusCode === 404) {
          const { error: deleteError } = await supabase
            .from("user_push_subscriptions")
            .delete()
            .eq("id", sub.id);

          if (deleteError) {
            console.error("Error deleting subscription:", deleteError);
          }
        }
      }
    }

    const { error: updateError } = await supabase
      .from("notes")
      .update({ delivered: true })
      .eq("id", item.id);

    if (updateError) {
      console.error("Error marking note as delivered:", updateError);
    }
  }

  return new NextResponse(JSON.stringify({ success: true }), {
    status: 200,
    headers: { "Content-Type": "application/json" },
  });
}
