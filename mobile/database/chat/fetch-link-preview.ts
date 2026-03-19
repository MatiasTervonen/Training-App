import { supabase } from "@/lib/supabase";
import { LinkPreview } from "@/types/chat";

export async function fetchLinkPreview(
  messageId: string,
  url: string,
): Promise<LinkPreview | null> {
  try {
    const { data, error } = await supabase.functions.invoke(
      "fetch-link-preview",
      { body: { messageId, url } },
    );

    if (error) {
      console.warn("Link preview fetch failed:", error.message);
      return null;
    }

    return (data?.preview as LinkPreview) ?? null;
  } catch {
    return null;
  }
}

/** Fetch preview without saving to DB — used for input preview before sending */
export async function fetchLinkPreviewOnly(
  url: string,
): Promise<LinkPreview | null> {
  try {
    const { data, error } = await supabase.functions.invoke(
      "fetch-link-preview",
      { body: { url } },
    );

    if (error) {
      console.warn("Link preview fetch failed:", error.message);
      return null;
    }

    return (data?.preview as LinkPreview) ?? null;
  } catch {
    return null;
  }
}
