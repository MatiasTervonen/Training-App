import { handleError } from "@/app/(app)/utils/handleError";
import { createClient } from "@/utils/supabase/server";
import { NextRequest } from "next/server";
import { fileTypeFromBuffer } from "file-type";
import sharp from "sharp";

export async function POST(req: NextRequest) {
  const authHeader = req.headers.get("authorization");
  if (!authHeader?.startsWith("Bearer ")) {
    return new Response(JSON.stringify({ error: "Unauthorized" }), {
      status: 401,
      headers: { "Content-Type": "application/json" },
    });
  }

  const supabase = await createClient();

  const token = authHeader?.replace("Bearer ", "");

  const { data, error: authError } = await supabase.auth.getClaims(token);

  const user = data?.claims;

  if (authError || !user) {
    return new Response(JSON.stringify({ error: "Unauthorized" }), {
      status: 401,
      headers: { "Content-Type": "application/json" },
    });
  }

  const formData = await req.formData();
  const file = formData.get("file") as File;

  if (!file || typeof file === "string") {
    return new Response(JSON.stringify({ error: "No file provided" }), {
      status: 400,
      headers: { "Content-Type": "application/json" },
    });
  }

  const arrayBuffer = await file.arrayBuffer();
  const buffer = Buffer.from(arrayBuffer);
  const fileType = await fileTypeFromBuffer(buffer);

  if (
    !fileType ||
    !["image/jpeg", "image/png", "image/webp"].includes(fileType.mime)
  ) {
    return new Response(
      JSON.stringify({
        error: "Invalid file type. Please upload a JPEG, PNG, or WEBP image.",
      }),
      {
        status: 400,
        headers: { "Content-Type": "application/json" },
      }
    );
  }

  if (file.size > 5 * 1024 * 1024) {
    return new Response(
      JSON.stringify({ error: "File size exceeds 5MB limit." }),
      {
        status: 400,
        headers: { "Content-Type": "application/json" },
      }
    );
  }

  const optimizedBuffer = await sharp(buffer, { limitInputPixels: 4000 * 4000 })
    .resize(300, 300, { fit: "cover" })
    .toFormat("webp")
    .toBuffer();

  const filePath = `${user.sub}.webp`;

  const { error: uploadError } = await supabase.storage
    .from("profile-pictures")
    .upload(filePath, optimizedBuffer, {
      upsert: true,
      contentType: "image/webp",
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
