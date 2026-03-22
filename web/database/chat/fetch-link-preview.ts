import { createClient } from "@/utils/supabase/client";

export async function fetchLinkPreview(url: string, messageId?: string) {
  const supabase = createClient();
  const { data, error } = await supabase.functions.invoke("fetch-link-preview", {
    body: { url, ...(messageId ? { message_id: messageId } : {}) },
  });
  if (error) throw error;
  return data as { url: string; title: string | null; description: string | null; image: string | null; site_name: string | null };
}
