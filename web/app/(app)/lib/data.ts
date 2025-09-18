import { createClient } from "@/utils/supabase/server";
import type { User as SupabaseUser } from "@supabase/supabase-js";
import GetSession from "./getSession";
import GetPinned from "./getPinned";
import { pinned_item } from "../types/models";
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
  const { feed } = await GetSession({ limit, page });
  const { pinned } = await GetPinned();

  // Filter out feed items that are pinned to avoid duplicates
  const pinnedItemIds = new Set(pinned.map((p: pinned_item) => p.item_id));
  const filteredFeed = feed.filter((item) => !pinnedItemIds.has(item.id!));

  // Ensure pinned items use pinned: true and convert duration to number
  const pinnedItems = pinned.map((item: pinned_item) => ({
    ...item,
    duration: item.duration !== null ? Number(item.duration) : null,
    pinned: true, // Use pinned
  }));

  const feedItems = filteredFeed.map((item) => ({
    ...item,
    pinned: false,
  }));

  const feedWithPinned =
    page === 1 ? [...pinnedItems, ...feedItems] : feedItems;

  return {
    feed: feedWithPinned as Feed_item[],
    nextPage: feed.length === limit ? page + 1 : null,
  };
}
