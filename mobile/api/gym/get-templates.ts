import { supabase } from "@/lib/supabase";
import { handleError } from "@/utils/handleError";

export default async function GetTemplate() {
  const {
    data: { session },
    error: sessionError,
  } = await supabase.auth.getSession();

  if (sessionError || !session || !session.user) {
    throw new Error("No session");
  }

  const { data: template, error: templateError } = await supabase
    .from("gym_templates")
    .select("id, name, created_at")
    .eq("user_id", session.user.id)
    .order("created_at", { ascending: false });

  if (templateError || !template) {
    handleError(templateError, {
      message: "Error fetching templates",
      route: "/api/gym/get-templates",
      method: "GET",
    });
    throw new Error(templateError?.message || "Error fetching templates");
  }

  return template;
}
