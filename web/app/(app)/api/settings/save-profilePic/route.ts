import { handleError } from "@/app/(app)/utils/handleError";
import { createClient } from "@/utils/supabase/server";
import { NextRequest } from "next/server";

export async function POST(req: NextRequest) {
  const supabase = await createClient();

  const formData = await req.formData();
  const file = formData.get("file") as File;

  if (!file || typeof file === "string") {
    return new Response(JSON.stringify({ error: "No file provided" }), {
      status: 400,
      headers: { "Content-Type": "application/json" },
    });
  }

  const { data, error: authError } = await supabase.auth.getClaims();
  const user = data?.claims;

  if (authError || !user) {
    return new Response(JSON.stringify({ error: "Unauthorized" }), {
      status: 401,
      headers: { "Content-Type": "application/json" },
    });
  }

  const fileText = file.name.split(".").pop();
  const filePath = `${user.sub}.${fileText}`;

  const { error: uploadError } = await supabase.storage
    .from("profile-pictures")
    .upload(filePath, file, {
      upsert: true,
    });

  if (uploadError) {
    handleError(uploadError, {
      message: "Error uploading profile picture",
      route: "/api/settings/save-profilePic",
      method: "POST",
    });
    return new Response(JSON.stringify({ error: uploadError.message }), {
      status: 500,
      headers: { "Content-Type": "application/json" },
    });
  }

  const { data: publicData } = supabase.storage
    .from("profile-pictures")
    .getPublicUrl(filePath);

  const publicUrl = publicData.publicUrl;

  const { error: updateError } = await supabase
    .from("users")
    .update({ profile_picture: publicUrl })
    .eq("id", user.sub);

  if (updateError) {
    handleError(updateError, {
      message: "Error updating user profile picture",
      route: "/api/settings/save-profilePic",
      method: "POST",
    });
    return new Response(JSON.stringify({ error: updateError.message }), {
      status: 500,
      headers: { "Content-Type": "application/json" },
    });
  }

  return new Response(JSON.stringify({ publicUrl }), {
    status: 200,
    headers: { "Content-Type": "application/json" },
  });
}
