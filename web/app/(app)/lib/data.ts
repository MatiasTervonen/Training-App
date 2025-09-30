import { createClient } from "@/utils/supabase/server";
import type { User as SupabaseUser } from "@supabase/supabase-js";
import GetSession from "./getSession";
import { Feed_item, FeedResponse } from "../types/session";

type Role = "user" | "admin" | "super_admin" | "guest" | null;

interface UserPreferences {
  display_name: string;
  weight_unit: string;
  profile_picture: string | null;
}

// Check if user is admin or super_admin

export async function checkAdmin() {
  const supabase = await createClient();

  const {
    data: { user },
    error: authError,
  } = await supabase.auth.getUser();

  if (authError || !user) {
    return { user: null, role: null };
  }

  const { data: profile, error: profileError } = await supabase
    .from("users")
    .select("role")
    .eq("id", user.id)
    .single();

  if (profileError || !profile) {
    return { user: null, role: null };
  }

  return { user, role: profile.role };
}

// get user role and preferences

export async function getUserRoleAndPreferences(): Promise<{
  user: SupabaseUser | null;
  preferences: UserPreferences | null;
  role: Role;
}> {
  const supabase = await createClient();

  const {
    data: { user },
    error: authError,
  } = await supabase.auth.getUser();

  if (authError || !user) {
    return { user: null, preferences: null, role: null };
  }

  const { data: profile, error: profileError } = await supabase
    .from("users")
    .select("display_name, weight_unit, profile_picture, role")
    .eq("id", user.id)
    .single();

  if (!profile || profileError) {
    return { user, preferences: null, role: null };
  }

  const { role, ...preferences } = profile;

  return { user, preferences, role: role as Role };
}

// Get Feed

export async function getFeed(
  page: number,
  limit: number
): Promise<FeedResponse> {
  const { feed, error } = await GetSession({ limit, page });

  if (error) {
    console.error("Error fetching feed:", error);
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

  const {
    data: { user },
    error: authError,
  } = await supabase.auth.getUser();

  if (authError || !user) {
    return { user: null, preferences: null, role: null };
  }

  const { error } = await supabase.from("user_push_subscriptions").upsert(
    {
      user_id: user.id,
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
    console.error("Error saving push subscription:", error);
    return { success: false, error: "Failed to save push subscription" };
  }

  return { success: true };
}

// Delete push notification subscription from the database

export async function deletePushSubscription(endpoint: string) {
  const supabase = await createClient();

  const {
    data: { user },
    error: authError,
  } = await supabase.auth.getUser();

  if (authError || !user) {
    return { user: null, preferences: null, role: null };
  }

  const { error } = await supabase
    .from("user_push_subscriptions")
    .delete()
    .eq("user_id", user.id)
    .eq("endpoint", endpoint);

  if (error) {
    console.error("Error deleting push subscription:", error);
    return { success: false, error: "Failed to delete push subscription" };
  }

  return { success: true };
}

// Get all active push subscriptions from the database

export async function getAllActivePushSubscriptions() {
  const supabase = await createClient();

  const {
    data: { user },
    error: authError,
  } = await supabase.auth.getUser();

  if (authError || !user) {
    return { user: null, preferences: null, role: null };
  }

  const { data, error } = await supabase
    .from("user_push_subscriptions")
    .select("*")
    .eq("is_active", true)
    .eq("user_id", user.id);

  if (error) {
    console.error("Error fetching active push subscriptions:", error);
    return {
      subscriptions: [],
      error: "Failed to fetch active push subscriptions",
    };
  }

  return { subscriptions: data || [] };
}
