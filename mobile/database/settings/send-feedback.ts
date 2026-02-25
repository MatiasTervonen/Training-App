import { supabase } from "@/lib/supabase";
import { handleError } from "@/utils/handleError";

export async function sendFeedback(params: {
  category: string;
  title: string;
  message: string;
}) {
  const {
    data: { session },
    error: sessionError,
  } = await supabase.auth.getSession();

  if (sessionError || !session || !session.user) {
    throw new Error("Unauthorized");
  }

  const { error } = await supabase
    .from("feedback")
    .insert({
      user_id: session.user.id,
      category: params.category,
      title: params.title,
      message: params.message,
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
