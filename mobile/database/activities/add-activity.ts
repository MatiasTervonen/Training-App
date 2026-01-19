import { supabase } from "@/lib/supabase";
import { handleError } from "@/utils/handleError";

type Activity = {
  name: string;
  category: string;

};

export async function addActivity({
  name,
  category,
}: Activity) {


  const { error } = await supabase
    .from("activities")
    .insert([
      {
        name,
        category,
      },
    ])
    .select()
    .single();


  if (error) {
    handleError(error, {
      message: "Error adding new activity",
      route: "/database/activities/add-activity",
      method: "POST",
    });
    throw new Error("Error adding new activity");
  }

  return { success: true };
}
