import { useState, useCallback, useRef } from "react";
import { useQuery } from "@tanstack/react-query";
import { useTranslation } from "react-i18next";
import { useConfirmAction } from "@/lib/confirmAction";
import { getTemplates } from "@/database/gym/get-templates";
import { getFullTemplate } from "@/database/gym/get-full-template";
import { getLastExerciseHistory } from "@/database/gym/last-exercise-history";
import Toast from "react-native-toast-message";
import type { DayEntry, DayExercise, TargetEntry, TargetSet, ExerciseSelection } from "@/features/gym/plans/types";

type UsePlanFormOptions = {
  noEndDate: boolean;
  totalWeeks: number | null;
};

export default function usePlanForm({ noEndDate, totalWeeks }: UsePlanFormOptions) {
  const { t } = useTranslation(["gym", "common"]);
  const confirmAction = useConfirmAction();

  // Days state
  const [days, setDays] = useState<DayEntry[]>([]);
  const [collapsedDays, setCollapsedDays] = useState<Set<number>>(new Set());
  const [showExercisePicker, setShowExercisePicker] = useState(false);
  const [showTemplatePicker, setShowTemplatePicker] = useState(false);
  const [activeDayPosition, setActiveDayPosition] = useState<number | null>(null);
  const [swapExercise, setSwapExercise] = useState<{ dayPos: number; exPos: number } | null>(null);

  // Targets state
  const [selectedWeek, setSelectedWeek] = useState(1);
  const [targets, setTargets] = useState<TargetEntry[]>([]);

  // Progression state
  const [showProgressionModal, setShowProgressionModal] = useState(false);
  const [progressionExercise, setProgressionExercise] = useState<{ dayPos: number; exId: string; exName: string } | null>(null);
  const [progressionWeightInc, setProgressionWeightInc] = useState("2.5");
  const [progressionRepsInc, setProgressionRepsInc] = useState("0");

  // Exercise history
  const [historyExerciseId, setHistoryExerciseId] = useState<string | null>(null);
  const {
    data: historyData = [],
    isLoading: historyLoading,
    error: historyError,
  } = useQuery({
    queryKey: ["last-exercise-history", historyExerciseId],
    queryFn: () => getLastExerciseHistory({ exerciseId: historyExerciseId! }),
    enabled: !!historyExerciseId,
  });

  // Shared counter for unique target set IDs
  const setIdCounter = useRef(0);

  // Templates query
  const { data: templates = [] } = useQuery({
    queryKey: ["get-templates"],
    queryFn: getTemplates,
  });

  // Computed values
  const effectiveWeeks = noEndDate ? 1 : (totalWeeks || 1);
  const allExercises = days.flatMap((d) => d.exercises);

  // ==================
  // Build helpers for save
  // ==================

  const buildFlatTargets = useCallback(() => {
    return targets.flatMap((target) =>
      target.sets
        .map((set, setIdx) => ({
          day_position: target.day_position,
          exercise_position: target.exercise_position,
          week_number: target.week_number,
          set_number: setIdx + 1,
          target_weight: set.target_weight ? parseFloat(set.target_weight) : null,
          target_reps: set.target_reps ? parseInt(set.target_reps, 10) : null,
          target_rpe: set.target_rpe || null,
          notes: null,
        }))
        .filter((s) => s.target_weight !== null || s.target_reps !== null),
    );
  }, [targets]);

  const buildDaysForSave = useCallback(() => {
    return days.map((d) => ({
      position: d.position,
      label: d.label || null,
      rest_timer_seconds: d.rest_timer_seconds,
      exercises: d.exercises.map((ex) => ({
        exercise_id: ex.exercise_id,
        position: ex.position,
        superset_id: ex.superset_id,
        rest_timer_seconds: ex.rest_timer_seconds,
      })),
    }));
  }, [days]);

  // ==================
  // Day management
  // ==================

  const toggleDayCollapse = (position: number) => {
    setCollapsedDays((prev) => {
      const next = new Set(prev);
      if (next.has(position)) next.delete(position);
      else next.add(position);
      return next;
    });
  };

  const addDay = () => {
    setDays((prev) => [
      ...prev,
      { position: prev.length, label: "", rest_timer_seconds: null, exercises: [] },
    ]);
  };

  const reorderDays = (reordered: DayEntry[]) => {
    const reindexed = reordered.map((d, i) => ({ ...d, position: i }));
    setDays(reindexed);
    const positionMap = new Map<number, number>();
    reordered.forEach((d, i) => positionMap.set(d.position, i));
    setTargets((prev) =>
      prev.map((t) => ({
        ...t,
        day_position: positionMap.get(t.day_position) ?? t.day_position,
      })),
    );
    setCollapsedDays((prev) => {
      const next = new Set<number>();
      prev.forEach((oldPos) => {
        const newPos = positionMap.get(oldPos);
        if (newPos !== undefined) next.add(newPos);
      });
      return next;
    });
  };

  const removeDay = async (position: number) => {
    const confirmed = await confirmAction({
      title: t("gym:gym.plans.removeDayTitle"),
      message: t("gym:gym.plans.removeDayConfirm"),
    });
    if (!confirmed) return;

    setDays((prev) => {
      const filtered = prev.filter((d) => d.position !== position);
      return filtered.map((d, i) => ({ ...d, position: i }));
    });
    setTargets((prev) => {
      const filtered = prev.filter((t) => t.day_position !== position);
      return filtered.map((t) => ({
        ...t,
        day_position: t.day_position > position ? t.day_position - 1 : t.day_position,
      }));
    });
  };

  const updateDayLabel = (position: number, label: string) => {
    setDays((prev) =>
      prev.map((d) => (d.position === position ? { ...d, label } : d)),
    );
  };

  const updateDayRestTimer = (position: number, val: string) => {
    setDays((prev) =>
      prev.map((d) => {
        if (d.position !== position) return d;
        if (val === "") return { ...d, rest_timer_seconds: null };
        if (/^\d+$/.test(val)) return { ...d, rest_timer_seconds: Number(val) };
        return d;
      }),
    );
  };

  // ==================
  // Exercise management
  // ==================

  const addExerciseToDay = (dayPosition: number, exercise: ExerciseSelection) => {
    setDays((prev) =>
      prev.map((d) => {
        if (d.position !== dayPosition) return d;
        const newExercise: DayExercise = {
          exercise_id: exercise.id,
          name: exercise.name,
          equipment: exercise.equipment,
          muscle_group: exercise.muscle_group || null,
          main_group: exercise.main_group || null,
          position: d.exercises.length,
          superset_id: null,
          rest_timer_seconds: null,
        };
        return { ...d, exercises: [...d.exercises, newExercise] };
      }),
    );

    const weekCount = noEndDate ? 1 : (totalWeeks || 1);
    const dayExCount = days.find((d) => d.position === dayPosition)?.exercises.length ?? 0;
    const newTargets: TargetEntry[] = [];
    for (let week = 1; week <= weekCount; week++) {
      newTargets.push({
        day_position: dayPosition,
        week_number: week,
        exercise_id: exercise.id,
        exercise_name: exercise.name,
        exercise_position: dayExCount,
        sets: [],
      });
    }
    setTargets((prev) => [...prev, ...newTargets]);
  };

  const removeExerciseFromDay = async (dayPosition: number, exercisePosition: number) => {
    const confirmed = await confirmAction({
      title: t("gym:gym.plans.removeExerciseTitle"),
      message: t("gym:gym.plans.removeExerciseConfirm"),
    });
    if (!confirmed) return;

    setDays((prev) =>
      prev.map((d) => {
        if (d.position !== dayPosition) return d;
        const filtered = d.exercises.filter((ex) => ex.position !== exercisePosition);
        return { ...d, exercises: filtered.map((ex, i) => ({ ...ex, position: i })) };
      }),
    );
    setTargets((prev) => {
      const filtered = prev.filter(
        (t) => !(t.day_position === dayPosition && t.exercise_position === exercisePosition),
      );
      return filtered.map((t) => {
        if (t.day_position === dayPosition && t.exercise_position > exercisePosition) {
          return { ...t, exercise_position: t.exercise_position - 1 };
        }
        return t;
      });
    });
  };

  const reorderExercisesInDay = (dayPosition: number, reordered: DayExercise[]) => {
    const reindexed = reordered.map((ex, i) => ({ ...ex, position: i }));
    setDays((prev) =>
      prev.map((d) => (d.position === dayPosition ? { ...d, exercises: reindexed } : d)),
    );
    setTargets((prev) =>
      prev.map((t) => {
        if (t.day_position !== dayPosition) return t;
        const newPos = reindexed.findIndex((ex) => ex.exercise_id === t.exercise_id);
        if (newPos === -1) return t;
        return { ...t, exercise_position: newPos };
      }),
    );
  };

  const handleSwapExercise = (exercise: ExerciseSelection) => {
    if (!swapExercise) return;
    const { dayPos, exPos } = swapExercise;
    const oldExId = days.find((d) => d.position === dayPos)?.exercises.find((ex) => ex.position === exPos)?.exercise_id;
    setDays((prev) =>
      prev.map((d) => {
        if (d.position !== dayPos) return d;
        return {
          ...d,
          exercises: d.exercises.map((ex) => {
            if (ex.position !== exPos) return ex;
            return {
              ...ex,
              exercise_id: exercise.id,
              name: exercise.name,
              equipment: exercise.equipment,
              muscle_group: exercise.muscle_group || null,
              main_group: exercise.main_group || null,
            };
          }),
        };
      }),
    );
    if (oldExId) {
      setTargets((prev) =>
        prev.map((t) => {
          if (t.day_position !== dayPos || t.exercise_id !== oldExId) return t;
          return { ...t, exercise_id: exercise.id, exercise_name: exercise.name };
        }),
      );
    }
    setSwapExercise(null);
    setShowExercisePicker(false);
  };

  const updateExerciseRestTimer = (dayPosition: number, exercisePosition: number, seconds: number | null) => {
    setDays((prev) =>
      prev.map((d) => {
        if (d.position !== dayPosition) return d;
        return {
          ...d,
          exercises: d.exercises.map((ex) =>
            ex.position === exercisePosition ? { ...ex, rest_timer_seconds: seconds } : ex,
          ),
        };
      }),
    );
  };

  const importFromTemplate = async (templateId: string) => {
    if (activeDayPosition === null) return;
    setShowTemplatePicker(false);

    try {
      const fullTemplate = await getFullTemplate(templateId);
      const dayPosition = activeDayPosition;
      const existingCount = days.find((d) => d.position === dayPosition)?.exercises.length ?? 0;

      setDays((prev) =>
        prev.map((d) => {
          if (d.position !== dayPosition) return d;
          if (d.label) return d;
          return { ...d, label: fullTemplate.name };
        }),
      );

      const newExercises: DayExercise[] = fullTemplate.gym_template_exercises.map((ex, idx) => ({
        exercise_id: ex.exercise_id,
        name: ex.gym_exercises?.name ?? "Unknown",
        equipment: ex.gym_exercises?.equipment ?? "",
        muscle_group: ex.gym_exercises?.muscle_group ?? null,
        main_group: ex.gym_exercises?.main_group ?? null,
        position: existingCount + idx,
        superset_id: ex.superset_id || null,
        rest_timer_seconds: (ex as typeof ex & { rest_timer_seconds?: number | null }).rest_timer_seconds ?? null,
      }));

      setDays((prev) =>
        prev.map((d) => {
          if (d.position !== dayPosition) return d;
          return { ...d, exercises: [...d.exercises, ...newExercises] };
        }),
      );

      const weekCount = noEndDate ? 1 : (totalWeeks || 1);
      const newTargets: TargetEntry[] = [];
      for (let week = 1; week <= weekCount; week++) {
        newExercises.forEach((ex) => {
          newTargets.push({
            day_position: dayPosition,
            week_number: week,
            exercise_id: ex.exercise_id,
            exercise_name: ex.name,
            exercise_position: ex.position,
            sets: [],
          });
        });
      }
      setTargets((prev) => [...prev, ...newTargets]);
    } catch {
      Toast.show({ type: "error", text1: t("common:common.error") });
    }
  };

  // ==================
  // Target management
  // ==================

  const getTargetsForDayWeek = (dayPosition: number, weekNumber: number) => {
    return targets.filter(
      (t) => t.day_position === dayPosition && t.week_number === weekNumber,
    );
  };

  const updateTargetSet = (
    dayPosition: number,
    weekNumber: number,
    exerciseId: string,
    setIndex: number,
    field: keyof TargetSet,
    value: string,
  ) => {
    setTargets((prev) =>
      prev.map((t) => {
        if (t.day_position !== dayPosition || t.week_number !== weekNumber || t.exercise_id !== exerciseId) return t;
        const newSets = [...t.sets];
        newSets[setIndex] = { ...newSets[setIndex], [field]: value };
        return { ...t, sets: newSets };
      }),
    );
  };

  const addTargetSet = (dayPosition: number, weekNumber: number, exerciseId: string) => {
    setIdCounter.current += 1;
    const newId = setIdCounter.current;
    setTargets((prev) =>
      prev.map((t) => {
        if (t.day_position !== dayPosition || t.week_number !== weekNumber || t.exercise_id !== exerciseId) return t;
        return { ...t, sets: [...t.sets, { id: newId, target_weight: "", target_reps: "", target_rpe: "" }] };
      }),
    );
  };

  const deleteTargetSet = (dayPosition: number, weekNumber: number, exerciseId: string, setIndex: number) => {
    setTargets((prev) =>
      prev.map((t) => {
        if (t.day_position !== dayPosition || t.week_number !== weekNumber || t.exercise_id !== exerciseId) return t;
        const newSets = t.sets.filter((_, i) => i !== setIndex);
        return { ...t, sets: newSets };
      }),
    );
  };

  const duplicateWeek = (fromWeek: number, toWeek: number) => {
    setTargets((prev) => {
      const sourcesForWeek = prev.filter((t) => t.week_number === fromWeek);
      const withoutTarget = prev.filter((t) => t.week_number !== toWeek);
      const duplicated = sourcesForWeek.map((t) => ({
        ...t,
        week_number: toWeek,
        sets: t.sets.map((s) => {
          setIdCounter.current += 1;
          return { ...s, id: setIdCounter.current };
        }),
      }));
      return [...withoutTarget, ...duplicated];
    });
  };

  const applyProgression = () => {
    if (!progressionExercise) return;
    const { dayPos, exId } = progressionExercise;
    const weightInc = parseFloat(progressionWeightInc) || 0;
    const repsInc = parseInt(progressionRepsInc, 10) || 0;

    if (effectiveWeeks <= 1 || (weightInc === 0 && repsInc === 0)) {
      setShowProgressionModal(false);
      return;
    }

    const week1Targets = targets.find(
      (t) => t.day_position === dayPos && t.exercise_id === exId && t.week_number === 1,
    );

    if (!week1Targets || week1Targets.sets.length === 0) {
      Toast.show({ type: "error", text1: t("gym:gym.plans.setWeek1First") });
      setShowProgressionModal(false);
      return;
    }

    setTargets((prev) => {
      const updated = [...prev];
      for (let week = 2; week <= effectiveWeeks; week++) {
        const idx = updated.findIndex(
          (t) => t.day_position === dayPos && t.exercise_id === exId && t.week_number === week,
        );
        if (idx === -1) continue;

        const progressedSets = week1Targets.sets.map((s) => {
          setIdCounter.current += 1;
          const baseWeight = parseFloat(s.target_weight) || 0;
          const baseReps = parseInt(s.target_reps, 10) || 0;
          const newWeight = baseWeight > 0 ? baseWeight + weightInc * (week - 1) : 0;
          const newReps = baseReps > 0 ? baseReps + repsInc * (week - 1) : 0;
          return {
            id: setIdCounter.current,
            target_weight: newWeight > 0 ? newWeight.toString() : "",
            target_reps: newReps > 0 ? newReps.toString() : "",
            target_rpe: s.target_rpe,
          };
        });

        updated[idx] = { ...updated[idx], sets: progressedSets };
      }
      return updated;
    });

    setShowProgressionModal(false);
    Toast.show({ type: "success", text1: t("gym:gym.plans.progressionApplied") });
  };

  // Handle exercise selection from picker (add or swap)
  const handleExerciseSelect = (exercise: ExerciseSelection) => {
    if (swapExercise) {
      handleSwapExercise(exercise);
    } else if (activeDayPosition !== null) {
      addExerciseToDay(activeDayPosition, exercise);
      setShowExercisePicker(false);
    }
  };

  return {
    // Days state
    days,
    setDays,
    collapsedDays,
    setCollapsedDays,
    showExercisePicker,
    setShowExercisePicker,
    showTemplatePicker,
    setShowTemplatePicker,
    activeDayPosition,
    setActiveDayPosition,
    swapExercise,
    setSwapExercise,

    // Targets state
    selectedWeek,
    setSelectedWeek,
    targets,
    setTargets,

    // Progression state
    showProgressionModal,
    setShowProgressionModal,
    progressionExercise,
    setProgressionExercise,
    progressionWeightInc,
    setProgressionWeightInc,
    progressionRepsInc,
    setProgressionRepsInc,

    // History
    historyExerciseId,
    setHistoryExerciseId,
    historyData,
    historyLoading,
    historyError,

    // Refs
    setIdCounter,

    // Queries
    templates,

    // Computed
    effectiveWeeks,
    allExercises,

    // Build helpers
    buildFlatTargets,
    buildDaysForSave,

    // Day actions
    toggleDayCollapse,
    addDay,
    reorderDays,
    removeDay,
    updateDayLabel,
    updateDayRestTimer,

    // Exercise actions
    addExerciseToDay,
    removeExerciseFromDay,
    reorderExercisesInDay,
    handleSwapExercise,
    updateExerciseRestTimer,
    importFromTemplate,
    handleExerciseSelect,

    // Target actions
    getTargetsForDayWeek,
    updateTargetSet,
    addTargetSet,
    deleteTargetSet,
    duplicateWeek,
    applyProgression,
  };
}
