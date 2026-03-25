import { useEffect, useState } from "react";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { useDebouncedCallback } from "use-debounce";
import { handleError } from "@/utils/handleError";

type MealDraftItem = {
  localId: string;
  food_id: string | null;
  custom_food_id: string | null;
  food_name: string;
  brand: string | null;
  calories_per_100g: number;
  protein_per_100g: number;
  carbs_per_100g: number;
  fat_per_100g: number;
  serving_size_g: number;
  quantity: number;
};

type MealDraft = {
  name: string;
  items: MealDraftItem[];
  editingMealId?: string;
};

const DRAFT_KEY = "meal_draft";

export default function useSaveMealDraft({
  name,
  items,
  editingMealId,
  setName,
  setItems,
}: {
  name: string;
  items: MealDraftItem[];
  editingMealId?: string;
  setName: (name: string) => void;
  setItems: (items: MealDraftItem[]) => void;
}) {
  const [isLoaded, setIsLoaded] = useState(false);

  useEffect(() => {
    const loadDraft = async () => {
      try {
        const stored = await AsyncStorage.getItem(DRAFT_KEY);
        if (stored) {
          const draft: MealDraft = JSON.parse(stored);
          // Only restore if not editing a different meal
          if (!editingMealId || draft.editingMealId === editingMealId) {
            setName(draft.name || "");
            setItems(draft.items || []);
          }
        }
      } catch (error) {
        handleError(error, {
          message: "Error loading meal draft",
          route: "nutrition/CreateEditMealModal",
          method: "loadDraft",
        });
      } finally {
        setIsLoaded(true);
      }
    };
    loadDraft();
  }, [setIsLoaded, editingMealId]);

  const saveDraft = useDebouncedCallback(
    async () => {
      if (!isLoaded) return;

      if (name.trim().length === 0 && items.length === 0) {
        await AsyncStorage.removeItem(DRAFT_KEY);
      } else {
        const draft: MealDraft = { name, items, editingMealId };
        await AsyncStorage.setItem(DRAFT_KEY, JSON.stringify(draft));
      }
    },
    500,
    { maxWait: 3000 },
  );

  useEffect(() => {
    saveDraft();
  }, [name, items, saveDraft]);

  const clearDraft = async () => {
    await AsyncStorage.removeItem(DRAFT_KEY);
  };

  return { clearDraft, isLoaded };
}
