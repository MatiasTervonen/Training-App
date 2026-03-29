import { useEffect, useRef, useState } from "react";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { useDebouncedCallback } from "use-debounce";
import { handleError } from "@/utils/handleError";
import type { DayEntry, TargetEntry } from "@/features/gym/plans/types";

const DRAFTS_KEY = "training_plan_drafts";

export type DraftSummary = {
  id: string;
  name: string;
  updatedAt: string;
};

type DraftData = {
  id: string;
  name: string;
  totalWeeks: number | null;
  noEndDate: boolean;
  weeksInput: string;
  days: DayEntry[];
  targets: TargetEntry[];
  step: number;
  setIdCounter: number;
  updatedAt: string;
};

async function readAllDrafts(): Promise<DraftData[]> {
  const raw = await AsyncStorage.getItem(DRAFTS_KEY);
  if (!raw) return [];
  return JSON.parse(raw) as DraftData[];
}

async function writeAllDrafts(drafts: DraftData[]) {
  if (drafts.length === 0) {
    await AsyncStorage.removeItem(DRAFTS_KEY);
  } else {
    await AsyncStorage.setItem(DRAFTS_KEY, JSON.stringify(drafts));
  }
}

export async function getDraftSummaries(): Promise<DraftSummary[]> {
  const drafts = await readAllDrafts();
  return drafts.map((d) => ({ id: d.id, name: d.name, updatedAt: d.updatedAt }));
}

export async function clearPlanDraft(draftId: string) {
  const drafts = await readAllDrafts();
  await writeAllDrafts(drafts.filter((d) => d.id !== draftId));
}

// Migrate old single-draft format to new multi-draft format
async function migrateOldDraft() {
  const oldKey = "training_plan_draft";
  const oldRaw = await AsyncStorage.getItem(oldKey);
  if (!oldRaw) return;

  const old = JSON.parse(oldRaw);
  const migrated: DraftData = {
    id: Date.now().toString(),
    name: old.name || "",
    totalWeeks: old.totalWeeks ?? 4,
    noEndDate: old.noEndDate ?? false,
    weeksInput: old.weeksInput || "4",
    days: old.days || [],
    targets: old.targets || [],
    step: old.step || 1,
    setIdCounter: old.setIdCounter || 0,
    updatedAt: new Date().toISOString(),
  };

  const existing = await readAllDrafts();
  existing.push(migrated);
  await writeAllDrafts(existing);
  await AsyncStorage.removeItem(oldKey);
}

export default function useSavePlanDraft({
  draftId,
  name,
  totalWeeks,
  noEndDate,
  weeksInput,
  days,
  targets,
  step,
  setIdCounterRef,
  setName,
  setTotalWeeks,
  setNoEndDate,
  setWeeksInput,
  setDays,
  setTargets,
  setStep,
  onDraftLoaded,
}: {
  draftId: string;
  name: string;
  totalWeeks: number | null;
  noEndDate: boolean;
  weeksInput: string;
  days: DayEntry[];
  targets: TargetEntry[];
  step: number;
  setIdCounterRef: React.MutableRefObject<number>;
  setName: (v: string) => void;
  setTotalWeeks: (v: number | null) => void;
  setNoEndDate: (v: boolean) => void;
  setWeeksInput: (v: string) => void;
  setDays: (v: DayEntry[]) => void;
  setTargets: (v: TargetEntry[]) => void;
  setStep: (v: number) => void;
  onDraftLoaded?: (days: DayEntry[]) => void;
}) {
  const [isLoaded, setIsLoaded] = useState(false);
  const onDraftLoadedRef = useRef(onDraftLoaded);
  onDraftLoadedRef.current = onDraftLoaded;

  useEffect(() => {
    const loadDraft = async () => {
      try {
        // Migrate old format on first load
        await migrateOldDraft();

        const drafts = await readAllDrafts();
        const draft = drafts.find((d) => d.id === draftId);
        if (draft) {
          const loadedDays = draft.days || [];
          setName(draft.name || "");
          setTotalWeeks(draft.totalWeeks ?? 4);
          setNoEndDate(draft.noEndDate ?? false);
          setWeeksInput(draft.weeksInput || "4");
          setDays(loadedDays);
          setTargets(draft.targets || []);
          setStep(draft.step || 1);
          setIdCounterRef.current = draft.setIdCounter || 0;
          onDraftLoadedRef.current?.(loadedDays);
        }
      } catch (error) {
        handleError(error, {
          message: "Error loading plan draft",
          route: "gym/plans/create",
          method: "loadDraft",
        });
      } finally {
        setIsLoaded(true);
      }
    };
    loadDraft();
  }, [draftId, setName, setTotalWeeks, setNoEndDate, setWeeksInput, setDays, setTargets, setStep, setIdCounterRef]);

  const saveDraft = useDebouncedCallback(
    async () => {
      if (!isLoaded) return;

      const drafts = await readAllDrafts();
      const idx = drafts.findIndex((d) => d.id === draftId);

      if (name.trim() === "" && days.length === 0) {
        // Remove this draft if empty
        if (idx !== -1) {
          drafts.splice(idx, 1);
          await writeAllDrafts(drafts);
        }
      } else {
        const draftData: DraftData = {
          id: draftId,
          name,
          totalWeeks,
          noEndDate,
          weeksInput,
          days,
          targets,
          step,
          setIdCounter: setIdCounterRef.current,
          updatedAt: new Date().toISOString(),
        };

        if (idx !== -1) {
          drafts[idx] = draftData;
        } else {
          drafts.push(draftData);
        }
        await writeAllDrafts(drafts);
      }
    },
    500,
    { maxWait: 3000 },
  );

  useEffect(() => {
    saveDraft();
  }, [name, totalWeeks, noEndDate, weeksInput, days, targets, step, saveDraft]);

  return { saveDraft, isLoaded };
}
