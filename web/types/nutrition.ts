export type DailyFoodLog = {
  id: string;
  food_name: string;
  brand: string | null;
  meal_type: string;
  serving_size_g: number;
  quantity: number;
  calories: number;
  protein: number;
  carbs: number;
  fat: number;
  notes: string | null;
  is_custom: boolean;
  food_id: string | null;
  custom_food_id: string | null;
  image_url: string | null;
  nutrition_label_url: string | null;
  serving_description: string | null;
  fiber_per_100g: number | null;
  sugar_per_100g: number | null;
  sodium_per_100g: number | null;
  saturated_fat_per_100g: number | null;
  calories_per_100g: number | null;
  protein_per_100g: number | null;
  carbs_per_100g: number | null;
  fat_per_100g: number | null;
  created_at: string;
  meal_time: string | null;
};

export type NutritionGoals = {
  calorie_goal: number;
  protein_goal: number | null;
  carbs_goal: number | null;
  fat_goal: number | null;
  fiber_goal: number | null;
  sugar_goal: number | null;
  sodium_goal: number | null;
  saturated_fat_goal: number | null;
  visible_nutrients: string[] | null;
  custom_meal_types: string[] | null;
  updated_at: string;
};

export type FoodSearchResult = {
  id: string;
  name: string;
  brand: string | null;
  serving_size_g: number;
  serving_description: string | null;
  calories_per_100g: number;
  protein_per_100g: number;
  carbs_per_100g: number;
  fat_per_100g: number;
  fiber_per_100g: number | null;
  sugar_per_100g: number | null;
  sodium_per_100g: number | null;
  saturated_fat_per_100g: number | null;
  image_url: string | null;
  nutrition_label_url: string | null;
  is_custom: boolean;
  barcode: string | null;
};

export type NutritionSearchResult = {
  id: string | null;
  name: string;
  brand: string | null;
  calories_per_100g: number;
  protein_per_100g: number;
  carbs_per_100g: number;
  fat_per_100g: number;
  saturated_fat_per_100g: number | null;
  sugar_per_100g: number | null;
  fiber_per_100g: number | null;
  sodium_per_100g: number | null;
  serving_size_g: number;
  serving_description: string | null;
  image_url: string | null;
  image_nutrition_url: string | null;
  barcode: string | null;
  is_custom: boolean;
  source: "local" | "custom" | "api";
  apiSource?: "openfoodfacts" | "usda";
};

export type FavoriteFood = {
  id: string;
  food_id: string | null;
  custom_food_id: string | null;
  name: string;
  brand: string | null;
  calories_per_100g: number;
  protein_per_100g: number;
  carbs_per_100g: number;
  fat_per_100g: number;
  serving_size_g: number;
  serving_description: string | null;
  image_url: string | null;
  barcode: string | null;
  is_custom: boolean;
};

export type RecentFood = {
  food_id: string | null;
  custom_food_id: string | null;
  name: string;
  brand: string | null;
  calories_per_100g: number;
  protein_per_100g: number;
  carbs_per_100g: number;
  fat_per_100g: number;
  serving_size_g: number;
  serving_description: string | null;
  image_url: string | null;
  barcode: string | null;
  is_custom: boolean;
};

export type SavedMealItem = {
  id: string;
  food_id: string | null;
  custom_food_id: string | null;
  serving_size_g: number;
  quantity: number;
  sort_order: number;
  food_name: string;
  brand: string | null;
  calories_per_100g: number;
  protein_per_100g: number;
  carbs_per_100g: number;
  fat_per_100g: number;
  is_custom: boolean;
  image_url: string | null;
};

export type SavedMeal = {
  id: string;
  name: string;
  created_at: string;
  updated_at: string | null;
  items: SavedMealItem[];
};

export type NutritionFeedPayload = {
  total_calories: number;
  total_protein: number;
  total_carbs: number;
  total_fat: number;
  entry_count: number;
  calorie_goal: number;
};
