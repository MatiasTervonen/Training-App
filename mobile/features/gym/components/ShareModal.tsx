import { useMemo } from "react";
import ShareCard from "@/features/gym/components/ShareCard";
import { FullGymSession } from "@/database/gym/get-full-gym-session";
import { ExerciseEntry } from "@/types/session";
import { useTranslation } from "react-i18next";
import ShareModalShell from "@/lib/components/share/ShareModalShell";
import { SessionShareContent } from "@/types/chat";

type ShareModalProps = {
  visible: boolean;
  onClose: () => void;
  gymSession: FullGymSession;
  weightUnit: string;
};

export default function ShareModal({
  visible,
  onClose,
  gymSession,
  weightUnit,
}: ShareModalProps) {
  const { t } = useTranslation("gym");

  const shareExercises = useMemo<ExerciseEntry[]>(() => {
    return (gymSession.gym_session_exercises || []).map((ex) => ({
      exercise_id: ex.gym_exercises?.id ?? "",
      name: ex.gym_exercises?.name ?? "",
      equipment: ex.gym_exercises?.equipment ?? "",
      main_group: ex.gym_exercises?.main_group,
      muscle_group: ex.gym_exercises?.muscle_group,
      superset_id: ex.superset_id,
      notes: ex.notes,
      sets: (ex.gym_sets ?? []).map((s) => ({
        weight: s.weight,
        reps: s.reps,
        rpe: s.rpe,
      })),
    }));
  }, [gymSession.gym_session_exercises]);

  const sessionData = useMemo<SessionShareContent>(() => {
    const totalSets = shareExercises.reduce((sum, ex) => sum + ex.sets.length, 0);
    const totalVolume = shareExercises.reduce(
      (sum, ex) => sum + ex.sets.reduce((s, set) => s + (set.weight ?? 0) * (set.reps ?? 0), 0),
      0,
    );
    return {
      session_type: "gym_sessions",
      source_id: gymSession.id,
      title: gymSession.title,
      stats: {
        duration: gymSession.duration ?? 0,
        exercises_count: shareExercises.length,
        sets_count: totalSets,
        total_volume: totalVolume,
      },
    };
  }, [gymSession, shareExercises]);

  return (
    <ShareModalShell
      visible={visible}
      onClose={onClose}
      prefix="gym-"
      labels={{
        save: t("gym.share.save"),
        saving: t("gym.share.saving"),
        share: t("gym.share.share"),
        sharing: t("gym.share.sharing"),
        close: t("gym.share.close"),
        saveSuccess: t("gym.share.saveSuccess"),
        saveError: t("gym.share.saveError"),
        shareError: t("gym.share.shareError"),
        error: t("common:common.error"),
      }}
      sessionData={sessionData}
      renderCard={({ cardRef, theme, size }) => (
        <ShareCard
          ref={cardRef}
          title={gymSession.title}
          date={gymSession.created_at}
          duration={gymSession.duration}
          exercises={shareExercises}
          weightUnit={weightUnit}
          theme={theme}
          size={size}
        />
      )}
    />
  );
}
