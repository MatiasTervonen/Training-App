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

  const {
    data: { user },
    error: authError,
  } = await supabase.auth.getUser();

  if (authError || !user) {
    return new Response(JSON.stringify({ error: "Unauthorized" }), {
      status: 401,
      headers: { "Content-Type": "application/json" },
    });
  }

  const fileText = file.name.split(".").pop();
  const filePath = `${user.id}.${fileText}`;

  const { error: uploadError } = await supabase.storage
    .from("profile-pictures")
    .upload(filePath, file, {
      upsert: true,
    });

  if (uploadError) {
    console.error("Error uploading image:", uploadError);
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
    .eq("id", user.id);

  if (updateError) {
    console.error("Error updating user profile picture:", updateError);
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
