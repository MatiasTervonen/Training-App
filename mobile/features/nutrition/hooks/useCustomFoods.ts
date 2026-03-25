import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/lib/supabase";

type CustomFood = {
  id: string;
  name: string;
  brand: string | null;
  serving_size_g: number;
  serving_description: string | null;
  calories_per_100g: number;
  protein_per_100g: number | null;
  carbs_per_100g: number | null;
  fat_per_100g: number | null;
  fiber_per_100g: number | null;
  sugar_per_100g: number | null;
  sodium_per_100g: number | null;
  created_at: string;
};

async function getCustomFoods(): Promise<CustomFood[]> {
  const { data, error } = await supabase
    .from("custom_foods")
    .select("*")
    .order("name", { ascending: true });

  if (error) throw error;
  return data ?? [];
}

export function useCustomFoods() {
  return useQuery({
    queryKey: ["customFoods"],
    queryFn: getCustomFoods,
  });
}
