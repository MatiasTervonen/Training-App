import { createClient } from "@/utils/supabase/server";
import GetSession from "./getSession";
import { Feed_item, FeedResponse } from "../types/session";
import { handleError } from "@/app/(app)/utils/handleError";

type Role = "user" | "admin" | "super_admin" | "guest" | null;

interface UserPreferences {
  display_name: string;
  weight_unit: string;
  profile_picture: string | null;
}

// Check if user is admin or super_admin

export async function checkAdmin() {
  const supabase = await createClient();

  const { data, error: authError } = await supabase.auth.getClaims();

  const user = data?.claims;

  if (authError || !user) {
    return { user: null, role: null };
  }

  const { data: profile, error: profileError } = await supabase
    .from("users")
    .select("role")
    .eq("id", user.sub)
    .single();

  if (profileError || !profile) {
    handleError(profileError, {
      message: "Error fetching user role",
      method: "GET",
    });
    return { user: null, role: null };
  }

  return { user, role: profile.role };
}

// get user role and preferences

export async function getUserRoleAndPreferences(): Promise<{
  user: string | null;
  preferences: UserPreferences | null;
  role: Role;
}> {
  const supabase = await createClient();

  const { data, error: authError } = await supabase.auth.getClaims();

  const user = data?.claims;

  if (authError || !user) {
    return { user: null, preferences: null, role: null };
  }

  const { data: profile, error: profileError } = await supabase
    .from("users")
    .select("display_name, weight_unit, profile_picture, role")
    .eq("id", user.sub)
    .single();

  if (!profile || profileError) {
    handleError(profileError, {
      message: "Error fetching user preferences",
      method: "GET",
    });
    return { user: user.sub, preferences: null, role: null };
  }

  const { role, ...preferences } = profile;

  return { user: user.sub, preferences, role: role as Role };
}

// Get Feed

export async function getFeed(
  page: number,
  limit: number
): Promise<FeedResponse> {
  const { feed, error } = await GetSession({ limit, page });

  if (error) {
    handleError(error, {
      message: "Error fetching feed",
      method: "GET",
    });
    return { feed: [], nextPage: null };
  }

  return {
    feed: feed as Feed_item[],
    nextPage: feed.length === limit ? page + 1 : null,
  };
}

// Save push notification subscription to the database

export async function savePushSubscription(subscription: {
  endpoint: string;
  p256dh: string;
  auth: string;
  device_type?: string;
}) {
  const supabase = await createClient();

  const { data, error: authError } = await supabase.auth.getClaims();

  const user = data?.claims;

  if (authError || !user) {
    return { user: null, preferences: null, role: null };
  }

  const { error } = await supabase.from("user_push_subscriptions").upsert(
    {
      user_id: user.sub,
      endpoint: subscription.endpoint,
      p256dh: subscription.p256dh,
      auth: subscription.auth,
      device_type: subscription.device_type ?? "web",
      updated_at: new Date().toISOString(),
      is_active: true,
    },
    { onConflict: "user_id,endpoint" }
  );

  if (error) {
    handleError(error, {
      message: "Error saving push subscription",
      method: "POST",
    });
    return { success: false, error: "Failed to save push subscription" };
  }

  return { success: true };
}

// Delete push notification subscription from the database

export async function deletePushSubscription(endpoint: string) {
  const supabase = await createClient();

  const { data, error: authError } = await supabase.auth.getClaims();

  const user = data?.claims;

  if (authError || !user) {
    return { user: null, preferences: null, role: null };
  }

  const { error } = await supabase
    .from("user_push_subscriptions")
    .delete()
    .eq("user_id", user.sub)
    .eq("endpoint", endpoint);

  if (error) {
    handleError(error, {
      message: "Error deleting push subscription",
      method: "POST",
    });
    return { success: false, error: "Failed to delete push subscription" };
  }

  return { success: true };
}

// Get all active push subscriptions from the database

export async function getAllActivePushSubscriptions() {
  const supabase = await createClient();

  const { data, error: authError } = await supabase.auth.getClaims();

  const user = data?.claims;

  if (authError || !user) {
    return { user: null, preferences: null, role: null };
  }

  const { data: subscriptions, error } = await supabase
    .from("user_push_subscriptions")
    .select("*")
    .eq("is_active", true)
    .eq("user_id", user.sub);

  if (error) {
    handleError(error, {
      message: "Error fetching active push subscriptions",
      method: "GET",
    });
    return {
      subscriptions: [],
      error: "Failed to fetch active push subscriptions",
    };
  }

  return { subscriptions: subscriptions || [] };
}
