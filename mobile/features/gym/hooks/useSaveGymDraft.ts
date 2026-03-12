import { useEffect, useState } from "react";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { useDebouncedCallback } from "use-debounce";
import { ExerciseEntry, ExerciseInput, DraftRecording, DraftImage, DraftVideo, PhaseData } from "@/types/session";
import { handleError } from "@/utils/handleError";
import { formatDate } from "@/lib/formatDate";

export default function useSaveGymDraft({
  exercises,
  notes,
  title,
  isEditing,
  draftRecordings,
  draftImages,
  draftVideos,
  warmup,
  cooldown,
  setTitle,
  setExercises,
  setNotes,
  setExerciseInputs,
  setDraftRecordings,
  setDraftImages,
  setDraftVideos,
  setWarmup,
  setCooldown,
}: {
  exercises: ExerciseEntry[];
  notes: string;
  title: string;
  isEditing: boolean;
  draftRecordings: DraftRecording[];
  draftImages: DraftImage[];
  draftVideos: DraftVideo[];
  warmup?: PhaseData | null;
  cooldown?: PhaseData | null;
  setTitle: (title: string) => void;
  setExercises: (exercises: ExerciseEntry[]) => void;
  setNotes: (notes: string) => void;
  setExerciseInputs: (exerciseInputs: ExerciseInput[]) => void;
  setDraftRecordings: (recordings: DraftRecording[]) => void;
  setDraftImages: (images: DraftImage[]) => void;
  setDraftVideos: (videos: DraftVideo[]) => void;
  setWarmup?: (warmup: PhaseData | null) => void;
  setCooldown?: (cooldown: PhaseData | null) => void;
}) {
  const [hasLoadedDraft, setHasLoadedDraft] = useState(false);

  const now = formatDate(new Date());

  useEffect(() => {
    if (isEditing) return;

    const loadDraft = async () => {
      try {
        const draft = await AsyncStorage.getItem("gym_session_draft");
        if (draft) {
          const parsedDraft = JSON.parse(draft);
          setTitle(parsedDraft.title || `Gym - ${now}`);
          setExercises(parsedDraft.exercises || []);
          setNotes(parsedDraft.notes || "");
          setExerciseInputs(
            parsedDraft.exercises
              ? parsedDraft.exercises.map(() => ({
                  weight: "",
                  reps: "",
                  rpe: "Medium",
                  time_min: "",
                  distance_meters: "",
                }))
              : []
          );
          setDraftRecordings(parsedDraft.draftRecordings || []);
          setDraftImages(parsedDraft.draftImages || []);
          const videos: DraftVideo[] = parsedDraft.draftVideos || [];
          setDraftVideos(videos.filter((v) => !v.isCompressing));
          if (parsedDraft.warmup) {
            setWarmup?.(parsedDraft.warmup);
          }
          if (parsedDraft.cooldown) {
            setCooldown?.(parsedDraft.cooldown);
          }
        }
      } catch (error) {
        handleError(error, {
          message: "Error loading gym draft",
          route: "gym/index.tsx",
          method: "loadDraft",
        });
      } finally {
        setHasLoadedDraft(true);
      }
    };
    loadDraft();
  }, [
    isEditing,
    setTitle,
    setExercises,
    setNotes,
    setExerciseInputs,
    setDraftRecordings,
    setDraftImages,
    setDraftVideos,
    setHasLoadedDraft,
  ]);

  const saveGymDraft = useDebouncedCallback(
    async () => {
      if (!hasLoadedDraft || isEditing) return;

      if (
        exercises.length === 0 &&
        notes.trim() === "" &&
        title.trim() === "" &&
        !warmup &&
        !cooldown
      ) {
        AsyncStorage.removeItem("gym_session_draft");
        return;
      } else {
        const sessionDraft = {
          title,
          exercises,
          notes,
          draftRecordings,
          draftImages,
          draftVideos: draftVideos.filter((v) => !v.isCompressing),
          warmup: warmup ?? null,
          cooldown: cooldown ?? null,
        };

        await AsyncStorage.setItem(
          "gym_session_draft",
          JSON.stringify(sessionDraft)
        );
      }
    },
    500,
    { maxWait: 3000 }
  );

  useEffect(() => {
    saveGymDraft();
  }, [notes, title, exercises, draftRecordings, draftImages, draftVideos, warmup, cooldown, saveGymDraft]);

  useEffect(() => {
    return () => {
      saveGymDraft.flush();
    };
  }, [saveGymDraft]);

  return {
    saveGymDraft,
  };
}
