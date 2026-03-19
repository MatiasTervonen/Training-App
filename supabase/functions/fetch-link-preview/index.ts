import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

interface LinkPreview {
  url: string;
  title: string | null;
  description: string | null;
  image: string | null;
  site_name: string | null;
}

function extractOgTag(html: string, property: string): string | null {
  // Match both property="og:X" and name="og:X" variants
  const regex = new RegExp(
    `<meta[^>]*(?:property|name)=["']og:${property}["'][^>]*content=["']([^"']*)["']|<meta[^>]*content=["']([^"']*)["'][^>]*(?:property|name)=["']og:${property}["']`,
    "i",
  );
  const match = html.match(regex);
  return match ? (match[1] ?? match[2] ?? null) : null;
}

function extractTitleTag(html: string): string | null {
  const match = html.match(/<title[^>]*>([^<]*)<\/title>/i);
  return match ? match[1].trim() : null;
}

function resolveUrl(base: string, relative: string | null): string | null {
  if (!relative) return null;
  if (relative.startsWith("http://") || relative.startsWith("https://")) {
    return relative;
  }
  try {
    return new URL(relative, base).href;
  } catch {
    return null;
  }
}

Deno.serve(async (req: Request) => {
  if (req.method === "OPTIONS") {
    return new Response("ok", {
      headers: {
        "Access-Control-Allow-Origin": "*",
        "Access-Control-Allow-Headers":
          "authorization, x-client-info, apikey, content-type",
      },
    });
  }

  try {
    // Verify JWT
    const authHeader = req.headers.get("Authorization");
    if (!authHeader) {
      return new Response(JSON.stringify({ error: "Missing authorization" }), {
        status: 401,
        headers: { "Content-Type": "application/json" },
      });
    }

    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const supabaseServiceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;

    // Create a client with the user's JWT to get their user ID
    const userClient = createClient(supabaseUrl, Deno.env.get("SUPABASE_ANON_KEY")!, {
      global: { headers: { Authorization: authHeader } },
    });

    const {
      data: { user },
    } = await userClient.auth.getUser();
    if (!user) {
      return new Response(JSON.stringify({ error: "Invalid token" }), {
        status: 401,
        headers: { "Content-Type": "application/json" },
      });
    }

    const { messageId, url } = await req.json();
    if (!url) {
      return new Response(
        JSON.stringify({ error: "url is required" }),
        { status: 400, headers: { "Content-Type": "application/json" } },
      );
    }

    const serviceClient = createClient(supabaseUrl, supabaseServiceKey);

    // If messageId provided, verify user is the message sender
    if (messageId) {
      const { data: message } = await serviceClient
        .from("chat_messages")
        .select("sender_id")
        .eq("id", messageId)
        .single();

      if (!message || message.sender_id !== user.id) {
        return new Response(
          JSON.stringify({ error: "Not authorized to update this message" }),
          { status: 403, headers: { "Content-Type": "application/json" } },
        );
      }
    }

    // Fetch URL with timeout and body limit
    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), 5000);

    let html: string;
    try {
      const response = await fetch(url, {
        signal: controller.signal,
        headers: {
          "User-Agent":
            "Mozilla/5.0 (compatible; LinkPreviewBot/1.0)",
          Accept: "text/html",
        },
        redirect: "follow",
      });

      if (!response.ok) {
        return new Response(JSON.stringify({ preview: null }), {
          status: 200,
          headers: { "Content-Type": "application/json" },
        });
      }

      // Read up to 100KB
      const reader = response.body?.getReader();
      if (!reader) {
        return new Response(JSON.stringify({ preview: null }), {
          status: 200,
          headers: { "Content-Type": "application/json" },
        });
      }

      const chunks: Uint8Array[] = [];
      let totalSize = 0;
      const maxSize = 100 * 1024;

      while (true) {
        const { done, value } = await reader.read();
        if (done) break;
        chunks.push(value);
        totalSize += value.length;
        if (totalSize >= maxSize) break;
      }
      reader.cancel();

      html = new TextDecoder().decode(
        chunks.reduce((acc, chunk) => {
          const merged = new Uint8Array(acc.length + chunk.length);
          merged.set(acc);
          merged.set(chunk, acc.length);
          return merged;
        }, new Uint8Array()),
      );
    } catch {
      // Timeout or network error
      return new Response(JSON.stringify({ preview: null }), {
        status: 200,
        headers: { "Content-Type": "application/json" },
      });
    } finally {
      clearTimeout(timeout);
    }

    // Parse OG tags
    const title = extractOgTag(html, "title") ?? extractTitleTag(html);
    const description = extractOgTag(html, "description");
    const image = resolveUrl(url, extractOgTag(html, "image"));
    const siteName = extractOgTag(html, "site_name");

    // If no meaningful data, return null
    if (!title && !description && !image) {
      return new Response(JSON.stringify({ preview: null }), {
        status: 200,
        headers: { "Content-Type": "application/json" },
      });
    }

    const preview: LinkPreview = {
      url,
      title: title ?? null,
      description: description ?? null,
      image: image ?? null,
      site_name: siteName ?? null,
    };

    // Update message with preview data if messageId provided
    if (messageId) {
      await serviceClient
        .from("chat_messages")
        .update({ link_preview: preview })
        .eq("id", messageId);
    }

    return new Response(JSON.stringify({ preview }), {
      status: 200,
      headers: { "Content-Type": "application/json" },
    });
  } catch (error) {
    console.error("Link preview error:", error);
    return new Response(JSON.stringify({ preview: null }), {
      status: 200,
      headers: { "Content-Type": "application/json" },
    });
  }
});
