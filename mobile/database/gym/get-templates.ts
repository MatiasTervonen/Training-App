import { supabase } from "@/lib/supabase";
import { handleError } from "@/utils/handleError";

export default async function GetTemplate() {
  const { data: template, error: templateError } = await supabase
    .from("gym_templates")
    .select("id, name, created_at, updated_at")
    .order("created_at", { ascending: false });

  if (templateError || !template) {
    handleError(templateError, {
      message: "Error fetching templates",
      route: "/database/gym/get-templates",
      method: "GET",
    });
    throw new Error("Error fetching templates");
  }

  return template;
}
