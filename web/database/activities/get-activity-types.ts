import { handleError } from "@/utils/handleError";
import { createClient } from "@/utils/supabase/client";

export type ActivityType = {
  slug: string;
  name: string;
};

export async function getActivityTypes(): Promise<ActivityType[]> {
  const supabase = createClient();

  const { data, error } = await supabase
    .from("feed_items")
    .select("extra_fields")
    .eq("type", "activity_sessions");

  if (error) {
    handleError(error, {
      message: "Error fetching activity types",
      route: "server-action: getActivityTypes",
      method: "direct",
    });
    throw new Error("Error fetching activity types");
  }

  const seen = new Map<string, string>();
  for (const row of data ?? []) {
    const fields = row.extra_fields as Record<string, string> | null;
    const slug = fields?.activity_slug;
    const name = fields?.activity_name;
    if (slug && name && !seen.has(slug)) {
      seen.set(slug, name);
    }
  }

  return Array.from(seen.entries())
    .map(([slug, name]) => ({ slug, name }))
    .sort((a, b) => a.name.localeCompare(b.name));
}
