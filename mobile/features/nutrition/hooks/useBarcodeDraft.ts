import { useCallback, useEffect, useRef, useState } from "react";
import AsyncStorage from "@react-native-async-storage/async-storage";

export type BarcodeDraft = {
  barcode: string;
  name: string;
  brand: string;
  servingSizeG: string;
  servingDescription: string;
  caloriesPer100g: string;
  proteinPer100g: string;
  carbsPer100g: string;
  fatPer100g: string;
  saturatedFatPer100g: string;
  sugarPer100g: string;
  fiberPer100g: string;
  sodiumPer100g: string;
  saltPer100g: string;
};

const DRAFT_KEY = "product-draft-pending";

/** Read pending draft without a hook — for one-off checks */
export async function getPendingDraft(): Promise<BarcodeDraft | null> {
  try {
    const raw = await AsyncStorage.getItem(DRAFT_KEY);
    if (!raw) return null;
    return JSON.parse(raw);
  } catch {
    return null;
  }
}

/** Clear pending draft without a hook */
export async function clearPendingDraft(): Promise<void> {
  await AsyncStorage.removeItem(DRAFT_KEY).catch(() => {});
}

export function useBarcodeDraft(barcode: string | null | undefined) {
  const [draft, setDraft] = useState<BarcodeDraft | null>(null);
  const [isLoaded, setIsLoaded] = useState(false);
  const timerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => {
    if (!barcode) {
      setIsLoaded(true);
      return;
    }
    AsyncStorage.getItem(DRAFT_KEY)
      .then((raw) => {
        if (raw) {
          try {
            const parsed: BarcodeDraft = JSON.parse(raw);
            // Only restore if the draft matches this barcode
            if (parsed.barcode === barcode) {
              setDraft(parsed);
            }
          } catch {
            // Corrupted draft — ignore
          }
        }
      })
      .finally(() => setIsLoaded(true));
  }, [barcode]);

  const saveDraft = useCallback(
    (values: Omit<BarcodeDraft, "barcode">) => {
      if (!barcode) return;
      if (timerRef.current) clearTimeout(timerRef.current);
      timerRef.current = setTimeout(() => {
        AsyncStorage.setItem(
          DRAFT_KEY,
          JSON.stringify({ ...values, barcode }),
        ).catch(() => {});
      }, 500);
    },
    [barcode],
  );

  const clearDraft = useCallback(() => {
    if (timerRef.current) clearTimeout(timerRef.current);
    AsyncStorage.removeItem(DRAFT_KEY).catch(() => {});
  }, []);

  useEffect(() => {
    return () => {
      if (timerRef.current) clearTimeout(timerRef.current);
    };
  }, []);

  return { draft, isLoaded, saveDraft, clearDraft };
}
