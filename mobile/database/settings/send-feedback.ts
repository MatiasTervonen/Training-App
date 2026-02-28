import { supabase } from "@/lib/supabase";
import { handleError } from "@/utils/handleError";
import * as Crypto from "expo-crypto";
import { File } from "expo-file-system/next";

export async function sendFeedback(params: {
  category: string;
  title: string;
  message: string;
  imageUris?: string[];
}) {
  const {
    data: { session },
    error: sessionError,
  } = await supabase.auth.getSession();

  if (sessionError || !session || !session.user) {
    throw new Error("Unauthorized");
  }

  const uploadedImagePaths: string[] = [];

  try {
    for (const uri of params.imageUris ?? []) {
      const ext = uri.split(".").pop()?.toLowerCase() ?? "jpg";
      const mimeType =
        ext === "png"
          ? "image/png"
          : ext === "webp"
            ? "image/webp"
            : "image/jpeg";
      const path = `${session.user.id}/${Crypto.randomUUID()}.${ext}`;

      const file = new File(uri);
      const bytes = await file.bytes();

      const { error: uploadError } = await supabase.storage
        .from("feedback-images")
        .upload(path, bytes, { contentType: mimeType });

      if (uploadError) {
        throw uploadError;
      }

      uploadedImagePaths.push(path);
    }

    const { error } = await supabase.from("feedback").insert({
      user_id: session.user.id,
      category: params.category,
      title: params.title,
      message: params.message,
      image_paths: uploadedImagePaths,
    });

    if (error) {
      throw error;
    }

    return true;
  } catch (error) {
    if (uploadedImagePaths.length > 0) {
      await supabase.storage
        .from("feedback-images")
        .remove(uploadedImagePaths);
    }
    handleError(error, {
      message: "Error sending feedback",
      route: "/database/settings/send-feedback",
      method: "POST",
    });
    throw new Error("Error sending feedback");
  }
}
