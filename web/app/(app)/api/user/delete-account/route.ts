import { createAdminClient } from "@/utils/supabase/admin";
import { handleError } from "@/utils/handleError";

const STORAGE_BUCKETS = [
  "notes-voice",
  "notes-images",
  "media-videos",
  "feedback-images",
];

async function deleteUserStorage(
  adminSupabase: ReturnType<typeof createAdminClient>,
  userId: string,
) {
  // Delete files in {user_id}/ folders
  for (const bucket of STORAGE_BUCKETS) {
    const { data: files } = await adminSupabase.storage
      .from(bucket)
      .list(userId);

    if (files && files.length > 0) {
      const paths = files.map((f) => `${userId}/${f.name}`);
      await adminSupabase.storage.from(bucket).remove(paths);
    }
  }

  // Delete profile picture ({user_id}.webp at root)
  await adminSupabase.storage
    .from("profile-pictures")
    .remove([`${userId}.webp`]);
}

export async function POST(request: Request) {
  const authHeader = request.headers.get("authorization");
  if (!authHeader?.startsWith("Bearer ")) {
    return new Response(JSON.stringify({ error: "Unauthorized" }), {
      status: 401,
      headers: { "Content-Type": "application/json" },
    });
  }

  const adminSupabase = createAdminClient();
  const token = authHeader.replace("Bearer ", "");

  const { data, error: authError } = await adminSupabase.auth.getClaims(token);

  const user = data?.claims;

  if (authError || !user) {
    return new Response(JSON.stringify({ error: "Unauthorized " }), {
      status: 401,
      headers: { "Content-Type": "application/json" },
    });
  }

  const { error: authTableError } = await adminSupabase.auth.admin.deleteUser(
    user.sub,
  );

  if (authTableError) {
    handleError(authTableError, {
      message: "Error deleting user",
      route: "/api/user/delete-account",
      method: "POST",
    });
    return new Response(JSON.stringify({ error: "Error deleting user" }), {
      status: 500,
      headers: { "Content-Type": "application/json" },
    });
  }

  // Clean up storage files after user deletion
  try {
    await deleteUserStorage(adminSupabase, user.sub);
  } catch (error) {
    handleError(error, {
      message: "Storage cleanup error after user deletion",
      route: "/api/user/delete-account",
      method: "POST",
    });
  }

  return new Response(JSON.stringify({ success: true }), {
    status: 200,
    headers: { "Content-Type": "application/json" },
  });
}
