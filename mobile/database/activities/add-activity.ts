import { supabase } from "@/lib/supabase";
import { handleError } from "@/utils/handleError";

type Activity = {
  name: string;
  category_id: string;

};

export async function addActivity({
  name,
  category_id,
}: Activity) {


  const { error } = await supabase
    .from("activities")
    .insert([
      {
        name,
        category_id,
      },
    ])
    .select()
    .single();


  if (error) {
    console.error("Error adding new activity:", error);
    handleError(error, {
      message: "Error adding new activity",
      route: "/database/activities/add-activity",
      method: "POST",
    });
    throw new Error("Error adding new activity");
  }

  return { success: true };
}
