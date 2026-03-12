import { View, LayoutAnimation, UIManager, Platform } from "react-native";
import { KeyboardAwareScrollView } from "react-native-keyboard-controller";
import AppText from "@/components/AppText";
import { useState, useEffect, useCallback, useMemo, useRef } from "react";
import { useRouter } from "expo-router";
import {
  DraftVideo,
  ExerciseEntry,
  ExerciseInput,
  emptyExerciseEntry,
  PhaseData,
  PhaseType,
  PhaseInputMode,
} from "@/types/session";
import { activities_with_category } from "@/types/models";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { getLastExerciseHistory } from "@/database/gym/last-exercise-history";
import { useTimerStore } from "@/lib/stores/timerStore";
import { useConfirmAction } from "@/lib/confirmAction";
import GroupGymExercises from "@/features/gym/lib/GroupGymExercises";
import ExerciseCard from "@/features/gym/components/ExerciseCard";
import FullScreenModal from "@/components/FullScreenModal";
import ExerciseSelectorList from "@/features/gym/components/ExerciseSelectorList";
import SelectInput from "@/components/Selectinput";
import ExerciseHistoryModal from "@/features/gym/components/ExerciseHistoryModal";
import SaveButton from "@/components/buttons/SaveButton";
import DeleteButton from "@/components/buttons/DeleteButton";
import FullScreenLoader from "@/components/FullScreenLoader";
import { LinearGradient } from "expo-linear-gradient";
import Timer from "@/components/timer";
import PageContainer from "@/components/PageContainer";
import AnimatedButton from "@/components/buttons/animatedButton";
import { FullGymSession } from "@/database/gym/get-full-gym-session";
import useSaveGymDraft from "@/features/gym/hooks/useSaveGymDraft";
import useStartExercise from "@/features/gym/hooks/useStartExercise";
import useLogSetForExercise from "@/features/gym/hooks/useLogSetForExercise";
import useSaveSession from "@/features/gym/hooks/useSaveSession";
import RestTimerDisplay from "@/features/gym/components/RestTimerDisplay";
import { getPrefetchedHistoryPerCard } from "@/database/gym/prefetchedHistoryPerCard";
import { updateNativeTimerLabel } from "@/native/android/NativeTimer";
import { useTranslation } from "react-i18next";
import GymNotesModal from "@/features/gym/components/GymNotesModal";
import { NotebookPen, Plus } from "lucide-react-native";
import DraggableList from "@/components/DraggableList";
import PhaseCard from "@/features/gym/components/PhaseCard";
import PhaseActivityPicker from "@/features/gym/components/PhaseActivityPicker";
import usePhaseTracking from "@/features/gym/hooks/usePhaseTracking";
import { getWeight } from "@/database/weight/get-weight";

if (
  Platform.OS === "android" &&
  UIManager.setLayoutAnimationEnabledExperimental
) {
  UIManager.setLayoutAnimationEnabledExperimental(true);
}

type DraftRecording = {
  id: string;
  uri: string;
  createdAt: number;
  durationMs?: number;
};

type DraftImage = {
  id: string;
  uri: string;
};

type GymFormData = Pick<
  FullGymSession,
  | "id"
  | "title"
  | "notes"
  | "duration"
  | "gym_session_exercises"
  | "sessionImages"
  | "sessionVideos"
  | "sessionVoiceRecordings"
> & {
  gym_session_phases?: {
    phase_type: string;
    activity_id: string;
    duration_seconds: number;
    steps: number | null;
    distance_meters: number | null;
    is_manual: boolean;
    calories: number | null;
    activities: { name: string; slug: string | null; base_met: number } | null;
  }[];
};

export default function GymForm({ initialData }: { initialData: GymFormData }) {
  const confirmAction = useConfirmAction();
  const session = initialData;

  const { t } = useTranslation(["gym", "timer", "common"]);
  const [title, setTitle] = useState(session.title || `${t("gym.title")}`);
  const [exercises, setExercises] = useState<ExerciseEntry[]>(
    (session.gym_session_exercises || []).map((ex) => ({
      exercise_id: ex.exercise_id,
      name: ex.gym_exercises?.name,
      muscle_group: ex.gym_exercises?.muscle_group,
      main_group: ex.gym_exercises?.main_group,
      equipment: ex.gym_exercises?.equipment,
      superset_id: ex.superset_id ?? "",
      sets:
        ex.gym_sets?.map((s) => ({
          weight: s.weight ?? 0,
          reps: s.reps ?? 0,
          rpe: s.rpe ?? "Medium",
          time_min: s.time_min ?? 0,
          distance_meters: s.distance_meters ?? 0,
        })) || [],
    })),
  );
  const [notes, setNotes] = useState("");
  const [exerciseInputs, setExerciseInputs] = useState<ExerciseInput[]>(
    (session.gym_session_exercises || []).map(() => ({
      weight: "",
      reps: "",
      rpe: "Medium",
      time_min: "",
      distance_meters: "",
    })),
  );
  const [collapsedExercises, setCollapsedExercises] = useState<Set<string>>(
    () => new Set(exercises.map((ex) => ex.exercise_id)),
  );
  const [scrollEnabled, setScrollEnabled] = useState(true);
  const addedViaModalRef = useRef(false);
  const prevExerciseCountRef = useRef(exercises.length);
  const [durationEdit, setDurationEdit] = useState(session.duration);
  const router = useRouter();
  const [isSaving, setIsSaving] = useState(false);
  const [savingProgress, setSavingProgress] = useState<number | undefined>(
    undefined,
  );
  const [draftImages, setDraftImages] = useState<DraftImage[]>([]);
  const [draftRecordings, setDraftRecordings] = useState<DraftRecording[]>([]);
  const [draftVideos, setDraftVideos] = useState<DraftVideo[]>([]);

  // Existing media state (for editing)
  const [existingImages, setExistingImages] = useState(
    session.sessionImages ?? [],
  );
  const [existingVideos, setExistingVideos] = useState(
    session.sessionVideos ?? [],
  );
  const [existingRecordings, setExistingRecordings] = useState(
    session.sessionVoiceRecordings ?? [],
  );
  const [deletedImageIds, setDeletedImageIds] = useState<string[]>([]);
  const [deletedImagePaths, setDeletedImagePaths] = useState<string[]>([]);
  const [deletedVideoIds, setDeletedVideoIds] = useState<string[]>([]);
  const [deletedVideoPaths, setDeletedVideoPaths] = useState<string[]>([]);
  const [deletedRecordingIds, setDeletedRecordingIds] = useState<string[]>([]);
  const [deletedRecordingPaths, setDeletedRecordingPaths] = useState<string[]>(
    [],
  );

  // Phase state
  const [warmup, setWarmup] = useState<PhaseData | null>(() => {
    const wp = session.gym_session_phases?.find(
      (p) => p.phase_type === "warmup",
    );
    if (!wp || !wp.activities) return null;
    return {
      phase_type: "warmup",
      activity_id: wp.activity_id,
      activity_name: wp.activities.name,
      activity_slug: wp.activities.slug,
      activity_met: wp.activities.base_met,
      input_mode: wp.is_manual ? "manual" : "live",
      duration_seconds: wp.duration_seconds,
      steps: wp.steps,
      distance_meters: wp.distance_meters,
      is_manual: wp.is_manual,
      is_tracking: false,
    };
  });
  const [cooldown, setCooldown] = useState<PhaseData | null>(() => {
    const cd = session.gym_session_phases?.find(
      (p) => p.phase_type === "cooldown",
    );
    if (!cd || !cd.activities) return null;
    return {
      phase_type: "cooldown",
      activity_id: cd.activity_id,
      activity_name: cd.activities.name,
      activity_slug: cd.activities.slug,
      activity_met: cd.activities.base_met,
      input_mode: cd.is_manual ? "manual" : "live",
      duration_seconds: cd.duration_seconds,
      steps: cd.steps,
      distance_meters: cd.distance_meters,
      is_manual: cd.is_manual,
      is_tracking: false,
    };
  });
  const [warmupCollapsed, setWarmupCollapsed] = useState(true);
  const [cooldownCollapsed, setCooldownCollapsed] = useState(true);
  const [phasePickerOpen, setPhasePickerOpen] = useState(false);
  const [phasePickerType, setPhasePickerType] = useState<PhaseType>("warmup");

  // Phase tracking hooks
  const warmupTracking = usePhaseTracking();
  const cooldownTracking = usePhaseTracking();

  const { data: weightData } = useQuery({
    queryKey: ["latestWeight"],
    queryFn: getWeight,
  });
  const userWeight = weightData?.[0]?.weight ?? 70;

  const warmupCalories = useMemo(() => {
    if (!warmup?.activity_met) return 0;
    return Math.round(warmup.activity_met * userWeight * (warmupTracking.elapsedSeconds / 3600));
  }, [warmup?.activity_met, userWeight, warmupTracking.elapsedSeconds]);

  const cooldownCalories = useMemo(() => {
    if (!cooldown?.activity_met) return 0;
    return Math.round(cooldown.activity_met * userWeight * (cooldownTracking.elapsedSeconds / 3600));
  }, [cooldown?.activity_met, userWeight, cooldownTracking.elapsedSeconds]);

  const [showNotesModal, setShowNotesModal] = useState(false);
  const [exerciseType, setExerciseType] = useState("Normal");
  const [supersetExercise, setSupersetExercise] = useState<ExerciseEntry[]>([]);
  const [isExerciseModalOpen, setIsExerciseModalOpen] = useState(false);
  const [normalExercises, setNormalExercises] = useState<ExerciseEntry[]>([]);
  const [isHistoryOpen, setIsHistoryOpen] = useState(false);
  const [exerciseToChangeIndex, setExerciseToChangeIndex] = useState<
    number | null
  >(null);
  const [exerciseHistoryId, setExerciseHistoryId] = useState<string | null>(
    null,
  );
  const startTimestamp = useTimerStore((state) => state.startTimestamp);
  const mode = useTimerStore((state) => state.mode);

  const isEditing = Boolean(session?.id);

  const queryClient = useQueryClient();

  // useSaveGymDraft hook to save the draft

  useSaveGymDraft({
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
  });

  // Resume phase tracking from persisted tracking_started_at
  const warmupResumedRef = useRef(false);
  const cooldownResumedRef = useRef(false);

  useEffect(() => {
    if (
      warmup?.is_tracking &&
      warmup.tracking_started_at &&
      !warmupTracking.isTracking &&
      !warmupResumedRef.current
    ) {
      warmupResumedRef.current = true;
      warmupTracking.resume(warmup.tracking_started_at);
      setWarmupCollapsed(false);
    }
  }, [warmup?.is_tracking, warmup?.tracking_started_at, warmupTracking]);

  useEffect(() => {
    if (
      cooldown?.is_tracking &&
      cooldown.tracking_started_at &&
      !cooldownTracking.isTracking &&
      !cooldownResumedRef.current
    ) {
      cooldownResumedRef.current = true;
      cooldownTracking.resume(cooldown.tracking_started_at);
      setCooldownCollapsed(false);
    }
  }, [cooldown?.is_tracking, cooldown?.tracking_started_at, cooldownTracking]);

  // Use selectors to avoid re-rendering on uiTick changes
  const activeSession = useTimerStore((state) => state.activeSession);
  const setActiveSession = useTimerStore((state) => state.setActiveSession);
  const startSession = useTimerStore((state) => state.startSession);
  const clearEverything = useTimerStore((state) => state.clearEverything);

  const {
    data: history = [],
    error: historyError,
    isLoading,
  } = useQuery({
    queryKey: ["last-exercise-history", exerciseHistoryId],
    queryFn: () => getLastExerciseHistory({ exerciseId: exerciseHistoryId! }),
    enabled: isHistoryOpen && !!exerciseHistoryId,
  });

  const exerciseIds = exercises.map((ex) => ex.exercise_id!);
  const sortedExerciseIds = useMemo(
    () => [...exerciseIds].sort(),
    [exerciseIds],
  );

  const { data: prefetchedHistory = [] } = useQuery({
    queryKey: ["prefetched-history", sortedExerciseIds],
    queryFn: () => getPrefetchedHistoryPerCard(exerciseIds),
    enabled: exerciseIds.length > 0,
  });

  const historyMap = useMemo(() => {
    return Object.fromEntries(
      (prefetchedHistory ?? []).map((h) => [h.exercise_id, h]),
    );
  }, [prefetchedHistory]);

  const openHistory = (exerciseId: string) => {
    setExerciseHistoryId(exerciseId);
    setIsHistoryOpen(true);
  };

  const handleStartSession = useCallback(() => {
    setActiveSession({
      type: t("gym:gym.title"),
      label: title,
      path: "/gym/gym",
    });

    startSession(title);
  }, [title, setActiveSession, startSession, t]);

  useEffect(() => {
    const checkTemplateFlag = async () => {
      const flag = await AsyncStorage.getItem("startedFromTemplate");
      if (flag === "true") {
        handleStartSession();
        AsyncStorage.removeItem("startedFromTemplate");
      }
    };
    checkTemplateFlag();
  }, [handleStartSession]);

  // useStartExercise hook to start the exercise

  const { startExercise } = useStartExercise({
    exercises,
    setExercises,
    setExerciseInputs,
    setSupersetExercise,
    setNormalExercises,
    handleStartSession,
    exerciseType,
    supersetExercise,
    normalExercises,
  });

  // useLogSetForExercise hook to log the set for the exercise

  const { logSetForExercise } = useLogSetForExercise({
    exercises,
    exerciseInputs,
    setExerciseInputs,
    setExercises,
  });

  const resetSession = () => {
    clearEverything();
    AsyncStorage.removeItem("gym_session_draft");
    AsyncStorage.removeItem("startedFromTemplate");
    setSupersetExercise([]);
    setExerciseType("Normal");
    setExercises([]);
    setNotes("");
    setTitle(t("gym.title"));
    setNormalExercises([]);
    setExerciseInputs([]);
    setWarmup(null);
    setCooldown(null);
  };

  const handlePhaseSelect = (phaseType: PhaseType) => {
    setPhasePickerType(phaseType);
    setPhasePickerOpen(true);
    setIsExerciseModalOpen(false);
  };

  const handlePhaseActivitySelected = (
    activity: activities_with_category,
    inputMode: PhaseInputMode,
  ) => {
    const phaseData: PhaseData = {
      phase_type: phasePickerType,
      activity_id: activity.id,
      activity_name: activity.name,
      activity_slug: activity.slug ?? null,
      activity_met: activity.base_met,
      input_mode: inputMode,
      duration_seconds: 0,
      steps: null,
      distance_meters: null,
      is_manual: inputMode === "manual",
      is_tracking: inputMode === "live",
      tracking_started_at: inputMode === "live" ? Date.now() : null,
    };

    if (phasePickerType === "warmup") {
      setWarmup(phaseData);
      setWarmupCollapsed(false);
      if (inputMode === "live") {
        warmupTracking.start();
      }
    } else {
      setCooldown(phaseData);
      setCooldownCollapsed(false);
      if (inputMode === "live") {
        cooldownTracking.start();
      }
    }

    if (!startTimestamp) {
      handleStartSession();
    }
  };

  const handleStopPhaseTracking = async (phaseType: PhaseType) => {
    const confirmed = await confirmAction({
      title: t("gym.phase.confirmStopTitle"),
      message: t("gym.phase.confirmStopMessage"),
    });
    if (!confirmed) return;

    const tracking =
      phaseType === "warmup" ? warmupTracking : cooldownTracking;
    const setter = phaseType === "warmup" ? setWarmup : setCooldown;
    const setCollapsed =
      phaseType === "warmup" ? setWarmupCollapsed : setCooldownCollapsed;

    const result = await tracking.stop();
    setter((prev) =>
      prev
        ? {
            ...prev,
            duration_seconds: result.duration_seconds,
            steps: result.steps,
            is_tracking: false,
          }
        : prev,
    );
    setCollapsed(true);
  };

  const handleManualPhaseSave = (
    phaseType: PhaseType,
    data: {
      duration_seconds: number;
      distance_meters: number | null;
      steps: number | null;
    },
  ) => {
    const setter = phaseType === "warmup" ? setWarmup : setCooldown;
    const setCollapsed =
      phaseType === "warmup" ? setWarmupCollapsed : setCooldownCollapsed;

    setter((prev) =>
      prev
        ? {
            ...prev,
            duration_seconds: data.duration_seconds,
            distance_meters: data.distance_meters,
            steps: data.steps,
            is_tracking: false,
          }
        : prev,
    );
    setCollapsed(true);
  };

  // useSaveSession hook to save the session

  const { handleSaveSession } = useSaveSession({
    title,
    exercises,
    notes,
    durationEdit,
    isEditing,
    setIsSaving,
    setSavingProgress,
    resetSession,
    session,
    draftImages,
    draftRecordings,
    draftVideos,
    deletedImageIds,
    deletedImagePaths,
    deletedVideoIds,
    deletedVideoPaths,
    deletedRecordingIds,
    deletedRecordingPaths,
    warmup,
    cooldown,
  });

  // Keep a ref to the latest activeSession for use inside effects
  const activeSessionRef = useRef(activeSession);
  activeSessionRef.current = activeSession;

  useEffect(() => {
    const session = activeSessionRef.current;
    if (
      session &&
      session.type === t("gym:gym.title") &&
      session.label !== title
    ) {
      setActiveSession({
        ...session,
        label: title,
      });
    }

    // Update native timer notification with new title
    if (startTimestamp && mode) {
      const statusText =
        mode === "countdown"
          ? t("timer:timer.notification.timeRemaining")
          : t("timer:timer.notification.inProgress");
      updateNativeTimerLabel(
        startTimestamp,
        title,
        mode,
        statusText,
        t("timer:timer.notification.pauseTimer"),
        mode === "countdown"
          ? t("timer:timer.notification.extendTimer")
          : undefined,
      );
    }
  }, [title, setActiveSession, startTimestamp, mode, t]);

  useEffect(() => {
    const prev = prevExerciseCountRef.current;
    prevExerciseCountRef.current = exercises.length;

    if (exercises.length > prev && !addedViaModalRef.current) {
      // Exercises loaded from template/draft — collapse all
      setCollapsedExercises(new Set(exercises.map((ex) => ex.exercise_id)));
    }
    addedViaModalRef.current = false;
  }, [exercises.length, exercises]);

  const toggleExercise = useCallback((exerciseId: string) => {
    LayoutAnimation.configureNext(LayoutAnimation.Presets.easeInEaseOut);
    setCollapsedExercises((prev) => {
      const next = new Set(prev);
      if (next.has(exerciseId)) {
        next.delete(exerciseId);
      } else {
        next.add(exerciseId);
      }
      return next;
    });
  }, []);

  const groupedExercises = GroupGymExercises(exercises);

  return (
    <>
      {isEditing ? (
        ""
      ) : (
        <View className="flex-row items-center gap-4 bg-gray-600 p-2 px-4 w-full z-40 sticky top-0">
          <Timer
            textClassName="text-xl"
            manualSession={{
              label: title,
              path: "/gym/gym",
              type: t("gym.title"),
            }}
          />
          <RestTimerDisplay />
        </View>
      )}

      <KeyboardAwareScrollView
        keyboardShouldPersistTaps="handled"
        contentContainerStyle={{ flexGrow: 1 }}
        showsVerticalScrollIndicator={false}
        scrollEnabled={scrollEnabled}
      >
        <PageContainer className="justify-between flex-1">
          <View>
            <AppText className="text-2xl mb-8 text-center">
              {title || t("gym.gymForm.title")}
            </AppText>
            <View className="gap-5 mb-6">
              <AnimatedButton
                onPress={() => setShowNotesModal(true)}
                className="btn-neutral flex-row items-center justify-center gap-2 px-4"
              >
                <NotebookPen size={18} color="#f3f4f6" />
                <AppText>
                  {t("gym.gymForm.notesButton")}
                  {(() => {
                    const totalMedia =
                      draftRecordings.length +
                      draftImages.length +
                      draftVideos.length +
                      existingImages.length +
                      existingVideos.length +
                      existingRecordings.length;
                    return totalMedia > 0 ? ` (${totalMedia})` : "";
                  })()}
                </AppText>
              </AnimatedButton>
            </View>
          </View>

          <>
            {/* Warm-up Phase Card */}
            {warmup && (
              <View className="mt-5">
                {warmup.is_tracking ? (
                  <PhaseCard
                    mode="live"
                    phaseType="warmup"
                    activityName={warmup.activity_name}
                    activitySlug={warmup.activity_slug}
                    elapsedSeconds={warmupTracking.elapsedSeconds}
                    steps={warmupTracking.steps}
                    calories={warmupCalories}
                    onStop={() => handleStopPhaseTracking("warmup")}
                    onRemove={async () => {
                      const confirmed = await confirmAction({
                        title: t("gym.phase.confirmRemoveTitle"),
                        message: t("gym.phase.confirmRemoveMessage"),
                      });
                      if (!confirmed) return;
                      warmupTracking.stop();
                      setWarmup(null);
                    }}
                  />
                ) : warmup.input_mode === "pending" ? (
                  <PhaseCard
                    mode="pending"
                    phaseType="warmup"
                    activityName={warmup.activity_name}
                    activitySlug={warmup.activity_slug}
                    onRemove={async () => {
                      const confirmed = await confirmAction({
                        title: t("gym.phase.confirmRemoveTitle"),
                        message: t("gym.phase.confirmRemoveMessage"),
                      });
                      if (!confirmed) return;
                      setWarmup(null);
                    }}
                    onSelectMode={(mode) => {
                      if (mode === "live") {
                        const now = Date.now();
                        setWarmup((prev) => prev ? { ...prev, input_mode: "live", is_tracking: true, tracking_started_at: now } : prev);
                        warmupTracking.start();
                      } else {
                        setWarmup((prev) => prev ? { ...prev, input_mode: "manual", is_manual: true } : prev);
                      }
                      if (!startTimestamp) handleStartSession();
                    }}
                  />
                ) : warmup.is_manual &&
                  warmup.duration_seconds === 0 ? (
                  <PhaseCard
                    mode="manual"
                    phaseType="warmup"
                    activityName={warmup.activity_name}
                    activitySlug={warmup.activity_slug}
                    onRemove={async () => {
                      const confirmed = await confirmAction({
                        title: t("gym.phase.confirmRemoveTitle"),
                        message: t("gym.phase.confirmRemoveMessage"),
                      });
                      if (!confirmed) return;
                      setWarmup(null);
                    }}
                    onSave={(data) => handleManualPhaseSave("warmup", data)}
                  />
                ) : (
                  <PhaseCard
                    mode="collapsed"
                    phase={warmup}
                    isExpanded={!warmupCollapsed}
                    onExpand={() => setWarmupCollapsed((p) => !p)}
                    onRemove={async () => {
                      const confirmed = await confirmAction({
                        title: t("gym.phase.confirmRemoveTitle"),
                        message: t("gym.phase.confirmRemoveMessage"),
                      });
                      if (!confirmed) return;
                      setWarmup(null);
                    }}
                  />
                )}
              </View>
            )}

            <DraggableList
              items={Object.entries(groupedExercises)}
              keyExtractor={([, group], index) =>
                `${group.map((g) => g.exercise.exercise_id).join("-")}-${index}`
              }
              onDragStart={() => setScrollEnabled(false)}
              onDragEnd={() => setScrollEnabled(true)}
              onReorder={(reordered) => {
                const flatExercises = reordered.flatMap(([, group]) =>
                  group.map((g) => g.exercise),
                );
                const flatInputs = reordered.flatMap(([, group]) =>
                  group.map((g) => exerciseInputs[g.index]),
                );
                setExercises(flatExercises);
                setExerciseInputs(flatInputs);
              }}
              renderItem={([superset_id, group]) => (
                <LinearGradient
                  colors={["#1e3a8a", "#0f172a", "#0f172a"]}
                  start={{ x: 1, y: 0 }}
                  end={{ x: 0, y: 1 }}
                  className={`mt-5 rounded-md overflow-hidden ${
                    group.length > 1
                      ? "border-2 border-blue-700"
                      : "border-2 border-gray-600"
                  }`}
                >
                  {group.length > 1 && (
                    <AppText className="text-gray-100 text-lg text-center my-2">
                      {t("gym.gymForm.superSet")}
                    </AppText>
                  )}

                  {group.map(({ exercise, index }) => {
                    return (
                      <View key={exercise.exercise_id}>
                        <ExerciseCard
                          disabled={false}
                          mode="session"
                          isExpanded={
                            !collapsedExercises.has(exercise.exercise_id)
                          }
                          onToggleExpand={() =>
                            toggleExercise(exercise.exercise_id)
                          }
                          exercise={exercise}
                          history={historyMap[exercise.exercise_id]}
                          lastExerciseHistory={(index) => {
                            const ex = exercises[index];
                            if (ex.exercise_id) {
                              openHistory(ex.exercise_id);
                            }
                          }}
                          onChangeExercise={(index) => {
                            setExerciseToChangeIndex(index);
                            setSupersetExercise([emptyExerciseEntry]);
                            setNormalExercises([emptyExerciseEntry]);
                            setIsExerciseModalOpen(true);
                          }}
                          index={index}
                          input={exerciseInputs[index]}
                          onInputChange={(index, field, value) => {
                            const updatedInputs = [...exerciseInputs];
                            updatedInputs[index] = {
                              ...updatedInputs[index],
                              [field]: value,
                            };
                            setExerciseInputs(updatedInputs);
                          }}
                          onAddSet={(index) => logSetForExercise(index)}
                          onDeleteSet={(index, setIndex) => {
                            const updated = [...exercises];
                            updated[index].sets.splice(setIndex, 1);
                            setExercises(updated);
                          }}
                          onUpdateExercise={(index, updatedExercise) => {
                            const updated = [...exercises];
                            updated[index] = updatedExercise;
                            setExercises(updated);
                          }}
                          onDeleteExercise={async (index) => {
                            const confirmDelete = await confirmAction({
                              title: t(
                                "gym.gymForm.confirmDeleteExerciseTitle",
                              ),
                              message: t(
                                "gym.gymForm.confirmDeleteExerciseMessage",
                              ),
                            });
                            if (!confirmDelete) return;

                            const updated = exercises.filter(
                              (_, i) => i !== index,
                            );
                            setExercises(updated);
                            setCollapsedExercises((prev) => {
                              const next = new Set(prev);
                              next.delete(exercise.exercise_id);
                              return next;
                            });

                            const sessionDraft = {
                              title: title,
                              exercises: updated,
                              notes,
                            };
                            AsyncStorage.setItem(
                              "gym_session_draft",
                              JSON.stringify(sessionDraft),
                            );
                          }}
                        />
                      </View>
                    );
                  })}
                </LinearGradient>
              )}
            />

            {/* Cool-down Phase Card */}
            {cooldown && (
              <View className="mt-5">
                {cooldown.is_tracking ? (
                  <PhaseCard
                    mode="live"
                    phaseType="cooldown"
                    activityName={cooldown.activity_name}
                    activitySlug={cooldown.activity_slug}
                    elapsedSeconds={cooldownTracking.elapsedSeconds}
                    steps={cooldownTracking.steps}
                    calories={cooldownCalories}
                    onStop={() => handleStopPhaseTracking("cooldown")}
                    onRemove={async () => {
                      const confirmed = await confirmAction({
                        title: t("gym.phase.confirmRemoveTitle"),
                        message: t("gym.phase.confirmRemoveMessage"),
                      });
                      if (!confirmed) return;
                      cooldownTracking.stop();
                      setCooldown(null);
                    }}
                  />
                ) : cooldown.input_mode === "pending" ? (
                  <PhaseCard
                    mode="pending"
                    phaseType="cooldown"
                    activityName={cooldown.activity_name}
                    activitySlug={cooldown.activity_slug}
                    onRemove={async () => {
                      const confirmed = await confirmAction({
                        title: t("gym.phase.confirmRemoveTitle"),
                        message: t("gym.phase.confirmRemoveMessage"),
                      });
                      if (!confirmed) return;
                      setCooldown(null);
                    }}
                    onSelectMode={(mode) => {
                      if (mode === "live") {
                        const now = Date.now();
                        setCooldown((prev) => prev ? { ...prev, input_mode: "live", is_tracking: true, tracking_started_at: now } : prev);
                        cooldownTracking.start();
                      } else {
                        setCooldown((prev) => prev ? { ...prev, input_mode: "manual", is_manual: true } : prev);
                      }
                      if (!startTimestamp) handleStartSession();
                    }}
                  />
                ) : cooldown.is_manual &&
                  cooldown.duration_seconds === 0 ? (
                  <PhaseCard
                    mode="manual"
                    phaseType="cooldown"
                    activityName={cooldown.activity_name}
                    activitySlug={cooldown.activity_slug}
                    onRemove={async () => {
                      const confirmed = await confirmAction({
                        title: t("gym.phase.confirmRemoveTitle"),
                        message: t("gym.phase.confirmRemoveMessage"),
                      });
                      if (!confirmed) return;
                      setCooldown(null);
                    }}
                    onSave={(data) =>
                      handleManualPhaseSave("cooldown", data)
                    }
                  />
                ) : (
                  <PhaseCard
                    mode="collapsed"
                    phase={cooldown}
                    isExpanded={!cooldownCollapsed}
                    onExpand={() => setCooldownCollapsed((p) => !p)}
                    onRemove={async () => {
                      const confirmed = await confirmAction({
                        title: t("gym.phase.confirmRemoveTitle"),
                        message: t("gym.phase.confirmRemoveMessage"),
                      });
                      if (!confirmed) return;
                      setCooldown(null);
                    }}
                  />
                )}
              </View>
            )}

            <FullScreenModal
              isOpen={isExerciseModalOpen}
              onClose={() => {
                setIsExerciseModalOpen(false);
                setExerciseType("Normal");
                queryClient.invalidateQueries({ queryKey: ["exercises"] });
              }}
            >
              <View className="flex-1">
                <ExerciseSelectorList
                  draftExercises={
                    exerciseType === "Super-Set"
                      ? supersetExercise
                      : normalExercises
                  }
                  setDraftExercises={
                    exerciseType === "Super-Set"
                      ? setSupersetExercise
                      : setNormalExercises
                  }
                  exerciseToChangeIndex={exerciseToChangeIndex}
                  setExerciseToChangeIndex={setExerciseToChangeIndex}
                  exercises={exercises}
                  setExercises={setExercises}
                  setIsExerciseModalOpen={setIsExerciseModalOpen}
                  hasWarmup={!!warmup}
                  hasCooldown={!!cooldown}
                  onSelectPhase={handlePhaseSelect}
                />
              </View>
              <View className="flex-row gap-3 px-2 mt-5 mb-10 z-50">
                <View className="flex-1">
                  <SelectInput
                    label={t("gym.exerciseDropdown.exerciseTypeTitle")}
                    value={exerciseType}
                    onChange={(value) => {
                      const type = value;
                      setExerciseType(type);
                      if (type === "Normal") {
                        setSupersetExercise([]);
                      } else if (type === "Super-Set") {
                        setSupersetExercise([emptyExerciseEntry]);
                      }
                    }}
                    options={[
                      {
                        label: t("gym.gymForm.exerciseTypeSelector.normal"),
                        value: "Normal",
                      },
                      {
                        label: t("gym.gymForm.exerciseTypeSelector.superSet"),
                        value: "Super-Set",
                      },
                    ]}
                  />
                </View>
                <View className="flex-1">
                  <AnimatedButton
                    onPress={() => {
                      addedViaModalRef.current = true;
                      startExercise();
                      setIsExerciseModalOpen(false);
                    }}
                    className="justify-center items-center py-2 bg-blue-800 rounded-md shadow-md border-2 border-blue-500"
                  >
                    <AppText className="text-lg">
                      {exerciseType === "Super-Set"
                        ? t("gym.gymForm.exerciseTypeButton.addSuperSet")
                        : t("gym.gymForm.exerciseTypeButton.addExercise")}
                    </AppText>
                  </AnimatedButton>
                </View>
              </View>
            </FullScreenModal>

            <ExerciseHistoryModal
              isOpen={isHistoryOpen}
              onClose={() => setIsHistoryOpen(false)}
              isLoading={isLoading}
              history={Array.isArray(history) ? history : []}
              error={historyError ? historyError.message : null}
            />

            <AnimatedButton
              onPress={() => {
                setExerciseType("Normal");
                setSupersetExercise([emptyExerciseEntry]);
                setNormalExercises([emptyExerciseEntry]);
                setIsExerciseModalOpen(true);
              }}
              className="mt-10 w-2/4 items-center justify-center mx-auto flex-row gap-2 bg-blue-800 py-2 rounded-md border-2 border-blue-500"
              label={t("gym.gymForm.addExerciseButtonLabel")}
            >
              <Plus size={20} color="#f3f4f6" />
            </AnimatedButton>

            <View className="flex-row gap-4 mt-20">
              <View className="flex-1">
                {isEditing ? (
                  <DeleteButton
                    confirm={false}
                    label={t("gym.gymForm.editDeleteButtonLabel")}
                    onPress={() => router.push("/dashboard")}
                  />
                ) : (
                  <DeleteButton onPress={resetSession} />
                )}
              </View>
              <View className="flex-1">
                <SaveButton onPress={handleSaveSession} />
              </View>
            </View>
          </>
        </PageContainer>
      </KeyboardAwareScrollView>

      <GymNotesModal
        isOpen={showNotesModal}
        onClose={() => setShowNotesModal(false)}
        title={title}
        setTitle={setTitle}
        notes={notes}
        setNotes={setNotes}
        isEditing={isEditing}
        durationEdit={durationEdit}
        setDurationEdit={setDurationEdit}
        draftRecordings={draftRecordings}
        setDraftRecordings={setDraftRecordings}
        draftImages={draftImages}
        setDraftImages={setDraftImages}
        draftVideos={draftVideos}
        setDraftVideos={setDraftVideos}
        existingImages={existingImages}
        existingVideos={existingVideos}
        existingRecordings={existingRecordings}
        onDeleteExistingImage={(id) => {
          const image = existingImages.find((img) => img.id === id);
          if (image) {
            setDeletedImagePaths((prev) => [...prev, image.storage_path]);
          }
          setDeletedImageIds((prev) => [...prev, id]);
          setExistingImages((prev) => prev.filter((img) => img.id !== id));
        }}
        onDeleteExistingVideo={(id) => {
          const video = existingVideos.find((v) => v.id === id);
          if (video) {
            const paths = [video.storage_path];
            if (video.thumbnail_storage_path)
              paths.push(video.thumbnail_storage_path);
            setDeletedVideoPaths((prev) => [...prev, ...paths]);
          }
          setDeletedVideoIds((prev) => [...prev, id]);
          setExistingVideos((prev) => prev.filter((v) => v.id !== id));
        }}
        onDeleteExistingRecording={(id) => {
          const recording = existingRecordings.find((r) => r.id === id);
          if (recording) {
            setDeletedRecordingPaths((prev) => [
              ...prev,
              recording.storage_path,
            ]);
          }
          setDeletedRecordingIds((prev) => [...prev, id]);
          setExistingRecordings((prev) => prev.filter((r) => r.id !== id));
        }}
      />

      <PhaseActivityPicker
        isOpen={phasePickerOpen}
        onClose={() => setPhasePickerOpen(false)}
        phaseType={phasePickerType}
        onSelect={handlePhaseActivitySelected}
      />

      <FullScreenLoader
        visible={isSaving}
        message={
          savingProgress !== undefined
            ? t("common:common.media.uploading")
            : t("gym.gymForm.fullScreenLoaderLabel")
        }
        progress={savingProgress}
      />
    </>
  );
}
