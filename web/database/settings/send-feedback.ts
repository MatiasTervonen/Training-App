import { createClient } from "@/utils/supabase/client";
import { handleError } from "@/utils/handleError";

export async function sendFeedback(feedback: {
  category: "bug" | "feature" | "general";
  title: string;
  message: string;
  imagePaths?: string[];
}) {
  const supabase = createClient();

  const { data, error: authError } = await supabase.auth.getClaims();
  const user = data?.claims;

  if (authError || !user) {
    throw new Error("Unauthorized");
  }

  const { error } = await supabase.from("feedback").insert({
    user_id: user.sub,
    category: feedback.category,
    title: feedback.title,
    message: feedback.message,
    image_paths: feedback.imagePaths ?? [],
  });

  if (error) {
    handleError(error, {
      message: "Error sending feedback",
      route: "/database/settings/send-feedback",
      method: "POST",
    });
    throw new Error("Error sending feedback");
  }

  return true;
}
